const SeekerProfile = require('../models/SeekerProfile');
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
    const { role, roleDescription, experience, skills, level } = req.body || {};
    const payload = { role, roleDescription, experience, skills, level, userId };
    let questions = await callAiGenerateQuestions(payload).catch(() => null);
    if (!questions) questions = fallbackQuestions(role || 'candidate', experience || '');
    return res.json({ success: true, data: { questions } });
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
    const { jobDescription, qna } = req.body || {};
    if (!Array.isArray(qna) || qna.length === 0) return res.status(400).json({ success: false, error: 'qna required' });
    const aiResult = await callAiEvaluate(qna, jobDescription || '').catch(() => null);

    // store in seeker profile aiReadiness
    const seeker = await SeekerProfile.findOne({ user: userId });
    if (seeker && aiResult && typeof aiResult.score === 'number') {
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
    }

    return res.json({ success: true, data: { aiResult } });
  } catch (err) {
    console.error('[evaluateTest]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
