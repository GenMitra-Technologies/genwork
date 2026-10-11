// src/components/layout/AppShell.tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileDrawer } from './MobileDrawer';
import { useUIStore } from '../../stores/ui.store';
import { useIdleTimeout } from '../../hooks/useIdleTimeout';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

export function AppShell() {
  const { sidebarCollapsed } = useUIStore();
  const { profile } = useAuth();

  // Attach idle timeout and realtime notifications
  useIdleTimeout(true);
  useRealtimeNotifications(profile?.id);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileDrawer />

      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'md:pl-18' : 'md:pl-64'
        )}
      >
        <Topbar />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
