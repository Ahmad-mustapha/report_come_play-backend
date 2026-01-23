import express from 'express';
import { body } from 'express-validator';
import * as reportController from '../controllers/report.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { submissionLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

// Validation
const reportValidation = [
    body('content').notEmpty().withMessage('Report content is required'),
    body('fieldId').notEmpty().withMessage('Field ID is required'),
];

// All routes require authentication
router.use(authenticateToken);

router.get('/', reportController.getAllReports);
router.get('/:id', reportController.getReportById);
router.post('/', submissionLimiter, reportValidation, reportController.createReport);
router.put('/:id', reportController.updateReport);
router.delete('/:id', reportController.deleteReport);

export default router;
