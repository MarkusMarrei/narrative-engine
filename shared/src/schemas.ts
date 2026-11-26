import { z } from 'zod';

export const ActionTypeSchema = z.enum([
  'show_background',
  'play_music',
  'stop_music',
  'play_sfx',
  'dialogue',
  'character_sprite',
  'camera_effect',
  'set_variable',
  'wait',
]);

export const ShowBackgroundActionSchema = z.object({
  id: z.string(),
  type: z.literal('show_background'),
  asset_id: z.string(),
  transition: z.enum(['cut', 'fade', 'slide_left', 'slide_right']).optional(),
  duration_ms: z.number().optional(),
});

export const PlayMusicActionSchema = z.object({
  id: z.string(),
  type: z.literal('play_music'),
  asset_id: z.string(),
  loop: z.boolean().optional(),
  volume: z.number().min(0).max(1).optional(),
  fade_in_ms: z.number().optional(),
});

export const StopMusicActionSchema = z.object({
  id: z.string(),
  type: z.literal('stop_music'),
  fade_out_ms: z.number().optional(),
});

export const PlaySfxActionSchema = z.object({
  id: z.string(),
  type: z.literal('play_sfx'),
  asset_id: z.string(),
  volume: z.number().min(0).max(1).optional(),
});

export const CharacterExpressionSchema = z.object({
  id: z.string(),
  name: z.string(),
  sprite_asset_id: z.string().optional(),
});

export const CharacterAppearanceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  sprite_asset_id: z.string().optional(),
});

export const CharacterDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['hero', 'companion', 'npc', 'narrator']),
  color: z.string().optional(),
  description: z.string().optional(),
  avatar_asset_id: z.string().optional(),
  expressions: z.array(CharacterExpressionSchema),
  appearances: z.array(CharacterAppearanceSchema).optional(),
});

export const DialogueActionSchema = z.object({
  id: z.string(),
  type: z.literal('dialogue'),
  speaker: z.string(),
  character_id: z.string().optional(),
  expression: z.string().optional(),
  text: z.string(),
  mood: z.string().optional(),
  voice_asset_id: z.string().optional(),
});

export const CharacterSpriteActionSchema = z.object({
  id: z.string(),
  type: z.literal('character_sprite'),
  character_id: z.string(),
  asset_id: z.string().optional(),
  pose: z.string().optional(),
  position: z.enum(['left', 'center', 'right']),
  visible: z.boolean(),
  transition: z.enum(['fade', 'slide', 'instant']).optional(),
});

export const CameraEffectActionSchema = z.object({
  id: z.string(),
  type: z.literal('camera_effect'),
  effect: z.enum(['shake', 'flash', 'fade_in', 'fade_out', 'zoom_in', 'zoom_out']),
  duration_ms: z.number().optional(),
  color: z.string().optional(),
});

export const SetVariableActionSchema = z.object({
  id: z.string(),
  type: z.literal('set_variable'),
  variable: z.string(),
  operation: z.enum(['set', 'add', 'subtract', 'toggle']),
  value: z.union([z.boolean(), z.number(), z.string()]),
});

export const WaitActionSchema = z.object({
  id: z.string(),
  type: z.literal('wait'),
  duration_ms: z.number().nonnegative(),
});

export const StoryActionSchema = z.discriminatedUnion('type', [
  ShowBackgroundActionSchema,
  PlayMusicActionSchema,
  StopMusicActionSchema,
  PlaySfxActionSchema,
  DialogueActionSchema,
  CharacterSpriteActionSchema,
  CameraEffectActionSchema,
  SetVariableActionSchema,
  WaitActionSchema,
]);

export const ChoiceConditionSchema = z.object({
  variable: z.string(),
  operator: z.enum(['==', '!=', '>', '<', '>=', '<=']),
  value: z.union([z.boolean(), z.number(), z.string()]),
});

export const ChoiceSchema = z.object({
  id: z.string(),
  label: z.string(),
  next_node: z.string(),
  condition: ChoiceConditionSchema.optional(),
  effects: z.record(z.union([z.boolean(), z.number(), z.string()])).optional(),
});

export const FlowNodeTypeSchema = z.enum([
  'effect',
  'character',
  'emotion',
  'appearance',
  'dialogue',
  'background',
  'music',
  'video',
  'choice',
  'variable',
  'story_card',
]);

export const StoryNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  node_type: FlowNodeTypeSchema.optional(),
  scene_id: z.string().optional(),
  next_node: z.string().optional(),
  metadata: z.object({
    act: z.string().optional(),
    scene: z.string().optional(),
    is_terminal: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
    effect_text: z.string().optional(),
    effect_audio_file: z.string().optional(),
    effect_images: z.array(z.string()).optional(),
    character_id: z.string().optional(),
    speaker_name: z.string().optional(),
    emotion_id: z.string().optional(),
    emotion_name: z.string().optional(),
    appearance_id: z.string().optional(),
    appearance_name: z.string().optional(),
    dialogue_text: z.string().optional(),
    voice_audio_file: z.string().optional(),
    bg_image: z.string().optional(),
    bg_transition: z.enum(['fade', 'cut', 'slide']).optional(),
    music_file: z.string().optional(),
    music_loop: z.boolean().optional(),
    music_volume: z.number().optional(),
    video_file: z.string().optional(),
    video_skippable: z.boolean().optional(),
    video_loop: z.boolean().optional(),
    variable_name: z.string().optional(),
    variable_op: z.string().optional(),
    variable_val: z.union([z.boolean(), z.number(), z.string()]).optional(),
    variable_desc: z.string().optional(),
  }),
  sequence: z.array(StoryActionSchema),
  choices: z.array(ChoiceSchema),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});

export const SceneContainerSchema = z.object({
  id: z.string(),
  title: z.string(),
  order: z.number(),
  color: z.string(),
  description: z.string().optional(),
  background_image: z.string().optional(),
  background_music: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  dimensions: z.object({ width: z.number(), height: z.number() }).optional(),
});

export const ActContainerSchema = SceneContainerSchema;

export const AssetItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['image', 'audio', 'video', 'font']),
  local_path: z.string(),
  relative_path: z.string().optional(),
  file_size: z.number().optional(),
  mime_type: z.string().optional(),
});

export const VariableDefinitionSchema = z.object({
  name: z.string(),
  type: z.enum(['boolean', 'number', 'string']),
  default_value: z.union([z.boolean(), z.number(), z.string()]),
  description: z.string().optional(),
});

export const ProjectMetaSchema = z.object({
  schema_version: z.literal('1.0'),
  title: z.string(),
  author: z.string().optional(),
  description: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  global_variables: z.record(VariableDefinitionSchema),
  characters: z.record(CharacterDefinitionSchema).optional(),
  scenes: z.array(SceneContainerSchema).optional(),
  acts: z.array(SceneContainerSchema),
  start_node_position: z.object({ x: z.number(), y: z.number() }).optional(),
});

export const MasterManifestSchema = z.object({
  meta: ProjectMetaSchema,
  asset_registry: z.record(AssetItemSchema),
  nodes: z.record(StoryNodeSchema),
  start_node_id: z.string(),
});
