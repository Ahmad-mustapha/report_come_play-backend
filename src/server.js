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

// Load environment variables (already loaded by 'dotenv/config' import)
// dotenv.config();

import { globalLimiter } from './middleware/rateLimit.middleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (required if behind Nginx, Heroku, etc. to get correct IP)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// Apply global rate limiter to all requests
app.use(globalLimiter);

// Middleware
app.use((req, res, next) => {
    console.log(`🔍 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Report Come Play API is running!',
        version: '1.0.0',
    });
});

app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║   🚀 Server Running Successfully!         ║
╠═══════════════════════════════════════════╣
║   Port: ${PORT}                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}               ║
║   API: http://localhost:${PORT}/api       ║
╚═══════════════════════════════════════════╝
  `);
});

export default app;
