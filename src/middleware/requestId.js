const crypto = require('crypto');

// Middleware to generate unique request ID for debugging and log correlation
function requestId(req, res, next) {
    // Use client-provided ID or generate new one
    const id = req.headers['x-request-id'] || crypto.randomUUID();
    
    req.requestId = id;
    res.setHeader('X-Request-Id', id);
    
    next();
}

module.exports = requestId;