import React, { useEffect, useState } from 'react';
import { Globe, X, Check, RotateCcw, Activity } from 'lucide-react';
import { StoredExtensionRecord } from '../../types/anime';
import { measurePluginPing } from '../../services/pluginRuntime';

interface DomainOverrideModalProps {
  extension: StoredExtensionRecord | null;
  onClose: () => void;
  onApplyOverride: (id: string, newBaseUrl: string, newPingMs?: number) => Promise<void>;
}

export const DomainOverrideModal: React.FC<DomainOverrideModalProps> = ({
  extension,
  onClose,
  onApplyOverride,
}) => {
  const [baseUrlInput, setBaseUrlInput] = useState('');
  const [testedPing, setTestedPing] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (extension) {
      setBaseUrlInput(extension.baseUrl);
      setTestedPing(extension.pingMs);
    }
  }, [extension]);

  if (!extension) return null;

  const handleTestPing = async () => {
    if (!baseUrlInput.trim()) return;
    setIsTesting(true);
    try {
      const ms = await measurePluginPing(baseUrlInput.trim());
      setTestedPing(ms);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseUrlInput.trim()) return;
    setIsSaving(true);
    try {
      await onApplyOverride(
        extension.id,
        baseUrlInput.trim(),
        testedPing || extension.pingMs
      );
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#14171e]/95 backdrop-blur-xl border border-white/[0.09] rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between bg-[#111317]">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-semibold text-zinc-100">
              Domain Override (ISP Unblock) • {extension.name}.js
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            If your ISP blocks the primary domain for{' '}
            <span className="text-zinc-200 font-mono">{extension.name}.js</span>, override{' '}
            <code className="text-indigo-300 font-mono">baseUrl</code> below. TachiDesktop
            automatically updates the local <code className="font-mono">.js</code> file and
            spoofs the matching <code className="font-mono">Referer</code> &{' '}
            <code className="font-mono">Origin</code> headers in Rust.
          </p>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Target Mirror Base URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                required
                value={baseUrlInput}
                onChange={(e) => setBaseUrlInput(e.target.value)}
                placeholder="https://otakudesu.cloud"
                className="flex-1 h-9 px-3 rounded bg-[#090a0d] border border-white/[0.08] font-mono text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleTestPing}
                disabled={isTesting}
                className="h-9 px-3 rounded bg-[#161920] hover:bg-[#1e222b] border border-white/[0.07] font-mono text-xs text-zinc-200 flex items-center gap-1.5 shrink-0"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isTesting ? 'Pinging...' : `${testedPing ?? 42}ms`}</span>
              </button>
            </div>
          </div>

          {/* Quick Mirror TLD Suggestions */}
          <div className="space-y-1">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Quick Mirror Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['.cloud', '.cam', '.email', '.to', '.red', '.tv'].map((tld) => {
                const prefix = extension.defaultBaseUrl.replace(/\.[a-z]+$/i, '');
                const candidate = `${prefix}${tld}`;
                return (
                  <button
                    key={tld}
                    type="button"
                    onClick={() => setBaseUrlInput(candidate)}
                    className="px-2 py-1 rounded bg-[#111317] hover:bg-indigo-600/20 border border-white/[0.07] hover:border-indigo-500/40 font-mono text-[11px] text-zinc-300 transition-colors"
                  >
                    {candidate}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.07] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setBaseUrlInput(extension.defaultBaseUrl)}
              className="h-8 px-2.5 rounded text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3 rounded bg-[#161920] border border-white/[0.07] text-xs text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="h-8 px-3.5 rounded bg-[#4f46e5] hover:bg-[#6366f1] text-xs font-semibold text-white flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Applying...' : 'Apply BaseURL'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
