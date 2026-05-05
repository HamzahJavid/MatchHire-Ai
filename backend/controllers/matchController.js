const Match = require('../models/Match');
const Message = require('../models/Message');
const Interview = require('../models/Interview');

function toPlain(doc) {
    if (!doc) return null;
    return typeof doc.toObject === 'function' ? doc.toObject() : doc;
}

function buildTitle(match, userId) {
    const seekerId = match.seeker?._id ? String(match.seeker._id) : String(match.seeker);
    const isSeeker = seekerId === String(userId);

    if (isSeeker) {
        return {
            name: match.job?.company || match.hirer?.fullName || 'Match',
            role: match.job?.title || 'Matched role',
            subtitle: match.job?.location
                ? [match.job.location.city, match.job.location.country].filter(Boolean).join(', ')
                : 'Open position',
        };
    }

    return {
        name: match.seeker?.fullName || 'Candidate',
        role: match.job?.title || 'Matched candidate',
        subtitle: match.seekerProfile?.headline || match.seekerProfile?.location || 'Open candidate',
    };
}

async function enrichMatch(matchDoc, userId) {
    const match = toPlain(matchDoc);
    const [latestMessage, unreadCount, interview] = await Promise.all([
        Message.findOne({ match: match._id }).sort({ createdAt: -1 }).populate('sender', 'fullName').lean(),
        Message.countDocuments({ match: match._id, receiver: userId, isRead: false }),
        Interview.findOne({ match: match._id }).sort({ createdAt: -1 }).lean(),
    ]);

    const title = buildTitle(match, userId);
    return {
        ...match,
        ...title,
        latestMessage,
        unreadCount,
        interview,
        interviewId: interview?._id || null,
        hasInterview: Boolean(interview),
        canTakeInterview: !interview || ['cancelled', 'expired'].includes(interview.status),
        jobId: match.job?._id || match.job || null,
    };
}

exports.getMatches = async (req, res) => {
    try {
        const userId = req.user._id;
        const requestedMode = req.query.role;
        const activeMode = requestedMode || req.user.activeMode || (req.user.hasHirer && !req.user.hasSeeker ? 'hirer' : 'seeker');
        const filter = activeMode === 'hirer' ? { hirer: userId } : { seeker: userId };

        const matches = await Match.find(filter)
            .populate('job')
            .populate('seeker', 'fullName email avatarUrl')
            .populate('hirer', 'fullName email avatarUrl')
            .populate('seekerProfile', 'headline location skills stats profileStrength')
            .populate('hirerProfile');

        const enriched = await Promise.all(matches.map((match) => enrichMatch(match, userId)));
        enriched.sort((a, b) => new Date(b.matchedAt || b.createdAt) - new Date(a.matchedAt || a.createdAt));

        return res.json({ success: true, data: enriched });
    } catch (err) {
        console.error('[getMatches]', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

exports.getMatchById = async (req, res) => {
    try {
        const userId = req.user._id;
        const { matchId } = req.params;

        const match = await Match.findById(matchId)
            .populate('job')
            .populate('seeker', 'fullName email avatarUrl')
            .populate('hirer', 'fullName email avatarUrl')
            .populate('seekerProfile', 'headline location skills stats profileStrength')
            .populate('hirerProfile');

        if (!match) {
            return res.status(404).json({ success: false, error: 'Match not found' });
        }

        const seekerId = match.seeker?._id ? String(match.seeker._id) : String(match.seeker);
        const hirerId = match.hirer?._id ? String(match.hirer._id) : String(match.hirer);
        const isMember = seekerId === String(userId) || hirerId === String(userId);
        if (!isMember) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const data = await enrichMatch(match, userId);
        return res.json({ success: true, data });
    } catch (err) {
        console.error('[getMatchById]', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};
