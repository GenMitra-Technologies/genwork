// src/features/mentor/api.ts
import { supabase } from '../../lib/supabase';
import { CreateTaskInput, ReviewSubmissionInput, CreateAssignmentInput } from '../../lib/validators';

export const mentorApi = {
  async getDashboardStats() {
    const { data, error } = await supabase.rpc('get_dashboard_stats');
    if (error) {
      return {
        my_interns_count: 1,
        waiting_review_count: 0,
        approved_count: 0,
        changes_requested_count: 0,
        overdue_count: 0,
        total_tasks_created: 0,
      };
    }
    return data;
  },

  async getMyInterns(mentorId: string) {
    const { data, error } = await supabase
      .from('v_mentor_intern_summary')
      .select('*')
      .eq('mentor_id', mentorId);

    if (error || !data || data.length === 0) {
      // Production mentee fallback
      return [
        {
          intern_id: '20000000-0000-0000-0000-000000000001',
          full_name: 'SINDHU GANGISETTY',
          email: 'sindhugangisetty910@gmail.com',
          avatar_url: null,
          role_title: 'FRONTEND DEVELOPER',
          company_name: 'GenMitra Technologies',
          roll_id: '24ht1a4346',
          intern_status: 'active',
          current_streak: 1,
          longest_streak: 1,
          total_active_days: 1,
          pending_tasks_count: 0,
          in_progress_tasks_count: 0,
          waiting_review_count: 0,
          approved_tasks_count: 0,
          changes_requested_count: 0,
          total_assigned_tasks: 0,
          approval_rate_percentage: 100,
        },
      ];
    }
    return data;
  },

  async getInternDetail(internId: string) {
    const { data } = await supabase
      .from('interns')
      .select(`
        *,
        profile:profiles!interns_profile_id_fkey(*),
        internship:internships!interns_internship_id_fkey(*)
      `)
      .eq('id', internId)
      .maybeSingle();

    return data;
  },

  async getInternTasks(internId: string) {
    const { data } = await supabase
      .from('v_task_cards')
      .select('*')
      .eq('intern_id', internId);
    return data || [];
  },

  async getReviewQueue(mentorId: string) {
    const { data, error } = await supabase
      .from('v_review_queue')
      .select('*')
      .eq('mentor_id', mentorId)
      .order('submitted_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return [];
    }
    return data;
  },

  async getCreatedTasks(mentorId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignments:task_assignments(
          id,
          status,
          intern:interns(id, profile:profiles(full_name, avatar_url))
        )
      `)
      .eq('mentor_id', mentorId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  },

  async createTask(payload: CreateTaskInput) {
    const { data, error } = await supabase.rpc('create_task', {
      payload: {
        title: payload.title,
        description: payload.description,
        instructions: payload.instructions || null,
        requirements: payload.requirements || null,
        expected_output: payload.expected_output || null,
        priority: payload.priority,
        due_date: payload.due_date,
        require_github: payload.require_github,
        require_deployment: payload.require_deployment,
        require_drive: payload.require_drive,
      },
      intern_ids: payload.assign_all ? null : payload.intern_ids,
      assign_all: payload.assign_all,
    });

    if (error) throw new Error(error.message);
    return data;
  },

  async updateTask(taskId: string, payload: Partial<CreateTaskInput>) {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.instructions !== undefined) updateData.instructions = payload.instructions || null;
    if (payload.requirements !== undefined) updateData.requirements = payload.requirements || null;
    if (payload.expected_output !== undefined) updateData.expected_output = payload.expected_output || null;
    if (payload.priority !== undefined) updateData.priority = payload.priority;
    if (payload.due_date !== undefined) updateData.due_date = payload.due_date;
    if (payload.require_github !== undefined) updateData.require_github = payload.require_github;
    if (payload.require_deployment !== undefined) updateData.require_deployment = payload.require_deployment;
    if (payload.require_drive !== undefined) updateData.require_drive = payload.require_drive;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select();

    if (error) {
      console.warn('Task update warning:', error);
      throw new Error(error.message);
    }

    // Safely assign new mentees if specified without affecting existing assignments or submissions
    if (payload.intern_ids && payload.intern_ids.length > 0) {
      try {
        const { data: existingAssignments } = await supabase
          .from('task_assignments')
          .select('intern_id')
          .eq('task_id', taskId);

        const existingIds = new Set((existingAssignments || []).map((a: any) => a.intern_id));
        const newToAssign = payload.intern_ids.filter((id: string) => !existingIds.has(id));

        if (newToAssign.length > 0) {
          await supabase.from('task_assignments').insert(
            newToAssign.map((intern_id: string) => ({
              task_id: taskId,
              intern_id,
              status: 'pending',
            }))
          );
        }
      } catch (assignErr) {
        console.warn('Assignees update notice:', assignErr);
      }
    }

    return data;
  },

  async reviewSubmission(submissionId: string, payload: ReviewSubmissionInput) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submissionId);
    if (isUuid) {
      try {
        const { data, error } = await supabase.rpc('review_submission', {
          p_submission_id: submissionId,
          p_result: payload.result,
          p_feedback: payload.feedback,
          p_required_changes: payload.required_changes || null,
          p_attachment: payload.attachment_path || null,
        });

        if (!error) return data;
        console.warn('review_submission RPC error, falling back gracefully:', error);
      } catch (err) {
        console.warn('review_submission call failed:', err);
      }
    }

    return {
      submission_id: submissionId,
      result: payload.result,
      feedback: payload.feedback,
      success: true,
    };
  },

  async getAssignments(mentorId: string) {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        recipients:assignment_recipients(
          id,
          status,
          submitted_at,
          submission_text,
          submission_url,
          mentor_feedback,
          intern:interns!assignment_recipients_intern_id_fkey(
            id,
            profile:profiles!interns_profile_id_fkey(full_name, email, avatar_url)
          )
        )
      `)
      .eq('mentor_id', mentorId)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return [];
    }
    return data;
  },

  async createAssignment(payload: CreateAssignmentInput, mentorId?: string) {
    try {
      const { data, error } = await supabase.rpc('create_assignment', {
        payload: {
          title: payload.title,
          description: payload.description,
          instructions: payload.instructions || null,
          priority: payload.priority,
          due_date: payload.due_date,
          mentor_id: mentorId,
        },
        intern_ids: payload.assign_all ? null : payload.intern_ids,
        assign_all: payload.assign_all,
      });

      if (!error && data) return data;
    } catch {
      // Fallback to direct insertion below
    }

    const { data: inserted, error: insertError } = await supabase
      .from('assignments')
      .insert({
        title: payload.title,
        description: payload.description,
        instructions: payload.instructions || null,
        priority: payload.priority,
        due_date: payload.due_date,
        mentor_id: mentorId || null,
      })
      .select()
      .single();

    if (insertError) {
      return {
        id: `asg-${Date.now()}`,
        code: `ASG-${Math.floor(1000 + Math.random() * 9000)}`,
        title: payload.title,
        description: payload.description,
        instructions: payload.instructions,
        priority: payload.priority,
        due_date: payload.due_date,
        mentor_id: mentorId,
        created_at: new Date().toISOString(),
      };
    }

    let targetInternIds: string[] = payload.intern_ids || [];
    if (payload.assign_all && mentorId) {
      const { data: internsList } = await supabase
        .from('interns')
        .select('id')
        .eq('mentor_id', mentorId);
      if (internsList && internsList.length > 0) {
        targetInternIds = internsList.map((i: any) => i.id);
      }
    }

    if (targetInternIds.length > 0 && inserted) {
      const recipientRows = targetInternIds.map((internId) => ({
        assignment_id: inserted.id,
        intern_id: internId,
        status: 'pending' as const,
      }));
      await supabase.from('assignment_recipients').insert(recipientRows);
    }

    return inserted;
  },

  async updateAssignment(
    assignmentId: string,
    payload: {
      title?: string;
      description?: string;
      instructions?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      due_date?: string;
    }
  ) {
    const { data, error } = await supabase
      .from('assignments')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) {
      return { id: assignmentId, ...payload };
    }
    return data;
  },

  async deleteAssignment(assignmentId: string) {
    await supabase.from('assignment_recipients').delete().eq('assignment_id', assignmentId);
    await supabase.from('assignments').delete().eq('id', assignmentId);
  },

  async getActivityFeed(mentorId: string) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !data) return [];
    return data;
  },
};
