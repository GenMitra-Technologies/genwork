// src/types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'intern' | 'mentor' | 'admin';
export type AccountStatus = 'active' | 'inactive' | 'suspended';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus =
  | 'assigned'
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'waiting_for_review'
  | 'approved'
  | 'changes_requested'
  | 'resubmitted'
  | 'archived';

export type ReviewResult = 'approved' | 'changes_requested';

export type AssignmentStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'changes_requested';

export type NotificationType =
  | 'task_assigned'
  | 'assignment_assigned'
  | 'task_started'
  | 'task_submitted'
  | 'task_resubmitted'
  | 'task_approved'
  | 'changes_requested'
  | 'mentor_feedback'
  | 'deadline_approaching'
  | 'task_overdue'
  | 'assignment_deadline'
  | 'assignment_submitted'
  | 'intern_assigned'
  | 'announcement';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          avatar_url: string | null
          role: UserRole
          status: AccountStatus
          must_change_password: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          avatar_url?: string | null
          role: UserRole
          status?: AccountStatus
          must_change_password?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          avatar_url?: string | null
          role?: UserRole
          status?: AccountStatus
          must_change_password?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      internships: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          start_date: string
          end_date: string
          status: 'active' | 'inactive' | 'completed'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code?: string
          name: string
          description?: string | null
          start_date: string
          end_date: string
          status?: 'active' | 'inactive' | 'completed'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          start_date?: string
          end_date?: string
          status?: 'active' | 'inactive' | 'completed'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      mentors: {
        Row: {
          id: string
          profile_id: string
          department: string
          bio: string | null
          status: AccountStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          department: string
          bio?: string | null
          status?: AccountStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          department?: string
          bio?: string | null
          status?: AccountStatus
          created_at?: string
          updated_at?: string
        }
      }
      interns: {
        Row: {
          id: string
          profile_id: string
          internship_id: string | null
          mentor_id: string | null
          role_title: string
          company_name: string
          start_date: string
          end_date: string
          status: AccountStatus
          current_streak: number
          longest_streak: number
          total_active_days: number
          last_active_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          internship_id?: string | null
          mentor_id?: string | null
          role_title: string
          company_name: string
          start_date: string
          end_date: string
          status?: AccountStatus
          current_streak?: number
          longest_streak?: number
          total_active_days?: number
          last_active_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          internship_id?: string | null
          mentor_id?: string | null
          role_title?: string
          company_name?: string
          start_date?: string
          end_date?: string
          status?: AccountStatus
          current_streak?: number
          longest_streak?: number
          total_active_days?: number
          last_active_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          code: string
          title: string
          description: string
          instructions: string | null
          requirements: string | null
          expected_output: string | null
          mentor_id: string | null
          priority: PriorityLevel
          due_date: string
          require_github: boolean
          require_deployment: boolean
          require_drive: boolean
          extra_requirements: string | null
          archived: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code?: string
          title: string
          description: string
          instructions?: string | null
          requirements?: string | null
          expected_output?: string | null
          mentor_id?: string | null
          priority?: PriorityLevel
          due_date: string
          require_github?: boolean
          require_deployment?: boolean
          require_drive?: boolean
          extra_requirements?: string | null
          archived?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          title?: string
          description?: string
          instructions?: string | null
          requirements?: string | null
          expected_output?: string | null
          mentor_id?: string | null
          priority?: PriorityLevel
          due_date?: string
          require_github?: boolean
          require_deployment?: boolean
          require_drive?: boolean
          extra_requirements?: string | null
          archived?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      task_assignments: {
        Row: {
          id: string
          task_id: string
          intern_id: string
          status: TaskStatus
          assigned_at: string
          started_at: string | null
          first_submitted_at: string | null
          last_submitted_at: string | null
          approved_at: string | null
          current_version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          intern_id: string
          status?: TaskStatus
          assigned_at?: string
          started_at?: string | null
          first_submitted_at?: string | null
          last_submitted_at?: string | null
          approved_at?: string | null
          current_version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          intern_id?: string
          status?: TaskStatus
          assigned_at?: string
          started_at?: string | null
          first_submitted_at?: string | null
          last_submitted_at?: string | null
          approved_at?: string | null
          current_version?: number
          created_at?: string
          updated_at?: string
        }
      }
      task_submissions: {
        Row: {
          id: string
          task_assignment_id: string
          version: number
          github_url: string | null
          deployment_url: string | null
          drive_url: string | null
          note: string | null
          started_at_snapshot: string | null
          submitted_at: string
          time_taken_seconds: number | null
          submitted_by: string
        }
        Insert: {
          id?: string
          task_assignment_id: string
          version: number
          github_url?: string | null
          deployment_url?: string | null
          drive_url?: string | null
          note?: string | null
          started_at_snapshot?: string | null
          submitted_at?: string
          time_taken_seconds?: number | null
          submitted_by: string
        }
        Update: {
          id?: string
          task_assignment_id?: string
          version?: number
          github_url?: string | null
          deployment_url?: string | null
          drive_url?: string | null
          note?: string | null
          started_at_snapshot?: string | null
          submitted_at?: string
          time_taken_seconds?: number | null
          submitted_by?: string
        }
      }
      reviews: {
        Row: {
          id: string
          submission_id: string
          mentor_id: string | null
          reviewer_profile_id: string
          result: ReviewResult
          feedback: string
          required_changes: string | null
          attachment_path: string | null
          reviewed_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          mentor_id?: string | null
          reviewer_profile_id: string
          result: ReviewResult
          feedback: string
          required_changes?: string | null
          attachment_path?: string | null
          reviewed_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          mentor_id?: string | null
          reviewer_profile_id?: string
          result?: ReviewResult
          feedback?: string
          required_changes?: string | null
          attachment_path?: string | null
          reviewed_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          code: string
          title: string
          description: string
          instructions: string | null
          mentor_id: string | null
          priority: PriorityLevel
          due_date: string
          archived: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code?: string
          title: string
          description: string
          instructions?: string | null
          mentor_id?: string | null
          priority?: PriorityLevel
          due_date: string
          archived?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          title?: string
          description?: string
          instructions?: string | null
          mentor_id?: string | null
          priority?: PriorityLevel
          due_date?: string
          archived?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      assignment_recipients: {
        Row: {
          id: string
          assignment_id: string
          intern_id: string
          status: AssignmentStatus
          submission_text: string | null
          submission_file_path: string | null
          submission_url: string | null
          submitted_at: string | null
          mentor_feedback: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          assigned_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          intern_id: string
          status?: AssignmentStatus
          submission_text?: string | null
          submission_file_path?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          mentor_feedback?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          assigned_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          intern_id?: string
          status?: AssignmentStatus
          submission_text?: string | null
          submission_file_path?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          mentor_feedback?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          assigned_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          recipient_id: string
          title: string
          message: string
          type: NotificationType
          related_type: string | null
          related_id: string | null
          related_code: string | null
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipient_id: string
          title: string
          message: string
          type: NotificationType
          related_type?: string | null
          related_id?: string | null
          related_code?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipient_id?: string
          title?: string
          message?: string
          type?: NotificationType
          related_type?: string | null
          related_id?: string | null
          related_code?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          role: UserRole | null
          action: string
          entity_type: string
          entity_id: string | null
          previous_value: Json | null
          new_value: Json | null
          metadata: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          role?: UserRole | null
          action: string
          entity_type: string
          entity_id?: string | null
          previous_value?: Json | null
          new_value?: Json | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          role?: UserRole | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          previous_value?: Json | null
          new_value?: Json | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          body: string
          target_role: 'all' | 'mentor' | 'intern'
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          target_role?: 'all' | 'mentor' | 'intern'
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          body?: string
          target_role?: 'all' | 'mentor' | 'intern'
          created_by?: string | null
          created_at?: string
        }
      }
      platform_settings: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string
        }
      }
    }
    Views: {
      v_task_cards: {
        Row: {
          task_assignment_id: string
          task_id: string
          intern_id: string
          status: TaskStatus
          assigned_at: string
          started_at: string | null
          first_submitted_at: string | null
          last_submitted_at: string | null
          approved_at: string | null
          current_version: number
          task_code: string
          task_title: string
          task_description: string
          priority: PriorityLevel
          due_date: string
          require_github: boolean
          require_deployment: boolean
          require_drive: boolean
          archived: boolean
          mentor_id: string | null
          mentor_name: string | null
          mentor_avatar: string | null
          intern_name: string
          intern_avatar: string | null
          is_overdue: boolean
          time_remaining: unknown
        }
      }
      v_mentor_intern_summary: {
        Row: {
          intern_id: string
          profile_id: string
          full_name: string
          email: string
          avatar_url: string | null
          role_title: string
          company_name: string
          intern_status: AccountStatus
          mentor_id: string | null
          current_streak: number
          longest_streak: number
          total_active_days: number
          last_active_date: string | null
          pending_tasks_count: number
          in_progress_tasks_count: number
          waiting_review_count: number
          approved_tasks_count: number
          changes_requested_count: number
          total_assigned_tasks: number
          approval_rate_percentage: number
        }
      }
      v_review_queue: {
        Row: {
          submission_id: string
          task_assignment_id: string
          version: number
          github_url: string | null
          deployment_url: string | null
          drive_url: string | null
          note: string | null
          submitted_at: string
          time_taken_seconds: number | null
          task_id: string
          intern_id: string
          assignment_status: TaskStatus
          task_code: string
          task_title: string
          task_priority: PriorityLevel
          task_due_date: string
          mentor_id: string | null
          intern_name: string
          intern_email: string
          intern_avatar: string | null
        }
      }
    }
    Functions: {
      start_task: {
        Args: { p_task_assignment_id: string }
        Returns: void
      }
      submit_task: {
        Args: {
          p_task_assignment_id: string
          p_github?: string | null
          p_deploy?: string | null
          p_drive?: string | null
          p_note?: string | null
        }
        Returns: string
      }
      review_submission: {
        Args: {
          p_submission_id: string
          p_result: ReviewResult
          p_feedback: string
          p_required_changes?: string | null
          p_attachment?: string | null
        }
        Returns: string
      }
      create_task: {
        Args: {
          payload: Json
          intern_ids?: string[] | null
          assign_all?: boolean
        }
        Returns: string
      }
      create_assignment: {
        Args: {
          payload: Json
          intern_ids?: string[] | null
          assign_all?: boolean
        }
        Returns: string
      }
      start_assignment: {
        Args: { p_assignment_recipient_id: string }
        Returns: void
      }
      submit_assignment: {
        Args: {
          p_assignment_recipient_id: string
          p_text?: string | null
          p_file_path?: string | null
          p_url?: string | null
        }
        Returns: void
      }
      review_assignment: {
        Args: {
          p_assignment_recipient_id: string
          p_status: AssignmentStatus
          p_feedback: string
        }
        Returns: void
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: void
      }
      mark_all_notifications_read: {
        Args: Record<string, never>
        Returns: void
      }
      get_dashboard_stats: {
        Args: Record<string, never>
        Returns: Json
      }
      admin_override_task_status: {
        Args: {
          p_task_assignment_id: string
          p_new_status: TaskStatus
          p_reason: string
        }
        Returns: void
      }
      move_intern_to_mentor: {
        Args: {
          p_intern_id: string
          p_new_mentor_id: string
        }
        Returns: void
      }
      log_event: {
        Args: {
          p_action: string
          p_entity_type: string
          p_entity_id?: string | null
          p_previous_value?: Json | null
          p_new_value?: Json | null
          p_metadata?: Json
          p_user_agent?: string | null
        }
        Returns: void
      }
    }
  }
}
