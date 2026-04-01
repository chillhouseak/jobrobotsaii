import jwt from 'jsonwebtoken';
import Application from './models/Application.js';
import Job from './models/Job.js';
import connectDB from './_lib/db.js';

const authMiddleware = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Access denied. No token provided.');
  }
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).set(corsHeaders).send('');
  }

  res.set(corsHeaders);

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();
  } catch (e) {
    return res.status(503).json({ success: false, message: e.message });
  }

  try {
    const decoded = await authMiddleware(req);
    const { q } = req.query || {};

    if (!q || q.trim().length < 1) {
      return res.status(200).json({
        success: true,
        data: { applications: [], jobs: [], total: 0 },
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');

    // Run both searches in parallel
    const [applications, jobs] = await Promise.all([
      Application.find({
        userId: decoded.id,
        $or: [
          { role: searchRegex },
          { company: searchRegex },
          { location: searchRegex },
          { notes: searchRegex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),

      Job.find({
        userId: decoded.id,
        $or: [
          { title: searchRegex },
          { company: searchRegex },
          { location: searchRegex },
          { description: searchRegex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    const total = applications.length + jobs.length;

    return res.status(200).json({
      success: true,
      data: { applications, jobs, total },
    });

  } catch (error) {
    console.error('Search error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}
