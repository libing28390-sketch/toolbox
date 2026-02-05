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
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-white">
          Toolbox
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl">
          {t('nav.subtitle')}
        </p>
      </div>

      <div className="space-y-12">
         {tools.map((categoryTools, idx) => (
            <div key={idx} className="space-y-4">
               <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider border-b border-white/10 pb-2">
                 {t(categoryTools[0].categoryKey as any)}
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {categoryTools.map(tool => (
                   <button
                     key={tool.id}
                     onClick={() => onSelectTool(tool.id)}
                     className="group relative flex flex-col items-start p-5 bg-[#202024] border border-white/5 rounded-xl hover:bg-[#27272a] hover:border-white/10 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 text-left"
                   >
                     <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl p-2 bg-[#121214] rounded-lg border border-white/5 text-blue-500 group-hover:border-blue-500/30 transition-colors">
                            {tool.icon}
                        </div>
                        <h4 className="text-base font-semibold text-zinc-200 group-hover:text-white transition-colors">
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
