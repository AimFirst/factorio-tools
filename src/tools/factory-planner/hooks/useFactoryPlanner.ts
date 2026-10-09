/**
 * React Hook managing the Multi-World Factory Planner State:
 * Active planet, block manipulation, auto-save, and project lifecycle.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  FactoryPlannerProject,
  HexBlock,
  HexCoordinates,
  RawIngressNode,
  SolidPlanetId,
  SpaceHubNode,
} from '../types.ts';
import { defaultStorage } from '../storage/LocalStorageAdapter.ts';
import { createDefaultProject } from '../storage/starterProject.ts';

export function useFactoryPlanner() {
  const [project, setProject] = useState<FactoryPlannerProject | null>(null);
  const [activePlanet, setActivePlanet] = useState<SolidPlanetId>('nauvis');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize on mount
  useEffect(() => {
    let isMounted = true;
    async function init() {
      setIsLoading(true);
      try {
        const loaded = await defaultStorage.getOrCreateInitialProject();
        if (isMounted) {
          setProject(loaded);
        }
      } catch (err) {
        console.error('Failed to load initial project', err);
        if (isMounted) {
          setProject(createDefaultProject());
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced auto-save whenever project changes
  const autoSave = useCallback((updatedProject: FactoryPlannerProject) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await defaultStorage.saveProject(updatedProject);
      } catch (e) {
        console.error('Auto-save failed', e);
      } finally {
        setIsSaving(false);
      }
    }, 600);
  }, []);

  // Update whole project and trigger autoSave
  const updateProject = useCallback(
    (updater: (prev: FactoryPlannerProject) => FactoryPlannerProject) => {
      setProject((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        autoSave(next);
        return next;
      });
    },
    [autoSave]
  );

  // Add or update a block
  const upsertBlock = useCallback(
    (planetId: SolidPlanetId, block: HexBlock) => {
      updateProject((prev) => {
        const planet = prev.planets[planetId];
        const existingIdx = planet.blocks.findIndex((b) => b.id === block.id);
        const newBlocks = [...planet.blocks];
        if (existingIdx >= 0) {
          newBlocks[existingIdx] = block;
        } else {
          newBlocks.push(block);
        }

        return {
          ...prev,
          planets: {
            ...prev.planets,
            [planetId]: {
              ...planet,
              blocks: newBlocks,
            },
          },
        };
      });
    },
    [updateProject]
  );

  // Remove a block
  const removeBlock = useCallback(
    (planetId: SolidPlanetId, blockId: string) => {
      updateProject((prev) => {
        const planet = prev.planets[planetId];
        return {
          ...prev,
          planets: {
            ...prev.planets,
            [planetId]: {
              ...planet,
              blocks: planet.blocks.filter((b) => b.id !== blockId),
            },
          },
        };
      });
    },
    [updateProject]
  );

  // Move a block on the hex grid
  const moveBlock = useCallback(
    (planetId: SolidPlanetId, blockId: string, coordinates: HexCoordinates | null) => {
      updateProject((prev) => {
        const planet = prev.planets[planetId];
        return {
          ...prev,
          planets: {
            ...prev.planets,
            [planetId]: {
              ...planet,
              blocks: planet.blocks.map((b) =>
                b.id === blockId ? { ...b, coordinates } : b
              ),
            },
          },
        };
      });
    },
    [updateProject]
  );

  // Ingress nodes
  const upsertRawIngress = useCallback(
    (planetId: SolidPlanetId, node: RawIngressNode) => {
      updateProject((prev) => {
        const planet = prev.planets[planetId];
        const existingIdx = planet.rawIngressNodes.findIndex((n) => n.id === node.id);
        const newNodes = [...planet.rawIngressNodes];
        if (existingIdx >= 0) {
          newNodes[existingIdx] = node;
        } else {
          newNodes.push(node);
        }
        return {
          ...prev,
          planets: {
            ...prev.planets,
            [planetId]: {
              ...planet,
              rawIngressNodes: newNodes,
            },
          },
        };
      });
    },
    [updateProject]
  );

  // Space Hub nodes (Rocket Silos & Landing Pads)
  const upsertSpaceHub = useCallback(
    (planetId: SolidPlanetId, hub: SpaceHubNode) => {
      updateProject((prev) => {
        const planet = prev.planets[planetId];
        const existingIdx = planet.spaceHubs.findIndex((h) => h.id === hub.id);
        const newHubs = [...planet.spaceHubs];
        if (existingIdx >= 0) {
          newHubs[existingIdx] = hub;
        } else {
          newHubs.push(hub);
        }
        return {
          ...prev,
          planets: {
            ...prev.planets,
            [planetId]: {
              ...planet,
              spaceHubs: newHubs,
            },
          },
        };
      });
    },
    [updateProject]
  );

  // Create new project
  const createNewProject = useCallback(
    async (name: string = 'New Factorio Factory') => {
      const newProj = createDefaultProject(name);
      newProj.id = `factory-${Date.now()}`;
      await defaultStorage.saveProject(newProj);
      setProject(newProj);
      setActivePlanet('nauvis');
    },
    []
  );

  // Export JSON
  const exportProjectJson = useCallback(() => {
    if (!project) return '';
    return defaultStorage.exportJson(project);
  }, [project]);

  // Import JSON
  const importProjectJson = useCallback(
    async (json: string) => {
      const parsed = defaultStorage.importJson(json);
      await defaultStorage.saveProject(parsed);
      setProject(parsed);
      setActivePlanet('nauvis');
      return parsed;
    },
    []
  );

  return {
    project,
    activePlanet,
    activePlanetState: project?.planets[activePlanet] ?? null,
    setActivePlanet,
    isLoading,
    isSaving,
    upsertBlock,
    removeBlock,
    moveBlock,
    upsertRawIngress,
    upsertSpaceHub,
    createNewProject,
    exportProjectJson,
    importProjectJson,
    updateProject,
  };
}
