import express from 'express';
import { body } from 'express-validator'; // Fixed: imported requireReporter
import * as fieldController from '../controllers/field.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireOwner, requireReporter } from '../middleware/roleCheck.middleware.js';
import { submissionLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

// Validation
const fieldValidation = [
    body('name').notEmpty().withMessage('Field name is required'),
    body('location').notEmpty().withMessage('Location is required'),
];

// All routes require authentication
router.use(authenticateToken);

router.get('/', fieldController.getAllFields);
router.get('/:id', fieldController.getFieldById);

// Only reporters and above can create fields
router.post('/', submissionLimiter, requireReporter, fieldValidation, fieldController.createField);
router.put('/:id', requireOwner, fieldValidation, fieldController.updateField);
router.delete('/:id', requireOwner, fieldController.deleteField);

export default router;
