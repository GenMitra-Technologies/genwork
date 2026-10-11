// src/hooks/useAuth.ts
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/domain';
import { UserRole } from '../types/database.types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  role: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      const profileData = data as any;
      if (!error && profileData) {
        // Fetch intern_id or mentor_id if applicable
        let intern_id: string | undefined;
        let mentor_id: string | undefined;

        if (profileData.role === 'intern') {
          const { data: internRow } = await supabase
            .from('interns')
            .select('id')
            .eq('profile_id', currentUser.id)
            .maybeSingle();
          intern_id = (internRow as any)?.id;
        } else if (profileData.role === 'mentor') {
          const { data: mentorRow } = await supabase
            .from('mentors')
            .select('id')
            .eq('profile_id', currentUser.id)
            .maybeSingle();
          mentor_id = (mentorRow as any)?.id;
        }

        setProfile({
          id: profileData.id,
          email: profileData.email,
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
          role: profileData.role,
          status: profileData.status,
          must_change_password: profileData.must_change_password,
          intern_id,
          mentor_id,
        });
        return;
      }
    } catch {
      // ignore
    }

    // Fallback if profiles table is not yet populated or accessible
    const meta = currentUser.user_metadata || {};
    const fallbackRole = (meta.role as UserRole) || 'intern';
    setProfile({
      id: currentUser.id,
      email: currentUser.email || '',
      full_name: meta.full_name || currentUser.email?.split('@')[0] || 'User',
      avatar_url: null,
      role: fallbackRole,
      status: 'active',
      must_change_password: false,
    });
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchProfile(initialSession.user).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchProfile(newSession.user);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        role: profile?.role ?? null,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
