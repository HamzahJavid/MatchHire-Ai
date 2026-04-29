const express = require("express");
const router = express.Router();
const { parseResume, patchResume } = require("../controllers/resumeController");
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");
const { requireSeeker } = require('../middleware/roles');

// protected: only seeker users may attach parsed CV to their profile
router.post("/parse", auth, requireSeeker, upload.single("file"), parseResume);
router.patch("/", auth, requireSeeker, patchResume);

module.exports = router;
