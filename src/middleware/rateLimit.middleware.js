import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter: Applies to all requests
 */
export const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 3000, // Increase limit in development
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        success: false,
        message: 'Too many requests, please try again in a minute',
    },
});

/**
 * Auth rate limiter: Stricter limits for login and registration
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 10 : 1000, // Increase limit in development
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again after 15 minutes',
    },
});

/**
 * Submission rate limiter: For public submissions or reporting
 */
export const submissionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env.NODE_ENV === 'production' ? 20 : 1000, // Increase limit in development
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Submission limit reached, please try again after an hour',
    },
});
