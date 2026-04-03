import { useState, useRef } from 'react';
import { Sparkles, Download, RefreshCw, Loader2, AlertCircle, Image } from 'lucide-react';
import apiService from '../services/api';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('none');
  const [size, setSize] = useState('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState('');

  const retryCount = useRef(0);
  const retryTimeout = useRef(null);

  const buildImageUrl = (seed) => {
    const encoded = encodeURIComponent(prompt.trim());
    const w = parseInt(size.split('x')[0]);
    const h = parseInt(size.split('x')[1]);
    const styleParam = style && style !== 'none' ? `&model=${style}` : '';
    const seedParam = seed ? `&seed=${seed}` : '';
    // ?t= prevents browser cache — always gets fresh image
    return `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}${seedParam}${styleParam}&nologo=true&t=${Date.now()}`;
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;

    // Clear any pending retry
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
      retryTimeout.current = null;
    }
    retryCount.current = 0;

    setIsGenerating(true);
    setError('');
    setGeneratedImage(null);
    setImageLoading(false);

    try {
      const width = parseInt(size.split('x')[0]);
      const height = parseInt(size.split('x')[1]);

      // Call backend to validate and get structured response
      const response = await apiService.request('/ai/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt: prompt.trim(), width, height, style }),
      });

      if (response.success && response.data) {
        const seed = response.data.seed || Math.floor(Math.random() * 999999999);
        const imageUrl = buildImageUrl(seed);

        setGeneratedImage({
          url: imageUrl,
          seed,
          prompt: prompt.trim(),
        });

        setImageLoading(true);
      } else {
        setError(response.message || 'Failed to generate image');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Retry with fixed delay and cache busting
  const retryImage = () => {
    if (retryCount.current >= MAX_RETRIES) {
      setError('Image took too long. Please try again.');
      setImageLoading(false);
      return;
    }

    retryCount.current += 1;

    retryTimeout.current = setTimeout(() => {
      if (generatedImage) {
        // Cache bust with retry count to force fresh request
        setGeneratedImage((prev) => ({
          ...prev,
          url: `${prev.url.split('&t=')[0]}&retry=${retryCount.current}&t=${Date.now()}`,
        }));
      }
    }, RETRY_DELAY);
  };

  const handleImageLoad = () => {
    retryCount.current = 0;
    setImageLoading(false);
    setError('');
  };

  const handleImageError = () => {
    retryImage();
  };

  const downloadImage = () => {
    if (!generatedImage?.url) return;
    const link = document.createElement('a');
    link.href = generatedImage.url;
    link.download = `jobrobots-ai-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    if (retryTimeout.current) clearTimeout(retryTimeout.current);
    retryCount.current = 0;
    setPrompt('');
    setGeneratedImage(null);
    setImageLoading(false);
    setError('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Image Generator
        </h2>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Input */}
        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A beautiful sunset over the ocean..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 outline-none focus:border-primary/50 resize-none"
            disabled={isGenerating || imageLoading}
            onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && generateImage()}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={isGenerating || imageLoading}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
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
                disabled={isGenerating || imageLoading}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
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
            disabled={isGenerating || imageLoading || !prompt.trim()}
            className="gradient-btn w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : imageLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading image...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Image
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {generatedImage && (
        <div className="glass-card p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-sm font-medium">Generated Image</h3>
            <div className="flex gap-2">
              <button
                onClick={downloadImage}
                disabled={imageLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs transition-colors disabled:opacity-50"
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

          <div className="rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center min-h-[300px] relative">
            {/* Loading overlay */}
            {imageLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                <p className="text-gray-400 text-sm">
                  Loading image...{retryCount.current > 0 && ` (retry ${retryCount.current}/${MAX_RETRIES})`}
                </p>
              </div>
            )}

            {/* Image — always rendered so onLoad/onError always fire */}
            <img
              src={generatedImage.url}
              alt={generatedImage.prompt}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className="w-full object-contain max-h-[512px] mx-auto"
            />

            {/* Error state — no retry left */}
            {!imageLoading && error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Image className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-gray-400 text-sm mb-3">{error}</p>
                <button
                  onClick={generateImage}
                  className="text-primary text-sm hover:underline"
                >
                  Try again
                </button>
              </div>
            )}
          </div>

          <p className="mt-3 text-gray-400 text-xs italic">"{generatedImage.prompt}"</p>
          <p className="mt-1 text-gray-500 text-xs">Seed: {generatedImage.seed}</p>
        </div>
      )}

      {/* Empty State */}
      {!generatedImage && !isGenerating && !imageLoading && !error && (
        <div className="mt-4 p-12 border-2 border-dashed border-white/10 rounded-xl text-center">
          <Sparkles className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Your generated image will appear here</p>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;
