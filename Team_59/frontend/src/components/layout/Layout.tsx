import type { ReactNode } from 'react';
import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../store/auth';

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showSidebar = true }) => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex">
        {showSidebar && user && (
          <Sidebar
            className={`
              fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 pt-16 overflow-y-auto
              transition-transform transform
              lg:translate-x-0
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}
        <main
          className={`
            flex-1 transition-all duration-200 p-6
            ${showSidebar && user ? 'lg:ml-64' : ''}
          `}
          onClick={() => isSidebarOpen && setIsSidebarOpen(false)}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
