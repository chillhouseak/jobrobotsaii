import { useState, useRef, useCallback } from 'react';
import {
  Sparkles, Download, RefreshCw, Loader2, AlertCircle,
  Image as ImageIcon, Zap
} from 'lucide-react';
import apiService from '../services/api';

// Preload timeout in ms — if image doesn't load in this time, show error
const IMAGE_TIMEOUT = 30000;

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('none');
  const [size, setSize] = useState('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isPreloading, setIsPreloading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Store current image data in a ref so setTimeout callbacks always get the latest
  const imageData = useRef(null);
  const preloadTimer = useRef(null);
  const timeoutTimer = useRef(null);

  // Build the full Pollinations URL from seed returned by backend
  const buildImageUrl = useCallback((seed) => {
    const encoded = encodeURIComponent(prompt.trim());
    const [w, h] = size.split('x').map(Number);
    const styleParam = style && style !== 'none' ? `&model=${style}` : '';
    // Cache bust with timestamp so we always get a fresh image
    return `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&seed=${seed}${styleParam}&nologo=true&t=${Date.now()}`;
  }, [prompt, size, style]);

  // Clear all pending timers
  const clearTimers = useCallback(() => {
    if (preloadTimer.current) clearTimeout(preloadTimer.current);
    if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
    preloadTimer.current = null;
    timeoutTimer.current = null;
  }, []);

  // Preload an image URL — resolve on load, reject on error or timeout
  const preloadImage = useCallback((url) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image failed to load'));

      timeoutTimer.current = setTimeout(() => {
        img.onload = null;
        img.onerror = null;
        reject(new Error('Image timed out'));
      }, IMAGE_TIMEOUT);

      img.src = url;
    });
  }, []);

  const generateImage = async () => {
    if (!prompt.trim()) return;

    clearTimers();
    setHasError(false);
    setErrorMessage('');
    setGeneratedImage(null);
    setIsPreloading(false);
    setIsGenerating(true);

    try {
      const [width, height] = size.split('x').map(Number);

      // Call backend — returns { seed }
      const response = await apiService.request('/ai/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt: prompt.trim(), width, height, style }),
      });

      if (!response.success || !response.data?.seed) {
        throw new Error(response.message || 'Failed to generate image');
      }

      const { seed } = response.data;
      const imageUrl = buildImageUrl(seed);

      // Store in ref so callbacks always have current data
      imageData.current = { url: imageUrl, seed, prompt: prompt.trim() };

      setIsGenerating(false);
      setIsPreloading(true);

      // Attempt to preload the image
      try {
        await preloadImage(imageUrl);
        // Preload succeeded — display it
        setGeneratedImage({ url: imageUrl, seed, prompt: prompt.trim() });
        setIsPreloading(false);
      } catch {
        // Image is still generating or server is busy — show manual retry
        setIsPreloading(false);
        setHasError(true);
        setErrorMessage('Image is still generating or server is busy. Please try again.');
      }
    } catch (err) {
      setHasError(true);
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
      setIsGenerating(false);
    }
  };

  // Manual retry — rebuild URL with fresh cache-bust timestamp
  const retryImage = () => {
    if (!imageData.current) return;

    clearTimers();
    setHasError(false);
    setErrorMessage('');
    setIsPreloading(true);

    const freshUrl = buildImageUrl(imageData.current.seed);

    preloadImage(freshUrl)
      .then(() => {
        setGeneratedImage({ url: freshUrl, seed: imageData.current.seed, prompt: imageData.current.prompt });
        setIsPreloading(false);
      })
      .catch(() => {
        setIsPreloading(false);
        setHasError(true);
        setErrorMessage('Image is still generating or server is busy. Please try again.');
      });
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
      // Fallback: open in new tab
      window.open(generatedImage.url, '_blank');
    }
  };

  const reset = () => {
    clearTimers();
    imageData.current = null;
    setPrompt('');
    setGeneratedImage(null);
    setIsPreloading(false);
    setHasError(false);
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
            disabled={isGenerating || isPreloading}
            onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && generateImage()}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={isGenerating || isPreloading}
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
                disabled={isGenerating || isPreloading}
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
            disabled={isGenerating || isPreloading || !prompt.trim()}
            className="gradient-btn w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : isPreloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Preloading...
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

      {/* Image Result Card */}
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
                onClick={reset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                New
              </button>
            </div>
          </div>

          {/* Image display area */}
          <div className="rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center min-h-[320px] relative">
            {isPreloading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gray-900">
                {/* Skeleton loader */}
                <div className="w-full max-w-md px-8 animate-pulse">
                  <div className="bg-gray-700 rounded-xl w-full aspect-square" />
                </div>
                <div className="mt-4 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <p className="text-gray-400 text-sm">Loading image...</p>
                </div>
              </div>
            )}

            {hasError && (
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

            {/* Image is always in the DOM once generated — onLoad just removes skeleton */}
            <img
              key={generatedImage.url}
              src={generatedImage.url}
              alt={generatedImage.prompt}
              className="w-full object-contain max-h-[512px] mx-auto"
              style={{ display: isPreloading ? 'none' : 'block' }}
            />
          </div>

          <p className="mt-3 text-gray-400 text-xs italic">"{generatedImage.prompt}"</p>
          <p className="mt-1 text-gray-600 text-xs font-mono">Seed: {generatedImage.seed}</p>
        </div>
      )}

      {/* Empty State */}
      {!generatedImage && !isGenerating && !isPreloading && !hasError && (
        <div className="mt-4 p-12 border-2 border-dashed border-white/10 rounded-xl text-center">
          <ImageIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Your generated image will appear here</p>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;
