// src/features/intern/dashboard/DeliverablePreviewModal.tsx
import React, { useState } from 'react';
import {
  ExternalLink,
  GitBranch,
  GitCommit,
  GitPullRequest,
  CheckCircle2,
  X,
  FileCode,
  Globe,
  Layers,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface DeliverablePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  githubUrl?: string;
  deploymentUrl?: string;
}

export function DeliverablePreviewModal({
  isOpen,
  onClose,
  title,
  githubUrl = 'https://github.com/organization/intern-workspace',
  deploymentUrl = 'https://preview-staging.vercel.app',
}: DeliverablePreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'commits' | 'changes'>('preview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative h-full w-full max-w-2xl bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="space-y-0.5 min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                <GitBranch className="h-3 w-3" /> main
              </span>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                {title}
              </h3>
            </div>
            <p className="text-xs text-slate-500 truncate">Live Deliverable Inspection & GitHub Stats</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action / Link Bar */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200 text-xs gap-2">
          <div className="flex items-center gap-4">
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 font-medium transition-colors"
              >
                <FileCode className="h-3.5 w-3.5" /> Repository <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {deploymentUrl && (
              <a
                href={deploymentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 font-medium transition-colors"
              >
                <Globe className="h-3.5 w-3.5" /> Live Preview <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('preview')}
              className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                activeTab === 'preview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Embed
            </button>
            <button
              onClick={() => setActiveTab('commits')}
              className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                activeTab === 'commits' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Commits (3)
            </button>
            <button
              onClick={() => setActiveTab('changes')}
              className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                activeTab === 'changes' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Files Changed
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
          {activeTab === 'preview' && (
            <div className="h-full flex flex-col space-y-3">
              <div className="flex-1 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs min-h-[360px] relative flex flex-col">
                <div className="h-8 bg-slate-100 border-b border-slate-200 px-3 flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-400"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400"></div>
                  <span className="text-[11px] text-slate-400 font-mono ml-2 truncate">
                    {deploymentUrl}
                  </span>
                </div>
                <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50">
                  <Globe className="h-10 w-10 text-indigo-500 animate-pulse" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-900">Sandbox Preview Ready</h4>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Deliverable build verified with 0 lint errors and pass status.
                    </p>
                  </div>
                  <a
                    href={deploymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
                  >
                    Launch Staging View in New Tab <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'commits' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                  <span className="font-semibold text-slate-900">Recent Deliverable Commits</span>
                  <span className="text-slate-400 font-mono">Branch: main</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <GitCommit className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="font-medium text-slate-800">
                        feat: add complete Supabase RLS security policies & RPC handlers
                      </p>
                      <p className="text-[11px] text-slate-400">commit 7a2b91c • 2 hours ago by Intern</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <GitCommit className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="font-medium text-slate-800">
                        test: add integration tests covering platform workflow
                      </p>
                      <p className="text-[11px] text-slate-400">commit 4c8e12a • 5 hours ago by Intern</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <GitCommit className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="font-medium text-slate-800">
                        chore: optimize layout tokens and responsive containers
                      </p>
                      <p className="text-[11px] text-slate-400">commit 1f9d50b • yesterday by Intern</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'changes' && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-900">Changed Files Summary</span>
                <span className="font-semibold text-emerald-600">+142 additions, -28 deletions</span>
              </div>
              <ul className="space-y-2 font-mono text-[11px] text-slate-600">
                <li className="flex items-center justify-between p-1.5 rounded bg-slate-50">
                  <span>src/features/intern/dashboard/InternDashboard.tsx</span>
                  <span className="text-emerald-600">+84</span>
                </li>
                <li className="flex items-center justify-between p-1.5 rounded bg-slate-50">
                  <span>src/components/layout/Topbar.tsx</span>
                  <span className="text-emerald-600">+38</span>
                </li>
                <li className="flex items-center justify-between p-1.5 rounded bg-slate-50">
                  <span>src/stores/attendance.store.ts</span>
                  <span className="text-emerald-600">+20</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between text-xs">
          <span className="text-slate-500">Ready for mentor verification</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Inspector
          </Button>
        </div>
      </div>
    </div>
  );
}
