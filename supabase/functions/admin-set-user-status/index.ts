// supabase/functions/admin-set-user-status/index.ts
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
    const { userId, status } = body;

    if (!userId || !status || !['active', 'inactive', 'suspended'].includes(status)) {
      return new Response(
        JSON.stringify({ code: 'VALIDATION_ERROR', message: 'Valid userId and status (active, inactive, suspended) are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get previous status
    const { data: prevProfile } = await supabaseAdmin
      .from('profiles')
      .select('status, role')
      .eq('id', userId)
      .single();

    // Update profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ status })
      .eq('id', userId);

    if (profileError) {
      return new Response(
        JSON.stringify({ code: 'DB_ERROR', message: profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status in interns or mentors table if applicable
    if (prevProfile?.role === 'intern') {
      await supabaseAdmin.from('interns').update({ status }).eq('profile_id', userId);
    } else if (prevProfile?.role === 'mentor') {
      await supabaseAdmin.from('mentors').update({ status }).eq('profile_id', userId);
    }

    // If deactivated or suspended, revoke user sessions via auth admin
    if (status !== 'active') {
      try {
        await supabaseAdmin.auth.admin.signOut(userId);
      } catch {
        // Continue if session revoke endpoint handles gracefully
      }
    }

    // Activity log
    await supabaseAdmin.from('activity_logs').insert({
      user_id: callerId,
      role: 'admin',
      action: 'admin_set_user_status',
      entity_type: 'profiles',
      entity_id: userId,
      previous_value: { status: prevProfile?.status },
      new_value: { status },
    });

    return new Response(
      JSON.stringify({ success: true, message: `User status changed to ${status}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ code: 'ERROR', message: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
