// File: backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

const authMiddleware = (req, res, next) => {
    // 1. ดึง Token จาก Header Authorization (รูปแบบ: "Bearer <token>")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // 2. ตรวจสอบว่ามี Token หรือไม่
    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Access denied. No token provided.'
        });
    }

    try {
        // 3. ตรวจสอบความถูกต้องของ Token (Verify)
        const decodedUser = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. แนบข้อมูล User เข้าไปใน Request Object เพื่อใช้ใน Controller ถัดไป
        req.user = decodedUser; 
        next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid or expired token.'
        });
    }
};

module.exports = authMiddleware;