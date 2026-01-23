import jwt from 'jsonwebtoken';



/**
 * Generate a JWT token
 * @param {Object} payload - Data to encode in token (e.g., userId, role)
 * @returns {string} JWT token
 */
export const generateToken = (payload) => {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jwt.sign(payload, secret, {
        expiresIn: expiresIn,
    });
};

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyToken = (token) => {
    const secret = process.env.JWT_SECRET;
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};
