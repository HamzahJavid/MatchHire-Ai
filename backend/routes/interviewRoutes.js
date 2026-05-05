const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireSeeker, requireHirer } = require('../middleware/roles');
const {
    generatePractice,
    evaluateTest,
    saveResponses,
    getInterview,
    listInterviews,
    getStats,
    updateStatus,
    startRealInterview,
    generateMatchInterview,
    postInterviewQuestions,
    submitInterviewAnswers,
    getInterviewAnswers,
    getInterviewByMatch,
} = require('../controllers/interviewController');

// ===== SEEKER ROUTES =====
// Generate practice questions
router.post('/generate', auth, requireSeeker, generatePractice);

// Evaluate interview responses
router.post('/evaluate', auth, requireSeeker, evaluateTest);

// Save interview responses
router.post('/responses', auth, requireSeeker, saveResponses);

// Submit answers to hirer's interview questions
router.post('/submit-answers', auth, requireSeeker, submitInterviewAnswers);

// Start real interview for a job
router.post('/start-real', auth, requireSeeker, startRealInterview);

// Hirer: generate AI interview from match seeker profile
router.post('/generate-match', auth, requireHirer, generateMatchInterview);

// Get interview statistics
router.get('/stats/overview', auth, requireSeeker, getStats);

// Get interview by ID
router.get('/:interviewId', auth, requireSeeker, getInterview);

// List all interviews for user
router.get('/', auth, requireSeeker, listInterviews);

// Update interview status
router.patch('/:interviewId/status', auth, requireSeeker, updateStatus);

// ===== HIRER ROUTES =====
// Post interview questions to a seeker
router.post('/question/post', auth, requireHirer, postInterviewQuestions);

// Get interview answers (hirer views seeker's answers)
router.get('/answers/:interviewId', auth, requireHirer, getInterviewAnswers);

// Get interview for a specific match
router.get('/match/:matchId', auth, requireHirer, getInterviewByMatch);

module.exports = router;
