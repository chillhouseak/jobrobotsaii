import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
  Webhook
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/users', icon: Users, label: 'Users' },
  { path: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { path: '/ai-usage', icon: Bot, label: 'AI Usage' },
  { path: '/webhooks', icon: Webhook, label: 'Webhooks' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/settings', icon: Settings, label: 'Settings' }
];

export default function Layout() {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background-primary flex">
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-40
        bg-background-secondary border-r border-glass-border
        transition-all duration-300
        ${sidebarOpen ? 'w-64' : 'w-20'}
        hidden md:block
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-glass-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center flex-shrink-0">
                <Bot className="w-6 h-6 text-white" />
              </div>
              {sidebarOpen && (
                <div className="animate-fadeIn">
                  <h1 className="text-lg font-bold text-text-primary">JobRobots</h1>
                  <p className="text-xs text-text-secondary">Admin Panel</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200
                    ${isActive
                      ? 'bg-accent-primary text-white'
                      : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="font-medium animate-fadeIn">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Admin Info */}
          <div className="p-4 border-t border-glass-border">
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white font-medium flex-shrink-0">
                {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0 animate-fadeIn">
                  <p className="text-text-primary font-medium truncate">{admin?.name}</p>
                  <p className="text-text-secondary text-xs truncate">{admin?.role}</p>
                </div>
              )}
              {sidebarOpen && (
                <button
                  onClick={logout}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div className={`
        fixed top-0 left-0 h-full w-72 z-50
        bg-background-secondary border-r border-glass-border
        transform transition-transform duration-300
        md:hidden
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-glass-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-text-primary">JobRobots</h1>
                  <p className="text-xs text-text-secondary">Admin Panel</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-text-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200
                    ${isActive
                      ? 'bg-accent-primary text-white'
                      : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Admin Info */}
          <div className="p-4 border-t border-glass-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white font-medium">
                {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium truncate">{admin?.name}</p>
                <p className="text-text-secondary text-xs truncate">{admin?.role}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background-primary/80 backdrop-blur-lg border-b border-glass-border">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-white/10 text-text-secondary md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex p-2 rounded-lg hover:bg-white/10 text-text-secondary"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <span className="text-text-secondary text-sm hidden sm:block">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
