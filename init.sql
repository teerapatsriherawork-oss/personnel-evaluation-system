-- init.sql
USE personnel_eval_db;

-- 1. ตาราง Users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    role ENUM('admin', 'user', 'committee') NOT NULL,
    signature_path VARCHAR(255) NULL
);

-- 2. ตาราง Rounds
CREATE TABLE IF NOT EXISTS rounds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    round_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('open', 'closed') NOT NULL DEFAULT 'open'
);

-- 3. [NEW] ตาราง Topics (หัวข้อการประเมิน)
CREATE TABLE IF NOT EXISTS topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    round_id INT NOT NULL,
    topic_name VARCHAR(100) NOT NULL,
    
    FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE
);

-- 4. ตาราง Criterias (ตัวชี้วัด)
-- [CHANGE] เปลี่ยนจาก topic_name เป็น topic_id เพื่อผูกกับตาราง topics
CREATE TABLE IF NOT EXISTS criterias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    round_id INT NOT NULL,
    topic_id INT NOT NULL, 
    indicator_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    max_score INT NOT NULL DEFAULT 10,
    scoring_type ENUM('scale', 'boolean') NOT NULL DEFAULT 'scale',
    
    FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

-- 5. ตาราง Mapping กรรมการ
CREATE TABLE IF NOT EXISTS committees_mapping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    round_id INT NOT NULL,
    evaluator_id INT NOT NULL,
    evaluatee_id INT NOT NULL,
    role ENUM('chairman', 'member') NOT NULL,
    
    FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluatee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. ตาราง Evaluations (ผลประเมิน)
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
    
    FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
    FOREIGN KEY (criteria_id) REFERENCES criterias(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluatee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE SET NULL
);

-- (Optional) Insert Default Admin User
-- Password: password123 (Hash อาจต้องเจนใหม่ตามโค้ดคุณ แต่ใส่อันนี้ไว้เป็นตัวอย่าง)
-- INSERT INTO users (username, password_hash, fullname, role) VALUES 
-- ('admin', '$2a$10$..........', 'Admin User', 'admin');