export type ActionType =
  | 'show_background'
  | 'play_music'
  | 'stop_music'
  | 'play_sfx'
  | 'dialogue'
  | 'character_sprite'
  | 'camera_effect'
  | 'set_variable'
  | 'wait';

export interface BaseAction {
  id: string;
  type: ActionType;
}

export interface ShowBackgroundAction extends BaseAction {
  type: 'show_background';
  asset_id: string;
  transition?: 'cut' | 'fade' | 'slide_left' | 'slide_right';
  duration_ms?: number;
}

export interface PlayMusicAction extends BaseAction {
  type: 'play_music';
  asset_id: string;
  loop?: boolean;
  volume?: number; // 0.0 to 1.0
  fade_in_ms?: number;
}

export interface StopMusicAction extends BaseAction {
  type: 'stop_music';
  fade_out_ms?: number;
}

export interface PlaySfxAction extends BaseAction {
  type: 'play_sfx';
  asset_id: string;
  volume?: number;
}

export interface CharacterExpression {
  id: string; // e.g. 'neutral', 'happy', 'angry', 'sad', 'surprised'
  name: string; // 'Спокойное', 'Радостное', 'Угрюмое'
  sprite_asset_id?: string; // Reference to asset_registry or path
}

export interface CharacterAppearance {
  id: string; // e.g. 'default', 'wounded', 'armor', 'hood'
  name: string; // e.g. 'Обычный вид', 'Раненый', 'Боевые доспехи'
  description?: string;
  sprite_asset_id?: string;
}

export type CharacterRole = 'hero' | 'companion' | 'npc' | 'narrator';

export interface CharacterDefinition {
  id: string;
  name: string;
  role: CharacterRole;
  color?: string; // e.g. '#38bdf8'
  description?: string;
  avatar_asset_id?: string;
  expressions: CharacterExpression[];
  appearances?: CharacterAppearance[];
}

export interface DialogueAction extends BaseAction {
  type: 'dialogue';
  speaker: string;
  character_id?: string;
  expression?: string; // id of emotion from CharacterDefinition.expressions
  text: string;
  mood?: string;
  voice_asset_id?: string;
}

export interface CharacterSpriteAction extends BaseAction {
  type: 'character_sprite';
  character_id: string;
  asset_id?: string;
  pose?: string; // 'neutral' | 'angry' | 'smile' etc.
  position: 'left' | 'center' | 'right';
  visible: boolean;
  transition?: 'fade' | 'slide' | 'instant';
}

export interface CameraEffectAction extends BaseAction {
  type: 'camera_effect';
  effect: 'shake' | 'flash' | 'fade_in' | 'fade_out' | 'zoom_in' | 'zoom_out';
  duration_ms?: number;
  color?: string; // e.g. '#ffffff' for flash, '#000000' for fade
}

export interface SetVariableAction extends BaseAction {
  type: 'set_variable';
  variable: string;
  operation: 'set' | 'add' | 'subtract' | 'toggle';
  value: boolean | number | string;
}

export interface WaitAction extends BaseAction {
  type: 'wait';
  duration_ms: number;
}

export type StoryAction =
  | ShowBackgroundAction
  | PlayMusicAction
  | StopMusicAction
  | PlaySfxAction
  | DialogueAction
  | CharacterSpriteAction
  | CameraEffectAction
  | SetVariableAction
  | WaitAction;

export interface ChoiceCondition {
  variable: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: boolean | number | string;
}

export interface Choice {
  id: string;
  label: string;
  text?: string;
  next_node: string;
  target_node_id?: string;
  condition?: ChoiceCondition;
  effects?: Record<string, boolean | number | string>;
}

export interface NodePosition {
  x: number;
  y: number;
}

export type FlowNodeType =
  | 'effect'
  | 'character'
  | 'emotion'
  | 'appearance'
  | 'dialogue'
  | 'background'
  | 'music'
  | 'video'
  | 'choice'
  | 'variable'
  | 'story_card';

export interface StoryNode {
  id: string;
  title: string;
  node_type?: FlowNodeType;
  scene_id?: string;
  linear_target?: string;
  next_node?: string; // For linear connections (effect, character, emotion, dialogue, variable, etc.)
  content?: string;
  parameters?: Record<string, any>;
  metadata: {
    act?: string;
    scene?: string;
    is_terminal?: boolean;
    tags?: string[];
    notes?: string;
    // Atomic node specific payload:
    effect_text?: string;
    effect_audio_file?: string;
    effect_images?: string[]; // Array of image URLs/paths for sprite animation
    character_id?: string;
    speaker_name?: string;
    emotion_id?: string;
    emotion_name?: string;
    appearance_id?: string;
    appearance_name?: string;
    dialogue_text?: string;
    voice_audio_file?: string;
    bg_image?: string;
    bg_transition?: 'fade' | 'cut' | 'slide';
    music_file?: string;
    music_loop?: boolean;
    music_volume?: number;
    video_file?: string;
    video_skippable?: boolean;
    video_loop?: boolean;
    variable_name?: string;
    variable_op?: string;
    variable_val?: boolean | number | string;
    variable_desc?: string;
  };
  sequence: StoryAction[];
  choices: Choice[];
  position?: NodePosition;
}

export interface SceneContainer {
  id: string;
  title: string;
  order: number;
  color: string;
  description?: string;
  background_image?: string; // Scene background image (URL, path or asset ID)
  background_music?: string; // Scene background music (URL, path or asset ID)
  position?: NodePosition;
  dimensions?: { width: number; height: number };
}

export type ActContainer = SceneContainer; // Backward compatibility

export interface AssetItem {
  id: string;
  name: string;
  type: 'image' | 'audio' | 'video' | 'font';
  local_path: string; // Absolute path on author's PC
  relative_path?: string; // Export relative path e.g. "assets/bg_tavern.png"
  file_size?: number;
  mime_type?: string;
}

export type VariableType = 'boolean' | 'number' | 'string';

export interface VariableDefinition {
  name: string;
  type: VariableType;
  default_value: boolean | number | string;
  description?: string;
}

export interface ProjectMeta {
  schema_version: '1.0';
  title: string;
  author?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  global_variables: Record<string, VariableDefinition>;
  characters?: Record<string, CharacterDefinition>;
  scenes?: SceneContainer[];
  acts: SceneContainer[]; // Retained for compatibility
  start_node_position?: NodePosition;
}

export interface MasterManifest {
  meta: ProjectMeta;
  scenes?: SceneContainer[];
  acts?: ActContainer[];
  asset_registry: Record<string, AssetItem>;
  nodes: Record<string, StoryNode>;
  start_node_id: string;
}

export type AuditSeverity = 'error' | 'warning' | 'info';

export type AuditCode =
  | 'DEAD_END'
  | 'ORPHAN_NODE'
  | 'CIRCULAR_LOOP'
  | 'UNDEFINED_VARIABLE'
  | 'INVALID_TYPE_COMPARISON'
  | 'MISSING_ASSET'
  | 'EMPTY_SEQUENCE'
  | 'NO_START_NODE'
  | 'INVALID_START_NODE';

export interface AuditIssue {
  severity: AuditSeverity;
  code: AuditCode;
  node_id?: string;
  message: string;
  suggestion?: string;
}

export interface AuditReport {
  is_valid: boolean;
  maturity_score: number; // 0 - 100%
  errors_count: number;
  warnings_count: number;
  issues: AuditIssue[];
}

export interface DraftSceneChunk {
  title: string;
  act_id: string;
  speaker?: string;
  dialogue_lines: Array<{ speaker: string; text: string }>;
  suggested_choices?: Array<{ label: string; target_title?: string }>;
}

export interface DraftImportRequest {
  raw_text: string;
  project_title?: string;
  default_act_id?: string;
}

export interface DraftImportResult {
  created_nodes_count: number;
  created_acts_count: number;
  start_node_id: string;
  manifest: MasterManifest;
}

export interface GpuDevice {
  vendor: 'NVIDIA' | 'AMD' | 'Intel' | 'Apple' | 'Unknown';
  name: string;
  type: 'discrete' | 'integrated' | 'unified' | 'unknown';
  vramMb?: number;
  driver?: string;
  accelerator: 'cuda' | 'vulkan' | 'metal' | 'cpu';
}

export interface HardwareDiagnostics {
  os: string;
  platform: string;
  arch: string;
  cpuModel: string;
  cpuCores: number;
  totalMemoryMb: number;
  freeMemoryMb: number;
  gpus: GpuDevice[];
  activeAccelerator: {
    backend: 'cuda' | 'vulkan' | 'metal' | 'cpu';
    name: string;
    description: string;
    targetDevice: string;
  };
  vulkanSupported: boolean;
}
