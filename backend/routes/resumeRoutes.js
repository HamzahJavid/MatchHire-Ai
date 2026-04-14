const express = require("express");
const router = express.Router();
const { parseResume } = require("../controllers/resumeController");
const upload = require("../middleware/upload");

router.post("/parse", upload.single("file"), parseResume);

module.exports = router;
