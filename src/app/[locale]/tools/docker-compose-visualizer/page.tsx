'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  EdgeChange,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import Editor from '@monaco-editor/react';
import yaml from 'js-yaml';
import { Download, Plus, Save, Play, Layers, Box, Globe, Database, Server, Settings, FileCode, Wand2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

const TEMPLATES = {
  redis: `  redis:
    image: redis:alpine
    restart: always`,
  mysql: `  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: app_db
    ports:
      - "3306:3306"`,
  nginx: `  nginx:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro`,
  node: `  app:
    image: node:18-alpine
    working_dir: /app
    command: npm start
    ports:
      - "3000:3000"`
};

export default function DockerComposeVisualizer() {
  const [yamlContent, setYamlContent] = useState(DEFAULT_YAML);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Edit Node State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    serviceName: '',
    image: '',
    ports: '',
    volumes: ''
  });

  // Parse YAML to Nodes/Edges
  const parseYamlToGraph = useCallback((content: string) => {
    try {
      const parsed = yaml.load(content) as DockerCompose;
      if (!parsed || !parsed.services) return;

      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      const services = Object.entries(parsed.services);
      
      // Calculate layout
      // Simple grid for now, but preserving positions if node already exists could be an enhancement
      const spacingX = 300;
      const spacingY = 200;
      const cols = 3;

      services.forEach(([name, config], index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;

        // Try to find existing node to preserve position if possible (basic)
        // For full preservation we need to store layout in state/localstorage, 
        // but here we just re-layout to keep it simple and consistent with YAML order.
        
        newNodes.push({
          id: name,
          type: 'service',
          position: { x: col * spacingX + 50, y: row * spacingY + 50 },
          data: { 
            serviceName: name,
            image: config.image,
            ports: config.ports,
            volumes: config.volumes
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
      // Debounce parsing could be added here for performance
      parseYamlToGraph(value);
    }
  };

  // Handle Edge Connection (Add depends_on)
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
                const newYaml = yaml.dump(parsed, { indent: 2 });
                setYamlContent(newYaml);
            }
        }
    } catch (e) {
        console.error("Failed to update YAML from connection", e);
    }
  }, [yamlContent, setEdges]);

  // Handle Edge Deletion (Remove depends_on)
  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
      try {
          const parsed = yaml.load(yamlContent) as DockerCompose;
          let changed = false;

          edgesToDelete.forEach(edge => {
              // Edge id format: "target-source" or generated. 
              // Better rely on source/target props
              const targetName = edge.target;
              const sourceName = edge.source;

              if (parsed && parsed.services && parsed.services[targetName]) {
                  const targetService = parsed.services[targetName];
                  if (targetService.depends_on) {
                      const idx = targetService.depends_on.indexOf(sourceName);
                      if (idx > -1) {
                          targetService.depends_on.splice(idx, 1);
                          // Remove key if empty
                          if (targetService.depends_on.length === 0) {
                              delete targetService.depends_on;
                          }
                          changed = true;
                      }
                  }
              }
          });

          if (changed) {
              const newYaml = yaml.dump(parsed, { indent: 2 });
              setYamlContent(newYaml);
          }
      } catch (e) {
          console.error("Failed to update YAML from edge deletion", e);
      }
  }, [yamlContent]);

  // Handle Node Double Click (Edit)
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
      setEditingNodeId(node.id);
      setEditForm({
          serviceName: node.data.serviceName,
          image: node.data.image || '',
          ports: node.data.ports ? node.data.ports.join(', ') : '',
          volumes: node.data.volumes ? node.data.volumes.join(', ') : ''
      });
      setIsEditOpen(true);
  }, []);

  // Save Node Edit
  const handleSaveNode = () => {
      if (!editingNodeId) return;

      try {
          const parsed = yaml.load(yamlContent) as DockerCompose;
          if (!parsed.services) return;

          // If service name changed, we need to handle renaming
          const oldName = editingNodeId;
          const newName = editForm.serviceName;
          
          let serviceConfig = parsed.services[oldName];

          // Update Fields
          serviceConfig.image = editForm.image;
          
          // Ports
          if (editForm.ports.trim()) {
              serviceConfig.ports = editForm.ports.split(',').map(p => p.trim());
          } else {
              delete serviceConfig.ports;
          }

          // Volumes
          if (editForm.volumes.trim()) {
              serviceConfig.volumes = editForm.volumes.split(',').map(v => v.trim());
          } else {
              delete serviceConfig.volumes;
          }

          // Handle Renaming
          if (oldName !== newName) {
              // Delete old key
              delete parsed.services[oldName];
              // Assign to new key
              parsed.services[newName] = serviceConfig;
              
              // We also need to update depends_on references in OTHER services!
              Object.values(parsed.services).forEach(svc => {
                  if (svc.depends_on) {
                      const idx = svc.depends_on.indexOf(oldName);
                      if (idx > -1) {
                          svc.depends_on[idx] = newName;
                      }
                  }
              });
          }

          const newYaml = yaml.dump(parsed, { 
            indent: 2, 
            lineWidth: -1,
            noRefs: true,
            flowLevel: -1 
          });
          setYamlContent(newYaml);
          parseYamlToGraph(newYaml); // Update graph immediately
          setIsEditOpen(false);
          toast({ title: "Service Updated", description: `Updated ${newName} configuration.` });

      } catch (e: any) {
          console.error("Failed to save node edit", e);
          toast({ title: "Error", description: "Failed to update YAML. Check console.", variant: "destructive" });
      }
  };

  // Toolbar Actions
  const handleFormat = () => {
      try {
          const parsed = yaml.load(yamlContent);
          const formatted = yaml.dump(parsed, { 
            indent: 2, 
            lineWidth: -1,
            noRefs: true,
            flowLevel: -1 
          });
          setYamlContent(formatted);
          toast({ title: "Formatted", description: "YAML formatted successfully." });
      } catch (e) {
          toast({ title: "Format Failed", description: "Invalid YAML content.", variant: "destructive" });
      }
  };

  const handleQuickAdd = (templateKey: string) => {
      try {
          const template = TEMPLATES[templateKey as keyof typeof TEMPLATES];
          // We need to append this string to the services section.
          // Simple string append is risky, let's parse -> add -> dump
          const parsed = yaml.load(yamlContent) as DockerCompose;
          if (!parsed.services) parsed.services = {};

          // Generate unique name
          let baseName = templateKey === 'node' ? 'app' : templateKey;
          let newName = baseName;
          let counter = 1;
          while (parsed.services[newName]) {
              newName = `${baseName}-${counter}`;
              counter++;
          }

          // Parse template string to object (hacky but works for simple templates)
          // Actually, let's just use hardcoded objects for templates instead of strings next time.
          // For now, let's parse the template string locally.
          const tempObj = yaml.load(template) as Record<string, any>;
          const serviceConfig = Object.values(tempObj)[0];

          parsed.services[newName] = serviceConfig;
          
          const newYaml = yaml.dump(parsed, { indent: 2 });
          setYamlContent(newYaml);
          parseYamlToGraph(newYaml); // Force refresh
          toast({ title: "Service Added", description: `Added ${newName} to configuration.` });

      } catch (e) {
          console.error(e);
          toast({ title: "Error", description: "Failed to add template.", variant: "destructive" });
      }
  };

  const handleDownload = () => {
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'docker-compose.yml';
    a.click();
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-[#09090b] text-white overflow-hidden font-sans">
      {/* Left: Editor */}
      <div className="w-1/2 h-full flex flex-col border-r border-white/10">
        <div className="h-12 bg-[#18181b] border-b border-white/10 flex items-center justify-between px-4">
           <div className="flex items-center gap-3">
               <span className="text-xs font-mono text-zinc-400">docker-compose.yml</span>
               {error && <span className="text-xs text-red-400 flex items-center gap-1"><X size={12}/> Invalid YAML</span>}
           </div>
           
           <div className="flex items-center gap-2">
             <Button variant="ghost" size="sm" onClick={handleFormat} className="h-8 text-zinc-400 hover:text-white" title="Format YAML">
                <Wand2 size={14} className="mr-1" /> Format
             </Button>
             
             <Select onValueChange={handleQuickAdd}>
                <SelectTrigger className="h-8 w-[130px] bg-zinc-800 border-zinc-700 text-xs">
                    <SelectValue placeholder="Quick Add" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="redis">Redis</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="nginx">Nginx</SelectItem>
                    <SelectItem value="node">Node.js App</SelectItem>
                </SelectContent>
             </Select>

             <div className="w-px h-4 bg-zinc-700 mx-1" />

             <button onClick={handleDownload} className="text-zinc-400 hover:text-white transition-colors p-2 rounded hover:bg-zinc-800">
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
         <div className="absolute top-4 right-4 z-10 bg-[#18181b]/90 backdrop-blur border border-white/10 rounded-lg p-3 shadow-xl">
            <div className="text-[10px] text-zinc-500 font-bold mb-1 uppercase tracking-wider">Instructions</div>
            <ul className="text-xs text-zinc-400 space-y-1">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"/>Drag to connect (depends_on)</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"/>Double-click node to edit</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500"/>Backspace to delete edge</li>
            </ul>
         </div>
         
         <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgesDelete={onEdgesDelete}
            onNodeDoubleClick={onNodeDoubleClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-[#0c0c0e]"
            minZoom={0.2}
            deleteKeyCode={['Backspace', 'Delete']}
            panActivationKeyCode={null}
            preventScrolling={false}
         >
            <Background color="#222" gap={20} size={1} />
            <Controls className="!bg-[#18181b] !border-white/10 [&>button]:!fill-zinc-400 [&>button:hover]:!fill-white" />
         </ReactFlow>
      </div>

      {/* Edit Node Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-[#18181b] border-zinc-800 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Settings size={18} className="text-blue-500" />
                Edit Service
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-zinc-400">Service Name</Label>
              <Input
                id="name"
                value={editForm.serviceName}
                onChange={(e) => setEditForm({ ...editForm, serviceName: e.target.value })}
                className="bg-zinc-900 border-zinc-700 focus:border-blue-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image" className="text-zinc-400">Image</Label>
              <Input
                id="image"
                value={editForm.image}
                onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                className="bg-zinc-900 border-zinc-700 focus:border-blue-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ports" className="text-zinc-400">Ports (comma separated)</Label>
              <Input
                id="ports"
                placeholder="80:80, 3000:3000"
                value={editForm.ports}
                onChange={(e) => setEditForm({ ...editForm, ports: e.target.value })}
                className="bg-zinc-900 border-zinc-700 focus:border-blue-500 font-mono text-xs"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="volumes" className="text-zinc-400">Volumes (comma separated)</Label>
              <Input
                id="volumes"
                placeholder="./data:/data"
                value={editForm.volumes}
                onChange={(e) => setEditForm({ ...editForm, volumes: e.target.value })}
                className="bg-zinc-900 border-zinc-700 focus:border-blue-500 font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="text-zinc-400 hover:text-white hover:bg-zinc-800">Cancel</Button>
            <Button onClick={handleSaveNode} className="bg-blue-600 hover:bg-blue-500 text-white">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
