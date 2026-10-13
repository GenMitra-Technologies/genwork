// src/features/roadmaps/RoadmapsPage.tsx
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Compass,
  Search,
  BookOpen,
  Edit,
  Trash2,
  ExternalLink,
  Layers,
  Sparkles,
  Download,
  Maximize2,
  Plus,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  X,
  Eye,
} from 'lucide-react';
import { roadmapsApi } from './api';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { cn } from '../../lib/utils';
import { RoadmapItem, RoadmapEditInput } from '../../types/roadmaps';

export function RoadmapsPage() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal states
  const [viewingRoadmap, setViewingRoadmap] = useState<RoadmapItem | null>(null);
  const [editingRoadmap, setEditingRoadmap] = useState<RoadmapItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [roadmapToDelete, setRoadmapToDelete] = useState<RoadmapItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for edit/create
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSvgPath, setEditSvgPath] = useState('');

  // Fetch all roadmaps
  const { data: roadmaps = [], isLoading } = useQuery({
    queryKey: ['roadmaps'],
    queryFn: () => roadmapsApi.getAllRoadmaps(),
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    roadmaps.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set);
  }, [roadmaps]);

  // Filter roadmaps
  const filteredRoadmaps = useMemo(() => {
    return roadmaps.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [roadmaps, searchQuery, selectedCategory]);

  // Edit / Update Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isCreatingNew) {
        return roadmapsApi.createRoadmap({
          title: editTitle,
          category: editCategory,
          description: editDescription,
          svgPath: editSvgPath || '/roadmaps/11-full-stacks/fullstack-master-2026.svg',
        });
      } else if (editingRoadmap) {
        return roadmapsApi.updateRoadmap(editingRoadmap.id, {
          title: editTitle,
          category: editCategory,
          description: editDescription,
          svgPath: editSvgPath,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      setEditingRoadmap(null);
      setIsCreatingNew(false);
      showToast(isCreatingNew ? 'New roadmap successfully created!' : 'Roadmap updated successfully!');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => roadmapsApi.deleteRoadmap(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      setRoadmapToDelete(null);
      showToast('Roadmap removed.');
    },
  });

  // Reset to Defaults
  const resetMutation = useMutation({
    mutationFn: () => roadmapsApi.resetToDefaults(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      showToast('All 59 2026 roadmaps restored to defaults.');
    },
  });

  const openEditModal = (item: RoadmapItem) => {
    setEditingRoadmap(item);
    setIsCreatingNew(false);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditDescription(item.description);
    setEditSvgPath(item.svgPath);
  };

  const openCreateModal = () => {
    setIsCreatingNew(true);
    setEditingRoadmap(null);
    setEditTitle('');
    setEditCategory('Core web');
    setEditDescription('2026 learning milestones roadmap covering Beginner to Expert.');
    setEditSvgPath('/roadmaps/11-full-stacks/fullstack-master-2026.svg');
  };

  return (
    <div className="space-y-6 max-w-[1360px] mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-xl bg-slate-900/95 text-white px-4 py-3 text-xs font-semibold shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50/90 via-indigo-50/50 to-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-600 text-white shadow-xs">
                <Compass className="h-5 w-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Web Development Roadmaps (2026 Edition)
              </h1>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Explore 59 interactive high-definition learning roadmaps with 5 levels: Beginner, Intermediate, Advanced,
              Practice, and Expert. Master modern stacks, architectures, and engineering specializations.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => resetMutation.mutate()}
                  className="h-9 px-3 text-xs font-medium border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl"
                  title="Reset all deleted or modified roadmaps back to original defaults"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1 text-slate-400" />
                  Restore Defaults
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={openCreateModal}
                  className="h-9 px-3.5 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-2xs"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Roadmap
                </Button>
              </>
            )}
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-sky-200/90 text-sky-700 shadow-2xs">
              {roadmaps.length} Roadmaps Available
            </span>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search 59 roadmaps by technology, stack, or topic (e.g. React, Next.js, AI, MERN, Docker)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-white border-slate-200"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Roadmaps Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filteredRoadmaps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">No roadmaps found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try searching for another technology or choose a different category pill above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredRoadmaps.map((item) => (
            <div
              key={item.id}
              className="group rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-md hover:border-sky-300 transition-all flex flex-col overflow-hidden"
            >
              {/* Thumbnail Container (SVG Preview) */}
              <div
                className="relative h-44 bg-slate-900/5 overflow-hidden cursor-pointer border-b border-slate-100 flex items-center justify-center"
                onClick={() => setViewingRoadmap(item)}
              >
                <img
                  src={item.svgPath}
                  alt={item.title}
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Overlay hover effect */}
                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-xs">
                    <Maximize2 className="h-3.5 w-3.5 text-sky-600" />
                    Open Full Roadmap
                  </span>
                </div>

                {/* Category badge */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                    {item.category}
                  </span>
                </div>
              </div>

              {/* Content info */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div className="space-y-1">
                  <h3
                    className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-sky-600 transition-colors cursor-pointer"
                    onClick={() => setViewingRoadmap(item)}
                  >
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                </div>

                {/* Bottom action bar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingRoadmap(item)}
                    className="flex-1 h-7 text-[11px] font-semibold text-slate-700 hover:text-sky-700 hover:bg-sky-50 hover:border-sky-200"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1 text-sky-600" />
                    View Roadmap
                  </Button>

                  <a
                    href={item.svgPath}
                    download={`${item.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-roadmap.svg`}
                    className="h-7 w-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
                    title="Download SVG"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>

                  {/* Admin controls */}
                  {isAdmin && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(item)}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-sky-600 hover:bg-sky-50"
                        title="Edit Roadmap Title & Details"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setRoadmapToDelete(item)}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Delete Roadmap (Admin)"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: FULLSCREEN / DETAILED ROADMAP VIEWER */}
      {viewingRoadmap && (
        <Dialog open={!!viewingRoadmap} onOpenChange={(open) => !open && setViewingRoadmap(null)}>
          <DialogHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">
                  {viewingRoadmap.category} • 2026 Edition
                </span>
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                  {viewingRoadmap.title} Roadmap
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">{viewingRoadmap.description}</DialogDescription>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={viewingRoadmap.svgPath}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  Open in New Tab
                </a>
                <a
                  href={viewingRoadmap.svgPath}
                  download={`${viewingRoadmap.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-roadmap.svg`}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download SVG
                </a>
              </div>
            </div>
          </DialogHeader>

          {/* SVG Viewer Content */}
          <div className="py-2 max-h-[75vh] overflow-auto rounded-xl bg-slate-50 p-2 border border-slate-200/80 flex justify-center">
            <img
              src={viewingRoadmap.svgPath}
              alt={viewingRoadmap.title}
              className="w-full max-w-4xl h-auto object-contain rounded-lg shadow-xs"
            />
          </div>

          <DialogFooter className="border-t border-slate-100 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewingRoadmap(null)}
              className="text-xs h-8"
            >
              Close
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* MODAL 2: ADMIN EDIT / CREATE ROADMAP */}
      <Dialog
        open={!!editingRoadmap || isCreatingNew}
        onOpenChange={(open) => {
          if (!open) {
            setEditingRoadmap(null);
            setIsCreatingNew(false);
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Edit className="h-4 w-4 text-sky-600" />
            {isCreatingNew ? 'Create New Roadmap' : `Edit Roadmap: ${editingRoadmap?.title}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {isCreatingNew
              ? 'Add a new roadmap entry to the platform catalog.'
              : 'Modify the title, category, description, or target SVG path.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-3 py-2 text-xs"
        >
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Roadmap Title *</label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="e.g. Next.js 15 Full Stack"
              className="text-xs h-9"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Category *</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full text-xs h-9 rounded-xl border border-slate-200 bg-white px-3 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                <option value="Core web">Core web</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Databases">Databases</option>
                <option value="Languages and frameworks">Languages and frameworks</option>
                <option value="DevOps and cloud">DevOps and cloud</option>
                <option value="AI engineering">AI engineering</option>
                <option value="Mobile">Mobile</option>
                <option value="Quality and architecture">Quality and architecture</option>
                <option value="Integrations">Integrations</option>
                <option value="Full-stack combinations">Full-stack combinations</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">SVG File Path</label>
              <Input
                value={editSvgPath}
                onChange={(e) => setEditSvgPath(e.target.value)}
                placeholder="/roadmaps/02-frontend/nextjs.svg"
                className="text-xs h-9"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Description *</label>
            <Textarea
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Comprehensive summary of roadmap milestones..."
              className="text-xs"
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingRoadmap(null);
                setIsCreatingNew(false);
              }}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saveMutation.isPending}
              className="h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white font-medium"
            >
              {saveMutation.isPending ? 'Saving...' : isCreatingNew ? 'Create Roadmap' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* MODAL 3: DELETE CONFIRMATION (ADMIN) */}
      <Dialog open={!!roadmapToDelete} onOpenChange={(open) => !open && setRoadmapToDelete(null)}>
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Delete Roadmap (Admin Authority)
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Are you sure you want to remove <strong>"{roadmapToDelete?.title}"</strong>? You can restore original roadmaps
            at any time using the "Restore Defaults" button.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRoadmapToDelete(null)}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={deleteMutation.isPending}
            onClick={() => roadmapToDelete && deleteMutation.mutate(roadmapToDelete.id)}
            className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white font-medium"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
