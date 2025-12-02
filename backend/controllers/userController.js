// File: backend/controllers/userController.js

const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// [FIXED] Helper: แปลง Base64 เป็นไฟล์ลง Disk (แก้ Regex แล้ว)
const saveBase64ToFile = (base64String) => {
    if (!base64String || typeof base64String !== 'string' || !base64String.startsWith('data:')) {
        return base64String;
    }

    try {
        // [FIXED Regex]
        const matches = base64String.match(/^data:([A-Za-z0-9+\/-]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            console.error("[Base64] Invalid format pattern");
            return null;
        }

        const type = matches[1];
        const data = Buffer.from(matches[2], 'base64');
        
        let extension = 'bin';
        if (type.includes('jpeg') || type.includes('jpg')) extension = 'jpg';
        else if (type.includes('png')) extension = 'png';
        else if (type.includes('pdf')) extension = 'pdf';

        const filename = `upload-${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
        const uploadDir = path.join(__dirname, '../uploads');
        
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, data);
        
        console.log(`[User] Saved file: ${filename}`);
        return `/uploads/${filename}`;

    } catch (error) {
        console.error("[Base64] Error saving file:", error);
        throw error;
    }
};

// [RESTORED] ดึงข้อมูลส่วนตัว (Profile)
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await db.execute(
            'SELECT id, username, fullname, role, signature_path, email, phone, position, department FROM users WHERE id = ?',
            [userId]
        );
        if (users.length === 0) return res.status(404).json({ status: 'error', message: 'User not found' });
        
        res.status(200).json({ status: 'success', data: users[0] });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// [UPDATED] อัปเดตข้อมูลส่วนตัว (ใช้ saveBase64ToFile แบบใหม่)
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        let { fullname, email, phone, position, department, signature_file, password } = req.body;

        // จัดการรูปภาพลายเซ็น
        if (signature_file && signature_file.startsWith('data:')) {
            signature_file = saveBase64ToFile(signature_file);
        }

        let sql = 'UPDATE users SET fullname=?, email=?, phone=?, position=?, department=?';
        let params = [fullname, email, phone, position, department];

        // ถ้ามีการเปลี่ยนลายเซ็น (signature_file มีค่าและไม่ใช่ null)
        if (signature_file) {
            sql += ', signature_path=?';
            params.push(signature_file);
        }

        // ถ้ามีการเปลี่ยนรหัสผ่าน
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            sql += ', password_hash=?';
            params.push(hash);
        }

        sql += ' WHERE id=?';
        params.push(userId);

        await db.execute(sql, params);

        res.status(200).json({ status: 'success', message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// [RESTORED] Submit Self-Assessment
exports.submitSelfAssessment = async (req, res) => {
    try {
        const userId = req.user.id;
        let { round_id, criteria_id, score, evidence_file, evidence_url, comment } = req.body;

        if (evidence_file && evidence_file.startsWith('data:')) {
            evidence_file = saveBase64ToFile(evidence_file);
        }

        const [existing] = await db.execute(
            'SELECT id FROM evaluations WHERE round_id=? AND criteria_id=? AND evaluatee_id=? AND evaluator_id=?',
            [round_id, criteria_id, userId, userId]
        );

        if (existing.length > 0) {
            let sql = 'UPDATE evaluations SET score=?, evidence_url=?, comment=?';
            let params = [score, evidence_url, comment];

            if (evidence_file !== undefined && evidence_file !== null) {
                sql += ', evidence_file=?';
                params.push(evidence_file);
            }

            sql += ' WHERE id=?';
            params.push(existing[0].id);

            await db.execute(sql, params);
        } else {
            await db.execute(
                'INSERT INTO evaluations (round_id, criteria_id, evaluatee_id, evaluator_id, score, evidence_file, evidence_url, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [round_id, criteria_id, userId, userId, score, evidence_file, evidence_url, comment]
            );
        }

        res.status(200).json({ status: 'success', message: 'Self-assessment submitted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// [RESTORED] Get My Evaluations
exports.getMyEvaluations = async (req, res) => {
    try {
        const userId = req.user.id;
        const { roundId } = req.params;
        
        const [evaluations] = await db.execute(
            'SELECT * FROM evaluations WHERE evaluatee_id = ? AND round_id = ?',
            [userId, roundId]
        );
        res.status(200).json({ status: 'success', data: evaluations });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// [RESTORED] Public Progress
exports.getPublicProgress = async (req, res) => {
    try {
        const [rounds] = await db.execute("SELECT id, round_name FROM rounds WHERE status = 'open' LIMIT 1");
        if (rounds.length === 0) return res.status(200).json({ status: 'success', data: [] });
        const roundId = rounds[0].id;

        const [criteriaCount] = await db.execute("SELECT COUNT(*) as total FROM criterias WHERE round_id = ?", [roundId]);
        const totalCriteria = criteriaCount[0].total;
        if (totalCriteria === 0) return res.status(200).json({ status: 'success', data: [] });

        const sql = `
            SELECT 
                u.id, 
                u.fullname, 
                u.signature_path as profile_pic,
                (SELECT COUNT(*) FROM evaluations e 
                 WHERE e.evaluatee_id = u.id 
                 AND e.round_id = ? 
                 AND e.evaluator_id = u.id) as submitted_count
            FROM users u
            WHERE u.role = 'user'
        `;
        const [users] = await db.execute(sql, [roundId]);

        const progressData = users.map(user => ({
            id: user.id,
            fullname: user.fullname,
            submitted: user.submitted_count,
            total: totalCriteria,
            percent: Math.round((user.submitted_count / totalCriteria) * 100)
        }));

        res.status(200).json({ status: 'success', round_name: rounds[0].round_name, data: progressData });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};