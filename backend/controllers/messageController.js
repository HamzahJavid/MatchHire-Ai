const Message = require('../models/Message');
const Match = require('../models/Match');
const User = require('../models/User');

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const userId = req.user._id;
        const { matchId, text, type = 'text', metadata } = req.body;

        if (!matchId || !text) {
            return res.status(400).json({ success: false, error: 'matchId and text required' });
        }

        // Get the match to find receiver
        const match = await Match.findById(matchId);
        if (!match) {
            return res.status(404).json({ success: false, error: 'Match not found' });
        }

        // Determine receiver based on sender
        let receiver;
        if (userId.toString() === match.seeker.toString()) {
            receiver = match.hirer;
        } else if (userId.toString() === match.hirer.toString()) {
            receiver = match.seeker;
        } else {
            return res.status(403).json({ success: false, error: 'Not part of this match' });
        }

        // Create message
        const message = new Message({
            match: matchId,
            sender: userId,
            receiver,
            text,
            type,
            metadata: metadata || {},
        });

        await message.save();
        await message.populate('sender', 'fullName email');
        await message.populate('receiver', 'fullName email');

        return res.json({ success: true, data: message });
    } catch (err) {
        console.error('[sendMessage]', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

// Get messages for a match
exports.getMessages = async (req, res) => {
    try {
        const userId = req.user._id;
        const { matchId } = req.params;
        const { limit = 50, skip = 0 } = req.query;

        // Verify user is part of the match
        const match = await Match.findById(matchId);
        if (!match) {
            return res.status(404).json({ success: false, error: 'Match not found' });
        }

        if (
            userId.toString() !== match.seeker.toString() &&
            userId.toString() !== match.hirer.toString()
        ) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        // Get messages
        const messages = await Message.find({ match: matchId })
            .populate('sender', 'fullName email _id')
            .populate('receiver', 'fullName email _id')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip));

        const total = await Message.countDocuments({ match: matchId });

        // Mark messages as read
        await Message.updateMany(
            {
                match: matchId,
                receiver: userId,
                isRead: false,
            },
            {
                isRead: true,
                readAt: new Date(),
            }
        );

        return res.json({
            success: true,
            data: {
                messages: messages.reverse(),
                total,
                limit: Number(limit),
                skip: Number(skip),
            },
        });
    } catch (err) {
        console.error('[getMessages]', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

// Get all conversations for user
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get all matches for this user
        const matches = await Match.find({
            $or: [{ seeker: userId }, { hirer: userId }],
        })
            .populate('job', 'title company')
            .populate('seeker', 'fullName email')
            .populate('hirer', 'fullName email')
            .lean();

        // Get latest message and unread count for each match
        const conversations = await Promise.all(
            matches.map(async (match) => {
                const latestMessage = await Message.findOne({ match: match._id })
                    .sort({ createdAt: -1 })
                    .lean();

                const unreadCount = await Message.countDocuments({
                    match: match._id,
                    receiver: userId,
                    isRead: false,
                });

                return {
                    ...match,
                    latestMessage,
                    unreadCount,
                };
            })
        );

        return res.json({ success: true, data: conversations });
    } catch (err) {
        console.error('[getConversations]', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

// Mark all messages in a conversation as read
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const { matchId } = req.params;

        const result = await Message.updateMany(
            {
                match: matchId,
                receiver: userId,
                isRead: false,
            },
            {
                isRead: true,
                readAt: new Date(),
            }
        );

        return res.json({ success: true, data: { modifiedCount: result.modifiedCount } });
    } catch (err) {
        console.error('[markAsRead]', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const unreadCount = await Message.countDocuments({
            receiver: userId,
            isRead: false,
        });

        return res.json({ success: true, data: { unreadCount } });
    } catch (err) {
        console.error('[getUnreadCount]', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};
