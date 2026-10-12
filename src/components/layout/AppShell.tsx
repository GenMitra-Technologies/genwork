import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileDrawer } from './MobileDrawer';
import { useUIStore } from '../../stores/ui.store';
import { useIdleTimeout } from '../../hooks/useIdleTimeout';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import { useAuth } from '../../hooks/useAuth';
import { useAttendanceStore } from '../../stores/attendance.store';
import { cn } from '../../lib/utils';

interface AppShellProps {
  children?: React.ReactNode;
}

export function AppShell({ children }: AppShellProps = {}) {
  const { sidebarCollapsed } = useUIStore();
  const { profile } = useAuth();
  const location = useLocation();
  const isMentor = location.pathname.startsWith('/mentor');

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

  // Listen to maintenance mode state
  const [maintenanceConfig, setMaintenanceConfig] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('genmitra_maintenance_mode');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handler = (e: any) => {
      setMaintenanceConfig(e.detail);
    };
    window.addEventListener('genmitra_maintenance_change', handler);
    return () => window.removeEventListener('genmitra_maintenance_change', handler);
  }, []);

  const isMaintenanceActive = Boolean(maintenanceConfig?.enabled);

  return (
    <div
      className={cn(
        'min-h-screen text-slate-900 overflow-x-hidden flex flex-col',
        isMentor
          ? 'bg-gradient-to-b from-slate-50 via-slate-50/90 to-indigo-50/20'
          : 'bg-slate-50'
      )}
    >
      <Sidebar />
      <MobileDrawer />

      <div
        className={cn(
          'flex flex-col min-h-screen min-w-0 flex-1 transition-all duration-300',
          sidebarCollapsed ? 'md:pl-[68px]' : 'md:pl-[232px]'
        )}
      >
        {isMaintenanceActive && (
          <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-semibold flex items-center justify-between border-b border-amber-600/30 shadow-xs z-30">
            <div className="flex items-center gap-2 truncate">
              <span className="flex h-2 w-2 rounded-full bg-amber-900 animate-ping shrink-0" />
              <span className="font-bold">⚠️ {maintenanceConfig?.title || 'System Maintenance Notice'}:</span>
              <span className="truncate font-medium opacity-90">{maintenanceConfig?.message || 'Platform upgrades underway.'}</span>
            </div>
            {maintenanceConfig?.estimatedDuration && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-600/20 shrink-0 ml-2">
                ~{maintenanceConfig.estimatedDuration}m remaining
              </span>
            )}
          </div>
        )}
        <Topbar />
        <main
          className={cn(
            'flex-1 w-full mx-auto transition-all',
            isMentor
              ? 'max-w-[1140px] px-3 sm:px-5 lg:px-6 py-3.5 space-y-3.5'
              : 'max-w-[1240px] px-3.5 sm:px-5 lg:px-6 py-4 space-y-4'
          )}
        >
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
