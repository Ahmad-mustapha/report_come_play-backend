import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testStats() {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        console.log('Seven Days Ago:', sevenDaysAgo.toISOString());

        const last7DaysFields = await prisma.field.findMany({
            where: { createdAt: { gte: sevenDaysAgo } },
            select: { createdAt: true }
        });
        console.log('Last 7 Days Fields:', last7DaysFields);

        const charts = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            console.log(`Checking date: ${dateStr} (${dayName})`);

            const submissions = last7DaysFields.filter(f => f.createdAt.toISOString().startsWith(dateStr)).length;
            console.log(`Found ${submissions} submissions`);

            charts.push({
                date: dayName,
                submissions,
                newUsers: 0
            });
        }
        console.log('Charts:', charts);

        const recentFields = await prisma.field.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                location: true,
                status: true,
                createdAt: true,
                owner: {
                    select: {
                        fullName: true,
                        email: true
                    }
                }
            }
        });
        console.log('Recent Fields:', JSON.stringify(recentFields, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

testStats();
