const fs = require("fs");
const { extractText } = require("../services/extractor");
const { parseResume } = require("../services/parser");

const parseResumeController = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file uploaded." });
  }

  const filePath = req.file.path;

  try {
    const { text, mimeType, pageCount } = await extractText(filePath);

    if (!text || text.trim().length < 50) {
      return res.status(422).json({
        success: false,
        error: "Could not extract text. File may be scanned or image-based.",
      });
    }

    const data = parseResume(text);

    fs.unlink(filePath, () => {});

    return res.json({
      success: true,
      data,
      meta: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType,
        pageCount: pageCount || null,
        parsedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    fs.unlink(filePath, () => {});
    console.error("[resumeController]", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { parseResume: parseResumeController };
