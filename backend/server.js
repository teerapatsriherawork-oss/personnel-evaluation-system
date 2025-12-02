// File: backend/server.js

const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: "../.env" });

// Import Routes
const apiRoutes = require("./routes/apiRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Files (สำหรับรูปภาพและไฟล์แนบ)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
// Log ทุก Request เพื่อช่วยในการ Debug (เกณฑ์ข้อ 3.2.7.7 การตรวจสอบ Console)
app.use("/api", (req, res, next) => {
    console.log(`[API Log] ${req.method} ${req.originalUrl}`);
    next();
}, apiRoutes);

// Test Endpoint
app.get("/", (req, res) => {
    res.send("Personnel Evaluation System API is running...");
});

// ==========================================
// [FIXED] ส่วนจัดการ Error (Error Handling)
// ตามเกณฑ์ข้อ 3.2.4.4 และ 3.2.6.5
// ==========================================

// 1. Handle 404 Not Found (สำหรับ API ที่ไม่มีจริง)
app.use((req, res, next) => {
    res.status(404).json({
        status: 'error',
        message: `Route not found: ${req.originalUrl} (Error 404)`
    });
});

// 2. Global Error Handler (ดักจับ Error 500 หรืออื่นๆ)
app.use((err, req, res, next) => {
    console.error("🔥 Server Error Stack:", err.stack);
    
    // กำหนด Status Code (ถ้าไม่มีให้เป็น 500)
    const statusCode = err.status || 500;
    
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
        // ส่ง stack trace เฉพาะตอน dev เพื่อความปลอดภัย
        error: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Backend server is running on port ${PORT}`);
});