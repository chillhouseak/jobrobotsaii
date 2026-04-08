import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from './models/User.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const HF_API_KEY = process.env.HF_API_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

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
      const images = Array.from({ length: 1 }, (_, i) => ({
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
  // VOICE OVER (ElevenLabs TTS only)
  // ================================================================
  const elevenLabsVoices = {
    male: { professional: 'wAGzRVkxKEs8La0lmdrE', friendly: 'wAGzRVkxKEs8La0lmdrE', confident: 'wAGzRVkxKEs8La0lmdrE', calm: 'wAGzRVkxKEs8La0lmdrE' },
    female: { professional: 'wAGzRVkxKEs8La0lmdrE', friendly: 'wAGzRVkxKEs8La0lmdrE', confident: 'wAGzRVkxKEs8La0lmdrE', calm: 'wAGzRVkxKEs8La0lmdrE' },
  };

  if (action === 'voice-over' && method === 'POST') {
    const { text, voiceType, tone, speed } = body || {};
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Text is required' });
    if (text.length > 5000) return res.status(400).json({ success: false, message: 'Text too long. Max 5000 characters.' });

    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'your_elevenlabs_api_key_here') {
      return res.status(503).json({ success: false, message: 'ElevenLabs API key not configured. Please add ELEVENLABS_API_KEY to your environment variables.' });
    }

    const voiceId = elevenLabsVoices[voiceType]?.[tone] || elevenLabsVoices.male.professional;
    let r;
    try {
      r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: { 'Accept': 'audio/mpeg', 'Content-Type': 'application/json', 'xi-api-key': ELEVENLABS_API_KEY },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: speed === 'slow' ? 0.2 : speed === 'fast' ? 0.6 : 0.4, use_speaker_boost: true },
        }),
      });
    } catch (fetchErr) {
      console.error('[VoiceOver] Fetch failed:', fetchErr.message);
      return res.status(502).json({ success: false, message: 'Failed to reach ElevenLabs. Check your API key and try again.' });
    }

    if (!r.ok) {
      let errMsg = 'ElevenLabs API error. Please try again.';
      try {
        const errBody = await r.json();
        errMsg = errBody.message || errBody.detail || errMsg;
      } catch {
        const errText = await r.text().catch(() => '');
        if (errText) errMsg = errText.slice(0, 200);
      }
      console.error('[VoiceOver] ElevenLabs error:', r.status, errMsg);
      return res.status(502).json({ success: false, message: errMsg });
    }

    const buf = await r.arrayBuffer();
    const base64 = Buffer.from(buf).toString('base64');
    return res.status(200).json({
      success: true,
      audioUrl: `data:audio/mpeg;base64,${base64}`,
      characterCount: text.length,
    });
  }

  // ================================================================
  // INTERVIEW QUESTIONS (AI-generated)
  // ================================================================
  if (action === 'interview-questions' && method === 'POST') {
    const { jobRole, interviewType } = body || {};
    if (!jobRole) return res.status(400).json({ success: false, message: 'Job role is required' });

    const type = interviewType || 'behavioral';
    const prompt = `You are a professional interviewer preparing ${type} interview questions for a ${jobRole} position.

Generate exactly 5 questions that are highly relevant to ${jobRole}.
${type === 'technical' ? 'Make them job-specific and test problem-solving abilities.' : type === 'hr' ? 'Make them focused on culture fit and soft skills.' : 'Make them behavioral using the STAR method format.'}
Return ONLY a valid JSON array with this exact structure, no markdown or explanation:
[
  {"text": "Full question here", "type": "${type}", "number": 1},
  {"text": "Full question here", "type": "${type}", "number": 2},
  {"text": "Full question here", "type": "${type}", "number": 3},
  {"text": "Full question here", "type": "${type}", "number": 4},
  {"text": "Full question here", "type": "${type}", "number": 5}
]`;

    try {
      const { text } = await callAI(prompt, 'answer', { role: jobRole });
      let questions;
      try {
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
          const jsonStr = text.slice(start, end + 1).replace(/[\r\n]/g, ' ');
          questions = JSON.parse(jsonStr);
        }
      } catch {
        questions = null;
      }

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        const fallback = {
          behavioral: [
            "Tell me about a time when you had to work under pressure. How did you handle it?",
            "Describe a situation where you had to collaborate with a difficult team member. What was the outcome?",
            "Give me an example of a goal you reached and how you achieved it.",
            "Tell me about a time you made a mistake. How did you handle it?",
            "Describe a situation where you had to learn something new quickly.",
          ],
          technical: [
            "Explain the difference between REST and GraphQL APIs. When would you choose one over the other?",
            "How would you optimize a slow-performing database query?",
            "Describe your experience with version control and branching strategies.",
            "What design patterns have you used in your projects?",
            "How do you approach debugging a production issue?",
          ],
          hr: [
            "Why are you interested in working for our company?",
            "Where do you see yourself in five years?",
            "What are your greatest strengths and weaknesses?",
            "How do you handle feedback and criticism?",
            "Why should we hire you over other candidates?",
          ],
        };
        questions = (fallback[type] || fallback.behavioral).map((text, i) => ({ text, type, number: i + 1 }));
      }

      return res.status(200).json({ success: true, data: { questions, jobRole, interviewType: type } });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message || 'Failed to generate questions' });
    }
  }

  // ================================================================
  // ANALYZE ANSWER (AI feedback)
  // ================================================================
  if (action === 'analyze-answer' && method === 'POST') {
    const { question, answer, interviewType } = body || {};
    if (!question) return res.status(400).json({ success: false, message: 'Question is required' });
    if (!answer) return res.status(400).json({ success: false, message: 'Answer is required' });

    const prompt = `You are an expert interview coach. Analyze this interview answer and provide feedback.

Interview Type: ${interviewType || 'behavioral'}
Question: ${question}
Answer: ${answer}

Respond ONLY with valid JSON in this exact format, no markdown or explanation:
{
  "feedback": "2-3 sentence constructive feedback on the answer quality, relevance, and delivery",
  "score": number between 1-10,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["area to improve 1", "area to improve 2"]
}`;

    try {
      const { text } = await callAI(prompt, 'answer', { role: interviewType });
      let result;
      try {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          result = JSON.parse(text.slice(start, end + 1));
        }
      } catch {
        result = null;
      }

      if (!result) {
        result = { feedback: "Good attempt. Consider adding more specific examples and quantifiable results.", score: 7, strengths: ["Clear communication", "Relevant experience"], improvements: ["Add metrics", "Use STAR method"] };
      }

      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message || 'Failed to analyze answer' });
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

    // ================================================================
    // RESUME ANALYSIS
    // ================================================================
    const MAX_FILE_SIZE = 3 * 1024 * 1024;
    const MAX_TEXT_CHARS = 13000;
    const MIN_TEXT_CHARS = 50;

   const extractResumeText = async (buffer, fileType) => {
  if (fileType === 'docx') {
    const mammoth = (await import('mammoth')).default;
    const result = await mammoth.extractRawText({ buffer });
    return { method: 'mammoth', text: result.value };
  }

  if (fileType === 'pdf') {

    // Method 1: pdf-parse — guard against serverless ENOENT bug
    try {
      // Suppress the test-file read that crashes in serverless
      const pdfParse = await import('pdf-parse').then(m => m.default || m).catch(() => null);
      if (pdfParse) {
        const data = await pdfParse(buffer, { max: 0 }); // max:0 skips test file
        if (data?.text?.trim()?.length >= MIN_TEXT_CHARS) {
          return { method: 'pdf-parse', text: data.text };
        }
      }
    } catch (e) {
      console.warn('[Resume] pdf-parse failed:', e.message);
    }

    // Method 2: pdfjs-dist — NO worker (server-side safe)
    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      // ✅ Disable worker — required for Node.js/serverless environments
      pdfjs.GlobalWorkerOptions.workerSrc = false;

      const doc = await pdfjs.getDocument({
        data: new Uint8Array(buffer),
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      }).promise;

      let pageTexts = '';
      for (let i = 1; i <= Math.min(doc.numPages, 10); i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        pageTexts += content.items.map(item => item.str || '').join(' ') + '\n';
      }
      if (pageTexts.trim().length >= MIN_TEXT_CHARS) {
        return { method: 'pdfjs-dist', text: pageTexts };
      }
    } catch (e) {
      console.warn('[Resume] pdfjs-dist failed:', e.message);
    }

    return null;
  }

  return null;
};

    if (action === 'resume-analyze' && method === 'POST') {
      const { fileData, fileType } = body || {};
      if (!fileData) return res.status(400).json({ success: false, message: 'No file provided' });

      if (!['pdf', 'docx'].includes(fileType)) {
        return res.status(400).json({ success: false, message: 'Unsupported file format. Use PDF or DOCX.' });
      }

      let buffer;
      try {
        buffer = Buffer.from(fileData, 'base64');
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid file data' });
      }

      if (buffer.length > MAX_FILE_SIZE) {
        return res.status(400).json({ success: false, message: 'File too large. Maximum 3MB.' });
      }
      if (buffer.length < 100) {
        return res.status(400).json({ success: false, message: 'File appears empty or corrupted' });
      }

      let extraction;
      try {
        extraction = await extractResumeText(buffer, fileType);
      } catch (err) {
        console.error('[Resume] All extraction methods threw:', err.message);
        return res.status(400).json({ success: false, message: 'Failed to read file. Try a text-based PDF or DOCX.' });
      }

      if (!extraction || extraction.text.trim().length < MIN_TEXT_CHARS) {
        return res.status(400).json({
          success: false,
          message: 'Could not extract enough text. This may be a scanned image PDF — try a text-based resume instead.',
        });
      }

      let resumeText = extraction.text.trim();
      const extractionMethod = extraction.method;
      if (resumeText.length > MAX_TEXT_CHARS) {
        resumeText = resumeText.slice(0, MAX_TEXT_CHARS);
      }

      const prompt = `You are an expert ATS (Applicant Tracking System) resume analyst. Analyze the resume below and score it realistically. Be honest and specific.

RESUME TEXT:
${resumeText}

Analyze carefully and return ONLY valid JSON with this exact structure (no markdown, no explanation, no text before or after):
{
  "score": number between 0 and 100,
  "summary": "2-3 sentence overall assessment of this resume's quality and ATS compatibility",
  "keywordsFound": ["keyword or skill found in resume 1", "keyword or skill found 2", "keyword or skill found 3"],
  "keywordsMissing": ["important keyword, skill, or section that should be included 1", "missing item 2", "missing item 3"],
  "improvements": [
    {"text": "specific actionable improvement", "priority": "high", "section": "relevant section name"},
    {"text": "specific actionable improvement", "priority": "high", "section": "relevant section name"},
    {"text": "specific actionable improvement", "priority": "medium", "section": "relevant section name"},
    {"text": "specific actionable improvement", "priority": "low", "section": "relevant section name"}
  ],
  "sectionScores": {
    "contact": number between 0 and 100,
    "summary": number between 0 and 100,
    "experience": number between 0 and 100,
    "education": number between 0 and 100,
    "skills": number between 0 and 100,
    "formatting": number between 0 and 100
  },
  "atsTips": ["ATS optimization tip 1", "ATS optimization tip 2", "ATS optimization tip 3"]
}`;

      let analysis;
      try {
        const { text: rawText } = await callAI(prompt, 'answer', {});

        // Safe JSON parsing — find first { and last }
        let parsed = null;
        try {
          const start = rawText.indexOf('{');
          const end = rawText.lastIndexOf('}');
          if (start !== -1 && end !== -1 && end > start) {
            const jsonStr = rawText.slice(start, end + 1)
              .replace(/\r\n/g, ' ').replace(/\n/g, ' ')
              .replace(/,\s*([}\]])/g, '$1');
            parsed = JSON.parse(jsonStr);
          }
        } catch {
          parsed = null;
        }

        if (parsed && typeof parsed.score === 'number' && parsed.score >= 0 && parsed.score <= 100) {
          analysis = parsed;
        } else {
          return res.status(500).json({ success: false, message: 'AI returned an invalid response. Please try again.' });
        }
      } catch (aiErr) {
        console.error('[Resume] AI analysis failed:', aiErr.message);
        return res.status(500).json({ success: false, message: 'AI analysis failed. Please try again.' });
      }

      if (user.aiCredits > 0) {
        await User.findByIdAndUpdate(decoded.id, { $inc: { aiCredits: -1 } });
      }

      return res.status(200).json({
        success: true,
        data: {
          analysis,
          extractionMethod,
          resumeTextLength: resumeText.length,
          creditsRemaining: Math.max(0, user.aiCredits - 1),
        },
      });
    }

    return res.status(404).json({ success: false, message: 'Route not found' });
  } catch (error) {
    console.error('AI error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
}
