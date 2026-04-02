import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User, { PLAN_CREDITS } from './models/User.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const authMiddleware = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('Access denied. No token.');
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI not set in Vercel project settings');
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri);
};

const callGemini = async (prompt) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
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

// Paid plan check — unlimited/agency plans never run out of credits
const isPaidPlan = (plan) => ['unlimited', 'agency'].includes(plan);

// Credit deduction helper — returns { allowed, credits }.
// Uses atomic findOneAndUpdate so concurrent requests can't bypass deduction.
const deductCredit = async (userId, plan, amount = 1) => {
  if (isPaidPlan(plan)) {
    return { allowed: true, credits: -1 }; // paid plans skip deduction
  }
  const result = await User.deductCredit(userId, amount);
  return { allowed: result.success, credits: result.credits };
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
    // ============================================================
    // PUBLIC ROUTES — no authentication required
    // ============================================================

    // Image Generation (Pollinations — free, no auth, no credits)
    if (action === 'generate-image' && method === 'POST') {
      const { prompt, width = 1024, height = 1024, seed, style } = body || {};
      if (!prompt || !prompt.trim()) {
        return res.status(400).json({ success: false, message: 'Prompt is required' });
      }
      const encodedPrompt = encodeURIComponent(prompt.trim());
      const styleParam = style && style !== 'none' ? `&model=${style}` : '';
      const seedParam = seed ? `&seed=${seed}` : '';
      const nologo = '&nologo=true';
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}${seedParam}${styleParam}${nologo}`;
      return res.status(200).json({
        success: true,
        data: {
          imageUrl,
          prompt: prompt.trim(),
          width,
          height,
          seed: seed || Math.floor(Math.random() * 999999999),
        }
      });
    }

    // Goal Tracker — free AI feature, no auth, no credits
    if ((action === 'goal-tracker' || action === 'generate-goal') && method === 'POST') {
      const { goal, role, timeframe, obstacles } = body || {};
      if (!goal) return res.status(400).json({ success: false, message: 'Goal is required' });
      const prompt = `You are an AI career advisor helping a ${role || 'professional'} create an actionable goal plan.\n\nGoal: ${goal}\nTimeframe: ${timeframe || '3 months'}\nPotential Obstacles: ${obstacles || 'Limited time, resource constraints'}\n\nCreate a detailed, actionable plan with milestones, weekly tasks, and success metrics. Be specific and practical.`;
      const result = await callGemini(prompt);
      return res.status(200).json({ success: true, data: { result } });
    }

    // Resume Tailor — free AI feature, no auth, no credits
    if (action === 'tailor-resume' && method === 'POST') {
      const { resume, jobDescription, targetRole } = body || {};
      if (!resume || !jobDescription) {
        return res.status(400).json({ success: false, message: 'Resume and job description are required' });
      }
      const prompt = `You are a professional resume writer. Tailor the following resume for the job description.\n\nResume:\n${resume}\n\nJob Description:\n${jobDescription}\n\nTarget Role: ${targetRole || 'the role above'}\n\nRewrite the resume to highlight the most relevant skills and experience. Keep it concise (max 2 pages). Use action verbs and quantify achievements where possible. Return the tailored resume in clean markdown format.`;
      const tailoredResume = await callGemini(prompt);
      return res.status(200).json({ success: true, data: { tailoredResume } });
    }

    // ============================================================
    // PROTECTED ROUTES — authentication + credits required
    // ============================================================
    const decoded = await authMiddleware(req);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is not active' });
    }

    // Status — returns current credits and plan info
    if (action === 'status' && method === 'GET') {
      return res.status(200).json({
        success: true,
        data: {
          credits: user.aiCredits,
          plan: user.plan,
          planCredits: PLAN_CREDITS[user.plan] || 0,
          isPaidPlan: isPaidPlan(user.plan),
          resumesRemaining: isPaidPlan(user.plan) ? 999 : user.aiCredits
        }
      });
    }

    // Credits Check — lightweight endpoint for UI to poll before rendering
    if (action === 'check-credits' && method === 'GET') {
      return res.status(200).json({
        success: true,
        data: { credits: user.aiCredits, plan: user.plan, isPaidPlan: isPaidPlan(user.plan) }
      });
    }

    // Answer Generator — deducts 1 credit
    if (action === 'answer' && method === 'POST') {
      const { allowed, credits } = await deductCredit(user._id, user.plan, 1);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'Your free plan has finished.',
          credits: 0
        });
      }
      const { question, role, tone, length } = body || {};
      const prompt = `You are an AI assistant helping a ${role || 'professional'} prepare for job interviews.\n\nQuestion: ${question}\n\nGenerate a ${tone || 'professional'} answer that is ${length || 'medium'} in length.\n\nProvide a clear, concise response that addresses the question effectively.`;
      const answer = await callGemini(prompt);
      return res.status(200).json({
        success: true,
        data: { answer, creditsRemaining: credits }
      });
    }

    // Cover Letter — deducts 1 credit
    if (action === 'cover-letter' && method === 'POST') {
      const { allowed, credits } = await deductCredit(user._id, user.plan, 1);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'Your free plan has finished.',
          credits: 0
        });
      }
      const { company, role, jobDescription, experience } = body || {};
      const prompt = `Write a professional cover letter.\n\nCompany: ${company}\nRole: ${role}\nJob Description: ${jobDescription}\nYour Experience: ${experience}\n\nMake it compelling and tailored to the role.`;
      const coverLetter = await callGemini(prompt);
      // Also increment resumeGenerations counter
      await User.findByIdAndUpdate(user._id, { $inc: { resumeGenerations: 1 } });
      return res.status(200).json({
        success: true,
        data: { coverLetter, creditsRemaining: credits }
      });
    }

    // Outreach — deducts 1 credit
    if (action === 'outreach' && method === 'POST') {
      const { allowed, credits } = await deductCredit(user._id, user.plan, 1);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'Your free plan has finished.',
          credits: 0
        });
      }
      const { type, recipientName, recipientRole, company, yourBackground, targetRole } = body || {};
      const prompt = `Write a ${type || 'professional'} message.\n\nRecipient: ${recipientName || 'Hiring Manager'}\nRole: ${recipientRole || ''}\nCompany: ${company}\nYour Background: ${yourBackground}\nTarget Role: ${targetRole}\n\nKeep it concise and engaging.`;
      const message = await callGemini(prompt);
      return res.status(200).json({
        success: true,
        data: { message, creditsRemaining: credits }
      });
    }

    return res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('AI error:', error);
    if (error.message.includes('Access denied') || error.message.includes('token')) {
      return res.status(401).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
}
