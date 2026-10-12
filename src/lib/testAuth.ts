// src/lib/testAuth.ts
import { UserRole } from '../types/database.types';
import { UserProfile } from '../types/domain';

export interface TestAccount {
  email: string;
  role: UserRole;
  profile: UserProfile;
  supabaseEmail: string;
  supabasePassword: string;
}

export const TEST_ACCOUNTS: Record<string, TestAccount> = {
  // Intern Account
  'sindhugangisetty910@gmail.com': {
    email: 'sindhugangisetty910@gmail.com',
    role: 'intern',
    supabaseEmail: 'sindhugangisetty910@gmail.com',
    supabasePassword: 'GENMITRA@INTERN',
    profile: {
      id: '6272414b-a663-4295-b5ba-5654270e139d',
      email: 'sindhugangisetty910@gmail.com',
      full_name: 'SINDHU GANGISETTY',
      avatar_url: null,
      role: 'intern',
      status: 'active',
      must_change_password: false,
      intern_id: '20000000-0000-0000-0000-000000000001',
    },
  },
  'sindhu': {
    email: 'sindhu',
    role: 'intern',
    supabaseEmail: 'sindhugangisetty910@gmail.com',
    supabasePassword: 'GENMITRA@INTERN',
    profile: {
      id: '6272414b-a663-4295-b5ba-5654270e139d',
      email: 'sindhugangisetty910@gmail.com',
      full_name: 'SINDHU GANGISETTY',
      avatar_url: null,
      role: 'intern',
      status: 'active',
      must_change_password: false,
      intern_id: '20000000-0000-0000-0000-000000000001',
    },
  },

  // Mentor Account
  'manireddy@genmitra.com': {
    email: 'manireddy@genmitra.com',
    role: 'mentor',
    supabaseEmail: 'manireddy@genmitra.com',
    supabasePassword: 'GENMITRA@MENTOR',
    profile: {
      id: '75f9c52b-4810-43b1-923f-4995611c0071',
      email: 'manireddy@genmitra.com',
      full_name: 'Kapu Mani Shankar Reddy',
      avatar_url: null,
      role: 'mentor',
      status: 'active',
      must_change_password: false,
      mentor_id: '10000000-0000-0000-0000-000000000001',
    },
  },
  'manireddy': {
    email: 'manireddy',
    role: 'mentor',
    supabaseEmail: 'manireddy@genmitra.com',
    supabasePassword: 'GENMITRA@MENTOR',
    profile: {
      id: '75f9c52b-4810-43b1-923f-4995611c0071',
      email: 'manireddy@genmitra.com',
      full_name: 'Kapu Mani Shankar Reddy',
      avatar_url: null,
      role: 'mentor',
      status: 'active',
      must_change_password: false,
      mentor_id: '10000000-0000-0000-0000-000000000001',
    },
  },

  // Admin Account
  'ops@genmitra.com': {
    email: 'ops@genmitra.com',
    role: 'admin',
    supabaseEmail: 'ops@genmitra.com',
    supabasePassword: 'GENMITRA@ADMIN2026',
    profile: {
      id: '2256856d-922f-454b-bda8-b16eae81d7f6',
      email: 'ops@genmitra.com',
      full_name: 'GenMitra Operations',
      avatar_url: null,
      role: 'admin',
      status: 'active',
      must_change_password: false,
    },
  },
  'admin': {
    email: 'admin',
    role: 'admin',
    supabaseEmail: 'ops@genmitra.com',
    supabasePassword: 'GENMITRA@ADMIN2026',
    profile: {
      id: '2256856d-922f-454b-bda8-b16eae81d7f6',
      email: 'ops@genmitra.com',
      full_name: 'GenMitra Operations',
      avatar_url: null,
      role: 'admin',
      status: 'active',
      must_change_password: false,
    },
  },
};

export function findTestAccount(email: string): TestAccount | null {
  const normalized = email.trim().toLowerCase();
  return TEST_ACCOUNTS[normalized] || null;
}
