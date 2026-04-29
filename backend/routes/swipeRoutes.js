const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireSeeker, requireHirer } = require('../middleware/roles');
const { swipeJob, swipeCandidate } = require('../controllers/swipeController');

router.post('/job', auth, requireSeeker, swipeJob);
router.post('/candidate', auth, requireHirer, swipeCandidate);

module.exports = router;
