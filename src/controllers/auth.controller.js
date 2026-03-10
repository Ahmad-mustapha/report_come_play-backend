import { validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import { generateToken } from '../utils/jwt.util.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/mail.util.js';

/**
 * Register a new user
 * POST /api/v1/auth/register
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

        const { email, password, fullName, phoneNumber } = req.body;
        // Role should NOT be taken from body in production to prevent privilege escalation
        // Default to REPORTER for all new signups
        const role = 'REPORTER'; 

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
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

        // Create or Update user
        let user;
        if (existingUser) {
            user = await prisma.user.update({
                where: { email },
                data: {
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
        } else {
            user = await prisma.user.create({
                data: {
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
        }

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
 * POST /api/v1/auth/login
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
        const normalizedEmail = email.toLowerCase().trim();
        console.log(`🔑 [LOGIN] Attempt for: ${normalizedEmail}`);

        // Find user
        const user = await prisma.user.findFirst({
            where: { email: normalizedEmail },
        });

        if (!user) {
            console.log(`⚠️  [LOGIN] User not found: ${normalizedEmail}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Compare passwords
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            console.log(`❌ [LOGIN] Pathword mismatch for: ${normalizedEmail}`);
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
 * GET /api/v1/auth/me
 */
export const getCurrentUser = async (req, res, next) => {
    try {
        const user = await prisma.user.findFirst({
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
 * POST /api/v1/auth/verify-email
 */
export const verifyEmail = async (req, res, next) => {
    try {
        const { userId, email, code } = req.body;
        console.log(`🔍 [VERIFY-EMAIL] Attempting verification for: ${userId || email}`);

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: userId || '' },
                    { email: email || '' }
                ]
            },
        });

        if (!user) {
            console.error(`❌ [VERIFY-EMAIL] User not found for: ${userId || email}`);
            return res.status(404).json({
                success: false,
                message: 'User account not found. Please register again.',
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
            where: { id: user.id },
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
 * POST /api/v1/auth/resend-verification
 */
export const resendVerificationCode = async (req, res, next) => {
    try {
        const { userId, email } = req.body;
        console.log(`🔄 [RESEND-CODE] Request for: ${userId || email}`);

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: userId || '' },
                    { email: email || '' }
                ]
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User account not found.',
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
            where: { id: user.id },
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

/**
 * Forgot password - send reset code
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email } = req.body;
        console.log(`🔑 [FORGOT-PASSWORD] Request for: ${email}`);

        const user = await prisma.user.findFirst({
            where: { email },
        });

        if (!user) {
            console.log(`⚠️  [FORGOT-PASSWORD] User not found for email: ${email}`);
            // Always return success to prevent email enumeration
            return res.json({
                success: true,
                message: 'If an account with that email exists, a password reset code has been sent.',
            });
        }

        console.log(`👤 [FORGOT-PASSWORD] User found: ${user.fullName} (${user.id})`);

        // Rate limiting: Check if last code was sent less than 60 seconds ago
        if (user.passwordResetCodeExpiry) {
            const timeSinceLastCode = Date.now() - (user.passwordResetCodeExpiry.getTime() - 15 * 60 * 1000);
            if (timeSinceLastCode < 60000) {
                const waitTime = Math.ceil((60000 - timeSinceLastCode) / 1000);
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${waitTime} seconds before requesting a new code.`,
                    waitTime
                });
            }
        }

        // Generate 6-digit reset code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

        await prisma.user.update({
            where: { email },
            data: {
                passwordResetCode: resetCode,
                passwordResetCodeExpiry: resetCodeExpiry,
            },
        });

        // Send reset email
        const emailResult = await sendPasswordResetEmail(email, user.fullName, resetCode);

        if (!emailResult.success) {
            console.error('❌ [FORGOT-PASSWORD] Failed to send reset email to:', email, emailResult.error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send reset email. Please try again later.',
            });
        }

        console.log('✅ [FORGOT-PASSWORD] Reset code sent to:', email);

        res.json({
            success: true,
            message: 'If an account with that email exists, a password reset code has been sent.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reset password with code
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, code, newPassword } = req.body;
        console.log(`🔌 [RESET-PASSWORD] Attempt for: ${email}`);

        const user = await prisma.user.findFirst({
            where: { email },
        });

        if (!user) {
            console.error(`❌ [RESET-PASSWORD] User not found: ${email}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid reset code.',
            });
        }

        // Check if code matches
        if (!user.passwordResetCode || user.passwordResetCode !== code) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset code.',
            });
        }

        // Check if code has expired
        if (user.passwordResetCodeExpiry && new Date() > user.passwordResetCodeExpiry) {
            return res.status(400).json({
                success: false,
                message: 'Reset code has expired. Please request a new one.',
                expired: true
            });
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password and clear reset fields
        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                passwordResetCode: null,
                passwordResetCodeExpiry: null,
            },
        });

        res.json({
            success: true,
            message: 'Password reset successfully. You can now log in with your new password.',
        });
    } catch (error) {
        next(error);
    }
};
