-- 0014_courses_tables.sql
-- Migration for the Courses Module: courses, course_modules, course_enrollments, course_progress, course_reviews

-- 1. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  mentor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  mentor_name TEXT NOT NULL,
  mentor_avatar TEXT,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Engineering',
  description TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  learning_objectives JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  modules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. Course Enrollments Table
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  intern_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  intern_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_modules JSONB DEFAULT '[]'::jsonb,
  review_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT unique_course_intern_enrollment UNIQUE (course_id, intern_id)
);

-- 3. Course Progress Table (Per Module)
CREATE TABLE IF NOT EXISTS public.course_progress (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  intern_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  intern_name TEXT NOT NULL,
  started BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT unique_course_module_intern_prog UNIQUE (course_id, module_id, intern_id)
);

-- 4. Course Reviews Table
CREATE TABLE IF NOT EXISTS public.course_reviews (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  course_title TEXT,
  intern_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  intern_name TEXT NOT NULL,
  intern_avatar TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  learned_summary TEXT NOT NULL,
  understanding_summary TEXT NOT NULL,
  useful_concepts TEXT NOT NULL,
  practical_application TEXT NOT NULL,
  improvement_feedback TEXT,
  overall_feedback TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT unique_course_intern_review UNIQUE (course_id, intern_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_mentor ON public.courses(mentor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_intern ON public.course_enrollments(intern_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_intern ON public.course_progress(intern_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_course ON public.course_reviews(course_id);

-- Enable Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

-- Permissive policies for authenticated users
CREATE POLICY "Courses can be read by authenticated users"
  ON public.courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Courses can be modified by mentors and admins"
  ON public.courses FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Enrollments can be managed by authenticated users"
  ON public.course_enrollments FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Progress can be managed by authenticated users"
  ON public.course_progress FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Reviews can be managed by authenticated users"
  ON public.course_reviews FOR ALL
  TO authenticated
  USING (true);
