import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play, Sparkles } from 'lucide-react';
import { useStoryStore } from '../../store/useStoryStore.ts';
import { useTranslation, getLocalizedNodeTitle } from '../../i18n/index.ts';

interface StartNodeProps {
  id: string;
  data: {
    startNodeId?: string;
    isDark?: boolean;
  };
  selected?: boolean;
}

export const StartNode = memo(({ data, selected }: StartNodeProps) => {
  const { startNodeId, isDark = true } = data;
  const { t } = useTranslation();
  const manifest = useStoryStore((s) => s.manifest);
  const targetNode = startNodeId ? manifest?.nodes[startNodeId] : undefined;
  const targetTitle = getLocalizedNodeTitle(targetNode, t);

  const sourceClass = `!w-4 !h-4 !border-2 transition-all cursor-crosshair hover:scale-150 z-30 before:absolute before:-inset-2 before:content-[''] before:z-10 ${
    isDark
      ? '!bg-[#facc15] !border-[#0f0f12] hover:shadow-[0_0_10px_#facc15]'
      : '!bg-[#e11d48] !border-white hover:shadow-[0_0_10px_#e11d48]'
  }`;

  return (
    <div
      className={`relative w-[210px] rounded-2xl border-2 transition-all select-none shadow-2xl ${
        isDark
          ? selected
            ? 'bg-[#18181c] border-yellow-400 ring-4 ring-yellow-400/25 shadow-yellow-400/15'
            : 'bg-[#18181c] border-yellow-400/80 hover:border-yellow-400'
          : selected
          ? 'bg-white border-rose-600 ring-4 ring-rose-500/25 shadow-rose-500/15'
          : 'bg-white border-rose-500/80 hover:border-rose-600'
      }`}
    >
      {/* Header */}
      <div
        className={`p-2.5 rounded-t-2xl border-b flex items-center justify-between ${
          isDark
            ? 'bg-gradient-to-r from-yellow-400/15 to-transparent border-yellow-400/20'
            : 'bg-gradient-to-r from-rose-50 to-transparent border-rose-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`p-1 rounded-lg ${
              isDark ? 'bg-yellow-400 text-black' : 'bg-rose-600 text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </div>
          <span
            className={`text-xs font-black uppercase font-mono tracking-wider ${
              isDark ? 'text-yellow-400' : 'text-rose-600'
            }`}
          >
            {t.canvas.startNodeTitle}
          </span>
        </div>
        <Sparkles
          className={`w-3.5 h-3.5 opacity-60 ${
            isDark ? 'text-yellow-400' : 'text-rose-600'
          }`}
        />
      </div>

      {/* Body: shows currently connected starting node or instructions */}
      <div className="p-3 space-y-1.5">
        <div className="text-[11px] font-semibold opacity-70">
          {t.canvas.startNodeSubtitle}
        </div>
        {targetTitle ? (
          <div
            className={`px-2 py-1.5 rounded-xl border flex items-center gap-1.5 truncate text-xs font-bold ${
              isDark
                ? 'bg-[#121214] border-yellow-400/30 text-yellow-300'
                : 'bg-rose-50/80 border-rose-200 text-rose-700'
            }`}
          >
            <span>→</span>
            <span className="truncate">{targetTitle}</span>
          </div>
        ) : (
          <div className="text-[10px] italic opacity-60 leading-tight">
            {t.canvas.startNodeInstruction}
          </div>
        )}
      </div>

      {/* Output Handles (Right & Bottom only - Start node is strictly a source) */}
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className={`${sourceClass} -mr-2`}
        title={t.canvas.startNodeSourceRight}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className={`${sourceClass} -mb-2`}
        title={t.canvas.startNodeSourceBottom}
      />
    </div>
  );
});

StartNode.displayName = 'StartNode';
