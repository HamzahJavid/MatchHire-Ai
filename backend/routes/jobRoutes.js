const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireHirer, requireSeeker } = require('../middleware/roles');
const { postJob, updateJob, patchJob, deleteJob, getClosestJobs, getCandidates, getMyJobs } = require('../controllers/jobController');

// Protected route: only authenticated hirer users may post jobs
router.post('/', auth, requireHirer, postJob);
router.put('/:id', auth, requireHirer, updateJob);
router.patch('/:id', auth, requireHirer, patchJob);
router.delete('/:id', auth, requireHirer, deleteJob);
// For seekers: find closest jobs to their profile
router.get('/closest', auth, requireSeeker, getClosestJobs);
// For hirer: list hirer's jobs for candidate discovery
router.get('/mine', auth, requireHirer, getMyJobs);
// For hirer: get closest candidate profiles to a job
router.get('/:id/candidates', auth, requireHirer, getCandidates);

module.exports = router;
