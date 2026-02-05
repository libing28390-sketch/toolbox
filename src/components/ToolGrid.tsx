'use client';

import { useTranslations } from 'next-intl';
import { Tool } from '@/data/tools';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface ToolGridProps {
  tools: Tool[][];
  onSelectTool: (toolId: string) => void;
  selectedToolId: string | null;
  isCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function ToolGrid({ 
  tools, 
  onSelectTool, 
  selectedToolId, 
  isCollapsed,
  onToggleSidebar
}: ToolGridProps) {
  const t = useTranslations();
  // Store expanded category indices
  const [expandedCats, setExpandedCats] = useState<number[]>(tools.map((_, i) => i));

  const toggleCategory = (idx: number) => {
    setExpandedCats(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300">
      <div className="flex-1 overflow-y-auto py-4">
        <div className={cn("space-y-6", isCollapsed ? "px-2" : "px-3")}>
          {tools.map((category, idx) => {
            const categoryKey = category[0]?.categoryKey;
            const isExpanded = expandedCats.includes(idx);

            if (isCollapsed) {
              // Collapsed Mode: Just show icons of all tools (flat list visually, but grouped)
              return (
                <div key={idx} className="space-y-2 border-b border-slate-800 pb-2 last:border-0">
                  {category.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => onSelectTool(tool.id)}
                      title={t(tool.nameKey as any)}
                      className={cn(
                        "w-full flex justify-center p-2 rounded-md transition-colors",
                        selectedToolId === tool.id
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      )}
                    >
                      <span className="text-xl">{tool.icon}</span>
                    </button>
                  ))}
                </div>
              );
            }

            // Expanded Mode: Accordion
            return (
              <div key={idx}>
                <button 
                  onClick={() => toggleCategory(idx)}
                  className="w-full flex items-center justify-between px-3 py-1 mb-2 group"
                >
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-slate-300 transition-colors">
                    {t(categoryKey as any)}
                  </h3>
                  {isExpanded ? (
                    <ChevronDown size={14} className="text-slate-600 group-hover:text-slate-400" />
                  ) : (
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {category.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => onSelectTool(tool.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-3",
                          selectedToolId === tool.id
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        )}
                      >
                        <span className="text-lg opacity-80">{tool.icon}</span>
                        <span className="font-medium">{t(tool.nameKey as any)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Toggle Button */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={onToggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-md text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>
    </div>
  );
}


