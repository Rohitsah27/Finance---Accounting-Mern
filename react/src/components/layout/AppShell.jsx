import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppShell() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('v_sb_collapsed') === '1';
  });

  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('sb-collapsed');
    } else {
      document.body.classList.remove('sb-collapsed');
    }
    localStorage.setItem('v_sb_collapsed', isCollapsed ? '1' : '0');
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Sidebar isCollapsed={isCollapsed} onToggleCollapse={toggleSidebar} />
      <Header />
      <main className="main-content" id="main-content">
        <Outlet />
      </main>
    </>
  );
}
