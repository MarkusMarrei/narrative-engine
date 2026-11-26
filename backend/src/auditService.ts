import fs from 'node:fs';
import type {
  MasterManifest,
  AuditReport,
  AuditIssue,
  StoryNode,
} from '@narrative-engine/shared';

export class AuditService {
  public static audit(manifest: MasterManifest): AuditReport {
    const issues: AuditIssue[] = [];
    const nodes = manifest.nodes;
    const nodeIds = Object.keys(nodes);
    const variables = manifest.meta.global_variables;

    // 1. Проверка start_node_id
    if (!manifest.start_node_id) {
      issues.push({
        severity: 'error',
        code: 'NO_START_NODE',
        message: 'В проекте не определена стартовая сцена (start_node_id пуст).',
        suggestion: 'Назначьте один из начальных узлов Акта 1 в качестве стартовой сцены.',
      });
    } else if (!nodes[manifest.start_node_id]) {
      issues.push({
        severity: 'error',
        code: 'INVALID_START_NODE',
        node_id: manifest.start_node_id,
        message: `Указанный стартовый узел "${manifest.start_node_id}" не существует в графе.`,
        suggestion: 'Исправьте start_node_id на существующий идентификатор сцены.',
      });
    }

    // Построение графа переходов (Adjacency list & In-degrees)
    const outgoing = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    for (const id of nodeIds) {
      outgoing.set(id, []);
      inDegree.set(id, 0);
    }

    for (const [id, node] of Object.entries(nodes)) {
      // Linear transitions (for atomic flow nodes and linear cards)
      const linearTarget = node.linear_target || node.next_node;
      if (linearTarget) {
        outgoing.get(id)?.push(linearTarget);
        if (inDegree.has(linearTarget)) {
          inDegree.set(linearTarget, (inDegree.get(linearTarget) || 0) + 1);
        } else {
          issues.push({
            severity: 'error',
            code: 'ORPHAN_NODE',
            node_id: id,
            message: `Связь узла "${node.title || id}" ведёт на несуществующий узел "${linearTarget}".`,
            suggestion: 'Проверьте идентификатор перехода или создайте целевую ноду.',
          });
        }
      }

      // Choice transitions
      const nodeChoices = Array.isArray(node.choices) ? node.choices : [];
      for (const choice of nodeChoices) {
        const choiceTarget = choice.target_node_id || choice.next_node;
        if (choiceTarget) {
          outgoing.get(id)?.push(choiceTarget);
          if (inDegree.has(choiceTarget)) {
            inDegree.set(choiceTarget, (inDegree.get(choiceTarget) || 0) + 1);
          } else {
            // Ссылка на несуществующий узел
            issues.push({
              severity: 'error',
              code: 'ORPHAN_NODE',
              node_id: id,
              message: `Выбор "${choice.text || choice.label || 'Выбор'}" ведёт на несуществующий узел "${choiceTarget}".`,
              suggestion: 'Проверьте идентификатор перехода или создайте целевую сцену.',
            });
          }
        }
      }
    }

    // 2. Поиск недостижимых узлов (Orphan Nodes)
    const reachable = new Set<string>();
    if (manifest.start_node_id && nodes[manifest.start_node_id]) {
      const queue = [manifest.start_node_id];
      reachable.add(manifest.start_node_id);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        const targets = outgoing.get(curr) || [];
        for (const target of targets) {
          if (nodes[target] && !reachable.has(target)) {
            reachable.add(target);
            queue.push(target);
          }
        }
      }
    }

    for (const id of nodeIds) {
      if (!reachable.has(id) && id !== manifest.start_node_id) {
        issues.push({
          severity: 'warning',
          code: 'ORPHAN_NODE',
          node_id: id,
          message: `Сцена "${nodes[id]?.title || id}" недостижима от стартового узла.`,
          suggestion: 'Добавьте переход из других сцен или удалите неиспользуемый узел.',
        });
      }
    }

    // 3. Анализ каждого узла (Dead ends, Empty sequence, Variables)
    for (const [id, node] of Object.entries(nodes)) {
      const nodeChoices = Array.isArray(node.choices) ? node.choices : [];
      const nodeSequence = Array.isArray(node.sequence) ? node.sequence : [];

      // Тупиковый узел без переходов
      const hasOutgoing =
        (nodeChoices.length > 0 && nodeChoices.some((c) => !!(c.target_node_id || c.next_node))) ||
        !!(node.linear_target || node.next_node);

      const isTerminal =
        node.metadata?.is_terminal ||
        node.title?.toLowerCase().includes('complete') ||
        node.title?.toLowerCase().includes('end') ||
        node.content?.toLowerCase().includes('[story completed]');

      if (!hasOutgoing && !isTerminal) {
        issues.push({
          severity: 'warning',
          code: 'DEAD_END',
          node_id: id,
          message: `Узел "${node.title || id}" не имеет исходящих переходов и не помечен как финал (is_terminal).`,
          suggestion: 'Соедините узел со следующим шагом или отметьте флагом "Финал истории".',
        });
      }

      // Пустой стек действий (только для составных узлов, у атомарных есть собственное содержимое)
      const isAtomic = !!node.node_type && node.node_type !== 'story_card';
      if (!isAtomic && nodeSequence.length === 0) {
        issues.push({
          severity: 'warning',
          code: 'EMPTY_SEQUENCE',
          node_id: id,
          message: `Сцена "${node.title || id}" не содержит действий (диалогов, фонов или эффектов).`,
          suggestion: 'Добавьте реплику или действие в стек сцены.',
        });
      }

      // Проверка действий с переменными
      for (const action of nodeSequence) {
        if (action.type === 'set_variable') {
          if (!variables[action.variable]) {
            issues.push({
              severity: 'error',
              code: 'UNDEFINED_VARIABLE',
              node_id: id,
              message: `Действие изменяет необъявленную переменную "${action.variable}".`,
              suggestion: `Зарегистрируйте переменную "${action.variable}" в глобальном реестре проекта.`,
            });
          }
        }
      }

      // Проверка условий и эффектов в выборах
      for (const choice of nodeChoices) {
        if (choice.condition) {
          const varDef = variables[choice.condition.variable];
          if (!varDef) {
            issues.push({
              severity: 'error',
              code: 'UNDEFINED_VARIABLE',
              node_id: id,
              message: `Условие выбора "${choice.text || choice.label || 'Выбор'}" ссылается на необъявленную переменную "${choice.condition.variable}".`,
              suggestion: `Добавьте "${choice.condition.variable}" в реестр глобальных переменных.`,
            });
          } else {
            // Проверка совместимости типов
            const valType = typeof choice.condition.value;
            if (varDef.type === 'boolean' && valType !== 'boolean') {
              issues.push({
                severity: 'error',
                code: 'INVALID_TYPE_COMPARISON',
                node_id: id,
                message: `Переменная "${varDef.name}" имеет тип boolean, но сравнивается с ${valType}.`,
                suggestion: 'Исправьте значение условия на true или false.',
              });
            } else if (varDef.type === 'number' && valType !== 'number') {
              issues.push({
                severity: 'error',
                code: 'INVALID_TYPE_COMPARISON',
                node_id: id,
                message: `Переменная "${varDef.name}" имеет тип number, но сравнивается с ${valType}.`,
                suggestion: 'Убедитесь, что условие использует числовое значение.',
              });
            }
          }
        }

        // Проверка эффектов
        if (choice.effects) {
          for (const varName of Object.keys(choice.effects)) {
            if (!variables[varName]) {
              issues.push({
                severity: 'error',
                code: 'UNDEFINED_VARIABLE',
                node_id: id,
                message: `Эффект выбора "${choice.text || choice.label || 'Выбор'}" модифицирует необъявленную переменную "${varName}".`,
                suggestion: `Зарегистрируйте переменную "${varName}" в реестре.`,
              });
            }
          }
        }
      }
    }

    // 4. Проверка ассетов на диске
    for (const [assetId, asset] of Object.entries(manifest.asset_registry)) {
      if (asset.local_path && asset.local_path.trim().length > 0) {
        if (!fs.existsSync(asset.local_path)) {
          issues.push({
            severity: 'error',
            code: 'MISSING_ASSET',
            message: `Файл ассета "${asset.name || assetId}" (${assetId}) не найден по пути: ${asset.local_path}`,
            suggestion: 'Укажите новый актуальный путь к файлу или удалите потерянный ассет.',
          });
        }
      }
    }

    // 5. Поиск простых бесконечных циклов (Self-loop or A -> B -> A без эффектов)
    for (const [id, node] of Object.entries(nodes)) {
      const nodeChoices = Array.isArray(node.choices) ? node.choices : [];
      for (const choice of nodeChoices) {
        const choiceTarget = choice.target_node_id || choice.next_node;
        if (choiceTarget === id && (!choice.effects || Object.keys(choice.effects).length === 0)) {
          issues.push({
            severity: 'warning',
            code: 'CIRCULAR_LOOP',
            node_id: id,
            message: `Сцена "${node.title || id}" зациклена на саму себя без изменения переменных стейта.`,
            suggestion: 'Добавьте условие выхода или модификацию переменной для предотвращения зацикливания.',
          });
        }
      }
    }

    const errorsCount = issues.filter((i) => i.severity === 'error').length;
    const warningsCount = issues.filter((i) => i.severity === 'warning').length;

    // Расчет индекса зрелости / качества истории (Maturity Score: 0 - 100)
    let score = 100;
    score -= errorsCount * 15;
    score -= warningsCount * 5;
    if (nodeIds.length === 0) score = 0;
    if (score < 0) score = 0;

    return {
      is_valid: errorsCount === 0,
      maturity_score: score,
      errors_count: errorsCount,
      warnings_count: warningsCount,
      issues,
    };
  }
}
