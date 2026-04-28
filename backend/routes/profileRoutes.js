const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { updatePersonal } = require('../controllers/profileController');

// Protected route to update seeker personal info
router.put('/profile', auth, updatePersonal);

module.exports = router;
