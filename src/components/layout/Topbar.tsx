// src/components/layout/Topbar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Bell,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../stores/ui.store';
import { useAttendanceStore } from '../../stores/attendance.store';
import { Avatar } from '../shared/Avatar';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../features/notifications/api';

export function Topbar() {
  const { profile, role, signOut, user } = useAuth();
  const unreadCount = useUIStore((s) => s.unreadCount);
  const setUnreadCount = useUIStore((s) => s.setUnreadCount);
  const setMobileDrawerOpen = useUIStore((s) => s.setMobileDrawerOpen);
  const { isCheckedIn, isOnBreak, elapsedSeconds, targetHours, isCompletedToday } = useAttendanceStore();
  const navigate = useNavigate();
  const location = useLocation();

  const userId = user?.id || profile?.id || '00000000-0000-0000-0000-000000000011';

  // Live notifications query
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => notificationsApi.getNotifications(userId),
    refetchInterval: 30000,
  });

  useEffect(() => {
    const unread = notifications.filter((n: any) => !n.is_read).length;
    if (useUIStore.getState().unreadCount !== unread) {
      setUnreadCount(unread);
    }
  }, [notifications, setUnreadCount]);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    navigate('/');
  };

  const getNotificationsPath = () => {
    if (role === 'intern') return '/intern/notifications';
    if (role === 'mentor') return '/mentor/notifications';
    return '/admin/notifications';
  };

  const getProfilePath = () => {
    if (role === 'intern') return '/intern/profile';
    if (role === 'mentor') return '/mentor/profile';
    return '/admin/settings';
  };

  // Derive page title and breadcrumb from path
  const getPageTitleAndBreadcrumb = () => {
    const path = location.pathname;
    if (path.includes('/tasks/')) return { breadcrumb: 'Tasks', title: 'Task Details' };
    if (path.includes('/tasks')) return { breadcrumb: 'Workspace', title: 'Task Deliverables' };
    if (path.includes('/assignments/')) return { breadcrumb: 'Coursework', title: 'Assignment Details' };
    if (path.includes('/assignments')) return { breadcrumb: 'Coursework', title: 'Assignments & Modules' };
    if (path.includes('/attendance')) {
      if (role === 'mentor') return { breadcrumb: 'Supervision', title: 'Intern Attendance Roster' };
      if (role === 'admin') return { breadcrumb: 'Administration', title: 'Cohort Timesheets & Attendance' };
      return { breadcrumb: 'Workspace', title: 'Daily Attendance & Shifts' };
    }
    if (path.includes('/notifications')) return { breadcrumb: 'Activity', title: 'Notifications' };
    if (path.includes('/profile')) return { breadcrumb: 'Account', title: 'Intern Profile' };
    if (path.includes('/interns')) return { breadcrumb: 'Management', title: 'Intern Roster' };
    if (path.includes('/reviews')) return { breadcrumb: 'Submissions', title: 'Deliverable Reviews' };
    if (path.includes('/broadcast')) return { breadcrumb: 'System', title: 'Platform Broadcasts' };
    if (path.includes('/maintenance')) return { breadcrumb: 'System', title: 'Maintenance Mode' };
    if (path.includes('/auth-security')) return { breadcrumb: 'Security', title: 'Authentication & Credentials' };
    if (path.includes('/permissions')) return { breadcrumb: 'Governance', title: 'Team Access & Permissions Management' };
    if (path.includes('/settings')) return { breadcrumb: 'System', title: 'Platform Settings' };
    return { breadcrumb: 'Workspace', title: 'Dashboard' };
  };

  const { breadcrumb, title: pageTitle } = getPageTitleAndBreadcrumb();

  // Format attendance time for header pill
  const shiftHours = Math.floor(elapsedSeconds / 3600);
  const shiftMinutes = Math.floor((elapsedSeconds % 3600) / 60);
  const formattedShiftTime = `${shiftHours}h ${String(shiftMinutes).padStart(2, '0')}m`;

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 sm:px-6 md:px-8 backdrop-blur-md">
      {/* Left: Mobile hamburger + Breadcrumb & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 truncate">
          <span className="text-xs font-medium text-slate-500 hidden sm:inline">{breadcrumb}</span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <h1 className="text-sm font-semibold text-slate-900 truncate tracking-tight">{pageTitle}</h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Attendance Live Timer Pill (for intern) */}
        {role === 'intern' && (
          <div className="hidden sm:flex items-center">
            {isCompletedToday ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" /> 4h Completed
              </span>
            ) : isCheckedIn ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border tabular-nums',
                  isOnBreak
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                )}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{formattedShiftTime} / {targetHours}h</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <Clock className="h-3 w-3 text-slate-400" /> Shift: Not Started
              </span>
            )}
          </div>
        )}

        {/* Notifications Popover */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Notifications"
            aria-label="Open notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white p-4 shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-200">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <Link
                  to={getNotificationsPath()}
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  View all
                </Link>
              </div>

              <div className="py-2 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.slice(0, 6).map((n: any) => (
                    <div
                      key={n.id}
                      onClick={async () => {
                        if (!n.is_read) {
                          await notificationsApi.markAsRead(n.id);
                        }
                        setNotificationsOpen(false);
                        navigate(getNotificationsPath());
                      }}
                      className={cn(
                        "py-2.5 space-y-1 transition-colors cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-lg",
                        !n.is_read && "bg-slate-50/80 font-medium"
                      )}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                          {n.type === 'announcement' ? (
                            <Sparkles className="h-3 w-3 text-purple-600 shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 text-indigo-500 shrink-0" />
                          )}
                          <span className="truncate">{n.title}</span>
                        </span>
                        {!n.is_read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0 ml-1"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <Link
                  to={getNotificationsPath()}
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  See all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Menu Dropdown (Replacing Loose Logout Icon) */}
        <div className="relative pl-1 sm:pl-2 border-l border-slate-200" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-lg p-1 text-left hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-expanded={userMenuOpen}
            aria-label="User account menu"
          >
            <Avatar
              src={profile?.avatar_url}
              name={role === 'admin' ? 'Admin' : (profile?.full_name || 'User')}
              size="sm"
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-semibold leading-tight text-slate-900 truncate max-w-[120px]">
                {role === 'admin' ? 'Admin' : (profile?.full_name || (role === 'mentor' ? 'Mentor' : 'Intern'))}
              </span>
              <span className="text-[10px] capitalize text-slate-500 leading-tight">
                {role || 'Intern'}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform hidden sm:inline" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* User Meta Header */}
              <div className="px-3 py-2 border-b border-slate-100 space-y-0.5">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {role === 'admin' ? 'Admin' : (profile?.full_name || (role === 'mentor' ? 'Mentor' : 'Intern'))}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {profile?.email || 'user@genmitra.com'}
                </p>
                <span className="inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 capitalize border border-indigo-200">
                  {role} Account
                </span>
              </div>

              {/* Links */}
              <div className="py-1">
                <Link
                  to={getProfilePath()}
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <UserIcon className="h-3.5 w-3.5 text-slate-500" />
                  <span>My Profile</span>
                </Link>
                <Link
                  to={getNotificationsPath()}
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <Bell className="h-3.5 w-3.5 text-slate-500" />
                  <span>Notifications</span>
                </Link>
              </div>

              {/* Sign out */}
              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
