import prisma from '../config/database.js';
import { validationResult } from 'express-validator';

/**
 * Get all fields
 * GET /api/fields
 */
export const getAllFields = async (req, res, next) => {
    try {
        const { ownerId, status } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const where = {};
        if (ownerId) where.ownerId = ownerId;
        if (status) where.status = status;

        const [fields, total] = await Promise.all([
            prisma.field.findMany({
                where,
                skip,
                take: limit,
                include: {
                    owner: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            bankName: true,
                            accountNumber: true,
                            accountName: true,
                            role: true
                        },
                    },
                    _count: {
                        select: { reports: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.field.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                fields,
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
 * Get single field by ID
 * GET /api/fields/:id
 */
export const getFieldById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const field = await prisma.field.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        bankName: true,
                        accountNumber: true,
                        accountName: true,
                        role: true
                    },
                },
                reports: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: { id: true, fullName: true },
                        },
                    },
                },
            },
        });

        if (!field) {
            return res.status(404).json({
                success: false,
                message: 'Field not found.',
            });
        }

        res.json({
            success: true,
            data: { field },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new field (Owners only)
 * POST /api/fields
 */
export const createField = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const {
            name,
            location,
            description,
            surfaceType,
            fieldSize,
            availability,
            contactInfo,
            latitude,
            longitude,
            images
        } = req.body;

        const normalizedName = name.trim().replace(/\s+/g, ' ');
        const normalizedLocation = location.trim().replace(/\s+/g, ' ');

        // Check for duplicate field (Fuzzy Match)
        // Fetch all fields for comprehensive checking (Optimized: select only needed fields)
        const allFields = await prisma.field.findMany({
            select: { id: true, name: true, location: true }
        });

        // Helper: Calculate Levenshtein Distance for similarity
        const getSimilarity = (s1, s2) => {
            if (!s1 || !s2) return 0;
            let longer = s1;
            let shorter = s2;
            if (s1.length < s2.length) {
                longer = s2;
                shorter = s1;
            }
            const longerLength = longer.length;
            if (longerLength === 0) {
                return 1.0;
            }

            const editDistance = (str1, str2) => {
                str1 = str1.toLowerCase();
                str2 = str2.toLowerCase();
                const costs = new Array();
                for (let i = 0; i <= str1.length; i++) {
                    let lastValue = i;
                    for (let j = 0; j <= str2.length; j++) {
                        if (i == 0) costs[j] = j;
                        else {
                            if (j > 0) {
                                let newValue = costs[j - 1];
                                if (str1.charAt(i - 1) != str2.charAt(j - 1))
                                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                                costs[j - 1] = lastValue;
                                lastValue = newValue;
                            }
                        }
                    }
                    if (i > 0) costs[str2.length] = lastValue;
                }
                return costs[str2.length];
            };

            return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
        };

        const isSimilar = (str1, str2, threshold = 0.8) => {
            if (!str1 || !str2) return false;
            const norm1 = str1.trim().toLowerCase();
            const norm2 = str2.trim().toLowerCase();

            // 1. Direct match or Substring match (if significant length)
            if (norm1 === norm2) return true;
            if (norm1.length > 3 && norm2.length > 3) {
                if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
            }

            // 2. Levenshtein Similarity
            // If strings are short, we need strict matching, so rely on direct/substring above or high threshold
            return getSimilarity(norm1, norm2) >= threshold;
        };

        let duplicateCandidate = null;

        for (const existing of allFields) {
            // Check if EITHER Name OR Location similarity matches
            // Using explicit || operator as requested
            if (isSimilar(normalizedName, existing.name, 0.75) ||
                isSimilar(normalizedLocation, existing.location, 0.75)) {
                duplicateCandidate = existing;
                break;
            }
        }

        if (duplicateCandidate) {
            return res.status(409).json({ // 409 Conflict
                success: false,
                message: `Duplicate Alert! It looks like this field has already been reported as "${duplicateCandidate.name}" at "${duplicateCandidate.location}". No need to submit it again!`,
            });
        }

        // Enforce exactly 3 images
        if (!images || images.length !== 3) {
            return res.status(400).json({
                success: false,
                message: 'You must provide exactly 3 images.',
            });
        }

        const field = await prisma.field.create({
            data: {
                name: normalizedName,
                location: normalizedLocation,
                description: description?.trim(),
                surfaceType,
                fieldSize,
                availability: availability?.trim(),
                contactInfo: contactInfo?.trim(),
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                images: images || [],
                ownerId: req.user.id,
            },
            include: {
                owner: {
                    select: { id: true, fullName: true, email: true },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Field created successfully.',
            data: { field },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a field
 * PUT /api/fields/:id
 */
export const updateField = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, location, description, status } = req.body;

        const existingField = await prisma.field.findUnique({
            where: { id },
        });

        if (!existingField) {
            return res.status(404).json({
                success: false,
                message: 'Field not found.',
            });
        }

        // Check ownership (unless admin)
        if (req.user.role !== 'ADMIN' && existingField.ownerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own fields.',
            });
        }

        const updateData = { name, location, description };

        const field = await prisma.field.update({
            where: { id },
            data: updateData,
            include: {
                owner: {
                    select: { id: true, fullName: true, email: true },
                },
            },
        });

        res.json({
            success: true,
            message: 'Field updated successfully.',
            data: { field },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a field
 * DELETE /api/fields/:id
 */
export const deleteField = async (req, res, next) => {
    try {
        const { id } = req.params;

        const existingField = await prisma.field.findUnique({
            where: { id },
        });

        if (!existingField) {
            return res.status(404).json({
                success: false,
                message: 'Field not found.',
            });
        }

        // Check ownership (unless admin)
        if (req.user.role !== 'ADMIN' && existingField.ownerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own fields.',
            });
        }

        await prisma.field.delete({ where: { id } });

        res.json({
            success: true,
            message: 'Field deleted successfully.',
        });
    } catch (error) {
        next(error);
    }
};
