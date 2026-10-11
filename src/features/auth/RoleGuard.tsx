// src/features/auth/RoleGuard.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/database.types';

export function RoleGuard({ allow }: { allow: UserRole[] }) {
  const { role, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Deactivated users blocked
  if (profile?.status === 'inactive' || profile?.status === 'suspended') {
    return <Navigate to="/genmitraworkspace?reason=deactivated" replace />;
  }

  if (!role || !allow.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
