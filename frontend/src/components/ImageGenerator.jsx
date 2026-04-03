import { useState, useEffect } from 'react';
import { Download, RefreshCw, Loader2, AlertCircle, Image as ImageIcon, Zap } from 'lucide-react';
import apiService from '../services/api';

const CREDIT_COST = 5;

const STYLES = {
  realistic: 'hyper realistic, photographic, 8k, detailed lighting, high resolution',
  anime: 'anime style, vibrant colors, studio Ghibli inspired, detailed',
  cyberpunk: 'cyberpunk, neon lights, futuristic, dark atmosphere, cinematic lighting',
  fantasy: 'fantasy art, magical, ethereal, detailed environment, epic composition',
};

const SIZES = {
  '1024x1024': 'Square',
  '1024x576': 'Landscape',
  '768x1024': 'Portrait',
};

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [size, setSize] = useState('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userCredits, setUserCredits] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  // Fetch user credits on mount
  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const response = await apiService.getAIStatus();
      if (response.success && response.data) {
        setUserCredits(response.data.credits);
      }
    } catch {
      // silently fail — credits will show as unknown
    }
  };

  const canGenerate = () => {
    return userCredits !== null && userCredits >= CREDIT_COST && prompt.trim();
  };

  const enhancePrompt = (userPrompt, styleKey) => {
    const styleEnhancement = STYLES[styleKey] || STYLES.realistic;
    return `${userPrompt.trim()}, ${styleEnhancement}, masterpiece, best quality`;
  };

  const generateImage = async () => {
    if (!canGenerate()) return;

    setIsGenerating(true);
    setHasError(false);
    setErrorMessage('');
    setGeneratedImage(null);
    setImageUrl('');

    try {
      // Step 1: Call backend to deduct credit BEFORE generating
      const deductResponse = await apiService.useImageCredit(CREDIT_COST);

      if (!deductResponse.success) {
        throw new Error(deductResponse.message || 'Failed to use credit');
      }

      // Update remaining credits
      setUserCredits(deductResponse.data.creditsRemaining);

      // Step 2: Enhance prompt and generate via Puter.js
      const enhancedPrompt = enhancePrompt(prompt, style);

      const result = await puter.ai.image(enhancedPrompt);

      if (!result || !result.url) {
        throw new Error('No image URL returned');
      }

      setGeneratedImage({
        url: result.url,
        prompt: prompt.trim(),
        style,
        creditsUsed: CREDIT_COST,
      });
      setImageUrl(result.url);
    } catch (err) {
      setHasError(true);
      setErrorMessage(err.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `jobrobots-ai-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateNew = () => {
    setGeneratedImage(null);
    setImageUrl('');
    setPrompt('');
    setHasError(false);
    setErrorMessage('');
  };

  const retry = () => {
    setHasError(false);
    setErrorMessage('');
    generateImage();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-card p-6">
        {/* Header + Credits */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            AI Image Generator
          </h2>
          {userCredits !== null && (
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              userCredits >= CREDIT_COST
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}>
              {userCredits >= CREDIT_COST
                ? `${userCredits} credits remaining`
                : 'No credits left'}
            </div>
          )}
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Insufficient Credits */}
        {userCredits !== null && userCredits < CREDIT_COST && (
          <div className="mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
            <AlertCircle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-yellow-400 text-sm font-medium">Your free AI credits are exhausted.</p>
            <p className="text-gray-400 text-xs mt-1">Upgrade your plan to generate more images.</p>
          </div>
        )}

        {/* Input Form */}
        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A futuristic city at sunset with flying cars..."
            rows={4}
            disabled={isGenerating}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 outline-none focus:border-primary/50 resize-none transition-colors"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={isGenerating}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-primary/50 transition-colors"
              >
                <option value="realistic">Realistic</option>
                <option value="anime">Anime</option>
                <option value="cyberpunk">Cyberpunk</option>
                <option value="fantasy">Fantasy</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                disabled={isGenerating}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-primary/50 transition-colors"
              >
                {Object.entries(SIZES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={generateImage}
            disabled={isGenerating || !prompt.trim() || userCredits < CREDIT_COST}
            className="gradient-btn w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating image (may take a few seconds)...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate Image ({CREDIT_COST} credits)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Card */}
      {generatedImage && (
        <div className="glass-card p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-sm font-medium">Generated Image</h3>
            <div className="flex gap-2">
              <button
                onClick={downloadImage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
              <button
                onClick={generateNew}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                New
              </button>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center min-h-[300px]">
            {generatedImage.url && (
              <img
                src={generatedImage.url}
                alt={generatedImage.prompt}
                className="w-full object-contain max-h-[512px] mx-auto animate-fade-in"
              />
            )}
          </div>

          <p className="mt-3 text-gray-400 text-xs italic">"{generatedImage.prompt}"</p>
          <p className="mt-1 text-gray-600 text-xs">Style: {generatedImage.style} &bull; {CREDIT_COST} credits used</p>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="glass-card p-6 mt-4">
          <div className="flex flex-col items-center text-center py-6">
            <AlertCircle className="w-10 h-10 text-yellow-500 mb-3" />
            <p className="text-yellow-400 text-sm mb-4">{errorMessage}</p>
            <button
              onClick={retry}
              disabled={isGenerating}
              className="px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-sm font-medium border border-primary/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!generatedImage && !hasError && !isGenerating && (
        <div className="mt-4 p-12 border-2 border-dashed border-white/10 rounded-xl text-center">
          <ImageIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Your generated image will appear here</p>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;