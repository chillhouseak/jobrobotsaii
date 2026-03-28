import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import RightSidebar from './RightSidebar';
import { useTheme } from '../context/ThemeContext';

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#fafbfc]'}`}>
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`lg:block ${isMobileSidebarOpen ? 'block' : 'hidden'}`}>
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Right Sidebar */}
      <RightSidebar
        isOpen={isRightSidebarOpen}
        onClose={() => setIsRightSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'} ${isRightSidebarOpen ? 'mr-[320px]' : ''}`}>
        <Header
          onMenuClick={() => setIsMobileSidebarOpen(true)}
          onRightSidebarClick={() => setIsRightSidebarOpen(true)}
        />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
