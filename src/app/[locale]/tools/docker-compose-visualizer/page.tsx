'use client';

import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  addEdge,
  MarkerType,
  Handle,
  Position,
  NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import Editor from '@monaco-editor/react';
import yaml from 'js-yaml';
import { Download, Plus, Save, Play, Layers, Box, Globe, Database, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---
interface Service {
  image?: string;
  ports?: string[];
  volumes?: string[];
  environment?: string[] | Record<string, string>;
  depends_on?: string[];
  links?: string[];
  [key: string]: any;
}

interface DockerCompose {
  version?: string;
  services?: Record<string, Service>;
  volumes?: Record<string, any>;
  networks?: Record<string, any>;
}

// --- Custom Node Component ---
const ServiceNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={cn(
      "min-w-[180px] bg-[#18181b] rounded-lg border transition-all duration-200 shadow-xl overflow-hidden group",
      selected ? "border-blue-500 shadow-blue-500/20" : "border-zinc-700 hover:border-zinc-500"
    )}>
      {/* Header */}
      <div className="bg-zinc-900/50 p-3 border-b border-zinc-800 flex items-center gap-2">
        <div className={cn(
          "p-1.5 rounded-md",
          data.serviceName.includes('db') || data.serviceName.includes('redis') || data.serviceName.includes('mongo') ? "bg-red-500/20 text-red-400" :
          data.serviceName.includes('web') || data.serviceName.includes('app') || data.serviceName.includes('node') ? "bg-blue-500/20 text-blue-400" :
          data.serviceName.includes('nginx') ? "bg-green-500/20 text-green-400" :
          "bg-zinc-700/50 text-zinc-400"
        )}>
          {data.serviceName.includes('db') || data.serviceName.includes('redis') || data.serviceName.includes('mongo') ? <Database size={14} /> :
           data.serviceName.includes('web') || data.serviceName.includes('app') ? <Globe size={14} /> :
           data.serviceName.includes('nginx') ? <Server size={14} /> :
           <Box size={14} />}
        </div>
        <span className="font-bold text-zinc-200 text-sm">{data.serviceName}</span>
      </div>
      
      {/* Body */}
      <div className="p-3 space-y-2">
        {data.image && (
          <div className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
            <Layers size={12} className="text-zinc-600" />
            <span className="truncate max-w-[140px]" title={data.image}>{data.image}</span>
          </div>
        )}
        {data.ports && data.ports.length > 0 && (
          <div className="flex flex-wrap gap-1">
             {data.ports.map((p: string, i: number) => (
                <span key={i} className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700 font-mono">
                  {p}
                </span>
             ))}
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-2 !h-2 !-top-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-2 !h-2 !-bottom-1 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

const nodeTypes = {
  service: ServiceNode,
};

// --- Default Template ---
const DEFAULT_YAML = `version: '3.8'

services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    depends_on:
      - api
    volumes:
      - ./html:/usr/share/nginx/html

  api:
    image: node:18-alpine
    environment:
      - NODE_ENV=production
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=secret
    volumes:
      - db-data:/var/lib/postgresql/data

  redis:
    image: redis:alpine

volumes:
  db-data:
`;

export default function DockerComposeVisualizer() {
  const [yamlContent, setYamlContent] = useState(DEFAULT_YAML);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState<string | null>(null);

  // Parse YAML to Nodes/Edges
  const parseYamlToGraph = useCallback((content: string) => {
    try {
      const parsed = yaml.load(content) as DockerCompose;
      if (!parsed || !parsed.services) return;

      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      const services = Object.entries(parsed.services);
      
      // Simple grid layout logic
      const spacingX = 250;
      const spacingY = 150;
      const cols = 3;

      services.forEach(([name, config], index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;

        newNodes.push({
          id: name,
          type: 'service',
          position: { x: col * spacingX + 50, y: row * spacingY + 50 },
          data: { 
            serviceName: name,
            image: config.image,
            ports: config.ports
          },
        });

        // Dependencies
        if (config.depends_on) {
          config.depends_on.forEach((dep) => {
            newEdges.push({
              id: `${name}-${dep}`,
              source: dep, // Dependency is the source (must start first)
              target: name,
              animated: true,
              style: { stroke: '#3b82f6', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
            });
          });
        }
      });

      setNodes(newNodes);
      setEdges(newEdges);
      setError(null);
    } catch (e: any) {
      console.error("YAML Parse Error", e);
      // Don't clear nodes immediately on typing error to avoid flickering
      setError(e.message);
    }
  }, [setNodes, setEdges]);

  // Initial Load
  useEffect(() => {
    parseYamlToGraph(yamlContent);
  }, []);

  // Handle Editor Change
  const handleEditorChange = (value: string | undefined) => {
    if (value) {
      setYamlContent(value);
      parseYamlToGraph(value);
    }
  };

  // Handle React Flow Connection (Add depends_on)
  const onConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target) return;
    
    // Add visual edge immediately
    setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#3b82f6' } }, eds));

    // Update YAML
    try {
        const parsed = yaml.load(yamlContent) as DockerCompose;
        if (parsed && parsed.services && parsed.services[params.target]) {
            const targetService = parsed.services[params.target];
            const sourceService = params.source; // The dependency

            // Init depends_on array if not exists
            if (!targetService.depends_on) {
                targetService.depends_on = [];
            }

            // Avoid duplicates
            if (!targetService.depends_on.includes(sourceService)) {
                targetService.depends_on.push(sourceService);
                const newYaml = yaml.dump(parsed);
                setYamlContent(newYaml);
            }
        }
    } catch (e) {
        console.error("Failed to update YAML from connection", e);
    }
  }, [yamlContent, setEdges]);

  const handleDownload = () => {
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'docker-compose.yml';
    a.click();
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-[#09090b] text-white overflow-hidden">
      {/* Left: Editor */}
      <div className="w-1/2 h-full flex flex-col border-r border-white/10">
        <div className="h-10 bg-[#18181b] border-b border-white/10 flex items-center justify-between px-4">
           <span className="text-xs font-mono text-zinc-400">docker-compose.yml</span>
           <div className="flex items-center gap-2">
             {error && <span className="text-xs text-red-400 mr-2">{error}</span>}
             <button onClick={handleDownload} className="text-zinc-400 hover:text-white transition-colors">
                <Download size={14} />
             </button>
           </div>
        </div>
        <div className="flex-1 overflow-hidden">
            <Editor
                height="100%"
                defaultLanguage="yaml"
                theme="vs-dark"
                value={yamlContent}
                onChange={handleEditorChange}
                options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                }}
            />
        </div>
      </div>

      {/* Right: Visualizer */}
      <div className="w-1/2 h-full bg-[#0c0c0e] relative">
         <div className="absolute top-4 right-4 z-10 bg-[#18181b]/80 backdrop-blur border border-white/10 rounded-lg p-2">
            <div className="text-[10px] text-zinc-500 font-mono mb-1">TIPS</div>
            <div className="text-xs text-zinc-400">Drag connections to add <span className="text-blue-400">depends_on</span></div>
         </div>
         <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-[#0c0c0e]"
            minZoom={0.2}
         >
            <Background color="#222" gap={20} size={1} />
            <Controls className="!bg-[#18181b] !border-white/10 [&>button]:!fill-zinc-400 [&>button:hover]:!fill-white" />
         </ReactFlow>
      </div>
    </div>
  );
}
