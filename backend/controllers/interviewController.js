const SeekerProfile = require('../models/SeekerProfile');
const HirerProfile = require('../models/HirerProfile');
const Interview = require('../models/Interview');
const Match = require('../models/Match');
const Job = require('../models/Job');
const Message = require('../models/Message');
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

async function callAiGenerateQuestions(payload, questionCount = 10) {
  if (!process.env.GEMINI_API_KEY || !GoogleGenerativeAI) return null;
  const gen = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
  const prompt = `You are an expert interviewer. Given the following JSON input, generate a JSON response containing these keys:

"questions": an array of the top ${questionCount} interview questions tailored to this candidate and role.
"candidateName": the candidate's full name if discernible from the profile, otherwise null.
"links": an array of helpful profile links (GitHub, LinkedIn, portfolio) if found.

INPUT:
${JSON.stringify(payload, null, 2)}

Response example: { "questions": ["Q1","Q2", ...], "candidateName":"Jane Doe", "links": ["https://...", "https://..."] }
Only return valid JSON.`;

  for (let i = 0; i < modelsToTry.length; i++) {
    const modelName = modelsToTry[i];

    // Add delay before retrying another model (2 seconds between attempts)
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    try {
      const model = gen.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;
      const parsed = JSON.parse(jsonMatch[0]);
      // Normalize into object with questions array
      if (Array.isArray(parsed.questions)) {
        return {
          questions: parsed.questions.slice(0, questionCount),
          candidateName: parsed.candidateName || null,
          links: Array.isArray(parsed.links) ? parsed.links.filter(Boolean) : [],
        };
      }
    } catch (e) {
      continue;
    }
  }
}

function normalizeQuestions(questions) {
  return (Array.isArray(questions) ? questions : [])
    .map((item, index) => {
      const text = typeof item === 'string' ? item : item?.text;
      if (!text || !String(text).trim()) return null;
      return {
        questionId: item?.questionId || `q_${Date.now()}_${index}`,
        text: String(text).trim(),
        order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index + 1,
      };
    })
    .filter(Boolean);
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
    const aiResult = await callAiGenerateQuestions(payload).catch(() => null);
    let questions = aiResult && Array.isArray(aiResult.questions) ? aiResult.questions : null;
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

function buildFallbackEvaluation(questionsAndAnswers) {
  const answerText = JSON.stringify(questionsAndAnswers || []).toLowerCase();
  const richness = Math.min(100, Math.max(45, answerText.length > 1000 ? 82 : answerText.length > 500 ? 74 : 62));
  return {
    score: richness,
    breakdown: {
      communication: Math.min(100, richness + 4),
      technical: Math.min(100, richness - 2),
      fit: Math.min(100, richness),
    },
    comment: 'Fallback evaluation generated locally because the AI service was unavailable. The answers were accepted and stored successfully.',
    strengths: ['Clear submission', 'Completed all interview responses'],
    improvements: ['Use more role-specific examples', 'Add measurable outcomes where possible'],
  };
}

async function callAiEvaluate(questionsAndAnswers, jobDescription) {
  if (!process.env.GEMINI_API_KEY || !GoogleGenerativeAI) return buildFallbackEvaluation(questionsAndAnswers);
  const gen = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
  const prompt = `You are an expert interviewer and evaluator. Given the job description and a list of question/answer pairs, return ONLY a JSON object: { "score": N, "breakdown": {"communication":N, "technical":N, "fit":N }, "comment": "..." } where score is 0-100 representing AI readiness.

JOB_DESCRIPTION:
${jobDescription}

Q_AND_A:
${JSON.stringify(questionsAndAnswers, null, 2)}

Return only valid JSON.`;

  for (let i = 0; i < modelsToTry.length; i++) {
    const modelName = modelsToTry[i];

    // Add delay before retrying another model (2 seconds between attempts)
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

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

  return buildFallbackEvaluation(questionsAndAnswers);
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

    const existingInterviewQuery = { seeker: userId, job: jobId, type: 'real' };
    if (matchId) existingInterviewQuery.match = matchId;

    const existingInterview = await Interview.findOne(existingInterviewQuery).sort({ createdAt: -1 });
    if (existingInterview && !['cancelled', 'expired'].includes(existingInterview.status)) {
      if (existingInterview.status === 'scheduled') {
        existingInterview.status = 'in_progress';
        existingInterview.startedAt = existingInterview.startedAt || new Date();
        await existingInterview.save();
      }

      return res.json({
        success: true,
        data: {
          interviewId: existingInterview._id,
          questions: existingInterview.questions || [],
          totalQuestions: existingInterview.questions?.length || 0,
          interview: existingInterview,
          reused: true,
        },
      });
    }

    // Generate questions for this job
    const payload = {
      role: job.title,
      roleDescription: job.description,
      experience: seekerProfile.totalYearsOfExperience?.toString() || '0',
      skills: seekerProfile.skills?.slice(0, 5).map((s) => s.name) || [],
      level: 'candidate',
    };

    const aiResult = await callAiGenerateQuestions(payload).catch(() => null);
    let questions = aiResult && Array.isArray(aiResult.questions) ? aiResult.questions : null;
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
        interview,
      },
    });
  } catch (err) {
    console.error('[startRealInterview]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// HIRER: Generate an AI interview from the matched seeker profile
exports.generateMatchInterview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { matchId, stage = 'screening', questionCount = 8, mode = 'ai' } = req.body || {};

    if (!matchId) {
      return res.status(400).json({ success: false, error: 'matchId required' });
    }

    const match = await Match.findById(matchId).populate('job seeker seekerProfile hirerProfile');
    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    if (String(match.hirer) !== String(userId)) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const seekerProfile = match.seekerProfile;
    const job = match.job;
    const hirerProfile = await HirerProfile.findOne({ user: userId });

    const manualQuestions = mode === 'manual' ? normalizeQuestions(req.body.questions) : [];
    let generatedQuestions = manualQuestions;
    let candidateName = null;
    let candidateLinks = [];

    if (mode === 'ai') {
      const payload = {
        jobTitle: job?.title,
        jobDescription: job?.description,
        company: job?.company,
        stage,
        seeker: {
          headline: seekerProfile?.headline,
          summary: seekerProfile?.summary,
          location: seekerProfile?.location,
          skills: Array.isArray(seekerProfile?.skills)
            ? seekerProfile.skills.map((skill) => skill?.name || skill).filter(Boolean)
            : [],
          totalYearsOfExperience: seekerProfile?.totalYearsOfExperience || 0,
        },
        questionCount,
      };

      const aiResult = await callAiGenerateQuestions(payload, Number(questionCount) || 8).catch(() => null);
      if (aiResult && Array.isArray(aiResult.questions)) {
        generatedQuestions = normalizeQuestions(aiResult.questions || []);
        candidateName = aiResult.candidateName || null;
        candidateLinks = Array.isArray(aiResult.links) ? aiResult.links.filter(Boolean) : [];
      }
    }

    if (!generatedQuestions.length) {
      generatedQuestions = normalizeQuestions(fallbackQuestions(job?.title || 'candidate', seekerProfile?.headline || ''));
    }

    const existingInterview = await Interview.findOne({ match: matchId, hirer: userId });
    const interviewPayload = {
      match: matchId,
      job: job?._id || match.job,
      hirer: userId,
      hirerProfile: hirerProfile?._id || null,
      seeker: match.seeker?._id || match.seeker,
      seekerProfile: seekerProfile?._id || match.seekerProfile,
      type: 'real',
      stage,
      role: job?.title || match.job?.title || 'Interview',
      roleDescription: job?.description || match.job?.description || '',
      candidateContext: {
        experience: String(seekerProfile?.totalYearsOfExperience || 0),
        skills: Array.isArray(seekerProfile?.skills)
          ? seekerProfile.skills.map((skill) => skill?.name || skill).filter(Boolean)
          : [],
        level: seekerProfile?.highestEducationLevel || 'candidate',
      },
      questions: generatedQuestions,
      status: 'scheduled',
      scheduledAt: new Date(),
      startedAt: null,
      completedAt: null,
      notes: mode === 'manual' ? 'Manual interview created by hirer' : 'AI-generated interview created by hirer',
    };

    // Attach candidateName and links as top-level fields so they persist
    if (candidateName) interviewPayload.candidateName = candidateName;
    if (candidateLinks && candidateLinks.length) interviewPayload.candidateLinks = candidateLinks;

    // If an interview already exists for this match and hirer, do not create/send a duplicate
    if (existingInterview && !['cancelled', 'expired'].includes(String(existingInterview.status))) {
      return res.json({
        success: true,
        data: {
          interviewId: existingInterview._id,
          exists: true,
          message: 'An active interview already exists for this match',
        },
      });
    }

    const interview = existingInterview
      ? Object.assign(existingInterview, interviewPayload)
      : new Interview(interviewPayload);

    const isNew = !existingInterview;
    await interview.save();
    await Match.findByIdAndUpdate(matchId, { status: 'interviewing' });

    // Send a single notification message only when creating a new interview
    if (isNew) {
      await Message.create({
        match: matchId,
        sender: userId,
        receiver: match.seeker?._id || match.seeker,
        text: `An interview has been prepared for you by ${req.user.fullName}. Please open the interview to answer the questions.`,
        type: 'interview_link',
        metadata: {
          interviewId: interview._id,
          actionType: 'interview_scheduled',
        },
      });
    }

    return res.json({
      success: true,
      data: {
        interviewId: interview._id,
        matchId,
        mode,
        questions: generatedQuestions,
        interview,
      },
    });
  } catch (err) {
    console.error('[generateMatchInterview]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// HIRER: Post interview questions to a seeker for a match
exports.postInterviewQuestions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { matchId, questions: questionTexts, stage = "screening" } = req.body || {};

    if (!matchId || !Array.isArray(questionTexts) || questionTexts.length === 0) {
      return res.status(400).json({ success: false, error: "matchId and questions required" });
    }

    // Get match details
    const match = await Match.findById(matchId).populate("seeker seekerProfile job");
    if (!match) {
      return res.status(404).json({ success: false, error: "Match not found" });
    }

    // Verify hirer owns this match
    if (match.hirer.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    // Check if interview already exists for this match
    let interview = await Interview.findOne({ match: matchId, hirer: userId });

    const questionsData = questionTexts.map((text, index) => ({
      questionId: `q_${Date.now()}_${index}`,
      text: text.trim(),
      order: index + 1,
    }));

    if (interview) {
      // Update existing interview with new questions
      interview.questions = questionsData;
      interview.status = "scheduled";
      interview.startedAt = null;
      interview.completedAt = null;
      interview.responses = [];
    } else {
      // Create new interview
      interview = new Interview({
        match: matchId,
        job: match.job._id,
        hirer: userId,
        hirerProfile: req.user.hirerProfile || null, // will be populated from user profile
        seeker: match.seeker._id,
        seekerProfile: match.seekerProfile._id,
        type: "real",
        stage: stage,
        role: match.job.title,
        roleDescription: match.job.description,
        questions: questionsData,
        status: "scheduled",
        scheduledAt: new Date(),
      });
    }

    await interview.save();
    await Match.findByIdAndUpdate(matchId, { status: 'interviewing' });

    await Message.create({
      match: matchId,
      sender: userId,
      receiver: match.seeker._id || match.seeker,
      text: `You have a new interview from ${req.user.fullName}. Please answer the questions when ready.`,
      type: 'interview_link',
      metadata: {
        interviewId: interview._id,
        actionType: 'manual_interview_scheduled',
      },
    });

    return res.json({
      success: true,
      data: {
        interviewId: interview._id,
        matchId: matchId,
        totalQuestions: questionsData.length,
        questions: questionsData,
      },
    });
  } catch (err) {
    console.error("[postInterviewQuestions]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// SEEKER: Submit answers to hirer's interview questions
exports.submitInterviewAnswers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { interviewId, answers } = req.body || {};

    if (!interviewId || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, error: "interviewId and answers required" });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, error: "Interview not found" });
    }

    // Verify seeker owns this interview
    if (interview.seeker.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    // Save responses
    interview.responses = answers.map((ans) => ({
      questionId: ans.questionId,
      question: ans.question,
      answer: ans.answer.trim(),
      recordedAt: new Date(),
      durationSeconds: ans.durationSeconds || 0,
      audioUrl: ans.audioUrl || null,
    }));

    interview.status = "completed";
    interview.completedAt = new Date();
    if (!interview.startedAt) {
      interview.startedAt = new Date();
    }

    const qna = interview.responses.map((item) => ({
      questionId: item.questionId,
      question: item.question,
      answer: item.answer,
      durationSeconds: item.durationSeconds,
      audioUrl: item.audioUrl,
    }));

    const aiResult = await callAiEvaluate(qna, interview.roleDescription || '').catch(() => null);

    if (aiResult && typeof aiResult.score === 'number') {
      interview.evaluation = {
        score: Math.max(0, Math.min(100, Number(aiResult.score))),
        assessedAt: new Date(),
        breakdown: aiResult.breakdown || {},
        comment: aiResult.comment || '',
        strengths: aiResult.strengths || [],
        improvements: aiResult.improvements || [],
      };

      const seekerProfile = await SeekerProfile.findOne({ user: userId });
      if (seekerProfile) {
        seekerProfile.aiReadiness.score = interview.evaluation.score;
        seekerProfile.aiReadiness.assessedAt = new Date();
        seekerProfile.aiReadiness.breakdown = {
          cvParseConfidence: interview.evaluation.breakdown?.communication ?? seekerProfile.aiReadiness.breakdown?.cvParseConfidence ?? 0,
          skillsMatched: interview.evaluation.breakdown?.technical ?? seekerProfile.aiReadiness.breakdown?.skillsMatched ?? 0,
          profileCompleteness: interview.evaluation.breakdown?.fit ?? seekerProfile.aiReadiness.breakdown?.profileCompleteness ?? 0,
        };

        const score = interview.evaluation.score;
        if (score >= 85) seekerProfile.aiReadiness.tag = 'ai_native';
        else if (score >= 65) seekerProfile.aiReadiness.tag = 'high';
        else if (score >= 40) seekerProfile.aiReadiness.tag = 'moderate';
        else seekerProfile.aiReadiness.tag = 'low';

        await seekerProfile.save();
      }

      const hirerProfile = await HirerProfile.findOne({ user: interview.hirer });
      if (hirerProfile) {
        hirerProfile.stats.totalMatches = Math.max(hirerProfile.stats.totalMatches || 0, hirerProfile.stats.totalMatches || 0);
        await hirerProfile.save();
      }

      await Message.create({
        match: interview.match,
        sender: userId,
        receiver: interview.hirer,
        text: `Interview completed by ${req.user.fullName}. Score: ${interview.evaluation.score}/100.`,
        type: 'system',
        metadata: {
          interviewId: interview._id,
          actionType: 'interview_completed',
        },
      });
    }

    await interview.save();

    return res.json({
      success: true,
      data: {
        interviewId: interview._id,
        message: 'Answers submitted successfully',
        aiResult,
        interview,
      },
    });
  } catch (err) {
    console.error("[submitInterviewAnswers]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// HIRER: Get interview with answers for a match
exports.getInterviewAnswers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId)
      .populate("seeker", "fullName email")
      .populate("seekerProfile", "headline skills")
      .populate("job", "title company description")
      .populate("match");

    if (!interview) {
      return res.status(404).json({ success: false, error: "Interview not found" });
    }

    const ownerId = interview.hirer
      ? String(interview.hirer)
      : interview.match?.hirer
        ? String(interview.match.hirer)
        : null;

    if (!ownerId) {
      return res.status(409).json({
        success: false,
        error: "Interview is missing hirer ownership data",
      });
    }

    // Verify hirer owns this interview
    if (ownerId !== userId.toString()) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    return res.json({
      success: true,
      data: interview,
    });
  } catch (err) {
    console.error("[getInterviewAnswers]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// HIRER: Get interview for a specific match
exports.getInterviewByMatch = async (req, res) => {
  try {
    const userId = req.user._id;
    const { matchId } = req.params;

    const interview = await Interview.findOne({ match: matchId, hirer: userId })
      .populate("seeker", "fullName email")
      .populate("seekerProfile", "headline skills")
      .populate("job", "title company description")
      .populate("match");

    if (!interview) {
      const fallbackInterview = await Interview.findOne({ match: matchId })
        .populate("seeker", "fullName email")
        .populate("seekerProfile", "headline skills")
        .populate("job", "title company description")
        .populate("match");

      if (!fallbackInterview) {
        return res.status(404).json({ success: false, error: "Interview not found for this match" });
      }

      const ownerId = fallbackInterview.hirer
        ? String(fallbackInterview.hirer)
        : fallbackInterview.match?.hirer
          ? String(fallbackInterview.match.hirer)
          : null;

      if (!ownerId || ownerId !== userId.toString()) {
        return res.status(403).json({ success: false, error: "Unauthorized" });
      }

      return res.json({
        success: true,
        data: fallbackInterview,
      });
    }

    return res.json({
      success: true,
      data: interview,
    });
  } catch (err) {
    console.error("[getInterviewByMatch]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
