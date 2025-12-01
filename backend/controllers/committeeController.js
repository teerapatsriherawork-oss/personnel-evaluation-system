// File: backend/controllers/committeeController.js

const db = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Helper: บันทึกไฟล์จาก Base64 String
 */
const saveBase64ToFile = (base64String) => {
    // ถ้าไม่ใช่ Base64 หรือเป็น path เดิม ให้คืนค่าเดิม
    if (!base64String || typeof base64String !== 'string' || !base64String.startsWith('data:')) {
        return base64String;
    }

    try {
        // Regex สำหรับแยก Header และ Data ของ Base64
        const matches = base64String.match(/^data:([A-Za-z0-9+\/-]+);base64,(.+)$/);
        
        if (!matches || matches.length !== 3) {
            console.error("[Committee] Invalid Base64 format");
            return null;
        }

        const mimeType = matches[1];
        const fileData = Buffer.from(matches[2], 'base64');
        
        // กำหนดนามสกุลไฟล์ตาม Mime Type
        let extension = 'bin';
        if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
        else if (mimeType.includes('png')) extension = 'png';
        else if (mimeType.includes('pdf')) extension = 'pdf';

        const filename = `sign-${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
        const uploadDir = path.join(__dirname, '../uploads');
        
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, fileData);
        
        return `/uploads/${filename}`;

    } catch (e) {
        console.error("[Committee] Error saving file:", e);
        return null;
    }
};

/**
 * ดึงรายชื่อผู้ที่กรรมการคนนี้ต้องประเมิน
 */
exports.getEvaluatees = async (req, res) => {
    try {
        const evaluatorId = req.user.id;
        const { roundId } = req.params;

        // หาจำนวนเกณฑ์ทั้งหมดในรอบนี้เพื่อคำนวณสถานะความคืบหน้า
        const [countResult] = await db.execute('SELECT COUNT(*) as total FROM criterias WHERE round_id = ?', [roundId]);
        const totalCriteria = countResult[0].total;

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
        
        const [evaluateesList] = await db.execute(sql, [roundId, evaluatorId]);

        const formattedData = evaluateesList.map(evaluateeData => {
            let status = 'pending';
            if (totalCriteria > 0) {
                if (evaluateeData.evaluated_count >= totalCriteria) status = 'completed';
                else if (evaluateeData.evaluated_count > 0) status = 'in_progress';
            }
            
            return {
                ...evaluateeData,
                total_criteria: totalCriteria,
                is_completed: status === 'completed',
                is_started: status === 'in_progress'
            };
        });

        res.status(200).json({ status: 'success', data: formattedData });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * ดึงข้อมูลสำหรับหน้าให้คะแนน (Grading Interface)
 */
exports.getGradingInfo = async (req, res) => {
    try {
        const evaluatorId = req.user.id;
        const { roundId, evaluateeId } = req.params;

        // 1. ดึงเกณฑ์ทั้งหมด
        const sqlCriteria = `
            SELECT c.*, t.topic_name
            FROM criterias c
            JOIN topics t ON c.topic_id = t.id
            WHERE c.round_id = ?
            ORDER BY c.id ASC
        `;
        const [criterias] = await db.execute(sqlCriteria, [roundId]);

        // 2. ดึงคะแนนประเมินตนเองของผู้ถูกประเมิน
        const [selfEvals] = await db.execute(
            'SELECT * FROM evaluations WHERE round_id = ? AND evaluatee_id = ? AND evaluator_id = ?',
            [roundId, evaluateeId, evaluateeId]
        );

        // 3. ดึงคะแนนที่กรรมการคนนี้เคยให้ไว้ (ถ้ามี)
        const [myEvals] = await db.execute(
            'SELECT * FROM evaluations WHERE round_id = ? AND evaluatee_id = ? AND evaluator_id = ?',
            [roundId, evaluateeId, evaluatorId]
        );

        // 4. ดึงความคิดเห็นสรุป (Overall Comment)
        const [mappingRes] = await db.execute(
            'SELECT overall_comment FROM committees_mapping WHERE round_id = ? AND evaluator_id = ? AND evaluatee_id = ?',
            [roundId, evaluatorId, evaluateeId]
        );
        const overallComment = mappingRes.length > 0 ? mappingRes[0].overall_comment : '';

        // 5. จัดการลายเซ็น (ใช้จากไฟล์ที่แนบในข้อแรก หรือจาก Profile)
        let profileSignature = null;
        const lastEvalWithFile = myEvals.find(e => e.evidence_file);
        if (lastEvalWithFile) {
            profileSignature = lastEvalWithFile.evidence_file;
        } else {
             const [committeeData] = await db.execute('SELECT signature_path FROM users WHERE id = ?', [evaluatorId]);
             if(committeeData.length > 0) profileSignature = committeeData[0].signature_path;
        }

        // 6. รวมข้อมูล
        const data = criterias.map(criteriaItem => {
            const selfData = selfEvals.find(e => e.criteria_id === criteriaItem.id);
            const myData = myEvals.find(e => e.criteria_id === criteriaItem.id);

            return {
                id: criteriaItem.id,
                topic_name: criteriaItem.topic_name,
                indicator_name: criteriaItem.indicator_name,
                description: criteriaItem.description,
                max_score: criteriaItem.max_score,
                scoring_type: criteriaItem.scoring_type,
                
                // ข้อมูลของ User (Self Assessment)
                self_score: (selfData && selfData.score != null) ? selfData.score : null,
                self_comment: selfData ? selfData.comment : null,
                self_evidence_url: selfData ? selfData.evidence_url : null,
                self_evidence_file: selfData ? selfData.evidence_file : null,
                
                // ข้อมูลของ Committee (Grading)
                my_score: (myData && myData.score != null) ? myData.score : null,
                my_comment: myData ? myData.comment : '',
                my_evidence_file: myData ? myData.evidence_file : null,
                profile_signature: profileSignature 
            };
        });

        res.status(200).json({ status: 'success', data, overall_comment: overallComment });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * บันทึกคะแนนรายข้อ
 */
exports.submitGrading = async (req, res) => {
    try {
        const evaluatorId = req.user.id;
        let { round_id, criteria_id, evaluatee_id, score, comment, evidence_file } = req.body;

        // จัดการไฟล์แนบ (เช่น ลายเซ็น)
        if (evidence_file && evidence_file.startsWith('data:')) {
            const savedPath = saveBase64ToFile(evidence_file);
            if (savedPath) {
                evidence_file = savedPath;
            } else {
                evidence_file = null; 
            }
        }

        const [existing] = await db.execute(
            'SELECT id FROM evaluations WHERE round_id=? AND criteria_id=? AND evaluatee_id=? AND evaluator_id=?',
            [round_id, criteria_id, evaluatee_id, evaluatorId]
        );

        if (existing.length > 0) {
            // Update
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
            // Insert
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

/**
 * บันทึกความคิดเห็นสรุป
 */
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