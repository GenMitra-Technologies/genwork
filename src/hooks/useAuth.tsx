// src/hooks/useAuth.ts
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/domain';
import { UserRole } from '../types/database.types';
import { TestAccount, findTestAccount } from '../lib/testAuth';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginAsTestAccount: (account: TestAccount) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  role: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  loginAsTestAccount: () => {},
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

function createMockUserAndSession(account: TestAccount): { user: User; session: Session } {
  const user = {
    id: account.profile.id,
    app_metadata: { provider: 'email' },
    user_metadata: { full_name: account.profile.full_name, role: account.role },
    aud: 'authenticated',
    confirmation_sent_at: '',
    recovery_sent_at: '',
    email_change_sent_at: '',
    new_email: '',
    invited_at: '',
    action_link: '',
    email: account.profile.email,
    phone: '',
    created_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: '',
    last_sign_in_at: new Date().toISOString(),
    role: 'authenticated',
    updated_at: new Date().toISOString(),
    identities: [],
    factors: [],
  } as unknown as User;

  const session = {
    access_token: 'genmitra-test-access-token',
    refresh_token: 'genmitra-test-refresh-token',
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    token_type: 'bearer',
    user,
  } as Session;

  return { user, session };
}

  const loginAsTestAccount = (account: TestAccount) => {
    try {
      localStorage.setItem('genmitra_test_session', JSON.stringify(account));
    } catch {
      // ignore
    }
    const { user: mockUser, session: mockSession } = createMockUserAndSession(account);
    setSession(mockSession);
    setUser(mockUser);
    setProfile(account.profile);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mounted) return;
      if (initialSession?.user) {
        setSession(initialSession);
        setUser(initialSession.user);
        fetchProfile(initialSession.user).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        try {
          const savedTestSession = localStorage.getItem('genmitra_test_session');
          if (savedTestSession) {
            const parsed = JSON.parse(savedTestSession) as TestAccount;
            if (parsed?.profile && parsed?.role) {
              const { user: mockUser, session: mockSession } = createMockUserAndSession(parsed);
              setSession(mockSession);
              setUser(mockUser);
              setProfile(parsed.profile);
              setLoading(false);
              return;
            }
          }
        } catch {
          // ignore
        }
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          await fetchProfile(newSession.user);
          setLoading(false);
        } else {
          // Only clear if no test session in local storage
          const savedTestSession = localStorage.getItem('genmitra_test_session');
          if (savedTestSession) {
            try {
              const parsed = JSON.parse(savedTestSession) as TestAccount;
              if (parsed?.profile) {
                const { user: mockUser, session: mockSession } = createMockUserAndSession(parsed);
                setSession(mockSession);
                setUser(mockUser);
                setProfile(parsed.profile);
                setLoading(false);
                return;
              }
            } catch {
              // ignore
            }
          }
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      localStorage.removeItem('genmitra_test_session');
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
        loginAsTestAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
