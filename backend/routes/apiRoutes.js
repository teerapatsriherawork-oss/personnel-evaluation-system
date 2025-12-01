// File: backend/routes/apiRoutes.js

const express = require('express');
const router = express.Router();

// --- Controllers ---
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const committeeController = require('../controllers/committeeController');
const uploadController = require('../controllers/uploadController');

// --- Middlewares ---
const authMiddleware = require('../middleware/authMiddleware');
const { verifyAdmin, verifyCommittee } = require('../middleware/roleMiddleware');
const { registerRules, loginRules, createRoundRules } = require('../middleware/validationMiddleware');

// ==========================================
// 1. Public Routes
// ==========================================
router.post('/auth/register', registerRules, authController.register);
router.post('/auth/login', loginRules, authController.login);
router.get('/public/progress', userController.getPublicProgress);

// ==========================================
// 2. Protected Common Routes (Authenticated Users)
// ==========================================
// Upload Utility
router.post('/upload', authMiddleware, uploadController.uploadMiddleware, uploadController.uploadFile);

// User Profile & Self-Assessment
router.get('/user/profile', authMiddleware, userController.getProfile);
router.put('/user/profile', authMiddleware, userController.updateProfile);
router.post('/user/evaluate', authMiddleware, userController.submitSelfAssessment);
router.get('/user/evaluations/:roundId', authMiddleware, userController.getMyEvaluations);

// Shared Resources (Read-Only for Users/Committee)
router.get('/admin/rounds', authMiddleware, adminController.getAllRounds);
router.get('/admin/rounds/:roundId/topics', authMiddleware, adminController.getTopicsByRound);
router.get('/admin/rounds/:roundId/criterias', authMiddleware, adminController.getCriteriasByRound);

// ==========================================
// 3. Admin Routes (Admin Only)
// ==========================================

// Rounds Management
router.post('/admin/rounds', authMiddleware, verifyAdmin, createRoundRules, adminController.createRound);
router.put('/admin/rounds/:id/status', authMiddleware, verifyAdmin, adminController.updateRoundStatus);
router.put('/admin/rounds/:id', authMiddleware, verifyAdmin, adminController.updateRound);
router.delete('/admin/rounds/:id', authMiddleware, verifyAdmin, adminController.deleteRound);

// Topics Management
router.post('/admin/topics', authMiddleware, verifyAdmin, adminController.createTopic);
router.put('/admin/topics/:id', authMiddleware, verifyAdmin, adminController.updateTopic);
router.delete('/admin/topics/:id', authMiddleware, verifyAdmin, adminController.deleteTopic);

// Criterias Management
router.post('/admin/criterias', authMiddleware, verifyAdmin, adminController.createCriteria);
router.put('/admin/criterias/:id', authMiddleware, verifyAdmin, adminController.updateCriteria);
router.delete('/admin/criterias/:id', authMiddleware, verifyAdmin, adminController.deleteCriteria);

// Users Management
router.get('/admin/users', authMiddleware, verifyAdmin, adminController.getAllUsers);
router.post('/admin/users', authMiddleware, verifyAdmin, registerRules, adminController.createUser);
router.put('/admin/users/:id', authMiddleware, verifyAdmin, adminController.updateUser);
router.delete('/admin/users/:id', authMiddleware, verifyAdmin, adminController.deleteUser);

// Committee Mapping
router.get('/admin/mappings', authMiddleware, verifyAdmin, adminController.getAllMappings);
router.post('/admin/mapping', authMiddleware, verifyAdmin, adminController.assignCommittee);
router.put('/admin/mapping/:id', authMiddleware, verifyAdmin, adminController.updateMapping); 
router.delete('/admin/mapping/:id', authMiddleware, verifyAdmin, adminController.deleteMapping); 

// Dashboard & Reports
router.get('/admin/stats', authMiddleware, verifyAdmin, adminController.getDashboardStats);
router.get('/admin/summary/:roundId', authMiddleware, verifyAdmin, adminController.getCommitteeSummary);
router.get('/admin/committee-progress/:roundId', authMiddleware, verifyAdmin, adminController.getCommitteeProgress);
router.get('/admin/evaluatee-tracking/:roundId', authMiddleware, verifyAdmin, adminController.getEvaluateeTracking);
router.get('/admin/report/:roundId/:userId', authMiddleware, verifyAdmin, adminController.getUserEvaluations);

// ==========================================
// 4. Committee Routes (Committee & Admin)
// ==========================================
router.get('/committee/rounds/:roundId/evaluatees', authMiddleware, verifyCommittee, committeeController.getEvaluatees);
router.get('/committee/grading/:roundId/:evaluateeId', authMiddleware, verifyCommittee, committeeController.getGradingInfo);
router.post('/committee/grade', authMiddleware, verifyCommittee, committeeController.submitGrading);
router.post('/committee/overall-comment', authMiddleware, verifyCommittee, committeeController.submitOverallComment);

module.exports = router;