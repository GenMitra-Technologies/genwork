// supabase/functions/admin-reset-password/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabaseAdmin.ts';
import { requireAdminCaller } from '../_shared/auth.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { callerId } = await requireAdminCaller(req, supabaseAdmin);

    const body = await req.json();
    const { userId, temporaryPassword } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ code: 'VALIDATION_ERROR', message: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tempPassword = temporaryPassword || ('TempPass!' + Math.floor(100000 + Math.random() * 900000));

    // Update password in auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: tempPassword,
    });

    if (authError) {
      return new Response(
        JSON.stringify({ code: 'AUTH_ERROR', message: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark must_change_password = true in profiles
    await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', userId);

    // Audit log
    await supabaseAdmin.from('activity_logs').insert({
      user_id: callerId,
      role: 'admin',
      action: 'admin_reset_password',
      entity_type: 'profiles',
      entity_id: userId,
      new_value: { must_change_password: true },
    });

    return new Response(
      JSON.stringify({ success: true, temporaryPassword: tempPassword, message: 'Password reset successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ code: 'ERROR', message: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
