import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
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
  MarkerType,
  useReactFlow
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
  ChevronDown,
  ChevronRight,
  Columns,
  Grid,
  Image as ImageIcon,
  CornerDownRight,
  Keyboard,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import type { MindmapItem } from '../types';
import { AioKnowledgeBase, type KnowledgeTopic } from './AioKnowledgeBase';
import { AioRoadmapView } from './AioRoadmapView';

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

export interface LevelTheme {
  name: string;
  bg: string;
  border: string;
  badgeBg: string;
  badgeText: string;
  edgeColor: string;
  subBg: string;
  subBorder: string;
}

// Visual color themes for CEFR levels (A1, A2, B1, B2, C1, C2) and Milestones
export const LEVEL_THEMES: Record<string, LevelTheme> = {
  A1: {
    name: 'Level A1 (Căn Bản)',
    bg: '#ECFDF5',
    border: '#059669',
    badgeBg: '#10B981',
    badgeText: '#FFFFFF',
    edgeColor: '#059669',
    subBg: '#F0FDF4',
    subBorder: '#86EFAC'
  },
  A2: {
    name: 'Level A2 (Sơ Cấp)',
    bg: '#F0F9FF',
    border: '#0284C7',
    badgeBg: '#0EA5E9',
    badgeText: '#FFFFFF',
    edgeColor: '#0284C7',
    subBg: '#F8FAFC',
    subBorder: '#7DD3FC'
  },
  B1: {
    name: 'Level B1 (Trung Cấp)',
    bg: '#FFFBEB',
    border: '#D97706',
    badgeBg: '#F59E0B',
    badgeText: '#FFFFFF',
    edgeColor: '#D97706',
    subBg: '#FEFCE8',
    subBorder: '#FCD34D'
  },
  B2: {
    name: 'Level B2 (Nâng Cao)',
    bg: '#FAF5FF',
    border: '#7C3AED',
    badgeBg: '#8B5CF6',
    badgeText: '#FFFFFF',
    edgeColor: '#7C3AED',
    subBg: '#F5F3FF',
    subBorder: '#C4B5FD'
  },
  C1: {
    name: 'Level C1 (Cao Cấp)',
    bg: '#FFF1F2',
    border: '#E11D48',
    badgeBg: '#F43F5E',
    badgeText: '#FFFFFF',
    edgeColor: '#E11D48',
    subBg: '#FFF5F5',
    subBorder: '#FDA4AF'
  },
  C2: {
    name: 'Level C2 (Thành Thạo)',
    bg: '#FDF4FF',
    border: '#C026D3',
    badgeBg: '#D946EF',
    badgeText: '#FFFFFF',
    edgeColor: '#C026D3',
    subBg: '#FDF2F8',
    subBorder: '#F0ABFC'
  }
};

const GENERIC_MILESTONE_PALETTE: LevelTheme[] = [
  LEVEL_THEMES.A1,
  LEVEL_THEMES.A2,
  LEVEL_THEMES.B1,
  LEVEL_THEMES.B2,
  LEVEL_THEMES.C1,
  {
    name: 'Mốc Xanh Biển Sâu',
    bg: '#F0FDFA',
    border: '#0D9488',
    badgeBg: '#14B8A6',
    badgeText: '#FFFFFF',
    edgeColor: '#0D9488',
    subBg: '#F0FDFA',
    subBorder: '#5EEAD4'
  }
];

export function getMilestoneTheme(label: string, fallbackIdx = 0): LevelTheme {
  const upper = String(label || '').toUpperCase();
  if (upper.includes('A1')) return LEVEL_THEMES.A1;
  if (upper.includes('A2')) return LEVEL_THEMES.A2;
  if (upper.includes('B1')) return LEVEL_THEMES.B1;
  if (upper.includes('B2')) return LEVEL_THEMES.B2;
  if (upper.includes('C1')) return LEVEL_THEMES.C1;
  if (upper.includes('C2')) return LEVEL_THEMES.C2;
  return GENERIC_MILESTONE_PALETTE[Math.abs(fallbackIdx) % GENERIC_MILESTONE_PALETTE.length];
}

// Sample Outlines for Quick Insertion
const SAMPLE_OUTLINES = [
  {
    id: 'img-3848-genomes',
    name: '🧬 Manipulating Genomes (Sổ Mẫu IMG_3848)',
    text: `Manipulating Genomes (DNA Technology) // Nghiên cứu cấu trúc và ứng dụng công nghệ Gen
  DNA Sequencing // Giải trình tự DNA bằng phương pháp Sanger
    [v] Sanger Single-Strand Template // Đĩa mẫu đơn với bazơ biến tính
    Electrophoresis (Điện di gel) // Phân tách phân tử theo kích thước và điện tích
      > Agarose gel & Buffer solution // Đệm dẫn điện
      > DNA phân cực về cực dương (Anode) // Do nhóm phosphate tích điện âm
    Bioinformatics // Lưu trữ và phân tích dữ liệu sinh học máy tính
  PCR (Polymerase Chain Reaction) // Khuếch đại chuỗi phân tử DNA số lượng lớn
    [v] 3 Bước chu kỳ nhiệt // Biến tính 94°C -> Bắt cặp 55°C -> Kéo dài 72°C
    Taq Polymerase chịu nhiệt // Chiết xuất từ vi khuẩn suối nước nóng
    Applications (Ứng dụng) // Nghiên cứu pháp y, giám sát bệnh truyền nhiễm
  DNA Profiling & Probes // Nhận dạng dấu vân tay di truyền
    VNTRs & Short Tandem Repeats // Trình tự lặp lại ngắn đặc trưng
    Ứng dụng thực tế // Giám định pháp y, xét nghiệm huyết thống cha con
  Synthetic Biology & Bioethics // Sinh học tổng hợp & Đạo đức sinh học
    Sản xuất thuốc & Cảm biến sinh học // Vi khuẩn phát quang phát hiện chất độc
    Quyền riêng tư dữ liệu gen // Hội đồng tư vấn đạo đức & an toàn sinh học`
  },
  {
    id: 'img-3849-anxiety',
    name: '🧠 Anxiety Disorders (Sổ Mẫu IMG_3849)',
    text: `Anxiety Disorders (Rối Loạn Lo Âu) // Phân loại và phác đồ điều trị lâm sàng
  Panic Disorder // Cơn hoảng sợ bất ngờ tái diễn
    [v] Triệu chứng cốt lõi // Tim đập nhanh, khó thở, lo âu sợ chết
    Phác đồ điều trị // { SSRIs + Liệu pháp CBT }
    Cấp cứu cắt cơn // Benzodiazepine dùng ngắn ngày (PRN)
  Specific Phobia & Social Anxiety // Ám ảnh sợ đặc hiệu & Sợ xã hội
    Specific Phobia // Nỗi sợ đối tượng cụ thể (độ cao, máu, nhện)
    Social Anxiety // Sợ bị phán xét, lúng túng nơi đông người
    Điều trị can thiệp // Liệu pháp giải mẫn cảm + SSRI
  Generalized Anxiety (GAD) // Lo âu lan tỏa dai dẳng trên 6 tháng
    Triệu chứng thể chất // Căng cơ bắp, mất ngủ, khó tập trung
    Điều trị đầu tay // { CBT + SSRI / SNRI }
  OCD & Body Dysmorphic // Ám ảnh cưỡng chế & Mặc cảm ngoại hình
    Ám ảnh (Obsessions) // Suy nghĩ xâm lấn gây đau khổ
    Cưỡng chế (Compulsions) // Hành vi lặp lại để giảm lo âu
    Phác đồ thuốc // Clomipramine hoặc SSRI liều cao + ERP
  PTSD & Acute Stress // Căng thẳng cấp và stress sau sang chấn
    Chấn thương tâm lý // Hồi tưởng ác mộng (Flashbacks), cảnh giác
    Điều trị phục hồi // { EMDR + SSRI/SNRI + Prazosin trị ác mộng }
  Adjustment & Separation // Lo âu chia ly & Rối loạn thích ứng
    Rối loạn thích ứng // Phản ứng cảm xúc sau biến cố cuộc sống
    Lo âu chia ly // Nỗi sợ quá mức khi xa người gắn bó`
  },
  {
    id: 'english-roadmap',
    name: '🇬🇧 Lộ Trình Tiếng Anh Toàn Diện (A1 -> B2)',
    text: `Lộ Trình Học Tiếng Anh (A1 - B2)
  Level A1: Mất Gốc & Căn Bản // Nền tảng từ loại và các mẫu câu cơ bản nhất
    [v] Động từ To Be (am/is/are) // Khẳng định, phủ định và câu hỏi nghi vấn
    [v] Đại từ nhân xưng & Tính từ sở hữu // I, you, we, they, he, she, it & my, your, our
    [v] Danh từ số ít & Danh từ số nhiều // Quy tắc thêm s/es và danh từ bất quy tắc
    Thì Hiện tại đơn (Present Simple) // Thói quen, lịch trình và chân lý hiển nhiên
    Thì Hiện tại tiếp diễn (Present Continuous) // Hành động đang diễn ra tại lúc nói
  Level A2: Sơ Cấp & Giao Tiếp // Giao tiếp sinh hoạt hàng ngày và kể chuyện quá khứ
    [v] Thì Quá khứ đơn (Past Simple) // Động từ có quy tắc -ed và 360 bất quy tắc
    Giới từ chỉ thời gian & nơi chốn // In, On, At, Under, Between, Next to
    So sánh hơn & So sánh nhất // Short/Long Adj: cleaner, more beautiful, the best
    Thì Tương lai gần (Be going to) // Kế hoạch và dự định có bằng chứng từ trước
  Level B1: Trung Cấp Tự Tin // Tự tin diễn đạt quan điểm cá nhân và thuyết trình
    Thì Hiện tại hoàn thành (Present Perfect) // Trải nghiệm, kết quả còn lưu lại ở hiện tại
    Câu điều kiện loại 1 & loại 2 // If condition tình huống có thật và giả định
    Mệnh đề quan hệ (Relative Clauses) // Who, which, that, where, whose
    Câu bị động (Passive Voice) // S + be + V3/ed trong học tập & công việc
  Level B2: Nâng Cao & Học Thuật // Đọc báo, viết luận và giao tiếp phản xạ chuyên sâu
    Quá khứ hoàn thành tiếp diễn // Nhấn mạnh tính liên tục của hành động quá khứ
    Kể chuyện nhiều lớp thời gian // Phối hợp quá khứ đơn, tiếp diễn và hoàn thành
    Câu điều kiện hỗn hợp (Mixed Conditionals) // Kết hợp điều kiện loại 2 và loại 3
    Đảo ngữ & Cấu trúc nhấn mạnh // Not only... but also, Hardly... when`
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
  const stepY = 210;
  const centerX = 380;
  const amplitude = 150;

  const nextNodes = nodes.map((node) => {
    const seqIdx = orderedIds.indexOf(node.id);
    const idx = seqIdx >= 0 ? seqIdx : 0;

    // Sinusoidal curve for the winding learning road
    const posX = centerX + Math.sin(idx * 0.95) * amplitude;
    const posY = startY + idx * stepY;

    // Extract or infer badge text (e.g. B2, B1, A2, or index)
    let badgeText = '';
    const labelUpper = String(node.data?.label || '').toUpperCase();
    if (labelUpper.includes('B2')) badgeText = 'B2';
    else if (labelUpper.includes('B1')) badgeText = 'B1';
    else if (labelUpper.includes('A2')) badgeText = 'A2';
    else if (labelUpper.includes('A1')) badgeText = 'A1';
    else if (labelUpper.includes('C1')) badgeText = 'C1';
    else if (labelUpper.includes('C2')) badgeText = 'C2';
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

// 2. Refined Fishbone Layout Engine: Wide clearance between ribs and child branches to prevent any overlap
export function applyFishboneLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (!nodes || nodes.length === 0) return [];

  // Find root node (marked isRoot or no incoming edges)
  const targetIds = new Set(edges.map((e) => e.target));
  const rootNode = nodes.find((n) => n.data?.isRoot) || nodes.find((n) => !targetIds.has(n.id)) || nodes[0];

  const centerY = 380;
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

    // Generous horizontal spacing between ribs (460px) to give children plenty of room
    const ribX = startX + 360 + colIndex * 460;
    const ribY = isTop ? centerY - 170 : centerY + 170;

    positioned.set(ribId, { x: ribX, y: ribY });

    // Level 2 children (Sub-branches from this rib)
    const level2Ids = childrenMap.get(ribId) || [];
    level2Ids.forEach((childId, cIdx) => {
      // Offset child horizontally past the rib node width (290px clearance)
      const childX = ribX + 290;
      const childY = isTop
        ? ribY - 70 - cIdx * 90
        : ribY + 70 + cIdx * 90;

      positioned.set(childId, { x: childX, y: childY });

      // Level 3 children (Sub-sub branches)
      const level3Ids = childrenMap.get(childId) || [];
      const l3Count = level3Ids.length;
      level3Ids.forEach((subId, sIdx) => {
        const subX = childX + 280;
        const subY = childY + (sIdx - (l3Count - 1) / 2) * 80;
        positioned.set(subId, { x: subX, y: subY });
      });
    });
  });

  // For any orphaned or unpositioned nodes, neatly stack them below
  let fallbackY = centerY + 340;
  nodes.forEach((n) => {
    if (!positioned.has(n.id)) {
      positioned.set(n.id, { x: startX + 360, y: fallbackY });
      fallbackY += 95;
    }
  });

  return nodes.map((node) => {
    const pos = positioned.get(node.id);
    return pos
      ? { ...node, position: pos, data: { ...node.data, isRoadmap: false } }
      : { ...node, data: { ...node.data, isRoadmap: false } };
  });
}

// Helper to clean node labels so badges and labels do not duplicate numbering
export function cleanNodeTitle(label: string): string {
  if (!label) return '';
  return label
    .replace(/^LEVEL\s*[A-C][1-2][\:\-\s]+/i, '')
    .replace(/^[A-C][1-2](\.\d+)*[\:\-\.\)\s]+/i, '')
    .replace(/^MỐC\s*\d+[\:\-\.\)\s]*/i, '')
    .replace(/^(\d+(\.\d+)*)[\:\-\.\)\s]+/, '')
    .replace(/^[-*•\s]+/, '')
    .trim() || label;
}

// 3. Hierarchical Numbering Engine:
// Main milestones: A1, A2, B1, B2 (or 1, 2, 3...)
// Direct sub-branches: A1.1, A1.2, A1.3 (or 1.1, 1.2, 1.3)
// Sub-sub-branches: .1, .2 - NEVER chained into long strings like 1.1.1.1
export function computeHierarchicalCodes(nodes: Node[], edges: Edge[]): Map<string, string> {
  const codes = new Map<string, string>();
  if (!nodes || nodes.length === 0) return codes;

  const targetIds = new Set(edges.map((e) => e.target));
  const rootNode =
    nodes.find((n) => n.data?.isRoot) ||
    nodes.find((n) => !targetIds.has(n.id)) ||
    nodes[0];

  codes.set(rootNode.id, '★');

  const childrenMap = new Map<string, string[]>();
  edges.forEach((e) => {
    const list = childrenMap.get(e.source) || [];
    list.push(e.target);
    childrenMap.set(e.source, list);
  });

  // Assign clean milestone codes to direct children of root (Level 1 milestones)
  const rootChildren = (childrenMap.get(rootNode.id) || []).filter((id) => id !== rootNode.id);

  let milestoneCounter = 1;
  rootChildren.forEach((milestoneId) => {
    const childNode = nodes.find((n) => n.id === milestoneId);
    const label = String(childNode?.data?.label || '').toUpperCase();
    let milestoneCode = '';

    // Check CEFR level
    if (label.includes('A1')) milestoneCode = 'A1';
    else if (label.includes('A2')) milestoneCode = 'A2';
    else if (label.includes('B1')) milestoneCode = 'B1';
    else if (label.includes('B2')) milestoneCode = 'B2';
    else if (label.includes('C1')) milestoneCode = 'C1';
    else if (label.includes('C2')) milestoneCode = 'C2';
    else {
      milestoneCode = String(milestoneCounter++);
    }
    codes.set(milestoneId, milestoneCode);

    // Assign short codes to sub-branches (Level 2) e.g. A1.1, A1.2 or 1.1, 1.2
    const level2Children = childrenMap.get(milestoneId) || [];
    level2Children.forEach((subId, subIdx) => {
      const subCode = `${milestoneCode}.${subIdx + 1}`;
      codes.set(subId, subCode);

      // Assign short codes to deeper children (Level 3+) - Keep it short: .1, .2
      const level3Children = childrenMap.get(subId) || [];
      level3Children.forEach((deepId, deepIdx) => {
        codes.set(deepId, `.${deepIdx + 1}`);
      });
    });
  });

  // Fallback for unreached or sequential nodes (e.g. roadmap without explicit root)
  let fallbackCount = 1;
  nodes.forEach((n) => {
    if (!codes.has(n.id)) {
      const label = String(n.data?.label || '').toUpperCase();
      if (label.includes('A1')) codes.set(n.id, 'A1');
      else if (label.includes('A2')) codes.set(n.id, 'A2');
      else if (label.includes('B1')) codes.set(n.id, 'B1');
      else if (label.includes('B2')) codes.set(n.id, 'B2');
      else if (label.includes('C1')) codes.set(n.id, 'C1');
      else if (label.includes('C2')) codes.set(n.id, 'C2');
      else codes.set(n.id, String(fallbackCount++));
    }
  });

  return codes;
}

// 4. Authentic XMind Mindmap Layout Engine: Balanced Left/Right radiating tree with zero overlap
export function applyXMindLayout(
  nodes: Node[],
  edges: Edge[],
  hiddenNodeIds: Set<string> = new Set()
): { nodes: Node[]; edges: Edge[] } {
  if (!nodes || nodes.length === 0) return { nodes: [], edges: [] };

  const visibleNodes = nodes.filter((n) => !hiddenNodeIds.has(n.id));
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

  const targetIds = new Set(
    edges
      .filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
      .map((e) => e.target)
  );

  const rootNode =
    visibleNodes.find((n) => n.data?.isRoot) ||
    visibleNodes.find((n) => !targetIds.has(n.id)) ||
    visibleNodes[0];

  const childrenMap = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)) {
      const list = childrenMap.get(edge.source) || [];
      list.push(edge.target);
      childrenMap.set(edge.source, list);
    }
  });

  const positioned = new Map<string, { x: number; y: number }>();
  const centerX = 650;
  const centerY = 450;
  positioned.set(rootNode.id, { x: centerX, y: centerY });

  // Direct children of root (Level 1 milestones)
  const rootChildren = (childrenMap.get(rootNode.id) || []).filter((id) => id !== rootNode.id);

  // Split balanced into Right (even index) and Left (odd index) trees
  const rightRootChildren: string[] = [];
  const leftRootChildren: string[] = [];
  rootChildren.forEach((childId, idx) => {
    if (idx % 2 === 0) {
      rightRootChildren.push(childId);
    } else {
      leftRootChildren.push(childId);
    }
  });

  const NODE_HEIGHT = 80;
  const SIBLING_GAP = 36;
  const HORIZ_STEP = 340;

  // Calculate recursive bounding heights for subtrees
  const subtreeHeightMemo = new Map<string, number>();
  const getSubtreeHeight = (nodeId: string): number => {
    if (subtreeHeightMemo.has(nodeId)) return subtreeHeightMemo.get(nodeId)!;
    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) {
      subtreeHeightMemo.set(nodeId, NODE_HEIGHT);
      return NODE_HEIGHT;
    }
    let total = 0;
    children.forEach((cId, idx) => {
      total += getSubtreeHeight(cId);
      if (idx > 0) total += SIBLING_GAP;
    });
    const h = Math.max(NODE_HEIGHT, total);
    subtreeHeightMemo.set(nodeId, h);
    return h;
  };

  // Layout Right Subtree (radiating towards +X)
  let totalRightHeight = 0;
  rightRootChildren.forEach((id, idx) => {
    totalRightHeight += getSubtreeHeight(id);
    if (idx > 0) totalRightHeight += SIBLING_GAP + 24;
  });

  let curRightY = centerY - totalRightHeight / 2;
  const layoutBranchRight = (nodeId: string, x: number, topY: number) => {
    const h = getSubtreeHeight(nodeId);
    const nodeY = topY + (h - NODE_HEIGHT) / 2;
    positioned.set(nodeId, { x, y: nodeY });

    const children = childrenMap.get(nodeId) || [];
    let childY = topY;
    children.forEach((cId) => {
      layoutBranchRight(cId, x + HORIZ_STEP, childY);
      childY += getSubtreeHeight(cId) + SIBLING_GAP;
    });
  };

  rightRootChildren.forEach((id) => {
    const h = getSubtreeHeight(id);
    layoutBranchRight(id, centerX + 320, curRightY);
    curRightY += h + SIBLING_GAP + 24;
  });

  // Layout Left Subtree (radiating towards -X)
  let totalLeftHeight = 0;
  leftRootChildren.forEach((id, idx) => {
    totalLeftHeight += getSubtreeHeight(id);
    if (idx > 0) totalLeftHeight += SIBLING_GAP + 24;
  });

  let curLeftY = centerY - totalLeftHeight / 2;
  const layoutBranchLeft = (nodeId: string, x: number, topY: number) => {
    const h = getSubtreeHeight(nodeId);
    const nodeY = topY + (h - NODE_HEIGHT) / 2;
    positioned.set(nodeId, { x, y: nodeY });

    const children = childrenMap.get(nodeId) || [];
    let childY = topY;
    children.forEach((cId) => {
      layoutBranchLeft(cId, x - HORIZ_STEP, childY);
      childY += getSubtreeHeight(cId) + SIBLING_GAP;
    });
  };

  leftRootChildren.forEach((id) => {
    const h = getSubtreeHeight(id);
    layoutBranchLeft(id, centerX - 320, curLeftY);
    curLeftY += h + SIBLING_GAP + 24;
  });

  // For any orphaned / unpositioned nodes, place them neatly in a grid below
  let fallbackY = centerY + Math.max(totalRightHeight, totalLeftHeight) / 2 + 120;
  visibleNodes.forEach((n) => {
    if (!positioned.has(n.id)) {
      positioned.set(n.id, { x: centerX, y: fallbackY });
      fallbackY += 95;
    }
  });

  // Track nodes on right side for handle orientation
  const rightNodeSet = new Set<string>();
  const collectSubtree = (id: string, set: Set<string>) => {
    set.add(id);
    (childrenMap.get(id) || []).forEach((c) => collectSubtree(c, set));
  };
  rightRootChildren.forEach((id) => collectSubtree(id, rightNodeSet));

  const xmindEdges: Edge[] = edges
    .filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
    .map((e) => {
      const isRight = rightNodeSet.has(e.target);
      return {
        ...e,
        sourceHandle: isRight ? 'source-right' : 'source-left',
        targetHandle: isRight ? 'target-left' : 'target-right',
        type: 'smoothstep',
        style: {
          stroke: isRight ? '#2563EB' : '#7C3AED',
          strokeWidth: 3.5,
          strokeLinecap: 'round'
        }
      };
    });

  const nextNodes = nodes.map((node) => {
    const pos = positioned.get(node.id);
    return pos
      ? { ...node, position: pos, data: { ...node.data, isRoadmap: false } }
      : node;
  });

  return { nodes: nextNodes, edges: xmindEdges };
}

// 5. Authentic Radial Study Notebook Layout Engine (As in Reference Photos IMG_3848 & IMG_3849):
// Topics radiate naturally around the central cloud/title in balanced multi-directional angles.
// Sub-branches spread outward cleanly with zero overlap and organic curved branches.
export function applyRadialStudyLayout(
  nodes: Node[],
  edges: Edge[],
  hiddenNodeIds: Set<string> = new Set()
): { nodes: Node[]; edges: Edge[] } {
  if (!nodes || nodes.length === 0) return { nodes: [], edges: [] };

  const visibleNodes = nodes.filter((n) => !hiddenNodeIds.has(n.id));
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

  const targetIds = new Set(
    edges
      .filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
      .map((e) => e.target)
  );

  const rootNode =
    visibleNodes.find((n) => n.data?.isRoot) ||
    visibleNodes.find((n) => !targetIds.has(n.id)) ||
    visibleNodes[0];

  const childrenMap = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)) {
      const list = childrenMap.get(edge.source) || [];
      list.push(edge.target);
      childrenMap.set(edge.source, list);
    }
  });

  const positioned = new Map<string, { x: number; y: number }>();
  const centerX = 800;
  const centerY = 560;
  positioned.set(rootNode.id, { x: centerX, y: centerY });

  // Direct milestone branches (Level 1)
  const rootChildren = (childrenMap.get(rootNode.id) || []).filter((id) => id !== rootNode.id);

  // Divide root children balanced between Right and Left hemispheres (like authentic study mindmap)
  const rightRootChildren: string[] = [];
  const leftRootChildren: string[] = [];
  rootChildren.forEach((childId, idx) => {
    if (idx % 2 === 0) {
      rightRootChildren.push(childId);
    } else {
      leftRootChildren.push(childId);
    }
  });

  const NODE_HEIGHT = 80;
  const SIBLING_GAP = 32;
  const HORIZ_STEP_1 = 340;
  const HORIZ_STEP_2 = 300;

  // Calculate recursive bounding heights for subtrees to prevent ANY collisions
  const subtreeHeightMemo = new Map<string, number>();
  const getSubtreeHeight = (nodeId: string): number => {
    if (subtreeHeightMemo.has(nodeId)) return subtreeHeightMemo.get(nodeId)!;
    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) {
      subtreeHeightMemo.set(nodeId, NODE_HEIGHT);
      return NODE_HEIGHT;
    }
    let total = 0;
    children.forEach((cId, idx) => {
      total += getSubtreeHeight(cId);
      if (idx > 0) total += SIBLING_GAP;
    });
    const h = Math.max(NODE_HEIGHT, total);
    subtreeHeightMemo.set(nodeId, h);
    return h;
  };

  // Layout Right Hemisphere (Radiating towards +X with notebook arc)
  let totalRightHeight = 0;
  rightRootChildren.forEach((id, idx) => {
    totalRightHeight += getSubtreeHeight(id);
    if (idx > 0) totalRightHeight += SIBLING_GAP + 20;
  });

  let curRightY = centerY - totalRightHeight / 2;
  const layoutBranchRight = (nodeId: string, x: number, topY: number, depth = 1) => {
    const h = getSubtreeHeight(nodeId);
    const nodeY = topY + (h - NODE_HEIGHT) / 2;
    positioned.set(nodeId, { x, y: nodeY });

    const children = childrenMap.get(nodeId) || [];
    let childY = topY;
    const step = depth === 1 ? HORIZ_STEP_1 : HORIZ_STEP_2;
    children.forEach((cId) => {
      layoutBranchRight(cId, x + step, childY, depth + 1);
      childY += getSubtreeHeight(cId) + SIBLING_GAP;
    });
  };

  rightRootChildren.forEach((id, idx) => {
    const h = getSubtreeHeight(id);
    const totalR = rightRootChildren.length;
    // Organic arc curve: middle nodes bow outward slightly
    const arcOffset = totalR > 1 ? Math.sin((idx / (totalR - 1)) * Math.PI) * 50 : 0;
    layoutBranchRight(id, centerX + 320 + arcOffset, curRightY, 1);
    curRightY += h + SIBLING_GAP + 20;
  });

  // Layout Left Hemisphere (Radiating towards -X with notebook arc)
  let totalLeftHeight = 0;
  leftRootChildren.forEach((id, idx) => {
    totalLeftHeight += getSubtreeHeight(id);
    if (idx > 0) totalLeftHeight += SIBLING_GAP + 20;
  });

  let curLeftY = centerY - totalLeftHeight / 2;
  const layoutBranchLeft = (nodeId: string, x: number, topY: number, depth = 1) => {
    const h = getSubtreeHeight(nodeId);
    const nodeY = topY + (h - NODE_HEIGHT) / 2;
    positioned.set(nodeId, { x, y: nodeY });

    const children = childrenMap.get(nodeId) || [];
    let childY = topY;
    const step = depth === 1 ? HORIZ_STEP_1 : HORIZ_STEP_2;
    children.forEach((cId) => {
      layoutBranchLeft(cId, x - step, childY, depth + 1);
      childY += getSubtreeHeight(cId) + SIBLING_GAP;
    });
  };

  leftRootChildren.forEach((id, idx) => {
    const h = getSubtreeHeight(id);
    const totalL = leftRootChildren.length;
    // Organic arc curve: middle nodes bow outward slightly
    const arcOffset = totalL > 1 ? Math.sin((idx / (totalL - 1)) * Math.PI) * 50 : 0;
    layoutBranchLeft(id, centerX - 320 - arcOffset, curLeftY, 1);
    curLeftY += h + SIBLING_GAP + 20;
  });

  // Position any orphaned nodes neatly below
  let fallbackY = centerY + Math.max(totalRightHeight, totalLeftHeight) / 2 + 100;
  visibleNodes.forEach((n) => {
    if (!positioned.has(n.id)) {
      positioned.set(n.id, { x: centerX, y: fallbackY });
      fallbackY += 90;
    }
  });

  // Track nodes on right side for handle orientation
  const rightNodeSet = new Set<string>();
  const collectSubtree = (id: string, set: Set<string>) => {
    set.add(id);
    (childrenMap.get(id) || []).forEach((c) => collectSubtree(c, set));
  };
  rightRootChildren.forEach((id) => collectSubtree(id, rightNodeSet));

  // Determine handle connections and smooth organic curved lines with notebook arrowheads
  const radialEdges: Edge[] = edges
    .filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
    .map((e) => {
      const isRight = rightNodeSet.has(e.target);
      const isRootSource = e.source === rootNode.id;

      return {
        ...e,
        sourceHandle: isRight ? 'source-right' : 'source-left',
        targetHandle: isRight ? 'target-left' : 'target-right',
        type: 'default', // Smooth curved bezier ribbons
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isRight ? '#0284C7' : '#7C3AED',
          width: 14,
          height: 14
        },
        style: {
          stroke: isRight ? '#0284C7' : '#7C3AED',
          strokeWidth: isRootSource ? 3.5 : 2.5,
          strokeLinecap: 'round'
        }
      };
    });

  const nextNodes = nodes.map((node) => {
    const pos = positioned.get(node.id);
    return pos
      ? { ...node, position: pos, data: { ...node.data, isRoadmap: false } }
      : node;
  });

  return { nodes: nextNodes, edges: radialEdges };
}

// 6. Generate structured Outline text from current Mindmap nodes
export function generateOutlineFromNodes(nodes: Node[], edges: Edge[]): string {
  if (!nodes || nodes.length === 0) return '';
  const targetIds = new Set(edges.map((e) => e.target));
  const rootNode =
    nodes.find((n) => n.data?.isRoot) ||
    nodes.find((n) => !targetIds.has(n.id)) ||
    nodes[0];

  const childrenMap = new Map<string, string[]>();
  edges.forEach((e) => {
    const list = childrenMap.get(e.source) || [];
    list.push(e.target);
    childrenMap.set(e.source, list);
  });

  const lines: string[] = [];
  const visited = new Set<string>();

  const traverse = (nodeId: string, depth: number) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const indent = '  '.repeat(depth);
    const checkMark = node.data?.completed ? '[v] ' : '';
    const noteSuffix = node.data?.notes ? ` // ${node.data.notes}` : '';
    const label = node.data?.label || '';

    if (depth === 0) {
      lines.push(`${label}${noteSuffix}`);
    } else if (depth === 1) {
      lines.push(`${indent}${checkMark}${label}${noteSuffix}`);
    } else {
      lines.push(`${indent}${checkMark}- ${cleanNodeTitle(String(label || ''))}${noteSuffix}`);
    }

    const children = childrenMap.get(nodeId) || [];
    children.forEach((cId) => traverse(cId, depth + 1));
  };

  traverse(rootNode.id, 0);

  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      lines.push(`  - ${n.data?.label || ''}${n.data?.notes ? ` // ${n.data.notes}` : ''}`);
    }
  });

  return lines.join('\n');
}

// Convert hierarchical text outline into React Flow nodes and edges
export function parseOutlineToNodesAndEdges(outlineText: string, defaultTitle?: string): { nodes: Node[]; edges: Edge[] } {
  if (!outlineText || !outlineText.trim()) return { nodes: [], edges: [] };

  const rawLines = outlineText
    .split('\n')
    .map((l) => l.replace(/\r$/, ''))
    .filter((l) => l.trim().length > 0);

  if (rawLines.length === 0) return { nodes: [], edges: [] };

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

  rawLines.forEach((rawLine, idx) => {
    let line = rawLine;

    let notes = '';
    if (line.includes('//')) {
      const parts = line.split('//');
      line = parts[0];
      notes = parts.slice(1).join('//').trim();
    }

    const wsMatch = line.match(/^([ \t]+)/);
    const ws = wsMatch ? wsMatch[1] : '';
    const tabs = (ws.match(/\t/g) || []).length;
    const spaces = (ws.match(/ /g) || []).length;
    const explicitIndent = tabs + Math.floor(spaces / 2);

    let trimmed = line.trim();
    let completed = false;
    if (trimmed.startsWith('[v]') || trimmed.startsWith('[x]') || trimmed.startsWith('[✓]')) {
      completed = true;
      trimmed = trimmed.replace(/^\[(v|x|✓)\]\s*/i, '');
    }

    let level = explicitIndent;
    if (idx === 0) {
      level = 0;
    } else if (level === 0) {
      level = 1;
    }

    const id = `node-${idx}-${Date.now().toString(36)}`;

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const parentId = stack.length > 0 ? stack[stack.length - 1].id : undefined;
    stack.push({ level, id });

    parsed.push({
      id,
      level,
      label: cleanNodeTitle(trimmed) || trimmed || (idx === 0 && defaultTitle ? defaultTitle : `Nhánh ${idx + 1}`),
      notes,
      completed,
      important: level <= 1,
      parentId
    });
  });

  let milestoneCount = 0;
  const nodes: Node[] = parsed.map((p, idx) => {
    const isRoot = idx === 0 || p.level === 0;
    let theme: LevelTheme | undefined;
    let bg = '#FFFFFF';

    if (isRoot) {
      bg = '#FEF08A';
    } else if (p.level === 1) {
      theme = getMilestoneTheme(p.label, milestoneCount++);
      bg = theme.bg;
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
        isRoot,
        color: bg,
        theme
      },
      style: { background: bg }
    };
  });

  const edges: Edge[] = [];
  parsed.forEach((p) => {
    if (p.parentId) {
      edges.push({
        id: `e-${p.parentId}-${p.id}`,
        source: p.parentId,
        target: p.id,
        style: { stroke: '#141414', strokeWidth: p.level === 1 ? 3.5 : 2.5 },
        animated: false
      });
    }
  });

  return { nodes, edges };
}

// Custom Node for React Flow: Supports Curved Learning Roadmap, Fishbone, Radial Study Notes, and XMind Mindmap
interface CustomNodeProps {
  id: string;
  data: {
    label: string;
    notes?: string;
    color?: string;
    theme?: LevelTheme;
    notebookTheme?: 'img3848' | 'img3849' | 'xmind' | 'cefr';
    completed?: boolean;
    important?: boolean;
    isRoot?: boolean;
    isRoadmap?: boolean;
    milestoneIndex?: number;
    milestoneBadge?: string;
    hierarchicalCode?: string;
    hasChildren?: boolean;
    childCount?: number;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    isCurrentActive?: boolean;
    onAddChild?: (parentId: string) => void;
    onAddSibling?: (nodeId: string) => void;
    onDelete?: (nodeId: string) => void;
    onToggleComplete?: (nodeId: string) => void;
    onEditNode?: (nodeId: string) => void;
    onInlineUpdate?: (nodeId: string, newLabel: string) => void;
    onSelectColor?: (nodeId: string, color: string) => void;
  };
  selected?: boolean;
  style?: React.CSSProperties;
}

function CustomMindmapNodeComponent({ id, data, selected, style }: CustomNodeProps) {
  const isCompleted = !!data.completed;
  const isImportant = !!data.important;
  const isRoot = !!data.isRoot;
  const theme = data.theme;

  // Inline editing state for quick direct typing on canvas
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [inlineText, setInlineText] = useState(data.label || '');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInlineText(data.label || '');
  }, [data.label]);

  useEffect(() => {
    if (isEditingInline) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 30);
    }
  }, [isEditingInline]);

  const handleCommitInlineEdit = () => {
    setIsEditingInline(false);
    const trimmed = inlineText.trim();
    if (trimmed && trimmed !== data.label) {
      data.onInlineUpdate?.(id, trimmed);
    } else {
      setInlineText(data.label || '');
    }
  };

  const handleCancelInlineEdit = () => {
    setIsEditingInline(false);
    setInlineText(data.label || '');
  };

  // --- 1. ROADMAP / LEARNING PATHWAY NODE ---
  if (data.isRoadmap) {
    const isCurrentActive = !!data.isCurrentActive;
    const badgeText = data.milestoneBadge || '';
    const isLevelBadge = badgeText === 'B2' || badgeText === 'B1' || badgeText === 'A2' || badgeText === 'A1' || badgeText === 'C1' || badgeText === 'C2' || badgeText === '★';

    return (
      <div
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditingInline(true);
        }}
        className={cn(
          "relative flex items-center gap-3.5 select-none cursor-pointer group transition-all duration-200",
          selected ? "scale-105" : ""
        )}
        title="Nhấn đúp để sửa tiêu đề trực tiếp"
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

        {/* Milestone Circle */}
        <div className="relative shrink-0 flex items-center justify-center">
          {isCompleted ? (
            <div
              className="w-13 h-13 rounded-full border-[4px] border-white shadow-[0_4px_12px_rgba(109,40,217,0.35)] flex items-center justify-center ring-4 transition-transform group-hover:scale-110"
              style={{
                backgroundColor: theme ? theme.badgeBg : '#6D28D9'
              }}
            >
              <Check className="w-6 h-6 text-white stroke-[3.5]" />
            </div>
          ) : isCurrentActive ? (
            <div className="relative flex flex-col items-center">
              <div className="w-13 h-13 rounded-full bg-amber-400 border-[4px] border-white shadow-[0_4px_14px_rgba(245,158,11,0.5)] flex items-center justify-center ring-4 ring-amber-300 transition-transform group-hover:scale-110">
                <Star className="w-6 h-6 text-amber-950 fill-amber-950" />
              </div>
              <div className="absolute -bottom-6 whitespace-nowrap bg-[#141414] text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-lg border border-white/20 z-30 animate-bounce">
                Bạn đang ở đây
              </div>
            </div>
          ) : isLevelBadge ? (
            <div
              className="w-13 h-13 rounded-full bg-white border-[4px] shadow-md flex items-center justify-center transition-transform group-hover:scale-110"
              style={{
                borderColor: theme ? theme.badgeBg : '#6D28D9'
              }}
            >
              <span
                className="text-sm font-black tracking-tight"
                style={{ color: theme ? theme.badgeBg : '#6D28D9' }}
              >
                {badgeText}
              </span>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-white border-[3.5px] border-slate-300 shadow-sm flex items-center justify-center ring-4 ring-slate-100 transition-transform group-hover:scale-110">
              <span className="text-xs font-black text-slate-700">{data.milestoneIndex || '•'}</span>
            </div>
          )}
        </div>

        {/* Milestone Card */}
        <div
          className={cn(
            "min-w-[190px] max-w-[320px] bg-white px-4 py-3 rounded-2xl border-[2.5px] border-[#141414] shadow-[3px_3px_0px_#141414] transition-all relative",
            isCompleted ? "bg-[#FAF8FF] border-[#6D28D9]" : "",
            isCurrentActive ? "border-amber-500 shadow-[3px_3px_0px_#F59E0B]" : ""
          )}
          style={{
            borderColor: theme && !isCurrentActive ? theme.border : undefined,
            backgroundColor: theme ? (isCompleted ? '#FAF8FF' : theme.bg) : undefined
          }}
        >
          {/* Level / Category chip, collapse button and mastery checkbox */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="text-[10px] font-black uppercase tracking-wider truncate"
                style={{ color: theme ? theme.border : '#6D28D9' }}
              >
                {isLevelBadge ? `LEVEL ${badgeText}` : `MỐC ${data.milestoneIndex || 1}`}
              </span>
              {data.hasChildren && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onToggleCollapse?.();
                  }}
                  className="px-1.5 py-0.5 rounded-full text-[9px] font-black border flex items-center gap-0.5 transition-all bg-amber-100 hover:bg-amber-200 border-amber-500 text-amber-950 shadow-xs cursor-pointer active:scale-95 shrink-0"
                  title={data.isCollapsed ? "Mở rộng nhánh con" : "Thu gọn nhánh con"}
                >
                  {data.isCollapsed ? (
                    <>
                      <ChevronRight className="w-2.5 h-2.5" />
                      <span>+{data.childCount}</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-2.5 h-2.5" />
                      <span>Thu gọn</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Checkbox for Mastery */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                data.onToggleComplete?.(id);
              }}
              className={cn(
                "flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border transition-all cursor-pointer active:scale-95 shrink-0",
                isCompleted
                  ? "bg-emerald-100 text-emerald-800 border-emerald-500 hover:bg-emerald-200"
                  : "bg-slate-50 text-slate-600 border-slate-300 hover:border-slate-600 hover:text-slate-900"
              )}
              title={isCompleted ? "Đã nắm! Bấm để bỏ tick" : "Chưa nắm. Bấm để tick 'Đã nắm'"}
            >
              {isCompleted ? (
                <>
                  <CheckSquare className="w-3 h-3 text-emerald-700 stroke-[2.5]" />
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

          {/* Inline Edit or Label */}
          {isEditingInline ? (
            <input
              ref={inputRef}
              type="text"
              value={inlineText}
              onChange={(e) => setInlineText(e.target.value)}
              onBlur={handleCommitInlineEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommitInlineEdit();
                if (e.key === 'Escape') handleCancelInlineEdit();
              }}
              className="w-full text-xs font-black text-ink bg-white border border-[#141414] rounded-md px-1.5 py-0.5 outline-none ring-2 ring-blue-500"
            />
          ) : (
            <div className={cn("text-xs font-black text-[#141414] leading-snug break-words", isCompleted ? "text-emerald-950" : "")}>
              {cleanNodeTitle(data.label) || data.label || 'Nội dung mốc học'}
            </div>
          )}

          {/* Progress underline bar */}
          <div className="w-full h-1 bg-black/10 rounded-full mt-2 overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300",
                isCompleted ? "w-full bg-emerald-600" : isCurrentActive ? "w-2/3 bg-amber-400" : "w-1/3 bg-slate-300"
              )}
              style={{
                backgroundColor: isCompleted ? (theme ? theme.badgeBg : '#059669') : undefined
              }}
            />
          </div>

          {data.notes && (
            <div className="text-[10px] text-slate-600 mt-1.5 line-clamp-2 italic font-normal border-t border-slate-100 pt-1">
              {data.notes}
            </div>
          )}

          {/* Floating Actions */}
          <div className="absolute -top-3 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingInline(true);
              }}
              className="bg-sky-400 hover:bg-sky-500 text-ink text-[10px] font-black w-5 h-5 rounded-full border border-ink flex items-center justify-center shadow-[1px_1px_0px_#141414] hover:scale-110"
              title="Sửa tên nhanh"
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

  const notebookTheme = data.notebookTheme || 'img3848';

  // --- 2. AUTHENTIC ROOT NODE ---
  if (isRoot) {
    if (notebookTheme === 'img3849') {
      return (
        <div
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditingInline(true);
          }}
          className={cn(
            "group relative px-7 py-5 bg-white border-[3px] border-[#0D9488] shadow-[5px_5px_0px_#0D9488] rounded-2xl cursor-pointer select-none min-w-[230px] max-w-[360px] text-center transition-all duration-200",
            selected ? "ring-4 ring-teal-500 ring-offset-2 scale-105" : "hover:scale-[1.02]"
          )}
          title="Chủ đề trung tâm (Phong cách Sổ Phác Thảo IMG_3849) - Nhấn đúp để chỉnh sửa"
        >
          {/* Inner double border accent */}
          <div className="absolute inset-1 rounded-xl border border-[#0D9488]/40 pointer-events-none" />

          {/* Connection Handles */}
          <Handle type="source" position={Position.Right} id="source-right" className="!w-2.5 !h-2.5 !bg-[#0D9488] !border-2 !border-white" />
          <Handle type="source" position={Position.Left} id="source-left" className="!w-2.5 !h-2.5 !bg-[#0D9488] !border-2 !border-white" />
          <Handle type="source" position={Position.Top} id="source-top" className="!w-2.5 !h-2.5 !bg-[#0D9488] !border-2 !border-white" />
          <Handle type="source" position={Position.Bottom} id="source-bottom" className="!w-2.5 !h-2.5 !bg-[#0D9488] !border-2 !border-white" />
          <Handle type="target" position={Position.Right} id="target-right" className="!w-2.5 !h-2.5 !bg-[#0D9488] !border-2 !border-white opacity-0" />
          <Handle type="target" position={Position.Left} id="target-left" className="!w-2.5 !h-2.5 !bg-[#0D9488] !border-2 !border-white opacity-0" />

          {/* Calligraphic header banner matching IMG_3849 */}
          <div className="flex items-center justify-center gap-2 mb-1 text-[#0D9488] text-[10px] font-black uppercase tracking-widest select-none">
            <span className="h-[1.5px] w-5 bg-[#0D9488]" />
            <span>CHỦ ĐỀ TRỌNG TÂM</span>
            <span className="h-[1.5px] w-5 bg-[#0D9488]" />
          </div>

          {isEditingInline ? (
            <input
              ref={inputRef}
              type="text"
              value={inlineText}
              onChange={(e) => setInlineText(e.target.value)}
              onBlur={handleCommitInlineEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommitInlineEdit();
                if (e.key === 'Escape') handleCancelInlineEdit();
              }}
              className="w-full text-lg font-black text-center text-[#0F766E] bg-teal-50 border-2 border-[#0D9488] rounded-xl px-2 py-1 outline-none ring-2 ring-teal-500 shadow-sm font-serif italic"
            />
          ) : (
            <div className="text-xl sm:text-2xl font-black text-[#0F766E] leading-tight tracking-tight break-words font-serif italic px-2">
              {data.label || 'Chủ Đề Trung Tâm'}
            </div>
          )}

          {data.notes && (
            <p className="text-[11px] text-teal-800/80 font-medium italic mt-1.5 border-t border-teal-100 pt-1 line-clamp-2">
              {data.notes}
            </p>
          )}

          {/* Floating Actions on Hover / Selection */}
          <div className={cn(
            "absolute -top-3.5 right-2 flex items-center gap-1 transition-all z-20",
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingInline(true);
              }}
              className="bg-teal-400 hover:bg-teal-500 text-ink text-[10px] font-black w-6 h-6 rounded-full border border-ink flex items-center justify-center shadow-[1px_1px_0px_#141414] hover:scale-110 cursor-pointer"
              title="Sửa tên (Nhấn đúp)"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                data.onAddChild?.(id);
              }}
              className="bg-amber-400 hover:bg-amber-500 text-ink text-[10px] font-black px-2 h-6 rounded-full border border-ink flex items-center gap-1 shadow-[1px_1px_0px_#141414] hover:scale-105 cursor-pointer"
              title="Thêm nhánh con (Phím Tab)"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span className="text-[9px]">Nhánh</span>
            </button>
          </div>
        </div>
      );
    }

    // Default / IMG_3848: Scalloped cloud shape with warm gradient & dashed line
    return (
      <div
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditingInline(true);
        }}
        className={cn(
          "group relative px-7 py-5 rounded-[36px] border-[3px] border-[#141414] shadow-[5px_5px_0px_#141414] bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-200 cursor-pointer select-none min-w-[220px] max-w-[360px] text-center transition-all duration-200",
          selected ? "ring-4 ring-blue-500 ring-offset-2 scale-105" : "hover:scale-[1.02]"
        )}
        title="Chủ đề trung tâm (Phong cách Đám Mây Sổ Tay IMG_3848) - Nhấn đúp để chỉnh sửa trực tiếp"
      >
        {/* Double-contour inner ring simulating hand-drawn notebook pen lines */}
        <div className="absolute inset-1.5 rounded-[28px] border-[1.5px] border-dashed border-[#141414]/30 pointer-events-none" />

        {/* 4-directional handles for radial / xmind fan-out */}
        <Handle type="source" position={Position.Right} id="source-right" className="!w-2.5 !h-2.5 !bg-[#141414] !border-2 !border-white" />
        <Handle type="source" position={Position.Left} id="source-left" className="!w-2.5 !h-2.5 !bg-[#141414] !border-2 !border-white" />
        <Handle type="source" position={Position.Top} id="source-top" className="!w-2.5 !h-2.5 !bg-[#141414] !border-2 !border-white" />
        <Handle type="source" position={Position.Bottom} id="source-bottom" className="!w-2.5 !h-2.5 !bg-[#141414] !border-2 !border-white" />
        <Handle type="target" position={Position.Right} id="target-right" className="!w-2.5 !h-2.5 !bg-[#141414] !border-2 !border-white opacity-0" />
        <Handle type="target" position={Position.Left} id="target-left" className="!w-2.5 !h-2.5 !bg-[#141414] !border-2 !border-white opacity-0" />

        {/* Center Tag / Sparkle */}
        <div className="flex items-center justify-center gap-1.5 mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider bg-black/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[#141414]">
            <Sparkles className="w-3 h-3 text-amber-600" /> Chủ Đề Trung Tâm
          </span>
        </div>

        {/* Root Title (Inline Edit or Text) */}
        {isEditingInline ? (
          <input
            ref={inputRef}
            type="text"
            value={inlineText}
            onChange={(e) => setInlineText(e.target.value)}
            onBlur={handleCommitInlineEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCommitInlineEdit();
              if (e.key === 'Escape') handleCancelInlineEdit();
            }}
            className="w-full text-base font-black text-center text-ink bg-white border-2 border-[#141414] rounded-xl px-2 py-1 outline-none ring-2 ring-blue-500 shadow-sm"
          />
        ) : (
          <div className="text-base sm:text-lg font-black text-ink leading-tight tracking-tight break-words px-1">
            {data.label || 'Chủ Đề Trung Tâm'}
          </div>
        )}

        {data.notes && (
          <p className="text-[11px] text-ink/75 font-medium italic mt-1 line-clamp-2">
            {data.notes}
          </p>
        )}

        {/* Floating Actions on Hover / Selection */}
        <div className={cn(
          "absolute -top-3.5 right-2 flex items-center gap-1 transition-all z-20",
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingInline(true);
            }}
            className="bg-sky-400 hover:bg-sky-500 text-ink text-[10px] font-black w-6 h-6 rounded-full border border-ink flex items-center justify-center shadow-[1px_1px_0px_#141414] hover:scale-110 cursor-pointer"
            title="Sửa tên (Nhấn đúp)"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              data.onAddChild?.(id);
            }}
            className="bg-amber-400 hover:bg-amber-500 text-ink text-[10px] font-black px-2 h-6 rounded-full border border-ink flex items-center gap-1 shadow-[1px_1px_0px_#141414] hover:scale-105 cursor-pointer"
            title="Thêm nhánh con (Phím Tab)"
          >
            <Plus className="w-3 h-3 stroke-[3]" />
            <span className="text-[9px]">Nhánh</span>
          </button>
        </div>
      </div>
    );
  }

  // --- 3. RADIAL / XMIND / FISHBONE STUDY NOTEBOOK CARD ---
  const isSubBranch = !!data.hierarchicalCode && data.hierarchicalCode.includes('.');
  const cardBorderColor = isCompleted
    ? '#059669'
    : theme
    ? isSubBranch
      ? theme.subBorder
      : theme.border
    : '#141414';

  const cardBgColor = isCompleted
    ? '#ECFDF5'
    : notebookTheme === 'img3849'
    ? '#FFFFFF'
    : theme
    ? isSubBranch
      ? theme.subBg
      : theme.bg
    : (style?.background as string) || data.color || '#FFFFFF';

  // Highlighter background color for IMG_3848 style
  const highlighterColor = theme ? theme.subBg : data.color || '#FEF08A';

  return (
    <div
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditingInline(true);
      }}
      className={cn(
        'group relative px-3.5 py-2.5 rounded-2xl border-[2.5px] transition-all duration-200 select-none min-w-[155px] max-w-[290px] cursor-pointer',
        notebookTheme === 'img3849' ? 'rounded-xl border-[2px] shadow-[3px_3px_0px_#0D9488]/30' : '',
        selected ? 'ring-3 ring-blue-500 ring-offset-2 scale-[1.03] shadow-[4px_4px_0px_#2563EB]' : 'shadow-[3px_3px_0px_rgba(20,20,20,0.85)] hover:scale-[1.01]'
      )}
      style={{
        borderColor: notebookTheme === 'img3849' ? (isCompleted ? '#059669' : '#141414') : cardBorderColor,
        backgroundColor: cardBgColor,
        color: '#141414'
      }}
      title="Nhấn đúp để sửa trực tiếp • Phím Tab: Thêm nhánh con • Phím Enter: Nhánh cùng cấp"
    >
      {/* Complete Handle pairs for Left, Right, Top, Bottom */}
      <Handle type="target" position={Position.Left} id="target-left" className="!w-2.5 !h-2.5 !bg-[#141414] !border-2 !border-white hover:!scale-125 transition-transform" />
      <Handle type="source" position={Position.Left} id="source-left" className="!w-2.5 !h-2.5 !bg-[#141414] !border-2 !border-white hover:!scale-125 transition-transform" />
      <Handle type="target" position={Position.Right} id="target-right" className="!w-2.5 !h-2.5 !bg-[#141414] !border-2 !border-white hover:!scale-125 transition-transform" />
      <Handle type="source" position={Position.Right} id="source-right" className="!w-2.5 !h-2.5 !bg-[#141414] !border-2 !border-white hover:!scale-125 transition-transform" />
      <Handle type="target" position={Position.Top} id="top" className="!w-2 !h-2 !bg-[#141414] !border-2 !border-white opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2 !h-2 !bg-[#141414] !border-2 !border-white opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Header: Hierarchical Code, Collapse Button, Mastery Checkbox */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Hierarchical Code Badge e.g. A1, A1.1, A2, B1, 1, 1.1 */}
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 tracking-tight shadow-xs"
            style={{
              backgroundColor: theme ? theme.badgeBg : 'rgba(0,0,0,0.06)',
              color: theme ? theme.badgeText : '#141414',
              borderColor: theme ? theme.border : 'rgba(20,20,20,0.2)'
            }}
          >
            {data.hierarchicalCode || data.milestoneBadge || '•'}
          </span>

          {/* Checkbox for Mastery */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              data.onToggleComplete?.(id);
            }}
            className={cn(
              "flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border transition-all cursor-pointer active:scale-95 shrink-0",
              isCompleted
                ? "bg-emerald-100 text-emerald-800 border-emerald-600 hover:bg-emerald-200"
                : "bg-white/90 text-ink/70 border-ink/30 hover:border-ink hover:text-ink hover:bg-white"
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
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {/* Collapse / Expand Child Branches Button */}
          {data.hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                data.onToggleCollapse?.();
              }}
              className="flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-ink/30 bg-amber-100 hover:bg-amber-200 text-ink shadow-xs transition-all active:scale-95 cursor-pointer"
              title={data.isCollapsed ? "Mở rộng nhánh con" : "Thu gọn nhánh con"}
            >
              {data.isCollapsed ? (
                <>
                  <ChevronRight className="w-2.5 h-2.5" />
                  <span>+{data.childCount}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-2.5 h-2.5" />
                  <span>Thu gọn</span>
                </>
              )}
            </button>
          )}

          {isImportant && (
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
          )}
        </div>
      </div>

      {/* Node Content / Inline Edit Input */}
      <div className="flex flex-col gap-1">
        {isEditingInline ? (
          <input
            ref={inputRef}
            type="text"
            value={inlineText}
            onChange={(e) => setInlineText(e.target.value)}
            onBlur={handleCommitInlineEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCommitInlineEdit();
              if (e.key === 'Escape') handleCancelInlineEdit();
            }}
            className="w-full text-xs font-black text-ink bg-white border border-[#141414] rounded-md px-1.5 py-0.5 outline-none ring-2 ring-blue-500 shadow-sm"
          />
        ) : notebookTheme === 'img3848' ? (
          /* Highlighter marker backing matching IMG_3848 study notes */
          <div className="relative inline-block my-0.5">
            <span
              className="absolute inset-0 -rotate-0.5 rounded-sm opacity-90 -z-0"
              style={{
                backgroundColor: isCompleted ? '#A7F3D0' : highlighterColor,
                boxShadow: '0 1px 0 rgba(0,0,0,0.06)'
              }}
            />
            <div
              className={cn(
                'relative z-10 leading-snug break-words text-xs font-black tracking-tight px-1.5 py-0.5',
                isCompleted ? 'text-emerald-950' : 'text-ink'
              )}
            >
              {cleanNodeTitle(data.label) || data.label || 'Nhánh mới'}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'leading-snug break-words text-xs font-black tracking-tight',
              notebookTheme === 'img3849' ? 'uppercase tracking-wide' : '',
              isCompleted ? 'text-emerald-950' : 'text-ink'
            )}
          >
            {cleanNodeTitle(data.label) || data.label || 'Nhánh mới'}
          </div>
        )}

        {/* Study notebook underline marker (matches reference photo style in IMG_3848 & IMG_3849) */}
        <div
          className="w-full h-0.5 rounded-full mb-1 opacity-70"
          style={{ backgroundColor: theme ? theme.border : '#141414' }}
        />

        {/* Bulleted notes / study points */}
        {data.notes && (
          <div className="text-[10px] text-ink/85 flex flex-col gap-1 pt-0.5 border-t border-ink/10">
            {data.notes.split('\n').filter((l) => l.trim().length > 0).map((line, idx) => {
              const clean = line.replace(/^[-*•>]\s*/, '').trim();
              const isTag = clean.startsWith('{') && clean.endsWith('}');
              return (
                <div key={idx} className="flex items-start gap-1 leading-tight">
                  {isTag ? (
                    <span className="bg-purple-100 text-purple-900 font-bold px-1.5 py-0.5 rounded border border-purple-300 text-[9px]">
                      {clean}
                    </span>
                  ) : (
                    <>
                      <span className="text-ink/50 select-none font-bold">
                        {notebookTheme === 'img3848' ? '>' : '•'}
                      </span>
                      <span className="break-words flex-1 font-medium">{clean}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Buttons on Node Hover / Selected */}
      <div className={cn(
        "absolute -top-3.5 right-1 flex items-center gap-1 transition-opacity z-20",
        selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        {/* Inline Edit Trigger */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditingInline(true);
          }}
          className="bg-sky-400 hover:bg-sky-500 text-ink text-[10px] font-black w-6 h-6 rounded-full border border-ink flex items-center justify-center shadow-[1px_1px_0px_#141414] hover:scale-110 transition-transform cursor-pointer"
          title="Sửa tên nhanh (Phím F2)"
        >
          <Edit3 className="w-3 h-3" />
        </button>

        {/* Add Child (Tab) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            data.onAddChild?.(id);
          }}
          className="bg-amber-400 hover:bg-amber-500 text-ink text-[10px] font-black w-6 h-6 rounded-full border border-ink flex items-center justify-center shadow-[1px_1px_0px_#141414] hover:scale-110 transition-transform cursor-pointer"
          title="Thêm nhánh con (Phím Tab)"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
        </button>

        {/* Add Sibling (Enter) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            data.onAddSibling?.(id);
          }}
          className="bg-emerald-300 hover:bg-emerald-400 text-ink text-[10px] font-black w-6 h-6 rounded-full border border-ink flex items-center justify-center shadow-[1px_1px_0px_#141414] hover:scale-110 transition-transform cursor-pointer"
          title="Thêm nhánh cùng cấp (Phím Enter)"
        >
          <CornerDownRight className="w-3 h-3 stroke-[2.5]" />
        </button>

        {/* Quick Color Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker(!showColorPicker);
            }}
            className="bg-purple-300 hover:bg-purple-400 text-ink text-[10px] font-black w-6 h-6 rounded-full border border-ink flex items-center justify-center shadow-[1px_1px_0px_#141414] hover:scale-110 transition-transform cursor-pointer"
            title="Đổi màu nhánh"
          >
            <Palette className="w-3 h-3" />
          </button>

          {showColorPicker && (
            <div
              className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white p-1 rounded-xl border-2 border-[#141414] shadow-lg flex items-center gap-1 z-30"
              onClick={(e) => e.stopPropagation()}
            >
              {NODE_COLORS.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    data.onSelectColor?.(id, c.bg);
                    setShowColorPicker(false);
                  }}
                  className="w-4 h-4 rounded-full border border-[#141414] hover:scale-125 transition-transform"
                  style={{ backgroundColor: c.bg }}
                  title={c.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Delete Node */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete?.(id);
          }}
          className="bg-rose-400 hover:bg-rose-500 text-white text-[10px] font-black w-6 h-6 rounded-full border border-ink flex items-center justify-center shadow-[1px_1px_0px_#141414] hover:scale-110 transition-transform cursor-pointer"
          title="Xóa nhánh này (Phím Delete)"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

const nodeTypes = {
  custom: CustomMindmapNodeComponent
};

// Sleek Floating Canvas Toolbar inside ReactFlowProvider
function MindmapCanvasInnerToolbar({
  onAutoLayout,
  currentLayout,
  onExportPNG,
  onCopyOutline,
  onLoadSample,
  notebookTheme,
  setNotebookTheme,
  canvasBgPattern,
  setCanvasBgPattern,
}: {
  onAutoLayout: () => void;
  currentLayout: string;
  onExportPNG: () => void;
  onCopyOutline: () => void;
  onLoadSample: (sampleId: string) => void;
  notebookTheme: 'img3848' | 'img3849' | 'xmind' | 'cefr';
  setNotebookTheme: (t: 'img3848' | 'img3849' | 'xmind' | 'cefr') => void;
  canvasBgPattern: 'lines' | 'dots' | 'blank' | 'cross';
  setCanvasBgPattern: (p: 'lines' | 'dots' | 'blank' | 'cross') => void;
}) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  return (
    <Panel position="top-right" className="!m-3 z-30">
      <div className="bg-[#FFFDF7]/95 backdrop-blur-md p-1.5 rounded-2xl border-2 border-[#141414] shadow-[3px_3px_0px_#141414] flex items-center gap-1.5 flex-wrap max-w-[95vw]">
        {/* Fit View Button */}
        <button
          type="button"
          onClick={() => fitView({ padding: 0.2, duration: 400 })}
          className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-ink text-xs font-black rounded-xl border border-[#141414] shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
          title="Căn giữa toàn bộ sơ đồ vào giữa màn hình (Fit View)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Căn Giữa</span>
        </button>

        {/* Zoom In & Out */}
        <div className="flex items-center bg-[#EFECE6] p-0.5 rounded-xl border border-[#141414]">
          <button
            type="button"
            onClick={() => zoomIn({ duration: 250 })}
            className="w-6 h-6 flex items-center justify-center text-xs font-black hover:bg-white rounded-lg cursor-pointer"
            title="Phóng to (+)"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => zoomOut({ duration: 250 })}
            className="w-6 h-6 flex items-center justify-center text-xs font-black hover:bg-white rounded-lg cursor-pointer"
            title="Thu nhỏ (-)"
          >
            -
          </button>
        </div>

        {/* Notebook Style Presets */}
        <div className="flex items-center bg-[#EFECE6] p-0.5 rounded-xl border border-[#141414] text-[11px] font-black">
          <button
            type="button"
            onClick={() => {
              setNotebookTheme('img3848');
              setCanvasBgPattern('lines');
            }}
            className={cn(
              "px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1",
              notebookTheme === 'img3848' ? "bg-amber-400 text-ink shadow-xs" : "text-ink/65 hover:text-ink"
            )}
            title="Sổ kẻ ô tô dạ quang (Theo ảnh mẫu 1 IMG_3848)"
          >
            <span>📔</span>
            <span className="hidden md:inline">Sổ Dạ Quang</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setNotebookTheme('img3849');
              setCanvasBgPattern('blank');
            }}
            className={cn(
              "px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1",
              notebookTheme === 'img3849' ? "bg-amber-400 text-ink shadow-xs" : "text-ink/65 hover:text-ink"
            )}
            title="Sổ phác thảo chuyên đề (Theo ảnh mẫu 2 IMG_3849)"
          >
            <span>📋</span>
            <span className="hidden md:inline">Sổ Phác Thảo</span>
          </button>
          <button
            type="button"
            onClick={() => setNotebookTheme('xmind')}
            className={cn(
              "px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1",
              notebookTheme === 'xmind' ? "bg-amber-400 text-ink shadow-xs" : "text-ink/65 hover:text-ink"
            )}
            title="Phong cách XMind hiện đại"
          >
            <span>⚡</span>
            <span className="hidden md:inline">XMind</span>
          </button>
        </div>

        {/* Load Sample Reference Outlines */}
        <div className="relative group/sample">
          <button
            type="button"
            className="px-2 py-1.5 bg-white hover:bg-amber-100 text-ink text-xs font-black rounded-xl border border-[#141414] shadow-xs flex items-center gap-1 cursor-pointer"
            title="Nạp nhanh các mẫu sơ đồ thực tế (theo ảnh đã gửi)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Mẫu Sổ</span>
            <ChevronDown className="w-3 h-3 text-ink/60" />
          </button>

          <div className="absolute right-0 top-full mt-1 w-56 bg-white p-1 rounded-xl border-2 border-[#141414] shadow-xl flex-col gap-1 hidden group-hover/sample:flex z-50">
            <button
              type="button"
              onClick={() => onLoadSample('img-3848-genomes')}
              className="text-left px-2.5 py-1.5 text-xs font-bold text-ink hover:bg-amber-100 rounded-lg flex items-center gap-2 cursor-pointer"
            >
              <span>🧬</span>
              <span className="truncate">Genomes (Ảnh 1 IMG_3848)</span>
            </button>
            <button
              type="button"
              onClick={() => onLoadSample('img-3849-anxiety')}
              className="text-left px-2.5 py-1.5 text-xs font-bold text-ink hover:bg-amber-100 rounded-lg flex items-center gap-2 cursor-pointer"
            >
              <span>🧠</span>
              <span className="truncate">Anxiety (Ảnh 2 IMG_3849)</span>
            </button>
            <button
              type="button"
              onClick={() => onLoadSample('english-roadmap')}
              className="text-left px-2.5 py-1.5 text-xs font-bold text-ink hover:bg-amber-100 rounded-lg flex items-center gap-2 cursor-pointer"
            >
              <span>🇬🇧</span>
              <span className="truncate">Tiếng Anh A1 - B2</span>
            </button>
          </div>
        </div>

        {/* Export PNG & Copy Outline */}
        <button
          type="button"
          onClick={onExportPNG}
          className="p-1.5 bg-sky-100 hover:bg-sky-200 text-sky-950 rounded-xl border border-sky-600 shadow-xs cursor-pointer active:scale-95"
          title="Tải ảnh PNG độ nét cao"
        >
          <ImageIcon className="w-3.5 h-3.5 text-sky-700" />
        </button>
        <button
          type="button"
          onClick={onCopyOutline}
          className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 rounded-xl border border-emerald-600 shadow-xs cursor-pointer active:scale-95"
          title="Sao chép dàn ý vào Clipboard"
        >
          <Copy className="w-3.5 h-3.5 text-emerald-700" />
        </button>
      </div>
    </Panel>
  );
}

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

  // View mode: 'knowledge' (tab=kien-thuc) | 'roadmap' (tab=lo-trinh) | 'canvas' (Mindmap) | 'split' (Song Song) | 'outline' (Dàn bài) | 'study' (Ôn tập)
  const [viewMode, setViewMode] = useState<'knowledge' | 'roadmap' | 'canvas' | 'split' | 'outline' | 'study'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'kien-thuc') return 'knowledge';
      if (tab === 'lo-trinh') return 'roadmap';
      if (tab === 'mindmap' || tab === 'canvas') return 'canvas';
      if (tab === 'split') return 'split';
      if (tab === 'outline') return 'outline';
      if (tab === 'study') return 'study';
    }
    return 'knowledge'; // Default to Knowledge Base matching aioenglish.com/lo-trinh?tab=kien-thuc
  });

  const handleSelectViewMode = (mode: 'knowledge' | 'roadmap' | 'canvas' | 'split' | 'outline' | 'study') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (mode === 'knowledge') url.searchParams.set('tab', 'kien-thuc');
      else if (mode === 'roadmap') url.searchParams.set('tab', 'lo-trinh');
      else if (mode === 'canvas') url.searchParams.set('tab', 'mindmap');
      else if (mode === 'split') url.searchParams.set('tab', 'split');
      else if (mode === 'outline') url.searchParams.set('tab', 'outline');
      else if (mode === 'study') url.searchParams.set('tab', 'study');
      window.history.replaceState(null, '', url.toString());
    }
  };

  // Canvas background pattern: 'lines' (Spiral Notebook Grid as in IMG_3848) | 'dots' | 'blank' (Sketchbook as in IMG_3849) | 'cross'
  const [canvasBgPattern, setCanvasBgPattern] = useState<'lines' | 'dots' | 'blank' | 'cross'>('lines');
  const flowCanvasRef = useRef<HTMLDivElement>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Filter for Mastery: 'all' | 'unmastered' | 'mastered'
  const [masteryFilter, setMasteryFilter] = useState<'all' | 'unmastered' | 'mastered'>('all');

  // Notebook study theme: 'img3848' (Grid & Highlighter) | 'img3849' (White Sketchbook & Card) | 'xmind' | 'cefr'
  const [notebookTheme, setNotebookTheme] = useState<'img3848' | 'img3849' | 'xmind' | 'cefr'>('img3848');

  // Diagram layout style: 'radial' (Study notes radiating in all directions as in sample photos) | 'xmind' | 'roadmap' | 'fishbone'
  const [diagramLayout, setDiagramLayout] = useState<'radial' | 'xmind' | 'roadmap' | 'fishbone'>('radial');

  // Collapsed milestone branches state
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());

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
  const outlineTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Dropdown for more actions
  const [showMoreActions, setShowMoreActions] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showOutlineModal, setShowOutlineModal] = useState(false);

  // Outline Lesson State (Dàn bài là bài học: có thể sửa, lưu, dùng phím Tab thụt lề để phân nhánh nhỏ)
  const [outlineInput, setOutlineInput] = useState('');
  const [outlineMode, setOutlineMode] = useState<'replace' | 'new'>('replace');

  // Auto populate Outline input from current map if empty
  useEffect(() => {
    if (viewMode === 'outline' && (!outlineInput || outlineInput.trim() === '')) {
      if (activeMap?.nodes && activeMap.nodes.length > 0) {
        setOutlineInput(generateOutlineFromNodes(activeMap.nodes, activeMap.edges));
      }
    }
  }, [viewMode, activeMap, outlineInput]);

  // Tab & Shift-Tab keyboard handler for outline indentation (phân nhánh con)
  const handleOutlineKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;

    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift + Tab: Lùi lề 2 spaces hoặc 1 tab
        const beforeCursor = value.substring(0, selectionStart);
        const lineStart = beforeCursor.lastIndexOf('\n') + 1;
        const currentLine = value.substring(lineStart);
        if (currentLine.startsWith('  ')) {
          const nextVal = value.substring(0, lineStart) + value.substring(lineStart + 2);
          setOutlineInput(nextVal);
          setTimeout(() => {
            textarea.selectionStart = Math.max(lineStart, selectionStart - 2);
            textarea.selectionEnd = Math.max(lineStart, selectionEnd - 2);
          }, 0);
        } else if (currentLine.startsWith('\t')) {
          const nextVal = value.substring(0, lineStart) + value.substring(lineStart + 1);
          setOutlineInput(nextVal);
          setTimeout(() => {
            textarea.selectionStart = Math.max(lineStart, selectionStart - 1);
            textarea.selectionEnd = Math.max(lineStart, selectionEnd - 1);
          }, 0);
        }
      } else {
        // Tab: Thụt lề 2 spaces tạo nhánh con
        const nextVal = value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd);
        setOutlineInput(nextVal);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
        }, 0);
      }
    } else if (e.key === 'Enter') {
      const beforeCursor = value.substring(0, selectionStart);
      const lineStart = beforeCursor.lastIndexOf('\n') + 1;
      const currentLine = beforeCursor.substring(lineStart);

      const indentMatch = currentLine.match(/^([ \t]+)/);
      const indent = indentMatch ? indentMatch[1] : '';
      const hasBullet = /^[ \t]*[-*•]\s+/.test(currentLine);

      if (hasBullet) {
        if (/^[ \t]*[-*•]\s*$/.test(currentLine)) {
          e.preventDefault();
          const nextVal = value.substring(0, lineStart) + value.substring(selectionStart);
          setOutlineInput(nextVal);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = lineStart;
          }, 0);
          return;
        }

        e.preventDefault();
        const nextBullet = '\n' + indent + '- ';
        const nextVal = value.substring(0, selectionStart) + nextBullet + value.substring(selectionStart);
        setOutlineInput(nextVal);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + nextBullet.length;
        }, 0);
      } else if (indent) {
        e.preventDefault();
        const nextIndent = '\n' + indent;
        const nextVal = value.substring(0, selectionStart) + nextIndent + value.substring(selectionStart);
        setOutlineInput(nextVal);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + nextIndent.length;
        }, 0);
      }
    }
  };

  // Helper to insert snippet or indent from toolbar
  const insertOutlineSnippet = (snippet: string, isIndent = false) => {
    if (!outlineTextareaRef.current) return;
    const textarea = outlineTextareaRef.current;
    textarea.focus();
    const { selectionStart, selectionEnd, value } = textarea;

    if (isIndent) {
      const beforeCursor = value.substring(0, selectionStart);
      const lineStart = beforeCursor.lastIndexOf('\n') + 1;
      const nextVal = value.substring(0, lineStart) + '  ' + value.substring(lineStart);
      setOutlineInput(nextVal);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
      }, 0);
    } else {
      const nextVal = value.substring(0, selectionStart) + snippet + value.substring(selectionEnd);
      setOutlineInput(nextVal);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + snippet.length;
      }, 0);
    }
  };

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

  // Adjacency tree for collapsing & numbering
  const childrenMap = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!activeMap?.edges) return map;
    activeMap.edges.forEach((e) => {
      const list = map.get(e.source) || [];
      list.push(e.target);
      map.set(e.source, list);
    });
    return map;
  }, [activeMap?.edges]);

  // Compute all hidden node IDs (descendants of any node in collapsedNodeIds)
  const hiddenNodeIds = useMemo(() => {
    const hidden = new Set<string>();
    const hideDescendants = (nodeId: string) => {
      const children = childrenMap.get(nodeId) || [];
      children.forEach((cId) => {
        hidden.add(cId);
        hideDescendants(cId);
      });
    };
    collapsedNodeIds.forEach((id) => hideDescendants(id));
    return hidden;
  }, [collapsedNodeIds, childrenMap]);

  // Hierarchical dot codes (1, 1.1, 1.2, 2, 2.1...)
  const hierarchicalCodes = useMemo(() => {
    if (!activeMap?.nodes || !activeMap?.edges) return new Map<string, string>();
    return computeHierarchicalCodes(activeMap.nodes, activeMap.edges);
  }, [activeMap?.nodes, activeMap?.edges]);

  // Collapse / Expand toggle
  const toggleCollapseNode = useCallback((nodeId: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Auto clean layout (Radial Study Notes, XMind, Roadmap or Fishbone)
  const handleAutoLayout = useCallback(
    (targetLayout?: 'radial' | 'xmind' | 'roadmap' | 'fishbone') => {
      if (!activeMap || !activeMap.nodes || activeMap.nodes.length === 0) return;
      const layoutToApply = targetLayout || diagramLayout;
      if (layoutToApply === 'radial') {
        const { nodes: arrangedNodes, edges: arrangedEdges } = applyRadialStudyLayout(activeMap.nodes, activeMap.edges, hiddenNodeIds);
        updateCurrentMap(arrangedNodes, arrangedEdges);
      } else if (layoutToApply === 'xmind') {
        const { nodes: arrangedNodes, edges: arrangedEdges } = applyXMindLayout(activeMap.nodes, activeMap.edges, hiddenNodeIds);
        updateCurrentMap(arrangedNodes, arrangedEdges);
      } else if (layoutToApply === 'roadmap') {
        const { nodes: arrangedNodes, edges: arrangedEdges } = applyRoadmapLayout(activeMap.nodes, activeMap.edges);
        updateCurrentMap(arrangedNodes, arrangedEdges);
      } else {
        const arrangedNodes = applyFishboneLayout(activeMap.nodes, activeMap.edges);
        updateCurrentMap(arrangedNodes, activeMap.edges);
      }
    },
    [activeMap, diagramLayout, hiddenNodeIds, updateCurrentMap]
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
        if (diagramLayout === 'radial') {
          const res = applyRadialStudyLayout(nextNodes, nextEdges, hiddenNodeIds);
          nextNodes = res.nodes;
          nextEdges = res.edges;
        } else if (diagramLayout === 'xmind') {
          const res = applyXMindLayout(nextNodes, nextEdges, hiddenNodeIds);
          nextNodes = res.nodes;
          nextEdges = res.edges;
        } else if (diagramLayout === 'roadmap') {
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
    [activeMap, autoArrangeEnabled, diagramLayout, hiddenNodeIds, updateCurrentMap]
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
        if (diagramLayout === 'radial') {
          const res = applyRadialStudyLayout(nextNodes, nextEdges, hiddenNodeIds);
          nextNodes = res.nodes;
          nextEdges = res.edges;
        } else if (diagramLayout === 'xmind') {
          const res = applyXMindLayout(nextNodes, nextEdges, hiddenNodeIds);
          nextNodes = res.nodes;
          nextEdges = res.edges;
        } else if (diagramLayout === 'roadmap') {
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
    [activeMap, autoArrangeEnabled, diagramLayout, hiddenNodeIds, selectedNodeId, updateCurrentMap]
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

  // Inline rename / update node title directly on canvas
  const handleInlineUpdateNode = useCallback(
    (nodeId: string, newLabel: string) => {
      if (!activeMap) return;
      const nextNodes = activeMap.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n
      );
      updateCurrentMap(nextNodes, activeMap.edges);
    },
    [activeMap, updateCurrentMap]
  );

  // Quick select color swatch for node
  const handleSelectColorNode = useCallback(
    (nodeId: string, color: string) => {
      if (!activeMap) return;
      const nextNodes = activeMap.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              style: { ...n.style, background: color },
              data: { ...n.data, color }
            }
          : n
      );
      updateCurrentMap(nextNodes, activeMap.edges);
    },
    [activeMap, updateCurrentMap]
  );

  // Canvas Keyboard Shortcuts (Tab: Add Child, Enter: Add Sibling, Delete/Backspace: Delete, Esc: Deselect)
  useEffect(() => {
    const handleCanvasKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'canvas' && viewMode !== 'split') return;

      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement).isContentEditable
      );
      if (isTyping) return;

      if (!selectedNodeId) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        handleAddChildNode(selectedNodeId);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleAddSiblingNode(selectedNodeId);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteNode(selectedNodeId);
      } else if (e.key === 'Escape') {
        setSelectedNodeId(null);
      }
    };

    window.addEventListener('keydown', handleCanvasKeyDown);
    return () => window.removeEventListener('keydown', handleCanvasKeyDown);
  }, [viewMode, selectedNodeId, handleAddChildNode, handleAddSiblingNode, handleDeleteNode]);

  // Export high-resolution PNG
  const handleExportPNG = async () => {
    if (!flowCanvasRef.current || !activeMap) return;
    try {
      setSyncToast('Đang tạo ảnh sơ đồ độ nét cao PNG...');
      const canvas = await html2canvas(flowCanvasRef.current, {
        backgroundColor: canvasBgPattern === 'blank' ? '#FFFFFF' : '#FFFDF7',
        scale: 2,
        logging: false,
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `${(activeMap.title || 'mindmap').replace(/[\s\/\\:*?"<>|]+/g, '_')}_mindmap.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      link.remove();
      setSyncToast('Đã tải ảnh PNG sơ đồ thành công! 🖼️');
      setTimeout(() => setSyncToast(null), 3500);
    } catch (err) {
      setSyncToast('Không thể xuất ảnh sơ đồ.');
      setTimeout(() => setSyncToast(null), 3000);
    }
  };

  // Copy structured Markdown outline to clipboard
  const handleCopyOutline = () => {
    if (!activeMap) return;
    const outline = generateOutlineFromNodes(activeMap.nodes, activeMap.edges);
    navigator.clipboard.writeText(outline);
    setSyncToast('Đã sao chép dàn ý vào Clipboard! 📋');
    setTimeout(() => setSyncToast(null), 3500);
  };

  // Parse Outline text into Mindmap / Fishbone nodes and edges
  const handleParseAndApplyOutline = () => {
    if (!outlineInput.trim()) return;

    const rawLines = outlineInput
      .split('\n')
      .map((l) => l.replace(/\r$/, ''))
      .filter((l) => l.trim().length > 0);

    if (rawLines.length === 0) return;

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

    rawLines.forEach((rawLine, idx) => {
      let line = rawLine;

      // Check note delimiter: // or (note: ...)
      let notes = '';
      if (line.includes('//')) {
        const parts = line.split('//');
        line = parts[0];
        notes = parts.slice(1).join('//').trim();
      }

      // Measure leading indentation
      const wsMatch = line.match(/^([ \t]+)/);
      const ws = wsMatch ? wsMatch[1] : '';
      const tabs = (ws.match(/\t/g) || []).length;
      const spaces = (ws.match(/ /g) || []).length;
      const explicitIndent = tabs + Math.floor(spaces / 2);

      let trimmed = line.trim();

      // Check for check status [x], [v], [ ]
      let completed = false;
      if (/^\[[xXvV]\]\s*/.test(trimmed)) {
        completed = true;
        trimmed = trimmed.replace(/^\[[xXvV]\]\s*/, '');
      } else if (/^\[\s*\]\s*/.test(trimmed)) {
        completed = false;
        trimmed = trimmed.replace(/^\[\s*\]\s*/, '');
      }

      // Check if line starts with a bullet mark: -, *, +, •
      const hasBullet = /^[-*+•]\s+/.test(trimmed);
      if (hasBullet) {
        trimmed = trimmed.replace(/^[-*+•]\s+/, '');
      } else {
        // Strip leading numbering if present: 1., 2., 1.1.
        trimmed = trimmed.replace(/^(\d+(?:\.\d+)*)[\.\)]\s+/, '');
      }

      // Check markdown headers
      let level = 0;
      if (rawLine.startsWith('#### ')) {
        level = 3;
        trimmed = rawLine.replace(/^####\s+/, '');
      } else if (rawLine.startsWith('### ')) {
        level = 2;
        trimmed = rawLine.replace(/^###\s+/, '');
      } else if (rawLine.startsWith('## ')) {
        level = 1;
        trimmed = rawLine.replace(/^##\s+/, '');
      } else if (rawLine.startsWith('# ')) {
        level = 0;
        trimmed = rawLine.replace(/^#\s+/, '');
      } else if (idx === 0) {
        // Root subject title
        level = explicitIndent > 0 ? explicitIndent : 0;
      } else {
        const upper = trimmed.toUpperCase();
        const isLevelMilestone =
          /^LEVEL\s*[A-C][1-2](\b|:|-|\s)/.test(upper) ||
          /^[A-C][1-2](\b|:|-|\s)/.test(upper) ||
          /^MỐC\s*\d+/.test(upper) ||
          /^GIAI ĐOẠN\s*\d+/.test(upper);

        if (isLevelMilestone && !hasBullet && explicitIndent <= 1) {
          // Major milestone (A1, A2, B1, B2) -> direct child of root
          level = 1;
        } else if (hasBullet) {
          // Bullet points under a milestone (e.g. - Động từ to be under Level A1)
          level = explicitIndent > 0 ? explicitIndent + 1 : 2;
        } else if (explicitIndent > 0) {
          level = explicitIndent + 1;
        } else {
          // If no explicit indent and no bullet, check if milestone is already active
          const hasActiveMilestone = stack.some((s) => s.level === 1);
          level = hasActiveMilestone ? 2 : 1;
        }
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
        label: cleanNodeTitle(trimmed) || trimmed || `Nhánh ${idx + 1}`,
        notes,
        completed,
        important: level <= 1,
        parentId
      });
    });

    if (parsed.length === 0) return;

    // Convert into React Flow nodes and edges
    let milestoneCount = 0;
    const newNodes: Node[] = parsed.map((p, idx) => {
      const isRoot = idx === 0 || p.level === 0;
      let theme: LevelTheme | undefined;
      let bg = '#FFFFFF';

      if (isRoot) {
        bg = '#FEF08A';
      } else if (p.level === 1) {
        theme = getMilestoneTheme(p.label, milestoneCount++);
        bg = theme.bg;
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
          color: bg,
          theme
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
          style: { stroke: '#141414', strokeWidth: p.level === 1 ? 3.5 : 2.5 },
          animated: false
        });
      }
    });

    // Apply Selected Layout (Radial, XMind, Roadmap or Fishbone)
    let arrangedNodes = newNodes;
    let finalEdges = newEdges;
    if (diagramLayout === 'radial') {
      const res = applyRadialStudyLayout(newNodes, newEdges);
      arrangedNodes = res.nodes;
      finalEdges = res.edges;
    } else if (diagramLayout === 'xmind') {
      const res = applyXMindLayout(newNodes, newEdges);
      arrangedNodes = res.nodes;
      finalEdges = res.edges;
    } else if (diagramLayout === 'roadmap') {
      const res = applyRoadmapLayout(newNodes, newEdges);
      arrangedNodes = res.nodes;
      finalEdges = res.edges;
    } else {
      arrangedNodes = applyFishboneLayout(newNodes, newEdges);
    }

    if (outlineMode === 'new') {
      const newMap: MindmapItem = {
        id: `mm-${Date.now()}`,
        title: parsed[0]?.label || (diagramLayout === 'radial' ? 'Sơ đồ tỏa tròn từ Dàn ý' : diagramLayout === 'xmind' ? 'Sơ đồ tư duy XMind từ Dàn ý' : diagramLayout === 'roadmap' ? 'Lộ trình học từ Dàn ý' : 'Sơ đồ xương cá từ Dàn ý'),
        description: `Tạo tự động từ dàn ý (${parsed.length} mục)`,
        category: 'Học tập',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        nodes: arrangedNodes,
        edges: finalEdges
      };
      setMindmaps((prev) => [newMap, ...prev]);
      setActiveMapId(newMap.id);
      setSyncToast('Đã tạo sơ đồ mới và đồng bộ cloud! ☁️');
      setTimeout(() => setSyncToast(null), 3500);
    } else {
      updateCurrentMap(arrangedNodes, finalEdges);
      setSyncToast('Đã lưu bài học & cập nhật sơ đồ mindmap thành công! ☁️');
      setTimeout(() => setSyncToast(null), 3500);
    }

    setShowOutlineModal(false);
  };

  // Node milestone theme map: propagate theme from Level 1 milestone to all child sub-branches
  const nodeMilestoneThemeMap = useMemo(() => {
    const map = new Map<string, LevelTheme>();
    if (!activeMap?.nodes) return map;

    const targetIds = new Set(activeMap.edges?.map((e) => e.target) || []);
    const rootNode =
      activeMap.nodes.find((n) => n.data?.isRoot) ||
      activeMap.nodes.find((n) => !targetIds.has(n.id)) ||
      activeMap.nodes[0];

    const parentMap = new Map<string, string>();
    activeMap.edges?.forEach((e) => {
      parentMap.set(e.target, e.source);
    });

    const rootChildren =
      activeMap.edges
        ?.filter((e) => e.source === rootNode?.id)
        .map((e) => e.target) || [];

    rootChildren.forEach((childId, idx) => {
      const childNode = activeMap.nodes.find((n) => n.id === childId);
      const th = getMilestoneTheme(String(childNode?.data?.label || ''), idx);
      map.set(childId, th);
    });

    activeMap.nodes.forEach((node, idx) => {
      if (map.has(node.id) || node.id === rootNode?.id) return;

      const labelUpper = String(node.data?.label || '').toUpperCase();
      if (
        labelUpper.includes('A1') ||
        labelUpper.includes('A2') ||
        labelUpper.includes('B1') ||
        labelUpper.includes('B2') ||
        labelUpper.includes('C1') ||
        labelUpper.includes('C2')
      ) {
        map.set(node.id, getMilestoneTheme(labelUpper, idx));
        return;
      }

      // Trace ancestor to inherit parent milestone theme
      let curr = parentMap.get(node.id);
      let depth = 0;
      while (curr && depth < 10) {
        if (map.has(curr)) {
          map.set(node.id, map.get(curr)!);
          break;
        }
        curr = parentMap.get(curr);
        depth++;
      }

      if (!map.has(node.id)) {
        map.set(node.id, getMilestoneTheme(node.data?.label || '', idx));
      }
    });

    return map;
  }, [activeMap?.nodes, activeMap?.edges]);

  // Prepare custom node injection with callbacks, collapsing, and diagram layout
  const preparedNodes = useMemo(() => {
    if (!activeMap?.nodes) return [];

    // Filter out hidden descendants of collapsed nodes
    const visibleNodes = activeMap.nodes.filter((n) => !hiddenNodeIds.has(n.id));

    // Find first unmastered milestone for active indicator
    let firstUnmasteredId = '';
    for (const n of visibleNodes) {
      if (!n.data?.completed && !firstUnmasteredId) {
        firstUnmasteredId = n.id;
        break;
      }
    }
    if (!firstUnmasteredId && visibleNodes.length > 0) {
      firstUnmasteredId = visibleNodes[0].id;
    }

    return visibleNodes.map((node, index) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        node.data?.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.data?.notes && node.data.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const isCompleted = !!node.data?.completed;
      let isVisibleByMastery = true;
      if (masteryFilter === 'mastered') isVisibleByMastery = isCompleted;
      if (masteryFilter === 'unmastered') isVisibleByMastery = !isCompleted;

      const isCurrentActive = node.id === firstUnmasteredId && !isCompleted;

      const directChildren = childrenMap.get(node.id) || [];
      const hasChildren = directChildren.length > 0;
      const childCount = directChildren.length;
      const isCollapsed = collapsedNodeIds.has(node.id);
      const hCode = hierarchicalCodes.get(node.id) || '';

      // Inherit milestone theme for this node
      const nodeTheme = nodeMilestoneThemeMap.get(node.id);

      // Extract level badge text if any (e.g. A1, A2, B1, B2)
      let badgeText = hCode || node.data?.milestoneBadge || '';
      if (!badgeText) {
        const labelUpper = String(node.data?.label || '').toUpperCase();
        if (labelUpper.includes('A1')) badgeText = 'A1';
        else if (labelUpper.includes('A2')) badgeText = 'A2';
        else if (labelUpper.includes('B1')) badgeText = 'B1';
        else if (labelUpper.includes('B2')) badgeText = 'B2';
        else if (labelUpper.includes('C1')) badgeText = 'C1';
        else if (labelUpper.includes('C2')) badgeText = 'C2';
        else if (node.data?.isRoot) badgeText = '★';
        else badgeText = String(index + 1);
      }

      return {
        ...node,
        type: 'custom',
        selected: node.id === selectedNodeId,
        style: {
          ...node.style,
          background: node.style?.background || (nodeTheme ? (hCode.includes('.') ? nodeTheme.subBg : nodeTheme.bg) : node.data?.color || '#FFFFFF'),
          outline: matchesSearch && searchQuery.trim() ? '3px solid #3B82F6' : undefined,
          opacity: isVisibleByMastery ? 1 : 0.25
        },
        data: {
          ...node.data,
          theme: nodeTheme,
          notebookTheme,
          isRoadmap: diagramLayout === 'roadmap' || !!node.data?.isRoadmap,
          milestoneIndex: node.data?.milestoneIndex || index + 1,
          milestoneBadge: badgeText,
          hierarchicalCode: hCode,
          hasChildren,
          childCount,
          isCollapsed,
          onToggleCollapse: () => toggleCollapseNode(node.id),
          isCurrentActive,
          onAddChild: handleAddChildNode,
          onAddSibling: handleAddSiblingNode,
          onDelete: handleDeleteNode,
          onToggleComplete: handleToggleComplete,
          onInlineUpdate: handleInlineUpdateNode,
          onSelectColor: handleSelectColorNode,
          onEditNode: (nodeId: string) => {
            setSelectedNodeId(nodeId);
            setIsEditingNodeModalOpen(true);
          }
        }
      };
    });
  }, [
    activeMap?.nodes,
    hiddenNodeIds,
    childrenMap,
    collapsedNodeIds,
    hierarchicalCodes,
    nodeMilestoneThemeMap,
    toggleCollapseNode,
    selectedNodeId,
    searchQuery,
    masteryFilter,
    diagramLayout,
    notebookTheme,
    handleAddChildNode,
    handleAddSiblingNode,
    handleDeleteNode,
    handleToggleComplete,
    handleInlineUpdateNode,
    handleSelectColorNode
  ]);

  // Edges prepared with layout-specific styles, theme color matching, and filtering collapsed nodes
  const preparedEdges = useMemo(() => {
    if (!activeMap?.edges) return [];
    const visibleEdges = activeMap.edges.filter(
      (e) => !hiddenNodeIds.has(e.source) && !hiddenNodeIds.has(e.target)
    );

    if (diagramLayout === 'roadmap') {
      return visibleEdges.map((e) => {
        const targetTheme = nodeMilestoneThemeMap.get(e.target);
        return {
          ...e,
          type: 'default',
          style: {
            stroke: targetTheme?.edgeColor || '#7C3AED',
            strokeWidth: 8,
            strokeLinecap: 'round'
          },
          animated: false
        };
      });
    }

    if (diagramLayout === 'xmind') {
      const rootNode = activeMap.nodes.find((n) => n.data?.isRoot) || activeMap.nodes[0];
      const rootX = rootNode?.position?.x || 600;
      return visibleEdges.map((e) => {
        const targetNode = activeMap.nodes.find((n) => n.id === e.target);
        const isRight = (targetNode?.position?.x ?? 600) >= rootX;
        const targetTheme = nodeMilestoneThemeMap.get(e.target);
        const branchColor = targetTheme ? targetTheme.edgeColor : isRight ? '#2563EB' : '#7C3AED';

        return {
          ...e,
          sourceHandle: isRight ? 'source-right' : 'source-left',
          targetHandle: isRight ? 'target-left' : 'target-right',
          type: 'smoothstep',
          style: {
            stroke: branchColor,
            strokeWidth: 3.5,
            strokeLinecap: 'round'
          }
        };
      });
    }

    return visibleEdges.map((e) => {
      const targetTheme = nodeMilestoneThemeMap.get(e.target);
      return {
        ...e,
        style: {
          ...e.style,
          stroke: targetTheme?.edgeColor || e.style?.stroke || '#141414',
          strokeWidth: e.style?.strokeWidth || 3
        }
      };
    });
  }, [activeMap?.edges, activeMap?.nodes, hiddenNodeIds, diagramLayout, nodeMilestoneThemeMap]);

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

  // Open Knowledge Topic as Radial Mindmap (Tỏa Tròn)
  const handleOpenTopicMindmap = (topic: KnowledgeTopic) => {
    const mapTitle = `${topic.code}: ${topic.title}`;
    let targetMap = mindmaps.find((m) => m.title.includes(topic.code) || m.id === `map-${topic.id}`);

    if (!targetMap) {
      const { nodes: rawNodes, edges: rawEdges } = parseOutlineToNodesAndEdges(topic.mindmapOutline, mapTitle);
      const res = applyRadialStudyLayout(rawNodes, rawEdges);
      const newMap: MindmapItem = {
        id: `map-${topic.id}`,
        title: mapTitle,
        category: topic.category,
        nodes: res.nodes,
        edges: res.edges,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setMindmaps((prev) => [newMap, ...prev]);
      setActiveMapId(newMap.id);
    } else {
      setActiveMapId(targetMap.id);
    }
    setDiagramLayout('radial');
    handleSelectViewMode('canvas');
    setSyncToast(`Đã mở Sơ Đồ Tỏa Tròn cho "${topic.title}" 🌟`);
    setTimeout(() => setSyncToast(null), 3500);
  };

  // Edit Knowledge Topic in Outline editor (with Tab indentation)
  const handleEditTopicOutline = (topic: KnowledgeTopic) => {
    setOutlineInput(topic.mindmapOutline);
    setOutlineMode('replace');
    handleSelectViewMode('outline');
    setSyncToast(`Đã nạp bài học "${topic.title}". Sử dụng phím Tab để phân nhánh nhỏ! 📝`);
    setTimeout(() => setSyncToast(null), 4000);
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

          {/* View Mode Toggle: Kiến Thức (tab=kien-thuc) | Lộ Trình (tab=lo-trinh) | Sơ Đồ | Soạn Bài | Ôn Tập */}
          <div className="flex items-center bg-[#EFECE6] p-0.5 rounded-xl border-2 border-[#141414] overflow-x-auto max-w-full">
            <button
              onClick={() => handleSelectViewMode('knowledge')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1 shrink-0 cursor-pointer',
                viewMode === 'knowledge' ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#141414]' : 'text-ink/65 hover:text-ink'
              )}
              title="Kho Kiến Thức Cốt Lõi A1-C1 (aioenglish.com/lo-trinh?tab=kien-thuc)"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Kiến Thức</span>
            </button>
            <button
              onClick={() => handleSelectViewMode('roadmap')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1 shrink-0 cursor-pointer',
                viewMode === 'roadmap' ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#141414]' : 'text-ink/65 hover:text-ink'
              )}
              title="Lộ Trình Học Chuẩn Quốc Tế A1 - C1"
            >
              <span>🛤️ Lộ Trình</span>
            </button>
            <button
              onClick={() => handleSelectViewMode('canvas')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1 shrink-0 cursor-pointer',
                viewMode === 'canvas' ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#141414]' : 'text-ink/65 hover:text-ink'
              )}
              title="Sơ đồ tư duy Canvas (Tỏa tròn / Sổ tay / XMind)"
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Sơ Đồ Mindmap</span>
            </button>
            <button
              onClick={() => handleSelectViewMode('split')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1 shrink-0 cursor-pointer',
                viewMode === 'split' ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#141414]' : 'text-ink/65 hover:text-ink'
              )}
              title="Chế độ Song Song: Soạn dàn bài bên trái + Xem sơ đồ tư duy trực tiếp bên phải"
            >
              <Columns className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ Song Song</span>
            </button>
            <button
              onClick={() => handleSelectViewMode('outline')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1 shrink-0 cursor-pointer',
                viewMode === 'outline' ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#141414]' : 'text-ink/65 hover:text-ink'
              )}
              title="Dàn bài là bài học: soạn thảo, thụt lề bằng phím Tab để phân nhánh"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Soạn Bài & Dán Ý</span>
            </button>
            <button
              onClick={() => handleSelectViewMode('study')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1 shrink-0 cursor-pointer',
                viewMode === 'study' ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#141414]' : 'text-ink/65 hover:text-ink'
              )}
              title="Chế độ ôn tập flashcard"
            >
              <GraduationCap className="w-3.5 h-3.5" />
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

          {(viewMode === 'canvas' || viewMode === 'split') && (
            <>
              {/* Diagram Layout Mode Switcher: Radial Study vs Mindmap (XMind) vs Roadmap vs Fishbone */}
              <div className="flex items-center bg-[#EFECE6] p-0.5 rounded-xl border-2 border-[#141414] text-xs font-black">
                <button
                  onClick={() => {
                    setDiagramLayout('radial');
                    handleAutoLayout('radial');
                  }}
                  className={cn(
                    'px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer',
                    diagramLayout === 'radial'
                      ? 'bg-[#0284C7] text-white shadow-[1px_1px_0px_#141414]'
                      : 'text-ink/65 hover:text-ink'
                  )}
                  title="Chuyển sang dạng Sơ Đồ Tỏa Tròn chuẩn sổ tay học tập (như ảnh mẫu 1 & 2)"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tỏa Tròn (Sổ Tay)</span>
                </button>
                <button
                  onClick={() => {
                    setDiagramLayout('xmind');
                    handleAutoLayout('xmind');
                  }}
                  className={cn(
                    'px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer',
                    diagramLayout === 'xmind'
                      ? 'bg-[#2563EB] text-white shadow-[1px_1px_0px_#141414]'
                      : 'text-ink/65 hover:text-ink'
                  )}
                  title="Chuyển sang dạng Sơ Đồ Tư Duy Mindmap (toả đều 2 bên như app XMind)"
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mindmap (XMind)</span>
                </button>
                <button
                  onClick={() => {
                    setDiagramLayout('roadmap');
                    handleAutoLayout('roadmap');
                  }}
                  className={cn(
                    'px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer',
                    diagramLayout === 'roadmap'
                      ? 'bg-[#6D28D9] text-white shadow-[1px_1px_0px_#141414]'
                      : 'text-ink/65 hover:text-ink'
                  )}
                  title="Chuyển sang dạng Lộ Trình Học Uốn Lượn"
                >
                  <span>🛤️</span>
                  <span className="hidden sm:inline">Lộ Trình</span>
                </button>
                <button
                  onClick={() => {
                    setDiagramLayout('fishbone');
                    handleAutoLayout('fishbone');
                  }}
                  className={cn(
                    'px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer',
                    diagramLayout === 'fishbone'
                      ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#141414]'
                      : 'text-ink/65 hover:text-ink'
                  )}
                  title="Chuyển sang dạng Sơ Đồ Xương Cá Ishikawa"
                >
                  <span>🐟</span>
                  <span className="hidden sm:inline">Xương Cá</span>
                </button>
              </div>

              {/* Background Paper Switcher (Grid Lines / Dot Grid / Blank / Cross) */}
              <div className="flex items-center bg-[#EFECE6] p-0.5 rounded-xl border-2 border-[#141414] text-[11px] font-black">
                <button
                  onClick={() => setCanvasBgPattern('lines')}
                  className={cn(
                    'px-2 py-1 rounded-lg transition-colors cursor-pointer',
                    canvasBgPattern === 'lines' ? 'bg-amber-400 text-ink shadow-xs' : 'text-ink/60 hover:text-ink'
                  )}
                  title="Giấy kẻ ô vuông (Sổ tay chuẩn như ảnh mẫu IMG_3848)"
                >
                  📄 Kẻ Ô Sổ
                </button>
                <button
                  onClick={() => setCanvasBgPattern('dots')}
                  className={cn(
                    'px-2 py-1 rounded-lg transition-colors cursor-pointer',
                    canvasBgPattern === 'dots' ? 'bg-amber-400 text-ink shadow-xs' : 'text-ink/60 hover:text-ink'
                  )}
                  title="Giấy chấm bi Bullet Journal"
                >
                  ⁖ Chấm
                </button>
                <button
                  onClick={() => setCanvasBgPattern('blank')}
                  className={cn(
                    'px-2 py-1 rounded-lg transition-colors cursor-pointer',
                    canvasBgPattern === 'blank' ? 'bg-amber-400 text-ink shadow-xs' : 'text-ink/60 hover:text-ink'
                  )}
                  title="Giấy trắng sketchbook (như ảnh mẫu IMG_3849)"
                >
                  ⬜ Trắng
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
                className="px-2.5 py-1.5 bg-amber-300 hover:bg-amber-400 text-ink border-2 border-[#141414] rounded-xl text-xs font-black shadow-[2px_2px_0px_#141414] flex items-center gap-1 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                title={diagramLayout === 'roadmap' ? 'Thêm mốc học mới' : 'Thêm nhánh con mới (Phím Tab)'}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">{diagramLayout === 'roadmap' ? 'Thêm Mốc' : 'Thêm Nhánh'}</span>
              </button>

              {/* Auto Layout Align Button */}
              <button
                onClick={() => handleAutoLayout()}
                className="px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-950 border-2 border-[#141414] rounded-xl text-xs font-black shadow-[2px_2px_0px_#141414] flex items-center gap-1 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                title="Tự động căn chỉnh sơ đồ cân bằng mắt nhìn"
              >
                <Wand2 className="w-3.5 h-3.5 text-[#6D28D9]" />
                <span className="hidden md:inline">
                  {diagramLayout === 'radial' ? 'Xếp Tỏa Tròn' : diagramLayout === 'xmind' ? 'Xếp XMind' : diagramLayout === 'roadmap' ? 'Xếp Lộ Trình' : 'Xếp Xương Cá'}
                </span>
              </button>

              {/* Export High-Res PNG Button */}
              <button
                onClick={handleExportPNG}
                className="px-2.5 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-950 border-2 border-[#141414] rounded-xl text-xs font-black shadow-[2px_2px_0px_#141414] flex items-center gap-1 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                title="Tải ảnh PNG sơ đồ độ nét cao về máy"
              >
                <ImageIcon className="w-3.5 h-3.5 text-sky-700" />
                <span className="hidden lg:inline">Ảnh PNG</span>
              </button>

              {/* Copy Markdown Outline Button */}
              <button
                onClick={handleCopyOutline}
                className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-2 border-[#141414] rounded-xl text-xs font-black shadow-[2px_2px_0px_#141414] flex items-center gap-1 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                title="Sao chép toàn bộ dàn ý vào Clipboard"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden lg:inline">Copy Dàn Ý</span>
              </button>

              {/* Collapse / Expand All Branches Button */}
              <button
                onClick={() => {
                  if (collapsedNodeIds.size > 0) {
                    setCollapsedNodeIds(new Set());
                  } else {
                    if (!activeMap?.nodes || !activeMap?.edges) return;
                    const rootNode = activeMap.nodes.find((n) => n.data?.isRoot) || activeMap.nodes[0];
                    const rootChildren = activeMap.edges.filter((e) => e.source === rootNode?.id).map((e) => e.target);
                    setCollapsedNodeIds(new Set(rootChildren));
                  }
                }}
                className="px-2.5 py-1.5 bg-white hover:bg-amber-50 text-ink border-2 border-[#141414] rounded-xl text-xs font-black shadow-[2px_2px_0px_#141414] flex items-center gap-1 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                title={collapsedNodeIds.size > 0 ? "Mở rộng toàn bộ các nhánh con" : "Thu gọn toàn bộ các nhánh con để nhìn sơ đồ tinh gọn"}
              >
                {collapsedNodeIds.size > 0 ? (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mở Hết</span>
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Gọn Hết</span>
                  </>
                )}
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

      {/* AIO ENGLISH KNOWLEDGE BASE (tab=kien-thuc) */}
      {viewMode === 'knowledge' && (
        <AioKnowledgeBase
          onOpenMindmap={handleOpenTopicMindmap}
          onEditOutline={handleEditTopicOutline}
          onStudyFlashcard={(topic) => {
            handleOpenTopicMindmap(topic);
            handleSelectViewMode('study');
          }}
        />
      )}

      {/* AIO ENGLISH ROADMAP (tab=lo-trinh) */}
      {viewMode === 'roadmap' && (
        <AioRoadmapView
          onOpenTopicMindmap={handleOpenTopicMindmap}
          onOpenTopicDetail={handleOpenTopicMindmap}
          onSwitchToKnowledgeTab={() => handleSelectViewMode('knowledge')}
        />
      )}

      {/* MAIN VIEW AREA: CANVAS OR SPLIT VIEW */}
      {(viewMode === 'canvas' || viewMode === 'split') && (
        <div className={cn(
          viewMode === 'split' ? "flex flex-col lg:flex-row gap-3.5 h-[calc(100vh-170px)] min-h-[620px]" : "w-full"
        )}>
          {/* LEFT PANE IN SPLIT VIEW: LIVE OUTLINE EDITOR */}
          {viewMode === 'split' && (
            <div className="w-full lg:w-[40%] bg-[#FFFDF7] p-3.5 rounded-[22px] border-[2.5px] border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col gap-2.5 h-full overflow-hidden">
              <div className="flex items-center justify-between border-b-2 border-dashed border-[#141414]/20 pb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-400 border border-[#141414] flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-ink" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-ink">Soạn Dàn Ý Bài Học</h4>
                    <span className="text-[10px] text-ink/60">Dùng phím Tab thụt lề để phân nhánh nhỏ</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleParseAndApplyOutline}
                  className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-ink text-[11px] font-black uppercase rounded-lg border-2 border-[#141414] shadow-[1px_1px_0px_#141414] flex items-center gap-1 active:scale-95 cursor-pointer"
                >
                  <Brain className="w-3 h-3" />
                  <span>Áp Dụng</span>
                </button>
              </div>

              {/* Formatting Helper Buttons */}
              <div className="flex items-center gap-1 flex-wrap p-1.5 bg-[#FFF9E6] border border-[#141414]/20 rounded-xl text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => insertOutlineSnippet('', true)}
                  className="px-2 py-0.5 bg-white hover:bg-amber-200 rounded-md border border-[#141414] flex items-center gap-0.5"
                  title="Thụt lề (Tab)"
                >
                  <span>⇥ Tab</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertOutlineSnippet('- ')}
                  className="px-2 py-0.5 bg-white hover:bg-amber-200 rounded-md border border-[#141414] flex items-center gap-0.5"
                  title="Gạch đầu dòng"
                >
                  <span>• Gạch đầu dòng</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertOutlineSnippet('[v] ')}
                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md border border-emerald-600 flex items-center gap-0.5"
                  title="Đánh dấu đã nắm"
                >
                  <span>✓ [v] Đã nắm</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertOutlineSnippet(' // ')}
                  className="px-2 py-0.5 bg-white hover:bg-amber-200 rounded-md border border-[#141414] flex items-center gap-0.5"
                  title="Chú thích ghi nhớ"
                >
                  <span>// Ghi chú</span>
                </button>
              </div>

              {/* Textarea with Tab handler */}
              <textarea
                ref={outlineTextareaRef}
                value={outlineInput}
                onChange={(e) => setOutlineInput(e.target.value)}
                onKeyDown={handleOutlineKeyDown}
                placeholder="Nhập dàn ý bài học... Nhấn phím Tab để thụt dòng tạo nhánh con..."
                className="w-full flex-1 p-2.5 font-mono text-xs font-semibold text-ink bg-white border-2 border-[#141414] rounded-xl outline-none focus:bg-amber-50/40 resize-none leading-relaxed shadow-inner"
              />

              {/* Quick sample chips */}
              <div className="flex items-center gap-1 overflow-x-auto text-[10px] pt-1 border-t border-ink/10">
                <span className="text-ink/50 font-bold shrink-0">Mẫu:</span>
                {SAMPLE_OUTLINES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setOutlineInput(tpl.text)}
                    className="px-1.5 py-0.5 bg-white hover:bg-amber-100 rounded border border-[#141414] shrink-0 text-ink font-bold"
                  >
                    {tpl.name.split(':')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CANVAS AREA (Takes full width in 'canvas' mode or right 60% in 'split' mode) */}
          <div
            ref={flowCanvasRef}
            className={cn(
              "bg-[#FFFDF7] rounded-[22px] border-[2.5px] border-[#141414] shadow-[4px_4px_0px_#141414] overflow-hidden relative",
              viewMode === 'split'
                ? "flex-1 h-full min-h-[500px]"
                : isFullscreen ? "flex-1 h-full min-h-0" : "w-full h-[calc(100vh-170px)] min-h-[580px]"
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
                  setSelectedNodeId(node.id);
                }}
                onNodeDoubleClick={(_, node) => {
                  setSelectedNodeId(node.id);
                  setIsEditingNodeModalOpen(true);
                }}
                onPaneClick={() => {
                  setSelectedNodeId(null);
                }}
                fitView
                minZoom={0.15}
                maxZoom={2.2}
              >
                {/* Paper Grid Background matching user images (IMG_3848 grid lines or IMG_3849 sketchbook) */}
                {canvasBgPattern === 'lines' && (
                  <Background variant={BackgroundVariant.Lines} gap={24} color="#14141412" />
                )}
                {canvasBgPattern === 'dots' && (
                  <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#14141425" />
                )}
                {canvasBgPattern === 'cross' && (
                  <Background variant={BackgroundVariant.Cross} gap={24} size={2} color="#14141415" />
                )}

                <Controls className="!bg-white !border-2 !border-[#141414] !rounded-xl !shadow-[2px_2px_0px_#141414] !m-3" />
                <MiniMap
                  nodeColor={(n) => (n.style?.background as string) || '#FEF08A'}
                  className="!bg-white !border-2 !border-[#141414] !rounded-xl !shadow-[3px_3px_0px_#141414] !m-3 hidden md:block"
                  maskColor="rgba(255, 255, 255, 0.7)"
                />

                {/* Keyboard Shortcuts Guide Banner at Canvas Bottom */}
                <Panel position="bottom-center" className="!mb-2.5">
                  <div className="bg-[#141414]/90 backdrop-blur-xs text-white px-3 py-1.5 rounded-full border border-white/20 shadow-lg text-[10px] font-bold flex items-center gap-2 select-none">
                    <Keyboard className="w-3.5 h-3.5 text-amber-400" />
                    <span><kbd className="bg-white/20 px-1 py-0.5 rounded text-[9px] font-mono">Tab</kbd> Thêm nhánh con</span>
                    <span className="text-white/40">•</span>
                    <span><kbd className="bg-white/20 px-1 py-0.5 rounded text-[9px] font-mono">Enter</kbd> Cùng cấp</span>
                    <span className="text-white/40">•</span>
                    <span><kbd className="bg-white/20 px-1 py-0.5 rounded text-[9px] font-mono">Delete</kbd> Xóa</span>
                    <span className="text-white/40">•</span>
                    <span><kbd className="bg-white/20 px-1 py-0.5 rounded text-[9px] font-mono">Nhấn đúp</kbd> Sửa trực tiếp</span>
                  </div>
                </Panel>
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
                          {selectedNode.data?.isRoot ? 'Chỉnh Sửa Trục Trung Tâm' : 'Chỉnh Sửa Nhánh Kiến Thức'}
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
        </div>
      )}

      {/* UNIFIED OUTLINE & PASTE TAB (GỘP DÀN BÀI VÀ PASTE DÀN Ý THÀNH 1) */}
      {viewMode === 'outline' && (
        <div className="flex flex-col gap-5">
          {/* 1. Quick Paste Box at the Top */}
          <div className="bg-[#FFFDF7] p-4 sm:p-5 rounded-[22px] border-[2.5px] border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col gap-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b-2 border-dashed border-[#141414]/20 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-300 border-2 border-[#141414] flex items-center justify-center shadow-[1px_1px_0px_#141414]">
                  <FileText className="w-4 h-4 text-ink" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black uppercase text-ink">
                    Dán & Soạn Thảo Dàn Ý Tự Động Phân Cấp
                  </h3>
                  <p className="text-[11px] text-ink/65">
                    Rê chuột vào khung để dán ngay (Ctrl+V / Cmd+V) • Tự động gắn ý con vào Level A1, A2, B1, B2...
                  </p>
                </div>
              </div>

              {/* Sample Outlines quick buttons */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="text-ink/50 font-bold hidden md:inline">Mẫu có sẵn:</span>
                {SAMPLE_OUTLINES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setOutlineInput(tpl.text)}
                    className="px-2 py-1 bg-white hover:bg-amber-100 text-ink text-[10px] font-bold rounded-lg border border-[#141414] transition-colors"
                    title={tpl.name}
                  >
                    {tpl.name.split(':')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Formatting & Indentation Toolbar */}
            <div className="flex items-center gap-1.5 flex-wrap p-2 bg-[#FFF9E6] border border-[#141414]/30 rounded-xl text-xs font-bold text-ink">
              <span className="text-[10px] font-black uppercase text-amber-900 mr-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Thanh Công Cụ Soạn Bài:
              </span>
              <button
                type="button"
                onClick={() => insertOutlineSnippet('', true)}
                className="px-2.5 py-1 bg-white hover:bg-amber-200 rounded-lg border border-[#141414] shadow-xs flex items-center gap-1 transition-all active:scale-95"
                title="Thụt dòng 2 dấu cách để tạo nhánh con (Phím Tab)"
              >
                <span>⇥ Thụt lề (Tab)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!outlineTextareaRef.current) return;
                  const ta = outlineTextareaRef.current;
                  const val = ta.value;
                  const start = ta.selectionStart;
                  const before = val.substring(0, start);
                  const lineStart = before.lastIndexOf('\n') + 1;
                  const currentLine = val.substring(lineStart);
                  if (currentLine.startsWith('  ')) {
                    setOutlineInput(val.substring(0, lineStart) + val.substring(lineStart + 2));
                  } else if (currentLine.startsWith('\t')) {
                    setOutlineInput(val.substring(0, lineStart) + val.substring(lineStart + 1));
                  }
                }}
                className="px-2.5 py-1 bg-white hover:bg-amber-200 rounded-lg border border-[#141414] shadow-xs flex items-center gap-1 transition-all active:scale-95"
                title="Lùi lề (Shift + Tab)"
              >
                <span>⇤ Lùi lề</span>
              </button>
              <button
                type="button"
                onClick={() => insertOutlineSnippet('- ')}
                className="px-2.5 py-1 bg-white hover:bg-amber-200 rounded-lg border border-[#141414] shadow-xs flex items-center gap-1 transition-all active:scale-95"
                title="Thêm gạch đầu dòng"
              >
                <span>• Gạch đầu dòng</span>
              </button>
              <button
                type="button"
                onClick={() => insertOutlineSnippet(' // ')}
                className="px-2.5 py-1 bg-white hover:bg-amber-200 rounded-lg border border-[#141414] shadow-xs flex items-center gap-1 transition-all active:scale-95"
                title="Thêm chú thích / ghi chú (//)"
              >
                <span>// Ghi chú</span>
              </button>
              <button
                type="button"
                onClick={() => insertOutlineSnippet('[v] ')}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-600 shadow-xs flex items-center gap-1 transition-all active:scale-95"
                title="Đánh dấu đã nắm ([v])"
              >
                <span>✓ Đã nắm ([v])</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeMap?.nodes && activeMap.nodes.length > 0) {
                    setOutlineInput(generateOutlineFromNodes(activeMap.nodes, activeMap.edges));
                    setSyncToast('Đã nạp dàn bài từ sơ đồ hiện tại ↺');
                    setTimeout(() => setSyncToast(null), 2500);
                  }
                }}
                className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 rounded-lg border border-[#141414] shadow-xs flex items-center gap-1 ml-auto transition-all active:scale-95"
                title="Nạp lại dàn ý từ sơ đồ đang mở"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Nạp từ sơ đồ</span>
              </button>
            </div>

            {/* Direct Paste Textarea with Hover-to-Focus & Tab Indentation */}
            <div className="flex flex-col gap-2">
              <textarea
                ref={outlineTextareaRef}
                rows={6}
                value={outlineInput}
                onChange={(e) => setOutlineInput(e.target.value)}
                onKeyDown={handleOutlineKeyDown}
                onMouseEnter={(e) => e.currentTarget.focus()}
                placeholder={`Rê chuột vào đây và dán (Ctrl+V hoặc Cmd+V)... Nhấn phím Tab để thụt lề tạo nhánh con!

Ví dụ cấu trúc chuẩn bài học:
Lộ Trình Tiếng Anh Toàn Diện
  Level A1: Căn Bản // Nền tảng từ loại
    [v] Động từ to be // am/is/are
    [v] Đại từ nhân xưng & Tính từ sở hữu
    Thì Hiện tại đơn // S + V(s/es)
  Level A2: Sơ Cấp // Giao tiếp thường nhật
    Thì Quá khứ đơn // S + V2/ed
    Giới từ In/On/At`}
                className="w-full p-3 font-mono text-xs font-semibold text-ink bg-white border-2 border-[#141414] rounded-xl outline-none focus:bg-amber-50/40 focus:border-amber-500 resize-y leading-relaxed shadow-inner"
              />

              {/* Action Toolbar for Pasting */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (navigator?.clipboard?.readText) {
                          const clipText = await navigator.clipboard.readText();
                          if (clipText && clipText.trim()) {
                            setOutlineInput(clipText);
                          }
                        }
                      } catch {
                        outlineTextareaRef.current?.focus();
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 text-xs font-black rounded-xl border-2 border-emerald-700 shadow-[2px_2px_0px_#047857] flex items-center gap-1.5 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Dán từ Clipboard (1 Chạm)</span>
                  </button>

                  <div className="flex items-center gap-2 text-xs font-bold text-ink">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="outlineModeUnified"
                        checked={outlineMode === 'replace'}
                        onChange={() => setOutlineMode('replace')}
                        className="accent-black"
                      />
                      <span>Cập nhật sơ đồ hiện tại</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="outlineModeUnified"
                        checked={outlineMode === 'new'}
                        onChange={() => setOutlineMode('new')}
                        className="accent-black"
                      />
                      <span>Tạo sơ đồ mới</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {outlineInput.trim() && (
                    <button
                      type="button"
                      onClick={() => setOutlineInput('')}
                      className="px-2.5 py-1.5 text-xs font-bold text-ink/60 hover:text-ink"
                    >
                      Xóa nội dung
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleParseAndApplyOutline}
                    disabled={!outlineInput.trim()}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-ink text-xs font-black uppercase rounded-xl border-2 border-[#141414] shadow-[3px_3px_0px_#141414] flex items-center justify-center gap-2 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    <Brain className="w-4 h-4" />
                    <span>💾 Lưu Bài Học & Cập Nhật Sơ Đồ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Interactive Hierarchical Outline Tree right below */}
          <div className="bg-[#FFFDF7] p-5 sm:p-6 rounded-[24px] border-[2.5px] border-[#141414] shadow-[5px_5px_0px_#141414] flex flex-col gap-4 min-h-[450px]">
            <div className="flex items-center justify-between border-b-2 border-dashed border-[#141414]/20 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-black text-ink uppercase flex items-center gap-2">
                  <ListTree className="w-5 h-5 text-amber-500" />
                  Dàn Ý Phân Cấp & Đánh Dấu Nắm Vững (Live)
                </h3>
                <p className="text-xs text-ink/60">
                  Tick ô vuông bên cạnh mỗi nhánh khi đã nắm vững • Chỉnh sửa tên nhánh trực tiếp tại đây
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('canvas')}
                  className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-950 text-xs font-black rounded-xl border-2 border-blue-600 shadow-[2px_2px_0px_#2563EB] flex items-center gap-1.5 transition-all active:translate-x-0.5 active:translate-y-0.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem trên Sơ Đồ Canvas</span>
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
                const theme = nodeMilestoneThemeMap.get(node.id);
                const hCode = hierarchicalCodes.get(node.id) || '';
                const isSub = hCode.includes('.');

                return (
                  <div
                    key={node.id}
                    className={cn(
                      'p-3 rounded-xl border-2 border-[#141414] flex items-start gap-3 transition-all',
                      isRoot ? 'bg-amber-100 font-black shadow-[3px_3px_0px_#141414]' : hasParent ? (isSub ? 'ml-10 sm:ml-14' : 'ml-4 sm:ml-7') : 'bg-gray-50',
                      isDone ? 'bg-emerald-50/90 border-emerald-700' : ''
                    )}
                    style={{
                      borderColor: isDone ? '#059669' : theme ? (isSub ? theme.subBorder : theme.border) : '#141414',
                      backgroundColor: isDone ? '#ECFDF5' : theme ? (isSub ? theme.subBg : theme.bg) : hasParent ? (node.style?.background as string) || '#fff' : '#FEF08A'
                    }}
                  >
                    {!isRoot ? (
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(node.id)}
                        className="mt-0.5 text-ink hover:text-emerald-700 transition-transform active:scale-90 shrink-0 cursor-pointer"
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

                    {/* Level / Milestone Badge */}
                    {!isRoot && (
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-md border shrink-0 mt-0.5"
                        style={{
                          backgroundColor: theme ? theme.badgeBg : 'rgba(0,0,0,0.06)',
                          color: theme ? theme.badgeText : '#141414',
                          borderColor: theme ? theme.border : 'rgba(20,20,20,0.2)'
                        }}
                      >
                        {hCode || node.data?.milestoneBadge || '•'}
                      </span>
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
                            isDone ? 'text-emerald-950 font-black' : ''
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
