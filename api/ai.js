import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from './models/User.js';
import ResumeAnalysis from './models/ResumeAnalysis.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const HF_API_KEY = process.env.HF_API_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ================================================================
// PROVIDERS
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

// Safely parse AI JSON response — handles unescaped newlines and text before/after JSON
const parseAIJson = (text) => {
  // Find JSON bounds (first { to last })
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI did not return a valid JSON response');
  }
  let json = text.slice(start, end + 1);
  // Replace unescaped newlines inside string values with \n escapes
  // Match: newline NOT preceded by \ and NOT inside a string delimiter
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
    tailorResume: () => `━━━ RESUME REVIEW REPORT ━━━\n\nOVERALL SCORE: 7/10\n\nSTRENGTHS:\n• Strong technical skill listing\n• Good project diversity\n• Clear work experience\n\nAREAS FOR IMPROVEMENT:\n• Missing quantifiable achievements in experience section\n• Summary is too generic and lacks impact\n• No ATS-optimized keywords\n\nSECTION-WISE FEEDBACK:\n\nSummary:\nYour summary is too broad. Rewrite it to be specific to your target role and include 1-2 key achievements with metrics.\n\nExperience:\n• Add metrics to every bullet (e.g., "improved performance by 30%")\n• Use stronger action verbs: Led, Architected, Scaled instead of Worked on, Involved in\n• Quantify team size, budget, or impact where possible\n\nSkills:\n• Organize skills into categories: Languages, Frameworks, Tools, Soft Skills\n• Remove outdated or irrelevant skills\n• Add keywords from the job description\n\nProjects:\n• Add measurable outcomes to project descriptions\n• Include tech stack used in each project\n\nATS OPTIMIZATION TIPS:\n• Use standard section headings: Experience, Education, Skills (not "My Work History")\n• Avoid tables, columns, or complex formatting\n• Place keywords naturally — ATS scans for exact keyword matches\n• Keep file format simple: .docx or .pdf (not .pages)\n\nACTIONABLE NEXT STEPS:\n1. Rewrite your professional summary with 2 specific achievements\n2. Add metrics to your top 3 experience bullets\n3. Cross-reference the job description and add missing keywords to your skills section`,
  };
  const fallback = { answer: mocks.answer(context.role, context.tone, context.length), coverLetter: mocks.coverLetter(context.company, context.role, context.experience), outreach: mocks.outreach(context.type, context.recipientName, context.company, context.targetRole), goalTracker: mocks.goalTracker(context.goal, context.timeframe), tailorResume: mocks.tailorResume(context.jobDescription) };
  return { text: fallback[feature] || 'AI service unavailable.', provider: 'mock' };
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

  // ============================================================
  // PUBLIC ROUTES
  // ============================================================

  // Goal Tracker
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

  // Resume Tailor
  if (action === 'tailor-resume' && method === 'POST') {
    const { resume, jobDescription, targetRole } = body || {};
    if (!resume) return res.status(400).json({ success: false, message: 'Resume is required' });

    try {
      const { text, provider } = await callAI(
        `You are an expert resume reviewer and career coach with years of experience reviewing resumes for tech and professional roles.

${targetRole ? `TARGET ROLE: ${targetRole}` : ''}
${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}\n` : ''}
CANDIDATE RESUME:
${resume}

Analyze this resume and produce a detailed professional review report. Follow this EXACT format — do not deviate:

━━━ RESUME REVIEW REPORT ━━━

OVERALL SCORE: X/10
[Give a realistic score. 9-10 = exceptional, 7-8 = strong, 5-6 = average, below 5 = needs significant work]

STRENGTHS:
• [Be specific — name actual skills, experiences, or achievements found in the resume]
• [At least 2-3 concrete strengths]
• [Focus on things the candidate actually did well]

AREAS FOR IMPROVEMENT:
• [Be specific and actionable — avoid generic advice]
• [Name the exact problem and the exact fix]
• [At least 3-5 concrete issues]

SECTION-WISE FEEDBACK:

Summary:
[2-4 sentences. Is the summary specific to a role? Does it lead with achievements? Is the tone right?]

Experience:
[For each role mentioned, comment on: Do bullets show impact with metrics? Are action verbs strong? Is the progression clear?]

Skills:
[Which skills are relevant and well-presented? Which are missing based on the job description or role?]

Projects:
[Are projects described with outcomes? Tech stack mentioned? Individual contribution clear?]

Education:
[Is education section appropriate? Any certifications or courses that add value?]

KEYWORD OPTIMIZATION:
${jobDescription ? `Compare resume keywords against the job description:\n• MATCHED keywords (found in both): [list]\n• MISSING keywords (in job description, not in resume): [list]\n• SUGGESTED additions: [2-3 skills or terms to weave in naturally]\n` : `Based on the resume content, suggest 5-8 important keywords a hiring manager would look for:\n• [keyword 1]\n• [keyword 2]\n• ...\n`}
ATS OPTIMIZATION TIPS:
• [3-4 specific, actionable ATS tips — format, section headings, what to avoid, what to include]

ACTIONABLE NEXT STEPS:
1. [Specific, prioritized action — what to do first and why]
2. [Second priority action]
3. [Third priority action]
4. [Bonus tip if time allows]

━━━ END OF REPORT ━━━

IMPORTANT RULES:
- Write in plain English. No jargon, no corporate speak.
- Be honest — if something is weak, say so. But always offer the fix.
- Do NOT rewrite the resume. Give feedback, not a rewrite.
- If job description is provided, cross-reference it throughout.
- Score realistically — most resumes score 6-7/10 on first review.`,
        'tailorResume',
        {}
      );

      // Extract overall score from report text
      const scoreMatch = text.match(/OVERALL SCORE:\s*(\d+(?:\.\d+)?)\s*/);
      const overallScore = scoreMatch ? parseFloat(scoreMatch[1]) : null;

      return res.status(200).json({ success: true, data: { report: text, overallScore, provider } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message || 'Failed to analyze resume' });
    }
  }

  // Resume Analysis — protected version with auth + history save
  if (action === 'resume-analysis' && method === 'POST') {
    const { resume, jobDescription, targetRole } = body || {};
    if (!resume) return res.status(400).json({ success: false, message: 'Resume is required' });

    try {
      await connectDB();
      const decoded = await authMiddleware(req);
      const authUser = await User.findById(decoded.id);
      if (!authUser) return res.status(404).json({ success: false, message: 'User not found' });
      if (authUser.status !== 'active') return res.status(403).json({ success: false, message: 'Account not active' });

      const { text, provider } = await callAI(
        `You are an expert resume reviewer and career coach with years of experience reviewing resumes for tech and professional roles.

${targetRole ? `TARGET ROLE: ${targetRole}` : ''}
${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}\n` : ''}
CANDIDATE RESUME:
${resume}

Analyze this resume and produce a detailed professional review report. Follow this EXACT format — do not deviate:

━━━ RESUME REVIEW REPORT ━━━

OVERALL SCORE: X/10
[Give a realistic score. 9-10 = exceptional, 7-8 = strong, 5-6 = average, below 5 = needs significant work]

STRENGTHS:
• [Be specific — name actual skills, experiences, or achievements found in the resume]
• [At least 2-3 concrete strengths]
• [Focus on things the candidate actually did well]

AREAS FOR IMPROVEMENT:
• [Be specific and actionable — avoid generic advice]
• [Name the exact problem and the exact fix]
• [At least 3-5 concrete issues]

SECTION-WISE FEEDBACK:

Summary:
[2-4 sentences. Is the summary specific to a role? Does it lead with achievements? Is the tone right?]

Experience:
[For each role mentioned, comment on: Do bullets show impact with metrics? Are action verbs strong? Is the progression clear?]

Skills:
[Which skills are relevant and well-presented? Which are missing based on the job description or role?]

Projects:
[Are projects described with outcomes? Tech stack mentioned? Individual contribution clear?]

Education:
[Is education section appropriate? Any certifications or courses that add value?]

KEYWORD OPTIMIZATION:
${jobDescription ? `Compare resume keywords against the job description:
• MATCHED keywords (found in both): [list]
• MISSING keywords (in job description, not in resume): [list]
• SUGGESTED additions: [2-3 skills or terms to weave in naturally]
` : `Based on the resume content, suggest 5-8 important keywords a hiring manager would look for:
• [keyword 1]
• [keyword 2]
• ...
`}
ATS OPTIMIZATION TIPS:
• [3-4 specific, actionable ATS tips — format, section headings, what to avoid, what to include]

ACTIONABLE NEXT STEPS:
1. [Specific, prioritized action — what to do first and why]
2. [Second priority action]
3. [Third priority action]
4. [Bonus tip if time allows]

━━━ END OF REPORT ━━━

IMPORTANT RULES:
- Write in plain English. No jargon, no corporate speak.
- Be honest — if something is weak, say so. But always offer the fix.
- Do NOT rewrite the resume. Give feedback, not a rewrite.
- If job description is provided, cross-reference it throughout.
- Score realistically — most resumes score 6-7/10 on first review.`,
        'tailorResume',
        {}
      );

      const scoreMatch = text.match(/OVERALL SCORE:\s*(\d+(?:\.\d+)?)\s*/);
      const overallScore = scoreMatch ? parseFloat(scoreMatch[1]) : null;

      const analysis = await ResumeAnalysis.create({
        userId: authUser._id,
        resumeText: resume.slice(0, 10000),
        jobDescription: jobDescription || '',
        targetRole: targetRole || '',
        report: text,
        overallScore,
        provider,
      });

      return res.status(200).json({
        success: true,
        data: { report: text, overallScore, provider, id: analysis._id.toString() },
      });
    } catch (err) {
      if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
      }
      return res.status(500).json({ success: false, message: err.message || 'Failed to analyze resume' });
    }
  }

  // ============================================================
  // IMAGE GENERATION (Pollinations — free, no API key)
  // ============================================================

  // Simple in-memory rate limiter (10 req/min per IP)
  const imageRateLimiter = {};
  const IMAGE_RATE_LIMIT = 10;
  const IMAGE_RATE_WINDOW = 60000; // 1 minute

  if (action === 'image' && method === 'POST') {
    const { prompt } = body || {};
    if (!prompt) return res.status(400).json({ success: false, message: 'Prompt is required' });

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
      return res.status(429).json({
        success: false,
        message: 'Too many image requests. Please wait a minute and try again.',
      });
    }

    entry.count += 1;
    imageRateLimiter[clientIp] = entry;

    try {
      const seed = Date.now();
      const images = Array.from({ length: 3 }, (_, i) => ({
        id: `img_${seed + i}`,
        url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed + i}&width=768&height=768&nologo=true`,
        prompt,
      }));

      return res.status(200).json({ success: true, data: { images, savedId: null } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message || 'Failed to generate images' });
    }
  }

  // ============================================================
  // PROTECTED ROUTES
  // ============================================================
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
      const { company, role, jobDescription, experience } = body || {};
      if (!company || !role) return res.status(400).json({ success: false, message: 'Company and role required' });
      const { text, provider } = await callAI(`Write a cover letter.\n\nCompany: ${company}\nRole: ${role}\nJob Description: ${jobDescription || 'Not provided'}\nExperience: ${experience || 'Relevant experience'}`, 'coverLetter', { company, role, experience });
      if (user.aiCredits > 0) await User.findByIdAndUpdate(decoded.id, { $inc: { aiCredits: -1, resumeGenerations: 1 } });
      return res.status(200).json({ success: true, data: { coverLetter: text, provider, creditsRemaining: Math.max(0, user.aiCredits - 1) } });
    }

    if (action === 'outreach' && method === 'POST') {
      const { type, recipientName, recipientRole, company, yourBackground, targetRole } = body || {};
      if (!recipientName) return res.status(400).json({ success: false, message: 'Recipient name required' });
      const { text, provider } = await callAI(`Write a ${type || 'professional'} message.\n\nRecipient: ${recipientName}\nRole: ${recipientRole || ''}\nCompany: ${company || 'Target'}\nYour Background: ${yourBackground || ''}\nTarget Role: ${targetRole || ''}`, 'outreach', { type, recipientName, company, targetRole });
      if (user.aiCredits > 0) await User.findByIdAndUpdate(decoded.id, { $inc: { aiCredits: -1 } });
      return res.status(200).json({ success: true, data: { message: text, provider, creditsRemaining: Math.max(0, user.aiCredits - 1) } });
    }

    // Resume Analysis — list history
    if (action === 'resume-analyses' && method === 'GET') {
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);
      const skip = parseInt(req.query.skip) || 0;
      const analyses = await ResumeAnalysis.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('targetRole overallScore createdAt')
        .lean();
      const total = await ResumeAnalysis.countDocuments({ userId: user._id });
      return res.status(200).json({ success: true, data: { analyses, total, limit, skip } });
    }

    // Resume Analysis — get single
    if (action === 'resume-analysis' && method === 'GET') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ success: false, message: 'Analysis ID required' });
      const analysis = await ResumeAnalysis.findOne({ _id: id, userId: user._id }).lean();
      if (!analysis) return res.status(404).json({ success: false, message: 'Analysis not found' });
      return res.status(200).json({ success: true, data: analysis });
    }

    // Resume Analysis — delete
    if (action === 'resume-analysis' && method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ success: false, message: 'Analysis ID required' });
      const deleted = await ResumeAnalysis.findOneAndDelete({ _id: id, userId: user._id });
      if (!deleted) return res.status(404).json({ success: false, message: 'Analysis not found' });
      return res.status(200).json({ success: true, data: { deleted: true } });
    }

    return res.status(404).json({ success: false, message: 'Route not found' });
  } catch (error) {
    console.error('AI error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
}
