'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Header from '@/components/Header';
import ToolGrid from '@/components/ToolGrid';
import ToolPanel from '@/components/ToolPanel';
import { toolsData } from '@/data/tools';

export default function Home() {
  const t = useTranslations();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <main className="flex flex-col h-screen bg-slate-950 overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={`flex-shrink-0 z-10 transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <ToolGrid 
            tools={toolsData} 
            onSelectTool={setSelectedTool} 
            selectedToolId={selectedTool}
            isCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-slate-950 relative transition-all duration-300">
          <div className="max-w-5xl mx-auto p-6 md:p-12">
            {selectedTool ? (
              <ToolPanel tool={toolsData.flat().find(t => t.id === selectedTool)!} />
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
                <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                  <span className="text-4xl">🛠️</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-slate-200">{t('nav.subtitle')}</h2>
                  <p className="text-slate-400 max-w-md mx-auto">{t('messages.inputRequired')}</p>
                </div>
                <p className="text-sm text-slate-600">Select a tool from the sidebar to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
