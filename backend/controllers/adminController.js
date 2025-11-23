const db = require('../config/database');
const bcrypt = require('bcryptjs');

// ==========================================
// 1. ส่วนจัดการ Rounds (รอบการประเมิน)
// ==========================================
exports.createRound = async (req, res) => {
    try {
        const { round_name, start_date, end_date } = req.body;
        const [result] = await db.execute(
            'INSERT INTO rounds (round_name, start_date, end_date, status) VALUES (?, ?, ?, ?)',
            [round_name, start_date, end_date, 'open']
        );
        res.status(201).json({ status: 'success', message: 'Round created', data: { id: result.insertId } });
    } catch (error) {
        console.error("Error creating round:", error);
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
        const { status } = req.body;
        await db.execute('UPDATE rounds SET status = ? WHERE id = ?', [status, id]);
        res.status(200).json({ status: 'success', message: 'Round status updated' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.updateRound = async (req, res) => {
    try {
        const { id } = req.params;
        const { round_name, start_date, end_date } = req.body;
        await db.execute(
            'UPDATE rounds SET round_name=?, start_date=?, end_date=? WHERE id=?',
            [round_name, start_date, end_date, id]
        );
        res.status(200).json({ status: 'success', message: 'Round updated' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.deleteRound = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM rounds WHERE id=?', [id]);
        res.status(200).json({ status: 'success', message: 'Round deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==========================================
// 2. ส่วนจัดการ Topics (หัวข้อ)
// ==========================================
exports.createTopic = async (req, res) => {
    try {
        const { round_id, topic_name } = req.body;
        const [result] = await db.execute(
            'INSERT INTO topics (round_id, topic_name) VALUES (?, ?)',
            [round_id, topic_name]
        );
        res.status(201).json({ status: 'success', message: 'Topic created', data: { id: result.insertId } });
    } catch (error) {
        console.error("Error creating topic:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getTopicsByRound = async (req, res) => {
    try {
        const { roundId } = req.params;
        const [topics] = await db.execute('SELECT * FROM topics WHERE round_id = ?', [roundId]);
        res.status(200).json({ status: 'success', data: topics });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.updateTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const { topic_name } = req.body;
        await db.execute('UPDATE topics SET topic_name = ? WHERE id = ?', [topic_name, id]);
        res.status(200).json({ status: 'success', message: 'Topic updated' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.deleteTopic = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM topics WHERE id = ?', [id]);
        res.status(200).json({ status: 'success', message: 'Topic deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==========================================
// 3. ส่วนจัดการ Criterias (ตัวชี้วัด)
// ==========================================
exports.createCriteria = async (req, res) => {
    try {
        const { round_id, topic_id, indicator_name, description = null, max_score, scoring_type, require_evidence = false } = req.body;
        
        const [result] = await db.execute(
            'INSERT INTO criterias (round_id, topic_id, indicator_name, description, max_score, scoring_type, require_evidence) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [round_id, topic_id, indicator_name, description, max_score, scoring_type, require_evidence]
        );
        res.status(201).json({ status: 'success', message: 'Criteria created', data: { id: result.insertId } });
    } catch (error) {
        console.error("Error creating criteria:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getCriteriasByRound = async (req, res) => {
    try {
        const { roundId } = req.params;
        const sql = `
            SELECT c.*, t.topic_name 
            FROM criterias c
            JOIN topics t ON c.topic_id = t.id
            WHERE c.round_id = ?
        `;
        const [criterias] = await db.execute(sql, [roundId]);
        res.status(200).json({ status: 'success', data: criterias });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.updateCriteria = async (req, res) => {
    try {
        const { id } = req.params;
        const { topic_id, indicator_name, description, max_score, scoring_type, require_evidence } = req.body;
        
        await db.execute(
            `UPDATE criterias 
             SET topic_id=?, indicator_name=?, description=?, max_score=?, scoring_type=?, require_evidence=? 
             WHERE id=?`,
            [topic_id, indicator_name, description, max_score, scoring_type, require_evidence, id]
        );
        res.status(200).json({ status: 'success', message: 'Criteria updated' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.deleteCriteria = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM criterias WHERE id = ?', [id]);
        res.status(200).json({ status: 'success', message: 'Criteria deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==========================================
// 4. ส่วนจัดการ Users (ผู้ใช้งาน)
// ==========================================
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, username, fullname, role FROM users ORDER BY id DESC');
        res.status(200).json({ status: 'success', data: users });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { username, password, fullname, role } = req.body;
        
        if(!username || !password || !fullname || !role) {
             return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const [result] = await db.execute(
            'INSERT INTO users (username, password_hash, fullname, role) VALUES (?, ?, ?, ?)',
            [username, hash, fullname, role]
        );
        res.status(201).json({ status: 'success', message: 'User created', data: { id: result.insertId } });
    } catch (error) {
        console.error("Create User Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, fullname, role, password } = req.body;

        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            await db.execute(
                'UPDATE users SET username=?, fullname=?, role=?, password_hash=? WHERE id=?',
                [username, fullname, role, hash, id]
            );
        } else {
            await db.execute(
                'UPDATE users SET username=?, fullname=?, role=? WHERE id=?',
                [username, fullname, role, id]
            );
        }
        res.status(200).json({ status: 'success', message: 'User updated' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM users WHERE id=?', [id]);
        res.status(200).json({ status: 'success', message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// ==========================================
// 5. ส่วนอื่นๆ (Mapping, Dashboard, Summary)
// ==========================================
exports.assignCommittee = async (req, res) => {
    try {
        const { round_id, evaluator_id, evaluatee_id, role } = req.body;

        const [existing] = await db.execute(
            'SELECT id FROM committees_mapping WHERE round_id = ? AND evaluator_id = ? AND evaluatee_id = ?',
            [round_id, evaluator_id, evaluatee_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'มีการจับคู่กรรมการและผู้รับการประเมินคู่นี้ไปแล้วในรอบนี้' 
            });
        }

        const [result] = await db.execute(
            'INSERT INTO committees_mapping (round_id, evaluator_id, evaluatee_id, role) VALUES (?, ?, ?, ?)',
            [round_id, evaluator_id, evaluatee_id, role]
        );
        res.status(201).json({ status: 'success', message: 'Committee assigned', data: { id: result.insertId } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getAllMappings = async (req, res) => {
    try {
        const sql = `
            SELECT cm.id, r.round_name, 
                   COALESCE(u1.fullname, 'Unknown') as evaluator, 
                   COALESCE(u2.fullname, 'Unknown') as evaluatee, 
                   cm.role,
                   cm.round_id, cm.evaluator_id, cm.evaluatee_id
            FROM committees_mapping cm
            JOIN rounds r ON cm.round_id = r.id
            LEFT JOIN users u1 ON cm.evaluator_id = u1.id
            LEFT JOIN users u2 ON cm.evaluatee_id = u2.id
            ORDER BY cm.id DESC
        `;
        const [rows] = await db.execute(sql);
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.updateMapping = async (req, res) => {
    try {
        const { id } = req.params;
        const { round_id, evaluator_id, evaluatee_id, role } = req.body;

        const [existing] = await db.execute(
            'SELECT id FROM committees_mapping WHERE round_id = ? AND evaluator_id = ? AND evaluatee_id = ? AND id != ?',
            [round_id, evaluator_id, evaluatee_id, id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'มีการจับคู่กรรมการและผู้รับการประเมินคู่นี้ไปแล้วในรอบนี้' 
            });
        }

        await db.execute(
            'UPDATE committees_mapping SET round_id=?, evaluator_id=?, evaluatee_id=?, role=? WHERE id=?',
            [round_id, evaluator_id, evaluatee_id, role, id]
        );
        res.status(200).json({ status: 'success', message: 'Mapping updated' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.deleteMapping = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM committees_mapping WHERE id=?', [id]);
        res.status(200).json({ status: 'success', message: 'Mapping deleted' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

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

exports.getCommitteeSummary = async (req, res) => {
    try {
        const { roundId } = req.params;

        const [criCount] = await db.execute('SELECT COUNT(*) as total FROM criterias WHERE round_id = ?', [roundId]);
        const totalCriteria = criCount[0].total;

        const sql = `
            SELECT
                cm.id as mapping_id,
                COALESCE(u_ee.fullname, 'User Deleted') as evaluatee_name,
                COALESCE(u_er.fullname, 'User Deleted') as evaluator_name,
                cm.role as committee_role,
                (
                    SELECT COUNT(*) 
                    FROM evaluations e 
                    WHERE e.round_id = cm.round_id 
                      AND e.evaluator_id = cm.evaluator_id 
                      AND e.evaluatee_id = cm.evaluatee_id
                ) as evaluated_count,
                (
                    SELECT COALESCE(SUM(score), 0) 
                    FROM evaluations e 
                    WHERE e.round_id = cm.round_id 
                      AND e.evaluator_id = cm.evaluator_id 
                      AND e.evaluatee_id = cm.evaluatee_id
                ) as total_score
            FROM committees_mapping cm
            LEFT JOIN users u_ee ON cm.evaluatee_id = u_ee.id
            LEFT JOIN users u_er ON cm.evaluator_id = u_er.id
            WHERE cm.round_id = ?
            ORDER BY u_ee.fullname ASC, u_er.fullname ASC
        `;

        const [results] = await db.execute(sql, [roundId]);

        const data = results.map(row => ({
            ...row,
            total_criteria: totalCriteria,
            is_complete: totalCriteria > 0 && row.evaluated_count >= totalCriteria,
            progress_percent: totalCriteria > 0 ? Math.round((row.evaluated_count / totalCriteria) * 100) : 0
        }));

        res.status(200).json({ status: 'success', data });

    } catch (error) {
        console.error("[DEBUG] Error in getCommitteeSummary:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// [UPDATED] Committee Progress (รวมรายชื่อผู้รับการประเมิน)
exports.getCommitteeProgress = async (req, res) => {
    try {
        const { roundId } = req.params;
        
        const [criCount] = await db.execute('SELECT COUNT(*) as total FROM criterias WHERE round_id = ?', [roundId]);
        const totalCriteriaPerPerson = criCount[0].total;

        if (totalCriteriaPerPerson === 0) {
             return res.status(200).json({ status: 'success', data: [] });
        }

        const sql = `
            SELECT 
                u.id as committee_id,
                u.fullname as committee_name,
                COUNT(cm.evaluatee_id) as total_evaluatees,
                GROUP_CONCAT(u_ee.fullname SEPARATOR ', ') as evaluatee_list,
                (
                    SELECT COUNT(*) 
                    FROM evaluations e 
                    WHERE e.evaluator_id = u.id 
                    AND e.round_id = ?
                ) as total_evaluations_done
            FROM users u
            JOIN committees_mapping cm ON u.id = cm.evaluator_id
            LEFT JOIN users u_ee ON cm.evaluatee_id = u_ee.id
            WHERE cm.round_id = ?
            GROUP BY u.id, u.fullname
        `;

        const [rows] = await db.execute(sql, [roundId, roundId]);

        const data = rows.map(row => {
            const totalTasks = row.total_evaluatees * totalCriteriaPerPerson;
            const rawProgress = totalTasks > 0 ? (row.total_evaluations_done / totalTasks) * 100 : 0;
            const progress = Math.min(Math.round(rawProgress), 100);
            
            return {
                committee_id: row.committee_id,
                committee_name: row.committee_name,
                total_evaluatees: row.total_evaluatees,
                evaluatee_list: row.evaluatee_list,
                total_criteria_per_person: totalCriteriaPerPerson,
                total_evaluations_done: row.total_evaluations_done,
                total_tasks: totalTasks,
                progress: progress,
                is_complete: progress >= 100
            };
        });

        res.status(200).json({ status: 'success', data });

    } catch (error) {
        console.error("Error in getCommitteeProgress:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};