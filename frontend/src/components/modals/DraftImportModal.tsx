import React, { useState } from 'react';
import { X, Sparkles, FileText, Loader2 } from 'lucide-react';
import { useStoryStore } from '../../store/useStoryStore.ts';
import { useTranslation } from '../../i18n/index.ts';

interface DraftImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DraftImportModal: React.FC<DraftImportModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const importDraft = useStoryStore((s) => s.importDraft);
  const theme = useStoryStore((s) => s.theme);
  const [rawText, setRawText] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;
  const isDark = theme === 'dark';

  const handleImport = async () => {
    if (!rawText.trim()) {
      setError(t.draftImportModal.emptyTextError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await importDraft(rawText, projectTitle.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || t.draftImportModal.importError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-2xl border rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors ${
          isDark
            ? 'bg-[#18181b] border-[#2c2c32] text-zinc-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
            <div>
              <h2 className="text-base font-bold">
                {t.draftImportModal.modalTitle}
              </h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {t.draftImportModal.modalSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition ${
              isDark
                ? 'text-zinc-400 hover:text-zinc-200 hover:bg-[#26262b]'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              {t.draftImportModal.titleLabel}
            </label>
            <input
              type="text"
              placeholder={t.draftImportModal.titlePlaceholder}
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none transition ${
                isDark
                  ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                <FileText className={`w-3.5 h-3.5 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} /> {t.draftImportModal.textLabel}
              </label>
              <span className={`text-[11px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                {rawText.length.toLocaleString()} symbols
              </span>
            </div>
            <textarea
              placeholder={t.draftImportModal.textPlaceholder}
              rows={12}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className={`w-full text-xs p-3 rounded-xl border font-mono leading-relaxed focus:outline-none resize-none transition ${
                isDark
                  ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500'
              }`}
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between ${
            isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
            MCP: <code className={isDark ? 'text-yellow-400 font-mono' : 'text-rose-600 font-mono'}>narrative_import_draft</code>
          </span>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                isDark
                  ? 'bg-[#222226] hover:bg-[#2c2c32] text-zinc-300'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              {t.draftImportModal.cancelBtn}
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition disabled:opacity-50 ${
                isDark
                  ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-yellow-400/20'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {t.draftImportModal.importingBtn}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> {t.draftImportModal.importBtn}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
