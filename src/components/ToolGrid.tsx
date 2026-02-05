'use client';

import { useTranslations } from 'next-intl';
import { Tool } from '@/data/tools';
import { cn } from '@/lib/utils'; // 假设有 utils，如果没有就直接写 classNames

interface ToolGridProps {
  tools: Tool[][];
  onSelectTool: (toolId: string) => void;
  selectedToolId: string | null;
}

export default function ToolGrid({ tools, onSelectTool, selectedToolId }: ToolGridProps) {
  const t = useTranslations();

  return (
    <div className="h-full overflow-y-auto py-4 px-3 space-y-6 bg-slate-900 border-r border-slate-800">
      {tools.map((category, idx) => {
        const categoryKey = category[0]?.categoryKey;
        return (
          <div key={idx}>
            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {t(categoryKey as any)}
            </h3>
            <div className="space-y-1">
              {category.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => onSelectTool(tool.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-3 ${
                    selectedToolId === tool.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="text-lg opacity-80">{tool.icon}</span>
                  <span className="font-medium">{t(tool.nameKey as any)}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

