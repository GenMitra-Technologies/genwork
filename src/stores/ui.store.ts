// src/stores/ui.store.ts
import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
  theme: 'light';
  unreadCount: number;
  toggleSidebar: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
}

export const useUIStore = create<UIState>((set) => {
  // Always ensure light mode
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('dark');
  }

  return {
    sidebarCollapsed: false,
    mobileDrawerOpen: false,
    theme: 'light',
    unreadCount: 0,
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),
    setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
    incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
    decrementUnreadCount: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  };
});
