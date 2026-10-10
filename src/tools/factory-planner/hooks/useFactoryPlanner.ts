/**
 * React Hook managing the Multi-World Factory Planner State:
 * Active planet, block manipulation, auto-save, and project lifecycle.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  FactoryPlannerProject,
  HexBlock,
  HexCoordinates,
  InterplanetaryRoute,
  RawIngressNode,
  SolidPlanetId,
  SpaceHubNode,
  SpacePlatform,
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
        // Check for shareable URL permalink in hash: #project=<base64>
        if (typeof window !== 'undefined' && window.location.hash.startsWith('#project=')) {
          const encoded = window.location.hash.substring(9);
          try {
            const json = decodeURIComponent(
              Array.prototype.map
                .call(atob(encoded), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const parsed = defaultStorage.importJson(json);
            parsed.id = `factory-shared-${Date.now()}`;
            await defaultStorage.saveProject(parsed);
            if (isMounted) {
              setProject(parsed);
            }
            window.history.replaceState(null, '', window.location.pathname);
            return;
          } catch (e) {
            console.error('Failed to parse project from URL hash', e);
          }
        }

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

    const handlePlannerRefresh = async () => {
      try {
        const loaded = await defaultStorage.getOrCreateInitialProject();
        setProject(loaded);
      } catch (e) {
        console.error('Failed to refresh planner project', e);
      }
    };
    window.addEventListener('planner-refresh', handlePlannerRefresh);

    return () => {
      isMounted = false;
      window.removeEventListener('planner-refresh', handlePlannerRefresh);
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

  // Add or update a block (with automatic shared instance synchronization)
  const upsertBlock = useCallback(
    (planetId: SolidPlanetId, block: HexBlock) => {
      updateProject((prev) => {
        const planet = prev.planets[planetId];
        const existingIdx = planet.blocks.findIndex((b) => b.id === block.id);
        let newBlocks = [...planet.blocks];

        if (existingIdx >= 0) {
          newBlocks[existingIdx] = block;
        } else {
          newBlocks.push(block);
        }

        // If this block belongs to a shared blueprint group, synchronize definition across instances
        if (block.sharedGroupId) {
          newBlocks = newBlocks.map((b) => {
            if (b.sharedGroupId === block.sharedGroupId && b.id !== block.id) {
              return {
                ...b,
                name: block.name,
                iconId: block.iconId,
                blueprintMultiplier: block.blueprintMultiplier,
                color: block.color,
                category: block.category,
                blockType: block.blockType,
                inputs: JSON.parse(JSON.stringify(block.inputs)),
                outputs: JSON.parse(JSON.stringify(block.outputs)),
                notes: block.notes,
                // Keeps own id and own coordinates!
              };
            }
            return b;
          });
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

  // Duplicate a block as a shared blueprint instance
  const duplicateBlock = useCallback(
    (planetId: SolidPlanetId, blockId: string) => {
      updateProject((prev) => {
        const planet = prev.planets[planetId];
        const sourceBlock = planet.blocks.find((b) => b.id === blockId);
        if (!sourceBlock) return prev;

        const sharedGroupId = sourceBlock.sharedGroupId || `group-${sourceBlock.id}`;
        const updatedSourceBlock = { ...sourceBlock, sharedGroupId };

        const newBlock: HexBlock = {
          ...sourceBlock,
          id: `block-${planetId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          sharedGroupId,
          name: sourceBlock.name,
          coordinates: null, // Placed in unplaced inventory tray
          inputs: JSON.parse(JSON.stringify(sourceBlock.inputs)),
          outputs: JSON.parse(JSON.stringify(sourceBlock.outputs)),
        };

        const newBlocks = planet.blocks.map((b) =>
          b.id === blockId ? updatedSourceBlock : b
        );
        newBlocks.push(newBlock);

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

  // Unlink a block so it becomes unique and independent
  const unlinkBlock = useCallback(
    (planetId: SolidPlanetId, blockId: string) => {
      updateProject((prev) => {
        const planet = prev.planets[planetId];
        return {
          ...prev,
          planets: {
            ...prev.planets,
            [planetId]: {
              ...planet,
              blocks: planet.blocks.map((b) =>
                b.id === blockId ? { ...b, sharedGroupId: undefined } : b
              ),
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

  // Remove raw ingress node
  const removeRawIngress = useCallback(
    (planetId: SolidPlanetId, id: string) => {
      updateProject((prev) => {
        const planet = prev.planets[planetId];
        return {
          ...prev,
          planets: {
            ...prev.planets,
            [planetId]: {
              ...planet,
              rawIngressNodes: planet.rawIngressNodes.filter((n) => n.id !== id),
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

  // Remove space hub node
  const removeSpaceHub = useCallback(
    (planetId: SolidPlanetId, id: string) => {
      updateProject((prev) => {
        const planet = prev.planets[planetId];
        return {
          ...prev,
          planets: {
            ...prev.planets,
            [planetId]: {
              ...planet,
              spaceHubs: planet.spaceHubs.filter((h) => h.id !== id),
            },
          },
        };
      });
    },
    [updateProject]
  );

  // Interplanetary Trade Routes
  const upsertInterplanetaryRoute = useCallback(
    (route: InterplanetaryRoute) => {
      updateProject((prev) => {
        const routes = prev.interplanetaryRoutes || [];
        const existingIdx = routes.findIndex((r) => r.id === route.id);
        const newRoutes = [...routes];
        if (existingIdx >= 0) {
          newRoutes[existingIdx] = route;
        } else {
          newRoutes.push(route);
        }
        return {
          ...prev,
          interplanetaryRoutes: newRoutes,
        };
      });
    },
    [updateProject]
  );

  const removeInterplanetaryRoute = useCallback(
    (routeId: string) => {
      updateProject((prev) => {
        const routes = prev.interplanetaryRoutes || [];
        return {
          ...prev,
          interplanetaryRoutes: routes.filter((r) => r.id !== routeId),
        };
      });
    },
    [updateProject]
  );

  // Space Platforms
  const upsertSpacePlatform = useCallback(
    (platform: SpacePlatform) => {
      updateProject((prev) => {
        const platforms = prev.spacePlatforms || [];
        const existingIdx = platforms.findIndex((p) => p.id === platform.id);
        const newPlatforms = [...platforms];
        if (existingIdx >= 0) {
          newPlatforms[existingIdx] = platform;
        } else {
          newPlatforms.push(platform);
        }
        return {
          ...prev,
          spacePlatforms: newPlatforms,
        };
      });
    },
    [updateProject]
  );

  const removeSpacePlatform = useCallback(
    (platformId: string) => {
      updateProject((prev) => {
        const platforms = prev.spacePlatforms || [];
        return {
          ...prev,
          spacePlatforms: platforms.filter((p) => p.id !== platformId),
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

  // Project Lifecycle Operations
  const selectProject = useCallback(
    async (projectId: string) => {
      const loaded = await defaultStorage.loadProject(projectId);
      if (loaded) {
        setProject(loaded);
        setActivePlanet('nauvis');
      }
    },
    []
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      await defaultStorage.deleteProject(projectId);
      if (project?.id === projectId) {
        const next = await defaultStorage.getOrCreateInitialProject();
        setProject(next);
        setActivePlanet('nauvis');
      }
    },
    [project]
  );

  const duplicateProject = useCallback(
    async () => {
      if (!project) return;
      const clone: FactoryPlannerProject = {
        ...JSON.parse(JSON.stringify(project)),
        id: `factory-clone-${Date.now()}`,
        name: `${project.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await defaultStorage.saveProject(clone);
      setProject(clone);
    },
    [project]
  );

  const renameProject = useCallback(
    (newName: string) => {
      updateProject((prev) => ({
        ...prev,
        name: newName,
      }));
    },
    [updateProject]
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
    duplicateBlock,
    unlinkBlock,
    removeBlock,
    moveBlock,
    upsertRawIngress,
    removeRawIngress,
    upsertSpaceHub,
    removeSpaceHub,
    upsertInterplanetaryRoute,
    removeInterplanetaryRoute,
    upsertSpacePlatform,
    removeSpacePlatform,
    createNewProject,
    selectProject,
    deleteProject,
    duplicateProject,
    renameProject,
    exportProjectJson,
    importProjectJson,
    updateProject,
  };
}
