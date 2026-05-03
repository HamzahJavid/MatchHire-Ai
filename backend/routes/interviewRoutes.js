const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireSeeker } = require('../middleware/roles');
const {
    generatePractice,
    evaluateTest,
    saveResponses,
    getInterview,
    listInterviews,
    getStats,
    updateStatus,
    startRealInterview,
} = require('../controllers/interviewController');

// Generate practice questions
router.post('/generate', auth, requireSeeker, generatePractice);

// Evaluate interview responses
router.post('/evaluate', auth, requireSeeker, evaluateTest);

// Save interview responses
router.post('/responses', auth, requireSeeker, saveResponses);

// Start real interview for a job
router.post('/start-real', auth, requireSeeker, startRealInterview);

// Get interview by ID
router.get('/:interviewId', auth, requireSeeker, getInterview);

// List all interviews for user
router.get('/', auth, requireSeeker, listInterviews);

// Update interview status
router.patch('/:interviewId/status', auth, requireSeeker, updateStatus);

// Get interview statistics
router.get('/stats/overview', auth, requireSeeker, getStats);

module.exports = router;
