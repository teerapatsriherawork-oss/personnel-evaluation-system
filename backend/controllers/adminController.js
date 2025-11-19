const db = require('../config/database');

// [5.1.2] CRUD Rounds
exports.createRound = async (req, res) => {
    try {
        const { round_name, start_date, end_date } = req.body;
        const [result] = await db.execute(
            'INSERT INTO rounds (round_name, start_date, end_date, status) VALUES (?, ?, ?, ?)',
            [round_name, start_date, end_date, 'open']
        );
        res.status(201).json({ status: 'success', message: 'Round created', data: { id: result.insertId } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getAllRounds = async (req, res) => {
    try {
        const [rounds] = await db.execute('SELECT * FROM rounds ORDER BY id DESC');
        res.status(200).json({ status: 'success', data: rounds });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.updateRoundStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'open' or 'closed'
        await db.execute('UPDATE rounds SET status = ? WHERE id = ?', [status, id]);
        res.status(200).json({ status: 'success', message: 'Round status updated' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// [5.1.1, 5.1.3] CRUD Criterias
exports.createCriteria = async (req, res) => {
    try {
        const { round_id, topic_name, indicator_name, description, max_score, scoring_type } = req.body;
        const [result] = await db.execute(
            'INSERT INTO criterias (round_id, topic_name, indicator_name, description, max_score, scoring_type) VALUES (?, ?, ?, ?, ?, ?)',
            [round_id, topic_name, indicator_name, description, max_score, scoring_type]
        );
        res.status(201).json({ status: 'success', message: 'Criteria created', data: { id: result.insertId } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getCriteriasByRound = async (req, res) => {
    try {
        const { roundId } = req.params;
        const [criterias] = await db.execute('SELECT * FROM criterias WHERE round_id = ?', [roundId]);
        res.status(200).json({ status: 'success', data: criterias });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// [5.1.6] Manage Users (Simple Get All for admin selection)
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, username, fullname, role FROM users');
        res.status(200).json({ status: 'success', data: users });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// [5.1.7, 5.1.8] Mapping Committee -> Evaluatee
exports.assignCommittee = async (req, res) => {
    try {
        const { round_id, evaluator_id, evaluatee_id, role } = req.body;
        const [result] = await db.execute(
            'INSERT INTO committees_mapping (round_id, evaluator_id, evaluatee_id, role) VALUES (?, ?, ?, ?)',
            [round_id, evaluator_id, evaluatee_id, role]
        );
        res.status(201).json({ status: 'success', message: 'Committee assigned', data: { id: result.insertId } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// [5.1.11] Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const [userCount] = await db.execute('SELECT COUNT(*) as total FROM users');
        const [roundCount] = await db.execute('SELECT COUNT(*) as total FROM rounds WHERE status = "open"');
        const [evalCount] = await db.execute('SELECT COUNT(*) as total FROM evaluations');
        
        res.status(200).json({
            status: 'success',
            data: {
                totalUsers: userCount[0].total,
                activeRounds: roundCount[0].total,
                totalEvaluations: evalCount[0].total
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};