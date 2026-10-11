// src/components/layout/MobileDrawer.tsx
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../stores/ui.store';
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
} from 'lucide-react';

export function MobileDrawer() {
  const { role } = useAuth();
  const { mobileDrawerOpen, setMobileDrawerOpen, unreadCount } = useUIStore();

  if (!mobileDrawerOpen) return null;

  const getNavItems = () => {
    if (role === 'intern') {
      return [
        { label: 'Dashboard', to: '/intern', icon: LayoutDashboard },
        { label: 'Assignments', to: '/intern/assignments', icon: FileText },
        { label: 'Tasks', to: '/intern/tasks', icon: CheckSquare },
        { label: 'Notifications', to: '/intern/notifications', icon: Bell, badge: unreadCount },
        { label: 'Profile', to: '/intern/profile', icon: User },
      ];
    }
    if (role === 'mentor') {
      return [
        { label: 'Dashboard', to: '/mentor', icon: LayoutDashboard },
        { label: 'My Interns', to: '/mentor/interns', icon: Users },
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

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs"
        onClick={() => setMobileDrawerOpen(false)}
      />
      <div className="relative z-50 flex w-72 flex-col bg-card border-r shadow-xl">
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <span className="font-bold text-sm tracking-tight text-foreground">InternOS</span>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {getNavItems().map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileDrawerOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
