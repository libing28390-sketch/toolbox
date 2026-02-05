'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import ToolPanel from '@/components/ToolPanel';
import Modal from '@/components/Modal';
import { toolsData } from '@/data/tools';

export default function Home() {
  const t = useTranslations();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  return (
    <main className="flex flex-col h-screen bg-zinc-950 overflow-hidden text-zinc-100">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Dashboard - Always Visible */}
        <div className="flex-1 overflow-y-auto bg-zinc-950 relative transition-all duration-300">
          <Dashboard tools={toolsData} onSelectTool={setSelectedTool} />
        </div>

        {/* Modal for Tool Panel */}
        <Modal isOpen={!!selectedTool} onClose={() => setSelectedTool(null)}>
          {selectedTool && (
             <ToolPanel tool={toolsData.flat().find(t => t.id === selectedTool)!} />
          )}
        </Modal>
      </div>
    </main>
  );
}
