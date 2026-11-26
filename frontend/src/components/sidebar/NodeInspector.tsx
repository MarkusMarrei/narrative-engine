import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  MessageSquare,
  Image as ImageIcon,
  Music,
  Zap,
  Flag,
  ArrowRight,
} from 'lucide-react';
import { useStoryStore } from '../../store/useStoryStore.ts';
import type { StoryAction, Choice } from '@narrative-engine/shared';

export const NodeInspector: React.FC = () => {
  const selectedNodeId = useStoryStore((s) => s.selectedNodeId);
  const manifest = useStoryStore((s) => s.manifest);
  const setSelectedNodeId = useStoryStore((s) => s.setSelectedNodeId);
  const updateNode = useStoryStore((s) => s.updateNode);
  const deleteNode = useStoryStore((s) => s.deleteNode);
  const removeActionFromNode = useStoryStore((s) => s.removeActionFromNode);
  const addActionToNode = useStoryStore((s) => s.addActionToNode);
  const addChoiceToNode = useStoryStore((s) => s.addChoiceToNode);
  const removeChoiceFromNode = useStoryStore((s) => s.removeChoiceFromNode);

  const [activeTab, setActiveTab] = useState<'actions' | 'choices'>('actions');
  const [newSpeaker, setNewSpeaker] = useState('Странник');
  const [newDialogueText, setNewDialogueText] = useState('');

  if (!selectedNodeId || !manifest || !manifest.nodes[selectedNodeId]) {
    return null;
  }

  const node = manifest.nodes[selectedNodeId];
  const acts = manifest.meta.acts;
  const otherNodes = Object.values(manifest.nodes).filter((n) => n.id !== selectedNodeId);

  const handleAddDialogue = () => {
    if (!newDialogueText.trim()) return;

    const action: StoryAction = {
      id: `seq_diag_${Date.now()}`,
      type: 'dialogue',
      speaker: newSpeaker,
      text: newDialogueText.trim(),
    };

    addActionToNode(node.id, action);
    setNewDialogueText('');
  };

  const handleAddBackground = () => {
    const bgId = prompt('Введите Asset ID фона (например bg_forest):', 'bg_scene');
    if (bgId) {
      addActionToNode(node.id, {
        id: `seq_bg_${Date.now()}`,
        type: 'show_background',
        asset_id: bgId,
        transition: 'fade',
      });
    }
  };

  const handleAddMusic = () => {
    const musicId = prompt('Введите Asset ID музыки (например theme_mystery):', 'theme_track');
    if (musicId) {
      addActionToNode(node.id, {
        id: `seq_mus_${Date.now()}`,
        type: 'play_music',
        asset_id: musicId,
        loop: true,
      });
    }
  };

  const handleAddCameraEffect = () => {
    addActionToNode(node.id, {
      id: `seq_fx_${Date.now()}`,
      type: 'camera_effect',
      effect: 'shake',
      duration_ms: 500,
    });
  };

  const handleAddChoice = () => {
    const label = prompt('Текст кнопки выбора:', 'Продолжить путь');
    if (!label) return;

    const targetNodeId = otherNodes[0]?.id || node.id;
    const choice: Choice = {
      id: `choice_${Date.now()}`,
      label,
      next_node: targetNodeId,
    };

    addChoiceToNode(node.id, choice);
  };

  return (
    <aside className="w-96 border-l border-[#30363d] bg-[#161b22] flex flex-col h-full shadow-2xl z-20 shrink-0">
      {/* Top Header */}
      <div className="p-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]/50">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400">
            Инспектор Сцены
          </span>
          <h2 className="text-sm font-bold text-zinc-100 truncate w-64">{node.title}</h2>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#21262d] transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Basic Settings */}
      <div className="p-4 border-b border-[#30363d] space-y-3 bg-[#161b22]">
        <div>
          <label className="text-xs text-zinc-400 font-medium block mb-1">Название сцены</label>
          <input
            type="text"
            value={node.title}
            onChange={(e) => updateNode({ ...node, title: e.target.value })}
            className="w-full text-xs px-3 py-2 rounded-lg bg-[#0d1117] border border-[#30363d] text-zinc-100 focus:outline-none focus:border-sky-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-zinc-400 font-medium block mb-1">Акт</label>
            <select
              value={node.metadata.act}
              onChange={(e) =>
                updateNode({
                  ...node,
                  metadata: { ...node.metadata, act: e.target.value },
                })
              }
              className="w-full text-xs px-2.5 py-2 rounded-lg bg-[#0d1117] border border-[#30363d] text-zinc-200 focus:outline-none focus:border-sky-400"
            >
              {acts.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!node.metadata.is_terminal}
                onChange={(e) =>
                  updateNode({
                    ...node,
                    metadata: { ...node.metadata, is_terminal: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-sky-500 focus:ring-0 bg-[#0d1117] border-[#30363d]"
              />
              <span className="flex items-center gap-1">
                <Flag className="w-3.5 h-3.5 text-emerald-400" /> Финал
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#30363d] text-xs font-semibold">
        <button
          onClick={() => setActiveTab('actions')}
          className={`flex-1 py-2.5 text-center transition border-b-2 ${
            activeTab === 'actions'
              ? 'border-sky-400 text-sky-400 bg-sky-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Стек действий ({node.sequence.length})
        </button>
        <button
          onClick={() => setActiveTab('choices')}
          className={`flex-1 py-2.5 text-center transition border-b-2 ${
            activeTab === 'choices'
              ? 'border-sky-400 text-sky-400 bg-sky-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Выборы ({node.choices.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'actions' ? (
          <>
            {/* Quick Action Toolbar */}
            <div className="flex items-center gap-1.5 p-1 bg-[#0d1117] rounded-lg border border-[#30363d]">
              <button
                onClick={handleAddBackground}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded text-[11px] font-medium text-zinc-300 hover:bg-[#21262d] transition"
                title="Добавить смену фона"
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" /> Фон
              </button>
              <button
                onClick={handleAddMusic}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded text-[11px] font-medium text-zinc-300 hover:bg-[#21262d] transition"
                title="Добавить музыку"
              >
                <Music className="w-3.5 h-3.5 text-purple-400" /> Трек
              </button>
              <button
                onClick={handleAddCameraEffect}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded text-[11px] font-medium text-zinc-300 hover:bg-[#21262d] transition"
                title="Добавить эффект камеры"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Эффект
              </button>
            </div>

            {/* Actions List */}
            <div className="space-y-2">
              {node.sequence.map((action, idx) => (
                <div
                  key={action.id}
                  className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-1 relative group"
                >
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-mono text-[10px] text-zinc-500">#{idx + 1} • {action.type}</span>
                    <button
                      onClick={() => removeActionFromNode(node.id, action.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {action.type === 'dialogue' && (
                    <div className="text-xs">
                      <span className="font-semibold text-emerald-400">{action.speaker}: </span>
                      <span className="text-zinc-200">"{action.text}"</span>
                    </div>
                  )}

                  {action.type === 'show_background' && (
                    <div className="text-xs text-blue-300 font-mono">
                      Asset: {action.asset_id} ({action.transition || 'fade'})
                    </div>
                  )}

                  {action.type === 'play_music' && (
                    <div className="text-xs text-purple-300 font-mono">
                      Track: {action.asset_id}
                    </div>
                  )}

                  {action.type === 'camera_effect' && (
                    <div className="text-xs text-amber-300 font-mono">
                      Effect: {action.effect} ({action.duration_ms}ms)
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Dialogue Adder */}
            <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-2 mt-4">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Добавить реплику
              </span>
              <input
                type="text"
                placeholder="Имя персонажа"
                value={newSpeaker}
                onChange={(e) => setNewSpeaker(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-md bg-[#161b22] border border-[#30363d] text-zinc-100"
              />
              <textarea
                placeholder="Текст диалога..."
                rows={2}
                value={newDialogueText}
                onChange={(e) => setNewDialogueText(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-md bg-[#161b22] border border-[#30363d] text-zinc-100 resize-none"
              />
              <button
                onClick={handleAddDialogue}
                className="w-full py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Добавить в сцену
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={handleAddChoice}
              className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Добавить развилку выбора
            </button>

            <div className="space-y-2 mt-3">
              {node.choices.map((choice) => (
                <div
                  key={choice.id}
                  className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-200 truncate pr-2">
                      {choice.label}
                    </span>
                    <button
                      onClick={() => removeChoiceFromNode(node.id, choice.id)}
                      className="text-zinc-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-sky-400" />
                    <span>Переход в:</span>
                    <select
                      value={choice.next_node}
                      onChange={(e) => {
                        const updatedChoices = node.choices.map((c) =>
                          c.id === choice.id ? { ...c, next_node: e.target.value } : c
                        );
                        updateNode({ ...node, choices: updatedChoices });
                      }}
                      className="text-xs px-2 py-0.5 rounded bg-[#161b22] border border-[#30363d] text-zinc-200"
                    >
                      {otherNodes.map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.title} ({target.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete Node Footer */}
      <div className="p-3 border-t border-[#30363d] bg-[#0d1117]/60">
        <button
          onClick={() => {
            if (confirm(`Удалить сцену "${node.title}"?`)) {
              deleteNode(node.id);
            }
          }}
          className="w-full py-2 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-medium flex items-center justify-center gap-1.5 transition"
        >
          <Trash2 className="w-3.5 h-3.5" /> Удалить эту сцену
        </button>
      </div>
    </aside>
  );
};
