const db = require('../config/database');

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

exports.getGradingInfo = async (req, res) => {
    try {
        const evaluatorId = req.user.id;
        const { roundId, evaluateeId } = req.params;

        // 1. ดึงเกณฑ์ + JOIN Topics เพื่อเอา topic_name
        const [criterias] = await db.execute(
            `SELECT c.*, t.topic_name 
             FROM criterias c
             JOIN topics t ON c.topic_id = t.id
             WHERE c.round_id = ?`, 
            [roundId]
        );

        // 2. ดึงการประเมินที่มีอยู่แล้ว
        const [evaluations] = await db.execute(
            `SELECT * FROM evaluations 
             WHERE round_id = ? 
             AND evaluatee_id = ? 
             AND (evaluator_id = ? OR evaluator_id = ?)`,
            [roundId, evaluateeId, evaluateeId, evaluatorId]
        );

        // 3. จับคู่ข้อมูล
        const result = criterias.map(cri => {
            const selfEval = evaluations.find(e => e.criteria_id === cri.id && e.evaluator_id == evaluateeId);
            const myEval = evaluations.find(e => e.criteria_id === cri.id && e.evaluator_id == evaluatorId);

            return {
                ...cri,
                self_score: selfEval ? selfEval.score : null,
                self_comment: selfEval ? selfEval.comment : null,
                self_evidence_url: selfEval ? selfEval.evidence_url : null,
                self_evidence_file: selfEval ? selfEval.evidence_file : null,
                my_score: myEval ? myEval.score : 0, 
                my_comment: myEval ? myEval.comment : ''
            };
        });

        res.status(200).json({ status: 'success', data: result });

    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.submitGrading = async (req, res) => {
    try {
        const evaluatorId = req.user.id;
        const { round_id, criteria_id, evaluatee_id, score, comment, evidence_file } = req.body;

        const [mapping] = await db.execute(
            'SELECT * FROM committees_mapping WHERE round_id=? AND evaluator_id=? AND evaluatee_id=?',
            [round_id, evaluatorId, evaluatee_id]
        );

        if (mapping.length === 0) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to evaluate this user' });
        }

        const [existing] = await db.execute(
            'SELECT id FROM evaluations WHERE round_id=? AND criteria_id=? AND evaluatee_id=? AND evaluator_id=?',
            [round_id, criteria_id, evaluatee_id, evaluatorId]
        );

        if (existing.length > 0) {
            let sql = 'UPDATE evaluations SET score=?, comment=?';
            const params = [score, comment];
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
                [round_id, criteria_id, evaluatee_id, evaluatorId, score, comment, evidence_file || null]
            );
        }

        res.status(200).json({ status: 'success', message: 'Grading submitted successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};