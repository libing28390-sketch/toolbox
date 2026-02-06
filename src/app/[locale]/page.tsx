'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import ToolPanel from '@/components/ToolPanel';
import Modal from '@/components/Modal';
import { toolsData } from '@/data/tools';

export default function Home() {
  const t = useTranslations();
  const router = useRouter();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const handleSelectTool = (id: string) => {
    if (id === 'json-visualizer') {
      router.push('/tools/json-visualizer');
    } else if (id === 'nginx-config-generator') {
      router.push('/tools/nginx-config-generator');
    } else {
      setSelectedTool(id);
    }
  };

  return (
    <main className="flex flex-col h-screen bg-background overflow-hidden text-zinc-100">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Dashboard - Always Visible */}
        <div className="flex-1 overflow-y-auto bg-background relative transition-all duration-300">
          <Dashboard tools={toolsData} onSelectTool={handleSelectTool} />
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
