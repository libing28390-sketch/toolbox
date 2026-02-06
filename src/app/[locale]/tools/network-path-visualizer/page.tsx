"use client";

import React, { useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  ConnectionLineType,
  Controls,
  Edge,
  Node,
  Panel,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  NodeProps,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AlertCircle, ArrowRight, Download, Globe2, Map, Network, Route } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Hop = {
  index: number;
  host?: string;
  ip?: string;
  avgRttMs?: number;
  minRttMs?: number;
  maxRttMs?: number;
  loss?: number;
};

const sampleTraceroute = [
  'traceroute to toolbox-pearl.vercel.app (76.76.21.21), 30 hops max',
  ' 1  192.168.1.1 (192.168.1.1)  1.123 ms  0.852 ms  0.801 ms',
  ' 2  10.0.0.1 (10.0.0.1)  3.210 ms  3.001 ms  2.944 ms',
  ' 3  backbone.example.net (203.0.113.2)  15.233 ms  15.018 ms  14.995 ms',
  ' 4  198.51.100.10 (198.51.100.10)  25.812 ms  25.601 ms  25.422 ms',
  ' 5  76.76.21.21 (76.76.21.21)  40.120 ms  39.998 ms  39.876 ms',
].join('\n');

const HopNode = ({ data }: NodeProps) => {
  const severity =
    data.avgRttMs == null
      ? 'unknown'
      : data.avgRttMs < 20
        ? 'good'
        : data.avgRttMs < 80
          ? 'medium'
          : 'bad';

  const badgeColor =
    severity === 'good'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
      : severity === 'medium'
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
        : severity === 'bad'
          ? 'bg-rose-500/20 text-rose-300 border-rose-500/60'
          : 'bg-zinc-800/60 text-zinc-400 border-zinc-700';

  return (
    <div className="rounded-xl border border-zinc-700/70 bg-zinc-950 px-4 py-3 shadow-lg min-w-[220px]">
      <Handle type="target" position={Position.Left} className="!bg-cyan-400 !w-2 !h-2" />
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center text-[11px] text-zinc-400">
            {data.index}
          </div>
          <span className="text-xs font-mono text-zinc-300 truncate max-w-[150px]">
            {data.host || data.ip || '*'}
          </span>
        </div>
        <span
          className={cn(
            'text-[10px] px-1.5 py-0.5 rounded-full border font-mono uppercase tracking-wide',
            badgeColor,
          )}
        >
          {data.avgRttMs != null ? `${data.avgRttMs.toFixed(1)} ms` : 'N/A'}
        </span>
      </div>
      {data.ip && (
        <div className="text-[10px] font-mono text-zinc-500 truncate mb-1">{data.ip}</div>
      )}
      <div className="h-1.5 rounded-full bg-zinc-900 overflow-hidden mt-1">
        {data.avgRttMs != null && (
          <div
            className={cn(
              'h-full rounded-full transition-all',
              severity === 'good'
                ? 'bg-emerald-400'
                : severity === 'medium'
                  ? 'bg-amber-400'
                  : 'bg-rose-400',
            )}
            style={{ width: `${Math.min(100, (data.avgRttMs / 150) * 100)}%` }}
          />
        )}
      </div>
      {data.minRttMs != null && data.maxRttMs != null && (
        <div className="mt-1 flex justify-between text-[10px] text-zinc-500 font-mono">
          <span>min {data.minRttMs.toFixed(1)} ms</span>
          <span>max {data.maxRttMs.toFixed(1)} ms</span>
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  hop: HopNode,
};

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

function buildGraph(hops: Hop[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  hops.forEach((hop, i) => {
    const id = `hop-${hop.index}`;
    nodes.push({
      id,
      type: 'hop',
      position: { x: i * 260, y: 0 },
      data: {
        index: hop.index,
        host: hop.host,
        ip: hop.ip,
        avgRttMs: hop.avgRttMs,
        minRttMs: hop.minRttMs,
        maxRttMs: hop.maxRttMs,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });

    if (i > 0) {
      const prevId = `hop-${hops[i - 1].index}`;
      edges.push({
        id: `e-${prevId}-${id}`,
        source: prevId,
        target: id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#22d3ee' },
      });
    }
  });

  return { nodes, edges };
}

const PathVisualizerInner = () => {
  const [input, setInput] = useState(sampleTraceroute);
  const hops = useMemo(() => parseTraceroute(input), [input]);
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => buildGraph(hops), [hops]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    const id = requestAnimationFrame(() => {
      fitView({ padding: 0.2, includeHiddenNodes: true });
    });
    return () => cancelAnimationFrame(id);
  }, [initialNodes, initialEdges, setNodes, setEdges, fitView]);

  const handleCopySample = () => {
    setInput(sampleTraceroute);
    toast.success('已填充示例 traceroute 输出');
  };

  const handleDownloadSvg = async () => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!viewport) return;
    try {
      const blob = new Blob([viewport.outerHTML], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'network-path.svg';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('导出失败，可以直接截图保存。');
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] w-full bg-[#020617] text-white rounded-2xl overflow-hidden border border-zinc-800">
      {/* Left: Input */}
      <div className="w-full md:w-1/3 h-full border-r border-zinc-800 flex flex-col bg-[#020617]">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <Route className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-sm font-semibold">Traceroute / MTR Output</div>
              <div className="text-[11px] text-zinc-500">从终端粘贴 traceroute / tracert / mtr 文本</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopySample}
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

      {/* Right: Graph */}
      <div className="flex-1 h-full relative bg-[#020617]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          minZoom={0.2}
          className="bg-[#020617]"
        >
          <Background color="#111827" gap={24} size={1} />
          <Controls className="bg-[#020617] border-zinc-800 fill-zinc-200 text-zinc-200" />
          <Panel
            position="top-left"
            className="m-3 px-3 py-2 rounded-lg bg-black/60 border border-zinc-800 text-[11px] flex items-center gap-2"
          >
            <Network className="w-3 h-3 text-cyan-400" />
            <span className="font-medium text-zinc-200">Path Overview</span>
            {hops.length > 1 && <span className="text-zinc-500">{hops.length} hops</span>}
          </Panel>
          <Panel position="top-right" className="m-3 flex gap-2">
            <button
              type="button"
              onClick={() => fitView({ padding: 0.2, includeHiddenNodes: true })}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-700 text-[11px] text-zinc-200 hover:bg-zinc-800"
            >
              <Map className="w-3 h-3" />
              适应视图
            </button>
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 text-[11px] text-white hover:bg-cyan-500 border border-cyan-500/60"
            >
              <Download className="w-3 h-3" />
              导出 SVG
            </button>
          </Panel>
        </ReactFlow>

        {/* Summary strip at bottom */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/80 to-transparent pointer-events-none h-20 flex items-end">
          <div className="w-full px-4 pb-3 flex items-center justify-between text-[11px] text-zinc-400 pointer-events-auto">
            <div className="flex items-center gap-2">
              <Globe2 className="w-3 h-3" />
              {hops.length ? (
                <span>
                  路径：{hops[0]?.ip || '?'}
                  <ArrowRight className="inline-block w-3 h-3 mx-1 align-middle" />
                  {hops[hops.length - 1]?.ip || '?'}
                </span>
              ) : (
                <span>等待粘贴 traceroute 输出...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NetworkPathVisualizerPage() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40">
          <Route className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-50">
            Network Path Visualizer
          </h1>
          <p className="text-xs md:text-sm text-zinc-400">
            将终端中的 traceroute / tracert / mtr 文本转成可视化路径，帮助你看清每一跳的延迟与结构。
          </p>
        </div>
      </div>
      <ReactFlowProvider>
        <PathVisualizerInner />
      </ReactFlowProvider>
    </div>
  );
}

