const { publisher } = require('../config/redis');
const Notification = require('../models/Notification');

const NOTIFICATION_CHANNEL = 'notifications';

/**
 * Create a notification, persist it, and publish it on Redis so that
 * ANY server process (this one, or another instance in a multi-node
 * deployment) can pick it up and push it to the recipient over their
 * live Socket.IO connection. This is what lets notifications work
 * correctly even when the app is horizontally scaled across processes.
 */
async function sendNotification({ recipientId, actorId, type, postId = null }) {
  // Don't notify yourself (e.g. liking your own post)
  if (recipientId.toString() === actorId.toString()) return null;

  const notification = await Notification.create({
    recipient: recipientId,
    actor: actorId,
    type,
    post: postId,
  });

  const populated = await notification.populate('actor', 'username displayName avatarUrl');

  const payload = {
    id: populated._id,
    type: populated.type,
    read: populated.read,
    createdAt: populated.createdAt,
    post: populated.post,
    actor: {
      id: populated.actor._id,
      username: populated.actor.username,
      displayName: populated.actor.displayName,
      avatarUrl: populated.actor.avatarUrl,
    },
    recipientId: recipientId.toString(),
  };

  await publisher.publish(NOTIFICATION_CHANNEL, JSON.stringify(payload));
  return payload;
}

module.exports = { sendNotification, NOTIFICATION_CHANNEL };
