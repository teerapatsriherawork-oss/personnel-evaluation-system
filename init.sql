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
    email VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    position VARCHAR(100) NULL,
    department VARCHAR(100) NULL,
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
-- 5. ตาราง Mapping กรรมการ (อัปเดตเพิ่ม overall_comment)
-- ==========================================
CREATE TABLE IF NOT EXISTS committees_mapping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    round_id INT NOT NULL,
    evaluator_id INT NOT NULL,
    evaluatee_id INT NOT NULL,
    role ENUM('chairman', 'member') NOT NULL,
    overall_comment TEXT NULL, -- [NEW] ช่องเก็บความคิดเห็นสรุป
    
    FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluatee_id) REFERENCES users(id) ON DELETE CASCADE,

    UNIQUE KEY unique_mapping (round_id, evaluator_id, evaluatee_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==========================================
-- 6. ตาราง Evaluations (ผลประเมิน)
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

    UNIQUE KEY unique_evaluation (round_id, criteria_id, evaluatee_id, evaluator_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;