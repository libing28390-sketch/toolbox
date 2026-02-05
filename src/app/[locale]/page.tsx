'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Header from '@/components/Header';
import ToolGrid from '@/components/ToolGrid';
import ToolPanel from '@/components/ToolPanel';
import Dashboard from '@/components/Dashboard';
import { toolsData } from '@/data/tools';

export default function Home() {
  const t = useTranslations();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <main className="flex flex-col h-screen bg-zinc-950 overflow-hidden text-zinc-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Only show when a tool is selected */}
        {selectedTool && (
          <aside 
            className={`flex-shrink-0 z-10 transition-all duration-300 ease-in-out border-r border-zinc-800 ${
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
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-zinc-950 relative transition-all duration-300">
          {selectedTool ? (
            <div className="max-w-7xl mx-auto p-4 md:p-6 h-full flex flex-col">
              <ToolPanel tool={toolsData.flat().find(t => t.id === selectedTool)!} />
            </div>
          ) : (
            <Dashboard tools={toolsData} onSelectTool={setSelectedTool} />
          )}
        </div>
      </div>
    </main>
  );
}
