'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle, Calendar, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
const cronParser = require('cron-parser');
import { format, addHours, differenceInMinutes, startOfHour, isSameMinute } from 'date-fns';

interface CronJob {
  id: string;
  name: string;
  expression: string;
  color: string;
}

const COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'
];

export default function CronTimeline() {
  const [jobs, setJobs] = useState<CronJob[]>([
    { id: '1', name: 'Database Backup', expression: '0 0 * * *', color: COLORS[0] },
    { id: '2', name: 'Log Rotation', expression: '*/30 * * * *', color: COLORS[1] },
    { id: '3', name: 'Email Digest', expression: '0 9 * * 1', color: COLORS[2] },
  ]);
  const [newExpression, setNewExpression] = useState('');
  const [newName, setNewName] = useState('');
  
  // Calculate Timeline Data
  const timelineData = useMemo(() => {
    const now = new Date();
    const startTime = startOfHour(now);
    const endTime = addHours(startTime, 24);
    const totalMinutes = 24 * 60;

    const executions: { time: Date; jobId: string; jobName: string; color: string }[] = [];
    const collisions: { time: Date; count: number }[] = [];

    jobs.forEach(job => {
        try {
            const interval = cronParser.parseExpression(job.expression, {
                currentDate: startTime,
                iterator: true
            });

            while (true) {
                const next = interval.next();
                const date = next.value.toDate();
                if (date > endTime) break;
                
                executions.push({
                    time: date,
                    jobId: job.id,
                    jobName: job.name,
                    color: job.color
                });
            }
        } catch (e) {
            // Invalid cron, skip
        }
    });

    // Detect Collisions
    const timeMap = new Map<string, number>();
    executions.forEach(exec => {
        const key = exec.time.toISOString();
        timeMap.set(key, (timeMap.get(key) || 0) + 1);
    });

    timeMap.forEach((count, key) => {
        if (count > 1) {
            collisions.push({ time: new Date(key), count });
        }
    });

    return { executions, collisions, startTime, totalMinutes };
  }, [jobs]);

  const addJob = () => {
    if (!newExpression) return;
    setJobs([...jobs, {
        id: Math.random().toString(36).substr(2, 9),
        name: newName || `Job ${jobs.length + 1}`,
        expression: newExpression,
        color: COLORS[jobs.length % COLORS.length]
    }]);
    setNewExpression('');
    setNewName('');
  };

  const removeJob = (id: string) => {
    setJobs(jobs.filter(j => j.id !== id));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-[#09090b] text-white overflow-hidden font-sans">
      {/* Top: Controls & List */}
      <div className="h-1/2 flex border-b border-white/10">
        {/* Form */}
        <div className="w-1/3 min-w-[350px] p-6 border-r border-white/10 bg-[#09090b] overflow-y-auto">
             <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 mb-6">
                <Clock className="text-blue-500" />
                Cron Timeline
             </h2>
             
             <div className="space-y-4 bg-[#18181b] p-4 rounded-xl border border-white/5">
                <div>
                    <label className="text-xs font-medium text-zinc-400 mb-1 block">Job Name</label>
                    <input 
                        type="text" 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Daily Backup"
                        className="w-full bg-[#09090b] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-zinc-400 mb-1 block">Cron Expression</label>
                    <input 
                        type="text" 
                        value={newExpression}
                        onChange={(e) => setNewExpression(e.target.value)}
                        placeholder="* * * * *"
                        className="w-full bg-[#09090b] border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
                    />
                </div>
                <button 
                    onClick={addJob}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    Add to Timeline
                </button>
             </div>

             <div className="mt-6 space-y-2">
                <h3 className="text-sm font-medium text-zinc-400 mb-2">Active Jobs</h3>
                {jobs.map(job => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-[#18181b] rounded-lg border border-white/5 group">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${job.color}`} />
                            <div>
                                <div className="text-sm font-medium text-zinc-200">{job.name}</div>
                                <div className="text-xs text-zinc-500 font-mono">{job.expression}</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => removeJob(job.id)}
                            className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            &times;
                        </button>
                    </div>
                ))}
             </div>
        </div>

        {/* Info / Collisions */}
        <div className="flex-1 p-8 bg-[#0c0c0e] overflow-y-auto">
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-[#18181b] p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-medium text-zinc-200 flex items-center gap-2 mb-4">
                        <AlertTriangle className="text-orange-500" size={20} />
                        Collision Detection
                    </h3>
                    {timelineData.collisions.length === 0 ? (
                        <div className="text-zinc-500 text-sm">No overlapping jobs detected in the next 24 hours.</div>
                    ) : (
                        <div className="space-y-3">
                            {timelineData.collisions.slice(0, 5).map((col, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <span className="text-red-400 font-mono text-sm">{format(col.time, 'HH:mm:ss')}</span>
                                    <span className="text-red-300 text-xs bg-red-500/20 px-2 py-1 rounded-full">{col.count} jobs overlap</span>
                                </div>
                            ))}
                            {timelineData.collisions.length > 5 && (
                                <div className="text-center text-xs text-zinc-500">...and {timelineData.collisions.length - 5} more</div>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="bg-[#18181b] p-6 rounded-xl border border-white/5">
                     <h3 className="text-lg font-medium text-zinc-200 flex items-center gap-2 mb-4">
                        <Info className="text-blue-500" size={20} />
                        Next Execution
                    </h3>
                    <div className="space-y-2">
                        {jobs.map(job => {
                             try {
                                const interval = cronParser.parseExpression(job.expression);
                                const next = interval.next().toDate();
                                return (
                                    <div key={job.id} className="flex justify-between text-sm">
                                        <span className="text-zinc-400">{job.name}</span>
                                        <span className="font-mono text-zinc-200">{format(next, 'HH:mm:ss')}</span>
                                    </div>
                                )
                             } catch { return null }
                        })}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Bottom: Timeline */}
      <div className="flex-1 bg-[#09090b] relative overflow-hidden flex flex-col">
         <div className="px-6 py-3 border-b border-white/10 flex justify-between items-center bg-[#18181b]">
            <span className="text-sm font-medium text-zinc-300">24-Hour Timeline</span>
            <div className="text-xs text-zinc-500">Scroll horizontally to view full day</div>
         </div>
         
         <div className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar">
            <div className="h-full relative min-w-[2000px] flex items-center px-10">
                {/* Horizontal Line */}
                <div className="absolute left-0 right-0 top-1/2 h-px bg-zinc-700" />

                {/* Hour Markers */}
                {Array.from({ length: 25 }).map((_, i) => (
                    <div 
                        key={i} 
                        className="absolute top-1/2 -translate-y-1/2 h-8 w-px bg-zinc-600 flex flex-col items-center justify-end pb-10"
                        style={{ left: `${(i / 24) * 100}%` }}
                    >
                        <span className="text-[10px] text-zinc-500 font-mono whitespace-nowrap absolute -top-6">
                            {format(addHours(timelineData.startTime, i), 'HH:mm')}
                        </span>
                    </div>
                ))}

                {/* Execution Dots */}
                {timelineData.executions.map((exec, i) => {
                    const diff = differenceInMinutes(exec.time, timelineData.startTime);
                    const percent = (diff / timelineData.totalMinutes) * 100;
                    
                    if (percent < 0 || percent > 100) return null;

                    return (
                        <div 
                            key={i}
                            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#09090b] cursor-pointer hover:scale-150 transition-transform z-10 ${exec.color}`}
                            style={{ left: `${percent}%` }}
                            title={`${exec.jobName} at ${format(exec.time, 'HH:mm')}`}
                        />
                    );
                })}
                
                {/* Collision Highlights */}
                {timelineData.collisions.map((col, i) => {
                    const diff = differenceInMinutes(col.time, timelineData.startTime);
                    const percent = (diff / timelineData.totalMinutes) * 100;
                     if (percent < 0 || percent > 100) return null;

                     return (
                        <div 
                            key={`col-${i}`}
                            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-red-500/30 animate-pulse pointer-events-none z-0"
                            style={{ left: `${percent}%`, transform: 'translate(-50%, -50%)' }}
                        />
                     )
                })}
            </div>
         </div>
      </div>
    </div>
  );
}
