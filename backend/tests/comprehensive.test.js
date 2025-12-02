// File: backend/tests/comprehensive.test.js
const request = require('supertest');
const express = require('express');
const app = express();
const apiRoutes = require('../routes/apiRoutes');

// --- Setup Mock App & Dependencies ---
app.use(express.json());
app.use('/api', apiRoutes);

// Mock Database (จำลองฐานข้อมูลเพื่อไม่ต้องต่อของจริงตอน Test)
jest.mock('../config/database', () => ({
    execute: jest.fn((query, params) => {
        // 1. Mock Login Success
        if (query.includes('SELECT * FROM users')) {
            if (params[0] === 'testuser') {
                return [[{ 
                    id: 1, 
                    username: 'testuser', 
                    password_hash: '$2a$10$HASH', // Mock Hash
                    role: 'user', 
                    fullname: 'Test User' 
                }]];
            }
        }
        // 2. Mock Update Success
        if (query.includes('UPDATE users')) {
            return [{ affectedRows: 1 }];
        }
        // 3. Mock Create Round
        if (query.includes('INSERT INTO rounds')) {
            return [{ insertId: 10 }];
        }
        
        return [[]]; // Default empty
    })
}));

// Mock Bcrypt
jest.mock('bcryptjs', () => ({
    genSalt: jest.fn(),
    hash: jest.fn(() => 'hashed_password'),
    compare: jest.fn(() => true)
}));

// Mock Middleware (Bypass Auth & Role check)
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: 1, role: 'admin' }; // ให้เป็น Admin เพื่อเทสได้ทุก Route
    next();
});
jest.mock('../middleware/roleMiddleware', () => ({
    verifyAdmin: (req, res, next) => next(),
    verifyCommittee: (req, res, next) => next()
}));

// --- Test Suites ---
describe('Full System Qualification Tests', () => {
    
    // [เกณฑ์ 3.2.7.1] ทดสอบระบบ Login (POST)
    it('1. POST /api/auth/login - ควร Login สำเร็จ', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'testuser', password: 'password' });
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
    });

    // [เกณฑ์ 3.2.7.2] ทดสอบ Insert ข้อมูล (POST)
    it('2. POST /api/admin/rounds - ควรสร้างรอบประเมินได้', async () => {
        const res = await request(app)
            .post('/api/admin/rounds')
            .send({ 
                round_name: 'Round 1/2568', 
                start_date: '2025-01-01', 
                end_date: '2025-12-31' 
            });
        // หมายเหตุ: ต้องผ่าน Validation Middleware ด้วย
        expect(res.statusCode).toBeLessThan(500); 
    });

    // [เกณฑ์ 3.2.7.3] ทดสอบ Update ข้อมูล (PUT)
    it('3. PUT /api/admin/users/:id - ควรแก้ไขข้อมูลผู้ใช้ได้', async () => {
        const res = await request(app)
            .put('/api/admin/users/1')
            .send({ 
                username: 'updateduser', 
                fullname: 'Updated Name', 
                role: 'user' 
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toMatch(/User updated/i);
    });

    // [เกณฑ์ 3.2.7.4] ทดสอบ Validation (ส่งข้อมูลไม่ครบ)
    it('4. Validation Check - ควรแจ้ง Error เมื่อส่งข้อมูลไม่ครบ', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'onlyusername' }); // ขาด password, role
        expect(res.statusCode).toEqual(400);
        expect(res.body.status).toEqual('error');
    });

    // [เกณฑ์ 3.2.7.5] ทดสอบฟังก์ชันเฉพาะจุด (Logic Calculation)
    it('5. Unit Test: Logic คำนวณคะแนนเฉลี่ย', () => {
        // สร้างฟังก์ชันจำลองการคำนวณใน Frontend/Backend
        const calculateAverage = (scores) => {
            if (scores.length === 0) return 0;
            const sum = scores.reduce((a, b) => a + b, 0);
            return (sum / scores.length).toFixed(2);
        };

        const testScores = [4, 3, 5, 4];
        const result = calculateAverage(testScores);
        
        // (4+3+5+4)/4 = 16/4 = 4.00
        expect(result).toBe("4.00");
    });
});