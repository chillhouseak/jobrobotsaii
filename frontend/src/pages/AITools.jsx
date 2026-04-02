import { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw, MessageSquare, Mail, FileText, Zap, Download, Loader2, Image } from 'lucide-react';
import Layout from '../components/Layout';
import apiService from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://jobrobotsaii.vercel.app/api';

// Proxy image through our backend to avoid browser CORS block on Pollinations CDN
const proxyImageUrl = (url) =>
  `${API_BASE_URL}/ai/proxy-image?url=${encodeURIComponent(url)}`;

const AITools = () => {
  const [activeTab, setActiveTab] = useState('answer');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [answerForm, setAnswerForm] = useState({
    question: '', role: '', tone: 'professional', length: 'medium'
  });
  const [answerOutput, setAnswerOutput] = useState('');

  const [outreachForm, setOutreachForm] = useState({
    recipientName: '', recipientRole: '', company: '', yourBackground: '', targetRole: '', keyPoints: ''
  });
  const [outreachOutput, setOutreachOutput] = useState('');
  const [outreachType, setOutreachType] = useState('linkedin');

  const [coverForm, setCoverForm] = useState({
    company: '', role: '', jobDescription: '', experience: ''
  });
  const [coverOutput, setCoverOutput] = useState('');

  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState('none');
  const [imageSize, setImageSize] = useState('1024x1024');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageFetching, setImageFetching] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  const handleCopy = () => {
    const text = answerOutput || outreachOutput || coverOutput;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateAnswer = async () => {
    if (!answerForm.question) return;
    setIsGenerating(true);

    try {
      const response = await apiService.generateAnswer(
        answerForm.question,
        answerForm.role,
        answerForm.tone,
        answerForm.length
      );
      if (response.success) {
        setAnswerOutput(response.data.answer);
      }
    } catch (error) {
      console.error('Error generating answer:', error);
    }
    setIsGenerating(false);
  };

  const generateOutreach = async () => {
    if (!outreachForm.recipientName) return;
    setIsGenerating(true);

    try {
      const response = await apiService.generateOutreach(
        outreachType,
        outreachForm.recipientName,
        outreachForm.recipientRole,
        outreachForm.company,
        outreachForm.yourBackground,
        outreachForm.targetRole
      );
      if (response.success) {
        setOutreachOutput(response.data.message);
      }
    } catch (error) {
      console.error('Error generating outreach:', error);
    }
    setIsGenerating(false);
  };

  const generateCover = async () => {
    if (!coverForm.company || !coverForm.role) return;
    setIsGenerating(true);

    try {
      const response = await apiService.generateCoverLetter(
        coverForm.company,
        coverForm.role,
        coverForm.jobDescription,
        coverForm.experience
      );
      if (response.success) {
        setCoverOutput(response.data.coverLetter);
      }
    } catch (error) {
      console.error('Error generating cover letter:', error);
    }
    setIsGenerating(false);
  };

  const generateImage = async () => {
    if (!imagePrompt.trim()) return;
    setImageLoading(true);
    setImageError('');
    setImageFetching(false);
    setImageLoadError(false);

    try {
      const [width, height] = imageSize.split('x').map(Number);
      const response = await apiService.generateImage(
        imagePrompt.trim(),
        width,
        height,
        null,
        imageStyle
      );

      if (response.success && response.data?.imageUrl) {
        setGeneratedImage({
          url: response.data.imageUrl,
          prompt: response.data.prompt,
          seed: response.data.seed,
        });
        setImageFetching(true);
      } else {
        setImageError('Unexpected response: ' + JSON.stringify(response));
      }
    } catch (error) {
      setImageError(error.message || 'Failed to generate image');
    } finally {
      setImageLoading(false);
    }
  };

  const downloadImage = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `jobrobots-ai-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const resetImage = () => {
    setGeneratedImage(null);
    setImagePrompt('');
    setImageError('');
    setImageFetching(false);
    setImageLoadError(false);
  };

  const tabs = [
    { id: 'answer', label: 'Answer Generator', icon: MessageSquare },
    { id: 'outreach', label: 'Cold Outreach', icon: Mail },
    { id: 'cover', label: 'Cover Letter', icon: FileText },
    { id: 'image', label: 'Image Generator', icon: Image },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-primary-light" />
            <span>AI Tools</span>
          </h1>
          <p className="text-gray-400">Powerful AI tools to supercharge your job search</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-white border border-primary/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Answer Generator */}
        {activeTab === 'answer' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Generate Your Answer</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Interview Question</label>
                  <textarea
                    value={answerForm.question}
                    onChange={(e) => setAnswerForm({...answerForm, question: e.target.value})}
                    placeholder="Tell me about yourself..."
                    rows={4}
                    className="input-field w-full px-4 py-3 rounded-xl text-white text-sm resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Role / Position</label>
                    <input
                      type="text"
                      value={answerForm.role}
                      onChange={(e) => setAnswerForm({...answerForm, role: e.target.value})}
                      placeholder="Software Engineer"
                      className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Tone</label>
                    <select
                      value={answerForm.tone}
                      onChange={(e) => setAnswerForm({...answerForm, tone: e.target.value})}
                      className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="confident">Confident</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Length</label>
                  <div className="flex space-x-2">
                    {['short', 'medium', 'long'].map((len) => (
                      <button
                        key={len}
                        onClick={() => setAnswerForm({...answerForm, length: len})}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                          answerForm.length === len
                            ? 'bg-primary/20 text-white border border-primary/50'
                            : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
                        }`}
                      >
                        {len}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={generateAnswer}
                  disabled={isGenerating || !answerForm.question}
                  className="gradient-btn w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Generate Answer</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Generated Answer</h2>
                {answerOutput && (
                  <div className="flex space-x-2">
                    <button onClick={handleCopy} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={generateAnswer} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-space-900/50 rounded-xl p-4 min-h-[300px]">
                {answerOutput ? (
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{answerOutput}</p>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Your generated answer will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cold Outreach */}
        {activeTab === 'outreach' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Generate Outreach Message</h2>

              <div className="flex space-x-2 mb-4 overflow-x-auto">
                {['linkedin', 'email', 'referral', 'followup'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setOutreachType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      outreachType === type
                        ? 'bg-primary/20 text-white border border-primary/50'
                        : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
                    }`}
                  >
                    {type === 'followup' ? 'Follow-up' : type}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Recipient Name</label>
                    <input
                      type="text"
                      value={outreachForm.recipientName}
                      onChange={(e) => setOutreachForm({...outreachForm, recipientName: e.target.value})}
                      placeholder="John Doe"
                      className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Their Role</label>
                    <input
                      type="text"
                      value={outreachForm.recipientRole}
                      onChange={(e) => setOutreachForm({...outreachForm, recipientRole: e.target.value})}
                      placeholder="Hiring Manager"
                      className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Company</label>
                    <input
                      type="text"
                      value={outreachForm.company}
                      onChange={(e) => setOutreachForm({...outreachForm, company: e.target.value})}
                      placeholder="Acme Inc"
                      className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Your Target Role</label>
                    <input
                      type="text"
                      value={outreachForm.targetRole}
                      onChange={(e) => setOutreachForm({...outreachForm, targetRole: e.target.value})}
                      placeholder="Software Engineer"
                      className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Your Background</label>
                  <input
                    type="text"
                    value={outreachForm.yourBackground}
                    onChange={(e) => setOutreachForm({...outreachForm, yourBackground: e.target.value})}
                    placeholder="Full stack development, React, Node.js"
                    className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                  />
                </div>
                <button
                  onClick={generateOutreach}
                  disabled={isGenerating}
                  className="gradient-btn w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Generate {outreachType === 'followup' ? 'Follow-up' : outreachType}</span>
                </button>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Generated Message</h2>
                {outreachOutput && (
                  <button onClick={handleCopy} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <div className="bg-space-900/50 rounded-xl p-4 min-h-[350px]">
                {outreachOutput ? (
                  <pre className="text-gray-300 leading-relaxed whitespace-pre-wrap font-sans text-sm">{outreachOutput}</pre>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Mail className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Your generated message will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Image Generator */}
        {activeTab === 'image' && (
          <div className="max-w-3xl mx-auto">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Image className="w-5 h-5 text-primary-light" />
                <span>AI Image Generator</span>
              </h2>

              {imageError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-red-400 text-sm">{imageError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Describe your image</label>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="A futuristic city at sunset with flying cars..."
                    rows={4}
                    className="input-field w-full px-4 py-3 rounded-xl text-white text-sm resize-none"
                    disabled={imageLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Style</label>
                    <div className="relative">
                      <select
                        value={imageStyle}
                        onChange={(e) => setImageStyle(e.target.value)}
                        disabled={imageLoading}
                        className="w-full px-4 py-3 rounded-xl text-white text-sm appearance-none cursor-pointer pr-10"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        <option value="none" style={{ background: '#1a1a2e' }}>No Style</option>
                        <option value="flux" style={{ background: '#1a1a2e' }}>Flux — Default</option>
                        <option value="flux-realism" style={{ background: '#1a1a2e' }}>Flux — Realism</option>
                        <option value="flux-anime" style={{ background: '#1a1a2e' }}>Flux — Anime</option>
                        <option value="flux-canny" style={{ background: '#1a1a2e' }}>Flux — Canny</option>
                        <option value="any-dark" style={{ background: '#1a1a2e' }}>Any — Dark</option>
                        <option value="any-diffuse" style={{ background: '#1a1a2e' }}>Any — Diffuse</option>
                        <option value="turbo" style={{ background: '#1a1a2e' }}>Turbo — Default</option>
                        <option value="turbo-realism" style={{ background: '#1a1a2e' }}>Turbo — Realism</option>
                        <option value="turbo-anime" style={{ background: '#1a1a2e' }}>Turbo — Anime</option>
                        <option value="sdxl" style={{ background: '#1a1a2e' }}>SDXL</option>
                        <option value="playground-v2" style={{ background: '#1a1a2e' }}>Playground V2</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Size</label>
                    <div className="relative">
                      <select
                        value={imageSize}
                        onChange={(e) => setImageSize(e.target.value)}
                        disabled={imageLoading}
                        className="w-full px-4 py-3 rounded-xl text-white text-sm appearance-none cursor-pointer pr-10"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        <option value="1024x1024" style={{ background: '#1a1a2e' }}>Square (1024×1024)</option>
                        <option value="1024x576" style={{ background: '#1a1a2e' }}>Landscape (1024×576)</option>
                        <option value="768x1024" style={{ background: '#1a1a2e' }}>Portrait (768×1024)</option>
                        <option value="512x512" style={{ background: '#1a1a2e' }}>Small (512×512)</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={generateImage}
                  disabled={imageLoading || !imagePrompt.trim()}
                  className="gradient-btn w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {imageLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Image</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Generated Image */}
            {generatedImage && (
              <div className="glass-card p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium text-sm">Generated Image</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => downloadImage(generatedImage.url)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={resetImage}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>New</span>
                    </button>
                  </div>
                </div>
                <div className="relative rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center min-h-[300px]">
                  {/* Fetching from Pollinations CDN */}
                  {imageFetching && !imageLoadError && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                      <p className="text-gray-400 text-sm">Fetching image...</p>
                    </div>
                  )}

                  {/* Image loaded successfully */}
                  {!imageFetching && !imageLoadError && generatedImage && (
                    <img
                      src={proxyImageUrl(generatedImage.url)}
                      alt={generatedImage.prompt}
                      onLoad={() => setImageLoadError(false)}
                      onError={() => setImageLoadError(true)}
                      className="w-full object-contain max-h-[512px] mx-auto"
                    />
                  )}

                  {/* Image failed to load */}
                  {imageLoadError && (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <Image className="w-12 h-12 text-gray-600 mb-3" />
                      <p className="text-gray-400 text-sm mb-2">Image failed to load</p>
                      <p className="text-gray-500 text-xs mb-3 break-all max-w-full px-2">
                        {generatedImage?.url?.substring(0, 80)}...
                      </p>
                      <button
                        onClick={() => { setImageLoadError(false); setImageFetching(false); setImageLoading(true); generateImage(); }}
                        className="text-primary text-sm hover:underline"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-gray-400 text-xs italic">"{generatedImage.prompt}"</p>
                <p className="mt-1 text-gray-500 text-xs">Seed: {generatedImage.seed}</p>
              </div>
            )}

            {!generatedImage && !imageLoading && (
              <div className="mt-6 p-8 border-2 border-dashed border-white/10 rounded-xl text-center">
                <Image className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Your generated image will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* Cover Letter */}
        {activeTab === 'cover' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Generate Cover Letter</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Company *</label>
                    <input
                      type="text"
                      value={coverForm.company}
                      onChange={(e) => setCoverForm({...coverForm, company: e.target.value})}
                      placeholder="Google"
                      className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Job Title *</label>
                    <input
                      type="text"
                      value={coverForm.role}
                      onChange={(e) => setCoverForm({...coverForm, role: e.target.value})}
                      placeholder="Software Engineer"
                      className="input-field w-full px-4 py-2.5 rounded-xl text-white text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Job Description</label>
                  <textarea
                    value={coverForm.jobDescription}
                    onChange={(e) => setCoverForm({...coverForm, jobDescription: e.target.value})}
                    placeholder="Paste the job description here..."
                    rows={5}
                    className="input-field w-full px-4 py-3 rounded-xl text-white text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Your Experience</label>
                  <textarea
                    value={coverForm.experience}
                    onChange={(e) => setCoverForm({...coverForm, experience: e.target.value})}
                    placeholder="Briefly describe your relevant experience..."
                    rows={4}
                    className="input-field w-full px-4 py-3 rounded-xl text-white text-sm resize-none"
                  />
                </div>
                <button
                  onClick={generateCover}
                  disabled={isGenerating || !coverForm.company || !coverForm.role}
                  className="gradient-btn w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" />
                  <span>Generate Cover Letter</span>
                </button>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Generated Cover Letter</h2>
                {coverOutput && (
                  <div className="flex space-x-2">
                    <button onClick={handleCopy} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-space-900/50 rounded-xl p-4 min-h-[400px] overflow-y-auto">
                {coverOutput ? (
                  <pre className="text-gray-300 leading-relaxed whitespace-pre-wrap font-sans text-sm">{coverOutput}</pre>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Your cover letter will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AITools;
