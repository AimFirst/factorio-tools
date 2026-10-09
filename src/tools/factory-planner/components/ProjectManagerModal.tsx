import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FolderKanban,
  Plus,
  Copy,
  Trash2,
  Share2,
  Check,
  Download,
  Upload,
  Sparkles,
  Layers,
  Calendar,
} from 'lucide-react';
import type { FactoryPlannerProject, ProjectMetadata } from '../types';
import { defaultStorage } from '../storage/LocalStorageAdapter';
import { FACTORY_PRESETS } from '../presets/presetLibraries';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: FactoryPlannerProject;
  onSelectProject: (projectId: string) => Promise<void>;
  onCreateNewProject: (name: string) => Promise<void>;
  onLoadPreset: (preset: (typeof FACTORY_PRESETS)[0]) => void;
  onDeleteProject: (projectId: string) => Promise<void>;
  onRenameProject: (newName: string) => void;
  onDuplicateProject: () => void;
  onExportJson: () => void;
  onImportJson: (json: string) => Promise<any>;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onSelectProject,
  onCreateNewProject,
  onLoadPreset,
  onDeleteProject,
  onRenameProject,
  onDuplicateProject,
  onExportJson,
  onImportJson,
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'presets' | 'share'>('projects');
  const [projectList, setProjectList] = useState<ProjectMetadata[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingName, setEditingName] = useState(currentProject.name);
  const [isCopied, setIsCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        try {
          await onImportJson(text);
          onClose();
        } catch {
          alert('Invalid project JSON file.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Load project index on open
  useEffect(() => {
    if (isOpen) {
      defaultStorage.listProjects().then(setProjectList);
      setEditingName(currentProject.name);

      // Generate compact share URL
      try {
        const json = defaultStorage.exportJson(currentProject);
        // Base64 encode safe for UTF-8
        const encoded = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
          String.fromCharCode(parseInt(p1, 16))
        ));
        const url = `${window.location.origin}${window.location.pathname}#project=${encoded}`;
        setShareUrl(url);
      } catch (e) {
        console.error('Failed to encode share URL', e);
      }
    }
  }, [isOpen, currentProject]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    const name = newProjectName.trim() || 'New Factorio Megabase';
    await onCreateNewProject(name);
    setNewProjectName('');
    const list = await defaultStorage.listProjects();
    setProjectList(list);
    onClose();
  };

  const handleSelect = async (id: string) => {
    if (id === currentProject.id) {
      onClose();
      return;
    }
    await onSelectProject(id);
    onClose();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projectList.length <= 1) {
      alert('You cannot delete the only existing project.');
      return;
    }
    if (confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      await onDeleteProject(id);
      const list = await defaultStorage.listProjects();
      setProjectList(list);
    }
  };

  const handleRename = () => {
    if (editingName.trim() && editingName !== currentProject.name) {
      onRenameProject(editingName.trim());
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-950/70 border border-orange-800/60 rounded-xl text-orange-400">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-base">Project Manager & Presets</h3>
              <p className="text-xs text-zinc-400">
                Manage saved megabases, load Factorio 2.1 templates, or generate shareable URLs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-zinc-800/80 bg-zinc-900/40 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`pb-2.5 px-3 font-semibold transition cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'projects'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Saved Megabases ({projectList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`pb-2.5 px-3 font-semibold transition cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            Factory Presets ({FACTORY_PRESETS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`pb-2.5 px-3 font-semibold transition cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'share'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-purple-400" />
            Share URL Permalink
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: SAVED PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              {/* Current Project Renaming */}
              <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
                <label className="block text-xs font-semibold text-zinc-400">
                  Active Project Name
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-100 text-sm focus:outline-none focus:border-orange-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleRename}
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold cursor-pointer transition"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={onDuplicateProject}
                    className="flex items-center gap-1 px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold cursor-pointer transition"
                    title="Duplicate active project"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Clone
                  </button>
                </div>
              </div>

              {/* Create New Project */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New project name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Megabase
                </button>
              </div>

              {/* Projects List */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Saved Local Megabases
                </div>
                <div className="space-y-1.5">
                  {projectList.map((p) => {
                    const isActive = p.id === currentProject.id;
                    const dateFormatted = new Date(p.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelect(p.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                          isActive
                            ? 'bg-orange-950/20 border-orange-600/70 shadow-xs'
                            : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              isActive ? 'bg-orange-500 shadow-xs' : 'bg-zinc-600'
                            }`}
                          />
                          <div>
                            <div className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
                              {p.name}
                              {isActive && (
                                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-orange-950 text-orange-400 border border-orange-800/60">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1 font-mono">
                                <Calendar className="w-3 h-3 text-zinc-600" />
                                {dateFormatted}
                              </span>
                              <span>•</span>
                              <span className="font-mono text-zinc-400">
                                {p.blockCount} blocks
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleDelete(p.id, e)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                            title="Delete megabase"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <div className="text-xs text-zinc-400">
                Choose a pre-configured Factorio 2.1 megabase blueprint. Loading a preset will replace your currently active view.
              </div>

              <div className="space-y-2.5">
                {FACTORY_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-4 bg-zinc-900/60 border border-zinc-800 hover:border-orange-600/50 rounded-xl transition space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-zinc-100 text-sm">
                            {preset.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-950 text-orange-400 border border-zinc-800">
                            {preset.badge}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Load "${preset.name}" preset? Any unsaved edits to the current base should be exported first.`)) {
                            onLoadPreset(preset);
                            onClose();
                          }
                        }}
                        className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 shadow-xs"
                      >
                        Load Preset
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SHARE PERMALINK */}
          {activeTab === 'share' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-950/30 border border-purple-800/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-purple-200">
                  <Share2 className="w-4 h-4 text-purple-400" />
                  Instant Cross-Device Sharing via URL Permalink
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Anyone who opens this link will instantly load a full copy of your multi-world factory blocks, hex coordinates, planetary states, and space logistics routes without requiring an account.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-400">
                  Shareable Permalink
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-xs font-mono focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs shrink-0"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 text-green-300" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-800">
                <span>Backup or transfer manually:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onExportJson}
                    className="flex items-center gap-1 text-zinc-300 hover:text-white cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 text-zinc-300 hover:text-white cursor-pointer ml-3"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import JSON
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500">
            Factorio 2.1 Space Age • Local Storage & Cloud Share Compatible
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
