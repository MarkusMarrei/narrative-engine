import React, { memo } from 'react';
import type { ActContainer } from '@narrative-engine/shared';

interface ActGroupNodeProps {
  id: string;
  data: {
    act: ActContainer;
    isDark?: boolean;
  };
}

export const ActGroupNode = memo(({ data }: ActGroupNodeProps) => {
  const { act, isDark = true } = data;

  return (
    <div
      className={`rounded-3xl border-2 border-dashed p-6 transition-all pointer-events-none shadow-sm ${
        isDark
          ? 'bg-[#141417]/40 border-yellow-400/20'
          : 'bg-white/60 border-rose-400/25 shadow-slate-200/50'
      }`}
      style={{
        width: act.dimensions?.width || 900,
        height: act.dimensions?.height || 650,
      }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <span
          className={`w-3.5 h-3.5 rounded-full ${isDark ? 'bg-[#facc15]' : 'bg-[#e11d48]'}`}
        />
        <h2
          className={`text-base font-extrabold tracking-wider uppercase font-mono ${
            isDark ? 'text-yellow-400' : 'text-rose-600'
          }`}
        >
          {act.title}
        </h2>
      </div>
      {act.description && (
        <p className={`text-xs max-w-lg leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
          {act.description}
        </p>
      )}
    </div>
  );
});

ActGroupNode.displayName = 'ActGroupNode';
