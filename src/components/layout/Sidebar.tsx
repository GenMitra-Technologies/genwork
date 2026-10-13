// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Bell,
  User,
  Users,
  Eye,
  Activity,
  GraduationCap,
  Award,
  KeyRound,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CalendarCheck,
  Megaphone,
  Wrench,
  ShieldCheck,
  HardDrive,
  Database,
  Keyboard,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../stores/ui.store';
import { Logo } from '../shared/Logo';
import { cn } from '../../lib/utils';

interface NavCategory {
  title: string;
  items: {
    label: string;
    to: string;
    icon: React.ElementType;
    badge?: number;
  }[];
}

export function Sidebar() {
  const { role, profile, signOut } = useAuth();
  const { sidebarCollapsed, toggleSidebar, unreadCount } = useUIStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getNavCategories = (): NavCategory[] => {
    if (role === 'intern') {
      return [
        {
          title: 'OVERVIEW',
          items: [
            { label: 'Dashboard', to: '/intern', icon: LayoutDashboard },
          ],
        },
        {
          title: 'WORK & DELIVERABLES',
          items: [
            { label: 'Courses', to: '/intern/courses', icon: GraduationCap },
            { label: 'Tasks', to: '/intern/tasks', icon: CheckSquare },
            { label: 'Assignments', to: '/intern/assignments', icon: FileText },
            { label: 'Typing Test', to: '/intern/typing-test', icon: Keyboard },
          ],
        },
        {
          title: 'SHIFT & ATTENDANCE',
          items: [
            { label: 'Attendance', to: '/intern/attendance', icon: CalendarCheck },
          ],
        },
        {
          title: 'ACCOUNT & SYSTEM',
          items: [
            { label: 'Notifications', to: '/intern/notifications', icon: Bell, badge: unreadCount },
            { label: 'Profile', to: '/intern/profile', icon: User },
          ],
        },
      ];
    }

    if (role === 'mentor') {
      return [
        {
          title: 'OVERVIEW',
          items: [
            { label: 'Dashboard', to: '/mentor', icon: LayoutDashboard },
          ],
        },
        {
          title: 'COHORT MENTORING',
          items: [
            { label: 'My Interns', to: '/mentor/interns', icon: Users },
            { label: 'Attendance', to: '/mentor/attendance', icon: CalendarCheck },
          ],
        },
        {
          title: 'CURRICULUM & REVIEWS',
          items: [
            { label: 'Courses', to: '/mentor/courses', icon: GraduationCap },
            { label: 'Tasks', to: '/mentor/tasks', icon: CheckSquare },
            { label: 'Assignments', to: '/mentor/assignments', icon: FileText },
            { label: 'Review Queue', to: '/mentor/reviews', icon: Eye },
          ],
        },
        {
          title: 'MANAGEMENT & ACCOUNT',
          items: [
            { label: 'Notifications', to: '/mentor/notifications', icon: Bell, badge: unreadCount },
            { label: 'Activity Logs', to: '/mentor/activity', icon: Activity },
            { label: 'Profile', to: '/mentor/profile', icon: User },
          ],
        },
      ];
    }

    // Admin Navigation Categories (Matches Admin Control Center Screenshot)
    return [
      {
        title: 'OVERVIEW',
        items: [
          { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
        ],
      },
      {
        title: 'PEOPLE & WORKFORCE',
        items: [
          { label: 'Workforce & Interns', to: '/admin/interns', icon: Users },
          { label: 'Mentors', to: '/admin/mentors', icon: Award },
          { label: 'Internships', to: '/admin/internships', icon: GraduationCap },
          { label: 'Attendance', to: '/admin/attendance', icon: CalendarCheck },
        ],
      },
      {
        title: 'CURRICULUM & REVIEWS',
        items: [
          { label: 'Courses', to: '/admin/courses', icon: GraduationCap },
          { label: 'Tasks', to: '/admin/tasks', icon: CheckSquare },
          { label: 'Assignments', to: '/admin/assignments', icon: FileText },
          { label: 'Reviews', to: '/admin/reviews', icon: Eye },
        ],
      },
      {
        title: 'ACCESS & GOVERNANCE',
        items: [
          { label: 'Team Access & Permissions', to: '/admin/permissions', icon: Users },
          { label: 'Authentication & Credentials', to: '/admin/auth-security', icon: ShieldCheck },
          { label: 'Users & Access', to: '/admin/credentials', icon: KeyRound },
          { label: 'Audit Logs', to: '/admin/activity-logs', icon: Activity },
          { label: 'Reports', to: '/admin/reports', icon: FileSpreadsheet },
        ],
      },
      {
        title: 'SYSTEM & SETTINGS',
        items: [
          { label: 'Broadcast Announcement', to: '/admin/broadcast', icon: Megaphone },
          { label: 'Maintenance Mode', to: '/admin/maintenance', icon: Wrench },
          { label: 'Supabase Database', to: '/admin/database', icon: Database },
          { label: 'Auto-Backup & Export', to: '/admin/backup', icon: HardDrive },
          { label: 'Notifications', to: '/admin/notifications', icon: Bell, badge: unreadCount },
          { label: 'Settings', to: '/admin/settings', icon: Settings },
        ],
      },
    ];
  };

  const navCategories = getNavCategories();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col fixed top-0 bottom-0 left-0 z-30 border-r border-slate-200/90 bg-white shadow-2xs transition-all duration-300 select-none',
        sidebarCollapsed ? 'w-[68px]' : 'w-[232px]'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Logo
            size="sm"
            imageClassName={sidebarCollapsed ? 'h-7 w-7 object-left' : 'h-7 w-auto'}
          />
        </div>
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 shrink-0 transition-colors focus-visible:outline-none"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Categorized Nav List */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-2.5 scrollbar-thin">
        {navCategories.map((category, catIdx) => (
          <div key={catIdx} className="space-y-0.5">
            {!sidebarCollapsed && (
              <h4 className="px-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {category.title}
              </h4>
            )}
            {sidebarCollapsed && catIdx > 0 && (
              <div className="border-t border-slate-100 my-1.5 mx-1" />
            )}

            <div className="space-y-0.5">
              {category.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/intern' || item.to === '/mentor' || item.to === '/admin'}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center rounded-lg text-xs transition-all relative font-medium',
                        sidebarCollapsed
                          ? 'justify-center p-2'
                          : 'px-2.5 py-1.5 gap-2',
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      )
                    }
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn(
                            'h-3.5 w-3.5 shrink-0 transition-colors',
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                          )}
                        />
                        {!sidebarCollapsed && (
                          <span className="truncate flex-1 text-[11.5px]">{item.label}</span>
                        )}

                        {/* Unread notification badge */}
                        {item.badge !== undefined && item.badge > 0 && (
                          <span
                            className={cn(
                              'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                              sidebarCollapsed
                                ? 'absolute top-1 right-1 h-2 w-2 p-0 bg-rose-500'
                                : isActive
                                ? 'bg-white text-blue-600 ml-auto'
                                : 'bg-rose-500 text-white ml-auto'
                            )}
                          >
                            {!sidebarCollapsed && (item.badge > 9 ? '9+' : item.badge)}
                          </span>
                        )}

                        {/* Right chevron on active item like the screenshot */}
                        {!sidebarCollapsed && isActive && item.badge === undefined && (
                          <ChevronRight className="h-3 w-3 shrink-0 text-white/80 ml-auto" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Footer: User Box & Sign Out (Matching Screenshot) */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/40 space-y-2">
        {!sidebarCollapsed && (
          <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs space-y-0.5">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {role === 'admin' ? 'Admin' : (profile?.full_name || 'Admin')}
            </p>
            <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-mono text-slate-600 uppercase">
              {role || 'admin'}
            </span>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className={cn(
            'flex items-center gap-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 w-full p-2 transition-colors',
            sidebarCollapsed && 'justify-center p-2'
          )}
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!sidebarCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
