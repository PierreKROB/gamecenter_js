import rateLimit from 'express-rate-limit';
import status from 'http-status';
import APIError from '~/utils/apiError';

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  handler: (req, res, next) => {
    next(new APIError('Too many requests, please try again later.', status.TOO_MANY_REQUESTS));
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Seulement 10 tentatives en 15 minutes
  handler: (req, res, next) => {
    next(new APIError('Too many login attempts, please try again later.', status.TOO_MANY_REQUESTS));
  }
});

export { globalRateLimiter, loginLimiter };
