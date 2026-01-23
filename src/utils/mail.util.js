import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send a verification code to a user's email
 * @param {string} email - Recipient email
 * @param {string} fullName - Recipient's full name
 * @param {string} code - 6-digit verification code
 */
export const sendVerificationEmail = async (email, fullName, code) => {
    try {
        const { data, error } = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
            to: email,
            subject: 'Verify your account - Report Come Play',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h1 style="color: #10b981; margin-bottom: 24px;">Welcome to Report Come Play!</h1>
          <p style="font-size: 16px; color: #475569; line-height: 1.5;">Hi ${fullName},</p>
          <p style="font-size: 16px; color: #475569; line-height: 1.5;">Thank you for joining our community. To complete your registration, please use the following 6-digit verification code:</p>
          <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; text-align: center; margin: 32px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.5;">This code will expire in 10 minutes. If you didn't request this email, you can safely ignore it.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">&copy; 2026 Report Come Play. All rights reserved.</p>
        </div>
      `,
        });

        if (error) {
            console.error('Resend Error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Failed to send verification email:', error);
        return { success: false, error };
    }
};
