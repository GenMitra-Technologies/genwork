// src/components/layout/MobileDrawer.tsx
import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  X,
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
  LogOut,
  Calendar,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../stores/ui.store';
import { Logo } from '../shared/Logo';
import { cn } from '../../lib/utils';

export function MobileDrawer() {
  const { role, profile, signOut } = useAuth();
  const { mobileDrawerOpen, setMobileDrawerOpen, unreadCount } = useUIStore();
  const navigate = useNavigate();

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileDrawerOpen(false);
    };
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileDrawerOpen, setMobileDrawerOpen]);

  if (!mobileDrawerOpen) return null;

  const handleSignOut = async () => {
    setMobileDrawerOpen(false);
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
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setMobileDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <div className="relative z-50 flex w-72 max-w-[80vw] flex-col bg-white shadow-2xl border-r border-slate-200 animate-in slide-in-from-left duration-300">
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Logo size="sm" className="h-7 w-auto" />
            <span className="text-[11px] text-slate-800 uppercase font-bold tracking-wider">
              {role}
            </span>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/intern' || item.to === '/mentor' || item.to === '/admin'}
                onClick={() => setMobileDrawerOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-[3px] border-indigo-600 rounded-l-none'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <Calendar className="h-3.5 w-3.5 text-indigo-600" />
              <span className="font-medium text-slate-700">Engineering Cohort</span>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {profile?.full_name || 'David Kim'}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 w-full p-2.5 shadow-2xs transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
