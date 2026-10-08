import React, { useState } from 'react';
import { 
  Wrench, 
  CheckCircle2, 
  Terminal
} from 'lucide-react';
import { TOOLS } from '../../tools/registry';
import metadata from '../../data/generated/metadata.json';

interface AppShellProps {
  activeToolId: string;
  onSelectTool: (id: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeToolId,
  onSelectTool,
  children,
}) => {
  const [showSyncInfo, setShowSyncInfo] = useState(false);

  return (
    <div className="min-h-screen bg-[#0d0f13] text-slate-100 flex flex-col font-sans">
      {/* Top Industrial Navigation Bar */}
      <header className="h-14 border-b border-[#262c37] bg-[#12151b] px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
            <Wrench className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-slate-100">
              Factorio <span className="text-amber-500">Tools</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
              Space Age 2.1
            </span>
          </div>
        </div>

        {/* Sync Status Badge & Modal Trigger */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowSyncInfo(!showSyncInfo)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1a1e27] hover:bg-[#222834] border border-[#2d333f] text-xs transition cursor-pointer text-slate-300"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px]">Synced: v{metadata.gameVersion}</span>
              <span className="text-slate-500 text-[10px]">({metadata.totalItems} items)</span>
            </button>

            {/* Sync Popover */}
            {showSyncInfo && (
              <div className="absolute right-0 mt-2 w-80 bg-[#16191f] border border-[#2d333f] rounded-xl shadow-2xl p-4 z-50 text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#2d333f]">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Game Prototype Database
                  </span>
                  <button
                    onClick={() => setShowSyncInfo(false)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Installed Version:</span>
                    <span className="text-amber-400 font-bold">{metadata.gameVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Online Latest:</span>
                    <span>{metadata.latestOnlineExperimental || metadata.latestOnlineStable}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Space Age Expansion:</span>
                    <span className="text-emerald-400">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Items Extracted:</span>
                    <span>{metadata.totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fluids Extracted:</span>
                    <span>{metadata.totalFluids}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quality Multiplier:</span>
                    <span className="text-amber-400">Legendary 2.5x</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#2d333f] text-slate-400 text-[11px]">
                  <p className="mb-1.5 text-slate-300 font-semibold flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-amber-500" />
                    To update anytime:
                  </p>
                  <code className="block bg-[#0e1014] p-1.5 rounded border border-[#262c37] text-amber-300 font-mono text-[11px]">
                    npm run sync-data
                  </code>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout: Sidebar + Workspace */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-[#101217] border-r border-[#262c37] p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block px-2 mb-2 font-mono">
                Logistics & Planning Tools
              </span>
              <nav className="space-y-1">
                {TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = tool.id === activeToolId;
                  const isAvailable = tool.badge !== 'Coming Soon';

                  return (
                    <button
                      key={tool.id}
                      disabled={!isAvailable}
                      onClick={() => isAvailable && onSelectTool(tool.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition flex items-center gap-3 relative group cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                          : isAvailable
                          ? 'text-slate-300 hover:bg-[#1a1e27] hover:text-slate-100 border border-transparent'
                          : 'text-slate-600 border border-transparent cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      <span className="truncate flex-1">{tool.name}</span>

                      {tool.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                            tool.badge === 'Coming Soon'
                              ? 'bg-slate-800 text-slate-500'
                              : 'bg-amber-500/20 text-amber-400 font-semibold'
                          }`}
                        >
                          {tool.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="pt-4 border-t border-[#262c37] text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Factorio 2.1.21
            </div>
            <p className="text-[10px] text-slate-600">
              Designed for dual-screen high-throughput factory design.
            </p>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
