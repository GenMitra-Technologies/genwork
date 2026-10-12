// src/features/admin/permissions/TeamPermissionsPage.tsx
import React, { useState, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  RefreshCw,
  UserPlus,
  Search,
  ChevronDown,
  Key,
  Edit2,
  Lock,
  AlertTriangle,
  Slash,
  LogOut,
  Sliders,
  Trash2,
  RotateCcw,
  Check,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { cn } from '../../../lib/utils';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  overrides: string;
  isCurrentUser?: boolean;
}

const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'u-1',
    name: 'SINDHU GANGISETTY',
    email: 'sindhugangisetty910@gmail.com',
    role: 'Intern',
    department: 'Engineering',
    status: 'Active',
    overrides: 'Inherited',
  },
  {
    id: 'u-2',
    name: 'Chigine Pallavi',
    email: 'pallavi@genmitra.com',
    role: 'CSIO',
    department: 'Innovation Cell',
    status: 'Active',
    overrides: 'Inherited',
  },
  {
    id: 'u-3',
    name: 'Kapu Mani Shankar Reddy',
    email: 'manireddy@genmitra.com',
    role: 'CTO',
    department: 'Engineering',
    status: 'Active',
    overrides: 'Inherited',
  },
  {
    id: 'u-4',
    name: 'Kanakam Yaswanth',
    email: 'yaswanth@genmitra.com',
    role: 'CBO',
    department: 'Corporate Relations & Partnerships',
    status: 'Active',
    overrides: 'Inherited',
  },
  {
    id: 'u-5',
    name: 'Sharabu Eswarachari',
    email: 'eswarachari102@gmail.com',
    role: 'Intern',
    department: 'Engineering',
    status: 'Active',
    overrides: 'Inherited',
  },
  {
    id: 'u-6',
    name: 'Challa Manohar',
    email: 'manohar@genmitra.com',
    role: 'COO',
    department: 'Operations',
    status: 'Active',
    overrides: '12 custom',
  },
  {
    id: 'u-7',
    name: 'GenMitra Technologies',
    email: 'ops@genmitra.com',
    role: 'Founder',
    department: 'Executive',
    status: 'Active',
    overrides: 'Inherited',
    isCurrentUser: true,
  },
];

interface PermissionItem {
  id: string;
  label: string;
  key: string;
  description: string;
  defaultEnabled: boolean;
}

interface PermissionGroup {
  category: string;
  permissions: PermissionItem[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    category: 'DASHBOARD',
    permissions: [
      {
        id: 'p-dash-view',
        label: 'View Dashboard',
        key: 'dashboard.view',
        description: 'Access administrative metrics and platform overview.',
        defaultEnabled: true,
      },
    ],
  },
  {
    category: 'USERS',
    permissions: [
      {
        id: 'p-users-view',
        label: 'View Users',
        key: 'users.view',
        description: 'View team user accounts, profiles, and account statuses.',
        defaultEnabled: true,
      },
      {
        id: 'p-users-create',
        label: 'Invite Users',
        key: 'users.create',
        description: 'Invite or create new team member accounts.',
        defaultEnabled: true,
      },
      {
        id: 'p-users-update',
        label: 'Update Basic Profile',
        key: 'users.update',
        description: 'Edit basic profile details (name, phone, department).',
        defaultEnabled: true,
      },
      {
        id: 'p-users-disable',
        label: 'Disable / Enable Accounts',
        key: 'users.disable',
        description: 'Activate or deactivate team user accounts.',
        defaultEnabled: false,
      },
      {
        id: 'p-users-delete',
        label: 'Delete Accounts',
        key: 'users.delete',
        description: 'Permanently delete team member accounts.',
        defaultEnabled: false,
      },
      {
        id: 'p-users-roles',
        label: 'Assign Roles',
        key: 'users.assign_roles',
        description: 'Change the assigned system role for team members.',
        defaultEnabled: false,
      },
      {
        id: 'p-users-perms',
        label: 'Manage Custom Permissions',
        key: 'users.manage_permissions',
        description: 'Grant or revoke fine-grained permission overrides per member.',
        defaultEnabled: false,
      },
      {
        id: 'p-users-pin',
        label: 'Reset Step-Up PIN',
        key: 'users.reset_pin',
        description: 'Reset forgotten administrator approval PINs.',
        defaultEnabled: true,
      },
      {
        id: 'p-users-pwd',
        label: 'Reset Password',
        key: 'users.reset_password',
        description: 'Send password reset emails or force temporary passwords.',
        defaultEnabled: true,
      },
    ],
  },
  {
    category: 'TASKS & CURRICULUM',
    permissions: [
      {
        id: 'p-task-create',
        label: 'Create Tasks',
        key: 'tasks.create',
        description: 'Create new deliverables and engineering tasks.',
        defaultEnabled: true,
      },
      {
        id: 'p-task-override',
        label: 'Admin Status Override',
        key: 'tasks.override',
        description: 'Administrative override of task submission statuses.',
        defaultEnabled: true,
      },
      {
        id: 'p-task-delete',
        label: 'Delete Tasks',
        key: 'tasks.delete',
        description: 'Delete tasks and remove assigned deliverables.',
        defaultEnabled: false,
      },
    ],
  },
  {
    category: 'ATTENDANCE & AUDIT',
    permissions: [
      {
        id: 'p-att-view',
        label: 'View Timesheets',
        key: 'attendance.view',
        description: 'View daily check-ins, 4h shift completions, and streak logs.',
        defaultEnabled: true,
      },
      {
        id: 'p-att-edit',
        label: 'Adjust Shifts',
        key: 'attendance.edit',
        description: 'Manually edit or excuse intern attendance records.',
        defaultEnabled: false,
      },
    ],
  },
];

const SYSTEM_ROLES = [
  'HR/Admin',
  'Founder',
  'COO',
  'CTO',
  'CBO',
  'CSIO',
  'Lead Mentor',
  'Mentor',
  'Operations Lead',
  'Compliance Officer',
  'Recruiter',
  'Intern',
];

export function TeamPermissionsPage() {
  const [activeTab, setActiveTab] = useState<'directory' | 'matrix'>('directory');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  // Matrix configuration state
  const [selectedRole, setSelectedRole] = useState('HR/Admin');
  const [permissionsState, setPermissionsState] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    PERMISSION_GROUPS.forEach((g) => {
      g.permissions.forEach((p) => {
        map[p.id] = p.defaultEnabled;
      });
    });
    return map;
  });

  // Modals & Feedback
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Intern');
  const [inviteDept, setInviteDept] = useState('Engineering');
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Filtered members
  const filteredMembers = useMemo(() => {
    return teamMembers.filter((m) => {
      if (roleFilter !== 'all' && m.role.toLowerCase() !== roleFilter.toLowerCase()) return false;
      if (deptFilter !== 'all' && m.department.toLowerCase() !== deptFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.department.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [teamMembers, roleFilter, deptFilter, searchQuery]);

  const departments = useMemo(() => {
    return Array.from(new Set(teamMembers.map((m) => m.department)));
  }, [teamMembers]);

  const activePermissionsCount = useMemo(() => {
    return Object.values(permissionsState).filter(Boolean).length;
  }, [permissionsState]);

  const totalPermissionsCount = useMemo(() => {
    return PERMISSION_GROUPS.reduce((acc, g) => acc + g.permissions.length, 0);
  }, []);

  const handleTogglePermission = (permId: string) => {
    setPermissionsState((prev) => ({
      ...prev,
      [permId]: !prev[permId],
    }));
  };

  const handleToggleGroup = (group: PermissionGroup, enable: boolean) => {
    setPermissionsState((prev) => {
      const copy = { ...prev };
      group.permissions.forEach((p) => {
        copy[p.id] = enable;
      });
      return copy;
    });
  };

  const handleResetToDefault = () => {
    const map: Record<string, boolean> = {};
    PERMISSION_GROUPS.forEach((g) => {
      g.permissions.forEach((p) => {
        map[p.id] = p.defaultEnabled;
      });
    });
    setPermissionsState(map);
    showFeedback(`Permissions for ${selectedRole} reset to default.`);
  };

  const handleSaveMatrix = () => {
    showFeedback(`Role Permissions for ${selectedRole} saved successfully.`);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const newMember: TeamMember = {
      id: `u-${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      department: inviteDept,
      status: 'Active',
      overrides: 'Inherited',
    };

    setTeamMembers((prev) => [newMember, ...prev]);
    setInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
    showFeedback(`Invitation sent to ${newMember.email}`);
  };

  const handleToggleStatus = (memberId: string) => {
    setTeamMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          const nextStatus = m.status === 'Active' ? 'Inactive' : 'Active';
          return { ...m, status: nextStatus };
        }
        return m;
      })
    );
    showFeedback('User account status updated.');
  };

  const handleDeleteMember = (memberId: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
    showFeedback('Team member removed from directory.');
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl">
      {/* Header Matching Screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            Team Access & Permissions Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage team member accounts, assign authoritative database roles, and configure role permission matrices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => showFeedback('Directory refreshed.')}
            className="text-xs gap-1.5 h-9 bg-white flex-1 sm:flex-initial min-h-[36px] justify-center"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setInviteModalOpen(true)}
            className="text-xs gap-1.5 h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex-1 sm:flex-initial min-h-[36px] justify-center"
          >
            <UserPlus className="h-3.5 w-3.5" /> Invite User
          </Button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in duration-150">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Tabs Pill Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('directory')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 whitespace-nowrap min-h-[36px]',
            activeTab === 'directory'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          )}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Team Directory & Access ({teamMembers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 whitespace-nowrap min-h-[36px]',
            activeTab === 'matrix'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          )}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Role Permissions Matrix ({SYSTEM_ROLES.length} Roles)</span>
        </button>
      </div>

      {/* TAB 1: TEAM DIRECTORY & ACCESS */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or dept..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                {SYSTEM_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Team Directory</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Displaying {filteredMembers.length} of {teamMembers.length} registered team members
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">USER</th>
                    <th className="py-3 px-4">ROLE</th>
                    <th className="py-3 px-4">DEPARTMENT</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4">OVERRIDES</th>
                    <th className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* User Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 uppercase">{member.name}</span>
                              {member.isCurrentUser && (
                                <span className="rounded-full bg-blue-50 px-1.5 py-0.2 text-[10px] font-semibold text-blue-600 border border-blue-200">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 lowercase">{member.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Column */}
                      <td className="py-3.5 px-4">
                        {member.role === 'Founder' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200/80">
                            🛡️ {member.role}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                            {member.role}
                          </span>
                        )}
                      </td>

                      {/* Department Column */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {member.department}
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold',
                            member.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          )}
                        >
                          {member.status}
                        </span>
                      </td>

                      {/* Overrides Column */}
                      <td className="py-3.5 px-4">
                        {member.overrides.includes('custom') ? (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-[11px] text-slate-800">
                            {member.overrides}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {member.overrides}
                          </span>
                        )}
                      </td>

                      {/* Actions Column Matching Icons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 text-slate-400">
                          <button
                            onClick={() => showFeedback(`Inspect keys for ${member.name}`)}
                            className="p-1 hover:text-slate-700 transition-colors"
                            title="Credentials / Keys"
                          >
                            <Key className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => showFeedback(`Edit ${member.name}`)}
                            className="p-1 hover:text-slate-700 transition-colors"
                            title="Edit Profile"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => showFeedback(`Role override for ${member.name}`)}
                            className="p-1 hover:text-slate-700 transition-colors"
                            title="Assign Role Override"
                          >
                            <Sliders className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => showFeedback(`Security flag for ${member.name}`)}
                            className="p-1 hover:text-amber-600 transition-colors"
                            title="Security Audit"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(member.id)}
                            className="p-1 hover:text-rose-600 transition-colors"
                            title="Toggle Status (Disable / Enable)"
                          >
                            <Slash className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => showFeedback(`Revoke active sessions for ${member.name}`)}
                            className="p-1 hover:text-slate-700 transition-colors"
                            title="Sign Out Sessions"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => showFeedback(`Lock account for ${member.name}`)}
                            className="p-1 hover:text-slate-700 transition-colors"
                            title="Lockout"
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="p-1 hover:text-rose-600 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLE PERMISSIONS MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-5">
          {/* Role Selector Header */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  SELECT SYSTEM ROLE TO CONFIGURE
                </span>
                <div className="flex items-center gap-2.5 mt-1">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SYSTEM_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                    {activePermissionsCount} of {totalPermissionsCount} Permissions Active
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToDefault}
                className="text-xs h-8 gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" /> Reset to Default
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleResetToDefault();
                  showFeedback('All roles reset to baseline defaults.');
                }}
                className="text-xs h-8 gap-1.5 text-amber-700 border-amber-200 bg-amber-50/50 hover:bg-amber-100/50"
              >
                <RotateCcw className="h-3.5 w-3.5 text-amber-600" /> Reset All to Default
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => showFeedback('Changes discarded.')}
                className="text-xs h-8 gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" /> Discard
              </Button>
              <Button
                size="sm"
                onClick={handleSaveMatrix}
                className="text-xs h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              >
                <Check className="h-3.5 w-3.5" /> Save Role Permissions
              </Button>
            </div>
          </div>

          {/* Permission Groups */}
          <div className="space-y-4">
            {PERMISSION_GROUPS.map((group) => {
              const enabledInGroup = group.permissions.filter((p) => permissionsState[p.id]).length;
              return (
                <div key={group.category} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
                          {group.category}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {enabledInGroup} of {group.permissions.length} permissions enabled
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <button
                        onClick={() => handleToggleGroup(group, true)}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Enable All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={() => handleToggleGroup(group, false)}
                        className="text-slate-500 hover:text-slate-700 font-medium"
                      >
                        Disable All
                      </button>
                    </div>
                  </div>

                  {/* Permission Toggle Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.permissions.map((perm) => {
                      const isEnabled = Boolean(permissionsState[perm.id]);
                      return (
                        <div
                          key={perm.id}
                          className={cn(
                            'rounded-xl border p-3.5 flex flex-col justify-between gap-2 transition-all',
                            isEnabled
                              ? 'border-blue-200 bg-blue-50/20'
                              : 'border-slate-200/70 bg-slate-50/20'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <h5 className="font-bold text-xs text-slate-900">{perm.label}</h5>
                              <code className="text-[10px] font-mono text-slate-400 block">{perm.key}</code>
                            </div>

                            {/* Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(perm.id)}
                              className={cn(
                                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                                isEnabled ? 'bg-blue-600' : 'bg-slate-200'
                              )}
                            >
                              <span
                                className={cn(
                                  'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                                  isEnabled ? 'translate-x-4' : 'translate-x-0'
                                )}
                              />
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {perm.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invite User Dialog */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogHeader>
          <DialogTitle>Invite New Team Member</DialogTitle>
          <DialogDescription>
            Send an onboarding invite and assign a system role with default permission matrix inheritance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-900">Full Name *</label>
            <Input
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="e.g. Sindhu Gangisetty"
              required
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-900">Email Address *</label>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="e.g. member@genmitra.com"
              required
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-900">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-background text-xs"
              >
                {SYSTEM_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-900">Department</label>
              <Input
                value={inviteDept}
                onChange={(e) => setInviteDept(e.target.value)}
                placeholder="e.g. Engineering"
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setInviteModalOpen(false)} className="w-full sm:w-auto min-h-[36px]">
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto min-h-[36px]">
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
