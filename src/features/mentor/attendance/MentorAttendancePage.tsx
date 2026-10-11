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
  mode: 'remote' | 'office';
  status: 'active' | 'on_break' | 'completed' | 'not_checked_in';
  targetHours: number;
  progressPercent: number;
  standupSummary?: string;
  blockers?: string;
  isStandupApproved: boolean;
}

const MOCK_MENTOR_INTERNS: InternAttendanceRecord[] = [
  {
    id: 'int-1',
    name: 'David Kim',
    avatarSeed: 'David',
    roleTitle: 'Full Stack Engineering Intern',
    checkIn: '09:30 AM',
    duration: '3h 45m',
    mode: 'remote',
    status: 'active',
    targetHours: 4,
    progressPercent: 93,
    standupSummary: 'Implemented Supabase test fallback sessions and verified 15 Vitest tests pass cleanly.',
    blockers: 'None',
    isStandupApproved: true,
  },
  {
    id: 'int-2',
    name: 'Priya Sharma',
    avatarSeed: 'Priya',
    roleTitle: 'Frontend UI/UX Intern',
    checkIn: '10:00 AM',
    duration: '2h 50m',
    mode: 'office',
    status: 'on_break',
    targetHours: 4,
    progressPercent: 70,
    standupSummary: 'Redesigning task submission Kanban board and responsive mobile layouts.',
    blockers: 'Need design token approval',
    isStandupApproved: false,
  },
  {
    id: 'int-3',
    name: 'Alex Chen',
    avatarSeed: 'Alex',
    roleTitle: 'Backend & Cloud Intern',
    checkIn: '09:00 AM',
    checkOut: '01:15 PM',
    duration: '4h 15m',
    mode: 'remote',
    status: 'completed',
    targetHours: 4,
    progressPercent: 100,
    standupSummary: 'Configured automated database migration and audited PostgreSQL RLS policies.',
    blockers: 'None',
    isStandupApproved: true,
  },
  {
    id: 'int-4',
    name: 'Rahul Verma',
    avatarSeed: 'Rahul',
    roleTitle: 'Data Engineering Intern',
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
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Intern Attendance & Shift Supervision</h1>
            <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
              Shift Target: 4h / Intern
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor real-time shifts, verify daily standup submissions, and review 4-hour target compliance.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          variant="outline"
          size="sm"
          className="text-xs gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs self-start sm:self-auto"
        >
          <Download className="h-3.5 w-3.5" /> Export Supervision Log (CSV)
        </Button>
      </div>

      {/* 2. Overview Stats (4 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">Currently active</span>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[28px] font-semibold text-emerald-700 tabular-nums">
            {activeCount} <span className="text-sm font-normal text-slate-400">/ {interns.length} interns</span>
          </p>
          <p className="text-[11px] text-slate-400">Live shift punched in</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">Shifts completed</span>
            <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[28px] font-semibold text-indigo-700 tabular-nums">
            {completedCount} <span className="text-sm font-normal text-slate-400">today</span>
          </p>
          <p className="text-[11px] text-slate-400">Standups submitted & ready</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">4h Target achieved</span>
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[28px] font-semibold text-slate-900 tabular-nums">
            {targetMetCount} <span className="text-sm font-normal text-slate-400">interns</span>
          </p>
          <p className="text-[11px] text-slate-400">Met 4h mandatory shift threshold</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-500">Attendance rate</span>
            <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[28px] font-semibold text-purple-700 tabular-nums">75%</p>
          <p className="text-[11px] text-slate-400">3 of 4 interns logged in today</p>
        </div>
      </div>

      {/* 3. Live Presence & Supervision Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Intern Attendance Roster</h3>
            <p className="text-xs text-slate-500">Real-time status of interns assigned to your mentorship group</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search intern..."
                className="rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                  statusFilter === 'active' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                  statusFilter === 'completed' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setStatusFilter('absent')}
                className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                  statusFilter === 'absent' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Not Punched
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Intern</th>
                <th className="pb-3 px-3">Mode</th>
                <th className="pb-3 px-3">Check-In</th>
                <th className="pb-3 px-3">Duration</th>
                <th className="pb-3 px-3">4h Progress</th>
                <th className="pb-3 px-3">Live Status</th>
                <th className="pb-3 px-3">Daily Standup Output</th>
                <th className="pb-3 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInterns.map((intern) => (
                <tr key={intern.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Intern Profile */}
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={intern.name} size="md" />
                      <div>
                        <p className="font-semibold text-slate-900">{intern.name}</p>
                        <p className="text-[11px] text-slate-400">{intern.roleTitle}</p>
                      </div>
                    </div>
                  </td>

                  {/* Mode */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                        intern.mode === 'office'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {intern.mode === 'office' ? <Building2 className="h-3 w-3" /> : <Laptop className="h-3 w-3" />}
                      {intern.mode}
                    </span>
                  </td>

                  {/* Check-In */}
                  <td className="py-3.5 px-3 font-mono text-slate-700">{intern.checkIn}</td>

                  {/* Duration */}
                  <td className="py-3.5 px-3 font-mono font-semibold text-slate-800">{intern.duration}</td>

                  {/* Progress Bar towards 4h */}
                  <td className="py-3.5 px-3 min-w-[120px]">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium">
                        <span className="text-slate-500">{intern.progressPercent}%</span>
                        <span className="text-slate-400">/ 4h</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
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
                  <td className="py-3.5 px-3">
                    {intern.status === 'active' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        Active Shift
                      </span>
                    )}
                    {intern.status === 'on_break' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Pause className="h-2.5 w-2.5" /> On Break
                      </span>
                    )}
                    {intern.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <CheckCircle2 className="h-3 w-3 text-indigo-600" /> Completed
                      </span>
                    )}
                    {intern.status === 'not_checked_in' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        Not Punched
                      </span>
                    )}
                  </td>

                  {/* Standup Notes */}
                  <td className="py-3.5 px-3 max-w-xs">
                    {intern.standupSummary && intern.standupSummary !== '—' ? (
                      <div>
                        <p className="text-slate-800 truncate" title={intern.standupSummary}>
                          {intern.standupSummary}
                        </p>
                        {intern.blockers && intern.blockers !== 'None' && (
                          <p className="text-[10px] text-rose-500 truncate" title={`Blocker: ${intern.blockers}`}>
                            Blocker: {intern.blockers}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No notes logged yet</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 pl-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {intern.standupSummary && intern.standupSummary !== '—' && (
                        <button
                          onClick={() => setSelectedStandup(intern)}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 shadow-2xs"
                        >
                          Details
                        </button>
                      )}

                      {intern.standupSummary && intern.standupSummary !== '—' && !intern.isStandupApproved && (
                        <Button
                          onClick={() => handleApproveStandup(intern.id)}
                          size="sm"
                          className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        >
                          <Check className="h-3 w-3" /> Approve
                        </Button>
                      )}

                      {intern.isStandupApproved && (
                        <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                        </span>
                      )}

                      {intern.status === 'not_checked_in' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-[10px] text-slate-600 border-slate-200"
                          onClick={() => alert(`Punch-in reminder notification dispatched to ${intern.name}`)}
                        >
                          <Send className="h-2.5 w-2.5 mr-1" /> Ping
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Avatar name={selectedStandup.name} size="md" />
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{selectedStandup.name}</h3>
                  <p className="text-xs text-slate-500">{selectedStandup.roleTitle}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStandup(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 space-y-1.5 border border-slate-200/80">
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
                  <span className="capitalize font-semibold text-indigo-700">{selectedStandup.mode}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Completed Work Output:</label>
                <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed">
                  {selectedStandup.standupSummary}
                </p>
              </div>

              {selectedStandup.blockers && selectedStandup.blockers !== 'None' && (
                <div className="space-y-1">
                  <label className="font-semibold text-rose-700">Reported Blockers:</label>
                  <p className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                    {selectedStandup.blockers}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedStandup(null)}>
                Close
              </Button>
              {!selectedStandup.isStandupApproved && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  onClick={() => {
                    handleApproveStandup(selectedStandup.id);
                    setSelectedStandup(null);
                  }}
                >
                  <Check className="h-3.5 w-3.5" /> Approve Output
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
