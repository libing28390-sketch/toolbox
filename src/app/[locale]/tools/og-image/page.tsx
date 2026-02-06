'use client';

import React, { useState, useRef } from 'react';
import { Download, Image as ImageIcon, Layout, Palette, Type, Code, Terminal, Hash, Monitor, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toPng } from 'html-to-image';

const THEMES = [
  { id: 'simple', name: 'Simple', bg: 'bg-white', text: 'text-zinc-900', sub: 'text-zinc-500' },
  { id: 'dark', name: 'Dark', bg: 'bg-zinc-950', text: 'text-white', sub: 'text-zinc-400' },
  { id: 'gradient', name: 'Gradient', bg: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500', text: 'text-white', sub: 'text-white/80' },
  { id: 'midnight', name: 'Midnight', bg: 'bg-gradient-to-tr from-slate-900 to-slate-700', text: 'text-blue-100', sub: 'text-blue-200/60' },
];

const ICONS = {
  Terminal, Code, Hash, Monitor, Smartphone, Layout
};

export default function OgImageGenerator() {
  // State
  const [title, setTitle] = useState('My Awesome Post');
  const [subtitle, setSubtitle] = useState('A deep dive into modern web development');
  const [tag, setTag] = useState('#development');
  const [themeId, setThemeId] = useState('gradient');
  const [iconKey, setIconKey] = useState<keyof typeof ICONS>('Terminal');
  const [customClass, setCustomClass] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  const currentTheme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const CurrentIcon = ICONS[iconKey];

  const handleExport = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(previewRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `og-image-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-[#09090b] text-white overflow-hidden font-sans">
      {/* Left: Controls */}
      <div className="w-[400px] h-full border-r border-white/10 flex flex-col bg-[#09090b] overflow-y-auto p-6 space-y-8">
         <div>
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 mb-1">
               <ImageIcon className="text-purple-500" />
               OG Image Generator
            </h2>
            <p className="text-zinc-400 text-xs">Create social media cover images in seconds.</p>
         </div>

         <div className="space-y-4">
            <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Title</label>
                <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Subtitle</label>
                <textarea 
                    value={subtitle} 
                    onChange={(e) => setSubtitle(e.target.value)}
                    rows={2}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none resize-none"
                />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Tag / Footer</label>
                <input 
                    type="text" 
                    value={tag} 
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full bg-[#18181b] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
            </div>
         </div>

         <div className="space-y-3">
             <label className="text-xs font-medium text-zinc-400 block">Theme</label>
             <div className="grid grid-cols-2 gap-2">
                {THEMES.map(theme => (
                    <button
                        key={theme.id}
                        onClick={() => setThemeId(theme.id)}
                        className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border text-xs transition-all",
                            themeId === theme.id 
                                ? "border-purple-500 bg-purple-500/10 text-white" 
                                : "border-white/10 hover:bg-white/5 text-zinc-400"
                        )}
                    >
                        <div className={cn("w-3 h-3 rounded-full border border-white/20", theme.bg)} />
                        {theme.name}
                    </button>
                ))}
             </div>
         </div>

         <div className="space-y-3">
             <label className="text-xs font-medium text-zinc-400 block">Icon</label>
             <div className="flex flex-wrap gap-2">
                {(Object.keys(ICONS) as Array<keyof typeof ICONS>).map(key => {
                    const Icon = ICONS[key];
                    return (
                        <button
                            key={key}
                            onClick={() => setIconKey(key)}
                            className={cn(
                                "p-2 rounded-lg border transition-all",
                                iconKey === key 
                                    ? "border-purple-500 bg-purple-500/10 text-purple-400" 
                                    : "border-white/10 hover:bg-white/5 text-zinc-400"
                            )}
                        >
                            <Icon size={16} />
                        </button>
                    );
                })}
             </div>
         </div>
         
         <div className="space-y-1">
             <label className="text-xs font-medium text-zinc-400">Custom Tailwind Class (Container)</label>
             <input 
                 type="text" 
                 value={customClass} 
                 onChange={(e) => setCustomClass(e.target.value)}
                 placeholder="e.g. border-4 border-yellow-400"
                 className="w-full bg-[#18181b] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:border-purple-500 focus:outline-none"
             />
         </div>

         <div className="pt-4 border-t border-white/10">
            <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg font-bold shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2"
            >
                {isExporting ? 'Generating...' : <><Download size={18} /> Download PNG</>}
            </button>
         </div>
      </div>

      {/* Right: Preview Canvas */}
      <div className="flex-1 bg-[#0c0c0e] flex items-center justify-center p-8 overflow-hidden relative">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
          />

          {/* The OG Image Container */}
          {/* Aspect Ratio 1200/630 approx 1.91:1 */}
          <div className="relative shadow-2xl shadow-black/50 group">
              <div className="absolute -top-8 left-0 text-xs text-zinc-500 font-mono">1200 x 630</div>
              
              <div 
                ref={previewRef}
                className={cn(
                    "w-[800px] h-[420px] relative flex flex-col p-16 justify-between overflow-hidden",
                    customClass || currentTheme.bg
                )}
              >
                 {/* Decorative Elements */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                 <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                 {/* Top Icon */}
                 <div className="relative z-10">
                    <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl mb-8">
                        <CurrentIcon size={48} className={currentTheme.text} />
                    </div>
                 </div>

                 {/* Text Content */}
                 <div className="relative z-10 space-y-4">
                     <h1 className={cn("text-6xl font-black tracking-tight leading-tight", currentTheme.text)}>
                        {title}
                     </h1>
                     <p className={cn("text-2xl font-medium max-w-[80%]", currentTheme.sub)}>
                        {subtitle}
                     </p>
                 </div>

                 {/* Footer / Tag */}
                 <div className="relative z-10 flex items-center gap-3 mt-auto pt-12">
                     <div className={cn("h-px w-12", currentTheme.text.replace('text-', 'bg-'))} />
                     <span className={cn("text-xl font-mono opacity-80", currentTheme.text)}>
                        {tag}
                     </span>
                 </div>
              </div>
          </div>
      </div>
    </div>
  );
}
