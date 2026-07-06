const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { sendNotification } = require('../services/notificationService');

const router = express.Router();

// Search users by username or display name (for the Discover page).
// IMPORTANT: this must be defined before the "/:username" route below,
// otherwise Express would treat "search" itself as a username to look up.
router.get('/search/query', requireAuth, async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ users: [] });

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // escape regex special chars
    const matches = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ username: regex }, { displayName: regex }],
    }).limit(20);

    const followingIds = new Set(req.user.following.map((id) => id.toString()));
    const users = matches.map((u) => ({
      ...u.toPublicJSON(),
      isFollowing: followingIds.has(u._id.toString()),
    }));

    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// Look up a user by their Mongo id (used by the chat UI to resolve a peer
// when there's no existing conversation to derive their info from yet).
router.get('/by-id/:id', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
});

// Get a user's public profile (auth optional, but if a valid token is
// provided we also report whether the requester already follows them)
router.get('/:username', async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let isFollowing = false;
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        isFollowing = user.followers.some((id) => id.toString() === decoded.id);
      } catch {
        // invalid/expired token — just treat as not following, don't fail the request
      }
    }

    res.json({ user: { ...user.toPublicJSON(), isFollowing } });
  } catch (err) {
    next(err);
  }
});

// Update own profile (bio, displayName)
router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const { displayName, bio } = req.body;
    if (displayName !== undefined) req.user.displayName = displayName;
    if (bio !== undefined) req.user.bio = bio;
    await req.user.save();
    res.json({ user: req.user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
});

// Upload/replace avatar
router.post('/me/avatar', requireAuth, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    req.user.avatarUrl = `/uploads/${req.file.filename}`;
    await req.user.save();
    res.json({ user: req.user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
});

// Upload/replace cover image
router.post('/me/cover', requireAuth, upload.single('cover'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    req.user.coverUrl = `/uploads/${req.file.filename}`;
    await req.user.save();
    res.json({ user: req.user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
});

// Follow a user
router.post('/:id/follow', requireAuth, async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user.id) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const alreadyFollowing = req.user.following.some((id) => id.toString() === targetId);
    if (alreadyFollowing) {
      return res.status(409).json({ message: 'Already following this user' });
    }

    req.user.following.push(targetId);
    target.followers.push(req.user.id);
    await Promise.all([req.user.save(), target.save()]);

    await sendNotification({ recipientId: target._id, actorId: req.user._id, type: 'follow' });

    res.json({ user: target.toPublicJSON() });
  } catch (err) {
    next(err);
  }
});

// Unfollow a user
router.delete('/:id/follow', requireAuth, async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    req.user.following = req.user.following.filter((id) => id.toString() !== targetId);
    target.followers = target.followers.filter((id) => id.toString() !== req.user.id);
    await Promise.all([req.user.save(), target.save()]);

    res.json({ user: target.toPublicJSON() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
