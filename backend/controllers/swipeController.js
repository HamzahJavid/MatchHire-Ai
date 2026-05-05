const Swipe = require('../models/Swipe');
const Match = require('../models/Match');
const SeekerProfile = require('../models/SeekerProfile');
const HirerProfile = require('../models/HirerProfile');
const Job = require('../models/Job');
const User = require('../models/User');

function mapTypeToDirection(type) {
  if (!type) return null;
  const t = String(type).toLowerCase();
  if (t === 'heart' || t === 'right') return 'right';
  return 'left';
}

exports.swipeJob = async (req, res) => {
  try {
    const user = req.user; // seeker
    const { jobId, type } = req.body;
    if (!jobId) return res.status(400).json({ success: false, error: 'jobId required' });
    const direction = mapTypeToDirection(type);
    if (!direction) return res.status(400).json({ success: false, error: 'type must be heart or reject' });

    let seekerProfile = await SeekerProfile.findOne({ user: user._id });
    if (!seekerProfile) {
      // Create a minimal seeker profile automatically to avoid errors when a user hasn't completed profile setup yet
      try {
        const userRecord = await User.findById(user._id).lean();
        seekerProfile = await SeekerProfile.create({
          user: user._id,
          headline: userRecord?.fullName || 'Candidate',
          summary: userRecord?.fullName ? `${userRecord.fullName} — profile created automatically` : 'Profile created automatically',
          isPublic: true,
        });
        // mark user as having seeker profile
        await User.findByIdAndUpdate(user._id, { $set: { hasSeeker: true } });
      } catch (e) {
        console.warn('[swipeJob] failed to create placeholder seeker profile', e.message);
        return res.status(404).json({ success: false, error: 'Seeker profile not found' });
      }
    }

    const job = await Job.findById(jobId).populate('hirer');
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

    const swipe = await Swipe.findOneAndUpdate(
      { swipeType: 'seeker_on_job', swipedBy: user._id, job: jobId },
      { $set: { direction } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // update seeker profile stats and jobsSwiped
    try {
      const update = { $inc: { 'stats.totalSwipes': 1 } };
      if (direction === 'right') update.$inc['stats.rightSwipes'] = 1;
      else update.$inc['stats.leftSwipes'] = 1;
      // push job id into jobsSwiped if not present
      await SeekerProfile.findByIdAndUpdate(seekerProfile._id, { ...update, $addToSet: { jobsSwiped: jobId } });
    } catch (e) {
      console.warn('[swipeJob] failed to update seeker stats', e.message);
    }

    // If seeker hearted, check if hirer already hearted this seeker for this hirer
    if (direction === 'right') {
      const hirerProfile = await HirerProfile.findById(job.hirer);
      const hirerSwipe = await Swipe.findOne({ swipeType: 'hirer_on_seeker', seekerProfile: seekerProfile._id, hirerProfile: hirerProfile._id, direction: 'right' });
      if (hirerSwipe) {
        // create match if not exists
        const MatchModel = require('../models/Match');
        const existing = await MatchModel.findOne({ job: jobId, seeker: user._id });
        if (!existing) {
          const match = await MatchModel.create({
            job: jobId,
            seeker: user._id,
            seekerProfile: seekerProfile._id,
            hirer: hirerProfile.user,
            hirerProfile: hirerProfile._id,
            seekerSwipe: swipe._id,
            hirerSwipe: hirerSwipe._id,
            matchedAt: new Date(),
          });

          // increment match counters for both parties
          try {
            await SeekerProfile.findByIdAndUpdate(seekerProfile._id, { $inc: { 'stats.totalMatches': 1 } });
            await HirerProfile.findByIdAndUpdate(hirerProfile._id, { $inc: { 'stats.totalMatches': 1 } });
          } catch (e) {
            console.warn('[swipeJob] failed to increment match counters', e.message);
          }

          // attempt to notify AI about match (best-effort)
          let aiNote = null;
          try {
            const GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
            if (process.env.GEMINI_API_KEY && GoogleGenerativeAI) {
              const gen = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
              const model = gen.getGenerativeModel({ model: 'gemini-2.5-flash' });
              const prompt = `A match was created on MatchHire between seeker (${seekerProfile._id}) and hirer (${hirerProfile._id}) for job ${jobId}. Provide a short congratulatory message and suggested first steps for the hirer and seeker in JSON: { "message": "...", "hirerNextSteps": [..], "seekerNextSteps": [..] }`;
              const out = await model.generateContent(prompt);
              aiNote = (out && out.response && out.response.text && out.response.text()) || null;
            }
          } catch (e) {
            console.warn('[swipeJob] AI notify failed', e.message);
          }

          return res.json({ success: true, data: { swipe, match, aiNote } });
        }
      }
    }

    return res.json({ success: true, data: swipe });
  } catch (err) {
    console.error('[swipeJob]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.swipeCandidate = async (req, res) => {
  try {
    const user = req.user; // hirer
    const { userId, jobId, type } = req.body;
    if (!userId || !jobId) return res.status(400).json({ success: false, error: 'userId and jobId required' });
    const direction = mapTypeToDirection(type);
    if (!direction) return res.status(400).json({ success: false, error: 'type must be heart or reject' });

    const hirerProfile = await HirerProfile.findOne({ user: user._id });
    if (!hirerProfile) return res.status(404).json({ success: false, error: 'Hirer profile not found' });

    let seekerProfile = await SeekerProfile.findOne({ user: userId });
    if (!seekerProfile) {
      // If the target seeker has no profile, create a minimal placeholder so hirer actions can proceed
      try {
        const userRecord = await User.findById(userId).lean();
        seekerProfile = await SeekerProfile.create({
          user: userId,
          headline: userRecord?.fullName || 'Candidate',
          summary: userRecord?.fullName ? `${userRecord.fullName} — profile created automatically` : 'Profile created automatically',
          isPublic: true,
        });
      } catch (e) {
        console.warn('[swipeCandidate] failed to create placeholder seeker profile', e.message);
        return res.status(404).json({ success: false, error: 'Seeker profile not found' });
      }
    }

    const swipe = await Swipe.findOneAndUpdate(
      { swipeType: 'hirer_on_seeker', swipedBy: user._id, seekerProfile: seekerProfile._id, hirerProfile: hirerProfile._id },
      { $set: { direction, job: jobId } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // update hirer stats (denormalised candidate counts)
    try {
      if (direction === 'right') {
        await HirerProfile.findByIdAndUpdate(hirerProfile._id, { $inc: { 'stats.totalCandidates': 1 } });
      }
    } catch (e) {
      console.warn('[swipeCandidate] failed to update hirer stats', e.message);
    }

    // If hirer hearted, check if seeker already hearted this job
    if (direction === 'right') {
      const seekerSwipe = await Swipe.findOne({ swipeType: 'seeker_on_job', swipedBy: userId, job: jobId, direction: 'right' });
      if (seekerSwipe) {
        const MatchModel = require('../models/Match');
        const existing = await MatchModel.findOne({ job: jobId, seeker: userId });
        if (!existing) {
          const match = await MatchModel.create({
            job: jobId,
            seeker: userId,
            seekerProfile: seekerProfile._id,
            hirer: user._id,
            hirerProfile: hirerProfile._id,
            seekerSwipe: seekerSwipe._id,
            hirerSwipe: swipe._id,
            matchedAt: new Date(),
          });

          // increment match counters
          try {
            await SeekerProfile.findByIdAndUpdate(seekerProfile._id, { $inc: { 'stats.totalMatches': 1 } });
            await HirerProfile.findByIdAndUpdate(hirerProfile._id, { $inc: { 'stats.totalMatches': 1 } });
          } catch (e) {
            console.warn('[swipeCandidate] failed to increment match counters', e.message);
          }

          // AI notify (best-effort)
          let aiNote = null;
          try {
            const GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
            if (process.env.GEMINI_API_KEY && GoogleGenerativeAI) {
              const gen = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
              const model = gen.getGenerativeModel({ model: 'gemini-2.5-flash' });
              const prompt = `A match was created on MatchHire between seeker (${seekerProfile._id}) and hirer (${hirerProfile._id}) for job ${jobId}. Provide a short congratulatory message and suggested first steps for the hirer and seeker in JSON: { "message": "...", "hirerNextSteps": [..], "seekerNextSteps": [..] }`;
              const out = await model.generateContent(prompt);
              aiNote = (out && out.response && out.response.text && out.response.text()) || null;
            }
          } catch (e) {
            console.warn('[swipeCandidate] AI notify failed', e.message);
          }

          return res.json({ success: true, data: { swipe, match, aiNote } });
        }
      }
    }

    return res.json({ success: true, data: swipe });
  } catch (err) {
    console.error('[swipeCandidate]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
