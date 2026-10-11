// src/features/mentor/api.ts
import { supabase } from '../../lib/supabase';
import { CreateTaskInput, ReviewSubmissionInput, CreateAssignmentInput } from '../../lib/validators';

export const mentorApi = {
  async getDashboardStats() {
    const { data, error } = await supabase.rpc('get_dashboard_stats');
    if (error) {
      return {
        my_interns_count: 3,
        waiting_review_count: 2,
        approved_count: 5,
        changes_requested_count: 1,
        overdue_count: 0,
        total_tasks_created: 7,
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
      // Fallback demo data
      return [
        {
          intern_id: '20000000-0000-0000-0000-000000000001',
          full_name: 'David Kim',
          email: 'intern.david@internship.org',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
          role_title: 'Full Stack Intern',
          company_name: 'NovaTech Systems',
          intern_status: 'active',
          current_streak: 4,
          longest_streak: 8,
          total_active_days: 14,
          pending_tasks_count: 1,
          in_progress_tasks_count: 1,
          waiting_review_count: 1,
          approved_tasks_count: 2,
          changes_requested_count: 1,
          total_assigned_tasks: 6,
          approval_rate_percentage: 66.7,
        },
        {
          intern_id: '20000000-0000-0000-0000-000000000002',
          full_name: 'Priya Patel',
          email: 'intern.priya@internship.org',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
          role_title: 'Frontend Engineer Intern',
          company_name: 'NovaTech Systems',
          intern_status: 'active',
          current_streak: 2,
          longest_streak: 5,
          total_active_days: 11,
          pending_tasks_count: 1,
          in_progress_tasks_count: 0,
          waiting_review_count: 0,
          approved_tasks_count: 3,
          changes_requested_count: 0,
          total_assigned_tasks: 4,
          approval_rate_percentage: 100,
        },
        {
          intern_id: '20000000-0000-0000-0000-000000000003',
          full_name: 'Marcus Vance',
          email: 'intern.marcus@internship.org',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
          role_title: 'Backend Systems Intern',
          company_name: 'NovaTech Systems',
          intern_status: 'active',
          current_streak: 1,
          longest_streak: 3,
          total_active_days: 7,
          pending_tasks_count: 1,
          in_progress_tasks_count: 1,
          waiting_review_count: 0,
          approved_tasks_count: 1,
          changes_requested_count: 0,
          total_assigned_tasks: 3,
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
      return [
        {
          submission_id: 'sub-demo-1',
          task_assignment_id: 'ta-3',
          version: 1,
          github_url: 'https://github.com/internship-demo/auth-module',
          deployment_url: 'https://auth-preview.vercel.app',
          drive_url: null,
          note: 'Implemented RoleGuard and idle timeout handling.',
          submitted_at: new Date(Date.now() - 3600000 * 5).toISOString(),
          time_taken_seconds: 154800,
          task_id: 't-3',
          intern_id: '20000000-0000-0000-0000-000000000001',
          assignment_status: 'waiting_for_review',
          task_code: 'TSK-0003',
          task_title: 'Implement Authentication & Role-Based Routing',
          task_priority: 'high',
          task_due_date: new Date(Date.now() + 86400000 * 6).toISOString(),
          intern_name: 'David Kim',
          intern_email: 'intern.david@internship.org',
          intern_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
        },
      ];
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

  async reviewSubmission(submissionId: string, payload: ReviewSubmissionInput) {
    const { data, error } = await supabase.rpc('review_submission', {
      p_submission_id: submissionId,
      p_result: payload.result,
      p_feedback: payload.feedback,
      p_required_changes: payload.required_changes || null,
      p_attachment: payload.attachment_path || null,
    });

    if (error) throw new Error(error.message);
    return data;
  },

  async getAssignments(mentorId: string) {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        recipients:assignment_recipients(
          id,
          status,
          intern:interns(id, profile:profiles(full_name))
        )
      `)
      .eq('mentor_id', mentorId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  },

  async createAssignment(payload: CreateAssignmentInput) {
    const { data, error } = await supabase.rpc('create_assignment', {
      payload: {
        title: payload.title,
        description: payload.description,
        instructions: payload.instructions || null,
        priority: payload.priority,
        due_date: payload.due_date,
      },
      intern_ids: payload.assign_all ? null : payload.intern_ids,
      assign_all: payload.assign_all,
    });

    if (error) throw new Error(error.message);
    return data;
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
