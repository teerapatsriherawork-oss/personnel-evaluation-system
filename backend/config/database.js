// [4] เขียนโค้ด Backend Base (Full Code)
// [4] เชื่อมต่อ MySQL (ใช้ process.env อ่านค่า)
const mysql = require('mysql2');
require('dotenv').config({ path: '../.env' }); // โหลด .env จาก root

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Export pool ที่พร้อมใช้งานแบบ async/await
module.exports = pool.promise();