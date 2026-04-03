import { useState, useRef } from 'react';
import {
  Sparkles, Download, RefreshCw, Loader2, AlertCircle,
  Image as ImageIcon, Zap
} from 'lucide-react';
import apiService from '../services/api';

const IMAGE_TIMEOUT = 30000; // 30s — ONLY legitimate error trigger

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('none');
  const [size, setSize] = useState('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const timeoutTimer = useRef(null);

  // Inputs disabled while generating OR while image is still loading
  const inputsDisabled = isGenerating || (!!generatedImage && !imageLoaded);

  const buildImageUrl = (seed) => {
    const encoded = encodeURIComponent(prompt.trim());
    const [w, h] = size.split('x').map(Number);
    const styleParam = style && style !== 'none' ? `&model=${style}` : '';
    // t= forces fresh image every time — critical for Pollinations
    return `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&seed=${seed}${styleParam}&nologo=true&t=${Date.now()}`;
  };

  const clearSafetyTimeout = () => {
    if (timeoutTimer.current) {
      window.clearTimeout(timeoutTimer.current);
      timeoutTimer.current = null;
    }
  };

  const startSafetyTimeout = () => {
    clearSafetyTimeout();
    timeoutTimer.current = window.setTimeout(() => {
      if (!imageLoaded) {
        setImageError(true);
        setErrorMessage('Image is taking too long. Please try again.');
      }
    }, IMAGE_TIMEOUT);
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;

    clearSafetyTimeout();
    setErrorMessage('');
    setImageError(false);
    setImageLoaded(false);
    setGeneratedImage(null);
    setIsGenerating(true);

    try {
      const [width, height] = size.split('x').map(Number);

      const response = await apiService.request('/ai/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt: prompt.trim(), width, height, style }),
      });

      if (!response.success || !response.data?.seed) {
        throw new Error(response.message || 'Failed to generate image');
      }

      const { seed } = response.data;
      const imageUrl = buildImageUrl(seed);

      setGeneratedImage({ url: imageUrl, seed, prompt: prompt.trim() });
      setIsGenerating(false);

      // Start 30s safety timeout — only way an error is shown
      startSafetyTimeout();
    } catch (err) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
      setIsGenerating(false);
    }
  };

  // onLoad is the ONLY signal that the image is ready
  // Do NOT use onError — Pollinations may return HTML placeholder during generation
  const handleImageLoad = () => {
    clearSafetyTimeout();
    setImageLoaded(true);
    setImageError(false);
  };

  const retryImage = () => {
    if (!generatedImage) return;

    clearSafetyTimeout();
    setImageError(false);
    setImageLoaded(false);

    // Rebuild URL with same seed + fresh cache-bust timestamp
    const freshUrl = buildImageUrl(generatedImage.seed);
    setGeneratedImage((prev) => ({ ...prev, url: freshUrl }));

    // Restart 30s safety timeout
    startSafetyTimeout();
  };

  const downloadImage = async () => {
    if (!generatedImage?.url) return;
    try {
      const response = await fetch(generatedImage.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `jobrobots-ai-${generatedImage.seed}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(generatedImage.url, '_blank');
    }
  };

  const reset = () => {
    clearSafetyTimeout();
    setPrompt('');
    setGeneratedImage(null);
    setImageLoaded(false);
    setImageError(false);
    setErrorMessage('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Input Card */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Image Generator
        </h2>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </div>
        )}

        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A futuristic city at sunset, cyberpunk style..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 outline-none focus:border-primary/50 resize-none transition-colors"
            disabled={inputsDisabled}
            onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && generateImage()}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={inputsDisabled}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-primary/50 transition-colors"
              >
                <option value="none">None</option>
                <option value="flux">Flux — Default</option>
                <option value="flux-realism">Flux — Realism</option>
                <option value="flux-anime">Flux — Anime</option>
                <option value="any-dark">Any — Dark</option>
                <option value="turbo">Turbo</option>
                <option value="turbo-realism">Turbo — Realism</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                disabled={inputsDisabled}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-primary/50 transition-colors"
              >
                <option value="1024x1024">Square (1024×1024)</option>
                <option value="1024x576">Landscape (1024×576)</option>
                <option value="768x1024">Portrait (768×1024)</option>
                <option value="512x512">Small (512×512)</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateImage}
            disabled={inputsDisabled || !prompt.trim()}
            className="gradient-btn w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate Image
              </>
            )}
          </button>
        </div>
      </div>

      {/* Image Result Card — shown as soon as URL is set */}
      {generatedImage && (
        <div className="glass-card p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-sm font-medium">Generated Image</h3>
            <div className="flex gap-2">
              <button
                onClick={downloadImage}
                disabled={!imageLoaded}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs transition-colors disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                New
              </button>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center min-h-[320px] relative">
            {/* Loading skeleton — shown while image is loading */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <div className="w-full max-w-sm px-8 animate-pulse">
                  <div className="bg-gray-700 rounded-xl w-full aspect-square" />
                </div>
                <div className="mt-4 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <p className="text-gray-400 text-sm">Generating image (may take a few seconds)...</p>
                </div>
              </div>
            )}

            {/* Error — ONLY triggered by 30s timeout, never by onError */}
            {imageError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <AlertCircle className="w-12 h-12 text-yellow-500 mb-3" />
                <p className="text-yellow-400 text-sm mb-4 text-center px-4 max-w-sm">
                  {errorMessage}
                </p>
                <button
                  onClick={retryImage}
                  className="px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-sm font-medium border border-primary/30 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/*
              img is ALWAYS in the DOM — onError is NOT connected.
              Pollinations may return a placeholder/HTML during async generation.
              Relying on onError fires a false positive — the image may load
              successfully seconds later. The 30s timeout is the ONLY error signal.
            */}
            <img
              key={generatedImage.url}
              src={generatedImage.url}
              alt={generatedImage.prompt}
              onLoad={handleImageLoad}
              className="w-full object-contain max-h-[512px] mx-auto"
              style={{ display: imageLoaded ? 'block' : 'none' }}
            />
          </div>

          <p className="mt-3 text-gray-400 text-xs italic">"{generatedImage.prompt}"</p>
          <p className="mt-1 text-gray-600 text-xs font-mono">Seed: {generatedImage.seed}</p>
        </div>
      )}

      {/* Empty State */}
      {!generatedImage && !isGenerating && !errorMessage && (
        <div className="mt-4 p-12 border-2 border-dashed border-white/10 rounded-xl text-center">
          <ImageIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Your generated image will appear here</p>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;
