// src/features/roadmaps/RoadmapsPage.tsx
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  BookOpen,
  Edit,
  Trash2,
  Sparkles,
  Download,
  Plus,
  RotateCcw,
  AlertTriangle,
  Folder,
  FolderOpen,
  ArrowLeft,
  ChevronRight,
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

  // Navigation states:
  // selectedFolder: null -> shows Folders list
  // selectedFolder: 'Web Development' -> shows items inside that folder
  // selectedRoadmap: RoadmapItem -> in-tab viewer right here in the page
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapItem | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Admin Modal states
  const [editingRoadmap, setEditingRoadmap] = useState<RoadmapItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [roadmapToDelete, setRoadmapToDelete] = useState<RoadmapItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for edit/create
  const [editTitle, setEditTitle] = useState('');
  const [editFolder, setEditFolder] = useState('Web Development');
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

  // Group by Folders
  const foldersMap = useMemo(() => {
    const map = new Map<string, RoadmapItem[]>();
    roadmaps.forEach((r) => {
      const folderName = r.folder || 'Web Development';
      if (!map.has(folderName)) {
        map.set(folderName, []);
      }
      map.get(folderName)!.push(r);
    });
    return map;
  }, [roadmaps]);

  // Roadmaps inside the selected folder
  const currentFolderRoadmaps = useMemo(() => {
    if (!selectedFolder) return [];
    return foldersMap.get(selectedFolder) || [];
  }, [foldersMap, selectedFolder]);

  // Categories in the selected folder
  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    currentFolderRoadmaps.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set);
  }, [currentFolderRoadmaps]);

  // Filter roadmaps by search and category
  const filteredRoadmaps = useMemo(() => {
    return currentFolderRoadmaps.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [currentFolderRoadmaps, searchQuery, selectedCategory]);

  // Edit / Update Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isCreatingNew) {
        return roadmapsApi.createRoadmap({
          title: editTitle,
          folder: editFolder || 'Web Development',
          category: editCategory,
          description: editDescription,
          svgPath: editSvgPath || '/roadmaps/11-full-stacks/fullstack-master-2026.svg',
        });
      } else if (editingRoadmap) {
        return roadmapsApi.updateRoadmap(editingRoadmap.id, {
          title: editTitle,
          folder: editFolder || 'Web Development',
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
      if (selectedRoadmap && roadmapToDelete && selectedRoadmap.id === roadmapToDelete.id) {
        setSelectedRoadmap(null);
      }
      showToast('Roadmap removed.');
    },
  });

  // Reset to Defaults
  const resetMutation = useMutation({
    mutationFn: () => roadmapsApi.resetToDefaults(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      showToast('All roadmaps restored to defaults.');
    },
  });

  const openEditModal = (item: RoadmapItem) => {
    setEditingRoadmap(item);
    setIsCreatingNew(false);
    setEditTitle(item.title);
    setEditFolder(item.folder || 'Web Development');
    setEditCategory(item.category);
    setEditDescription(item.description);
    setEditSvgPath(item.svgPath);
  };

  const openCreateModal = () => {
    setIsCreatingNew(true);
    setEditingRoadmap(null);
    setEditTitle('');
    setEditFolder(selectedFolder || 'Web Development');
    setEditCategory('Core web');
    setEditDescription('2026 learning milestones roadmap covering Beginner to Expert.');
    setEditSvgPath('/roadmaps/11-full-stacks/fullstack-master-2026.svg');
  };

  return (
    <div className="space-y-4 max-w-[1360px] mx-auto pb-12 px-1 sm:px-2">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-xl bg-slate-900/95 text-white px-4 py-3 text-xs font-semibold shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* VIEW 1: ROOT FOLDERS VIEW (Clean, without big redundant header banner) */}
      {!selectedFolder && !selectedRoadmap && (
        <div className="space-y-4">
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-sky-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Folders</h2>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => resetMutation.mutate()}
                  className="h-8 px-3 text-xs border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
                  title="Reset all roadmaps to original defaults"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1 text-slate-400" />
                  Restore Defaults
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={openCreateModal}
                  className="h-8 px-3 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Roadmap
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from(foldersMap.entries()).map(([folderName, items]) => (
              <div
                key={folderName}
                onClick={() => {
                  setSelectedFolder(folderName);
                  setSelectedCategory('All');
                }}
                className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-md hover:border-sky-400 transition-all cursor-pointer space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Folder className="h-6 w-6 fill-sky-200 text-sky-600" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 group-hover:bg-sky-50 group-hover:text-sky-700 transition-colors">
                    {items.length} Roadmaps
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    {folderName}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    Complete 2026 learning milestones covering Beginner to Expert.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-sky-600 font-semibold">
                  <span>Open Folder</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: INSIDE FOLDER (Compact, clean header with proper padding) */}
      {selectedFolder && !selectedRoadmap && (
        <div className="space-y-4">
          {/* Compact Folder Control Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFolder(null)}
                className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>Folders</span>
              </Button>
              <div className="h-4 w-px bg-slate-200 mx-1" />
              <div className="flex items-center gap-1.5">
                <FolderOpen className="h-4 w-4 text-sky-600" />
                <span className="text-sm font-bold text-slate-900">{selectedFolder}</span>
                <span className="text-xs text-slate-500 font-medium">({filteredRoadmaps.length})</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Search Input */}
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search in folder..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs rounded-xl bg-slate-50/50 border-slate-200"
                />
              </div>

              {isAdmin && (
                <Button
                  type="button"
                  size="sm"
                  onClick={openCreateModal}
                  className="h-8 px-3 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-2xs shrink-0"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none px-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80 shadow-2xs'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
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
                Try searching with different terms or select a different category pill.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredRoadmaps.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-md hover:border-sky-300 transition-all flex flex-col overflow-hidden"
                >
                  {/* Thumbnail / Preview: Click opens in this tab */}
                  <div
                    className="relative h-44 bg-slate-900/5 overflow-hidden cursor-pointer border-b border-slate-100 flex items-center justify-center"
                    onClick={() => setSelectedRoadmap(item)}
                  >
                    <img
                      src={item.svgPath}
                      alt={item.title}
                      className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="px-3 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-xs">
                        <Eye className="h-3.5 w-3.5 text-sky-600" />
                        View in This Tab
                      </span>
                    </div>

                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Information */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <h3
                        className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-sky-600 transition-colors cursor-pointer"
                        onClick={() => setSelectedRoadmap(item)}
                      >
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRoadmap(item)}
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
        </div>
      )}

      {/* VIEW 3: IN-TAB FULL ROADMAP VIEWER (Renders directly in this tab) */}
      {selectedRoadmap && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          {/* Header Controls for in-tab viewer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedRoadmap(null)}
                className="h-8 px-3 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-100"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Back to {selectedFolder || 'Folder'}
              </Button>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">
                  {selectedRoadmap.category} • 2026 Edition
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {selectedRoadmap.title} Roadmap
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={selectedRoadmap.svgPath}
                download={`${selectedRoadmap.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-roadmap.svg`}
                className="h-8 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="h-3.5 w-3.5" />
                Download SVG
              </a>

              {isAdmin && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(selectedRoadmap)}
                    className="h-8 px-2.5 text-xs text-slate-700 hover:text-sky-600 rounded-xl"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRoadmapToDelete(selectedRoadmap)}
                    className="h-8 px-2.5 text-xs text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
            {selectedRoadmap.description}
          </p>

          {/* SVG Render Container directly in tab */}
          <div className="w-full rounded-2xl bg-slate-50/70 border border-slate-200 p-2 sm:p-4 overflow-auto max-h-[85vh] flex justify-center shadow-inner">
            <img
              src={selectedRoadmap.svgPath}
              alt={selectedRoadmap.title}
              className="w-full max-w-4xl h-auto object-contain rounded-xl shadow-xs"
            />
          </div>
        </div>
      )}

      {/* MODAL: ADMIN EDIT / CREATE ROADMAP */}
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
              : 'Modify the title, folder, category, description, or target SVG path.'}
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
              <label className="font-semibold text-slate-700 block">Folder *</label>
              <Input
                value={editFolder}
                onChange={(e) => setEditFolder(e.target.value)}
                placeholder="Web Development"
                className="text-xs h-9"
                required
              />
            </div>

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

      {/* MODAL: DELETE CONFIRMATION (ADMIN) */}
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
