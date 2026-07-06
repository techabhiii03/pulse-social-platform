const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    displayName: { type: String, trim: true, maxlength: 50 },
    bio: { type: String, maxlength: 280, default: '' },
    avatarUrl: { type: String, default: '' },
    coverUrl: { type: String, default: '' },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    username: this.username,
    displayName: this.displayName || this.username,
    bio: this.bio,
    avatarUrl: this.avatarUrl,
    coverUrl: this.coverUrl,
    followersCount: this.followers?.length ?? 0,
    followingCount: this.following?.length ?? 0,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
