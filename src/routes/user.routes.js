import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.get('/reports', userController.getUserReports);
router.get('/payouts', userController.getUserPayouts);
router.get('/notifications', userController.getNotifications);
router.put('/notifications/read-all', userController.markAllNotificationsAsRead);
router.put('/notifications/:id/read', userController.markNotificationAsRead);

export default router;
