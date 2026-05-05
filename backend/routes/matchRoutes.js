const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getMatches, getMatchById } = require('../controllers/matchController');

router.get('/', auth, getMatches);
router.get('/:matchId', auth, getMatchById);

module.exports = router;