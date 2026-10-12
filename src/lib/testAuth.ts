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
  // Intern accounts
  'test@intern': {
    email: 'test@intern',
    role: 'intern',
    supabaseEmail: 'intern.david@internship.org',
    supabasePassword: 'Password123!',
    profile: {
      id: '00000000-0000-0000-0000-000000000011',
      email: 'intern.david@internship.org',
      full_name: 'David Kim (Intern)',
      avatar_url: null,
      role: 'intern',
      status: 'active',
      must_change_password: false,
      intern_id: '20000000-0000-0000-0000-000000000001',
    },
  },
  'test@intern.com': {
    email: 'test@intern.com',
    role: 'intern',
    supabaseEmail: 'intern.david@internship.org',
    supabasePassword: 'Password123!',
    profile: {
      id: '00000000-0000-0000-0000-000000000011',
      email: 'intern.david@internship.org',
      full_name: 'David Kim (Intern)',
      avatar_url: null,
      role: 'intern',
      status: 'active',
      must_change_password: false,
      intern_id: '20000000-0000-0000-0000-000000000001',
    },
  },
  'intern@test.com': {
    email: 'intern@test.com',
    role: 'intern',
    supabaseEmail: 'intern.david@internship.org',
    supabasePassword: 'Password123!',
    profile: {
      id: '00000000-0000-0000-0000-000000000011',
      email: 'intern.david@internship.org',
      full_name: 'David Kim (Intern)',
      avatar_url: null,
      role: 'intern',
      status: 'active',
      must_change_password: false,
      intern_id: '20000000-0000-0000-0000-000000000001',
    },
  },
  'intern': {
    email: 'intern',
    role: 'intern',
    supabaseEmail: 'intern.david@internship.org',
    supabasePassword: 'Password123!',
    profile: {
      id: '00000000-0000-0000-0000-000000000011',
      email: 'intern.david@internship.org',
      full_name: 'David Kim (Intern)',
      avatar_url: null,
      role: 'intern',
      status: 'active',
      must_change_password: false,
      intern_id: '20000000-0000-0000-0000-000000000001',
    },
  },

  // Mentor accounts
  'test@mentor': {
    email: 'test@mentor',
    role: 'mentor',
    supabaseEmail: 'mentor.alex@internship.org',
    supabasePassword: 'Password123!',
    profile: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'mentor.alex@internship.org',
      full_name: 'Alex Rivera (Staff Mentor)',
      avatar_url: null,
      role: 'mentor',
      status: 'active',
      must_change_password: false,
      mentor_id: '10000000-0000-0000-0000-000000000001',
    },
  },
  'test@mentor.com': {
    email: 'test@mentor.com',
    role: 'mentor',
    supabaseEmail: 'mentor.alex@internship.org',
    supabasePassword: 'Password123!',
    profile: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'mentor.alex@internship.org',
      full_name: 'Alex Rivera (Staff Mentor)',
      avatar_url: null,
      role: 'mentor',
      status: 'active',
      must_change_password: false,
      mentor_id: '10000000-0000-0000-0000-000000000001',
    },
  },
  'mentor@test.com': {
    email: 'mentor@test.com',
    role: 'mentor',
    supabaseEmail: 'mentor.alex@internship.org',
    supabasePassword: 'Password123!',
    profile: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'mentor.alex@internship.org',
      full_name: 'Alex Rivera (Staff Mentor)',
      avatar_url: null,
      role: 'mentor',
      status: 'active',
      must_change_password: false,
      mentor_id: '10000000-0000-0000-0000-000000000001',
    },
  },
  'mentor': {
    email: 'mentor',
    role: 'mentor',
    supabaseEmail: 'mentor.alex@internship.org',
    supabasePassword: 'Password123!',
    profile: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'mentor.alex@internship.org',
      full_name: 'Alex Rivera (Staff Mentor)',
      avatar_url: null,
      role: 'mentor',
      status: 'active',
      must_change_password: false,
      mentor_id: '10000000-0000-0000-0000-000000000001',
    },
  },

  // Admin accounts
  'test@admin': {
    email: 'test@admin',
    role: 'admin',
    supabaseEmail: 'admin@internship.org',
    supabasePassword: 'Password123!',
    profile: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@internship.org',
      full_name: 'Admin',
      avatar_url: null,
      role: 'admin',
      status: 'active',
      must_change_password: false,
    },
  },
  'test@admin.com': {
    email: 'test@admin.com',
    role: 'admin',
    supabaseEmail: 'admin@internship.org',
    supabasePassword: 'Password123!',
    profile: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@internship.org',
      full_name: 'Admin',
      avatar_url: null,
      role: 'admin',
      status: 'active',
      must_change_password: false,
    },
  },
  'admin@test.com': {
    email: 'admin@test.com',
    role: 'admin',
    supabaseEmail: 'admin@internship.org',
    supabasePassword: 'Password123!',
    profile: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@internship.org',
      full_name: 'Admin',
      avatar_url: null,
      role: 'admin',
      status: 'active',
      must_change_password: false,
    },
  },
  'admin': {
    email: 'admin',
    role: 'admin',
    supabaseEmail: 'admin@internship.org',
    supabasePassword: 'Password123!',
    profile: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@internship.org',
      full_name: 'Admin',
      avatar_url: null,
      role: 'admin',
      status: 'active',
      must_change_password: false,
    },
  },
};

export function findTestAccount(emailInput: string): TestAccount | null {
  const normalized = emailInput.trim().toLowerCase();
  
  if (TEST_ACCOUNTS[normalized]) {
    return TEST_ACCOUNTS[normalized];
  }

  // Also check if someone typed intern.david / mentor.alex / admin with password '123'
  if (normalized.includes('intern.david')) {
    return TEST_ACCOUNTS['test@intern'];
  }
  if (normalized.includes('mentor.alex')) {
    return TEST_ACCOUNTS['test@mentor'];
  }
  if (normalized === 'admin@internship.org') {
    return TEST_ACCOUNTS['test@admin'];
  }

  return null;
}
