const mongoose = require('mongoose');

const matchScoreSchema = new mongoose.Schema(
  {
    // Always store user IDs in sorted order so (A,B) === (B,A) for cache lookup
    user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    matchPercentage: { type: Number, required: true, min: 0, max: 100 },
    summary: { type: String, required: true },
    highlights: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// TTL index: MongoDB automatically deletes documents 24 hours after createdAt
matchScoreSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

// Compound index for fast cache lookups by user pair
matchScoreSchema.index({ user1: 1, user2: 1 }, { unique: true });

module.exports = mongoose.model('MatchScore', matchScoreSchema);
