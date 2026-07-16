const Listing = require('../models/Listing');
const User = require('../models/User');
const MatchScore = require('../models/MatchScore');
const jwt = require('jsonwebtoken');
const { getMatchScore, streamMatchScore } = require('../services/geminiService');

/**
 * GET /api/match/score/:listingId
 *
 * Streams a Gemini match score back to the client via Server-Sent Events (SSE).
 * Auth: JWT is passed as ?token= query param (EventSource cannot set headers).
 *
 * Flow:
 *  1. Validate token from query param
 *  2. Guard: viewer === owner → emit null result and close
 *  3. Check MongoDB 24h cache → if hit, emit cached result and close
 *  4. Cache miss → stream Gemini via SSE → on finish, upsert to MongoDB cache
 */
const streamMatchScoreSSE = async (req, res) => {
  // ── 1. Auth via query param token ─────────────────────────────────────────
  const token = req.query.token;
  if (!token) {
    // Return SSE-compatible error so the client can handle it uniformly
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Not authorized, no token' })}\n\n`);
    return res.end();
  }

  let viewerId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    viewerId = decoded.id;
  } catch {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Not authorized, token invalid' })}\n\n`);
    return res.end();
  }

  // ── Set SSE headers ────────────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering if present
  res.flushHeaders?.(); // Flush headers immediately for streaming

  const { listingId } = req.params;

  try {
    // ── 2. Fetch listing ───────────────────────────────────────────────────
    const listing = await Listing.findById(listingId).select('owner');
    if (!listing) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Listing not found' })}\n\n`);
      return res.end();
    }

    const ownerId = listing.owner.toString();

    // Guard: viewer is the owner
    if (ownerId === viewerId.toString()) {
      res.write(`data: ${JSON.stringify({ type: 'result', matchPercentage: null, summary: null, highlights: [] })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // ── 3. MongoDB 24h cache check ─────────────────────────────────────────
    const [uid1, uid2] = [viewerId.toString(), ownerId].sort();
    const cached = await MatchScore.findOne({ user1: uid1, user2: uid2 });

    if (cached) {
      res.write(`data: ${JSON.stringify({
        type: 'result',
        matchPercentage: cached.matchPercentage,
        summary: cached.summary,
        highlights: cached.highlights || [],
        fromCache: true,
      })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // ── 4. Cache miss — fetch both profiles ────────────────────────────────
    const [viewerProfile, ownerProfile] = await Promise.all([
      User.findById(viewerId).select('-password -savedListings'),
      User.findById(ownerId).select('-password -savedListings'),
    ]);

    if (!viewerProfile || !ownerProfile) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'One or both user profiles not found' })}\n\n`);
      return res.end();
    }

    // ── 5. AbortController: cancel Gemini if client disconnects ───────────
    const abortController = new AbortController();
    req.on('close', () => abortController.abort());

    // ── 6. Stream Gemini → SSE → resolve full result ──────────────────────
    const result = await streamMatchScore(viewerProfile, ownerProfile, res, abortController.signal);

    // ── 7. Persist to MongoDB cache (only if we got a valid score) ─────────
    if (result.matchPercentage !== null) {
      await MatchScore.findOneAndUpdate(
        { user1: uid1, user2: uid2 },
        {
          user1: uid1,
          user2: uid2,
          matchPercentage: result.matchPercentage,
          summary: result.summary,
          highlights: result.highlights || [],
          createdAt: new Date(),
        },
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    if (error.name === 'AbortError' || error.code === 'ECONNRESET') {
      // Client disconnected — no need to write anything
      return;
    }
    console.error('Match Score SSE Error:', error.message);
    // Try to send an error event if connection is still open
    try {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to compute match score' })}\n\n`);
      res.end();
    } catch { /* ignore */ }
  }
};

module.exports = { streamMatchScoreSSE };
