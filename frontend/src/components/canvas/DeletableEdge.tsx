import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  getBezierPath,
  Position,
  type EdgeProps,
} from '@xyflow/react';
import { X } from 'lucide-react';
import { useStoryStore } from '../../store/useStoryStore.ts';
import { useTranslation } from '../../i18n/index.ts';

export const DeletableEdge: React.FC<EdgeProps> = ({
  id,
  source,
  sourceHandleId,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  label,
}) => {
  // If target is behind source horizontally, use smooth bezier to prevent tight 180° kinks
  const isBackwards =
    sourcePosition === Position.Right &&
    targetPosition === Position.Left &&
    targetX < sourceX + 30;

  const [edgePath, labelX, labelY] = isBackwards
    ? getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      })
    : getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 16,
      });

  const deleteEdge = useStoryStore((s) => s.deleteEdge);
  const theme = useStoryStore((s) => s.theme);
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  // Safeguard: do not render edge or animated arrows if path is empty, invalid or NaN
  const isValidPath = Boolean(
    edgePath &&
    edgePath.trim().length > 6 &&
    !edgePath.includes('NaN') &&
    !edgePath.includes('undefined')
  );

  if (!isValidPath) {
    return null;
  }

  const accentColor = isDark ? '#facc15' : '#e11d48';

  const edgeStyle: React.CSSProperties = {
    ...style,
    stroke: selected ? accentColor : isDark ? '#eab308' : '#e11d48',
    strokeWidth: selected ? 3.5 : 2.5,
    filter: selected ? `drop-shadow(0 0 6px ${accentColor})` : undefined,
    transition: 'stroke 0.15s ease, stroke-width 0.15s ease',
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEdge(id, source, sourceHandleId);
  };

  return (
    <>
      {/* Base Edge Line */}
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />

      {/* Flowing Animated Arrows along the connection path */}
      {[0, 0.75, 1.5, 2.25].map((delay, idx) => (
        <g
          key={`arrow-${idx}`}
          className="pointer-events-none select-none"
          style={{ opacity: 0 }}
        >
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            keyTimes="0;0.05;0.95;1"
            dur="3s"
            begin={`${delay}s`}
            repeatCount="indefinite"
          />
          {/* Arrow Outline / Shadow for crisp contrast */}
          <path
            d="M -5 -4 L 3 0 L -5 4"
            fill="none"
            stroke={isDark ? '#09090b' : '#ffffff'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animateMotion
              path={edgePath}
              dur="3s"
              begin={`${delay}s`}
              repeatCount="indefinite"
              rotate="auto"
            />
          </path>
          {/* Colored Arrowhead pointing forward along flow */}
          <path
            d="M -5 -4 L 3 0 L -5 4"
            fill="none"
            stroke={accentColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animateMotion
              path={edgePath}
              dur="3s"
              begin={`${delay}s`}
              repeatCount="indefinite"
              rotate="auto"
            />
          </path>
        </g>
      ))}

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan flex items-center gap-1.5 z-20 group"
        >
          {label && (
            <div
              className={`text-[11px] font-bold px-2 py-0.5 rounded-md border shadow-md select-none transition ${
                selected
                  ? isDark
                    ? 'bg-yellow-400 text-black border-yellow-300 ring-2 ring-yellow-400/30'
                    : 'bg-rose-600 text-white border-rose-500 ring-2 ring-rose-500/30'
                  : isDark
                  ? 'bg-[#18181b]/95 text-yellow-300 border-[#2e2e34]'
                  : 'bg-white/95 text-slate-800 border-slate-200 shadow-sm'
              }`}
            >
              {label}
            </div>
          )}

          {/* Delete button appears on edge selection or hover */}
          <button
            onClick={handleDelete}
            title={t.canvas.deleteEdge}
            className={`w-5 h-5 rounded-full flex items-center justify-center transition shadow-lg ${
              selected
                ? 'opacity-100 scale-110'
                : 'opacity-0 group-hover:opacity-100 scale-90 hover:scale-105'
            } ${
              isDark
                ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400'
                : 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-300'
            }`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
