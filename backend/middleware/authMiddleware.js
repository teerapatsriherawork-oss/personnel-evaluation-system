const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

const authMiddleware = (req, res, next) => {
    // [6.4] ดึง Token จาก Header (Format: "Bearer <token>")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // [4.4] Handle Error 401: Unauthorized (ไม่มี Token)
    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Access denied. No token provided.'
        });
    }

    try {
        // [6.10] Verify Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // แนบข้อมูล User เข้าไปใน Request
        next();
    } catch (error) {
        // [4.4] Handle Error 401: Invalid Token
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token.'
        });
    }
};

module.exports = authMiddleware;