const express = require('express');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { publisher: redis } = require('../config/redis');

const router = express.Router();

const CACHE_TTL_SECONDS = 60;

// Summary stats + engagement over time for the logged-in user's own content
router.get('/summary', requireAuth, async (req, res, next) => {
  try {
    const cacheKey = `analytics:summary:${req.user.id}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ ...JSON.parse(cached), cached: true });
    }

    const authorId = new mongoose.Types.ObjectId(req.user.id);

    const [postStats] = await Post.aggregate([
      { $match: { author: authorId } },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          totalLikes: { $sum: { $size: '$likes' } },
          totalComments: { $sum: '$commentCount' },
          totalViews: { $sum: '$viewCount' },
        },
      },
    ]);

    const dailyEngagement = await Post.aggregate([
      { $match: { author: authorId } },
      {
        $project: {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          likeCount: { $size: '$likes' },
          commentCount: 1,
        },
      },
      {
        $group: {
          _id: '$day',
          posts: { $sum: 1 },
          likes: { $sum: '$likeCount' },
          comments: { $sum: '$commentCount' },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    const topPosts = await Post.find({ author: authorId })
      .sort({ createdAt: -1 })
      .limit(50)
      .then((posts) =>
        posts
          .map((p) => ({
            id: p._id,
            text: p.text.slice(0, 80),
            likeCount: p.likes.length,
            commentCount: p.commentCount,
            createdAt: p.createdAt,
          }))
          .sort((a, b) => b.likeCount + b.commentCount - (a.likeCount + a.commentCount))
          .slice(0, 5)
      );

    const user = await User.findById(authorId);

    const summary = {
      totals: {
        posts: postStats?.totalPosts || 0,
        likes: postStats?.totalLikes || 0,
        comments: postStats?.totalComments || 0,
        views: postStats?.totalViews || 0,
        followers: user.followers.length,
        following: user.following.length,
      },
      dailyEngagement,
      topPosts,
    };

    await redis.set(cacheKey, JSON.stringify(summary), 'EX', CACHE_TTL_SECONDS);
    res.json({ ...summary, cached: false });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
