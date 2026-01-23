import dotenv from 'dotenv';
dotenv.config();

import prisma from './src/config/database.js';
import { hashPassword } from './src/utils/password.util.js';

async function createAdmin() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const fullName = process.env.ADMIN_NAME;

    try {
        console.log(`Attempting to create admin: ${email}...`);

        // Check if admin exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            console.log('Admin already exists! Skipping.');
            return;
        }

        const hashedPassword = await hashPassword(password);

        // Create User with ADMIN role
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName,
                role: 'ADMIN',
                emailVerified: true,
            }
        });

        // Create Admin record
        await prisma.admin.create({
            data: {
                userId: user.id,
                permissions: { all: true }
            }
        });

        console.log('✅ Admin Created Successfully!');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Role: ADMIN');
    } catch (error) {
        console.error('❌ Error creating admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
