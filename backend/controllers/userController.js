const db = require('../config/database');

// [5.2.5] Submit Self-Assessment (Score, File Path, URL)
exports.submitSelfAssessment = async (req, res) => {
    try {
        const userId = req.user.id; // จาก Auth Middleware
        const { round_id, criteria_id, score, evidence_file, evidence_url, comment } = req.body;

        // ตรวจสอบว่ามีการส่งข้อมูลแล้วหรือยัง ถ้ามีให้ Update ถ้าไม่มี Insert
        // ในที่นี้ใช้ INSERT ... ON DUPLICATE KEY UPDATE (ต้องมี Unique constraint) หรือเช็คก่อน
        // เพื่อความง่ายและชัวร์ตาม Logic: Check -> Insert/Update
        
        const [existing] = await db.execute(
            'SELECT id FROM evaluations WHERE round_id=? AND criteria_id=? AND evaluatee_id=? AND evaluator_id=?',
            [round_id, criteria_id, userId, userId] // Self assessment: evaluator = evaluatee
        );

        if (existing.length > 0) {
            await db.execute(
                'UPDATE evaluations SET score=?, evidence_file=?, evidence_url=?, comment=? WHERE id=?',
                [score, evidence_file, evidence_url, comment, existing[0].id]
            );
        } else {
            await db.execute(
                'INSERT INTO evaluations (round_id, criteria_id, evaluatee_id, evaluator_id, score, evidence_file, evidence_url, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [round_id, criteria_id, userId, userId, score, evidence_file, evidence_url, comment]
            );
        }

        res.status(200).json({ status: 'success', message: 'Self-assessment submitted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ดึงผลประเมินของตัวเอง (เพื่อแสดงผล)
exports.getMyEvaluations = async (req, res) => {
    try {
        const userId = req.user.id;
        const { roundId } = req.params;
        const [evaluations] = await db.execute(
            'SELECT * FROM evaluations WHERE evaluatee_id = ? AND round_id = ? AND evaluator_id = ?',
            [userId, roundId, userId]
        );
        res.status(200).json({ status: 'success', data: evaluations });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// [New Function] ดึง Progress ของทุกคนสำหรับหน้า Landing Page (ไม่ต้อง Login)
exports.getPublicProgress = async (req, res) => {
    try {
        // 1. หารอบที่เปิดอยู่ (Active Round)
        const [rounds] = await db.execute("SELECT id, round_name FROM rounds WHERE status = 'open' LIMIT 1");
        
        if (rounds.length === 0) {
            return res.status(200).json({ status: 'success', data: [] }); // ไม่มีรอบที่เปิด
        }
        const roundId = rounds[0].id;

        // 2. นับจำนวนเกณฑ์ทั้งหมดในรอบนี้ (Total Criterias)
        const [criteriaCount] = await db.execute("SELECT COUNT(*) as total FROM criterias WHERE round_id = ?", [roundId]);
        const totalCriteria = criteriaCount[0].total;

        if (totalCriteria === 0) {
            return res.status(200).json({ status: 'success', data: [] });
        }

        // 3. ดึงรายชื่อ User และนับจำนวนที่ประเมินไปแล้ว (Count Submitted)
        // Logic: Join users กับ evaluations (นับเฉพาะของตัวเอง evaluator_id = evaluatee_id)
        const sql = `
            SELECT 
                u.id, 
                u.fullname, 
                u.signature_path as profile_pic, -- สมมติใช้รูปนี้แทน Avatar
                (SELECT COUNT(*) FROM evaluations e 
                 WHERE e.evaluatee_id = u.id 
                 AND e.round_id = ? 
                 AND e.evaluator_id = u.id) as submitted_count
            FROM users u
            WHERE u.role = 'user'
        `;
        
        const [users] = await db.execute(sql, [roundId]);

        // 4. คำนวณ %
        const progressData = users.map(user => ({
            id: user.id,
            fullname: user.fullname,
            submitted: user.submitted_count,
            total: totalCriteria,
            percent: Math.round((user.submitted_count / totalCriteria) * 100)
        }));

        res.status(200).json({ 
            status: 'success', 
            round_name: rounds[0].round_name,
            data: progressData 
        });

    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};