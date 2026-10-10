/**
 * LocalStorage Implementation of StorageAdapter.
 * Handles persistence, listing projects, JSON export/import, and memory fallbacks.
 */

import type {
  FactoryPlannerProject,
  ProjectMetadata,
  StorageAdapter,
} from '../types.ts';
import { createDefaultProject } from './starterProject.ts';

const STORAGE_KEY_PREFIX = 'factorio_planner_project_';
const INDEX_KEY = 'factorio_planner_project_index';
const ACTIVE_PROJECT_KEY = 'factorio_planner_active_id';

export class LocalStorageAdapter implements StorageAdapter {
  readonly id = 'local-storage';
  readonly name = 'Local Storage (Browser)';

  // In-memory fallback if localStorage is disabled or running in test/SSR
  private memoryStore = new Map<string, string>();

  private isStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const test = '__storage_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private getItem(key: string): string | null {
    if (this.isStorageAvailable()) {
      return window.localStorage.getItem(key);
    }
    return this.memoryStore.get(key) ?? null;
  }

  private setItem(key: string, value: string): void {
    if (this.isStorageAvailable()) {
      window.localStorage.setItem(key, value);
    } else {
      this.memoryStore.set(key, value);
    }
  }

  private removeItem(key: string): void {
    if (this.isStorageAvailable()) {
      window.localStorage.removeItem(key);
    } else {
      this.memoryStore.delete(key);
    }
  }

  async saveProject(project: FactoryPlannerProject): Promise<void> {
    const updatedProject: FactoryPlannerProject = {
      ...project,
      updatedAt: new Date().toISOString(),
    };

    const serialized = JSON.stringify(updatedProject);
    this.setItem(`${STORAGE_KEY_PREFIX}${updatedProject.id}`, serialized);

    // Update index
    const index = await this.listProjects();
    const existingIdx = index.findIndex((p) => p.id === updatedProject.id);
    const blockCount = Object.values(updatedProject.planets).reduce(
      (sum, p) => sum + p.blocks.length,
      0
    );

    const meta: ProjectMetadata = {
      id: updatedProject.id,
      name: updatedProject.name,
      updatedAt: updatedProject.updatedAt,
      blockCount,
    };

    if (existingIdx >= 0) {
      index[existingIdx] = meta;
    } else {
      index.unshift(meta);
    }

    this.setItem(INDEX_KEY, JSON.stringify(index));
    this.setItem(ACTIVE_PROJECT_KEY, updatedProject.id);
  }

  private normalizeLoadedProject(project: FactoryPlannerProject): FactoryPlannerProject {
    if (!project.interplanetaryRoutes) {
      project.interplanetaryRoutes = [];
    }
    if (!project.spacePlatforms) {
      project.spacePlatforms = [];
    }

    // Migrate rates to ratePerSecond if only ratePerMinute exists
    for (const planet of Object.values(project.planets || {})) {
      for (const block of planet.blocks || []) {
        for (const flow of [...(block.inputs || []), ...(block.outputs || [])]) {
          if (flow.ratePerSecond === undefined) {
            flow.ratePerSecond = flow.ratePerMinute ? Number((flow.ratePerMinute / 60).toFixed(2)) : 0;
          }
        }
      }
      for (const raw of planet.rawIngressNodes || []) {
        if (raw.ratePerSecond === undefined) {
          raw.ratePerSecond = raw.ratePerMinute ? Number((raw.ratePerMinute / 60).toFixed(2)) : 0;
        }
      }
      for (const hub of planet.spaceHubs || []) {
        if (hub.ratePerSecond === undefined) {
          hub.ratePerSecond = hub.ratePerMinute ? Number((hub.ratePerMinute / 60).toFixed(2)) : 0;
        }
      }
    }

    for (const route of project.interplanetaryRoutes || []) {
      if (route.ratePerSecond === undefined) {
        route.ratePerSecond = route.ratePerMinute ? Number((route.ratePerMinute / 60).toFixed(2)) : 0;
      }
    }

    for (const platform of project.spacePlatforms || []) {
      for (const sci of platform.producedScience || []) {
        if (sci.ratePerSecond === undefined) {
          sci.ratePerSecond = sci.ratePerMinute ? Number((sci.ratePerMinute / 60).toFixed(2)) : 0;
        }
      }
    }

    return project;
  }

  async loadProject(id: string): Promise<FactoryPlannerProject | null> {
    const data = this.getItem(`${STORAGE_KEY_PREFIX}${id}`);
    if (!data) {
      return null;
    }
    try {
      const parsed = JSON.parse(data) as FactoryPlannerProject;
      return this.normalizeLoadedProject(parsed);
    } catch (e) {
      console.error(`Failed to parse project ${id}`, e);
      return null;
    }
  }

  async listProjects(): Promise<ProjectMetadata[]> {
    const data = this.getItem(INDEX_KEY);
    if (!data) {
      return [];
    }
    try {
      return JSON.parse(data) as ProjectMetadata[];
    } catch {
      return [];
    }
  }

  async deleteProject(id: string): Promise<void> {
    this.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
    const index = (await this.listProjects()).filter((p) => p.id !== id);
    this.setItem(INDEX_KEY, JSON.stringify(index));
  }

  async getActiveProjectId(): Promise<string | null> {
    return this.getItem(ACTIVE_PROJECT_KEY);
  }

  async getOrCreateInitialProject(): Promise<FactoryPlannerProject> {
    const activeId = await this.getActiveProjectId();
    if (activeId) {
      const activeProject = await this.loadProject(activeId);
      if (activeProject) return activeProject;
    }

    const projects = await this.listProjects();
    if (projects.length > 0) {
      const first = await this.loadProject(projects[0].id);
      if (first) return first;
    }

    // Create and save starter project
    const defaultProject = createDefaultProject();
    await this.saveProject(defaultProject);
    return defaultProject;
  }

  exportJson(project: FactoryPlannerProject): string {
    return JSON.stringify(project, null, 2);
  }

  importJson(json: string): FactoryPlannerProject {
    const parsed = JSON.parse(json) as FactoryPlannerProject;
    if (!parsed.schemaVersion || !parsed.planets) {
      throw new Error('Invalid Factorio Planner Project JSON format.');
    }
    return this.normalizeLoadedProject(parsed);
  }
}

export const defaultStorage = new LocalStorageAdapter();
