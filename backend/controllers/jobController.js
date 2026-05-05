const Job = require('../models/Job');
const HirerProfile = require('../models/HirerProfile');
const SeekerProfile = require('../models/SeekerProfile');
const dotenv = require('dotenv');
dotenv.config();
let GoogleGenerativeAI;
try {
  GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
} catch (e) {
  // package may not be installed in some environments; AI calls will be skipped
  GoogleGenerativeAI = null;
}

function normalizeString(value) {
  return value === undefined || value === null ? null : String(value).trim();
}

function parseLocation(value) {
  if (!value) return {};
  if (typeof value === 'string') return { city: value.trim() };
  if (typeof value === 'object') {
    return {
      city: value.city ? String(value.city).trim() : undefined,
      country: value.country ? String(value.country).trim() : undefined,
      isRemote: typeof value.isRemote === 'boolean' ? value.isRemote : undefined,
      rangeKm: typeof value.rangeKm === 'number' ? value.rangeKm : undefined,
    };
  }
  return {};
}

function parseSalaryRange(value) {
  if (!value || typeof value !== 'object') return null;
  const min = Number(value.min);
  const max = Number(value.max);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return {
    min,
    max,
    currency: normalizeString(value.currency) || 'USD',
    period: normalizeString(value.period) || 'annual',
    isVisible: true,
  };
}

function normalizeRequiredSkills(skills) {
  if (!Array.isArray(skills)) return null;
  const normalized = [];
  for (const raw of skills) {
    if (!raw) continue;
    if (typeof raw === 'string') {
      const name = normalizeString(raw);
      if (name) normalized.push({ name, isMandatory: true, minYears: 0 });
      continue;
    }
    if (typeof raw === 'object' && raw.name) {
      const name = normalizeString(raw.name);
      if (!name) continue;
      normalized.push({
        name,
        isMandatory: typeof raw.isMandatory === 'boolean' ? raw.isMandatory : true,
        minYears: Number.isFinite(Number(raw.minYears)) ? Number(raw.minYears) : 0,
      });
    }
  }
  return normalized.length ? normalized : null;
}

exports.postJob = async (req, res) => {
  try {
    const user = req.user;
    const hirerProfile = await HirerProfile.findOne({ user: user._id });
    if (!hirerProfile) {
      return res.status(404).json({ success: false, error: 'Hirer profile not found' });
    }

    const {
      title,
      company,
      location,
      salaryRange,
      description,
      requiredSkills,
      minYearsOfExperience,
      educationRequirement,
      preferredUniversities,
      jobType,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, error: 'Job title is required' });
    }
    if (!company || !String(company).trim()) {
      return res.status(400).json({ success: false, error: 'Company name is required' });
    }
    if (!description || !String(description).trim()) {
      return res.status(400).json({ success: false, error: 'Job description is required' });
    }

    const salary = parseSalaryRange(salaryRange);
    if (!salary) {
      return res.status(400).json({ success: false, error: 'salaryRange must include numeric min and max values' });
    }

    const skills = normalizeRequiredSkills(requiredSkills);
    if (!skills) {
      return res.status(400).json({ success: false, error: 'requiredSkills must be a non-empty array' });
    }

    const experienceYears = Number(minYearsOfExperience);
    if (!Number.isFinite(experienceYears) || experienceYears < 0) {
      return res.status(400).json({ success: false, error: 'minYearsOfExperience must be a valid non-negative number' });
    }

    const preferred = Array.isArray(preferredUniversities)
      ? preferredUniversities.map((item) => normalizeString(item)).filter(Boolean)
      : [];

    const job = await Job.create({
      hirer: hirerProfile._id,
      postedBy: user._id,
      title: String(title).trim(),
      company: String(company).trim(),
      description: String(description).trim(),
      location: parseLocation(location),
      salary,
      minExperienceYears: experienceYears,
      educationRequirement: normalizeString(educationRequirement) || 'Not specified',
      preferredUniversities: preferred,
      requiredSkills: skills,
      jobType: normalizeString(jobType) || 'full_time',
      postedAt: new Date(),
      publishedAt: new Date(),
      status: 'active',
    });

    return res.status(201).json({ success: true, data: job });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

async function getOwnedJob(userId, jobId) {
  const hirerProfile = await HirerProfile.findOne({ user: userId });
  if (!hirerProfile) return null;
  return Job.findOne({ _id: jobId, hirer: hirerProfile._id });
}

exports.updateJob = async (req, res) => {
  try {
    const user = req.user;
    const job = await getOwnedJob(user._id, req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const {
      title,
      company,
      location,
      salaryRange,
      description,
      requiredSkills,
      minYearsOfExperience,
      educationRequirement,
      preferredUniversities,
      jobType,
      status,
      publishedAt,
      expiresAt,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, error: 'Job title is required' });
    }
    if (!company || !String(company).trim()) {
      return res.status(400).json({ success: false, error: 'Company name is required' });
    }
    if (!description || !String(description).trim()) {
      return res.status(400).json({ success: false, error: 'Job description is required' });
    }

    const salary = parseSalaryRange(salaryRange);
    if (!salary) {
      return res.status(400).json({ success: false, error: 'salaryRange must include numeric min and max values' });
    }

    const skills = normalizeRequiredSkills(requiredSkills);
    if (!skills) {
      return res.status(400).json({ success: false, error: 'requiredSkills must be a non-empty array' });
    }

    const experienceYears = Number(minYearsOfExperience);
    if (!Number.isFinite(experienceYears) || experienceYears < 0) {
      return res.status(400).json({ success: false, error: 'minYearsOfExperience must be a valid non-negative number' });
    }

    job.title = String(title).trim();
    job.company = String(company).trim();
    job.description = String(description).trim();
    job.location = parseLocation(location);
    job.salary = salary;
    job.minExperienceYears = experienceYears;
    job.educationRequirement = normalizeString(educationRequirement) || 'Not specified';
    job.preferredUniversities = Array.isArray(preferredUniversities)
      ? preferredUniversities.map((item) => normalizeString(item)).filter(Boolean)
      : job.preferredUniversities;
    job.requiredSkills = skills;
    job.jobType = normalizeString(jobType) || job.jobType;
    job.status = normalizeString(status) || job.status;
    job.publishedAt = publishedAt ? new Date(publishedAt) : job.publishedAt;
    job.expiresAt = expiresAt ? new Date(expiresAt) : job.expiresAt;

    await job.save();

    return res.json({ success: true, data: job });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.patchJob = async (req, res) => {
  try {
    const user = req.user;
    const job = await getOwnedJob(user._id, req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const {
      title,
      company,
      location,
      salaryRange,
      description,
      requiredSkills,
      minYearsOfExperience,
      educationRequirement,
      preferredUniversities,
      jobType,
      status,
      publishedAt,
      expiresAt,
    } = req.body;

    if (title !== undefined) {
      if (!String(title).trim()) return res.status(400).json({ success: false, error: 'Job title cannot be empty' });
      job.title = String(title).trim();
    }
    if (company !== undefined) {
      if (!String(company).trim()) return res.status(400).json({ success: false, error: 'Company name cannot be empty' });
      job.company = String(company).trim();
    }
    if (description !== undefined) {
      if (!String(description).trim()) return res.status(400).json({ success: false, error: 'Job description cannot be empty' });
      job.description = String(description).trim();
    }
    if (location !== undefined) job.location = parseLocation(location);
    if (salaryRange !== undefined) {
      const salary = parseSalaryRange(salaryRange);
      if (!salary) return res.status(400).json({ success: false, error: 'salaryRange must include numeric min and max values' });
      job.salary = salary;
    }
    if (requiredSkills !== undefined) {
      const skills = normalizeRequiredSkills(requiredSkills);
      if (!skills) return res.status(400).json({ success: false, error: 'requiredSkills must be a non-empty array' });
      job.requiredSkills = skills;
    }
    if (minYearsOfExperience !== undefined) {
      const experienceYears = Number(minYearsOfExperience);
      if (!Number.isFinite(experienceYears) || experienceYears < 0) return res.status(400).json({ success: false, error: 'minYearsOfExperience must be a valid non-negative number' });
      job.minExperienceYears = experienceYears;
    }
    if (educationRequirement !== undefined) job.educationRequirement = normalizeString(educationRequirement) || job.educationRequirement;
    if (preferredUniversities !== undefined) job.preferredUniversities = Array.isArray(preferredUniversities)
      ? preferredUniversities.map((item) => normalizeString(item)).filter(Boolean)
      : job.preferredUniversities;
    if (jobType !== undefined) job.jobType = normalizeString(jobType) || job.jobType;
    if (status !== undefined) job.status = normalizeString(status) || job.status;
    if (publishedAt !== undefined) job.publishedAt = publishedAt ? new Date(publishedAt) : job.publishedAt;
    if (expiresAt !== undefined) job.expiresAt = expiresAt ? new Date(expiresAt) : job.expiresAt;

    await job.save();

    return res.json({ success: true, data: job });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const user = req.user;
    const job = await getOwnedJob(user._id, req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    await job.deleteOne();
    return res.json({ success: true, message: 'Job deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

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
  const inter = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  if (!union) return 0;
  return inter / union;
}

async function callAiSimilarity(profileText, jobText) {
  const API_KEY = process.env.GEMINI_API_KEY || process.env.GEN_API_KEY || process.env.GOOGLE_API_KEY;
  if (!API_KEY || !GoogleGenerativeAI) return null;

  const genAI = new GoogleGenerativeAI(API_KEY);
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
  let lastErr;

  const prompt = `You are an assistant that compares a user's profile text with a job posting. Respond with ONLY a JSON object containing a single key "similarity" with an integer percentage 0-100 indicating how well the user's profile matches the job.

PROFILE_TEXT:\n${profileText}\n\nJOB_TEXT:\n${jobText}\n\nRespond ONLY with valid JSON, for example: {"similarity": 78}`;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in AI response');
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.similarity === 'number') return Number(parsed.similarity);
    } catch (err) {
      lastErr = err;
      continue;
    }
  }
  console.warn('[AI SIMILARITY] All models failed:', lastErr && lastErr.message);
  return null;
}

exports.getClosestJobs = async (req, res) => {
  try {
    const userId = req.user._id;
    const profile = await SeekerProfile.findOne({ user: userId }).populate('skills');
    if (!profile) return res.status(404).json({ success: false, error: 'Seeker profile not found' });

    // Build profile text from headline, summary and skills
    const profileText = [profile.headline || '', profile.summary || '', (profile.skills || []).map(s => (typeof s === 'object' ? s.name : s)).join(' ')].filter(Boolean).join('\n');

    // Exclude jobs the seeker already swiped on
    const swipedJobs = await require('../models/Swipe').find({ swipeType: 'seeker_on_job', swipedBy: userId }).select('job').lean();
    const swipedJobIds = new Set(swipedJobs.map((s) => String(s.job)));

    // Fetch candidate jobs (active) excluding swiped
    const jobs = await Job.find({ status: 'active', _id: { $nin: Array.from(swipedJobIds) } }).limit(100).lean();

    // compute local similarity scores
    const scored = jobs.map((job) => {
      const jobText = [job.title || '', job.description || '', (job.requiredSkills || []).map(s => (s && s.name) || s || '').join(' ')].filter(Boolean).join('\n');
      const t1 = tokenize(profileText);
      const t2 = tokenize(jobText);
      const localScore = Math.round(jaccard(t1, t2) * 100);
      return { job, localScore, jobText };
    });

    // take top candidates by localScore
    scored.sort((a, b) => b.localScore - a.localScore);
    const top = scored.slice(0, 20);

    // For top candidates, call AI for refined similarity where possible
    const results = [];
    for (const item of top) {
      let similarity = item.localScore; // default
      const aiScore = await callAiSimilarity(profileText, item.jobText).catch(() => null);
      if (typeof aiScore === 'number') similarity = Math.max(0, Math.min(100, Math.round(aiScore)));

      results.push({
        similarity,
        title: item.job.title,
        description: item.job.description,
        requiredSkills: (item.job.requiredSkills || []).map(s => (s && s.name) || s || ''),
        company: item.job.company,
        jobId: item.job._id,
      });
    }

    // sort by final similarity desc
    results.sort((a, b) => b.similarity - a.similarity);

    return res.json({ success: true, data: results });
  } catch (err) {
    console.error('[getClosestJobs]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Find candidates closest to a given job's description
exports.getCandidates = async (req, res) => {
  try {
    const userId = req.user._id;
    const jobId = req.params.id;

    // ensure hirer owns the job
    const job = await getOwnedJob(userId, jobId);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found or access denied' });

    const jobText = [job.title || '', job.description || '', (job.requiredSkills || []).map(s => (s && s.name) || s || '').join(' ')].filter(Boolean).join('\n');

    // Only consider seekers who have swiped on this job (direction right)
    const seekerOnJobSwipes = await require('../models/Swipe').find({ swipeType: 'seeker_on_job', job: jobId, direction: 'right' }).select('swipedBy').lean();
    const seekerUserIds = seekerOnJobSwipes.map((s) => String(s.swipedBy));

    // fetch seeker profiles for those users (limit to reasonable number)
    const seekers = await SeekerProfile.find({ isActive: true, user: { $in: seekerUserIds } }).limit(300).populate('skills').lean();

    // Exclude seekers the hirer already swiped on for this hirer
    const swipesByHirer = await require('../models/Swipe').find({ swipeType: 'hirer_on_seeker', hirerProfile: job.hirer }).select('seekerProfile').lean();
    const swipedSeekerIds = new Set(swipesByHirer.map((s) => String(s.seekerProfile)));

    const scored = seekers
      .filter((profile) => !swipedSeekerIds.has(String(profile._id)))
      .map((profile) => {
        const profileText = [profile.headline || '', profile.summary || '', (profile.skills || []).map(s => (s && s.name) || s || '').join(' ')].filter(Boolean).join('\n');
        const t1 = tokenize(jobText);
        const t2 = tokenize(profileText);
        const localScore = Math.round(jaccard(t1, t2) * 100);
        return { profile, localScore, profileText };
      });

    scored.sort((a, b) => b.localScore - a.localScore);
    const top = scored.slice(0, 30);

    const results = [];
    for (const item of top) {
      let similarity = item.localScore;
      const aiScore = await callAiSimilarity(item.profileText, jobText).catch(() => null);
      if (typeof aiScore === 'number') similarity = Math.max(0, Math.min(100, Math.round(aiScore)));

      // try to get candidate name from populated user if available
      let candidateName = null;
      try {
        const User = require('../models/User');
        const user = await User.findById(item.profile.user).select('fullName').lean();
        if (user) candidateName = user.fullName || null;
      } catch (e) {
        candidateName = null;
      }

      results.push({
        similarity,
        candidateName,
        role: item.profile.headline || null,
        location: item.profile.location || null,
        description: item.profile.summary || null,
        skills: (item.profile.skills || []).map(s => (s && s.name) || s || ''),
        profileId: item.profile._id,
      });
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return res.json({ success: true, data: results });
  } catch (err) {
    console.error('[getCandidates]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMyJobs = async (req, res) => {
  try {
    const userId = req.user._id;
    const hirerProfile = await HirerProfile.findOne({ user: userId });
    if (!hirerProfile) return res.status(404).json({ success: false, error: 'Hirer profile not found' });

    const jobs = await Job.find({ hirer: hirerProfile._id, status: 'active' }).lean();
    return res.json({ success: true, data: jobs });
  } catch (err) {
    console.error('[getMyJobs]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
