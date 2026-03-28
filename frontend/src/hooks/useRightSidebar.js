import { useState, useCallback } from 'react';

export const useRightSidebar = () => {
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  const toggleRightSidebar = useCallback(() => {
    setIsRightSidebarOpen(prev => !prev);
  }, []);

  const closeRightSidebar = useCallback(() => {
    setIsRightSidebarOpen(false);
  }, []);

  const openRightSidebar = useCallback(() => {
    setIsRightSidebarOpen(true);
  }, []);

  return {
    isRightSidebarOpen,
    toggleRightSidebar,
    closeRightSidebar,
    openRightSidebar
  };
};

export default useRightSidebar;
