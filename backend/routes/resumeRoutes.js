const express = require("express");
const router = express.Router();
const { parseResume } = require("../controllers/resumeController");
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");

// protected: user must be authenticated to attach parsed CV to their profile
router.post("/parse", auth, upload.single("file"), parseResume);

module.exports = router;
