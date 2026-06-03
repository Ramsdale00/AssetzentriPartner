// Lightweight in-memory fixed-window rate limiter — zero dependencies.
//
// Cloudflare provides DDoS / rate protection at the edge; this is app-level
// defense-in-depth to blunt brute-force logins and sign-up/login spam even if
// a request slips past the edge (or in environments without Cloudflare).
//
// Note: state is per-process and in-memory. For a single backend instance this
// is fine. If you scale to multiple instances, rely on Cloudflare's rate-limit
// rules (or a shared store) for cross-instance limits.

function createRateLimiter({ windowMs, max, message }) {
  const hits = new Map(); // key -> { count, resetAt }

  // Periodically purge expired entries so the map can't grow unbounded.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  if (sweep.unref) sweep.unref(); // don't keep the process alive for this

  return function rateLimiter(req, res, next) {
    const now = Date.now();
    const key = req.ip || req.socket?.remoteAddress || 'unknown';

    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: message || 'Too many requests. Please try again in a little while.',
      });
    }

    next();
  };
}

module.exports = { createRateLimiter };
