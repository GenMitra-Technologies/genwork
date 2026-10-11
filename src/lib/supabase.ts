// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jgjiakofetyiimtobhey.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnamlha29mZXR5aWltdG9iaGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2ODQ5MzQsImV4cCI6MjEwNzI2MDkzNH0.TpRNCukcriGkOGAIzBEOkdl_pHZQITmv_Zo3i8Nvu-Y';

export const supabase: SupabaseClient<any, 'public', any> = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

