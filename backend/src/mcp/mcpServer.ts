import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ProjectStore } from '../projectStore.js';
import { AuditService } from '../auditService.js';
import { DraftImporter } from '../draftImporter.js';
import { CompilerService } from '../compilerService.js';
import { HardwareDetector } from '../hardwareDetector.js';
import type { StoryNode, StoryAction, Choice } from '@narrative-engine/shared';

export function createNarrativeMcpServer(): McpServer {
  const store = ProjectStore.getInstance();

  const server = new McpServer(
    {
      name: 'narrative-engine-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // -------------------------------------------------------------
  // RESOURCES: Read-only live state
  // -------------------------------------------------------------
  server.resource(
    'manifest',
    'narrative://project/manifest',
    async (uri) => {
      const manifest = store.getManifest();
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(manifest, null, 2),
          },
        ],
      };
    }
  );

  server.resource(
    'audit',
    'narrative://project/audit',
    async (uri) => {
      const manifest = store.getManifest();
      const report = AuditService.audit(manifest);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(report, null, 2),
          },
        ],
      };
    }
  );

  server.resource(
    'variables',
    'narrative://project/variables',
    async (uri) => {
      const manifest = store.getManifest();
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(manifest.meta.global_variables, null, 2),
          },
        ],
      };
    }
  );

  server.resource(
    'hardware',
    'narrative://system/hardware',
    async (uri) => {
      const diag = HardwareDetector.getDiagnostics();
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(diag, null, 2),
          },
        ],
      };
    }
  );

  // -------------------------------------------------------------
  // TOOL 0: narrative_get_hardware_status
  // -------------------------------------------------------------
  server.tool(
    'narrative_get_hardware_status',
    'Возвращает аппаратные характеристики системы: ОС, архитектура, GPU (AMD, Intel, Nvidia, iGPU/dGPU) и оптимальный бэкенд ускорения (CUDA, Vulkan, Metal, CPU).',
    {},
    async () => {
      const diag = HardwareDetector.getDiagnostics();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(diag, null, 2),
          },
        ],
      };
    }
  );

  // -------------------------------------------------------------
  // TOOL 1: narrative_get_project
  // -------------------------------------------------------------
  server.tool(
    'narrative_get_project',
    'Возвращает полный проект истории: метаданные, акты, список всех сцен со стеком действий, выборы и глобальные переменные.',
    {},
    async () => {
      const manifest = store.getManifest();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                title: manifest.meta.title,
                start_node_id: manifest.start_node_id,
                total_nodes: Object.keys(manifest.nodes).length,
                acts: manifest.meta.acts,
                global_variables: manifest.meta.global_variables,
                nodes: manifest.nodes,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // -------------------------------------------------------------
  // TOOL 2: narrative_audit_project (Тестирование логики и поиск ошибок)
  // -------------------------------------------------------------
  server.tool(
    'narrative_audit_project',
    'Проводит полный аудит логики сюжета: выявляет тупики (dead ends), недостижимые сцены, необъявленные переменные, циклы без изменений состояния и битые ассеты. Возвращает Maturity Score (0-100%).',
    {},
    async () => {
      const manifest = store.getManifest();
      const report = AuditService.audit(manifest);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(report, null, 2),
          },
        ],
      };
    }
  );

  // -------------------------------------------------------------
  // TOOL 3: narrative_import_draft (Нарезка черновика на сцены по актам)
  // -------------------------------------------------------------
  server.tool(
    'narrative_import_draft',
    'Принимает большой текст сценария/черновика (до 50 000+ символов), разбивает его на логические сцены по трем актам (Экспозиция, Конфликт, Разрешение), вычленяет реплики говорящих (speaker) и связывает переходами. Моментально отображает результат на холсте.',
    {
      raw_text: z.string().describe('Полный текст черновика или новеллы для нарезки на сцены'),
      project_title: z.string().optional().describe('Название истории'),
    },
    async ({ raw_text, project_title }) => {
      try {
        const existing = store.getManifest();
        const result = DraftImporter.importDraft(
          { raw_text, project_title },
          existing
        );

        store.setManifest(result.manifest);

        return {
          content: [
            {
              type: 'text',
              text: `Черновик успешно импортирован!\nСоздано сцен: ${result.created_nodes_count}\nАктов: ${result.created_acts_count}\nСтартовая сцена: ${result.start_node_id}\nСцены размещены на холсте и связаны переходами.`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Ошибка импорта черновика: ${String(err)}`,
            },
          ],
        };
      }
    }
  );

  // -------------------------------------------------------------
  // TOOL 4: narrative_create_scene (Создание новой сцены)
  // -------------------------------------------------------------
  server.tool(
    'narrative_create_scene',
    'Создает новую сцену (узел) в указанном акте со стеком режиссерских действий (фон, музыка, диалоги) и выборами.',
    {
      node_id: z.string().describe('Уникальный идентификатор сцены, например act1_cave_entry'),
      title: z.string().describe('Читаемое название сцены'),
      act_id: z.string().describe('Идентификатор акта (например act_1_exposition, act_2_conflict, act_3_resolution)'),
      dialogue_text: z.string().optional().describe('Основной текст реплики или описания сцены'),
      speaker: z.string().optional().describe('Имя говорящего персонажа (или Рассказчик)'),
      background_asset_id: z.string().optional().describe('ID фонового изображения в asset_registry'),
      music_asset_id: z.string().optional().describe('ID музыкального трека в asset_registry'),
      is_terminal: z.boolean().optional().describe('Является ли сцена финалом истории'),
    },
    async ({
      node_id,
      title,
      act_id,
      dialogue_text,
      speaker = 'Рассказчик',
      background_asset_id,
      music_asset_id,
      is_terminal = false,
    }) => {
      const sequence: StoryAction[] = [];

      if (background_asset_id) {
        sequence.push({
          id: `seq_bg_${Date.now()}`,
          type: 'show_background',
          asset_id: background_asset_id,
          transition: 'fade',
        });
      }

      if (music_asset_id) {
        sequence.push({
          id: `seq_mus_${Date.now()}`,
          type: 'play_music',
          asset_id: music_asset_id,
          loop: true,
        });
      }

      if (dialogue_text) {
        sequence.push({
          id: `seq_diag_${Date.now()}`,
          type: 'dialogue',
          speaker,
          text: dialogue_text,
        });
      }

      const newNode: StoryNode = {
        id: node_id,
        title,
        metadata: {
          act: act_id,
          is_terminal,
        },
        sequence,
        choices: [],
      };

      store.createNode(newNode);

      return {
        content: [
          {
            type: 'text',
            text: `Сцена "${title}" (${node_id}) успешно создана в акте "${act_id}".`,
          },
        ],
      };
    }
  );

  // -------------------------------------------------------------
  // TOOL 5: narrative_update_scene (Точечное обновление сцены)
  // -------------------------------------------------------------
  server.tool(
    'narrative_update_scene',
    'Обновляет заголовок, текст реплик, флаг финала или добавляет реплики в существующую сцену.',
    {
      node_id: z.string().describe('ID сцены для обновления'),
      title: z.string().optional().describe('Новое название сцены'),
      append_dialogue: z
        .object({
          speaker: z.string(),
          text: z.string(),
        })
        .optional()
        .describe('Добавить реплику в конец стека действий сцены'),
      is_terminal: z.boolean().optional().describe('Сделать сцену финальной'),
    },
    async ({ node_id, title, append_dialogue, is_terminal }) => {
      const manifest = store.getManifest();
      const node = manifest.nodes[node_id];
      if (!node) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Сцена с ID "${node_id}" не найдена.` }],
        };
      }

      if (title !== undefined) node.title = title;
      if (is_terminal !== undefined) node.metadata.is_terminal = is_terminal;

      if (append_dialogue) {
        node.sequence.push({
          id: `seq_diag_${Date.now()}`,
          type: 'dialogue',
          speaker: append_dialogue.speaker,
          text: append_dialogue.text,
        });
      }

      store.updateNode(node);

      return {
        content: [
          {
            type: 'text',
            text: `Сцена "${node_id}" успешно обновлена. Текущее количество действий: ${node.sequence.length}.`,
          },
        ],
      };
    }
  );

  // -------------------------------------------------------------
  // TOOL 6: narrative_link_scenes (Связывание двух сцен выбором)
  // -------------------------------------------------------------
  server.tool(
    'narrative_link_scenes',
    'Создает развилку/переход между сценами с надписью на кнопке, опциональным условием проверки переменной и эффектами изменения состояния.',
    {
      from_node_id: z.string().describe('ID исходной сцены'),
      to_node_id: z.string().describe('ID целевой сцены перехода'),
      label: z.string().describe('Текст кнопки выбора, который увидит игрок'),
      condition: z
        .object({
          variable: z.string(),
          operator: z.enum(['==', '!=', '>', '<', '>=', '<=']),
          value: z.union([z.boolean(), z.number(), z.string()]),
        })
        .optional()
        .describe('Условие доступности выбора'),
      effects: z
        .record(z.union([z.boolean(), z.number(), z.string()]))
        .optional()
        .describe('Мутации переменных при выборе (например {"karma": 5, "has_key": true})'),
    },
    async ({ from_node_id, to_node_id, label, condition, effects }) => {
      try {
        store.linkNodes(from_node_id, to_node_id, label, condition, effects);
        return {
          content: [
            {
              type: 'text',
              text: `Переход успешно создан: [${from_node_id}] --("${label}")--> [${to_node_id}]`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Ошибка связывания: ${String(err)}` }],
        };
      }
    }
  );

  // -------------------------------------------------------------
  // TOOL 7: narrative_export_bundle (Компиляция проекта в ZIP)
  // -------------------------------------------------------------
  server.tool(
    'narrative_export_bundle',
    'Запускает детерминированную сборку проекта: проверяет ассеты, санитизирует пути, генерирует manifest.json и AGENT_INSTRUCTIONS.md, упаковывая всё в чистый Agent_Export_Build.zip для Unity/Godot.',
    {
      target_engine: z.enum(['generic', 'unity', 'godot']).default('generic').describe('Целевой игровой движок'),
    },
    async ({ target_engine }) => {
      try {
        const manifest = store.getManifest();
        const result = await CompilerService.exportBundle(manifest, target_engine);

        return {
          content: [
            {
              type: 'text',
              text: `Проект успешно скомпилирован и упакован в ZIP!\nФайл: ${result.zip_path}\nВсего сцен: ${result.total_nodes}\nУпаковано ассетов: ${result.total_assets}\nРазмер архива: ${Math.round(result.file_size_bytes / 1024)} KB\nПредупреждения: ${result.warnings.length > 0 ? result.warnings.join('; ') : 'Нет'}`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Ошибка компиляции: ${String(err)}` }],
        };
      }
    }
  );

  return server;
}
