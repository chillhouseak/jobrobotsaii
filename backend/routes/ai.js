const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Gemini API configuration
// Add your Gemini API key to .env as GEMINI_API_KEY
let genAI = null;
let model = null;

const initGemini = async () => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.log('Gemini API key not configured - using mock responses');
    return null;
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('Gemini AI initialized successfully');
    return model;
  } catch (error) {
    console.error('Failed to initialize Gemini:', error.message);
    return null;
  }
};

initGemini();

// Initialize on module load
(async () => {
  await initGemini();
})();

// Helper function for AI generation
const generateWithAI = async (prompt) => {
  if (!model) {
    return null; // Return null to indicate mock mode
  }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error.message);
    return null;
  }
};

// Mock responses for when Gemini is not configured
const mockResponses = {
  answer: (tone, length) => {
    const responses = {
      professional: "Thank you for the opportunity to discuss this position. With my background in this field, I have developed strong skills in problem-solving and collaboration. I am excited about the possibility of bringing this experience to your team and contributing to your company's success.",
      friendly: "Hey there! I'm really excited about this opportunity. I've been working in this space for a while now, and I've loved every bit of it. What really gets me going is solving tricky problems and working with awesome people.",
      confident: "I am the ideal candidate for this position. With proven expertise in this domain, I have consistently exceeded expectations and delivered measurable results throughout my career."
    };
    let response = responses[tone] || responses.professional;
    if (length === 'short') response = response.split('.')[0] + '.';
    if (length === 'long') response = response + ' ' + responses[tone];
    return response;
  },

  outreach: {
    linkedin: (name, company, role) => `Hi ${name},

I hope this message finds you well! I'm currently exploring opportunities in ${role} and came across your profile. Your experience as ${role} at ${company} is truly inspiring.

I would love to connect and learn more about your journey.

Best regards`,
    email: (name, company, background) => `Dear ${name},

I hope this email finds you well. I am reaching out to express my interest in potential opportunities at ${company}.

With a background in ${background || 'software development'}, I am particularly drawn to organizations that value innovation and excellence.

I would greatly appreciate the opportunity to connect.

Warm regards`,
    referral: (name, company) => `Hi ${name},

I hope you're doing well! I'm reaching out because I'm very interested in opportunities at ${company}.

If you know of anyone on your team who might be able to refer me, I would greatly appreciate it.

Thank you for your time!`,
    followup: (name, company) => `Hi ${name},

I wanted to follow up on my previous message regarding opportunities at ${company}.

I remain very interested in contributing to your team.

Best regards`
  },

  coverLetter: (company, role, experience) => `Dear Hiring Manager,

I am writing to express my enthusiastically interest in the ${role} position at ${company}. With my background in ${experience || 'software development'} and passion for delivering exceptional results, I believe I would be a valuable addition to your team.

Throughout my career, I have developed strong skills that align well with your requirements. I am particularly drawn to ${company} because of its innovative approach and commitment to excellence.

I am excited about the possibility of contributing to your continued success and would welcome the opportunity to discuss how my skills and experience would benefit your organization.

Thank you for considering my application. I look forward to hearing from you soon.

Sincerely`
};

// @route   POST /api/ai/answer
// @desc    Generate interview answer
// @access  Private
router.post('/answer', async (req, res) => {
  try {
    const { question, role, tone, length } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    const prompt = `You are a professional career coach helping someone prepare for a job interview.

Question: "${question}"
Role/Position: ${role || 'General'}
Tone: ${tone || 'professional'}
Length: ${length || 'medium'}

Generate a ${length === 'short' ? 'brief (2-3 sentences)' : length === 'long' ? 'detailed (multiple paragraphs)' : 'concise (1 paragraph)'} answer that is ${tone}.

Make it specific, memorable, and highlight relevant skills and experiences.`;

    const aiResponse = await generateWithAI(prompt);

    res.json({
      success: true,
      data: {
        answer: aiResponse || mockResponses.answer(tone, length),
        usingAI: !!aiResponse
      }
    });
  } catch (error) {
    console.error('Answer generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating answer'
    });
  }
});

// @route   POST /api/ai/outreach
// @desc    Generate cold outreach message
// @access  Private
router.post('/outreach', async (req, res) => {
  try {
    const { type, recipientName, recipientRole, company, yourBackground, targetRole } = req.body;

    if (!recipientName) {
      return res.status(400).json({
        success: false,
        message: 'Recipient name is required'
      });
    }

    const prompt = `You are a professional job search coach helping someone write a ${type === 'linkedin' ? 'LinkedIn connection message' : type === 'email' ? 'cold email' : type === 'referral' ? 'referral request' : 'follow-up message'}.

Recipient: ${recipientName}
Their Role: ${recipientRole || 'Professional'}
Company: ${company || 'Target Company'}
Your Background: ${yourBackground || 'Professional with relevant experience'}
Target Role: ${targetRole || 'Position of interest'}
Type: ${type}

Write a ${type === 'linkedin' ? 'short LinkedIn message (under 300 characters)' : 'professional outreach message'} that:
- Is personalized and specific
- Clearly states your purpose
- Creates value or interest
- Includes a clear call-to-action
- ${type === 'followup' ? 'References your previous message politely' : 'Shows genuine interest in the company'}`;

    const aiResponse = await generateWithAI(prompt);

    res.json({
      success: true,
      data: {
        message: aiResponse || mockResponses.outreach[type]?.(recipientName, company, yourBackground) || mockResponses.outreach.linkedin(recipientName, company, targetRole),
        usingAI: !!aiResponse
      }
    });
  } catch (error) {
    console.error('Outreach generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating outreach message'
    });
  }
});

// @route   POST /api/ai/cover-letter
// @desc    Generate cover letter
// @access  Private
router.post('/cover-letter', async (req, res) => {
  try {
    const { company, role, jobDescription, experience } = req.body;

    if (!company || !role) {
      return res.status(400).json({
        success: false,
        message: 'Company and role are required'
      });
    }

    const prompt = `You are a professional cover letter writer helping someone write a compelling cover letter.

Company: ${company}
Position: ${role}
Job Description Summary: ${jobDescription || 'Not provided'}
Your Experience: ${experience || 'Professional with relevant background'}

Write a professional cover letter that:
- Opens with a strong hook about why you're excited about ${company}
- Highlights 2-3 specific achievements relevant to the role
- Shows genuine knowledge about the company
- Explains how your skills align with their needs
- Ends with a confident call-to-action

Format it professionally with proper salutation and closing.`;

    const aiResponse = await generateWithAI(prompt);

    res.json({
      success: true,
      data: {
        coverLetter: aiResponse || mockResponses.coverLetter(company, role, experience),
        usingAI: !!aiResponse
      }
    });
  } catch (error) {
    console.error('Cover letter generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating cover letter'
    });
  }
});

// @route   POST /api/ai/interview-prep
// @desc    Generate interview preparation questions
// @access  Private
router.post('/interview-prep', async (req, res) => {
  try {
    const { role, experienceLevel, questionType } = req.body;

    const prompt = `You are a professional interview coach preparing someone for a job interview.

Role/Position: ${role || 'Professional'}
Experience Level: ${experienceLevel || 'Mid-level'}
Question Type: ${questionType || 'All'} (behavioral, technical, or both)

Generate 5 interview questions with sample answers that:
- Are relevant to ${role || 'the position'}
- Are appropriate for ${experienceLevel || 'mid-level'} candidates
- Include the STAR method for behavioral questions
- Are specific and memorable

Format as JSON with questions and detailed answers.`;

    const aiResponse = await generateWithAI(prompt);

    // Mock data
    const mockData = {
      questions: [
        {
          question: "Tell me about yourself",
          type: "behavioral",
          answer: "I'm a passionate developer with [X] years of experience. I started my career [context], and since then I've worked on [achievement]. What excites me most about this role is [connection to role]. In my current position, I've [specific accomplishment] which resulted in [measurable impact]."
        },
        {
          question: "What's your greatest strength?",
          type: "behavioral",
          answer: "My greatest strength is [specific skill]. For example, in my previous role, I [action] which led to [result]. I've developed this strength through [experience], and I'm excited to apply it to [new opportunity]."
        },
        {
          question: "Where do you see yourself in 5 years?",
          type: "behavioral",
          answer: "In 5 years, I see myself as a [role level] in [industry]. I want to [specific goal 1] and [specific goal 2]. I'm particularly interested in this company because [company connection], which aligns with my long-term career vision."
        },
        {
          question: `Why should we hire you for this ${role || 'role'}?`,
          type: "behavioral",
          answer: "You should hire me because I bring [unique value proposition]. My track record shows [relevant achievement], and my skills in [key skills] directly align with your needs. I'm also excited about [company aspect] because [reason]."
        },
        {
          question: "Tell me about a time you handled a difficult situation",
          type: "behavioral",
          answer: "STAR Example:\nSituation: [Brief context]\nTask: [Your responsibility]\nAction: [What you did specifically]\nResult: [Outcomes - quantify if possible]"
        }
      ]
    };

    res.json({
      success: true,
      data: {
        questions: aiResponse ? JSON.parse(aiResponse) : mockData,
        usingAI: !!aiResponse
      }
    });
  } catch (error) {
    console.error('Interview prep error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating interview prep'
    });
  }
});

// @route   GET /api/ai/status
// @desc    Check AI service status
// @access  Private
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      geminiConfigured: !!model,
      status: model ? 'ready' : 'mock_mode'
    }
  });
});

// @route   POST /api/ai/generate-images
// @desc    Generate images from text prompts using Pollinations AI
// @access  Private
router.post('/generate-images', async (req, res) => {
  try {
    const { prompt, style, count } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    const imageCount = Math.min(Math.max(count || 1, 1), 4);

    // Style mappings for Gemini
    const styleParams = {
      realistic: 'photorealistic, 4k, high detail, realistic photo',
      illustration: 'digital illustration, vibrant colors, artstation style',
      '3d': '3d render, octane render, cinema 4d style',
      minimal: 'minimalist, clean design, simple composition',
      anime: 'anime style, manga, vibrant colors',
      abstract: 'abstract art, colorful, creative composition'
    };

    const styleSuffix = styleParams[style] || styleParams.realistic;
    const enhancedPrompt = `${prompt}, ${styleSuffix}`;

    // Initialize Gemini with image generation model
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(500).json({
        success: false,
        message: 'Gemini API key not configured'
      });
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const imageModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

    const imageUrls = [];

    for (let i = 0; i < imageCount; i++) {
      const result = await imageModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: `Generate an image: ${enhancedPrompt}` }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      });

      const response = result.response;
      const candidates = response.candidates;

      if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            const { mimeType, data } = part.inlineData;
            const imageUrl = `data:${mimeType};base64,${data}`;
            imageUrls.push({
              id: `img_${Date.now()}_${i}`,
              url: imageUrl,
              prompt: prompt,
              style: style
            });
            break; // Take first image part
          } else if (part.text) {
            // Text part - skip, try next
            continue;
          }
        }
      }

      // If no image generated, skip this slot
    }

    if (imageUrls.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate images. Please try again.'
      });
    }

    res.json({
      success: true,
      data: {
        images: imageUrls,
        prompt: prompt,
        style: style
      }
    });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating images'
    });
  }
});

// ElevenLabs Voice IDs - Popular voices
const elevenLabsVoices = {
  male: {
    professional: 'pFZP5JQG7iHVjEImzEInSJsM',    // James - Professional deep male
    friendly: 'pqHfZKPmSAGWHJbT9MzoiWxc',       // Marcus - Friendly American
    confident: 'VR6AewLTigWG4eqSOJ0a',            // Daniel - British professional
    calm: 'TX3LPaxmHKxASX8yoLbQXGFY',            // Thomas - Calm sophisticated
  },
  female: {
    professional: 'EXAVITQu4vr4xnSDxMaL',       // Sarah - Professional female
    friendly: 'FGY2WhTYpPnrSeqd7WKo',            // Jessica - Warm friendly
    confident: 'TX3LPaxmHKxASX8yoLbQXGFY',      // Lily - Confident young
    calm: 'FGY2WhTYpPnrSeqd7WKo',               // Annie - Calm soothing
  }
};

// Speed mappings for ElevenLabs
const speedMap = {
  slow: 0.7,
  normal: 1.0,
  fast: 1.3
};

// @route   POST /api/ai/voice-over
// @desc    Generate voice over using ElevenLabs API
// @access  Private
router.post('/voice-over', async (req, res) => {
  try {
    const { text, voiceType, tone, speed } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    if (!text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Text cannot be empty'
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Text too long. Maximum 5000 characters allowed.'
      });
    }

    // Check if ElevenLabs is configured
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsKey || elevenLabsKey === 'your_elevenlabs_api_key_here') {
      // Return Web Speech API configuration
      return res.json({
        success: true,
        data: {
          config: {
            text: text,
            voiceType: voiceType,
            tone: tone,
            speed: speed,
            characterCount: text.length,
            estimatedDuration: Math.ceil(text.split(' ').length / (speed === 'slow' ? 2 : speed === 'fast' ? 3 : 2.5))
          },
          method: 'web_speech_api',
          message: 'ElevenLabs not configured. Using browser TTS.'
        }
      });
    }

    // Get voice ID
    const voiceId = elevenLabsVoices[voiceType]?.[tone] || elevenLabsVoices.male.professional;

    // Generate audio with ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: speed === 'slow' ? 0.2 : speed === 'fast' ? 0.6 : 0.4,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'ElevenLabs API error');
    }

    // Get audio buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

    res.json({
      success: true,
      data: {
        config: {
          text: text,
          voiceType: voiceType,
          tone: tone,
          speed: speed,
          characterCount: text.length,
          estimatedDuration: Math.ceil(text.split(' ').length / 2.5)
        },
        audioUrl: audioUrl,
        method: 'elevenlabs',
        voiceId: voiceId
      }
    });
  } catch (error) {
    console.error('Voice over error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating voice over'
    });
  }
});

// @route   GET /api/ai/voices
// @desc    Get available ElevenLabs voices
// @access  Private
router.get('/voices', async (req, res) => {
  try {
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsKey || elevenLabsKey === 'your_elevenlabs_api_key_here') {
      return res.json({
        success: true,
        data: {
          voices: Object.keys(elevenLabsVoices.male).flatMap(tone => [
            { id: elevenLabsVoices.male[tone], name: `${tone} male`, type: 'male', tone: tone },
            { id: elevenLabsVoices.female[tone], name: `${tone} female`, type: 'female', tone: tone },
          ]),
          method: 'elevenlabs'
        }
      });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'Accept': 'application/json',
        'xi-api-key': elevenLabsKey
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch voices');
    }

    const data = await response.json();

    res.json({
      success: true,
      data: {
        voices: data.voices,
        method: 'elevenlabs'
      }
    });
  } catch (error) {
    console.error('Get voices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching voices'
    });
  }
});

// Mock interview questions by type
const mockInterviewQuestions = {
  behavioral: [
    "Tell me about a time when you had to work under pressure. How did you handle it?",
    "Describe a situation where you had to collaborate with a difficult team member. What was the outcome?",
    "Give me an example of a goal you reached and tell me how you achieved it.",
    "Tell me about a time you made a mistake. How did you handle it?",
    "Describe a situation where you had to learn something new quickly."
  ],
  technical: [
    "Explain the difference between REST and GraphQL APIs. When would you choose one over the other?",
    "How would you optimize a slow-performing database query?",
    "Describe your experience with version control and branching strategies.",
    "What design patterns have you used in your projects? Explain one in detail.",
    "How do you approach debugging a production issue?"
  ],
  hr: [
    "Why are you interested in working for our company?",
    "Where do you see yourself in five years?",
    "What are your greatest strengths and weaknesses?",
    "How do you handle feedback and criticism?",
    "Why should we hire you over other candidates?"
  ]
};

// @route   POST /api/ai/interview-questions
// @desc    Generate interview questions for AI simulator
// @access  Private
router.post('/interview-questions', async (req, res) => {
  try {
    const { jobRole, interviewType } = req.body;

    if (!jobRole) {
      return res.status(400).json({
        success: false,
        message: 'Job role is required'
      });
    }

    const prompt = `You are a professional interviewer preparing questions for a ${interviewType || 'behavioral'} interview for the position of ${jobRole}.

Generate exactly 5 interview questions that:
- Are highly relevant to ${jobRole}
- Are ${interviewType === 'technical' ? 'job-specific and test problem-solving abilities' : interviewType === 'hr' ? 'focused on culture fit and soft skills' : 'behavioral and use STAR method format'}
- Are clear and specific
- Test both knowledge and interpersonal skills
- Are appropriate for a mid-level to senior candidate

Format the response as a JSON array of question objects with:
- "text": the full question
- "type": "${interviewType || 'behavioral'}"
- "number": question number 1-5

Return ONLY the JSON array, no other text.`;

    const aiResponse = await generateWithAI(prompt);

    let questions;
    try {
      questions = aiResponse ? JSON.parse(aiResponse) : null;
    } catch (e) {
      questions = null;
    }

    // Use AI questions or fallback to mock
    if (!questions || !Array.isArray(questions)) {
      const typeQuestions = mockInterviewQuestions[interviewType] || mockInterviewQuestions.behavioral;
      questions = typeQuestions.map((text, index) => ({
        number: index + 1,
        text: text,
        type: interviewType || 'behavioral'
      }));
    }

    res.json({
      success: true,
      data: {
        questions: questions,
        jobRole: jobRole,
        interviewType: interviewType || 'behavioral',
        usingAI: !!aiResponse
      }
    });
  } catch (error) {
    console.error('Interview questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating interview questions'
    });
  }
});

// @route   POST /api/ai/analyze-answer
// @desc    Analyze interview answer and provide feedback
// @access  Private
router.post('/analyze-answer', async (req, res) => {
  try {
    const { question, answer, interviewType } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required'
      });
    }

    const prompt = `You are a professional interview coach evaluating a candidate's interview answer.

Question Asked: "${question}"
Interview Type: ${interviewType || 'behavioral'}
Candidate's Answer: "${answer}"

Evaluate this answer and provide detailed feedback in the following format:
- Assess the quality of the answer (relevance, clarity, structure, examples)
- Identify specific strengths
- Suggest specific improvements
- Give a score from 1-10 based on overall quality

Respond ONLY as a JSON object with this exact structure:
{
  "feedback": "Overall feedback text explaining the quality of the answer and suggestions",
  "score": number from 1-10,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"]
}

For scores:
- 9-10: Excellent, memorable, specific examples, STAR format used well
- 7-8: Good, relevant, but could be more specific or better structured
- 5-6: Average, basic answer but lacks depth or examples
- 3-4: Below average, vague or off-topic
- 1-2: Poor, doesn't address the question

Return ONLY the JSON object, no other text.`;

    const aiResponse = await generateWithAI(prompt);

    let analysis;
    try {
      analysis = aiResponse ? JSON.parse(aiResponse) : null;
    } catch (e) {
      analysis = null;
    }

    // Use AI analysis or fallback to mock
    if (!analysis || !analysis.feedback) {
      const mockFeedbacks = [
        {
          feedback: "Good answer! You demonstrated clear communication skills and provided specific examples. Try to structure your answers using the STAR method for even better impact.",
          score: 8,
          strengths: ["Clear communication", "Specific examples", "Good confidence"],
          improvements: ["Use STAR method for structure", "Add more quantifiable results"]
        },
        {
          feedback: "Excellent response! You showed strong self-awareness and provided concrete examples. Consider adding more details about the impact of your actions.",
          score: 9,
          strengths: ["Strong examples", "Self-awareness", "Professional tone"],
          improvements: ["Quantify achievements", "Show leadership potential"]
        },
        {
          feedback: "Solid answer with good depth. You effectively communicated your experience. To improve, try to be more concise while maintaining the key points.",
          score: 7,
          strengths: ["Relevant experience", "Good delivery", "Clear examples"],
          improvements: ["Be more concise", "Focus on most impactful points", "Add metrics"]
        }
      ];
      analysis = mockFeedbacks[Math.floor(Math.random() * mockFeedbacks.length)];
    }

    res.json({
      success: true,
      data: {
        feedback: analysis.feedback,
        score: analysis.score,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        usingAI: !!aiResponse
      }
    });
  } catch (error) {
    console.error('Analyze answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing answer'
    });
  }
});

// ==========================================
// AI Goal Tracker
// ==========================================
router.post('/goal-tracker', auth, async (req, res) => {
  try {
    const { goal, targetDays, currentProgress } = req.body;

    if (!goal) {
      return res.status(400).json({
        success: false,
        message: 'Goal is required'
      });
    }

    const prompt = `
You are an AI Job Goal Tracker. Create a structured plan for this goal: "${goal}"
${targetDays ? `Target: ${targetDays} days` : 'Default target: 60 days'}
${currentProgress ? `Current progress: ${currentProgress}` : ''}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "goal": "the user's goal",
  "targetDays": number,
  "daysRemaining": number,
  "phases": [
    {
      "phase": "Phase name",
      "days": "duration",
      "tasks": ["task 1", "task 2", "task 3"],
      "milestone": "what to achieve"
    }
  ],
  "weeklyTargets": ["target 1", "target 2", "target 3", "target 4"],
  "dailyActions": ["action 1", "action 2", "action 3"],
  "successMetrics": ["metric 1", "metric 2", "metric 3"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}
`.trim();

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean markdown code blocks if present
    text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const plan = JSON.parse(text);

    res.json({
      success: true,
      data: {
        ...plan,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Goal tracker error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating goal plan'
    });
  }
});

// ==========================================
// AI Resume Tailoring
// ==========================================
router.post('/tailor-resume', auth, async (req, res) => {
  try {
    const { resume, jobDescription, targetRole } = req.body;

    if (!resume || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Resume and job description are required'
      });
    }

    const prompt = `
You are a professional resume writer. Tailor the resume for the specific job.

TARGET ROLE: ${targetRole || 'Position'}

ORIGINAL RESUME:
${resume}

JOB DESCRIPTION:
${jobDescription}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "tailoredSummary": "2-3 sentence professional summary tailored to the job",
  "keyAdditions": ["relevant skill or experience addition 1", "relevant skill or experience addition 2", "relevant skill or experience addition 3"],
  "relevantExperience": [
    {
      "original": "original experience bullet",
      "tailored": "rewritten to match job keywords and impact"
    }
  ],
  "skillsToHighlight": ["skill 1", "skill 2", "skill 3"],
  "atsKeywords": ["keyword 1 from job description", "keyword 2 from job description", "keyword 3 from job description"],
  "missingKeywords": ["important job requirement not in resume 1", "important job requirement not in resume 2"],
  "tailoredResume": "Complete customized resume text with all sections (summary, experience, skills) rewritten for this specific job. Make it compelling and ATS-friendly. Use strong action verbs and quantify achievements where possible."
}
`.trim();

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean markdown code blocks if present
    text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const tailored = JSON.parse(text);

    res.json({
      success: true,
      data: {
        ...tailored,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Resume tailoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tailoring resume'
    });
  }
});

module.exports = router;
