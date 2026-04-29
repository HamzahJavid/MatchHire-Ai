const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireSeeker } = require('../middleware/roles');
const { getProfile, updatePersonal, deleteProfile } = require('../controllers/profileController');

// Protected route to get the current seeker's profile and top jobs
router.get('/profile', auth, requireSeeker, getProfile);

// Protected route to update seeker personal info
router.put('/profile', auth, requireSeeker, updatePersonal);
router.delete('/profile', auth, requireSeeker, deleteProfile);

module.exports = router;
