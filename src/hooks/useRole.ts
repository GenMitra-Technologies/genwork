// src/hooks/useRole.ts
import { useAuth } from './useAuth';
import { UserRole } from '../types/database.types';

export function useRole() {
  const { role, profile, loading } = useAuth();

  const isRole = (targetRole: UserRole) => role === targetRole;
  const isIntern = role === 'intern';
  const isMentor = role === 'mentor';
  const isAdmin = role === 'admin';

  return {
    role,
    profile,
    loading,
    isRole,
    isIntern,
    isMentor,
    isAdmin,
  };
}
