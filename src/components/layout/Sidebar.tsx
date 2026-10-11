// src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router-dom';
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
  Briefcase,
  KeyRound,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Award,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../stores/ui.store';
import { Logo } from '../shared/Logo';
import { cn } from '../../lib/utils';

export function Sidebar() {
  const { role } = useAuth();
  const { sidebarCollapsed, toggleSidebar, unreadCount } = useUIStore();

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
    // Admin
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

  const navItems = getNavItems();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col fixed top-0 bottom-0 left-0 z-30 border-r border-slate-200/80 dark:border-slate-800 bg-transparent backdrop-blur-md transition-all duration-300',
        sidebarCollapsed ? 'w-18' : 'w-64'
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center justify-between px-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-hidden">
          <Logo
            size="sm"
            imageClassName={sidebarCollapsed ? 'h-7 w-7 object-left' : 'h-7 w-auto'}
          />
          {!sidebarCollapsed && (
            <div className="flex flex-col ml-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                {role} Workspace
              </span>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 shrink-0"
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
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative group',
                  isActive
                    ? 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold border border-slate-200/90 dark:border-slate-700/80 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                )
              }
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={cn(
                    'ml-auto rounded-full px-2 py-0.5 text-xs font-bold',
                    sidebarCollapsed ? 'absolute top-1.5 right-1.5 h-2 w-2 p-0 bg-rose-500' : 'bg-rose-500 text-white'
                  )}
                >
                  {!sidebarCollapsed && item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
