import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  MessageSquare,
  Image as ImageIcon,
  Music,
  Zap,
  Flag,
  AlertTriangle,
  Play,
  ArrowRight,
  Plus,
  Trash2,
  ChevronDown,
  Link2,
  Unlink,
} from 'lucide-react';
import type { StoryNode, StoryAction, Choice, AuditIssue } from '@narrative-engine/shared';
import { useStoryStore } from '../../store/useStoryStore.ts';
import { useTranslation, getLocalizedNodeTitle } from '../../i18n/index.ts';

interface StoryActionNodeProps {
  id: string;
  data: {
    node: StoryNode;
    isStartNode: boolean;
    issues?: AuditIssue[];
    isDark?: boolean;
  };
  selected?: boolean;
}

export const StoryActionNode = memo(({ id, data, selected }: StoryActionNodeProps) => {
  const { node, isStartNode, issues = [], isDark = true } = data;
  const { t } = useTranslation();
  const manifest = useStoryStore((s) => s.manifest);
  const updateNode = useStoryStore((s) => s.updateNode);
  const deleteNode = useStoryStore((s) => s.deleteNode);
  const unlinkChoice = useStoryStore((s) => s.unlinkChoice);
  const setSelectedNodeId = useStoryStore((s) => s.setSelectedNodeId);

  const [isCollapsed, setIsCollapsed] = useState(false);

  const hasErrors = issues.some((i) => i.severity === 'error');
  const hasWarnings = issues.some((i) => i.severity === 'warning');

  const acts = manifest?.meta.acts || [];
  const charactersMap = manifest?.meta.characters || {};
  const charactersList = Object.values(charactersMap);
  const nodesMap = manifest?.nodes || {};

  // -------------------------------------------------------------
  // Inline Updaters
  // -------------------------------------------------------------
  const handleTitleChange = (newTitle: string) => {
    updateNode({ ...node, title: newTitle });
  };

  const handleActChange = (newActId: string) => {
    updateNode({ ...node, metadata: { ...node.metadata, act: newActId } });
  };

  const handleTerminalToggle = (isTerminal: boolean) => {
    updateNode({ ...node, metadata: { ...node.metadata, is_terminal: isTerminal } });
  };

  const handleActionChange = (actionId: string, updatedFields: Partial<StoryAction>) => {
    const newSeq = node.sequence.map((act) =>
      act.id === actionId ? ({ ...act, ...updatedFields } as StoryAction) : act
    );
    updateNode({ ...node, sequence: newSeq });
  };

  const handleDeleteAction = (actionId: string) => {
    const newSeq = node.sequence.filter((act) => act.id !== actionId);
    updateNode({ ...node, sequence: newSeq });
  };

  const handleAddDialogue = () => {
    const defaultChar = charactersList.find((c) => c.role === 'hero') || charactersList[0];
    const newAction: StoryAction = {
      id: `seq_diag_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type: 'dialogue',
      speaker: defaultChar?.name || 'Странник',
      character_id: defaultChar?.id || 'hero',
      expression: defaultChar?.expressions[0]?.id || 'neutral',
      text: 'Новая реплика диалога...',
    };
    updateNode({ ...node, sequence: [...node.sequence, newAction] });
  };

  const handleAddBackground = () => {
    const newAction: StoryAction = {
      id: `seq_bg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type: 'show_background',
      asset_id: 'bg_scene',
      transition: 'fade',
    };
    updateNode({ ...node, sequence: [...node.sequence, newAction] });
  };

  const handleAddMusic = () => {
    const newAction: StoryAction = {
      id: `seq_mus_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type: 'play_music',
      asset_id: 'ambient_theme',
      loop: true,
      volume: 0.8,
    };
    updateNode({ ...node, sequence: [...node.sequence, newAction] });
  };

  const handleAddEffect = () => {
    const newAction: StoryAction = {
      id: `seq_fx_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      type: 'camera_effect',
      effect: 'shake',
      duration_ms: 500,
    };
    updateNode({ ...node, sequence: [...node.sequence, newAction] });
  };

  // Create choice WITHOUT auto-binding! next_node is empty until user drags handle!
  const handleAddChoice = () => {
    const newChoice: Choice = {
      id: `choice_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      label: 'Новый вариант выбора',
      next_node: '', // Pure unbound choice! User connects manually on canvas!
    };
    updateNode({ ...node, choices: [...node.choices, newChoice] });
  };

  const handleChoiceLabelChange = (choiceId: string, label: string) => {
    const newChoices = node.choices.map((c) =>
      c.id === choiceId ? { ...c, label } : c
    );
    updateNode({ ...node, choices: newChoices });
  };

  const handleDeleteChoice = (choiceId: string) => {
    const newChoices = node.choices.filter((c) => c.id !== choiceId);
    updateNode({ ...node, choices: newChoices });
  };

  return (
    <div
      onClick={() => setSelectedNodeId(id)}
      className={`relative w-[390px] rounded-2xl transition-all duration-200 border-2 shadow-2xl ${
        isDark
          ? selected
            ? 'bg-[#18181b] border-[#facc15] ring-4 ring-yellow-400/20'
            : hasErrors
            ? 'bg-[#18181b] border-rose-500/80 shadow-rose-950/20'
            : hasWarnings
            ? 'bg-[#18181b] border-yellow-500/80 shadow-yellow-950/20'
            : 'bg-[#18181b] border-[#2c2c32] hover:border-zinc-500'
          : selected
          ? 'bg-white border-[#e11d48] ring-4 ring-rose-500/20 shadow-rose-500/10'
          : hasErrors
          ? 'bg-white border-rose-500 shadow-rose-100'
          : hasWarnings
          ? 'bg-white border-yellow-500 shadow-yellow-100'
          : 'bg-white border-slate-200 hover:border-slate-400 shadow-slate-200/60'
      }`}
    >
      {/* Target Handles (Входные порты сцены: слева и сверху) */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className={`!w-3.5 !h-3.5 !border-2 -ml-2 cursor-crosshair hover:scale-150 transition-all ${
          isDark
            ? '!bg-[#facc15] !border-[#0f0f12]'
            : '!bg-[#e11d48] !border-white shadow-sm'
        }`}
        title="Входная связь (слева)"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className={`!w-3.5 !h-3.5 !border-2 -mt-2 cursor-crosshair hover:scale-150 transition-all ${
          isDark
            ? '!bg-[#facc15] !border-[#0f0f12]'
            : '!bg-[#e11d48] !border-white shadow-sm'
        }`}
        title="Входная связь (сверху)"
      />

      {/* ------------------------------------------------------------- */}
      {/* 1. Header (Редактируемый прямо на холсте)                      */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`p-3 border-b rounded-t-2xl space-y-2 ${
          isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          {/* Status badge & Title input */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isStartNode && (
              <span
                className={`p-1 rounded shrink-0 ${
                  isDark
                    ? 'bg-yellow-400/20 text-yellow-400'
                    : 'bg-rose-100 text-rose-600'
                }`}
                title="Стартовая сцена"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </span>
            )}

            <input
              type="text"
              value={node.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Название сцены"
              className={`nodrag w-full text-xs font-bold px-2 py-1 rounded border border-transparent focus:outline-none transition truncate ${
                isDark
                  ? 'text-zinc-100 bg-transparent hover:bg-[#212126] focus:bg-[#212126] focus:border-yellow-400'
                  : 'text-slate-800 bg-transparent hover:bg-slate-200/60 focus:bg-white focus:border-rose-500'
              }`}
              title="Кликните для переименования сцены"
            />
          </div>

          {/* Delete & Collapse actions */}
          <div className="flex items-center gap-1 shrink-0">
            {(hasErrors || hasWarnings) && (
              <span
                className={`p-1 rounded flex items-center gap-1 text-[10px] font-bold ${
                  hasErrors
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}
                title={issues.map((i) => i.message).join('\n')}
              >
                <AlertTriangle className="w-3 h-3" />
              </span>
            )}

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`nodrag p-1 rounded transition ${
                isDark
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-[#26262b]'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
              }`}
              title={isCollapsed ? 'Развернуть сцену' : 'Свернуть сцену'}
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Удалить сцену "${node.title}"?`)) {
                  deleteNode(id);
                }
              }}
              className="nodrag p-1 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition"
              title="Удалить сцену"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Act Selector and Terminal flag */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <select
            value={node.metadata.act}
            onChange={(e) => handleActChange(e.target.value)}
            className={`nodrag text-[11px] font-semibold py-1 px-2 rounded-lg border focus:outline-none cursor-pointer ${
              isDark
                ? 'bg-[#18181b] border-[#2c2c32] text-zinc-200 focus:border-yellow-400'
                : 'bg-white border-slate-200 text-slate-700 focus:border-rose-500'
            }`}
          >
            {acts.map((act) => (
              <option key={act.id} value={act.id}>
                {act.title}
              </option>
            ))}
          </select>

          <label className="nodrag flex items-center gap-1.5 text-[11px] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!node.metadata.is_terminal}
              onChange={(e) => handleTerminalToggle(e.target.checked)}
              className={`w-3.5 h-3.5 rounded ${
                isDark ? 'text-yellow-400 border-zinc-700' : 'text-rose-600 border-slate-300'
              }`}
            />
            <Flag
              className={`w-3 h-3 ${
                node.metadata.is_terminal
                  ? isDark
                    ? 'text-yellow-400'
                    : 'text-rose-600'
                  : 'text-zinc-400'
              }`}
            />
            <span
              className={
                node.metadata.is_terminal
                  ? isDark
                    ? 'text-yellow-400 font-bold'
                    : 'text-rose-600 font-bold'
                  : isDark
                  ? 'text-zinc-400'
                  : 'text-slate-500'
              }
            >
              Финал
            </span>
          </label>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* ------------------------------------------------------------- */}
          {/* 2. Action Sequence Stack                                      */}
          {/* ------------------------------------------------------------- */}
          <div
            className={`p-3 space-y-2 border-b ${
              isDark ? 'bg-[#141416] border-[#28282d]' : 'bg-slate-50/50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider px-1">
              <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>
                Стек режиссуры ({node.sequence.length})
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {node.sequence.length === 0 ? (
                <div
                  className={`text-xs italic py-3 text-center border border-dashed rounded-xl ${
                    isDark ? 'border-zinc-700 text-zinc-500' : 'border-slate-300 text-slate-400'
                  }`}
                >
                  Нет действий. Добавьте реплику или фон ниже!
                </div>
              ) : (
                node.sequence.map((action, idx) => (
                  <div
                    key={action.id}
                    className={`p-2.5 rounded-xl border space-y-1.5 group relative shadow-sm transition ${
                      isDark
                        ? 'bg-[#1c1c20] border-[#2c2c32]'
                        : 'bg-white border-slate-200 shadow-slate-100'
                    }`}
                  >
                    {/* Action Header */}
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                          #{idx + 1}
                        </span>
                        {action.type === 'dialogue' && (
                          <MessageSquare className={`w-3.5 h-3.5 ${isDark ? 'text-yellow-400' : 'text-rose-500'}`} />
                        )}
                        {action.type === 'show_background' && (
                          <ImageIcon className={`w-3.5 h-3.5 ${isDark ? 'text-yellow-400' : 'text-rose-500'}`} />
                        )}
                        {action.type === 'play_music' && (
                          <Music className={`w-3.5 h-3.5 ${isDark ? 'text-yellow-400' : 'text-rose-500'}`} />
                        )}
                        {action.type === 'camera_effect' && (
                          <Zap className={`w-3.5 h-3.5 ${isDark ? 'text-yellow-400' : 'text-rose-500'}`} />
                        )}
                        <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
                          {action.type}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteAction(action.id)}
                        className="nodrag opacity-40 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 transition"
                        title="Удалить это действие"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Action Form Inputs */}
                    {action.type === 'dialogue' && (() => {
                      const matchedChar = action.character_id
                        ? charactersMap[action.character_id]
                        : charactersList.find((c) => c.name === action.speaker);
                      const availableExpressions = matchedChar?.expressions || [];

                      return (
                        <div className="space-y-1.5 pt-0.5">
                          {/* Character Picker & Emotion Selector */}
                          <div className="flex items-center gap-1.5">
                            {/* Color Dot */}
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: matchedChar?.color || (isDark ? '#facc15' : '#e11d48') }}
                            />

                            {/* Speaker Dropdown */}
                            <select
                              value={action.character_id || (matchedChar ? matchedChar.id : 'custom')}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                if (selectedId === 'custom') {
                                  handleActionChange(action.id, {
                                    character_id: undefined,
                                    expression: undefined,
                                  });
                                } else {
                                  const char = charactersMap[selectedId];
                                  handleActionChange(action.id, {
                                    character_id: char.id,
                                    speaker: char.name,
                                    expression: char.expressions[0]?.id || undefined,
                                  });
                                }
                              }}
                              className={`nodrag flex-1 text-[11px] font-bold py-1 px-1.5 rounded border focus:outline-none cursor-pointer truncate ${
                                isDark
                                  ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500'
                              }`}
                            >
                              <optgroup label="Персонажи истории">
                                {charactersList.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} {c.role === 'narrator' ? '(Закадровый)' : c.role === 'hero' ? '(Герой)' : `(${c.role})`}
                                  </option>
                                ))}
                              </optgroup>
                              <option value="custom">Другое имя...</option>
                            </select>

                            {/* Expression Selector */}
                            {availableExpressions.length > 0 && (
                              <select
                                value={action.expression || availableExpressions[0]?.id}
                                onChange={(e) => handleActionChange(action.id, { expression: e.target.value })}
                                className={`nodrag text-[11px] font-semibold py-1 px-1.5 rounded border focus:outline-none cursor-pointer shrink-0 ${
                                  isDark
                                    ? 'bg-[#121214] border-yellow-400/40 text-yellow-300 focus:border-yellow-400'
                                    : 'bg-rose-50 border-rose-200 text-rose-700 focus:border-rose-500'
                                }`}
                                title="Выражение лица / Эмоция"
                              >
                                {availableExpressions.map((expr) => (
                                  <option key={expr.id} value={expr.id}>
                                    {expr.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          {/* Fallback Custom Speaker Input */}
                          {!action.character_id && !matchedChar && (
                            <input
                              type="text"
                              value={action.speaker}
                              onChange={(e) => handleActionChange(action.id, { speaker: e.target.value })}
                              placeholder="Имя персонажа"
                              className={`nodrag w-full text-[11px] font-bold px-2 py-1 rounded border focus:outline-none ${
                                isDark
                                  ? 'bg-[#121214] border-[#2c2c32] text-yellow-300 focus:border-yellow-400'
                                  : 'bg-slate-50 border-slate-200 text-rose-600 focus:border-rose-500'
                              }`}
                            />
                          )}

                          {/* Dialogue Text Area */}
                          <textarea
                            rows={2}
                            value={action.text}
                            onChange={(e) => handleActionChange(action.id, { text: e.target.value })}
                            placeholder="Текст реплики диалога..."
                            className={`nodrag w-full text-xs p-2 rounded-lg border focus:outline-none resize-none leading-relaxed ${
                              isDark
                                ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500'
                            }`}
                          />
                        </div>
                      );
                    })()}

                    {action.type === 'show_background' && (
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <input
                          type="text"
                          value={action.asset_id}
                          onChange={(e) => handleActionChange(action.id, { asset_id: e.target.value })}
                          placeholder="Asset ID фона"
                          className={`nodrag text-xs font-mono px-2 py-1 rounded border focus:outline-none ${
                            isDark
                              ? 'bg-[#121214] border-[#2c2c32] text-yellow-300 focus:border-yellow-400'
                              : 'bg-slate-50 border-slate-200 text-rose-700 focus:border-rose-500'
                          }`}
                        />
                        <select
                          value={action.transition || 'fade'}
                          onChange={(e) => handleActionChange(action.id, { transition: e.target.value as any })}
                          className={`nodrag text-xs px-2 py-1 rounded border focus:outline-none ${
                            isDark
                              ? 'bg-[#121214] border-[#2c2c32] text-zinc-200'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <option value="fade">Fade</option>
                          <option value="cut">Cut</option>
                          <option value="slide_left">Slide Left</option>
                          <option value="slide_right">Slide Right</option>
                        </select>
                      </div>
                    )}

                    {action.type === 'play_music' && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <input
                          type="text"
                          value={action.asset_id}
                          onChange={(e) => handleActionChange(action.id, { asset_id: e.target.value })}
                          placeholder="Asset ID трека"
                          className={`nodrag flex-1 text-xs font-mono px-2 py-1 rounded border focus:outline-none ${
                            isDark
                              ? 'bg-[#121214] border-[#2c2c32] text-yellow-300 focus:border-yellow-400'
                              : 'bg-slate-50 border-slate-200 text-rose-700 focus:border-rose-500'
                          }`}
                        />
                        <label className="nodrag flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={action.loop ?? true}
                            onChange={(e) => handleActionChange(action.id, { loop: e.target.checked })}
                            className={`w-3 h-3 rounded ${
                              isDark ? 'text-yellow-400 border-zinc-700' : 'text-rose-600 border-slate-300'
                            }`}
                          />
                          Loop
                        </label>
                      </div>
                    )}

                    {action.type === 'camera_effect' && (
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <select
                          value={action.effect}
                          onChange={(e) => handleActionChange(action.id, { effect: e.target.value as any })}
                          className={`nodrag text-xs px-2 py-1 rounded border focus:outline-none ${
                            isDark
                              ? 'bg-[#121214] border-[#2c2c32] text-yellow-300'
                              : 'bg-slate-50 border-slate-200 text-rose-700'
                          }`}
                        >
                          <option value="shake">Shake</option>
                          <option value="flash">Flash</option>
                          <option value="fade_in">Fade In</option>
                          <option value="fade_out">Fade Out</option>
                          <option value="zoom_in">Zoom In</option>
                        </select>
                        <input
                          type="number"
                          value={action.duration_ms || 500}
                          onChange={(e) => handleActionChange(action.id, { duration_ms: Number(e.target.value) })}
                          placeholder="Длительность (мс)"
                          className={`nodrag text-xs font-mono px-2 py-1 rounded border focus:outline-none ${
                            isDark
                              ? 'bg-[#121214] border-[#2c2c32] text-zinc-200'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Quick Action Insert Bar */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                onClick={handleAddDialogue}
                className={`nodrag py-1.5 px-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-sm ${
                  isDark
                    ? 'bg-[#1c1c20] hover:bg-[#25252b] border-[#2c2c32] text-yellow-400'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-rose-600 shadow-slate-100'
                }`}
                title="Добавить реплику диалога"
              >
                <Plus className="w-3 h-3" /> Реплика
              </button>
              <button
                onClick={handleAddBackground}
                className={`nodrag py-1.5 px-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-sm ${
                  isDark
                    ? 'bg-[#1c1c20] hover:bg-[#25252b] border-[#2c2c32] text-yellow-400'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-rose-600 shadow-slate-100'
                }`}
                title="Добавить смену фона"
              >
                <Plus className="w-3 h-3" /> Фон
              </button>
              <button
                onClick={handleAddMusic}
                className={`nodrag py-1.5 px-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-sm ${
                  isDark
                    ? 'bg-[#1c1c20] hover:bg-[#25252b] border-[#2c2c32] text-yellow-400'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-rose-600 shadow-slate-100'
                }`}
                title="Добавить музыку"
              >
                <Plus className="w-3 h-3" /> Трек
              </button>
              <button
                onClick={handleAddEffect}
                className={`nodrag py-1.5 px-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-sm ${
                  isDark
                    ? 'bg-[#1c1c20] hover:bg-[#25252b] border-[#2c2c32] text-yellow-400'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-rose-600 shadow-slate-100'
                }`}
                title="Добавить эффект камеры"
              >
                <Plus className="w-3 h-3" /> Эффект
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* 3. Choices Section (NO AUTO-BINDING! Clean Manual Handles)    */}
          {/* ------------------------------------------------------------- */}
          <div
            className={`p-3 rounded-b-2xl space-y-2 ${
              isDark ? 'bg-[#18181b]' : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider px-1">
              <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>
                Выборы / Развилки ({node.choices.length})
              </span>
              <button
                onClick={handleAddChoice}
                className={`nodrag flex items-center gap-1 text-[11px] font-bold lowercase transition ${
                  isDark ? 'text-yellow-400 hover:text-yellow-300' : 'text-rose-600 hover:text-rose-500'
                }`}
                title="Добавить свободный вариант выбора без автопривязки"
              >
                <Plus className="w-3.5 h-3.5" /> развилка
              </button>
            </div>

            {node.choices.length === 0 ? (
              <div
                className={`text-[11px] text-center py-2.5 rounded-xl border border-dashed ${
                  node.metadata.is_terminal
                    ? isDark
                      ? 'border-yellow-400/30 text-yellow-400 bg-yellow-400/5'
                      : 'border-rose-300 text-rose-600 bg-rose-50'
                    : isDark
                    ? 'border-zinc-700 text-zinc-500 bg-[#121214]'
                    : 'border-slate-300 text-slate-400 bg-slate-50'
                }`}
              >
                {node.metadata.is_terminal ? '🏁 Финальная сцена истории' : '⚠️ Нет развилок (нажмите "+ развилка")'}
              </div>
            ) : (
              <div className="space-y-2">
                {node.choices.map((choice, idx) => {
                  const isBound = choice.next_node && choice.next_node.trim() !== '' && nodesMap[choice.next_node];
                  const targetTitle = isBound ? getLocalizedNodeTitle(nodesMap[choice.next_node], t) : null;

                  return (
                    <div
                      key={choice.id}
                      className={`p-2.5 rounded-xl border space-y-1.5 relative group transition ${
                        isDark
                          ? 'bg-[#121214] border-[#2c2c32]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <ArrowRight
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isDark ? 'text-yellow-400' : 'text-rose-600'
                            }`}
                          />
                          <input
                            type="text"
                            value={choice.label}
                            onChange={(e) => handleChoiceLabelChange(choice.id, e.target.value)}
                            placeholder="Текст кнопки выбора"
                            className={`nodrag w-full text-xs font-bold px-1.5 py-0.5 rounded border border-transparent focus:outline-none ${
                              isDark
                                ? 'text-zinc-100 bg-transparent hover:border-[#2c2c32] focus:border-yellow-400'
                                : 'text-slate-800 bg-transparent hover:border-slate-300 focus:border-rose-500'
                            }`}
                          />
                        </div>

                        <button
                          onClick={() => handleDeleteChoice(choice.id)}
                          className="nodrag text-zinc-400 hover:text-rose-500 p-1 transition"
                          title="Удалить выбор"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Connection status indicator */}
                      <div className="flex items-center justify-between text-[11px] pl-5 pr-1">
                        {isBound ? (
                          <div className="flex items-center gap-1.5 truncate">
                            <Link2 className={`w-3 h-3 shrink-0 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
                            <span className={`truncate text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                              → {targetTitle}
                            </span>
                            <button
                              onClick={() => unlinkChoice(id, choice.id)}
                              className={`nodrag p-0.5 ml-1 transition ${
                                isDark ? 'text-zinc-400 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                              }`}
                              title="Отвязать переход"
                            >
                              <Unlink className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <div className={`flex items-center gap-1 text-[10px] font-medium italic opacity-75 ${
                            isDark ? 'text-zinc-400' : 'text-slate-500'
                          }`}>
                            <span>• Не привязан (потяните точку справа)</span>
                          </div>
                        )}
                      </div>

                      {/* Source Handle right beside choice for manual connection */}
                      <Handle
                        type="source"
                        position={Position.Right}
                        id={choice.id}
                        className={`!w-3.5 !h-3.5 !border-2 -mr-2 transition-transform hover:scale-125 ${
                          isDark
                            ? '!bg-[#facc15] !border-[#0f0f12]'
                            : '!bg-[#e11d48] !border-white shadow-sm'
                        }`}
                        title="Потяните эту точку к целевой сцене на холсте"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});

StoryActionNode.displayName = 'StoryActionNode';
