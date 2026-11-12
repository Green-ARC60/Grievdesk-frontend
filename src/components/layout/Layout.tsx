import React, { useState, useCallback, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export interface LayoutContextType {
  openSidebar: () => void;
  triggerNewChat: () => void;
  newChatSignal: number;
}

export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newChatSignal, setNewChatSignal] = useState(0);

  const handleNewChat = useCallback(() => {
    setNewChatSignal((prev) => prev + 1);
  }, []);

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const layoutContextValue = useMemo<LayoutContextType>(
    () => ({
      openSidebar,
      triggerNewChat: handleNewChat,
      newChatSignal,
    }),
    [openSidebar, handleNewChat, newChatSignal]
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary transition-colors">
      <Navbar
        onOpenSidebar={openSidebar}
        onNewChat={handleNewChat}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <main className="flex-1 flex flex-col">
        <Outlet context={layoutContextValue} />
      </main>

      <footer className="py-3.5 border-t border-border bg-surface text-center text-xs text-text-muted transition-colors">
        <p>
          GrievDesk &copy; {new Date().getFullYear()} &bull; Residential Society Management System &bull; Single-Society RWA Platform
        </p>
      </footer>
    </div>
  );
};
