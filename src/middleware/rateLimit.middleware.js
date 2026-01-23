import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter: Applies to all requests
 */
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes',
    },
});

/**
 * Auth rate limiter: Stricter limits for login and registration
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login/register attempts per 15 minutes
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
    max: 20, // Limit each IP to 20 submissions per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Submission limit reached, please try again after an hour',
    },
});
