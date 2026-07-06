const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true, maxlength: 2000 },
    read: { type: Boolean, default: false },
    // deterministic id for a 1:1 conversation, e.g. sorted "userIdA_userIdB"
    conversationId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

messageSchema.statics.buildConversationId = function buildConversationId(idA, idB) {
  return [idA.toString(), idB.toString()].sort().join('_');
};

module.exports = mongoose.model('Message', messageSchema);
