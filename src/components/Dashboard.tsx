'use client';

import { Tool } from '@/data/tools';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface DashboardProps {
  tools: Tool[][];
  onSelectTool: (id: string) => void;
}

export default function Dashboard({ tools, onSelectTool }: DashboardProps) {
  const t = useTranslations();

  const ToolCard = ({ tool }: { tool: Tool }) => (
    <>
      <div className="flex items-center gap-3 mb-2">
        <div className="text-2xl p-2 bg-zinc-100 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-white/5 text-blue-600 dark:text-blue-500 group-hover:border-blue-500/30 transition-colors">
          {tool.icon}
        </div>
        <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
          {t(tool.nameKey as any)}
        </h4>
      </div>
    </>
  );

  const cardClassName = "group relative flex flex-col items-start p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-white/20 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200 text-left w-full h-full";

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="space-y-4 text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-zinc-900 dark:text-zinc-50">
          Toolbox
        </h1>
        <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl">
          {t('nav.subtitle')}
        </p>
      </div>

      <div className="space-y-12">
         {tools.map((categoryTools, idx) => (
            <div key={idx} className="space-y-4">
               <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-white/10 pb-2">
                 {t(categoryTools[0].categoryKey as any)}
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {categoryTools.map(tool => (
                   tool.href ? (
                     <Link
                       key={tool.id}
                       href={tool.href}
                       className={cardClassName}
                     >
                       <ToolCard tool={tool} />
                     </Link>
                   ) : (
                     <button
                       key={tool.id}
                       onClick={() => onSelectTool(tool.id)}
                       className={cardClassName}
                     >
                       <ToolCard tool={tool} />
                     </button>
                   )
                 ))}
               </div>
            </div>
         ))}
      </div>
    </div>
  )
}
