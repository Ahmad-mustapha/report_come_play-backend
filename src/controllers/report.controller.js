import prisma from '../config/database.js';
import { validationResult } from 'express-validator';

/**
 * Get all reports (with filters)
 * GET /api/reports
 */
export const getAllReports = async (req, res, next) => {
    try {
        const { status, fieldId, userId } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const where = {};

        // If not admin, restrict to own reports
        if (req.user.role !== 'ADMIN') {
            where.userId = req.user.id;
        } else if (userId) {
            // Admins can filter by specific userId if provided
            where.userId = userId;
        }

        if (status) where.status = status;
        if (fieldId) where.fieldId = fieldId;

        const [reports, total] = await Promise.all([
            prisma.report.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: {
                        select: { id: true, fullName: true, email: true, role: true },
                    },
                    field: {
                        select: { id: true, name: true, location: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.report.count({ where }),
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
 * Get single report by ID
 * GET /api/reports/:id
 */
export const getReportById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const report = await prisma.report.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, fullName: true, email: true, role: true },
                },
                field: {
                    select: { id: true, name: true, location: true, description: true },
                },
            },
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found.',
            });
        }

        res.json({
            success: true,
            data: { report },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new report
 * POST /api/reports
 */
export const createReport = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { content, fieldId } = req.body;

        // Verify field exists
        const field = await prisma.field.findUnique({ where: { id: fieldId } });
        if (!field) {
            return res.status(404).json({
                success: false,
                message: 'Field not found.',
            });
        }

        const report = await prisma.report.create({
            data: {
                content,
                fieldId,
                userId: req.user.id,
            },
            include: {
                user: {
                    select: { id: true, fullName: true, email: true },
                },
                field: {
                    select: { id: true, name: true, location: true },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Report created successfully.',
            data: { report },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a report
 * PUT /api/reports/:id
 */
export const updateReport = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content, status } = req.body;

        // Find existing report
        const existingReport = await prisma.report.findUnique({
            where: { id },
        });

        if (!existingReport) {
            return res.status(404).json({
                success: false,
                message: 'Report not found.',
            });
        }

        // Check ownership (unless admin)
        if (req.user.role !== 'ADMIN' && existingReport.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own reports.',
            });
        }

        const updateData = {};
        if (content) updateData.content = content;
        if (status && req.user.role === 'ADMIN') updateData.status = status;

        const report = await prisma.report.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: { id: true, fullName: true, email: true },
                },
                field: {
                    select: { id: true, name: true, location: true },
                },
            },
        });

        // Create notification if status changed by admin
        if (status && req.user.role === 'ADMIN') {
            await prisma.notification.create({
                data: {
                    userId: report.userId,
                    title: `Report ${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}`,
                    message: `Your report for "${report.field.name}" has been ${status.toLowerCase()}.`,
                    type: status === 'APPROVED' ? 'SUCCESS' : status === 'REJECTED' ? 'ERROR' : 'INFO'
                }
            });
        }

        res.json({
            success: true,
            message: 'Report updated successfully.',
            data: { report },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a report
 * DELETE /api/reports/:id
 */
export const deleteReport = async (req, res, next) => {
    try {
        const { id } = req.params;

        const existingReport = await prisma.report.findUnique({
            where: { id },
        });

        if (!existingReport) {
            return res.status(404).json({
                success: false,
                message: 'Report not found.',
            });
        }

        // Check ownership (unless admin)
        if (req.user.role !== 'ADMIN' && existingReport.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own reports.',
            });
        }

        await prisma.report.delete({ where: { id } });

        res.json({
            success: true,
            message: 'Report deleted successfully.',
        });
    } catch (error) {
        next(error);
    }
};
