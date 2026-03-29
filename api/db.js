import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    const err = new Error(
      'MONGO_URI environment variable is not set. ' +
      'Set it in Vercel Dashboard → Backend API Project → Settings → Environment Variables.'
    );
    err.statusCode = 503;
    err.code = 'MONGO_URI_MISSING';
    throw err;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    const err = new Error('Database connection failed: ' + e.message);
    err.statusCode = 503;
    err.code = 'DB_CONNECTION_FAILED';
    throw err;
  }

  return cached.conn;
}

export default connectDB;
