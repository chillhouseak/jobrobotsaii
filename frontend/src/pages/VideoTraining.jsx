import { useState } from 'react';
import { Video, Search } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const VideoTraining = () => {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Videos' },
    { id: 'resume', label: 'Resume' },
    { id: 'interview', label: 'Interview' },
    { id: 'career', label: 'Career' },
    { id: 'networking', label: 'Networking' },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gradient-to-br from-space-900 via-purple-900/20 to-space-900' : 'bg-gradient-to-br from-gray-50 via-purple-50/50 to-gray-50'
    }`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Video Training
              </h1>
            </div>
          </div>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Learn from industry experts with our comprehensive video library
          </p>
        </div>

        {/* Search & Filter */}
        <div className={`p-4 rounded-2xl backdrop-blur-xl border mb-6 ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'
        }`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl transition-colors ${
                  isDark
                    ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary'
                    : 'bg-gray-100 border border-black/5 text-gray-900 placeholder-gray-400 focus:border-primary'
                } focus:outline-none focus:ring-2 focus:ring-primary/50`}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : isDark
                        ? 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-black/5'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className={`text-center py-16 rounded-2xl ${
          isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-black/10'
        }`}>
          <Video className={`w-16 h-16 mx-auto mb-4 ${
            isDark ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            No Videos Available
          </h3>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Training videos will appear here when available.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoTraining;
