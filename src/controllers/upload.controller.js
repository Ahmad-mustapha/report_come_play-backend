import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../config/storage.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a file to Cloudflare R2 Storage
 * POST /api/v1/upload
 */
export const uploadImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        const file = req.file;
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        // Upload to Cloudflare R2 via S3-compatible API
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: filePath,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        await s3Client.send(command);

        // Construct the public URL manually using the R2 public domain
        const publicUrl = `${process.env.R2_PUBLIC_URL}/${filePath}`;

        res.json({
            success: true,
            url: publicUrl
        });
    } catch (error) {
        console.error('Cloudflare R2 Upload Error:', error);
        next(error);
    }
};

