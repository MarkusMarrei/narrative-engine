import { create } from 'zustand';
import type {
  MasterManifest,
  StoryNode,
  AuditReport,
  VariableDefinition,
  StoryAction,
  Choice,
  CharacterDefinition,
  SceneContainer,
  FlowNodeType,
  HardwareDiagnostics,
} from '@narrative-engine/shared';

interface StoryState {
  manifest: MasterManifest | null;
  selectedNodeId: string | null;
  auditReport: AuditReport | null;
  wsConnected: boolean;
  isSaving: boolean;
  isExporting: boolean;
  theme: 'dark' | 'light';
  hardware: HardwareDiagnostics | null;
  lowSpecMode: boolean;

  // Actions
  toggleTheme: () => void;
  toggleLowSpecMode: () => void;
  fetchHardware: () => Promise<void>;
  initWebSocket: () => void;
  fetchProject: () => Promise<void>;
  saveProject: () => Promise<void>;
  runAudit: () => Promise<void>;
  setSelectedNodeId: (id: string | null) => void;
  updateNode: (node: StoryNode) => void;
  createNode: (actId: string, title: string, position?: { x: number; y: number }) => void;
  createFlowNode: (
    type: FlowNodeType,
    sceneId?: string,
    position?: { x: number; y: number },
    initialData?: any
  ) => void;
  deleteNode: (nodeId: string) => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  updateScene: (scene: SceneContainer) => void;
  createScene: (
    title?: string,
    background_image?: string,
    background_music?: string,
    position?: { x: number; y: number }
  ) => void;
  deleteScene: (sceneId: string) => void;
  setStartNodeId: (nodeId: string) => void;
  setStartNodePosition: (pos: { x: number; y: number }) => void;
  setLinearTarget: (sourceId: string, targetId: string) => void;
  unlinkLinearTarget: (nodeId: string) => void;
  deleteEdge: (edgeId: string, sourceId: string, sourceHandle?: string | null) => void;
  addActionToNode: (nodeId: string, action: StoryAction) => void;
  removeActionFromNode: (nodeId: string, actionId: string) => void;
  updateActionInNode: (nodeId: string, action: StoryAction) => void;
  addChoiceToNode: (nodeId: string, choice: Choice) => void;
  removeChoiceFromNode: (nodeId: string, choiceId: string) => void;
  setChoiceTarget: (nodeId: string, choiceId: string, targetNodeId: string) => void;
  unlinkChoice: (nodeId: string, choiceId: string) => void;
  registerVariable: (variable: VariableDefinition) => void;
  deleteVariable: (varName: string) => void;
  registerCharacter: (character: CharacterDefinition) => void;
  deleteCharacter: (characterId: string) => void;
  importDraft: (rawText: string, projectTitle?: string) => Promise<any>;
  exportBundle: (targetEngine?: 'generic' | 'unity' | 'godot') => Promise<any>;
}

export function normalizeManifest(manifest: MasterManifest): MasterManifest {
  if (!manifest) return manifest;
  const scenes: SceneContainer[] = (manifest as any).scenes || manifest.meta?.scenes || manifest.meta?.acts || (manifest as any).acts || [];
  return {
    ...manifest,
    scenes,
    acts: scenes,
    meta: {
      ...manifest.meta,
      scenes,
      acts: scenes,
    },
  };
}

export const useStoryStore = create<StoryState>((set, get) => ({
  manifest: null,
  selectedNodeId: null,
  auditReport: null,
  wsConnected: false,
  isSaving: false,
  isExporting: false,
  theme: (localStorage.getItem('narrative_theme') as 'dark' | 'light') || 'dark',
  hardware: null,
  lowSpecMode: localStorage.getItem('narrative_low_spec') === 'true',

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('narrative_theme', nextTheme);
    set({ theme: nextTheme });
  },

  toggleLowSpecMode: () => {
    const nextMode = !get().lowSpecMode;
    localStorage.setItem('narrative_low_spec', String(nextMode));
    set({ lowSpecMode: nextMode });
  },

  fetchHardware: async () => {
    try {
      const res = await fetch('/api/system/hardware');
      if (res.ok) {
        const hardware = await res.json();
        set({ hardware });
      }
    } catch (err) {
      console.warn('Hardware diagnostics unavailable:', err);
    }
  },

  initWebSocket: () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let socket: WebSocket | null = null;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        set({ wsConnected: true });
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'INIT' || data.type === 'PROJECT_UPDATED') {
            set({ manifest: normalizeManifest(data.manifest) });
            get().runAudit();
          }
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      socket.onclose = () => {
        set({ wsConnected: false });
        setTimeout(connect, 2000); // Reconnect after 2s
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();
  },

  fetchProject: async () => {
    try {
      get().fetchHardware();
      const res = await fetch('/api/project');
      if (res.ok) {
        const manifest = await res.json();
        set({ manifest: normalizeManifest(manifest) });
        get().runAudit();
      }
    } catch (err) {
      console.error('Failed to fetch project:', err);
    }
  },

  saveProject: async () => {
    const { manifest } = get();
    if (!manifest) return;

    set({ isSaving: true });
    try {
      await fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manifest),
      });
      await get().runAudit();
    } catch (err) {
      console.error('Failed to save project:', err);
    } finally {
      set({ isSaving: false });
    }
  },

  runAudit: async () => {
    try {
      const res = await fetch('/api/audit');
      if (res.ok) {
        const auditReport = await res.json();
        set({ auditReport });
      }
    } catch (err) {
      console.error('Failed to run audit:', err);
    }
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  updateNode: (updatedNode) => {
    const { manifest } = get();
    if (!manifest) return;

    const newNodes = { ...manifest.nodes, [updatedNode.id]: updatedNode };
    const newManifest = {
      ...manifest,
      nodes: newNodes,
      meta: { ...manifest.meta, updated_at: new Date().toISOString() },
    };

    set({ manifest: newManifest });
    get().saveProject();
  },

  createNode: (actId, title, position) => {
    const { manifest } = get();
    if (!manifest) return;

    const id = `scene_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newNode: StoryNode = {
      id,
      title,
      metadata: { act: actId },
      sequence: [
        {
          id: `seq_${Date.now()}`,
          type: 'dialogue',
          speaker: 'Рассказчик',
          text: 'Новая сцена...',
        },
      ],
      choices: [],
      position: position || { x: 300, y: 300 },
    };

    const newNodes = { ...manifest.nodes, [id]: newNode };
    const newManifest = { ...manifest, nodes: newNodes };

    set({ manifest: newManifest, selectedNodeId: id });
    get().saveProject();
  },

  createFlowNode: (type, sceneId, position, initialData) => {
    const { manifest } = get();
    if (!manifest) return;

    const scenes = manifest.meta.scenes || manifest.meta.acts || [];
    const targetScene = sceneId ? scenes.find((s) => s.id === sceneId) : scenes[0];
    const activeSceneId = targetScene?.id || 'scene_1';

    const id = `node_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    let title = 'Новый шаг';
    const metadata: any = { scene: activeSceneId, act: activeSceneId };

    if (type === 'effect') {
      title = 'Эффект / Режиссура';
      metadata.effect_text =
        initialData?.effect_text ||
        'Плавное появление фона, нарастание тревожной музыки, мерцание свечей...';
      metadata.effect_audio_file = initialData?.effect_audio_file || '';
      metadata.effect_images = initialData?.effect_images || [];
    } else if (type === 'background') {
      title = 'Фон';
      metadata.bg_image =
        initialData?.bg_image ||
        'https://images.unsplash.com/photo-1507842229451-7f01be8610ce?q=80&w=1000';
      metadata.bg_transition = 'fade';
    } else if (type === 'music') {
      title = 'Музыка';
      metadata.music_file = initialData?.music_file || 'ambient_silence.ogg';
      metadata.music_loop = true;
      metadata.music_volume = 80;
    } else if (type === 'video') {
      title = 'Видео';
      metadata.video_file = initialData?.video_file || 'cinematic_intro.mp4';
      metadata.video_skippable = true;
      metadata.video_loop = false;
    } else if (type === 'character') {
      title = 'Персонаж';
      const firstChar = Object.values(manifest.meta.characters || {})[0];
      metadata.character_id = initialData?.character_id || firstChar?.id || 'hero';
      metadata.speaker_name = initialData?.speaker_name || firstChar?.name || 'Странник';
    } else if (type === 'emotion') {
      title = 'Эмоция героя';
      const firstChar = Object.values(manifest.meta.characters || {})[0];
      metadata.character_id = initialData?.character_id || firstChar?.id || 'hero';
      metadata.speaker_name = initialData?.speaker_name || firstChar?.name || 'Странник';
      metadata.emotion_id = initialData?.emotion_id || firstChar?.expressions[0]?.id || 'neutral';
      metadata.emotion_name = initialData?.emotion_name || firstChar?.expressions[0]?.name || 'Спокойное';
    } else if (type === 'appearance') {
      title = 'Внешность героя';
      const firstChar = Object.values(manifest.meta.characters || {})[0];
      metadata.character_id = initialData?.character_id || firstChar?.id || 'hero';
      metadata.speaker_name = initialData?.speaker_name || firstChar?.name || 'Странник';
      metadata.appearance_id = initialData?.appearance_id || 'default';
      metadata.appearance_name = initialData?.appearance_name || 'Обычный вид';
    } else if (type === 'dialogue') {
      title = 'Реплика';
      metadata.dialogue_text = initialData?.dialogue_text || 'Текст реплики персонажа...';
      metadata.voice_audio_file = initialData?.voice_audio_file || '';
    } else if (type === 'choice') {
      title = 'Развилка';
    } else if (type === 'variable') {
      title = 'Переменная';
      const firstVar = Object.keys(manifest.meta.global_variables || {})[0] || 'has_ancient_key';
      metadata.variable_name = firstVar;
      metadata.variable_op = 'set';
      metadata.variable_val = true;
    }

    const newNode: StoryNode = {
      id,
      title,
      node_type: type,
      scene_id: activeSceneId,
      metadata,
      sequence: [],
      choices:
        type === 'choice'
          ? [
              { id: `ch_${Date.now()}_1`, label: 'Осмотреть стол', next_node: '' },
              { id: `ch_${Date.now()}_2`, label: 'Подойти к вратам', next_node: '' },
            ]
          : [],
      position:
        position || {
          x: (targetScene?.position?.x || 100) + 120,
          y: (targetScene?.position?.y || 100) + 180,
        },
    };

    const newNodes = { ...manifest.nodes, [id]: newNode };
    const newManifest = { ...manifest, nodes: newNodes };
    set({ manifest: newManifest, selectedNodeId: id });
    get().saveProject();
  },

  updateScene: (updatedScene) => {
    const { manifest } = get();
    if (!manifest) return;

    const scenes: SceneContainer[] = (manifest as any).scenes || manifest.meta.scenes || manifest.meta.acts || (manifest as any).acts || [];
    const newScenes = scenes.map((s) => (s.id === updatedScene.id ? updatedScene : s));

    const newManifest: MasterManifest = {
      ...manifest,
      scenes: newScenes,
      acts: newScenes,
      meta: {
        ...manifest.meta,
        scenes: newScenes,
        acts: newScenes,
        updated_at: new Date().toISOString(),
      },
    };

    set({ manifest: newManifest });
    get().saveProject();
  },

  createScene: (title, background_image, background_music, position) => {
    const { manifest } = get();
    if (!manifest) return;

    const scenes: SceneContainer[] = (manifest as any).scenes || manifest.meta.scenes || manifest.meta.acts || (manifest as any).acts || [];
    const nextOrder = scenes.length + 1;
    const id = `scene_${Date.now()}`;
    const newScene: SceneContainer = {
      id,
      title: title || `Сцена ${nextOrder}`,
      order: nextOrder,
      color: '#facc15',
      description: 'Описание сцены...',
      background_image: background_image || '',
      background_music: background_music || '',
      position: position || { x: (nextOrder - 1) * 1400 + 50, y: 50 },
      dimensions: { width: 1300, height: 750 },
    };

    const newScenes = [...scenes, newScene];
    const newManifest: MasterManifest = {
      ...manifest,
      scenes: newScenes,
      acts: newScenes,
      meta: {
        ...manifest.meta,
        scenes: newScenes,
        acts: newScenes,
        updated_at: new Date().toISOString(),
      },
    };

    set({ manifest: newManifest });
    get().saveProject();
  },

  deleteScene: (sceneId) => {
    const { manifest } = get();
    if (!manifest) return;

    const scenes: SceneContainer[] = (manifest as any).scenes || manifest.meta.scenes || manifest.meta.acts || (manifest as any).acts || [];
    const newScenes = scenes.filter((s) => s.id !== sceneId);

    const newManifest: MasterManifest = {
      ...manifest,
      scenes: newScenes,
      acts: newScenes,
      meta: {
        ...manifest.meta,
        scenes: newScenes,
        acts: newScenes,
        updated_at: new Date().toISOString(),
      },
    };

    set({ manifest: newManifest });
    get().saveProject();
  },

  setStartNodeId: (nodeId) => {
    const { manifest } = get();
    if (!manifest) return;
    const newManifest = {
      ...manifest,
      start_node_id: nodeId,
      meta: { ...manifest.meta, updated_at: new Date().toISOString() },
    };
    set({ manifest: newManifest });
    get().saveProject();
  },

  setStartNodePosition: (pos) => {
    const { manifest } = get();
    if (!manifest) return;
    const newManifest = {
      ...manifest,
      meta: {
        ...manifest.meta,
        start_node_position: pos,
        updated_at: new Date().toISOString(),
      },
    };
    set({ manifest: newManifest });
    get().saveProject();
  },

  setLinearTarget: (sourceId, targetId) => {
    if (sourceId === 'start_node') {
      get().setStartNodeId(targetId);
      return;
    }
    const { manifest } = get();
    if (!manifest || !manifest.nodes[sourceId]) return;

    const node = { ...manifest.nodes[sourceId], next_node: targetId };
    get().updateNode(node);
  },

  unlinkLinearTarget: (nodeId) => {
    const { manifest } = get();
    if (!manifest || !manifest.nodes[nodeId]) return;

    const node = { ...manifest.nodes[nodeId], next_node: undefined };
    get().updateNode(node);
  },

  deleteEdge: (_edgeId, sourceId, sourceHandle) => {
    const { manifest } = get();
    if (!manifest || !manifest.nodes[sourceId]) return;

    if (sourceHandle) {
      get().unlinkChoice(sourceId, sourceHandle);
    } else {
      get().unlinkLinearTarget(sourceId);
    }
  },

  deleteNode: (nodeId) => {
    if (nodeId === 'start_node') return; // The Start Node is indestructible
    const { manifest, selectedNodeId } = get();
    if (!manifest) return;

    const newNodes = { ...manifest.nodes };
    delete newNodes[nodeId];

    // Clean up incoming choices referencing this node
    for (const n of Object.values(newNodes)) {
      n.choices = n.choices.filter((c) => c.next_node !== nodeId);
    }

    const newManifest = { ...manifest, nodes: newNodes };
    set({
      manifest: newManifest,
      selectedNodeId: selectedNodeId === nodeId ? null : selectedNodeId,
    });
    get().saveProject();
  },

  updateNodePosition: (nodeId, position) => {
    const { manifest } = get();
    if (!manifest) return;

    if (nodeId === 'start_node') {
      get().setStartNodePosition(position);
      return;
    }

    if (nodeId.startsWith('group_')) {
      const sceneId = nodeId.replace(/^group_/, '');
      const scenes: SceneContainer[] = (manifest as any).scenes || manifest.meta.scenes || manifest.meta.acts || (manifest as any).acts || [];
      const newScenes = scenes.map((s) => (s.id === sceneId ? { ...s, position } : s));
      const newManifest: MasterManifest = {
        ...manifest,
        scenes: newScenes,
        acts: newScenes,
        meta: {
          ...manifest.meta,
          scenes: newScenes,
          acts: newScenes,
        },
      };
      set({ manifest: newManifest });
      return;
    }

    if (!manifest.nodes[nodeId]) return;
    manifest.nodes[nodeId].position = position;
    // Don't trigger heavy full network save on every pixel drag, but keep local state synced
    set({ manifest: { ...manifest } });
  },

  addActionToNode: (nodeId, action) => {
    const { manifest } = get();
    if (!manifest || !manifest.nodes[nodeId]) return;

    const node = manifest.nodes[nodeId];
    node.sequence.push(action);
    get().updateNode(node);
  },

  removeActionFromNode: (nodeId, actionId) => {
    const { manifest } = get();
    if (!manifest || !manifest.nodes[nodeId]) return;

    const node = manifest.nodes[nodeId];
    node.sequence = node.sequence.filter((a) => a.id !== actionId);
    get().updateNode(node);
  },

  updateActionInNode: (nodeId, action) => {
    const { manifest } = get();
    if (!manifest || !manifest.nodes[nodeId]) return;

    const node = manifest.nodes[nodeId];
    node.sequence = node.sequence.map((a) => (a.id === action.id ? action : a));
    get().updateNode(node);
  },

  addChoiceToNode: (nodeId, choice) => {
    const { manifest } = get();
    if (!manifest || !manifest.nodes[nodeId]) return;

    const node = manifest.nodes[nodeId];
    // Ensure no automatic binding unless explicitly specified
    node.choices.push({ ...choice, next_node: choice.next_node || '' });
    get().updateNode(node);
  },

  setChoiceTarget: (nodeId, choiceId, targetNodeId) => {
    const { manifest } = get();
    if (!manifest || !manifest.nodes[nodeId]) return;

    const node = manifest.nodes[nodeId];
    node.choices = node.choices.map((c) =>
      c.id === choiceId ? { ...c, next_node: targetNodeId } : c
    );
    get().updateNode(node);
  },

  unlinkChoice: (nodeId, choiceId) => {
    const { manifest } = get();
    if (!manifest || !manifest.nodes[nodeId]) return;

    const node = manifest.nodes[nodeId];
    node.choices = node.choices.map((c) =>
      c.id === choiceId ? { ...c, next_node: '' } : c
    );
    get().updateNode(node);
  },

  removeChoiceFromNode: (nodeId, choiceId) => {
    const { manifest } = get();
    if (!manifest || !manifest.nodes[nodeId]) return;

    const node = manifest.nodes[nodeId];
    node.choices = node.choices.filter((c) => c.id !== choiceId);
    get().updateNode(node);
  },

  registerVariable: (variable) => {
    const { manifest } = get();
    if (!manifest) return;

    const newVars = { ...manifest.meta.global_variables, [variable.name]: variable };
    const newManifest = {
      ...manifest,
      meta: { ...manifest.meta, global_variables: newVars },
    };

    set({ manifest: newManifest });
    get().saveProject();
  },

  deleteVariable: (varName) => {
    const { manifest } = get();
    if (!manifest) return;

    const newVars = { ...manifest.meta.global_variables };
    delete newVars[varName];

    const newManifest = {
      ...manifest,
      meta: { ...manifest.meta, global_variables: newVars },
    };

    set({ manifest: newManifest });
    get().saveProject();
  },

  registerCharacter: (character) => {
    const { manifest } = get();
    if (!manifest) return;

    const currentChars = manifest.meta.characters || {};
    const newChars = { ...currentChars, [character.id]: character };
    const newManifest = {
      ...manifest,
      meta: { ...manifest.meta, characters: newChars },
    };

    set({ manifest: newManifest });
    get().saveProject();
  },

  deleteCharacter: (characterId) => {
    const { manifest } = get();
    if (!manifest || !manifest.meta.characters) return;

    const newChars = { ...manifest.meta.characters };
    delete newChars[characterId];

    const newManifest = {
      ...manifest,
      meta: { ...manifest.meta, characters: newChars },
    };

    set({ manifest: newManifest });
    get().saveProject();
  },

  importDraft: async (rawText, projectTitle) => {
    const res = await fetch('/api/import-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: rawText, project_title: projectTitle }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Ошибка импорта черновика');
    }

    const result = await res.json();
    set({ manifest: result.manifest });
    await get().runAudit();
    return result;
  },

  exportBundle: async (targetEngine = 'generic') => {
    set({ isExporting: true });
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_engine: targetEngine }),
      });

      if (!res.ok) {
        throw new Error('Ошибка экспорта архива');
      }

      return await res.json();
    } finally {
      set({ isExporting: false });
    }
  },
}));
