const express = require('express');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { sendNotification } = require('../services/notificationService');

const router = express.Router();

// Feed: posts from people you follow + your own, newest first
router.get('/feed', requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const authorIds = [...req.user.following, req.user._id];

    const posts = await Post.find({ author: { $in: authorIds } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username displayName avatarUrl');

    res.json({ posts, page, hasMore: posts.length === limit });
  } catch (err) {
    next(err);
  }
});

// Explore/global feed
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username displayName avatarUrl');

    res.json({ posts, page, hasMore: posts.length === limit });
  } catch (err) {
    next(err);
  }
});

// Create a post (optional media)
router.post('/', requireAuth, upload.single('media'), async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text && !req.file) {
      return res.status(400).json({ message: 'Post needs text or media' });
    }

    let mediaUrl = '';
    let mediaType = 'none';
    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
      mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    }

    const post = await Post.create({
      author: req.user._id,
      text: text || '',
      mediaUrl,
      mediaType,
    });

    await post.populate('author', 'username displayName avatarUrl');
    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
});

// Like / unlike a post (toggle)
router.post('/:id/like', requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const alreadyLiked = post.likes.some((id) => id.toString() === req.user.id);
    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== req.user.id);
    } else {
      post.likes.push(req.user._id);
      await sendNotification({
        recipientId: post.author,
        actorId: req.user._id,
        type: 'like',
        postId: post._id,
      });
    }
    await post.save();

    res.json({ liked: !alreadyLiked, likeCount: post.likes.length });
  } catch (err) {
    next(err);
  }
});

// Add a comment
router.post('/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = await Comment.create({ post: post._id, author: req.user._id, text: text.trim() });
    post.commentCount += 1;
    await post.save();
    await comment.populate('author', 'username displayName avatarUrl');

    await sendNotification({
      recipientId: post.author,
      actorId: req.user._id,
      type: 'comment',
      postId: post._id,
    });

    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
});

// List comments for a post
router.get('/:id/comments', async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .sort({ createdAt: 1 })
      .populate('author', 'username displayName avatarUrl');
    res.json({ comments });
  } catch (err) {
    next(err);
  }
});

// Delete own post
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not allowed to delete this post' });
    }
    await Promise.all([post.deleteOne(), Comment.deleteMany({ post: post._id })]);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
