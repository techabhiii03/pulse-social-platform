# Pulse — Social Media Dashboard

A full-stack social media dashboard: profiles with media uploads, a real-time
feed, likes/comments/follows, real-time direct messaging, and an engagement
analytics dashboard. Notifications are delivered through a Redis pub/sub
layer bridged onto Socket.IO, so they work even if you run multiple server
instances behind a load balancer.

## Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.IO, Redis (ioredis)
- **Frontend:** React (Vite), Tailwind CSS, Recharts, Socket.IO client
- **Auth:** JWT (bearer tokens), bcrypt password hashing
- **Media uploads:** Multer (local disk storage, served statically)

## How the notification system works

1. An action happens (like, comment, follow) → the API layer calls
   `sendNotification()` in `server/services/notificationService.js`.
2. That function writes the notification to MongoDB **and** publishes a
   JSON payload to a Redis channel (`notifications`).
3. Every server process subscribes to that channel (`server/sockets/index.js`).
   When a message arrives, it's forwarded over Socket.IO to the recipient's
   personal room (`user:<id>`) if they're currently connected.
4. The React client listens for `notification:new` on its socket and updates
   the notification bell in real time, no polling required.

This decouples "who created the notification" from "who delivers it to the
browser" — useful once you scale to more than one Node process.

## Project layout

```
social-dashboard/
├── docker-compose.yml       # MongoDB + Redis for local dev
├── server/                  # Express API + Socket.IO
│   ├── config/               # db.js, redis.js
│   ├── models/                # User, Post, Comment, Message, Notification
│   ├── middleware/            # auth, upload (multer), error handler
│   ├── routes/                 # auth, users, posts, messages, notifications, analytics
│   ├── services/                # notificationService.js (Redis pub/sub)
│   ├── sockets/                  # Socket.IO setup, messaging, notification bridge
│   └── server.js
└── client/                  # React (Vite) frontend
    └── src/
        ├── api/axios.js
        ├── context/            # AuthContext, SocketContext
        ├── components/          # Navbar, PostCard, NotificationBell
        └── pages/                # Login, Register, Feed, Profile, Messages, Analytics
```

## Getting started

### 1. Start MongoDB and Redis

```bash
docker compose up -d
```

(Or point `MONGO_URI` / `REDIS_URL` at existing instances.)

### 2. Backend

```bash
cd server
cp .env.example .env   # edit JWT_SECRET at minimum
npm install
npm run dev             # nodemon, http://localhost:5000
```

### 3. Frontend

```bash
cd client
npm install
npm run dev             # http://localhost:5173 (proxies /api and /uploads to :5000)
```

Open http://localhost:5173, register two accounts (e.g. in two browser
windows) to try out real-time messaging, likes, comments, and follow
notifications.

## API overview

| Method | Route                          | Description                          |
|--------|---------------------------------|---------------------------------------|
| POST   | `/api/auth/register`            | Create account                        |
| POST   | `/api/auth/login`               | Log in, get JWT                       |
| GET    | `/api/auth/me`                  | Current user                          |
| GET    | `/api/users/:username`          | Public profile                        |
| PATCH  | `/api/users/me`                 | Update bio/display name               |
| POST   | `/api/users/me/avatar`          | Upload avatar (multipart)             |
| POST   | `/api/users/:id/follow`         | Follow a user                         |
| DELETE | `/api/users/:id/follow`         | Unfollow a user                       |
| GET    | `/api/posts/feed`                | Feed of people you follow             |
| POST   | `/api/posts`                     | Create post (multipart, optional media)|
| POST   | `/api/posts/:id/like`            | Toggle like                           |
| POST   | `/api/posts/:id/comments`        | Add comment                           |
| GET    | `/api/notifications`             | Recent notifications                  |
| GET    | `/api/messages/conversations`    | Conversation list                     |
| GET    | `/api/messages/:userId`          | Message history with a user           |
| GET    | `/api/analytics/summary`         | Engagement dashboard data (Redis-cached)|

Real-time events over Socket.IO (auth via `socket.handshake.auth.token`):
`message:send`, `message:new`, `message:typing`, `message:read`,
`notification:new`, `presence:update`.

## Notes / next steps for production

- Swap local disk storage (Multer) for S3/Cloudinary for uploaded media.
- Add refresh tokens / token rotation if you need shorter-lived access tokens.
- Add pagination cursors instead of page numbers for very large feeds.
- Put the analytics summary behind a background job if computed over large datasets.
