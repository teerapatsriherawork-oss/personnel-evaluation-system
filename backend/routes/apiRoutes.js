// File: backend/routes/apiRoutes.js

const express = require('express');
const router = express.Router();

// Import Controllers
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const committeeController = require('../controllers/committeeController');
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');

console.log("Checking Controllers...");
if (!adminController.createRound) console.error("❌ Error: adminController.createRound is missing!");
if (!userController.getMyEvaluations) console.error("❌ Error: userController.getMyEvaluations is missing! Check userController.js");
if (!authMiddleware) console.error("❌ Error: authMiddleware is missing!");
console.log("Controllers Check Done.");

// --- Public Routes ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/public/progress', userController.getPublicProgress);

// --- Protected Routes ---
router.post('/upload', authMiddleware, uploadController.uploadMiddleware, uploadController.uploadFile);

// 1. Admin Routes
router.post('/admin/rounds', authMiddleware, adminController.createRound);
router.get('/admin/rounds', authMiddleware, adminController.getAllRounds);
router.put('/admin/rounds/:id/status', authMiddleware, adminController.updateRoundStatus);
router.put('/admin/rounds/:id', authMiddleware, adminController.updateRound);
router.delete('/admin/rounds/:id', authMiddleware, adminController.deleteRound);

router.post('/admin/topics', authMiddleware, adminController.createTopic);
router.get('/admin/rounds/:roundId/topics', authMiddleware, adminController.getTopicsByRound);
router.put('/admin/topics/:id', authMiddleware, adminController.updateTopic);
router.delete('/admin/topics/:id', authMiddleware, adminController.deleteTopic);

router.post('/admin/criterias', authMiddleware, adminController.createCriteria);
router.get('/admin/rounds/:roundId/criterias', authMiddleware, adminController.getCriteriasByRound);
router.put('/admin/criterias/:id', authMiddleware, adminController.updateCriteria);
router.delete('/admin/criterias/:id', authMiddleware, adminController.deleteCriteria);

router.get('/admin/users', authMiddleware, adminController.getAllUsers);
router.post('/admin/users', authMiddleware, adminController.createUser);
router.put('/admin/users/:id', authMiddleware, adminController.updateUser);
router.delete('/admin/users/:id', authMiddleware, adminController.deleteUser);

router.get('/admin/mappings', authMiddleware, adminController.getAllMappings);
router.post('/admin/mapping', authMiddleware, adminController.assignCommittee);
router.put('/admin/mapping/:id', authMiddleware, adminController.updateMapping); 
router.delete('/admin/mapping/:id', authMiddleware, adminController.deleteMapping); 

router.get('/admin/stats', authMiddleware, adminController.getDashboardStats);
router.get('/admin/summary/:roundId', authMiddleware, adminController.getCommitteeSummary);
router.get('/admin/committee-progress/:roundId', authMiddleware, adminController.getCommitteeProgress);
router.get('/admin/evaluatee-tracking/:roundId', authMiddleware, adminController.getEvaluateeTracking);
router.get('/admin/report/:roundId/:userId', authMiddleware, adminController.getUserEvaluations); // Route สำหรับดูรายงานรายบุคคล

// 2. User & Committee Routes
router.post('/user/evaluate', authMiddleware, userController.submitSelfAssessment);
router.get('/user/evaluations/:roundId', authMiddleware, userController.getMyEvaluations);

// [NEW] Profile Routes
router.get('/user/profile', authMiddleware, userController.getProfile);
router.put('/user/profile', authMiddleware, userController.updateProfile);

// [NEW] Committee Routes
router.get('/committee/rounds/:roundId/evaluatees', authMiddleware, committeeController.getEvaluatees);
router.get('/committee/grading/:roundId/:evaluateeId', authMiddleware, committeeController.getGradingInfo);
router.post('/committee/grade', authMiddleware, committeeController.submitGrading);

module.exports = router;