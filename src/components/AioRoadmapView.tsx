import React from 'react';
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
  Star
} from 'lucide-react';
import { cn } from '../lib/utils';
import { LEVEL_THEMES } from './StudyHub';
import { INITIAL_KNOWLEDGE_TOPICS, type KnowledgeTopic } from './AioKnowledgeBase';

interface AioRoadmapViewProps {
  onOpenTopicMindmap: (topic: KnowledgeTopic) => void;
  onOpenTopicDetail: (topic: KnowledgeTopic) => void;
  onSwitchToKnowledgeTab: (level?: string) => void;
  completedTopicIds?: Set<string>;
}

export function AioRoadmapView({
  onOpenTopicMindmap,
  onOpenTopicDetail,
  onSwitchToKnowledgeTab,
  completedTopicIds
}: AioRoadmapViewProps) {
  const isDone = (id: string) => completedTopicIds?.has(id);

  // Group topics by Level
  const levels = [
    {
      id: 'A1',
      name: 'Chặng 1: Xóa Mất Gốc & Căn Bản',
      cefr: 'Level A1 (Beginner)',
      badge: 'CĂN BẢN',
      desc: 'Làm quen lại với tiếng Anh, phát âm 44 âm IPA, nắm vững To Be và thì Hiện tại đơn.',
      color: '#10B981',
      bgLight: '#ECFDF5',
      topics: INITIAL_KNOWLEDGE_TOPICS.filter((t) => t.level === 'A1')
    },
    {
      id: 'A2',
      name: 'Chặng 2: Sơ Cấp & Giao Tiếp Đời Sống',
      cefr: 'Level A2 (Elementary)',
      badge: 'SƠ CẤP',
      desc: 'Kể chuyện trong quá khứ (Past Simple), giới từ In/On/At, so sánh hơn/nhất và quy tắc trọng âm từ.',
      color: '#0EA5E9',
      bgLight: '#F0F9FF',
      topics: INITIAL_KNOWLEDGE_TOPICS.filter((t) => t.level === 'A2')
    },
    {
      id: 'B1',
      name: 'Chặng 3: Trung Cấp & Tự Tin Diễn Đạt',
      cefr: 'Level B1 (Intermediate)',
      badge: 'TRUNG CẤP',
      desc: 'Nâng tầm với Hiện tại hoàn thành, câu điều kiện loại 1 & 2, mệnh đề quan hệ và bị động.',
      color: '#F59E0B',
      bgLight: '#FFFBEB',
      topics: INITIAL_KNOWLEDGE_TOPICS.filter((t) => t.level === 'B1')
    },
    {
      id: 'B2',
      name: 'Chặng 4: Nâng Cao & Học Thuật',
      cefr: 'Level B2 (Upper-Intermediate)',
      badge: 'NÂNG CAO',
      desc: 'Đọc báo nước ngoài, câu điều kiện hỗn hợp, đảo ngữ nhấn mạnh và thành ngữ bản xứ.',
      color: '#8B5CF6',
      bgLight: '#FAF5FF',
      topics: INITIAL_KNOWLEDGE_TOPICS.filter((t) => t.level === 'B2')
    },
    {
      id: 'C1',
      name: 'Chặng 5: Chuyên Sâu & Thành Thạo Bản Xứ',
      cefr: 'Level C1 (Advanced)',
      badge: 'CHUYÊN SÂU',
      desc: 'Viết luận học thuật, thể giả định, kỹ thuật hedging và lập luận sắc bén.',
      color: '#F43F5E',
      bgLight: '#FFF1F2',
      topics: INITIAL_KNOWLEDGE_TOPICS.filter((t) => t.level === 'C1')
    }
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Roadmap Header Banner */}
      <div className="bg-[#FFFDF7] p-5 sm:p-6 rounded-[24px] border-[2.5px] border-[#141414] shadow-[5px_5px_0px_#141414] flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0EA5E9] border-2 border-[#141414] flex items-center justify-center shadow-[2px_2px_0px_#141414] shrink-0 text-white">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-ink uppercase tracking-tight">
                Lộ Trình Học Chuẩn Quốc Tế (A1 → C1)
              </h2>
              <span className="bg-sky-100 text-sky-900 border border-sky-600 font-black text-[10px] px-2 py-0.5 rounded-full">
                tab=lo-trinh
              </span>
            </div>
            <p className="text-xs sm:text-sm text-ink/75 font-medium mt-1 leading-relaxed">
              Theo dõi sự tiến bộ từng bước từ khi mất gốc cho tới khi thành thạo như người bản xứ.
            </p>
          </div>
        </div>

        <button
          onClick={() => onSwitchToKnowledgeTab()}
          className="px-4 py-2 bg-[#FEF08A] hover:bg-amber-300 text-ink text-xs font-black uppercase rounded-xl border-2 border-[#141414] shadow-[2.5px_2.5px_0px_#141414] flex items-center gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0"
        >
          <BookOpen className="w-4 h-4" />
          <span>Xem Tất Cả Bài Học (tab=kien-thuc)</span>
        </button>
      </div>

      {/* Winding Milestone Roadmap Path */}
      <div className="flex flex-col gap-6 relative">
        {levels.map((lvl, index) => {
          const completedInLevel = lvl.topics.filter((t) => isDone(t.id)).length;
          const totalInLevel = lvl.topics.length;
          const pct = Math.round((completedInLevel / (totalInLevel || 1)) * 100);
          const isAllDone = totalInLevel > 0 && completedInLevel === totalInLevel;

          return (
            <div
              key={lvl.id}
              className="bg-white rounded-[24px] border-[2.5px] border-[#141414] p-5 sm:p-6 shadow-[4px_4px_0px_#141414] flex flex-col gap-4 relative overflow-hidden"
              style={{ backgroundColor: lvl.bgLight }}
            >
              {/* Milestone Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-dashed border-[#141414]/20 pb-3">
                <div className="flex items-center gap-3">
                  {/* Milestone Circle Ring (AIO English tr-ring style) */}
                  <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-200 stroke-current"
                        strokeWidth="3.5"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="stroke-current transition-all duration-500"
                        style={{ color: lvl.color }}
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
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-ink uppercase">
                        {lvl.name}
                      </h3>
                      {isAllDone && (
                        <span className="bg-emerald-200 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-700">
                          ✓ ĐÃ HOÀN THÀNH
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink/70 font-medium">{lvl.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-xs font-black text-ink">
                    {completedInLevel}/{totalInLevel} chủ điểm
                  </span>
                  <button
                    onClick={() => onSwitchToKnowledgeTab(lvl.id)}
                    className="px-2.5 py-1 bg-white hover:bg-black/5 text-ink text-xs font-bold rounded-lg border border-[#141414] flex items-center gap-1"
                  >
                    <span>Lọc cấp {lvl.id}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Topics Grid for this Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {lvl.topics.map((topic) => {
                  const done = isDone(topic.id);
                  return (
                    <div
                      key={topic.id}
                      className={cn(
                        'bg-white p-3 rounded-xl border border-[#141414] shadow-xs flex items-center justify-between gap-2 group transition-all',
                        done ? 'bg-[#F0FDF4] border-emerald-600' : 'hover:border-[#141414] hover:shadow-[2px_2px_0px_#141414]'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="text-[10px] font-black px-1.5 py-0.5 rounded text-white shrink-0"
                          style={{ backgroundColor: lvl.color }}
                        >
                          {topic.code}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-ink truncate group-hover:text-amber-800">
                            {topic.title}
                          </p>
                          <p className="text-[10px] text-ink/50 truncate">
                            {topic.category}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onOpenTopicMindmap(topic)}
                          title="Xem Mindmap Tỏa Tròn của chủ điểm này"
                          className="p-1.5 bg-amber-200 hover:bg-amber-300 rounded-lg text-ink transition-transform hover:scale-110"
                        >
                          <Brain className="w-3.5 h-3.5" />
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
    </div>
  );
}
