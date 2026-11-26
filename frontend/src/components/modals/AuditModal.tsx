import React from 'react';
import { X, AlertTriangle, CheckCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { useStoryStore } from '../../store/useStoryStore.ts';
import { useTranslation } from '../../i18n/index.ts';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const auditReport = useStoryStore((s) => s.auditReport);
  const setSelectedNodeId = useStoryStore((s) => s.setSelectedNodeId);
  const theme = useStoryStore((s) => s.theme);

  if (!isOpen || !auditReport) return null;

  const isDark = theme === 'dark';
  const { is_valid, maturity_score, errors_count, warnings_count, issues } = auditReport;

  const getScoreColor = (score: number) => {
    if (score >= 85) {
      return isDark
        ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
        : 'text-rose-600 border-rose-500/30 bg-rose-50';
    }
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-2xl border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors ${
          isDark
            ? 'bg-[#18181b] border-[#2c2c32] text-zinc-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ShieldAlert className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
            <h2 className="text-base font-bold">{t.auditModal.modalTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition ${
              isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-[#26262b]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Maturity Score Banner */}
        <div
          className={`p-5 border-b flex items-center justify-between ${
            isDark ? 'bg-[#141417] border-[#28282d]' : 'bg-slate-50/50 border-slate-200'
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider font-semibold opacity-70">
              {t.auditModal.maturityScoreLabel}
            </span>
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-extrabold px-3 py-1 rounded-xl border ${getScoreColor(maturity_score)}`}>
                {maturity_score}%
              </span>
              <p className="text-xs max-w-sm opacity-80">
                {is_valid ? t.auditModal.readyForExport : t.auditModal.hasErrorsOrDeadEnds}
              </p>
            </div>
          </div>

          <div className="flex gap-4 text-right">
            <div>
              <span className="block text-xl font-bold text-rose-500">{errors_count}</span>
              <span className="text-[11px] opacity-70">{t.auditModal.errorsCountLabel}</span>
            </div>
            <div>
              <span className="block text-xl font-bold text-yellow-500">{warnings_count}</span>
              <span className="text-[11px] opacity-70">{t.auditModal.warningsCountLabel}</span>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {issues.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-semibold text-zinc-200">{t.auditModal.noIssuesFound}</h3>
            </div>
          ) : (
            issues.map((issue, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                  issue.severity === 'error'
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-amber-950/20 border-amber-500/30'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      issue.severity === 'error' ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300">
                        {issue.code}
                      </span>
                      {issue.node_id && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161b22] text-zinc-400 border border-[#30363d]">
                          {issue.node_id}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-200">{issue.message}</p>
                    {issue.suggestion && (
                      <p className="text-[11px] text-zinc-400 italic">
                        💡 {issue.suggestion}
                      </p>
                    )}
                  </div>
                </div>

                {issue.node_id && (
                  <button
                    onClick={() => {
                      setSelectedNodeId(issue.node_id!);
                      onClose();
                    }}
                    className="shrink-0 p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-zinc-300 text-xs flex items-center gap-1 transition"
                    title={t.auditModal.inspectNode}
                  >
                    <span>{t.auditModal.inspectNode}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex justify-end ${
            isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              isDark
                ? 'bg-[#facc15] hover:bg-[#eab308] text-black shadow-yellow-500/20'
                : 'bg-[#e11d48] hover:bg-[#be123c] text-white shadow-rose-500/20'
            }`}
          >
            {t.auditModal.modalTitle}
          </button>
        </div>
      </div>
    </div>
  );
};
