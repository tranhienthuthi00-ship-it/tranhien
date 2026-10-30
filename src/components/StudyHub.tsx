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
  BookOpen,
  Palette,
  Lightbulb,
  Copy,
  Wand2,
  Eye,
  Check,
  FileText,
  Cloud,
  CheckSquare,
  Square,
  RotateCcw,
  Fish,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import type { MindmapItem } from '../types';

// Palette for study nodes
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

// Sample Outlines for Quick Insertion
const SAMPLE_OUTLINES = [
  {
    id: 'history',
    name: '📚 Ôn Tập Lịch Sử: Các Cuộc Kháng Chiến',
    text: `Lịch Sử Việt Nam Thế Kỷ 20
  Cách Mạng Tháng Tám 1945 // Thắng lợi lịch sử mở ra kỷ nguyên độc lập
    [v] Thời cơ ngàn năm có một
    [v] Diễn biến khởi nghĩa Hà Nội, Huế, Sài Gòn
    Ý nghĩa tuyên ngôn độc lập 2/9
  Chiến Dịch Điện Biên Phủ 1954 // Đánh bại thực dân Pháp
    [v] Kế hoạch Nava của Pháp
    Phương châm đánh chắc tiến chắc
    3 Đợt tiến công tiêu diệt cứ điểm
    Ý nghĩa hiệp định Giơ-ne-vơ
  Đại Thắng Mùa Xuân 1975 // Giải phóng hoàn toàn miền Nam
    Chiến dịch Tây Nguyên mở màn
    Chiến dịch Huế - Đà Nẵng
    Chiến dịch Hồ Chí Minh lịch sử
    Bài học đại đoàn kết dân tộc`
  },
  {
    id: 'english-grammar',
    name: '🇬🇧 Tiếng Anh: Hệ Thống Các Thì Cốt Lõi',
    text: `Hệ Thống Các Thì Trong Tiếng Anh
  Thì Hiện Tại (Present Tenses) // Diễn tả sự thật hoặc hành động ở hiện tại
    [v] Present Simple (Hiện tại đơn) // Thói quen, chân lý: S + V(s/es)
    [v] Present Continuous (Hiện tại tiếp diễn) // Đang xảy ra: S + am/is/are + V-ing
    Present Perfect (Hiện tại hoàn thành) // Vừa mới, kinh nghiệm: S + have/has + V3/ed
    Present Perfect Continuous // Nhấn mạnh tính liên tục
  Thì Quá Khứ (Past Tenses) // Hành động đã kết thúc trong quá khứ
    [v] Past Simple (Quá khứ đơn) // Mốc thời gian cụ thể: S + V2/ed
    Past Continuous (Quá khứ tiếp diễn) // Đang xảy ra tại thời điểm quá khứ
    Past Perfect (Quá khứ hoàn thành) // Xảy ra trước một hành động quá khứ khác
  Thì Tương Lai (Future Tenses) // Kế hoạch và dự đoán
    Future Simple (Tương lai đơn) // Quyết định tại lúc nói: will + V
    Near Future (Tương lai gần) // Có kế hoạch trước: be going to + V
    Future Continuous // Đang diễn ra ở thời điểm tương lai`
  },
  {
    id: 'ishikawa',
    name: '🐟 Xương Cá Ishikawa: Tối Ưu Hóa Năng Suất',
    text: `Nâng Cao Năng Suất Cá Nhân & Học Tập
  Phương Pháp (Methods) // Quy trình làm việc và thói quen
    [v] Kỹ thuật Pomodoro 25/5
    Active Recall & Lặp lại ngắt quãng
    Quy tắc 2 phút cho việc nhỏ
  Công Cụ & Môi Trường (Tools & Environment) // Không gian tập trung
    [v] Bàn học gọn gàng, đủ ánh sáng
    Ứng dụng chặn thông báo mạng xã hội
    Sổ tay ghi chú công việc nhanh
  Con Người & Tâm Lý (Mindset & Health) // Năng lượng và thể chất
    Ngủ đủ 7-8 tiếng mỗi đêm
    Uống đủ nước và tập thể dục nhẹ
    Duy trì động lực từ mục tiêu lớn`
  }
];

const TEMPLATES = [
  {
    id: 'roadmap-journey',
    name: '🛤️ Lộ Trình Học Uốn Lượn (Như ảnh mẫu)',
    desc: 'Đường dẫn uốn lượn hình chữ S với các mốc bài học, huy hiệu B2 và thẻ ghi nhớ',
    icon: Sparkles,
    generate: (title: string) => ({
      nodes: [
        {
          id: 'step-1',
          type: 'custom',
          data: { label: 'Hoàn thành đơn & Hoàn thành tiếp diễn', notes: 'Phân biệt cách dùng và ngữ cảnh thực tế', completed: true, isRoadmap: true, milestoneIndex: 1, milestoneBadge: '1' },
          position: { x: 360, y: 80 }
        },
        {
          id: 'step-2',
          type: 'custom',
          data: { label: 'Quá khứ hoàn thành tiếp diễn', notes: 'Nhấn mạnh tính liên tục của hành động trong quá khứ', completed: true, isRoadmap: true, milestoneIndex: 2, milestoneBadge: '✓' },
          position: { x: 230, y: 250 }
        },
        {
          id: 'step-3',
          type: 'custom',
          data: { label: title || 'Kể chuyện nhiều lớp thời gian', notes: 'Phối hợp các thì quá khứ một cách tự nhiên', completed: false, isRoadmap: true, milestoneIndex: 3, milestoneBadge: 'B2', isCurrentActive: true },
          position: { x: 230, y: 420 }
        },
        {
          id: 'step-4',
          type: 'custom',
          data: { label: 'So sánh tăng tiến và so sánh nhất', notes: 'Các cấu trúc nâng cao giúp diễn đạt sinh động', completed: false, isRoadmap: true, milestoneIndex: 4, milestoneBadge: '4' },
          position: { x: 360, y: 590 }
        },
        {
          id: 'step-5',
          type: 'custom',
          data: { label: 'Câu điều kiện hỗn hợp (Mixed Conditionals)', notes: 'Kết hợp điều kiện loại 2 và loại 3 linh hoạt', completed: false, isRoadmap: true, milestoneIndex: 5, milestoneBadge: '5' },
          position: { x: 490, y: 760 }
        }
      ],
      edges: [
        { id: 'e-r1', source: 'step-1', target: 'step-2', sourceHandle: 'bottom', targetHandle: 'top', style: { stroke: '#7C3AED', strokeWidth: 8, strokeLinecap: 'round' } },
        { id: 'e-r2', source: 'step-2', target: 'step-3', sourceHandle: 'bottom', targetHandle: 'top', style: { stroke: '#7C3AED', strokeWidth: 8, strokeLinecap: 'round' } },
        { id: 'e-r3', source: 'step-3', target: 'step-4', sourceHandle: 'bottom', targetHandle: 'top', style: { stroke: '#7C3AED', strokeWidth: 8, strokeLinecap: 'round' } },
        { id: 'e-r4', source: 'step-4', target: 'step-5', sourceHandle: 'bottom', targetHandle: 'top', style: { stroke: '#7C3AED', strokeWidth: 8, strokeLinecap: 'round' } }
      ]
    })
  },
  {
    id: 'blank',
    name: 'Sơ đồ xương cá cơ bản',
    desc: 'Trục xương sống nằm ngang với các nhánh xương sườn cân đối',
    icon: Fish,
    generate: (title: string) => ({
      nodes: [
        {
          id: 'root',
          type: 'custom',
          data: { label: title || 'Chủ Đề Xương Sống', notes: 'Ý tưởng cốt lõi xuyên suốt', isRoot: true, important: true },
          position: { x: 80, y: 350 },
          style: { background: '#FEF08A' }
        },
        {
          id: 'b1',
          type: 'custom',
          data: { label: 'Xương Nhánh 1 (Trên)', notes: 'Nội dung phân nhánh phía trên', completed: false },
          position: { x: 420, y: 190 },
          style: { background: '#DBEAFE' }
        },
        {
          id: 'b2',
          type: 'custom',
          data: { label: 'Xương Nhánh 2 (Dưới)', notes: 'Nội dung phân nhánh phía dưới', completed: false },
          position: { x: 420, y: 510 },
          style: { background: '#DCFCE7' }
        },
        {
          id: 'b3',
          type: 'custom',
          data: { label: 'Xương Nhánh 3 (Trên)', notes: 'Nội dung phân nhánh tiếp theo', completed: false },
          position: { x: 740, y: 190 },
          style: { background: '#FCE7F3' }
        },
        {
          id: 'b4',
          type: 'custom',
          data: { label: 'Xương Nhánh 4 (Dưới)', notes: 'Nội dung phân nhánh tiếp theo', completed: false },
          position: { x: 740, y: 510 },
          style: { background: '#FFEDD5' }
        }
      ],
      edges: [
        { id: 'e-root-b1', source: 'root', target: 'b1', style: { stroke: '#141414', strokeWidth: 3 } },
        { id: 'e-root-b2', source: 'root', target: 'b2', style: { stroke: '#141414', strokeWidth: 3 } },
        { id: 'e-root-b3', source: 'root', target: 'b3', style: { stroke: '#141414', strokeWidth: 3 } },
        { id: 'e-root-b4', source: 'root', target: 'b4', style: { stroke: '#141414', strokeWidth: 3 } }
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
          position: { x: 80, y: 350 },
          style: { background: '#FEF08A' }
        },
        {
          id: 'phase-1',
          type: 'custom',
          data: { label: 'Giai Đoạn 1: Nền Tảng', notes: 'Học lý thuyết, thuật ngữ cốt lõi' },
          position: { x: 420, y: 190 },
          style: { background: '#DBEAFE' }
        },
        {
          id: 'phase-2',
          type: 'custom',
          data: { label: 'Giai Đoạn 2: Giải Bài Tập', notes: 'Luyện đề kiểm tra, sửa lỗi sai' },
          position: { x: 420, y: 510 },
          style: { background: '#DCFCE7' }
        },
        {
          id: 'phase-3',
          type: 'custom',
          data: { label: 'Giai Đoạn 3: Tổng Ôn', notes: 'Bấm giờ thi thử, củng cố kiến thức yếu' },
          position: { x: 740, y: 190 },
          style: { background: '#FFEDD5' }
        }
      ],
      edges: [
        { id: 'e-1', source: 'root', target: 'phase-1', style: { stroke: '#141414', strokeWidth: 3 } },
        { id: 'e-2', source: 'root', target: 'phase-2', style: { stroke: '#141414', strokeWidth: 3 } },
        { id: 'e-3', source: 'root', target: 'phase-3', style: { stroke: '#141414', strokeWidth: 3 } }
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
          data: { label: title || 'Tóm Tắt Bài Học', notes: 'Ý tưởng cốt lõi của bài giảng', isRoot: true, important: true },
          position: { x: 80, y: 350 },
          style: { background: '#A7F3D0' }
        },
        {
          id: 'c-concept',
          type: 'custom',
          data: { label: 'Định Nghĩa & Khái Niệm', notes: 'Giải thích bằng lời văn của chính mình' },
          position: { x: 420, y: 190 },
          style: { background: '#FEF3C7' }
        },
        {
          id: 'c-points',
          type: 'custom',
          data: { label: 'Luận Điểm Then Chốt', notes: 'Luận cứ và các dẫn chứng' },
          position: { x: 420, y: 510 },
          style: { background: '#E0E7FF' }
        },
        {
          id: 'c-example',
          type: 'custom',
          data: { label: 'Ứng Dụng Thực Tế', notes: 'Cách vận dụng vào bài làm hoặc cuộc sống' },
          position: { x: 740, y: 190 },
          style: { background: '#FCE7F3' }
        }
      ],
      edges: [
        { id: 'e-s1', source: 'root', target: 'c-concept', style: { stroke: '#141414', strokeWidth: 3 } },
        { id: 'e-s2', source: 'root', target: 'c-points', style: { stroke: '#141414', strokeWidth: 3 } },
        { id: 'e-s3', source: 'root', target: 'c-example', style: { stroke: '#141414', strokeWidth: 3 } }
      ]
    })
  }
];

// 1. Serpentine Learning Path Layout Engine (Inspired by user's reference diagram in IMG_3834_bc3ec55e.jpeg)
export function applyRoadmapLayout(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  if (!nodes || nodes.length === 0) return { nodes: [], edges: [] };

  // Determine logical sequential order of milestones via BFS from root or first node
  const targetIds = new Set(edges.map((e) => e.target));
  const rootNode = nodes.find((n) => n.data?.isRoot) || nodes.find((n) => !targetIds.has(n.id)) || nodes[0];

  const childrenMap = new Map<string, string[]>();
  edges.forEach((edge) => {
    const list = childrenMap.get(edge.source) || [];
    list.push(edge.target);
    childrenMap.set(edge.source, list);
  });

  const orderedIds: string[] = [];
  const visited = new Set<string>();
  const queue: string[] = [rootNode.id];
  visited.add(rootNode.id);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    orderedIds.push(curr);
    const children = childrenMap.get(curr) || [];
    children.forEach((c) => {
      if (!visited.has(c)) {
        visited.add(c);
        queue.push(c);
      }
    });
  }

  // Add any unreached nodes to the sequence
  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      visited.add(n.id);
      orderedIds.push(n.id);
    }
  });

  // Identify first uncompleted milestone as "Bạn đang ở đây" (You are here)
  let firstUnmasteredIdx = -1;
  orderedIds.forEach((id, idx) => {
    const n = nodes.find((node) => node.id === id);
    if (firstUnmasteredIdx === -1 && !n?.data?.completed) {
      firstUnmasteredIdx = idx;
    }
  });
  if (firstUnmasteredIdx === -1) firstUnmasteredIdx = 0;

  const startY = 80;
  const stepY = 170;
  const centerX = 360;
  const amplitude = 130;

  const nextNodes = nodes.map((node) => {
    const seqIdx = orderedIds.indexOf(node.id);
    const idx = seqIdx >= 0 ? seqIdx : 0;

    // Sinusoidal curve for the winding learning road
    const posX = centerX + Math.sin(idx * 0.95) * amplitude;
    const posY = startY + idx * stepY;

    // Extract or infer badge text (e.g. B2, B1, A2, or index)
    let badgeText = '';
    const labelUpper = (node.data?.label || '').toUpperCase();
    if (labelUpper.includes('B2')) badgeText = 'B2';
    else if (labelUpper.includes('B1')) badgeText = 'B1';
    else if (labelUpper.includes('A2')) badgeText = 'A2';
    else if (labelUpper.includes('C1')) badgeText = 'C1';
    else if (node.data?.isRoot) badgeText = '★';
    else badgeText = String(idx + 1);

    const isCurrentActive = idx === firstUnmasteredIdx && !node.data?.completed;

    return {
      ...node,
      position: { x: posX, y: posY },
      data: {
        ...node.data,
        isRoadmap: true,
        milestoneIndex: idx + 1,
        milestoneBadge: badgeText,
        isCurrentActive
      }
    };
  });

  // Connect sequential milestones along the serpentine highway with smooth ribbon edges
  const roadmapEdges: Edge[] = [];
  for (let i = 0; i < orderedIds.length - 1; i++) {
    const sourceId = orderedIds[i];
    const targetId = orderedIds[i + 1];
    roadmapEdges.push({
      id: `road-edge-${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      sourceHandle: 'bottom',
      targetHandle: 'top',
      type: 'default',
      animated: false,
      style: {
        stroke: '#7C3AED',
        strokeWidth: 8,
        strokeLinecap: 'round',
        filter: 'drop-shadow(0 2px 4px rgba(124, 58, 237, 0.3))'
      }
    });
  }

  return { nodes: nextNodes, edges: roadmapEdges.length > 0 ? roadmapEdges : edges };
}

// 2. Refined Fishbone Layout Engine: Auto aligns nodes without colliding or overlapping
export function applyFishboneLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (!nodes || nodes.length === 0) return [];

  // Find root node (marked isRoot or no incoming edges)
  const targetIds = new Set(edges.map((e) => e.target));
  let rootNode = nodes.find((n) => n.data?.isRoot) || nodes.find((n) => !targetIds.has(n.id)) || nodes[0];

  const centerY = 360;
  const startX = 80;

  // Build adjacency map
  const childrenMap = new Map<string, string[]>();
  edges.forEach((edge) => {
    const list = childrenMap.get(edge.source) || [];
    list.push(edge.target);
    childrenMap.set(edge.source, list);
  });

  const positioned = new Map<string, { x: number; y: number }>();
  positioned.set(rootNode.id, { x: startX, y: centerY });

  // Level 1 children (Primary Ribs of the Fishbone)
  const level1Ids = (childrenMap.get(rootNode.id) || []).filter((id) => id !== rootNode.id);

  // Position ribs alternating: Top Rib (index 0, 2, 4...) and Bottom Rib (index 1, 3, 5...)
  level1Ids.forEach((ribId, index) => {
    const colIndex = Math.floor(index / 2);
    const isTop = index % 2 === 0;

    // Generous horizontal spacing between ribs
    const ribX = startX + 340 + colIndex * 380;
    const ribY = isTop ? centerY - 160 : centerY + 160;

    positioned.set(ribId, { x: ribX, y: ribY });

    // Level 2 children (Sub-branches from this rib)
    const level2Ids = childrenMap.get(ribId) || [];
    level2Ids.forEach((childId, cIdx) => {
      // Dynamic vertical distribution based on child index
      const childX = ribX + 180 + (cIdx % 2) * 20;
      const childY = isTop
        ? ribY - 75 - cIdx * 80
        : ribY + 75 + cIdx * 80;

      positioned.set(childId, { x: childX, y: childY });

      // Level 3 children (Sub-sub branches)
      const level3Ids = childrenMap.get(childId) || [];
      const l3Count = level3Ids.length;
      level3Ids.forEach((subId, sIdx) => {
        const subX = childX + 220;
        const subY = childY + (sIdx - (l3Count - 1) / 2) * 60;
        positioned.set(subId, { x: subX, y: subY });
      });
    });
  });

  // For any orphaned or unpositioned nodes, neatly stack them below
  let fallbackY = centerY + 320;
  nodes.forEach((n) => {
    if (!positioned.has(n.id)) {
      positioned.set(n.id, { x: startX + 360, y: fallbackY });
      fallbackY += 85;
    }
  });

  return nodes.map((node) => {
    const pos = positioned.get(node.id);
    return pos
      ? { ...node, position: pos, data: { ...node.data, isRoadmap: false } }
      : { ...node, data: { ...node.data, isRoadmap: false } };
  });
}

// Custom Node for React Flow: Supports both Curved Learning Roadmap (IMG_3834_bc3ec55e) and Fishbone
interface CustomNodeProps {
  id: string;
  data: {
    label: string;
    notes?: string;
    color?: string;
    completed?: boolean;
    important?: boolean;
    isRoot?: boolean;
    isRoadmap?: boolean;
    milestoneIndex?: number;
    milestoneBadge?: string;
    isCurrentActive?: boolean;
    onAddChild?: (parentId: string) => void;
    onDelete?: (nodeId: string) => void;
    onToggleComplete?: (nodeId: string) => void;
    onEditNode?: (nodeId: string) => void;
  };
  selected?: boolean;
  style?: React.CSSProperties;
}

function CustomMindmapNodeComponent({ id, data, selected, style }: CustomNodeProps) {
  const isCompleted = !!data.completed;
  const isImportant = !!data.important;
  const isRoot = !!data.isRoot;

  // --- 1. ROADMAP / LEARNING PATHWAY NODE (AS IN IMG_3834_bc3ec55e.jpeg) ---
  if (data.isRoadmap) {
    const isCurrentActive = !!data.isCurrentActive;
    const badgeText = data.milestoneBadge || '';
    const isLevelBadge = badgeText === 'B2' || badgeText === 'B1' || badgeText === 'A2' || badgeText === 'C1' || badgeText === '★';

    return (
      <div
        onDoubleClick={(e) => {
          e.stopPropagation();
          data.onEditNode?.(id);
        }}
        className={cn(
          "relative flex items-center gap-3.5 select-none cursor-pointer group transition-all duration-200",
          selected ? "scale-105" : ""
        )}
        title="Nhấn đúp để chỉnh sửa"
      >
        {/* Connection Handles */}
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="!w-3 !h-3 !bg-[#6D28D9] !border-2 !border-white !-top-1.5"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="!w-3 !h-3 !bg-[#6D28D9] !border-2 !border-white !-bottom-1.5"
        />

        {/* Milestone Circle (Centered along the serpentine track) */}
        <div className="relative shrink-0 flex items-center justify-center">
          {isCompleted ? (
            // Completed / Mastered state: Solid purple circle with white checkmark
            <div className="w-13 h-13 rounded-full bg-[#6D28D9] border-[4px] border-white shadow-[0_4px_12px_rgba(109,40,217,0.35)] flex items-center justify-center ring-4 ring-[#6D28D9]/20 transition-transform group-hover:scale-110">
              <Check className="w-6 h-6 text-white stroke-[3.5]" />
            </div>
          ) : isCurrentActive ? (
            // Active state: Vibrant golden circle with "Bạn đang ở đây" badge
            <div className="relative flex flex-col items-center">
              <div className="w-13 h-13 rounded-full bg-amber-400 border-[4px] border-white shadow-[0_4px_14px_rgba(245,158,11,0.5)] flex items-center justify-center ring-4 ring-amber-300 transition-transform group-hover:scale-110">
                <Star className="w-6 h-6 text-amber-950 fill-amber-950" />
              </div>
              <div className="absolute -bottom-6 whitespace-nowrap bg-[#141414] text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-lg border border-white/20 z-30 animate-bounce">
                Bạn đang ở đây
              </div>
            </div>
          ) : isLevelBadge ? (
            // Level Badge circle (e.g. B2) with double ring and bold text
            <div className="w-13 h-13 rounded-full bg-white border-[4px] border-[#6D28D9] shadow-md flex items-center justify-center ring-4 ring-purple-100 transition-transform group-hover:scale-110">
              <span className="text-sm font-black text-[#6D28D9] tracking-tight">{badgeText}</span>
            </div>
          ) : (
            // Numbered Milestone Circle
            <div className="w-12 h-12 rounded-full bg-white border-[3.5px] border-slate-300 shadow-sm flex items-center justify-center ring-4 ring-slate-100 transition-transform group-hover:scale-110">
              <span className="text-xs font-black text-slate-700">{data.milestoneIndex || '•'}</span>
            </div>
          )}
        </div>

        {/* Milestone Card (Speech-bubble style card as in IMG_3834_bc3ec55e.jpeg) */}
        <div
          className={cn(
            "min-w-[190px] max-w-[320px] bg-white px-4 py-3 rounded-2xl border-[2.5px] border-[#141414] shadow-[3px_3px_0px_#141414] transition-all relative",
            isCompleted ? "bg-[#FAF8FF] border-[#6D28D9]" : "",
            isCurrentActive ? "border-amber-500 shadow-[3px_3px_0px_#F59E0B]" : ""
          )}
        >
          {/* Level / Category chip and mastery checkbox */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#6D28D9]">
              {isLevelBadge ? `LEVEL ${badgeText}` : `MỐC ${data.milestoneIndex || 1}`}
            </span>

            {/* Checkbox for Mastery */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                data.onToggleComplete?.(id);
              }}
              className={cn(
                "flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border transition-all cursor-pointer active:scale-95",
                isCompleted
                  ? "bg-purple-100 text-[#6D28D9] border-purple-400 hover:bg-purple-200"
                  : "bg-slate-50 text-slate-600 border-slate-300 hover:border-slate-600 hover:text-slate-900"
              )}
              title={isCompleted ? "Đã nắm! Bấm để bỏ tick" : "Chưa nắm. Bấm để tick 'Đã nắm'"}
            >
              {isCompleted ? (
                <>
                  <CheckSquare className="w-3 h-3 text-[#6D28D9] stroke-[2.5]" />
                  <span>Đã nắm</span>
                </>
              ) : (
                <>
                  <Square className="w-3 h-3 text-slate-400" />
                  <span>Chưa nắm</span>
                </>
              )}
            </button>
          </div>

          {/* Topic Title */}
          <div className={cn("text-xs font-black text-[#141414] leading-snug break-words", isCompleted ? "text-purple-950" : "")}>
            {data.label || 'Nội dung mốc học'}
          </div>

          {/* Progress underline bar (as seen in IMG_3834_bc3ec55e.jpeg) */}
          <div className="w-full h-1 bg-black/10 rounded-full mt-2 overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300",
                isCompleted ? "w-full bg-[#6D28D9]" : isCurrentActive ? "w-2/3 bg-amber-400" : "w-1/3 bg-slate-300"
              )}
            />
          </div>

          {/* Optional notes */}
          {data.notes && (
            <div className="text-[10px] text-slate-600 mt-1.5 line-clamp-2 italic font-normal border-t border-slate-100 pt-1">
              {data.notes}
            </div>
          )}

          {/* Action buttons on hover */}
          <div className="absolute -top-3 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                data.onEditNode?.(id);
              }}
              className="bg-sky-400 hover:bg-sky-500 text-ink text-[10px] font-black w-5 h-5 rounded-full border border-ink flex items-center justify-center shadow-[1px_1px_0px_#141414] hover:scale-110"
              title="Sửa nội dung"
            >
              <Edit3 className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                data.onAddChild?.(id);
              }}
              className="bg-amber-400 hover:bg-amber-500 text-ink text-[10px] font-black w-5 h-5 rounded-full border border-ink flex items-center justify-center shadow-[1px_1px_0px_#141414] hover:scale-110"
              title="Thêm mốc tiếp theo"
            >
              <Plus className="w-2.5 h-2.5 stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                data.onDelete?.(id);
              }}
              className="bg-rose-400 hover:bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full border border-ink flex items-center justify-center shadow-[1px_1px_0px_#141414] hover:scale-110"
              title="Xóa mốc này"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. FISHBONE DIAGRAM NODE ---
  return (
    <div
      onDoubleClick={(e) => {
        e.stopPropagation();
        data.onEditNode?.(id);
      }}
      className={cn(
        'group relative px-3.5 py-2.5 rounded-2xl border-2 border-[#141414] transition-all duration-200 select-none min-w-[140px] max-w-[270px] cursor-pointer',
        selected ? 'ring-2 ring-blue-500 ring-offset-2 scale-[1.02]' : '',
        isRoot
          ? 'font-black text-sm shadow-[4px_4px_0px_#141414] bg-[#FEF08A] border-[2.5px]'
          : 'font-bold text-xs shadow-[3px_3px_0px_#141414]',
        isCompleted && !isRoot ? 'bg-emerald-50/90 border-emerald-800' : ''
      )}
      style={{
        backgroundColor: isCompleted && !isRoot ? '#ECFDF5' : (style?.background as string) || data.color || '#FFFFFF',
        color: '#141414'
      }}
      title="Nhấn đúp để chỉnh sửa"
    >
      {/* Handles for spine & rib connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-[#141414] !border-2 !border-white hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-[#141414] !border-2 !border-white hover:!scale-125 transition-transform"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2 !h-2 !bg-[#141414] !border-2 !border-white hover:!scale-125 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2 !h-2 !bg-[#141414] !border-2 !border-white hover:!scale-125 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* Header: Mastery Checkbox or Root Spine Badge */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        {isRoot ? (
          <span className="text-[9px] font-black uppercase tracking-wider bg-black/10 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Fish className="w-3 h-3" /> Trục Xương Sống
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              data.onToggleComplete?.(id);
            }}
            className={cn(
              "flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border transition-all cursor-pointer active:scale-95",
              isCompleted
                ? "bg-emerald-100 text-emerald-800 border-emerald-600 hover:bg-emerald-200"
                : "bg-white/80 text-ink/70 border-ink/30 hover:border-ink hover:text-ink hover:bg-white"
            )}
            title={isCompleted ? "Đã nắm! Bấm để bỏ tick" : "Chưa nắm. Bấm để tick 'Đã nắm'"}
          >
            {isCompleted ? (
              <>
                <CheckSquare className="w-3 h-3 text-emerald-700 stroke-[3]" />
                <span>Đã nắm</span>
              </>
            ) : (
              <>
                <Square className="w-3 h-3 text-ink/40" />
                <span>Chưa nắm</span>
              </>
            )}
          </button>
        )}

        {isImportant && (
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
        )}
      </div>

      {/* Node Content */}
      <div className="flex items-start gap-1.5">
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              'leading-snug break-words',
              isRoot ? 'text-sm font-black' : 'text-xs font-bold',
              isCompleted && !isRoot ? 'text-emerald-950' : 'text-ink'
            )}
          >
            {data.label || 'Nhánh mới'}
          </div>

          {data.notes && (
            <div className="text-[10px] text-ink/75 mt-1 line-clamp-2 italic font-normal flex items-start gap-1 border-t border-ink/10 pt-1">
              <span>📝</span>
              <span className="break-words">{data.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Buttons on Node Hover / Selected */}
      <div className="absolute -top-3.5 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            data.onEditNode?.(id);
          }}
          className="bg-sky-400 hover:bg-sky-500 text-ink text-[10px] font-black w-6 h-6 rounded-full border border-ink flex items-center justify-center shadow-[1px_1px_0px_#141414] hover:scale-110 transition-transform"
          title="Nhấn đúp hoặc bấm để sửa"
        >
          <Edit3 className="w-3 h-3" />
        </button>

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

  // Filter for Mastery: 'all' | 'unmastered' | 'mastered'
  const [masteryFilter, setMasteryFilter] = useState<'all' | 'unmastered' | 'mastered'>('all');

  // Diagram layout style: 'roadmap' (Learning path S-curve as in IMG_3834_bc3ec55e) | 'fishbone' (Ishikawa)
  const [diagramLayout, setDiagramLayout] = useState<'roadmap' | 'fishbone'>('roadmap');

  // Cloud sync indicator state
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Auto-arrange enabled flag (true by default as requested: "tự sắp xếp lại hiển thị khi thêm hoặc xoá")
  const [autoArrangeEnabled, setAutoArrangeEnabled] = useState(true);

  // Node Inspector selection & double-click edit modal
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isEditingNodeModalOpen, setIsEditingNodeModalOpen] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dropdown for more actions
  const [showMoreActions, setShowMoreActions] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showOutlineModal, setShowOutlineModal] = useState(false);

  // Outline Paste State
  const [outlineInput, setOutlineInput] = useState('');
  const [outlineMode, setOutlineMode] = useState<'replace' | 'new'>('replace');

  const [newMapTitle, setNewMapTitle] = useState('');
  const [newMapCategory, setNewMapCategory] = useState('Kỹ năng học');
  const [newMapTemplate, setNewMapTemplate] = useState('blank');
  const [renameTitle, setRenameTitle] = useState('');
  const [renameDesc, setRenameDesc] = useState('');

  // Import / Export ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fullscreen toggler
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (containerRef.current?.requestFullscreen) {
          containerRef.current.requestFullscreen().catch(() => {});
        } else if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch (e) {
        // Fallback to CSS fullscreen
      }
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      } catch (e) {
        // ignore
      }
    }
  }, [isFullscreen]);

  // Fullscreen event listener (Esc key or exit fullscreen)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Helper to update active map nodes & edges (and sync across devices)
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
          style: { stroke: '#7C3AED', strokeWidth: 4, strokeLinecap: 'round' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#7C3AED' }
        },
        activeMap.edges
      );
      updateCurrentMap(activeMap.nodes, nextEdges);
    },
    [activeMap, updateCurrentMap]
  );

  // Auto clean layout (Roadmap or Fishbone)
  const handleAutoLayout = useCallback(
    (targetLayout?: 'roadmap' | 'fishbone') => {
      if (!activeMap || !activeMap.nodes || activeMap.nodes.length === 0) return;
      const layoutToApply = targetLayout || diagramLayout;
      if (layoutToApply === 'roadmap') {
        const { nodes: arrangedNodes, edges: arrangedEdges } = applyRoadmapLayout(activeMap.nodes, activeMap.edges);
        updateCurrentMap(arrangedNodes, arrangedEdges);
      } else {
        const arrangedNodes = applyFishboneLayout(activeMap.nodes, activeMap.edges);
        updateCurrentMap(arrangedNodes, activeMap.edges);
      }
    },
    [activeMap, diagramLayout, updateCurrentMap]
  );

  // Manual Sync trigger
  const handleManualSync = () => {
    setIsSyncingCloud(true);
    setSyncToast('Đang đồng bộ Firestore...');
    if (activeMap) {
      updateCurrentMap([...activeMap.nodes], [...activeMap.edges]);
    }
    setTimeout(() => {
      setIsSyncingCloud(false);
      setSyncToast('Đã đồng bộ trên các thiết bị! ☁️');
      setTimeout(() => setSyncToast(null), 3500);
    }, 500);
  };

  // Add child node with Auto-arrange
  const handleAddChildNode = useCallback(
    (parentId: string) => {
      if (!activeMap) return;
      const parentNode = activeMap.nodes.find((n) => n.id === parentId);
      if (!parentNode) return;

      const newId = `node-${Date.now()}`;
      const isParentRoot = !!parentNode.data?.isRoot;

      const newNode: Node = {
        id: newId,
        type: 'custom',
        position: { x: parentNode.position.x + 120, y: parentNode.position.y + 140 },
        data: {
          label: isParentRoot ? 'Mốc học mới' : 'Nội dung tiếp theo',
          notes: '',
          completed: false,
          color: isParentRoot ? '#EDE9FE' : '#FFFFFF'
        },
        style: {
          background: isParentRoot ? '#EDE9FE' : '#FFFFFF'
        }
      };

      const newEdge: Edge = {
        id: `e-${parentId}-${newId}`,
        source: parentId,
        target: newId,
        style: { stroke: '#7C3AED', strokeWidth: isParentRoot ? 4 : 3, strokeLinecap: 'round' },
        animated: false
      };

      let nextNodes = [...activeMap.nodes, newNode];
      let nextEdges = [...activeMap.edges, newEdge];

      // Auto re-align in selected format if enabled
      if (autoArrangeEnabled) {
        if (diagramLayout === 'roadmap') {
          const res = applyRoadmapLayout(nextNodes, nextEdges);
          nextNodes = res.nodes;
          nextEdges = res.edges;
        } else {
          nextNodes = applyFishboneLayout(nextNodes, nextEdges);
        }
      }

      updateCurrentMap(nextNodes, nextEdges);
      setSelectedNodeId(newId);
    },
    [activeMap, autoArrangeEnabled, diagramLayout, updateCurrentMap]
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
        handleAddChildNode(targetNode.id);
      }
    },
    [activeMap, handleAddChildNode]
  );

  // Delete node with Auto-arrange
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (!activeMap) return;

      // Find all descendant node IDs recursively
      const toDelete = new Set<string>([nodeId]);
      let changed = true;
      while (changed) {
        changed = false;
        activeMap.edges.forEach((edge) => {
          if (toDelete.has(edge.source) && !toDelete.has(edge.target)) {
            toDelete.add(edge.target);
            changed = true;
          }
        });
      }

      let nextNodes = activeMap.nodes.filter((n) => !toDelete.has(n.id));
      let nextEdges = activeMap.edges.filter(
        (e) => !toDelete.has(e.source) && !toDelete.has(e.target)
      );

      // Auto re-align remaining nodes
      if (autoArrangeEnabled && nextNodes.length > 0) {
        if (diagramLayout === 'roadmap') {
          const res = applyRoadmapLayout(nextNodes, nextEdges);
          nextNodes = res.nodes;
          nextEdges = res.edges;
        } else {
          nextNodes = applyFishboneLayout(nextNodes, nextEdges);
        }
      }

      updateCurrentMap(nextNodes, nextEdges);
      if (selectedNodeId && toDelete.has(selectedNodeId)) setSelectedNodeId(null);
    },
    [activeMap, autoArrangeEnabled, diagramLayout, selectedNodeId, updateCurrentMap]
  );

  // Toggle node completion (mastered / unmastered)
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

  // Parse Outline text into Fishbone nodes and edges
  const handleParseAndApplyOutline = () => {
    if (!outlineInput.trim()) return;

    const lines = outlineInput
      .split('\n')
      .map((l) => l.replace(/\r$/, ''))
      .filter((l) => l.trim().length > 0);

    if (lines.length === 0) return;

    interface ParsedLine {
      id: string;
      level: number;
      label: string;
      notes: string;
      completed: boolean;
      important: boolean;
      parentId?: string;
    }

    const parsed: ParsedLine[] = [];
    const stack: { level: number; id: string }[] = [];

    lines.forEach((line, idx) => {
      // Calculate level
      let level = 0;
      let trimmed = line;

      // Check markdown headers
      if (line.startsWith('#### ')) {
        level = 3;
        trimmed = line.replace(/^####\s+/, '');
      } else if (line.startsWith('### ')) {
        level = 2;
        trimmed = line.replace(/^###\s+/, '');
      } else if (line.startsWith('## ')) {
        level = 1;
        trimmed = line.replace(/^##\s+/, '');
      } else if (line.startsWith('# ')) {
        level = 0;
        trimmed = line.replace(/^#\s+/, '');
      } else {
        // Count leading tabs or 2-4 spaces
        const matchSpaces = line.match(/^([ \t]+)/);
        if (matchSpaces) {
          const ws = matchSpaces[1];
          const tabs = (ws.match(/\t/g) || []).length;
          const spaces = (ws.match(/ /g) || []).length;
          level = tabs + Math.floor(spaces / 2);
        }
        trimmed = line.trim();
      }

      // Strip bullet points: -, *, +, 1., 1.1., a.
      trimmed = trimmed.replace(/^[-*+•]\s+/, '').replace(/^\d+[\.\)]\s+/, '');

      // Check for check status [x], [v], [ ]
      let completed = false;
      if (/^\[[xXvV]\]\s*/.test(trimmed)) {
        completed = true;
        trimmed = trimmed.replace(/^\[[xXvV]\]\s*/, '');
      } else if (/^\[\s*\]\s*/.test(trimmed)) {
        completed = false;
        trimmed = trimmed.replace(/^\[\s*\]\s*/, '');
      }

      // Check for note delimiter: // or (note: ...)
      let notes = '';
      if (trimmed.includes('//')) {
        const parts = trimmed.split('//');
        trimmed = parts[0].trim();
        notes = parts.slice(1).join('//').trim();
      }

      const id = `node-${idx}-${Date.now()}`;

      // Resolve parent using stack
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      const parentId = stack.length > 0 ? stack[stack.length - 1].id : undefined;
      stack.push({ level, id });

      parsed.push({
        id,
        level,
        label: trimmed || `Nhánh ${idx + 1}`,
        notes,
        completed,
        important: level <= 1,
        parentId
      });
    });

    if (parsed.length === 0) return;

    // Convert into React Flow nodes and edges
    const newNodes: Node[] = parsed.map((p, idx) => {
      const isRoot = idx === 0 || p.level === 0;
      let bg = '#FFFFFF';
      if (isRoot) bg = '#FEF08A';
      else if (p.level === 1) {
        const colors = ['#DBEAFE', '#DCFCE7', '#FCE7F3', '#FFEDD5', '#EDE9FE'];
        bg = colors[idx % colors.length];
      }

      return {
        id: p.id,
        type: 'custom',
        position: { x: 100, y: 100 },
        data: {
          label: p.label,
          notes: p.notes,
          completed: p.completed,
          important: p.important,
          isRoot: isRoot,
          color: bg
        },
        style: { background: bg }
      };
    });

    const newEdges: Edge[] = [];
    parsed.forEach((p) => {
      if (p.parentId) {
        newEdges.push({
          id: `e-${p.parentId}-${p.id}`,
          source: p.parentId,
          target: p.id,
          style: { stroke: '#141414', strokeWidth: p.level === 1 ? 3 : 2 },
          animated: false
        });
      }
    });

    // Apply Selected Layout (Roadmap or Fishbone)
    let arrangedNodes = newNodes;
    let finalEdges = newEdges;
    if (diagramLayout === 'roadmap') {
      const res = applyRoadmapLayout(newNodes, newEdges);
      arrangedNodes = res.nodes;
      finalEdges = res.edges;
    } else {
      arrangedNodes = applyFishboneLayout(newNodes, newEdges);
    }

    if (outlineMode === 'new') {
      const newMap: MindmapItem = {
        id: `mm-${Date.now()}`,
        title: parsed[0]?.label || (diagramLayout === 'roadmap' ? 'Lộ trình học từ Dàn ý' : 'Sơ đồ xương cá từ Dàn ý'),
        description: `Tạo tự động từ dàn ý (${parsed.length} mục)`,
        category: 'Học tập',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        nodes: arrangedNodes,
        edges: finalEdges
      };
      setMindmaps((prev) => [newMap, ...prev]);
      setActiveMapId(newMap.id);
    } else {
      updateCurrentMap(arrangedNodes, finalEdges);
    }

    setShowOutlineModal(false);
    setOutlineInput('');
  };

  // Prepare custom node injection with callbacks and diagram layout
  const preparedNodes = useMemo(() => {
    if (!activeMap?.nodes) return [];

    // Find first unmastered milestone for active indicator
    let firstUnmasteredId = '';
    for (const n of activeMap.nodes) {
      if (!n.data?.completed && !firstUnmasteredId) {
        firstUnmasteredId = n.id;
        break;
      }
    }
    if (!firstUnmasteredId && activeMap.nodes.length > 0) {
      firstUnmasteredId = activeMap.nodes[0].id;
    }

    return activeMap.nodes.map((node, index) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        node.data?.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.data?.notes && node.data.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const isCompleted = !!node.data?.completed;
      let isVisibleByMastery = true;
      if (masteryFilter === 'mastered') isVisibleByMastery = isCompleted;
      if (masteryFilter === 'unmastered') isVisibleByMastery = !isCompleted;

      const isCurrentActive = node.id === firstUnmasteredId && !isCompleted;

      // Extract level badge text if any (e.g. B2, B1, A2, C1)
      let badgeText = node.data?.milestoneBadge || '';
      if (!badgeText) {
        const labelUpper = (node.data?.label || '').toUpperCase();
        if (labelUpper.includes('B2')) badgeText = 'B2';
        else if (labelUpper.includes('B1')) badgeText = 'B1';
        else if (labelUpper.includes('A2')) badgeText = 'A2';
        else if (labelUpper.includes('C1')) badgeText = 'C1';
        else if (node.data?.isRoot) badgeText = '★';
        else badgeText = String(index + 1);
      }

      return {
        ...node,
        type: 'custom',
        selected: node.id === selectedNodeId,
        style: {
          ...node.style,
          background: node.style?.background || node.data?.color || '#FFFFFF',
          outline: matchesSearch && searchQuery.trim() ? '3px solid #3B82F6' : undefined,
          opacity: isVisibleByMastery ? 1 : 0.25
        },
        data: {
          ...node.data,
          isRoadmap: diagramLayout === 'roadmap' || !!node.data?.isRoadmap,
          milestoneIndex: node.data?.milestoneIndex || index + 1,
          milestoneBadge: badgeText,
          isCurrentActive,
          onAddChild: handleAddChildNode,
          onDelete: handleDeleteNode,
          onToggleComplete: handleToggleComplete,
          onEditNode: (nodeId: string) => {
            setSelectedNodeId(nodeId);
            setIsEditingNodeModalOpen(true);
          }
        }
      };
    });
  }, [
    activeMap?.nodes,
    selectedNodeId,
    searchQuery,
    masteryFilter,
    diagramLayout,
    handleAddChildNode,
    handleDeleteNode,
    handleToggleComplete
  ]);

  // Edges prepared with layout-specific styles
  const preparedEdges = useMemo(() => {
    if (!activeMap?.edges) return [];
    if (diagramLayout === 'roadmap') {
      return activeMap.edges.map((e) => ({
        ...e,
        type: 'default',
        style: {
          stroke: '#7C3AED',
          strokeWidth: 8,
          strokeLinecap: 'round'
        },
        animated: false
      }));
    }
    return activeMap.edges;
  }, [activeMap?.edges, diagramLayout]);

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
    const title = newMapTitle.trim() || 'Sơ đồ xương cá mới';
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

  // Calculate mastery stats
  const stats = useMemo(() => {
    if (!activeMap || !activeMap.nodes) return { total: 0, completed: 0, unmastered: 0, percent: 0 };
    const nonRootNodes = activeMap.nodes.filter((n) => !n.data?.isRoot);
    const total = nonRootNodes.length || activeMap.nodes.length;
    const completed = nonRootNodes.filter((n) => n.data?.completed).length;
    const unmastered = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, unmastered, percent };
  }, [activeMap]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full transition-all duration-200 flex flex-col",
        isFullscreen
          ? "fixed inset-0 z-[9999] bg-[#FFFDF7] p-2 sm:p-3 w-screen h-screen overflow-hidden"
          : "flex-1 pb-6 gap-2.5 animate-in fade-in duration-300"
      )}
    >
      {/* Hidden File Input for Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJSON}
        accept=".json"
        className="hidden"
      />

      {/* STREAMLINED COMPACT TOOLBAR */}
      <div className="bg-[#FFFDF7] p-2.5 sm:p-3 rounded-[20px] border-[2px] border-[#141414] shadow-[3px_3px_0px_#141414] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        {/* Left: Mindmap Selector & Create/Paste Actions */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Active Map Dropdown / Selector */}
          <div className="flex items-center gap-1.5 bg-[#EFECE6] px-3 py-1.5 rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414]">
            <Fish className="w-4 h-4 text-amber-500 shrink-0" />
            <select
              value={activeMapId}
              onChange={(e) => {
                setActiveMapId(e.target.value);
                setSelectedNodeId(null);
              }}
              className="bg-transparent font-black text-xs text-ink outline-none cursor-pointer max-w-[170px] sm:max-w-[220px] truncate"
            >
              {mindmaps && mindmaps.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* Create New Mind Map */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-ink text-xs font-black uppercase rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center gap-1 transition-all active:translate-x-0.5 active:translate-y-0.5"
            title="Tạo sơ đồ xương cá mới"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tạo Mới</span>
          </button>

          {/* Paste Outline */}
          <button
            onClick={() => setShowOutlineModal(true)}
            className="px-2.5 py-1.5 bg-sky-300 hover:bg-sky-200 text-ink text-xs font-black uppercase rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center gap-1 transition-all active:translate-x-0.5 active:translate-y-0.5"
            title="Dán nhanh dàn ý bài học để tự động tạo sơ đồ xương cá"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Dàn Ý</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#EFECE6] p-0.5 rounded-xl border-2 border-[#141414]">
            <button
              onClick={() => setViewMode('canvas')}
              className={cn(
                'px-2 py-1 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1',
                viewMode === 'canvas' ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#141414]' : 'text-ink/60 hover:text-ink'
              )}
              title="Sơ đồ xương cá"
            >
              <Layout className="w-3 h-3" />
              <span className="hidden sm:inline">Sơ Đồ</span>
            </button>
            <button
              onClick={() => setViewMode('outline')}
              className={cn(
                'px-2 py-1 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1',
                viewMode === 'outline' ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#141414]' : 'text-ink/60 hover:text-ink'
              )}
              title="Dàn bài phân cấp dạng cây"
            >
              <ListTree className="w-3 h-3" />
              <span className="hidden sm:inline">Dàn Bài</span>
            </button>
            <button
              onClick={() => setViewMode('study')}
              className={cn(
                'px-2 py-1 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1',
                viewMode === 'study' ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#141414]' : 'text-ink/60 hover:text-ink'
              )}
              title="Chế độ ôn tập flashcard"
            >
              <GraduationCap className="w-3 h-3" />
              <span className="hidden sm:inline">Ôn Tập</span>
            </button>
          </div>
        </div>

        {/* Right: Actions, Layout, Fullscreen, Filters */}
        <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
          {/* Search Box */}
          <div className="flex items-center bg-white border-2 border-[#141414] px-2.5 py-1 rounded-xl shadow-[2px_2px_0px_#141414] w-36 sm:w-44">
            <Search className="w-3.5 h-3.5 text-ink/40 mr-1.5 shrink-0" />
            <input
              type="text"
              placeholder="Tìm nhánh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none w-full text-xs font-bold text-ink placeholder:text-ink/40"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-ink/40 hover:text-ink">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Mastery Filter */}
          <div className="flex items-center bg-[#EFECE6] p-0.5 rounded-xl border-2 border-[#141414] text-[11px] font-bold">
            <button
              onClick={() => setMasteryFilter('all')}
              className={cn(
                'px-2 py-0.5 rounded-lg transition-colors',
                masteryFilter === 'all' ? 'bg-ink text-white' : 'text-ink/60 hover:text-ink'
              )}
            >
              Tất cả ({stats.total})
            </button>
            <button
              onClick={() => setMasteryFilter('unmastered')}
              className={cn(
                'px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1',
                masteryFilter === 'unmastered' ? 'bg-amber-400 text-ink' : 'text-amber-800 hover:text-ink'
              )}
              title="Chỉ hiện các ý chưa nắm"
            >
              <Square className="w-2.5 h-2.5" /> Chưa ({stats.unmastered})
            </button>
            <button
              onClick={() => setMasteryFilter('mastered')}
              className={cn(
                'px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1',
                masteryFilter === 'mastered' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:text-emerald-900'
              )}
              title="Chỉ hiện các ý đã nắm"
            >
              <CheckSquare className="w-2.5 h-2.5" /> Đã nắm ({stats.completed})
            </button>
          </div>

          {/* Cloud Sync Status Indicator & Manual Sync Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncingCloud}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-2 border-emerald-600 rounded-xl text-xs font-black shadow-[2px_2px_0px_#059669] flex items-center gap-1.5 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            title="Sơ đồ tư duy được tự động đồng bộ qua Firestore trên mọi thiết bị. Bấm để đồng bộ ngay!"
          >
            <Cloud className={cn("w-3.5 h-3.5 text-emerald-600", isSyncingCloud ? "animate-spin" : "")} />
            <span className="hidden sm:inline">Đồng Bộ Cloud</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {viewMode === 'canvas' && (
            <>
              {/* Diagram Layout Mode Switcher: Roadmap (IMG_3834_bc3ec55e) vs Fishbone */}
              <div className="flex items-center bg-[#EFECE6] p-0.5 rounded-xl border-2 border-[#141414] text-xs font-black">
                <button
                  onClick={() => {
                    setDiagramLayout('roadmap');
                    handleAutoLayout('roadmap');
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer',
                    diagramLayout === 'roadmap'
                      ? 'bg-[#6D28D9] text-white shadow-[1px_1px_0px_#141414]'
                      : 'text-ink/65 hover:text-ink'
                  )}
                  title="Chuyển sang dạng Lộ Trình Học Uốn Lượn (như ảnh tham khảo)"
                >
                  <span>🛤️ Lộ Trình</span>
                </button>
                <button
                  onClick={() => {
                    setDiagramLayout('fishbone');
                    handleAutoLayout('fishbone');
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer',
                    diagramLayout === 'fishbone'
                      ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#141414]'
                      : 'text-ink/65 hover:text-ink'
                  )}
                  title="Chuyển sang dạng Sơ Đồ Xương Cá Ishikawa"
                >
                  <span>🐟 Xương Cá</span>
                </button>
              </div>

              {/* Add Branch Button */}
              <button
                onClick={() => {
                  if (selectedNodeId) {
                    handleAddChildNode(selectedNodeId);
                  } else if (activeMap?.nodes && activeMap.nodes.length > 0) {
                    handleAddChildNode(activeMap.nodes[0].id);
                  }
                }}
                className="px-2.5 py-1.5 bg-amber-300 hover:bg-amber-400 text-ink border-2 border-[#141414] rounded-xl text-xs font-black shadow-[2px_2px_0px_#141414] flex items-center gap-1 transition-all active:translate-x-0.5 active:translate-y-0.5"
                title={diagramLayout === 'roadmap' ? 'Thêm mốc học mới' : 'Thêm nhánh con mới'}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{diagramLayout === 'roadmap' ? 'Thêm Mốc' : 'Thêm Nhánh'}</span>
              </button>

              {/* Auto Layout Align Button */}
              <button
                onClick={() => handleAutoLayout()}
                className="px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-950 border-2 border-[#141414] rounded-xl text-xs font-black shadow-[2px_2px_0px_#141414] flex items-center gap-1 transition-all active:translate-x-0.5 active:translate-y-0.5"
                title={diagramLayout === 'roadmap' ? 'Tự động sắp xếp lại các mốc uốn lượn gọn gàng' : 'Tự động sắp xếp xương cá thẳng hàng'}
              >
                <Wand2 className="w-3.5 h-3.5 text-[#6D28D9]" />
                <span className="hidden sm:inline">{diagramLayout === 'roadmap' ? 'Xếp Lộ Trình' : 'Xếp Xương Cá'}</span>
              </button>
            </>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={cn(
              "px-2.5 py-1.5 text-xs font-black rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center gap-1.5 transition-all active:translate-x-0.5 active:translate-y-0.5",
              isFullscreen
                ? "bg-rose-100 text-rose-800 hover:bg-rose-200"
                : "bg-white text-ink hover:bg-amber-50"
            )}
            title={isFullscreen ? "Thu nhỏ (hoặc nhấn phím Esc)" : "Xem toàn màn hình tràn viền"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Thu nhỏ (Esc)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Toàn Màn Hình</span>
              </>
            )}
          </button>

          {/* More Actions Dropdown (Rename, Duplicate, Export, Import, Delete) */}
          <div className="relative">
            <button
              onClick={() => setShowMoreActions(!showMoreActions)}
              className="p-1.5 bg-white hover:bg-amber-50 text-ink rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] transition-transform"
              title="Thao tác khác"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMoreActions && (
              <div
                className="absolute right-0 top-10 w-44 bg-white border-2 border-[#141414] rounded-xl shadow-[4px_4px_0px_#141414] p-1.5 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setShowMoreActions(false)}
              >
                <button
                  onClick={() => {
                    if (activeMap) {
                      setRenameTitle(activeMap.title);
                      setRenameDesc(activeMap.description || '');
                      setShowRenameModal(true);
                      setShowMoreActions(false);
                    }
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-ink hover:bg-amber-100 rounded-lg flex items-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Đổi tên sơ đồ
                </button>
                <button
                  onClick={() => {
                    handleDuplicateMindmap();
                    setShowMoreActions(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-ink hover:bg-amber-100 rounded-lg flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" /> Nhân bản sơ đồ
                </button>
                <button
                  onClick={() => {
                    handleExportJSON();
                    setShowMoreActions(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-ink hover:bg-amber-100 rounded-lg flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" /> Xuất tệp JSON
                </button>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowMoreActions(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-ink hover:bg-amber-100 rounded-lg flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" /> Nhập tệp JSON
                </button>
                <div className="border-t border-[#141414]/15 my-0.5" />
                <button
                  onClick={() => {
                    handleDeleteMindmap();
                    setShowMoreActions(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa sơ đồ này
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sync Toast Feedback */}
      <AnimatePresence>
        {syncToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-14 right-4 z-[9999] bg-[#141414] text-white px-4 py-2 rounded-xl border border-white/20 shadow-xl text-xs font-black flex items-center gap-2"
          >
            <Cloud className="w-4 h-4 text-emerald-400" />
            <span>{syncToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN VIEW AREA: CANVAS */}
      {viewMode === 'canvas' && (
        <div
          className={cn(
            "w-full bg-[#FFFDF7] rounded-[22px] border-[2.5px] border-[#141414] shadow-[4px_4px_0px_#141414] overflow-hidden relative",
            isFullscreen ? "flex-1 h-full min-h-0" : "h-[calc(100vh-170px)] min-h-[580px]"
          )}
        >
          <ReactFlowProvider>
            <ReactFlow
              nodes={preparedNodes}
              edges={preparedEdges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => {
                // Single click ONLY selects node (highlights), DOES NOT open editor
                setSelectedNodeId(node.id);
              }}
              onNodeDoubleClick={(_, node) => {
                // Double click triggers the editor modal!
                setSelectedNodeId(node.id);
                setIsEditingNodeModalOpen(true);
              }}
              onPaneClick={() => {
                setSelectedNodeId(null);
              }}
              fitView
              minZoom={0.2}
              maxZoom={2}
            >
              <Background color="#141414" gap={20} size={1.2} />
              <Controls className="!bg-white !border-2 !border-[#141414] !rounded-xl !shadow-[2px_2px_0px_#141414] !m-3" />
              <MiniMap
                nodeColor={(n) => (n.style?.background as string) || '#FEF08A'}
                className="!bg-white !border-2 !border-[#141414] !rounded-xl !shadow-[3px_3px_0px_#141414] !m-3 hidden md:block"
                maskColor="rgba(255, 255, 255, 0.7)"
              />
            </ReactFlow>
          </ReactFlowProvider>

          {/* DOUBLE-CLICK EDIT MODAL DIALOG */}
          <AnimatePresence>
            {isEditingNodeModalOpen && selectedNode && (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="w-full max-w-md bg-white p-5 rounded-2xl border-[2.5px] border-[#141414] shadow-[6px_6px_0px_#141414] flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between border-b-2 border-dashed border-[#141414]/20 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-400 border border-[#141414] flex items-center justify-center">
                        <Edit3 className="w-4 h-4 text-[#141414]" />
                      </div>
                      <h4 className="text-sm font-black uppercase text-ink">
                        {selectedNode.data?.isRoot ? 'Chỉnh Sửa Trục Xương Sống' : 'Chỉnh Sửa Nhánh Kiến Thức'}
                      </h4>
                    </div>
                    <button
                      onClick={() => setIsEditingNodeModalOpen(false)}
                      className="text-ink/50 hover:text-ink p-1 rounded-lg hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Mastery Toggle Button inside Edit Modal */}
                  {!selectedNode.data?.isRoot && (
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(selectedNode.id)}
                      className={cn(
                        'w-full py-2.5 px-3 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-black transition-all shadow-[2px_2px_0px_#141414]',
                        selectedNode.data?.completed
                          ? 'bg-emerald-100 border-emerald-700 text-emerald-800'
                          : 'bg-amber-50 border-[#141414] text-ink hover:bg-amber-100'
                      )}
                    >
                      {selectedNode.data?.completed ? (
                        <>
                          <CheckSquare className="w-4 h-4 text-emerald-700 stroke-[3]" />
                          <span>✓ ĐÃ NẮM VỮNG KIẾN THỨC (Bấm để bỏ tick)</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-4 h-4 text-ink/40" />
                          <span>CHƯA NẮM (Bấm để đánh dấu đã thuộc)</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Node Title Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-ink uppercase">
                      Tiêu đề nhánh:
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={selectedNode.data?.label || ''}
                      onChange={(e) => handleUpdateSelectedNode('label', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setIsEditingNodeModalOpen(false);
                      }}
                      className="px-3 py-2 text-sm font-bold text-ink bg-[#FFFDF7] border-2 border-[#141414] rounded-xl focus:bg-amber-50/50 outline-none"
                      placeholder="Nhập tên nhánh kiến thức..."
                    />
                  </div>

                  {/* Node Detailed Notes */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-ink uppercase flex items-center gap-1">
                      <span>Ghi chú / Mẹo nhớ / Ví dụ:</span>
                    </label>
                    <textarea
                      rows={3}
                      value={selectedNode.data?.notes || ''}
                      onChange={(e) => handleUpdateSelectedNode('notes', e.target.value)}
                      className="px-3 py-2 text-xs font-medium text-ink bg-[#FFFDF7] border-2 border-[#141414] rounded-xl focus:bg-amber-50/50 outline-none resize-none"
                      placeholder="Ghi chú chi tiết, định nghĩa, công thức, ví dụ..."
                    />
                  </div>

                  {/* Color Swatches */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-ink uppercase flex items-center gap-1">
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

                  {/* Options: Important */}
                  <div className="flex flex-col gap-2 pt-1 border-t border-ink/10">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink">
                      <input
                        type="checkbox"
                        checked={!!selectedNode.data?.important}
                        onChange={(e) => handleUpdateSelectedNode('important', e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded border-2 border-[#141414]"
                      />
                      <span>Đánh dấu trọng tâm cần nhớ ⭐</span>
                    </label>
                  </div>

                  {/* Node Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-ink/10">
                    <button
                      onClick={() => {
                        handleAddChildNode(selectedNode.id);
                        setIsEditingNodeModalOpen(false);
                      }}
                      className="py-2 px-3 bg-amber-400 hover:bg-amber-300 text-ink text-xs font-black rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center justify-center gap-1 active:translate-x-0.5 active:translate-y-0.5"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Thêm Nhánh Con
                    </button>

                    {!selectedNode.data?.isRoot && (
                      <button
                        onClick={() => {
                          handleDeleteNode(selectedNode.id);
                          setIsEditingNodeModalOpen(false);
                        }}
                        className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-black rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5"
                        title="Xóa nhánh này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => setIsEditingNodeModalOpen(false)}
                      className="flex-1 py-2 bg-[#141414] hover:bg-[#2a2a2a] text-white text-xs font-black uppercase rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] ml-auto"
                    >
                      Xong
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* OUTLINE TREE VIEW */}
      {viewMode === 'outline' && (
        <div className="bg-[#FFFDF7] p-5 sm:p-6 rounded-[24px] border-[2.5px] border-[#141414] shadow-[5px_5px_0px_#141414] flex flex-col gap-4 min-h-[500px]">
          <div className="flex items-center justify-between border-b-2 border-dashed border-[#141414]/20 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-base font-black text-ink uppercase flex items-center gap-2">
                <ListTree className="w-5 h-5 text-amber-500" />
                Dàn Ý Phân Cấp & Đánh Dấu Nắm Vững
              </h3>
              <p className="text-xs text-ink/60">
                Tick ô vuông bên cạnh mỗi nhánh khi đã nắm vững kiến thức • Chỉnh sửa văn bản trực tiếp
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOutlineModal(true)}
                className="px-3 py-1.5 bg-sky-200 hover:bg-sky-300 text-ink text-xs font-black rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" /> Nhập Dàn Ý Mới
              </button>
              <button
                onClick={() => {
                  if (activeMap?.nodes && activeMap.nodes.length > 0) {
                    handleAddChildNode(activeMap.nodes[0].id);
                  }
                }}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-ink text-xs font-black rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Nhánh
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {activeMap?.nodes && activeMap.nodes.map((node) => {
              const incoming = activeMap.edges.find((e) => e.target === node.id);
              const parentId = incoming?.source;
              const hasParent = !!parentId;
              const isDone = !!node.data?.completed;
              const isRoot = !!node.data?.isRoot;

              return (
                <div
                  key={node.id}
                  className={cn(
                    'p-3 rounded-xl border-2 border-[#141414] flex items-start gap-3 transition-all',
                    isRoot ? 'bg-amber-100 font-black shadow-[3px_3px_0px_#141414]' : hasParent ? 'ml-6 sm:ml-10 bg-white' : 'bg-gray-50',
                    isDone ? 'bg-emerald-50/80 border-emerald-700' : ''
                  )}
                  style={{
                    backgroundColor: isDone ? '#ECFDF5' : hasParent ? (node.style?.background as string) || '#fff' : '#FEF08A'
                  }}
                >
                  {!isRoot ? (
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(node.id)}
                      className="mt-0.5 text-ink hover:text-emerald-700 transition-transform active:scale-90 shrink-0"
                      title={isDone ? 'Đã nắm vững! Bấm để bỏ tick' : 'Chưa nắm! Bấm để tick đã nắm'}
                    >
                      {isDone ? (
                        <CheckSquare className="w-5 h-5 text-emerald-700 stroke-[3]" />
                      ) : (
                        <Square className="w-5 h-5 text-ink/40 hover:text-ink" />
                      )}
                    </button>
                  ) : (
                    <span className="text-sm shrink-0">🐟</span>
                  )}

                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
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
                          'bg-transparent font-bold text-xs sm:text-sm text-ink outline-none border-b border-transparent focus:border-[#141414] w-full',
                          isDone ? 'text-emerald-950' : ''
                        )}
                      />
                      {isDone && (
                        <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full shrink-0">
                          ✓ Đã nắm
                        </span>
                      )}
                    </div>

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
                Nhìn tiêu đề nhánh xương cá, tự nhẩm lại kiến thức, sau đó bấm xem đáp án để kiểm tra!
              </p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 border-2 border-emerald-600 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 shrink-0">
              <span>Đã thuộc:</span>
              <span className="font-black text-sm">{stats.completed}/{stats.total} ý ({stats.percent}%)</span>
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

      {/* MODAL: PASTE OUTLINE (DÁN DÀN Ý) */}
      <AnimatePresence>
        {showOutlineModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FFFDF7] w-full max-w-2xl p-6 rounded-[24px] border-[2.5px] border-[#141414] shadow-[6px_6px_0px_#141414] flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b-2 border-dashed border-[#141414]/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-sky-200 border-2 border-[#141414] flex items-center justify-center shadow-[1px_1px_0px_#141414]">
                    <FileText className="w-5 h-5 text-ink" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase text-ink">
                      Nhập Dàn Ý (Paste Outline)
                    </h3>
                    <p className="text-[11px] text-ink/60">
                      Tự động chuyển đổi cấu trúc phân cấp thành sơ đồ xương cá chuẩn
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOutlineModal(false)}
                  className="text-ink/50 hover:text-ink p-1 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sample Outline Templates for 1-Click insertion */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase text-ink flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Hoặc chọn nhanh dàn ý mẫu:
                </label>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_OUTLINES.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => setOutlineInput(sample.text)}
                      className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-amber-50 text-ink rounded-lg border-2 border-[#141414] shadow-[1px_1px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5"
                    >
                      {sample.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea for outline input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase text-ink flex items-center justify-between">
                  <span>Dán nội dung dàn ý tại đây:</span>
                  <span className="text-[11px] font-medium text-ink/60 lowercase">
                    (hỗ trợ thụt đầu dòng, -, *, [x] đã nắm, // ghi chú)
                  </span>
                </label>
                <textarea
                  rows={10}
                  value={outlineInput}
                  onChange={(e) => setOutlineInput(e.target.value)}
                  placeholder={`Ví dụ cấu trúc dàn ý:
Chủ Đề Ôn Thi Lịch Sử
  Cách Mạng Tháng Tám // Ý nghĩa lịch sử mở đầu kỷ nguyên mới
    [v] Thời cơ ngàn năm có một
    Diễn biến khởi nghĩa tại Hà Nội
    Ý nghĩa Tuyên ngôn độc lập
  Chiến Dịch Điện Biên Phủ 1954
    [v] Kế hoạch Nava
    Phương châm đánh chắc tiến chắc
    Kết quả và Hiệp định Giơ-ne-vơ`}
                  className="w-full p-3 font-mono text-xs font-semibold text-ink bg-white border-2 border-[#141414] rounded-xl outline-none focus:bg-amber-50/40 resize-none leading-relaxed"
                />
              </div>

              {/* Target Mode: Replace current or Create new */}
              <div className="flex items-center gap-4 bg-[#EFECE6] p-3 rounded-xl border-2 border-[#141414]">
                <span className="text-xs font-black uppercase text-ink">Áp dụng:</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-ink">
                  <input
                    type="radio"
                    name="outlineMode"
                    checked={outlineMode === 'replace'}
                    onChange={() => setOutlineMode('replace')}
                    className="accent-black"
                  />
                  <span>Thay thế sơ đồ hiện tại</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-ink">
                  <input
                    type="radio"
                    name="outlineMode"
                    checked={outlineMode === 'new'}
                    onChange={() => setOutlineMode('new')}
                    className="accent-black"
                  />
                  <span>Tạo sơ đồ xương cá mới</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowOutlineModal(false)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-ink text-xs font-black uppercase rounded-xl border-2 border-[#141414]"
                >
                  Hủy
                </button>
                <button
                  onClick={handleParseAndApplyOutline}
                  disabled={!outlineInput.trim()}
                  className="flex-1 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-ink text-xs font-black uppercase rounded-xl border-2 border-[#141414] shadow-[3px_3px_0px_#141414] flex items-center justify-center gap-2"
                >
                  <Fish className="w-4 h-4" />
                  <span>Tạo Sơ Đồ Xương Cá Ngay</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  Tên Sơ Đồ / Chủ Đề Xương Sống:
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
        isDone ? 'bg-emerald-50/80 border-emerald-700' : 'bg-white'
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
            <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-600 flex items-center gap-1 font-bold">
              <Check className="w-3 h-3 stroke-[3]" /> Đã Nắm Vững
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
