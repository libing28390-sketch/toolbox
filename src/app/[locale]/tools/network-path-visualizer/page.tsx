"use client";

import React, { useMemo, useState } from "react";
import { AlertCircle, ArrowRight, Globe2, Network, Route } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Hop = {
  index: number;
  host?: string;
  ip?: string;
  avgRttMs?: number;
  minRttMs?: number;
  maxRttMs?: number;
};

const sampleTraceroute = [
  "traceroute to toolbox-pearl.vercel.app (76.76.21.21), 30 hops max",
  " 1  192.168.1.1 (192.168.1.1)  1.123 ms  0.852 ms  0.801 ms",
  " 2  10.0.0.1 (10.0.0.1)  3.210 ms  3.001 ms  2.944 ms",
  " 3  backbone.example.net (203.0.113.2)  15.233 ms  15.018 ms  14.995 ms",
  " 4  198.51.100.10 (198.51.100.10)  25.812 ms  25.601 ms  25.422 ms",
  " 5  76.76.21.21 (76.76.21.21)  40.120 ms  39.998 ms  39.876 ms",
].join("\n");

function parseTraceroute(input: string): Hop[] {
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const hops: Hop[] = [];

  for (const line of lines) {
    const hopMatch = line.match(/^(\d+)\s+/);
    if (!hopMatch) continue;

    const index = parseInt(hopMatch[1], 10);

    const ipMatch =
      line.match(/(\d{1,3}(?:\.\d{1,3}){3})/) || // IPv4
      line.match(/([0-9a-fA-F:]+:[0-9a-fA-F:]+)/); // rough IPv6

    const ip = ipMatch ? ipMatch[1] : undefined;

    let host: string | undefined;
    const hostMatch = line.match(/\d+\s+([^\s(]+)\s*\(/);
    if (hostMatch) {
      host = hostMatch[1];
    }

    const rttMatches = [...line.matchAll(/(\d+\.?\d*)\s*ms/g)].map((m) => parseFloat(m[1]));
    let avgRttMs: number | undefined;
    let minRttMs: number | undefined;
    let maxRttMs: number | undefined;
    if (rttMatches.length) {
      const sum = rttMatches.reduce((a, b) => a + b, 0);
      avgRttMs = sum / rttMatches.length;
      minRttMs = Math.min(...rttMatches);
      maxRttMs = Math.max(...rttMatches);
    }

    hops.push({ index, host, ip, avgRttMs, minRttMs, maxRttMs });
  }

  return hops.sort((a, b) => a.index - b.index);
}

function getSeverity(avg?: number) {
  if (avg == null) return "unknown" as const;
  if (avg < 20) return "good" as const;
  if (avg < 80) return "medium" as const;
  return "bad" as const;
}

export default function NetworkPathVisualizerPage() {
  const [input, setInput] = useState(sampleTraceroute);
  const hops = useMemo(() => parseTraceroute(input), [input]);

  const handleFillSample = () => {
    setInput(sampleTraceroute);
    toast.success("已填充示例 traceroute 输出");
  };

  const firstIp = hops[0]?.ip;
  const lastIp = hops[hops.length - 1]?.ip;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40">
          <Route className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-50">
            Network Path Visualizer
          </h1>
          <p className="text-xs md:text-sm text-zinc-400">
            将终端中的 traceroute / tracert / mtr 文本转成路径时间轴，一眼看清每一跳的延迟与结构。
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-[#020617] border border-zinc-800 rounded-2xl overflow-hidden">
        {/* Left: Input */}
        <div className="w-full md:w-[40%] border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col bg-[#020617]">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <Route className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-100">
                  Traceroute / MTR Output
                </div>
                <div className="text-[11px] text-zinc-500">
                  从终端粘贴 <code className="font-mono">traceroute</code> /{" "}
                  <code className="font-mono">tracert</code> /{" "}
                  <code className="font-mono">mtr</code> 文本
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleFillSample}
              className="text-[11px] px-2 py-1 rounded border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              填充示例
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full bg-[#020617] p-3 text-xs font-mono text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/60"
            placeholder="例如：在终端执行 traceroute tool.example.com，然后把输出粘贴到这里。"
          />
          <div className="px-4 py-2 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            本工具只在前端解析文本，不会主动发起真实网络探测。
          </div>
        </div>

        {/* Right: Vertical Timeline */}
        <div className="w-full md:w-[60%] bg-[#020617] p-4 md:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
            <div className="flex items-center gap-2">
              <Network className="w-3 h-3 text-cyan-400" />
              <span className="font-medium text-zinc-100">Path Overview</span>
              {hops.length > 1 && <span>{hops.length} hops</span>}
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                延迟低
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                中等
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/40 text-rose-300">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                较高
              </span>
            </div>
          </div>

          <div className="relative flex-1 overflow-auto pr-2">
            <div className="absolute left-4 top-3 bottom-3 w-px bg-zinc-800" />
            <div className="space-y-3 pl-10">
              {hops.length === 0 && (
                <div className="text-xs text-zinc-500 mt-4">
                  还没有解析到任何 hop。请在左侧粘贴完整的 traceroute 输出。
                </div>
              )}
              {hops.map((hop) => {
                const severity = getSeverity(hop.avgRttMs);
                const dotColor =
                  severity === "good"
                    ? "bg-emerald-400"
                    : severity === "medium"
                      ? "bg-amber-400"
                      : severity === "bad"
                        ? "bg-rose-400"
                        : "bg-zinc-500";

                const badgeColor =
                  severity === "good"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/60"
                    : severity === "medium"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/60"
                      : severity === "bad"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/60"
                        : "bg-zinc-800/60 text-zinc-400 border-zinc-700";

                return (
                  <div key={hop.index} className="relative flex gap-3">
                    <div className="absolute -left-[18px] top-3 w-3 h-3 rounded-full border border-zinc-900 bg-zinc-950 flex items-center justify-center">
                      <div className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />
                    </div>
                    <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 shadow-lg">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-zinc-500">#{hop.index}</span>
                          <span className="text-xs font-mono text-zinc-100 truncate max-w-[180px]">
                            {hop.host || hop.ip || "*"}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full border font-mono",
                            badgeColor,
                          )}
                        >
                          {hop.avgRttMs != null ? `${hop.avgRttMs.toFixed(1)} ms` : "N/A"}
                        </span>
                      </div>
                      {hop.ip && (
                        <div className="text-[11px] font-mono text-zinc-500 truncate mb-1">
                          {hop.ip}
                        </div>
                      )}
                      {hop.minRttMs != null && hop.maxRttMs != null && (
                        <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                          <span>min {hop.minRttMs.toFixed(1)} ms</span>
                          <span>max {hop.maxRttMs.toFixed(1)} ms</span>
                        </div>
                      )}
                      {hop.avgRttMs != null && (
                        <div className="mt-2 h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              severity === "good"
                                ? "bg-emerald-400"
                                : severity === "medium"
                                  ? "bg-amber-400"
                                  : "bg-rose-400",
                            )}
                            style={{ width: `${Math.min(100, (hop.avgRttMs / 150) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-1 text-[11px] text-zinc-500 flex items-center gap-2 border-t border-zinc-800 pt-2">
            <Globe2 className="w-3 h-3" />
            {hops.length ? (
              <span>
                路径：
                <span className="font-mono text-zinc-100">{firstIp || "?"}</span>
                <ArrowRight className="inline-block w-3 h-3 mx-1 align-middle" />
                <span className="font-mono text-zinc-100">{lastIp || "?"}</span>
              </span>
            ) : (
              <span>等待粘贴 traceroute 输出...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

