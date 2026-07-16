const https = require('https');

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Strip sensitive fields and return only what Gemini needs.
 */
const sanitize = (user) => ({
  name: user.name,
  age: user.age,
  aboutMe: user.aboutMe,
  preferences: user.preferences || {},
});

/**
 * Build the Gemini prompt for a match score.
 */
const buildPrompt = (p1, p2) => `You are a flatmate compatibility expert. Compare these two user profiles and determine how compatible they are as flatmates.

Profile A (the person looking for a flat):
${JSON.stringify(p1, null, 2)}

Profile B (the flat owner/lister):
${JSON.stringify(p2, null, 2)}

Analyse their lifestyle preferences including food habits, smoking, alcohol, cleanliness, sleep schedule, work routine, guest frequency, noise tolerance, expense sharing, and personality type.

Respond ONLY with valid JSON — no markdown, no code fences, no preamble, no trailing text. The JSON must have exactly these three keys:
- "matchPercentage": an integer from 0 to 100
- "summary": a string of no more than 20 words explaining the top compatibility reason
- "highlights": an array of 2 to 4 short strings, each at most 4 words, naming specific shared traits

Example:
{"matchPercentage": 74, "summary": "Both prefer quiet environments and share similar sleep schedules.", "highlights": ["Quiet lifestyle", "Early risers", "No smoking"]}`;

/**
 * Returns true when a user profile has fewer than 3 preference fields filled.
 */
const isProfileSparse = (user) => {
  const prefs = user.preferences || {};
  const filled = Object.values(prefs).filter((v) => v && v !== '').length;
  return filled < 3;
};

// ─────────────────────────────────────────────
// Non-streaming (cache-hit path)
// ─────────────────────────────────────────────

/**
 * Calls Gemini and returns { matchPercentage, summary, highlights }.
 * Used when there is a cache miss and we need a full result before storing.
 */
const getMatchScore = async (profile1, profile2) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_KEY_HERE') {
    throw new Error('GEMINI_API_KEY is not configured in server/.env');
  }

  const p1 = sanitize(profile1);
  const p2 = sanitize(profile2);

  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: buildPrompt(p1, p2) }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
  });

  const result = await callGeminiAPI(apiKey, requestBody);
  return parseGeminiResponse(result, profile1, profile2);
};

// ─────────────────────────────────────────────
// Streaming path (SSE)
// ─────────────────────────────────────────────

/**
 * Streams the Gemini response directly to `res` as Server-Sent Events.
 * Emits:
 *   data: {"type":"chunk","text":"..."}\n\n   — while streaming
 *   data: {"type":"result", ...finalPayload}\n\n  — when done
 *   data: [DONE]\n\n                               — signals end-of-stream
 *
 * @param {Object} profile1
 * @param {Object} profile2
 * @param {import('express').Response} res  — must have SSE headers already set
 * @param {AbortSignal} [signal]
 * @returns {Promise<{matchPercentage, summary, highlights}>}  — resolved value for caching
 */
const streamMatchScore = (profile1, profile2, res, signal) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_KEY_HERE') {
      return reject(new Error('GEMINI_API_KEY is not configured in server/.env'));
    }

    const p1 = sanitize(profile1);
    const p2 = sanitize(profile2);

    const body = JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(p1, p2) }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    let rawText = '';
    let aborted = false;

    const req = https.request(options, (geminiRes) => {
      geminiRes.on('data', (chunk) => {
        if (aborted) return;
        // Each chunk may contain multiple SSE lines from Gemini
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (raw === '[DONE]') continue;
          try {
            const parsed = JSON.parse(raw);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              rawText += text;
              // Forward chunk to client
              res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`);
            }
          } catch {
            // Ignore non-JSON lines
          }
        }
      });

      geminiRes.on('end', () => {
        if (aborted) return;
        // Parse the assembled text into our result shape
        const result = parseRawText(rawText, profile1, profile2);
        res.write(`data: ${JSON.stringify({ type: 'result', ...result })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        resolve(result);
      });

      geminiRes.on('error', (err) => {
        if (!aborted) reject(err);
      });
    });

    req.on('error', (err) => {
      if (!aborted) reject(err);
    });

    // AbortController support: if the client disconnects, cancel the Gemini request
    if (signal) {
      signal.addEventListener('abort', () => {
        aborted = true;
        req.destroy();
      });
    }

    req.write(body);
    req.end();
  });
};

// ─────────────────────────────────────────────
// Raw HTTPS call (non-streaming, for cache-hit path)
// ─────────────────────────────────────────────

const callGeminiAPI = (apiKey, body) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) {
            reject(new Error(`Gemini API error ${res.statusCode}: ${JSON.stringify(parsed)}`));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error('Failed to parse Gemini API response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

// ─────────────────────────────────────────────
// Response parsing
// ─────────────────────────────────────────────

/**
 * Parses the assembled raw text from the streaming path.
 */
const parseRawText = (rawText, profile1, profile2) => {
  const sparse = isProfileSparse(profile1) || isProfileSparse(profile2);
  try {
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return buildResult(parsed, sparse);
  } catch {
    return fallback(sparse);
  }
};

/**
 * Parses the full Gemini REST API response object (non-streaming path).
 */
const parseGeminiResponse = (apiResponse, profile1, profile2) => {
  const sparse = isProfileSparse(profile1) || isProfileSparse(profile2);
  try {
    const text = apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return buildResult(parsed, sparse);
  } catch {
    return fallback(sparse);
  }
};

/**
 * Validate and normalise the parsed JSON into our result shape.
 */
const buildResult = (parsed, sparse) => {
  const matchPercentage =
    typeof parsed.matchPercentage === 'number'
      ? Math.max(0, Math.min(100, Math.round(parsed.matchPercentage)))
      : null;

  let summary =
    typeof parsed.summary === 'string' && parsed.summary.length > 0
      ? parsed.summary.slice(0, 150)
      : 'Compatibility analysis unavailable.';

  if (sparse) {
    summary = 'Add more preferences to your profile for a better score.';
  }

  const highlights = Array.isArray(parsed.highlights)
    ? parsed.highlights
        .filter((h) => typeof h === 'string' && h.length > 0)
        .slice(0, 4)
        .map((h) => h.slice(0, 30))
    : [];

  return { matchPercentage, summary, highlights };
};

const fallback = (sparse) => ({
  matchPercentage: null,
  summary: sparse
    ? 'Add more preferences to your profile for a better score.'
    : 'Could not calculate score.',
  highlights: [],
});

module.exports = { getMatchScore, streamMatchScore };
