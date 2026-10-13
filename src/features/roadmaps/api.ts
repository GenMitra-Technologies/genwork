// src/features/roadmaps/api.ts
import { RoadmapItem, RoadmapEditInput } from '../../types/roadmaps';
import initialRoadmapsData from './roadmapsData.json';

const ROADMAPS_STORAGE_KEY = 'genmitra_roadmaps_data_v2';
const ROADMAPS_DELETED_KEY = 'genmitra_roadmaps_deleted_v2';

// Load stored roadmaps
function getStoredRoadmaps(): RoadmapItem[] {
  try {
    const deletedIds: string[] = JSON.parse(localStorage.getItem(ROADMAPS_DELETED_KEY) || '[]');
    const deletedSet = new Set(deletedIds);

    const raw = localStorage.getItem(ROADMAPS_STORAGE_KEY);
    if (raw) {
      const parsed: RoadmapItem[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((item) => !deletedSet.has(item.id))
          .map((item) => ({ ...item, folder: item.folder || 'Web Development' }));
      }
    }

    // First run: fallback to all 59 roadmaps extracted from downloads
    const initialList = (initialRoadmapsData as RoadmapItem[])
      .filter((item) => !deletedSet.has(item.id))
      .map((item) => ({ ...item, folder: item.folder || 'Web Development' }));
    return initialList;
  } catch {
    return (initialRoadmapsData as RoadmapItem[]).map((item) => ({ ...item, folder: item.folder || 'Web Development' }));
  }
}

function saveStoredRoadmaps(items: RoadmapItem[]) {
  try {
    localStorage.setItem(ROADMAPS_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export const roadmapsApi = {
  async getAllRoadmaps(): Promise<RoadmapItem[]> {
    return getStoredRoadmaps();
  },

  async getRoadmapById(id: string): Promise<RoadmapItem | null> {
    const all = getStoredRoadmaps();
    return all.find((r) => r.id === id) || null;
  },

  async updateRoadmap(id: string, updates: RoadmapEditInput): Promise<RoadmapItem> {
    const all = getStoredRoadmaps();
    const idx = all.findIndex((r) => r.id === id);
    if (idx < 0) {
      throw new Error('Roadmap not found');
    }

    const updated: RoadmapItem = {
      ...all[idx],
      title: updates.title.trim(),
      folder: updates.folder ? updates.folder.trim() : all[idx].folder || 'Web Development',
      category: updates.category.trim(),
      description: updates.description.trim(),
      updated_at: new Date().toISOString(),
    };

    if (updates.svgPath) {
      updated.svgPath = updates.svgPath;
    }

    all[idx] = updated;
    saveStoredRoadmaps(all);
    return updated;
  },

  async deleteRoadmap(id: string): Promise<void> {
    const all = getStoredRoadmaps();
    const filtered = all.filter((r) => r.id !== id);
    saveStoredRoadmaps(filtered);

    // Track in deleted list so reset doesn't bring it back
    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem(ROADMAPS_DELETED_KEY) || '[]');
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem(ROADMAPS_DELETED_KEY, JSON.stringify(deletedIds));
      }
    } catch {}
  },

  async createRoadmap(input: RoadmapEditInput): Promise<RoadmapItem> {
    const all = getStoredRoadmaps();
    const id = `custom-roadmap-${Date.now()}`;
    const newItem: RoadmapItem = {
      id,
      title: input.title.trim(),
      folder: input.folder ? input.folder.trim() : 'Web Development',
      category: input.category.trim() || 'Custom',
      description: input.description.trim(),
      svgPath: input.svgPath || '/roadmaps/11-full-stacks/fullstack-master-2026.svg',
      slug: `custom/${id}.svg`,
      isCustom: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    all.unshift(newItem);
    saveStoredRoadmaps(all);
    return newItem;
  },

  async resetToDefaults(): Promise<RoadmapItem[]> {
    try {
      localStorage.removeItem(ROADMAPS_DELETED_KEY);
      localStorage.removeItem(ROADMAPS_STORAGE_KEY);
    } catch {}
    return initialRoadmapsData as RoadmapItem[];
  },
};
