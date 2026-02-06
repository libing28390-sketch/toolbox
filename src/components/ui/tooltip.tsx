"use client";

import React from "react";

export function Tooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  return (
    // `group` enables the child hover state to reveal the tooltip content
    <div className="relative inline-block group">
      <div className="relative z-10">{children}</div>
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-2 opacity-0 scale-95 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 mt-2">
        <div className="whitespace-nowrap rounded-md bg-zinc-900 text-white text-xs px-2 py-1 shadow-lg border border-zinc-700">
          {content}
        </div>
      </div>
    </div>
  );
}

export default Tooltip;
