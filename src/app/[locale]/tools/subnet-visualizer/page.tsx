"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Types ---
type SubnetNode = {
  cidr: string;
  isSplit: boolean;
  children?: [SubnetNode, SubnetNode] | null;
};

// --- IP helper functions (IPv4 only) ---
function ipToNumber(ip: string) {
  const parts = ip.split(".").map((p) => parseInt(p, 10));
  return (
    ((parts[0] || 0) << 24) |
    ((parts[1] || 0) << 16) |
    ((parts[2] || 0) << 8) |
    (parts[3] || 0)
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

function prefixToMask(prefix: number) {
  return prefix === 0 ? 0 : (~((1 << (32 - prefix)) - 1)) >>> 0;
}

function parseCidr(cidr: string) {
  const [ip, p] = cidr.split("/");
  const prefix = p ? parseInt(p, 10) : 32;
  const network = ipToNumber(ip) & prefixToMask(prefix);
  return { network, prefix };
}

function formatCidr(network: number, prefix: number) {
  return `${numberToIp(network)}/${prefix}`;
}

function calcBroadcast(network: number, prefix: number) {
  const mask = prefixToMask(prefix);
  return (network | (~mask >>> 0)) >>> 0;
}

function hostCount(prefix: number) {
  if (prefix >= 31) return 0;
  return Math.max(0, (1 << (32 - prefix)) - 2);
}

function netmaskString(prefix: number) {
  return numberToIp(prefixToMask(prefix));
}

function binaryRepresentation(ipNum: number, prefix: number) {
  const bits = ipNum.toString(2).padStart(32, "0");
  const net = bits.slice(0, prefix);
  const host = bits.slice(prefix);
  return { net, host };
}

function splitCidr(cidr: string): [string, string] {
  const { network, prefix } = parseCidr(cidr);
  const newPrefix = prefix + 1;
  const size = 1 << (32 - newPrefix);
  const first = network;
  const second = (network + size) >>> 0;
  return [formatCidr(first, newPrefix), formatCidr(second, newPrefix)];
}

// --- Utilities to update tree by path ---
function cloneNode(node: SubnetNode): SubnetNode {
  return {
    cidr: node.cidr,
    isSplit: node.isSplit,
    children: node.children ? [cloneNode(node.children[0]), cloneNode(node.children[1])] : null,
  };
}

function updateAtPath(root: SubnetNode, path: number[], fn: (n: SubnetNode) => SubnetNode) {
  if (path.length === 0) return fn(cloneNode(root));
  const [head, ...rest] = path;
  const newRoot = cloneNode(root);
  let cursor: SubnetNode = newRoot;
  for (let i = 0; i < path.length - 1; i++) {
    const idx = path[i];
    if (!cursor.children) break;
    cursor = cursor.children[idx] = cloneNode(cursor.children[idx]);
  }
  const lastIdx = path[path.length - 1];
  if (!cursor.children) return newRoot;
  cursor.children[lastIdx] = fn(cloneNode(cursor.children[lastIdx]));
  return newRoot;
}

// --- React Components ---
function InfoLines({ cidr }: { cidr: string }) {
  const { network, prefix } = parseCidr(cidr);
  const broadcast = calcBroadcast(network, prefix);
  const hosts = hostCount(prefix);
  const firstUsable = hosts > 0 ? numberToIp(network + 1) : numberToIp(network);
  const lastUsable = hosts > 0 ? numberToIp(broadcast - 1) : numberToIp(broadcast);
  return (
    <div className="text-xs leading-snug">
      <div className="font-mono text-sm">{cidr}</div>
      <div className="text-muted-foreground">{hosts} hosts</div>
      <div className="text-muted-foreground">{firstUsable} - {lastUsable}</div>
      <div className="text-muted-foreground">Netmask: {netmaskString(prefix)}</div>
    </div>
  );
}

function Block({
  node,
  path,
  depth,
  onSplit,
  onMerge,
  onSelect,
  selectedPath,
}: {
  node: SubnetNode;
  path: number[];
  depth: number;
  onSplit: (path: number[]) => void;
  onMerge: (path: number[]) => void;
  onSelect: (path: number[]) => void;
  selectedPath: number[] | null;
}) {
  const isSelected = selectedPath && selectedPath.join(",") === path.join(",");

  const baseColor = [
    "from-indigo-600 to-indigo-500",
    "from-sky-600 to-sky-500",
    "from-purple-600 to-purple-500",
    "from-blue-700 to-blue-600",
  ][depth % 4];

  if (node.isSplit && node.children) {
    // alternate split direction by depth
    const dir = depth % 2 === 0 ? "flex-row" : "flex-col";
    return (
      <div className={cn("flex", dir, "w-full h-full overflow-hidden border") }>
        <div className="w-0 flex-1 h-full">
          <Block
            node={node.children[0]}
            path={[...path, 0]}
            depth={depth + 1}
            onSplit={onSplit}
            onMerge={onMerge}
            onSelect={onSelect}
            selectedPath={selectedPath}
          />
        </div>
        <div className="w-0 flex-1 h-full">
          <Block
            node={node.children[1]}
            path={[...path, 1]}
            depth={depth + 1}
            onSplit={onSplit}
            onMerge={onMerge}
            onSelect={onSelect}
            selectedPath={selectedPath}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(path)}
      className={cn(
        "relative flex items-start justify-between p-3 cursor-pointer h-full w-full",
        isSelected ? "ring-2 ring-offset-1 ring-indigo-400" : "",
      )}
    >
      <div className={cn("rounded-sm p-2 w-full h-full bg-gradient-to-br text-white/95", baseColor)}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="font-semibold text-sm">{node.cidr}</div>
            <div className="text-xs opacity-90">
              {hostCount(parseInt(node.cidr.split("/")[1] || "32", 10))} hosts
            </div>
            <div className="text-xs opacity-80">{(() => {
              const { network, prefix } = parseCidr(node.cidr);
              const broadcast = calcBroadcast(network, prefix);
              const first = hostCount(prefix) > 0 ? numberToIp(network + 1) : numberToIp(network);
              const last = hostCount(prefix) > 0 ? numberToIp(broadcast - 1) : numberToIp(broadcast);
              return `${first} - ${last}`;
            })()}</div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="opacity-90 text-[10px]">/{node.cidr.split("/")[1]}</div>
            <div className="flex gap-2">
              {!node.isSplit && (
                <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); onSplit(path); }}>
                  Split
                </Button>
              )}
              {(node.isSplit && node.children) && (
                <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); onMerge(path); }}>
                  Merge
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubnetVisualizerPage() {
  const [root, setRoot] = useState<SubnetNode>({ cidr: "192.168.1.0/24", isSplit: false, children: null });
  const [selectedPath, setSelectedPath] = useState<number[] | null>(null);
  const [inputCidr, setInputCidr] = useState("192.168.1.0/24");

  const handleSplit = (path: number[]) => {
    const node = getNodeByPath(root, path);
    if (!node) return;
    const [a, b] = splitCidr(node.cidr);
    const newRoot = updateAtPath(root, path, (n) => ({ ...n, isSplit: true, children: [{ cidr: a, isSplit: false, children: null }, { cidr: b, isSplit: false, children: null }] }));
    setRoot(newRoot);
  };

  const handleMerge = (path: number[]) => {
    // merging replaces parent; we should set the targeted node to not split and remove children
    const newRoot = updateAtPath(root, path, (n) => ({ ...n, isSplit: false, children: null }));
    setRoot(newRoot);
  };

  const handleSelect = (path: number[]) => {
    setSelectedPath(path);
  };

  const applyRoot = () => {
    setRoot({ cidr: inputCidr, isSplit: false, children: null });
    setSelectedPath(null);
  };

  function getNodeByPath(node: SubnetNode, path: number[]): SubnetNode | null {
    let cursor: SubnetNode | null = node;
    for (let i = 0; i < path.length; i++) {
      if (!cursor || !cursor.children) return null;
      cursor = cursor.children[path[i]];
    }
    return cursor;
  }

  const selectedNode = selectedPath ? getNodeByPath(root, selectedPath) : null;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Visual Subnet Calculator</h1>
          <p className="text-sm text-muted-foreground">Interactively split and merge IPv4 CIDR blocks.</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={inputCidr} onChange={(e) => setInputCidr(e.target.value)} className="px-3 py-2 rounded-md bg-zinc-900 border" />
          <Button onClick={applyRoot}>Apply</Button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-h-[480px] bg-zinc-900 border rounded-md p-2">
          <div className="w-full h-full rounded-md overflow-hidden">
            <Block
              node={root}
              path={[]}
              depth={0}
              onSplit={handleSplit}
              onMerge={handleMerge}
              onSelect={handleSelect}
              selectedPath={selectedPath}
            />
          </div>
        </div>

        <div className="w-80 bg-zinc-950 border rounded-md p-4 sticky top-20">
          <h3 className="font-semibold mb-2">Details</h3>
          {selectedNode ? (
            <div className="space-y-2 text-sm">
              <div className="font-mono">{selectedNode.cidr}</div>
              {(() => {
                const { network, prefix } = parseCidr(selectedNode.cidr);
                const broadcast = calcBroadcast(network, prefix);
                const gateway = hostCount(prefix) > 0 ? numberToIp(network + 1) : "N/A";
                const mask = netmaskString(prefix);
                const bin = binaryRepresentation(network, prefix);
                return (
                  <div className="space-y-1">
                    <div>Network: {numberToIp(network)}</div>
                    <div>Broadcast: {numberToIp(broadcast)}</div>
                    <div>Gateway: {gateway}</div>
                    <div>Netmask: {mask}</div>
                    <div className="mt-2">
                      <div className="text-xs">Binary</div>
                      <div className="font-mono text-xs break-words">
                        <span className="text-green-300">{bin.net}</span>
                        <span className="text-zinc-500">{bin.host}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Select a block to see details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
