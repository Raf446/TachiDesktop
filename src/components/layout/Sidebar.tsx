import React from 'react';
import {
  Bookmark,
  Compass,
  Clock,
  Blocks,
  Settings,
  Play,
} from 'lucide-react';
import { NavigationTab } from '../../types/anime';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  extensionUpdateCount?: number;
  libraryCount?: number;
  hasActiveSession?: boolean;
  onResumePlayer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  extensionUpdateCount = 2,
  libraryCount = 4,
  hasActiveSession = true,
  onResumePlayer,
}) => {
  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeTone?: 'indigo' | 'amber';
  }[] = [
    {
      id: 'library',
      label: 'Library',
      icon: Bookmark,
      badge: libraryCount,
      badgeTone: 'indigo',
    },
    {
      id: 'browse',
      label: 'Browse',
      icon: Compass,
    },
    {
      id: 'history',
      label: 'History',
      icon: Clock,
    },
    {
      id: 'extensions',
      label: 'Extensions',
      icon: Blocks,
      badge: extensionUpdateCount > 0 ? extensionUpdateCount : undefined,
      badgeTone: 'amber',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-[68px] lg:w-[196px] h-full bg-[#111317] border-r border-white/[0.07] flex flex-col justify-between py-3 px-2 shrink-0 select-none">
      <div className="space-y-1">
        <div className="px-2.5 pb-1.5 hidden lg:flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Workspace
          </span>
          <span className="text-[10px] font-mono text-zinc-600">CLEAN SHELL</span>
        </div>

        <nav className="space-y-0.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full h-9 px-2.5 rounded-md flex items-center justify-center lg:justify-between text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#4f46e5] text-white'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#161920]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-zinc-400'
                    }`}
                  />
                  <span className="hidden lg:inline">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`hidden lg:inline-flex items-center justify-center px-1.5 py-0.2 rounded font-mono text-[10px] ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeTone === 'amber'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-white/[0.05] text-zinc-400 border border-white/[0.06]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Mini Quick-Resume Card */}
      {hasActiveSession && (
        <div className="pt-3 border-t border-white/[0.07]">
          <button
            type="button"
            onClick={onResumePlayer}
            className="w-full p-2 rounded-md bg-[#161920] hover:bg-[#1b1f28] border border-white/[0.07] text-left transition-colors group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-indigo-400 flex items-center gap-1">
                <Play className="w-2.5 h-2.5 fill-indigo-400" />
                <span className="hidden lg:inline">NOW STANDBY</span>
              </span>
              <span className="hidden lg:inline font-mono text-[10px] text-zinc-500">
                EP 14
              </span>
            </div>
            <p className="hidden lg:block text-xs font-medium text-zinc-200 truncate group-hover:text-white">
              Attack on Titan S4
            </p>
            <p className="hidden lg:block font-mono text-[10px] text-zinc-400 mt-0.5">
              18:24 / 24:00 • 75%
            </p>
            <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-indigo-500 w-3/4" />
            </div>
          </button>
        </div>
      )}
    </aside>
  );
};
