const fs = require("fs");
const { extractText } = require("../services/extractor");
const { parseResume } = require("../services/parser");
const SeekerProfile = require("../models/SeekerProfile");
const path = require('path');

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

    // ensure required sections exist
    const missing = [];
    if (!data.experience || !Array.isArray(data.experience) || data.experience.length === 0)
      missing.push('experience');
    if (!data.education || !Array.isArray(data.education) || data.education.length === 0)
      missing.push('education');
    if (!data.skills || !Array.isArray(data.skills) || data.skills.length === 0)
      missing.push('skills');

    if (missing.length > 0) {
      fs.unlink(filePath, () => {});
      return res.status(422).json({
        success: false,
        error: `Missing required sections in resume: ${missing.join(', ')}. Please add these parts and resubmit.`,
        missing,
      });
    }

    // upsert seeker profile for the authenticated user
    const userId = req.user._id;
    const profile = await SeekerProfile.findOne({ user: userId });

    const mappedSkills = data.skills.map((s) => ({ name: s, source: 'cv_parsed' }));

    const mappedExperience = data.experience.map((e) => ({
      title: e.title || null,
      company: e.company || null,
      location: e.location || null,
      startDate: null,
      endDate: null,
      isCurrent: false,
      description: Array.isArray(e.bullets) ? e.bullets.join('\n') : (e.bullets || '') || e.duration || '',
    }));

    const mappedEducation = data.education.map((ed) => ({
      institution: ed.institution || ed.degree || null,
      degree: ed.degree || null,
      fieldOfStudy: ed.fieldOfStudy || null,
      startYear: null,
      endYear: null,
      grade: ed.gpa || null,
    }));

    const cvUrl = path.resolve(filePath);

    let updated;
    if (profile) {
      profile.cv = {
        fileUrl: cvUrl,
        fileName: req.file.originalname,
        uploadedAt: new Date(),
        parseStatus: 'success',
        parsedAt: new Date(),
      };
      profile.headline = data.title || profile.headline;
      profile.summary = data.bio || profile.summary;
      profile.location = data.location || profile.location;
      profile.skills = mappedSkills;
      profile.experience = mappedExperience;
      profile.education = mappedEducation;
      profile.aiReadiness = profile.aiReadiness || {};
      updated = await profile.save();
    } else {
      const createObj = {
        user: userId,
        cv: {
          fileUrl: cvUrl,
          fileName: req.file.originalname,
          uploadedAt: new Date(),
          parseStatus: 'success',
          parsedAt: new Date(),
        },
        headline: data.title || null,
        summary: data.bio || null,
        location: data.location || null,
        skills: mappedSkills,
        experience: mappedExperience,
        education: mappedEducation,
      };
      updated = await SeekerProfile.create(createObj);
    }

    fs.unlink(filePath, () => {});

    return res.json({ success: true, data: updated });
  } catch (err) {
    fs.unlink(filePath, () => {});
    console.error("[resumeController]", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { parseResume: parseResumeController };
