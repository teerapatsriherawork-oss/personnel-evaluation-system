// File: backend/tests/auth.test.js
const request = require('supertest');
const express = require('express');
const app = express();
const apiRoutes = require('../routes/apiRoutes');

// Mock Dependencies เพื่อให้ Test ได้โดยไม่ต้องต่อ Database จริง
app.use(express.json());
app.use('/api', apiRoutes);

// Mock Database Connection
jest.mock('../config/database', () => ({
    execute: jest.fn((query, params) => {
        // จำลองสถานการณ์ Login สำเร็จ
        if (query.includes('SELECT * FROM users')) {
            if (params[0] === 'testuser') {
                return [[{ 
                    id: 1, 
                    username: 'testuser', 
                    password_hash: '$2a$10$MockHashValue...', // Hash ปลอม
                    role: 'user', 
                    fullname: 'Test User' 
                }]];
            }
        }
        return [[]]; // Default: ไม่พบข้อมูล
    })
}));

// Mock Bcrypt (เพื่อให้ Login ผ่านโดยไม่ต้อง Hash จริง)
jest.mock('bcryptjs', () => ({
    genSalt: jest.fn(),
    hash: jest.fn(() => 'hashed_password'),
    compare: jest.fn(() => true) // ให้รหัสผ่านถูกต้องเสมอ
}));

// Mock Middleware (เพื่อให้ข้ามการตรวจสอบ Token ในการ Test บางส่วน)
jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
    req.user = { id: 1, role: 'user' };
    next();
});

describe('System API Tests', () => {
    
    // Test Case 1: ทดสอบ Validation การสมัครสมาชิก (POST)
    it('POST /api/auth/register - ควรแจ้ง Error ถ้าข้อมูลไม่ครบ', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'newuser' }); // ส่งข้อมูลไม่ครบ (ขาด password, fullname, role)
        
        expect(res.statusCode).toEqual(400);
        expect(res.body.status).toEqual('error');
    });

    // Test Case 2: ทดสอบการเข้าสู่ระบบ (POST)
    it('POST /api/auth/login - ควร Login สำเร็จและได้ Token', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'testuser', password: 'password123' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.data).toHaveProperty('token');
    });

    // Test Case 3: ทดสอบการเข้าถึงข้อมูลสาธารณะ (GET)
    it('GET /api/public/progress - ควรเข้าถึงได้โดยไม่ต้อง Login', async () => {
        const res = await request(app)
            .get('/api/public/progress');
        
        expect(res.statusCode).toBeLessThan(500); // ไม่ควรเกิด Server Error
    });
});