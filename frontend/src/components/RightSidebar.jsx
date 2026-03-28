import { useState } from 'react';
import { BookOpen, Video, Gift, Crown, Headphones, X, ChevronLeft, Bell, ExternalLink } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const RightSidebar = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  const menuItems = [
    {
      id: 'exclusive-guide',
      icon: BookOpen,
      label: 'Exclusive Guide',
      path: '/exclusive-guide',
      badge: null,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'video-training',
      icon: Video,
      label: 'Video Training',
      path: '/video-training',
      badge: 'New',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'bonuses',
      icon: Gift,
      label: 'Bonuses',
      path: '/bonuses',
      badge: '3',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      id: 'upgrade',
      icon: Crown,
      label: 'Upgrade',
      path: '/upgrade',
      badge: null,
      color: 'from-amber-500 to-orange-500'
    },
    {
      id: 'support',
      icon: Headphones,
      label: 'Support',
      path: '/support',
      badge: null,
      color: 'from-rose-500 to-red-500'
    }
  ];

  const isActive = (path) => location.pathname === path;

  const handleNavigation = (item) => {
    navigate(item.path);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed right-0 top-0 h-screen backdrop-blur-xl border-l z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${
          isDark
            ? 'bg-[#12121a]/98 border-white/10'
            : 'bg-white/98 border-black/10'
        } w-[320px]`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'border-white/10' : 'border-black/10'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
              isDark ? 'from-primary/30 to-accent/30' : 'from-primary/20 to-accent/20'
            } flex items-center justify-center`}>
              <Crown className={`w-4 h-4 ${isDark ? 'text-primary' : 'text-primary'}`} />
            </div>
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Resources
            </span>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                : 'hover:bg-black/5 text-gray-500 hover:text-gray-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                    isActive(item.path)
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                      : hoveredItem === item.id
                        ? `${isDark ? 'bg-white/5' : 'bg-gray-100'}`
                        : isDark
                          ? 'text-gray-300 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {/* Active indicator */}
                  {isActive(item.path) && (
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b ${item.color}`} />
                  )}

                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-white/20'
                      : isDark
                        ? 'bg-white/5 group-hover:bg-white/10'
                        : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <item.icon className={`w-5 h-5 ${
                      isActive(item.path)
                        ? 'text-white'
                        : isDark
                          ? 'text-gray-400 group-hover:text-white'
                          : 'text-gray-500 group-hover:text-gray-900'
                    }`} />
                  </div>

                  {/* Label */}
                  <span className={`flex-1 text-left font-medium ${
                    isActive(item.path)
                      ? 'text-white'
                      : ''
                  }`}>
                    {item.label}
                  </span>

                  {/* Badge */}
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive(item.path)
                        ? 'bg-white/30 text-white'
                        : item.id === 'bonuses'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-blue-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}

                  {/* Arrow */}
                  <ChevronLeft className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -rotate-180 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20' : 'bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10'}`}>
            <p className={`text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Need Help?
            </p>
            <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Check our documentation or contact support
            </p>
            <button
              onClick={() => handleNavigation(menuItems[4])}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-sm font-medium hover:shadow-lg hover:shadow-primary/30 transition-all"
            >
              Get Support
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default RightSidebar;
