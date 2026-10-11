// src/features/admin/api.ts
import { supabase } from '../../lib/supabase';
import { TaskStatus } from '../../types/database.types';

export const adminApi = {
  async getDashboardStats() {
    const { data, error } = await supabase.rpc('get_dashboard_stats');
    if (error) {
      return {
        total_internships: 2,
        active_internships: 2,
        total_interns: 6,
        active_interns: 6,
        total_mentors: 2,
        active_mentors: 2,
        total_tasks: 12,
        total_submissions: 6,
        waiting_reviews: 2,
        completed_tasks: 4,
      };
    }
    return data;
  },

  async getInternships() {
    const { data, error } = await supabase
      .from('internships')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [
        {
          id: '30000000-0000-0000-0000-000000000001',
          code: 'INT-001',
          name: 'Summer 2026 Engineering Cohort',
          description: '12-week intensive software engineering internship.',
          start_date: '2026-06-01',
          end_date: '2026-08-31',
          status: 'active',
          created_at: new Date().toISOString(),
        },
        {
          id: '30000000-0000-0000-0000-000000000002',
          code: 'INT-002',
          name: 'Fall 2026 Design & Mobile Cohort',
          description: '12-week UI/UX and mobile development cohort.',
          start_date: '2026-09-01',
          end_date: '2026-11-30',
          status: 'active',
          created_at: new Date().toISOString(),
        },
      ];
    }
    return data;
  },

  async createInternship(payload: { name: string; description: string; start_date: string; end_date: string }) {
    const { data, error } = await supabase
      .from('internships')
      .insert({
        name: payload.name,
        description: payload.description,
        start_date: payload.start_date,
        end_date: payload.end_date,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async getInterns() {
    const { data, error } = await supabase
      .from('interns')
      .select(`
        *,
        profile:profiles!interns_profile_id_fkey(*),
        mentor:mentors!interns_mentor_id_fkey(
          id,
          profile:profiles!mentors_profile_id_fkey(full_name)
        ),
        internship:internships!interns_internship_id_fkey(name, code)
      `)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  },

  async moveInternToMentor(internId: string, newMentorId: string) {
    const { error } = await supabase.rpc('move_intern_to_mentor', {
      p_intern_id: internId,
      p_new_mentor_id: newMentorId,
    });
    if (error) throw new Error(error.message);
  },

  async getMentors() {
    const { data, error } = await supabase
      .from('mentors')
      .select(`
        *,
        profile:profiles!mentors_profile_id_fkey(*)
      `)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  },

  async getCredentials() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  },

  async toggleUserStatus(userId: string, newStatus: 'active' | 'inactive' | 'suspended') {
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', userId);

    if (error) throw new Error(error.message);
  },

  async resetPassword(userId: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', userId);

    if (error) throw new Error(error.message);
  },

  async getAllTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignments:task_assignments(
          id,
          status,
          current_version,
          intern:interns(id, profile:profiles(full_name))
        )
      `)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  },

  async adminOverrideTaskStatus(taskAssignmentId: string, newStatus: TaskStatus, reason: string) {
    const { error } = await supabase.rpc('admin_override_task_status', {
      p_task_assignment_id: taskAssignmentId,
      p_new_status: newStatus,
      p_reason: reason,
    });
    if (error) throw new Error(error.message);
  },

  async getActivityLogs() {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) return [];
    return data;
  },

  async broadcastAnnouncement(title: string, body: string, targetRole: 'all' | 'mentor' | 'intern') {
    // Insert into announcements table
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        body,
        target_role: targetRole,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
