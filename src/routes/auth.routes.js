import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();



// Validation rules
const registerValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters'),
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('role').optional().isIn(['REPORTER', 'OWNER']),
];

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

// Routes
router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/login', authLimiter, loginValidation, authController.login);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/verify-email', authController.verifyEmail);

export default router;
