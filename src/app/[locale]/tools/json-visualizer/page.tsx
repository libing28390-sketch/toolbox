'use client';

import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  Panel,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { toPng } from 'html-to-image';
import { Download, Layout, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---
interface JSONData {
  [key: string]: any;
}

// --- Dagre Layout Helper ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 250;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// --- JSON Parsing to Nodes/Edges Helper ---
const processJson = (data: any): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeId = 0;

  const traverse = (obj: any, parentId: string | null = null, labelKey: string = 'Root') => {
    const currentId = `n-${nodeId++}`;
    
    // Determine content label
    let content = '';
    let type: string = typeof obj; // Explicitly type as string
    
    if (obj === null) {
      content = 'null';
      type = 'null';
    } else if (Array.isArray(obj)) {
      content = `Array [${obj.length}]`;
      type = 'array';
    } else if (typeof obj === 'object') {
      content = `Object {${Object.keys(obj).length}}`;
      type = 'object';
    } else {
      content = String(obj);
    }

    // Add Node
    nodes.push({
      id: currentId,
      data: { label: labelKey, content, type },
      position: { x: 0, y: 0 }, // Position will be set by dagre
      type: 'default', // Using default node type but styled via className/style
      style: { 
        background: '#18181b', 
        color: '#fff', 
        border: '1px solid rgba(255,255,255,0.1)', 
        borderRadius: '8px',
        padding: '10px',
        minWidth: '180px',
        fontSize: '12px',
        fontFamily: 'monospace'
      },
    });

    // Add Edge
    if (parentId) {
      edges.push({
        id: `e-${parentId}-${currentId}`,
        source: parentId,
        target: currentId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#3b82f6' },
      });
    }

    // Recursion
    if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        // Skip large arrays or deep nesting if needed, for now process all
        // Limit large arrays for performance? Let's just process.
        traverse(value, currentId, key);
      });
    }
  };

  try {
    traverse(data);
  } catch (e) {
    console.error("Error traversing JSON", e);
  }

  return { nodes, edges };
};

// --- Custom Node Component (Optional, using default for simplicity but styled) ---
// Note: For "premium dark mode", we can stick to default with style overrides or register a custom node.
// Given the requirements "Nodes should be styled as dark cards", inline styles in processJson are used.

// --- Main Component ---
const JsonVisualizer = () => {
  const [jsonInput, setJsonInput] = useState<string>('{\n  "name": "Toolbox",\n  "version": 1.0,\n  "features": [\n    "Visualizer",\n    "Formatter"\n  ],\n  "author": {\n    "name": "Developer",\n    "active": true\n  }\n}');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState<string | null>(null);
  const { fitView } = useReactFlow();

  // Handle Auto Layout
  const onLayout = useCallback((direction = 'LR') => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      direction
    );

    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
    
    // Fit view after a short delay to allow render
    setTimeout(() => {
        window.requestAnimationFrame(() => fitView({ padding: 0.2 }));
    }, 50);
  }, [nodes, edges, setNodes, setEdges, fitView]);

  // Handle JSON Input Change
  useEffect(() => {
    try {
      if (!jsonInput.trim()) {
        setNodes([]);
        setEdges([]);
        setError(null);
        return;
      }
      
      const parsed = JSON.parse(jsonInput);
      setError(null);
      
      const { nodes: newNodes, edges: newEdges } = processJson(parsed);
      
      // Calculate layout immediately
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        newNodes,
        newEdges,
        'LR'
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      // Fit view
      setTimeout(() => {
        window.requestAnimationFrame(() => fitView({ padding: 0.2 }));
      }, 50);

    } catch (e: any) {
      setError(e.message);
      // Keep old nodes/edges if invalid? Or clear? 
      // User experience: better to show error and keep old or show nothing.
      // Let's show error overlay.
    }
  }, [jsonInput, setNodes, setEdges, fitView]);

  // Handle Download
  const onDownload = useCallback(() => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) return;

    toPng(viewport, {
      backgroundColor: '#09090b',
      width: viewport.scrollWidth,
      height: viewport.scrollHeight,
      style: {
          width: '100%',
          height: '100%',
          transform: 'translate(0, 0)', // Reset transform for full capture? 
          // Actually react-flow handles export tricky. 
          // Simplest is to grab the container but react-flow has specific guide.
          // For now, simple toPng on the wrapper often works if we fitView first or similar.
      }
    }).then((dataUrl) => {
      const a = document.createElement('a');
      a.setAttribute('download', 'json-graph.png');
      a.setAttribute('href', dataUrl);
      a.click();
    });
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-white overflow-hidden font-sans">
      {/* Left Pane: Code Editor */}
      <div className="w-1/3 h-full border-r border-white/10 flex flex-col bg-[#09090b] z-10 shadow-xl">
        <div className="p-4 border-b border-white/10 bg-[#09090b] flex justify-between items-center">
          <h2 className="text-lg font-bold text-zinc-100">JSON Input</h2>
          {error && (
             <div className="flex items-center gap-2 text-red-400 text-xs px-2 py-1 bg-red-900/20 rounded border border-red-900/50">
               <AlertCircle size={12} />
               Invalid JSON
             </div>
          )}
        </div>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          className={cn(
            "flex-1 w-full bg-[#09090b] p-4 text-sm font-mono text-zinc-300 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50",
            error && "bg-red-950/10"
          )}
          spellCheck={false}
          placeholder="Paste your JSON here..."
        />
      </div>

      {/* Right Pane: Canvas */}
      <div className="flex-1 h-full relative bg-[#09090b]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          minZoom={0.1}
          className="bg-[#09090b]"
        >
          <Background color="#27272a" gap={20} size={1} />
          <Controls className="bg-[#18181b] border-white/10 fill-white text-white" />
          
          <Panel position="top-right" className="flex gap-2">
             <button
               onClick={() => onLayout('LR')}
               className="flex items-center gap-2 px-3 py-2 bg-[#18181b] hover:bg-[#27272a] text-zinc-200 border border-white/10 rounded-lg shadow-lg transition-colors text-xs font-medium"
             >
               <Layout size={14} />
               Auto Layout
             </button>
             <button
               onClick={onDownload}
               className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 rounded-lg shadow-lg shadow-blue-900/20 transition-all text-xs font-medium"
             >
               <Download size={14} />
               Download Image
             </button>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

// Wrap with Provider for useReactFlow hook
export default function JsonVisualizerPage() {
  return (
    <ReactFlowProvider>
      <JsonVisualizer />
    </ReactFlowProvider>
  );
}
