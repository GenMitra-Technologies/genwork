// supabase/functions/_shared/auth.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

export async function requireAdminCaller(
  req: Request,
  supabaseAdmin: SupabaseClient
): Promise<{ callerId: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('UNAUTHORIZED: Missing Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    throw new Error('UNAUTHORIZED: Invalid access token');
  }

  // Verify caller has admin role in profiles
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('FORBIDDEN: Profile not found');
  }

  if (profile.role !== 'admin' || profile.status !== 'active') {
    throw new Error('FORBIDDEN: Caller is not an active admin');
  }

  return { callerId: user.id };
}
