const express = require('express');
const router = express.Router();
const { streamMatchScoreSSE } = require('../controllers/matchController');

// GET /api/match/score/:listingId
// Auth via ?token= query param (EventSource cannot send custom headers).
// Streams the Gemini match score back as Server-Sent Events.
router.get('/score/:listingId', streamMatchScoreSSE);

module.exports = router;
