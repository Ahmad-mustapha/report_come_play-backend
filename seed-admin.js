import dotenv from 'dotenv';
dotenv.config();

import prisma from './src/lib/prisma.js';
import { hashPassword } from './src/utils/password.util.js';

async function createAdmin() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const fullName = process.env.ADMIN_NAME;

    if (!email || !password) {
        console.error('❌ ADMIN_EMAIL or ADMIN_PASSWORD not found in .env');
        return;
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();
        console.log(`Attempting to seed admin: ${normalizedEmail}...`);

        const hashedPassword = await hashPassword(password);

        // Upsert user with ADMIN role
        const user = await prisma.user.upsert({
            where: { email: normalizedEmail },
            update: {
                password: hashedPassword,
                fullName,
                role: 'ADMIN',
                emailVerified: true,
            },
            create: {
                email: normalizedEmail,
                password: hashedPassword,
                fullName,
                role: 'ADMIN',
                emailVerified: true,
            }
        });

        // Ensure Admin record exists
        await prisma.admin.upsert({
            where: { userId: user.id },
            update: {
                permissions: { all: true }
            },
            create: {
                userId: user.id,
                permissions: { all: true }
            }
        });

        console.log('✅ Admin Seeded Successfully!');
        console.log('Email:', normalizedEmail);
        console.log('Password:', password);
        console.log('Role: ADMIN');
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
