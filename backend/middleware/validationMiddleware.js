// File: backend/middleware/validationMiddleware.js
const { body, validationResult } = require('express-validator');

// Helper Function สำหรับตรวจสอบผลลัพธ์ Validation
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'Validation failed',
            errors: errors.array() 
        });
    }
    next();
};

// กฎการตรวจสอบสำหรับการลงทะเบียน
exports.registerRules = [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('fullname').notEmpty().withMessage('Fullname is required'),
    body('role').isIn(['admin', 'user', 'committee']).withMessage('Invalid role'),
    validate
];

// กฎการตรวจสอบสำหรับการเข้าสู่ระบบ
exports.loginRules = [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
];

// กฎการตรวจสอบสำหรับการสร้างรอบการประเมิน
exports.createRoundRules = [
    body('round_name').notEmpty().withMessage('Round name is required'),
    body('start_date').isISO8601().withMessage('Start date must be a valid date'),
    body('end_date').isISO8601().withMessage('End date must be a valid date'),
    validate
];