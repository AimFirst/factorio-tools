import { Train, Gauge, Globe2 } from 'lucide-react';
import type { ToolDefinition } from '../types';
import { StationAllocator } from './station-allocator/StationAllocator';

export const TOOLS: ToolDefinition[] = [
  {
    id: 'station-allocator',
    name: 'Train Station Allocator',
    category: 'logistics',
    description: 'Optimize dedicated train unloading bays for multi-blueprint city blocks with discrete apportionment math.',
    icon: Train,
    badge: 'Popular',
    component: StationAllocator,
  },
  {
    id: 'belt-throughput',
    name: 'Belt & Pipe Throughput',
    category: 'logistics',
    description: 'Calculate belt saturation, stack inserter handoff limits, and high-pressure fluid pipe flow.',
    icon: Gauge,
    badge: 'Coming Soon',
    component: () => null,
  },
  {
    id: 'space-age-cargo',
    name: 'Space Platform Logistics',
    category: 'production',
    description: 'Plan cargo pod drop rates, interplanetary rocket trips, and platform orbital staging.',
    icon: Globe2,
    badge: 'Coming Soon',
    component: () => null,
  },
];

export function getTools(): ToolDefinition[] {
  return TOOLS;
}

export function getToolById(id: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.id === id);
}
