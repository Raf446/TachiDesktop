import React, { useEffect, useState } from 'react';
import { Code2, X, Save, RotateCcw, Zap, CheckCircle2 } from 'lucide-react';
import { StoredExtensionRecord } from '../../types/anime';

interface JsCodeInspectorModalProps {
  extension: StoredExtensionRecord | null;
  onClose: () => void;
  onSaveAndHotReload: (updated: StoredExtensionRecord) => Promise<void>;
}

export const JsCodeInspectorModal: React.FC<JsCodeInspectorModalProps> = ({
  extension,
  onClose,
  onSaveAndHotReload,
}) => {
  const [code, setCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (extension) {
      setCode(extension.generatedJsCode);
      setStatusMessage(null);
    }
  }, [extension]);

  if (!extension) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated: StoredExtensionRecord = {
        ...extension,
        generatedJsCode: code,
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      await onSaveAndHotReload(updated);
      setStatusMessage('Plugin saved to AppData/plugins/' + extension.id + '.js & hot-reloaded in Blob sandbox.');
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
        className="w-full max-w-4xl bg-[#14171e]/95 backdrop-blur-xl border border-white/[0.09] rounded-lg shadow-2xl flex flex-col max-h-[86vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between bg-[#111317]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold text-zinc-100 font-mono">
                  AppData/plugins/{extension.id}.js
                </h2>
                <span className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.07] font-mono text-[10px] text-zinc-400">
                  v{extension.version}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Inspect or modify compiled AnimeExtension JavaScript module
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metadata Strip */}
        <div className="px-4 py-2 bg-[#090a0d] border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-zinc-400">
          <div className="flex items-center gap-4">
            <span>
              Base URL: <strong className="text-indigo-300">{extension.baseUrl}</strong>
            </span>
            <span>
              Bridge: <strong className="text-emerald-400">window.__TACHI_BRIDGE__.proxyFetch</strong>
            </span>
          </div>
          <span>Lines: {code.split('\n').length}</span>
        </div>

        {/* Monospace Code Editor */}
        <div className="flex-1 min-h-[360px] bg-[#090a0d] relative flex">
          <textarea
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setStatusMessage(null);
            }}
            spellCheck={false}
            className="w-full h-full min-h-[380px] p-4 bg-[#090a0d] text-zinc-200 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-indigo-500/30"
          />
        </div>

        {/* Status & Actions Footer */}
        <div className="px-4 py-3 bg-[#111317] border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            {statusMessage ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {statusMessage}
              </span>
            ) : (
              <span className="text-zinc-500 font-mono text-[11px]">
                Executes in isolated Blob URL module sandbox
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCode(extension.generatedJsCode)}
              className="h-8 px-3 rounded bg-[#161920] hover:bg-[#1d212a] border border-white/[0.07] text-xs text-zinc-300 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Revert</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 px-3.5 rounded bg-[#4f46e5] hover:bg-[#6366f1] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Reloading...' : 'Save & Hot-Reload .JS'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
