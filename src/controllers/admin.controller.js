import prisma from '../config/database.js';

/**
 * Get all users (Admin only)
 * GET /api/admin/users
 */
export const getAllUsers = async (req, res, next) => {
    try {
        const { role } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const where = {};
        if (role) {
            where.role = role;
        } else {
            where.role = { not: 'ADMIN' };
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
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
                    _count: {
                        select: { reports: true, ownedFields: true, payouts: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                users,
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
 * Get all payouts (Admin only)
 * GET /api/admin/payouts
 */
export const getAllPayouts = async (req, res, next) => {
    try {
        const { status, userId } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const where = {};
        if (status) where.status = status;
        if (userId) where.userId = userId;

        const [payouts, total] = await Promise.all([
            prisma.payout.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: {
                        select: { id: true, fullName: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.payout.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                payouts,
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
 * Create a payout (Admin only)
 * POST /api/admin/payouts
 */
export const createPayout = async (req, res, next) => {
    try {
        const { userId, amount, status, receiptUrl } = req.body;

        // Verify user exists
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        const payout = await prisma.payout.create({
            data: {
                userId,
                amount: parseFloat(amount),
                status: status || 'PENDING',
                receiptUrl,
                processedAt: status === 'COMPLETED' ? new Date() : undefined,
            },
            include: {
                user: {
                    select: { id: true, fullName: true, email: true },
                },
            },
        });

        // Create notification if payout is created as completed
        if (status === 'COMPLETED') {
            await prisma.notification.create({
                data: {
                    userId,
                    title: 'Payout Sent',
                    message: `You have received a payout of ₦${payout.amount.toLocaleString()}.`,
                    type: 'SUCCESS'
                }
            });
        }

        res.status(201).json({
            success: true,
            message: 'Payout created successfully.',
            data: { payout },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update payout (Admin only)
 * PUT /api/admin/payouts/:id
 */
export const updatePayout = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, receiptUrl } = req.body;

        const payout = await prisma.payout.update({
            where: { id },
            data: {
                status,
                receiptUrl,
                processedAt: status === 'COMPLETED' ? new Date() : undefined,
            },
            include: {
                user: {
                    select: { id: true, fullName: true, email: true },
                },
            },
        });

        // Create notification for payout update
        await prisma.notification.create({
            data: {
                userId: payout.userId,
                title: `Payout ${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}`,
                message: `Your payout request of ₦${payout.amount.toLocaleString()} has been ${status.toLowerCase()}.`,
                type: status === 'COMPLETED' ? 'SUCCESS' : status === 'FAILED' ? 'ERROR' : 'INFO'
            }
        });

        res.json({
            success: true,
            message: 'Payout updated successfully.',
            data: { payout },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get dashboard stats (Admin only)
 * GET /api/admin/stats
 */
export const getDashboardStats = async (req, res, next) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [
            totalUsers,
            totalReporters,
            totalOwners,
            totalFields,
            pendingFields,
            approvedFields,
            totalReports,
            pendingReports,
            totalPayouts,
            pendingPayouts,
            pendingPayoutsSum,
            last7DaysUsers,
            last7DaysFields,
            last7DaysReports
        ] = await Promise.all([
            prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
            prisma.user.count({ where: { role: 'REPORTER' } }),
            prisma.user.count({ where: { role: 'OWNER' } }),
            prisma.field.count(),
            prisma.field.count({ where: { status: 'PENDING' } }),
            prisma.field.count({ where: { status: 'APPROVED' } }),
            prisma.report.count(),
            prisma.report.count({ where: { status: 'PENDING' } }),
            prisma.payout.count(),
            prisma.payout.count({ where: { status: 'PENDING' } }),
            prisma.payout.aggregate({
                _sum: { amount: true },
                where: { status: 'PENDING' }
            }),
            prisma.user.findMany({
                where: {
                    createdAt: { gte: sevenDaysAgo },
                    role: { not: 'ADMIN' }
                },
                select: { createdAt: true }
            }),
            prisma.field.findMany({
                where: { createdAt: { gte: sevenDaysAgo } },
                select: { createdAt: true, ownerId: true }
            }),
            prisma.report.findMany({
                where: { createdAt: { gte: sevenDaysAgo } },
                select: { createdAt: true, userId: true }
            }),
        ]);

        // Process Chart Data (Last 7 Days)
        const charts = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0]; // UTC Date YYYY-MM-DD

            const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });

            const submissions = last7DaysFields.filter(f => f.createdAt.toISOString().startsWith(dateStr)).length;
            const newUsers = last7DaysUsers.filter(u => u.createdAt.toISOString().startsWith(dateStr)).length;

            // Calculate Unique Active Users (Uniques who submitted a field or report)
            const activeOnDay = new Set();
            last7DaysFields
                .filter(f => f.createdAt.toISOString().startsWith(dateStr))
                .forEach(f => activeOnDay.add(f.ownerId));
            last7DaysReports
                .filter(r => r.createdAt.toISOString().startsWith(dateStr))
                .forEach(r => activeOnDay.add(r.userId));

            charts.push({
                date: dayName,
                submissions,
                newUsers,
                activeUsers: activeOnDay.size
            });
        }

        // Recent Activity: Fetch last 5 fields
        const recentFields = await prisma.field.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                location: true,
                status: true,
                createdAt: true,
                owner: {
                    select: {
                        fullName: true,
                        email: true
                    }
                }
            }
        });

        // Top Reporters: Users with most approved fields
        // 1. Group by ownerId for approved fields to get the counts
        const approvedCounts = await prisma.field.groupBy({
            by: ['ownerId'],
            where: { status: 'APPROVED' },
            _count: { id: true },
            orderBy: {
                _count: { id: 'desc' }
            },
            take: 5
        });

        // 2. Fetch user details and total field counts for these users
        const topReporters = await Promise.all(
            approvedCounts.map(async (item) => {
                const user = await prisma.user.findUnique({
                    where: { id: item.ownerId },
                    select: {
                        id: true,
                        fullName: true,
                        _count: {
                            select: { ownedFields: true }
                        }
                    }
                });

                return {
                    name: user?.fullName || 'Unknown',
                    fields: user?._count.ownedFields || 0,
                    approved: item._count.id
                };
            })
        );

        res.json({
            success: true,
            data: {
                stats: {
                    users: { total: totalUsers, reporters: totalReporters, owners: totalOwners },
                    fields: { total: totalFields, pending: pendingFields, approved: approvedFields },
                    reports: { total: totalReports, pending: pendingReports },
                    payouts: {
                        total: totalPayouts,
                        pending: pendingPayouts,
                        pendingAmount: pendingPayoutsSum._sum.amount || 0
                    },
                },
                charts,
                recentActivity: recentFields,
                topReporters
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Verify a field (Admin only)
 * PUT /api/admin/fields/:id/verify
 */
export const verifyField = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be APPROVED or REJECTED.'
            });
        }

        const field = await prisma.field.update({
            where: { id },
            data: { status },
            include: {
                owner: {
                    select: { id: true, fullName: true, email: true }
                }
            }
        });

        // Create notification for the scout
        await prisma.notification.create({
            data: {
                userId: field.ownerId,
                title: `Protocol Update: Field ${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}`,
                message: `Intelligence submission "${field.name}" has been ${status.toLowerCase()} by administration.`,
                type: status === 'APPROVED' ? 'SUCCESS' : 'ERROR'
            }
        });

        res.json({
            success: true,
            message: `Field ${status.toLowerCase()} successfully.`,
            data: { field }
        });
    } catch (error) {
        next(error);
    }
};
