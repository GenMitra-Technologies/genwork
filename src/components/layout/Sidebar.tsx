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
  Calendar,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../stores/ui.store';
import { Logo } from '../shared/Logo';
import { cn } from '../../lib/utils';

export function Sidebar() {
  const { role, profile, signOut } = useAuth();
  const { sidebarCollapsed, toggleSidebar, unreadCount } = useUIStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/genmitraworkspace');
  };

  const getNavItems = () => {
    if (role === 'intern') {
      return [
        { label: 'Dashboard', to: '/intern', icon: LayoutDashboard },
        { label: 'Tasks', to: '/intern/tasks', icon: CheckSquare },
        { label: 'Assignments', to: '/intern/assignments', icon: FileText },
        { label: 'Attendance', to: '/intern/attendance', icon: CalendarCheck },
        { label: 'Notifications', to: '/intern/notifications', icon: Bell, badge: unreadCount },
        { label: 'Profile', to: '/intern/profile', icon: User },
      ];
    }
    if (role === 'mentor') {
      return [
        { label: 'Dashboard', to: '/mentor', icon: LayoutDashboard },
        { label: 'My Interns', to: '/mentor/interns', icon: Users },
        { label: 'Attendance', to: '/mentor/attendance', icon: CalendarCheck },
        { label: 'Tasks', to: '/mentor/tasks', icon: CheckSquare },
        { label: 'Assignments', to: '/mentor/assignments', icon: FileText },
        { label: 'Reviews', to: '/mentor/reviews', icon: Eye },
        { label: 'Notifications', to: '/mentor/notifications', icon: Bell, badge: unreadCount },
        { label: 'Activity', to: '/mentor/activity', icon: Activity },
        { label: 'Profile', to: '/mentor/profile', icon: User },
      ];
    }
    // Admin
    return [
      { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
      { label: 'Internships', to: '/admin/internships', icon: GraduationCap },
      { label: 'Interns', to: '/admin/interns', icon: Users },
      { label: 'Mentors', to: '/admin/mentors', icon: Award },
      { label: 'Attendance', to: '/admin/attendance', icon: CalendarCheck },
      { label: 'Logins & Credentials', to: '/admin/credentials', icon: KeyRound },
      { label: 'Tasks', to: '/admin/tasks', icon: CheckSquare },
      { label: 'Assignments', to: '/admin/assignments', icon: FileText },
      { label: 'Reviews', to: '/admin/reviews', icon: Eye },
      { label: 'Notifications', to: '/admin/notifications', icon: Bell, badge: unreadCount },
      { label: 'Activity Logs', to: '/admin/activity-logs', icon: Activity },
      { label: 'Reports', to: '/admin/reports', icon: FileSpreadsheet },
      { label: 'Settings', to: '/admin/settings', icon: Settings },
    ];
  };

  const navItems = getNavItems();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col fixed top-0 bottom-0 left-0 z-30 border-r border-slate-200/90 bg-white shadow-xs transition-all duration-300 select-none',
        sidebarCollapsed ? 'w-[72px]' : 'w-[256px]'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200/90">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Logo
            size="sm"
            imageClassName={sidebarCollapsed ? 'h-7 w-7 object-left' : 'h-7 w-auto'}
          />
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-900 tracking-wide uppercase">
                {role} Workspace
              </span>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/intern' || item.to === '/mentor' || item.to === '/admin'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all relative group',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-medium border-l-[3px] border-indigo-600 rounded-l-none'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-normal'
                )
              }
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={cn(
                    'ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold',
                    sidebarCollapsed
                      ? 'absolute top-1.5 right-1.5 h-2 w-2 p-0 bg-rose-500'
                      : 'bg-rose-500 text-white'
                  )}
                >
                  {!sidebarCollapsed && (item.badge > 9 ? '9+' : item.badge)}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Footer: Cohort Card & Sign Out */}
      <div className="p-3 border-t border-slate-200/90 bg-slate-50/50 space-y-2">
        {!sidebarCollapsed && (
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <Calendar className="h-3.5 w-3.5 text-indigo-600" />
              <span className="font-medium text-slate-700">Engineering Cohort</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {profile?.full_name || 'David Kim'}
            </p>
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
          <LogOut className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
