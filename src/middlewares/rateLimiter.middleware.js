const rateLimit = require('express-rate-limit');

// Always use in-memory rate limiter (safe default)
// Redis-backed rate limiting can be enabled when Redis is available
const rateLimiterMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.',
  },
});

module.exports = rateLimiterMiddleware;
