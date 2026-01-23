import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';

/**
 * Get user profile
 * GET /api/users/profile
 */
export const getProfile = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                phoneNumber: true,
                bankName: true,
                accountNumber: true,
                accountName: true,
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
 * Update user profile
 * PUT /api/users/profile
 */
export const updateProfile = async (req, res, next) => {
    try {
        const { fullName, phoneNumber, bankName, accountNumber, accountName, currentPassword, newPassword } = req.body;

        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (bankName) updateData.bankName = bankName;
        if (accountNumber) updateData.accountNumber = accountNumber;
        if (accountName) updateData.accountName = accountName;

        // If updating password
        if (currentPassword && newPassword) {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
            });

            const isPasswordValid = await comparePassword(currentPassword, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect.',
                });
            }

            updateData.password = await hashPassword(newPassword);
        }

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                phoneNumber: true,
                bankName: true,
                accountNumber: true,
                accountName: true,
                emailVerified: true,
                updatedAt: true,
            },
        });

        res.json({
            success: true,
            message: 'Profile updated successfully.',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's own reports
 * GET /api/users/reports
 */
export const getUserReports = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [reports, total] = await Promise.all([
            prisma.report.findMany({
                where: { userId: req.user.id },
                skip,
                take: limit,
                include: {
                    field: {
                        select: { id: true, name: true, location: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.report.count({ where: { userId: req.user.id } }),
        ]);

        res.json({
            success: true,
            data: {
                reports,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's payouts
 * GET /api/users/payouts
 */
export const getUserPayouts = async (req, res, next) => {
    try {
        const payouts = await prisma.payout.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            data: { payouts },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's notifications
 * GET /api/users/notifications
 */
export const getNotifications = async (req, res, next) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        res.json({
            success: true,
            data: { notifications },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark a notification as read
 * PUT /api/users/notifications/:id/read
 */
export const markNotificationAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.notification.update({
            where: {
                id,
                userId: req.user.id // Ensure user owns the notification
            },
            data: { read: true },
        });

        res.json({
            success: true,
            message: 'Notification marked as read.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark all notifications as read
 * PUT /api/users/notifications/read-all
 */
export const markAllNotificationsAsRead = async (req, res, next) => {
    try {
        await prisma.notification.updateMany({
            where: {
                userId: req.user.id,
                read: false
            },
            data: { read: true },
        });

        res.json({
            success: true,
            message: 'All notifications marked as read.',
        });
    } catch (error) {
        next(error);
    }
};
