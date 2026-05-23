import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { LogEntry, WishlistItem, Habit, Asset, Word, FoodPlace, ContentIdea, Task, Achievement, StudyGoal } from "../types";
import { 
  BookOpen, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Feather, 
  CheckSquare, 
  Award, 
  Sparkles, 
  Smile, 
  Send, 
  RefreshCw, 
  Plus, 
  Quote, 
  X, 
  Compass, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Trash2,
  Heart
} from "lucide-react";

interface DigitalJournalProps {
  logs: LogEntry[];
  wishlist: WishlistItem[];
  assets: Asset[];
  words: Word[];
  places: FoodPlace[];
  ideas: ContentIdea[];
  tasks?: Task[];
  achievements?: Achievement[];
  goals?: StudyGoal[];
  setLogs?: React.Dispatch<React.SetStateAction<LogEntry[]>>;
}

interface DailySummary {
  date: string;
  displayDate: string;
  logs: LogEntry[];
  purchased: WishlistItem[];
  habitCompletions: { habit: Habit, streak: number }[];
  wordsReviewed: Word[];
  placesVisited: FoodPlace[];
  contentDone: ContentIdea[];
  tasksDone: Task[];
  achievementsEarned: Achievement[];
}

export function DigitalJournal({ 
  logs, 
  wishlist, 
  assets, 
  words, 
  places, 
  ideas, 
  tasks = [], 
  achievements = [], 
  goals = [], 
  setLogs 
}: DigitalJournalProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [paperStyle, setPaperStyle] = useState<'lined' | 'grid' | 'dotted' | 'blank'>('lined');
  
  const [pageStickers, setPageStickers] = useState<{ [date: string]: string[] }>(() => {
    try {
      const saved = localStorage.getItem("journal_stickers");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Daily Mood tracking per date
  const [dailyMoods, setDailyMoods] = useState<{ [date: string]: { emoji: string; name: string } }>(() => {
    try {
      const saved = localStorage.getItem("journal_moods");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const changeMood = (date: string, emoji: string, name: string) => {
    const updated = { ...dailyMoods, [date]: { emoji, name } };
    setDailyMoods(updated);
    localStorage.setItem("journal_moods", JSON.stringify(updated));
  };

  // AI daily insights per date
  const [aiInsights, setAiInsights] = useState<{
    [date: string]: {
      title: string;
      moodAnalysis: string;
      summary: string;
      quote: string;
      suggestions: string[];
    };
  }>(() => {
    try {
      const saved = localStorage.getItem("journal_ai_insights");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [loadingInsight, setLoadingInsight] = useState(false);

  // Quick entry state
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [newEntryContent, setNewEntryContent] = useState("");
  const [newEntryType, setNewEntryType] = useState<'Reflection' | 'Event'>('Reflection');
  const [newEntryEmoji, setNewEntryEmoji] = useState("📝");

  const handleAddQuickEntry = (dateStr: string) => {
    if (!newEntryContent.trim() || !setLogs) return;

    const newLog: LogEntry = {
      id: "log_" + Date.now(),
      date: dateStr,
      content: newEntryContent.trim(),
      type: newEntryType,
      emoji: newEntryEmoji,
      time: newEntryType === 'Event' ? new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : undefined
    };

    setLogs(prev => [...prev, newLog]);
    setNewEntryContent("");
    setShowQuickEntry(false);
  };

  const handleDeleteQuickEntry = (logId: string) => {
    if (!setLogs) return;
    if (confirm("Bạn có chắc muốn xóa dòng nhật ký này không?")) {
      setLogs(prev => prev.filter(item => item.id !== logId));
    }
  };

  const fetchAIInsight = async (summary: DailySummary) => {
    if (loadingInsight) return;
    setLoadingInsight(true);

    try {
      const payload = {
        date: summary.date,
        logs: summary.logs.map(l => `[${l.type}] ${l.content}`),
        habits: summary.habitCompletions.map(h => h.habit.name),
        tasks: summary.tasksDone.map(t => t.content),
        places: summary.placesVisited.map(p => p.name + (p.review ? ` (Review: ${p.review})` : '')),
        words: summary.wordsReviewed.map(w => w.vocabulary),
        ideas: summary.contentDone.map(i => i.title),
        achievements: summary.achievementsEarned.map(a => a.title),
        userMood: dailyMoods[summary.date]?.name || ""
      };

      const response = await fetch("/api/journal/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("API Connection failed.");

      const result = await response.json();
      
      const newInsights = { ...aiInsights, [summary.date]: result };
      setAiInsights(newInsights);
      localStorage.setItem("journal_ai_insights", JSON.stringify(newInsights));
    } catch (err) {
      console.error(err);
      const fallbackResult = {
        title: "Ký ức nhỏ trong ngày",
        moodAnalysis: "Vun đắp hiện tại",
        summary: "Ngày hôm nay trôi qua cùng những hoạt động và suy ngẫm chân thực của bạn. Mỗi một trải nghiệm dù là nhỏ nhất cũng góp phần giúp bạn tự tin vững bước hơn.",
        quote: "Mỗi ngày là một món quà, và những gì bạn gieo trồng hôm nay sẽ sớm đơm hoa kết quả.",
        suggestions: ["Hãy uống một tách trà ấm và nghỉ ngơi thật sâu.", "Tiếp tục đặt những mục tiêu nhỏ, bền bỉ cho ngày mai."]
      };
      const newInsights = { ...aiInsights, [summary.date]: fallbackResult };
      setAiInsights(newInsights);
      localStorage.setItem("journal_ai_insights", JSON.stringify(newInsights));
    } finally {
      setLoadingInsight(false);
    }
  };

  const addSticker = (sticker: string, date: string) => {
    const current = pageStickers[date] || [];
    let updated: string[];
    if (current.includes(sticker)) {
      updated = current.filter(s => s !== sticker);
    } else {
      if (current.length >= 8) return; // limit to 8 stickers
      updated = [...current, sticker];
    }
    const newStickers = { ...pageStickers, [date]: updated };
    setPageStickers(newStickers);
    localStorage.setItem("journal_stickers", JSON.stringify(newStickers));
  };

  const habits: Habit[] = useMemo(() => {
    try {
      const saved = localStorage.getItem("studyHub_habits");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  const pages = useMemo(() => {
    const dateMap = new Map<string, DailySummary>();

    const getDay = (isoStr?: string) => {
      if (!isoStr) return "";
      try {
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return "";
        return d.toISOString().split("T")[0];
      } catch {
        return "";
      }
    };

    const getDayFromTs = (ts?: number) => {
      if (!ts) return "";
      return new Date(ts).toISOString().split("T")[0];
    };

    const ensureDate = (dateInfo : string) => {
      if (!dateMap.has(dateInfo)) {
        dateMap.set(dateInfo, {
          date: dateInfo,
          displayDate: new Date(dateInfo).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          logs: [], purchased: [], habitCompletions: [], wordsReviewed: [], placesVisited: [], contentDone: [],
          tasksDone: [], achievementsEarned: []
        });
      }
      return dateMap.get(dateInfo)!;
    };

    // 1. Logs (Reflection / Event)
    logs.forEach(log => {
      const d = getDay(log.date);
      if (d) ensureDate(d).logs.push(log);
    });

    // 2. Wishlist Purchases
    wishlist.forEach(w => {
      if (w.isPurchased) {
        const histString = (w.history && w.history.length > 0) ? w.history[w.history.length - 1]?.date : null;
        const d = getDay(histString || w.addedDate);
        if (d) ensureDate(d).purchased.push(w);
      }
    });

    // 3. Habits
    habits.forEach(h => {
      if (h.history) {
        Object.keys(h.history).forEach(dateStr => {
          const hasTrue = Object.values(h.history[dateStr]).some(v => v === true);
          if (hasTrue) {
            const d = getDay(dateStr);
            if (d) ensureDate(d).habitCompletions.push({ habit: h, streak: h.streak });
          }
        });
      }
    });

    // 4. Content done
    ideas.forEach(i => {
      if (i.status === "Done") {
        const d = getDayFromTs(i.createdAt);
        if (d) ensureDate(d).contentDone.push(i);
      }
    });

    // 5. Words Reviewed
    words.forEach(w => {
      if (w.lastReviewed) {
        const d = getDay(w.lastReviewed);
        if (d) ensureDate(d).wordsReviewed.push(w);
      }
    });

    // 6. Places Visited
    places.forEach(p => {
      if (p.status === 'Visited') {
         if (p.dateVisited) {
            const d = getDay(p.dateVisited);
            if (d) ensureDate(d).placesVisited.push(p);
         } else {
            const ts = parseInt(p.id, 10);
            if (!isNaN(ts)) {
               const d = getDayFromTs(ts);
               if (d) ensureDate(d).placesVisited.push(p);
            } else {
               const d = getDayFromTs(Date.now());
               ensureDate(d).placesVisited.push(p);
            }
         }
      }
    });

    // 7. Tasks
    tasks.forEach(t => {
      if (t.completed) {
        const d = getDayFromTs(t.completedAt || t.createdAt);
        if (d) ensureDate(d).tasksDone.push(t);
      }
    });

    // 8. Achievements
    achievements.forEach(a => {
      if (a.dateEarned) {
        const d = getDayFromTs(a.dateEarned);
        if (d) ensureDate(d).achievementsEarned.push(a);
      }
    });

    // Sort dates descending
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => b.localeCompare(a));
    return sortedDates.map(d => dateMap.get(d)!);
  }, [logs, wishlist, habits, words, places, ideas, tasks, achievements]);

  if (pages.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 font-sans">
        <div className="sketch-border bg-[#e8f0fe] p-12 text-center select-none shadow-md border-b-4 border-r-4 border-ink relative overflow-hidden">
          <div className="absolute left-4 top-2 opacity-15 -rotate-12">
            <BookOpen className="w-24 h-24 text-ink" />
          </div>
          <BookOpen className="w-16 h-16 text-ink/60 mx-auto mb-4 relative z-10" />
          <div className="flex justify-center relative z-10">
            <h2 className="text-2xl font-black font-logo uppercase tracking-widest text-ink bg-[#fbcfe8] px-4 py-2 rotate-1 border-2 border-ink rounded-md shadow-sm">
              Digital Journal trống
            </h2>
          </div>
          <p className="mt-6 font-hand text-ink text-xl relative z-10 font-medium">
            Hãy bắt đầu viết nhật ký bằng cách cập nhật ghi chú hoạt động trong ngày của bạn trong các mục học tiếng Anh, thói quen, chi tiêu,...
          </p>
        </div>
      </div>
    );
  }

  const currentPage = pages[currentPageIndex];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans">
      
      {/* HEADER BAR */}
      <div className="sketch-border bg-[#e8f0fe] p-4 md:p-6 text-center select-none shadow-md border-b-4 border-r-4 border-ink relative overflow-hidden mb-8 max-w-5xl mx-auto">
        <div className="absolute right-4 top-2 opacity-10 rotate-12">
          <BookOpen className="w-20 h-20 text-ink" />
        </div>
        <div className="flex justify-center">
          <div className="bg-[#fbcfe8] -rotate-1 px-5 py-2 border-2 border-ink shadow-sm rounded-md tracking-wider relative">
            <h1 className="text-2xl md:text-3xl font-logo font-black uppercase text-ink flex items-center justify-center gap-3">
              <BookOpen className="w-6 h-6 md:w-7 md:h-7" /> DIGITAL JOURNAL
            </h1>
          </div>
        </div>
        <p className="mt-3 text-xs md:text-sm font-semibold italic text-ink/70 relative z-10">
          Kết nối thói quen, học tập, sắm sửa và tâm tư mỗi ngày của bạn thành trang kí ức tự động
        </p>
      </div>

      {/* STREAMLINED TWO-COLUMN SPLIT PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto items-start">
        
        {/* LEFT PANEL: TIMELINE & DAY PICKER */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl sketch-border border-ink shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-2 border-ink/10">
              <span className="text-xs uppercase font-black tracking-widest text-[#1a1a1a] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-crimson" /> Lịch sử ngày ghi nhật ký ({pages.length})
              </span>
            </div>

            <div className="max-h-[380px] overflow-y-auto pr-1 space-y-2 scrollbar-thin">
              {pages.map((p, idx) => {
                const isSelected = currentPageIndex === idx;
                const moodData = dailyMoods[p.date];
                const countOfTotalRecords = p.logs.length + p.habitCompletions.length + p.wordsReviewed.length + p.placesVisited.length + p.purchased.length;
                
                return (
                  <button
                    key={p.date}
                    onClick={() => setCurrentPageIndex(idx)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-between gap-2 group ${
                      isSelected 
                        ? "bg-[#fffbeb] border-ink text-ink shadow-[3px_3px_0_var(--color-ink)] translate-x-1" 
                        : "bg-white/40 border-ink/10 hover:border-ink/40 hover:bg-white text-ink/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl flex-shrink-0 filter drop-shadow">
                        {moodData?.emoji || "📝"}
                      </span>
                      <div className="min-w-0">
                        <span className="font-mono text-xs font-black block group-hover:text-crimson transition-colors">
                          {p.date}
                        </span>
                        <span className="text-[10px] text-ink/50 font-bold truncate block">
                          {moodData?.name || "Bình thường"} • {countOfTotalRecords} hoạt động
                        </span>
                      </div>
                    </div>
                    {p.logs.length > 0 && (
                      <span className="bg-[#fbcfe8] text-ink border border-ink text-[9px] px-1.5 py-0.5 rounded-full font-black flex-shrink-0">
                        {p.logs.length} Log
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="border-t border-ink/10 pt-3 flex flex-wrap gap-2 justify-between items-center bg-paper/30 p-2.5 rounded-xl border border-dashed border-ink/10 text-[10px] font-sans">
              <span className="font-bold text-ink/55 text-[9px] uppercase tracking-wider">Chất liệu trang:</span>
              <div className="flex gap-1.5">
                {(['lined', 'grid', 'dotted', 'blank'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setPaperStyle(style)}
                    className={`px-2 py-0.5 text-[8px] font-black uppercase rounded border transition-all ${
                      paperStyle === style ? "bg-ink text-paper border-ink" : "bg-white/50 border-ink/10 text-ink/65 hover:bg-ink/5"
                    }`}
                  >
                    {style === 'lined' ? "Lined" : style === 'grid' ? "Grid" : style === 'dotted' ? "Dot" : "Blank"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* QUICK CHỌN STICKERS */}
          <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl sketch-border-sm border-dashed text-center space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-ink/65 block">
              ✨ Dán nhãn Sticker lên trang viết ({currentPage.date})
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {['🌸', '🎯', '🔥', '☕', '⭐', '🎉', '🚀', '🧸', '💡', '📖', '❤️'].map((st) => {
                const active = (pageStickers[currentPage.date] || []).includes(st);
                return (
                  <button
                    key={st}
                    onClick={() => addSticker(st, currentPage.date)}
                    className={`w-8 h-8 flex items-center justify-center text-lg rounded-xl transition-all hover:scale-110 active:scale-95 border ${
                      active 
                        ? "bg-[#fffbeb] border-ink rotate-3 scale-105 shadow-[2px_2px_0_var(--color-ink)]" 
                        : "bg-white/40 border-dashed border-ink/10 hover:border-ink hover:opacity-100 opacity-60"
                    }`}
                    title={active ? "Gỡ nhãn" : "Dán nhãn"}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: DETAILS OF THE JOURNAL PAGE */}
        <div className="lg:col-span-8 space-y-5">
          
          <div className="bg-white/80 backdrop-blur shadow-sm p-5 md:p-8 rounded-2xl sketch-border border-ink relative overflow-hidden">
            
            {/* Visual Paper Styling Sheet Wrapper */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.22] z-0"
              style={
                paperStyle === 'lined' ? {
                  backgroundImage: "linear-gradient(transparent 95%, rgba(0,0,0,0.18) 100%)",
                  backgroundSize: "100% 28px"
                } : paperStyle === 'grid' ? {
                  backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px)",
                  backgroundSize: "24px 24px"
                } : paperStyle === 'dotted' ? {
                  backgroundImage: "radial-gradient(rgba(0,0,0,0.25) 1.5px, transparent 1.5px)",
                  backgroundSize: "20px 20px"
                } : {
                  backgroundImage: "none"
                }
              }
            />

            {/* Sticker overlay visual layout */}
            <div className="absolute top-4 right-4 flex gap-1 z-10 pointer-events-none select-none">
              {(pageStickers[currentPage.date] || []).map((st, idx) => (
                <span 
                  key={idx} 
                  className="w-8 h-8 flex items-center justify-center text-xl bg-[#fffbeb] border border-ink shadow-sm rounded-full rotate-6 animate-pulse"
                >
                  {st}
                </span>
              ))}
            </div>

            {/* MAIN CONTENT SECTION */}
            <div className="relative z-10 space-y-6">
              
              {/* Daily Title details */}
              <div className="border-b-2 border-ink pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-ink uppercase tracking-tight">
                    {currentPage.displayDate}
                  </h2>
                  <span className="text-[10px] font-mono font-bold text-ink/40">
                    ID Ngày: {currentPage.date}
                  </span>
                </div>

                {/* Simplified Single Header Mood Picker Row */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase text-ink/60 select-none mr-1">Cảm nhận:</span>
                  {[
                    { emoji: "😌", name: "Bình yên" },
                    { emoji: "😊", name: "Vui vẻ" },
                    { emoji: "🌟", name: "Hào hứng" },
                    { emoji: "🥱", name: "Mệt mỏi" },
                    { emoji: "😔", name: "Tâm trạng" },
                    { emoji: "☕", name: "Tập trung" }
                  ].map(m => {
                    const isSelected = dailyMoods[currentPage.date]?.emoji === m.emoji;
                    return (
                      <button
                        key={m.emoji}
                        onClick={() => changeMood(currentPage.date, m.emoji, m.name)}
                        className={`text-xs px-2.5 py-1 rounded-full border-2 font-bold transition-all flex items-center gap-1 active:scale-95 duration-100 ${
                          isSelected
                            ? "bg-[#fffbeb] border-ink text-ink shadow-[2.5px_2.5px_0_var(--color-ink)]"
                            : "bg-white/50 border-ink/10 opacity-70 hover:opacity-100 text-ink/80"
                        }`}
                      >
                        <span>{m.emoji}</span>
                        <span className="text-[10px]">{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* JOURNAL LOGS AND REFLECTIONS LIST (THE ACTUAL DIARY CORES) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-black text-ink/75 flex items-center gap-1.5 bg-[#fbcfe8] border-2 border-ink px-2.5 py-1 rounded-lg">
                    <Feather className="w-3.5 h-3.5" /> Ghi chép & Tâm sự ({currentPage.logs.length})
                  </span>
                  
                  {setLogs && (
                    <button
                      onClick={() => setShowQuickEntry(!showQuickEntry)}
                      className="sketch-btn-sm text-[10px] py-1 px-3 bg-ink text-paper hover:bg-ink/80 uppercase font-bold tracking-wider flex items-center gap-1.5"
                    >
                      {showQuickEntry ? <X size={11} /> : <Plus size={11} />} {showQuickEntry ? "Đóng form" : "Thêm dòng tâm sự"}
                    </button>
                  )}
                </div>

                {/* Quick write expanded form if active */}
                {showQuickEntry && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#fffbeb] p-4 rounded-xl border-2 border-ink shadow-[4px_4px_0_rgba(0,0,0,1)] space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/15 pb-2">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setNewEntryType('Reflection')}
                          className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${newEntryType === 'Reflection' ? "bg-ink text-white" : "bg-ink/10 text-ink"}`}
                        >
                          Suy ngẫm
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewEntryType('Event')}
                          className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${newEntryType === 'Event' ? "bg-ink text-white" : "bg-ink/10 text-ink"}`}
                        >
                          Sự kiện nhật trình
                        </button>
                      </div>

                      {/* Icon selector with simple tooltips */}
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] uppercase font-bold text-ink/50 mr-1">Icon:</span>
                        <div className="flex gap-1">
                          {['📝', '💡', '🌟', '☕', '🔥', '🎉', '💻', '💪', '❤️', '🎓'].map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => setNewEntryEmoji(em)}
                              className={`text-xs p-1 rounded-md transition-transform ${newEntryEmoji === em ? "bg-[#fbcfe8] border border-ink scale-110" : "opacity-50 hover:opacity-100"}`}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <textarea
                      value={newEntryContent}
                      onChange={(e) => setNewEntryContent(e.target.value)}
                      placeholder="Hôm nay có điều gì ý nghĩa hay bài học gì đáng nhớ mà bạn muốn lưu giữ?..."
                      className="w-full min-h-[90px] p-2.5 bg-white rounded border border-ink/30 text-sm focus:outline-none focus:border-ink resize-none font-hand text-lg placeholder:font-sans placeholder:text-xs text-ink placeholder:text-ink/40"
                    />

                    <div className="flex justify-end gap-2.5">
                      <button
                        onClick={() => setShowQuickEntry(false)}
                        className="px-2.5 py-1 bg-white text-ink border border-ink/20 text-xs font-bold rounded hover:bg-ink/5"
                      >
                        Bỏ qua
                      </button>
                      <button
                        onClick={() => handleAddQuickEntry(currentPage.date)}
                        disabled={!newEntryContent.trim()}
                        className="px-3.5 py-1 bg-ink text-paper text-xs font-black rounded hover:bg-ink/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <Send size={11} /> Lưu bút tích
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Logs Listing container */}
                {currentPage.logs.length === 0 ? (
                  <div className="text-center py-7 px-4 border border-dashed border-ink/15 rounded-xl bg-ink/5 italic font-hand text-ink/50 text-base">
                    Trang kí ức ngày hôm nay chưa có dòng ghi chú tâm tư nào. Hãy bấm "Thêm dòng tâm sự" để lưu giữ suy nghĩ của bạn!
                  </div>
                ) : (
                  <div className="space-y-4 pl-3.5 border-l-2 border-dashed border-ink/20 py-1">
                    {currentPage.logs.map((log, idx) => (
                      <div key={log.id || idx} className="relative group/log">
                        <span className="absolute -left-[27px] bg-paper text-sm p-0.5 rounded-full ring-4 ring-white border border-ink/10 flex items-center justify-center w-6 h-6 shadow-[1.5px_1.5px_0_rgba(0,0,0,0.1)]">
                          {log.emoji || log.icon || "📝"}
                        </span>
                        
                        <div className="flex items-start justify-between gap-4 ml-3">
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <p className="font-hand text-lg md:text-xl leading-relaxed text-ink/95 whitespace-pre-wrap">
                              {log.type === "Event" && (
                                <span className="font-sans font-black uppercase text-[9px] tracking-wider mr-2 bg-ink/10 px-1.5 py-0.5 rounded inline-block translate-y-[-2px] text-ink/75">
                                  {log.time || "Sự kiện"}
                                </span>
                              )}
                              {log.content}
                            </p>
                          </div>
                          
                          {setLogs && (
                            <button
                              onClick={() => handleDeleteQuickEntry(log.id)}
                              className="opacity-0 group-hover/log:opacity-100 hover:text-crimson text-ink/40 p-1 rounded hover:bg-ink/5 transition-all outline-none shrink-0"
                              title="Xóa dòng này"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BENTO-STYLE INTEGRATED TRACKERS (HABITS, REVIEW, WORK) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-dashed border-ink/15 pt-5">
                
                {/* 1. Completed Habits Capsule */}
                <div className="bg-[#e8f0fe]/45 p-4 rounded-2xl border border-ink/10 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-indigo-900 border-b border-indigo-900/10 pb-1.5">
                    <CheckSquare size={14} className="text-indigo-600" />
                    Thói quen hoàn thành ({currentPage.habitCompletions.length})
                  </div>
                  {currentPage.habitCompletions.length === 0 ? (
                    <span className="text-[11px] text-ink/50 italic block pt-1">Không có thói quen nào của ngày này</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {currentPage.habitCompletions.map(({ habit, streak }, idx) => (
                        <span 
                          key={idx} 
                          className="inline-flex items-center gap-1 bg-white border border-indigo-200 px-2 py-0.5 rounded-lg text-xs font-bold text-indigo-950 shadow-sm"
                        >
                          <span className="drop-shadow-sm">{habit.icon}</span>
                          <span>{habit.name}</span>
                          {streak > 1 && (
                            <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded">
                              {streak}d Flame
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Vocabulary Reviewed Capsule */}
                <div className="bg-[#fbcfe8]/25 p-4 rounded-2xl border border-ink/10 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-crimson border-b border-crimson/10 pb-1.5">
                    <BookOpen size={14} className="text-crimson" />
                    Từ vựng đã ôn ({currentPage.wordsReviewed.length})
                  </div>
                  {currentPage.wordsReviewed.length === 0 ? (
                    <span className="text-[11px] text-ink/50 italic block pt-1">Chưa có hoạt động từ vựng</span>
                  ) : (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {currentPage.wordsReviewed.map((w, idx) => (
                        <span 
                          key={idx} 
                          className="bg-white border border-rose-200 text-rose-900 text-[11px] font-bold px-2 py-0.5 rounded-md hover:scale-105 transition-transform cursor-pointer"
                        >
                          {w.vocabulary}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Asset & Finances Purchases */}
                <div className="bg-amber-50/40 p-4 rounded-2xl border border-ink/10 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-800 border-b border-amber-800/10 pb-1.5">
                    <DollarSign size={14} className="text-amber-600" />
                    Chi tiêu & Sắm sửa ({currentPage.purchased.length})
                  </div>
                  {currentPage.purchased.length === 0 ? (
                    <span className="text-[11px] text-ink/50 italic block pt-1">Không phát sinh chi tiêu mua sắm</span>
                  ) : (
                    <div className="space-y-1.5 pt-1">
                      {currentPage.purchased.map((item, idx) => (
                        <div key={idx} className="bg-white/80 p-2 rounded-xl border border-dashed border-amber-200 text-xs flex justify-between items-center">
                          <span className="font-bold text-ink/80 truncate max-w-[130px]">{item.content}</span>
                          {item.price ? (
                            <span className="font-mono font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                              {item.price.toLocaleString('vi-VN')} đ
                            </span>
                          ) : (
                            <span className="text-ink/40 text-[10px]">Đã mua</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Geography Visited Places */}
                <div className="bg-rose-50/30 p-4 rounded-2xl border border-ink/10 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-rose-800 border-b border-rose-800/10 pb-1.5">
                    <MapPin size={14} className="text-rose-600" />
                    Khám phá địa điểm ({currentPage.placesVisited.length})
                  </div>
                  {currentPage.placesVisited.length === 0 ? (
                    <span className="text-[11px] text-ink/50 italic block pt-1">Chưa lưu địa danh nào</span>
                  ) : (
                    <div className="space-y-1.5 pt-1">
                      {currentPage.placesVisited.map((p, idx) => (
                        <div key={idx} className="bg-white/80 p-2 rounded-xl border border-rose-100 text-xs">
                          <div className="font-bold text-rose-950 flex items-center gap-1">
                            <span>📍</span>
                            <span className="truncate">{p.name}</span>
                          </div>
                          {p.review && <p className="font-hand italic text-xs text-ink/75 mt-0.5 leading-snug">"{p.review}"</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* STOIC PROUD & TASK DONE ACHIEVEMENTS */}
              {(currentPage.tasksDone.length > 0 || currentPage.contentDone.length > 0 || currentPage.achievementsEarned.length > 0) && (
                <div className="border-t border-dashed border-ink/15 pt-4 space-y-3 bg-[#e8f0fe]/20 p-4 rounded-2xl border border-indigo-100">
                  <span className="text-[10px] uppercase font-black tracking-widest text-indigo-950 block">🎉 Thành tựu & Nhiệm vụ hôm nay</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {currentPage.tasksDone.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-indigo-505 block">Nhiệm vụ hoàn tất:</span>
                        <ul className="space-y-1 max-h-[140px] overflow-y-auto">
                          {currentPage.tasksDone.map((t, idx) => (
                            <li key={idx} className="flex items-center gap-1.5 text-xs text-ink/70">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="line-through decoration-ink/20 truncate">{t.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {currentPage.achievementsEarned.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase font-bold text-amber-600 block">Danh hiệu mở khóa:</span>
                        {currentPage.achievementsEarned.map((ach, idx) => (
                          <div key={idx} className="bg-amber-100/50 p-2 rounded-xl border border-amber-200 text-xs flex items-start gap-1.5">
                            <span className="text-sm">🏆</span>
                            <div>
                              <div className="font-bold text-amber-900 leading-tight">{ach.title}</div>
                              <p className="text-[10px] text-amber-800 leading-normal">{ach.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* COZY AI TRI KI (COMPANION LETTER CARD) */}
              <div className="bg-[#fffdf9] rounded-2xl border-2 border-ink p-5 shadow-[4px_4px_0_var(--color-ink)] relative overflow-hidden group hover:bg-[#fffff4] transition-all duration-300">
                <div className="absolute right-0 top-0 bg-amber-400 text-ink border-l-2 border-b-2 border-ink px-3 py-1 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> AI Companion
                </div>

                <div className="flex items-center gap-2 mb-3 border-b border-ink/10 pb-2">
                  <Sparkles className="w-4 h-4 text-ink animate-pulse" />
                  <h3 className="font-logo font-black text-sm text-ink uppercase tracking-wider">
                    Góc Tri Kỷ Chiêm Nghiệm
                  </h3>
                </div>

                {aiInsights[currentPage.date] ? (
                  <div className="space-y-3.5 text-ink">
                    <div className="bg-[#fffbeb] p-3 rounded-xl border border-dashed border-amber-300">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#b45309] block">🎭 Chủ đề ngày:</span>
                      <p className="font-hand text-xl font-bold italic text-ink/90 leading-snug">
                        "{aiInsights[currentPage.date].title}"
                      </p>
                      <span className="text-[9px] bg-white border border-amber-200 text-amber-800 px-2 py-0.5 rounded-full mt-1.5 inline-block font-sans font-bold">
                        🌌 Cảm xúc: {aiInsights[currentPage.date].moodAnalysis}
                      </span>
                    </div>

                    <div className="relative pl-6 py-0.5">
                      <Quote className="w-4 h-4 text-ink/15 absolute left-0 top-0 rotate-180" />
                      <p className="font-hand text-lg leading-relaxed text-ink/80 italic whitespace-pre-line">
                        {aiInsights[currentPage.date].summary}
                      </p>
                    </div>

                    {aiInsights[currentPage.date].quote && (
                      <div className="bg-ink/5 p-2.5 rounded-xl border border-ink/10 italic text-[11px] text-ink/75 leading-relaxed">
                        💡 "{aiInsights[currentPage.date].quote}"
                      </div>
                    )}

                    {aiInsights[currentPage.date].suggestions && aiInsights[currentPage.date].suggestions.length > 0 && (
                      <div className="border-t border-dashed border-ink/10 pt-3">
                        <span className="text-[10px] font-black uppercase text-ink block mb-1.5">🌱 Ngày mai chắp bút rèn luyện:</span>
                        <ul className="space-y-1">
                          {aiInsights[currentPage.date].suggestions.map((s, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 text-xs text-ink/80 leading-relaxed font-medium">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex justify-end pt-2 border-t border-dashed border-ink/10 mt-2">
                      <button
                        onClick={() => fetchAIInsight(currentPage)}
                        disabled={loadingInsight}
                        className="text-[9px] font-black uppercase text-ink/65 hover:text-ink transition-colors flex items-center gap-1"
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${loadingInsight ? "animate-spin" : ""}`} /> Viết lại chiêm nghiệm
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5 px-3 bg-white/50 rounded-xl border border-dashed border-ink/15">
                    <span className="text-2xl block mb-1">✨</span>
                    <h4 className="font-black text-xs text-ink uppercase tracking-wide">Trò chuyện tri kỷ chiêm nghiệm</h4>
                    <p className="text-[10px] text-ink/60 max-w-sm mx-auto mb-3.5 leading-relaxed">
                      AI sẽ lắng nghe thói quen, từ vựng và tâm tư của ngày này để đồng hành trải lòng bình lặng.
                    </p>
                    <button
                      onClick={() => fetchAIInsight(currentPage)}
                      disabled={loadingInsight}
                      className="sketch-button py-1 px-4 text-[10px] uppercase font-black bg-[#fbcfe8] hover:bg-white text-ink transition-all inline-flex items-center gap-1.5 shadow-sm"
                    >
                      {loadingInsight ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" /> Tri kỉ đang chắp bút...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" /> Chiêm nghiệm ngay
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Pagination helper badge */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-ink/10 relative z-10 text-[10px] font-mono select-none font-bold text-ink/40">
              <button
                onClick={() => currentPageIndex > 0 && setCurrentPageIndex(p => p - 1)}
                disabled={currentPageIndex === 0}
                className="hover:text-ink transition-colors disabled:opacity-30 disabled:pointer-events-none uppercase flex items-center gap-1"
              >
                <ChevronLeft size={12} /> Trang trước
              </button>
              
              <span>TRANG 0{currentPageIndex + 1} / 0{pages.length}</span>

              <button
                onClick={() => currentPageIndex < pages.length - 1 && setCurrentPageIndex(p => p + 1)}
                disabled={currentPageIndex === pages.length - 1}
                className="hover:text-ink transition-colors disabled:opacity-30 disabled:pointer-events-none uppercase flex items-center gap-1"
              >
                Trang sau <ChevronRight size={12} />
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
