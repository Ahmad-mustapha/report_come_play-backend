import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/roleCheck.middleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);

// Payout management
router.get('/payouts', adminController.getAllPayouts);
router.post('/payouts', adminController.createPayout);
router.put('/payouts/:id', adminController.updatePayout);

// Dashboard stats
router.get('/stats', adminController.getDashboardStats);

// Field verification
router.put('/fields/:id/verify', adminController.verifyField);

export default router;
