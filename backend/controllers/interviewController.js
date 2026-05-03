const SeekerProfile = require('../models/SeekerProfile');
const Interview = require('../models/Interview');
const Match = require('../models/Match');
const Job = require('../models/Job');
const dotenv = require('dotenv');
dotenv.config();
let GoogleGenerativeAI;
try { GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI; } catch (e) { GoogleGenerativeAI = null; }

function fallbackQuestions(role, experience) {
  const base = [
    `Tell me about your experience as a ${role}.`,
    `Walk me through a challenging problem you solved in ${role} role.`,
    `Describe a project where you used technologies relevant to ${role}.`,
    `How do you approach debugging and troubleshooting in production?`,
    `Explain a design decision you made recently and why you chose it.`,
    `How do you keep up with new developments in your field?`,
    `Describe a time you received critical feedback and how you responded.`,
    `What's your approach to testing and quality assurance?`,
    `How do you prioritize tasks when working on multiple features?`,
    `Where do you see growth opportunities in your next role?`,
  ];
  return base;
}

async function callAiGenerateQuestions(payload) {
  if (!process.env.GEMINI_API_KEY || !GoogleGenerativeAI) return null;
  const gen = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
  const prompt = `You are an expert interviewer. Given the following JSON input, generate a JSON response containing a single key "questions" with an array of the top 10 interview questions tailored to this candidate and role.

INPUT:
${JSON.stringify(payload, null, 2)}

Response example: { "questions": ["Q1","Q2", ...] }
Only return valid JSON.`;

  for (const modelName of modelsToTry) {
    try {
      const model = gen.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed.questions)) return parsed.questions.slice(0, 10);
    } catch (e) {
      continue;
    }
  }
  return null;
}

exports.generatePractice = async (req, res) => {
  try {
    const userId = req.user._id;
    const { role, roleDescription, experience, skills, level, jobId, type = 'practice' } = req.body || {};

    // Get seeker profile
    const seekerProfile = await SeekerProfile.findOne({ user: userId });
    if (!seekerProfile) {
      return res.status(404).json({ success: false, error: 'Seeker profile not found' });
    }

    const payload = { role, roleDescription, experience, skills, level, userId };
    let questions = await callAiGenerateQuestions(payload).catch(() => null);
    if (!questions) questions = fallbackQuestions(role || 'candidate', experience || '');

    // Create interview record with questions
    const questionsData = questions.map((text, index) => ({
      questionId: `q_${Date.now()}_${index}`,
      text,
      order: index + 1,
    }));

    const interviewData = {
      seeker: userId,
      seekerProfile: seekerProfile._id,
      type,
      stage: type === 'practice' ? 'practice' : 'screening',
      role: role || 'General',
      roleDescription: roleDescription || '',
      candidateContext: {
        experience: experience || '',
        skills: skills || [],
        level: level || 'unknown',
      },
      questions: questionsData,
      status: 'in_progress',
      startedAt: new Date(),
    };

    // Link to job if provided
    if (jobId) {
      const job = await Job.findById(jobId);
      if (job) {
        interviewData.job = jobId;
        interviewData.type = 'real';
        interviewData.stage = 'technical';
      }
    }

    const interview = new Interview(interviewData);
    await interview.save();

    return res.json({
      success: true,
      data: {
        interviewId: interview._id,
        questions: questionsData,
        totalQuestions: questionsData.length,
      },
    });
  } catch (err) {
    console.error('[generatePractice]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

async function callAiEvaluate(questionsAndAnswers, jobDescription) {
  if (!process.env.GEMINI_API_KEY || !GoogleGenerativeAI) return null;
  const gen = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
  const prompt = `You are an expert interviewer and evaluator. Given the job description and a list of question/answer pairs, return ONLY a JSON object: { "score": N, "breakdown": {"communication":N, "technical":N, "fit":N }, "comment": "..." } where score is 0-100 representing AI readiness.

JOB_DESCRIPTION:
${jobDescription}

Q_AND_A:
${JSON.stringify(questionsAndAnswers, null, 2)}

Return only valid JSON.`;

  for (const modelName of modelsToTry) {
    try {
      const model = gen.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.score === 'number') return parsed;
    } catch (e) {
      continue;
    }
  }
  return null;
}

exports.evaluateTest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { interviewId, jobDescription, qna } = req.body || {};
    if (!Array.isArray(qna) || qna.length === 0) {
      return res.status(400).json({ success: false, error: 'qna required' });
    }

    // Find the interview
    const interview = interviewId ? await Interview.findById(interviewId) : null;
    if (interviewId && !interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    // Validate interview belongs to user
    if (interview && interview.seeker.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const aiResult = await callAiEvaluate(qna, jobDescription || '').catch(() => null);

    // Get seeker profile
    const seeker = await SeekerProfile.findOne({ user: userId });
    if (!seeker) {
      return res.status(404).json({ success: false, error: 'Seeker profile not found' });
    }

    // Store evaluation results in seeker profile aiReadiness
    if (aiResult && typeof aiResult.score === 'number') {
      seeker.aiReadiness.score = Math.max(0, Math.min(100, Number(aiResult.score)));
      seeker.aiReadiness.assessedAt = new Date();
      seeker.aiReadiness.breakdown = aiResult.breakdown || seeker.aiReadiness.breakdown;
      // set tag based on score
      const s = seeker.aiReadiness.score;
      if (s >= 85) seeker.aiReadiness.tag = 'ai_native';
      else if (s >= 65) seeker.aiReadiness.tag = 'high';
      else if (s >= 40) seeker.aiReadiness.tag = 'moderate';
      else seeker.aiReadiness.tag = 'low';
      await seeker.save();

      // Update interview with evaluation results if interview exists
      if (interview) {
        // Save responses
        interview.responses = qna.map((item, idx) => ({
          questionId: item.questionId || `q_${idx}`,
          question: item.question,
          answer: item.answer,
          recordedAt: new Date(),
          durationSeconds: item.durationSeconds || 0,
          audioUrl: item.audioUrl || null,
        }));

        // Save evaluation
        interview.evaluation = {
          score: aiResult.score,
          assessedAt: new Date(),
          breakdown: aiResult.breakdown || {},
          comment: aiResult.comment || '',
          strengths: aiResult.strengths || [],
          improvements: aiResult.improvements || [],
        };
        interview.status = 'completed';
        interview.completedAt = new Date();
        await interview.save();
      }
    }

    return res.json({ success: true, data: { aiResult, interviewId: interview?._id } });
  } catch (err) {
    console.error('[evaluateTest]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Save interview responses
exports.saveResponses = async (req, res) => {
  try {
    const userId = req.user._id;
    const { interviewId, responses } = req.body || {};

    if (!interviewId) {
      return res.status(400).json({ success: false, error: 'interviewId required' });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    // Validate ownership
    if (interview.seeker.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Save responses
    if (Array.isArray(responses)) {
      interview.responses = responses.map((r) => ({
        questionId: r.questionId,
        question: r.question,
        answer: r.answer,
        recordedAt: r.recordedAt || new Date(),
        durationSeconds: r.durationSeconds || 0,
        audioUrl: r.audioUrl || null,
      }));
    }

    interview.status = 'completed';
    interview.completedAt = new Date();
    await interview.save();

    return res.json({ success: true, data: { interviewId: interview._id, responsesCount: interview.responses.length } });
  } catch (err) {
    console.error('[saveResponses]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Get interview by ID
exports.getInterview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId)
      .populate('job', 'title company description')
      .populate('match')
      .populate('seekerProfile', 'headline skills');

    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    // Validate ownership
    if (interview.seeker.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    return res.json({ success: true, data: interview });
  } catch (err) {
    console.error('[getInterview]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// List all interviews for a user
exports.listInterviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, status, limit = 10, skip = 0 } = req.query;

    const filter = { seeker: userId };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const interviews = await Interview.find(filter)
      .populate('job', 'title company')
      .populate('seekerProfile', 'headline')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    const total = await Interview.countDocuments(filter);

    return res.json({ success: true, data: { interviews, total, limit: Number(limit), skip: Number(skip) } });
  } catch (err) {
    console.error('[listInterviews]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Get interview statistics for user
exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = {
      total: await Interview.countDocuments({ seeker: userId }),
      completed: await Interview.countDocuments({ seeker: userId, status: 'completed' }),
      inProgress: await Interview.countDocuments({ seeker: userId, status: 'in_progress' }),
      practice: await Interview.countDocuments({ seeker: userId, type: 'practice' }),
      real: await Interview.countDocuments({ seeker: userId, type: 'real' }),
    };

    // Get average score from completed interviews with evaluations
    const completed = await Interview.find({
      seeker: userId,
      status: 'completed',
      'evaluation.score': { $exists: true },
    }).select('evaluation.score');

    if (completed.length > 0) {
      const avgScore = completed.reduce((sum, iv) => sum + (iv.evaluation?.score || 0), 0) / completed.length;
      stats.averageScore = Math.round(avgScore);
    }

    return res.json({ success: true, data: stats });
  } catch (err) {
    console.error('[getStats]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Update interview status
exports.updateStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { interviewId } = req.params;
    const { status, notes } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    // Only seeker can update their own interview
    if (interview.seeker.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Validate status
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled', 'expired'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    if (status) interview.status = status;
    if (notes) interview.notes = notes;

    // Update timestamps based on status
    if (status === 'in_progress' && !interview.startedAt) {
      interview.startedAt = new Date();
    } else if (status === 'completed' && !interview.completedAt) {
      interview.completedAt = new Date();
    }

    await interview.save();

    return res.json({ success: true, data: interview });
  } catch (err) {
    console.error('[updateStatus]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Start a real interview for a job (linked to match)
exports.startRealInterview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { jobId, matchId } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, error: 'jobId required' });
    }

    // Fetch job and validate
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    // Get seeker profile
    const seekerProfile = await SeekerProfile.findOne({ user: userId });
    if (!seekerProfile) {
      return res.status(404).json({ success: false, error: 'Seeker profile not found' });
    }

    // Verify match if provided
    let match = null;
    if (matchId) {
      match = await Match.findById(matchId);
      if (!match || match.seeker.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, error: 'Invalid match' });
      }
    }

    // Generate questions for this job
    const payload = {
      role: job.title,
      roleDescription: job.description,
      experience: seekerProfile.totalYearsOfExperience?.toString() || '0',
      skills: seekerProfile.skills?.slice(0, 5).map((s) => s.name) || [],
      level: 'candidate',
    };

    let questions = await callAiGenerateQuestions(payload).catch(() => null);
    if (!questions) questions = fallbackQuestions(job.title, seekerProfile.totalYearsOfExperience?.toString() || '');

    const questionsData = questions.map((text, index) => ({
      questionId: `q_${Date.now()}_${index}`,
      text,
      order: index + 1,
    }));

    // Create real interview
    const interview = new Interview({
      job: jobId,
      match: matchId || null,
      seeker: userId,
      seekerProfile: seekerProfile._id,
      type: 'real',
      stage: 'technical',
      role: job.title,
      roleDescription: job.description,
      candidateContext: {
        experience: seekerProfile.totalYearsOfExperience?.toString() || '0',
        skills: seekerProfile.skills?.slice(0, 5).map((s) => s.name) || [],
        level: 'candidate',
      },
      questions: questionsData,
      status: 'in_progress',
      startedAt: new Date(),
    });

    await interview.save();

    return res.json({
      success: true,
      data: {
        interviewId: interview._id,
        questions: questionsData,
        totalQuestions: questionsData.length,
      },
    });
  } catch (err) {
    console.error('[startRealInterview]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
