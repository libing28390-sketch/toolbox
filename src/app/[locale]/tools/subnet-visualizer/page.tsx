"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { networkTools } from "@/lib/network-tools";

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
  // draft input (what user is typing) vs applied input (what grid is showing)
  const [draftInput, setDraftInput] = useState("192.168.1.0/24");
  const [appliedInput, setAppliedInput] = useState("192.168.1.0/24");
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const applied = useMemo(() => {
    try {
      const res = networkTools.calculateSubnet(appliedInput);
      if (res.type !== "IPv4" || !res.broadcastAddress) {
        return { ok: false as const, error: "Only IPv4 visualization is supported (for now)." };
      }
      return { ok: true as const, res };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid input";
      return { ok: false as const, error: msg };
    }
  }, [appliedInput]);

  // We always render a /24 grid (god's-eye view). If applied CIDR isn't /24,
  // we highlight the subnet range *within* the /24 that contains the subnet network address.
  const base = useMemo(() => {
    const fallback = {
      base24Network: ipToNumber("192.168.1.0"),
      base24Text: "192.168.1.0/24",
      startIndex: 0,
      endIndex: 255,
      gatewayIndex: 1,
      subnetNetworkText: "192.168.1.0",
      subnetBroadcastText: "192.168.1.255",
      cidr: 24,
      subnetMask: "255.255.255.0",
      note: null as string | null,
    };

    if (!applied.ok) return fallback;

    const { res } = applied;
    const subnetNetworkNum = ipToNumber(res.networkAddress);
    const subnetBroadcastNum = ipToNumber(res.broadcastAddress!);

    const base24Network = (subnetNetworkNum & 0xffffff00) >>> 0;
    const base24Text = `${numberToIp(base24Network)}/24`;

    const startIndex = Math.max(0, Math.min(255, (subnetNetworkNum - base24Network) >>> 0));
    const endIndex = Math.max(0, Math.min(255, (subnetBroadcastNum - base24Network) >>> 0));

    // default "gateway" heuristic: first usable (network+1) when there is room
    const gatewayIndex =
      res.cidr >= 31 ? null : Math.max(0, Math.min(255, startIndex + 1));

    const note =
      res.cidr < 24
        ? "Note: this subnet spans multiple /24 blocks; showing the /24 containing the subnet's network address."
        : null;

    return {
      base24Network,
      base24Text,
      startIndex,
      endIndex,
      gatewayIndex,
      subnetNetworkText: res.networkAddress,
      subnetBroadcastText: res.broadcastAddress!,
      cidr: res.cidr,
      subnetMask: res.subnetMask,
      note,
    };
  }, [applied]);

  const cells = useMemo(() => {
    const arr = new Array(256).fill(0).map((_, i) => {
      const ipNum = (base.base24Network + i) >>> 0;
      const ip = numberToIp(ipNum);
      const octet = i; // 0..255

      const inSubnet = i >= base.startIndex && i <= base.endIndex;
      let type:
        | "outside"
        | "subnetNetwork"
        | "subnetGateway"
        | "subnetBroadcast"
        | "subnetHost" = inSubnet ? "subnetHost" : "outside";

      if (i === base.startIndex) type = "subnetNetwork";
      else if (base.gatewayIndex !== null && i === base.gatewayIndex) type = "subnetGateway";
      else if (i === base.endIndex) type = "subnetBroadcast";

      return { index: i, ipNum, ip, octet, type, inSubnet };
    });
    return arr;
  }, [base]);

  const handleApply = () => {
    const next = draftInput.trim();
    try {
      const res = networkTools.calculateSubnet(next);
      if (res.type !== "IPv4") throw new Error("Only IPv4 is supported for this visualizer.");
      setAppliedInput(next);
      setHovered(null);
      setSelected(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid input";
      toast.error(msg);
    }
  };

  const handleReset = () => {
    setDraftInput("192.168.1.0/24");
    setAppliedInput("192.168.1.0/24");
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
            value={draftInput}
            onChange={(e) => setDraftInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApply();
            }}
            className="px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-sm"
            placeholder="Enter IPv4 or IPv4/CIDR (e.g. 192.168.2.0/26)"
          />
          <Button onClick={handleApply} disabled={draftInput.trim() === appliedInput.trim()}>
            Apply
          </Button>
          <Button variant="secondary" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <div className="px-3 py-1 rounded bg-zinc-900 border border-zinc-800 font-mono">
          Grid: {base.base24Text}
        </div>
        {applied.ok ? (
          <>
            <div className="px-3 py-1 rounded bg-zinc-900 border border-zinc-800 font-mono">
              Subnet: {applied.res.networkAddress}/{applied.res.cidr}
            </div>
            <div className="px-3 py-1 rounded bg-zinc-900 border border-zinc-800 font-mono">
              Mask: {applied.res.subnetMask}
            </div>
          </>
        ) : (
          <div className="px-3 py-1 rounded bg-rose-950/60 border border-rose-900 text-rose-200">
            {applied.error}
          </div>
        )}
        {base.note ? (
          <div className="text-xs text-muted-foreground">{base.note}</div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 shadow-lg">
            <div className="grid grid-cols-16 gap-1">
              {cells.map((c) => {
                const isHovered = hovered === c.index;
                const isSelected = selected === c.index;
                const baseClasses = "w-full h-8 rounded-sm flex items-center justify-center text-[10px] font-mono transition-all duration-150";
                const typeBg =
                  c.type === "subnetNetwork"
                    ? "bg-amber-500 text-zinc-900"
                    : c.type === "subnetGateway"
                      ? "bg-emerald-500 text-zinc-900"
                      : c.type === "subnetBroadcast"
                        ? "bg-rose-500 text-zinc-900"
                        : c.type === "subnetHost"
                          ? "bg-slate-800 text-zinc-200 hover:bg-blue-500 hover:text-white"
                          : "bg-slate-950 text-zinc-500 opacity-60";
                return (
                  <Tooltip
                    key={c.index}
                    content={
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-xs">{c.ip}</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard?.writeText(c.ip);
                            try { toast.success('IP copied'); } catch {}
                          }}
                          className="ml-2 text-xs px-2 py-0.5 rounded bg-zinc-800/60 hover:bg-zinc-700"
                        >
                          Copy
                        </button>
                      </div>
                    }
                  >
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
            {applied.ok ? (
              <div className="mb-3 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center justify-between gap-2">
                  <span>Network</span>
                  <span className="font-mono text-zinc-200">{applied.res.networkAddress}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Broadcast</span>
                  <span className="font-mono text-zinc-200">{applied.res.broadcastAddress}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Usable</span>
                  <span className="font-mono text-zinc-200">
                    {applied.res.firstUsable && applied.res.lastUsable
                      ? `${applied.res.firstUsable} – ${applied.res.lastUsable}`
                      : "N/A"}
                  </span>
                </div>
              </div>
            ) : null}
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
                <div className="flex-1 px-2 py-1 rounded bg-amber-600 text-black text-xs text-center">Subnet Network</div>
                <div className="flex-1 px-2 py-1 rounded bg-emerald-600 text-black text-xs text-center">Gateway (heuristic)</div>
              </div>
              <div className="flex gap-2 mt-2">
                <div className="flex-1 px-2 py-1 rounded bg-slate-800 text-xs text-center">Usable Hosts</div>
                <div className="flex-1 px-2 py-1 rounded bg-rose-600 text-black text-xs text-center">Subnet Broadcast</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
