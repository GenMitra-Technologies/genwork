// src/features/courses/api.ts
import { supabase } from '../../lib/supabase';
import {
  Course,
  CourseModule,
  CreateCourseInput,
  CourseEnrollmentRecord,
  CourseProgressRecord,
  CourseReviewRecord,
  SubmitReviewInput,
} from '../../types/courses';
import { extractYouTubeId, getYouTubeThumbnail } from '../../lib/youtube';

const COURSES_STORAGE_KEY = 'genmitra_courses_data_v2';
const ENROLLMENTS_STORAGE_KEY = 'genmitra_course_enrollments_v2';
const PROGRESS_STORAGE_KEY = 'genmitra_course_progress_v2';
const REVIEWS_STORAGE_KEY = 'genmitra_course_reviews_v2';

// Initial high-quality seed courses including user's requested example
const INITIAL_COURSES: Course[] = [
  {
    id: 'course-python-telugu-001',
    mentor_id: '10000000-0000-0000-0000-000000000001',
    mentor_name: 'Kapu Mani Shankar Reddy',
    mentor_avatar: null,
    title: 'Python Full Course: From Basics to Advanced Engineering',
    category: 'Full Stack & Backend',
    description:
      'Complete end-to-end Python programming course covering fundamentals, object-oriented architecture, data structures, automation, and real-world project development.',
    thumbnail_url: 'https://img.youtube.com/vi/Sf9El3N3kLs/hqdefault.jpg',
    learning_objectives: [
      'Master fundamental Python syntax, variables, operators, and control flows.',
      'Build modular code with functions, decorators, and OOP class hierarchies.',
      'Implement file handling, exception safety, and external package management.',
      'Deploy real-world Python automation scripts and REST API integrations.',
    ],
    status: 'published',
    modules: [
      {
        id: 'mod-py-01',
        course_id: 'course-python-telugu-001',
        title: 'Module 1: Python Architecture, Syntax & Control Structures',
        youtube_url: 'https://youtu.be/Sf9El3N3kLs?si=65S-aWcq-3JxTpsP',
        youtube_video_id: 'Sf9El3N3kLs',
        thumbnail_url: 'https://img.youtube.com/vi/Sf9El3N3kLs/hqdefault.jpg',
        learning_objectives: 'Set up Python virtual environments, understand dynamic typing, and master conditional logic.',
        order_index: 0,
        duration: '1h 45m',
      },
      {
        id: 'mod-py-02',
        course_id: 'course-python-telugu-001',
        title: 'Module 2: Data Structures, Collections & Functional Programming',
        youtube_url: 'https://youtu.be/Sf9El3N3kLs?si=65S-aWcq-3JxTpsP',
        youtube_video_id: 'Sf9El3N3kLs',
        thumbnail_url: 'https://img.youtube.com/vi/Sf9El3N3kLs/hqdefault.jpg',
        learning_objectives: 'Deep dive into lists, tuples, dictionaries, list comprehensions, and lambda expressions.',
        order_index: 1,
        duration: '2h 10m',
      },
      {
        id: 'mod-py-03',
        course_id: 'course-python-telugu-001',
        title: 'Module 3: Production Project - Building Automation & APIs',
        youtube_url: 'https://youtu.be/Sf9El3N3kLs?si=65S-aWcq-3JxTpsP',
        youtube_video_id: 'Sf9El3N3kLs',
        thumbnail_url: 'https://img.youtube.com/vi/Sf9El3N3kLs/hqdefault.jpg',
        learning_objectives: 'Construct end-to-end practical projects using clean architecture principles.',
        order_index: 2,
        duration: '2h 30m',
      },
    ],
    created_at: '2026-10-10T10:00:00.000Z',
    updated_at: '2026-10-12T14:30:00.000Z',
    enrolled_count: 0,
    completed_count: 0,
    review_count: 0,
    average_rating: 0,
  },
  {
    id: 'course-react-cloud-002',
    mentor_id: '10000000-0000-0000-0000-000000000001',
    mentor_name: 'Kapu Mani Shankar Reddy',
    mentor_avatar: null,
    title: 'Modern React 19, TypeScript & Cloud Deployment Pipeline',
    category: 'Frontend & Architecture',
    description:
      'Learn production React engineering with modern hooks, TypeScript interfaces, Tailwind styling, TanStack Query cache patterns, and Cloudflare Pages deployment.',
    thumbnail_url: 'https://img.youtube.com/vi/bMknfKXIFA8/hqdefault.jpg',
    learning_objectives: [
      'Master React 19 server/client state management with TanStack Query.',
      'Enforce type safety across responsive component design systems.',
      'Integrate Supabase backend authentication and real-time websockets.',
      'Deploy CI/CD pipelines to Cloudflare Pages & Render.',
    ],
    status: 'published',
    modules: [
      {
        id: 'mod-react-01',
        course_id: 'course-react-cloud-002',
        title: 'Module 1: React 19 Component Architecture & Custom Hooks',
        youtube_url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
        youtube_video_id: 'bMknfKXIFA8',
        thumbnail_url: 'https://img.youtube.com/vi/bMknfKXIFA8/hqdefault.jpg',
        learning_objectives: 'Component lifecycle, hooks optimization, and composition patterns.',
        order_index: 0,
        duration: '1h 30m',
      },
      {
        id: 'mod-react-02',
        course_id: 'course-react-cloud-002',
        title: 'Module 2: TanStack Query, Optimistic UI & Supabase Realtime',
        youtube_url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
        youtube_video_id: 'bMknfKXIFA8',
        thumbnail_url: 'https://img.youtube.com/vi/bMknfKXIFA8/hqdefault.jpg',
        learning_objectives: 'Cache invalidation, pagination, and server synchronization.',
        order_index: 1,
        duration: '1h 50m',
      },
    ],
    created_at: '2026-10-11T09:00:00.000Z',
    updated_at: '2026-10-12T16:00:00.000Z',
    enrolled_count: 2,
    completed_count: 0,
    review_count: 0,
    average_rating: 0,
  },
];

// Helper: load local courses
function getStoredCourses(): Course[] {
  try {
    const raw = localStorage.getItem(COURSES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return INITIAL_COURSES;
}

function saveStoredCourses(courses: Course[]) {
  try {
    localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
  } catch {}
}

function getStoredEnrollments(): Record<string, CourseEnrollmentRecord> {
  try {
    const raw = localStorage.getItem(ENROLLMENTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveStoredEnrollments(data: Record<string, CourseEnrollmentRecord>) {
  try {
    localStorage.setItem(ENROLLMENTS_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function getStoredProgress(): Record<string, CourseProgressRecord> {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveStoredProgress(data: Record<string, CourseProgressRecord>) {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function getStoredReviews(): CourseReviewRecord[] {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveStoredReviews(reviews: CourseReviewRecord[]) {
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  } catch {}
}

// Notification Dispatcher
async function dispatchCourseNotification(payload: {
  title: string;
  message: string;
  relatedId?: string;
}) {
  const notifObj = {
    id: `notif-course-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: payload.title,
    body: payload.message,
    category: 'course',
    created_at: new Date().toISOString(),
  };

  // 1. Dispatch into local platform announcements / notification feed
  try {
    const existing = JSON.parse(localStorage.getItem('genmitra_platform_announcements') || '[]');
    existing.unshift(notifObj);
    localStorage.setItem('genmitra_platform_announcements', JSON.stringify(existing.slice(0, 50)));
  } catch {}

  // 2. Attempt remote Supabase insert if tables exist
  try {
    await supabase.from('notifications').insert({
      title: payload.title,
      message: payload.message,
      type: 'course',
      related_type: 'course',
      related_id: payload.relatedId,
    });
  } catch {}
}

export const coursesApi = {
  // 1. Courses Query
  async getAllCourses(role: 'admin' | 'mentor' | 'intern' = 'intern', mentorId?: string): Promise<Course[]> {
    let courses = getStoredCourses();

    // Try Supabase fetch
    try {
      const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        // Merge Supabase courses
        courses = data.map((c: any) => ({
          ...c,
          modules: c.modules || [],
          learning_objectives: Array.isArray(c.learning_objectives)
            ? c.learning_objectives
            : (c.learning_objectives || '').split('\n').filter(Boolean),
        }));
      }
    } catch {}

    // Attach real-time enrollment and review aggregates
    const enrollments = getStoredEnrollments();
    const reviews = getStoredReviews();

    const enriched = courses.map((course) => {
      const courseEnrollments = Object.values(enrollments).filter((e) => e.course_id === course.id);
      const courseReviews = reviews.filter((r) => r.course_id === course.id);
      const completedCount = courseEnrollments.filter((e) => e.status === 'completed').length;
      const avgRating =
        courseReviews.length > 0
          ? Number((courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length).toFixed(1))
          : 0;

      return {
        ...course,
        enrolled_count: courseEnrollments.length,
        completed_count: completedCount,
        review_count: courseReviews.length,
        average_rating: avgRating,
      };
    });

    if (role === 'admin') {
      return enriched;
    }

    if (role === 'mentor') {
      if (mentorId) {
        return enriched.filter((c) => c.mentor_id === mentorId);
      }
      return enriched;
    }

    // Intern role: only view published courses
    return enriched.filter((c) => c.status === 'published');
  },

  async getCourseById(courseId: string): Promise<Course | null> {
    const courses = await this.getAllCourses('admin');
    return courses.find((c) => c.id === courseId) || null;
  },

  // 2. Course Authoring & Mutation
  async createCourse(
    payload: CreateCourseInput,
    mentor: { id: string; name: string; avatar?: string | null }
  ): Promise<Course> {
    const courseId = `course-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Build modules with parsed YouTube metadata
    const modules: CourseModule[] = payload.modules.map((m, idx) => {
      const videoId = extractYouTubeId(m.youtube_url) || 'Sf9El3N3kLs';
      const thumb = getYouTubeThumbnail(videoId, 'hq');

      return {
        id: `mod-${courseId}-${idx + 1}`,
        course_id: courseId,
        title: m.title.trim() || `Module ${idx + 1}`,
        youtube_url: m.youtube_url.trim(),
        youtube_video_id: videoId,
        thumbnail_url: thumb,
        learning_objectives: m.learning_objectives || '',
        order_index: idx,
        duration: '1h 30m',
      };
    });

    // Default thumbnail from first module
    const mainThumbnail = modules[0]?.thumbnail_url || 'https://img.youtube.com/vi/Sf9El3N3kLs/hqdefault.jpg';

    const newCourse: Course = {
      id: courseId,
      mentor_id: mentor.id,
      mentor_name: mentor.name,
      mentor_avatar: mentor.avatar || null,
      title: payload.title.trim(),
      category: payload.category || 'Engineering',
      description: payload.description.trim(),
      thumbnail_url: mainThumbnail,
      learning_objectives: payload.learning_objectives || [],
      status: payload.status || 'draft',
      modules,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      enrolled_count: 0,
      completed_count: 0,
      review_count: 0,
      average_rating: 0,
    };

    // Save locally
    const current = getStoredCourses();
    current.unshift(newCourse);
    saveStoredCourses(current);

    // Try remote Supabase insert
    try {
      await supabase.from('courses').insert({
        id: newCourse.id,
        mentor_id: newCourse.mentor_id,
        mentor_name: newCourse.mentor_name,
        title: newCourse.title,
        category: newCourse.category,
        description: newCourse.description,
        thumbnail_url: newCourse.thumbnail_url,
        learning_objectives: newCourse.learning_objectives,
        status: newCourse.status,
        modules: newCourse.modules,
      });
    } catch {}

    return newCourse;
  },

  async updateCourse(courseId: string, payload: Partial<CreateCourseInput>): Promise<Course> {
    const courses = getStoredCourses();
    const idx = courses.findIndex((c) => c.id === courseId);
    if (idx < 0) throw new Error('Course not found');

    const existing = courses[idx];

    let updatedModules = existing.modules;
    if (payload.modules) {
      updatedModules = payload.modules.map((m, i) => {
        const videoId = extractYouTubeId(m.youtube_url) || 'Sf9El3N3kLs';
        const thumb = getYouTubeThumbnail(videoId, 'hq');

        return {
          id: `mod-${courseId}-${i + 1}`,
          course_id: courseId,
          title: m.title.trim() || `Module ${i + 1}`,
          youtube_url: m.youtube_url.trim(),
          youtube_video_id: videoId,
          thumbnail_url: thumb,
          learning_objectives: m.learning_objectives || '',
          order_index: i,
          duration: '1h 30m',
        };
      });
    }

    const updatedCourse: Course = {
      ...existing,
      title: payload.title !== undefined ? payload.title.trim() : existing.title,
      category: payload.category !== undefined ? payload.category : existing.category,
      description: payload.description !== undefined ? payload.description.trim() : existing.description,
      learning_objectives:
        payload.learning_objectives !== undefined ? payload.learning_objectives : existing.learning_objectives,
      status: payload.status !== undefined ? payload.status : existing.status,
      modules: updatedModules,
      thumbnail_url: updatedModules[0]?.thumbnail_url || existing.thumbnail_url,
      updated_at: new Date().toISOString(),
    };

    courses[idx] = updatedCourse;
    saveStoredCourses(courses);

    // Try Supabase update
    try {
      await supabase
        .from('courses')
        .update({
          title: updatedCourse.title,
          category: updatedCourse.category,
          description: updatedCourse.description,
          learning_objectives: updatedCourse.learning_objectives,
          status: updatedCourse.status,
          modules: updatedCourse.modules,
          thumbnail_url: updatedCourse.thumbnail_url,
          updated_at: updatedCourse.updated_at,
        })
        .eq('id', courseId);
    } catch {}

    return updatedCourse;
  },

  async deleteCourse(courseId: string): Promise<void> {
    const courses = getStoredCourses();
    const filtered = courses.filter((c) => c.id !== courseId);
    saveStoredCourses(filtered);

    // Clean enrollments
    const enrollments = getStoredEnrollments();
    Object.keys(enrollments).forEach((key) => {
      if (enrollments[key].course_id === courseId) {
        delete enrollments[key];
      }
    });
    saveStoredEnrollments(enrollments);

    try {
      await supabase.from('courses').delete().eq('id', courseId);
    } catch {}
  },

  async togglePublishCourse(courseId: string, status: 'published' | 'draft'): Promise<void> {
    await this.updateCourse(courseId, { status });
  },

  // 3. Intern Learning Progress
  async getInternCourseProgress(
    courseId: string,
    internId: string
  ): Promise<{
    enrollment: CourseEnrollmentRecord;
    moduleProgress: Record<string, CourseProgressRecord>;
    review: CourseReviewRecord | null;
  }> {
    const enrollKey = `${courseId}_${internId}`;
    const allEnrollments = getStoredEnrollments();
    const allProgress = getStoredProgress();
    const allReviews = getStoredReviews();

    const course = await this.getCourseById(courseId);
    const totalModules = course?.modules?.length || 1;

    let enrollment = allEnrollments[enrollKey];
    if (!enrollment) {
      enrollment = {
        id: `enr-${Date.now()}`,
        course_id: courseId,
        intern_id: internId,
        intern_name: 'Intern',
        status: 'not_started',
        progress_percentage: 0,
        completed_modules: [],
        review_submitted: false,
      };
    }

    // Filter module progress records for this course + intern
    const moduleProgress: Record<string, CourseProgressRecord> = {};
    if (course?.modules) {
      course.modules.forEach((mod) => {
        const progKey = `${courseId}_${internId}_${mod.id}`;
        moduleProgress[mod.id] = allProgress[progKey] || {
          id: `prog-${Date.now()}-${mod.id}`,
          course_id: courseId,
          module_id: mod.id,
          intern_id: internId,
          intern_name: enrollment.intern_name,
          started: false,
          completed: false,
          updated_at: new Date().toISOString(),
        };
      });
    }

    const review = allReviews.find((r) => r.course_id === courseId && r.intern_id === internId) || null;

    return {
      enrollment,
      moduleProgress,
      review,
    };
  },

  // Action 1: ▶ Started
  async markModuleStarted(
    courseId: string,
    moduleId: string,
    intern: { id: string; name: string }
  ): Promise<CourseProgressRecord> {
    const progKey = `${courseId}_${intern.id}_${moduleId}`;
    const enrollKey = `${courseId}_${intern.id}`;

    const allProgress = getStoredProgress();
    const allEnrollments = getStoredEnrollments();

    const currentProg = allProgress[progKey] || {
      id: `prog-${Date.now()}-${moduleId}`,
      course_id: courseId,
      module_id: moduleId,
      intern_id: intern.id,
      intern_name: intern.name,
      started: false,
      completed: false,
      updated_at: new Date().toISOString(),
    };

    const isFirstTimeStarting = !currentProg.started;
    currentProg.started = true;
    if (!currentProg.started_at) {
      currentProg.started_at = new Date().toISOString();
    }
    currentProg.updated_at = new Date().toISOString();
    allProgress[progKey] = currentProg;
    saveStoredProgress(allProgress);

    // Update Enrollment
    const course = await this.getCourseById(courseId);
    let enrollment = allEnrollments[enrollKey];
    if (!enrollment) {
      enrollment = {
        id: `enr-${Date.now()}`,
        course_id: courseId,
        intern_id: intern.id,
        intern_name: intern.name,
        status: 'in_progress',
        progress_percentage: 0,
        started_at: new Date().toISOString(),
        completed_modules: [],
        review_submitted: false,
      };
    } else {
      if (enrollment.status === 'not_started') {
        enrollment.status = 'in_progress';
        enrollment.started_at = new Date().toISOString();
      }
    }
    allEnrollments[enrollKey] = enrollment;
    saveStoredEnrollments(allEnrollments);

    // Notify Mentors & Admin on start
    if (isFirstTimeStarting) {
      await dispatchCourseNotification({
        title: 'Course Started',
        message: `${intern.name} started the course "${course?.title || 'Engineering Course'}".`,
        relatedId: courseId,
      });
    }

    return currentProg;
  },

  // Action 2: ✓ Completed
  async markModuleCompleted(
    courseId: string,
    moduleId: string,
    intern: { id: string; name: string }
  ): Promise<{ progress: CourseProgressRecord; enrollment: CourseEnrollmentRecord; isCourseFinished: boolean }> {
    const progKey = `${courseId}_${intern.id}_${moduleId}`;
    const enrollKey = `${courseId}_${intern.id}`;

    const allProgress = getStoredProgress();
    const allEnrollments = getStoredEnrollments();
    const course = await this.getCourseById(courseId);
    const totalModules = course?.modules?.length || 1;

    const currentProg = allProgress[progKey] || {
      id: `prog-${Date.now()}-${moduleId}`,
      course_id: courseId,
      module_id: moduleId,
      intern_id: intern.id,
      intern_name: intern.name,
      started: true,
      started_at: new Date().toISOString(),
      completed: false,
      updated_at: new Date().toISOString(),
    };

    currentProg.started = true;
    currentProg.completed = true;
    currentProg.completed_at = new Date().toISOString();
    currentProg.updated_at = new Date().toISOString();
    allProgress[progKey] = currentProg;
    saveStoredProgress(allProgress);

    // Update Enrollment
    let enrollment = allEnrollments[enrollKey];
    if (!enrollment) {
      enrollment = {
        id: `enr-${Date.now()}`,
        course_id: courseId,
        intern_id: intern.id,
        intern_name: intern.name,
        status: 'in_progress',
        progress_percentage: 0,
        started_at: new Date().toISOString(),
        completed_modules: [],
        review_submitted: false,
      };
    }

    const completedSet = new Set(enrollment.completed_modules || []);
    completedSet.add(moduleId);
    const completedArr = Array.from(completedSet);

    enrollment.completed_modules = completedArr;
    const progressPercent = Math.min(100, Math.round((completedArr.length / totalModules) * 100));
    enrollment.progress_percentage = progressPercent;

    const isCourseFinished = completedArr.length >= totalModules;
    if (isCourseFinished) {
      enrollment.status = 'completed';
      enrollment.completed_at = new Date().toISOString();

      await dispatchCourseNotification({
        title: 'Course Completed',
        message: `${intern.name} completed all modules in "${course?.title || 'Course'}"! Review is now unlocked.`,
        relatedId: courseId,
      });
    } else {
      enrollment.status = 'in_progress';
      const mod = course?.modules?.find((m) => m.id === moduleId);
      await dispatchCourseNotification({
        title: 'Module Completed',
        message: `${intern.name} completed "${mod?.title || 'Module'}" in "${course?.title || 'Course'}".`,
        relatedId: courseId,
      });
    }

    allEnrollments[enrollKey] = enrollment;
    saveStoredEnrollments(allEnrollments);

    return {
      progress: currentProg,
      enrollment,
      isCourseFinished,
    };
  },

  // Action 3: ★ Review
  async submitCourseReview(
    payload: SubmitReviewInput,
    intern: { id: string; name: string; avatar?: string | null }
  ): Promise<CourseReviewRecord> {
    const course = await this.getCourseById(payload.course_id);
    const allReviews = getStoredReviews();
    const allEnrollments = getStoredEnrollments();
    const enrollKey = `${payload.course_id}_${intern.id}`;

    const newReview: CourseReviewRecord = {
      id: `rev-${Date.now()}`,
      course_id: payload.course_id,
      course_title: course?.title || 'Course',
      intern_id: intern.id,
      intern_name: intern.name,
      intern_avatar: intern.avatar || null,
      rating: Math.max(1, Math.min(5, payload.rating || 5)),
      learned_summary: payload.learned_summary.trim(),
      understanding_summary: payload.understanding_summary.trim(),
      useful_concepts: payload.useful_concepts.trim(),
      practical_application: payload.practical_application.trim(),
      improvement_feedback: payload.improvement_feedback?.trim() || '',
      overall_feedback: payload.overall_feedback.trim(),
      submitted_at: new Date().toISOString(),
    };

    // Filter existing review if already present to avoid duplicates
    const filtered = allReviews.filter((r) => !(r.course_id === payload.course_id && r.intern_id === intern.id));
    filtered.unshift(newReview);
    saveStoredReviews(filtered);

    // Update Enrollment review status
    if (allEnrollments[enrollKey]) {
      allEnrollments[enrollKey].review_submitted = true;
      saveStoredEnrollments(allEnrollments);
    }

    // Dispatch Notification to Mentor and Admin
    await dispatchCourseNotification({
      title: 'New Course Review',
      message: `${intern.name} submitted a ${newReview.rating}-star review for "${course?.title || 'Course'}".`,
      relatedId: payload.course_id,
    });

    return newReview;
  },

  // 4. Analytics & Queries for Admin and Mentors
  async getCourseEnrolledInterns(courseId: string): Promise<CourseEnrollmentRecord[]> {
    const all = getStoredEnrollments();
    return Object.values(all).filter((e) => e.course_id === courseId);
  },

  async getAllCourseReviews(courseId?: string): Promise<CourseReviewRecord[]> {
    const all = getStoredReviews();
    if (courseId) {
      return all.filter((r) => r.course_id === courseId);
    }
    return all;
  },
};
