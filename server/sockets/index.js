const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { subscriber } = require('../config/redis');
const { NOTIFICATION_CHANNEL } = require('../services/notificationService');
const Message = require('../models/Message');
const User = require('../models/User');

// userId -> Set of socket ids (a user can have multiple tabs/devices open)
const onlineUsers = new Map();

function addSocket(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
}

function removeSocket(userId, socketId) {
  const set = onlineUsers.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) onlineUsers.delete(userId);
}

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Authenticate every socket connection with the same JWT used for REST calls
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId } = socket;
    addSocket(userId, socket.id);
    socket.join(`user:${userId}`); // personal room, used for notifications + DMs
    io.emit('presence:update', { userId, online: true });

    // ---- Real-time messaging ----
    socket.on('message:send', async ({ recipientId, text }, ack) => {
      try {
        if (!text || !text.trim()) return ack?.({ ok: false, error: 'Message cannot be empty' });

        const conversationId = Message.buildConversationId(userId, recipientId);
        const message = await Message.create({
          sender: userId,
          recipient: recipientId,
          text: text.trim(),
          conversationId,
        });

        const payload = {
          id: message._id,
          sender: userId,
          recipient: recipientId,
          text: message.text,
          conversationId,
          createdAt: message.createdAt,
        };

        io.to(`user:${recipientId}`).emit('message:new', payload);
        io.to(`user:${userId}`).emit('message:new', payload); // echo to sender's other tabs
        ack?.({ ok: true, message: payload });
      } catch (err) {
        console.error('[socket] message:send error', err.message);
        ack?.({ ok: false, error: 'Failed to send message' });
      }
    });

    socket.on('message:typing', ({ recipientId }) => {
      io.to(`user:${recipientId}`).emit('message:typing', { senderId: userId });
    });

    socket.on('message:read', async ({ conversationId }) => {
      await Message.updateMany(
        { conversationId, recipient: userId, read: false },
        { $set: { read: true } }
      );
      socket.to(`user:${userId}`).emit('message:read', { conversationId });
    });

    socket.on('disconnect', () => {
      removeSocket(userId, socket.id);
      if (!onlineUsers.has(userId)) {
        io.emit('presence:update', { userId, online: false });
      }
    });
  });

  // ---- Bridge Redis pub/sub -> connected sockets ----
  // Any process (this one or a sibling instance) can publish a notification;
  // every subscribed process forwards it to the recipient if they're connected here.
  subscriber.subscribe(NOTIFICATION_CHANNEL, (err) => {
    if (err) console.error('[redis] failed to subscribe:', err.message);
    else console.log(`[redis] subscribed to "${NOTIFICATION_CHANNEL}"`);
  });

  subscriber.on('message', (channel, message) => {
    if (channel !== NOTIFICATION_CHANNEL) return;
    try {
      const payload = JSON.parse(message);
      io.to(`user:${payload.recipientId}`).emit('notification:new', payload);
    } catch (err) {
      console.error('[redis] bad notification payload', err.message);
    }
  });

  return io;
}

function isOnline(userId) {
  return onlineUsers.has(userId.toString());
}

module.exports = { initSocket, isOnline };
