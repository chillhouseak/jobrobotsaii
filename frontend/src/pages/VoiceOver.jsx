import { useState, useRef } from 'react';
import { Mic, Play, Pause, Download, RefreshCw, Loader2, Volume2, User, MessageSquare, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import apiService from '../services/api';
import { useTheme } from '../context/ThemeContext';

const VoiceOver = () => {
  const { isDark } = useTheme();
  const [text, setText] = useState('');
  const [voiceType, setVoiceType] = useState('male');
  const [tone, setTone] = useState('professional');
  const [speed, setSpeed] = useState('normal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState('');
  const audioRef = useRef(null);

  const inputsDisabled = isGenerating;

  const generateVoiceOver = async () => {
    if (!text.trim()) {
      setError('Please enter text to generate voice over.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setAudioUrl(null);
    setIsPlaying(false);
    if (audioRef.current) audioRef.current.pause();

    try {
      const response = await apiService.generateVoiceOver(text, voiceType, tone, speed);

      if (response.success && response.audioUrl) {
        setAudioUrl(response.audioUrl);
      } else {
        setError(response.message || 'Failed to generate audio. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate voice over. Please try again.');
    }

    setIsGenerating(false);
  };

  const playVoiceOver = () => {
    if (!audioUrl) return;

    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        setIsPlaying(false);
        setError('Audio playback failed. Please try generating again.');
      };
    }

    audioRef.current.play();
    setIsPlaying(true);
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `voiceover-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const voiceTypes = [
    { id: 'male', label: 'Male', icon: '👨' },
    { id: 'female', label: 'Female', icon: '👩' },
  ];

  const tones = [
    { id: 'professional', label: 'Professional' },
    { id: 'friendly', label: 'Friendly' },
    { id: 'confident', label: 'Confident' },
    { id: 'calm', label: 'Calm' },
  ];

  const speeds = [
    { id: 'slow', label: 'Slow' },
    { id: 'normal', label: 'Normal' },
    { id: 'fast', label: 'Fast' },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
            <Mic className="w-6 h-6 text-primary-light" />
            <span>AI Voice Over Generator</span>
          </h1>
          <p className="text-gray-400">Convert text into professional voice audio with ElevenLabs AI</p>
        </div>

        {/* Input Section */}
        <div className={`p-6 rounded-2xl mb-6 ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
          {/* Text Input */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Enter your script or text
            </label>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setError(''); }}
              placeholder="Welcome to our company. We are excited to share with you our latest products and services..."
              rows={6}
              disabled={inputsDisabled}
              className={`w-full px-4 py-3 rounded-xl text-sm resize-none transition-all ${
                isDark
                  ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                  : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
            <div className={`flex justify-between mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <span>{text.length} characters</span>
              <span>{text.split(' ').filter(w => w).length} words</span>
              <span>~{Math.ceil(text.split(' ').filter(w => w).length / 2.5)} sec</span>
            </div>
          </div>

          {/* Voice Type */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <User className="w-4 h-4 inline mr-2" />
              Voice Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {voiceTypes.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVoiceType(v.id)}
                  disabled={inputsDisabled}
                  className={`p-4 rounded-xl text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    voiceType === v.id
                      ? isDark
                        ? 'bg-primary/20 border-2 border-primary text-white'
                        : 'bg-primary/10 border-2 border-primary text-gray-900'
                      : isDark
                        ? 'bg-white/5 border border-white/10 text-gray-300 hover:border-white/20'
                        : 'bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl mb-1 block">{v.icon}</span>
                  <span className="text-sm font-medium">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Tone
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {tones.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  disabled={inputsDisabled}
                  className={`p-3 rounded-xl text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    tone === t.id
                      ? isDark
                        ? 'bg-primary/20 border border-primary text-white'
                        : 'bg-primary/10 border border-primary text-gray-900'
                      : isDark
                        ? 'bg-white/5 border border-white/10 text-gray-300 hover:border-white/20'
                        : 'bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Speed */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <Volume2 className="w-4 h-4 inline mr-2" />
              Speed
            </label>
            <div className="flex space-x-3">
              {speeds.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSpeed(s.id)}
                  disabled={inputsDisabled}
                  className={`flex-1 py-3 rounded-xl text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    speed === s.id
                      ? isDark
                        ? 'bg-primary/20 border border-primary text-white'
                        : 'bg-primary/10 border border-primary text-gray-900'
                      : isDark
                        ? 'bg-white/5 border border-white/10 text-gray-300 hover:border-white/20'
                        : 'bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-sm font-medium">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className={`mb-4 p-3 rounded-xl text-sm flex items-center space-x-2 ${
              isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateVoiceOver}
            disabled={isGenerating || !text.trim()}
            className="gradient-btn w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Audio...</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>Generate Voice Over</span>
              </>
            )}
          </button>
        </div>

        {/* Generated Audio */}
        {audioUrl && (
          <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Generated Voice Over
              </h3>
              <span className="flex items-center space-x-1 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                <Volume2 className="w-3 h-3" />
                <span>HD Audio</span>
              </span>
            </div>

            {/* Info */}
            <div className={`grid grid-cols-3 gap-4 mb-6 p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
              <div className="text-center">
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {voiceType === 'male' ? '👨' : '👩'}
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Voice</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{tone}</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tone</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{speed}</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Speed</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4">
              {/* Play / Pause */}
              <button
                onClick={playVoiceOver}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  isPlaying ? 'bg-red-500 hover:bg-red-600' : 'gradient-btn hover:scale-105'
                }`}
              >
                {isPlaying
                  ? <Pause className="w-7 h-7 text-white" />
                  : <Play className="w-7 h-7 text-white ml-1" />
                }
              </button>

              {/* Re-generate */}
              <button
                onClick={generateVoiceOver}
                disabled={isGenerating}
                className={`p-4 rounded-xl transition-all ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-gray-400'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
              </button>

              {/* Download MP3 — disabled until audio ready */}
              <button
                onClick={downloadAudio}
                className={`p-4 rounded-xl transition-all ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-gray-400'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                <Download className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-center text-xs mt-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Powered by ElevenLabs • Download as MP3
            </p>
          </div>
        )}

        {/* Empty State */}
        {!audioUrl && !isGenerating && (
          <div className={`text-center py-16 rounded-2xl ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
              <Mic className="w-10 h-10 text-primary-light" />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Create Professional Voice Over
            </h3>
            <p className={`max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Enter your text above, select your preferences, and generate professional voice audio with ElevenLabs AI
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VoiceOver;
