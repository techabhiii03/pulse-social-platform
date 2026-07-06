const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, maxlength: 2000, default: '' },
    mediaUrl: { type: String, default: '' },
    mediaType: { type: String, enum: ['none', 'image', 'video'], default: 'none' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentCount: { type: Number, default: 0 },
    // lightweight engagement counters for the analytics dashboard
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
