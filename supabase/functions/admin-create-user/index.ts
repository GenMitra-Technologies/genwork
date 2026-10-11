// supabase/functions/admin-create-user/index.ts
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
    const { email, password, full_name, role, department, role_title, company_name, internship_id, mentor_id } = body;

    if (!email || !password || !full_name || !role) {
      return new Response(
        JSON.stringify({ code: 'VALIDATION_ERROR', message: 'Missing required fields: email, password, full_name, role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['intern', 'mentor', 'admin'].includes(role)) {
      return new Response(
        JSON.stringify({ code: 'VALIDATION_ERROR', message: 'Role must be intern, mentor, or admin' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Create user in auth.users
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    });

    if (createError || !userData.user) {
      return new Response(
        JSON.stringify({ code: 'AUTH_ERROR', message: createError?.message ?? 'Failed to create auth user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;

    // 2. Insert into profiles
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      full_name,
      email,
      role,
      status: 'active',
      must_change_password: true,
    });

    if (profileError) {
      // rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ code: 'DB_ERROR', message: profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Insert role-specific row
    if (role === 'mentor') {
      await supabaseAdmin.from('mentors').insert({
        profile_id: userId,
        department: department || 'General Engineering',
        status: 'active',
      });
    } else if (role === 'intern') {
      await supabaseAdmin.from('interns').insert({
        profile_id: userId,
        internship_id: internship_id || null,
        mentor_id: mentor_id || null,
        role_title: role_title || 'Software Engineering Intern',
        company_name: company_name || 'Tech Corp',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        status: 'active',
      });
    }

    // 4. Activity log
    await supabaseAdmin.from('activity_logs').insert({
      user_id: callerId,
      role: 'admin',
      action: 'admin_create_user',
      entity_type: 'profiles',
      entity_id: userId,
      new_value: { email, full_name, role },
    });

    return new Response(
      JSON.stringify({ success: true, userId, message: 'User created successfully' }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ code: 'ERROR', message: err.message }),
      { status: err.message.startsWith('UNAUTHORIZED') ? 401 : err.message.startsWith('FORBIDDEN') ? 403 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
