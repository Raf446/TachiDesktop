import React, { useRef, useState } from 'react';
import {
  Blocks,
  Cpu,
  Download,
  Upload,
  Globe,
  Code2,
  Trash2,
  Activity,
  CheckCircle2,
  GitBranch,
  Sparkles,
  Play,
} from 'lucide-react';
import { StoredExtensionRecord } from '../../types/anime';
import {
  CompileStage,
  compileRepositoryToExtension,
  PRESET_REPOSITORIES,
  PresetRepository,
} from '../../services/repoCompiler';
import { measurePluginPing } from '../../services/pluginRuntime';

interface ExtensionManagerProps {
  extensions: StoredExtensionRecord[];
  activeExtensionId: string;
  onSelectActiveExtension: (id: string) => void;
  onInstallCompiledPlugin: (plugin: StoredExtensionRecord) => Promise<void>;
  onOpenInspectModal: (plugin: StoredExtensionRecord) => void;
  onOpenDomainModal: (plugin: StoredExtensionRecord) => void;
  onDeletePlugin: (id: string) => Promise<void>;
  onUpdatePing: (id: string, pingMs: number) => void;
}

const STAGE_LABELS: Record<CompileStage, string> = {
  idle: 'Ready to transpile Kotlin (.kt) or external JS scraper repository',
  fetching: '1/4 Fetching repository manifest & scraper source...',
  extracting: '2/4 Extracting baseUrl, CSS selectors & video mirror endpoints...',
  compiling: '3/4 Generating standardized TachiDesktop .JS module...',
  saving: '4/4 Writing to AppData/plugins/<id>.js & mounting Blob URL...',
  completed: 'Compiled & mounted in runtime memory successfully!',
  error: 'Failed to compile repository.',
};

export const ExtensionManager: React.FC<ExtensionManagerProps> = ({
  extensions,
  activeExtensionId,
  onSelectActiveExtension,
  onInstallCompiledPlugin,
  onOpenInspectModal,
  onOpenDomainModal,
  onDeletePlugin,
  onUpdatePing,
}) => {
  const [repoUrlInput, setRepoUrlInput] = useState(
    'https://github.com/tachiyomiorg/aniyomi-extensions/tree/master/src/id/otakudesu'
  );
  const [compileStage, setCompileStage] = useState<CompileStage>('idle');
  const [pingingId, setPingingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCompileFromUrl = async (targetUrl?: string) => {
    const urlToCompile = (targetUrl ?? repoUrlInput).trim();
    if (!urlToCompile) return;

    try {
      const compiled = await compileRepositoryToExtension(
        urlToCompile,
        (stage) => setCompileStage(stage)
      );
      setCompileStage('saving');
      await onInstallCompiledPlugin(compiled);
      setCompileStage('completed');
      window.setTimeout(() => setCompileStage('idle'), 3500);
    } catch {
      setCompileStage('error');
    }
  };

  const handleInstallPreset = async (preset: PresetRepository) => {
    setRepoUrlInput(preset.repoUrl);
    await handleCompileFromUrl(preset.repoUrl);
  };

  const handleTestPing = async (ext: StoredExtensionRecord) => {
    setPingingId(ext.id);
    try {
      const ping = await measurePluginPing(ext.baseUrl);
      onUpdatePing(ext.id, ping);
    } finally {
      setPingingId(null);
    }
  };

  const handleExportJs = (ext: StoredExtensionRecord) => {
    const blob = new Blob([ext.generatedJsCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ext.id}.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportLocalJs = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const idFromFile = file.name.replace(/\.js$/i, '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const nameMatch = text.match(/name:\s*["']([^"']+)["']/);
    const baseUrlMatch = text.match(/baseUrl:\s*["']([^"']+)["']/);
    const langMatch = text.match(/lang:\s*["']([^"']+)["']/);

    const record: StoredExtensionRecord = {
      id: idFromFile || 'imported-plugin',
      name: nameMatch?.[1] || idFromFile || 'ImportedPlugin',
      version: '1.0.0-local',
      lang: (langMatch?.[1] as 'id' | 'en' | 'multi') || 'id',
      baseUrl: baseUrlMatch?.[1] || 'https://otakudesu.cloud',
      defaultBaseUrl: baseUrlMatch?.[1] || 'https://otakudesu.cloud',
      sourceRepoUrl: `local://${file.name}`,
      generatedJsCode: text,
      pingMs: 38,
      hasUpdate: false,
      isBuiltin: false,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    await onInstallCompiledPlugin(record);
    e.target.value = '';
  };

  return (
    <div className="h-full overflow-y-auto bg-[#090a0d] px-6 py-5 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Blocks className="w-4 h-4 text-indigo-400" />
            <h1 className="text-base font-bold text-zinc-100 tracking-tight">
              Automated Repo-to-JS Extension Studio
            </h1>
            <span className="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 font-mono text-[10px] text-indigo-300">
              DMCA-Safe Modular Runtime
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Fetch Aniyomi Kotlin (<code className="font-mono text-zinc-300">.kt</code>) or external
            scraper repositories from GitHub, extract CSS selectors & endpoints, and compile them
            into local <code className="font-mono text-zinc-300">AppData/plugins/&lt;id&gt;.js</code>{' '}
            modules.
          </p>
        </div>

        {/* Import Local .JS Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".js"
            onChange={handleImportLocalJs}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 px-3 rounded-md bg-[#14171f] hover:bg-[#1b1f2a] border border-white/[0.08] text-xs font-medium text-zinc-200 flex items-center gap-2 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Import Local .JS File</span>
          </button>
        </div>
      </div>

      {/* 1. Automated GitHub Repo-to-JS Compiler Box */}
      <section className="bg-[#111317] border border-white/[0.07] rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>GitHub Scraper Repository Transpiler</span>
          </div>
          <span className="font-mono text-[11px] text-zinc-500">
            Target Output: ES/IIFE AnimeExtension (.js)
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <GitBranch className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={repoUrlInput}
              onChange={(e) => setRepoUrlInput(e.target.value)}
              placeholder="https://github.com/tachiyomiorg/aniyomi-extensions/tree/master/src/id/..."
              className="w-full h-9 pl-9 pr-3 rounded-md bg-[#090a0d] border border-white/[0.08] font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="button"
            onClick={() => handleCompileFromUrl()}
            disabled={
              compileStage !== 'idle' &&
              compileStage !== 'completed' &&
              compileStage !== 'error'
            }
            className="h-9 px-4 rounded-md bg-[#4f46e5] hover:bg-[#6366f1] text-xs font-semibold text-white flex items-center justify-center gap-2 shrink-0 transition-colors disabled:opacity-60"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Compile & Install .JS</span>
          </button>
        </div>

        {/* Compiler Progress Pipeline Bar */}
        <div className="pt-1 flex items-center justify-between gap-4 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                compileStage === 'completed'
                  ? 'bg-emerald-500'
                  : compileStage === 'idle'
                    ? 'bg-zinc-600'
                    : 'bg-indigo-500 animate-pulse'
              }`}
            />
            <span
              className={
                compileStage === 'completed'
                  ? 'text-emerald-400'
                  : compileStage === 'idle'
                    ? 'text-zinc-500'
                    : 'text-indigo-300'
              }
            >
              {STAGE_LABELS[compileStage]}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[10px] text-zinc-500">
            <span className={compileStage === 'fetching' ? 'text-indigo-300 font-bold' : ''}>
              [Fetch]
            </span>
            <span>→</span>
            <span className={compileStage === 'extracting' ? 'text-indigo-300 font-bold' : ''}>
              [AST/Regex Parse]
            </span>
            <span>→</span>
            <span className={compileStage === 'compiling' ? 'text-indigo-300 font-bold' : ''}>
              [Emit .JS]
            </span>
            <span>→</span>
            <span className={compileStage === 'saving' || compileStage === 'completed' ? 'text-emerald-400 font-bold' : ''}>
              [Mount Blob]
            </span>
          </div>
        </div>
      </section>

      {/* 2. One-Click Preset Repositories */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            One-Click Preset Repositories (Aniyomi / Tachi Compatible)
          </h2>
          <span className="font-mono text-[11px] text-zinc-500">
            Auto-injects Rust CORS & Referer Proxy
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {PRESET_REPOSITORIES.map((preset) => {
            const isInstalled = extensions.some((ext) => ext.id === preset.id);
            return (
              <div
                key={preset.id}
                className="bg-[#14171f] border border-white/[0.07] rounded-lg p-3 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-100">
                      {preset.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.06] font-mono text-[10px] uppercase text-zinc-300">
                      {preset.lang}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-indigo-300 truncate mt-1">
                    {preset.defaultBaseUrl}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1.5 line-clamp-2">
                    {preset.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="font-mono text-[10px] text-emerald-400">
                    ● {preset.defaultPingMs}ms
                  </span>
                  <button
                    type="button"
                    onClick={() => handleInstallPreset(preset)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                      isInstalled
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                  >
                    {isInstalled ? 'Recompile .JS' : 'Compile .JS'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Installed Local .JS Extensions Table */}
      <section className="space-y-3 pb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Installed Local .JS Plugins ({extensions.length})
          </h2>
          <span className="font-mono text-[11px] text-zinc-500">
            Storage: AppData/plugins/*.js
          </span>
        </div>

        <div className="space-y-2.5">
          {extensions.map((ext) => {
            const isActive = ext.id === activeExtensionId;
            const isPinging = pingingId === ext.id;

            return (
              <div
                key={ext.id}
                className={`rounded-lg p-3.5 border transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                  isActive
                    ? 'bg-[#161a24] border-indigo-500/50'
                    : 'bg-[#12151c] border-white/[0.07]'
                }`}
              >
                {/* Left Info */}
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-zinc-100">
                      {ext.name}.js
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.07] font-mono text-[10px] uppercase text-zinc-300">
                      {ext.lang}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-500">
                      v{ext.version}
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/40 font-mono text-[10px] font-semibold text-indigo-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active Default
                      </span>
                    )}
                    {ext.hasUpdate && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 font-mono text-[10px] text-amber-300">
                        Update Available
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-zinc-400">
                    <span>
                      Origin: <strong className="text-zinc-200">{ext.baseUrl}</strong>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400">
                      ● {isPinging ? '...' : `${ext.pingMs}ms`}
                    </span>
                    {ext.extractedRules && (
                      <>
                        <span>•</span>
                        <span className="text-zinc-500 truncate max-w-xs">
                          Selector: {ext.extractedRules.episodeSelector}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => onSelectActiveExtension(ext.id)}
                      className="h-8 px-2.5 rounded bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-xs font-medium text-indigo-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Set Active</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleTestPing(ext)}
                    className="h-8 px-2.5 rounded bg-[#161920] hover:bg-[#1e222d] border border-white/[0.07] font-mono text-xs text-zinc-300 flex items-center gap-1.5 transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ping</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenDomainModal(ext)}
                    className="h-8 px-2.5 rounded bg-[#161920] hover:bg-[#1e222d] border border-white/[0.07] text-xs text-zinc-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Domain Override</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenInspectModal(ext)}
                    className="h-8 px-2.5 rounded bg-[#161920] hover:bg-[#1e222d] border border-white/[0.07] text-xs text-zinc-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Code2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Inspect .JS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportJs(ext)}
                    title="Export .JS File"
                    className="h-8 px-2.5 rounded bg-[#161920] hover:bg-[#1e222d] border border-white/[0.07] text-xs text-zinc-300 flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {extensions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeletePlugin(ext.id)}
                      title="Remove Plugin"
                      className="h-8 px-2.5 rounded bg-[#161920] hover:bg-rose-500/20 border border-white/[0.07] text-zinc-400 hover:text-rose-400 flex items-center transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
