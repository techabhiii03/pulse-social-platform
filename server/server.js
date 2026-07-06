require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { initSocket } = require('./sockets');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const httpServer = http.createServer(app);

// ---- Core middleware ----
app.use(helmet({ crossOriginResourcePolicy: false })); // allow serving uploaded media cross-origin
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api', apiLimiter);

// Serve uploaded media (avatars, post images/video)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---- Routes ----
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

// ---- Boot ----
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  initSocket(httpServer);
  httpServer.listen(PORT, () => {
    console.log(`[server] listening on port ${PORT}`);
  });
}

start();

module.exports = { app, httpServer };
