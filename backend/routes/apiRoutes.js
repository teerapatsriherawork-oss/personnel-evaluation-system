const express = require('express');
const router = express.Router();

// Import Controllers
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const committeeController = require('../controllers/committeeController');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');

// --- Public Routes ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/public/progress', userController.getPublicProgress);

// --- Protected Routes ---
router.post('/upload', authMiddleware, uploadController.uploadMiddleware, uploadController.uploadFile);

// 1. Admin Routes: Rounds
router.post('/admin/rounds', authMiddleware, adminController.createRound);
router.get('/admin/rounds', authMiddleware, adminController.getAllRounds);
router.put('/admin/rounds/:id/status', authMiddleware, adminController.updateRoundStatus);

// 2. Admin Routes: Topics
router.post('/admin/topics', authMiddleware, adminController.createTopic);
router.get('/admin/rounds/:roundId/topics', authMiddleware, adminController.getTopicsByRound);

// 3. Admin Routes: Criterias
router.post('/admin/criterias', authMiddleware, adminController.createCriteria);
router.get('/admin/rounds/:roundId/criterias', authMiddleware, adminController.getCriteriasByRound);

// 4. Admin Routes: Users Management
router.get('/admin/users', authMiddleware, adminController.getAllUsers);
router.post('/admin/users', authMiddleware, adminController.createUser);
router.put('/admin/users/:id', authMiddleware, adminController.updateUser);
router.delete('/admin/users/:id', authMiddleware, adminController.deleteUser);

// 5. Admin Routes: Mapping & Stats
router.post('/admin/mapping', authMiddleware, adminController.assignCommittee);
router.get('/admin/stats', authMiddleware, adminController.getDashboardStats);

// 6. User & Committee Routes
router.post('/user/evaluate', authMiddleware, userController.submitSelfAssessment);
router.get('/user/evaluations/:roundId', authMiddleware, userController.getMyEvaluations);
router.get('/committee/rounds/:roundId/evaluatees', authMiddleware, committeeController.getEvaluatees);
router.get('/committee/grading/:roundId/:evaluateeId', authMiddleware, committeeController.getGradingInfo);
router.post('/committee/grade', authMiddleware, committeeController.submitGrading);

module.exports = router;