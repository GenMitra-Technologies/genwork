// src/features/courses/mentor/MentorCoursesPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Users,
  Eye,
  Star,
  Edit,
  Trash2,
  Globe,
  Lock,
  Layers,
  Sparkles,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { coursesApi } from '../api';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { cn } from '../../../lib/utils';
import { Course } from '../../../types/courses';

export function MentorCoursesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const mentorId = profile?.mentor_id || profile?.id || '10000000-0000-0000-0000-000000000001';

  const [activeTab, setActiveTab] = useState<'my_courses' | 'enrolled_interns' | 'reviews'>('my_courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch Mentor Courses
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses', 'mentor', mentorId],
    queryFn: () => coursesApi.getAllCourses('mentor', mentorId),
  });

  // Fetch All Reviews
  const { data: allReviews = [] } = useQuery({
    queryKey: ['courseReviews'],
    queryFn: () => coursesApi.getAllCourseReviews(),
  });

  // Fetch Enrolled Interns across mentor's courses
  const mentorCourseIds = courses.map((c) => c.id);
  const relevantReviews = allReviews.filter((r) => mentorCourseIds.includes(r.course_id));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle Publish Mutation
  const togglePublishMutation = useMutation({
    mutationFn: ({ courseId, status }: { courseId: string; status: 'published' | 'draft' }) =>
      coursesApi.togglePublishCourse(courseId, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      showToast(vars.status === 'published' ? 'Course published to Interns!' : 'Course unpublished and saved as draft.');
    },
  });

  // Delete Course Mutation
  const deleteMutation = useMutation({
    mutationFn: (courseId: string) => coursesApi.deleteCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setCourseToDelete(null);
      showToast('Course successfully deleted.');
    },
  });

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEnrollments = courses.reduce((sum, c) => sum + (c.enrolled_count || 0), 0);
  const totalCompletions = courses.reduce((sum, c) => sum + (c.completed_count || 0), 0);
  const totalReviewsCount = relevantReviews.length;

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-xl bg-slate-900/95 text-white px-4 py-3 text-xs font-semibold shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                <GraduationCap className="h-5 w-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Course Curriculum & Video Management
              </h1>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Design technical video courses, organize multi-part modules with YouTube embeds, track enrolled interns' learning milestones, and evaluate student feedback reviews.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => navigate('/mentor/courses/new')}
            className="h-9 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs rounded-xl shrink-0"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create New Course
          </Button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Courses</span>
            <span className="text-lg font-bold text-slate-900">{courses.length}</span>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Intern Enrollments</span>
            <span className="text-lg font-bold text-indigo-600">{totalEnrollments}</span>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Completed Courses</span>
            <span className="text-lg font-bold text-emerald-600">{totalCompletions}</span>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Student Reviews</span>
            <span className="text-lg font-bold text-amber-500">{totalReviewsCount}</span>
          </div>
        </div>

        {/* Navigation Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-indigo-100/60">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('my_courses')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                activeTab === 'my_courses'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80'
              )}
            >
              My Courses ({courses.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                activeTab === 'reviews'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80'
              )}
            >
              Intern Reviews ({relevantReviews.length})
            </button>
          </div>

          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-xs rounded-xl bg-white border-slate-200"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: MY COURSES */}
      {activeTab === 'my_courses' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No courses found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Get started by creating your first course with YouTube video links.
              </p>
              <Button
                size="sm"
                onClick={() => navigate('/mentor/courses/new')}
                className="bg-indigo-600 text-white text-xs mt-2"
              >
                Create Your First Course
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCourses.map((course) => {
                const isPublished = course.status === 'published';
                return (
                  <div
                    key={course.id}
                    className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-md transition-all flex flex-col overflow-hidden"
                  >
                    {/* Thumbnail & Badges */}
                    <div className="relative aspect-video bg-slate-900 overflow-hidden">
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/75 text-white backdrop-blur-xs">
                          {course.category}
                        </span>
                      </div>
                      <div className="absolute top-2.5 right-2.5">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs flex items-center gap-1',
                            isPublished
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-500 text-white'
                          )}
                        >
                          {isPublished ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                          {isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/80 text-white flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        <span>{course.modules?.length || 0} Videos</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                          {course.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {course.description}
                        </p>
                      </div>

                      {/* Metrics bar */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Enrolled</span>
                          <span className="text-xs font-bold text-slate-700">{course.enrolled_count || 0}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Completed</span>
                          <span className="text-xs font-bold text-emerald-600">{course.completed_count || 0}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Rating</span>
                          <span className="text-xs font-bold text-amber-500 flex items-center justify-center gap-0.5">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {course.average_rating ? course.average_rating.toFixed(1) : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            togglePublishMutation.mutate({
                              courseId: course.id,
                              status: isPublished ? 'draft' : 'published',
                            })
                          }
                          className="flex-1 h-8 text-xs font-medium"
                        >
                          {isPublished ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/mentor/courses/${course.id}/edit`)}
                          className="h-8 px-2.5 text-xs text-slate-700 hover:text-indigo-600 hover:border-indigo-300"
                          title="Edit Course"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCourseToDelete(course)}
                          className="h-8 px-2.5 text-xs text-red-600 hover:bg-red-50 hover:border-red-300"
                          title="Delete Course"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {relevantReviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-2">
              <Star className="h-8 w-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-700">No student reviews yet</h3>
              <p className="text-xs text-slate-400">
                Reviews submitted by interns upon completing your courses will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relevantReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        {rev.course_title}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{rev.intern_name}</h4>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            'h-3.5 w-3.5',
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          )}
                        />
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-1">({rev.rating}/5)</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-700 block">What was learned:</span>
                      <p className="text-slate-600">{rev.learned_summary}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 block">Key concepts & understanding:</span>
                      <p className="text-slate-600">{rev.useful_concepts}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 block">Practical application:</span>
                      <p className="text-slate-600">{rev.practical_application}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="font-semibold text-slate-700 block">Overall Feedback:</span>
                      <p className="text-slate-700 italic font-medium">"{rev.overall_feedback}"</p>
                    </div>
                  </div>

                  <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Submitted on: {new Date(rev.submitted_at).toLocaleDateString()}</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Completion
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog: Delete Course */}
      <Dialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Delete Course
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Are you sure you want to delete <strong>"{courseToDelete?.title}"</strong>? This will remove all associated
            module links and progress records.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCourseToDelete(null)}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={deleteMutation.isPending}
            onClick={() => courseToDelete && deleteMutation.mutate(courseToDelete.id)}
            className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white font-medium"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
