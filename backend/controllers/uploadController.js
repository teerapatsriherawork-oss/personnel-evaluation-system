const multer = require('multer');
const path = require('path');
const fs = require('fs'); // [เพิ่ม] import fs

// [เพิ่ม] ฟังก์ชันตรวจสอบและสร้างโฟลเดอร์ uploads ถ้ายังไม่มี
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads folder automatically.');
}

// Config Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // ใช้ตัวแปร uploadDir
    },
    filename: (req, file, cb) => {
        // ตั้งชื่อไฟล์ให้ไม่ซ้ำ: timestamp-random.extension
        // แก้ไขชื่อไฟล์ให้รองรับภาษาไทย (เปลี่ยนเป็น timestamp อย่างเดียว หรือ encode)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File Filter: Allow PDF and Images only
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    // ตรวจสอบทั้งนามสกุลและ mimetype
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images and PDFs are allowed! (Max 5MB)'));
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
    fileFilter: fileFilter
});

// Single file upload middleware
exports.uploadMiddleware = upload.single('file');

exports.uploadFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'No file uploaded or invalid file type' });
    }
    
    // Return path เพื่อนำไปบันทึกลง DB
    // หมายเหตุ: path ที่ส่งกลับต้องตรงกับที่ server.js เปิด static ไว้ (คือ /uploads/filename)
    res.status(200).json({
        status: 'success',
        message: 'File uploaded successfully',
        data: {
            filename: req.file.filename,
            path: `/uploads/${req.file.filename}`
        }
    });
};