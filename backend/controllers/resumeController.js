const fs = require("fs");
const { extractText } = require("../services/extractor");
const { parseResume } = require("../services/parser");
const SeekerProfile = require("../models/SeekerProfile");
const Experience = require('../models/Experience');
const Education = require('../models/Education');
const Skill = require('../models/Skill');
const path = require('path');

function normalizeString(value) {
  if (value === undefined || value === null) return null;
  return String(value).trim();
}

function normalizeSkillItem(raw, seekerProfileId) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const name = normalizeString(raw);
    if (!name) return null;
    return { seekerProfile: seekerProfileId, name, source: 'manual' };
  }
  if (typeof raw === 'object' && raw.name) {
    const name = normalizeString(raw.name);
    if (!name) return null;
    return {
      seekerProfile: seekerProfileId,
      name,
      level: raw.level ? normalizeString(raw.level) : undefined,
      yearsOfExp: Number.isFinite(Number(raw.yearsOfExp)) ? Number(raw.yearsOfExp) : undefined,
      source: raw.source ? normalizeString(raw.source) : 'manual',
    };
  }
  return null;
}

function normalizeExperienceItem(raw, seekerProfileId) {
  if (!raw || typeof raw !== 'object') return null;
  const title = normalizeString(raw.title);
  const company = normalizeString(raw.company);
  if (!title || !company) return null;
  return {
    seekerProfile: seekerProfileId,
    title,
    company,
    location: raw.location ? normalizeString(raw.location) : undefined,
    startDate: raw.startDate ? new Date(raw.startDate) : undefined,
    endDate: raw.endDate ? new Date(raw.endDate) : undefined,
    isCurrent: typeof raw.isCurrent === 'boolean' ? raw.isCurrent : false,
    description: raw.description ? String(raw.description).trim() : undefined,
  };
}

function normalizeEducationItem(raw, seekerProfileId) {
  if (!raw || typeof raw !== 'object') return null;
  const institution = normalizeString(raw.institution || raw.school || raw.degree);
  if (!institution) return null;
  return {
    seekerProfile: seekerProfileId,
    institution,
    degree: raw.degree ? normalizeString(raw.degree) : undefined,
    fieldOfStudy: raw.fieldOfStudy ? normalizeString(raw.fieldOfStudy) : undefined,
    startYear: raw.startYear ? Number(raw.startYear) : undefined,
    endYear: raw.endYear ? Number(raw.endYear) : undefined,
    gpa: raw.gpa ? normalizeString(raw.gpa) : undefined,
    notes: raw.notes ? String(raw.notes).trim() : undefined,
  };
}

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

    console.log('[Resume Controller] Text extracted, length:', text.length);
    const data = await parseResume(text);

    // Log raw AI output if present for debugging
    if (data && data._ai_raw) {
      console.log('[AI PARSE RAW OUTPUT START]');
      console.log(data._ai_raw);
      console.log('[AI PARSE RAW OUTPUT END]');
    }

    console.log('[Resume Controller] Parse result:', JSON.stringify(data, null, 2));

    // AI handles extraction - don't validate required fields, let Gemini return what it finds
    // If experience, education, or skills are missing, they'll just be empty arrays

    // upsert seeker profile for the authenticated user
    const userId = req.user._id;
    let profile = await SeekerProfile.findOne({ user: userId });

    const mappedSkills = (data.skills || []).map((s) => ({ name: s, source: 'cv_parsed' }));

    const mappedExperience = (data.experience || []).map((e) => ({
      title: e.title || null,
      company: e.company || null,
      location: e.location || null,
      startDate: e.startDate ? new Date(e.startDate) : null,
      endDate: e.endDate ? new Date(e.endDate) : null,
      isCurrent: !!e.isCurrent,
      description: Array.isArray(e.bullets) ? e.bullets.join('\n') : (e.bullets || '') || e.duration || '',
    }));

    const mappedEducation = (data.education || []).map((ed) => ({
      institution: ed.institution || ed.degree || null,
      degree: ed.degree || null,
      fieldOfStudy: ed.fieldOfStudy || null,
      startYear: ed.startYear || null,
      endYear: ed.endYear || null,
      gpa: ed.gpa || ed.grade || null,
      notes: ed.notes ? (Array.isArray(ed.notes) ? ed.notes.join('\n') : ed.notes) : null,
    }));

    const cvUrl = path.resolve(filePath);

    let updated;

    if (!profile) {
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
      };
      updated = await SeekerProfile.create(createObj);
      // reload into profile variable
      profile = await SeekerProfile.findById(updated._id);
    }

    // remove old parsed artifacts for this profile
    await Promise.all([
      Experience.deleteMany({ seekerProfile: profile._id }),
      Education.deleteMany({ seekerProfile: profile._id }),
      Skill.deleteMany({ seekerProfile: profile._id }),
    ]);

    // create new docs and reference them
    const createdSkills = mappedSkills.length
      ? await Skill.insertMany(mappedSkills.map((s) => ({ ...s, seekerProfile: profile._id })))
      : [];

    const createdExperience = mappedExperience.length
      ? await Experience.insertMany(mappedExperience.map((e) => ({ ...e, seekerProfile: profile._id })))
      : [];

    const createdEducation = mappedEducation.length
      ? await Education.insertMany(mappedEducation.map((ed) => ({ ...ed, seekerProfile: profile._id })))
      : [];

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
    profile.skills = createdSkills.map((s) => s._id);
    profile.experience = createdExperience.map((e) => e._id);
    profile.education = createdEducation.map((ed) => ed._id);
    profile.aiReadiness = profile.aiReadiness || {};

    updated = await profile.save();

    // log what was saved for verification
    console.log('[PARSE RESULT] Skills saved:', createdSkills.length, createdSkills.map(s => ({ id: s._id, name: s.name })));
    console.log('[PARSE RESULT] Experience saved:', createdExperience.length, createdExperience.map(e => ({ id: e._id, title: e.title, company: e.company })));
    console.log('[PARSE RESULT] Education saved:', createdEducation.length, createdEducation.map(ed => ({ id: ed._id, institution: ed.institution, degree: ed.degree })));
    console.log('[Resume Controller] Profile updated successfully with:', {
      skills: profile.skills.length,
      experience: profile.experience.length,
      education: profile.education.length,
    });

    fs.unlink(filePath, () => {});

    return res.json({ success: true, data: updated });
  } catch (err) {
    fs.unlink(filePath, () => {});
    console.error("[resumeController]", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const normalizeArrayItems = async (items, normalizeFn, seekerProfileId, Model) => {
  if (!Array.isArray(items)) return null;
  await Model.deleteMany({ seekerProfile: seekerProfileId });
  if (items.length === 0) return [];
  const created = await Model.insertMany(
    items
      .map((item) => normalizeFn(item, seekerProfileId))
      .filter(Boolean),
  );
  return created.map((doc) => doc._id);
};

const patchResumeController = async (req, res) => {
  try {
    const userId = req.user._id;
    const profile = await SeekerProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Seeker profile not found' });
    }

    const {
      headline,
      summary,
      location,
      skills,
      experience,
      education,
    } = req.body;

    if (headline !== undefined) profile.headline = normalizeString(headline);
    if (summary !== undefined) profile.summary = normalizeString(summary);
    if (location !== undefined) profile.location = normalizeString(location);

    if (skills !== undefined) {
      if (!Array.isArray(skills)) {
        return res.status(400).json({ success: false, error: 'skills must be an array' });
      }
      profile.skills = await normalizeArrayItems(skills, normalizeSkillItem, profile._id, Skill);
    }

    if (experience !== undefined) {
      if (!Array.isArray(experience)) {
        return res.status(400).json({ success: false, error: 'experience must be an array' });
      }
      profile.experience = await normalizeArrayItems(experience, normalizeExperienceItem, profile._id, Experience);
    }

    if (education !== undefined) {
      if (!Array.isArray(education)) {
        return res.status(400).json({ success: false, error: 'education must be an array' });
      }
      profile.education = await normalizeArrayItems(education, normalizeEducationItem, profile._id, Education);
    }

    const updated = await profile.save();

    if (profile.profileStrength != null) {
      const profileController = require('./profileController');
      if (typeof profileController.evaluateProfileStrength === 'function') {
        await profileController.evaluateProfileStrength(profile, true).catch((e) => console.warn('[patchResume] profile strength update failed', e.message));
      }
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[resumeController]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { parseResume: parseResumeController, patchResume: patchResumeController };
