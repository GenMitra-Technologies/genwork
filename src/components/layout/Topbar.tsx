// src/components/layout/Topbar.tsx
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../stores/ui.store';
import { Avatar } from '../shared/Avatar';
import { Button } from '../ui/button';

export function Topbar() {
  const { profile, role, signOut } = useAuth();
  const { setMobileDrawerOpen, theme, toggleTheme, unreadCount } = useUIStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getNotificationsPath = () => {
    if (role === 'intern') return '/intern/notifications';
    if (role === 'mentor') return '/mentor/notifications';
    return '/admin/notifications';
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b bg-card/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notification Bell */}
        <Link
          to={getNotificationsPath()}
          className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Info */}
        <div className="flex items-center gap-2 pl-2 border-l">
          <Avatar
            src={profile?.avatar_url}
            name={profile?.full_name || 'User'}
            size="sm"
          />
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold leading-tight text-foreground">
              {profile?.full_name || 'User'}
            </span>
            <span className="text-[10px] capitalize text-muted-foreground">
              {role || 'Role'}
            </span>
          </div>

          {/* Sign out */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-destructive h-8 w-8 ml-1"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
