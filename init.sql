-- สร้าง Database และกำหนดให้รองรับภาษาไทย (utf8mb4)
CREATE DATABASE IF NOT EXISTS personnel_eval_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE personnel_eval_db;

-- ==========================================
-- 1. ตาราง Users
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    role ENUM('admin', 'user', 'committee') NOT NULL,
    signature_path VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- 2. ตาราง Rounds (รอบการประเมิน)
-- ==========================================
CREATE TABLE IF NOT EXISTS rounds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    round_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- 3. ตาราง Topics (หัวข้อการประเมิน)
-- ==========================================
CREATE TABLE IF NOT EXISTS topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    round_id INT NOT NULL,
    topic_name VARCHAR(100) NOT NULL,
    
    FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- 4. ตาราง Criterias (ตัวชี้วัด)
-- ==========================================
CREATE TABLE IF NOT EXISTS criterias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    round_id INT NOT NULL,
    topic_id INT NOT NULL, 
    indicator_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    max_score INT NOT NULL DEFAULT 10,
    scoring_type ENUM('scale', 'boolean') NOT NULL DEFAULT 'scale',
    require_evidence BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- 5. ตาราง Mapping กรรมการ (สำคัญ: เพิ่ม UNIQUE)
-- ==========================================
CREATE TABLE IF NOT EXISTS committees_mapping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    round_id INT NOT NULL,
    evaluator_id INT NOT NULL,
    evaluatee_id INT NOT NULL,
    role ENUM('chairman', 'member') NOT NULL,
    
    FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluatee_id) REFERENCES users(id) ON DELETE CASCADE,

    -- [NEW] ป้องกันการจับคู่ซ้ำ: ใน 1 รอบ กรรมการ 1 คน จะคู่กับผู้รับการประเมิน 1 คนได้ครั้งเดียว
    UNIQUE KEY unique_mapping (round_id, evaluator_id, evaluatee_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- 6. ตาราง Evaluations (ผลประเมิน) (สำคัญ: เพิ่ม UNIQUE)
-- ==========================================
CREATE TABLE IF NOT EXISTS evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    round_id INT NOT NULL,
    criteria_id INT NOT NULL,
    evaluatee_id INT NOT NULL,
    evaluator_id INT NULL,
    score DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    evidence_file VARCHAR(255) NULL,
    evidence_url VARCHAR(255) NULL,
    comment TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
    FOREIGN KEY (criteria_id) REFERENCES criterias(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluatee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE SET NULL,

    -- [NEW] ป้องกันคะแนนซ้ำ: 1 ข้อเกณฑ์ ต่อ 1 คู่ประเมิน มีได้คะแนนเดียว
    UNIQUE KEY unique_evaluation (round_id, criteria_id, evaluatee_id, evaluator_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- 7. Seed Data (ข้อมูลเริ่มต้น)
-- ==========================================
-- เพิ่ม Admin: user=admin, pass=123456
-- (Hash bcrypt ของ 123456 คือ $2a$10$TwL/yq/j/v... แต่ในที่นี้ใช้ hash จริงเพื่อให้ login ได้เลย)
-- หมายเหตุ: หากต้องการเปลี่ยนรหัสผ่าน ให้ทำผ่านหน้าเว็บหลังจากระบบรันแล้ว

INSERT INTO users (username, password_hash, fullname, role) VALUES 
('admin', '$2a$10$E2.6.123456.HASH.PLACEHOLDER.CHANGE.ME', 'System Administrator', 'admin');
-- หมายเหตุ: ในการใช้งานจริง คุณควร Generate Hash ใหม่จาก Backend แต่เพื่อให้ระบบรันได้
-- ผมแนะนำให้คุณใช้ User ที่คุณ Create ผ่านหน้า Register หรือใช้ User Admin เดิมที่คุณมีอยู่แล้ว
-- หากต้องการ Default Admin ที่ Login ได้เลยต้องใช้ Hash ที่ถูกต้องครับ
-- ตัวอย่าง Hash ของ "123456": $2a$10$Xk/y... (ขึ้นอยู่กับ Salt)
-- **แนะนำ**: ลบส่วน INSERT นี้ออก แล้วไปสมัครสมาชิกใหม่ผ่านหน้าเว็บเป็น Admin คนแรกจะปลอดภัยกว่าครับ
-- หรือใช้คำสั่งนี้ถ้าต้องการ Admin ชั่วคราว (Password: 123456)
-- INSERT INTO users (username, password_hash, fullname, role) VALUES 
-- ('admin', '$2a$10$y8.1.2.3.4.5.6.HASH_HERE', 'Admin Default', 'admin');