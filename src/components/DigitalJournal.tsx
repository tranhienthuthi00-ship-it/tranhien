import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { LogEntry, WishlistItem, Habit, Asset, Word, FoodPlace, ContentIdea, Task, Achievement, StudyGoal } from "../types";
import { BookOpen, Calendar as CalendarIcon, DollarSign, MapPin, Feather, CheckSquare, Award, Sparkles, Smile, Send, RefreshCw, Plus, Quote } from "lucide-react";

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

export function DigitalJournal({ logs, wishlist, assets, words, places, ideas, tasks = [], achievements = [], goals = [], setLogs }: DigitalJournalProps) {
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
    // Collect all unique dates with some activity
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

    // 2. Wishlist Purchases (those toggled to isPurchased - fallback to addedDate)
    wishlist.forEach(w => {
      if (w.isPurchased) {
        const histString = (w.history && w.history.length > 0) ? w.history[w.history.length - 1]?.date : null;
        const d = getDay(histString || w.addedDate);
        if (d) ensureDate(d).purchased.push(w);
      }
    });

    // 3. Habits
    habits.forEach(h => {
      Object.keys(h.history).forEach(dateStr => {
        const hasTrue = Object.values(h.history[dateStr]).some(v => v === true);
        if (hasTrue) {
          const d = getDay(dateStr);
          if (d) ensureDate(d).habitCompletions.push({ habit: h, streak: h.streak }); // Note: Using current streak, historical streak is complex, but ok for visual.
        }
      });
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
      // Assuming lastReviewed is an ISO string date or valid date
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
               // Fallback: use today
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

  const nextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(p => p + 1);
    }
  };

  const prevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(p => p - 1);
    }
  };

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
          <p className="mt-6 font-hand text-ink text-xl relative z-10 font-medium">Hãy ghi chép nhật ký, thêm thói quen, hoặc đánh dấu hoàn thành để bắt đầu cuốn sổ này.</p>
        </div>
      </div>
    );
  }

  const currentPage = pages[currentPageIndex];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 font-sans">
      <div className="sketch-border bg-[#e8f0fe] p-6 text-center select-none shadow-md border-b-4 border-r-4 border-ink relative overflow-hidden mb-10 mx-auto max-w-4xl">
        <div className="absolute right-4 top-2 opacity-15 rotate-12">
          <BookOpen className="w-24 h-24 text-ink" />
        </div>
        <div className="flex justify-center">
          <div className="bg-[#fbcfe8] -rotate-1 px-6 py-2 border-2 border-ink shadow-sm rounded-md tracking-wider relative">
            <h1 className="text-3xl md:text-4xl font-logo font-black uppercase text-ink flex items-center justify-center gap-3">
              <BookOpen className="w-6 h-6 md:w-8 md:h-8" /> DIGITAL JOURNAL
            </h1>
          </div>
        </div>
        <p className="mt-4 text-sm md:text-base font-semibold italic text-ink/70 relative z-10 transition-colors">
          Hành trình kí ức và học tập
        </p>
      </div>

      {/* Jump to Date Selector & Paper Design Panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-4xl mx-auto mb-6 bg-white/40 p-3 rounded-2xl sketch-border-sm border-dashed">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-black tracking-widest text-ink/70">📅 Chọn ngày:</span>
          <select 
            value={currentPage.date}
            onChange={(e) => {
              const idx = pages.findIndex(p => p.date === e.target.value);
              if (idx !== -1) setCurrentPageIndex(idx);
            }}
            className="sketch-input bg-white text-[11px] font-black py-1 px-2.5 cursor-pointer shrink-0"
          >
            {pages.map((p) => (
              <option key={p.date} value={p.date}>
                {p.date} ({p.logs.length} nhật ký, {p.placesVisited.length} địa điểm)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-black tracking-widest text-ink/70">🎨 Chất liệu giấy:</span>
          <div className="flex gap-1 bg-paper/60 p-0.5 rounded-lg border border-dashed border-ink/20">
            {(['lined', 'grid', 'dotted', 'blank'] as const).map((style) => (
              <button
                key={style}
                onClick={() => setPaperStyle(style)}
                className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded transition-all ${
                  paperStyle === style ? "bg-ink text-paper" : "text-ink/65 hover:text-ink hover:bg-ink/5"
                }`}
              >
                {style === 'lined' ? "Kẻ ngang" : style === 'grid' ? "Ca-rô" : style === 'dotted' ? "Chấm bi" : "Trắng"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative w-full max-w-4xl mx-auto min-h-[650px] sm:min-h-[700px] flex items-center justify-center perspective-[2000px]">
        {/* Navigation Buttons Outside Book */}
        <button
          onClick={prevPage}
          disabled={currentPageIndex === 0}
          className="absolute left-0 md:-left-12 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-[#e8f0fe] border-2 border-ink rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#fbcfe8] text-ink transition-all shadow-[4px_4px_0_var(--color-ink)]"
        >
          <span className="text-2xl font-black relative -left-0.5">←</span>
        </button>

        <button
          onClick={nextPage}
          disabled={currentPageIndex === pages.length - 1}
          className="absolute right-0 md:-right-12 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-[#e8f0fe] border-2 border-ink rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#fbcfe8] text-ink transition-all shadow-[4px_4px_0_var(--color-ink)]"
        >
           <span className="text-2xl font-black relative -right-0.5">→</span>
        </button>

        {/* The Book */}
        <div className="relative w-full h-full max-w-3xl transform-style-3d bg-[#e5dfd3] p-1.5 md:p-3 rounded-r-3xl rounded-l-md shadow-2xl">
          {/* Binding shadow left */}
          <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-ink/20 to-transparent z-10 pointer-events-none rounded-l-md" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage.date}
              initial={{ rotateY: 90, opacity: 0, originX: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ type: "spring", stiffness: 60, damping: 15 }}
              className="bg-paper w-full h-[600px] sm:h-[650px] rounded-r-2xl rounded-l flex flex-col p-6 sm:p-10 shadow-inner relative overflow-hidden"
              style={
                paperStyle === 'lined' ? {
                  backgroundImage: "linear-gradient(transparent 95%, rgba(0,0,0,0.05) 100%)",
                  backgroundSize: "100% 28px"
                } : paperStyle === 'grid' ? {
                  backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)",
                  backgroundSize: "24px 24px"
                } : paperStyle === 'dotted' ? {
                  backgroundImage: "radial-gradient(rgba(0,0,0,0.08) 1.5px, transparent 1.5px)",
                  backgroundSize: "20px 20px"
                } : {
                  backgroundImage: "none"
                }
              }
            >
               {/* Applied Stickers on the Notebook Page (Overlap top-left) */}
               <div className="absolute top-4 left-4 flex gap-1.5 z-20 select-none pointer-events-none">
                 {(pageStickers[currentPage.date] || []).map((st, idx) => {
                   const rotations = ["rotate-6", "-rotate-12", "rotate-12", "-rotate-6", "rotate-3", "-rotate-3", "rotate-12", "-rotate-[10deg]"];
                   const rot = rotations[idx % rotations.length];
                   return (
                     <span 
                       key={idx} 
                       className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-lg md:text-2xl bg-[#fffbeb] rounded-full border border-ink shadow-md ${rot} transform duration-300 animate-in zoom-in`}
                     >
                       {st}
                     </span>
                   );
                 })}
               </div>

               {/* Header Ribbon */}
               <div className="absolute top-0 right-8 bg-[#fbcfe8] text-ink border-l-2 border-r-2 border-b-2 border-ink px-3 py-4 shadow-sm z-10 clip-ribbon">
                  <span className="font-mono font-black text-lg rotate-90 block tracking-widest leading-none drop-shadow-sm">{currentPage.date.split('-')[1]}/{currentPage.date.split('-')[0]}</span>
               </div>

               <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide py-2 pb-12 animate-in fade-in duration-300">
                  <div className="border-b-2 border-ink mb-4 pb-2">
                    <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-ink uppercase mb-1 mr-16">
                      {currentPage.displayDate}
                    </h2>

                    {/* MOOD PICKER INTERACTIVE DISPLAY */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-black uppercase text-ink/65 mr-1 select-none">Cảm xúc:</span>
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
                            className={`px-2 py-0.5 rounded-full border text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 hover:scale-105 active:scale-95 ${
                              isSelected
                                ? "bg-[#fffbeb] border-ink text-ink shadow-[2px_2px_0_var(--color-ink)]"
                                : "bg-white/40 border-ink/20 opacity-70 hover:opacity-100 text-ink/80"
                            }`}
                          >
                            <span>{m.emoji}</span>
                            <span className="text-[9px] sm:text-[10px]">{m.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* QUICK WRITE COLLAPSIBLE INTERACTIVE WRITER */}
                  <div className="my-4">
                    <div className="flex justify-between items-center bg-amber-50/70 px-4 py-2.5 rounded-xl border border-dashed border-ink/25 shadow-sm">
                      <span className="text-xs font-black text-ink/80 flex items-center gap-1.5 leading-none select-none">
                        <Feather className="w-3.5 h-3.5 text-ink/70 animate-bounce" />
                        {currentPage.logs.length === 0 ? "Chưa viết nhật ký hôm nay. Bạn muốn viết gì?" : `Đã lưu ${currentPage.logs.length} sự kiện & suy ngẫm`}
                      </span>
                      {setLogs && (
                        <button
                          onClick={() => setShowQuickEntry(!showQuickEntry)}
                          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-ink text-paper rounded hover:bg-ink/80 transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> {showQuickEntry ? "Đóng lại" : "Viết nhanh"}
                        </button>
                      )}
                    </div>

                    {showQuickEntry && (
                      <div className="mt-3 bg-[#fffbeb] p-4 rounded-xl border-2 border-ink shadow-[4px_4px_0_0_rgba(0,0,0,1)] animate-in slide-in-from-top-3 duration-200">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase text-ink select-none">Danh mục:</span>
                            <div className="flex gap-2">
                              {(['Reflection', 'Event'] as const).map(type => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setNewEntryType(type)}
                                  className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                                    newEntryType === type ? "bg-ink text-paper" : "bg-ink/10 text-ink/75"
                                  }`}
                                >
                                  {type === 'Reflection' ? "Suy ngẫm" : "Sự kiện"}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-start gap-1 flex-col">
                            <span className="text-[10px] font-black uppercase text-ink select-none">Chọn biểu tượng:</span>
                            <div className="flex flex-wrap gap-1 bg-white/40 p-1 rounded-lg border border-ink/10 w-full justify-between sm:justify-start font-sans">
                              {['📝', '💡', '🌟', '🍀', '☕', '🔥', '🎉', '💻', '💪', '❤️', '🎓'].map(em => (
                                <button
                                  key={em}
                                  type="button"
                                  onClick={() => setNewEntryEmoji(em)}
                                  className={`text-sm p-1.5 rounded hover:bg-ink/5 transition-all ${
                                    newEntryEmoji === em ? "bg-[#fbcfe8] border border-ink scale-110" : "opacity-60"
                                  }`}
                                >
                                  {em}
                                </button>
                              ))}
                            </div>
                          </div>

                          <textarea
                            value={newEntryContent}
                            onChange={(e) => setNewEntryContent(e.target.value)}
                            placeholder="Ghi lại suy ngẫm, sự kiện ý nghĩa hay từ học tập hôm nay..."
                            className="w-full min-h-[90px] p-2.5 bg-paper rounded border border-ink/30 text-sm focus:outline-none focus:border-ink resize-none font-hand text-lg placeholder:font-sans placeholder:text-xs text-ink placeholder:text-ink/40"
                          />

                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setShowQuickEntry(false)}
                              className="px-3 py-1 bg-white text-ink border border-ink/40 text-xs font-black rounded hover:bg-ink/5"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleAddQuickEntry(currentPage.date)}
                              disabled={!newEntryContent.trim()}
                              className="px-3 py-1 bg-ink text-paper text-xs font-black rounded hover:bg-ink/80 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                              <Send className="w-3.5 h-3.5" /> Lưu bút tích
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-8">
                     {/* Logs & Events */}
                     {currentPage.logs.length > 0 && (
                        <section>
                          <div className="flex items-center gap-2 mb-3">
                             <Feather className="w-5 h-5 text-ink" />
                             <h3 className="font-bold text-lg uppercase tracking-wider text-ink bg-[#fbcfe8] border-2 border-ink px-2 rounded-md shadow-sm">Nhật ký & Sự kiện</h3>
                          </div>
                          <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-dashed border-ink/20">
                            {currentPage.logs.map((log, idx) => (
                              <div key={idx} className="relative">
                                <span className="absolute -left-[23px] sm:-left-[31px] bg-paper text-ink p-0.5 rounded-full ring-2 ring-paper text-sm">
                                  {log.emoji || log.icon || "📝"}
                                </span>
                                <p className="font-hand text-lg md:text-xl leading-relaxed text-ink/90 whitespace-pre-wrap ml-2">
                                  {log.type === "Event" && <span className="font-bold uppercase text-[10px] tracking-widest mr-2 bg-ink/10 px-1 rounded inline-block translate-y-[-2px]">{log.time || "Sự kiện"}</span>}
                                  {log.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        </section>
                     )}

                     {/* Habits Completed */}
                     {currentPage.habitCompletions.length > 0 && (
                       <section>
                         <div className="flex items-center gap-2 mb-3">
                            <CheckSquare className="w-5 h-5 text-ink" />
                            <h3 className="font-bold text-lg uppercase tracking-wider text-ink bg-[#e8f0fe] border-2 border-ink px-2 rounded-md shadow-sm">Thói quen hoàn thành</h3>
                         </div>
                         <div className="flex flex-wrap gap-2">
                           {currentPage.habitCompletions.map(({ habit, streak }, idx) => (
                             <div key={idx} className="flex items-center gap-2 bg-emerald-50/50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                               <span className="text-xl drop-shadow-sm">{habit.icon}</span>
                               <span className="font-bold text-sm text-emerald-800">{habit.name}</span>
                               {streak > 1 && (
                                  <span className="text-[10px] bg-white border border-emerald-200 text-emerald-600 px-1.5 py-0.5 rounded font-black shadow-sm shrink-0 flex items-center gap-1">
                                    <Award className="w-3 h-3 text-emerald-500" /> {streak} Ngày
                                  </span>
                               )}
                             </div>
                           ))}
                         </div>
                       </section>
                     )}

                     {/* Purchases */}
                     {currentPage.purchased.length > 0 && (
                       <section>
                         <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="w-5 h-5 text-ink" />
                            <h3 className="font-bold text-lg uppercase tracking-wider text-ink bg-[#fbcfe8] border-2 border-ink px-2 rounded-md shadow-sm">Mua sắm & Tài sản</h3>
                         </div>
                         <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           {currentPage.purchased.map((item, idx) => (
                             <li key={idx} className="bg-white border-2 border-dashed border-amber-200 p-3 rounded-lg shadow-sm">
                               <div className="font-bold text-ink mb-1">{item.content}</div>
                               <div className="flex items-center gap-2 text-xs">
                                 {item.price ? (
                                    <span className="font-mono font-black text-amber-700 bg-amber-100 px-1 rounded">{item.price.toLocaleString('vi-VN')} ₫</span>
                                 ) : null}
                                 <span className="text-ink/50 italic">Đã mua sắm</span>
                               </div>
                             </li>
                           ))}
                         </ul>
                       </section>
                     )}

                     {/* Projects / Content Done & Achievements */}
                     {(currentPage.contentDone.length > 0 || currentPage.achievementsEarned.length > 0) && (
                       <section>
                         <div className="flex items-center gap-2 mb-3">
                            <Award className="w-5 h-5 text-ink" />
                            <h3 className="font-bold text-lg uppercase tracking-wider text-ink bg-[#e8f0fe] border-2 border-ink px-2 rounded-md shadow-sm">Thành tựu & Dự án</h3>
                         </div>
                         <ul className="space-y-4">
                           {currentPage.contentDone.map((item, idx) => (
                             <li key={`content-${idx}`} className="flex gap-2 items-start border-l-2 border-indigo-200 pl-3">
                                <span className="font-bold text-sm">{item.title}</span>
                                {item.platform && <span className="text-[9px] uppercase tracking-wider bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded mr-1">{item.platform}</span>}
                                <span className="text-xs text-ink/60">Hoàn thành ({item.type})</span>
                             </li>
                           ))}
                           {currentPage.achievementsEarned.map((item, idx) => (
                             <li key={`ach-${idx}`} className="flex flex-col border-l-2 border-amber-300 pl-3">
                                <div className="flex items-center gap-1.5">
                                 <Award className="w-3.5 h-3.5 text-amber-500" />
                                 <span className="font-bold text-sm text-ink">{item.title}</span>
                                </div>
                                <span className="text-xs text-ink/60 italic">{item.description}</span>
                             </li>
                           ))}
                         </ul>
                       </section>
                     )}
                     
                     {/* Tasks Done / Routine */}
                     {currentPage.tasksDone.length > 0 && (
                       <section>
                         <div className="flex items-center gap-2 mb-3">
                            <CheckSquare className="w-5 h-5 text-ink" />
                            <h3 className="font-bold text-lg uppercase tracking-wider text-ink bg-green-100 border-2 border-ink px-2 rounded-md shadow-sm">Nhiệm vụ & Quá trình</h3>
                         </div>
                         <ul className="space-y-1.5">
                           {currentPage.tasksDone.map((item, idx) => (
                             <li key={`task-${idx}`} className="flex items-start gap-2 line-through text-ink/60 decoration-ink/30 decoration-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                                <div>
                                  <span className="text-sm">{item.title}</span>
                                  {item.priority && <span className="ml-2 text-[9px] uppercase tracking-widest px-1 py-0.5 bg-green-50 text-green-700 bg-opacity-50">ưu tiên: {item.priority}</span>}
                                </div>
                             </li>
                           ))}
                         </ul>
                       </section>
                     )}
                     
                     {/* Words Learned/Reviewed */}
                     {currentPage.wordsReviewed.length > 0 && (
                       <section>
                         <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="w-5 h-5 text-ink" />
                            <h3 className="font-bold text-lg uppercase tracking-wider text-ink bg-[#fbcfe8] border-2 border-ink px-2 rounded-md shadow-sm">Từ vựng đã ôn ({currentPage.wordsReviewed.length})</h3>
                         </div>
                         <div className="flex flex-wrap gap-1.5">
                           {currentPage.wordsReviewed.map((w, idx) => (
                             <span key={idx} className="bg-white border border-sky-200 text-sky-900 px-2 py-0.5 rounded text-sm shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                               {w.vocabulary}
                             </span>
                           ))}
                         </div>
                       </section>
                     )}

                     {/* Places Visited */}
                     {currentPage.placesVisited.length > 0 && (
                       <section>
                         <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-5 h-5 text-ink" />
                            <h3 className="font-bold text-lg uppercase tracking-wider text-ink bg-[#e8f0fe] border-2 border-ink px-2 rounded-md shadow-sm">Địa điểm</h3>
                         </div>
                         <ul className="space-y-2">
                           {currentPage.placesVisited.map((p, idx) => (
                             <li key={idx} className="flex flex-col border-l-2 border-rose-200 pl-3 relative">
                                <span className="absolute -left-[5px] top-1.5 w-2 h-2 bg-rose-400 rounded-full" />
                                <span className="font-bold text-base text-ink">{p.name}</span>
                                {p.city && <span className="text-xs text-ink/50 uppercase tracking-widest">{p.city}</span>}
                                {p.review && <span className="text-sm font-hand italic text-ink/80 mt-0.5">"{p.review}"</span>}
                             </li>
                           ))}
                         </ul>
                       </section>
                     )}

                     {/* ✨ GÓC TRI KỈ AI (AI COMPANION REFLECTION) */}
                     <section className="bg-[#fffdf9] rounded-2xl border-2 border-ink p-5 shadow-[4px_4px_0_0_rgba(0,0,0,1)] relative overflow-hidden transition-all duration-300 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:bg-[#fffff4] mt-10">
                       <div className="absolute right-0 top-0 bg-amber-400 text-ink border-l-2 border-b-2 border-ink px-3.5 py-1 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm font-sans">
                         <Sparkles className="w-2.5 h-2.5" /> companion
                       </div>

                       <div className="flex items-center gap-2.5 mb-4 border-b-2 border-ink/10 pb-2">
                         <div className="p-1.5 bg-[#fbcfe8] rounded-lg border border-ink">
                           <Sparkles className="w-5 h-5 text-ink animate-pulse" />
                         </div>
                         <div>
                           <h3 className="font-logo font-black text-base text-ink leading-tight uppercase tracking-wider">Góc Tri Kỷ Chiêm Nghiệm</h3>
                           <p className="text-[10px] text-ink/65 uppercase tracking-wider font-bold">AI Companion Insights</p>
                         </div>
                       </div>

                       {aiInsights[currentPage.date] ? (
                         <div className="space-y-4 font-sans text-ink">
                           <div className="bg-[#fffbeb] p-3 rounded-lg border border-dashed border-amber-300">
                             <span className="text-[9px] font-black uppercase tracking-widest text-[#b45309] block mb-1">🎭 Chủ đề ngày:</span>
                             <div className="font-hand text-2xl font-bold tracking-normal italic text-ink/90 leading-snug">
                               "{aiInsights[currentPage.date].title}"
                             </div>
                             <div className="text-[10px] bg-white border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full mt-1.5 inline-flex items-center gap-1 font-bold font-sans">
                               <span>🌌 Sắc thái cảm xúc:</span>
                               <span>{aiInsights[currentPage.date].moodAnalysis}</span>
                             </div>
                           </div>

                           <div className="relative pl-7 py-0.5">
                             <Quote className="w-5 h-5 text-ink/20 absolute left-0 top-0 rotate-180" />
                             <p className="font-hand text-xl leading-relaxed text-ink/85 italic whitespace-pre-line bg-transparent">
                               {aiInsights[currentPage.date].summary}
                             </p>
                           </div>

                           {aiInsights[currentPage.date].quote && (
                             <div className="bg-ink/5 p-3 rounded-xl border border-ink/10 italic text-xs text-ink/75 leading-relaxed relative flex items-start gap-2.5 font-sans">
                               <span className="text-xl">💡</span>
                               <div className="flex-1">
                                 "{aiInsights[currentPage.date].quote}"
                               </div>
                             </div>
                           )}

                           {aiInsights[currentPage.date].suggestions && aiInsights[currentPage.date].suggestions.length > 0 && (
                             <div className="border-t border-dashed border-ink/15 pt-3 font-sans">
                               <span className="text-[10px] font-black uppercase tracking-widest text-[#0f172a] block mb-2">🌱 Ý tưởng rèn luyện cho ngày mai:</span>
                               <ul className="space-y-1.5 pl-1 font-sans">
                                 {aiInsights[currentPage.date].suggestions.map((s, idx) => (
                                   <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-ink/80 leading-relaxed">
                                     <span className="w-4 h-4 rounded-full border border-ink flex items-center justify-center bg-white text-[9px] font-mono shrink-0 font-black mt-0.5 shadow-[1px_1px_0_0_rgba(0,0,0,1)]">✓</span>
                                     <span className="flex-1">{s}</span>
                                   </li>
                                 ))}
                               </ul>
                             </div>
                           )}

                           <div className="flex justify-end pt-2 border-t border-dashed border-ink/10 mt-3 font-sans">
                             <button
                               onClick={() => fetchAIInsight(currentPage)}
                               disabled={loadingInsight}
                               className="text-[10px] font-black uppercase text-ink/60 hover:text-ink transition-colors flex items-center gap-1 focus:outline-none disabled:opacity-40"
                             >
                               <RefreshCw className={`w-3 h-3 ${loadingInsight ? "animate-spin" : ""}`} /> Tái tạo suy ngẫm
                             </button>
                           </div>
                         </div>
                       ) : (
                         <div className="text-center py-6 px-4 bg-white/50 rounded-xl border border-dashed border-ink/20 animate-in fade-in duration-300">
                           <span className="text-3xl block mb-2 drop-shadow-sm leading-none">✨</span>
                           <h4 className="font-black text-sm text-ink uppercase tracking-wide mb-1 font-sans">Lắng nghe chia sẻ của tri kỉ</h4>
                           <p className="text-xs text-ink/60 max-w-sm mx-auto mb-4 leading-relaxed font-sans">
                             Khiến ngày hôm nay sâu sắc hơn. AI sẽ kết nối mọi thói quen, từ vựng và dòng viết tâm sự của bạn để dành tặng một góc đúc kết bình yên.
                           </p>
                           <button
                             onClick={() => fetchAIInsight(currentPage)}
                             disabled={loadingInsight}
                             className="sketch-btn-sm inline-flex items-center gap-2 bg-[#fbcfe8] text-ink py-1.5 px-4 font-black text-xs uppercase shadow-[3px_3px_0_var(--color-ink)] font-sans"
                           >
                             {loadingInsight ? (
                               <>
                                 <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Tri kỉ đang chắp bút...
                               </>
                             ) : (
                               <>
                                 <Sparkles className="w-3.5 h-3.5" /> Chiêm nghiệm ngày hôm nay
                               </>
                             )}
                           </button>
                         </div>
                       )}
                     </section>

                     {/* Empty state padding to look like a full page */}
                     <div className="h-10" />
                  </div>
               </div>

               {/* Page Numbers */}
               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono font-black text-ink bg-[#fbcfe8] px-3 py-1 rounded-full border-2 border-ink text-sm shadow-[2px_2px_0_0_rgba(0,0,0,0.8)]">
                  PAGE 0{currentPageIndex + 1}
               </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Decorative Emojis Sticker Bar */}
      <div className="w-full max-w-xl mx-auto mt-8 bg-white/50 p-3 rounded-2xl sketch-border-sm border-dashed flex flex-col items-center gap-1.5">
        <span className="text-[9px] font-black uppercase tracking-widest text-ink/65 flex items-center gap-1">✨ Chạm dán sticker thủ công lên trang nhật ký ({currentPage.date})</span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {['🌸', '🎯', '🔥', '☕', '🍕', '⭐', '🎉', '🚀', '🧸', '💡', '📖'].map((st) => {
            const active = (pageStickers[currentPage.date] || []).includes(st);
            return (
              <button
                key={st}
                onClick={() => addSticker(st, currentPage.date)}
                className={`w-8 h-8 flex items-center justify-center text-lg rounded-xl transition-all hover:scale-110 active:scale-95 border ${
                  active ? "bg-[#fffbeb] border-ink rotate-3 scale-105 shadow-[2px_2px_0_0_rgba(0,0,0,1)]" : "bg-white/40 border-dashed border-ink/20 hover:border-ink hover:opacity-100 opacity-70"
                }`}
                title={active ? "Gỡ nhãn dán" : "Dán nhãn dán"}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Add simple CSS for clip-ribbon to index.css if possible, but here we can just use inline styles if needed, or rely on normal css.
