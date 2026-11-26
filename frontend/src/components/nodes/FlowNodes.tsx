import React, { memo, useRef, useMemo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Sparkles,
  User,
  Smile,
  MessageSquareQuote,
  GitFork,
  Database,
  Trash2,
  Unlink,
  Plus,
  ArrowRight,
  Image as ImageIcon,
  Music,
  Film,
  Volume2,
  Shirt,
  Mic,
  Upload,
  FolderOpen,
} from 'lucide-react';
import type { StoryNode, Choice } from '@narrative-engine/shared';
import { useStoryStore } from '../../store/useStoryStore.ts';
import { useTranslation, getLocalizedNodeTitle } from '../../i18n/index.ts';

interface FlowNodeProps {
  id: string;
  data: {
    node: StoryNode;
    isDark?: boolean;
  };
  selected?: boolean;
}

// ---------------------------------------------------------------------------
// Helper: Resolve image URL (supports web URLs, data/blob URLs, and local disk paths via media stream API)
// ---------------------------------------------------------------------------
export function resolveImageUrl(urlOrPath: string): string {
  if (!urlOrPath || typeof urlOrPath !== 'string') return '';
  const trimmed = urlOrPath.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  let cleanPath = trimmed;
  if (cleanPath.startsWith('file:///')) {
    cleanPath = cleanPath.slice(8);
  } else if (cleanPath.startsWith('file://')) {
    cleanPath = cleanPath.slice(7);
  }

  return `/api/media/stream?path=${encodeURIComponent(cleanPath)}`;
}

// ---------------------------------------------------------------------------
// Helper: Trace preceding character in graph
// ---------------------------------------------------------------------------
function findPrecedingCharacterId(nodeId: string, nodes: Record<string, StoryNode>): string | null {
  for (const [id, n] of Object.entries(nodes)) {
    if (n.next_node === nodeId) {
      if (n.node_type === 'character' && n.metadata.character_id) {
        return n.metadata.character_id;
      }
      return findPrecedingCharacterId(id, nodes);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Reusable Multi-Directional Handles (Top, Bottom, Left, Right)
// Allows seamless horizontal & vertical connections with height differences
// ---------------------------------------------------------------------------
export const NodeHandles: React.FC<{
  isDark: boolean;
  hasRightSource?: boolean;
  hasBottomSource?: boolean;
}> = ({ isDark, hasRightSource = true, hasBottomSource = true }) => {
  const { t } = useTranslation();
  const targetClass = `!w-4 !h-4 !border-2 transition-all cursor-crosshair hover:scale-150 z-30 before:absolute before:-inset-2.5 before:content-[''] before:z-10 ${
    isDark
      ? '!bg-[#facc15] !border-[#0f0f12] hover:shadow-[0_0_10px_#facc15]'
      : '!bg-[#e11d48] !border-white hover:shadow-[0_0_10px_#e11d48]'
  }`;
  const sourceClass = `!w-4 !h-4 !border-2 transition-all cursor-crosshair hover:scale-150 z-30 before:absolute before:-inset-2.5 before:content-[''] before:z-10 ${
    isDark
      ? '!bg-[#facc15] !border-[#0f0f12] hover:shadow-[0_0_10px_#facc15]'
      : '!bg-[#e11d48] !border-white hover:shadow-[0_0_10px_#e11d48]'
  }`;

  return (
    <>
      {/* Target (Вход) Handles: Left & Top */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className={`${targetClass} -ml-2`}
        title={t.nodes.handleTargetLeft}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className={`${targetClass} -mt-2`}
        title={t.nodes.handleTargetTop}
      />

      {/* Source (Выход) Handles: Right & Bottom */}
      {hasRightSource && (
        <Handle
          type="source"
          position={Position.Right}
          id="source-right"
          className={`${sourceClass} -mr-2`}
          title={t.nodes.handleSourceRight}
        />
      )}
      {hasBottomSource && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="source-bottom"
          className={`${sourceClass} -mb-2`}
          title={t.nodes.handleSourceBottom}
        />
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// 1. ФОН СЦЕНЫ (BackgroundNode)
// ---------------------------------------------------------------------------
export const BackgroundNode = memo(({ id, data, selected }: FlowNodeProps) => {
  const { node, isDark = true } = data;
  const { t } = useTranslation();
  const updateNode = useStoryStore((s) => s.updateNode);
  const deleteNode = useStoryStore((s) => s.deleteNode);
  const unlinkLinearTarget = useStoryStore((s) => s.unlinkLinearTarget);
  const manifest = useStoryStore((s) => s.manifest);

  const targetNode = node.next_node ? manifest?.nodes[node.next_node] : undefined;
  const targetTitle = getLocalizedNodeTitle(targetNode, t);
  const bgImage = node.metadata.bg_image || '';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fullPath = (file as any).path;
      const pathOrName = fullPath || file.name;
      try {
        const objectUrl = URL.createObjectURL(file);
        setLocalPreview(objectUrl);
      } catch {
        // ignore
      }
      setImgError(false);
      updateNode({
        ...node,
        metadata: { ...node.metadata, bg_image: pathOrName },
      });
    }
    e.target.value = '';
  };

  const previewSrc = localPreview || resolveImageUrl(bgImage);

  return (
    <div
      className={`relative w-[290px] rounded-2xl border-2 transition-all shadow-xl ${
        isDark
          ? selected
            ? 'bg-[#18181b] border-yellow-400 ring-4 ring-yellow-400/20'
            : 'bg-[#18181b] border-[#2c2c32] hover:border-zinc-500'
          : selected
          ? 'bg-white border-rose-500 ring-4 ring-rose-500/20'
          : 'bg-white border-slate-200 hover:border-slate-400 shadow-slate-200/50'
      }`}
    >
      <NodeHandles isDark={isDark} />

      <div
        className={`p-2.5 border-b rounded-t-2xl flex items-center justify-between ${
          isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <ImageIcon className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
          <span className="text-xs font-extrabold uppercase tracking-wider font-mono">
            {t.nodes.backgroundTitle}
          </span>
        </div>
        <button
          onClick={() => deleteNode(id)}
          className={`nodrag p-1 rounded transition ${
            isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
          }`}
          title={t.nodes.deleteNodeTooltip}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-2">
        <div>
          <label className="text-[11px] font-semibold opacity-70 block mb-1">
            {t.nodes.bgImageUrlOrFile}
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={bgImage}
              onChange={(e) => {
                setLocalPreview(null);
                setImgError(false);
                updateNode({
                  ...node,
                  metadata: { ...node.metadata, bg_image: e.target.value },
                });
              }}
              placeholder="assets/bg_archive.png / URL"
              className={`nodrag flex-1 min-w-0 text-xs px-2.5 py-1.5 rounded-xl border focus:outline-none transition ${
                isDark
                  ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500'
              }`}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`nodrag p-1.5 rounded-xl border transition shrink-0 ${
                isDark
                  ? 'bg-[#18181b] border-[#2c2c32] text-yellow-400 hover:bg-[#25252b] hover:border-yellow-400/50'
                  : 'bg-white border-slate-200 text-rose-600 hover:bg-slate-100 hover:border-rose-300'
              }`}
              title={t.nodes.chooseBgFile || t.charactersModal?.openFilePickerTooltip}
            >
              <FolderOpen className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>

        {/* Thumbnail Preview */}
        <div
          className={`w-full h-24 rounded-xl overflow-hidden border border-zinc-700/50 bg-black/40 relative flex items-center justify-center transition`}
        >
          {previewSrc && !imgError ? (
            <img
              src={previewSrc}
              alt="Background Preview"
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
              onLoad={() => setImgError(false)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 text-zinc-400 select-none">
              <ImageIcon className="w-5 h-5 opacity-40" />
              <span className="text-[10px] opacity-60 font-medium">
                {imgError ? 'Preview unavailable' : (t.nodes.notAttachedHint || 'No image selected')}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="text-[10px] font-semibold opacity-60 block mb-0.5">{t.nodes.transitionEffect}:</label>
            <select
              value={node.metadata.bg_transition || 'fade'}
              onChange={(e) =>
                updateNode({
                  ...node,
                  metadata: { ...node.metadata, bg_transition: e.target.value as any },
                })
              }
              className={`nodrag w-full text-xs px-2 py-1 rounded-lg border focus:outline-none transition ${
                isDark
                  ? 'bg-[#121214] border-[#2c2c32] text-zinc-200 focus:border-yellow-400'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500'
              }`}
            >
              <option value="fade">Fade</option>
              <option value="cut">Cut</option>
              <option value="slide">Slide</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-dashed border-zinc-700/40">
          {node.next_node && targetTitle ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className={isDark ? 'text-yellow-400' : 'text-rose-600'}>→</span>
              <span className={`truncate text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                {targetTitle}
              </span>
              <button
                onClick={() => unlinkLinearTarget(id)}
                className={`nodrag p-0.5 ml-1 transition ${
                  isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                }`}
                title={t.canvas.deleteEdge}
              >
                <Unlink className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="text-[10px] italic opacity-60">
              {t.nodes.notAttachedHint}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
BackgroundNode.displayName = 'BackgroundNode';

// ---------------------------------------------------------------------------
// 2. МУЗЫКА СЦЕНЫ (MusicNode)
// ---------------------------------------------------------------------------
export const MusicNode = memo(({ id, data, selected }: FlowNodeProps) => {
  const { node, isDark = true } = data;
  const { t } = useTranslation();
  const updateNode = useStoryStore((s) => s.updateNode);
  const deleteNode = useStoryStore((s) => s.deleteNode);
  const unlinkLinearTarget = useStoryStore((s) => s.unlinkLinearTarget);
  const manifest = useStoryStore((s) => s.manifest);

  const targetNode = node.next_node ? manifest?.nodes[node.next_node] : undefined;
  const targetTitle = getLocalizedNodeTitle(targetNode, t);

  return (
    <div
      className={`relative w-[290px] rounded-2xl border-2 transition-all shadow-xl ${
        isDark
          ? selected
            ? 'bg-[#18181b] border-yellow-400 ring-4 ring-yellow-400/20'
            : 'bg-[#18181b] border-[#2c2c32] hover:border-zinc-500'
          : selected
          ? 'bg-white border-rose-500 ring-4 ring-rose-500/20'
          : 'bg-white border-slate-200 hover:border-slate-400 shadow-slate-200/50'
      }`}
    >
      <NodeHandles isDark={isDark} />

      <div
        className={`p-2.5 border-b rounded-t-2xl flex items-center justify-between ${
          isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Music className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
          <span className="text-xs font-extrabold uppercase tracking-wider font-mono">
            {t.nodes.musicTitle}
          </span>
        </div>
        <button
          onClick={() => deleteNode(id)}
          className={`nodrag p-1 rounded transition ${
            isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
          }`}
          title={t.nodes.deleteNodeTooltip}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-2">
        <div>
          <label className="text-[11px] font-semibold opacity-70 block mb-1">
            {t.nodes.musicAudioFile}
          </label>
          <input
            type="text"
            value={node.metadata.music_file || ''}
            onChange={(e) =>
              updateNode({
                ...node,
                metadata: { ...node.metadata, music_file: e.target.value },
              })
            }
            placeholder="ambient_silence.ogg"
            className={`nodrag w-full text-xs px-2.5 py-1.5 rounded-xl border focus:outline-none transition ${
              isDark
                ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500'
            }`}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={node.metadata.music_loop ?? true}
              onChange={(e) =>
                updateNode({
                  ...node,
                  metadata: { ...node.metadata, music_loop: e.target.checked },
                })
              }
              className="rounded accent-yellow-400"
            />
            <span className="opacity-80">Loop</span>
          </label>

          <div className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 opacity-60" />
            <span className="text-[11px] font-mono opacity-80">
              {node.metadata.music_volume ?? 80}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-dashed border-zinc-700/40">
          {node.next_node && targetTitle ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className={isDark ? 'text-yellow-400' : 'text-rose-600'}>→</span>
              <span className={`truncate text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                {targetTitle}
              </span>
              <button
                onClick={() => unlinkLinearTarget(id)}
                className={`nodrag p-0.5 ml-1 transition ${
                  isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                }`}
                title={t.canvas.deleteEdge}
              >
                <Unlink className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="text-[10px] italic opacity-60">
              {t.nodes.notAttachedHint}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
MusicNode.displayName = 'MusicNode';

// ---------------------------------------------------------------------------
// 3. ВИДЕО / КАТСЦЕНА (VideoNode)
// ---------------------------------------------------------------------------
export const VideoNode = memo(({ id, data, selected }: FlowNodeProps) => {
  const { node, isDark = true } = data;
  const { t } = useTranslation();
  const updateNode = useStoryStore((s) => s.updateNode);
  const deleteNode = useStoryStore((s) => s.deleteNode);
  const unlinkLinearTarget = useStoryStore((s) => s.unlinkLinearTarget);
  const manifest = useStoryStore((s) => s.manifest);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetNode = node.next_node ? manifest?.nodes[node.next_node] : undefined;
  const targetTitle = getLocalizedNodeTitle(targetNode, t);
  const videoFile = node.metadata.video_file || '';

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateNode({
        ...node,
        metadata: { ...node.metadata, video_file: file.name },
      });
    }
  };

  return (
    <div
      className={`relative w-[290px] rounded-2xl border-2 transition-all shadow-xl ${
        isDark
          ? selected
            ? 'bg-[#18181b] border-yellow-400 ring-4 ring-yellow-400/20'
            : 'bg-[#18181b] border-[#2c2c32] hover:border-zinc-500'
          : selected
          ? 'bg-white border-rose-500 ring-4 ring-rose-500/20'
          : 'bg-white border-slate-200 hover:border-slate-400 shadow-slate-200/50'
      }`}
    >
      <NodeHandles isDark={isDark} />

      <div
        className={`p-2.5 border-b rounded-t-2xl flex items-center justify-between ${
          isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Film className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
          <span className="text-xs font-extrabold uppercase tracking-wider font-mono">
            {t.nodes.videoTitle}
          </span>
        </div>
        <button
          onClick={() => deleteNode(id)}
          className={`nodrag p-1 rounded transition ${
            isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
          }`}
          title={t.nodes.deleteNodeTooltip}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-2">
        <label className="text-[11px] font-semibold opacity-70 block">
          {t.nodes.videoFileOrRef}
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            value={videoFile}
            onChange={(e) =>
              updateNode({
                ...node,
                metadata: { ...node.metadata, video_file: e.target.value },
              })
            }
            placeholder="intro_cutscene.mp4"
            className={`nodrag w-full text-xs px-2.5 py-1.5 rounded-xl border focus:outline-none transition ${
              isDark
                ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500'
            }`}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`nodrag p-2 rounded-xl border shadow-sm transition shrink-0 ${
              isDark
                ? 'bg-yellow-400/10 border-yellow-400/30 hover:bg-yellow-400/20 text-yellow-300'
                : 'bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-600'
            }`}
            title={t.nodes.chooseVideoFile}
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleVideoFileChange}
            accept="video/*"
            className="hidden"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={node.metadata.video_skippable ?? true}
              onChange={(e) =>
                updateNode({
                  ...node,
                  metadata: { ...node.metadata, video_skippable: e.target.checked },
                })
              }
              className="rounded accent-yellow-400"
            />
            <span className="opacity-80">Skip</span>
          </label>
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-dashed border-zinc-700/40">
          {node.next_node && targetTitle ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className={isDark ? 'text-yellow-400' : 'text-rose-600'}>→</span>
              <span className={`truncate text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                {targetTitle}
              </span>
              <button
                onClick={() => unlinkLinearTarget(id)}
                className={`nodrag p-0.5 ml-1 transition ${
                  isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                }`}
                title={t.canvas.deleteEdge}
              >
                <Unlink className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="text-[10px] italic opacity-60">
              {t.nodes.notAttachedHint}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
VideoNode.displayName = 'VideoNode';

// ---------------------------------------------------------------------------
// 4. ЭФФЕКТ / РЕЖИССУРА (EffectNode: текст + аудио SFX + мульти-изображения)
// ---------------------------------------------------------------------------
export const EffectNode = memo(({ id, data, selected }: FlowNodeProps) => {
  const { node, isDark = true } = data;
  const { t } = useTranslation();
  const updateNode = useStoryStore((s) => s.updateNode);
  const deleteNode = useStoryStore((s) => s.deleteNode);
  const unlinkLinearTarget = useStoryStore((s) => s.unlinkLinearTarget);
  const manifest = useStoryStore((s) => s.manifest);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  const targetNode = node.next_node ? manifest?.nodes[node.next_node] : undefined;
  const targetTitle = getLocalizedNodeTitle(targetNode, t);
  const effectImages = node.metadata.effect_images || [];

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateNode({
        ...node,
        metadata: { ...node.metadata, effect_audio_file: file.name },
      });
    }
  };

  const handleImagesAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newUrls = files.map((f) => f.name);
      updateNode({
        ...node,
        metadata: {
          ...node.metadata,
          effect_images: [...effectImages, ...newUrls],
        },
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = effectImages.filter((_, i) => i !== index);
    updateNode({
      ...node,
      metadata: { ...node.metadata, effect_images: updated },
    });
  };

  return (
    <div
      className={`relative w-[310px] rounded-2xl border-2 transition-all shadow-xl ${
        isDark
          ? selected
            ? 'bg-[#18181b] border-yellow-400 ring-4 ring-yellow-400/20'
            : 'bg-[#18181b] border-[#2c2c32] hover:border-zinc-500'
          : selected
          ? 'bg-white border-rose-500 ring-4 ring-rose-500/20'
          : 'bg-white border-slate-200 hover:border-slate-400 shadow-slate-200/50'
      }`}
    >
      <NodeHandles isDark={isDark} />

      <div
        className={`p-2.5 border-b rounded-t-2xl flex items-center justify-between ${
          isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Sparkles className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
          <span className="text-xs font-extrabold uppercase tracking-wider font-mono">
            {t.nodes.effectTitle}
          </span>
        </div>
        <button
          onClick={() => deleteNode(id)}
          className={`nodrag p-1 rounded transition ${
            isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
          }`}
          title={t.nodes.deleteNodeTooltip}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Текстовое описание эффекта */}
        <textarea
          rows={2}
          value={node.metadata.effect_text || ''}
          onChange={(e) =>
            updateNode({
              ...node,
              metadata: { ...node.metadata, effect_text: e.target.value },
            })
          }
          placeholder={t.nodes.directorNotes}
          className={`nodrag w-full text-xs p-2 rounded-xl border leading-relaxed resize-none focus:outline-none transition ${
            isDark
              ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
              : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500'
          }`}
        />

        {/* 1. Звуковой эффект (SFX) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold opacity-70 flex items-center gap-1">
              <Volume2 className="w-3 h-3" /> {t.nodes.sfxSound}:
            </label>
            <button
              onClick={() => audioInputRef.current?.click()}
              className={`nodrag text-xs font-semibold px-2 py-0.5 rounded-lg border shadow-sm transition flex items-center gap-1 ${
                isDark
                  ? 'bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border-yellow-400/30'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
              }`}
            >
              <Plus className="w-3 h-3 shrink-0" />
              <span>{t.nodes.chooseSfx}</span>
            </button>
            <input
              type="file"
              ref={audioInputRef}
              onChange={handleAudioChange}
              accept="audio/*"
              className="hidden"
            />
          </div>
          <input
            type="text"
            value={node.metadata.effect_audio_file || ''}
            onChange={(e) =>
              updateNode({
                ...node,
                metadata: { ...node.metadata, effect_audio_file: e.target.value },
              })
            }
            placeholder="footsteps_run.wav / punch.mp3"
            className={`nodrag w-full text-[11px] px-2 py-1 rounded-lg border font-mono focus:outline-none transition ${
              isDark
                ? 'bg-[#121214] border-[#2c2c32] text-zinc-200 focus:border-yellow-400'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500'
            }`}
          />
        </div>

        {/* 2. Мульти-изображения (кадры / спрайты для сборки анимации агентом) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold opacity-70 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> {t.nodes.visualOverlayOrFrame} ({effectImages.length}):
            </label>
            <button
              onClick={() => imagesInputRef.current?.click()}
              className={`nodrag text-xs font-semibold px-2 py-0.5 rounded-lg border shadow-sm transition flex items-center gap-1 ${
                isDark
                  ? 'bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border-yellow-400/30'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
              }`}
            >
              <Plus className="w-3 h-3 shrink-0" />
              <span>{t.nodes.chooseOverlay}</span>
            </button>
            <input
              type="file"
              ref={imagesInputRef}
              onChange={handleImagesAdd}
              multiple
              accept="image/*"
              className="hidden"
            />
          </div>

          {effectImages.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-xl border border-zinc-700/40 bg-black/20">
              {effectImages.map((img, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-300 border border-zinc-700"
                >
                  <span className="truncate max-w-[100px]">{img}</span>
                  <button
                    onClick={() => handleRemoveImage(i)}
                    className="text-zinc-500 hover:text-rose-400 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] italic opacity-50">
              {t.nodes.notAttachedHint}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-dashed border-zinc-700/40">
          {node.next_node && targetTitle ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className={isDark ? 'text-yellow-400' : 'text-rose-600'}>→</span>
              <span className={`truncate text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                {targetTitle}
              </span>
              <button
                onClick={() => unlinkLinearTarget(id)}
                className={`nodrag p-0.5 ml-1 transition ${
                  isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                }`}
                title={t.canvas.deleteEdge}
              >
                <Unlink className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="text-[10px] italic opacity-60">
              {t.nodes.notAttachedHint}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
EffectNode.displayName = 'EffectNode';

// ---------------------------------------------------------------------------
// 5. ПЕРСОНАЖ / ГЕРОЙ (CharacterNode)
// ---------------------------------------------------------------------------
export const CharacterNode = memo(({ id, data, selected }: FlowNodeProps) => {
  const { node, isDark = true } = data;
  const { t } = useTranslation();
  const updateNode = useStoryStore((s) => s.updateNode);
  const deleteNode = useStoryStore((s) => s.deleteNode);
  const unlinkLinearTarget = useStoryStore((s) => s.unlinkLinearTarget);
  const manifest = useStoryStore((s) => s.manifest);

  const charactersMap = manifest?.meta.characters || {};
  const charactersList = Object.values(charactersMap);
  const currentChar = charactersMap[node.metadata.character_id || ''] || charactersList[0];
  const targetNode = node.next_node ? manifest?.nodes[node.next_node] : undefined;
  const targetTitle = getLocalizedNodeTitle(targetNode, t);

  const handleSelectChar = (charId: string) => {
    const char = charactersMap[charId];
    updateNode({
      ...node,
      metadata: {
        ...node.metadata,
        character_id: charId,
        speaker_name: char?.name || charId,
      },
    });
  };

  return (
    <div
      className={`relative w-[290px] rounded-2xl border-2 transition-all shadow-xl ${
        isDark
          ? selected
            ? 'bg-[#18181b] border-yellow-400 ring-4 ring-yellow-400/20'
            : 'bg-[#18181b] border-[#2c2c32] hover:border-zinc-500'
          : selected
          ? 'bg-white border-rose-500 ring-4 ring-rose-500/20'
          : 'bg-white border-slate-200 hover:border-slate-400 shadow-slate-200/50'
      }`}
    >
      <NodeHandles isDark={isDark} />

      <div
        className={`p-2.5 border-b rounded-t-2xl flex items-center justify-between ${
          isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <User className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
          <span className="text-xs font-extrabold uppercase tracking-wider font-mono">
            {t.nodes.characterTitle}
          </span>
        </div>
        <button
          onClick={() => deleteNode(id)}
          className={`nodrag p-1 rounded transition ${
            isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
          }`}
          title={t.nodes.deleteNodeTooltip}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-2">
        <label className="text-[11px] font-semibold opacity-70 block">
          {t.nodes.activeCharacterInScene}
        </label>
        <select
          value={node.metadata.character_id || currentChar?.id || ''}
          onChange={(e) => handleSelectChar(e.target.value)}
          className={`nodrag w-full text-xs px-2.5 py-2 rounded-xl border focus:outline-none transition ${
            isDark
              ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
              : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500'
          }`}
        >
          {charactersList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.role === 'hero' ? t.charactersModal.roles.hero : c.role === 'narrator' ? t.charactersModal.roles.narrator : t.charactersModal.roles.npc})
            </option>
          ))}
        </select>

        {currentChar && (
          <div
            className={`flex items-center gap-2 p-2 rounded-xl text-xs ${
              isDark ? 'bg-[#121214]/60 text-zinc-300' : 'bg-slate-50 text-slate-700'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: currentChar.color || '#facc15' }}
            />
            <span className="truncate">{currentChar.description || currentChar.name}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-dashed border-zinc-700/40">
          {node.next_node && targetTitle ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className={isDark ? 'text-yellow-400' : 'text-rose-600'}>→</span>
              <span className={`truncate text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                {targetTitle}
              </span>
              <button
                onClick={() => unlinkLinearTarget(id)}
                className={`nodrag p-0.5 ml-1 transition ${
                  isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                }`}
                title={t.canvas.deleteEdge}
              >
                <Unlink className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="text-[10px] italic opacity-60">
              {t.nodes.notAttachedHint}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
CharacterNode.displayName = 'CharacterNode';

// ---------------------------------------------------------------------------
// 6. ЭМОЦИЯ ГЕРОЯ (EmotionNode: герой + связанные эмоции из карточки + автоподстановка)
// ---------------------------------------------------------------------------
export const EmotionNode = memo(({ id, data, selected }: FlowNodeProps) => {
  const { node, isDark = true } = data;
  const { t } = useTranslation();
  const updateNode = useStoryStore((s) => s.updateNode);
  const deleteNode = useStoryStore((s) => s.deleteNode);
  const unlinkLinearTarget = useStoryStore((s) => s.unlinkLinearTarget);
  const manifest = useStoryStore((s) => s.manifest);

  const charactersMap = manifest?.meta.characters || {};
  const charactersList = Object.values(charactersMap);

  // Auto-detect preceding character if not set
  const detectedCharId = useMemo(() => {
    if (node.metadata.character_id && charactersMap[node.metadata.character_id]) {
      return node.metadata.character_id;
    }
    const pre = manifest?.nodes ? findPrecedingCharacterId(id, manifest.nodes) : null;
    return pre || charactersList[0]?.id || 'hero';
  }, [node.metadata.character_id, manifest?.nodes, id, charactersList, charactersMap]);

  const selectedChar = charactersMap[detectedCharId] || charactersList[0];
  const charExpressions = selectedChar?.expressions || [];
  const targetNode = node.next_node ? manifest?.nodes[node.next_node] : undefined;
  const targetTitle = getLocalizedNodeTitle(targetNode, t);

  const handleCharChange = (newCharId: string) => {
    const char = charactersMap[newCharId];
    const defaultExpr = char?.expressions[0]?.name || 'neutral';
    updateNode({
      ...node,
      metadata: {
        ...node.metadata,
        character_id: newCharId,
        speaker_name: char?.name || newCharId,
        emotion_id: char?.expressions[0]?.id || 'neutral',
        emotion_name: defaultExpr,
      },
    });
  };

  const handleEmotionSelect = (exprName: string) => {
    const expr = charExpressions.find((e) => e.name === exprName);
    updateNode({
      ...node,
      metadata: {
        ...node.metadata,
        character_id: detectedCharId,
        emotion_id: expr?.id || exprName.toLowerCase(),
        emotion_name: exprName,
      },
    });
  };

  return (
    <div
      className={`relative w-[290px] rounded-2xl border-2 transition-all shadow-xl ${
        isDark
          ? selected
            ? 'bg-[#18181b] border-yellow-400 ring-4 ring-yellow-400/20'
            : 'bg-[#18181b] border-[#2c2c32] hover:border-zinc-500'
          : selected
          ? 'bg-white border-rose-500 ring-4 ring-rose-500/20'
          : 'bg-white border-slate-200 hover:border-slate-400 shadow-slate-200/50'
      }`}
    >
      <NodeHandles isDark={isDark} />

      <div
        className={`p-2.5 border-b rounded-t-2xl flex items-center justify-between ${
          isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Smile className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
          <span className="text-xs font-extrabold uppercase tracking-wider font-mono">
            {t.nodes.emotionTitle}
          </span>
        </div>
        <button
          onClick={() => deleteNode(id)}
          className={`nodrag p-1 rounded transition ${
            isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
          }`}
          title={t.nodes.deleteNodeTooltip}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Список 1: Выбор героя (с автоподстановкой) */}
        <div>
          <label className="text-[10px] font-semibold opacity-60 block mb-0.5">
            1. {t.nodes.characterTitle}:
          </label>
          <select
            value={detectedCharId}
            onChange={(e) => handleCharChange(e.target.value)}
            className={`nodrag w-full text-xs px-2.5 py-1.5 rounded-xl border focus:outline-none transition ${
              isDark
                ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500'
            }`}
          >
            {charactersList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Список 2: Связанные эмоции героя из его карточки */}
        <div>
          <label className="text-[10px] font-semibold opacity-60 block mb-0.5">
            2. {t.nodes.characterEmotion}:
          </label>
          <select
            value={node.metadata.emotion_name || charExpressions[0]?.name || ''}
            onChange={(e) => handleEmotionSelect(e.target.value)}
            className={`nodrag w-full text-xs px-2.5 py-1.5 rounded-xl border focus:outline-none transition ${
              isDark
                ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500'
            }`}
          >
            {charExpressions.length > 0 ? (
              charExpressions.map((expr) => (
                <option key={expr.id} value={expr.name}>
                  {expr.name}
                </option>
              ))
            ) : (
              <option value="neutral">{t.nodes.selectEmotion}</option>
            )}
          </select>
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-dashed border-zinc-700/40">
          {node.next_node && targetTitle ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className={isDark ? 'text-yellow-400' : 'text-rose-600'}>→</span>
              <span className={`truncate text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                {targetTitle}
              </span>
              <button
                onClick={() => unlinkLinearTarget(id)}
                className={`nodrag p-0.5 ml-1 transition ${
                  isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                }`}
                title={t.canvas.deleteEdge}
              >
                <Unlink className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="text-[10px] italic opacity-60">
              {t.nodes.notAttachedHint}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
EmotionNode.displayName = 'EmotionNode';

// ---------------------------------------------------------------------------
// 7. ВНЕШНОСТЬ ГЕРОЯ (AppearanceNode: герой + связанная внешность из карточки)
// ---------------------------------------------------------------------------
export const AppearanceNode = memo(({ id, data, selected }: FlowNodeProps) => {
  const { node, isDark = true } = data;
  const { t } = useTranslation();
  const updateNode = useStoryStore((s) => s.updateNode);
  const deleteNode = useStoryStore((s) => s.deleteNode);
  const unlinkLinearTarget = useStoryStore((s) => s.unlinkLinearTarget);
  const manifest = useStoryStore((s) => s.manifest);

  const charactersMap = manifest?.meta.characters || {};
  const charactersList = Object.values(charactersMap);

  // Auto-detect preceding character
  const detectedCharId = useMemo(() => {
    if (node.metadata.character_id && charactersMap[node.metadata.character_id]) {
      return node.metadata.character_id;
    }
    const pre = manifest?.nodes ? findPrecedingCharacterId(id, manifest.nodes) : null;
    return pre || charactersList[0]?.id || 'hero';
  }, [node.metadata.character_id, manifest?.nodes, id, charactersList, charactersMap]);

  const selectedChar = charactersMap[detectedCharId] || charactersList[0];
  const charAppearances = selectedChar?.appearances || [];
  const targetNode = node.next_node ? manifest?.nodes[node.next_node] : undefined;
  const targetTitle = getLocalizedNodeTitle(targetNode, t);

  const handleCharChange = (newCharId: string) => {
    const char = charactersMap[newCharId];
    const defaultApp = char?.appearances?.[0]?.name || 'default';
    updateNode({
      ...node,
      metadata: {
        ...node.metadata,
        character_id: newCharId,
        speaker_name: char?.name || newCharId,
        appearance_id: char?.appearances?.[0]?.id || 'default',
        appearance_name: defaultApp,
      },
    });
  };

  const handleAppSelect = (appName: string) => {
    const app = charAppearances.find((a) => a.name === appName);
    updateNode({
      ...node,
      metadata: {
        ...node.metadata,
        character_id: detectedCharId,
        appearance_id: app?.id || appName.toLowerCase(),
        appearance_name: appName,
      },
    });
  };

  return (
    <div
      className={`relative w-[290px] rounded-2xl border-2 transition-all shadow-xl ${
        isDark
          ? selected
            ? 'bg-[#18181b] border-yellow-400 ring-4 ring-yellow-400/20'
            : 'bg-[#18181b] border-[#2c2c32] hover:border-zinc-500'
          : selected
          ? 'bg-white border-rose-500 ring-4 ring-rose-500/20'
          : 'bg-white border-slate-200 hover:border-slate-400 shadow-slate-200/50'
      }`}
    >
      <NodeHandles isDark={isDark} />

      <div
        className={`p-2.5 border-b rounded-t-2xl flex items-center justify-between ${
          isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Shirt className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
          <span className="text-xs font-extrabold uppercase tracking-wider font-mono">
            {t.nodes.appearanceTitle}
          </span>
        </div>
        <button
          onClick={() => deleteNode(id)}
          className={`nodrag p-1 rounded transition ${
            isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
          }`}
          title={t.nodes.deleteNodeTooltip}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-2.5">
        <div>
          <label className="text-[10px] font-semibold opacity-60 block mb-0.5">
            1. {t.nodes.characterTitle}:
          </label>
          <select
            value={detectedCharId}
            onChange={(e) => handleCharChange(e.target.value)}
            className={`nodrag w-full text-xs px-2.5 py-1.5 rounded-xl border focus:outline-none transition ${
              isDark
                ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500'
            }`}
          >
            {charactersList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-semibold opacity-60 block mb-0.5">
            2. {t.nodes.costumeOrState}:
          </label>
          {charAppearances.length > 0 ? (
            <select
              value={node.metadata.appearance_name || charAppearances[0]?.name || ''}
              onChange={(e) => handleAppSelect(e.target.value)}
              className={`nodrag w-full text-xs px-2.5 py-1.5 rounded-xl border focus:outline-none transition ${
                isDark
                  ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500'
              }`}
            >
              {charAppearances.map((app) => (
                <option key={app.id} value={app.name}>
                  {app.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={node.metadata.appearance_name || ''}
              onChange={(e) => handleAppSelect(e.target.value)}
              placeholder={t.nodes.selectAppearance}
              className={`nodrag w-full text-xs px-2.5 py-1.5 rounded-xl border focus:outline-none transition ${
                isDark
                  ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500'
              }`}
            />
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-dashed border-zinc-700/40">
          {node.next_node && targetTitle ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className={isDark ? 'text-yellow-400' : 'text-rose-600'}>→</span>
              <span className={`truncate text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                {targetTitle}
              </span>
              <button
                onClick={() => unlinkLinearTarget(id)}
                className={`nodrag p-0.5 ml-1 transition ${
                  isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                }`}
                title={t.canvas.deleteEdge}
              >
                <Unlink className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="text-[10px] italic opacity-60">
              {t.nodes.notAttachedHint}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
AppearanceNode.displayName = 'AppearanceNode';

// ---------------------------------------------------------------------------
// 8. РЕПЛИКА / ДИАЛОГ (DialogueNode: фраза + выбор файла озвучки)
// ---------------------------------------------------------------------------
export const DialogueNode = memo(({ id, data, selected }: FlowNodeProps) => {
  const { node, isDark = true } = data;
  const { t } = useTranslation();
  const updateNode = useStoryStore((s) => s.updateNode);
  const deleteNode = useStoryStore((s) => s.deleteNode);
  const unlinkLinearTarget = useStoryStore((s) => s.unlinkLinearTarget);
  const manifest = useStoryStore((s) => s.manifest);

  const voiceFileInputRef = useRef<HTMLInputElement>(null);
  const targetNode = node.next_node ? manifest?.nodes[node.next_node] : undefined;
  const targetTitle = getLocalizedNodeTitle(targetNode, t);
  const voiceFile = node.metadata.voice_audio_file;

  const handleVoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateNode({
        ...node,
        metadata: { ...node.metadata, voice_audio_file: file.name },
      });
    }
  };

  const handleRemoveVoiceFile = () => {
    updateNode({
      ...node,
      metadata: { ...node.metadata, voice_audio_file: undefined },
    });
  };

  return (
    <div
      className={`relative w-[290px] rounded-2xl border-2 transition-all shadow-xl ${
        isDark
          ? selected
            ? 'bg-[#18181b] border-yellow-400 ring-4 ring-yellow-400/20'
            : 'bg-[#18181b] border-[#2c2c32] hover:border-zinc-500'
          : selected
          ? 'bg-white border-rose-500 ring-4 ring-rose-500/20'
          : 'bg-white border-slate-200 hover:border-slate-400 shadow-slate-200/50'
      }`}
    >
      <NodeHandles isDark={isDark} />

      <div
        className={`p-2.5 border-b rounded-t-2xl flex items-center justify-between ${
          isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <MessageSquareQuote
            className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`}
          />
          <span className="text-xs font-extrabold uppercase tracking-wider font-mono">
            {t.nodes.dialogueTitle}
          </span>
        </div>
        <button
          onClick={() => deleteNode(id)}
          className={`nodrag p-1 rounded transition ${
            isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
          }`}
          title={t.nodes.deleteNodeTooltip}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-2">
        <textarea
          rows={3}
          value={node.metadata.dialogue_text || ''}
          onChange={(e) =>
            updateNode({
              ...node,
              metadata: { ...node.metadata, dialogue_text: e.target.value },
            })
          }
          placeholder={t.nodes.dialoguePlaceholder}
          className={`nodrag w-full text-xs p-2.5 rounded-xl border leading-relaxed resize-none focus:outline-none transition ${
            isDark
              ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
              : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500'
          }`}
        />

        {/* Выбор файла озвучки */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold opacity-60">{t.nodes.voiceAudioFile}:</span>
            <button
              onClick={() => voiceFileInputRef.current?.click()}
              className={`nodrag text-xs font-semibold px-2.5 py-1 rounded-lg border shadow-sm transition flex items-center gap-1.5 ${
                isDark
                  ? 'bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border-yellow-400/30'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
              }`}
              title={t.nodes.chooseVoice}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{t.nodes.chooseVoice}</span>
            </button>
            <input
              type="file"
              ref={voiceFileInputRef}
              onChange={handleVoiceFileChange}
              accept="audio/*"
              className="hidden"
            />
          </div>

          {voiceFile && (
            <div
              className={`mt-1.5 p-1.5 rounded-lg flex items-center justify-between text-[11px] font-mono border ${
                isDark ? 'bg-[#121214] border-yellow-400/30 text-yellow-300' : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Volume2 className="w-3 h-3 shrink-0" />
                <span className="truncate">{voiceFile}</span>
              </div>
              <button
                onClick={handleRemoveVoiceFile}
                className="text-zinc-500 hover:text-rose-400 px-1"
                title={t.nodes.clearVoice}
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-dashed border-zinc-700/40">
          {node.next_node && targetTitle ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className={isDark ? 'text-yellow-400' : 'text-rose-600'}>→</span>
              <span className={`truncate text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                {targetTitle}
              </span>
              <button
                onClick={() => unlinkLinearTarget(id)}
                className={`nodrag p-0.5 ml-1 transition ${
                  isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                }`}
                title={t.canvas.deleteEdge}
              >
                <Unlink className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="text-[10px] italic opacity-60">
              {t.nodes.notAttachedHint}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
DialogueNode.displayName = 'DialogueNode';

// ---------------------------------------------------------------------------
// 9. РАЗВИЛКА / ВЫБОР (ChoiceNode)
// ---------------------------------------------------------------------------
export const ChoiceNode = memo(({ id, data, selected }: FlowNodeProps) => {
  const { node, isDark = true } = data;
  const { t } = useTranslation();
  const updateNode = useStoryStore((s) => s.updateNode);
  const deleteNode = useStoryStore((s) => s.deleteNode);
  const unlinkChoice = useStoryStore((s) => s.unlinkChoice);
  const manifest = useStoryStore((s) => s.manifest);

  const nodesMap = manifest?.nodes || {};

  const choices = Array.isArray(node.choices) ? node.choices : [];

  const handleAddChoice = () => {
    const newChoice: Choice = {
      id: `choice_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      label: '...',
      next_node: '',
    };
    updateNode({ ...node, choices: [...choices, newChoice] });
  };

  const handleChoiceChange = (choiceId: string, label: string) => {
    const updated = choices.map((c) => (c.id === choiceId ? { ...c, label } : c));
    updateNode({ ...node, choices: updated });
  };

  const handleDeleteChoice = (choiceId: string) => {
    const updated = choices.filter((c) => c.id !== choiceId);
    updateNode({ ...node, choices: updated });
  };

  return (
    <div
      className={`relative w-[320px] rounded-2xl border-2 transition-all shadow-xl ${
        isDark
          ? selected
            ? 'bg-[#18181b] border-yellow-400 ring-4 ring-yellow-400/20'
            : 'bg-[#18181b] border-[#2c2c32] hover:border-zinc-500'
          : selected
          ? 'bg-white border-rose-500 ring-4 ring-rose-500/20'
          : 'bg-white border-slate-200 hover:border-slate-400 shadow-slate-200/50'
      }`}
    >
      <NodeHandles isDark={isDark} hasRightSource={false} hasBottomSource={false} />

      <div
        className={`p-2.5 border-b rounded-t-2xl flex items-center justify-between ${
          isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <GitFork className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
          <span className="text-xs font-extrabold uppercase tracking-wider font-mono">
            {t.nodes.choiceTitle}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleAddChoice}
            className={`nodrag text-xs font-semibold px-2.5 py-1 rounded-lg border shadow-sm transition flex items-center gap-1 ${
              isDark
                ? 'bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border-yellow-400/30'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
            }`}
            title={t.nodes.addChoiceBtn}
          >
            <Plus className="w-3.5 h-3.5" /> {t.nodes.addChoiceBtn}
          </button>
          <button
            onClick={() => deleteNode(id)}
            className={`nodrag p-1 rounded transition ${
              isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
            }`}
            title={t.nodes.deleteNodeTooltip}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {choices.length === 0 ? (
          <div className="text-center py-4 text-xs opacity-60">
            {t.nodes.choicePlaceholder}
          </div>
        ) : (
          <div className="space-y-2">
            {choices.map((choice) => {
              const choiceTarget = (choice as any).target_node_id || choice.next_node;
              const isBound = choiceTarget && nodesMap[choiceTarget];
              const targetNode = isBound ? nodesMap[choiceTarget] : undefined;
              const targetTitle = isBound ? getLocalizedNodeTitle(targetNode, t) : null;

              return (
                <div
                  key={choice.id}
                  className={`p-2 rounded-xl border relative space-y-1 transition ${
                    isDark ? 'bg-[#121214] border-[#2c2c32]' : 'bg-slate-50 border-slate-200'
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
                        onChange={(e) => handleChoiceChange(choice.id, e.target.value)}
                        placeholder={t.nodes.choicePlaceholder}
                        className={`nodrag w-full text-xs font-bold px-1.5 py-0.5 rounded border border-transparent focus:outline-none transition ${
                          isDark
                            ? 'bg-transparent text-zinc-100 focus:border-yellow-400'
                            : 'bg-transparent text-slate-800 focus:border-rose-500'
                        }`}
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteChoice(choice.id)}
                      className={`nodrag p-1 transition ${
                        isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                      }`}
                      title={t.nodes.deleteChoiceTooltip}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pl-5 pr-1">
                    {isBound ? (
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={isDark ? 'text-yellow-400' : 'text-rose-600'}>→</span>
                        <span className={`truncate text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {targetTitle}
                        </span>
                        <button
                          onClick={() => unlinkChoice(id, choice.id)}
                          className={`nodrag p-0.5 ml-1 transition ${
                            isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                          }`}
                          title={t.canvas.deleteEdge}
                        >
                          <Unlink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] italic opacity-60">
                        {t.nodes.notAttachedHint}
                      </span>
                    )}
                  </div>

                  <Handle
                    type="source"
                    position={Position.Right}
                    id={choice.id}
                    className={`!w-4 !h-4 !border-2 -mr-2 transition-transform hover:scale-150 z-30 before:absolute before:-inset-2 before:content-[''] before:z-10 ${
                      isDark
                        ? '!bg-[#facc15] !border-[#0f0f12] hover:shadow-[0_0_10px_#facc15]'
                        : '!bg-[#e11d48] !border-white hover:shadow-[0_0_10px_#e11d48]'
                    }`}
                    title={t.nodes.handleSourceRight}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
ChoiceNode.displayName = 'ChoiceNode';

// ---------------------------------------------------------------------------
// 10. ПЕРЕМЕННАЯ / СТЕЙТ (VariableNode)
// ---------------------------------------------------------------------------
export const VariableNode = memo(({ id, data, selected }: FlowNodeProps) => {
  const { node, isDark = true } = data;
  const { t } = useTranslation();
  const updateNode = useStoryStore((s) => s.updateNode);
  const deleteNode = useStoryStore((s) => s.deleteNode);
  const unlinkLinearTarget = useStoryStore((s) => s.unlinkLinearTarget);
  const manifest = useStoryStore((s) => s.manifest);

  const targetNode = node.next_node ? manifest?.nodes[node.next_node] : undefined;
  const targetTitle = getLocalizedNodeTitle(targetNode, t);
  const varsMap = manifest?.meta.global_variables || {};
  const varNames = Object.keys(varsMap);

  return (
    <div
      className={`relative w-[290px] rounded-2xl border-2 transition-all shadow-xl ${
        isDark
          ? selected
            ? 'bg-[#18181b] border-yellow-400 ring-4 ring-yellow-400/20'
            : 'bg-[#18181b] border-[#2c2c32] hover:border-zinc-500'
          : selected
          ? 'bg-white border-rose-500 ring-4 ring-rose-500/20'
          : 'bg-white border-slate-200 hover:border-slate-400 shadow-slate-200/50'
      }`}
    >
      <NodeHandles isDark={isDark} />

      <div
        className={`p-2.5 border-b rounded-t-2xl flex items-center justify-between ${
          isDark ? 'bg-[#121214] border-[#28282d]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Database className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-rose-600'}`} />
          <span className="text-xs font-extrabold uppercase tracking-wider font-mono">
            {t.nodes.variableTitle}
          </span>
        </div>
        <button
          onClick={() => deleteNode(id)}
          className={`nodrag p-1 rounded transition ${
            isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
          }`}
          title={t.nodes.deleteNodeTooltip}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-2">
        <label className="text-[11px] font-semibold opacity-70 block">
          {t.nodes.varLabel}
        </label>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={node.metadata.variable_name || varNames[0] || ''}
            onChange={(e) =>
              updateNode({
                ...node,
                metadata: { ...node.metadata, variable_name: e.target.value },
              })
            }
            className={`nodrag text-xs px-2 py-1.5 rounded-lg border focus:outline-none transition ${
              isDark
                ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500'
            }`}
          >
            {varNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={String(node.metadata.variable_val ?? true)}
            onChange={(e) =>
              updateNode({
                ...node,
                metadata: { ...node.metadata, variable_val: e.target.value },
              })
            }
            placeholder={t.nodes.valueLabel}
            className={`nodrag text-xs px-2 py-1.5 rounded-lg border font-mono focus:outline-none transition ${
              isDark
                ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500'
            }`}
          />
        </div>

        {/* Agent Explanation / Context */}
        <div className="space-y-1">
          <label
            className={`text-[10px] font-mono uppercase tracking-wider block font-bold ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}
          >
            {t.variablesModal.descLabel}
          </label>
          <textarea
            rows={2}
            value={node.metadata.variable_desc || ''}
            onChange={(e) =>
              updateNode({
                ...node,
                metadata: { ...node.metadata, variable_desc: e.target.value },
              })
            }
            placeholder={t.variablesModal.descPlaceholder}
            className={`nodrag w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none transition resize-none ${
              isDark
                ? 'bg-[#121214] border-[#2c2c32] text-zinc-100 focus:border-yellow-400 placeholder:text-zinc-600'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-rose-500 placeholder:text-slate-400'
            }`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-dashed border-zinc-700/40">
          {node.next_node && targetTitle ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className={isDark ? 'text-yellow-400' : 'text-rose-600'}>→</span>
              <span className={`truncate text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                {targetTitle}
              </span>
              <button
                onClick={() => unlinkLinearTarget(id)}
                className={`nodrag p-0.5 ml-1 transition ${
                  isDark ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                }`}
                title={t.canvas.deleteEdge}
              >
                <Unlink className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="text-[10px] italic opacity-60">
              {t.nodes.notAttachedHint}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
VariableNode.displayName = 'VariableNode';
