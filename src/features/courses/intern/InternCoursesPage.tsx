// src/features/courses/intern/InternCoursesPage.tsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Search, Filter, BookOpen, CheckCircle2, Clock, Star, Sparkles } from 'lucide-react';
import { coursesApi } from '../api';
import { useAuth } from '../../../hooks/useAuth';
import { CourseCard } from '../components/CourseCard';
import { Input } from '../../../components/ui/input';
import { Course, CourseEnrollmentRecord } from '../../../types/courses';

export function InternCoursesPage() {
  const { profile } = useAuth();
  const internId = profile?.intern_id || profile?.id || '20000000-0000-0000-0000-000000000001';
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Fetch published courses
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses', 'intern'],
    queryFn: () => coursesApi.getAllCourses('intern'),
  });

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    courses.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [courses]);

  // Filter courses by search and category
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.mentor_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = selectedCategory === 'All' || course.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [courses, searchQuery, selectedCategory]);

  return (
    <div className="space-y-5 max-w-[1240px] mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-white p-5 sm:p-6 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                <GraduationCap className="h-5 w-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Course Catalog & Video Academy
              </h1>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Explore mentor-curated video masterclasses, complete technical modules, track your progress in real time, and earn verified course reviews.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-indigo-200/80 text-indigo-700 shadow-2xs">
              {courses.length} Available Courses
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search courses by title, topic, or mentor name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-white border-slate-200/90"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">No courses match your search</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms or selecting a different category to browse available curriculum.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onSelect={(c) => navigate(`/intern/courses/${c.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
