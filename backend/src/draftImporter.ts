import type {
  MasterManifest,
  StoryNode,
  StoryAction,
  ActContainer,
  DraftImportRequest,
  DraftImportResult,
} from '@narrative-engine/shared';

export class DraftImporter {
  public static importDraft(
    request: DraftImportRequest,
    existingManifest?: MasterManifest
  ): DraftImportResult {
    const rawText = request.raw_text.trim();
    if (!rawText) {
      throw new Error('Текст для импорта пуст.');
    }

    // 1. Разбиваем текст на сырые фрагменты (сцены)
    const rawChunks = this.splitIntoChunks(rawText);

    // 2. Определяем акты
    const acts: ActContainer[] = existingManifest?.meta.acts?.length
      ? existingManifest.meta.acts
      : [
          {
            id: 'act_1_exposition',
            title: 'Акт 1: Экспозиция',
            order: 1,
            color: '#3b82f6',
            description: 'Завязка истории и знакомство с героями',
            position: { x: 50, y: 50 },
            dimensions: { width: 1000, height: 700 },
          },
          {
            id: 'act_2_conflict',
            title: 'Акт 2: Конфликт',
            order: 2,
            color: '#f59e0b',
            description: 'Развитие событий, испытания и перепутья',
            position: { x: 1150, y: 50 },
            dimensions: { width: 1200, height: 700 },
          },
          {
            id: 'act_3_resolution',
            title: 'Акт 3: Разрешение',
            order: 3,
            color: '#10b981',
            description: 'Кульминация и финал',
            position: { x: 2450, y: 50 },
            dimensions: { width: 1000, height: 700 },
          },
        ];

    // 3. Формируем ноды
    const nodes: Record<string, StoryNode> = {};
    const totalChunks = rawChunks.length;
    const chunkIds: string[] = [];

    rawChunks.forEach((chunk, index) => {
      const nodeId = `scene_${index + 1}`;
      chunkIds.push(nodeId);

      // Распределение по трем актам: 0-33% -> Акт 1, 33-66% -> Акт 2, 66-100% -> Акт 3
      let actId = acts[0].id;
      let actXOffset = 100;
      const progress = totalChunks > 1 ? index / (totalChunks - 1) : 0;

      if (progress > 0.66 && acts.length >= 3) {
        actId = acts[2].id;
        actXOffset = 2500;
      } else if (progress > 0.33 && acts.length >= 2) {
        actId = acts[1].id;
        actXOffset = 1200;
      }

      const colInAct = index % 3;
      const rowInAct = Math.floor(index / 3);
      const posX = actXOffset + colInAct * 350;
      const posY = 150 + rowInAct * 280;

      const actions = this.parseChunkActions(chunk.body);

      nodes[nodeId] = {
        id: nodeId,
        title: chunk.title || `Сцена ${index + 1}`,
        metadata: {
          act: actId,
          tags: ['imported_draft'],
          is_terminal: index === totalChunks - 1,
        },
        position: { x: posX, y: posY },
        sequence: actions,
        choices: [],
      };
    });

    // 4. Связываем сцены последовательными переходами
    for (let i = 0; i < chunkIds.length - 1; i++) {
      const currentId = chunkIds[i];
      const nextId = chunkIds[i + 1];
      nodes[currentId].choices.push({
        id: `choice_flow_${i + 1}`,
        label: `Далее (${nodes[nextId].title})`,
        next_node: nextId,
      });
    }

    const startNodeId = chunkIds[0] || 'scene_1';

    const manifest: MasterManifest = {
      meta: {
        schema_version: '1.0',
        title: request.project_title || existingManifest?.meta.title || 'Импортированная история',
        author: existingManifest?.meta.author || 'Markus Marrei',
        description: `Сгенерировано из черновика (${totalChunks} сцен)`,
        created_at: existingManifest?.meta.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        global_variables: existingManifest?.meta.global_variables || {},
        acts,
      },
      asset_registry: existingManifest?.asset_registry || {},
      nodes,
      start_node_id: startNodeId,
    };

    return {
      created_nodes_count: totalChunks,
      created_acts_count: acts.length,
      start_node_id: startNodeId,
      manifest,
    };
  }

  private static splitIntoChunks(text: string): Array<{ title: string; body: string }> {
    // Регулярка для детекта заголовков глав/сцен: "Глава 1", "Сцена 2", "### Глава", "Часть 1" и т.п.
    const headerRegex = /(?:^|\n)(#{1,4}\s+[^\n]+|(?:Глава|Сцена|Часть|Акт)\s+[0-9IVXLCDM]+[^\n]*)/i;

    const parts = text.split(headerRegex).filter((p) => p && p.trim().length > 0);
    const chunks: Array<{ title: string; body: string }> = [];

    if (parts.length > 1 && headerRegex.test(parts[0])) {
      for (let i = 0; i < parts.length; i += 2) {
        const title = parts[i].replace(/^#+\s*/, '').trim();
        const body = (parts[i + 1] || '').trim();
        chunks.push({ title, body });
      }
    } else {
      // Если явных заголовков нет, делим по двойным переносам строк на блоки по ~1500-2000 символов
      const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
      let currentChunkText = '';
      let chunkIndex = 1;

      for (const p of paragraphs) {
        if (currentChunkText.length + p.length > 1800 && currentChunkText.length > 0) {
          chunks.push({
            title: `Сцена ${chunkIndex++}`,
            body: currentChunkText.trim(),
          });
          currentChunkText = p + '\n\n';
        } else {
          currentChunkText += p + '\n\n';
        }
      }

      if (currentChunkText.trim().length > 0) {
        chunks.push({
          title: `Сцена ${chunkIndex}`,
          body: currentChunkText.trim(),
        });
      }
    }

    return chunks.length > 0 ? chunks : [{ title: 'Сцена 1', body: text }];
  }

  private static parseChunkActions(body: string): StoryAction[] {
    const actions: StoryAction[] = [];
    const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);

    // Паттерн для прямой речи: "Имя: реплика" или "— Реплика"
    const dialogueColonRegex = /^([A-ZА-ЯЁ][a-zа-яёA-ZА-ЯЁ0-9_\s]{1,25}):\s*(.+)$/;
    const dialogueDashRegex = /^[—–-]\s*(.+)$/;

    let bufferNarration = '';

    const flushNarration = () => {
      if (bufferNarration.trim().length > 0) {
        actions.push({
          id: `seq_narr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'dialogue',
          speaker: 'Рассказчик',
          text: bufferNarration.trim(),
        });
        bufferNarration = '';
      }
    };

    for (const line of lines) {
      const colonMatch = line.match(dialogueColonRegex);
      const dashMatch = line.match(dialogueDashRegex);

      if (colonMatch) {
        flushNarration();
        actions.push({
          id: `seq_diag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'dialogue',
          speaker: colonMatch[1].trim(),
          text: colonMatch[2].trim(),
        });
      } else if (dashMatch) {
        flushNarration();
        actions.push({
          id: `seq_diag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'dialogue',
          speaker: 'Персонаж',
          text: dashMatch[1].trim(),
        });
      } else {
        bufferNarration += (bufferNarration ? ' ' : '') + line;
      }
    }

    flushNarration();

    // Если действий не сформировалось (например, пустой блок), добавляем текст целиком
    if (actions.length === 0 && body.trim().length > 0) {
      actions.push({
        id: `seq_def_${Date.now()}`,
        type: 'dialogue',
        speaker: 'Рассказчик',
        text: body.trim(),
      });
    }

    return actions;
  }
}
