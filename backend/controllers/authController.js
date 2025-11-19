const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

exports.register = async (req, res) => {
    try {
        const { username, password, fullname, role } = req.body;

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert User
        const [result] = await db.execute(
            'INSERT INTO users (username, password_hash, fullname, role) VALUES (?, ?, ?, ?)',
            [username, password_hash, fullname, role]
        );

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: { userId: result.insertId }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find User
        const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        
        if (users.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Invalid username or password' });
        }

        const user = users[0];

        // Check Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Invalid username or password' });
        }

        // Sign JWT
        const token = jwt.sign(
            { id: user.id, role: user.role, fullname: user.fullname },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                token,
                user: { id: user.id, username: user.username, role: user.role, fullname: user.fullname }
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};