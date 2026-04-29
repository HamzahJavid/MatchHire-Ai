const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireSeeker } = require('../middleware/roles');
const { generatePractice, evaluateTest } = require('../controllers/interviewController');

router.post('/generate', auth, requireSeeker, generatePractice);
router.post('/evaluate', auth, requireSeeker, evaluateTest);

module.exports = router;
