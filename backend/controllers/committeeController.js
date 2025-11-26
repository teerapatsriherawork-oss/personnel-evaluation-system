// File: backend/controllers/committeeController.js

const db = require('../config/database');
const fs = require('fs');
const path = require('path');

// Helper สำหรับแปลง Base64 เป็นไฟล์ (ใช้สำหรับบันทึกลายเซ็น)
const saveBase64ToFile = (base64String) => {
    if (!base64String || !base64String.startsWith('data:')) return base64String;
    try {
        const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return base64String;
        const type = matches[1];
        const data = Buffer.from(matches[2], 'base64');
        let extension = 'bin';
        if (type.includes('jpeg') || type.includes('jpg')) extension = 'jpg';
        else if (type.includes('png')) extension = 'png';
        else if (type.includes('pdf')) extension = 'pdf';
        const filename = `sign-${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, filename), data);
        return `/uploads/${filename}`;
    } catch (e) {
        console.error("Save Base64 Error:", e);
        return null;
    }
};

// 1. ดึงรายชื่อผู้ที่กรรมการคนนี้ต้องประเมิน
exports.getEvaluatees = async (req, res) => {
    try {
        const evaluatorId = req.user.id;
        const { roundId } = req.params;

        // หาจำนวนข้อทั้งหมดของรอบนี้ (เพื่อคำนวณสถานะความคืบหน้า)
        const [criCount] = await db.execute('SELECT COUNT(*) as total FROM criterias WHERE round_id = ?', [roundId]);
        const totalCriteria = criCount[0].total;

        // ดึงรายชื่อจากตาราง Mapping
        const sql = `
            SELECT 
                u.id, 
                u.fullname, 
                u.department,
                u.position,
                cm.role as committee_role,
                (SELECT COUNT(*) FROM evaluations e 
                 WHERE e.round_id = cm.round_id 
                 AND e.evaluatee_id = cm.evaluatee_id 
                 AND e.evaluator_id = cm.evaluator_id) as evaluated_count
            FROM committees_mapping cm
            JOIN users u ON cm.evaluatee_id = u.id
            WHERE cm.round_id = ? AND cm.evaluator_id = ?
        `;
        
        const [rows] = await db.execute(sql, [roundId, evaluatorId]);

        // Map ข้อมูลเพื่อบอกสถานะ (Completed / In Progress / Pending)
        const evaluatees = rows.map(row => {
            let status = 'pending';
            if (totalCriteria > 0) {
                if (row.evaluated_count >= totalCriteria) status = 'completed';
                else if (row.evaluated_count > 0) status = 'in_progress';
            }
            
            return {
                ...row,
                total_criteria: totalCriteria,
                is_completed: status === 'completed',
                is_started: status === 'in_progress'
            };
        });

        res.status(200).json({ status: 'success', data: evaluatees });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// 2. ดึงข้อมูลสำหรับหน้าให้คะแนน (เกณฑ์ + คะแนนตนเอง + คะแนนที่เคยให้)
exports.getGradingInfo = async (req, res) => {
    try {
        const evaluatorId = req.user.id;
        const { roundId, evaluateeId } = req.params;

        // ดึง Criteria ทั้งหมดในรอบนี้
        const sql = `
            SELECT c.*, t.topic_name
            FROM criterias c
            JOIN topics t ON c.topic_id = t.id
            WHERE c.round_id = ?
            ORDER BY c.id ASC
        `;
        const [criterias] = await db.execute(sql, [roundId]);

        // ดึงคะแนนประเมินตนเองของ User (Self Assessment)
        const [selfEvals] = await db.execute(
            'SELECT * FROM evaluations WHERE round_id = ? AND evaluatee_id = ? AND evaluator_id = ?',
            [roundId, evaluateeId, evaluateeId]
        );

        // ดึงคะแนนที่กรรมการคนนี้เคยให้ไปแล้ว (ถ้ามี)
        const [myEvals] = await db.execute(
            'SELECT * FROM evaluations WHERE round_id = ? AND evaluatee_id = ? AND evaluator_id = ?',
            [roundId, evaluateeId, evaluatorId]
        );

        // ดึงลายเซ็นล่าสุดที่กรรมการเคยแนบ (ถ้ามี)
        let profileSignature = null;
        const lastEvalWithFile = myEvals.find(e => e.evidence_file);
        if (lastEvalWithFile) profileSignature = lastEvalWithFile.evidence_file;
        
        if (!profileSignature) {
             const [committeeData] = await db.execute('SELECT signature_path FROM users WHERE id = ?', [evaluatorId]);
             if(committeeData.length > 0) profileSignature = committeeData[0].signature_path;
        }

        const data = criterias.map(c => {
            const self = selfEvals.find(e => e.criteria_id === c.id) || {};
            const my = myEvals.find(e => e.criteria_id === c.id) || {};

            return {
                id: c.id,
                topic_name: c.topic_name,
                indicator_name: c.indicator_name,
                description: c.description,
                max_score: c.max_score,
                scoring_type: c.scoring_type,
                self_score: self.score || null,
                self_comment: self.comment || null,
                self_evidence_url: self.evidence_url || null,
                self_evidence_file: self.evidence_file || null,
                my_score: my.score || null,
                my_comment: my.comment || '',
                my_evidence_file: my.evidence_file || null,
                profile_signature: profileSignature 
            };
        });

        res.status(200).json({ status: 'success', data });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// 3. บันทึกการให้คะแนน (Submit Grading)
exports.submitGrading = async (req, res) => {
    try {
        const evaluatorId = req.user.id;
        let { round_id, criteria_id, evaluatee_id, score, comment, evidence_file } = req.body;

        if (evidence_file && evidence_file.startsWith('data:')) {
            evidence_file = saveBase64ToFile(evidence_file);
        }

        const [existing] = await db.execute(
            'SELECT id FROM evaluations WHERE round_id=? AND criteria_id=? AND evaluatee_id=? AND evaluator_id=?',
            [round_id, criteria_id, evaluatee_id, evaluatorId]
        );

        if (existing.length > 0) {
            let sql = 'UPDATE evaluations SET score=?, comment=?, updated_at=NOW()';
            let params = [score, comment];
            if (evidence_file) {
                sql += ', evidence_file=?';
                params.push(evidence_file);
            }
            sql += ' WHERE id=?';
            params.push(existing[0].id);
            await db.execute(sql, params);
        } else {
            await db.execute(
                'INSERT INTO evaluations (round_id, criteria_id, evaluatee_id, evaluator_id, score, comment, evidence_file) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [round_id, criteria_id, evaluatee_id, evaluatorId, score, comment, evidence_file]
            );
        }

        res.status(200).json({ status: 'success', message: 'Saved' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};