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

        // Create or Update user (Upsert)
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                fullName,
                role: role || 'REPORTER',
                phoneNumber,
                verificationCode,
            },
            create: {
                email,
                password: hashedPassword,
                fullName,
                role: role || 'REPORTER',
                phoneNumber,
                verificationCode,
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
        // Note: In development with Resend, you can only send to your own email unless you verify a domain.
        console.log(`📧 [DEBUG] Verification code for ${email}: ${verificationCode}`);
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

        await prisma.user.update({
            where: { id: userId },
            data: {
                emailVerified: true,
                verificationCode: null, // Clear code after verification
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
