// File: backend/routes/apiRoutes.js

const express = require('express');
const router = express.Router();

// Import Controllers
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const committeeController = require('../controllers/committeeController');
const uploadController = require('../controllers/uploadController');

// Import Middlewares
const authMiddleware = require('../middleware/authMiddleware');
const { verifyAdmin, verifyCommittee } = require('../middleware/roleMiddleware'); // [NEW] Role Check
const { registerRules, loginRules, createRoundRules } = require('../middleware/validationMiddleware'); // [NEW] Validation

// --- Public Routes ---
router.post('/auth/register', registerRules, authController.register); // ใช้ Validation
router.post('/auth/login', loginRules, authController.login);          // ใช้ Validation
router.get('/public/progress', userController.getPublicProgress);

// --- Protected Routes (ต้อง Login) ---
router.post('/upload', authMiddleware, uploadController.uploadMiddleware, uploadController.uploadFile);

// ==========================================
// 1. Admin Routes (ต้องเป็น Admin เท่านั้น)
// ==========================================
router.post('/admin/rounds', authMiddleware, verifyAdmin, createRoundRules, adminController.createRound); // ใช้ Validation + Role Check
router.get('/admin/rounds', authMiddleware, verifyAdmin, adminController.getAllRounds);
router.put('/admin/rounds/:id/status', authMiddleware, verifyAdmin, adminController.updateRoundStatus);
router.put('/admin/rounds/:id', authMiddleware, verifyAdmin, adminController.updateRound);
router.delete('/admin/rounds/:id', authMiddleware, verifyAdmin, adminController.deleteRound);

router.post('/admin/topics', authMiddleware, verifyAdmin, adminController.createTopic);
router.get('/admin/rounds/:roundId/topics', authMiddleware, verifyAdmin, adminController.getTopicsByRound);
router.put('/admin/topics/:id', authMiddleware, verifyAdmin, adminController.updateTopic);
router.delete('/admin/topics/:id', authMiddleware, verifyAdmin, adminController.deleteTopic);

router.post('/admin/criterias', authMiddleware, verifyAdmin, adminController.createCriteria);
router.get('/admin/rounds/:roundId/criterias', authMiddleware, verifyAdmin, adminController.getCriteriasByRound);
router.put('/admin/criterias/:id', authMiddleware, verifyAdmin, adminController.updateCriteria);
router.delete('/admin/criterias/:id', authMiddleware, verifyAdmin, adminController.deleteCriteria);

router.get('/admin/users', authMiddleware, verifyAdmin, adminController.getAllUsers);
router.post('/admin/users', authMiddleware, verifyAdmin, registerRules, adminController.createUser); // ใช้กฎเดียวกับ Register
router.put('/admin/users/:id', authMiddleware, verifyAdmin, adminController.updateUser);
router.delete('/admin/users/:id', authMiddleware, verifyAdmin, adminController.deleteUser);

router.get('/admin/mappings', authMiddleware, verifyAdmin, adminController.getAllMappings);
router.post('/admin/mapping', authMiddleware, verifyAdmin, adminController.assignCommittee);
router.put('/admin/mapping/:id', authMiddleware, verifyAdmin, adminController.updateMapping); 
router.delete('/admin/mapping/:id', authMiddleware, verifyAdmin, adminController.deleteMapping); 

router.get('/admin/stats', authMiddleware, verifyAdmin, adminController.getDashboardStats);
router.get('/admin/summary/:roundId', authMiddleware, verifyAdmin, adminController.getCommitteeSummary);
router.get('/admin/committee-progress/:roundId', authMiddleware, verifyAdmin, adminController.getCommitteeProgress);
router.get('/admin/evaluatee-tracking/:roundId', authMiddleware, verifyAdmin, adminController.getEvaluateeTracking);
router.get('/admin/report/:roundId/:userId', authMiddleware, verifyAdmin, adminController.getUserEvaluations);

// ==========================================
// 2. User Routes (สำหรับผู้ใช้งานทั่วไป)
// ==========================================
router.post('/user/evaluate', authMiddleware, userController.submitSelfAssessment);
router.get('/user/evaluations/:roundId', authMiddleware, userController.getMyEvaluations);
router.get('/user/profile', authMiddleware, userController.getProfile);
router.put('/user/profile', authMiddleware, userController.updateProfile);

// ==========================================
// 3. Committee Routes (สำหรับกรรมการ)
// ==========================================
router.get('/committee/rounds/:roundId/evaluatees', authMiddleware, verifyCommittee, committeeController.getEvaluatees);
router.get('/committee/grading/:roundId/:evaluateeId', authMiddleware, verifyCommittee, committeeController.getGradingInfo);
router.post('/committee/grade', authMiddleware, verifyCommittee, committeeController.submitGrading);
router.post('/committee/overall-comment', authMiddleware, verifyCommittee, committeeController.submitOverallComment);

module.exports = router;