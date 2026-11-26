import React, { useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  Database,
  Plus,
  Download,
  Save,
  Radio,
  FileCode,
  Check,
  Loader2,
  Users,
  Sun,
  Moon,
  Cpu,
} from 'lucide-react';
import { useStoryStore } from '../../store/useStoryStore.ts';
import { useTranslation } from '../../i18n/index.ts';
import { LanguageSelector } from './LanguageSelector.tsx';

interface TopNavBarProps {
  onOpenAudit: () => void;
  onOpenMcp: () => void;
  onOpenVariables: () => void;
  onOpenCharacters: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  onOpenAudit,
  onOpenMcp,
  onOpenVariables,
  onOpenCharacters,
}) => {
  const { t } = useTranslation();
  const manifest = useStoryStore((s) => s.manifest);
  const auditReport = useStoryStore((s) => s.auditReport);
  const wsConnected = useStoryStore((s) => s.wsConnected);
  const isSaving = useStoryStore((s) => s.isSaving);
  const isExporting = useStoryStore((s) => s.isExporting);
  const theme = useStoryStore((s) => s.theme);
  const toggleTheme = useStoryStore((s) => s.toggleTheme);
  const saveProject = useStoryStore((s) => s.saveProject);
  const exportBundle = useStoryStore((s) => s.exportBundle);
  const createScene = useStoryStore((s) => s.createScene);

  const [exportSuccessPath, setExportSuccessPath] = useState<string | null>(null);

  const isDark = theme === 'dark';

  const handleExport = async () => {
    try {
      const result = await exportBundle('generic');
      setExportSuccessPath(result.zip_path);
      setTimeout(() => setExportSuccessPath(null), 8000);
    } catch (err: any) {
      alert(`${t.nav.exportError} ${err.message}`);
    }
  };

  const handleQuickAddScene = () => {
    createScene();
  };

  const maturityScore = auditReport?.maturity_score ?? 100;
  const errorCount = auditReport?.errors_count ?? 0;

  return (
    <header
      className={`h-14 px-4 flex items-center justify-between shrink-0 select-none z-30 transition-colors duration-200 border-b ${
        isDark
          ? 'bg-[#141417] border-[#26262b] text-zinc-100'
          : 'bg-white border-slate-200 text-slate-800 shadow-sm'
      }`}
    >
      {/* Brand & Project Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl overflow-hidden shadow-md border flex items-center justify-center shrink-0 transition-transform ${
              isDark
                ? 'border-yellow-400/40 shadow-yellow-500/10 bg-black'
                : 'border-rose-300 shadow-rose-500/15 bg-white'
            }`}
          >
            <img
              src={isDark ? '/logo-dark.jpg' : '/logo-light.jpg'}
              alt="Narrative Engine"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs tracking-wider uppercase font-mono">
                Narrative Engine
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold border tracking-tight ${
                  isDark
                    ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'
                    : 'bg-rose-50 text-rose-600 border-rose-200'
                }`}
              >
                MCP v1
              </span>
            </div>
            <p
              className={`text-[10px] font-medium tracking-wide select-none ${
                isDark ? 'text-zinc-400' : 'text-slate-500'
              }`}
            >
              {t.nav.brandSubtitle}
            </p>
          </div>
        </div>

        {/* Project Title Pill */}
        <div
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border ${
            isDark
              ? 'bg-[#18181c] text-zinc-300 border-[#28282d]'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
          title="Project"
        >
          <span className="opacity-50">{t.nav.storyPillLabel}</span>
          <span className="font-bold truncate max-w-[200px]">
            {manifest?.meta.title || t.nav.newStoryDefault}
          </span>
        </div>

        {/* Live sync status badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
            wsConnected
              ? isDark
                ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
                : 'bg-rose-50 text-rose-600 border-rose-200'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
          }`}
          title={wsConnected ? t.nav.liveSyncTooltip : t.nav.offlineTooltip}
        >
          <Radio className={`w-3 h-3 ${wsConnected ? 'animate-pulse' : 'text-zinc-500'}`} />
          <span>{wsConnected ? t.nav.liveSync : t.nav.offline}</span>
        </div>
      </div>

      {/* Center Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleQuickAddScene}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
            isDark
              ? 'bg-[#1e1e23] hover:bg-[#28282e] text-zinc-200 border-[#2e2e34]'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <Plus className={`w-3.5 h-3.5 ${isDark ? 'text-[#facc15]' : 'text-[#e11d48]'}`} />
          <span>{t.nav.addScene}</span>
        </button>

        <button
          onClick={onOpenCharacters}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
            isDark
              ? 'bg-[#1e1e23] hover:bg-[#28282e] text-zinc-200 border-[#2e2e34]'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <Users className={`w-3.5 h-3.5 ${isDark ? 'text-[#facc15]' : 'text-[#e11d48]'}`} />
          <span>{t.nav.characters} ({Object.keys(manifest?.meta.characters || {}).length})</span>
        </button>

        <button
          onClick={onOpenVariables}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
            isDark
              ? 'bg-[#1e1e23] hover:bg-[#28282e] text-zinc-200 border-[#2e2e34]'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <Database className={`w-3.5 h-3.5 ${isDark ? 'text-[#facc15]' : 'text-[#e11d48]'}`} />
          <span>{t.nav.variables} ({Object.keys(manifest?.meta.global_variables || {}).length})</span>
        </button>

        <button
          onClick={onOpenMcp}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border shadow-sm ${
            isDark
              ? 'bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border-yellow-400/30'
              : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
          }`}
          title={t.nav.mcpTooltip}
        >
          <Cpu className={`w-3.5 h-3.5 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
          <span>{t.nav.mcp}</span>
        </button>
      </div>

      {/* Right Actions: Audit, Language Selector, Theme Switcher, Save & Export */}
      <div className="flex items-center gap-2">
        {/* Audit Pill */}
        <button
          onClick={onOpenAudit}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
            isDark
              ? 'bg-[#1e1e23] hover:bg-[#28282e] text-yellow-400 border-yellow-400/30'
              : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
          }`}
          title={t.nav.auditTooltip}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{t.nav.audit} {maturityScore}%</span>
          {errorCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
              {errorCount}
            </span>
          )}
        </button>

        {/* Language Selector Dropdown */}
        <LanguageSelector isDark={isDark} />

        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg border transition ${
            isDark
              ? 'bg-[#1e1e23] hover:bg-[#28282e] text-yellow-400 border-[#2e2e34]'
              : 'bg-slate-50 hover:bg-slate-100 text-rose-600 border-slate-200'
          }`}
          title={isDark ? t.nav.themeLightTooltip : t.nav.themeDarkTooltip}
        >
          {isDark ? <Sun className="w-4 h-4 fill-yellow-400/20" /> : <Moon className="w-4 h-4 fill-rose-600/20" />}
        </button>

        {/* Save */}
        <button
          onClick={() => saveProject()}
          disabled={isSaving}
          className={`p-2 rounded-lg transition border ${
            isDark
              ? 'bg-[#1e1e23] hover:bg-[#28282e] text-zinc-300 border-[#2e2e34]'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
          title={t.nav.saveProject}
        >
          {isSaving ? (
            <Loader2 className={`w-4 h-4 animate-spin ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
          ) : (
            <Save className="w-4 h-4" />
          )}
        </button>

        {/* Export for Agent (High Impact Contrast Button) */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-lg disabled:opacity-50 ${
            isDark
              ? 'bg-[#facc15] hover:bg-[#eab308] text-black shadow-yellow-500/20'
              : 'bg-[#e11d48] hover:bg-[#be123c] text-white shadow-rose-500/25'
          }`}
        >
          {isExporting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{t.nav.exporting}</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>{t.nav.exportAgent}</span>
            </>
          )}
        </button>
      </div>

      {/* Export Success Notification Banner */}
      {exportSuccessPath && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 ${
            isDark
              ? 'bg-[#18181b]/95 border-yellow-400/40 text-yellow-300'
              : 'bg-white/95 border-rose-300 text-slate-900 shadow-slate-200'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              isDark ? 'bg-yellow-400/20 text-yellow-400' : 'bg-rose-100 text-rose-600'
            }`}
          >
            <Check className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <span className="font-bold block">{t.nav.exportSuccessTitle}</span>
            <span className="font-mono text-[11px] block max-w-sm truncate opacity-80">
              {exportSuccessPath}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
