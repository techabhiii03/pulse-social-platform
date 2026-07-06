const express = require('express');
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('actor', 'username displayName avatarUrl');
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
});

router.patch('/read-all', requireAuth, async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { $set: { read: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ notification });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
