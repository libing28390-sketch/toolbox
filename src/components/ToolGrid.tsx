'use client';

import { useTranslations } from 'next-intl';
import { Tool } from '@/data/tools';

interface ToolGridProps {
  tools: Tool[][];
  onSelectTool: (toolId: string) => void;
}

export default function ToolGrid({ tools, onSelectTool }: ToolGridProps) {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      {tools.map((category, idx) => {
        const categoryKey = category[0]?.categoryKey;
        return (
          <div key={idx} className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-sm font-bold text-blue-400 mb-3 uppercase">
              {t(categoryKey as any)}
            </h3>
            <div className="space-y-2">
              {category.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => onSelectTool(tool.id)}
                  className="w-full text-left px-3 py-2 text-sm text-slate-200 rounded hover:bg-slate-600 transition-colors flex items-center gap-2"
                >
                  <span className="text-base">{tool.icon}</span>
                  <span>{t(tool.nameKey as any)}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
