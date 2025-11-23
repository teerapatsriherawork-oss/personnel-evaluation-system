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
        // บังคับให้ลงโฟลเดอร์ที่ระบุไว้
        cb(null, UPLOAD_FOLDER);
    },
    filename: (req, file, cb) => {
        // ตั้งชื่อไฟล์ป้องกันภาษาไทยเพี้ยน
        const ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `file-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG) และ PDF เท่านั้น (ไม่เกิน 5MB)'));
    }
};

// Initialize Multer
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
    fileFilter: fileFilter
}).single('file'); // รับไฟล์ชื่อ 'file' เท่านั้น

// [FIX 3] Wrapper Middleware เพื่อดัก Error ของ Multer และป้องกันการหลุดของไฟล์
exports.uploadMiddleware = (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error("❌ Multer Error:", err);
            return res.status(400).json({ status: 'error', message: `Upload Error: ${err.message}` });
        } else if (err) {
            console.error("❌ File Filter Error:", err);
            return res.status(400).json({ status: 'error', message: err.message });
        }
        next();
    });
};

exports.uploadFile = (req, res) => {
    if (!req.file) {
        // [Diagnostic Log] ถ้าไม่เห็นไฟล์
        console.error("❌❌ UPLOAD FAILED: Multer did not receive req.file. Check Frontend headers or file size/type.");
        return res.status(400).json({ status: 'error', message: 'กรุณาเลือกไฟล์ที่ถูกต้อง' });
    }
    
    // [Diagnostic Log] ถ้าเห็นไฟล์
    console.log(`[DEBUG] Multer received file size: ${req.file.size} bytes`); 
    
    // Log บอกพิกัดไฟล์ที่ถูกเซฟจริง (ตรวจสอบใน Terminal)
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