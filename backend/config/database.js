// File: backend/config/database.js

const mysql = require('mysql2');
require('dotenv').config({ path: '../.env' }); 

// Create Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'personnel_eval_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Export as Promise-based pool
module.exports = pool.promise();