const SeekerProfile = require('../models/SeekerProfile');
const User = require('../models/User');
const Experience = require('../models/Experience');
const Education = require('../models/Education');
const Skill = require('../models/Skill');
const Job = require('../models/Job');
const Swipe = require('../models/Swipe');
const dotenv = require('dotenv');
dotenv.config();
let GoogleGenerativeAI;
try { GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI; } catch (e) { GoogleGenerativeAI = null; }

function normalizeSkillName(s) {
  return String(s).trim();
}

function tokenize(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function jaccard(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  const intersection = [...A].filter((item) => B.has(item)).length;
  const unionSize = new Set([...A, ...B]).size;
  return unionSize === 0 ? 0 : intersection / unionSize;
}

function buildProfileText(profile) {
  const parts = [
    profile.headline || '',
    profile.summary || '',
    profile.location || '',
    (profile.skills || []).map((s) => (typeof s === 'object' ? s.name : s)).join(' '),
    (profile.experience || []).map((exp) => {
      if (!exp) return '';
      return [exp.title, exp.company, exp.location, exp.description].filter(Boolean).join(' ');
    }).join(' '),
    (profile.education || []).map((ed) => {
      if (!ed) return '';
      return [ed.institution, ed.degree, ed.fieldOfStudy].filter(Boolean).join(' ');
    }).join(' '),
  ];
  return parts.filter(Boolean).join('\n');
}

async function callAiProfileStrength(profileText) {
  if (!process.env.GEMINI_API_KEY || !GoogleGenerativeAI) return null;
  const gen = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
  const prompt = `You are an AI assistant scoring a job seeker profile. Given the following profile text, return ONLY valid JSON with one key called \"profileStrength\" whose value is an integer 0-100.

PROFILE_TEXT:
${profileText}

Example: { "profileStrength": 72 }`;

  for (const modelName of modelsToTry) {
    try {
      const model = gen.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.profileStrength === 'number') {
        return Math.max(0, Math.min(100, Math.round(parsed.profileStrength)));
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

async function callAiSimilarity(profileText, jobText) {
  if (!process.env.GEMINI_API_KEY || !GoogleGenerativeAI) return null;
  const gen = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
  const prompt = `You are an assistant that compares a seeker profile to a job posting. Return ONLY valid JSON with key \"similarity\" and an integer 0-100.

PROFILE_TEXT:\n${profileText}\n\nJOB_TEXT:\n${jobText}\n\nExample: { \"similarity\": 82 }`;

  for (const modelName of modelsToTry) {
    try {
      const model = gen.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.similarity === 'number') {
        return Math.max(0, Math.min(100, Math.round(parsed.similarity)));
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

async function evaluateProfileStrength(profile, forceRecalc = false) {
  if (profile.profileStrength != null && !forceRecalc) {
    return profile.profileStrength;
  }
  const profileText = buildProfileText(profile);
  if (!profileText) return null;
  const score = await callAiProfileStrength(profileText).catch(() => null);
  if (score != null) {
    profile.profileStrength = score;
    await profile.save();
    return score;
  }
  return null;
}

exports.evaluateProfileStrength = evaluateProfileStrength;

async function getTopJobsForProfile(profile) {
  const profileText = buildProfileText(profile);
  if (!profileText) return [];

  const swipedJobs = await Swipe.find({ swipeType: 'seeker_on_job', swipedBy: profile.user }).select('job').lean();
  const swipedJobIds = new Set(swipedJobs.map((s) => String(s.job)));

  const jobs = await Job.find({ status: 'active', _id: { $nin: Array.from(swipedJobIds) } }).limit(100).lean();

  const scored = jobs.map((job) => {
    const jobText = [
      job.title || '',
      job.company || '',
      job.description || '',
      (job.requiredSkills || []).map((s) => s.name || '').join(' '),
    ].filter(Boolean).join('\n');
    const localScore = Math.round(jaccard(tokenize(profileText), tokenize(jobText)) * 100);
    return { job, localScore, jobText };
  });

  const top = scored.sort((a, b) => b.localScore - a.localScore).slice(0, 10);

  const results = [];
  for (const item of top) {
    let similarity = item.localScore;
    const aiScore = await callAiSimilarity(profileText, item.jobText).catch(() => null);
    if (typeof aiScore === 'number') similarity = aiScore;
    const location = item.job.location
      ? [item.job.location.city, item.job.location.country].filter(Boolean).join(', ') + (item.job.location.isRemote ? ' (remote)' : '')
      : 'Not specified';
    results.push({
      jobId: item.job._id,
      title: item.job.title,
      company: item.job.company,
      location,
      similarity,
    });
  }

  return results;
}

exports.updatePersonal = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      fullName,
      title, // maps to headline
      bio, // maps to summary
      location,
      skills,
      githubUrl,
      linkedinUrl,
      portfolioUrl,
    } = req.body;

    // Basic validations
    if (fullName && String(fullName).trim().length < 2)
      return res.status(400).json({ success: false, error: 'fullName too short' });
    if (title && String(title).trim().length < 2)
      return res.status(400).json({ success: false, error: 'title too short' });

    // update User name field if present
    if (fullName) {
      const user = await User.findById(userId);
      user.fullName = String(fullName).trim();
      await user.save();
    }

    let profile = await SeekerProfile.findOne({ user: userId });
    if (!profile) {
      profile = await SeekerProfile.create({ user: userId });
    }

    // keep compatibility: if skills are embedded objects, migrate them to Skill documents
    const Skill = require('../models/Skill');
    await profile.populate('skills');
    if (profile.skills && profile.skills.length && typeof profile.skills[0] === 'object' && profile.skills[0].name) {
      // migrate embedded skill objects into Skill collection
      const migrate = profile.skills.map((s) => ({ seekerProfile: profile._id, name: s.name, source: s.source || 'manual' }));
      const created = await Skill.insertMany(migrate);
      profile.skills = created.map((c) => c._id);
    }

    if (title) profile.headline = String(title).trim();
    if (bio) profile.summary = String(bio).trim();
    if (location) profile.location = String(location).trim();
    if (typeof githubUrl !== 'undefined') profile.githubUrl = githubUrl || null;
    if (typeof linkedinUrl !== 'undefined') profile.linkedinUrl = linkedinUrl || null;
    if (typeof portfolioUrl !== 'undefined') profile.portfolioUrl = portfolioUrl || null;

    // Handle skills: accept array of strings
    if (skills) {
      if (!Array.isArray(skills))
        return res.status(400).json({ success: false, error: 'skills must be an array of skill names' });

      // build existing names from populated Skill documents or strings
      const existingNames = new Set(
        (profile.skills || [])
          .map((s) => {
            if (!s) return null;
            if (typeof s === 'string') return s.trim().toLowerCase();
            if (typeof s === 'object') return String(s.name || '').trim().toLowerCase();
            return null;
          })
          .filter(Boolean),
      );

      const toAdd = [];
      for (const raw of skills) {
        const name = normalizeSkillName(raw);
        if (!name) continue;
        const key = name.toLowerCase();
        if (existingNames.has(key)) continue;
        existingNames.add(key);
        toAdd.push({ seekerProfile: profile._id, name, source: 'manual' });
      }

      if (toAdd.length) {
        const Skill = require('../models/Skill');
        const created = await Skill.insertMany(toAdd);
        profile.skills = (profile.skills || []).concat(created.map(c => c._id));
      }
    }

    await profile.save();
    await profile.populate(['skills', 'experience', 'education']);

    if (profile.profileStrength != null) {
      await evaluateProfileStrength(profile, true).catch((e) => console.warn('[updatePersonal] profile strength update failed', e.message));
    }

    return res.json({ success: true, data: profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('firstName lastName email').lean();
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });

    const profile = await SeekerProfile.findOne({ user: userId })
      .populate('skills')
      .populate('experience')
      .populate('education');

    if (!profile) return res.status(404).json({ success: false, error: 'Seeker profile not found' });

    if (profile.profileStrength == null) {
      await evaluateProfileStrength(profile, false).catch((e) => console.warn('[getProfile] profile strength evaluation failed', e.message));
    }

    const topJobs = await getTopJobsForProfile(profile).catch((e) => {
      console.warn('[getProfile] compute top jobs failed', e.message);
      return [];
    });

    return res.json({
      success: true,
      data: {
        user,
        profile: {
          headline: profile.headline,
          summary: profile.summary,
          location: profile.location,
          githubUrl: profile.githubUrl,
          linkedinUrl: profile.linkedinUrl,
          portfolioUrl: profile.portfolioUrl,
          skills: profile.skills || [],
          experience: profile.experience || [],
          education: profile.education || [],
          jobsSwiped: profile.jobsSwiped || [],
          totalMatches: profile.stats?.totalMatches || 0,
          aiReadiness: profile.aiReadiness || {},
          profileStrength: profile.profileStrength != null ? profile.profileStrength : null,
        },
        topJobs,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const profile = await SeekerProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Seeker profile not found' });
    }

    await Promise.all([
      Experience.deleteMany({ seekerProfile: profile._id }),
      Education.deleteMany({ seekerProfile: profile._id }),
      Skill.deleteMany({ seekerProfile: profile._id }),
    ]);

    await profile.deleteOne();

    return res.json({ success: true, message: 'Seeker profile and resume data deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
