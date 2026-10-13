// src/features/courses/mentor/MentorCourseEditorPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Sparkles,
  Youtube,
  GraduationCap,
  Save,
  Globe,
  FileCheck,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { coursesApi } from '../api';
import { fetchYouTubeMeta, extractYouTubeId, getYouTubeThumbnail } from '../../../lib/youtube';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { CreateCourseInput } from '../../../types/courses';

interface ModuleFormItem {
  id?: string;
  title: string;
  youtube_url: string;
  youtube_video_id?: string;
  thumbnail_url?: string;
  learning_objectives: string;
  isFetchingMeta?: boolean;
}

export function MentorCourseEditorPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const isEditing = !!courseId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const mentorId = profile?.mentor_id || profile?.id || '10000000-0000-0000-0000-000000000001';
  const mentorName = profile?.full_name || 'Mentor';

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Full Stack & Backend');
  const [description, setDescription] = useState('');
  const [learningObjectivesText, setLearningObjectivesText] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [modules, setModules] = useState<ModuleFormItem[]>([
    {
      title: '',
      youtube_url: '',
      learning_objectives: '',
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch existing course if editing
  const { data: existingCourse, isLoading: isCourseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => (courseId ? coursesApi.getCourseById(courseId) : null),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingCourse) {
      setTitle(existingCourse.title);
      setCategory(existingCourse.category || 'Full Stack & Backend');
      setDescription(existingCourse.description || '');
      setLearningObjectivesText((existingCourse.learning_objectives || []).join('\n'));
      setStatus(existingCourse.status);
      if (existingCourse.modules && existingCourse.modules.length > 0) {
        setModules(
          existingCourse.modules.map((m) => ({
            id: m.id,
            title: m.title,
            youtube_url: m.youtube_url,
            youtube_video_id: m.youtube_video_id,
            thumbnail_url: m.thumbnail_url,
            learning_objectives: m.learning_objectives || '',
          }))
        );
      }
    }
  }, [existingCourse]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Automatic YouTube Metadata Fetch Handler
  const handleFetchYouTube = async (index: number, urlToFetch?: string) => {
    const targetUrl = urlToFetch || modules[index].youtube_url;
    if (!targetUrl.trim()) return;

    const videoId = extractYouTubeId(targetUrl);
    if (!videoId) {
      setError(`Module ${index + 1}: Invalid YouTube URL or Video ID.`);
      return;
    }

    // Set loading indicator on module
    setModules((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], isFetchingMeta: true };
      return copy;
    });

    try {
      const meta = await fetchYouTubeMeta(targetUrl);
      setModules((prev) => {
        const copy = [...prev];
        const currentMod = copy[index];
        copy[index] = {
          ...currentMod,
          youtube_video_id: videoId,
          thumbnail_url: meta?.thumbnailUrl || getYouTubeThumbnail(videoId, 'hq'),
          title: currentMod.title.trim() ? currentMod.title : meta?.title || currentMod.title,
          isFetchingMeta: false,
        };
        return copy;
      });
      showToast(`YouTube video recognized & thumbnail generated!`);
    } catch {
      setModules((prev) => {
        const copy = [...prev];
        copy[index] = {
          ...copy[index],
          youtube_video_id: videoId,
          thumbnail_url: getYouTubeThumbnail(videoId, 'hq'),
          isFetchingMeta: false,
        };
        return copy;
      });
    }
  };

  // Add new module slot
  const handleAddModule = () => {
    setModules((prev) => [
      ...prev,
      {
        title: '',
        youtube_url: '',
        learning_objectives: '',
      },
    ]);
  };

  // Remove module
  const handleRemoveModule = (index: number) => {
    if (modules.length <= 1) {
      setError('A course must have at least one module.');
      return;
    }
    setModules((prev) => prev.filter((_, i) => i !== index));
  };

  // Reorder modules: Move Up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setModules((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Reorder modules: Move Down
  const handleMoveDown = (index: number) => {
    if (index === modules.length - 1) return;
    setModules((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (publishStatus?: 'draft' | 'published') => {
      const finalStatus = publishStatus || status;

      if (!title.trim()) throw new Error('Please enter a course title.');
      if (!description.trim()) throw new Error('Please enter a course description.');
      if (modules.length === 0) throw new Error('Please add at least one module.');

      for (let i = 0; i < modules.length; i++) {
        if (!modules[i].youtube_url.trim()) {
          throw new Error(`Module ${i + 1}: YouTube video URL is required.`);
        }
      }

      const learningObjectives = learningObjectivesText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const payload: CreateCourseInput = {
        title: title.trim(),
        category,
        description: description.trim(),
        learning_objectives: learningObjectives,
        status: finalStatus,
        modules: modules.map((m, idx) => ({
          title: m.title.trim() || `Module ${idx + 1}`,
          youtube_url: m.youtube_url.trim(),
          learning_objectives: m.learning_objectives.trim(),
        })),
      };

      if (isEditing) {
        return coursesApi.updateCourse(courseId!, payload);
      } else {
        return coursesApi.createCourse(payload, {
          id: mentorId,
          name: mentorName,
          avatar: profile?.avatar_url || null,
        });
      }
    },
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', course.id] });
      navigate('/mentor/courses');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to save course');
    },
  });

  if (isEditing && isCourseLoading) {
    return (
      <div className="max-w-4xl mx-auto py-10 space-y-4">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-xl bg-slate-900/95 text-white px-4 py-3 text-xs font-semibold shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/mentor/courses')}
            className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back to Courses</span>
          </Button>
          <span className="text-slate-300">/</span>
          <h1 className="text-base sm:text-lg font-bold text-slate-900">
            {isEditing ? 'Edit Course Curriculum' : 'Create New Course'}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate('draft')}
            className="h-8 text-xs font-semibold border-slate-300 hover:bg-slate-50 text-slate-700"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Save as Draft
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate('published')}
            className="h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs"
          >
            <Globe className="h-3.5 w-3.5 mr-1.5" />
            {isEditing ? 'Save & Publish' : 'Publish Course'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: Course Meta */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <GraduationCap className="h-4 w-4 text-indigo-600" />
          1. Course Information & Categorization
        </h2>

        <div className="space-y-4 text-xs">
          {/* Title */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Course Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Python Full Course: From Basics to Advanced Engineering"
              className="text-xs h-9 rounded-xl"
              required
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Course Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs h-9 rounded-xl border border-slate-200 bg-white px-3 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Full Stack & Backend">Full Stack & Backend</option>
                <option value="Frontend & Architecture">Frontend & Architecture</option>
                <option value="Cloud, DevOps & CI/CD">Cloud, DevOps & CI/CD</option>
                <option value="Data Science & AI">Data Science & AI</option>
                <option value="System Architecture">System Architecture</option>
                <option value="UI/UX Engineering">UI/UX Engineering</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Publication Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="w-full text-xs h-9 rounded-xl border border-slate-200 bg-white px-3 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="draft">Draft (Hidden from Interns)</option>
                <option value="published">Published (Visible in Intern Academy)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Course Summary & Description *</label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Comprehensive summary of what interns will achieve upon completing this course..."
              className="text-xs rounded-xl"
              required
            />
          </div>

          {/* Learning Objectives */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">
              Learning Objectives (Enter one objective per line)
            </label>
            <Textarea
              rows={3}
              value={learningObjectivesText}
              onChange={(e) => setLearningObjectivesText(e.target.value)}
              placeholder={`Master dynamic typing and modular script separation\nBuild REST APIs and automate deployment workflows\nImplement error handling and security best practices`}
              className="text-xs rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Course Modules & YouTube Links */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Youtube className="h-4 w-4 text-red-600" />
              2. Modules & YouTube Videos
            </h2>
            <p className="text-[11px] text-slate-500">
              Paste YouTube URLs (e.g. <code>https://youtu.be/Sf9El3N3kLs</code>). We automatically extract the Video ID
              and fetch its official title and thumbnail.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddModule}
            className="h-8 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50 rounded-xl"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Module
          </Button>
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          {modules.map((mod, index) => {
            const videoId = mod.youtube_video_id || extractYouTubeId(mod.youtube_url);
            const thumbUrl = mod.thumbnail_url || (videoId ? getYouTubeThumbnail(videoId, 'hq') : '');

            return (
              <div
                key={index}
                className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
              >
                {/* Module Header Bar with Reorder and Delete controls */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">Module #{index + 1}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                      title="Move Up"
                    >
                      <MoveUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === modules.length - 1}
                      className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                      title="Move Down"
                    >
                      <MoveDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveModule(index)}
                      disabled={modules.length <= 1}
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30"
                      title="Remove Module"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Left 2 Cols: Form inputs */}
                  <div className="md:col-span-2 space-y-3">
                    {/* YouTube URL input + Fetch Button */}
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">YouTube Video URL *</label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={mod.youtube_url}
                          onChange={(e) => {
                            const newUrl = e.target.value;
                            setModules((prev) => {
                              const copy = [...prev];
                              copy[index] = { ...copy[index], youtube_url: newUrl };
                              return copy;
                            });
                          }}
                          onBlur={(e) => {
                            if (e.target.value.trim()) {
                              handleFetchYouTube(index, e.target.value.trim());
                            }
                          }}
                          placeholder="e.g. https://youtu.be/Sf9El3N3kLs?si=65S-aWcq-3JxTpsP"
                          className="text-xs h-9 rounded-xl bg-white flex-1"
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleFetchYouTube(index)}
                          disabled={mod.isFetchingMeta || !mod.youtube_url.trim()}
                          className="h-9 text-xs px-3 rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 shrink-0"
                        >
                          {mod.isFetchingMeta ? 'Fetching...' : 'Fetch Info'}
                        </Button>
                      </div>
                    </div>

                    {/* Video Title */}
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Video / Module Title *</label>
                      <Input
                        value={mod.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setModules((prev) => {
                            const copy = [...prev];
                            copy[index] = { ...copy[index], title: val };
                            return copy;
                          });
                        }}
                        placeholder="e.g. Module 1: Python Architecture & Syntax Setup"
                        className="text-xs h-9 rounded-xl bg-white"
                        required
                      />
                    </div>

                    {/* Learning Objectives for this module */}
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Module Learning Objectives</label>
                      <Input
                        value={mod.learning_objectives}
                        onChange={(e) => {
                          const val = e.target.value;
                          setModules((prev) => {
                            const copy = [...prev];
                            copy[index] = { ...copy[index], learning_objectives: val };
                            return copy;
                          });
                        }}
                        placeholder="Key milestones: Virtual environments, dynamic variables, and control flow structures."
                        className="text-xs h-9 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  {/* Right Col: Video Preview & Thumbnail */}
                  <div className="space-y-1.5 flex flex-col justify-center">
                    <label className="font-semibold text-slate-700 block">Thumbnail Preview</label>
                    {thumbUrl ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-2xs group">
                        <img src={thumbUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center">
                          <Youtube className="h-8 w-8 text-red-600 fill-white" />
                        </div>
                        {videoId && (
                          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                            ID: {videoId}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 p-3 text-center">
                        <Youtube className="h-6 w-6 text-slate-300 mb-1" />
                        <span className="text-[11px]">Paste URL above to load thumbnail</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Module Bottom Bar */}
        <div className="pt-2 flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddModule}
            className="text-xs rounded-xl border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-600"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Another Video Module
          </Button>
        </div>
      </div>

      {/* Save / Cancel Bottom Footer */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate('/mentor/courses')}
          className="h-9 text-xs"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate('draft')}
          className="h-9 text-xs font-semibold"
        >
          <Save className="h-3.5 w-3.5 mr-1" />
          Save as Draft
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate('published')}
          className="h-9 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs"
        >
          <Globe className="h-3.5 w-3.5 mr-1" />
          {isEditing ? 'Save & Publish Course' : 'Publish Course'}
        </Button>
      </div>
    </div>
  );
}
