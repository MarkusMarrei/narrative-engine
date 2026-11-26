import React, { useState } from 'react';
import { X, Plus, Trash2, Database } from 'lucide-react';
import { useStoryStore } from '../../store/useStoryStore.ts';
import { useTranslation } from '../../i18n/index.ts';
import type { VariableType } from '@narrative-engine/shared';

interface VariablesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VariablesModal: React.FC<VariablesModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const manifest = useStoryStore((s) => s.manifest);
  const registerVariable = useStoryStore((s) => s.registerVariable);
  const deleteVariable = useStoryStore((s) => s.deleteVariable);
  const theme = useStoryStore((s) => s.theme);

  const [varName, setVarName] = useState('');
  const [varType, setVarType] = useState<VariableType>('boolean');
  const [varDesc, setVarDesc] = useState('');
  const [varDefault, setVarDefault] = useState('false');

  if (!isOpen || !manifest) return null;
  const isDark = theme === 'dark';

  const variables = Object.values(manifest.meta.global_variables || {});

  const handleAdd = () => {
    if (!varName.trim()) return;

    let parsedVal: any = varDefault;
    if (varType === 'boolean') parsedVal = varDefault === 'true';
    if (varType === 'number') parsedVal = Number(varDefault) || 0;

    registerVariable({
      name: varName.trim().replace(/\s+/g, '_').toLowerCase(),
      type: varType,
      default_value: parsedVal,
      description: varDesc.trim() || undefined,
    });

    setVarName('');
    setVarDesc('');
    setVarDefault(varType === 'boolean' ? 'false' : varType === 'number' ? '0' : '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-xl border rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors ${
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
            <Database className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
            <div>
              <h2 className="text-base font-bold">{t.variablesModal.modalTitle}</h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                {t.variablesModal.modalSubtitle}
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

        {/* Existing Variables List */}
        <div
          className={`p-5 overflow-y-auto max-h-72 space-y-2 border-b ${
            isDark ? 'border-[#28282d]' : 'border-slate-200'
          }`}
        >
          <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            {t.variablesModal.existingVariables} ({variables.length})
          </div>
          {variables.length === 0 ? (
            <div className={`text-xs text-center py-6 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              {t.variablesModal.noVariables}
            </div>
          ) : (
            variables.map((v) => (
              <div
                key={v.name}
                className={`p-3 rounded-xl border flex items-center justify-between transition ${
                  isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-xs font-bold ${isDark ? 'text-yellow-400' : 'text-rose-600'}`}>
                      {v.name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {v.type}
                    </span>
                    <span className={`text-xs font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      = {String(v.default_value)}
                    </span>
                  </div>
                  {v.description && (
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{v.description}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteVariable(v.name)}
                  className={`p-1.5 transition ${
                    isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                  }`}
                  title={t.variablesModal.deleteVariableTooltip}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Variable Form */}
        <div className={`p-5 space-y-3 ${isDark ? 'bg-[#141418]' : 'bg-slate-50/70'}`}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-[11px] block mb-1 font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                {t.variablesModal.nameLabel}
              </label>
              <input
                type="text"
                placeholder={t.variablesModal.namePlaceholder}
                value={varName}
                onChange={(e) => setVarName(e.target.value)}
                className={`w-full text-xs px-2.5 py-1.5 rounded-lg border font-mono focus:outline-none transition ${
                  isDark
                    ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                    : 'bg-white border-slate-200 text-slate-800 focus:border-rose-500'
                }`}
              />
            </div>
            <div>
              <label className={`text-[11px] block mb-1 font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                {t.variablesModal.typeLabel}
              </label>
              <select
                value={varType}
                onChange={(e) => {
                  const tType = e.target.value as VariableType;
                  setVarType(tType);
                  setVarDefault(tType === 'boolean' ? 'false' : tType === 'number' ? '0' : '');
                }}
                className={`w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none transition ${
                  isDark
                    ? 'bg-[#121214] border-[#2c2c32] text-zinc-200 focus:border-yellow-400'
                    : 'bg-white border-slate-200 text-slate-800 focus:border-rose-500'
                }`}
              >
                <option value="boolean">{t.variablesModal.types.boolean}</option>
                <option value="number">{t.variablesModal.types.number}</option>
                <option value="string">{t.variablesModal.types.string}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-[11px] block mb-1 font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                {t.variablesModal.defaultValueLabel}
              </label>
              {varType === 'boolean' ? (
                <select
                  value={varDefault}
                  onChange={(e) => setVarDefault(e.target.value)}
                  className={`w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none transition ${
                    isDark
                      ? 'bg-[#121214] border-[#2c2c32] text-zinc-200 focus:border-yellow-400'
                      : 'bg-white border-slate-200 text-slate-800 focus:border-rose-500'
                  }`}
                >
                  <option value="false">false</option>
                  <option value="true">true</option>
                </select>
              ) : (
                <input
                  type={varType === 'number' ? 'number' : 'text'}
                  placeholder={varType === 'number' ? '0' : 'value'}
                  value={varDefault}
                  onChange={(e) => setVarDefault(e.target.value)}
                  className={`w-full text-xs px-2.5 py-1.5 rounded-lg border font-mono focus:outline-none transition ${
                    isDark
                      ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                      : 'bg-white border-slate-200 text-slate-800 focus:border-rose-500'
                  }`}
                />
              )}
            </div>
            <div>
              <label className={`text-[11px] block mb-1 font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                {t.variablesModal.descLabel}
              </label>
              <input
                type="text"
                placeholder={t.variablesModal.descPlaceholder}
                value={varDesc}
                onChange={(e) => setVarDesc(e.target.value)}
                className={`w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none transition ${
                  isDark
                    ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                    : 'bg-white border-slate-200 text-slate-800 focus:border-rose-500'
                }`}
              />
            </div>
          </div>

          <button
            onClick={handleAdd}
            className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-lg ${
              isDark
                ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-yellow-400/20'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
            }`}
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>{t.variablesModal.addVariableBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
