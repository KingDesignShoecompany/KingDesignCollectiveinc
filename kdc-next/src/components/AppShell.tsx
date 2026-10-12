import React from 'react';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        {children}
        <Footer />
      </main>
    </div>
  );
}
