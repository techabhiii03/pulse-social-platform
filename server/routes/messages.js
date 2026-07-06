const express = require('express');
const Message = require('../models/Message');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// List distinct conversations with last message + unread count
router.get('/conversations', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const conversations = await Message.aggregate([
      { $match: { $or: [{ sender: userId }, { recipient: userId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$recipient', userId] }, { $eq: ['$read', false] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    await Message.populate(conversations, [
      { path: 'lastMessage.sender', select: 'username displayName avatarUrl' },
      { path: 'lastMessage.recipient', select: 'username displayName avatarUrl' },
    ]);

    res.json({ conversations });
  } catch (err) {
    next(err);
  }
});

// Get message history with a specific user
router.get('/:userId', requireAuth, async (req, res, next) => {
  try {
    const conversationId = Message.buildConversationId(req.user._id, req.params.userId);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ messages: messages.reverse(), page });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
