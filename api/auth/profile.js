import connectDB from '../_lib/db';
import { authMiddleware } from '../_lib/auth';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    await connectDB();
    const user = await authMiddleware(req, res);
    if (!user) return;
    return res.json({ success: true, data: { user } });
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await connectDB();
  const user = await authMiddleware(req, res);
  if (!user) return;

  const { name, skills, experienceLevel, targetRole, phone, location, linkedin, bio } = req.body;

  try {
    if (name !== undefined) user.name = name;
    if (skills !== undefined) user.skills = skills;
    if (experienceLevel !== undefined) user.experienceLevel = experienceLevel;
    if (targetRole !== undefined) user.targetRole = targetRole;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    if (linkedin !== undefined) user.linkedin = linkedin;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
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
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
