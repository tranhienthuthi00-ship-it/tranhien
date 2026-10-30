import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Handle,
  Position,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Brain,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Download,
  Upload,
  FolderPlus,
  Layout,
  ListTree,
  GraduationCap,
  CheckCircle2,
  Circle,
  Star,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Palette,
  Lightbulb,
  Copy,
  Wand2,
  HelpCircle,
  Eye,
  Check,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import type { MindmapItem } from '../types';

// Predefined palette for study nodes
const NODE_COLORS = [
  { id: 'yellow', name: 'Vàng Chanh', bg: '#FEF08A', border: '#141414', text: '#141414' },
  { id: 'mint', name: 'Xanh Bạc Hà', bg: '#DCFCE7', border: '#141414', text: '#141414' },
  { id: 'sky', name: 'Xanh Da Trời', bg: '#DBEAFE', border: '#141414', text: '#141414' },
  { id: 'pink', name: 'Hồng Phấn', bg: '#FCE7F3', border: '#141414', text: '#141414' },
  { id: 'purple', name: 'Tím Oải Hương', bg: '#EDE9FE', border: '#141414', text: '#141414' },
  { id: 'peach', name: 'Cam Đào', bg: '#FFEDD5', border: '#141414', text: '#141414' },
  { id: 'emerald', name: 'Ngọc Bích', bg: '#A7F3D0', border: '#141414', text: '#141414' },
  { id: 'white', name: 'Trắng Ngà', bg: '#FFFFFF', border: '#141414', text: '#141414' },
];

const TEMPLATES = [
  {
    id: 'blank',
    name: 'Sơ đồ cơ bản',
    desc: 'Chủ đề gốc ở trung tâm, sẵn sàng mở rộng',
    icon: Lightbulb,
    generate: (title: string) => ({
      nodes: [
        {
          id: 'root',
          type: 'custom',
          data: { label: title || 'Chủ Đề Trung Tâm', notes: 'Ghi chú tổng quan về chủ đề', isRoot: true, important: true },
          position: { x: 300, y: 200 },
          style: { background: '#FEF08A' }
        },
        {
          id: 'b1',
          type: 'custom',
          data: { label: 'Nhánh Ý Tưởng 1', notes: 'Nội dung chi tiết nhánh 1' },
          position: { x: 650, y: 120 },
          style: { background: '#DBEAFE' }
        },
        {
          id: 'b2',
          type: 'custom',
          data: { label: 'Nhánh Ý Tưởng 2', notes: 'Nội dung chi tiết nhánh 2' },
          position: { x: 650, y: 280 },
          style: { background: '#DCFCE7' }
        }
      ],
      edges: [
        { id: 'e-root-b1', source: 'root', target: 'b1', style: { stroke: '#141414', strokeWidth: 2 } },
        { id: 'e-root-b2', source: 'root', target: 'b2', style: { stroke: '#141414', strokeWidth: 2 } }
      ]
    })
  },
  {
    id: 'study-plan',
    name: 'Lộ Trình Ôn Thi & Mục Tiêu',
    desc: 'Chia theo 3 giai đoạn: Nền tảng, Luyện tập, Về đích',
    icon: GraduationCap,
    generate: (title: string) => ({
      nodes: [
        {
          id: 'root',
          type: 'custom',
          data: { label: title || 'Lộ Trình Ôn Tập', notes: 'Mục tiêu điểm số và thời gian biểu', isRoot: true, important: true },
          position: { x: 300, y: 220 },
          style: { background: '#FEF08A' }
        },
        {
          id: 'phase-1',
          type: 'custom',
          data: { label: 'Giai Đoạn 1: Nắm Vững Nền Tảng', notes: 'Học lý thuyết, thuật ngữ cốt lõi' },
          position: { x: 680, y: 100 },
          style: { background: '#DBEAFE' }
        },
        {
          id: 'phase-2',
          type: 'custom',
          data: { label: 'Giai Đoạn 2: Luyện Giải Bài Tập', notes: 'Làm đề kiểm tra, sửa lỗi sai' },
          position: { x: 680, y: 240 },
          style: { background: '#DCFCE7' }
        },
        {
          id: 'phase-3',
          type: 'custom',
          data: { label: 'Giai Đoạn 3: Tổng Ôn & Tối Ưu', notes: 'Bấm giờ thi thử, củng cố kiến thức yếu' },
          position: { x: 680, y: 380 },
          style: { background: '#FFEDD5' }
        }
      ],
      edges: [
        { id: 'e-1', source: 'root', target: 'phase-1', animated: true, style: { stroke: '#141414', strokeWidth: 2 } },
        { id: 'e-2', source: 'root', target: 'phase-2', animated: true, style: { stroke: '#141414', strokeWidth: 2 } },
        { id: 'e-3', source: 'root', target: 'phase-3', animated: true, style: { stroke: '#141414', strokeWidth: 2 } }
      ]
    })
  },
  {
    id: 'summary',
    name: 'Tóm Tắt Sách & Bài Học',
    desc: 'Khái niệm chính, Luận điểm, Ví dụ thực tế',
    icon: BookOpen,
    generate: (title: string) => ({
      nodes: [
        {
          id: 'root',
          type: 'custom',
          data: { label: title || 'Tóm Tắt Bài Học', notes: 'Ý tưởng cốt lõi của bài giảng/chương sách', isRoot: true, important: true },
          position: { x: 300, y: 200 },
          style: { background: '#A7F3D0' }
        },
        {
          id: 'c-concept',
          type: 'custom',
          data: { label: 'Định Nghĩa & Bản Chất', notes: 'Giải thích bằng lời văn của chính mình' },
          position: { x: 680, y: 110 },
          style: { background: '#FEF3C7' }
        },
        {
          id: 'c-points',
          type: 'custom',
          data: { label: 'Các Luận Điểm Then Chốt', notes: 'Luận cứ và các dẫn chứng' },
          position: { x: 680, y: 230 },
          style: { background: '#E0E7FF' }
        },
        {
          id: 'c-example',
          type: 'custom',
          data: { label: 'Ứng Dụng & Liên Hệ Thực Tế', notes: 'Cách vận dụng vào bài làm hoặc cuộc sống' },
          position: { x: 680, y: 350 },
          style: { background: '#FCE7F3' }
        }
      ],
      edges: [
        { id: 'e-s1', source: 'root', target: 'c-concept', style: { stroke: '#141414', strokeWidth: 2 } },
        { id: 'e-s2', source: 'root', target: 'c-points', style: { stroke: '#141414', strokeWidth: 2 } },
        { id: 'e-s3', source: 'root', target: 'c-example', style: { stroke: '#141414', strokeWidth: 2 } }
      ]
    })
  }
];

// Custom Node for React Flow
interface CustomNodeProps {
  id: string;
  data: {
    label: string;
    notes?: string;
    color?: string;
    completed?: boolean;
    important?: boolean;
    isRoot?: boolean;
    onAddChild?: (parentId: string) => void;
    onDelete?: (nodeId: string) => void;
    onToggleComplete?: (nodeId: string) => void;
  };
  selected?: boolean;
  style?: React.CSSProperties;
}

function CustomMindmapNodeComponent({ id, data, selected, style }: CustomNodeProps) {
  const isCompleted = !!data.completed;
  const isImportant = !!data.important;
  const isRoot = !!data.isRoot;

  return (
    <div
      className={cn(
        'group relative px-4 py-2.5 rounded-xl border-2 border-[#141414] transition-all duration-200 select-none min-w-[130px] max-w-[260px]',
        selected ? 'ring-2 ring-blue-500 ring-offset-2 scale-[1.03]' : '',
        isRoot ? 'font-black text-sm shadow-[4px_4px_0px_#141414]' : 'font-bold text-xs shadow-[3px_3px_0px_#141414]',
        isCompleted ? 'opacity-85' : 'opacity-100'
      )}
      style={{
        backgroundColor: (style?.background as string) || data.color || '#FFFFFF',
        color: '#141414'
      }}
    >
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-[#141414] !border-2 !border-white hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-[#141414] !border-2 !border-white hover:!scale-125 transition-transform"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-[#141414] !border-2 !border-white hover:!scale-125 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-[#141414] !border-2 !border-white hover:!scale-125 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      <div className="flex items-start gap-1.5">
        {!isRoot && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              data.onToggleComplete?.(id);
            }}
            className="shrink-0 mt-0.5 text-ink/70 hover:text-emerald-700 transition-colors"
            title={isCompleted ? 'Đã nắm vững (Bấm để bỏ)' : 'Đánh dấu đã hiểu / đã học'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-ink/40 hover:text-ink" />
            )}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className={cn('leading-snug break-words', isCompleted && !isRoot ? 'line-through text-ink/60' : 'text-ink')}>
            {data.label || 'Nhánh mới'}
          </div>

          {data.notes && (
            <div className="text-[10px] text-ink/70 mt-1 line-clamp-1 italic font-normal flex items-center gap-1 border-t border-ink/10 pt-0.5">
              <span>📝</span>
              <span className="truncate">{data.notes}</span>
            </div>
          )}
        </div>

        {isImportant && (
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
        )}
      </div>

      {/* Floating Action Buttons on Node Hover / Selected */}
      <div className="absolute -top-3.5 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            data.onAddChild?.(id);
          }}
          className="bg-amber-400 hover:bg-amber-500 text-ink text-[10px] font-black w-6 h-6 rounded-full border border-ink flex items-center justify-center shadow-[1px_1px_0px_#141414] hover:scale-110 transition-transform"
          title="Thêm nhánh con"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
        </button>

        {!isRoot && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete?.(id);
            }}
            className="bg-rose-400 hover:bg-rose-500 text-white text-[10px] font-black w-6 h-6 rounded-full border border-ink flex items-center justify-center shadow-[1px_1px_0px_#141414] hover:scale-110 transition-transform"
            title="Xóa nhánh này"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

const nodeTypes = {
  custom: CustomMindmapNodeComponent
};

export interface StudyHubProps {
  mindmaps: MindmapItem[];
  setMindmaps: (maps: MindmapItem[] | ((prev: MindmapItem[]) => MindmapItem[])) => void;
}

export function StudyHub({ mindmaps, setMindmaps }: StudyHubProps) {
  // Active Mind Map
  const [activeMapId, setActiveMapId] = useState<string>(() => {
    return mindmaps && mindmaps.length > 0 ? mindmaps[0].id : '';
  });

  // Ensure an active map is always selected
  useEffect(() => {
    if (mindmaps && mindmaps.length > 0) {
      if (!activeMapId || !mindmaps.some((m) => m.id === activeMapId)) {
        setActiveMapId(mindmaps[0].id);
      }
    }
  }, [mindmaps, activeMapId]);

  const activeMap = useMemo(() => {
    return mindmaps?.find((m) => m.id === activeMapId) || mindmaps?.[0];
  }, [mindmaps, activeMapId]);

  // View mode: 'canvas' | 'outline' | 'study'
  const [viewMode, setViewMode] = useState<'canvas' | 'outline' | 'study'>('canvas');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Node Inspector selection
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newMapTitle, setNewMapTitle] = useState('');
  const [newMapCategory, setNewMapCategory] = useState('Kỹ năng học');
  const [newMapTemplate, setNewMapTemplate] = useState('blank');
  const [renameTitle, setRenameTitle] = useState('');
  const [renameDesc, setRenameDesc] = useState('');

  // Import / Export ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to update active map nodes & edges
  const updateCurrentMap = useCallback(
    (nextNodes: Node[], nextEdges: Edge[]) => {
      if (!activeMap) return;
      setMindmaps((prev) =>
        prev.map((m) =>
          m.id === activeMap.id
            ? { ...m, nodes: nextNodes, edges: nextEdges, updatedAt: Date.now() }
            : m
        )
      );
    },
    [activeMap, setMindmaps]
  );

  // Node and Edge handlers
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!activeMap) return;
      const nextNodes = applyNodeChanges(changes, activeMap.nodes);
      updateCurrentMap(nextNodes, activeMap.edges);
    },
    [activeMap, updateCurrentMap]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!activeMap) return;
      const nextEdges = applyEdgeChanges(changes, activeMap.edges);
      updateCurrentMap(activeMap.nodes, nextEdges);
    },
    [activeMap, updateCurrentMap]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!activeMap) return;
      const nextEdges = addEdge(
        {
          ...params,
          style: { stroke: '#141414', strokeWidth: 2 },
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#141414' }
        },
        activeMap.edges
      );
      updateCurrentMap(activeMap.nodes, nextEdges);
    },
    [activeMap, updateCurrentMap]
  );

  // Add child node
  const handleAddChildNode = useCallback(
    (parentId: string) => {
      if (!activeMap) return;
      const parentNode = activeMap.nodes.find((n) => n.id === parentId);
      if (!parentNode) return;

      const newId = `node-${Date.now()}`;
      // Offset child position to right with some random jitter
      const nextX = parentNode.position.x + 280;
      const childCount = activeMap.edges.filter((e) => e.source === parentId).length;
      const nextY = parentNode.position.y + (childCount * 90) - 40;

      const newNode: Node = {
        id: newId,
        type: 'custom',
        position: { x: nextX, y: nextY },
        data: {
          label: 'Nhánh con mới',
          notes: '',
          completed: false,
          color: '#FFFFFF'
        },
        style: {
          background: '#FFFFFF'
        }
      };

      const newEdge: Edge = {
        id: `e-${parentId}-${newId}`,
        source: parentId,
        target: newId,
        style: { stroke: '#141414', strokeWidth: 2 },
        animated: false
      };

      const nextNodes = [...activeMap.nodes, newNode];
      const nextEdges = [...activeMap.edges, newEdge];
      updateCurrentMap(nextNodes, nextEdges);
      setSelectedNodeId(newId);
    },
    [activeMap, updateCurrentMap]
  );

  // Add Sibling node
  const handleAddSiblingNode = useCallback(
    (targetNodeId: string) => {
      if (!activeMap) return;
      const incomingEdge = activeMap.edges.find((e) => e.target === targetNodeId);
      if (incomingEdge) {
        handleAddChildNode(incomingEdge.source);
      } else {
        // If it's a root node, add another branch beside it
        const targetNode = activeMap.nodes.find((n) => n.id === targetNodeId);
        if (!targetNode) return;
        const newId = `node-${Date.now()}`;
        const newNode: Node = {
          id: newId,
          type: 'custom',
          position: { x: targetNode.position.x, y: targetNode.position.y + 140 },
          data: { label: 'Chủ đề mới', notes: '', completed: false, isRoot: true },
          style: { background: '#FEF08A' }
        };
        updateCurrentMap([...activeMap.nodes, newNode], activeMap.edges);
        setSelectedNodeId(newId);
      }
    },
    [activeMap, handleAddChildNode, updateCurrentMap]
  );

  // Delete node
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (!activeMap) return;
      // Also delete connected edges
      const nextNodes = activeMap.nodes.filter((n) => n.id !== nodeId);
      const nextEdges = activeMap.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      );
      updateCurrentMap(nextNodes, nextEdges);
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [activeMap, selectedNodeId, updateCurrentMap]
  );

  // Toggle node completion
  const handleToggleComplete = useCallback(
    (nodeId: string) => {
      if (!activeMap) return;
      const nextNodes = activeMap.nodes.map((n) => {
        if (n.id === nodeId) {
          const isDone = !n.data?.completed;
          return {
            ...n,
            data: { ...n.data, completed: isDone }
          };
        }
        return n;
      });
      updateCurrentMap(nextNodes, activeMap.edges);
    },
    [activeMap, updateCurrentMap]
  );

  // Auto clean Tree Layout
  const handleAutoLayout = useCallback(() => {
    if (!activeMap || !activeMap.nodes || activeMap.nodes.length === 0) return;

    // Find roots (nodes with no incoming edges)
    const targets = new Set(activeMap.edges.map((e) => e.target));
    const rootNodes = activeMap.nodes.filter((n) => !targets.has(n.id));
    if (rootNodes.length === 0 && activeMap.nodes.length > 0) {
      rootNodes.push(activeMap.nodes[0]);
    }

    const positioned = new Map<string, { x: number; y: number }>();
    let currentY = 100;

    const layoutSubtree = (nodeId: string, level: number): { minY: number; maxY: number } => {
      const childEdges = activeMap.edges.filter((e) => e.source === nodeId);
      const children = childEdges.map((e) => e.target).filter((id) => id !== nodeId);

      const xPos = level * 280 + 100;

      if (children.length === 0) {
        const yPos = currentY;
        currentY += 90;
        positioned.set(nodeId, { x: xPos, y: yPos });
        return { minY: yPos, maxY: yPos };
      }

      let minY = Infinity;
      let maxY = -Infinity;

      for (const childId of children) {
        if (!positioned.has(childId)) {
          const range = layoutSubtree(childId, level + 1);
          minY = Math.min(minY, range.minY);
          maxY = Math.max(maxY, range.maxY);
        }
      }

      const yPos = (minY + maxY) / 2;
      positioned.set(nodeId, { x: xPos, y: yPos });
      return { minY, maxY };
    };

    rootNodes.forEach((root) => {
      layoutSubtree(root.id, 0);
      currentY += 60;
    });

    const nextNodes = activeMap.nodes.map((n) => {
      const pos = positioned.get(n.id);
      return pos ? { ...n, position: pos } : n;
    });

    updateCurrentMap(nextNodes, activeMap.edges);
  }, [activeMap, updateCurrentMap]);

  // Prepare custom node injection with callbacks
  const preparedNodes = useMemo(() => {
    if (!activeMap?.nodes) return [];
    return activeMap.nodes.map((node) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        node.data?.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.data?.notes && node.data.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      return {
        ...node,
        type: 'custom',
        selected: node.id === selectedNodeId,
        style: {
          ...node.style,
          background: node.style?.background || node.data?.color || '#FFFFFF',
          outline: matchesSearch && searchQuery.trim() ? '3px solid #3B82F6' : undefined
        },
        data: {
          ...node.data,
          onAddChild: handleAddChildNode,
          onDelete: handleDeleteNode,
          onToggleComplete: handleToggleComplete
        }
      };
    });
  }, [
    activeMap?.nodes,
    selectedNodeId,
    searchQuery,
    handleAddChildNode,
    handleDeleteNode,
    handleToggleComplete
  ]);

  // Selected node object
  const selectedNode = useMemo(() => {
    return activeMap?.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [activeMap?.nodes, selectedNodeId]);

  // Update selected node data
  const handleUpdateSelectedNode = (field: string, value: any) => {
    if (!selectedNodeId || !activeMap) return;
    const nextNodes = activeMap.nodes.map((n) => {
      if (n.id === selectedNodeId) {
        if (field === 'color') {
          return {
            ...n,
            style: { ...n.style, background: value },
            data: { ...n.data, color: value }
          };
        }
        return {
          ...n,
          data: { ...n.data, [field]: value }
        };
      }
      return n;
    });
    updateCurrentMap(nextNodes, activeMap.edges);
  };

  // Create new mindmap
  const handleCreateMindmap = () => {
    const title = newMapTitle.trim() || 'Sơ đồ tư duy mới';
    const tpl = TEMPLATES.find((t) => t.id === newMapTemplate) || TEMPLATES[0];
    const generated = tpl.generate(title);

    const newMap: MindmapItem = {
      id: `mm-${Date.now()}`,
      title,
      description: tpl.desc,
      category: newMapCategory,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nodes: generated.nodes,
      edges: generated.edges
    };

    setMindmaps((prev) => [newMap, ...prev]);
    setActiveMapId(newMap.id);
    setShowCreateModal(false);
    setNewMapTitle('');
  };

  // Duplicate active mindmap
  const handleDuplicateMindmap = () => {
    if (!activeMap) return;
    const newMap: MindmapItem = {
      ...activeMap,
      id: `mm-${Date.now()}`,
      title: `${activeMap.title} (Bản sao)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setMindmaps((prev) => [newMap, ...prev]);
    setActiveMapId(newMap.id);
  };

  // Delete active mindmap
  const handleDeleteMindmap = () => {
    if (!activeMap) return;
    if (mindmaps.length <= 1) {
      alert('Bạn cần giữ lại ít nhất một sơ đồ tư duy!');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa sơ đồ "${activeMap.title}"?`)) {
      setMindmaps((prev) => prev.filter((m) => m.id !== activeMap.id));
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    if (!activeMap) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeMap, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeMap.title.replace(/\s+/g, '_')}_mindmap.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.nodes && parsed.edges) {
          const importedMap: MindmapItem = {
            id: `mm-${Date.now()}`,
            title: parsed.title || 'Sơ đồ nhập từ tệp',
            description: parsed.description || '',
            category: parsed.category || 'Tự tạo',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            nodes: parsed.nodes,
            edges: parsed.edges
          };
          setMindmaps((prev) => [importedMap, ...prev]);
          setActiveMapId(importedMap.id);
          alert('Đã nhập sơ đồ tư duy thành công!');
        } else {
          alert('Tệp JSON không đúng cấu trúc sơ đồ tư duy.');
        }
      } catch (err) {
        alert('Lỗi khi đọc tệp JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Calculate stats
  const stats = useMemo(() => {
    if (!activeMap || !activeMap.nodes) return { total: 0, completed: 0, percent: 0 };
    const nonRootNodes = activeMap.nodes.filter((n) => !n.data?.isRoot);
    const total = nonRootNodes.length || activeMap.nodes.length;
    const completed = nonRootNodes.filter((n) => n.data?.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [activeMap]);

  return (
    <div className="w-full flex flex-col gap-4 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Hidden File Input for Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJSON}
        accept=".json"
        className="hidden"
      />

      {/* HEADER SECTION */}
      <div className="bg-[#FFFDF7] p-4 sm:p-5 rounded-[22px] border-[2.5px] border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-amber-400 border-2 border-[#141414] rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#141414] shrink-0">
            <Brain className="w-6 h-6 text-[#141414]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#141414] uppercase tracking-tight flex items-center gap-1.5">
                Học Hành & Sơ Đồ Tư Duy
              </h2>
              <span className="bg-emerald-100 border border-emerald-600 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                Mind Map Hub
              </span>
            </div>
            <p className="text-xs text-[#555] font-medium mt-0.5">
              Tạo sơ đồ tư duy, kết nối kiến thức, ôn tập theo chủ đề & siêu ghi nhớ
            </p>
          </div>
        </div>

        {/* Top Actions: Create, Template, Stats */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          {/* Progress Indicator */}
          {stats.total > 0 && (
            <div className="hidden sm:flex items-center gap-2 bg-[#EFECE6] border-2 border-[#141414] px-3 py-1.5 rounded-xl text-xs font-bold shadow-[2px_2px_0px_#141414]">
              <span>Đã hiểu:</span>
              <span className="text-emerald-700 font-black">{stats.completed}/{stats.total}</span>
              <div className="w-14 h-2 bg-white rounded-full border border-[#141414] overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
              <span className="text-[10px] text-ink/70">({stats.percent}%)</span>
            </div>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 sm:flex-none px-4 py-2 bg-amber-400 hover:bg-amber-300 text-ink text-xs font-black uppercase tracking-wider rounded-xl border-2 border-[#141414] shadow-[3px_3px_0px_#141414] flex items-center justify-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <FolderPlus className="w-4 h-4 stroke-[2.5]" />
            Tạo Sơ Đồ Mới
          </button>
        </div>
      </div>

      {/* MIND MAP SELECTOR & TOOLBAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#EFECE6] p-3 rounded-[20px] border-2 border-[#141414] shadow-[3px_3px_0px_#141414]">
        {/* Mind Map Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-black uppercase text-ink/60 shrink-0 pl-1">
            Sơ đồ:
          </span>
          {mindmaps && mindmaps.map((map) => {
            const isActive = map.id === activeMapId;
            return (
              <button
                key={map.id}
                onClick={() => {
                  setActiveMapId(map.id);
                  setSelectedNodeId(null);
                }}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold border-2 transition-all shrink-0 flex items-center gap-1.5',
                  isActive
                    ? 'bg-white text-ink border-[#141414] shadow-[2px_2px_0px_#141414] scale-105'
                    : 'bg-white/60 text-ink/70 border-transparent hover:border-[#141414]/30 hover:bg-white'
                )}
              >
                <Brain className={cn('w-3.5 h-3.5', isActive ? 'text-amber-500' : 'text-ink/40')} />
                <span className="truncate max-w-[150px]">{map.title}</span>
                {map.category && (
                  <span className="text-[9px] px-1.5 py-0.2 bg-black/5 rounded text-ink/60 font-medium">
                    {map.category}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* View Mode & Utility Buttons */}
        <div className="flex items-center gap-2 justify-end shrink-0 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center bg-white p-1 rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414]">
            <button
              onClick={() => setViewMode('canvas')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1',
                viewMode === 'canvas' ? 'bg-[#141414] text-white' : 'text-ink/60 hover:text-ink'
              )}
              title="Sơ đồ dạng đồ họa trực quan"
            >
              <Layout className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sơ Đồ</span>
            </button>
            <button
              onClick={() => setViewMode('outline')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1',
                viewMode === 'outline' ? 'bg-[#141414] text-white' : 'text-ink/60 hover:text-ink'
              )}
              title="Dàn bài dạng cây phân cấp"
            >
              <ListTree className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dàn Bài</span>
            </button>
            <button
              onClick={() => setViewMode('study')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1',
                viewMode === 'study' ? 'bg-[#141414] text-white' : 'text-ink/60 hover:text-ink'
              )}
              title="Chế độ ôn tập kiểm tra trí nhớ"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ôn Tập</span>
            </button>
          </div>

          {/* Quick Actions Dropdown / Buttons */}
          <button
            onClick={() => {
              if (activeMap) {
                setRenameTitle(activeMap.title);
                setRenameDesc(activeMap.description || '');
                setShowRenameModal(true);
              }
            }}
            className="p-2 bg-white hover:bg-amber-50 text-ink rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] transition-transform hover:scale-105"
            title="Đổi tên / Chỉnh sửa thông tin sơ đồ"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={handleDuplicateMindmap}
            className="p-2 bg-white hover:bg-amber-50 text-ink rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] transition-transform hover:scale-105"
            title="Nhân bản sơ đồ này"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportJSON}
            className="p-2 bg-white hover:bg-amber-50 text-ink rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] transition-transform hover:scale-105"
            title="Xuất tệp JSON (Sao lưu)"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-white hover:bg-amber-50 text-ink rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] transition-transform hover:scale-105"
            title="Nhập từ tệp JSON"
          >
            <Upload className="w-4 h-4" />
          </button>

          <button
            onClick={handleDeleteMindmap}
            className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] transition-transform hover:scale-105"
            title="Xóa sơ đồ này"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SEARCH & IN-CANVAS CONTROLS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center bg-white border-2 border-[#141414] px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#141414] w-full sm:w-72">
          <Search className="w-4 h-4 text-ink/40 mr-2" />
          <input
            type="text"
            placeholder="Tìm nhánh / từ khóa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none flex-1 text-xs font-bold text-ink placeholder:text-ink/40"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-ink/40 hover:text-ink">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {viewMode === 'canvas' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                if (selectedNodeId) {
                  handleAddChildNode(selectedNodeId);
                } else if (activeMap?.nodes && activeMap.nodes.length > 0) {
                  handleAddChildNode(activeMap.nodes[0].id);
                }
              }}
              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-ink border-2 border-[#141414] rounded-xl text-xs font-black shadow-[2px_2px_0px_#141414] flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              Thêm Nhánh Con
            </button>

            {selectedNodeId && (
              <button
                onClick={() => handleAddSiblingNode(selectedNodeId)}
                className="px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-ink border-2 border-[#141414] rounded-xl text-xs font-black shadow-[2px_2px_0px_#141414] flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                Nhánh Ngang Hàng
              </button>
            )}

            <button
              onClick={handleAutoLayout}
              className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-2 border-[#141414] rounded-xl text-xs font-black shadow-[2px_2px_0px_#141414] flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5"
              title="Tự động sắp xếp các nhánh thẳng hàng đẹp mắt"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Căn Chỉnh Tự Động
            </button>
          </div>
        )}
      </div>

      {/* MAIN VIEW AREA */}
      {viewMode === 'canvas' && (
        <div className="w-full h-[620px] bg-[#FFFDF7] rounded-[24px] border-[2.5px] border-[#141414] shadow-[5px_5px_0px_#141414] overflow-hidden relative">
          <ReactFlowProvider>
            <ReactFlow
              nodes={preparedNodes}
              edges={activeMap?.edges || []}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              onPaneClick={() => setSelectedNodeId(null)}
              fitView
              minZoom={0.2}
              maxZoom={2}
            >
              <Background color="#141414" gap={20} size={1.2} />
              <Controls className="!bg-white !border-2 !border-[#141414] !rounded-xl !shadow-[2px_2px_0px_#141414] !m-4" />
              <MiniMap
                nodeColor={(n) => (n.style?.background as string) || '#FEF08A'}
                className="!bg-white !border-2 !border-[#141414] !rounded-xl !shadow-[3px_3px_0px_#141414] !m-4 hidden sm:block"
                maskColor="rgba(255, 255, 255, 0.7)"
              />

              {/* Floating Helper Tip */}
              <Panel position="bottom-center" className="mb-4">
                <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-full border-2 border-[#141414] text-[11px] font-bold text-ink shadow-[2px_2px_0px_#141414] flex items-center gap-2">
                  <span>💡 <b>Mẹo:</b> Kéo các chấm tròn để nối nhánh • Bấm nút <b>+</b> trên nhánh để tạo nhánh con nhanh</span>
                </div>
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>

          {/* NODE INSPECTOR DRAWER / PANEL (When a node is selected) */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-4 right-4 z-40 w-80 max-w-[90vw] bg-white p-4 rounded-2xl border-[2.5px] border-[#141414] shadow-[5px_5px_0px_#141414] flex flex-col gap-3.5 max-h-[580px] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b-2 border-dashed border-[#141414]/20 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-black uppercase text-ink">
                      Chỉnh Sửa Nhánh Kiến Thức
                    </h4>
                  </div>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="text-ink/50 hover:text-ink p-1 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Node Title Input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-extrabold text-ink uppercase">
                    Tiêu đề nhánh:
                  </label>
                  <input
                    type="text"
                    value={selectedNode.data?.label || ''}
                    onChange={(e) => handleUpdateSelectedNode('label', e.target.value)}
                    className="px-3 py-2 text-xs font-bold text-ink bg-[#FFFDF7] border-2 border-[#141414] rounded-xl focus:bg-amber-50/50 outline-none"
                    placeholder="Nhập tên nhánh kiến thức..."
                  />
                </div>

                {/* Node Detailed Notes */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-extrabold text-ink uppercase flex items-center gap-1">
                    <span>Ghi chú / Mẹo ghi nhớ / Ví dụ:</span>
                  </label>
                  <textarea
                    rows={4}
                    value={selectedNode.data?.notes || ''}
                    onChange={(e) => handleUpdateSelectedNode('notes', e.target.value)}
                    className="px-3 py-2 text-xs font-medium text-ink bg-[#FFFDF7] border-2 border-[#141414] rounded-xl focus:bg-amber-50/50 outline-none resize-none"
                    placeholder="Ghi chú chi tiết, định nghĩa, công thức, ví dụ minh họa..."
                  />
                </div>

                {/* Color Swatches */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-extrabold text-ink uppercase flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5" /> Màu sắc nhánh:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {NODE_COLORS.map((col) => {
                      const isSelected =
                        (selectedNode.style?.background as string) === col.bg ||
                        selectedNode.data?.color === col.bg;
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => handleUpdateSelectedNode('color', col.bg)}
                          className={cn(
                            'h-7 rounded-lg border-2 border-[#141414] flex items-center justify-center transition-transform hover:scale-105',
                            isSelected ? 'ring-2 ring-black scale-105' : ''
                          )}
                          style={{ backgroundColor: col.bg }}
                          title={col.name}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-[#141414]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Options: Completed & Important */}
                <div className="flex flex-col gap-2 pt-1 border-t border-ink/10">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink">
                    <input
                      type="checkbox"
                      checked={!!selectedNode.data?.completed}
                      onChange={(e) => handleUpdateSelectedNode('completed', e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded border-2 border-[#141414]"
                    />
                    <span>Đã nắm vững / Hoàn thành kiến thức</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink">
                    <input
                      type="checkbox"
                      checked={!!selectedNode.data?.important}
                      onChange={(e) => handleUpdateSelectedNode('important', e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded border-2 border-[#141414]"
                    />
                    <span>Đánh dấu trọng tâm ⭐</span>
                  </label>
                </div>

                {/* Node Actions */}
                <div className="flex gap-2 pt-2 border-t border-ink/10">
                  <button
                    onClick={() => handleAddChildNode(selectedNode.id)}
                    className="flex-1 py-1.5 bg-amber-400 hover:bg-amber-300 text-ink text-xs font-black rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center justify-center gap-1 active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Thêm Con
                  </button>

                  {!selectedNode.data?.isRoot && (
                    <button
                      onClick={() => handleDeleteNode(selectedNode.id)}
                      className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-black rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5"
                      title="Xóa nhánh này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* OUTLINE TREE VIEW */}
      {viewMode === 'outline' && (
        <div className="bg-[#FFFDF7] p-5 sm:p-6 rounded-[24px] border-[2.5px] border-[#141414] shadow-[5px_5px_0px_#141414] flex flex-col gap-4 min-h-[500px]">
          <div className="flex items-center justify-between border-b-2 border-dashed border-[#141414]/20 pb-3">
            <div>
              <h3 className="text-base font-black text-ink uppercase flex items-center gap-2">
                <ListTree className="w-5 h-5 text-amber-500" />
                Dàn Ý Phân Cấp Kiến Thức
              </h3>
              <p className="text-xs text-ink/60">
                Chỉnh sửa trực tiếp danh sách hoặc đánh dấu hoàn thành nhanh chóng
              </p>
            </div>
            <button
              onClick={() => {
                if (activeMap?.nodes && activeMap.nodes.length > 0) {
                  handleAddChildNode(activeMap.nodes[0].id);
                }
              }}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-ink text-xs font-black rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm Nhánh Mới
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {activeMap?.nodes && activeMap.nodes.map((node) => {
              const incoming = activeMap.edges.find((e) => e.target === node.id);
              const parentId = incoming?.source;
              const hasParent = !!parentId;
              const isDone = !!node.data?.completed;

              return (
                <div
                  key={node.id}
                  className={cn(
                    'p-3 rounded-xl border-2 border-[#141414] flex items-start gap-3 transition-all',
                    hasParent ? 'ml-6 sm:ml-10 bg-white' : 'bg-amber-50 font-black',
                    isDone ? 'opacity-70 bg-gray-50' : ''
                  )}
                  style={{
                    backgroundColor: hasParent ? (node.style?.background as string) || '#fff' : '#FEF08A'
                  }}
                >
                  <button
                    onClick={() => handleToggleComplete(node.id)}
                    className="mt-0.5 text-ink hover:text-emerald-600 transition-colors shrink-0"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-4 h-4 text-ink/40" />
                    )}
                  </button>

                  <div className="flex-1 flex flex-col gap-1">
                    <input
                      type="text"
                      value={node.data?.label || ''}
                      onChange={(e) => {
                        const nextNodes = activeMap.nodes.map((n) =>
                          n.id === node.id ? { ...n, data: { ...n.data, label: e.target.value } } : n
                        );
                        updateCurrentMap(nextNodes, activeMap.edges);
                      }}
                      className={cn(
                        'bg-transparent font-bold text-xs sm:text-sm text-ink outline-none border-b border-transparent focus:border-[#141414]',
                        isDone ? 'line-through text-ink/50' : ''
                      )}
                    />
                    {node.data?.notes && (
                      <p className="text-xs text-ink/70 font-normal italic">
                        📝 {node.data.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleAddChildNode(node.id)}
                      className="p-1.5 hover:bg-black/10 rounded-lg text-ink"
                      title="Thêm nhánh con"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    {!node.data?.isRoot && (
                      <button
                        onClick={() => handleDeleteNode(node.id)}
                        className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-600"
                        title="Xóa nhánh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STUDY MODE (ACTIVE RECALL & FLASH TEST) */}
      {viewMode === 'study' && (
        <div className="bg-[#FFFDF7] p-5 sm:p-6 rounded-[24px] border-[2.5px] border-[#141414] shadow-[5px_5px_0px_#141414] flex flex-col gap-5 min-h-[500px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-dashed border-[#141414]/20 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-ink uppercase flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                Chế Độ Ôn Luyện Trí Nhớ (Active Recall)
              </h3>
              <p className="text-xs text-ink/60 mt-0.5">
                Nhìn tiêu đề nhánh, tự gợi nhớ kiến thức, sau đó bấm xem đáp án để kiểm tra!
              </p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 border-2 border-emerald-600 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 shrink-0">
              <span>Độ hoàn thành:</span>
              <span className="font-black text-sm">{stats.percent}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeMap?.nodes && activeMap.nodes.filter((n) => !n.data?.isRoot).map((node) => {
              const isDone = !!node.data?.completed;
              return (
                <StudyFlashCard
                  key={node.id}
                  node={node}
                  isDone={isDone}
                  onToggleDone={() => handleToggleComplete(node.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: CREATE MIND MAP */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FFFDF7] w-full max-w-md p-6 rounded-[24px] border-[2.5px] border-[#141414] shadow-[6px_6px_0px_#141414] flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b-2 border-dashed border-[#141414]/20 pb-3">
                <h3 className="text-base font-black uppercase text-ink flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Tạo Sơ Đồ Tư Duy Mới
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-ink/50 hover:text-ink p-1 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-ink uppercase">
                  Tên Sơ Đồ / Chủ Đề:
                </label>
                <input
                  type="text"
                  value={newMapTitle}
                  onChange={(e) => setNewMapTitle(e.target.value)}
                  placeholder="Ví dụ: Luyện Thi B2, Toán Giải Tích, Dự Án Mới..."
                  className="px-3.5 py-2 text-sm font-bold text-ink bg-white border-2 border-[#141414] rounded-xl outline-none focus:bg-amber-50"
                  autoFocus
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-ink uppercase">
                  Chuyên mục / Thể loại:
                </label>
                <select
                  value={newMapCategory}
                  onChange={(e) => setNewMapCategory(e.target.value)}
                  className="px-3 py-2 text-xs font-bold text-ink bg-white border-2 border-[#141414] rounded-xl outline-none"
                >
                  <option value="Kỹ năng học">🧠 Kỹ Năng & Tư Duy</option>
                  <option value="Tiếng Anh">🇬🇧 Tiếng Anh & Ngoại Ngữ</option>
                  <option value="Ôn Thi">🎯 Ôn Thi & Kiểm Tra</option>
                  <option value="Dự Án">💼 Dự Án & Công Việc</option>
                  <option value="Đời Sống">🌱 Đời Sống & Kế Hoạch</option>
                  <option value="Khác">✨ Khác</option>
                </select>
              </div>

              {/* Starter Template */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-ink uppercase">
                  Mẫu dựng sẵn (Template):
                </label>
                <div className="flex flex-col gap-2">
                  {TEMPLATES.map((tpl) => {
                    const isSelected = newMapTemplate === tpl.id;
                    const Icon = tpl.icon;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => setNewMapTemplate(tpl.id)}
                        className={cn(
                          'p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3',
                          isSelected
                            ? 'bg-amber-100 border-[#141414] shadow-[2px_2px_0px_#141414]'
                            : 'bg-white border-[#141414]/30 hover:border-[#141414]'
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white border border-[#141414] flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-ink" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-xs text-ink">{tpl.name}</div>
                          <div className="text-[11px] text-ink/60 truncate">{tpl.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-ink text-xs font-black uppercase rounded-xl border-2 border-[#141414]"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateMindmap}
                  className="flex-1 py-2 bg-amber-400 hover:bg-amber-300 text-ink text-xs font-black uppercase rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414]"
                >
                  Tạo Ngay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: RENAME MIND MAP */}
      <AnimatePresence>
        {showRenameModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FFFDF7] w-full max-w-sm p-6 rounded-[24px] border-[2.5px] border-[#141414] shadow-[6px_6px_0px_#141414] flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b-2 border-dashed border-[#141414]/20 pb-3">
                <h3 className="text-base font-black uppercase text-ink flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-500" />
                  Đổi Tên Sơ Đồ
                </h3>
                <button
                  onClick={() => setShowRenameModal(false)}
                  className="text-ink/50 hover:text-ink p-1 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-ink uppercase">
                  Tên Sơ Đồ:
                </label>
                <input
                  type="text"
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  className="px-3.5 py-2 text-sm font-bold text-ink bg-white border-2 border-[#141414] rounded-xl outline-none"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-ink uppercase">
                  Mô Tả:
                </label>
                <input
                  type="text"
                  value={renameDesc}
                  onChange={(e) => setRenameDesc(e.target.value)}
                  className="px-3.5 py-2 text-xs font-medium text-ink bg-white border-2 border-[#141414] rounded-xl outline-none"
                  placeholder="Mục tiêu của sơ đồ này..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowRenameModal(false)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-ink text-xs font-black uppercase rounded-xl border-2 border-[#141414]"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (activeMap && renameTitle.trim()) {
                      setMindmaps((prev) =>
                        prev.map((m) =>
                          m.id === activeMap.id
                            ? { ...m, title: renameTitle.trim(), description: renameDesc.trim(), updatedAt: Date.now() }
                            : m
                        )
                      );
                      setShowRenameModal(false);
                    }
                  }}
                  className="flex-1 py-2 bg-amber-400 hover:bg-amber-300 text-ink text-xs font-black uppercase rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414]"
                >
                  Lưu Lại
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Flash Card Component for Study Mode
function StudyFlashCard({
  node,
  isDone,
  onToggleDone
}: {
  node: Node;
  isDone: boolean;
  onToggleDone: () => void;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      className={cn(
        'p-4 rounded-2xl border-2 border-[#141414] shadow-[3px_3px_0px_#141414] transition-all flex flex-col justify-between gap-3',
        isDone ? 'bg-emerald-50/70 border-emerald-700' : 'bg-white'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-ink">{String(node.data?.label || '')}</span>
          {Boolean(node.data?.important) && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
        </div>
        <button
          onClick={onToggleDone}
          className="text-xs font-bold text-ink flex items-center gap-1 shrink-0"
        >
          {isDone ? (
            <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-600 flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" /> Đã Nhớ
            </span>
          ) : (
            <span className="text-ink/60 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-full border border-[#141414]/30">
              Cần Ôn Lại
            </span>
          )}
        </button>
      </div>

      {/* Answer / Notes reveal */}
      <div className="bg-[#FFFDF7] p-3 rounded-xl border border-dashed border-[#141414]/30 min-h-[60px] flex items-center justify-center text-center">
        {revealed ? (
          <p className="text-xs text-ink/80 font-medium leading-relaxed">
            {String(node.data?.notes || 'Không có ghi chú thêm cho nhánh này.')}
          </p>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 py-1 px-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Bấm để xem ghi chú & đáp án
          </button>
        )}
      </div>

      {revealed && (
        <div className="flex justify-end">
          <button
            onClick={() => setRevealed(false)}
            className="text-[11px] font-bold text-ink/50 hover:text-ink underline"
          >
            Ẩn lại
          </button>
        </div>
      )}
    </div>
  );
}
