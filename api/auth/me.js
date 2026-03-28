import connectDB from '../_lib/db';
import { authMiddleware } from '../_lib/auth';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await connectDB();
  const user = await authMiddleware(req, res);
  if (!user) return;

  return res.json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills,
        experienceLevel: user.experienceLevel,
        targetRole: user.targetRole,
        phone: user.phone,
        location: user.location,
        linkedin: user.linkedin,
        bio: user.bio,
        plan: user.plan,
        aiCredits: user.aiCredits,
        resumeGenerations: user.resumeGenerations,
        interviewSessions: user.interviewSessions,
        createdAt: user.createdAt
      }
    }
  });
}
