import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { LogEntry, WishlistItem, Habit, Asset, Word, FoodPlace, ContentIdea } from "../types";
import { BookOpen, Calendar as CalendarIcon, DollarSign, MapPin, Feather, CheckSquare, Award } from "lucide-react";

interface DigitalJournalProps {
  logs: LogEntry[];
  wishlist: WishlistItem[];
  habits: Habit[];
  assets: Asset[];
  words: Word[];
  places: FoodPlace[];
  ideas: ContentIdea[];
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
}

export function DigitalJournal({ logs, wishlist, habits, assets, words, places, ideas }: DigitalJournalProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

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
          logs: [], purchased: [], habitCompletions: [], wordsReviewed: [], placesVisited: [], contentDone: []
        });
      }
      return dateMap.get(dateInfo)!;
    };

    // 1. Logs (Reflection / Event)
    logs.forEach(log => {
      const d = getDay(log.date);
      if (d) ensureDate(d).logs.push(log);
    });

    // 2. Wishlist Purchases (those toggled to isPurchased - fallback to addedDate if we don't have purchase history.. wait, wishlist has history)
    wishlist.forEach(w => {
      if (w.isPurchased && w.history && w.history.length > 0) {
        // Last history might be the purchase date. Let's just use addedDate for simplicity if no explicit purchase date. 
        // Actually history has date string.
        const histString = w.history[w.history.length - 1]?.date;
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

    // Sort dates descending
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => b.localeCompare(a));
    return sortedDates.map(d => dateMap.get(d)!);
  }, [logs, wishlist, habits, words, places, ideas]);

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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="sketch-border bg-paper p-12 text-center rounded-xl shadow-lg">
          <BookOpen className="w-16 h-16 text-ink/20 mx-auto mb-4" />
          <h2 className="text-xl font-bold font-logo uppercase tracking-widest text-ink/50">Digital Journal chưa có dữ liệu</h2>
          <p className="mt-2 font-hand text-ink/70">Hãy ghi chép nhật ký, thêm thói quen, hoặc đánh dấu hoàn thành để bắt đầu cuốn sổ này.</p>
        </div>
      </div>
    );
  }

  const currentPage = pages[currentPageIndex];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-black font-logo uppercase tracking-[0.2em] text-ink flex justify-center items-center gap-3">
          <BookOpen className="w-8 h-8" /> DIGITAL JOURNAL
        </h1>
        <p className="text-sm font-bold uppercase tracking-widest text-ink/50 mt-1">Hành trình kí ức</p>
      </div>

      <div className="relative w-full max-w-4xl mx-auto min-h-[650px] sm:min-h-[700px] flex items-center justify-center perspective-[2000px]">
        {/* Navigation Buttons Outside Book */}
        <button
          onClick={prevPage}
          disabled={currentPageIndex === 0}
          className="absolute left-0 md:-left-12 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white border-2 border-ink rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink hover:text-white transition-all shadow-[4px_4px_0_var(--color-ink)]"
        >
          <span className="text-2xl font-black relative -left-0.5">←</span>
        </button>

        <button
          onClick={nextPage}
          disabled={currentPageIndex === pages.length - 1}
          className="absolute right-0 md:-right-12 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white border-2 border-ink rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink hover:text-white transition-all shadow-[4px_4px_0_var(--color-ink)]"
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
               <div className="absolute top-0 right-8 bg-crimson text-white px-3 py-4 shadow-md z-10 clip-ribbon">
                  <span className="font-mono font-bold text-lg rotate-90 block tracking-widest">{currentPage.date.split('-')[1]}/{currentPage.date.split('-')[0]}</span>
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
                             <Feather className="w-5 h-5 text-ink/70" />
                             <h3 className="font-bold text-lg uppercase tracking-wider text-ink bg-ink/5 px-2 rounded">Nhật ký & Sự kiện</h3>
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
                            <CheckSquare className="w-5 h-5 text-emerald-600" />
                            <h3 className="font-bold text-lg uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 rounded">Thói quen hoàn thành</h3>
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
                            <DollarSign className="w-5 h-5 text-amber-600" />
                            <h3 className="font-bold text-lg uppercase tracking-wider text-amber-700 bg-amber-50 px-2 rounded">Mua sắm & Tài sản</h3>
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

                     {/* Projects / Content Done */}
                     {currentPage.contentDone.length > 0 && (
                       <section>
                         <div className="flex items-center gap-2 mb-3">
                            <Award className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-bold text-lg uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 rounded">Thành tựu & Dự án</h3>
                         </div>
                         <ul className="space-y-2">
                           {currentPage.contentDone.map((item, idx) => (
                             <li key={idx} className="flex gap-2 items-start border-l-2 border-indigo-200 pl-3">
                                <span className="font-bold text-sm">{item.title}</span>
                                {item.platform && <span className="text-[9px] uppercase tracking-wider bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded mr-1">{item.platform}</span>}
                                <span className="text-xs text-ink/60">Hoàn thành</span>
                             </li>
                           ))}
                         </ul>
                       </section>
                     )}
                     
                     {/* Words Learned/Reviewed */}
                     {currentPage.wordsReviewed.length > 0 && (
                       <section>
                         <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="w-5 h-5 text-sky-600" />
                            <h3 className="font-bold text-lg uppercase tracking-wider text-sky-700 bg-sky-50 px-2 rounded">Từ vựng đã ôn ({currentPage.wordsReviewed.length})</h3>
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
                            <MapPin className="w-5 h-5 text-rose-600" />
                            <h3 className="font-bold text-lg uppercase tracking-wider text-rose-700 bg-rose-50 px-2 rounded">Địa điểm đã ghé trang</h3>
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
               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono font-black text-ink/30 text-sm">
                  - {currentPageIndex + 1} - 
               </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Add simple CSS for clip-ribbon to index.css if possible, but here we can just use inline styles if needed, or rely on normal css.
