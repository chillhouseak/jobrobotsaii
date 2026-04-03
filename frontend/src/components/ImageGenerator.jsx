import { useState } from 'react';
import { Sparkles, Download, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import apiService from '../services/api';

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('none');
  const [size, setSize] = useState('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState('');

  const generateImage = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError('');
    setGeneratedImage(null);

    try {
      const [width, height] = size.split('x').map(Number);
      const response = await apiService.request('/ai/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt: prompt.trim(), width, height, style }),
      });

      if (response.success && response.data?.imageUrl) {
        setGeneratedImage(response.data);
      } else {
        setError(response.message || 'Failed to generate image');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage?.imageUrl) return;
    // dataUrl format: data:image/png;base64,...
    const link = document.createElement('a');
    link.href = generatedImage.imageUrl;
    link.download = `jobrobots-ai-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setPrompt('');
    setGeneratedImage(null);
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
            disabled={isGenerating}
            onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && generateImage()}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={isGenerating}
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
                disabled={isGenerating}
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
            disabled={isGenerating || !prompt.trim()}
            className="gradient-btn w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
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

          <div className="rounded-xl overflow-hidden bg-gray-900">
            <img
              src={generatedImage.imageUrl}
              alt={generatedImage.prompt}
              className="w-full object-contain max-h-[512px] mx-auto"
            />
          </div>

          <p className="mt-3 text-gray-400 text-xs italic">"{generatedImage.prompt}"</p>
        </div>
      )}

      {/* Empty State */}
      {!generatedImage && !isGenerating && !error && (
        <div className="mt-4 p-12 border-2 border-dashed border-white/10 rounded-xl text-center">
          <Sparkles className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Your generated image will appear here</p>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;
