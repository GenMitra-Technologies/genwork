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
  CalendarCheck,
  ChevronRight,
  ShieldCheck,
  Megaphone,
  Wrench,
  Database,
  HardDrive,
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
            { label: 'Tasks', to: '/intern/tasks', icon: CheckSquare },
            { label: 'Assignments', to: '/intern/assignments', icon: FileText },
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
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setMobileDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <div className="relative z-50 flex w-72 max-w-[80vw] flex-col bg-white shadow-2xl border-r border-slate-200 animate-in slide-in-from-left duration-300">
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100">
          <Logo size="sm" className="h-7 w-auto" />
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {navCategories.map((category, catIdx) => (
            <div key={catIdx} className="space-y-1">
              <h4 className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {category.title}
              </h4>
              <div className="space-y-0.5">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/intern' || item.to === '/mentor' || item.to === '/admin'}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-all font-medium',
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0 transition-colors',
                              isActive ? 'text-white' : 'text-slate-400'
                            )}
                          />
                          <span className="truncate flex-1">{item.label}</span>

                          {item.badge !== undefined && item.badge > 0 && (
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.2 text-[10px] font-bold ml-auto',
                                isActive ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'
                              )}
                            >
                              {item.badge > 9 ? '9+' : item.badge}
                            </span>
                          )}

                          {isActive && item.badge === undefined && (
                            <ChevronRight className="h-3.5 w-3.5 text-white/80 ml-auto" />
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

        {/* Bottom Drawer Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/40 space-y-2">
          <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs space-y-0.5">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {profile?.full_name || 'manohar'}
            </p>
            <span className="inline-block px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-mono text-slate-600 uppercase">
              {role || 'admin'}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 w-full p-2 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
