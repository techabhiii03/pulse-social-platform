const mongoose = require('mongoose');

async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[mongo] connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('[mongo] connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
