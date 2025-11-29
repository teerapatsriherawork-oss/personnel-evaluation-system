// File: backend/middleware/roleMiddleware.js

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

exports.verifyCommittee = (req, res, next) => {
    // อนุญาตทั้ง Committee และ Admin ให้เข้าถึงส่วนการให้คะแนนได้
    if (req.user && (req.user.role === 'committee' || req.user.role === 'admin')) {
        next();
    } else {
        return res.status(403).json({ 
            status: 'error', 
            message: 'Access denied. Committee role required.' 
        });
    }
};