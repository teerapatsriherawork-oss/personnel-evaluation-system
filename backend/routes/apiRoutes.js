const express = require('express');
const router = express.Router();

// Import Controllers
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const committeeController = require('../controllers/committeeController');
const uploadController = require('../controllers/uploadController');

// Import Middleware
const authMiddleware = require('../middleware/authMiddleware');

// --- Public Routes ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// --- Protected Routes (Require Token) ---

// Upload Route [6.3]
router.post('/upload', authMiddleware, uploadController.uploadMiddleware, uploadController.uploadFile);

// Admin Routes
// [5.1.2] Manage Rounds
router.post('/admin/rounds', authMiddleware, adminController.createRound); // POST
router.get('/admin/rounds', authMiddleware, adminController.getAllRounds); // GET
router.put('/admin/rounds/:id/status', authMiddleware, adminController.updateRoundStatus); // PUT

// [5.1.1, 5.1.3] Manage Criterias
router.post('/admin/criterias', authMiddleware, adminController.createCriteria); // POST
router.get('/admin/rounds/:roundId/criterias', authMiddleware, adminController.getCriteriasByRound); // GET

// [5.1.6, 5.1.7] Manage Users & Mapping
router.get('/admin/users', authMiddleware, adminController.getAllUsers); // GET
router.post('/admin/mapping', authMiddleware, adminController.assignCommittee); // POST

// [5.1.11] Dashboard
router.get('/admin/stats', authMiddleware, adminController.getDashboardStats); // GET

// User Routes (Self-Assessment)
// [5.2.5] Submit & Get Own Evaluations
router.post('/user/evaluate', authMiddleware, userController.submitSelfAssessment); // POST
router.get('/user/evaluations/:roundId', authMiddleware, userController.getMyEvaluations); // GET

// Committee Routes
// Get list of users to evaluate
router.get('/committee/rounds/:roundId/evaluatees', authMiddleware, committeeController.getEvaluatees); // GET
// [5.3.4] Submit Grading
router.post('/committee/grade', authMiddleware, committeeController.submitGrading); // POST

// --- Public Routes ---
// ... (ต่อจาก login/register)
router.get('/public/progress', userController.getPublicProgress); // ✅ เพิ่มบรรทัดนี้

module.exports = router;