import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { LogEntry, WishlistItem, Habit, Asset, Word, FoodPlace, ContentIdea, Task, Achievement, StudyGoal } from "../types";
import { BookOpen, Calendar as CalendarIcon, DollarSign, MapPin, Feather, CheckSquare, Award } from "lucide-react";

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

export function DigitalJournal({ logs, wishlist, assets, words, places, ideas, tasks = [], achievements = [], goals = [] }: DigitalJournalProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

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
         // id is Date.now().toString().
         const ts = parseInt(p.id, 10);
         if (!isNaN(ts)) {
            const d = getDayFromTs(ts);
            if (d) ensureDate(d).placesVisited.push(p);
         }
      }
    });

    // 7. Tasks
    tasks.forEach(t => {
      if (t.completed) {
        const d = getDay(t.completedAt || t.createdAt);
        if (d) ensureDate(d).tasksDone.push(t);
      }
    });

    // 8. Achievements
    achievements.forEach(a => {
      if (a.dateEarned) {
        const d = getDay(a.dateEarned);
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
              style={{
                 backgroundImage: "linear-gradient(transparent 95%, rgba(0,0,0,0.05) 100%)",
                 backgroundSize: "100% 28px"
              }}
            >
               {/* Header Ribbon */}
               <div className="absolute top-0 right-8 bg-[#fbcfe8] text-ink border-l-2 border-r-2 border-b-2 border-ink px-3 py-4 shadow-sm z-10 clip-ribbon">
                  <span className="font-mono font-black text-lg rotate-90 block tracking-widest leading-none drop-shadow-sm">{currentPage.date.split('-')[1]}/{currentPage.date.split('-')[0]}</span>
               </div>

               <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide py-2 pb-12">
                  <div className="border-b-2 border-ink mb-6 pb-2">
                    <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-ink uppercase mb-2 mr-16">
                      {currentPage.displayDate}
                    </h2>
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
    </div>
  );
}

// Add simple CSS for clip-ribbon to index.css if possible, but here we can just use inline styles if needed, or rely on normal css.
