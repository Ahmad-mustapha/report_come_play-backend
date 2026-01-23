/**
 * Middleware to check if user has required role
 * @param  {...string} allowedRoles - Roles that are allowed to access the route
 */
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this resource.'
            });
        }

        next();
    };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Middleware to check if user is owner
 */
export const requireOwner = requireRole('OWNER', 'ADMIN');

/**
 * Middleware to check if user is reporter or owner
 */
export const requireReporter = requireRole('REPORTER', 'OWNER', 'ADMIN');
