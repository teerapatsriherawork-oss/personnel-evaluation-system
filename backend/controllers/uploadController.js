// File: backend/controllers/uploadController.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// [FIX 1] ใช้ path.join เพื่อระบุพิกัดโฟลเดอร์แบบ "ตายตัว"
const UPLOAD_FOLDER = path.join(__dirname, '../uploads');

// [FIX 2] สร้างโฟลเดอร์ถ้ายังไม่มี
if (!fs.existsSync(UPLOAD_FOLDER)) {
    try {
        fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
        console.log(`📂 Created upload folder at: ${UPLOAD_FOLDER}`);
    } catch (err) {
        console.error(`❌ Error creating upload folder: ${err.message}`);
    }
} else {
    console.log(`📂 Using upload folder at: ${UPLOAD_FOLDER}`);
}

// Config Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_FOLDER);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `file-${uniqueSuffix}${ext}`);
    }
});

// [SECURITY REMOVED] อนุญาตไฟล์ทุกประเภท
const NO_FILTER = (req, file, cb) => {
    cb(null, true); 
};

// Initialize Multer
const upload = multer({ 
    storage: storage,
    // [SECURITY REMOVED] ลบ limits ออก
    fileFilter: NO_FILTER // ใช้ฟังก์ชันที่อนุญาตทุกไฟล์
}).single('file'); // รับไฟล์ชื่อ 'file' เท่านั้น

// [FIX 3] Wrapper Middleware ที่ถูกต้อง เพื่อดัก Multer Error
exports.uploadMiddleware = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            // หากเกิด Error (เช่น ไฟล์ใหญ่เกิน, ผิดประเภท)
            console.error("❌ File Upload Intercepted by Multer Error:", err.message);
            return res.status(400).json({ status: 'error', message: err.message });
        }
        next();
    });
};

exports.uploadFile = (req, res) => {
    if (!req.file) {
        // [Diagnostic Log] ถ้าไม่เห็นไฟล์
        console.error("❌❌ UPLOAD FAILED: Multer did not receive req.file. (Final Check)");
        return res.status(400).json({ status: 'error', message: 'กรุณาเลือกไฟล์ที่ถูกต้อง' });
    }
    
    // [Diagnostic Log] ถ้าเห็นไฟล์
    console.log(`[DEBUG] Multer received file size: ${req.file.size} bytes`); 
    console.log(`✅ File Saved Successfully!`);
    console.log(`   👉 Filename: ${req.file.filename}`);
    console.log(`   👉 Full Path: ${req.file.path}`); 

    res.status(200).json({
        status: 'success',
        message: 'อัพโหลดสำเร็จ',
        data: {
            filename: req.file.filename,
            path: `/uploads/${req.file.filename}` 
        }
    });
};