'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Clock, Calendar, Trash2, AlertTriangle, Info, Plus, Play, Check, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addHours, differenceInMinutes, startOfHour, isSameMinute, formatDistanceToNow, addMinutes } from 'date-fns';
import cronstrue from 'cronstrue';
import { useToast } from '@/hooks/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const cronParser = require('cron-parser');

interface CronJob {
  id: string;
  name: string;
  expression: string;
  color: string;
}

const COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-indigo-500'
];

const PRESETS = [
    { label: 'Every Minute', value: '* * * * *' },
    { label: 'Every 5 Minutes', value: '*/5 * * * *' },
    { label: 'Every 15 Minutes', value: '*/15 * * * *' },
    { label: 'Every Hour', value: '0 * * * *' },
    { label: 'Daily at Midnight', value: '0 0 * * *' },
    { label: 'Daily at 8:00 AM', value: '0 8 * * *' },
    { label: 'Weekly (Monday)', value: '0 0 * * 1' },
    { label: 'Monthly (1st)', value: '0 0 1 * *' },
];

export default function CronTimeline() {
  const { toast } = useToast();
  
  // -- State --
  const [jobs, setJobs] = useState<CronJob[]>([
    { id: '1', name: 'Database Backup', expression: '0 0 * * *', color: COLORS[0] },
    { id: '2', name: 'Health Check', expression: '*/30 * * * *', color: COLORS[1] },
    { id: '3', name: 'Weekly Report', expression: '0 9 * * 1', color: COLORS[2] },
  ]);

  const [isSimpleMode, setIsSimpleMode] = useState(true);
  const [newName, setNewName] = useState('');
  const [cronExpression, setCronExpression] = useState(PRESETS[3].value);
  
  // -- Derived State: Human Readable --
  const humanReadable = useMemo(() => {
    if (!cronExpression) return '';
    try {
        return cronstrue.toString(cronExpression);
    } catch (e) {
        return 'Invalid cron expression';
    }
  }, [cronExpression]);

  // -- Timeline Logic --
  const { timelineData, collisionWarning, jobNextRuns } = useMemo(() => {
    const now = new Date();
    // Start exactly at NOW for accurate forecasting
    const startTime = now;
    const endTime = addHours(startTime, 24);
    const totalMinutes = 24 * 60;

    const executions: { time: Date; jobId: string; jobName: string; color: string; left: number }[] = [];
    const collisions: { time: Date; count: number; left: number }[] = [];
    const jobNextRuns: Record<string, Date> = {};

    let collisionCount = 0;

    jobs.forEach(job => {
        try {
            // Important: Use 'currentDate: startTime' to ensure we find next executions relative to NOW
            const interval = cronParser.parseExpression(job.expression, {
                currentDate: startTime,
                iterator: true
            });

            // Get next run for the card info
            try {
                // Find next run strictly after now
                const nextRun = cronParser.parseExpression(job.expression, { currentDate: new Date() }).next().toDate();
                jobNextRuns[job.id] = nextRun;
            } catch {}

            let count = 0;
            const MAX_DOTS = 100; // Limit dots per job to avoid crash on "* * * * *"

            while (true) {
                if (count > MAX_DOTS) break;
                
                // .next() returns iterator result with value
                const obj = interval.next();
                const date = obj.value.toDate();
                
                if (date > endTime) break;

                // Calculate position relative to startTime (NOW)
                // We use float minutes for smoother positioning
                const diff = (date.getTime() - startTime.getTime()) / (1000 * 60);
                const left = (diff / totalMinutes) * 100;

                // Only add if within view (0-100%)
                if (left >= 0 && left <= 100) {
                    executions.push({
                        time: date,
                        jobId: job.id,
                        jobName: job.name,
                        color: job.color,
                        left
                    });
                }
                count++;
            }
        } catch (e) {
            console.error(`Error parsing job ${job.name}`, e);
        }
    });

    // Detect Collisions (within same minute)
    const timeMap = new Map<string, number>();
    executions.forEach(exec => {
        // Round to minute for collision detection
        const key = startOfHour(exec.time).toISOString() + ':' + exec.time.getMinutes();
        timeMap.set(key, (timeMap.get(key) || 0) + 1);
    });

    timeMap.forEach((count, key) => {
        if (count > 1) {
            // Reconstruct time roughly from key isn't accurate enough for positioning if we used the simplified key above
            // Better to find one of the executions that matches this key
            // But for simplicity, let's find the executions that share this minute
            // Actually, we can just filter executions.
            // Let's iterate executions again to find representative time
            // A simpler way:
        }
    });
    
    // Better Collision Logic: Group by Minute
    const groups: Record<string, typeof executions> = {};
    executions.forEach(exec => {
        const key = Math.floor(exec.time.getTime() / 60000).toString(); // Minute timestamp
        if (!groups[key]) groups[key] = [];
        groups[key].push(exec);
    });

    Object.values(groups).forEach(group => {
        if (group.length > 1) {
            const time = group[0].time;
            const diff = (time.getTime() - startTime.getTime()) / (1000 * 60);
            const left = (diff / totalMinutes) * 100;
            collisions.push({ time, count: group.length, left });
            collisionCount++;
        }
    });

    return { 
        timelineData: { executions, collisions, startTime }, 
        collisionWarning: collisionCount > 0 
            ? `${collisionCount} collisions detected in the next 24 hours!` 
            : null,
        jobNextRuns
    };
  }, [jobs]);

  // -- Handlers --
  const handleAddJob = () => {
    // Single source of truth: cronExpression
    if (!cronExpression) {
        toast({ title: "Error", description: "Please enter a cron expression", variant: "destructive" });
        return;
    }
    
    // Validate
    try {
        cronParser.parseExpression(cronExpression);
    } catch (e: any) {
        console.error("Cron validation failed", e);
        toast({ title: "Error", description: `Invalid cron expression: ${e.message}`, variant: "destructive" });
        return;
    }

    setJobs([...jobs, {
        id: Math.random().toString(36).substr(2, 9),
        name: newName || `Job ${jobs.length + 1}`,
        expression: cronExpression,
        color: COLORS[jobs.length % COLORS.length]
    }]);
    
    setNewName('');
    // Don't clear expression if in simple mode, might want to add similar? 
    // Or clear it. Let's clear it to indicate success.
    // If simple mode, reset to default or keep? Let's keep for better UX (add another similar job)
    // Actually, user usually wants to add one. Let's clear.
    // setCronExpression(''); 
    toast({ title: "Job Added", description: "New cron job added to timeline." });
  };

  const removeJob = (id: string) => {
    setJobs(jobs.filter(j => j.id !== id));
  };

  // Handle Preset Change
  const handlePresetChange = (val: string) => {
      setCronExpression(val);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-[#09090b] text-white overflow-hidden font-sans">
      
      {/* 1. Top Section: Builder & List (Split Layout) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Builder Panel */}
        <div className="w-[400px] border-r border-white/10 bg-[#09090b] flex flex-col z-10">
             <div className="p-6 border-b border-white/10">
                 <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 mb-1">
                    <Clock className="text-blue-500" />
                    Cron Builder
                 </h2>
                 <p className="text-xs text-zinc-500">Plan and visualize your scheduled tasks.</p>
             </div>

             <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Name Input */}
                <div className="space-y-2">
                    <Label>Job Name</Label>
                    <Input 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Database Backup"
                        className="bg-zinc-900 border-zinc-700"
                    />
                </div>

                {/* Mode Toggle */}
                <div className="flex items-center justify-between bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                    <span className="text-sm text-zinc-300">Simple Mode</span>
                    <Switch checked={isSimpleMode} onCheckedChange={setIsSimpleMode} />
                </div>

                {/* Expression Input */}
                <div className="space-y-2">
                    <Label>Schedule</Label>
                    {isSimpleMode ? (
                        <Select value={cronExpression} onValueChange={handlePresetChange}>
                            <SelectTrigger className="bg-zinc-900 border-zinc-700">
                                <SelectValue placeholder="Select a preset" />
                            </SelectTrigger>
                            <SelectContent>
                                {PRESETS.map(p => (
                                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Input 
                            value={cronExpression}
                            onChange={(e) => setCronExpression(e.target.value)}
                            placeholder="* * * * *"
                            className="bg-zinc-900 border-zinc-700 font-mono"
                        />
                    )}
                    
                    {/* Human Readable Preview */}
                    <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                        <span className="text-sm text-blue-300">
                            {humanReadable}
                        </span>
                    </div>
                </div>

                <Button onClick={handleAddJob} className="w-full bg-blue-600 hover:bg-blue-500">
                    <Plus className="w-4 h-4 mr-2" /> Add Job
                </Button>
             </div>
        </div>

        {/* Right: Active Jobs Grid (Compact) */}
        <div className="flex-1 bg-[#0c0c0e] p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-zinc-200">Active Jobs ({jobs.length})</h3>
                {collisionWarning && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm animate-pulse">
                        <AlertTriangle size={14} />
                        {collisionWarning}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {jobs.map(job => {
                    const nextRun = jobNextRuns[job.id];
                    return (
                        <div key={job.id} className="group relative bg-[#18181b] border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all hover:shadow-lg">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${job.color}`} />
                                    <h4 className="font-medium text-zinc-200 truncate max-w-[150px]" title={job.name}>{job.name}</h4>
                                </div>
                                <button 
                                    onClick={() => removeJob(job.id)}
                                    className="text-zinc-500 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/50 p-2 rounded border border-white/5">
                                    <code className="font-mono text-blue-400">{job.expression}</code>
                                </div>
                                
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <Calendar size={12} />
                                    <span>Next: {nextRun ? formatDistanceToNow(nextRun, { addSuffix: true }) : 'N/A'}</span>
                                </div>
                                <div className="text-[10px] text-zinc-600 truncate">
                                    {cronstrue.toString(job.expression)}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
      </div>

      {/* 2. Bottom Section: Timeline Visualizer */}
      <div className="h-[280px] bg-[#09090b] border-t border-white/10 flex flex-col relative z-20">
         <div className="px-6 py-2 border-b border-white/5 flex justify-between items-center bg-[#18181b]">
            <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">24-Hour Forecast (From Now)</span>
            <div className="flex items-center gap-4 text-[10px] text-zinc-500">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Job Execution</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <span>Collision</span>
                </div>
            </div>
         </div>
         
         <div className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar bg-[#0c0c0e]">
            {/* Timeline Track */}
            <div className="h-full relative min-w-[1600px] flex items-center px-8">
                
                {/* Grid Lines (Every Hour relative to start) */}
                {Array.from({ length: 25 }).map((_, i) => {
                    // Calculate label time: startTime + i hours
                    // We want to snap to nearest hour for grid lines?
                    // Actually, "24-Hour Forecast (From Now)" usually implies absolute grid lines (e.g. 13:00, 14:00) 
                    // that drift.
                    // But simpler to just show relative hours or absolute time ticks.
                    // Let's show absolute time ticks.
                    
                    const tickTime = addHours(timelineData.startTime, i);
                    
                    return (
                        <div 
                            key={i} 
                            className="absolute top-0 bottom-0 w-px bg-white/5"
                            style={{ left: `${(i / 24) * 100}%` }}
                        >
                            <div className="absolute top-1/2 mt-4 -translate-x-1/2 text-[10px] text-zinc-600 font-mono">
                                {format(tickTime, 'HH:mm')}
                            </div>
                        </div>
                    )
                })}

                {/* Central Axis */}
                <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />

                {/* Execution Dots */}
                {timelineData.executions.map((exec, i) => (
                    <div 
                        key={`exec-${i}`}
                        className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-[#09090b] shadow-sm cursor-pointer hover:scale-150 hover:z-50 transition-all",
                            exec.color
                        )}
                        style={{ left: `${exec.left}%` }}
                        title={`${exec.jobName}: ${format(exec.time, 'HH:mm')}`}
                    />
                ))}
                
                {/* Collisions */}
                {timelineData.collisions.map((col, i) => (
                     <div 
                        key={`col-${i}`}
                        className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 animate-pulse pointer-events-none z-0"
                        style={{ left: `${col.left}%`, transform: 'translate(-50%, -50%)' }}
                        title={`${col.count} jobs collide at ${format(col.time, 'HH:mm')}`}
                    />
                ))}
            </div>
         </div>
      </div>
    </div>
  );
}
