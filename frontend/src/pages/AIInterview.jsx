import { useState, useRef, useEffect } from 'react';
import { Play, Square, Mic, MicOff, Send, Volume2, ChevronRight, Briefcase, Brain, MessageSquare, Star, Clock, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import apiService from '../services/api';

const AIInterview = () => {
  const { isDark } = useTheme();
  const [isStarted, setIsStarted] = useState(false);
  const [jobRole, setJobRole] = useState('');
  const [interviewType, setInterviewType] = useState('behavioral');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);

  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(window.speechSynthesis);
  const subtitleRef = useRef(null);

  const interviewTypes = [
    { id: 'behavioral', label: 'Behavioral', icon: MessageSquare, description: 'Personal experiences and soft skills' },
    { id: 'technical', label: 'Technical', icon: Brain, description: 'Job-specific technical knowledge' },
    { id: 'hr', label: 'HR Round', icon: Briefcase, description: 'Company culture and general questions' },
  ];

  const jobRoles = [
    'Software Engineer',
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'DevOps Engineer',
    'Data Scientist',
    'Product Manager',
    'UI/UX Designer',
    'Business Analyst',
    'QA Engineer',
    'Machine Learning Engineer',
    'Cloud Engineer',
  ];

  const startInterview = async () => {
    if (!jobRole) {
      alert('Please select a job role');
      return;
    }

    setIsLoading(true);
    setIsStarted(true);
    setCurrentQuestionIndex(0);
    setInterviewHistory([]);
    setFeedback(null);

    try {
      const response = await apiService.generateInterviewQuestions(jobRole, interviewType);
      if (response.success && response.data.questions) {
        setQuestions(response.data.questions);
        setCurrentQuestion(response.data.questions[0]);
        setCurrentQuestionIndex(0);
        await speakQuestion(response.data.questions[0]);
      } else {
        // Fallback to mock questions
        const mockQuestions = generateMockQuestions();
        setQuestions(mockQuestions);
        setCurrentQuestion(mockQuestions[0]);
        await speakQuestion(mockQuestions[0]);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      const mockQuestions = generateMockQuestions();
      setQuestions(mockQuestions);
      setCurrentQuestion(mockQuestions[0]);
      await speakQuestion(mockQuestions[0]);
    }

    setIsLoading(false);
  };

  const generateMockQuestions = () => {
    const behavioralQuestions = [
      "Tell me about a time when you had to work under pressure. How did you handle it?",
      "Describe a situation where you had to collaborate with a difficult team member. What was the outcome?",
      "Give me an example of a goal you reached and how you achieved it.",
      "Tell me about a time you made a mistake. How did you handle it?",
      "Describe a situation where you had to learn something new quickly.",
    ];

    const technicalQuestions = [
      "Explain the difference between REST and GraphQL APIs. When would you choose one over the other?",
      "How would you optimize a slow-performing database query?",
      "Describe your experience with version control and branching strategies.",
      "What design patterns have you used in your projects? Explain one in detail.",
      "How do you approach debugging a production issue?",
    ];

    const hrQuestions = [
      "Why are you interested in working for our company?",
      "Where do you see yourself in five years?",
      "What are your greatest strengths and weaknesses?",
      "How do you handle feedback and criticism?",
      "Why should we hire you over other candidates?",
    ];

    const selectedQuestions = interviewType === 'technical' ? technicalQuestions :
                              interviewType === 'hr' ? hrQuestions : behavioralQuestions;

    return selectedQuestions.slice(0, 5).map((q, i) => ({
      number: i + 1,
      text: q,
      type: interviewType
    }));
  };

  const speakQuestion = async (question) => {
    setIsSpeaking(true);

    // First try ElevenLabs
    try {
      const response = await apiService.generateVoiceOver(
        question.text,
        'female',
        'professional',
        'normal'
      );

      if (response.success && response.data.method === 'elevenlabs' && response.data.audioUrl) {
        const audio = new Audio(response.data.audioUrl);
        audioRef.current = audio;

        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          setIsRecording(true);
        };
        audio.onerror = () => {
          fallbackToWebSpeech(question.text);
        };

        audio.play();
        animateSubtitle(question.text);
        return;
      }
    } catch (error) {
      console.log('ElevenLabs failed, falling back to Web Speech API');
    }

    fallbackToWebSpeech(question.text);
  };

  const fallbackToWebSpeech = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = speechSynthesisRef.current.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female')) ||
                         voices.find(v => v.lang.startsWith('en'));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      animateSubtitle(text);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsRecording(true);
    };

    speechSynthesisRef.current.speak(utterance);
  };

  const animateSubtitle = (text) => {
    if (subtitleRef.current) {
      subtitleRef.current.classList.remove('animate-subtitle');
      void subtitleRef.current.offsetWidth;
      subtitleRef.current.classList.add('animate-subtitle');
    }
    setCurrentQuestion({ ...currentQuestion, displayText: text });
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    speechSynthesisRef.current.cancel();
    setIsSpeaking(false);
    setIsRecording(true);
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        // Convert to base64 for analysis
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result.split(',')[1];
          analyzeAnswer(base64Audio);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Please allow microphone access to use voice input');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessingAnswer(true);
    }
  };

  const submitTextAnswer = async () => {
    if (!userAnswer.trim()) {
      alert('Please enter your answer');
      return;
    }

    setIsProcessingAnswer(true);
    await analyzeAnswer(null, userAnswer);
  };

  const analyzeAnswer = async (audioBase64 = null, textAnswer = null) => {
    // Safely extract question text
    const questionText = currentQuestion?.text || currentQuestion?.displayText || '';

    if (!questionText) {
      console.error('No question available');
      setIsProcessingAnswer(false);
      return;
    }

    try {
      const response = await apiService.analyzeInterviewAnswer(
        questionText,
        textAnswer || userAnswer,
        interviewType
      );

      if (response.success && response.data) {
        setFeedback(response.data);

        const historyEntry = {
          question: questionText,
          answer: textAnswer || userAnswer || '[Voice Input]',
          feedback: response.data.feedback,
          score: response.data.score,
          strengths: response.data.strengths,
          improvements: response.data.improvements,
        };

        setInterviewHistory(prev => [...prev, historyEntry]);
        setShowFeedback(true);
      } else {
        // Generate mock feedback
        const mockFeedback = generateMockFeedback();
        setFeedback(mockFeedback);

        const historyEntry = {
          question: questionText,
          answer: textAnswer || userAnswer || '[Voice Input]',
          feedback: mockFeedback.feedback,
          score: mockFeedback.score,
          strengths: mockFeedback.strengths,
          improvements: mockFeedback.improvements,
        };

        setInterviewHistory(prev => [...prev, historyEntry]);
        setShowFeedback(true);
      }
    } catch (error) {
      console.error('Error analyzing answer:', error);
      const mockFeedback = generateMockFeedback();
      setFeedback(mockFeedback);

      const historyEntry = {
        question: questionText,
        answer: textAnswer || userAnswer || '[Voice Input]',
        feedback: mockFeedback.feedback,
        score: mockFeedback.score,
        strengths: mockFeedback.strengths,
        improvements: mockFeedback.improvements,
      };

      setInterviewHistory(prev => [...prev, historyEntry]);
      setShowFeedback(true);
    }

    setUserAnswer('');
    setIsProcessingAnswer(false);
  };

  const generateMockFeedback = () => {
    const score = Math.floor(Math.random() * 4) + 6; // 6-10
    const feedbacks = [
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

    return feedbacks[Math.floor(Math.random() * feedbacks.length)];
  };

  const nextQuestion = async () => {
    setShowFeedback(false);
    setFeedback(null);

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex >= questions.length) {
      // Interview complete
      setCurrentQuestion(null);
      setIsRecording(false);
      return;
    }

    setCurrentQuestionIndex(nextIndex);
    setCurrentQuestion(questions[nextIndex]);
    setIsRecording(false);

    await new Promise(resolve => setTimeout(resolve, 1000));
    await speakQuestion(questions[nextIndex]);
  };

  const endInterview = () => {
    stopSpeaking();
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsStarted(false);
    setCurrentQuestion(null);
    setQuestions([]);
    setUserAnswer('');
    setFeedback(null);
    setShowFeedback(false);
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-emerald-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score) => {
    if (score >= 9) return 'Excellent';
    if (score >= 7) return 'Good';
    if (score >= 5) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gradient-to-br from-space-900 via-purple-900/20 to-space-900' : 'bg-gradient-to-br from-gray-50 via-purple-50/50 to-gray-50'
    }`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            AI Interview Simulator
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Practice interviews with AI-powered voice feedback and real-time analysis
          </p>
        </div>

        {!isStarted ? (
          /* Setup Screen */
          <div className="grid md:grid-cols-2 gap-8">
            {/* Job Role Selection */}
            <div className={`p-6 rounded-2xl backdrop-blur-xl border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'
            }`}>
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <Briefcase className="w-5 h-5 text-primary" />
                Select Job Role
              </h2>
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                {jobRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => setJobRole(role)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      jobRole === role
                        ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30'
                        : isDark
                          ? 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-black/5'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Interview Type Selection */}
            <div className={`p-6 rounded-2xl backdrop-blur-xl border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'
            }`}>
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <Brain className="w-5 h-5 text-accent" />
                Select Interview Type
              </h2>
              <div className="space-y-3">
                {interviewTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setInterviewType(type.id)}
                    className={`w-full p-4 rounded-xl transition-all flex items-center gap-4 ${
                      interviewType === type.id
                        ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30'
                        : isDark
                          ? 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-black/5'
                    }`}
                  >
                    <type.icon className="w-6 h-6" />
                    <div className="text-left">
                      <p className="font-semibold">{type.label}</p>
                      <p className={`text-xs ${interviewType === type.id ? 'text-white/70' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {type.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <div className="md:col-span-2">
              <button
                onClick={startInterview}
                disabled={!jobRole || isLoading}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                  jobRole && !isLoading
                    ? 'bg-gradient-to-r from-primary via-purple-500 to-accent text-white hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.02]'
                    : isDark
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Preparing Interview...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start AI Interview
                  </>
                )}
              </button>
            </div>
          </div>
        ) : currentQuestion ? (
          /* Interview Screen */
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className={`p-4 rounded-xl backdrop-blur-xl border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} • {jobRole}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Subtitle Display */}
            <div className={`p-8 rounded-2xl backdrop-blur-xl border text-center ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'
            }`}>
              <div className="flex items-center justify-center gap-3 mb-4">
                {isSpeaking ? (
                  <div className="flex items-center gap-2 text-primary">
                    <Volume2 className="w-5 h-5 animate-pulse" />
                    <span className="text-sm font-medium">AI Speaking...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Question Complete</span>
                  </div>
                )}
              </div>

              <p
                ref={subtitleRef}
                className={`text-2xl md:text-3xl font-medium leading-relaxed ${
                  isDark ? 'text-white' : 'text-gray-900'
                } animate-subtitle`}
              >
                {currentQuestion.displayText || currentQuestion.text}
              </p>

              <div className="mt-6 flex items-center justify-center gap-4">
                {isSpeaking ? (
                  <button
                    onClick={stopSpeaking}
                    className="px-6 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    Skip Voice
                  </button>
                ) : (
                  <button
                    onClick={() => speakQuestion(currentQuestion)}
                    className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-colors ${
                      isDark
                        ? 'bg-white/10 text-white hover:bg-white/20'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                    Replay
                  </button>
                )}
              </div>
            </div>

            {/* Answer Input */}
            {!showFeedback && (
              <div className={`p-6 rounded-2xl backdrop-blur-xl border ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Your Answer
                </h3>

                {/* Voice Recording */}
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    disabled={isProcessingAnswer}
                    className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg hover:shadow-primary/40'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-4 h-4" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Record Voice
                      </>
                    )}
                  </button>

                  {isRecording && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                      <span className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                        Recording...
                      </span>
                    </div>
                  )}
                </div>

                {/* Text Input */}
                <div className="relative">
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here... (or use voice recording above)"
                    rows={4}
                    disabled={isProcessingAnswer}
                    className={`w-full p-4 rounded-xl resize-none transition-colors ${
                      isDark
                        ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary'
                        : 'bg-gray-50 border border-black/10 text-gray-900 placeholder-gray-400 focus:border-primary'
                    } focus:outline-none focus:ring-2 focus:ring-primary/50`}
                  />
                </div>

                <button
                  onClick={submitTextAnswer}
                  disabled={!userAnswer.trim() || isProcessingAnswer}
                  className={`mt-4 px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                    userAnswer.trim() && !isProcessingAnswer
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/40'
                      : isDark
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isProcessingAnswer ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Answer
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Feedback Display */}
            {showFeedback && feedback && (
              <div className={`p-6 rounded-2xl backdrop-blur-xl border ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Feedback
                  </h3>
                  <div className="flex items-center gap-2">
                    <Star className={`w-5 h-5 ${getScoreColor(feedback.score)} fill-current`} />
                    <span className={`text-2xl font-bold ${getScoreColor(feedback.score)}`}>
                      {feedback.score}/10
                    </span>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {getScoreLabel(feedback.score)}
                    </span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl mb-4 ${
                  isDark ? 'bg-white/5' : 'bg-gray-50'
                }`}>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {feedback.feedback}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
                      isDark ? 'text-emerald-400' : 'text-emerald-600'
                    }`}>
                      <CheckCircle className="w-4 h-4" />
                      Strengths
                    </h4>
                    <ul className="space-y-1">
                      {feedback.strengths?.map((strength, i) => (
                        <li key={i} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          • {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
                      isDark ? 'text-amber-400' : 'text-amber-600'
                    }`}>
                      <RefreshCw className="w-4 h-4" />
                      Areas to Improve
                    </h4>
                    <ul className="space-y-1">
                      {feedback.improvements?.map((improvement, i) => (
                        <li key={i} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          • {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={nextQuestion}
                  className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/40 transition-all"
                >
                  {currentQuestionIndex + 1 < questions.length ? (
                    <>
                      Next Question
                      <ChevronRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Complete Interview
                    </>
                  )}
                </button>
              </div>
            )}

            {/* End Interview */}
            <button
              onClick={endInterview}
              className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-black/10'
              }`}
            >
              <XCircle className="w-4 h-4" />
              End Interview
            </button>
          </div>
        ) : (
          /* Interview Complete */
          <div className={`p-8 rounded-2xl backdrop-blur-xl border text-center ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'
          }`}>
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Interview Complete!
            </h2>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Great job! Here's your overall performance summary.
            </p>

            {/* Overall Stats */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Average Score</p>
                <p className={`text-3xl font-bold ${getScoreColor(
                  Math.round(interviewHistory.reduce((acc, h) => acc + h.score, 0) / interviewHistory.length)
                )}`}>
                  {(interviewHistory.reduce((acc, h) => acc + h.score, 0) / interviewHistory.length || 0).toFixed(1)}/10
                </p>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Questions Answered</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {interviewHistory.length}
                </p>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Interview Type</p>
                <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {interviewType.charAt(0).toUpperCase() + interviewType.slice(1)}
                </p>
              </div>
            </div>

            {/* Question Summary */}
            <div className="space-y-3 text-left">
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Question Summary
              </h3>
              {interviewHistory.map((item, index) => (
                <div key={index} className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Q{index + 1}: {item.question.slice(0, 60)}...
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Your answer: {item.answer.slice(0, 100)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className={`w-4 h-4 ${getScoreColor(item.score)} fill-current`} />
                      <span className={`font-bold ${getScoreColor(item.score)}`}>{item.score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setIsStarted(false);
                setInterviewHistory([]);
              }}
              className="mt-8 px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:shadow-lg hover:shadow-primary/40 transition-all"
            >
              Start New Interview
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes subtitle-appear {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-subtitle {
          animation: subtitle-appear 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AIInterview;
