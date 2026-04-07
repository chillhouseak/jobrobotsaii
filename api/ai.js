import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from './models/User.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const HF_API_KEY = process.env.HF_API_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ================================================================
// AI PROVIDERS
// ================================================================

const callGroq = async (prompt) => {
  if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') throw new Error('GROQ_NOT_CONFIGURED');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });
  if (res.status === 429) throw new Error('GROQ_RATE_LIMITED');
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error?.message || 'Groq error'); }
  const data = await res.json();
  return data.choices[0].message.content;
};

const callHuggingFace = async (prompt) => {
  const endpoint = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';
  const headers = HF_API_KEY ? { Authorization: `Bearer ${HF_API_KEY}` } : {};
  const body = { inputs: prompt, parameters: { max_new_tokens: 512, temperature: 0.7, return_full_text: false } };
  let res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  if (res.status === 429) throw new Error('HF_RATE_LIMITED');
  if (res.status === 503) {
    await new Promise(r => setTimeout(r, 2000));
    res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error('HF_UNAVAILABLE');
  } else if (!res.ok) throw new Error(`HF error ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data[0]?.generated_text : data.generated_text || '';
};

const callGemini = async (prompt) => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') throw new Error('GEMINI_NOT_CONFIGURED');
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

const callAI = async (prompt, feature, context = {}) => {
  if (GROQ_API_KEY && GROQ_API_KEY !== 'your_groq_api_key_here') {
    try { return { text: await callGroq(prompt), provider: 'groq' }; }
    catch (e) { if (e.message !== 'GROQ_RATE_LIMITED') console.warn('[AI] Groq failed:', e.message); else console.warn('[AI] Groq rate limited...'); }
  }
  try { return { text: await callHuggingFace(prompt), provider: 'huggingface' }; }
  catch (e) { console.warn('[AI] HuggingFace failed:', e.message); }
  if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try { return { text: await callGemini(prompt), provider: 'gemini' }; }
    catch (e) { console.warn('[AI] Gemini failed:', e.message); }
  }
  // Mock fallback
  const mocks = {
    answer: (r, t, l) => { const m = { professional: "Thank you for the opportunity. With my background in this field, I have developed strong skills in problem-solving and collaboration. I am excited about this opportunity.", friendly: "Hey! I'm really excited about this. I've been working in this space and I love solving tricky problems.", confident: "I am the ideal candidate. With proven expertise in this domain, I have consistently exceeded expectations." }; let x = m[t] || m.professional; if (l === 'short') x = x.split('.')[0] + '.'; if (l === 'long') x = x + ' ' + m[t]; return x; },
    coverLetter: (c, r, e) => `Dear Hiring Manager,\n\nI am writing to express my enthusiastic interest in the ${r} position at ${c}. With my background in ${e || 'software development'}, I believe I would be a valuable addition to your team.\n\nThank you for considering my application.\n\nSincerely`,
    outreach: (t, n, c, g) => `Hi ${n},\n\nI hope this message finds you well! I'm exploring opportunities in ${g || 'software development'} and came across your profile.\n\nI would love to connect.\n\nBest regards`,
    goalTracker: (g, f) => `# Action Plan: ${g}\n\n**Timeframe:** ${f || '3 months'}\n\n## Phase 1 (Weeks 1-2): Research & Preparation\n- Research the target role and industry\n- Update resume and LinkedIn profile\n\n## Phase 2 (Weeks 3-6): Active Search\n- Apply to 3-5 positions per week\n- Network with professionals\n\n## Phase 3 (Weeks 7-10): Interviews\n- Prepare for each interview\n- Send thank-you notes\n\n## Phase 4 (Weeks 11-12): Decision\n- Evaluate offers\n- Plan transition`,
  };
  const fallback = { answer: mocks.answer(context.role, context.tone, context.length), coverLetter: mocks.coverLetter(context.company, context.role, context.experience), outreach: mocks.outreach(context.type, context.recipientName, context.company, context.targetRole), goalTracker: mocks.goalTracker(context.goal, context.timeframe) };
  return { text: fallback[feature] || 'AI service unavailable.', provider: 'mock' };
};

// Safely parse AI JSON response — handles unescaped newlines and text before/after JSON
const parseAIJson = (text) => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('AI did not return a valid JSON response');
  let json = text.slice(start, end + 1);
  let result = '';
  let inString = false;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (ch === '"' && (i === 0 || json[i - 1] !== '\\')) {
      inString = !inString;
      result += ch;
    } else if (ch === '\n' && inString) {
      result += '\\n';
    } else if (ch === '\r') {
      // skip
    } else {
      result += ch;
    }
  }
  return JSON.parse(result);
};

// ================================================================
// HELPERS
// ================================================================
const getAction = (url) => url.split('?')[0].replace(/^\//, '') || null;
const authMiddleware = async (req) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) throw Object.assign(new Error('No token'), { name: 'AuthError' });
  return jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
};
const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI not set');
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri);
};
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };

// ================================================================
// VERCEL HANDLER
// ================================================================
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).set(cors).send('');
  res.set(cors);

  const action = getAction(req.url);
  const { method, body } = req;

  // Goal Tracker (public)
  if ((action === 'goal-tracker' || action === 'generate-goal') && method === 'POST') {
    const { goal, timeframe, obstacles } = body || {};
    if (!goal) return res.status(400).json({ success: false, message: 'Goal is required' });

    try {
      const { text } = await callAI(
        `You are an expert career coach. Create a structured job goal plan in JSON format.\n\nGoal: ${goal}\nTimeframe: ${timeframe || '3 months'}\nObstacles: ${obstacles || 'Limited time'}\n\nRespond ONLY with valid JSON in this exact format, no markdown, no explanation:\n{\n  "goal": "the user's goal",\n  "targetDays": number,\n  "daysRemaining": number,\n  "phases": [\n    {\n      "phase": "Phase name",\n      "days": "duration",\n      "tasks": ["task 1", "task 2", "task 3"],\n      "milestone": "what to achieve"\n    }\n  ],\n  "weeklyTargets": ["target 1", "target 2", "target 3"],\n  "dailyActions": ["action 1", "action 2", "action 3"],\n  "successMetrics": ["metric 1", "metric 2", "metric 3"],\n  "suggestions": ["suggestion 1", "suggestion 2"]\n}`,
        'goalTracker',
        { goal, timeframe }
      );

      const plan = parseAIJson(text);
      return res.status(200).json({ success: true, data: plan });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message || 'Failed to generate goal plan' });
    }
  }

  // ================================================================
  // IMAGE GENERATION (Pollinations — free, no API key)
  // ================================================================
  const imageRateLimiter = {};
  const IMAGE_RATE_LIMIT = 10;
  const IMAGE_RATE_WINDOW = 60000;

  if (action === 'image' && method === 'POST') {
    const { prompt: imgPrompt } = body || {};
    if (!imgPrompt) return res.status(400).json({ success: false, message: 'Prompt is required' });

    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.headers['x-real-ip']
      || 'unknown';

    const now = Date.now();
    const entry = imageRateLimiter[clientIp] || { count: 0, resetAt: now + IMAGE_RATE_WINDOW };

    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + IMAGE_RATE_WINDOW;
    }
    if (entry.count >= IMAGE_RATE_LIMIT) {
      return res.status(429).json({ success: false, message: 'Too many image requests. Please wait a minute and try again.' });
    }
    entry.count += 1;
    imageRateLimiter[clientIp] = entry;

    try {
      const seed = Date.now();
      const images = Array.from({ length: 3 }, (_, i) => ({
        id: `img_${seed + i}`,
        url: `https://image.pollinations.ai/prompt/${encodeURIComponent(imgPrompt)}?seed=${seed + i}&width=768&height=768&nologo=true`,
        prompt: imgPrompt,
      }));
      return res.status(200).json({ success: true, data: { images, savedId: null } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message || 'Failed to generate images' });
    }
  }

  // ================================================================
  // PROTECTED ROUTES
  // ================================================================
  try {
    await connectDB();
    const decoded = await authMiddleware(req);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.status !== 'active') return res.status(403).json({ success: false, message: 'Account not active' });

    if (action === 'status' && method === 'GET') {
      return res.status(200).json({ success: true, data: { credits: user.aiCredits, plan: user.plan, provider: GROQ_API_KEY ? 'groq' : HF_API_KEY ? 'huggingface' : 'mock' } });
    }

    if (action === 'answer' && method === 'POST') {
      const { question, role, tone, length } = body || {};
      if (!question) return res.status(400).json({ success: false, message: 'Question required' });
      const { text, provider } = await callAI(`You are an expert interview coach. Answer:\n\nQuestion: ${question}\nRole: ${role || 'Professional'}\nTone: ${tone || 'professional'}\nLength: ${length || 'medium'}`, 'answer', { role, tone, length });
      if (user.aiCredits > 0) await User.findByIdAndUpdate(decoded.id, { $inc: { aiCredits: -1 } });
      return res.status(200).json({ success: true, data: { answer: text, provider, creditsRemaining: Math.max(0, user.aiCredits - 1) } });
    }

    if (action === 'cover-letter' && method === 'POST') {
      const { company, role, jobDescription: jd, experience } = body || {};
      if (!company || !role) return res.status(400).json({ success: false, message: 'Company and role required' });
      const { text, provider } = await callAI(`Write a cover letter.\n\nCompany: ${company}\nRole: ${role}\nJob Description: ${jd || 'Not provided'}\nExperience: ${experience || 'Relevant experience'}`, 'coverLetter', { company, role, experience });
      if (user.aiCredits > 0) await User.findByIdAndUpdate(decoded.id, { $inc: { aiCredits: -1, resumeGenerations: 1 } });
      return res.status(200).json({ success: true, data: { coverLetter: text, provider, creditsRemaining: Math.max(0, user.aiCredits - 1) } });
    }

    if (action === 'outreach' && method === 'POST') {
      const { type, recipientName, recipientRole, company, yourBackground, targetRole: tgtRole } = body || {};
      if (!recipientName) return res.status(400).json({ success: false, message: 'Recipient name required' });
      const { text, provider } = await callAI(`Write a ${type || 'professional'} message.\n\nRecipient: ${recipientName}\nRole: ${recipientRole || ''}\nCompany: ${company || 'Target'}\nYour Background: ${yourBackground || ''}\nTarget Role: ${tgtRole || ''}`, 'outreach', { type, recipientName, company, targetRole: tgtRole });
      if (user.aiCredits > 0) await User.findByIdAndUpdate(decoded.id, { $inc: { aiCredits: -1 } });
      return res.status(200).json({ success: true, data: { message: text, provider, creditsRemaining: Math.max(0, user.aiCredits - 1) } });
    }

    return res.status(404).json({ success: false, message: 'Route not found' });
  } catch (error) {
    console.error('AI error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
}
