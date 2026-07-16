/**
 * matchScoreCache.js
 *
 * Session-level in-memory cache for Gemini match scores.
 * Lives as a module singleton — shared across all MatchScoreBadge instances.
 * Never written to localStorage or any persistent storage.
 *
 * Key format: `${viewerUserId}_${ownerUserId}`
 */

const cache = new Map();

export const matchScoreCache = {
  /** @param {string} key */
  has: (key) => cache.has(key),

  /** @param {string} key @returns {{ matchPercentage: number|null, summary: string, highlights: string[] } | undefined} */
  get: (key) => cache.get(key),

  /** @param {string} key @param {{ matchPercentage: number|null, summary: string, highlights: string[] }} value */
  set: (key, value) => cache.set(key, value),

  /** @param {string} key */
  delete: (key) => cache.delete(key),

  /** Clears all entries — call on user sign-out */
  clear: () => cache.clear(),

  /** Build the canonical key for a viewer/owner pair */
  key: (viewerId, ownerId) => `${viewerId}_${ownerId}`,
};
