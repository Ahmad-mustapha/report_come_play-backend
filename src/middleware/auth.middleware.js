import { verifyToken } from '../utils/jwt.util.js';
import prisma from '../config/database.js';

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticateToken = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Extract "Bearer TOKEN"

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = verifyToken(token);

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                emailVerified: true,
            },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('❌ Token Verification Error:', error.message);
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = verifyToken(token);
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    emailVerified: true,
                },
            });

            if (user) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};
