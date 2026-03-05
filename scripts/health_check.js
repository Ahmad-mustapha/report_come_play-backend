import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- DATABASE STATUS ---');
    try {
        const usersCount = await prisma.user.count();
        const fieldsCount = await prisma.field.count();
        const payoutsCount = await prisma.payout.count();
        const reportsCount = await prisma.report.count();
        const notificationsCount = await prisma.notification.count();

        console.log({
            users: usersCount,
            fields: fieldsCount,
            payouts: payoutsCount,
            reports: reportsCount,
            notifications: notificationsCount
        });

        // Check for specific roles
        const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
        const reporters = await prisma.user.count({ where: { role: 'REPORTER' } });
        const owners = await prisma.user.count({ where: { role: 'OWNER' } });
        console.log({ admins, reporters, owners });

        console.log('--- TABLES CHECK SUCCESS ---');
    } catch (e) {
        console.error('❌ Database check failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
