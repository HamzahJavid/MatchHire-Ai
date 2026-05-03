const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    sendMessage,
    getMessages,
    getConversations,
    markAsRead,
    getUnreadCount,
} = require('../controllers/messageController');

// Send a message
router.post('/send', auth, sendMessage);

// Get messages for a match
router.get('/:matchId', auth, getMessages);

// Get all conversations
router.get('/', auth, getConversations);

// Mark conversation as read
router.patch('/:matchId/read', auth, markAsRead);

// Get unread count
router.get('/count/unread', auth, getUnreadCount);

module.exports = router;
