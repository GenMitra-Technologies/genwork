// supabase/functions/send-announcement/index.ts
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
    const { title, body: announcementBody, target_role } = body;

    if (!title || !announcementBody) {
      return new Response(
        JSON.stringify({ code: 'VALIDATION_ERROR', message: 'title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const roleTarget = target_role || 'all';

    // 1. Insert announcement
    const { data: announcement, error: insertError } = await supabaseAdmin
      .from('announcements')
      .insert({
        title,
        body: announcementBody,
        target_role: roleTarget,
        created_by: callerId,
      })
      .select('id')
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ code: 'DB_ERROR', message: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Fetch target profile recipients
    let query = supabaseAdmin.from('profiles').select('id, role').eq('status', 'active');
    if (roleTarget === 'intern') {
      query = query.eq('role', 'intern');
    } else if (roleTarget === 'mentor') {
      query = query.eq('role', 'mentor');
    }

    const { data: recipients, error: recipientsError } = await query;

    if (recipientsError) {
      return new Response(
        JSON.stringify({ code: 'DB_ERROR', message: recipientsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Fan-out notifications
    if (recipients && recipients.length > 0) {
      const notifications = recipients.map((r: { id: string }) => ({
        recipient_id: r.id,
        title: 'Announcement: ' + title,
        message: announcementBody,
        type: 'announcement',
        related_type: 'system',
        related_id: announcement.id,
        is_read: false,
      }));

      await supabaseAdmin.from('notifications').insert(notifications);
    }

    return new Response(
      JSON.stringify({
        success: true,
        announcementId: announcement.id,
        recipientsNotified: recipients?.length ?? 0,
        message: 'Announcement broadcasted successfully',
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ code: 'ERROR', message: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
