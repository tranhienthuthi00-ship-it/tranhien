import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { LogEntry, WishlistItem, Habit, Asset, Word, FoodPlace, ContentIdea, Task, Achievement, StudyGoal, AssetCategory } from "../types";
import { ScrapbookCreator } from "./ScrapbookCreator";
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
  Heart,
  Check,
  CreditCard
} from "lucide-react";

interface DigitalJournalProps {
  logs: LogEntry[];
  wishlist: WishlistItem[];
  assets: Asset[];
  words: Word[];
  places: FoodPlace[];
  ideas: ContentIdea[];
  tasks?: Task[];
  setTasks?: (tasks: Task[]) => void;
  achievements?: Achievement[];
  goals?: StudyGoal[];
  setLogs?: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  setAssets?: (assets: Asset[]) => void;
  categories?: AssetCategory[];
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

const formatToVNShortDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const weekdays = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
    const w = weekdays[d.getDay()];
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${w}, ${day}/${month}`;
  } catch {
    return dateStr;
  }
};

export function DigitalJournal({ 
  logs, 
  wishlist, 
  assets, 
  words, 
  places, 
  ideas, 
  tasks = [], 
  setTasks,
  achievements = [], 
  goals = [], 
  setLogs,
  setAssets,
  categories = []
}: DigitalJournalProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [paperStyle, setPaperStyle] = useState<'lined' | 'grid' | 'dotted' | 'blank'>('lined');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showScrapbookStudio, setShowScrapbookStudio] = useState(false);
  
  // Safe ref to track the active date across render boundaries
  const activeDateRef = React.useRef<string>("");

  // Goal Selection for tasks
  const [newTaskGoalId, setNewTaskGoalId] = useState<string>("");

  // Helpers for Credit Card Spends
  const getLast7Dates = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  };

  const DEFAULT_WEEK_DEBTS = getLast7Dates().map((dateStr, idx) => ({
    id: idx + 1,
    name: dateStr,
    amount: "",
    notes: ""
  }));

  const [bulkCardSpends, setBulkCardSpends] = useState<{id: number, name: string, amount: string, notes: string}[]>(() => {
    try {
      const saved = localStorage.getItem("studyHub_bulkCardSpends");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_WEEK_DEBTS.map(item => ({ ...item, amount: "", notes: "" }));
  });

  React.useEffect(() => {
    try {
      localStorage.setItem("studyHub_bulkCardSpends", JSON.stringify(bulkCardSpends));
    } catch (e) {
      console.error(e);
    }
  }, [bulkCardSpends]);

  // AUTOMATIC SYNC: Auto-save or update "card-debt-auto-sync" in assets when bulkCardSpends updates
  React.useEffect(() => {
    if (!setAssets || !assets) return;

    try {
      const validSpends = bulkCardSpends.filter(d => d.amount.trim() && !isNaN(parseFloat(d.amount.replace(/,/g, ''))));
      const totalSum = validSpends.reduce((sum, d) => sum + parseFloat(d.amount.replace(/,/g, '')), 0);
      const absTotalSum = Math.abs(totalSum);

      const existingDebtIdx = assets.findIndex(a => a.id === "card-debt-auto-sync");

      if (absTotalSum === 0) {
        if (existingDebtIdx !== -1) {
          setAssets(assets.filter(a => a.id !== "card-debt-auto-sync"));
        }
        return;
      }

      const catId = categories.find(c => 
        c.name.toLowerCase().includes("tín dụng") || 
        c.name.toLowerCase().includes("thẻ") || 
        c.name.toLowerCase().includes("credit") || 
        c.name.toLowerCase().includes("nợ")
      )?.id || (categories.length > 0 ? categories[0].id : "card-category-id");

      const formatDateHelper = (ymd: string) => {
        try {
          const parts = ymd.split("-");
          return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ymd;
        } catch {
          return ymd;
        }
      };

      const detailNotesList = validSpends.map(d => {
        const val = parseFloat(d.amount.replace(/,/g, ''));
        const dayNote = d.notes && d.notes.trim() ? ` - [Ghi chú: ${d.notes.trim()}]` : "";
        return `• ${formatDateHelper(d.name)}: ${val.toLocaleString('vi-VN')} đ${dayNote}`;
      }).join("\n");

      const activeDates = bulkCardSpends
        .map(d => d.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      
      let dateRangeText = "";
      if (activeDates.length > 0) {
        const formatDateStr = (ymd: string) => {
          const parts = ymd.split("-");
          return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ymd;
        };
        dateRangeText = ` (${formatDateStr(activeDates[0])} - ${formatDateStr(activeDates[activeDates.length - 1])})`;
      }

      const updatedDebtAsset: Asset = {
        id: "card-debt-auto-sync",
        name: `Nợ thẻ tín dụng${dateRangeText} (Tự động)`,
        category: catId,
        value: absTotalSum,
        currency: "VND",
        notes: `Dư nợ tín dụng tổng hợp tự động từ chi tiết bảng kê hàng ngày:\n${detailNotesList}`,
        acquiredAt: Date.now(),
        isDebt: true,
        isNewMoney: false,
        excludeFromNetWorth: false
      };

      if (existingDebtIdx === -1) {
        setAssets([updatedDebtAsset, ...assets]);
      } else {
        const existing = assets[existingDebtIdx];
        if (existing.value !== updatedDebtAsset.value || existing.notes !== updatedDebtAsset.notes || existing.name !== updatedDebtAsset.name) {
          const updatedList = [...assets];
          updatedList[existingDebtIdx] = {
            ...existing,
            name: updatedDebtAsset.name,
            value: updatedDebtAsset.value,
            notes: updatedDebtAsset.notes,
            category: updatedDebtAsset.category
          };
          setAssets(updatedList);
        }
      }
    } catch (err) {
      console.error("Lỗi tự động đồng bộ nợ thẻ tín dụng:", err);
    }
  }, [bulkCardSpends, categories, assets, setAssets]);

  const justCardRangeText = useMemo(() => {
    const activeDates = bulkCardSpends
      .map(d => d.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    if (activeDates.length === 0) {
      return "(Từ ngày … đến ngày …)";
    }
    const formatDateStr = (ymd: string) => {
      try {
        const portions = ymd.split("-");
        if (portions.length === 3) {
          return `${portions[2]}/${portions[1]}/${portions[0]}`; // DD/MM/YYYY
        }
        return ymd;
      } catch {
        return ymd;
      }
    };
    const minDate = formatDateStr(activeDates[0]);
    const maxDate = formatDateStr(activeDates[activeDates.length - 1]);
    return `(Từ ngày ${minDate} đến ngày ${maxDate})`;
  }, [bulkCardSpends]);

  const handleResetBulkCardSpends = () => {
    setBulkCardSpends(DEFAULT_WEEK_DEBTS.map(item => ({ ...item, amount: "", notes: "" })));
  };

  const handleSaveBulkCardSpends = () => {
     if (!setAssets) {
       alert("Lỗi: Không tìm thấy phương thức lưu tài sản!");
       return;
     }
     const now = Date.now();
     const validSpends = bulkCardSpends.filter(d => d.amount.trim() && !isNaN(parseFloat(d.amount.replace(/,/g, ''))));
     if (validSpends.length === 0) {
       alert("Hãy nhập số tiền sử dụng thẻ cho ít nhất một ngày!");
       return;
     }

     const formattedDateRange = justCardRangeText;
     const calculatedSum = validSpends.reduce((sum, d) => sum + parseFloat(d.amount.replace(/,/g, '')), 0);
     const totalSum = Math.abs(calculatedSum);
     const catId = categories.find(c => 
       c.name.toLowerCase().includes("tín dụng") || 
       c.name.toLowerCase().includes("thẻ") || 
       c.name.toLowerCase().includes("credit") || 
       c.name.toLowerCase().includes("nợ")
     )?.id || (categories.length > 0 ? categories[0].id : "");

     const formatDateHelper = (ymd: string) => {
       try {
         const parts = ymd.split("-");
         return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ymd;
       } catch {
         return ymd;
       }
     };

     const detailNotesList = validSpends.map(d => {
       const val = parseFloat(d.amount.replace(/,/g, ''));
       const dayNote = d.notes && d.notes.trim() ? ` - [Ghi chú: ${d.notes.trim()}]` : "";
       return `• ${formatDateHelper(d.name)}: ${val.toLocaleString('vi-VN')} đ${dayNote}`;
     }).join("\n");

     const aggregatedCardDebt: Asset = {
        id: `card-held-${now}`,
        name: `Nợ thẻ tín dụng ${formattedDateRange}`,
        category: catId,
        value: totalSum,
        currency: "VND",
        notes: `Bảng kê chi tiết nợ tiêu dùng thẻ tín dụng:\n${detailNotesList}`,
        acquiredAt: now,
        isDebt: true,
        isNewMoney: false,
        excludeFromNetWorth: false
     };

     setAssets([aggregatedCardDebt, ...assets]);
     alert(`Đã lưu tổng nợ thẻ tín dụng tuần trị giá +${totalSum.toLocaleString('vi-VN')}đ vào Sổ Tài Sản (Mục Nợ) thành công!`);
     handleResetBulkCardSpends();
  };

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

  // Simplify UX control toggles
  const [showPageCustomizer, setShowPageCustomizer] = useState(false);
  const [showAutomaticRecap, setShowAutomaticRecap] = useState(false);

  // States for inline tasks
  const [showAddTaskInline, setShowAddTaskInline] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // NEW STATES FOR TODAY PAGE PROGRESS & WELLNESS
  const [dailyWater, setDailyWater] = useState<{ [date: string]: number }>(() => {
    try {
      const saved = localStorage.getItem("studyHub_dailyWater");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [dailyWeather, setDailyWeather] = useState<{ [date: string]: { emoji: string; name: string } }>(() => {
    try {
      const saved = localStorage.getItem("studyHub_dailyWeather");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [dailyGratitude, setDailyGratitude] = useState<{ [date: string]: string[] }>(() => {
    try {
      const saved = localStorage.getItem("studyHub_dailyGratitude");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Pomodoro timer states (not persistent, only live in session)
  const [pomoTimeLeft, setPomoTimeLeft] = useState(1500); // 215 min default
  const [pomoIsActive, setPomoIsActive] = useState(false);
  const [pomoMode, setPomoMode] = useState<'Focus' | 'Break'>('Focus');

  React.useEffect(() => {
    try {
      localStorage.setItem("studyHub_dailyWater", JSON.stringify(dailyWater));
    } catch (e) {
      console.error(e);
    }
  }, [dailyWater]);

  React.useEffect(() => {
    try {
      localStorage.setItem("studyHub_dailyWeather", JSON.stringify(dailyWeather));
    } catch (e) {
      console.error(e);
    }
  }, [dailyWeather]);

  React.useEffect(() => {
    try {
      localStorage.setItem("studyHub_dailyGratitude", JSON.stringify(dailyGratitude));
    } catch (e) {
      console.error(e);
    }
  }, [dailyGratitude]);

  // Pomodoro Ticking sound and timing effect
  React.useEffect(() => {
    let interval: any = null;
    if (pomoIsActive && pomoTimeLeft > 0) {
      interval = setInterval(() => {
        setPomoTimeLeft(prev => {
          if (prev <= 1) {
            setPomoIsActive(false);
            // play synthesised bell sound at completion
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc0 = ctx.createOscillator();
              const osc1 = ctx.createOscillator();
              const gain = ctx.createGain();
              osc0.connect(gain);
              osc1.connect(gain);
              gain.connect(ctx.destination);
              
              osc0.type = "sine";
              osc0.frequency.setValueAtTime(880, ctx.currentTime); // High note A5
              
              osc1.type = "triangle";
              osc1.frequency.setValueAtTime(554.37, ctx.currentTime); // C#5 harmonizer
              
              gain.gain.setValueAtTime(0.25, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
              osc0.start(ctx.currentTime);
              osc1.start(ctx.currentTime);
              osc0.stop(ctx.currentTime + 1.5);
              osc1.stop(ctx.currentTime + 1.5);
            } catch (e) {
              console.log("Audio barred or error: ", e);
            }

            // Fire logger check dynamically using stable ref
            const activeDateVal = activeDateRef.current || new Date().toLocaleDateString('en-CA');
            const now = new Date();
            const logTime = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            
            if (pomoMode === 'Focus') {
              if (setLogs) {
                const autoPomoLog: LogEntry = {
                  id: `pomo-clock-${Date.now()}`,
                  date: activeDateVal,
                  content: "Đã rèn luyện & Tập trung cao độ một chu kỳ Pomodoro trọn vẹn (25 Phút) 🎯🔥",
                  type: 'Event',
                  emoji: '🎯',
                  time: logTime
                };
                setLogs(prev => [...prev, autoPomoLog]);
              }
              alert("⏱️ Chuông báo tập trung: Tuyệt vời! Bạn vừa bền bỉ hoàn thành 25 phút tập trung sâu. Hoạt động này đã được lưu vào dấu chân ngày hôm nay!");
            } else {
              alert("⏱️ Hết giờ giải lao! Hãy chuẩn bị tinh thần bước vào chu kỳ rèn luyện tiếp theo nhé.");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [pomoIsActive, pomoTimeLeft, pomoMode, setLogs]);

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

    // Guarantee that today always exists in the list so a page is never empty on load
    const localToday = new Date().toLocaleDateString('en-CA');
    ensureDate(localToday);

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
              Mở Trang Sách Trực Quan
            </h2>
          </div>
          <p className="mt-6 font-hand text-ink text-xl relative z-10 font-medium leading-relaxed">
            Nhật ký ngày hôm nay chưa có dòng ghi chú nào. Hãy bắt đầu lưu trữ từ vựng, thói quen rèn luyện hoặc chắp bút ghi chép đầu tiên nhé!
          </p>
        </div>
      </div>
    );
  }

  const currentPage = pages[currentPageIndex];
  
  // Keep the stable ref updated dynamically during active page changes
  activeDateRef.current = currentPage?.date || "";

  const handleSaveScrapbookToJournal = (summary: string) => {
    if (!setLogs) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const newLog: LogEntry = {
      id: `scrapbook-log-${Date.now()}`,
      date: currentPage.date,
      content: summary,
      type: 'Reflection',
      emoji: '🎨',
      time: timeStr
    };
    setLogs(prev => [...prev, newLog]);
  };

  const todoTasks = useMemo(() => {
    return tasks.filter(t => {
      if (!t.completed) return true;
      const completedDay = t.completedAt ? new Date(t.completedAt).toISOString().split("T")[0] : "";
      return completedDay === currentPage.date;
    });
  }, [tasks, currentPage.date]);

  const handleToggleTaskInline = (id: string) => {
    if (!setTasks || !tasks) return;
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? Date.now() : undefined
        };
      }
      return t;
    }));
  };

  const handleAddTaskInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim() || !setTasks || !tasks) return;
    const newTaskItem: Task = {
      id: Date.now().toString(),
      content: newTaskContent.trim(),
      completed: false,
      priority: newTaskPriority,
      createdAt: Date.now(),
      goalId: newTaskGoalId || undefined
    };
    setTasks([newTaskItem, ...tasks]);
    setNewTaskContent("");
    setNewTaskGoalId("");
    setShowAddTaskInline(false);
  };

  const handleDeleteTaskInline = (id: string) => {
    if (!setTasks || !tasks) return;
    setTasks(tasks.filter(t => t.id !== id));
  };

  const countOfTotalRecords = currentPage.habitCompletions.length + 
                             currentPage.wordsReviewed.length + 
                             currentPage.placesVisited.length + 
                             currentPage.purchased.length + 
                             currentPage.tasksDone.length + 
                             currentPage.achievementsEarned.length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans">
      
      {/* HEADER BAR */}
      <div className="sketch-border bg-[#fffbeb] py-5 px-6 text-center select-none shadow-sm border-b-4 border-r-4 border-ink relative overflow-hidden mb-8 max-w-4xl mx-auto rotate-[-0.5deg]">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-crimson" />
        <div className="flex items-center justify-center gap-3 mt-1">
          <BookOpen className="w-6 h-6 text-crimson" />
          <h1 className="text-2xl font-logo font-black uppercase text-ink tracking-wide">
            Cuốn Sổ Tay Kỷ Niệm
          </h1>
        </div>
        <p className="mt-1.5 text-xs text-ink/65 font-bold uppercase tracking-wider">
          Chiêm nghiệm & lưu giữ từng dấu chân rèn luyện mỗi ngày
        </p>
      </div>

      {/* Sidebar Focus Toggle and Layout Configuration */}
      <div className="flex justify-between items-center mb-4 select-none z-10 relative max-w-5xl mx-auto gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-xs bg-white text-ink border-2 border-ink px-4 py-2 rounded-xl hover:bg-ink hover:text-white transition-all duration-200 uppercase font-black tracking-wider flex items-center gap-2 shadow-sm cursor-pointer"
          >
            {isSidebarCollapsed ? "📖 Hiện danh sách ngày" : "📂 Ẩn bớt lịch sử (Đọc sách)"}
          </button>
        </div>

        {isSidebarCollapsed && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-ink/50 uppercase select-none">Nhật ký trang ngày:</span>
            <select
              value={currentPageIndex}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) setCurrentPageIndex(val);
              }}
              className="text-xs font-black bg-[#fffbeb] border-2 border-ink rounded-xl px-3 py-1.5 outline-none text-ink shadow-[2px_2px_0_var(--color-ink)] cursor-pointer"
            >
              {pages.map((p, idx) => (
                <option key={p.date} value={idx}>
                  {formatToVNShortDate(p.date)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* STREAMLINED TWO-COLUMN SPLIT PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto items-start">
        
        {/* LEFT PANEL: TIMELINE & DAY PICKER */}
        {!isSidebarCollapsed && (
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl sketch-border border-ink shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2 border-ink/10">
                <span className="text-xs uppercase font-black tracking-widest text-[#1a1a1a] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-crimson" /> Nhật ký ngày ({pages.length})
                </span>
              </div>

              <div className="max-h-[340px] overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                {pages.map((p, idx) => {
                  const isSelected = currentPageIndex === idx;
                  const moodData = dailyMoods[p.date];
                  const dayActivityCount = p.logs.length + p.habitCompletions.length + p.wordsReviewed.length + p.placesVisited.length + p.purchased.length;
                  
                  return (
                    <button
                      key={p.date}
                      onClick={() => {
                        setCurrentPageIndex(idx);
                        // Collapse expand tracker on day change so it's clean
                        setShowAutomaticRecap(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border-2 transition-all duration-200 flex items-center justify-between gap-2 group ${
                        isSelected 
                          ? "bg-[#fffbeb] border-ink text-ink shadow-[3px_3px_0_var(--color-ink)]" 
                          : "bg-white/40 border-ink/10 hover:border-ink/40 hover:bg-white text-ink/80"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg flex-shrink-0">
                          {moodData?.emoji || "📝"}
                        </span>
                        <div className="min-w-0">
                          <span className="font-sans text-xs font-black block group-hover:text-crimson transition-colors">
                            {formatToVNShortDate(p.date)}
                          </span>
                          <span className="text-[10px] text-ink/50 font-bold truncate block">
                            {moodData?.name || "Bình thường"} • {dayActivityCount} hoạt động
                          </span>
                        </div>
                      </div>
                      {p.logs.length > 0 && (
                        <span className="bg-[#fbcfe8] text-ink border border-ink text-[9px] px-1.5 py-0.5 rounded-full font-black flex-shrink-0">
                          {p.logs.length} chép
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* RIGHT PANEL: DETAILS OF THE JOURNAL PAGE */}
        <div className={isSidebarCollapsed ? "lg:col-span-12 max-w-4xl mx-auto w-full space-y-4" : "lg:col-span-8 space-y-4"}>
          
          <>
            <div className="bg-white/80 backdrop-blur shadow-sm p-5 md:p-8 rounded-2xl sketch-border border-ink relative overflow-hidden min-h-[480px]">
          
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

          {/* Note paper margin line to make it extremely cozy and high craft */}
          <div className="absolute left-6 md:left-[36px] top-0 bottom-0 w-[1.5px] bg-rose-400/25 pointer-events-none z-10" />

          {/* MAIN CONTENT SECTION */}
          <div className="relative z-10 space-y-5 pl-4 md:pl-6">
              
              {/* Daily Title & Mood bar */}
              <div className="border-b border-rose-300/40 pb-3.5 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#af1e2d] block">
                      Trang ngày {currentPage.date.split("-").reverse().join("/")}
                    </span>
                    {dailyWeather[currentPage.date] && (
                      <span className="py-0.5 px-2 bg-amber-50 text-amber-800 text-[9px] font-black uppercase rounded-full border border-amber-200 flex items-center gap-1 shrink-0 animate-bounce">
                        <span>{dailyWeather[currentPage.date].emoji}</span>
                        <span>{dailyWeather[currentPage.date].name}</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-logo font-black text-ink tracking-tight uppercase leading-none mt-1">
                    {currentPage.displayDate}
                  </h2>
                </div>

                {/* Highly compact horizontal Mood Strip */}
                <div className="flex items-center gap-1.5 bg-ink/5 p-1 rounded-full border border-ink/5 self-start md:self-auto">
                  <span className="text-[9px] font-black uppercase text-ink/50 px-2 select-none">Tâm trạng</span>
                  {[
                    { emoji: "😌", name: "Bình yên" },
                    { emoji: "😊", name: "Vui vẻ" },
                    { emoji: "🌟", name: "Hào hứng" },
                    { emoji: "🥱", name: "Mệt mỏi" },
                    { emoji: "😔", name: "Khó khăn" },
                    { emoji: "☕", name: "Tập trung" }
                  ].map(m => {
                    const isSelected = dailyMoods[currentPage.date]?.emoji === m.emoji;
                    return (
                      <button
                        key={m.emoji}
                        onClick={() => changeMood(currentPage.date, m.emoji, m.name)}
                        className={`w-7 h-7 flex items-center justify-center text-xs rounded-full transition-all active:scale-95 ${
                          isSelected
                            ? "bg-white border border-ink/20 shadow-xs scale-105"
                            : "opacity-40 hover:opacity-100 hover:bg-white/40 text-ink/80"
                        }`}
                        title={m.name}
                      >
                        {m.emoji}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* COZY TODAY BENTO INTEGRATION: STUDY SUITE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. VOCABULARY KNOWLEDGE SNAPSHOT (BẢNG VÀNG TỪ VỰNG) */}
                <div className="bg-[#f0fdf2]/60 p-4 rounded-2xl border-2 border-dashed border-emerald-250 relative overflow-hidden backdrop-blur-xs flex flex-col justify-between shadow-[3px_3px_0_rgba(16,185,129,0.15)]">
                  <div>
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2 mb-2.5">
                      <span className="text-xs uppercase font-black text-emerald-800 flex items-center gap-1.5 font-sans">
                        💡 Thống Kê Từ Vựng 4YOU
                      </span>
                      <span className="text-[9px] font-bold text-emerald-600 bg-white px-2 py-0.5 rounded-full border border-emerald-100">
                        {words.length} từ đã lưu
                      </span>
                    </div>

                    <div className="space-y-1.5 min-h-[90px]">
                      {words.length === 0 ? (
                        <p className="text-xs text-emerald-700/60 font-sans italic leading-relaxed py-2 text-center">
                          Sổ tay từ vựng còn rỗng. Nhấn click vào các từ khóa trong video YouTube để thêm nhé!
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          <span className="text-[8px] font-black tracking-widest uppercase text-emerald-700/40 font-sans block">3 Từ Vựng Mới Lưu:</span>
                          <div className="grid grid-cols-1 gap-1">
                            {words.slice(0, 3).map((w, idx) => (
                              <div key={w.id || idx} className="flex items-center justify-between bg-white/70 px-2 py-1 rounded-lg border border-emerald-100/40 text-xs text-emerald-950 font-sans">
                                <span className="font-extrabold text-xs text-emerald-900 font-mono">
                                  {w.vocabulary} <span className="text-[9px] font-medium text-emerald-500">{w.ipa ? `(${w.ipa})` : ""}</span>
                                </span>
                                <span className="text-[9px] font-semibold text-emerald-700 truncate max-w-[150px]">
                                  {w.definition}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-sans pb-0.5 border-t border-emerald-200/40 pt-1.5 mt-1.5">
                    <span className="text-emerald-800/80 font-bold">
                      Học phần từ vựng: <strong className="text-emerald-950 text-xs font-black">{words.filter(w => w.difficulty === 1).length}</strong> đã thành thạo
                    </span>
                    <span className="text-emerald-850 font-black bg-emerald-150 px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                      Active
                    </span>
                  </div>
                </div>

                {/* 2. ACTIONS & TARGET GOALS PROGRESS (TIẾN ĐỘ RÈN LUYỆN) */}
                <div className="bg-[#eff6ff]/60 p-4 rounded-2xl border-2 border-dashed border-sky-200 relative overflow-hidden flex flex-col justify-between shadow-[3px_3px_0_rgba(59,130,246,0.15)] text-left">
                  <div>
                    <div className="flex items-center justify-between border-b border-sky-200 pb-2 mb-2.5">
                      <span className="text-xs uppercase font-black text-sky-800 flex items-center gap-1.5 font-sans">
                        🎯 Tiến Độ Hôm Nay
                      </span>
                      <span className="text-[9px] font-sans font-bold text-sky-600 bg-white px-2 py-0.5 rounded-full border border-sky-100">
                        Nghị Lực Bền Bỉ
                      </span>
                    </div>

                    {(() => {
                      const completedCount = tasks.filter(t => t.completed).length;
                      const totalCount = tasks.length;
                      const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                      const activeTargets = goals.filter(g => !g.isCompleted).length;

                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[11px] font-sans">
                            <span className="text-sky-900/60 font-bold shrink-0">Nhiệm vụ hàng ngày:</span>
                            <span className="font-mono text-sky-950 text-xs font-black">
                              {completedCount}/{totalCount} việc hoàn thành ({percent}%)
                            </span>
                          </div>

                          {/* Beautiful sketch-like progress bar wrapper */}
                          <div className="w-full h-3 bg-white/80 rounded-full border-2 border-sky-400 overflow-hidden p-[2px] relative">
                            <div 
                              className="h-full bg-sky-500 rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center text-[10px] bg-sky-100/40 px-2 py-1 rounded-xl font-sans mt-2 border border-sky-100">
                            <span className="text-sky-900/60 font-bold">Mục tiêu học trình đang chạy:</span>
                            <span className="font-bold text-sky-950 bg-white px-2 py-0.5 rounded-full ring-1 ring-sky-300">
                              {activeTargets} Mục tiêu
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <p className="text-[9px] text-[#0369a1]/50 italic font-sans mt-2">
                    * Đóng liên tiếp các công việc để mở khóa Huy Chương thăng cấp.
                  </p>
                </div>

                {/* 3. INSPIRATION STUDY & GROWTH MINDSET QUOTE (TRẠM ĐỘNG LỰC) */}
                <div className="bg-[#fff1f2]/60 p-4 rounded-2xl border-2 border-dashed border-rose-250 relative overflow-hidden shadow-[3px_3px_0_rgba(244,63,94,0.15)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-rose-200/50 pb-2 mb-2">
                      <span className="text-xs uppercase font-black text-rose-800 flex items-center gap-1.5 font-sans">
                        🌟 Trạm Truyền Cảm Hứng
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const quoteListLength = 6;
                          setQuoteIndex(prev => (prev + 1) % quoteListLength);
                        }}
                        className="text-[8px] font-sans font-black text-rose-600 bg-white hover:bg-rose-100/30 px-2.5 py-0.5 rounded-full border border-rose-150 cursor-pointer active:scale-95 transition-all"
                      >
                        Gieo Ý Chí ⇄
                      </button>
                    </div>

                    {(() => {
                      const STUDY_QUOTES = [
                        { text: "Nghị lực và sự kiên trì sẽ chiến thắng tất cả mọi rào cản trên thế gian.", author: "Benjamin Franklin" },
                        { text: "Hành trình vạn dặm bắt đầu từ một bước chân nhỏ bé vững chãi mỗi ngày.", author: "Lão Tử" },
                        { text: "Khó khăn thử thách học tập chính là cơ hội để khẳng định nỗ lực phi thường.", author: "Marcus Aurelius" },
                        { text: "Học tập mà không suy nghĩ thì vô ích; suy nghĩ mà không học tập thì thật hiểm nghèo.", author: "Khổng Tử" },
                        { text: "Chúng ta chính là những gì chúng ta liên tục rèn luyện hằng ngày. Thành tích là thói quen.", author: "Aristotle" },
                        { text: "Đừng mong ước cuộc đời sẽ dễ dàng hơn, hãy nỗ lực giúp trí óc bản thân thấu suốt và nghị lực hơn.", author: "Jim Rohn" }
                      ];
                      const activeQuote = STUDY_QUOTES[quoteIndex] || STUDY_QUOTES[0];
                      return (
                        <div className="space-y-1.5 py-1 text-left">
                          <p className="font-hand text-[17px] sm:text-[18px] leading-relaxed text-rose-950 font-black italic">
                            "{activeQuote.text}"
                          </p>
                          <span className="block text-[10px] text-rose-800/60 font-sans font-bold text-right italic">
                            — {activeQuote.author}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* 4. POMODORO FOCUS MACHINE (HỘP TẬP TRUNG RÈN LUYỆN) */}
                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-300 relative overflow-hidden shadow-[3px_3px_0_rgba(100,116,139,0.15)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                      <span className="text-xs uppercase font-black text-slate-700 flex items-center gap-1.5">
                        ⏱️ Hộp Tập Trung (Pomodoro)
                      </span>

                      {/* Mode toggle selectors */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setPomoIsActive(false);
                            setPomoMode('Focus');
                            setPomoTimeLeft(1500); // 25 Min
                          }}
                          className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded ${
                            pomoMode === 'Focus' ? "bg-slate-700 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Tập Trung
                        </button>
                        <button
                          onClick={() => {
                            setPomoIsActive(false);
                            setPomoMode('Break');
                            setPomoTimeLeft(300); // 5 Min
                          }}
                          className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded ${
                            pomoMode === 'Break' ? "bg-teal-700 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Giải Lao
                        </button>
                      </div>
                    </div>

                    {/* Timer digital dial content design */}
                    <div className="flex items-center justify-between gap-4 bg-white p-2.5 rounded-xl border border-slate-200 mb-2">
                      <div className="flex flex-col">
                        <span className="font-mono text-2xl font-black text-slate-800 tracking-tight leading-none">
                          {Math.floor(pomoTimeLeft / 60).toString().padStart(2, '0')}:
                          {(pomoTimeLeft % 60).toString().padStart(2, '0')}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 mt-1 leading-none">
                          {pomoMode === 'Focus' ? "🔥 TRONG CHU KỲ TẬP TRUNG" : "☕ GIẢI LAO PHỤC HỒI"}
                        </span>
                      </div>

                      {/* Primary controls */}
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setPomoIsActive(!pomoIsActive)}
                          className={`px-3.5 py-1.5 text-[10px] font-black uppercase rounded-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1 ${
                            pomoIsActive 
                              ? "bg-rose-600 text-white hover:bg-rose-700" 
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          {pomoIsActive ? "Tử đầu" : "Bắt đầu"}
                        </button>

                        <button
                          onClick={() => {
                            setPomoIsActive(false);
                            setPomoTimeLeft(pomoMode === 'Focus' ? 1500 : 300);
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-250 border border-slate-200 text-slate-700 text-[10px] uppercase font-bold rounded-lg cursor-pointer transition-all active:scale-95"
                          title="Thiết lập lại đồng hồ số"
                        >
                          Làm lại
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-400 leading-tight select-none">
                    * Đeo tai nghe, bật nhạc Lofi và tập trung cao độ. Khi đồng hồ chạy hết 25 phút, hệ thống sẽ tự chép 1 dòng Event "Tập trung sâu" vào Dấu chân rèn luyện!
                  </p>
                </div>
              </div>

              {/* TODAY'S TO-DO CHECKLIST WIDGET */}
              <div className="space-y-3 bg-[#e0f2fe]/20 p-4 rounded-xl border border-dashed border-sky-300 relative">
                <div className="flex items-center justify-between border-b border-sky-300/40 pb-2">
                  <span className="text-xs uppercase font-black text-[#0369a1] flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-[#0284c7]" /> What’s the next thing to do? ({todoTasks.length})
                  </span>
                  
                  {setTasks && (
                    <button
                      onClick={() => setShowAddTaskInline(!showAddTaskInline)}
                      className="text-[10px] py-1 px-2.5 bg-[#f0f9ff] border border-[#0284c7]/20 text-[#0369a1] hover:bg-[#e0f2fe] rounded-md transition-all uppercase font-black tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      {showAddTaskInline ? <X size={10} /> : <Plus size={10} />} Thêm việc
                    </button>
                  )}
                </div>

                {showAddTaskInline && (
                  <form onSubmit={handleAddTaskInline} className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-[#0284c7]/30 shadow-xs">
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={newTaskContent}
                        onChange={(e) => setNewTaskContent(e.target.value)}
                        placeholder="Nội dung công việc..."
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#222]/15 rounded-lg focus:outline-none focus:border-sky-500 font-sans text-ink"
                        required
                      />
                      <select
                        value={newTaskPriority}
                        onChange={(e: any) => setNewTaskPriority(e.target.value)}
                        className="px-2 py-1.5 text-xs bg-white border border-[#222]/15 rounded-lg focus:outline-none font-bold text-ink cursor-pointer"
                      >
                        <option value="Low">Thấp</option>
                        <option value="Medium">Trung</option>
                        <option value="High">Cao</option>
                      </select>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between pt-1 border-t border-dashed border-sky-100">
                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <span className="text-[9px] font-black uppercase text-ink/40 tracking-wider shrink-0">Thuộc Mục tiêu:</span>
                        <select
                          value={newTaskGoalId}
                          onChange={(e) => setNewTaskGoalId(e.target.value)}
                          className="w-full sm:w-44 text-[10px] py-1 px-1.5 bg-slate-50 border border-ink/10 rounded-md focus:outline-none text-ink truncate font-sans font-bold cursor-pointer"
                        >
                          <option value="">(Không thuộc mục tiêu nào)</option>
                          {goals.filter(g => !g.isCompleted).map(g => (
                            <option key={g.id} value={g.id}>{g.title}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={!newTaskContent.trim()}
                        className="w-full sm:w-auto px-4 py-1.5 bg-ink text-white font-black text-[10px] rounded-lg hover:bg-[#af1e2d] transition-colors disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider cursor-pointer"
                      >
                        Xác nhận
                      </button>
                    </div>
                  </form>
                )}

                {todoTasks.length === 0 ? (
                  <p className="text-xs italic text-ink/40 font-hand text-center py-2">
                    Không có việc nào trong danh sách. Thật thảnh thơi!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Active Goals as Parent items */}
                    {goals.filter(g => !g.isCompleted).map(goal => {
                      const goalTasks = todoTasks.filter(t => t.goalId === goal.id);
                      const sortedSubtasks = [...goalTasks].sort((a,b) => {
                        const w = { 'High': 3, 'Medium': 2, 'Low': 1 };
                        return w[b.priority] - w[a.priority];
                      });

                      if (sortedSubtasks.length === 0) return null;

                      return (
                        <div key={goal.id} className="bg-white/40 p-3 rounded-lg border border-sky-200/50 space-y-2">
                          {/* Goal Parent Row */}
                          <div className="flex items-center justify-between border-b border-sky-100/60 pb-1">
                            <span className="text-[11px] uppercase font-black text-[#0369a1] tracking-wide truncate">
                              🎯 Mục tiêu: {goal.title}
                            </span>
                            
                            {setTasks && (
                              <button
                                onClick={() => {
                                  setNewTaskGoalId(goal.id);
                                  setShowAddTaskInline(true);
                                }}
                                className="text-[8px] font-black text-sky-600 hover:text-sky-800 flex items-center gap-0.5 cursor-pointer bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 transition-colors"
                              >
                                <Plus size={8} /> Thêm việc
                              </button>
                            )}
                          </div>

                          {/* Subtasks under this Goal */}
                          <div className="space-y-1.5 pl-3 border-l border-dashed border-sky-300/40">
                            {sortedSubtasks.map(t => (
                              <div key={t.id} className="flex items-center justify-between gap-3 p-0.5 rounded-lg hover:bg-white/40 group/todo">
                                <button
                                  onClick={() => handleToggleTaskInline(t.id)}
                                  className="flex items-center gap-2 text-left min-w-0"
                                >
                                  <span className={`w-3.5 h-3.5 rounded border border-[#1a1a1a] flex items-center justify-center cursor-pointer transition-colors shrink-0 ${t.completed ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white"}`}>
                                    {t.completed && <Check size={8} strokeWidth={4} />}
                                  </span>
                                  <span className={`text-sm font-hand text-lg text-ink/90 truncate leading-none ${t.completed ? "line-through opacity-45" : ""}`}>
                                    {t.content}
                                  </span>
                                  <span className={`text-[7px] uppercase font-black px-1 py-0.2 rounded-xs scale-90 origin-left shrink-0 ${
                                    t.priority === "High" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                                    t.priority === "Medium" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                    "bg-slate-50 text-slate-500 border border-slate-200"
                                  }`}>
                                    {t.priority === "High" ? "Cao" : t.priority === "Medium" ? "Trung" : "Thấp"}
                                  </span>
                                </button>
                                
                                {setTasks && (
                                  <button
                                    onClick={() => handleDeleteTaskInline(t.id)}
                                    className="opacity-0 group-hover/todo:opacity-100 hover:text-crimson text-ink/30 p-0.5 rounded transition-opacity cursor-pointer animate-in fade-in"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* General Free Tasks */}
                    {(() => {
                      const activeGoals = goals.filter(g => !g.isCompleted);
                      const freeTasks = todoTasks.filter(t => !t.goalId || !activeGoals.some(g => g.id === t.goalId));
                      const sortedFree = [...freeTasks].sort((a,b) => {
                        const w = { 'High': 3, 'Medium': 2, 'Low': 1 };
                        return w[b.priority] - w[a.priority];
                      });

                      if (sortedFree.length === 0) return null;

                      return (
                        <div className="bg-white/40 p-3 rounded-lg border border-slate-200/50 space-y-2">
                          {/* Free Row */}
                          <div className="flex items-center justify-between border-b border-slate-100/60 pb-1">
                            <span className="text-[11px] uppercase font-black text-slate-600 tracking-wide truncate">
                              📋 Việc lẻ tự do / Khác
                            </span>
                          </div>

                          <div className="space-y-1.5 pl-3 border-l border-dashed border-slate-300/40">
                            {sortedFree.map(t => (
                              <div key={t.id} className="flex items-center justify-between gap-3 p-0.5 rounded-lg hover:bg-white/40 group/todo">
                                <button
                                  onClick={() => handleToggleTaskInline(t.id)}
                                  className="flex items-center gap-2 text-left min-w-0"
                                >
                                  <span className={`w-3.5 h-3.5 rounded border border-[#1a1a1a] flex items-center justify-center cursor-pointer transition-colors shrink-0 ${t.completed ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white"}`}>
                                    {t.completed && <Check size={8} strokeWidth={4} />}
                                  </span>
                                  <span className={`text-sm font-hand text-lg text-ink/90 truncate leading-none ${t.completed ? "line-through opacity-45" : ""}`}>
                                    {t.content}
                                  </span>
                                  <span className={`text-[7px] uppercase font-black px-1 py-0.2 rounded-xs scale-90 origin-left shrink-0 ${
                                    t.priority === "High" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                                    t.priority === "Medium" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                    "bg-slate-50 text-slate-500 border border-slate-200"
                                  }`}>
                                    {t.priority === "High" ? "Cao" : t.priority === "Medium" ? "Trung" : "Thấp"}
                                  </span>
                                </button>
                                
                                {setTasks && (
                                  <button
                                    onClick={() => handleDeleteTaskInline(t.id)}
                                    className="opacity-0 group-hover/todo:opacity-100 hover:text-crimson text-ink/30 p-0.5 rounded transition-opacity cursor-pointer animate-in fade-in"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* JOURNAL LOGS AND REFLECTIONS LIST (THE ACTUAL DIARY CORES) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-ink/10 pb-2">
                  <span className="text-xs uppercase font-black text-ink/70 flex items-center gap-1.5 font-sans">
                    <Sparkles className="w-3.5 h-3.5 text-crimson" /> Đúc Kết & Bài Học Đáng Giá ({currentPage.logs.length})
                  </span>
                  
                  {setLogs && (
                    <button
                      onClick={() => {
                        setShowQuickEntry(!showQuickEntry);
                        // Default to lesson icon
                        setNewEntryType('Reflection');
                        setNewEntryEmoji('💡');
                      }}
                      className="text-[10px] py-1 px-2.5 bg-ink text-paper hover:bg-ink/90 rounded-md transition-all uppercase font-bold tracking-wider flex items-center gap-1"
                    >
                      {showQuickEntry ? <X size={10} /> : <Plus size={10} />} {showQuickEntry ? "Ẩn" : "Gieo Đúc Kết"}
                    </button>
                  )}
                </div>

                {/* Quick write expanded form if active */}
                {showQuickEntry && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#fffbeb] p-3.5 rounded-xl border-2 border-ink shadow-xs space-y-3"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-black text-ink/40 tracking-widest block mb-1">Chọn kiểu tri thức cần ghi nhận</span>
                      <div className="grid grid-cols-3 gap-1.5 mb-2 bg-paper/25 p-1 rounded-xl border border-ink/5">
                        {[
                          { label: "💡 Bài Học", desc: "Rút kinh nghiệm", type: "Reflection" as const, emoji: "💡" },
                          { label: "🚀 Ý Tưởng", desc: "Đột phá sáng tạo", type: "Event" as const, emoji: "🚀" },
                          { label: "🔮 Nhắc Nhở", desc: "Lời dặn ngày mai", type: "Reflection" as const, emoji: "🔮" },
                        ].map(item => {
                          const isSelected = newEntryEmoji === item.emoji;
                          return (
                            <button
                              key={item.emoji}
                              type="button"
                              onClick={() => {
                                setNewEntryType(item.type);
                                setNewEntryEmoji(item.emoji);
                              }}
                              className={`p-2 flex flex-col items-center gap-0.5 rounded-lg border-2 text-center transition-all cursor-pointer ${
                                isSelected 
                                  ? "bg-white border-crimson font-black text-ink shadow-xs scale-102" 
                                  : "bg-white/40 border-ink/5 text-ink/65 hover:border-ink/20"
                              }`}
                            >
                              <span className="text-xs font-black uppercase tracking-tight">{item.label}</span>
                              <span className="text-[8px] font-sans font-medium leading-none text-ink/45">{item.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <textarea
                      value={newEntryContent}
                      onChange={(e) => setNewEntryContent(e.target.value)}
                      placeholder={
                        newEntryEmoji === '💡' ? "Tôi đã học được bài học, kiến thức hay mẹo rèn luyện gì tuyệt vời hôm nay..." :
                        newEntryEmoji === '🚀' ? "Để tối ưu đột phá, hôm nay tôi có ý tưởng thiết thực nào..." :
                        "Tâm sự, lời nhắn nhủ nhắc nhở bản thân để ngày mai phát huy phong độ tốt nhất..."
                      }
                      className="w-full min-h-[90px] p-2 bg-white rounded border border-ink/15 text-sm focus:outline-none focus:border-ink/50 resize-none font-hand text-lg placeholder:font-sans placeholder:text-xs text-ink placeholder:text-ink/40 leading-relaxed"
                    />

                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        onClick={() => setShowQuickEntry(false)}
                        className="px-2.5 py-1 bg-white border border-ink/10 rounded hover:bg-ink/5"
                      >
                        Bỏ qua
                      </button>
                      <button
                        onClick={() => handleAddQuickEntry(currentPage.date)}
                        disabled={!newEntryContent.trim()}
                        className="px-3.5 py-1 bg-ink text-paper font-black rounded hover:bg-ink/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <Send size={10} /> Lưu đúc kết
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Logs Listing container */}
                {currentPage.logs.length === 0 ? (
                  <div className="text-center py-6 px-4 border border-dashed border-ink/10 rounded-xl bg-ink/5 italic font-hand text-ink/40 text-base leading-relaxed">
                    Hôm nay chưa thu hoạch được đúc kết hay bài học giá trị nào. Bấm nút "Gieo Đúc Kết" phía trên để ghi chép nhanh nhé!
                  </div>
                ) : (
                  <div className="space-y-3.5 pl-3 border-l-2 border-dashed border-ink/15 py-1">
                    {currentPage.logs.map((log, idx) => (
                      <div key={log.id || idx} className="relative group/log">
                        <span className="absolute -left-[23px] bg-paper text-sm p-0.5 rounded-full ring-4 ring-white border border-ink/10 flex items-center justify-center w-5.5 h-5.5 shadow-xs">
                          {log.emoji || log.icon || "📝"}
                        </span>
                        
                        <div className="flex items-start justify-between gap-4 ml-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-hand text-[17px] md:text-[19px] leading-7 text-ink/90 whitespace-pre-wrap">
                              {log.type === "Event" && (
                                <span className="font-sans font-black uppercase text-[8px] tracking-wider mr-2 bg-ink/10 px-1 py-0.5 rounded text-ink/70">
                                  {log.time || "Sự kiện"}
                                </span>
                              )}
                              {log.content}
                            </p>
                          </div>
                          
                          {setLogs && (
                            <button
                              onClick={() => handleDeleteQuickEntry(log.id)}
                              className="opacity-0 group-hover/log:opacity-100 hover:text-crimson text-ink/30 p-0.5 rounded hover:bg-ink/5 transition-all outline-none shrink-0"
                              title="Xóa dòng"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* COMPACT & POLISHED SCRAPBOOK FOOTPRINTS FOOTER */}
              {countOfTotalRecords > 0 && (
                <div className="border-t-2 border-dashed border-ink/10 pt-5 mt-8 relative">
                  <div className="absolute top-[-11px] left-6 bg-[#fffbeb] px-3 py-0.5 border border-ink/15 rounded-full text-[9px] uppercase font-black text-ink/50 tracking-wider">
                     🌱 Dấu chân tích lũy ({countOfTotalRecords} hoạt động)
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                    {/* Thói quen hoàn thành */}
                    {currentPage.habitCompletions.length > 0 && (
                      <div className="bg-[#eef2ff]/40 p-3 rounded-xl border border-indigo-100/50 space-y-1.5 hover:bg-[#eef2ff]/70 transition-all">
                        <span className="text-[10px] uppercase font-black tracking-widest text-[#4f46e5] flex items-center gap-1.5">
                          <CheckSquare size={11} className="text-indigo-600" /> Thói quen tốt ({currentPage.habitCompletions.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentPage.habitCompletions.map(({ habit, streak }, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 bg-white border border-indigo-100/40 px-2 py-0.5 rounded text-[11px] text-indigo-900 shadow-xs font-semibold">
                              <span>{habit.icon || "⏳"}</span>
                              <span>{habit.name}</span>
                              {streak > 1 && (
                                <span className="text-[8px] text-indigo-700 bg-indigo-50 px-1 rounded font-black">{streak} ngày</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Từ vựng */}
                    {currentPage.wordsReviewed.length > 0 && (
                      <div className="bg-[#ecfdf5]/40 p-3 rounded-xl border border-emerald-100/50 space-y-1.5 hover:bg-[#ecfdf5]/70 transition-all">
                        <span className="text-[10px] uppercase font-black tracking-widest text-emerald-800 flex items-center gap-1.5">
                          <BookOpen size={11} className="text-emerald-700" /> Vốn từ học tập ({currentPage.wordsReviewed.length})
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {currentPage.wordsReviewed.map((w, idx) => (
                            <span key={idx} className="bg-white text-emerald-800 text-[10px] px-2 py-0.5 rounded border border-emerald-100/40 font-bold shadow-xs">
                              {w.vocabulary}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Chi tiêu */}
                    {currentPage.purchased.length > 0 && (
                      <div className="bg-[#fffbeb]/50 p-3 rounded-xl border border-amber-500/50 space-y-1.5 hover:bg-[#fffbeb]/80 transition-all">
                        <span className="text-[10px] uppercase font-black tracking-widest text-amber-800 flex items-center gap-1.5">
                          <DollarSign size={11} className="text-amber-700" /> Chi tiêu phát sinh ({currentPage.purchased.length})
                        </span>
                        <ul className="space-y-1">
                          {currentPage.purchased.map((item, idx) => (
                            <li key={idx} className="text-[11px] text-ink/80 flex justify-between gap-2 bg-white/80 border border-amber-200/20 px-2 py-1 rounded shadow-xs font-medium">
                              <span className="truncate max-w-[150px]">{item.content}</span>
                              <span className="font-mono text-[9px] bg-amber-100 px-1.5 rounded font-black text-amber-950">
                                {item.price ? `${item.price.toLocaleString('vi-VN')} đ` : "Đã sắm"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Địa điểm */}
                    {currentPage.placesVisited.length > 0 && (
                      <div className="bg-[#fff1f2]/40 p-3 rounded-xl border border-rose-100/50 space-y-1.5 hover:bg-[#fff1f2]/70 transition-all">
                        <span className="text-[10px] uppercase font-black tracking-widest text-[#be123c] flex items-center gap-1.5">
                          <MapPin size={11} className="text-rose-600" /> Thăm thú ghé qua ({currentPage.placesVisited.length})
                        </span>
                        <div className="space-y-1">
                          {currentPage.placesVisited.map((p, idx) => (
                            <div key={idx} className="text-[11px] text-rose-950 bg-white/80 p-1.5 rounded border border-rose-100/35 shadow-xs">
                              <span className="font-bold">📍 {p.name}</span>
                              {p.review && <span className="text-[10px] text-ink/65 font-hand italic block mt-0.5">"{p.review}"</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hoạt động phụ / Nhiệm vụ thành tựu */}
                    {(currentPage.tasksDone.length > 0 || currentPage.achievementsEarned.length > 0) && (
                      <div className="md:col-span-2 border-t border-dashed border-ink/10 pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentPage.tasksDone.length > 0 && (
                          <div className="space-y-1 bg-sky-50/20 p-2.5 rounded-xl border border-sky-100/30">
                            <span className="text-[9px] uppercase font-black text-sky-800 tracking-wider block mb-1">Mục tiêu ngày hoàn tất:</span>
                            <ul className="space-y-0.5">
                              {currentPage.tasksDone.map((t, idx) => (
                                <li key={idx} className="text-[11px] text-sky-950 truncate flex items-center gap-1.5 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                  <span className="line-through decoration-emerald-300">{t.content}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {currentPage.achievementsEarned.length > 0 && (
                          <div className="space-y-1 bg-amber-50/20 p-2.5 rounded-xl border border-amber-100/30">
                            <span className="text-[9px] uppercase font-black text-[#b45309] tracking-wider block mb-1">Danh hiệu đạt được:</span>
                            {currentPage.achievementsEarned.map((ach, idx) => (
                              <div key={idx} className="bg-white/80 p-1 rounded text-[10px] border border-amber-100/40 flex gap-1.5 items-center shadow-xs">
                                <span>🏅</span>
                                <div className="min-w-0">
                                  <strong className="text-amber-900 leading-tight block truncate font-black">{ach.title}</strong>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* COZY AI COMPANION (COORDINATED WITH THE DAY) */}
              <div className="bg-[#fffdf8] rounded-xl border border-ink/15 p-4 mt-2 hover:bg-[#fffff4] transition-all shadow-xs">
                <div className="flex items-center justify-between border-b border-ink/10 pb-2 mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-black text-ink/60">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span>Góc Nhìn Số Chủ Đạo, Venus & Cung Mọc</span>
                  </div>
                  
                  {aiInsights[currentPage.date] && (
                    <span className="text-[9px] uppercase tracking-widest text-[#b45309] bg-[#fffbeb] px-2 py-0.5 rounded-full border border-amber-200/50 font-bold">
                      {aiInsights[currentPage.date].title || "Góc nhìn Số 7"}
                    </span>
                  )}
                </div>

                {aiInsights[currentPage.date] ? (
                  <div className="space-y-3 font-sans text-ink">
                    <div className="relative pl-4 border-l-2 border-amber-300">
                      <Quote className="w-3 h-3 text-ink/10 absolute left-0.5 top-0 rotate-180" />
                      <p className="font-hand text-lg leading-relaxed text-ink/80 italic whitespace-pre-line pl-1">
                        {aiInsights[currentPage.date].summary}
                      </p>
                    </div>

                    {aiInsights[currentPage.date].suggestions && aiInsights[currentPage.date].suggestions.length > 0 && (
                      <div className="text-[10px] text-ink/60 space-y-1 border-t border-dashed border-ink/5 pt-2">
                        <span className="font-bold text-ink/70 uppercase text-[9px] block">💡 Điểm gợi mở góc nhìn hôm nay:</span>
                        {aiInsights[currentPage.date].suggestions.map((s, idx) => (
                          <div key={idx} className="flex items-start gap-1">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{s}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end border-t border-dashed border-ink/5 mt-2 pt-1.5">
                      <button
                        onClick={() => fetchAIInsight(currentPage)}
                        disabled={loadingInsight}
                        className="text-[9px] font-black uppercase text-ink/40 hover:text-ink transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${loadingInsight ? "animate-spin" : ""}`} /> Thể hiện góc nhìn mới (Thần Số Học)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3 px-3 bg-white/40 rounded-lg border border-dashed border-ink/10">
                    <p className="text-[10px] text-ink/50 max-w-sm mx-auto mb-2 leading-relaxed">
                      Phân tích tổng hòa Nhân số học &amp; Chiêm tinh học (Hài hòa Số Chủ Đạo 7 kết hợp với Sao Kim &amp; Cung Mọc hộ mệnh) sẽ xâu chuỗi thói quen học tập, năng lực và tâm bút của hôm nay để phản chiếu những bài học thấu suốt.
                    </p>
                    <button
                      onClick={() => fetchAIInsight(currentPage)}
                      disabled={loadingInsight}
                      className="py-1 px-4 text-[10px] uppercase font-black bg-[#fbcfe8] hover:bg-[#fbcfe8]/80 text-ink rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer border border-ink/15 shadow-xs"
                    >
                      {loadingInsight ? (
                        <>
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Chắp bút thấu ngộ...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-2.5 h-2.5" /> Khám phá chiêm nghiệm Số 7
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Pagination helper badge */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-ink/10 relative z-10 text-[10px] font-mono select-none font-bold text-ink/35">
              <button
                onClick={() => currentPageIndex > 0 && setCurrentPageIndex(p => p - 1)}
                disabled={currentPageIndex === 0}
                className="hover:text-ink transition-colors disabled:opacity-30 disabled:pointer-events-none uppercase flex items-center gap-1 shrink-0"
              >
                <ChevronLeft size={12} /> Bài trước
              </button>
              
              <span>TRANG {currentPageIndex + 1} / {pages.length}</span>

              <button
                onClick={() => currentPageIndex < pages.length - 1 && setCurrentPageIndex(p => p + 1)}
                disabled={currentPageIndex === pages.length - 1}
                className="hover:text-ink transition-colors disabled:opacity-30 disabled:pointer-events-none uppercase flex items-center gap-1 shrink-0"
              >
                Bài sau <ChevronRight size={12} />
              </button>
            </div>

          </div>

          {/* NEW SECTION: Bảng Kê Chi Tiêu Thẻ Tín Dụng directly on Today page */}
          <div className="bg-white/95 shadow-lg p-5 rounded-2xl border-2 border-indigo-600 relative overflow-hidden animate-in fade-in duration-500">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-indigo-600" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-2 border-b-2 border-indigo-100 gap-4">
               <div className="flex items-center gap-2.5">
                  <button className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-sm">
                    <CreditCard size={18} />
                  </button>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tight text-indigo-700 font-sans flex items-center gap-1.5">
                      Tiêu dùng &amp; Nợ thẻ tín dụng (Credit Card Logs)
                    </h3>
                    <p className="text-[9px] font-bold text-ink/40 uppercase tracking-widest">{justCardRangeText}</p>
                  </div>
               </div>
            </div>

            <div className="bg-indigo-50/40 p-3 rounded-xl overflow-hidden mb-4 border border-indigo-100">
              <div className="overflow-x-auto max-w-full">
                <table className="min-w-full text-left border-collapse text-xs text-ink/80">
                  <thead>
                    <tr className="bg-indigo-100/70 text-[8px] font-black uppercase tracking-widest text-indigo-800 border-b border-indigo-200">
                      <th className="px-3 py-2 font-black w-36">Ngày</th>
                      <th className="px-3 py-2 text-right font-black">Số Tiền (VND)</th>
                      <th className="px-3 py-2 text-center font-black w-10">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="font-sans divide-y divide-indigo-100/50">
                    {bulkCardSpends.map((item, idx) => (
                      <tr key={item.id} className="transition-colors hover:bg-indigo-50/30">
                        <td className="px-2 py-1.5">
                          <input 
                            type="date" 
                            value={item.name} 
                            onChange={e => {
                              const newSpends = [...bulkCardSpends];
                              newSpends[idx].name = e.target.value;
                              if (idx === 0 && e.target.value) {
                                try {
                                  const baseDate = new Date(e.target.value + "T12:00:00");
                                  if (!isNaN(baseDate.getTime())) {
                                    for (let i = 1; i < newSpends.length; i++) {
                                      const nextDate = new Date(baseDate.getTime());
                                      nextDate.setDate(baseDate.getDate() + i);
                                      newSpends[i].name = nextDate.toISOString().split("T")[0];
                                    }
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                              setBulkCardSpends(newSpends);
                            }} 
                            className="w-[125px] font-bold text-ink bg-white border border-ink/10 rounded-md px-2 py-0.5 outline-none focus:border-indigo-600 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input 
                            type="text" 
                            value={item.amount} 
                            onChange={e => {
                              const valStr = e.target.value.replace(/,/g, '');
                              if (!/^-?\d*$/.test(valStr)) return;
                              
                              let formatted = "";
                              if (valStr === "-") {
                                formatted = "-";
                              } else if (valStr) {
                                const isNeg = valStr.startsWith("-");
                                const cleanDigits = valStr.replace('-', '');
                                if (cleanDigits) {
                                  const parsedVal = parseInt(cleanDigits, 10);
                                  if (!isNaN(parsedVal)) {
                                    formatted = (isNeg ? "-" : "") + parsedVal.toLocaleString('en-US');
                                  }
                                }
                              }
                              const newSpends = [...bulkCardSpends];
                              newSpends[idx].amount = formatted;
                              setBulkCardSpends(newSpends);
                            }} 
                            placeholder="0"
                            className="w-full text-right font-mono font-bold text-indigo-700 bg-white border border-ink/10 rounded-md px-2 py-0.5 outline-none focus:border-indigo-600 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            onClick={() => {
                              const newSpends = bulkCardSpends.filter(s => s.id !== item.id);
                              setBulkCardSpends(newSpends);
                            }}
                            className="p-1 text-[#e11d48] hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Xóa dòng"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-indigo-100/40 font-bold text-indigo-800 border-t border-indigo-200 font-sans text-xs">
                      <td className="px-3 py-2">
                        <span className="uppercase text-[8px] tracking-widest font-black block">Tổng Nợ Thẻ Đã Tiêu</span>
                        <span className="text-indigo-950/40 text-[8px] font-medium italic">
                          {(() => {
                            const count = bulkCardSpends.filter(d => d.amount.trim() && !isNaN(parseFloat(d.amount.replace(/,/g, '')))).length;
                            return `* ${count}/${bulkCardSpends.length} ngày có dữ liệu`;
                          })()}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-black text-xs text-indigo-700">
                        {(() => {
                          const rawSum = bulkCardSpends.reduce((sum, item) => sum + (parseFloat(item.amount.replace(/,/g, '')) || 0), 0);
                          const formatted = Math.abs(rawSum).toLocaleString('vi-VN');
                          return `+${formatted} đ`;
                        })()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Action Panel */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-emerald-50/50 border border-dashed border-emerald-200 rounded-xl">
              <p className="text-[10px] text-emerald-950 font-sans leading-relaxed text-center sm:text-left flex-1 font-bold">
                ⚡ <strong>Tự động đồng bộ:</strong> Toàn bộ chi tiêu thẻ hàng ngày ở trên đang được cộng dồn & cập nhật trực tiếp thành một khoản nợ trong Sổ Tài Sản. Net Worth sẽ tự tính toán real-time mà không cần thao tác bấm Lưu!
              </p>
              
              <div className="flex gap-1.5 shrink-0 w-full sm:w-auto justify-end items-center">
                 <button 
                   onClick={() => {
                     let nextDateStr = "";
                     if (bulkCardSpends.length > 0) {
                       const lastDateStr = bulkCardSpends[bulkCardSpends.length - 1].name;
                       try {
                         const d = new Date(lastDateStr + "T12:00:00");
                         if (!isNaN(d.getTime())) {
                           d.setDate(d.getDate() + 1);
                           nextDateStr = d.toISOString().split("T")[0];
                         }
                       } catch {}
                     }
                     if (!nextDateStr) {
                       nextDateStr = new Date().toISOString().split("T")[0];
                     }
                     setBulkCardSpends([
                       ...bulkCardSpends,
                       {
                         id: Date.now() + Math.random(),
                         name: nextDateStr,
                         amount: "",
                         notes: ""
                       }
                     ]);
                   }}
                   className="py-1 px-3 text-[10px] font-bold bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg cursor-pointer transition-all flex items-center gap-1 animate-pulse"
                 >
                   <Plus size={10} /> Thêm Ngày
                 </button>
                 <button 
                   onClick={handleResetBulkCardSpends}
                   className="text-[10px] py-1 px-3 font-bold uppercase tracking-wider text-[#1a2530] hover:bg-neutral-50 rounded-lg cursor-pointer transition-all border border-ink/15"
                 >
                   Reset
                 </button>
                 <div className="py-1 px-3.5 flex items-center gap-1.5 text-[10px] rounded-lg bg-emerald-600 text-white font-black uppercase tracking-wider select-none shadow-[2px_2px_0_rgba(16,185,129,0.2)]">
                   <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                   <span>✓ Đã liên kết nợ tự động</span>
                 </div>
              </div>
            </div>
          </div>
          </>

        </div>

      </div>

    </div>
  );
}
