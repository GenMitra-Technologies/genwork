import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileDrawer } from './MobileDrawer';
import { useUIStore } from '../../stores/ui.store';
import { useIdleTimeout } from '../../hooks/useIdleTimeout';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import { useAuth } from '../../hooks/useAuth';
import { useAttendanceStore } from '../../stores/attendance.store';
import { cn } from '../../lib/utils';

export function AppShell() {
  const { sidebarCollapsed } = useUIStore();
  const { profile } = useAuth();

  // Attach idle timeout and realtime notifications
  useIdleTimeout(true);
  useRealtimeNotifications(profile?.id);

  // Global attendance timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      useAttendanceStore.getState().tick();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden flex flex-col">
      <Sidebar />
      <MobileDrawer />

      <div
        className={cn(
          'flex flex-col min-h-screen min-w-0 flex-1 transition-all duration-300',
          sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-[256px]'
        )}
      >
        <Topbar />
        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
