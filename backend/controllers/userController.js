const db = require('../config/database');
const fs = require('fs');
const path = require('path');

// Helper: แปลง Base64 เป็นไฟล์ลง Disk
const saveBase64ToFile = (base64String) => {
    if (!base64String || !base64String.startsWith('data:')) return base64String;

    try {
        // แยก Header ออก (เช่น data:image/png;base64,)
        const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return base64String; // รูปแบบไม่ถูกต้อง คืนค่าเดิมไป
        }

        const type = matches[1];
        const data = Buffer.from(matches[2], 'base64');
        
        // สร้างนามสกุลไฟล์
        let extension = 'bin';
        if (type.includes('jpeg') || type.includes('jpg')) extension = 'jpg';
        else if (type.includes('png')) extension = 'png';
        else if (type.includes('pdf')) extension = 'pdf';

        // สร้างชื่อไฟล์สุ่ม
        const filename = `upload-${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
        const uploadDir = path.join(__dirname, '../uploads');
        
        // ตรวจสอบว่ามีโฟลเดอร์ uploads ไหม
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // บันทึกลงเครื่อง
        fs.writeFileSync(path.join(uploadDir, filename), data);
        
        console.log(`[Base64] Saved file to: /uploads/${filename}`);
        return `/uploads/${filename}`; // คืนค่าเป็น Path เพื่อบันทึกลง DB

    } catch (error) {
        console.error("[Base64] Error saving file:", error);
        return null;
    }
};

// Submit Self-Assessment
exports.submitSelfAssessment = async (req, res) => {
    try {
        const userId = req.user.id;
        let { round_id, criteria_id, score, evidence_file, evidence_url, comment } = req.body;

        // [NEW] จัดการแปลง Base64 เป็นไฟล์ (ถ้ามีการส่งมาแบบ Base64)
        // เพื่อให้ Database เก็บแค่ Path สั้นๆ ไม่ error 'Data too long'
        if (evidence_file && evidence_file.startsWith('data:')) {
            evidence_file = saveBase64ToFile(evidence_file);
        }

        const [existing] = await db.execute(
            'SELECT id FROM evaluations WHERE round_id=? AND criteria_id=? AND evaluatee_id=? AND evaluator_id=?',
            [round_id, criteria_id, userId, userId]
        );

        if (existing.length > 0) {
            // ถ้าเป็น null (เช่น saveBase64ToFile error) ไม่ต้องอัปเดต field นั้น
            let sql = 'UPDATE evaluations SET score=?, evidence_url=?, comment=?';
            let params = [score, evidence_url, comment];

            if (evidence_file !== undefined) {
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

// [FIX] แก้ไขฟังก์ชันนี้: ดึงผลประเมินทั้งหมดของฉัน (ทั้งที่ประเมินเอง และกรรมการประเมินให้)
exports.getMyEvaluations = async (req, res) => {
    try {
        const userId = req.user.id;
        const { roundId } = req.params;
        
        // เอาเงื่อนไข evaluator_id = ? ออก เพื่อให้เห็นคะแนนที่คนอื่นประเมินเราด้วย
        const [evaluations] = await db.execute(
            'SELECT * FROM evaluations WHERE evaluatee_id = ? AND round_id = ?',
            [userId, roundId]
        );
        res.status(200).json({ status: 'success', data: evaluations });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Public Progress (คงเดิม)
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