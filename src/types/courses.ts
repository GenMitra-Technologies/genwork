// src/types/courses.ts

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  youtube_url: string;
  youtube_video_id: string;
  thumbnail_url: string;
  learning_objectives?: string;
  order_index: number;
  duration?: string;
}

export type CourseStatus = 'draft' | 'published';

export interface Course {
  id: string;
  mentor_id: string;
  mentor_name: string;
  mentor_avatar?: string | null;
  title: string;
  category: string;
  description: string;
  thumbnail_url: string;
  learning_objectives: string[];
  status: CourseStatus;
  modules: CourseModule[];
  created_at: string;
  updated_at: string;
  enrolled_count?: number;
  completed_count?: number;
  review_count?: number;
  average_rating?: number;
}

export interface CourseProgressRecord {
  id: string;
  course_id: string;
  module_id: string;
  intern_id: string;
  intern_name: string;
  started: boolean;
  started_at?: string | null;
  completed: boolean;
  completed_at?: string | null;
  updated_at: string;
}

export interface CourseEnrollmentRecord {
  id: string;
  course_id: string;
  intern_id: string;
  intern_name: string;
  intern_email?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  started_at?: string | null;
  completed_at?: string | null;
  completed_modules: string[];
  review_submitted: boolean;
}

export interface CourseReviewRecord {
  id: string;
  course_id: string;
  course_title?: string;
  intern_id: string;
  intern_name: string;
  intern_avatar?: string | null;
  rating: number; // 1 to 5
  learned_summary: string;
  understanding_summary: string;
  useful_concepts: string;
  practical_application: string;
  improvement_feedback?: string;
  overall_feedback: string;
  submitted_at: string;
}

export interface CreateCourseInput {
  title: string;
  category: string;
  description: string;
  learning_objectives: string[];
  status: CourseStatus;
  modules: Array<{
    title: string;
    youtube_url: string;
    learning_objectives?: string;
  }>;
}

export interface SubmitReviewInput {
  course_id: string;
  rating: number;
  learned_summary: string;
  understanding_summary: string;
  useful_concepts: string;
  practical_application: string;
  improvement_feedback?: string;
  overall_feedback: string;
}
