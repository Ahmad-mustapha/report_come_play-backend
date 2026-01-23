import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    const adminEmail = process.env.ADMIN_EMAIL || 'musbene03@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'shinlo@123';
    const adminName = process.env.ADMIN_NAME || 'Musben';

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create Admin User
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            password: hashedPassword,
            fullName: adminName,
            role: 'ADMIN',
            emailVerified: true,
        },
    });

    // Create Admin record
    await prisma.admin.upsert({
        where: { userId: admin.id },
        update: {},
        create: {
            userId: admin.id,
            permissions: { all: true }
        }
    });

    console.log(`✅ Admin user created: ${adminEmail}`);
    console.log('✨ Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
