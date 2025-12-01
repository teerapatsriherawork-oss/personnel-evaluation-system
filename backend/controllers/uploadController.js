// File: backend/controllers/uploadController.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_FOLDER = path.join(__dirname, '../uploads');

// Ensure upload folder exists
if (!fs.existsSync(UPLOAD_FOLDER)) {
    try {
        fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
        console.log(`📂 Created upload folder at: ${UPLOAD_FOLDER}`);
    } catch (err) {
        console.error(`❌ Error creating upload folder: ${err.message}`);
    }
}

// Config Storage
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, UPLOAD_FOLDER);
    },
    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        callback(null, `file-${uniqueSuffix}${extension}`);
    }
});

// File Filter: Allow all file types
const allowAllFileTypes = (req, file, callback) => {
    callback(null, true); 
};

// Initialize Multer
const upload = multer({ 
    storage: storage,
    fileFilter: allowAllFileTypes
}).single('file'); // Expects field name 'file'

// Wrapper Middleware to handle Multer errors gracefully
exports.uploadMiddleware = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            console.error("File Upload Error:", err.message);
            return res.status(400).json({ status: 'error', message: err.message });
        }
        next();
    });
};

exports.uploadFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'กรุณาเลือกไฟล์ที่ถูกต้อง' });
    }
    
    res.status(200).json({
        status: 'success',
        message: 'อัพโหลดสำเร็จ',
        data: {
            filename: req.file.filename,
            path: `/uploads/${req.file.filename}` 
        }
    });
};