import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Smile,
  MessageSquareQuote,
  GitFork,
  Database,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutGrid,
  Image as ImageIcon,
  Music,
  Film,
  Shirt,
} from 'lucide-react';
import type { FlowNodeType } from '@narrative-engine/shared';
import { useStoryStore } from '../../store/useStoryStore.ts';
import { useTranslation } from '../../i18n/index.ts';

interface NodePaletteProps {
  onAddNode: (type: FlowNodeType) => void;
  onAddScene: () => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode, onAddScene }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const theme = useStoryStore((s) => s.theme);
  const isDark = theme === 'dark';

  const nodeTypes: Array<{
    type: FlowNodeType;
    title: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      type: 'background',
      title: t.palette.nodes.background.name,
      description: t.palette.nodes.background.desc,
      icon: <ImageIcon className="w-4 h-4" />,
    },
    {
      type: 'music',
      title: t.palette.nodes.music.name,
      description: t.palette.nodes.music.desc,
      icon: <Music className="w-4 h-4" />,
    },
    {
      type: 'video',
      title: t.palette.nodes.video.name,
      description: t.palette.nodes.video.desc,
      icon: <Film className="w-4 h-4" />,
    },
    {
      type: 'effect',
      title: t.palette.nodes.effect.name,
      description: t.palette.nodes.effect.desc,
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      type: 'character',
      title: t.palette.nodes.character.name,
      description: t.palette.nodes.character.desc,
      icon: <User className="w-4 h-4" />,
    },
    {
      type: 'emotion',
      title: t.palette.nodes.emotion.name,
      description: t.palette.nodes.emotion.desc,
      icon: <Smile className="w-4 h-4" />,
    },
    {
      type: 'appearance',
      title: t.palette.nodes.appearance.name,
      description: t.palette.nodes.appearance.desc,
      icon: <Shirt className="w-4 h-4" />,
    },
    {
      type: 'dialogue',
      title: t.palette.nodes.dialogue.name,
      description: t.palette.nodes.dialogue.desc,
      icon: <MessageSquareQuote className="w-4 h-4" />,
    },
    {
      type: 'choice',
      title: t.palette.nodes.choice.name,
      description: t.palette.nodes.choice.desc,
      icon: <GitFork className="w-4 h-4" />,
    },
    {
      type: 'variable',
      title: t.palette.nodes.variable.name,
      description: t.palette.nodes.variable.desc,
      icon: <Database className="w-4 h-4" />,
    },
  ];

  const handleDragStart = (e: React.DragEvent, type: FlowNodeType) => {
    e.dataTransfer.setData('application/reactflow/type', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  if (!isOpen) {
    return (
      <div className="absolute left-4 top-4 z-20">
        <button
          onClick={() => setIsOpen(true)}
          className={`p-2.5 rounded-2xl border shadow-xl flex items-center gap-2 text-xs font-bold transition ${
            isDark
              ? 'bg-[#18181b] border-yellow-400/40 text-yellow-400 hover:bg-[#222226]'
              : 'bg-white border-rose-300 text-rose-600 hover:bg-slate-50 shadow-sm'
          }`}
          title={t.palette.openTitle}
        >
          <PanelLeftOpen className="w-4 h-4" />
          <span>{t.palette.openTitle}</span>
        </button>
      </div>
    );
  }

  return (
    <aside
      className={`absolute left-4 top-4 bottom-4 w-64 z-20 rounded-2xl border shadow-2xl flex flex-col overflow-hidden backdrop-blur-md transition-colors ${
        isDark
          ? 'bg-[#18181b]/95 border-[#2c2c32] text-zinc-100'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/60'
      }`}
    >
      {/* Header */}
      <div
        className={`p-3.5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <LayoutGrid className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
          <h3 className="text-xs font-extrabold uppercase tracking-wider font-mono">
            {t.palette.title}
          </h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className={`p-1 rounded-lg transition ${
            isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-[#26262b]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
          }`}
          title="Свернуть"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Add Scene Button */}
      <div className="p-3 border-b border-dashed border-zinc-700/30">
        <button
          onClick={onAddScene}
          className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm ${
            isDark
              ? 'bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border-yellow-400/30'
              : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.palette.newSceneBtn}</span>
        </button>
      </div>

      {/* Nodes List */}
      <div className="p-3 overflow-y-auto space-y-2 flex-1">
        <p className="text-[10px] font-mono opacity-50 px-1 mb-1">
          {t.palette.hint}
        </p>

        {nodeTypes.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => handleDragStart(e, item.type)}
            onClick={() => onAddNode(item.type)}
            className={`p-2.5 rounded-xl border cursor-pointer select-none transition group shadow-sm flex items-start gap-2.5 ${
              isDark
                ? 'bg-[#121214] border-[#2c2c32] hover:border-yellow-400/60 hover:bg-[#1c1c20]'
                : 'bg-slate-50 border-slate-200 hover:border-rose-400 hover:bg-white'
            }`}
            title={item.title}
          >
            <div
              className={`p-2 rounded-lg shrink-0 transition ${
                isDark
                  ? 'bg-yellow-400/10 text-yellow-400 group-hover:bg-yellow-400 group-hover:text-black'
                  : 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'
              }`}
            >
              {item.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono">{item.title}</span>
                <span
                  className={`text-[10px] opacity-0 group-hover:opacity-100 transition font-bold ${
                    isDark ? 'text-yellow-400' : 'text-rose-600'
                  }`}
                >
                  +
                </span>
              </div>
              <p className="text-[10px] opacity-60 leading-tight mt-0.5">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
