const multer = require('multer');
const path = require('path');

// [6.3] Config Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // โฟลเดอร์ปลายทาง (ต้องสร้างไว้แล้วใน Part 1)
    },
    filename: (req, file, cb) => {
        // ตั้งชื่อไฟล์ให้ไม่ซ้ำ: timestamp-random.extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// [6.3] File Filter: Allow PDF and Images only
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images and PDFs are allowed!'));
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
    res.status(200).json({
        status: 'success',
        message: 'File uploaded successfully',
        data: {
            filename: req.file.filename,
            path: `/uploads/${req.file.filename}`
        }
    });
};