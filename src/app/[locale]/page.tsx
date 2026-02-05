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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <ToolGrid tools={toolsData} onSelectTool={setSelectedTool} />
          </div>
          <div className="lg:col-span-3">
            {selectedTool ? (
              <ToolPanel tool={toolsData.flat().find(t => t.id === selectedTool)!} />
            ) : (
              <div className="bg-slate-700 rounded-lg p-8 text-center text-slate-300">
                <h2 className="text-2xl font-bold mb-4">{t('nav.subtitle')}</h2>
                <p>{t('messages.inputRequired')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
