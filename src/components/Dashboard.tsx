'use client';

import { Tool } from '@/data/tools';
import { useTranslations } from 'next-intl';

interface DashboardProps {
  tools: Tool[][];
  onSelectTool: (id: string) => void;
}

export default function Dashboard({ tools, onSelectTool }: DashboardProps) {
  const t = useTranslations();

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="space-y-4 text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          Toolbox
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl">
          {t('nav.subtitle')}
        </p>
      </div>

      <div className="space-y-12">
         {tools.map((categoryTools, idx) => (
            <div key={idx} className="space-y-4">
               <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-2">
                 {t(categoryTools[0].categoryKey as any)}
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {categoryTools.map(tool => (
                   <button
                     key={tool.id}
                     onClick={() => onSelectTool(tool.id)}
                     className="group relative flex flex-col items-start p-5 bg-slate-900/50 border border-slate-800 rounded-xl hover:bg-slate-800 hover:border-slate-700 hover:shadow-lg hover:shadow-blue-900/10 transition-all duration-200 text-left"
                   >
                     <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl p-2 bg-slate-950 rounded-lg border border-slate-800 group-hover:border-slate-600 group-hover:bg-slate-900 transition-colors">
                            {tool.icon}
                        </div>
                        <h4 className="text-base font-semibold text-slate-200 group-hover:text-white transition-colors">
                            {t(tool.nameKey as any)}
                        </h4>
                     </div>
                   </button>
                 ))}
               </div>
            </div>
         ))}
      </div>
    </div>
  )
}
