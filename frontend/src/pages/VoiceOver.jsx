import { useState, useRef, useEffect } from 'react';
import { Mic, Play, Pause, Download, RefreshCw, Bookmark, Loader2, Volume2, User, MessageSquare, Music } from 'lucide-react';
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
  const [isUsingElevenLabs, setIsUsingElevenLabs] = useState(false);
  const [voiceConfig, setVoiceConfig] = useState(null);
  const [savedVoiceOvers, setSavedVoiceOvers] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [voices, setVoices] = useState([]);
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    // Load saved voice overs
    const saved = JSON.parse(localStorage.getItem('savedVoiceOvers') || '[]');
    setSavedVoiceOvers(saved);

    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  const generateVoiceOver = async () => {
    if (!text.trim()) return;

    setIsGenerating(true);
    setIsPlaying(false);
    setAudioUrl(null);
    speechSynthesis.cancel();

    try {
      const response = await apiService.generateVoiceOver(text, voiceType, tone, speed);
      if (response.success) {
        setVoiceConfig(response.data.config);

        if (response.data.method === 'elevenlabs' && response.data.audioUrl) {
          // ElevenLabs - use the generated audio
          setAudioUrl(response.data.audioUrl);
          setIsUsingElevenLabs(true);
        } else {
          // Web Speech API fallback
          setIsUsingElevenLabs(false);
        }
      }
    } catch (error) {
      console.error('Error generating voice over:', error);
      // Fallback to local generation
      setVoiceConfig({
        text: text,
        voiceType: voiceType,
        tone: tone,
        speed: speed,
        rate: speed === 'slow' ? 0.7 : speed === 'fast' ? 1.3 : 1.0,
        characterCount: text.length,
        estimatedDuration: Math.ceil(text.split(' ').length / 2.5)
      });
      setIsUsingElevenLabs(false);
    }

    setIsGenerating(false);
  };

  const playVoiceOver = () => {
    if (!voiceConfig) return;

    if (isUsingElevenLabs && audioUrl) {
      // Play ElevenLabs audio
      if (isPlaying) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
        return;
      }

      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => setIsPlaying(false);
      }

      audioRef.current.play();
      setIsPlaying(true);
    } else {
      // Play Web Speech API audio
      if (isPlaying) {
        speechSynthesis.cancel();
        setIsPlaying(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(voiceConfig.text);
      utteranceRef.current = utterance;

      let selectedVoice = voices.find(v => v.lang.startsWith('en'));
      if (!selectedVoice) selectedVoice = voices[0];

      if (voiceType === 'female') {
        const femaleVoice = voices.find(v =>
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('eva')
        );
        if (femaleVoice) selectedVoice = femaleVoice;
      } else {
        const maleVoice = voices.find(v =>
          v.name.toLowerCase().includes('male') ||
          v.name.toLowerCase().includes('david') ||
          v.name.toLowerCase().includes('mark')
        );
        if (maleVoice) selectedVoice = maleVoice;
      }

      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.rate = voiceConfig.rate || 1.0;
      utterance.pitch = tone === 'confident' ? 1.1 : tone === 'calm' ? 0.9 : 1.0;
      utterance.volume = 1;

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      speechSynthesis.speak(utterance);
    }
  };

  const stopVoiceOver = () => {
    if (isUsingElevenLabs && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } else {
      speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const downloadAudio = () => {
    if (!voiceConfig) return;

    if (isUsingElevenLabs && audioUrl) {
      // Download actual audio file as blob
      fetch(audioUrl)
        .then(res => res.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `voiceover-${Date.now()}.mp3`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        })
        .catch(() => {
          // Fallback: download script as text
          downloadScript();
        });
    } else {
      // No ElevenLabs audio — download script as text
      downloadScript();
    }
  };

  const downloadScript = () => {
    const element = document.createElement('a');
    const fileContent = `Voice Over Script
=================

Voice Type: ${voiceType}
Tone: ${tone}
Speed: ${speed}
Character Count: ${voiceConfig?.characterCount || text.length}

---

${text}`.trim();

    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileContent));
    element.setAttribute('download', `voiceover-script-${Date.now()}.txt`);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const saveVoiceOver = () => {
    if (!voiceConfig) return;

    const savedItem = {
      ...voiceConfig,
      id: `voice_${Date.now()}`,
      savedAt: new Date().toISOString()
    };

    setSavedVoiceOvers(prev => {
      const updated = [savedItem, ...prev];
      localStorage.setItem('savedVoiceOvers', JSON.stringify(updated));
      return updated;
    });
  };

  const loadSaved = (saved) => {
    setVoiceConfig(saved);
    setText(saved.text);
    setVoiceType(saved.voiceType);
    setTone(saved.tone);
    setSpeed(saved.speed);
    setAudioUrl(null);
    setIsUsingElevenLabs(false);
    setShowSaved(false);
  };

  const deleteSaved = (id) => {
    setSavedVoiceOvers(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('savedVoiceOvers', JSON.stringify(updated));
      return updated;
    });
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

        {/* Saved Voice Overs Toggle */}
        {savedVoiceOvers.length > 0 && (
          <button
            onClick={() => setShowSaved(!showSaved)}
            className={`mb-6 flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isDark
                ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300'
                : 'bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved Scripts ({savedVoiceOvers.length})</span>
          </button>
        )}

        {/* Saved Voice Overs Panel */}
        {showSaved && savedVoiceOvers.length > 0 && (
          <div className={`mb-8 p-6 rounded-2xl ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
            <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Saved Voice Over Scripts</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {savedVoiceOvers.map((item) => (
                <div key={item.id} className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm mb-2 line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.text}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span className="capitalize">{item.voiceType}</span>
                        <span>•</span>
                        <span className="capitalize">{item.tone}</span>
                        <span>•</span>
                        <span className="capitalize">{item.speed}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button onClick={() => loadSaved(item)} className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30">
                        <Play className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteSaved(item.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Section */}
        <div className={`p-6 rounded-2xl mb-6 ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
          {/* Text Input */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Enter your script or text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Welcome to our company. We are excited to share with you our latest products and services..."
              rows={6}
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
                  className={`p-4 rounded-xl text-center transition-all ${
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
                  className={`p-3 rounded-xl text-center transition-all ${
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
                  className={`flex-1 py-3 rounded-xl text-center transition-all ${
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

        {/* Generated Voice Over */}
        {voiceConfig && (
          <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Generated Voice Over
              </h3>
              {isUsingElevenLabs && (
                <span className="flex items-center space-x-1 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                  <Music className="w-3 h-3" />
                  <span>HD Audio</span>
                </span>
              )}
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

            {/* Script Preview */}
            <div className={`p-4 rounded-xl mb-6 max-h-40 overflow-y-auto ${isDark ? 'bg-space-900/50' : 'bg-gray-50'}`}>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {voiceConfig.text}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={playVoiceOver}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  isPlaying
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'gradient-btn hover:scale-105'
                }`}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 text-white" />
                ) : (
                  <Play className="w-7 h-7 text-white ml-1" />
                )}
              </button>

              <button
                onClick={stopVoiceOver}
                disabled={!isPlaying}
                className={`p-4 rounded-xl transition-all ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-gray-400'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                } ${!isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Volume2 className="w-5 h-5" />
              </button>

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

              <button
                onClick={saveVoiceOver}
                className={`p-4 rounded-xl transition-all ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-gray-400'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                <Bookmark className="w-5 h-5" />
              </button>

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

            {isUsingElevenLabs && (
              <p className={`text-center text-xs mt-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Audio downloaded as MP3 • Powered by ElevenLabs
              </p>
            )}
          </div>
        )}

        {/* Empty State */}
        {!voiceConfig && !isGenerating && (
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
