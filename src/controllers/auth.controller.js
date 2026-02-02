import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import { generateToken } from '../utils/jwt.util.js';
import { sendVerificationEmail } from '../utils/mail.util.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password, fullName, role, phoneNumber } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            if (existingUser.emailVerified) {
                return res.status(409).json({
                    success: false,
                    message: 'User with this email already exists.'
                });
            }
            // If not verified, we can allow updating the user details and sending a new code
            console.log(`♻️  [RE-REGISTER] Updating unverified user: ${email}`);
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Set expiry to 15 minutes from now
        const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

        // Create or Update user (Upsert)
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                fullName,
                role: role || 'REPORTER',
                phoneNumber,
                verificationCode,
                verificationCodeExpiry,
            },
            create: {
                email,
                password: hashedPassword,
                fullName,
                role: role || 'REPORTER',
                phoneNumber,
                verificationCode,
                verificationCodeExpiry,
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                emailVerified: true,
                createdAt: true,
            },
        });

        // Send verification email
        await sendVerificationEmail(email, fullName, verificationCode);

        // Generate token
        const token = generateToken({ userId: user.id, role: user.role });

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please check your email for the verification code.',
            data: { user, token },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Compare passwords
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Check verification status
        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Email not verified. Please check your email for the verification code.',
                needsVerification: true,
                userId: user.id,
                email: user.email
            });
        }

        // Generate token
        const token = generateToken({ userId: user.id, role: user.role });

        res.json({
            success: true,
            message: 'Login successful.',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    emailVerified: user.emailVerified,
                },
                token,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                phoneNumber: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.json({
            success: true,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Verify email with code
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (req, res, next) => {
    try {
        const { userId, code } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        if (user.verificationCode !== code) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code.',
            });
        }

        // Check if code has expired
        if (user.verificationCodeExpiry && new Date() > user.verificationCodeExpiry) {
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired. Please request a new one.',
                expired: true
            });
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                emailVerified: true,
                verificationCode: null,
                verificationCodeExpiry: null, // Clear expiry too
            },
        });

        res.json({
            success: true,
            message: 'Email verified successfully.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Resend verification code
 * POST /api/auth/resend-verification
 */
export const resendVerificationCode = async (req, res, next) => {
    try {
        const { userId } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified.',
            });
        }

        // Rate limiting: Check if last code was sent less than 60 seconds ago
        if (user.verificationCodeExpiry) {
            const timeSinceLastCode = Date.now() - (user.verificationCodeExpiry.getTime() - 15 * 60 * 1000);
            if (timeSinceLastCode < 60000) { // 60 seconds
                const waitTime = Math.ceil((60000 - timeSinceLastCode) / 1000);
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${waitTime} seconds before requesting a new code.`,
                    waitTime
                });
            }
        }

        // Generate new code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

        await prisma.user.update({
            where: { id: userId },
            data: {
                verificationCode,
                verificationCodeExpiry,
            },
        });

        // Send email
        await sendVerificationEmail(user.email, user.fullName, verificationCode);

        res.json({
            success: true,
            message: 'Verification code resent successfully.',
            expiresIn: 900 // 15 minutes in seconds
        });
    } catch (error) {
        next(error);
    }
};
