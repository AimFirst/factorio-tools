import React, { useRef } from 'react';
import { Plus, Download, Upload, RotateCcw, Check, Loader2, Rocket, Mountain } from 'lucide-react';
import type { FactoryPlannerProject, SolidPlanetId } from '../types';

interface ProjectActionsBarProps {
  project: FactoryPlannerProject;
  activePlanet: SolidPlanetId;
  isSaving: boolean;
  onNewBlock: () => void;
  onAddRawIngress: () => void;
  onAddSpaceHub: () => void;
  onExportJson: () => void;
  onImportJson: (json: string) => void;
  onResetStarter: () => void;
}

export const ProjectActionsBar: React.FC<ProjectActionsBarProps> = ({
  project,
  activePlanet,
  isSaving,
  onNewBlock,
  onAddRawIngress,
  onAddSpaceHub,
  onExportJson,
  onImportJson,
  onResetStarter,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          onImportJson(content);
        } catch {
          alert('Failed to parse project JSON file.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-950/90 border border-zinc-800 rounded-xl">
      {/* Left: Project title & save indicator */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <span>{project.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-950/60 border border-orange-800/50 text-orange-400 font-mono">
              Factorio 2.1
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium capitalize">
              {activePlanet}
            </span>
          </h2>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
            {isSaving ? (
              <span className="inline-flex items-center gap-1 text-zinc-400 font-mono text-[11px]">
                <Loader2 className="w-3 h-3 animate-spin text-orange-400" />
                Auto-saving...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                <Check className="w-3 h-3" />
                Saved locally
              </span>
            )}
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-500 text-[11px]">
              Last updated {new Date(project.updatedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* New Block */}
        <button
          type="button"
          onClick={onNewBlock}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-orange-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Block
        </button>

        {/* Add Mining Outpost */}
        <button
          type="button"
          onClick={onAddRawIngress}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 rounded-lg text-xs font-medium transition cursor-pointer"
          title="Add raw ore / fluid perimeter ingress depot"
        >
          <Mountain className="w-3.5 h-3.5 text-amber-400" />
          Add Outpost
        </button>

        {/* Add Rocket Silo */}
        <button
          type="button"
          onClick={onAddSpaceHub}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 rounded-lg text-xs font-medium transition cursor-pointer"
          title="Add Legendary Rocket Silo or Cargo Landing Pad hub"
        >
          <Rocket className="w-3.5 h-3.5 text-purple-400" />
          Add Silo Hub
        </button>

        <div className="h-5 w-px bg-zinc-800 mx-1" />

        {/* Export JSON */}
        <button
          type="button"
          onClick={onExportJson}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg text-xs font-medium transition cursor-pointer"
          title="Export factory project as JSON file"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>

        {/* Import JSON */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg text-xs font-medium transition cursor-pointer"
          title="Import factory project from JSON file"
        >
          <Upload className="w-3.5 h-3.5" />
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Reset */}
        <button
          type="button"
          onClick={() => {
            if (confirm('Reset to starter factory project? Any unsaved edits will be lost.')) {
              onResetStarter();
            }
          }}
          className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
          title="Reset to default starter project"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
