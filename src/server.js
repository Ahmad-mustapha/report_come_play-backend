import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import reportRoutes from './routes/report.routes.js';
import fieldRoutes from './routes/field.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js';
import { globalLimiter, authLimiter, submissionLimiter } from './middleware/rateLimit.middleware.js';

// Pre-load database helper to verify connection at very startup
import './lib/prisma.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (required if behind Nginx, Vercel, etc.)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// Logging Middleware
app.use((req, res, next) => {
    console.log(`🔍 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`⚠️  Blocked CORS request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Routes
app.get('/', (req, res) => {
    res.json({ success: true, message: 'Report Come Play API is running!', version: '1.0.0' });
});

app.get('/health', (req, res) => {
    res.json({ success: true, message: 'Server is healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/fields', fieldRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/upload', uploadRoutes);

// Error Handling (Must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║   🚀 Server Running Successfully!         ║
╠═══════════════════════════════════════════╣
║   Port: ${PORT}                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}               ║
║   API: http://localhost:${PORT}/api/v1    ║
╚═══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
const shutdown = async () => {
    console.log('🛑 Shutting down server...');
    server.close(async () => {
        console.log('📡 HTTP server closed.');
        try {
            const { prisma } = await import('./lib/prisma.js');
            await prisma.$disconnect();
            console.log('🗄️ Database disconnected.');
            process.exit(0);
        } catch (err) {
            console.error('Error during database disconnection:', err);
            process.exit(1);
        }
    });

    // Force exit after 10s if graceful shutdown fails
    setTimeout(() => {
        console.error('⚠️ Forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
