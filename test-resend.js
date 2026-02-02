import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
    console.log('Testing Resend with:');
    console.log('API Key:', process.env.RESEND_API_KEY?.substring(0, 7) + '...');
    console.log('From:', process.env.FROM_EMAIL);

    try {
        const { data, error } = await resend.emails.send({
            from: process.env.FROM_EMAIL,
            to: 'musbene03@gmail.com', // Sending to the admin email as a test
            subject: 'Test Email - Report Come Play',
            html: '<p>If you see this, Resend is working correctly with your domain!</p>'
        });

        if (error) {
            console.error('❌ Resend Error:', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ Success! Data:', data);
        }
    } catch (err) {
        console.error('💥 Catch Error:', err);
    }
}

testEmail();
