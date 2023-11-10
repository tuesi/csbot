const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(403).json({ error: 'Token is missing' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_KEY);

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(500).json({ error: 'Invalid token' });
    }
};

module.exports = { verifyToken };