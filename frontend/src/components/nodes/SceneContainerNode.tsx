import React, { memo, useState, useEffect } from 'react';
import { NodeResizer } from '@xyflow/react';
import { Trash2, Maximize2, Folder, GripVertical } from 'lucide-react';
import type { SceneContainer } from '@narrative-engine/shared';
import { useStoryStore } from '../../store/useStoryStore.ts';
import { useTranslation } from '../../i18n/index.ts';

interface SceneContainerNodeProps {
  id: string;
  data: {
    scene: SceneContainer;
    isDark?: boolean;
  };
  selected?: boolean;
}

export const SceneContainerNode = memo(({ data, selected }: SceneContainerNodeProps) => {
  const { scene, isDark = true } = data;
  const { t } = useTranslation();
  const updateScene = useStoryStore((s) => s.updateScene);
  const deleteScene = useStoryStore((s) => s.deleteScene);

  const [title, setTitle] = useState(scene.title);
  const [liveDimensions, setLiveDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    setTitle(scene.title);
  }, [scene.title]);

  useEffect(() => {
    if (scene.dimensions && liveDimensions) {
      if (
        scene.dimensions.width === liveDimensions.width &&
        scene.dimensions.height === liveDimensions.height
      ) {
        setLiveDimensions(null);
      }
    }
  }, [scene.dimensions, liveDimensions]);

  const handleTitleBlur = () => {
    if (title !== scene.title) {
      updateScene({ ...scene, title });
    }
  };

  const displayWidth = liveDimensions?.width ?? (scene.dimensions?.width || 1200);
  const displayHeight = liveDimensions?.height ?? (scene.dimensions?.height || 750);

  return (
    <div
      className={`relative rounded-3xl border-[3.5px] transition-colors select-none ${
        isDark
          ? selected
            ? 'bg-[#121215]/80 border-yellow-400 shadow-2xl shadow-yellow-400/10'
            : 'bg-[#121215]/50 border-yellow-400/50 hover:border-yellow-400/80'
          : selected
          ? 'bg-white/90 border-rose-600 shadow-2xl shadow-rose-500/15'
          : 'bg-white/70 border-rose-500/50 hover:border-rose-600/80'
      }`}
      style={{
        width: displayWidth,
        height: displayHeight,
      }}
    >
      {/* Folder Tab (Ярлычок папки для легкого захвата и перетаскивания сцены) */}
      <div
        className={`absolute -top-[34px] left-6 h-[34px] px-3.5 rounded-t-xl border-t-[3.5px] border-x-[3.5px] flex items-center gap-2 cursor-grab active:cursor-grabbing select-none transition group shadow-md ${
          isDark
            ? selected
              ? 'bg-[#18181c] border-yellow-400 text-yellow-400'
              : 'bg-[#18181c] border-yellow-400/50 hover:border-yellow-400 text-yellow-400/80 hover:text-yellow-400'
            : selected
            ? 'bg-white border-rose-600 text-rose-600'
            : 'bg-white border-rose-500/50 hover:border-rose-600 text-rose-600/80 hover:text-rose-600'
        }`}
        title={t.canvas.sceneDragTooltip}
      >
        <Folder className="w-3.5 h-3.5 shrink-0" />
        <span className="text-xs font-mono font-bold tracking-tight">
          {title || t.canvas.sceneDefaultTitle}
        </span>
        <GripVertical className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity ml-0.5" />
      </div>

      {/* NodeResizer: allows user to freely scale scene perimeter directly via border lines without awkward corner dots */}
      <NodeResizer
        isVisible={true}
        minWidth={450}
        minHeight={320}
        handleClassName="!hidden"
        lineClassName={
          isDark
            ? '!border-transparent hover:!border-yellow-400/50 transition-colors'
            : '!border-transparent hover:!border-rose-500/50 transition-colors'
        }
        onResize={(_, params) => {
          setLiveDimensions({
            width: Math.round(params.width),
            height: Math.round(params.height),
          });
        }}
        onResizeEnd={(_, params) => {
          const finalW = Math.round(params.width);
          const finalH = Math.round(params.height);
          const finalX = Math.round(params.x);
          const finalY = Math.round(params.y);

          setLiveDimensions({
            width: finalW,
            height: finalH,
          });

          updateScene({
            ...scene,
            position: {
              x: finalX,
              y: finalY,
            },
            dimensions: {
              width: finalW,
              height: finalH,
            },
          });
        }}
      />

      {/* Scene Header */}
      <div
        className={`pointer-events-auto p-3.5 rounded-t-3xl border-b flex items-center justify-between gap-3 cursor-grab active:cursor-grabbing transition ${
          isDark
            ? 'bg-[#18181c]/90 border-yellow-400/20 text-zinc-100'
            : 'bg-white/95 border-rose-300 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className={`w-3.5 h-3.5 rounded-full shrink-0 ${
              isDark ? 'bg-[#facc15]' : 'bg-[#e11d48]'
            }`}
          />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder={t.canvas.sceneDefaultTitle}
            className={`nodrag w-full text-sm font-extrabold font-mono tracking-wide px-2 py-0.5 rounded border border-transparent focus:outline-none transition cursor-text ${
              isDark
                ? 'text-yellow-400 bg-transparent hover:border-[#2e2e34] focus:border-yellow-400'
                : 'text-rose-600 bg-transparent hover:border-slate-300 focus:border-rose-500'
            }`}
          />
        </div>

        <div className="nodrag flex items-center gap-2 shrink-0">
          {/* Dimensions pill */}
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 font-bold ${
              isDark
                ? 'bg-zinc-800 text-yellow-300 border-zinc-700'
                : 'bg-slate-100 text-rose-600 border-slate-200'
            }`}
            title={`${displayWidth} × ${displayHeight}`}
          >
            <Maximize2 className="w-2.5 h-2.5 opacity-70" />
            {displayWidth} × {displayHeight}
          </span>

          {/* Delete Scene */}
          <button
            onClick={() => {
              if (confirm(`Удалить сцену "${scene.title}"?`)) {
                deleteScene(scene.id);
              }
            }}
            className={`p-1.5 rounded-lg transition ${
              isDark ? 'text-zinc-500 hover:text-rose-400 hover:bg-zinc-800' : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
            }`}
            title={t.canvas.deleteSceneTooltip}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

SceneContainerNode.displayName = 'SceneContainerNode';
