-- [2] สร้างตารางใน Database ที่กำหนด
USE personnel_eval_db;

-- [2.1] ตารางที่ 1: users
-- [2.3] ใช้ Data Type ที่หลากหลาย (ENUM, VARCHAR, INT)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    role ENUM('admin', 'user', 'committee') NOT NULL,
    signature_path VARCHAR(255) NULL
);

-- [2.1] ตารางที่ 2: rounds
CREATE TABLE IF NOT EXISTS rounds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    round_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('open', 'closed') NOT NULL DEFAULT 'open'
);

-- [2.1] ตารางที่ 3: criterias
-- [2.2] มีความสัมพันธ์ (Relational) กับ 'rounds'
CREATE TABLE IF NOT EXISTS criterias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    round_id INT NOT NULL,
    topic_name VARCHAR(100) NOT NULL,
    indicator_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    max_score INT NOT NULL DEFAULT 10,
    scoring_type ENUM('scale', 'boolean') NOT NULL DEFAULT 'scale',
    
    FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE
);

-- [2.1] ตารางที่ 4: committees_mapping
-- [2.2] มีความสัมพันธ์ (Relational) กับ 'rounds' และ 'users'
CREATE TABLE IF NOT EXISTS committees_mapping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    round_id INT NOT NULL,
    evaluator_id INT NOT NULL, -- FK to users.id (กรรมการ)
    evaluatee_id INT NOT NULL, -- FK to users.id (ผู้ถูกประเมิน)
    role ENUM('chairman', 'member') NOT NULL,
    
    FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluatee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- [2.1] ตารางที่ 5: evaluations (>3 ตาราง)
-- [2.2] มีความสัมพันธ์ (Relational) กับ 4 ตาราง
CREATE TABLE IF NOT EXISTS evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    round_id INT NOT NULL,
    criteria_id INT NOT NULL,
    evaluatee_id INT NOT NULL,
    evaluator_id INT NULL, -- [2] ตามโจทย์ (FK/Nullable)
    score DECIMAL(5, 2) NOT NULL DEFAULT 0.00, -- [2.3] ใช้ DECIMAL
    evidence_file VARCHAR(255) NULL,
    evidence_url VARCHAR(255) NULL,
    comment TEXT NULL,
    
    FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
    FOREIGN KEY (criteria_id) REFERENCES criterias(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluatee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE SET NULL
);