import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting to connect to database using Prisma...');
        const userCount = await prisma.user.count();
        console.log(`Connection successful! User count: ${userCount}`);
    } catch (error) {
        console.error('Prisma connection failed:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
