import fs from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import type {
  MasterManifest,
  StoryNode,
  VariableDefinition,
  SceneContainer,
  ActContainer,
  AssetItem,
  Choice,
  CharacterDefinition,
} from '@narrative-engine/shared';

export class ProjectStore extends EventEmitter {
  private static instance: ProjectStore;
  private manifest: MasterManifest;
  private projectFilePath: string;

  private constructor() {
    super();
    this.projectFilePath = path.resolve(process.cwd(), 'project_state.json');
    this.manifest = this.loadInitialState();
  }

  public static getInstance(): ProjectStore {
    if (!ProjectStore.instance) {
      ProjectStore.instance = new ProjectStore();
    }
    return ProjectStore.instance;
  }

  private getDefaultState(): MasterManifest {
    const defaultScenes: SceneContainer[] = [
      {
        id: 'scene_1_exposition',
        title: 'Сцена 1: Пробуждение в архивах',
        order: 1,
        color: '#facc15',
        description: 'Введение героя, атмосфера старого книгохранилища, первые загадки',
        background_image: 'https://images.unsplash.com/photo-1507842229451-7f01be8610ce?q=80&w=1000',
        background_music: 'ambient_silence.ogg',
        position: { x: 50, y: 50 },
        dimensions: { width: 1400, height: 750 },
      },
      {
        id: 'scene_2_conflict',
        title: 'Сцена 2: Врата и ловушки',
        order: 2,
        color: '#f59e0b',
        description: 'Препятствия, развилки решений, точка невозврата',
        background_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000',
        background_music: 'gate_tension.ogg',
        position: { x: 1550, y: 50 },
        dimensions: { width: 1300, height: 750 },
      },
      {
        id: 'scene_3_resolution',
        title: 'Сцена 3: Святилище Истоков',
        order: 3,
        color: '#10b981',
        description: 'Кульминация, последствия выборов, финалы',
        background_image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000',
        background_music: 'sanctuary_theme.ogg',
        position: { x: 2950, y: 50 },
        dimensions: { width: 1100, height: 750 },
      },
    ];

    const defaultVariables: Record<string, VariableDefinition> = {
      has_ancient_key: {
        name: 'has_ancient_key',
        type: 'boolean',
        default_value: false,
        description: 'Найден ли древний ключ в библиотеке',
      },
      courage: {
        name: 'courage',
        type: 'number',
        default_value: 0,
        description: 'Показатель храбрости протагониста',
      },
      player_name: {
        name: 'player_name',
        type: 'string',
        default_value: 'Странник',
        description: 'Имя главного героя',
      },
    };

    const defaultCharacters: Record<string, CharacterDefinition> = {
      narrator: {
        id: 'narrator',
        name: 'Закадровый голос',
        role: 'narrator',
        color: '#94a3b8',
        description: 'Рассказчик истории, нейтральный голос за кадром',
        expressions: [],
      },
      hero: {
        id: 'hero',
        name: 'Странник',
        role: 'hero',
        color: '#38bdf8',
        description: 'Главный протагонист, ищущий разгадку древней библиотеки',
        expressions: [
          { id: 'neutral', name: 'Спокойное', sprite_asset_id: 'char_hero_neutral' },
          { id: 'happy', name: 'Радостное', sprite_asset_id: 'char_hero_happy' },
          { id: 'angry', name: 'Угрюмое / Решительное', sprite_asset_id: 'char_hero_angry' },
          { id: 'confused', name: 'Озадаченное', sprite_asset_id: 'char_hero_confused' },
        ],
      },
      shadow_voice: {
        id: 'shadow_voice',
        name: 'Голос из тени',
        role: 'npc',
        color: '#c084fc',
        description: 'Хранитель кованых врат',
        expressions: [
          { id: 'mysterious', name: 'Таинственное' },
          { id: 'warning', name: 'Предостерегающее' },
        ],
      },
    };

    const initialNodes: Record<string, StoryNode> = {
      act1_scene1: {
        id: 'act1_scene1',
        title: 'Пробуждение в архивах',
        metadata: {
          act: 'act_1_exposition',
          tags: ['intro', 'library'],
        },
        position: { x: 100, y: 150 },
        sequence: [
          {
            id: 'seq_1',
            type: 'show_background',
            asset_id: 'bg_archive',
            transition: 'fade',
            duration_ms: 1000,
          },
          {
            id: 'seq_2',
            type: 'play_music',
            asset_id: 'ambient_silence',
            loop: true,
            volume: 0.7,
          },
          {
            id: 'seq_3',
            type: 'dialogue',
            speaker: 'Странник',
            text: 'Пыльный свет падает сквозь витражи старого книгохранилища. Где я?..',
            mood: 'confused',
          },
        ],
        choices: [
          {
            id: 'choice_1',
            label: 'Осмотреть стол библиотекаря',
            next_node: 'act1_scene2',
            effects: { courage: 1 },
          },
        ],
      },
      act1_scene2: {
        id: 'act1_scene2',
        title: 'Загадочный свиток',
        metadata: {
          act: 'act_1_exposition',
          tags: ['discovery'],
        },
        position: { x: 500, y: 150 },
        sequence: [
          {
            id: 'seq_4',
            type: 'dialogue',
            speaker: 'Странник',
            text: 'На дубовом столе лежит тяжелый бронзовый ключ и пергамент с печатью.',
          },
          {
            id: 'seq_5',
            type: 'set_variable',
            variable: 'has_ancient_key',
            operation: 'set',
            value: true,
          },
        ],
        choices: [
          {
            id: 'choice_2',
            label: 'Сделать шаг к вратам зала',
            next_node: 'act2_gate',
          },
        ],
      },
      act2_gate: {
        id: 'act2_gate',
        title: 'Кованые врата',
        metadata: {
          act: 'act_2_conflict',
          tags: ['crossroad'],
        },
        position: { x: 1100, y: 150 },
        sequence: [
          {
            id: 'seq_6',
            type: 'camera_effect',
            effect: 'shake',
            duration_ms: 500,
          },
          {
            id: 'seq_7',
            type: 'dialogue',
            speaker: 'Голос из тени',
            text: 'Только тот, у кого есть ключ древних, сможет повернуть засов.',
          },
        ],
        choices: [
          {
            id: 'choice_gate_open',
            label: 'Вставить бронзовый ключ',
            next_node: 'act3_sanctuary',
            condition: {
              variable: 'has_ancient_key',
              operator: '==',
              value: true,
            },
          },
          {
            id: 'choice_gate_break',
            label: 'Попытаться выбить дверь плечом',
            next_node: 'act2_trap',
          },
        ],
      },
      act2_trap: {
        id: 'act2_trap',
        title: 'Ловушка стражей',
        metadata: {
          act: 'act_2_conflict',
          tags: ['trap'],
        },
        position: { x: 1500, y: 350 },
        sequence: [
          {
            id: 'seq_trap_1',
            type: 'camera_effect',
            effect: 'flash',
            color: '#ff0000',
            duration_ms: 300,
          },
          {
            id: 'seq_trap_2',
            type: 'dialogue',
            speaker: 'Странник',
            text: 'Каменный пол проседает под ногами! Стены содрогаются...',
          },
        ],
        choices: [
          {
            id: 'choice_retreat',
            label: 'Отпрыгнуть назад к столу',
            next_node: 'act1_scene2',
          },
        ],
      },
      act3_sanctuary: {
        id: 'act3_sanctuary',
        title: 'Святилище Истоков',
        metadata: {
          act: 'act_3_resolution',
          is_terminal: true,
          tags: ['ending', 'triumph'],
        },
        position: { x: 2300, y: 150 },
        sequence: [
          {
            id: 'seq_end_1',
            type: 'camera_effect',
            effect: 'fade_in',
            duration_ms: 1500,
            color: '#ffffff',
          },
          {
            id: 'seq_end_2',
            type: 'dialogue',
            speaker: 'Странник',
            text: 'Тяжелые врата распахиваются. Впереди сияет Зал Хранителей. Путь только начинается.',
          },
        ],
        choices: [],
      },
    };

    return {
      meta: {
        schema_version: '1.0',
        title: 'Хроники Забытых Архивов',
        author: 'Markus Marrei',
        description: 'Приключенческая новелла-квест с исследованием древнего святилища',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        global_variables: defaultVariables,
        characters: defaultCharacters,
        scenes: defaultScenes,
        acts: defaultScenes,
      },
      asset_registry: {
        bg_archive: {
          id: 'bg_archive',
          name: 'Фон библиотеки',
          type: 'image',
          local_path: '',
          relative_path: 'assets/bg_archive.png',
        },
        ambient_silence: {
          id: 'ambient_silence',
          name: 'Эмбиент тишины',
          type: 'audio',
          local_path: '',
          relative_path: 'assets/ambient_silence.ogg',
        },
      },
      nodes: initialNodes,
      start_node_id: 'act1_scene1',
    };
  }

  private loadInitialState(): MasterManifest {
    try {
      if (fs.existsSync(this.projectFilePath)) {
        const raw = fs.readFileSync(this.projectFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        let changed = false;

        if (!parsed.meta.characters) {
          parsed.meta.characters = this.getDefaultState().meta.characters;
          changed = true;
        }

        // Migrate acts to scenes with background_image and background_music
        if (!parsed.meta.scenes) {
          parsed.meta.scenes = (parsed.meta.acts || []).map((a: any, idx: number) => ({
            ...a,
            title: a.title.replace('Акт', 'Сцена'),
            background_image:
              a.background_image ||
              (idx === 0 ? 'https://images.unsplash.com/photo-1507842229451-7f01be8610ce?q=80&w=1000' : ''),
            background_music: a.background_music || (idx === 0 ? 'ambient_silence.ogg' : ''),
            dimensions: a.dimensions || { width: 1250, height: 750 },
          }));
          parsed.meta.acts = parsed.meta.scenes;
          changed = true;
        }

        if (changed) {
          this.saveToDisk(parsed);
        }

        console.error(`[ProjectStore] Successfully loaded project from ${this.projectFilePath}`);
        return parsed;
      }
    } catch (err) {
      console.error(`[ProjectStore] Error reading ${this.projectFilePath}, using defaults`, err);
    }

    const defaultState = this.getDefaultState();
    this.saveToDisk(defaultState);
    return defaultState;
  }

  public getManifest(): MasterManifest {
    return JSON.parse(JSON.stringify(this.manifest));
  }

  public setManifest(newManifest: MasterManifest, emitEvent = true): void {
    newManifest.meta.updated_at = new Date().toISOString();
    this.manifest = newManifest;
    this.saveToDisk(newManifest);
    if (emitEvent) {
      this.emit('project_updated', this.manifest);
    }
  }

  public updateScene(scene: SceneContainer): void {
    if (!this.manifest.meta.scenes) {
      this.manifest.meta.scenes = this.manifest.meta.acts || [];
    }
    const idx = this.manifest.meta.scenes.findIndex((s) => s.id === scene.id);
    if (idx >= 0) {
      this.manifest.meta.scenes[idx] = scene;
    } else {
      this.manifest.meta.scenes.push(scene);
    }
    this.manifest.meta.acts = this.manifest.meta.scenes;
    (this.manifest as any).scenes = this.manifest.meta.scenes;
    (this.manifest as any).acts = this.manifest.meta.scenes;
    this.manifest.meta.updated_at = new Date().toISOString();
    this.saveToDisk(this.manifest);
    this.emit('project_updated', this.manifest);
  }

  public createScene(scene: SceneContainer): void {
    if (!this.manifest.meta.scenes) {
      this.manifest.meta.scenes = this.manifest.meta.acts || [];
    }
    this.manifest.meta.scenes.push(scene);
    this.manifest.meta.acts = this.manifest.meta.scenes;
    (this.manifest as any).scenes = this.manifest.meta.scenes;
    (this.manifest as any).acts = this.manifest.meta.scenes;
    this.manifest.meta.updated_at = new Date().toISOString();
    this.saveToDisk(this.manifest);
    this.emit('project_updated', this.manifest);
  }

  public deleteScene(sceneId: string): void {
    if (this.manifest.meta.scenes) {
      this.manifest.meta.scenes = this.manifest.meta.scenes.filter((s) => s.id !== sceneId);
      this.manifest.meta.acts = this.manifest.meta.scenes;
      (this.manifest as any).scenes = this.manifest.meta.scenes;
      (this.manifest as any).acts = this.manifest.meta.scenes;
      this.manifest.meta.updated_at = new Date().toISOString();
      this.saveToDisk(this.manifest);
      this.emit('project_updated', this.manifest);
    }
  }

  public updateNode(node: StoryNode): void {
    this.manifest.nodes[node.id] = node;
    this.manifest.meta.updated_at = new Date().toISOString();
    this.saveToDisk(this.manifest);
    this.emit('project_updated', this.manifest);
  }

  public createNode(node: StoryNode): void {
    this.manifest.nodes[node.id] = node;
    this.manifest.meta.updated_at = new Date().toISOString();
    this.saveToDisk(this.manifest);
    this.emit('project_updated', this.manifest);
  }

  public deleteNode(nodeId: string): void {
    delete this.manifest.nodes[nodeId];
    // Remove references to deleted node from choices and linear connections
    for (const node of Object.values(this.manifest.nodes)) {
      node.choices = node.choices.filter((c) => c.next_node !== nodeId);
      if (node.next_node === nodeId) {
        node.next_node = undefined;
      }
    }
    this.manifest.meta.updated_at = new Date().toISOString();
    this.saveToDisk(this.manifest);
    this.emit('project_updated', this.manifest);
  }

  public unlinkLinearTarget(nodeId: string): void {
    if (this.manifest.nodes[nodeId]) {
      this.manifest.nodes[nodeId].next_node = undefined;
      this.manifest.meta.updated_at = new Date().toISOString();
      this.saveToDisk(this.manifest);
      this.emit('project_updated', this.manifest);
    }
  }

  public unlinkChoice(nodeId: string, choiceId: string): void {
    const node = this.manifest.nodes[nodeId];
    if (node) {
      const choice = node.choices.find((c) => c.id === choiceId);
      if (choice) {
        choice.next_node = '';
        this.manifest.meta.updated_at = new Date().toISOString();
        this.saveToDisk(this.manifest);
        this.emit('project_updated', this.manifest);
      }
    }
  }

  public registerCharacter(character: CharacterDefinition): void {
    if (!this.manifest.meta.characters) {
      this.manifest.meta.characters = {};
    }
    this.manifest.meta.characters[character.id] = character;
    this.manifest.meta.updated_at = new Date().toISOString();
    this.saveToDisk(this.manifest);
    this.emit('project_updated', this.manifest);
  }

  public deleteCharacter(characterId: string): void {
    if (this.manifest.meta.characters) {
      delete this.manifest.meta.characters[characterId];
      this.manifest.meta.updated_at = new Date().toISOString();
      this.saveToDisk(this.manifest);
      this.emit('project_updated', this.manifest);
    }
  }

  public registerVariable(def: VariableDefinition): void {
    this.manifest.meta.global_variables[def.name] = def;
    this.manifest.meta.updated_at = new Date().toISOString();
    this.saveToDisk(this.manifest);
    this.emit('project_updated', this.manifest);
  }

  public registerAsset(asset: AssetItem): void {
    this.manifest.asset_registry[asset.id] = asset;
    this.manifest.meta.updated_at = new Date().toISOString();
    this.saveToDisk(this.manifest);
    this.emit('project_updated', this.manifest);
  }

  public linkNodes(
    fromNodeId: string,
    toNodeId: string,
    choiceLabel: string,
    condition?: any,
    effects?: Record<string, any>
  ): void {
    const source = this.manifest.nodes[fromNodeId];
    if (!source) throw new Error(`Source node ${fromNodeId} not found`);
    if (!this.manifest.nodes[toNodeId]) throw new Error(`Target node ${toNodeId} not found`);

    const newChoice: Choice = {
      id: `choice_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: choiceLabel,
      next_node: toNodeId,
      condition,
      effects,
    };

    source.choices.push(newChoice);
    this.manifest.meta.updated_at = new Date().toISOString();
    this.saveToDisk(this.manifest);
    this.emit('project_updated', this.manifest);
  }

  private saveToDisk(data: MasterManifest): void {
    try {
      fs.writeFileSync(this.projectFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`[ProjectStore] Failed to write project state to disk`, err);
    }
  }
}
