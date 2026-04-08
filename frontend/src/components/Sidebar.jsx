import { Bot, Zap, LayoutDashboard, Briefcase, Sparkles, BarChart3, Bookmark, Settings, LogOut, Sun, Moon, ChevronLeft, ChevronRight, Mic, GraduationCap, Target, ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Briefcase, label: 'Applications', path: '/applications' },
    { icon: Sparkles, label: 'AI Tools', path: '/ai-tools' },
    { icon: Target, label: 'Goal Tracker', path: '/goal-tracker' },
    { icon: ImageIcon, label: 'Image Generator', path: '/image-generator' },
    { icon: Mic, label: 'Voice Over', path: '/voice-over' },
    { icon: GraduationCap, label: 'AI Interview', path: '/ai-interview' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Bookmark, label: 'Library', path: '/library' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`fixed left-0 top-0 h-screen backdrop-blur-xl border-r flex flex-col z-50 transition-all duration-300 ${isCollapsed ? 'w-[72px]' : 'w-[280px]'} ${
      isDark
        ? 'bg-[#12121a]/98 border-white/10'
        : 'bg-white/98 border-black/10'
    }`}>
      {/* Logo */}
      <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <div className="flex items-center space-x-3">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-accent to-pink-500 flex items-center justify-center shadow-lg shadow-primary/30">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full flex items-center justify-center">
              <Zap className="w-2 h-2 text-[#0a0a0f]" />
            </div>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                JobRobots <span className="gradient-text">AI</span>
              </h1>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item, index) => (
            <li key={index}>
              <button
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive(item.path)
                    ? `${isDark ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-white border border-primary/30' : 'bg-primary/10 text-gray-900 border border-primary/20'}`
                    : `${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-transparent'}`
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive(item.path) ? 'text-primary-light' : ''}`} />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className={`p-3 border-t space-y-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
            isDark
              ? 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-transparent hover:border-black/10'
          }`}
        >
          {isDark ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
          {!isCollapsed && <span className="text-sm font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* User Profile */}
        <div className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl ${isCollapsed ? 'justify-center' : ''} ${
          isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-100 border border-black/5'
        }`}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name || 'User'}</p>
              <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200 ${
            isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!isCollapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
