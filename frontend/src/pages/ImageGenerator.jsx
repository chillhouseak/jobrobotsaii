import { useState, useEffect } from 'react';
import { ImageIcon, Sparkles, Loader2, Download, Copy, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import apiService from '../services/api';
import { useTheme } from '../context/ThemeContext';

const ImageGenerator = () => {
  const { isDark } = useTheme();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [loadingImages, setLoadingImages] = useState({});
  const [errorImages, setErrorImages] = useState({});

  const inputsDisabled = isGenerating;

  // Per-image load/error handlers
  const handleImageLoad = (url) => {
    setLoadingImages(prev => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
  };

  const handleImageError = (url) => {
    setLoadingImages(prev => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
    setErrorImages(prev => ({ ...prev, [url]: true }));
  };

  const generateImages = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError('');
    setImages([]);
    setErrorImages({});

    try {
      const response = await apiService.generateImage(prompt.trim());
      if (response.success && response.data.images) {
        // Initialize loading state for each image URL
        const initialLoading = {};
        response.data.images.forEach(img => { initialLoading[img.url] = true; });
        setLoadingImages(initialLoading);
        setImages(response.data.images);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate images. Please try again.');
    }

    setIsGenerating(false);
  };

  const downloadImage = async (url, index) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `jobrobots-image-${Date.now()}-${index + 1}.png`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      setError('Failed to download image. Try right-clicking and saving instead.');
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setPrompt('');
    setImages([]);
    setError('');
    setErrorImages({});
    setLoadingImages({});
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
            <ImageIcon className="w-6 h-6 text-primary-light" />
            <span>AI Image Generator</span>
          </h1>
          <p className="text-gray-400">Create stunning images from text prompts — free, fast, no API key needed</p>
        </div>

        {/* Input Section */}
        <div className={`p-6 rounded-2xl mb-6 ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
          <div className="mb-5">
            <label className={`block text-sm font-medium mb-2 flex items-center justify-between ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <span>Describe your image</span>
              {prompt && (
                <button
                  onClick={copyPrompt}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    isDark ? 'bg-white/5 hover:bg-white/10 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                  }`}
                >
                  {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied!' : 'Copy prompt'}</span>
                </button>
              )}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  generateImages();
                }
              }}
              placeholder="e.g. A futuristic cityscape at sunset with flying cars and neon lights, cinematic lighting, 4k..."
              rows={4}
              disabled={inputsDisabled}
              className={`w-full px-4 py-3 rounded-xl text-sm resize-none transition-all ${
                isDark
                  ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                  : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />
            <p className={`mt-1.5 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Tip: Be specific — mention style, lighting, mood, and details for better results. Ctrl+Enter to generate.
            </p>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateImages}
            disabled={inputsDisabled || !prompt.trim()}
            className="gradient-btn w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating image...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Images</span>
              </>
            )}
          </button>

          {error && (
            <p className="mt-3 text-red-400 text-sm text-center">{error}</p>
          )}
        </div>

        {/* Image Grid */}
        {images.length > 0 && (
          <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Generated Images
              </h2>
              <button
                onClick={reset}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>New Generation</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img, index) => {
                const isLoading = loadingImages[img.url];
                const hasError = errorImages[img.url];

                return (
                  <div
                    key={img.id}
                    className={`relative rounded-xl overflow-hidden border ${
                      isDark ? 'bg-[#0d0d1a] border-white/10' : 'bg-gray-100 border-gray-200'
                    }`}
                  >
                    {/* Loading spinner overlay */}
                    {isLoading && !hasError && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20">
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                      </div>
                    )}

                    {/* Error state */}
                    {hasError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-red-500/10">
                        <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
                        <p className="text-red-400 text-xs text-center px-4">Image failed to load</p>
                      </div>
                    )}

                    {/* Image */}
                    <img
                      src={img.url}
                      alt={`Generated image ${index + 1}`}
                      className="w-full aspect-square object-cover"
                      onLoad={() => handleImageLoad(img.url)}
                      onError={() => handleImageError(img.url)}
                    />

                    {/* Actions */}
                    {!isLoading && !hasError && (
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-end space-x-2">
                        <button
                          onClick={() => downloadImage(img.url, index)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-medium transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className={`mt-4 text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Images are generated using Pollinations AI. No credits required.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!images.length && !isGenerating && (
          <div className={`text-center py-16 rounded-2xl ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-10 h-10 text-primary-light" />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Ready to Create</h3>
            <p className={`max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Describe the image you want to create and let AI bring your imagination to life — completely free
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ImageGenerator;
