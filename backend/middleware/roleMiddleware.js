// File: backend/middleware/roleMiddleware.js

/**
 * Middleware: ตรวจสอบสิทธิ์ Admin
 */
exports.verifyAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ 
            status: 'error', 
            message: 'Access denied. Admin role required.' 
        });
    }
};

/**
 * Middleware: ตรวจสอบสิทธิ์ Committee (รวมถึง Admin)
 */
exports.verifyCommittee = (req, res, next) => {
    // Admin มีสิทธิ์เข้าถึงฟังก์ชันของ Committee ได้ด้วย
    if (req.user && (req.user.role === 'committee' || req.user.role === 'admin')) {
        next();
    } else {
        return res.status(403).json({ 
            status: 'error', 
            message: 'Access denied. Committee role required.' 
        });
    }
};