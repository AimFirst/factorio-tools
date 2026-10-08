import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface ToolDefinition {
  id: string;
  name: string;
  category: 'logistics' | 'production' | 'blueprints' | 'calculators';
  description: string;
  icon: LucideIcon;
  badge?: string;
  component: ComponentType;
}

export type ResourceType = 'item' | 'fluid';

export type QualityLevel = 'normal' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type BeltType = 'transport' | 'fast' | 'express' | 'turbo';

export interface BeltSpec {
  name: string;
  speedItemsPerSec: number;
  color: string;
}

export const BELT_SPECS: Record<BeltType, BeltSpec> = {
  transport: { name: 'Yellow (Transport)', speedItemsPerSec: 15, color: '#f59e0b' },
  fast: { name: 'Red (Fast)', speedItemsPerSec: 30, color: '#ef4444' },
  express: { name: 'Blue (Express)', speedItemsPerSec: 45, color: '#3b82f6' },
  turbo: { name: 'Green (Turbo - Space Age)', speedItemsPerSec: 60, color: '#10b981' },
};
