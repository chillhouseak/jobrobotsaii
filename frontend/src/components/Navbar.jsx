import { Bot, Zap, Bell, Settings, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-space-900/80 backdrop-blur-xl border-b border-glass-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-accent to-pink-500 flex items-center justify-center shadow-lg shadow-primary/30">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full flex items-center justify-center">
                <Zap className="w-2 h-2 text-space-900" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white tracking-tight">
                JobRobots <span className="gradient-text">AI</span>
              </h1>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  link.active ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <button className="relative p-2 rounded-xl bg-glass border border-glass-border hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 z-50 glass-card border border-glass-border py-2 shadow-xl">
                    <div className="px-4 py-3 border-b border-glass-border">
                      <p className="text-sm font-medium text-white">{user?.name}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-glass border border-glass-border hover:bg-white/10 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-gray-300" /> : <Menu className="w-5 h-5 text-gray-300" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-glass-border space-y-1">
            {navLinks.map((link, index) => (
              <button
                key={index}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  link.active ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
