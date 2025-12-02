const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

exports.register = async (req, res) => {
    try {
        // ตรวจสอบว่า req.body มีข้อมูลครบหรือไม่ (แก้ปัญหา destructure property of undefined)
        const { username, password, fullname, role } = req.body;

        // 1. เช็คว่ากรอกครบไหม
        if (!username || !password || !fullname || !role) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' 
            });
        }

        // 2. เช็คว่า Username ซ้ำไหม
        const [existing] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Username นี้ถูกใช้งานแล้ว' 
            });
        }

        // 3. Hash Password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 4. Insert User
        const [result] = await db.execute(
            'INSERT INTO users (username, password_hash, fullname, role) VALUES (?, ?, ?, ?)',
            [username, password_hash, fullname, role]
        );

        res.status(201).json({
            status: 'success',
            message: 'ลงทะเบียนสำเร็จ',
            data: { userId: result.insertId }
        });

    } catch (error) { 
        console.error("Register Error Details:", error);
        res.status(500).json({ 
            status: 'error', 
            message: error.message || 'เกิดข้อผิดพลาดที่ Server' 
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find User
        const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        
        if (users.length === 0) {
            return res.status(401).json({ status: 'error', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        const user = users[0];

        // Check Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        // Sign JWT
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
                user: { id: user.id, username: user.username, role: user.role, fullname: user.fullname }
            }
        });
    } catch (error) { 
        console.error("Login Error Details:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};