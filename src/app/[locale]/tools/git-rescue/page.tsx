'use client';

import React, { useState } from 'react';
import { 
  GitBranch, 
  AlertTriangle, 
  Terminal, 
  RotateCcw, 
  ChevronRight, 
  Check, 
  Copy, 
  ArrowLeft,
  ShieldAlert,
  GitCommit,
  Undo,
  FileX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// --- Types ---

type Solution = {
  command: string;
  description: string;
  isDangerous: boolean;
};

type Option = {
  label: string;
  nextId?: string;
  solution?: Solution;
};

type Scenario = {
  id: string;
  question: string;
  options: Option[];
};

// --- Data: The Decision Tree ---

const SCENARIOS: Scenario[] = [
  {
    id: 'root',
    question: 'What is your Git emergency?',
    options: [
      {
        label: 'I want to undo a commit',
        nextId: 'undo-commit',
      },
      {
        label: 'I typed the wrong commit message',
        solution: {
          command: 'git commit --amend -m "New Message"',
          description: 'This opens your editor to change the last commit message. Or use the command above to set it directly.',
          isDangerous: false,
        },
      },
      {
        label: 'I committed to the wrong branch',
        solution: {
          command: 'git branch new-feature && git reset --hard HEAD~1 && git checkout new-feature',
          description: 'This creates a new branch from your current state, removes the commit from the current branch (e.g., main), and switches to the new branch with your changes.',
          // Technically hard reset is dangerous but here it's part of a safe workflow if done right.
          // The reset --hard can permanently delete changes; mark as dangerous.
          isDangerous: true,
        },
      },
      {
        label: 'Git Push is rejected',
        nextId: 'push-rejected',
      },
      {
        label: 'I want to discard local file changes',
        solution: {
          command: 'git restore .',
          description: 'This will discard ALL local changes in the current directory. To discard a specific file, use "git restore <filename>".',
          isDangerous: true,
        },
      },
    ],
  },
  {
    id: 'undo-commit',
    question: 'How do you want to undo the commit?',
    options: [
      {
        label: 'Undo commit but keep changes in files',
        solution: {
          command: 'git reset --soft HEAD~1',
          description: 'Your changes will be moved to the "Staging Area". You can commit them again.',
          isDangerous: false,
        },
      },
      {
        label: 'Undo commit and destroy all changes',
        solution: {
          command: 'git reset --hard HEAD~1',
          description: 'WARNING: This will permanently delete your changes. They cannot be recovered.',
          isDangerous: true,
        },
      },
    ],
  },
  {
    id: 'push-rejected',
    question: 'Why is the push rejected?',
    options: [
      {
        label: 'I work alone / I know what I\'m doing (Force Push)',
        solution: {
          command: 'git push -f origin <branch>',
          description: 'Force push overwrites the remote branch with your local version. Be careful!',
          isDangerous: true,
        },
      },
      {
        label: 'I work on a team (Rebase)',
        solution: {
          command: 'git pull --rebase origin <branch>',
          description: 'This fetches remote changes and applies your commits on top of them. Cleaner history than a merge.',
          isDangerous: false,
        },
      },
    ],
  },
];

// --- Components ---

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'destructive' | 'outline' }) => {
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground",
  };
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variants[variant])}>
      {children}
    </div>
  );
};

const Alert = ({ children, variant = 'default', className }: { children: React.ReactNode; variant?: 'default' | 'destructive'; className?: string }) => {
  const variants = {
    default: "bg-background text-foreground",
    destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
  };
  return (
    <div className={cn("relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground", variants[variant], className)}>
      {children}
    </div>
  );
};

// --- Main Tool Component ---

export default function GitRescueTool() {
  const [history, setHistory] = useState<string[]>(['root']);
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null);

  const currentScenarioId = history[history.length - 1];
  const currentScenario = SCENARIOS.find(s => s.id === currentScenarioId);

  const handleOptionClick = (option: Option) => {
    if (option.solution) {
      setSelectedSolution(option.solution);
    } else if (option.nextId) {
      setHistory(prev => [...prev, option.nextId!]);
    }
  };

  const handleBack = () => {
    if (selectedSolution) {
      setSelectedSolution(null);
    } else if (history.length > 1) {
      setHistory(prev => prev.slice(0, -1));
    }
  };

  const handleReset = () => {
    setHistory(['root']);
    setSelectedSolution(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Command copied to clipboard!');
  };

  if (!currentScenario && !selectedSolution) {
    return <div className="text-center p-10 text-red-500">Error: Scenario not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="space-y-2 text-center md:text-left">
        <div className="flex items-center gap-3 justify-center md:justify-start">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
            <ShieldAlert className="w-8 h-8 text-orange-600 dark:text-orange-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Git Rescue
            </h1>
            <p className="text-muted-foreground">
              Your emergency guide to undoing Git mistakes.
            </p>
          </div>
        </div>
      </div>

      <Card className="p-6 md:p-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        
        {/* Navigation / Progress */}
        {(history.length > 1 || selectedSolution) && (
          <div className="mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </div>
        )}

        {selectedSolution ? (
          // --- Solution View ---
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Check className="w-6 h-6 text-green-500" />
                Here is your fix
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400">
                Run this command in your terminal.
              </p>
            </div>

            {selectedSolution.isDangerous && (
              <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                <AlertTriangle className="h-4 w-4" />
                <div className="font-medium text-red-800 dark:text-red-300">Warning: Destructive Action</div>
                <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {selectedSolution.description}
                </div>
              </Alert>
            )}

            <div className="relative group rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 shadow-2xl">
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                </div>
                <div className="text-xs text-zinc-500 font-mono">bash</div>
              </div>
              <div className="p-6 overflow-x-auto">
                <code className="font-mono text-sm text-green-400 block whitespace-pre-wrap break-all">
                  {selectedSolution.command}
                </code>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-12 right-4 text-zinc-500 hover:text-white hover:bg-white/10"
                onClick={() => copyToClipboard(selectedSolution.command)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            {!selectedSolution.isDangerous && (
               <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900">
                 <div className="flex gap-3">
                   <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full h-fit">
                     <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                   </div>
                   <div>
                     <h4 className="font-medium text-blue-900 dark:text-blue-300">Description</h4>
                     <p className="text-sm text-blue-700 dark:text-blue-400 mt-1 leading-relaxed">
                       {selectedSolution.description}
                     </p>
                   </div>
                 </div>
               </div>
            )}

            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-center">
              <Button onClick={handleReset} variant="outline" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Start Over
              </Button>
            </div>
          </div>
        ) : (
          // --- Question View ---
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {currentScenario?.question}
            </h2>

            <div className="grid gap-3">
              {currentScenario?.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(option)}
                  className="group relative flex items-center justify-between p-4 md:p-6 text-left rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800 hover:border-blue-500/50 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-full transition-colors",
                      option.solution?.isDangerous 
                        ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-900/40" 
                        : "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/40"
                    )}>
                      {option.solution ? (
                        option.solution.isDangerous ? <AlertTriangle className="w-5 h-5" /> : <Terminal className="w-5 h-5" />
                      ) : (
                        getIconForScenario(option.nextId)
                      )}
                    </div>
                    <span className="font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white">
                      {option.label}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// Helper to get icons for intermediate steps
function getIconForScenario(id?: string) {
  switch (id) {
    case 'undo-commit': return <Undo className="w-5 h-5" />;
    case 'push-rejected': return <GitBranch className="w-5 h-5" />;
    default: return <GitCommit className="w-5 h-5" />;
  }
}
