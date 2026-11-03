import React, { useState, useMemo, useEffect } from 'react';
import {
  Compass,
  Trophy,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  Brain,
  BookOpen,
  ChevronRight,
  Flame,
  Star,
  Check,
  CheckSquare,
  Square,
  Flag,
  Route,
  Milestone,
  Eye,
  Layers,
  Zap,
  Award,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { LEVEL_THEMES, type LevelTheme } from './StudyHub';
import { INITIAL_KNOWLEDGE_TOPICS, type KnowledgeTopic } from './AioKnowledgeBase';

interface AioRoadmapViewProps {
  onOpenTopicMindmap: (topic: KnowledgeTopic) => void;
  onOpenTopicDetail: (topic: KnowledgeTopic) => void;
  onSwitchToKnowledgeTab: (level?: string) => void;
  onSwitchToTypingTab?: () => void;
  completedTopicIds?: Set<string>;
  onToggleTopicComplete?: (topicId: string) => void;
}

export function AioRoadmapView({
  onOpenTopicMindmap,
  onOpenTopicDetail,
  onSwitchToKnowledgeTab,
  onSwitchToTypingTab,
  completedTopicIds: initialCompletedSet,
  onToggleTopicComplete
}: AioRoadmapViewProps) {
  // View mode: 'winding' (serpentine S-curve road) vs 'stages' (milestone stage cards)
  const [roadmapDisplayMode, setRoadmapDisplayMode] = useState<'winding' | 'stages'>('winding');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1'>('ALL');
  const [expandedFormulaId, setExpandedFormulaId] = useState<string | null>(null);

  // Local state for completed topics with localStorage persistence
  const [localCompletedIds, setLocalCompletedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('aio_completed_roadmap_topics');
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch {
      // fallback
    }
    // Default completed from INITIAL_KNOWLEDGE_TOPICS if available
    const defaults = INITIAL_KNOWLEDGE_TOPICS.filter((t) => t.completed).map((t) => t.id);
    return new Set(defaults);
  });

  const isDone = (id: string) => {
    if (initialCompletedSet) return initialCompletedSet.has(id);
    return localCompletedIds.has(id);
  };

  const handleToggleTopic = (topicId: string) => {
    if (onToggleTopicComplete) {
      onToggleTopicComplete(topicId);
    }
    setLocalCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      try {
        localStorage.setItem('aio_completed_roadmap_topics', JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Canonical Stage Definitions matching LEVEL_THEMES exactly
  const stageDefinitions = [
    {
      id: 'A1',
      name: 'Chặng 1: Xóa Mất Gốc & Căn Bản',
      cefr: 'Level A1 (Beginner)',
      badge: 'CĂN BẢN',
      tagline: 'Làm quen lại tiếng Anh, phát âm 44 âm IPA, To Be và Hiện Tại Đơn.',
      theme: LEVEL_THEMES.A1,
      topics: INITIAL_KNOWLEDGE_TOPICS.filter((t) => t.level === 'A1')
    },
    {
      id: 'A2',
      name: 'Chặng 2: Sơ Cấp & Giao Tiếp Đời Sống',
      cefr: 'Level A2 (Elementary)',
      badge: 'SƠ CẤP',
      tagline: 'Kể chuyện quá khứ (Past Simple), giới từ In/On/At, so sánh hơn/nhất và trọng âm từ.',
      theme: LEVEL_THEMES.A2,
      topics: INITIAL_KNOWLEDGE_TOPICS.filter((t) => t.level === 'A2')
    },
    {
      id: 'B1',
      name: 'Chặng 3: Trung Cấp & Tự Tin Diễn Đạt',
      cefr: 'Level B1 (Intermediate)',
      badge: 'TRUNG CẤP',
      tagline: 'Hiện tại hoàn thành, câu điều kiện loại 1 & 2, mệnh đề quan hệ và bị động.',
      theme: LEVEL_THEMES.B1,
      topics: INITIAL_KNOWLEDGE_TOPICS.filter((t) => t.level === 'B1')
    },
    {
      id: 'B2',
      name: 'Chặng 4: Nâng Cao & Học Thuật',
      cefr: 'Level B2 (Upper-Intermediate)',
      badge: 'NÂNG CAO',
      tagline: 'Đọc báo nước ngoài, câu điều kiện hỗn hợp, đảo ngữ nhấn mạnh và thành ngữ bản xứ.',
      theme: LEVEL_THEMES.B2,
      topics: INITIAL_KNOWLEDGE_TOPICS.filter((t) => t.level === 'B2')
    },
    {
      id: 'C1',
      name: 'Chặng 5: Chuyên Sâu & Thành Thạo Bản Xứ',
      cefr: 'Level C1 (Advanced)',
      badge: 'CHUYÊN SÂU',
      tagline: 'Viết luận học thuật, thể giả định subjunctive, hedging và lập luận sắc bén.',
      theme: LEVEL_THEMES.C1,
      topics: INITIAL_KNOWLEDGE_TOPICS.filter((t) => t.level === 'C1')
    }
  ];

  // All topics in sequential roadmap order
  const allTopics = useMemo(() => {
    return INITIAL_KNOWLEDGE_TOPICS;
  }, []);

  // Filtered topics for the roadmap
  const visibleTopics = useMemo(() => {
    if (levelFilter === 'ALL') return allTopics;
    return allTopics.filter((t) => t.level === levelFilter);
  }, [allTopics, levelFilter]);

  // Overall Statistics
  const totalTopics = allTopics.length;
  const completedCount = allTopics.filter((t) => isDone(t.id)).length;
  const totalPercent = Math.round((completedCount / (totalTopics || 1)) * 100);

  // First uncompleted topic along the path is marked as "Bạn đang ở đây"
  const activeMilestoneIndex = useMemo(() => {
    const idx = allTopics.findIndex((t) => !isDone(t.id));
    return idx >= 0 ? idx : allTopics.length - 1;
  }, [allTopics, localCompletedIds, initialCompletedSet]);

  // Winding Road Coordinates calculation for SVG serpentine S-curve
  const roadGeometry = useMemo(() => {
    const width = 880;
    const centerX = 440;
    const startY = 130;
    const stepY = 210;
    const amplitude = 220; // horizontal wave swing

    const points = visibleTopics.map((topic, i) => {
      // Wave oscillates back and forth
      const waveAngle = i * 0.85;
      const x = Math.round(centerX + Math.sin(waveAngle) * amplitude);
      const y = startY + i * stepY;
      // Determine side for milestone card: left if curve is leaning right, right if curve is leaning left
      const isRightSide = Math.sin(waveAngle) <= 0.05;
      return {
        topic,
        index: i,
        x,
        y,
        isRightSide,
        theme: LEVEL_THEMES[topic.level] || LEVEL_THEMES.A1,
        isCurrentActive: levelFilter === 'ALL' && i === activeMilestoneIndex && !isDone(topic.id)
      };
    });

    const totalHeight = startY + visibleTopics.length * stepY + 160;

    // Build SVG smooth cubic bezier path string
    let pathD = '';
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const midY = (p1.y + p2.y) / 2;
        // Cubic bezier creates an authentic smooth highway curve
        pathD += ` C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y}`;
      }
    }

    return { width, totalHeight, points, pathD, startY, stepY, centerX };
  }, [visibleTopics, activeMilestoneIndex, levelFilter, localCompletedIds, initialCompletedSet]);

  return (
    <div className="flex flex-col gap-5 w-full max-w-5xl mx-auto pb-12 select-none">
      {/* 1. ROADMAP HEADER BANNER */}
      <div className="bg-[#FFFDF7] p-5 sm:p-6 rounded-[24px] border-[2.5px] border-[#141414] shadow-[5px_5px_0px_#141414] flex flex-col gap-4 relative overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-200/50 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0EA5E9] border-2 border-[#141414] flex items-center justify-center shadow-[2.5px_2.5px_0px_#141414] shrink-0 text-white">
              <Route className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-ink uppercase tracking-tight">
                  Lộ Trình Học Chuẩn Quốc Tế (A1 → C1)
                </h2>
                <span className="bg-sky-100 text-sky-900 border border-sky-600 font-black text-[10px] px-2 py-0.5 rounded-full">
                  Winding Highway
                </span>
              </div>
              <p className="text-xs sm:text-sm text-ink/75 font-medium mt-0.5">
                Đường đèo uốn lượn S-Curve dẫn lối qua 5 chặng CEFR từ người mất gốc đến thành thạo bản xứ.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
            {onSwitchToTypingTab && (
              <button
                onClick={onSwitchToTypingTab}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-ink text-xs font-black uppercase rounded-xl border-2 border-[#141414] shadow-[2.5px_2.5px_0px_#141414] flex items-center gap-1.5 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                title="Luyện gõ câu tiếng Anh chuẩn aioenglish.com/go-cau"
              >
                <Keyboard className="w-4 h-4" />
                <span>Luyện Gõ Câu (tab=go-cau)</span>
              </button>
            )}

            <button
              onClick={() => onSwitchToKnowledgeTab()}
              className="px-3.5 py-2 bg-[#FEF08A] hover:bg-amber-300 text-ink text-xs font-black uppercase rounded-xl border-2 border-[#141414] shadow-[2.5px_2.5px_0px_#141414] flex items-center gap-1.5 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Kho Kiến Thức (tab=kien-thuc)</span>
            </button>
          </div>
        </div>

        {/* Unified Overall Progress Bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-[#141414] shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-black text-ink flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>Tiến Độ Chinh Phục:</span>
              <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-500 text-[11px]">
                {completedCount} / {totalTopics} Chủ Điểm ({totalPercent}%)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-ink/70">
              <span>Đang ở chặng:</span>
              <span
                className="font-black px-2 py-0.5 rounded-md text-white text-[10px]"
                style={{
                  backgroundColor:
                    LEVEL_THEMES[allTopics[activeMilestoneIndex]?.level || 'A1'].badgeBg
                }}
              >
                {allTopics[activeMilestoneIndex]?.level || 'A1'} -{' '}
                {stageDefinitions.find((s) => s.id === allTopics[activeMilestoneIndex]?.level)?.badge}
              </span>
            </div>
          </div>

          {/* Progress bar with synchronized CEFR level segments */}
          <div className="w-full h-3 bg-gray-100 rounded-full border border-[#141414] overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 via-amber-500 to-violet-500 transition-all duration-500 relative"
              style={{ width: `${Math.max(totalPercent, 2)}%` }}
            />
          </div>

          {/* Stage Progress Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
            {stageDefinitions.map((s) => {
              const stageDone = s.topics.filter((t) => isDone(t.id)).length;
              const stageTotal = s.topics.length;
              const isStageAllDone = stageDone === stageTotal && stageTotal > 0;
              return (
                <div
                  key={s.id}
                  className={cn(
                    'p-1.5 rounded-lg border flex items-center justify-between text-[10px] font-bold transition-all',
                    isStageAllDone ? 'ring-1 ring-emerald-500' : ''
                  )}
                  style={{
                    backgroundColor: s.theme.bg,
                    borderColor: s.theme.border
                  }}
                >
                  <span className="font-black" style={{ color: s.theme.border }}>
                    {s.id} {s.badge}
                  </span>
                  <span className="font-extrabold text-ink/80">
                    {stageDone}/{stageTotal}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* View Mode & Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1 border-t border-dashed border-[#141414]/20">
          {/* Display Mode: Winding Road vs Stage Cards */}
          <div className="flex items-center bg-[#EFECE6] p-1 rounded-xl border-2 border-[#141414] text-xs font-black shadow-xs">
            <button
              onClick={() => setRoadmapDisplayMode('winding')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                roadmapDisplayMode === 'winding'
                  ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#141414]'
                  : 'text-ink/65 hover:text-ink'
              )}
            >
              <Route className="w-3.5 h-3.5 text-amber-400" />
              <span>Đường Uốn Lượn (Winding S-Road)</span>
            </button>
            <button
              onClick={() => setRoadmapDisplayMode('stages')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                roadmapDisplayMode === 'stages'
                  ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#141414]'
                  : 'text-ink/65 hover:text-ink'
              )}
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Khối Chặng Cột Mốc (Stage Cards)</span>
            </button>
          </div>

          {/* CEFR Level Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold py-0.5">
            <span className="text-[10px] font-black uppercase text-ink/50 mr-1 hidden md:inline">
              Lọc chặng:
            </span>
            <button
              onClick={() => setLevelFilter('ALL')}
              className={cn(
                'px-2.5 py-1 rounded-lg border transition-all cursor-pointer text-xs font-black shrink-0',
                levelFilter === 'ALL'
                  ? 'bg-[#141414] text-white border-[#141414] shadow-[1.5px_1.5px_0px_#141414]'
                  : 'bg-white hover:bg-gray-100 text-ink border-[#141414]'
              )}
            >
              Tất cả (22)
            </button>
            {(['A1', 'A2', 'B1', 'B2', 'C1'] as const).map((lvl) => {
              const th = LEVEL_THEMES[lvl];
              const isSelected = levelFilter === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  style={{
                    backgroundColor: isSelected ? th.badgeBg : th.bg,
                    borderColor: th.border,
                    color: isSelected ? th.badgeText : '#141414'
                  }}
                  className={cn(
                    'px-2 py-1 rounded-lg border font-black text-xs transition-all cursor-pointer shrink-0',
                    isSelected ? 'shadow-[1.5px_1.5px_0px_#141414] scale-105' : 'hover:scale-102'
                  )}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. WINDING ROAD (SERPENTINE S-CURVE HIGHWAY) VIEW                         */}
      {/* ========================================================================= */}
      {roadmapDisplayMode === 'winding' && (
        <div className="bg-[#FFFDF7] rounded-[28px] border-[2.5px] border-[#141414] p-4 sm:p-8 shadow-[5px_5px_0px_#141414] relative overflow-hidden flex flex-col items-center">
          {/* Notebook Paper Grid Pattern Background */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(20,20,20,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(20,20,20,0.05) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* START BANNER 🏁 */}
          <div className="relative z-10 mb-4 flex flex-col items-center">
            <div className="bg-emerald-500 text-white font-black text-xs sm:text-sm uppercase px-5 py-2 rounded-2xl border-2 border-[#141414] shadow-[3px_3px_0px_#141414] flex items-center gap-2">
              <Flag className="w-4 h-4 fill-white" />
              <span>🏁 Vạch Xuất Phát: Người Mất Gốc Bắt Đầu Tại Đây</span>
            </div>
            <div className="w-1 h-6 bg-slate-800" />
          </div>

          {/* SVG SERPENTINE ROAD CANVAS */}
          <div className="relative w-full max-w-[880px] overflow-x-auto py-2">
            <div
              className="relative mx-auto"
              style={{ width: `${roadGeometry.width}px`, height: `${roadGeometry.totalHeight}px` }}
            >
              {/* SVG Layer: Asphalt Road Bed, Curbs & Center Line */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
                viewBox={`0 0 ${roadGeometry.width} ${roadGeometry.totalHeight}`}
              >
                <defs>
                  {/* Subtle road bed drop shadow */}
                  <filter id="road-shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.16" />
                  </filter>
                </defs>

                {/* 1. Road Outer Shadow Bed */}
                <path
                  d={roadGeometry.pathD}
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="56"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#road-shadow)"
                />

                {/* 2. Road Surface Asphalt */}
                <path
                  d={roadGeometry.pathD}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="48"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* 3. Road Segment Color Highlights based on CEFR Level */}
                {roadGeometry.points.map((pt, idx) => {
                  if (idx === roadGeometry.points.length - 1) return null;
                  const nextPt = roadGeometry.points[idx + 1];
                  const midY = (pt.y + nextPt.y) / 2;
                  const segD = `M ${pt.x} ${pt.y} C ${pt.x} ${midY}, ${nextPt.x} ${midY}, ${nextPt.x} ${nextPt.y}`;
                  return (
                    <path
                      key={`seg-${idx}`}
                      d={segD}
                      fill="none"
                      stroke={pt.theme.badgeBg}
                      strokeWidth="38"
                      strokeLinecap="round"
                      opacity="0.35"
                    />
                  );
                })}

                {/* 4. Road Dashed Yellow/White Center Divider Markings */}
                <path
                  d={roadGeometry.pathD}
                  fill="none"
                  stroke="#FEF08A"
                  strokeWidth="3"
                  strokeDasharray="10 12"
                  strokeLinecap="round"
                  opacity="0.9"
                />

                {/* 5. Guide Lines connecting Road Waypoints to Topic Cards */}
                {roadGeometry.points.map((pt) => {
                  const cardTargetX = pt.isRightSide ? pt.x + 80 : pt.x - 80;
                  return (
                    <line
                      key={`guide-${pt.index}`}
                      x1={pt.x}
                      y1={pt.y}
                      x2={cardTargetX}
                      y2={pt.y}
                      stroke={pt.theme.border}
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                      opacity="0.8"
                    />
                  );
                })}
              </svg>

              {/* Waypoints & Topic Cards placed absolutely along the curve */}
              {roadGeometry.points.map((pt) => {
                const topic = pt.topic;
                const done = isDone(topic.id);
                const isExpanded = expandedFormulaId === topic.id;

                // Position for the Milestone Waypoint Pin on the road
                const waypointLeft = pt.x - 22; // 44px width
                const waypointTop = pt.y - 22; // 44px height

                // Position for the Milestone Card beside the road
                // Left or Right depending on the curvature
                const cardLeft = pt.isRightSide
                  ? Math.min(pt.x + 40, roadGeometry.width - 340)
                  : Math.max(pt.x - 380, 10);
                const cardTop = pt.y - 75;

                // Level Transition Header banner (if topic is the first in its level)
                const isLevelFirst =
                  pt.index === 0 || roadGeometry.points[pt.index - 1]?.topic.level !== topic.level;

                return (
                  <React.Fragment key={topic.id}>
                    {/* STAGE GATEWAY ARCH (when transitioning to a new CEFR level) */}
                    {isLevelFirst && (
                      <div
                        className="absolute z-20 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                        style={{
                          left: `${pt.x}px`,
                          top: `${pt.y - 70}px`
                        }}
                      >
                        <div
                          className="px-3 py-1 rounded-full text-white font-black text-[10px] uppercase border border-[#141414] shadow-[2px_2px_0px_#141414] whitespace-nowrap flex items-center gap-1.5 pointer-events-auto"
                          style={{ backgroundColor: pt.theme.badgeBg }}
                        >
                          <Milestone className="w-3.5 h-3.5" />
                          <span>
                            Cổng Chặng {topic.level}: {stageDefinitions.find((s) => s.id === topic.level)?.badge}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* ROAD WAYPOINT CHECKPOINT PIN (sitting directly on the road center) */}
                    <div
                      className="absolute z-30 flex items-center justify-center cursor-pointer group"
                      style={{
                        left: `${waypointLeft}px`,
                        top: `${waypointTop}px`,
                        width: '44px',
                        height: '44px'
                      }}
                      onClick={() => handleToggleTopic(topic.id)}
                      title={`Mốc ${topic.code}: ${topic.title} - Bấm để đánh dấu đã nắm`}
                    >
                      {done ? (
                        <div
                          className="w-11 h-11 rounded-full border-[3.5px] border-white shadow-lg flex items-center justify-center ring-4 transition-transform group-hover:scale-115"
                          style={{
                            backgroundColor: pt.theme.badgeBg,
                            borderColor: '#FFFFFF'
                          }}
                        >
                          <Check className="w-5 h-5 text-white stroke-[3.5]" />
                        </div>
                      ) : pt.isCurrentActive ? (
                        <div className="relative flex flex-col items-center">
                          {/* Pulsing Radar Ring */}
                          <div className="absolute -inset-2 rounded-full bg-amber-400 opacity-75 animate-ping" />
                          <div className="w-11 h-11 rounded-full bg-amber-400 border-[3.5px] border-white shadow-xl flex items-center justify-center ring-4 ring-amber-300 transition-transform group-hover:scale-115 z-10">
                            <Star className="w-5 h-5 text-amber-950 fill-amber-950" />
                          </div>
                          {/* Floating "Bạn đang ở đây" badge */}
                          <div className="absolute -bottom-6 whitespace-nowrap bg-[#141414] text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-lg border border-white/20 z-40 animate-bounce">
                            📍 Bạn đang ở đây
                          </div>
                        </div>
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full bg-white border-[3px] shadow-md flex items-center justify-center transition-transform group-hover:scale-110"
                          style={{ borderColor: pt.theme.border }}
                        >
                          <span
                            className="text-xs font-black tracking-tight"
                            style={{ color: pt.theme.border }}
                          >
                            {topic.code.split('.')[1] || pt.index + 1}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* INTERACTIVE TOPIC NOTEBOOK CARD */}
                    <div
                      className={cn(
                        'absolute z-20 w-[340px] rounded-2xl border-[2.5px] border-[#141414] p-3.5 shadow-[3.5px_3.5px_0px_#141414] transition-all duration-200 flex flex-col gap-2',
                        done ? 'opacity-95' : 'hover:shadow-[5px_5px_0px_#141414]'
                      )}
                      style={{
                        left: `${cardLeft}px`,
                        top: `${cardTop}px`,
                        backgroundColor: pt.theme.bg,
                        borderColor: done ? pt.theme.border : '#141414'
                      }}
                    >
                      {/* Top Card Row: Code, Category, Difficulty, Checkbox */}
                      <div className="flex items-center justify-between gap-2 border-b border-dashed border-[#141414]/20 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded text-white shadow-xs"
                            style={{ backgroundColor: pt.theme.badgeBg }}
                          >
                            {topic.code}
                          </span>
                          <span className="text-[10px] font-bold text-ink/75 bg-black/5 px-2 py-0.5 rounded">
                            {topic.category}
                          </span>
                        </div>

                        {/* Interactive Completion Tickbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleTopic(topic.id)}
                          className="flex items-center gap-1 text-[11px] font-black cursor-pointer hover:scale-105 transition-transform"
                          title={done ? 'Bấm để đánh dấu chưa nắm' : 'Bấm để đánh dấu đã nắm vững'}
                        >
                          {done ? (
                            <span className="text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded-md border border-emerald-600 flex items-center gap-1 font-black">
                              <Check className="w-3 h-3 stroke-[3]" /> Đã Nắm
                            </span>
                          ) : (
                            <span className="text-ink/65 hover:text-ink flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded-md border border-[#141414]/30">
                              <Square className="w-3 h-3" /> Chưa Nắm
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Main Title & Description */}
                      <div className="flex flex-col">
                        <h4
                          onClick={() => onOpenTopicDetail(topic)}
                          className={cn(
                            'text-xs sm:text-sm font-black text-ink leading-snug cursor-pointer hover:underline',
                            done ? 'text-emerald-950 font-black' : ''
                          )}
                        >
                          {topic.title}
                        </h4>
                        <p className="text-[11px] text-ink/70 font-medium line-clamp-2 mt-0.5 leading-relaxed">
                          {topic.vietnameseTitle || topic.summary}
                        </p>
                      </div>

                      {/* Expandable Key Formula Snippet */}
                      {topic.formulas && topic.formulas.length > 0 && (
                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedFormulaId(isExpanded ? null : topic.id)
                            }
                            className="text-[10px] font-bold text-ink/60 hover:text-ink flex items-center gap-1 cursor-pointer"
                          >
                            <ChevronDown
                              className={cn(
                                'w-3 h-3 transition-transform',
                                isExpanded ? 'rotate-180' : ''
                              )}
                            />
                            <span>{isExpanded ? 'Ẩn công thức' : 'Xem công thức nhanh'}</span>
                          </button>

                          {isExpanded && (
                            <div className="mt-1 p-2 bg-white rounded-lg border border-[#141414]/20 text-[10px] font-mono text-ink flex flex-col gap-0.5 shadow-inner">
                              {topic.formulas.map((f, fIdx) => (
                                <p key={fIdx} className="break-words">
                                  {f}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bottom Action Buttons: Mindmap & Detail */}
                      <div className="flex items-center gap-1.5 pt-1 border-t border-dashed border-[#141414]/15 mt-auto">
                        <button
                          type="button"
                          onClick={() => onOpenTopicMindmap(topic)}
                          className="flex-1 py-1.5 px-2 bg-amber-300 hover:bg-amber-400 text-ink text-[11px] font-black rounded-lg border border-[#141414] shadow-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                          title="Mở sơ đồ tư duy tỏa tròn chuẩn sổ tay của chủ điểm này"
                        >
                          <Brain className="w-3.5 h-3.5 text-amber-950" />
                          <span>Mở Mindmap Tỏa Tròn</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenTopicDetail(topic)}
                          className="p-1.5 bg-white hover:bg-gray-100 text-ink rounded-lg border border-[#141414] shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                          title="Xem toàn bộ lý thuyết và ví dụ"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* FINISH PODIUM 🏆 */}
          <div className="relative z-10 mt-6 flex flex-col items-center">
            <div className="w-1 h-6 bg-slate-800" />
            <div className="bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white font-black text-xs sm:text-sm uppercase px-6 py-2.5 rounded-2xl border-2 border-[#141414] shadow-[4px_4px_0px_#141414] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-300 fill-yellow-300" />
              <span>🏆 ĐÍCH ĐẾN: C1 - THÀNH THẠO BẢN XỨ & IELTS 7.5+</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. STAGE CARDS VIEW (DANH SÁCH THEO CHẶNG CỘT MỐC)                        */}
      {/* ========================================================================= */}
      {roadmapDisplayMode === 'stages' && (
        <div className="flex flex-col gap-6">
          {stageDefinitions.map((lvl) => {
            const completedInLevel = lvl.topics.filter((t) => isDone(t.id)).length;
            const totalInLevel = lvl.topics.length;
            const pct = Math.round((completedInLevel / (totalInLevel || 1)) * 100);
            const isAllDone = totalInLevel > 0 && completedInLevel === totalInLevel;

            return (
              <div
                key={lvl.id}
                className="rounded-[24px] border-[2.5px] border-[#141414] p-5 sm:p-6 shadow-[4px_4px_0px_#141414] flex flex-col gap-4 relative overflow-hidden"
                style={{ backgroundColor: lvl.theme.bg }}
              >
                {/* Milestone Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-dashed border-[#141414]/20 pb-3">
                  <div className="flex items-center gap-3">
                    {/* Ring Percentage Indicator */}
                    <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-black/10 stroke-current"
                          strokeWidth="3.5"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="stroke-current transition-all duration-500"
                          style={{ color: lvl.theme.badgeBg }}
                          strokeDasharray={`${pct}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="absolute font-black text-xs text-ink">{lvl.id}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-ink uppercase">
                          {lvl.name}
                        </h3>
                        {isAllDone && (
                          <span className="bg-emerald-200 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-700">
                            ✓ ĐÃ HOÀN THÀNH
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink/70 font-medium">{lvl.tagline}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-xs font-black text-ink">
                      {completedInLevel}/{totalInLevel} chủ điểm
                    </span>
                    <button
                      onClick={() => onSwitchToKnowledgeTab(lvl.id)}
                      className="px-2.5 py-1 bg-white hover:bg-black/5 text-ink text-xs font-bold rounded-lg border border-[#141414] flex items-center gap-1 cursor-pointer"
                    >
                      <span>Lọc {lvl.id}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Topics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lvl.topics.map((topic) => {
                    const done = isDone(topic.id);
                    return (
                      <div
                        key={topic.id}
                        className={cn(
                          'p-3.5 rounded-xl border border-[#141414] shadow-xs flex flex-col justify-between gap-2.5 transition-all bg-white',
                          done
                            ? 'bg-[#F0FDF4] border-emerald-600 ring-1 ring-emerald-500'
                            : 'hover:border-[#141414] hover:shadow-[2px_2px_0px_#141414]'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="text-[10px] font-black px-1.5 py-0.5 rounded text-white shrink-0"
                              style={{ backgroundColor: lvl.theme.badgeBg }}
                            >
                              {topic.code}
                            </span>
                            <span className="text-[10px] font-bold text-ink/50 bg-black/5 px-1.5 py-0.5 rounded truncate">
                              {topic.category}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleTopic(topic.id)}
                            className="text-ink hover:text-emerald-700 transition-transform active:scale-90 shrink-0 cursor-pointer"
                            title={done ? 'Đã nắm vững! Bấm để bỏ tick' : 'Chưa nắm! Bấm để tick đã nắm'}
                          >
                            {done ? (
                              <CheckSquare className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
                            ) : (
                              <Square className="w-4 h-4 text-ink/40 hover:text-ink" />
                            )}
                          </button>
                        </div>

                        <div>
                          <p className="text-xs font-black text-ink leading-snug line-clamp-1">
                            {topic.title}
                          </p>
                          <p className="text-[10px] text-ink/65 line-clamp-2 mt-0.5">
                            {topic.vietnameseTitle || topic.summary}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1 border-t border-dashed border-[#141414]/10">
                          <button
                            onClick={() => onOpenTopicMindmap(topic)}
                            title="Mở sơ đồ tư duy tỏa tròn của chủ điểm này"
                            className="flex-1 py-1 px-2 bg-amber-300 hover:bg-amber-400 text-ink text-[10px] font-black rounded-lg border border-[#141414] flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                          >
                            <Brain className="w-3 h-3 text-amber-950" />
                            <span>Mở Mindmap</span>
                          </button>

                          <button
                            onClick={() => onOpenTopicDetail(topic)}
                            title="Xem chi tiết lý thuyết"
                            className="p-1 bg-white hover:bg-gray-100 text-ink rounded-lg border border-[#141414] flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                          >
                            <BookOpen className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
