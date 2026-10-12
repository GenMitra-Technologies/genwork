// src/features/mentor/attendance/MentorAttendancePage.tsx
import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  Download,
  Users,
  Search,
  Laptop,
  Building2,
  CalendarCheck,
  Send,
  MessageSquare,
  Sparkles,
  Check,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Avatar } from '../../../components/shared/Avatar';

interface InternAttendanceRecord {
  id: string;
  name: string;
  avatarSeed: string;
  roleTitle: string;
  checkIn: string;
  checkOut?: string;
  duration: string;
  mode: 'remote';
  status: 'active' | 'on_break' | 'completed' | 'not_checked_in';
  targetHours: number;
  progressPercent: number;
  standupSummary?: string;
  blockers?: string;
  isStandupApproved: boolean;
}

const MOCK_MENTOR_INTERNS: InternAttendanceRecord[] = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    name: 'Sindhu Gangisetty',
    avatarSeed: 'Sindhu',
    roleTitle: 'Frontend Developer',
    checkIn: '—',
    duration: '0h 00m',
    mode: 'remote',
    status: 'not_checked_in',
    targetHours: 4,
    progressPercent: 0,
    standupSummary: '—',
    blockers: '—',
    isStandupApproved: false,
  },
];

export function MentorAttendancePage() {
  const [interns, setInterns] = useState<InternAttendanceRecord[]>(MOCK_MENTOR_INTERNS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'absent'>('all');
  const [selectedStandup, setSelectedStandup] = useState<InternAttendanceRecord | null>(null);

  const handleApproveStandup = (id: string) => {
    setInterns((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isStandupApproved: true } : item))
    );
  };

  const handleExportCSV = () => {
    const headers = ['Intern Name,Role,Work Mode,Check-In,Check-Out,Duration,Status,Standup Summary,Blockers,Approved\n'];
    const rows = interns.map(
      (r) =>
        `"${r.name}","${r.roleTitle}","${r.mode}","${r.checkIn}","${r.checkOut || '—'}","${r.duration}","${r.status}","${(r.standupSummary || '').replace(/"/g, '""')}","${(r.blockers || '').replace(/"/g, '""')}","${r.isStandupApproved ? 'Yes' : 'No'}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentor-intern-attendance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredInterns = interns.filter((intern) => {
    const matchesSearch = intern.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'active') return intern.status === 'active' || intern.status === 'on_break';
    if (statusFilter === 'completed') return intern.status === 'completed';
    if (statusFilter === 'absent') return intern.status === 'not_checked_in';
    return true;
  });

  const activeCount = interns.filter((i) => i.status === 'active' || i.status === 'on_break').length;
  const completedCount = interns.filter((i) => i.status === 'completed').length;
  const targetMetCount = interns.filter((i) => i.progressPercent >= 100).length;

  return (
    <div className="space-y-4 max-w-[1140px] mx-auto">
      {/* Glossy Header Bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">Intern Attendance Supervision</h1>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-200/60">
              Target: 4h / Day
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Monitor real-time shifts, inspect daily standup submissions, and audit 4-hour target compliance.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          variant="outline"
          size="sm"
          className="h-7 px-3 text-xs gap-1.5 bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs self-start sm:self-auto rounded-lg font-medium"
        >
          <Download className="h-3 w-3" /> Export CSV
        </Button>
      </div>

      {/* 4 Compact Glossy Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Currently Active</span>
            <div className="h-6 w-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Clock className="h-3 w-3" />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-700 tabular-nums">
            {activeCount} <span className="text-[11px] font-normal text-slate-400">/ {interns.length}</span>
          </p>
          <p className="text-[10px] text-slate-400">Punched in live</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Shifts Completed</span>
            <div className="h-6 w-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <CheckCircle2 className="h-3 w-3" />
            </div>
          </div>
          <p className="text-xl font-bold text-indigo-700 tabular-nums">
            {completedCount} <span className="text-[11px] font-normal text-slate-400">today</span>
          </p>
          <p className="text-[10px] text-slate-400">Standups submitted</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">4h Target Met</span>
            <div className="h-6 w-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Sparkles className="h-3 w-3" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 tabular-nums">
            {targetMetCount} <span className="text-[11px] font-normal text-slate-400">interns</span>
          </p>
          <p className="text-[10px] text-slate-400">Met shift threshold</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Attendance Rate</span>
            <div className="h-6 w-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <CalendarCheck className="h-3 w-3" />
            </div>
          </div>
          <p className="text-xl font-bold text-purple-700 tabular-nums">75%</p>
          <p className="text-[10px] text-slate-400">3 of 4 logged in</p>
        </div>
      </div>

      {/* Live Presence Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">Intern Roster & Daily Shifts</h3>
            <p className="text-[11px] text-slate-500">Assigned interns real-time status</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3 w-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search intern..."
                className="h-7 rounded-lg border border-slate-200 bg-white pl-7 pr-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-all ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-all ${
                  statusFilter === 'active' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-all ${
                  statusFilter === 'completed' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setStatusFilter('absent')}
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-all ${
                  statusFilter === 'absent' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Not Punched
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="pb-2 pr-3">Intern</th>
                <th className="pb-2 px-2.5">Mode</th>
                <th className="pb-2 px-2.5">Check-In</th>
                <th className="pb-2 px-2.5">Duration</th>
                <th className="pb-2 px-2.5">4h Target</th>
                <th className="pb-2 px-2.5">Status</th>
                <th className="pb-2 px-2.5">Daily Standup</th>
                <th className="pb-2 pl-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInterns.map((intern) => (
                <tr key={intern.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Intern Profile */}
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={intern.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-slate-900 truncate">{intern.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{intern.roleTitle}</p>
                      </div>
                    </div>
                  </td>

                  {/* Mode */}
                  <td className="py-2.5 px-2.5">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      <Laptop className="h-2.5 w-2.5" /> Online Remote
                    </span>
                  </td>

                  {/* Check-In */}
                  <td className="py-2.5 px-2.5 font-mono text-[11px] text-slate-600">{intern.checkIn}</td>

                  {/* Duration */}
                  <td className="py-2.5 px-2.5 font-mono text-[11px] font-semibold text-slate-800">{intern.duration}</td>

                  {/* Progress Bar towards 4h */}
                  <td className="py-2.5 px-2.5 min-w-[100px]">
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[9px] font-medium">
                        <span className="text-slate-500">{intern.progressPercent}%</span>
                        <span className="text-slate-400">/ 4h</span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            intern.progressPercent >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.min(100, intern.progressPercent)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* Live Status Badge */}
                  <td className="py-2.5 px-2.5">
                    {intern.status === 'active' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        Active
                      </span>
                    )}
                    {intern.status === 'on_break' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <Pause className="h-2.5 w-2.5" /> On Break
                      </span>
                    )}
                    {intern.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <CheckCircle2 className="h-2.5 w-2.5 text-indigo-600" /> Done
                      </span>
                    )}
                    {intern.status === 'not_checked_in' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        Not Punched
                      </span>
                    )}
                  </td>

                  {/* Standup Notes */}
                  <td className="py-2.5 px-2.5 max-w-[200px]">
                    {intern.standupSummary && intern.standupSummary !== '—' ? (
                      <div>
                        <p className="text-slate-800 text-[11px] truncate" title={intern.standupSummary}>
                          {intern.standupSummary}
                        </p>
                        {intern.blockers && intern.blockers !== 'None' && (
                          <p className="text-[10px] text-rose-500 truncate" title={`Blocker: ${intern.blockers}`}>
                            Blocker: {intern.blockers}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No notes</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 pl-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {intern.standupSummary && intern.standupSummary !== '—' && (
                        <button
                          onClick={() => setSelectedStandup(intern)}
                          className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </button>
                      )}

                      {intern.standupSummary && intern.standupSummary !== '—' && !intern.isStandupApproved && (
                        <Button
                          onClick={() => handleApproveStandup(intern.id)}
                          size="sm"
                          className="h-5 px-1.5 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white gap-0.5 rounded"
                        >
                          <Check className="h-2.5 w-2.5" /> Approve
                        </Button>
                      )}

                      {intern.isStandupApproved && (
                        <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-0.5">
                          <CheckCircle2 className="h-3 w-3" /> Approved
                        </span>
                      )}

                      {intern.status === 'not_checked_in' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-5 px-1.5 text-[10px] text-slate-600 border-slate-200 rounded"
                          onClick={() => alert(`Punch-in reminder sent to ${intern.name}`)}
                        >
                          <Send className="h-2 w-2 mr-0.5" /> Ping
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Standup Detail Modal */}
      {selectedStandup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-xl bg-white p-4 shadow-xl border border-slate-200 space-y-3">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Avatar name={selectedStandup.name} size="sm" />
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">{selectedStandup.name}</h3>
                  <p className="text-[10px] text-slate-500">{selectedStandup.roleTitle}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStandup(null)}
                className="rounded p-1 text-slate-400 hover:text-slate-700 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="rounded-lg bg-slate-50 p-2 space-y-1 border border-slate-100 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Check-In:</span>
                  <strong className="text-slate-800">{selectedStandup.checkIn}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration Logged:</span>
                  <strong className="text-slate-800">{selectedStandup.duration}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Work Mode:</span>
                  <span className="font-semibold text-indigo-700">Online Remote</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 text-[11px]">Completed Work Output:</label>
                <p className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-[11px] leading-relaxed">
                  {selectedStandup.standupSummary}
                </p>
              </div>

              {selectedStandup.blockers && selectedStandup.blockers !== 'None' && (
                <div className="space-y-1">
                  <label className="font-semibold text-rose-700 text-[11px]">Reported Blockers:</label>
                  <p className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                    {selectedStandup.blockers}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedStandup(null)} className="h-7 text-xs rounded-lg">
                Close
              </Button>
              {!selectedStandup.isStandupApproved && (
                <Button
                  size="sm"
                  className="h-7 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                  onClick={() => {
                    handleApproveStandup(selectedStandup.id);
                    setSelectedStandup(null);
                  }}
                >
                  <Check className="h-3 w-3" /> Approve Output
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
