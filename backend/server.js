// File: backend/server.js

const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: "../.env" });

// Import Routes
const apiRoutes = require("./routes/apiRoutes");

const app = express();

// ==========================================
// 1. App Configuration & Middlewares
// ==========================================
app.use(cors());
// เพิ่ม limit รองรับการส่งรูปภาพ Base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==========================================
// 2. Static Files
// ==========================================
// ให้บริการไฟล์ที่อัปโหลด (Uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==========================================
// 3. API Routes
// ==========================================
// Logging middleware (Development only)
app.use("/api", (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[API] ${req.method} ${req.originalUrl}`);
    }
    next();
}, apiRoutes);

// Health Check
app.get("/", (req, res) => {
    res.send({ status: 'ok', message: 'Personnel Evaluation System API is running...' });
});

// ==========================================
// 4. Error Handling
// ==========================================

// 404 Not Found
app.use((req, res, next) => {
    res.status(404).json({
        status: 'error',
        message: `Route not found: ${req.originalUrl}`
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("🔥 Server Error:", err.stack);
    
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// ==========================================
// 5. Server Startup
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Backend server is running on port ${PORT}`);
});