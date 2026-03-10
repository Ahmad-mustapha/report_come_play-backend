import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const endpoint = process.env.R2_S3_API_URL;

if (!accessKeyId || !secretAccessKey || !endpoint) {
    console.warn('⚠️ Cloudflare R2 credentials missing in .env. Image uploads might fail.');
} else {
    console.log('✅ Cloudflare R2 storage client initialized.');
}

export const s3Client = new S3Client({
    region: 'auto', // Cloudflare R2 always uses 'auto'
    endpoint: endpoint,
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
    },
});
