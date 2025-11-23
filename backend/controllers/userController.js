const db = require('../config/database');

// Submit Self-Assessment
exports.submitSelfAssessment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { round_id, criteria_id, score, evidence_file, evidence_url, comment } = req.body;

        const [existing] = await db.execute(
            'SELECT id FROM evaluations WHERE round_id=? AND criteria_id=? AND evaluatee_id=? AND evaluator_id=?',
            [round_id, criteria_id, userId, userId]
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