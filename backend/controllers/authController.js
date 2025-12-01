// File: backend/controllers/authController.js

const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

/**
 * ลงทะเบียนผู้ใช้งานใหม่ (Register)
 */
exports.register = async (req, res) => {
    try {
        const { username, password, fullname, role } = req.body;

        // 1. ตรวจสอบข้อมูลนำเข้า (Validation)
        if (!username || !password || !fullname || !role) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' 
            });
        }

        // 2. ตรวจสอบ Username ซ้ำ
        const [existingUsers] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Username นี้ถูกใช้งานแล้ว' 
            });
        }

        // 3. เข้ารหัสรหัสผ่าน (Hash Password)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 4. บันทึกลงฐานข้อมูล
        const [result] = await db.execute(
            'INSERT INTO users (username, password_hash, fullname, role) VALUES (?, ?, ?, ?)',
            [username, passwordHash, fullname, role]
        );

        res.status(201).json({
            status: 'success',
            message: 'ลงทะเบียนสำเร็จ',
            data: { userId: result.insertId }
        });

    } catch (error) { 
        console.error("Register Error:", error);
        res.status(500).json({ 
            status: 'error', 
            message: error.message || 'เกิดข้อผิดพลาดที่ Server' 
        });
    }
};

/**
 * เข้าสู่ระบบ (Login)
 */
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. ค้นหาผู้ใช้จาก Username
        const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        
        if (users.length === 0) {
            return res.status(401).json({ status: 'error', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        const user = users[0];

        // 2. ตรวจสอบรหัสผ่าน
        const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordMatch) {
            return res.status(401).json({ status: 'error', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        // 3. สร้าง JWT Token
        const token = jwt.sign(
            { id: user.id, role: user.role, fullname: user.fullname },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            status: 'success',
            message: 'เข้าสู่ระบบสำเร็จ',
            data: {
                token,
                user: { 
                    id: user.id, 
                    username: user.username, 
                    role: user.role, 
                    fullname: user.fullname 
                }
            }
        });
    } catch (error) { 
        console.error("Login Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};