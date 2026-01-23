import { supabase } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a file to Supabase Storage
 * POST /api/upload
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

        // Upload to Supabase Storage
        // NOTE: Ensure you have created a PUBLIC bucket named 'field-images' in Supabase
        const { data, error } = await supabase.storage
            .from('field-images')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            console.error('Supabase Storage Error:', error);
            return res.status(500).json({ success: false, message: 'Failed to upload to storage.', error });
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('field-images')
            .getPublicUrl(filePath);

        res.json({
            success: true,
            url: publicUrl
        });
    } catch (error) {
        next(error);
    }
};
