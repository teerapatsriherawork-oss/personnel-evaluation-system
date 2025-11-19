// [4] เขียนโค้ด Backend Base (Full Code)
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: '../.env' }); // โหลด .env จาก root

// [4] Setup Express, CORS
const app = express();
app.use(cors());

// [4] Setup BodyParser (JSON และ URL-encoded)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// [4] Serve Static '/uploads'
// ให้ Client สามารถเข้าถึงไฟล์ที่อัปโหลดผ่าน URL /uploads/filename.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes (จะสร้างใน Part ถัดไป)
// const apiRoutes = require('./routes/apiRoutes');
// app.use('/api', apiRoutes);

// Endpoint ทดสอบ
app.get('/', (req, res) => {
  res.send('Personnel Evaluation System API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});

// วิธีเชื่อมต่อใน server.js (เพิ่่มทีหลัง)
const apiRoutes = require('./routes/apiRoutes');
app.use('/api', apiRoutes);