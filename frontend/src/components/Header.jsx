import { Search, Bell, Menu, Command, Crown, Gift, BookOpen, Video, Headphones } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Header = ({ onMenuClick, onRightSidebarClick }) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitles = {
    '/dashboard': 'Dashboard',
    '/applications': 'Applications',
    '/ai-tools': 'AI Tools',
    '/analytics': 'Analytics',
    '/resume': 'Resume',
    '/library': 'Library',
    '/settings': 'Settings',
    '/exclusive-guide': 'Exclusive Guide',
    '/video-training': 'Video Training',
    '/bonuses': 'Bonuses',
    '/upgrade': 'Upgrade',
    '/support': 'Support',
    '/ai-interview': 'AI Interview',
    '/image-generator': 'Image Generator',
    '/voice-over': 'Voice Over',
  };

  const currentTitle = pageTitles[location.pathname] || 'Dashboard';

  const newBadgeItems = [
    { path: '/bonuses', icon: Gift, label: 'New Bonus', color: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-xl border-b transition-all duration-300 ${
      isDark
        ? 'bg-[#0a0a0f]/80 border-white/10'
        : 'bg-white/80 border-black/10'
    }`}>
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className={`lg:hidden p-2 rounded-xl transition-colors ${
              isDark
                ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300'
                : 'bg-gray-100 border border-black/10 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{currentTitle}</h1>
            <p className={`text-xs hidden sm:block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage your job search</p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Command Bar Trigger */}
          <button className={`hidden md:flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
            isDark
              ? 'bg-white/5 border border-white/10 hover:bg-white/10'
              : 'bg-gray-100 border border-black/10 hover:bg-gray-200'
          }`}>
            <Search className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Search...</span>
            <div className="flex items-center space-x-1">
              <kbd className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'text-gray-500 bg-gray-800' : 'text-gray-400 bg-gray-200'}`}>
                <Command className="w-3 h-3 inline" />
              </kbd>
              <kbd className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'text-gray-500 bg-gray-800' : 'text-gray-400 bg-gray-200'}`}>K</kbd>
            </div>
          </button>

          {/* Mobile Search */}
          <button className={`md:hidden p-2 rounded-xl transition-colors ${
            isDark
              ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300'
              : 'bg-gray-100 border border-black/10 hover:bg-gray-200 text-gray-700'
          }`}>
            <Search className="w-5 h-5" />
          </button>

          {/* Right Sidebar Toggle */}
          <button
            onClick={onRightSidebarClick}
            className={`relative p-2 rounded-xl transition-colors ${
              isDark
                ? 'bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 hover:from-primary/30 hover:to-accent/30 text-primary'
                : 'bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 hover:from-primary/20 hover:to-accent/20 text-primary'
            }`}
          >
            <Crown className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a0a0f]"></span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={`relative p-2 rounded-xl transition-colors ${
                isDark
                  ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300'
                  : 'bg-gray-100 border border-black/10 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
            </button>

            {isNotificationOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsNotificationOpen(false)}
                />
                <div className={`absolute right-0 mt-2 w-80 z-50 backdrop-blur-xl border shadow-xl ${
                  isDark
                    ? 'bg-[#12121a]/98 border-white/10'
                    : 'bg-white/98 border-black/10'
                }`} style={{ borderRadius: '16px' }}>
                  <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                  </div>
                  <div className={`py-2 max-h-96 overflow-y-auto ${isDark ? '' : ''}`}>
                    <div className={`px-4 py-3 transition-colors cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                      <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Welcome to JobRobots AI!</p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Start by adding your first job application</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
