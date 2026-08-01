const rateLimit = require('express-rate-limit');

// General limiter for the rest of the API
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down', code: 'ERR_RATE_LIMITED' },
});

// Tighter limiter for auth (login/register/change password)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later', code: 'ERR_RATE_LIMITED' },
});

// Strict limiter for sending anonymous messages — this is the main abuse
// vector on a product like this (spam or harassment floods), so it's kept
// tighter than everything else and applies per IP regardless of login state,
// since senders are anonymous by design.
const sendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'ops wag spam, wag kang mag beg na pansinin nya. know your worth', code: 'ERR_RATE_LIMITED' },
});

module.exports = { apiLimiter, authLimiter, sendLimiter };
