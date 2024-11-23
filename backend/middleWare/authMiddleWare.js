const jwt = require('jsonwebtoken');
const User = require('../Schema/UserDetails');

// Middleware to verify JWT token and attach userId to request
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).send({ status: 'Error', data: 'Token is required.' });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                // Specific error for expired token
                return res.status(401).json({ status: 'Error', data: 'Token has expired. Please log in again.' });
            } else if (err.name === 'JsonWebTokenError') {
                // General JWT error (e.g., malformed token)
                return res.status(401).json({ status: 'Error', data: 'Invalid token. Please log in again.' });
            }
        }

        try {
            // Optionally, you can fetch user from the database to get more details
            const currentUser = await User.findOne({
                $or: [{ email: user.email }, { userName: user.userName }]
            });

            if (!currentUser) {
                return res.status(404).send({ status: 'Error', data: 'User not found.' });
            }

            req.userId = currentUser._id; // Attach userId to the request object
            next();
        } catch (error) {
            console.error("Authentication error:", error);
            res.status(500).send({ status: 'Error', data: 'Internal server error' });
        }
    });
};

module.exports = authenticateToken;
