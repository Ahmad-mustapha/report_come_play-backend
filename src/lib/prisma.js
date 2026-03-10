import 'dotenv/config'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import ws from 'ws'

// Configure Neon to use the 'ws' package for WebSockets
// This bypasses Port 5432 blocks and uses Port 443
neonConfig.webSocketConstructor = ws

const prismaClientSingleton = () => {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
        console.error('❌ DATABASE_URL is not defined in environment variables')
    }

    // Explicitly pass the connection string to the Pool to prevent "No database host" error
    const pool = new Pool({ connectionString })
    const adapter = new PrismaNeon(pool)

    return new PrismaClient({
        adapter,
        log: ['error', 'warn'],
    })
}

const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

export default prisma
export { prisma }
