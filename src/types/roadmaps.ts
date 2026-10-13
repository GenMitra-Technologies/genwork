// src/types/roadmaps.ts

export interface RoadmapItem {
  id: string;
  title: string;
  category: string;
  svgPath: string;
  slug: string;
  description: string;
  created_at?: string;
  updated_at?: string;
  isCustom?: boolean;
}

export interface RoadmapEditInput {
  title: string;
  category: string;
  description: string;
  svgPath?: string;
}
