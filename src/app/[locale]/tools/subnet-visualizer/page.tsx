"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Redesigned: IP Grid Matrix (16x16) for /24 visualization

function ipToNumber(ip: string) {
  const parts = ip.split(".").map((p) => parseInt(p, 10) || 0);
  return (
    ((parts[0] & 0xff) << 24) |
    ((parts[1] & 0xff) << 16) |
    ((parts[2] & 0xff) << 8) |
    (parts[3] & 0xff)
  ) >>> 0;
}

function numberToIp(n: number) {
  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff,
  ].join(".");
}

function toBinaryString(n: number) {
  return n.toString(2).padStart(8, "0");
}

export default function SubnetVisualizerPage() {
  const [inputIp, setInputIp] = useState("192.168.1.0");
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  // base network number (assume /24) and base parts
  const base = useMemo(() => {
    const num = ipToNumber(inputIp);
    // zero out last octet to get network base
    const network = (num & 0xffffff00) >>> 0;
    const octets = [
      (network >>> 24) & 0xff,
      (network >>> 16) & 0xff,
      (network >>> 8) & 0xff,
      network & 0xff,
    ];
    return { network, octets };
  }, [inputIp]);

  const cells = useMemo(() => {
    const arr = new Array(256).fill(0).map((_, i) => {
      const ipNum = (base.network + i) >>> 0;
      const ip = numberToIp(ipNum);
      const octet = i; // 0..255
      let type: "network" | "gateway" | "broadcast" | "host" = "host";
      if (i === 0) type = "network";
      else if (i === 1) type = "gateway";
      else if (i === 255) type = "broadcast";
      return { index: i, ipNum, ip, octet, type };
    });
    return arr;
  }, [base]);

  const handleApply = () => {
    setHovered(null);
    setSelected(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Visual Subnet Calculator — IP Grid Matrix</h1>
          <p className="text-sm text-muted-foreground">God's-eye view of a /24 subnet — hover to inspect individual IPs.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={inputIp}
            onChange={(e) => setInputIp(e.target.value)}
            className="px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-sm"
            placeholder="Enter an IP (visualize /24)"
          />
          <Button onClick={handleApply}>Apply</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 shadow-lg">
            <div className="grid grid-cols-16 gap-1">
              {cells.map((c) => {
                const isHovered = hovered === c.index;
                const isSelected = selected === c.index;
                const baseClasses = "w-full h-8 rounded-sm flex items-center justify-center text-[10px] font-mono transition-all duration-150";
                const typeBg = c.type === "network" ? "bg-amber-500 text-zinc-900" : c.type === "gateway" ? "bg-emerald-500 text-zinc-900" : c.type === "broadcast" ? "bg-rose-500 text-zinc-900" : "bg-slate-800 text-zinc-200 hover:bg-blue-500 hover:text-white";
                return (
                  <Tooltip key={c.index} content={<div className="text-xs font-mono">{c.ip}</div>}>
                    <div
                      onMouseEnter={() => setHovered(c.index)}
                      onMouseLeave={() => setHovered((h) => (h === c.index ? null : h))}
                      onClick={() => setSelected(c.index)}
                      className={cn(baseClasses, typeBg, isSelected ? "ring-2 ring-offset-1 ring-cyan-400" : "")}
                      title={c.ip}
                    >
                      {c.index}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 sticky top-20">
            <h3 className="font-semibold mb-3">Inspector</h3>
            {hovered !== null ? (
              (() => {
                const c = cells[hovered];
                const bin = c.ip.split('.').map((o) => toBinaryString(parseInt(o, 10))).join('.');
                return (
                  <div className="space-y-2 text-sm">
                    <div className="font-mono text-sm">{c.ip}</div>
                    <div className="text-xs text-muted-foreground">Index: {c.index}</div>
                    <div className="flex gap-2">
                      <div className="px-2 py-1 rounded bg-zinc-800 text-xs">Type: <span className="font-medium">{c.type}</span></div>
                      <div className="px-2 py-1 rounded bg-zinc-800 text-xs">Octet: <span className="font-medium">{c.octet}</span></div>
                    </div>
                    <div className="mt-2 font-mono text-xs break-words bg-black/20 p-2 rounded">{bin}</div>
                  </div>
                );
              })()
            ) : selected !== null ? (
              (() => {
                const c = cells[selected];
                const bin = c.ip.split('.').map((o) => toBinaryString(parseInt(o, 10))).join('.');
                return (
                  <div className="space-y-2 text-sm">
                    <div className="font-mono text-sm">{c.ip}</div>
                    <div className="text-xs text-muted-foreground">Index: {c.index}</div>
                    <div className="mt-2 font-mono text-xs break-words bg-black/20 p-2 rounded">{bin}</div>
                  </div>
                );
              })()
            ) : (
              <div className="text-sm text-muted-foreground">Hover a cell to inspect IP, or click to lock selection.</div>
            )}

            <div className="mt-4">
              <div className="flex gap-2">
                <div className="flex-1 px-2 py-1 rounded bg-amber-600 text-black text-xs text-center">Network (0)</div>
                <div className="flex-1 px-2 py-1 rounded bg-emerald-600 text-black text-xs text-center">Gateway (1)</div>
              </div>
              <div className="flex gap-2 mt-2">
                <div className="flex-1 px-2 py-1 rounded bg-slate-800 text-xs text-center">Usable Hosts</div>
                <div className="flex-1 px-2 py-1 rounded bg-rose-600 text-black text-xs text-center">Broadcast (255)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
