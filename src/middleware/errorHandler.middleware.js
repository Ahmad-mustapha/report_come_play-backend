/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Prisma errors
    if (err.code === 'P2002') {
        return res.status(409).json({
            success: false,
            message: 'A record with this unique field already exists.',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            success: false,
            message: 'Record not found.',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    }

    // Prisma Connection/Timeout/Initialization errors
    const isConnectionError =
        // Known connection error codes
        ['P1000', 'P1001', 'P1002', 'P1003', 'P1008', 'P1011', 'P1017'].includes(err.code) ||
        // Initialization errors (often network related)
        err.name === 'PrismaClientInitializationError' ||
        // Specific error messages
        err.message?.includes('Can\'t reach database server') ||
        err.message?.includes('server has closed the connection') ||
        err.message?.includes('EAI_AGAIN');

    if (isConnectionError) {
        console.error('🛑 Database Connection Error:', err.message);
        return res.status(503).json({
            success: false,
            message: 'We are experiencing temporary connection issues. Please check your internet and try again.',
            type: 'NETWORK_ERROR', // Frontend can use this to show a "Retry" button
            error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation failed.',
            errors: err.errors,
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token.',
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired.',
        });
    }

    // Default error
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error.',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found.`,
    });
};
