const users = require('../models/user.server.models');

// Middleware to validate session token
const authenticate = (req, res, next) => {
    const token = req.get('X-Authorization');

    if (!token) {
        return res.status(401).json({ error_message: 'No session token provided' });
    }

    users.getIDFromToken(token, (err, id) => {
        if (err || !id) {
            return res.status(401).json({ error_message: 'Invalid or expired session token' });
        }

        // Token is valid, store user id for later use
        req.authenticatedUserID = id;
        next();
    });
};

module.exports = authenticate;