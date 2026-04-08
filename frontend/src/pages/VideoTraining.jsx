import { useTheme } from '../context/ThemeContext';
import { Video, ExternalLink } from 'lucide-react';

const VideoTraining = () => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-space-900 via-purple-900/20 to-space-900'
        : 'bg-gradient-to-br from-gray-50 via-purple-50/50 to-gray-50'
    }`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Video Training
              </h1>
            </div>
          </div>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Watch our training video to get started
          </p>
        </div>

        {/* Video Card */}
        <div className={`p-8 rounded-2xl border text-center ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'
        }`}>
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-6">
            <Video className="w-10 h-10 text-white" />
          </div>

          <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Watch Training Video
          </h2>

          <p className={`mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Click below to open the training video
          </p>

          <a
            href="https://drive.google.com/file/d/1DazO_6UhOYvkEwFf0tDI_1SgkSMMDrrN/view?usp=drive_link"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-105"
          >
            <Video className="w-5 h-5" />
            Watch Video
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default VideoTraining;
