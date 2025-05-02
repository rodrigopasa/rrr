import React, { ReactNode } from 'react';
import Sidebar from './sidebar';
import TopNav from './top-nav';
import Footer from './footer';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-orange-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}