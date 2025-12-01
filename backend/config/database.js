// File: backend/config/database.js

// 1. นำเข้า library mysql2 เพื่อใช้คุยกับ database
const mysql = require('mysql2');
// 2. โหลด environment variables จากไฟล์ .env
// หมายเหตุ: path: '../.env' แปลว่าไฟล์ .env อยู่นอกโฟลเดอร์ backend ไป 1 ชั้น
// หากรันแล้วหาค่าไม่เจอ ให้ลองเช็ค path นี้ดีๆ ครับ
require('dotenv').config({ path: '../.env' }); 

// 3. สร้าง Connection Pool (บ่อพักการเชื่อมต่อ)
// การใช้ Pool ช่วยให้แอปรองรับ user ได้เยอะขึ้นโดย server ไม่ล่ม
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',                 // Host: ที่อยู่ของ database (ถ้าเครื่องตัวเองคือ localhost)
  user: process.env.DB_USER || 'root',                      // User: ชื่อผู้ใช้งาน database
  password: process.env.DB_PASSWORD || '',                  // Password: รหัสผ่าน (สำคัญ! ห้าม hardcode รหัสจริงไว้ตรงนี้ ให้ดึงจาก .env)  
  database: process.env.DB_NAME || 'personnel_eval_db',     // Database: ชื่อฐานข้อมูลที่เราจะเข้าไปใช้งาน
  port: process.env.DB_PORT || 3306,                        // Port: ปกติ MySQL ใช้ 3306
  // --- Config สำหรับ Pool (Advanced) ---
  waitForConnections: true,                                 // waitForConnections: ถ้าคนใช้งานเต็ม 10 คน คนที่ 11 จะต้อง "รอ" หรือ "ถูกดีดออก" (true = ให้รอ)
  connectionLimit: 10,                                      // connectionLimit: จำนวนการเชื่อมต่อสูงสุดที่เปิดพร้อมกันได้ (ปกติ 10 สำหรับ dev)
  queueLimit: 0                                             // queueLimit: จำนวนคิวสูงสุดที่รอต่อแถวได้ (0 = ไม่จำกัด รอไปเรื่อยๆ)
});

// 4. Export ออกไปแบบ Promise
module.exports = pool.promise();                            // เพื่อให้ไฟล์อื่นเรียกใช้ด้วย async/await ได้ (เช่น: const [rows] = await db.execute(...))