import express from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/upload.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { submissionLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

// Multer Config (Storage in memory, we pass to Supabase)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

// Route for single image upload
router.post('/', authenticateToken, submissionLimiter, upload.single('image'), uploadImage);

export default router;
