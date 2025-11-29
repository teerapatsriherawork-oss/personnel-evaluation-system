// File: backend/controllers/committeeController.js

const db = require('../config/database');
const fs = require('fs');
const path = require('path');

// [FIXED] แก้ไข Regex ให้ถูกต้อง และเพิ่ม Log
const saveBase64ToFile = (base64String) => {
    // ถ้าไม่มีข้อมูล หรือไม่ใช่ base64 (อาจเป็น path เดิม) ให้คืนค่าเดิม
    if (!base64String || typeof base64String !== 'string' || !base64String.startsWith('data:')) {
        return base64String;
    }

    try {
        // [FIXED] Regex ที่ถูกต้อง: ย้ายเครื่องหมาย - ไปไว้ท้ายสุดของ Group
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

        const filename = `sign-${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
        const uploadDir = path.join(__dirname, '../uploads');
        
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, data);
        
        console.log(`[Committee] Saved signature file: ${filename}`);
        return `/uploads/${filename}`;

    } catch (e) {
        console.error("[Base64] Error saving file:", e);
        return null;
    }
};

// 1. ดึงรายชื่อผู้ที่กรรมการคนนี้ต้องประเมิน [RESTORED]
exports.getEvaluatees = async (req, res) => {
    try {
        const evaluatorId = req.user.id;
        const { roundId } = req.params;

        const [criCount] = await db.execute('SELECT COUNT(*) as total FROM criterias WHERE round_id = ?', [roundId]);
        const totalCriteria = criCount[0].total;

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

// 2. ดึงข้อมูลสำหรับหน้าให้คะแนน [RESTORED]
exports.getGradingInfo = async (req, res) => {
    try {
        const evaluatorId = req.user.id;
        const { roundId, evaluateeId } = req.params;

        // ดึง Criteria
        const sql = `
            SELECT c.*, t.topic_name
            FROM criterias c
            JOIN topics t ON c.topic_id = t.id
            WHERE c.round_id = ?
            ORDER BY c.id ASC
        `;
        const [criterias] = await db.execute(sql, [roundId]);

        // ดึงคะแนนประเมินตนเอง
        const [selfEvals] = await db.execute(
            'SELECT * FROM evaluations WHERE round_id = ? AND evaluatee_id = ? AND evaluator_id = ?',
            [roundId, evaluateeId, evaluateeId]
        );

        // ดึงคะแนนที่กรรมการคนนี้เคยให้ไปแล้ว
        const [myEvals] = await db.execute(
            'SELECT * FROM evaluations WHERE round_id = ? AND evaluatee_id = ? AND evaluator_id = ?',
            [roundId, evaluateeId, evaluatorId]
        );

        // ดึงความคิดเห็นสรุป (Overall Comment)
        const [mappingRes] = await db.execute(
            'SELECT overall_comment FROM committees_mapping WHERE round_id = ? AND evaluator_id = ? AND evaluatee_id = ?',
            [roundId, evaluatorId, evaluateeId]
        );
        const overallComment = mappingRes.length > 0 ? mappingRes[0].overall_comment : '';

        // ดึงลายเซ็นเดิม (ถ้าเคยเซ็นไว้ในข้อแรก หรือจาก Profile)
        let profileSignature = null;
        const lastEvalWithFile = myEvals.find(e => e.evidence_file);
        if (lastEvalWithFile) profileSignature = lastEvalWithFile.evidence_file;
        
        if (!profileSignature) {
             const [committeeData] = await db.execute('SELECT signature_path FROM users WHERE id = ?', [evaluatorId]);
             if(committeeData.length > 0) profileSignature = committeeData[0].signature_path;
        }

        const data = criterias.map(c => {
            const self = selfEvals.find(e => e.criteria_id === c.id);
            const my = myEvals.find(e => e.criteria_id === c.id);

            return {
                id: c.id,
                topic_name: c.topic_name,
                indicator_name: c.indicator_name,
                description: c.description,
                max_score: c.max_score,
                scoring_type: c.scoring_type,
                
                // ข้อมูลประเมินตนเอง
                self_score: (self && self.score != null) ? self.score : null,
                self_comment: self ? self.comment : null,
                self_evidence_url: self ? self.evidence_url : null,
                self_evidence_file: self ? self.evidence_file : null,
                
                // ข้อมูลที่กรรมการเคยประเมินไว้
                my_score: (my && my.score != null) ? my.score : null,
                my_comment: my ? my.comment : '',
                my_evidence_file: my ? my.evidence_file : null,
                profile_signature: profileSignature 
            };
        });

        res.status(200).json({ status: 'success', data, overall_comment: overallComment });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// 3. บันทึกการให้คะแนนรายข้อ [UPDATED Fix Base64 Logic]
exports.submitGrading = async (req, res) => {
    try {
        const evaluatorId = req.user.id;
        let { round_id, criteria_id, evaluatee_id, score, comment, evidence_file } = req.body;

        // แปลงไฟล์ถ้ามี
        if (evidence_file && evidence_file.startsWith('data:')) {
            const savedPath = saveBase64ToFile(evidence_file);
            if (savedPath) {
                evidence_file = savedPath;
            } else {
                // ถ้า save ไม่ผ่าน (return null) ให้ใช้ค่าเดิมหรือไม่บันทึกทับ
                evidence_file = null; 
            }
        }

        const [existing] = await db.execute(
            'SELECT id FROM evaluations WHERE round_id=? AND criteria_id=? AND evaluatee_id=? AND evaluator_id=?',
            [round_id, criteria_id, evaluatee_id, evaluatorId]
        );

        if (existing.length > 0) {
            let sql = 'UPDATE evaluations SET score=?, comment=?, updated_at=NOW()';
            let params = [score, comment];
            
            // อัปเดตไฟล์เฉพาะเมื่อมีการส่งไฟล์ใหม่มา (ไม่เป็น null)
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
        console.error("Submit Grading Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// 4. บันทึกความคิดเห็นสรุป (Overall Comment)
exports.submitOverallComment = async (req, res) => {
    try {
        const evaluatorId = req.user.id;
        const { round_id, evaluatee_id, comment } = req.body;

        await db.execute(
            'UPDATE committees_mapping SET overall_comment = ? WHERE round_id = ? AND evaluator_id = ? AND evaluatee_id = ?',
            [comment, round_id, evaluatorId, evaluatee_id]
        );

        res.status(200).json({ status: 'success', message: 'Overall comment saved' });
    } catch (error) {
        console.error("Submit Overall Comment Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};