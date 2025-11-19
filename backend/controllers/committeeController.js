const db = require('../config/database');

// ดึงรายชื่อผู้ที่กรรมการคนนี้ต้องประเมิน
exports.getEvaluatees = async (req, res) => {
    try {
        const evaluatorId = req.user.id;
        const { roundId } = req.params;

        const sql = `
            SELECT u.id, u.fullname, u.role, cm.role as committee_role
            FROM committees_mapping cm
            JOIN users u ON cm.evaluatee_id = u.id
            WHERE cm.evaluator_id = ? AND cm.round_id = ?
        `;
        const [evaluatees] = await db.execute(sql, [evaluatorId, roundId]);
        res.status(200).json({ status: 'success', data: evaluatees });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// [5.3.4, 5.3.5, 5.3.7] Submit Grading (Score, Comment)
exports.submitGrading = async (req, res) => {
    try {
        const evaluatorId = req.user.id;
        const { round_id, criteria_id, evaluatee_id, score, comment } = req.body;

        // เช็คสิทธิ์ก่อนว่าจับคู่กันจริงไหม (Optional but recommended)
        const [mapping] = await db.execute(
            'SELECT * FROM committees_mapping WHERE round_id=? AND evaluator_id=? AND evaluatee_id=?',
            [round_id, evaluatorId, evaluatee_id]
        );

        if (mapping.length === 0) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to evaluate this user' });
        }

        // Insert/Update Evaluation
        const [existing] = await db.execute(
            'SELECT id FROM evaluations WHERE round_id=? AND criteria_id=? AND evaluatee_id=? AND evaluator_id=?',
            [round_id, criteria_id, evaluatee_id, evaluatorId]
        );

        if (existing.length > 0) {
            await db.execute(
                'UPDATE evaluations SET score=?, comment=? WHERE id=?',
                [score, comment, existing[0].id]
            );
        } else {
            await db.execute(
                'INSERT INTO evaluations (round_id, criteria_id, evaluatee_id, evaluator_id, score, comment) VALUES (?, ?, ?, ?, ?, ?)',
                [round_id, criteria_id, evaluatee_id, evaluatorId, score, comment]
            );
        }

        res.status(200).json({ status: 'success', message: 'Grading submitted successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};