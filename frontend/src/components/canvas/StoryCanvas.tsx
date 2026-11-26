import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Background,
  Controls,
  ConnectionMode,
  type Node,
  type Edge,
  type OnNodesChange,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStoryStore } from '../../store/useStoryStore.ts';
import { SceneContainerNode } from '../nodes/SceneContainerNode.tsx';
import {
  BackgroundNode,
  MusicNode,
  VideoNode,
  EffectNode,
  CharacterNode,
  EmotionNode,
  AppearanceNode,
  DialogueNode,
  ChoiceNode,
  VariableNode,
} from '../nodes/FlowNodes.tsx';
import { StoryActionNode } from '../nodes/StoryActionNode.tsx';
import { StartNode } from '../nodes/StartNode.tsx';
import { DeletableEdge } from './DeletableEdge.tsx';
import { NodePalette } from '../palette/NodePalette.tsx';
import type { FlowNodeType, SceneContainer } from '@narrative-engine/shared';

const nodeTypes = {
  startNode: StartNode,
  sceneContainer: SceneContainerNode,
  actGroup: SceneContainerNode, // Backward compatibility
  background: BackgroundNode,
  music: MusicNode,
  video: VideoNode,
  effect: EffectNode,
  character: CharacterNode,
  emotion: EmotionNode,
  appearance: AppearanceNode,
  dialogue: DialogueNode,
  choice: ChoiceNode,
  variable: VariableNode,
  storyNode: StoryActionNode, // Fallback for legacy compound nodes
};

const edgeTypes = {
  deletableEdge: DeletableEdge,
};

const StoryCanvasInner: React.FC = () => {
  const manifest = useStoryStore((s) => s.manifest);
  const auditReport = useStoryStore((s) => s.auditReport);
  const selectedNodeId = useStoryStore((s) => s.selectedNodeId);
  const updateNodePosition = useStoryStore((s) => s.updateNodePosition);
  const saveProject = useStoryStore((s) => s.saveProject);
  const setChoiceTarget = useStoryStore((s) => s.setChoiceTarget);
  const setLinearTarget = useStoryStore((s) => s.setLinearTarget);
  const setStartNodeId = useStoryStore((s) => s.setStartNodeId);
  const deleteEdge = useStoryStore((s) => s.deleteEdge);
  const setSelectedNodeId = useStoryStore((s) => s.setSelectedNodeId);
  const createFlowNode = useStoryStore((s) => s.createFlowNode);
  const createScene = useStoryStore((s) => s.createScene);
  const theme = useStoryStore((s) => s.theme);
  const lowSpecMode = useStoryStore((s) => s.lowSpecMode);

  const { screenToFlowPosition } = useReactFlow();
  const isDark = theme === 'dark';

  // Issues by nodeId
  const issuesByNode = useMemo(() => {
    const map = new Map<string, any[]>();
    if (auditReport?.issues) {
      for (const issue of auditReport.issues) {
        if (issue.node_id) {
          if (!map.has(issue.node_id)) map.set(issue.node_id, []);
          map.get(issue.node_id)!.push(issue);
        }
      }
    }
    return map;
  }, [auditReport]);

  // Nodes for React Flow
  const nodes: Node[] = useMemo(() => {
    if (!manifest) return [];

    const result: Node[] = [];

    // 1. Scene Containers (Resizable background areas with background image & music)
    const scenes = (manifest as any).scenes || manifest.meta?.scenes || manifest.meta?.acts || (manifest as any).acts || [];
    for (const scene of scenes) {
      const sw = scene.dimensions?.width || 1200;
      const sh = scene.dimensions?.height || 750;
      result.push({
        id: `group_${scene.id}`,
        type: 'sceneContainer',
        position: scene.position || { x: (scene.order - 1) * 1400 + 50, y: 50 },
        data: { scene, isDark },
        style: { width: sw, height: sh },
        selectable: true,
        draggable: true,
        zIndex: -1,
      });
    }

    // 2. Story Flow Nodes
    for (const [id, storyNode] of Object.entries(manifest.nodes)) {
      const type = storyNode.node_type || 'storyNode';
      result.push({
        id,
        type,
        position: storyNode.position || { x: 100, y: 150 },
        data: {
          node: storyNode,
          isStartNode: manifest.start_node_id === id,
          issues: issuesByNode.get(id) || [],
          isDark,
        },
        selected: selectedNodeId === id,
      });
    }

    // 3. Dedicated Start Node (always present on canvas, indestructible entry point)
    const startNodeId = manifest.start_node_id;
    const firstNode = startNodeId ? manifest.nodes[startNodeId] : null;
    const defaultStartPos = firstNode?.position
      ? { x: firstNode.position.x - 260, y: firstNode.position.y }
      : { x: -450, y: 530 };
    const startPos = manifest.meta.start_node_position || defaultStartPos;

    result.push({
      id: 'start_node',
      type: 'startNode',
      position: startPos,
      data: {
        startNodeId,
        isDark,
      },
      selectable: true,
      draggable: true,
      deletable: false,
      zIndex: 10,
    });

    return result;
  }, [manifest, issuesByNode, selectedNodeId, isDark]);

  // Edges for React Flow: linear + choices with smart handle routing and DeletableEdge
  const edges: Edge[] = useMemo(() => {
    if (!manifest) return [];

    const result: Edge[] = [];

    // Start Node connection to the first node of the story
    if (manifest.start_node_id && manifest.nodes[manifest.start_node_id]) {
      const startTargetNode = manifest.nodes[manifest.start_node_id];
      const startTargetPos = startTargetNode.position || { x: 0, y: 0 };
      const defaultStartPos = { x: startTargetPos.x - 260, y: startTargetPos.y };
      const startPos = manifest.meta.start_node_position || defaultStartPos;

      const dx = startTargetPos.x - startPos.x;
      const dy = startTargetPos.y - startPos.y;

      let sourceHandle = 'source-right';
      let targetHandle = 'target-left';

      if (dy > 80 && Math.abs(dx) < 220) {
        sourceHandle = 'source-bottom';
        targetHandle = 'target-top';
      } else {
        sourceHandle = 'source-right';
        targetHandle = 'target-left';
      }

      result.push({
        id: `edge_start_node_${manifest.start_node_id}`,
        source: 'start_node',
        target: manifest.start_node_id,
        sourceHandle,
        targetHandle,
        type: 'deletableEdge',
        focusable: true,
      });
    }

    for (const [id, node] of Object.entries(manifest.nodes)) {
      // Linear connections (Effect, Character, Emotion, Dialogue, Variable, etc.)
      const linearTarget = (node as any).linear_target || node.next_node;
      if (linearTarget && linearTarget.trim() !== '' && manifest.nodes[linearTarget]) {
        const sourceNode = node;
        const targetNode = manifest.nodes[linearTarget];

        const sourcePos = sourceNode.position || { x: 0, y: 0 };
        const targetPos = targetNode.position || { x: 0, y: 0 };

        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;

        // Smart dynamic handle routing:
        // Automatically selects the best handles based on relative vertical / horizontal orientation
        // ONLY valid handles are ever used: source-right, source-bottom, target-left, target-top
        let sourceHandle = 'source-right';
        let targetHandle = 'target-left';

        if (dy > 80 && Math.abs(dx) < 260) {
          // Target is mostly below source -> clean downward vertical flow
          sourceHandle = 'source-bottom';
          targetHandle = 'target-top';
        } else if (dy < -80 && Math.abs(dx) < 260) {
          // Target is mostly above source -> upward flow to target's left handle
          sourceHandle = 'source-right';
          targetHandle = 'target-left';
        } else if (dx < -50 && dy > 60) {
          // Target is behind and below
          sourceHandle = 'source-bottom';
          targetHandle = 'target-top';
        } else if (dx < -50 && dy < -60) {
          // Target is behind and above
          sourceHandle = 'source-right';
          targetHandle = 'target-top';
        } else {
          // Standard horizontal / diagonal
          sourceHandle = 'source-right';
          targetHandle = 'target-left';
        }

        result.push({
          id: `edge_${id}_${linearTarget}`,
          source: id,
          target: linearTarget,
          sourceHandle,
          targetHandle,
          type: 'deletableEdge',
          focusable: true,
        });
      }

      // Choice connections
      const nodeChoices = Array.isArray(node.choices) ? node.choices : [];
      for (const choice of nodeChoices) {
        const choiceTarget = (choice as any).target_node_id || choice.next_node;
        if (choiceTarget && choiceTarget.trim() !== '' && manifest.nodes[choiceTarget]) {
          const targetNode = manifest.nodes[choiceTarget];
          const sourcePos = node.position || { x: 0, y: 0 };
          const targetPos = targetNode?.position || { x: 0, y: 0 };

          const dx = targetPos.x - sourcePos.x;
          const dy = targetPos.y - sourcePos.y;

          // Route to top if target is directly below choice node
          const targetHandle = dy > 90 && Math.abs(dx) < 220 ? 'target-top' : 'target-left';

          result.push({
            id: `edge_${id}_${choice.id}_${choiceTarget}`,
            source: id,
            target: choiceTarget,
            sourceHandle: choice.id,
            targetHandle,
            type: 'deletableEdge',
            focusable: true,
            animated: !!choice.condition,
          });
        }
      }
    }

    return result;
  }, [manifest]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          updateNodePosition(change.id, change.position);
        }
      }
    },
    [updateNodePosition]
  );

  const onNodeDragStop = useCallback(() => {
    saveProject();
  }, [saveProject]);

  // Robust bidirectional connection handling:
  // Supports dragging between any handles, in any direction, even across large vertical drops
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      if (params.source === params.target) return; // Prevent self-connections

      // If connection involves the start_node:
      if (params.source === 'start_node') {
        setStartNodeId(params.target);
        return;
      }
      if (params.target === 'start_node') {
        setStartNodeId(params.source);
        return;
      }

      const sourceNode = manifest?.nodes[params.source];
      const targetNode = manifest?.nodes[params.target];

      const sourceIsChoice = sourceNode?.choices?.some((c) => c.id === params.sourceHandle);
      const targetIsChoice = targetNode?.choices?.some((c) => c.id === params.targetHandle);

      // Choice handle drag
      if (sourceIsChoice && params.sourceHandle) {
        setChoiceTarget(params.source, params.sourceHandle, params.target);
        return;
      }
      if (targetIsChoice && params.targetHandle) {
        // Dragged backwards from target node into a choice handle
        setChoiceTarget(params.target, params.targetHandle, params.source);
        return;
      }

      // Linear connection between nodes:
      // If user dragged backwards (started at a target handle and dropped on a source handle):
      const isSourceTarget = params.sourceHandle?.startsWith('target');
      const isTargetSource = params.targetHandle?.startsWith('source');

      if (isSourceTarget && isTargetSource) {
        // Reverse drag: Node B's input dragged to Node A's output -> connect Node A to Node B
        setLinearTarget(params.target, params.source);
      } else {
        // Forward drag: Node A dragged to Node B
        setLinearTarget(params.source, params.target);
      }
    },
    [setChoiceTarget, setLinearTarget, setStartNodeId, manifest]
  );

  // Keyboard Delete / Backspace support for edges
  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      for (const edge of edgesToDelete) {
        deleteEdge(edge.id, edge.source, edge.sourceHandle);
      }
      saveProject();
    },
    [deleteEdge, saveProject]
  );

  // Drag and drop from NodePalette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow/type') as FlowNodeType;
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const scenes: SceneContainer[] = (manifest as any)?.scenes || manifest?.meta?.scenes || manifest?.meta?.acts || (manifest as any)?.acts || [];
      const containingScene = scenes.find((s: SceneContainer) => {
        const sx = s.position?.x ?? 0;
        const sy = s.position?.y ?? 0;
        const sw = s.dimensions?.width ?? 1200;
        const sh = s.dimensions?.height ?? 750;
        return (
          position.x >= sx &&
          position.x <= sx + sw &&
          position.y >= sy &&
          position.y <= sy + sh
        );
      });

      createFlowNode(type, containingScene?.id, position);
    },
    [screenToFlowPosition, createFlowNode, manifest]
  );

  // Add node into the exact center of where the user is looking
  const handleAddNodeAtCenter = useCallback(
    (type: FlowNodeType) => {
      const jitterX = Math.floor(Math.random() * 40) - 20;
      const jitterY = Math.floor(Math.random() * 40) - 20;
      const position = screenToFlowPosition({
        x: window.innerWidth / 2 + jitterX,
        y: window.innerHeight / 2 + jitterY,
      });

      const scenes: SceneContainer[] = (manifest as any)?.scenes || manifest?.meta?.scenes || manifest?.meta?.acts || (manifest as any)?.acts || [];
      const containingScene = scenes.find((s: SceneContainer) => {
        const sx = s.position?.x ?? 0;
        const sy = s.position?.y ?? 0;
        const sw = s.dimensions?.width ?? 1200;
        const sh = s.dimensions?.height ?? 750;
        return (
          position.x >= sx &&
          position.x <= sx + sw &&
          position.y >= sy &&
          position.y <= sy + sh
        );
      });

      createFlowNode(type, containingScene?.id, position);
    },
    [screenToFlowPosition, createFlowNode, manifest]
  );

  // Add new scene centered around current viewport
  const handleAddSceneAtCenter = useCallback(() => {
    const centerFlow = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const defaultWidth = 1300;
    const defaultHeight = 750;
    const scenePosition = {
      x: Math.round(centerFlow.x - defaultWidth / 2),
      y: Math.round(centerFlow.y - defaultHeight / 2),
    };

    createScene(undefined, undefined, undefined, scenePosition);
  }, [screenToFlowPosition, createScene]);

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`w-full h-full relative transition-colors duration-200 select-none ${
        isDark ? 'bg-[#0f0f12]' : 'bg-[#f8fafc]'
      } ${lowSpecMode ? 'low-spec-mode' : ''}`}
    >
      {/* Node Palette Docked on Left */}
      <NodePalette
        onAddNode={handleAddNodeAtCenter}
        onAddScene={handleAddSceneAtCenter}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        deleteKeyCode={['Backspace', 'Delete']}
        edgesFocusable={true}
        connectionMode={ConnectionMode.Loose}
        connectionRadius={40}
        onPaneClick={() => setSelectedNodeId(null)}
        fitView
        minZoom={0.15}
        maxZoom={1.8}
        defaultEdgeOptions={{ type: 'deletableEdge' }}
      >
        <Background
          color={isDark ? '#26262b' : '#cbd5e1'}
          gap={24}
          size={1.2}
        />
        <Controls
          className={`!rounded-xl !overflow-hidden border ${
            isDark
              ? '!bg-[#18181b] !border-[#2e2e34] [&>button]:!bg-[#18181b] [&>button]:!border-[#2e2e34] [&>button]:!fill-yellow-400 [&>button:hover]:!bg-[#26262b]'
              : '!bg-white !border-slate-200 [&>button]:!bg-white [&>button]:!border-slate-200 [&>button]:!fill-rose-600 [&>button:hover]:!bg-slate-100 shadow-sm'
          }`}
        />
      </ReactFlow>
    </div>
  );
};

export const StoryCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <StoryCanvasInner />
    </ReactFlowProvider>
  );
};
