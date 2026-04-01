import jwt from 'jsonwebtoken';
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

const getAction = (req) => {
  const url = req.url.split('?')[0];
  return url.replace(/^\//, '') || null;
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

  const action = getAction(req);
  const { method, body } = req;

  try {
    await connectDB();
  } catch (e) {
    return res.status(503).json({ success: false, message: e.message });
  }

  try {
    // GET /api/jobs — list all for user
    if ((action === '' || action === null) && method === 'GET') {
      const decoded = await authMiddleware(req);
      const { saved, page = 1, limit = 50 } = req.query || {};
      const filter = { userId: decoded.id };
      if (saved !== undefined) filter.saved = saved === 'true';

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [jobs, total] = await Promise.all([
        Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
        Job.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        data: { jobs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
      });
    }

    // POST /api/jobs — create
    if ((action === '' || action === null) && method === 'POST') {
      const decoded = await authMiddleware(req);
      const { title, company, location, url, postedDate, salary, jobType, description, source, saved } = body || {};

      if (!title || !company) {
        return res.status(400).json({ success: false, message: 'Title and company are required' });
      }

      const job = new Job({
        userId: decoded.id,
        title,
        company,
        location: location || '',
        url: url || '',
        postedDate: postedDate ? new Date(postedDate) : new Date(),
        salary: salary || '',
        jobType: jobType || 'full-time',
        description: description || '',
        source: source || '',
        saved: saved !== undefined ? saved : false,
      });

      await job.save();

      return res.status(201).json({
        success: true,
        message: 'Job added',
        data: { job },
      });
    }

    // GET /api/jobs/search?q=... — search user's jobs
    if (action === 'search' && method === 'GET') {
      const decoded = await authMiddleware(req);
      const { q } = req.query || {};

      if (!q || q.trim().length < 1) {
        return res.status(200).json({ success: true, data: { jobs: [], total: 0 } });
      }

      const searchRegex = new RegExp(q.trim(), 'i');
      const jobs = await Job.find({
        userId: decoded.id,
        $or: [
          { title: searchRegex },
          { company: searchRegex },
          { location: searchRegex },
          { description: searchRegex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(20);

      return res.status(200).json({
        success: true,
        data: { jobs, total: jobs.length },
      });
    }

    // GET /api/jobs/:id — get single
    if (action && method === 'GET') {
      const decoded = await authMiddleware(req);
      const job = await Job.findOne({ _id: action, userId: decoded.id });
      if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
      return res.status(200).json({ success: true, data: { job } });
    }

    // PUT /api/jobs/:id — update
    if (action && method === 'PUT') {
      const decoded = await authMiddleware(req);
      const job = await Job.findOne({ _id: action, userId: decoded.id });
      if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

      const allowed = ['title', 'company', 'location', 'url', 'postedDate', 'salary', 'jobType', 'description', 'source', 'saved'];
      allowed.forEach(field => {
        if (body[field] !== undefined) job[field] = body[field];
      });

      await job.save();
      return res.status(200).json({ success: true, message: 'Job updated', data: { job } });
    }

    // DELETE /api/jobs/:id — delete
    if (action && method === 'DELETE') {
      const decoded = await authMiddleware(req);
      const job = await Job.findOneAndDelete({ _id: action, userId: decoded.id });
      if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
      return res.status(200).json({ success: true, message: 'Job deleted' });
    }

    return res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('Jobs error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}
