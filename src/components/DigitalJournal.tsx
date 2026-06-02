import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import type { LogEntry, Task, Achievement, StudyGoal, FoodPlace, AssetCategory } from "../types";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  Calendar as CalendarIcon, 
  Award, 
  BookOpen, 
  Sparkles, 
  Link2, 
  Coins, 
  MessageSquare, 
  MapPin, 
  Bookmark, 
  ChevronLeft, 
  ChevronRight,
  Heart,
  CreditCard,
  Receipt,
  Flame,
  Gift,
  Briefcase,
  X
} from "lucide-react";
import { useFirebase } from "../context/FirebaseContext";


const formatDateDot = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}.${month}.${year}`;
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}.${mm}.${yyyy}`;
    }
  } catch (err) {}
  return dateStr;
};

interface DigitalJournalProps {
  logs: LogEntry[];
  wishlist: any[];
  assets: any[];
  setAssets?: (assets: any[]) => void;
  categories?: any[];
  words: any[];
  places: FoodPlace[];
  setPlaces?: (places: FoodPlace[]) => void;
  ideas: any[];
  tasks?: Task[];
  setTasks?: (tasks: Task[]) => void;
  achievements?: Achievement[];
  goals?: StudyGoal[];
  setGoals?: (goals: StudyGoal[]) => void;
  setLogs?: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  
  bulkDebts: {id: number, name: string, amount: string, notes: string}[];
  setBulkDebts: React.Dispatch<React.SetStateAction<{id: number, name: string, amount: string, notes: string}[]>>;
  bulkCardSpends: {id: number, name: string, amount: string, notes: string}[];
  setBulkCardSpends: React.Dispatch<React.SetStateAction<{id: number, name: string, amount: string, notes: string}[]>>;
  bulkCurrentCash: Record<number, number>;
  setBulkCurrentCash: React.Dispatch<React.SetStateAction<Record<number, number>>>;
}

export function DigitalJournal({ 
  logs, 
  places = [],
  setPlaces,
  tasks = [], 
  setTasks,
  achievements = [], 
  goals = [], 
  setGoals,
  setLogs,
  assets = [],
  setAssets,
  categories = [],
  bulkDebts,
  setBulkDebts,
  bulkCardSpends,
  setBulkCardSpends,
  bulkCurrentCash,
  setBulkCurrentCash
}: DigitalJournalProps) {
  
  // ---------------- GLOBAL SYNCED CONTEXT ----------------
  const { 
    habits, 
    setHabits, 
    customRewards, 
    setCustomRewards,
    salaryInput,
    setSalaryInput,
    plannedExpenses,
    setPlannedExpenses
  } = useFirebase();

  // Local helper states for Salary Planner inline adding
  const [newExpName, setNewExpName] = useState("");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [newExpNotes, setNewExpNotes] = useState("");

  const totalPlannedOutflows = useMemo(() => {
    return plannedExpenses.reduce((sum, item) => {
      const parsed = parseFloat(item.amount.replace(/,/g, ''));
      return sum + (isNaN(parsed) ? 0 : parsed);
    }, 0);
  }, [plannedExpenses]);

  const totalSalIncome = useMemo(() => {
    const parsed = parseFloat(salaryInput.replace(/,/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }, [salaryInput]);

  const remainingBalance = totalSalIncome - totalPlannedOutflows;

  const percentageSpent = totalSalIncome > 0 ? (totalPlannedOutflows / totalSalIncome) * 100 : 0;

  const handleAddPlannedExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpName.trim()) return;
    const newExpense = {
      id: `pe-${Date.now()}-${Math.random()}`,
      name: newExpName.trim(),
      amount: newExpAmount || "0",
      notes: newExpNotes.trim()
    };
    setPlannedExpenses([...plannedExpenses, newExpense]);
    setNewExpName("");
    setNewExpAmount("");
    setNewExpNotes("");
  };

  const handleRemovePlannedExpense = (id: string) => {
    setPlannedExpenses(plannedExpenses.filter(pe => pe.id !== id));
  };

  const handleResetSalaryPlanner = () => {
    setSalaryInput("15,000,000");
    setPlannedExpenses([
      { id: "pe-1", name: "Tiền thuê nhà / phòng", amount: "3,500,000", notes: "Thanh toán cố định đầu tháng" },
      { id: "pe-2", name: "Chi phí ăn uống sinh hoạt", amount: "3,000,000", notes: "Ngân sách ăn uống ước tính" },
      { id: "pe-3", name: "Cước phí dịch vụ (Điện, nước, net)", amount: "800,000", notes: "Thanh toán hóa đơn hàng tháng" },
      { id: "pe-4", name: "Học tập & Sách vở", amount: "1,200,000", notes: "Luyện tiếng Anh và phát triển cá nhân" },
      { id: "pe-5", name: "Tích lũy tài sản / Tiết kiệm", amount: "3,000,000", notes: "Khoản để riêng đầu tư" }
    ]);
    setNewExpName("");
    setNewExpAmount("");
    setNewExpNotes("");
  };

  const [newRewardTitle, setNewRewardTitle] = useState("");
  const [newRewardDesc, setNewRewardDesc] = useState("");
  const [newRewardEmoji, setNewRewardEmoji] = useState("🎁");

  const [rewardPopup, setRewardPopup] = useState<{ id: string, emoji: string, title: string, desc: string } | null>(null);

  // ---------------- INTERACTIVE MINI-CALENDAR STATE ----------------
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => new Date().toISOString().split("T")[0]);
  const [isCalendarDetailsOpen, setIsCalendarDetailsOpen] = useState(false);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarContainerRef.current && !calendarContainerRef.current.contains(event.target as Node)) {
        setIsCalendarDetailsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Quick Log entry state for interactive calendar
  const [quickLogContent, setQuickLogContent] = useState("");
  const [quickLogType, setQuickLogType] = useState<'Reflection' | 'Event'>('Reflection');
  const [quickLogEmoji, setQuickLogEmoji] = useState("📝5");

  // ---------------- COMPACT TASK ADD STATE ----------------
  const [newTaskContent, setNewTaskContent] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newTaskGoalId, setNewTaskGoalId] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  // ---------------- TODAY'S HABITS STATE & SYNC ----------------
  // Synced from useFirebase context

  const handleToggleHabitFromHome = (habitId: string) => {
    const todayKey = new Date().toISOString().split("T")[0];
    let triggeredReward = null;
    let habitName = "";

    const updatedHabits = habits.map(h => {
      if (h.id === habitId) {
        const dailyHistory = { ...(h.history[todayKey] || {}) };
        const times = h.reminderTimes && h.reminderTimes.length > 0 ? h.reminderTimes : ["08:00"];
        const someUnchecked = times.some((t: string) => !dailyHistory[t]);
        habitName = h.name;
        
        times.forEach((t: string) => {
          dailyHistory[t] = someUnchecked;
        });

        const updatedHistory = {
          ...h.history,
          [todayKey]: dailyHistory
        };

        let newStreak = h.streak;
        let isCompletedToday = someUnchecked;
        
        if (isCompletedToday) {
          newStreak = h.streak + 1;
          triggeredReward = { type: "streak", streakVal: newStreak };
        } else {
          newStreak = Math.max(0, h.streak - 1);
        }

        return {
          ...h,
          history: updatedHistory,
          streak: newStreak,
          maxStreak: Math.max(h.maxStreak || 0, newStreak),
          lastCompletedDate: isCompletedToday ? todayKey : h.lastCompletedDate
        };
      }
      return h;
    });

    setHabits(updatedHabits);
    localStorage.setItem("studyHub_habits", JSON.stringify(updatedHabits));

    if (triggeredReward) {
      const lockedRewards = customRewards.filter(r => !r.isUnlocked);
      let selectedReward;
      if (lockedRewards.length > 0) {
        selectedReward = lockedRewards[Math.floor(Math.random() * lockedRewards.length)];
        const updatedRewards = customRewards.map(r => r.id === selectedReward.id ? { ...r, isUnlocked: true, unlockedAt: new Date().toLocaleDateString("vi-VN") } : r);
        setCustomRewards(updatedRewards);
      } else {
        selectedReward = customRewards[Math.floor(Math.random() * customRewards.length)];
      }
      if (selectedReward) {
        setRewardPopup({
          id: Date.now().toString() + "_" + selectedReward.id,
          emoji: selectedReward.emoji,
          title: `🔥 Chuỗi ${triggeredReward.streakVal} Ngày: ${selectedReward.title}`,
          desc: `Tuyệt vời duy trì thói quen "${habitName}" liên tục! Phần thưởng của bạn: ${selectedReward.desc}`
        });
      }
    }

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (err) {}

    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.75 },
        colors: ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"]
      });
    } catch (e) {}
  };

  // ---------------- PERSONAL TIPS & HACKS TABLE STATE ----------------
  const [isPersonalOpen, setIsPersonalOpen] = useState(true);
  const [showAddTip, setShowAddTip] = useState(false);
  const [tipDesc, setTipDesc] = useState("");
  const [tipCategory, setTipCategory] = useState("Tips");
  const [tipLink, setTipLink] = useState("");
  const [tipPrice, setTipPrice] = useState("");
  const [tipNotes, setTipNotes] = useState("");
  const [editingTipId, setEditingTipId] = useState<string | null>(null);
  const [tipSearch, setTipSearch] = useState("");

  // Filter food places mapping to personalized space
  // Stored within the synced places context with tags / specific properties
  const tipsAndTricks = useMemo(() => {
    return places.filter(p => p.tags?.includes("personal_tip") || p.category === "Other" || !p.category);
  }, [places]);

  const filteredTips = useMemo(() => {
    if (!tipSearch.trim()) return tipsAndTricks;
    const s = tipSearch.toLowerCase();
    return tipsAndTricks.filter(t => 
      t.name.toLowerCase().includes(s) || 
      t.address?.toLowerCase().includes(s) || 
      t.notes?.toLowerCase().includes(s)
    );
  }, [tipsAndTricks, tipSearch]);

  // ---------------- MINI CALENDAR CALCULATION ----------------
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Start index (0: Sunday, 1: Monday, ... 6: Saturday)
    // We want Monday-start, but Sunday-start matches standard calendar nicely
    const startOffset = firstDay.getDay(); 
    
    const cells = [];
    
    // Previous month filler cells
    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: null, dateStr: null });
    }
    
    // Days of month
    for (let d = 1; d <= totalDays; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      cells.push({ day: d, dateStr });
    }
    
    return cells;
  }, [currentMonth]);

  const changeMonth = (direction: number) => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);
    setCurrentMonth(next);
  };

  // ---------------- QUICK LOG INLINE ACTION ----------------
  const handleAddQuickLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLogContent.trim() || !setLogs) return;

    const newLog: LogEntry = {
      id: "log_" + Date.now(),
      date: selectedDateStr,
      content: quickLogContent.trim(),
      type: quickLogType,
      emoji: quickLogType === "Reflection" ? "💭" : "🔔",
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };

    setLogs(prev => [...prev, newLog]);
    setQuickLogContent("");
  };

  const handleDeleteLog = (id: string) => {
    if (!setLogs) return;
    if (confirm("Xóa sự kiện này khỏi nhật ký?")) {
      setLogs(prev => prev.filter(l => l.id !== id));
    }
  };

  // ---------------- TASKS CHECKOUT ACTIONS ----------------
  const handleToggleTask = (id: string) => {
    if (!setTasks || !tasks) return;
    const taskObj = tasks.find(t => t.id === id);
    if (!taskObj) return;

    const nextCompleted = !taskObj.completed;

    const updated = tasks.map(t => {
      if (t.id === id) {
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? Date.now() : undefined
        };
      }
      return t;
    });

    setTasks(updated);

    if (nextCompleted) {
      if (setLogs) {
        const associatedGoal = goals.find(g => g.id === taskObj.goalId);
        const newLog: LogEntry = {
          id: "task_complete_" + Date.now(),
          date: new Date().toISOString().split("T")[0],
          type: "Event",
          content: `Đã hoàn thành: "${taskObj.content}"${associatedGoal ? ` (${associatedGoal.title})` : ""}`,
          emoji: "🚀"
        };
        setLogs(prev => [...prev, newLog]);
      }

      // Add task completion to the Goal's internal journey tracking array
      if (taskObj.goalId && setGoals && goals) {
        const associatedGoal = goals.find(g => g.id === taskObj.goalId);
        if (associatedGoal) {
          const now = Date.now();
          const journeyItem = {
            id: `j_task_${taskObj.id}`,
            timestamp: now,
            content: `${taskObj.content}`
          };
          const updatedGoals = goals.map(g => {
            if (g.id === associatedGoal.id) {
              const currentJourney = g.journey || [];
              if (currentJourney.some(e => e.id === journeyItem.id)) return g;
              return {
                ...g,
                journey: [journeyItem, ...currentJourney]
              };
            }
            return g;
          });
          setGoals(updatedGoals);
        }
      }

      const lockedRewards = customRewards.filter(r => !r.isUnlocked);
      let selectedReward;
      if (lockedRewards.length > 0) {
        selectedReward = lockedRewards[Math.floor(Math.random() * lockedRewards.length)];
        const updatedRewards = customRewards.map(r => r.id === selectedReward.id ? { ...r, isUnlocked: true, unlockedAt: new Date().toLocaleDateString("vi-VN") } : r);
        setCustomRewards(updatedRewards);
      } else {
        selectedReward = customRewards[Math.floor(Math.random() * customRewards.length)];
      }
      if (selectedReward) {
        setRewardPopup({ id: Date.now().toString() + "_" + selectedReward.id, emoji: selectedReward.emoji, title: selectedReward.title, desc: selectedReward.desc });
      }
    } else {
      // Remove task completion from the Goal's internal journey tracking array when unchecked
      if (taskObj.goalId && setGoals && goals) {
        const updatedGoals = goals.map(g => {
          if (g.id === taskObj.goalId) {
            return {
              ...g,
              journey: (g.journey || []).filter(e => e.id !== `j_task_${taskObj.id}`)
            };
          }
          return g;
        });
        setGoals(updatedGoals);
      }
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim() || !setTasks) return;

    const taskObj: Task = {
      id: "task_" + Date.now(),
      content: newTaskContent.trim(),
      completed: false,
      priority: newTaskPriority,
      createdAt: Date.now(),
      goalId: newTaskGoalId || undefined
    };

    setTasks([taskObj, ...tasks]);
    setNewTaskContent("");
    setNewTaskGoalId("");
    setShowAddTask(false);
  };

  const handleDeleteTask = (id: string) => {
    if (!setTasks) return;
    setTasks(tasks.filter(t => t.id !== id));
  };

  // ---------------- PERSONAL SPACE MUTATIONS (PLACES BACKEND) ----------------
  const handleSaveTip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipDesc.trim() || !setPlaces) return;

    const parsedPrice = parseFloat(tipPrice.replace(/,/g, "")) || 0;

    if (editingTipId) {
      const updated = places.map(p => p.id === editingTipId ? {
        ...p,
        name: tipDesc.trim(),
        address: tipCategory, // "Mục nào" maps to custom address slot
        link: tipLink.trim() || undefined,
        price: parsedPrice || undefined,
        notes: tipNotes.trim() || undefined
      } : p);
      setPlaces(updated);
      setEditingTipId(null);
    } else {
      const newTip: FoodPlace = {
        id: "tip_" + Date.now(),
        name: tipDesc.trim(),
        category: "Other",
        status: "Want to visit",
        rating: 5,
        address: tipCategory, // mapping category slot to address description field
        link: tipLink.trim() || undefined,
        price: parsedPrice || undefined,
        notes: tipNotes.trim() || undefined,
        tags: ["personal_tip"] // special flag tag
      };
      setPlaces([newTip, ...places]);
    }

    // Reset state fields
    setTipDesc("");
    setTipCategory("Tips");
    setTipLink("");
    setTipPrice("");
    setTipNotes("");
    setShowAddTip(false);
  };

  const handleStartEditTip = (tip: FoodPlace) => {
    setEditingTipId(tip.id);
    setTipDesc(tip.name);
    setTipCategory(tip.address || "Tips");
    setTipLink(tip.link || "");
    setTipPrice(tip.price ? tip.price.toString() : "");
    setTipNotes(tip.notes || "");
    setShowAddTip(true);
  };

  const handleDeleteTip = (id: string) => {
    if (!setPlaces) return;
    if (confirm("Bạn có tin chắc muốn xóa ghi chú mẹo/địa điểm này không?")) {
      setPlaces(places.filter(p => p.id !== id));
    }
  };

  const getTodayVietnameseDate = () => {
    const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const now = new Date();
    const dayName = days[now.getDay()];
    const date = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    return `${dayName}, ${date}/${month}/${year}`;
  };

  // Derived arrays
  const selectedDateLogs = useMemo(() => {
    return logs.filter(l => l.date === selectedDateStr);
  }, [logs, selectedDateStr]);

  
  const [taskFilter, setTaskFilter] = useState<string>("All");
  
  const activeTasks = useMemo(() => {
    return tasks.filter(t => !t.completed);
  }, [tasks]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 font-sans select-none space-y-8 animate-in fade-in duration-300">
      
      {/* 1. MOTIVATIONAL WELCOME HEADER - FULL WIDTH */}
      <div className="bg-[#fffdf5] p-6 md:p-8 rounded-3xl sketch-border border-amber-200/80 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
         <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(circle_at_left,_var(--tw-gradient-stops))] from-amber-100 via-transparent to-transparent"></div>
         
         <div className="relative z-10 text-center md:text-left space-y-1.5 flex-1 min-w-0">
           <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#d97706] bg-amber-100/50 px-3 py-1 rounded-full border border-amber-200/30 inline-block font-sans">
             {getTodayVietnameseDate()}
           </span>
           <h1 className="font-sans text-2xl md:text-3xl font-black uppercase tracking-wider text-amber-955 flex items-center justify-center md:justify-start gap-2.5 mt-1">
             <Sparkles size={24} className="text-amber-500 animate-pulse shrink-0" />
             Welcome Home
           </h1>
           <p className="text-xs font-medium text-amber-900/70 font-sans max-w-xl truncate sm:overflow-visible sm:whitespace-normal">
              Chào mừng quay trở lại! Chúc bạn ngày mới năng lượng, giữ vững thói quen và hoàn thành mục tiêu đặt ra.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap justify-center gap-3 shrink-0">
            {/* Metric 1 */}
            <div className="bg-white/95 border border-rose-200/60 hover:border-rose-450 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-xs hover:shadow-sm hover:scale-[1.03] transition-all duration-200 text-left cursor-pointer group" title="Nhiệm vụ cần xử lý">
              <span className="p-1 px-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-mono font-black shrink-0 group-hover:bg-rose-100 transition-colors">
                {tasks.filter(t => !t.completed).length}
              </span>
              <div>
                <p className="text-[9px] text-[#4b5563] uppercase font-black tracking-wider leading-none">Nhiệm vụ</p>
                <p className="text-xs font-extrabold text-ink leading-tight mt-0.5">Cần xử lý</p>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white/95 border border-orange-200/60 hover:border-orange-450 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-xs hover:shadow-sm hover:scale-[1.03] transition-all duration-200 text-left cursor-pointer group" title="Thói quen rèn luyện hôm nay">
              <span className="p-1 px-2 bg-orange-50 text-orange-600 rounded-lg text-xs font-mono font-black shrink-0 group-hover:bg-orange-100 transition-colors">
                {(() => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  const habitsDoneToday = habits.filter(h => h.isActive && h.history?.[todayStr]?.done).length;
                  return habitsDoneToday;
                })()}
              </span>
              <div>
                <p className="text-[9px] text-[#4b5563] uppercase font-black tracking-wider leading-none">Thói quen</p>
                <p className="text-xs font-extrabold text-ink leading-tight mt-0.5">Hoàn tất hôm nay</p>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white/95 border border-emerald-200/60 hover:border-emerald-450 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-xs hover:shadow-sm hover:scale-[1.03] transition-all duration-200 text-left cursor-pointer group" title="Tổng tài sản lưu lũy">
              <span className="p-1 px-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-mono font-black shrink-0 group-hover:bg-emerald-100 transition-colors">
                {(() => {
                  const totalVndValue = assets.reduce((sum, curr) => {
                    if (curr.excludeFromNetWorth) return sum;
                    const val = curr.value || 0;
                    return curr.isDebt ? sum - val : sum + val;
                  }, 0);
                  const millionVal = Math.floor(totalVndValue / 1000000);
                  return `${millionVal.toLocaleString()}M`;
                })()}
              </span>
              <div>
                <p className="text-[9px] text-[#4b5563] uppercase font-black tracking-wider leading-none">Tài sản ròng</p>
                <p className="text-xs font-extrabold text-ink leading-tight mt-0.5">Giá trị VND</p>
              </div>
            </div>
          </div>
       </div>

      {/* THREE-COLUMN GRID: COMPACT TASKS (col-span-4), HABITS OVERVIEW (col-span-4), CALENDAR (col-span-4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 pb-6 border-b-2 border-ink/5">

        {/* COLUMN 1: COMPACT TASKS */}
        <div className="lg:col-span-4 space-y-4">
          

          <div className="bg-[#fffdf5] p-4.5 rounded-3xl sketch-border border-amber-200/80 space-y-3.5 shadow-sm relative overflow-hidden flex flex-col h-full min-h-[350px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between border-b pb-2.5 border-amber-200/50 gap-2 relative z-10 font-sans">
              <span className="text-[10px] sm:text-xs uppercase font-black tracking-widest text-amber-900 flex items-center gap-1.5 shrink-0">
                <span className="p-1 px-1.5 bg-amber-100 rounded-lg text-amber-600">
                  <Check size={14} className="stroke-[3]" />
                </span>
                Next To Do
              </span>
              
              <div className="flex items-center gap-1">
                <button onClick={() => setShowAddTask(!showAddTask)} className="p-1 hover:bg-amber-500 hover:text-white rounded-lg border border-amber-300 text-amber-600 bg-white shadow-xs shrink-0 transition-colors">
                  <Plus size={12} className={showAddTask ? "rotate-45" : ""} />
                </button>
              </div>
            </div>

            {/* Quick compact task filtering within card */}
            <div className="relative z-10 font-sans">
              <select
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value)}
                className="w-full px-2.5 py-1 text-[9px] uppercase font-bold text-amber-900 bg-white border border-amber-200 rounded-md outline-none tracking-widest cursor-pointer hover:bg-amber-50 transition-colors"
              >
                <option value="All">Tất Cả Kế Hoạch</option>
                <option value="Priority:High">⚠️ Ưu tiên Cao</option>
                <option value="Priority:Medium">⚡ Ưu tiên Trung</option>
                <option value="Priority:Low">🌱 Ưu tiên Thấp</option>
                {goals.map(g => <option key={g.id} value={"Goal:" + g.id}>🎯 {g.title}</option>)}
              </select>
            </div>

            {showAddTask && (
              <form onSubmit={handleAddTask} className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 flex flex-col gap-2 relative z-10 font-sans">
                <input
                  type="text"
                  placeholder="Tôi sẽ bắt tay làm gì..."
                  value={newTaskContent}
                  onChange={e => setNewTaskContent(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white rounded-lg border border-amber-200 outline-none w-full font-bold text-amber-950 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  required
                />
                <div className="flex gap-1.5">
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as any)}
                    className="px-1.5 py-1 text-[9px] bg-white text-amber-900 font-bold rounded border border-amber-200 outline-none uppercase"
                  >
                    <option value="High">Cao</option>
                    <option value="Medium">Trung</option>
                    <option value="Low">Thấp</option>
                  </select>
                  <button type="submit" className="flex-1 py-1 bg-amber-600 text-white font-black text-[9px] uppercase tracking-widest rounded hover:bg-amber-700 shadow-xs transition-colors">
                    Thêm
                  </button>
                </div>
              </form>
            )}

            {/* Compact tasks list display with scrollbar */}
            <div className="relative z-10 flex-1 overflow-y-auto max-h-[220px] custom-scrollbar pr-1 font-sans">
              {activeTasks.filter(t => {
                if (taskFilter === "All") return true;
                if (taskFilter.startsWith("Priority:")) return t.priority === taskFilter.split(":")[1];
                if (taskFilter.startsWith("Goal:")) return t.goalId === taskFilter.split(":")[1];
                return true;
              }).length === 0 ? (
                <div className="text-center py-8 select-none">
                  <span className="text-2xl block opacity-80">🌱</span>
                  <p className="text-[9px] font-sans font-bold uppercase tracking-wider text-amber-800/50 mt-1">Sẵn sàng bắt đầu việc mới.</p>
                </div>
              ) : (
                <div className="space-y-1.5 pb-2">
                  {activeTasks.filter(t => {
                    if (taskFilter === "All") return true;
                    if (taskFilter.startsWith("Priority:")) return t.priority === taskFilter.split(":")[1];
                    if (taskFilter.startsWith("Goal:")) return t.goalId === taskFilter.split(":")[1];
                    return true;
                  }).map(task => {
                    const priorityStyles = 
                      task.priority === "High" ? "bg-red-50 text-crimson border-red-200" :
                      task.priority === "Medium" ? "bg-amber-50 text-amber-600 border-amber-200" :
                      "bg-emerald-50 text-emerald-700 border-emerald-200";
                    const targetGoal = goals.find(g => g.id === task.goalId);

                    return (
                      <div 
                        key={task.id} 
                        className="flex items-center justify-between bg-white px-2.5 py-2 rounded-xl border border-amber-100 hover:border-amber-200 transition-all group shadow-2xs"
                      >
                        <div className="flex gap-2 min-w-0 flex-1 pr-1 items-center">
                          <button
                            onClick={() => handleToggleTask(task.id)}
                            className="w-4 h-4 rounded hover:border-emerald-500 bg-amber-50/50 border border-amber-200 shrink-0 cursor-pointer flex items-center justify-center"
                          ></button>
                          
                          <div className="min-w-0 text-left flex-1">
                            <p className="font-bold text-[11px] text-amber-950 leading-tight truncate group-hover:text-amber-700 transition-colors" title={task.content}>
                              {task.content}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 font-sans">
                          <span className={`text-[7px] font-black uppercase px-1 py-0.2 rounded border ${priorityStyles} font-mono tracking-wider shrink-0`}>
                            {task.priority[0]}
                          </span>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 hover:bg-rose-50 rounded-md hover:text-crimson text-amber-900/30 cursor-pointer shrink-0 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: DAILY HABITS */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#fffdfa] p-4.5 rounded-3xl sketch-border border-orange-200/80 space-y-3.5 shadow-sm relative overflow-hidden flex flex-col h-full min-h-[350px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between border-b pb-2.5 border-orange-200/50 gap-2 relative z-10 font-sans">
              <span className="text-[10px] sm:text-xs uppercase font-black tracking-widest text-[#9a3412] flex items-center gap-1.5 shrink-0">
                <span className="p-1 px-1.5 bg-orange-50 rounded-lg text-orange-600">
                  <Flame size={14} className="stroke-[3] text-orange-500 animate-pulse" />
                </span>
                Thói Quen Mỗi Ngày
              </span>

              <span className="text-[9px] font-bold text-orange-700 bg-orange-100/50 rounded-full px-2 py-0.5 font-mono">
                {(() => {
                  const todayKey = new Date().toISOString().split("T")[0];
                  const activeHabitsList = habits.filter(h => h.isActive);
                  const doneCount = activeHabitsList.filter(h => {
                    const dailyHistory = h.history[todayKey] || {};
                    const times = h.reminderTimes && h.reminderTimes.length > 0 ? h.reminderTimes : ["08:00"];
                    return times.every((t: string) => dailyHistory[t]);
                  }).length;
                  return `${doneCount}/${activeHabitsList.length}`;
                })()} Đã Xong
              </span>
            </div>

            <p className="text-[10px] text-orange-900/60 leading-normal relative z-10 font-sans">
              Nhấp để hoàn thành nhanh thói quen ngày hôm nay.
            </p>

            {/* Habits checklist with custom active tracking */}
            <div className="relative z-10 flex-1 overflow-y-auto max-h-[220px] custom-scrollbar pr-1 font-sans">
              {habits.filter(h => h.isActive).length === 0 ? (
                <div className="text-center py-8 select-none">
                  <span className="text-2xl block opacity-80">☕</span>
                  <p className="text-[9px] font-sans font-bold uppercase tracking-wider text-orange-850/50 mt-1">Chưa thiết lập thói quen nào.</p>
                </div>
              ) : (
                <div className="space-y-1.5 pb-2">
                  {habits.filter(h => h.isActive).map(habit => {
                    const todayKey = new Date().toISOString().split("T")[0];
                    const dailyHistory = habit.history[todayKey] || {};
                    const times = habit.reminderTimes && habit.reminderTimes.length > 0 ? habit.reminderTimes : ["08:00"];
                    const isCompletedToday = times.every((t: string) => dailyHistory[t]);

                    return (
                      <div 
                        key={habit.id}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer group shadow-2xs ${
                          isCompletedToday 
                            ? "bg-emerald-50/70 border-emerald-200 text-emerald-950 font-medium font-sans" 
                            : "bg-white border-orange-100 hover:border-orange-250 text-orange-950 font-sans"
                        }`}
                        onClick={() => handleToggleHabitFromHome(habit.id)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 border-2 ${
                            isCompletedToday 
                              ? "bg-emerald-500 border-emerald-600 text-white" 
                              : "bg-orange-50/50 border-orange-200 group-hover:border-orange-400"
                          }`}>
                            {isCompletedToday && <Check size={10} className="stroke-[4]" />}
                          </span>

                          <div className="truncate min-w-0 text-left">
                            <span className="text-[11.5px] font-bold block truncate">
                              {habit.icon} {habit.name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 pl-1 font-sans">
                          {habit.streak > 0 && (
                            <span className="flex items-center gap-0.5 text-[9px] font-black text-orange-600 bg-orange-100/50 px-1.5 py-0.2 rounded-md font-mono" title={`Chuỗi tích lũy ${habit.streak} ngày!`}>
                              🔥 {habit.streak}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* COLUMN 3: MINI CALENDAR */}
        <div className="lg:col-span-4 space-y-4">
          <div ref={calendarContainerRef} className="bg-white/90 p-4.5 rounded-3xl sketch-border border-ink shadow-sm relative flex flex-col min-h-[350px]">
            
            <div className="flex items-center justify-between border-b pb-2.5 border-ink/15 font-sans">
              <span className="text-xs uppercase font-extrabold tracking-wider text-ink flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-crimson" /> 
                Calendar
              </span>
              
              <div className="flex items-center gap-1">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-ink/5 rounded-lg border border-ink/15 transition-all"><ChevronLeft size={14} /></button>
                <span className="text-xs font-black uppercase tracking-wider text-ink/80 px-2 leading-none font-sans select-none min-w-[75px] text-center">
                  {currentMonth.toLocaleDateString("vi-VN", { month: "short", year: "numeric" })}
                </span>
                <button onClick={() => changeMonth(1)} className="p-1 hover:bg-ink/5 rounded-lg border border-ink/15 transition-all"><ChevronRight size={14} /></button>
              </div>
            </div>

            {/* Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] uppercase text-ink/40">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(h => <span key={h}>{h}</span>)}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 text-center relative z-10">
              {calendarDays.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDateStr;
                const matchesToday = cell.dateStr === new Date().toISOString().split("T")[0];
                const dayLogs = cell.dateStr ? logs.filter(l => l.date === cell.dateStr) : [];
                const hasLogs = dayLogs.length > 0;

                return (
                  <button
                    key={idx}
                    disabled={!cell.day}
                    onClick={() => { 
                      if (cell.dateStr) { 
                        setSelectedDateStr(cell.dateStr); 
                        setIsCalendarDetailsOpen(true);
                      } 
                    }}
                    className={`h-8 font-sans text-xs font-bold rounded-xl transition-all relative flex flex-col items-center justify-center cursor-pointer ${
                      !cell.day 
                        ? "opacity-0" 
                        : isSelected 
                          ? "bg-ink text-[#fcfbf9] font-black scale-[1.05]" 
                          : matchesToday
                            ? "bg-rose-100/80 text-crimson border border-rose-250 font-black"
                            : "bg-white/50 hover:bg-ink/5 text-ink border border-ink/5"
                    }`}
                  >
                    <span>{cell.day}</span>
                    {hasLogs && (
                      <span className={`w-1 h-1 rounded-full absolute bottom-1 ${isSelected ? "bg-[#fcfbf9]" : "bg-crimson"}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Day Log Recap Detail Panel */}
            <div 
              className={`bg-[#fffdf5] rounded-xl border border-dashed border-amber-400 space-y-3 transition-all duration-300 origin-top overflow-hidden ${isCalendarDetailsOpen ? 'opacity-100 scale-y-100 mt-4 p-4' : 'opacity-0 scale-y-0 h-0 p-0 m-0 border-0'}`}
            >
              <div className="flex items-center justify-between border-b border-amber-200/40 pb-1.5">
                <span className="text-[10px] font-black uppercase text-amber-800 font-sans tracking-wide">
                  Chi tiết ngày: <strong className="text-ink">{selectedDateStr.split("-").reverse().join("/")}</strong>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-amber-700 font-mono bg-white px-1.5 py-0.5 rounded border border-amber-100">
                    {selectedDateLogs.length} sự kiện
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setIsCalendarDetailsOpen(false)}
                    className="p-1 hover:bg-amber-100 rounded text-amber-900 transition-colors cursor-pointer"
                    title="Đóng"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {selectedDateLogs.length === 0 ? (
                <p className="text-[11px] text-ink/45 font-hand italic leading-tight text-center py-2 select-none">
                  Chưa ghi ghép sự kiện gì vào ngày này. Hãy lưu nhanh ở dưới!
                </p>
              ) : (
                <div className="space-y-2 max-h-[145px] overflow-y-auto pr-1">
                  {selectedDateLogs.map(l => (
                    <div key={l.id} className="flex justify-between items-start text-xs bg-white/70 p-2 rounded-lg border border-amber-200/50 group/log line-clamp-3 leading-relaxed">
                      <div className="flex items-start gap-1.5 text-left min-w-0 flex-1">
                        <span className="shrink-0">{l.emoji || "📝"}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-ink break-words">{l.content}</p>
                          {l.time && <span className="font-mono text-[9px] text-[#0369a1] bg-[#e0f2fe] px-1 rounded block w-fit mt-0.5">{l.time}</span>}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteLog(l.id)}
                        className="p-1 hover:text-crimson opacity-0 group-hover/log:opacity-100 transition-opacity ml-1.5 cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Inline Log add Form */}
              <form onSubmit={handleAddQuickLog} className="flex gap-1.5 pt-2 border-t border-amber-200/30">
                <input
                  type="text"
                  value={quickLogContent}
                  onChange={(e) => setQuickLogContent(e.target.value)}
                  placeholder="Thêm nhanh ghi ghép/reflection cho ngày đã chọn..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white rounded-lg border border-amber-200/60 focus:outline-none focus:border-amber-400 font-sans text-ink"
                  required
                />
                
                <button
                  type="submit"
                  disabled={!quickLogContent.trim()}
                  className="px-3 py-1.5 bg-ink text-white font-extrabold text-[10px] rounded-lg hover:bg-amber-600 disabled:opacity-40 uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1 shrink-0"
                >
                  <Plus size={10} /> Lưu
                </button>
              </form>
            </div>
          </div>

          {/* UPCOMING EVENTS */}
          <div className="bg-white/90 p-5 rounded-2xl sketch-border border-ink/60 shadow-sm mt-4">
            <span className="text-xs uppercase font-extrabold tracking-wider text-rose-700 flex items-center gap-1.5 border-b pb-2.5 border-rose-200 mb-3">
              <Sparkles className="w-4 h-4 text-rose-500" />
              Sự Kiện Sắp Tới
            </span>
            <div className="space-y-2">
              {logs.filter(l => l.type === 'Event' && l.date >= new Date().toISOString().split("T")[0])
                .sort((a,b) => a.date.localeCompare(b.date))
                .slice(0, 3)
                .map(event => (
                  <div key={event.id} className="flex gap-2 items-start text-xs border-l-2 border-rose-400 pl-2">
                    <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">{event.date.slice(5).replace("-", "/")}</span>
                    <span className="text-ink truncate">{event.content}</span>
                  </div>
              ))}
              {logs.filter(l => l.type === 'Event' && l.date >= new Date().toISOString().split("T")[0]).length === 0 && (
                <p className="text-[10px] text-ink/40 font-hand italic">Không có sự kiện nào sắp tới.</p>
              )}
            </div>
          </div>
        </div>

      </div>{/* End of top grid */}

      {/* SECTION 2.2: CUSTOM GIFT CARDS & REWARDS POOL PANEL */}
      <div className="bg-[#fffcf4] p-6 rounded-3xl sketch-border border-[3px] border-amber-300 shadow-sm text-left mb-6 mt-4 w-full animate-in fade-in slide-in-from-bottom-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b-2 border-amber-200 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-100 rounded-xl text-amber-700 border border-amber-250 shrink-0">
              <Gift size={22} className="animate-bounce" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-amber-950 uppercase tracking-wide font-sans">
                Bể Thẻ Quà Tặng & Thẻ Tự Thưởng Tự Chọn 🎟️
              </h3>
              <p className="text-[11px] font-medium text-amber-800/80 mt-0.5 font-sans">
                Tự thiết kế quà tặng của riêng bạn (Trà sữa, xem phim, nghỉ ngơi...). Mở khóa ngẫu nhiên khi hoàn thành nhiệm vụ hoặc tích chuỗi streak thói quen!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm("Reset danh mục quà tặng về mặc định ban đầu?")) {
                localStorage.removeItem("studyHub_customRewardsList");
                window.location.reload();
              }
            }}
            className="px-2 py-1 text-[9px] font-bold text-amber-700 hover:text-white hover:bg-amber-700 bg-amber-50 border border-amber-250 transition-all rounded cursor-pointer"
          >
            Reset mẫu mặc định
          </button>
        </div>

        {/* Action form to add a customized reward card */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newRewardTitle.trim()) return;
            const newCard = {
              id: "custom_" + Date.now().toString(),
              emoji: newRewardEmoji.trim() || "🎁",
              title: newRewardTitle,
              desc: newRewardDesc,
              isUnlocked: false,
              isRedeemed: false
            };
            setCustomRewards([...customRewards, newCard]);
            setNewRewardTitle("");
            setNewRewardDesc("");
            setNewRewardEmoji("🎁");
          }}
          className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-4 p-4.5 bg-amber-50/50 rounded-2xl border border-dashed border-amber-200 items-end"
        >
          <div className="md:col-span-2 col-span-12">
            <label className="block text-[10px] font-black uppercase tracking-wider text-amber-900/60 mb-1 font-sans">Emoji</label>
            <input
              type="text"
              value={newRewardEmoji}
              onChange={(e) => setNewRewardEmoji(e.target.value)}
              placeholder="🎁"
              className="w-full px-3 py-1.5 text-center text-xs bg-white rounded-lg border border-amber-200 focus:outline-none focus:border-amber-400 font-mono text-ink"
              maxLength={4}
            />
          </div>
          <div className="md:col-span-4 col-span-12">
            <label className="block text-[10px] font-black uppercase tracking-wider text-amber-900/60 mb-1 font-sans">Tên Quà Tặng / Quyền Lợi</label>
            <input
              type="text"
              value={newRewardTitle}
              onChange={(e) => setNewRewardTitle(e.target.value)}
              placeholder="Ví dụ: Ly trà dâu tằm 40k"
              className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-amber-200 focus:outline-none focus:border-amber-400 font-sans text-ink"
              required
            />
          </div>
          <div className="md:col-span-4 col-span-12">
            <label className="block text-[10px] font-black uppercase tracking-wider text-amber-900/60 mb-1 font-sans">Mô tả chi tiết / Cách sử dụng</label>
            <input
              type="text"
              value={newRewardDesc}
              onChange={(e) => setNewRewardDesc(e.target.value)}
              placeholder="Phần thưởng sau khi đạt chuỗi hoặc tắt máy lúc 11h..."
              className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-amber-200 focus:outline-none focus:border-amber-400 font-sans text-ink"
            />
          </div>
          <div className="md:col-span-2 col-span-12">
            <button
              type="submit"
              className="w-full py-2 bg-amber-655 bg-amber-700 hover:bg-amber-800 text-white font-extrabold text-xs uppercase tracking-widest rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 shadow-sm"
            >
              <Plus size={12} /> Tạo thẻ mới
            </button>
          </div>
        </form>

        {/* Grid displays customizable certificates / coupons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {customRewards.map((reward) => (
            <div
              key={reward.id}
              className={`relative border-2 rounded-2xl p-4.5 flex flex-col justify-between overflow-hidden shadow-xs transition-all ${
                reward.isRedeemed
                  ? "bg-zinc-50 border-zinc-200 text-zinc-400 opacity-60"
                  : reward.isUnlocked
                  ? "bg-white border-amber-400 text-amber-950 focus-within:ring-2 focus-within:ring-amber-400"
                  : "bg-amber-50/15 border-dashed border-amber-200/50 text-amber-950/40"
              }`}
              style={{
                backgroundImage: reward.isUnlocked && !reward.isRedeemed
                  ? "radial-gradient(circle at top left, transparent 10px, transparent 10px), radial-gradient(circle at bottom right, transparent 10px, transparent 10px)"
                  : undefined
              }}
            >
              {/* Scissors Line Graphic to make it look like a nice ticket coupon */}
              {reward.isUnlocked && !reward.isRedeemed && (
                <div className="absolute right-3.5 top-0 bottom-0 w-0 border-r-2 border-dashed border-amber-200/80 pointer-events-none" />
              )}

              {/* Tag Header */}
              <div className="flex items-start justify-between gap-2.5">
                <span className="text-2xl select-none shrink-0" role="img" aria-label="gift icon">
                  {reward.emoji}
                </span>

                <div className="text-left flex-1 min-w-0">
                  <h4 className={`text-xs font-black font-sans leading-snug truncate ${reward.isUnlocked && !reward.isRedeemed ? 'text-amber-950' : 'text-amber-950/70'}`}>
                    {reward.title}
                  </h4>
                  <p className={`text-[10px] leading-tight font-medium font-sans mt-1 line-clamp-2 ${reward.isUnlocked && !reward.isRedeemed ? 'text-amber-800/80' : 'text-zinc-500/50'}`}>
                    {reward.desc || "Không có ghi chú thêm."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Xóa thẻ quà tặng "${reward.title}" khỏi bể thưởng?`)) {
                      setCustomRewards(customRewards.filter((r) => r.id !== reward.id));
                    }
                  }}
                  className="text-crimson hover:opacity-100 opacity-35 transition-all shrink-0 cursor-pointer p-0.5 hover:bg-rose-50 rounded"
                  title="Xóa quà"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Stamp or Footer elements */}
              <div className="mt-4 pt-3.5 border-t border-dashed border-amber-200/55 flex items-center justify-between gap-2">
                {reward.isRedeemed ? (
                  <div className="flex items-center gap-1.5 text-zinc-500 font-mono">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-zinc-100 border border-zinc-250 px-1.5 py-0.5 rounded italic">
                      ĐÃ SỬ DỤNG 🎉
                    </span>
                  </div>
                ) : reward.isUnlocked ? (
                  <div className="flex flex-col text-left">
                    <span className="text-[8px] uppercase tracking-widest font-black text-amber-600">Đã mở: {reward.unlockedAt || "Gần đây"}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = customRewards.map(r => r.id === reward.id ? { ...r, isRedeemed: true } : r);
                        setCustomRewards(updated);
                        try {
                          confetti({ particleCount: 60, spread: 50, colors: ["#fbbf24", "#f59e0b"] });
                        } catch(e){}
                      }}
                      className="mt-1 px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest rounded transition-all cursor-pointer shrink-0"
                    >
                      🎟️ Sử dụng quà
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col text-left">
                    <span className="text-[8px] leading-none uppercase tracking-wider font-extrabold text-zinc-400 bg-zinc-100/50 border border-dashed border-zinc-200 px-1.5 py-0.5 rounded">
                      🔒 CHƯA MỞ KHÓA
                    </span>
                  </div>
                )}
                
                <span className="text-[9px] font-mono font-bold text-amber-900/30">
                  {reward.isRedeemed ? "#REDEEMED" : reward.isUnlocked ? "#AVAILABLE" : "#LOCKED"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SALARY PROJECTION & BUDGET PLANNING ON HOME WINDOW */}
      <div className="bg-paper p-6 rounded-2xl sketch-border border-ink shadow-sm space-y-4 text-left mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b-2 border-ink/10 pb-4 gap-4 font-sans">
           <div className="flex items-center gap-3">
              <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-150">
                <Briefcase size={18} />
              </span>
              <div className="text-left font-sans">
                <h2 className="text-base font-black uppercase tracking-tight text-ink font-sans">Dự tính lương & Kế hoạch chi tiêu</h2>
                <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest font-sans">Lập ngân sách chủ động trước khi nhận lương</p>
              </div>
           </div>

           {/* Quick Stats Badges */}
           <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2 bg-emerald-50 p-2 px-3 rounded-xl sketch-border border-emerald-200">
                <div className="text-right">
                  <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Dự tính lương</p>
                  <div className="flex items-center gap-1.5 font-mono font-black text-xs text-emerald-700">
                    <input
                      type="text"
                      value={salaryInput}
                      onChange={e => {
                        const valStr = e.target.value.replace(/[^0-9]/g, "");
                        let formatted = "0";
                        if (valStr) {
                          const parsedVal = parseInt(valStr, 10);
                          if (!isNaN(parsedVal)) {
                            formatted = parsedVal.toLocaleString('en-US');
                          }
                        }
                        setSalaryInput(formatted);
                      }}
                      className="w-24 text-right bg-white border border-emerald-300 font-mono font-bold rounded px-1 py-0.5 outline-none focus:border-emerald-600 text-xs shadow-inner"
                      placeholder="0"
                    />
                    <span>đ</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-rose-50 p-2 px-3 rounded-xl sketch-border border-rose-200">
                <div className="text-right">
                  <p className="text-[8px] font-bold text-rose-600 uppercase tracking-widest font-sans">Tổng dự chi</p>
                  <p className="text-xs font-black text-rose-700 font-mono">
                    {totalPlannedOutflows.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </div>

              <div className={`flex items-center gap-2 p-2 px-3 rounded-xl sketch-border ${
                remainingBalance >= 0 
                  ? "bg-blue-50 border-blue-200 text-blue-700" 
                  : "bg-red-50 border-red-200 text-red-600 animate-pulse"
              }`}>
                <div className="text-right">
                  <p className="text-[8px] font-bold uppercase tracking-widest opacity-80 font-sans">Còn lại</p>
                  <p className="text-xs font-black font-mono">
                    {remainingBalance.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </div>
           </div>
        </div>

        {/* Visual Allocation Meter */}
        <div className="bg-white sketch-border p-4 rounded-xl">
          <div className="flex justify-between items-center text-xs mb-1.5 font-sans">
            <span className="font-bold text-ink/70">Tỷ lệ phân bổ ngân sách dự tính:</span>
            <span className={`font-mono font-black ${percentageSpent > 100 ? "text-rose-600" : "text-emerald-600"}`}>
              {percentageSpent.toFixed(1)}% {percentageSpent > 100 ? "(Vượt hạn mức!)" : ""}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-ink/10 shadow-inner flex">
            <div 
              style={{ width: `${Math.min(percentageSpent, 100)}%` }} 
              className={`h-full transition-all duration-500 ${
                percentageSpent > 100 ? "bg-rose-500" :
                percentageSpent > 80 ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
          </div>
          <p className="text-[10px] text-ink/50 mt-2 leading-relaxed italic">
            * Khuyên dùng: Giữ tổng dự chi dưới 80% lương để dành từ 20% lương gửi tiết kiệm, đầu tư tài sản dài hạn.
          </p>
        </div>

        {/* Expenses List Table */}
        <div className="bg-white/70 sketch-border p-4 rounded-xl overflow-hidden">
          <div className="overflow-x-auto max-w-full">
            <table className="min-w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-50 text-[9px] font-black uppercase tracking-widest text-emerald-800 border-b-2 border-emerald-200">
                  <th className="px-4 py-3 font-black w-56">Khoản Mục Dự Chi</th>
                  <th className="px-4 py-3 text-right font-black">Số Tiền (VND)</th>
                  <th className="px-4 py-3 text-center font-black w-14">Xóa</th>
                </tr>
              </thead>
              <tbody className="font-sans divide-y divide-emerald-100">
                {plannedExpenses.map((item, idx) => (
                  <tr key={item.id} className="transition-colors hover:bg-emerald-50/20">
                    <td className="px-4 py-2 font-bold text-ink hover:bg-slate-50 border-r border-transparent focus-within:border-emerald-500">
                      <input 
                        type="text" 
                        value={item.name} 
                        onChange={e => {
                          const newExp = [...plannedExpenses];
                          newExp[idx].name = e.target.value;
                          setPlannedExpenses(newExp);
                        }} 
                        className="w-full bg-transparent font-bold text-ink outline-none py-0.5 text-xs"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="text" 
                        value={
                          item.amount === "-" 
                            ? "-" 
                            : item.amount 
                              ? Number(item.amount.replace(/[^0-9-]/g, "")).toLocaleString("vi-VN") 
                              : ""
                        } 
                        onChange={e => {
                          const cleanVal = e.target.value.replace(/[^0-9-]/g, "");
                          if (!cleanVal) {
                            const newExp = [...plannedExpenses];
                            newExp[idx].amount = "";
                            setPlannedExpenses(newExp);
                            return;
                          }
                          const isNeg = cleanVal.startsWith("-");
                          const digits = cleanVal.replace("-", "");
                          const parsedVal = parseInt(digits, 10);
                          if (!isNaN(parsedVal)) {
                            const formatted = (isNeg ? "-" : "") + parsedVal.toLocaleString('en-US');
                            const newExp = [...plannedExpenses];
                            newExp[idx].amount = formatted;
                            setPlannedExpenses(newExp);
                          }
                        }} 
                        placeholder="0"
                        className="w-full text-right font-mono font-bold text-emerald-700 bg-white border border-ink/15 rounded-lg px-2.5 py-1 outline-none focus:border-emerald-600 text-xs shadow-inner"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleRemovePlannedExpense(item.id)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Xóa khoản dự chi"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Inline adder row */}
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td className="px-4 py-2.5 font-semibold text-ink">
                    <input 
                      type="text" 
                      value={newExpName} 
                      onChange={e => setNewExpName(e.target.value)} 
                      placeholder="Thêm khoản mới (Ví dụ: Tiệc tùng, mua sách...)"
                      className="w-full bg-white border border-ink/15 rounded-lg px-2.5 py-1 outline-none focus:border-slate-500 text-xs shadow-inner font-sans font-medium"
                    />
                  </td>
                  <td colSpan={2} className="px-4 py-2.5">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newExpAmount} 
                        onChange={e => {
                          const valStr = e.target.value.replace(/[^0-9]/g, "");
                          let formatted = "";
                          if (valStr) {
                            const parsedVal = parseInt(valStr, 10);
                            if (!isNaN(parsedVal)) {
                              formatted = parsedVal.toLocaleString('en-US');
                            }
                          }
                          setNewExpAmount(formatted);
                        }} 
                        placeholder="Số tiền (đ)"
                        className="flex-1 text-right font-mono font-bold text-slate-700 bg-white border border-ink/15 rounded-lg px-2.5 py-1 outline-none focus:border-slate-500 text-xs shadow-inner"
                      />
                      <button
                        onClick={handleAddPlannedExpense}
                        disabled={!newExpName.trim()}
                        className="p-1.5 bg-emerald-600 disabled:opacity-30 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                        title="Xác nhận thêm khoản"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-emerald-100 font-bold text-emerald-800 border-t-2 border-emerald-200">
                  <td className="px-4 py-2.5 font-sans">
                    <span className="uppercase text-[10px] tracking-widest font-black block">Tổng Dự Chi Tháng Này</span>
                    <span className="text-emerald-950/50 text-[10px] font-medium italic">
                      * Tổng {plannedExpenses.length} vị trí phân phối dòng tiền dự tính
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-xs" colSpan={2}>
                    {totalPlannedOutflows.toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action button panel */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-emerald-50/20 sketch-border border-dashed border-emerald-200 rounded-xl">
          <div className="text-center sm:text-left">
            <p className="text-xs text-ink/75 leading-relaxed font-sans">
              ℹ️ <strong>Mục Tiêu Tài Chính:</strong> Dự toán trước khi lương về ví sẽ hạn chế tối đa chi tiêu bừa bãi và xây dựng thói quen tích lũy tài sản dài hạn.
            </p>
          </div>
          
          <div className="flex gap-2 shrink-0">
             <button 
               onClick={handleResetSalaryPlanner}
               className="sketch-button text-xs py-2 px-6 font-bold uppercase tracking-widest text-ink bg-white hover:bg-emerald-50 cursor-pointer transition-all border border-ink/10"
             >
               Reset Bảng Lương
             </button>
          </div>
        </div>
      </div>

      {/* SECTION 2.5: CREDIT CARD & REVENUE STATEMENTS (BẢNG KÊ CHI TIÊU & DOANH THU) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-2">
        {/* LEFT CARD: BẢNG KÊ CHI TIÊU THẺ TÍN DỤNG */}
        <div className="bg-gradient-to-tr from-[#fcfdff] to-[#f5f8ff] p-6 rounded-2xl sketch-border border-ink shadow-sm space-y-4 text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-[#3b82f6] pb-2.5 gap-2">
            <div className="flex items-center gap-2 text-left">
              <span className="p-2 bg-[#dbeafe] rounded-xl text-[#1e40af] border border-blue-250">
                <CreditCard size={18} className="animate-pulse" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#1e40af] font-sans">
                  Bảng Kê Chi Tiêu Thẻ Tín Dụng
                </h3>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setBulkCardSpends([...bulkCardSpends, {
                    id: Date.now(),
                    name: new Date().toISOString().split("T")[0],
                    amount: "",
                    notes: ""
                  }]);
                }}
                className="px-2.5 py-1 text-[10px] bg-blue-50 text-blue-700 rounded-lg border border-blue-200 uppercase font-black tracking-widest hover:bg-[#1e40af] hover:text-white transition-all cursor-pointer flex items-center gap-1"
              >
                <Plus size={10} /> Thêm Dòng
              </button>
              <button
                onClick={() => {
                  if (confirm("Reset toàn bộ bảng kê chi tiêu thẻ tín dụng?")) {
                    setBulkCardSpends([]);
                  }
                }}
                className="px-2.5 py-1 text-[10px] bg-red-50 text-crimson rounded-lg border border-red-200 uppercase font-black tracking-widest hover:bg-crimson hover:text-white transition-all cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto scrollbar-thin">
            <table className="min-w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-blue-100/50 text-[#1e40af] font-bold uppercase tracking-wider text-[9px]">
                  <th className="px-3 py-2 w-32 border border-blue-100">Ngày / Tên</th>
                  <th className="px-3 py-2 w-40 border border-blue-100">Số Tiền (VND)</th>
                  <th className="px-3 py-2 border border-blue-100">Ghi Chú</th>
                  <th className="px-2 py-2 w-10 text-center border border-blue-100">Xóa</th>
                </tr>
              </thead>
              <tbody>
                {bulkCardSpends.map((item, index) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-1 border border-blue-100/50">
                      <div className="flex items-center justify-between gap-1 px-2.5 py-1 text-left relative">
                        <span className="text-xs font-black text-blue-950 font-mono">
                          {formatDateDot(item.name)}
                        </span>
                        <div className="relative w-5 h-5 flex items-center justify-center shrink-0 hover:bg-blue-100 rounded transition-all cursor-pointer">
                          <CalendarIcon size={12} className="text-blue-500 cursor-pointer" />
                          <input
                            type="date"
                            value={item.name}
                            onChange={(e) => {
                              const updated = [...bulkCardSpends];
                              updated[index].name = e.target.value;
                              setBulkCardSpends(updated);
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-1 border border-blue-100/50">
                      <input
                        type="text"
                        placeholder="Số tiền"
                        value={
                          item.amount === "-" 
                            ? "-" 
                            : item.amount 
                              ? Number(item.amount.replace(/[^0-9-]/g, "")).toLocaleString("vi-VN") 
                              : ""
                        }
                        onChange={(e) => {
                          const cleanVal = e.target.value.replace(/[^0-9-]/g, "");
                          if (!cleanVal) {
                            const updated = [...bulkCardSpends];
                            updated[index].amount = "";
                            setBulkCardSpends(updated);
                            return;
                          }
                          if (cleanVal === "-") {
                            const updated = [...bulkCardSpends];
                            updated[index].amount = "-";
                            setBulkCardSpends(updated);
                            return;
                          }
                          const isNeg = cleanVal.startsWith("-");
                          const digits = cleanVal.replace("-", "");
                          const parsedVal = parseInt(digits, 10);
                          if (!isNaN(parsedVal)) {
                            const formatted = (isNeg ? "-" : "") + parsedVal.toLocaleString('en-US');
                            const updated = [...bulkCardSpends];
                            updated[index].amount = formatted;
                            setBulkCardSpends(updated);
                          }
                        }}
                        className="w-full px-2 py-1.5 text-xs bg-transparent text-right font-bold text-indigo-950 focus:outline-none focus:bg-white rounded"
                      />
                    </td>
                    <td className="p-1 border border-blue-100/50">
                      <input
                        type="text"
                        placeholder="Chi tiết chi tiêu..."
                        value={item.notes || ""}
                        onChange={(e) => {
                          const updated = [...bulkCardSpends];
                          updated[index].notes = e.target.value;
                          setBulkCardSpends(updated);
                        }}
                        className="w-full px-2 py-1.5 text-xs bg-transparent text-left text-blue-900 focus:outline-none focus:bg-white rounded"
                      />
                    </td>
                    <td className="p-1 border border-blue-100/50 text-center">
                      <button
                        onClick={() => {
                          const updated = bulkCardSpends.filter((_, i) => i !== index);
                          setBulkCardSpends(updated);
                        }}
                        className="p-1.5 text-rose-300 hover:text-crimson hover:bg-rose-50 rounded transition-colors mx-auto"
                        title="Xóa hàng"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                {bulkCardSpends.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center p-4 text-[10px] text-blue-400 italic">
                      Dữ liệu trống. Nhấp "Thêm Dòng" để tạo bảng kê mới.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Sum footer */}
          <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-150">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-800">Tổng chi tiêu thẻ:</span>
            <span className="text-sm font-black text-[#1e40af] font-mono">
              {(() => {
                const total = bulkCardSpends.reduce((sum, d) => sum + parseFloat(d.amount.replace(/,/g, '') || "0"), 0);
                return total.toLocaleString("vi-VN") + " đ";
              })()}
            </span>
          </div>
        </div>

        {/* RIGHT CARD: BẢNG KÊ DOANH THU KHÁCH NỢ TUẦN QUA */}
        <div className="bg-gradient-to-tr from-[#fdfdfc] to-[#f4fbf7] p-6 rounded-2xl sketch-border border-ink shadow-sm space-y-4 text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-[#10b981] pb-2.5 gap-2">
            <div className="flex items-center gap-2 text-left">
              <span className="p-2 bg-[#d1fae5] rounded-xl text-[#065f46] border border-emerald-250">
                <Receipt size={18} className="animate-pulse" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#065f46] font-sans">
                  Doanh Thu
                </h3>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setBulkDebts([...bulkDebts, {
                    id: Date.now(),
                    name: new Date().toISOString().split("T")[0],
                    amount: "",
                    notes: ""
                  }]);
                }}
                className="px-2.5 py-1 text-[10px] bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 uppercase font-black tracking-widest hover:bg-emerald-700 hover:text-white transition-all cursor-pointer flex items-center gap-1"
              >
                <Plus size={10} /> Thêm Dòng
              </button>
              <button
                onClick={() => {
                  if (confirm("Đặt lại toàn bộ bảng kê doanh thu và khách nợ tuần này?")) {
                    setBulkDebts(bulkDebts.map(item => ({ ...item, amount: "", notes: "" })));
                  }
                }}
                className="px-2.5 py-1 text-[10px] bg-red-50 text-crimson rounded-lg border border-red-200 uppercase font-black tracking-widest hover:bg-crimson hover:text-white transition-all cursor-pointer"
              >
                Reset tuần
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto scrollbar-thin">
            <table className="min-w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-100/50 text-[#065f46] font-bold uppercase tracking-wider text-[9px]">
                  <th className="px-3 py-2 w-32 border border-emerald-100">Ngày / Tên</th>
                  <th className="px-3 py-2 w-40 border border-emerald-100">Số Tiền (VND)</th>
                  <th className="px-3 py-2 border border-emerald-100">Ghi Chú</th>
                  <th className="px-2 py-2 w-10 text-center border border-emerald-100">Xóa</th>
                </tr>
              </thead>
              <tbody>
                {bulkDebts.map((item, index) => {
                  return (
                    <tr key={item.id} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="p-1 border border-emerald-100/50">
                        <div className="flex items-center justify-between gap-1 px-2.5 py-1 text-left relative">
                          <span className="text-xs font-black text-emerald-950 font-mono">
                            {formatDateDot(item.name)}
                          </span>
                          <div className="relative w-5 h-5 flex items-center justify-center shrink-0 hover:bg-emerald-100 rounded transition-all cursor-pointer">
                            <CalendarIcon size={12} className="text-emerald-500 cursor-pointer" />
                            <input
                              type="date"
                              value={item.name}
                              onChange={(e) => {
                                const updated = [...bulkDebts];
                                updated[index].name = e.target.value;
                                setBulkDebts(updated);
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-1 border border-emerald-100/50">
                        <input
                          type="text"
                          placeholder="Số tiền"
                          value={
                            item.amount === "-" 
                              ? "-" 
                              : item.amount 
                                ? Number(item.amount.replace(/[^0-9-]/g, "")).toLocaleString("vi-VN") 
                                : ""
                          }
                          onChange={(e) => {
                            const cleanVal = e.target.value.replace(/[^0-9-]/g, "");
                            if (!cleanVal) {
                              const updated = [...bulkDebts];
                              updated[index].amount = "";
                              setBulkDebts(updated);
                              return;
                            }
                            if (cleanVal === "-") {
                              const updated = [...bulkDebts];
                              updated[index].amount = "-";
                              setBulkDebts(updated);
                              return;
                            }
                            const isNeg = cleanVal.startsWith("-");
                            const digits = cleanVal.replace("-", "");
                            const parsedVal = parseInt(digits, 10);
                            if (!isNaN(parsedVal)) {
                              const formatted = (isNeg ? "-" : "") + parsedVal.toLocaleString('en-US');
                              const updated = [...bulkDebts];
                              updated[index].amount = formatted;
                              setBulkDebts(updated);
                            }
                          }}
                          className="w-full px-2 py-1.5 text-xs bg-transparent text-right font-bold text-emerald-950 focus:outline-none focus:bg-white rounded"
                        />
                      </td>
                      <td className="p-1 border border-emerald-100/50">
                        <input
                          type="text"
                          placeholder="Nguồn thu / Tên khách nợ..."
                          value={item.notes || ""}
                          onChange={(e) => {
                            const updated = [...bulkDebts];
                            updated[index].notes = e.target.value;
                            setBulkDebts(updated);
                          }}
                          className="w-full px-2 py-1.5 text-xs bg-transparent text-left text-emerald-900 focus:outline-none focus:bg-white rounded"
                        />
                      </td>
                      <td className="p-1 border border-emerald-100/50 text-center">
                        <button
                          onClick={() => {
                            const updated = bulkDebts.filter((_, i) => i !== index);
                            setBulkDebts(updated);
                          }}
                          className="p-1.5 text-rose-300 hover:text-crimson hover:bg-rose-50 rounded transition-colors mx-auto"
                          title="Xóa hàng"
                        >
                          <Trash2 size={12} style={{ filter: 'url(#hand-drawn-filter)' }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {bulkDebts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center p-4 text-[10px] text-emerald-400 italic">
                      Dữ liệu trống. Nhấp "Thêm Dòng" để tạo bảng kê mới.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Sum footer */}
          <div className="flex items-center justify-between bg-emerald-50/50 p-3 rounded-xl border border-emerald-150">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#065f46]">Tổng:</span>
            <span className="text-sm font-black text-[#0f5132] font-mono">
              {(() => {
                const total = bulkDebts.reduce((sum, d) => sum + parseFloat(d.amount.replace(/,/g, '') || "0"), 0);
                return total.toLocaleString("vi-VN") + " đ";
              })()}
            </span>
          </div>
        </div>
      </div>

      {/* 3. ACHIEVEMENT WALL COMPONENT */}
      <div className="bg-white/80 p-6 rounded-2xl sketch-border border-dashed border-ink/30">
        <div className="flex items-center justify-between border-b-2 border-amber-400 pb-2 mb-4">
          <span className="text-xs uppercase font-black tracking-widest text-amber-700 flex items-center gap-1.5">
            <Award className="w-5 h-5 text-amber-500 shrink-0" />
            Thành Tựu Bền Bỉ Gặt Hái Được
          </span>
          <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
            {achievements.length} Huy chương đạt được
          </span>
        </div>

        {achievements.length === 0 ? (
          <div className="py-6 text-center select-none">
            <p className="text-xs text-ink/40 font-hand italic">
              Vun đắp thêm kế hoạch rèn luyện hàng ngày và hoàn thành mục tiêu để ghi nhận kỳ hiệu chiến tích đầu tiên nhé!
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 justify-start">
            {achievements.map((ach) => (
              <div 
                key={ach.id} 
                className="bg-amber-50/50 border border-amber-200 rounded-2xl px-4 py-3 min-w-[180px] flex items-center gap-3 shadow-2xs hover:scale-103 transition-transform relative overflow-hidden group/ach"
              >
                <div className="p-2.5 bg-amber-100 border border-amber-300 rounded-xl text-amber-600">
                  <Award size={18} className="animate-pulse" />
                </div>
                <div className="text-left">
                  <h4 className="font-extrabold text-xs text-amber-950 leading-none">{ach.title}</h4>
                  <p className="text-[10px] text-amber-800/70 py-0.5 leading-tight">{ach.description}</p>
                  {ach.unlockedAt && (
                    <span className="text-[8px] text-amber-600 bg-white border border-amber-100 rounded px-1 font-mono">
                      {new Date(ach.unlockedAt).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. PERSONAL TIPS, HACKS & PLACES LOGBOOK TABLE */}
      <div className="bg-white/95 p-6 rounded-2xl sketch-border border-ink shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pb-3.5 border-b border-ink/15 gap-3.5 cursor-pointer" onClick={() => setIsPersonalOpen(!isPersonalOpen)}>
          <div className="space-y-0.5">
            <span className="text-xs uppercase font-black tracking-widest text-[#af1e2d] flex items-center gap-1.5">
              <Bookmark className="w-5 h-5 text-[#af1e2d] shrink-0" /> 
              Góc Cá Nhân (Mẹo hay, Địa điểm, Tips hay thú vị)
            </span>
            <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">
              Nơi lưu giữ thông tin nhanh, bookmarks, mẹo mỏ hay định giá liên lạc
            </p>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={tipSearch}
              onChange={(e) => setTipSearch(e.target.value)}
              placeholder="Tìm kiếm mẹo/địa điểm..."
              className="px-3 py-1 text-xs bg-white rounded-lg border border-ink/10 focus:outline-none"
            />
            
            <button
              onClick={() => {
                setIsPersonalOpen(true);
                setEditingTipId(null);
                setTipDesc("");
                setTipCategory("Tips");
                setTipLink("");
                setTipPrice("");
                setTipNotes("");
                setShowAddTip(!showAddTip);
              }}
              className="py-1 px-3 bg-ink hover:bg-[#af1e2d] text-white rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer select-none whitespace-nowrap"
            >
              {showAddTip ? "Đóng Form" : "Thêm mới"}
            </button>
          </div>
        </div>

        {isPersonalOpen && (
          <div className="space-y-4 animate-in slide-in-from-top-1">
            {/* Tip Inline Mutation Form */}
        {showAddTip && (
          <form onSubmit={handleSaveTip} className="p-4 bg-rose-50/20 rounded-xl border border-dashed border-[#af1e2d]/35 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3.5 text-left">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-ink/50 ml-1">Mô Tả / Tên (Description/Name)</label>
                <input
                  type="text"
                  value={tipDesc}
                  onChange={(e) => setTipDesc(e.target.value)}
                  placeholder="Ví dụ: Cách rèn tiếng anh tốt, Quán cafe yên tĩnh ở Hà Nội..."
                  className="px-3 py-2 text-xs bg-white rounded-lg border border-ink/10 text-ink focus:outline-none focus:border-[#af1e2d]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase text-ink/50 ml-1">Phần / Mục nào (Category)</label>
                  <select
                    value={tipCategory}
                    onChange={(e) => setTipCategory(e.target.value)}
                    className="px-2 py-2 text-xs bg-white border border-ink/10 rounded-lg text-ink font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Tips">Mẹo hay (Tips)</option>
                    <option value="Hacks">Hack mẹo cuộc sống (Hacks)</option>
                    <option value="Places">Địa điểm lý thú (Places)</option>
                    <option value="Work">Công việc / Học tập</option>
                    <option value="Other">Các phần khác</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase text-ink/50 ml-1">Giá tiền (VND)</label>
                  <input
                    type="text"
                    value={tipPrice}
                    onChange={(e) => setTipPrice(e.target.value)}
                    placeholder="Nhập giá tiền nếu có..."
                    className="px-3 py-2 text-xs bg-white rounded-lg border border-ink/10 text-ink focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3.5 text-left flex flex-col justify-between">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-ink/50 ml-1">Đường dẫn / Link</label>
                <input
                  type="url"
                  value={tipLink}
                  onChange={(e) => setTipLink(e.target.value)}
                  placeholder="Nhập đường liên kết link (https://...)"
                  className="px-3 py-2 text-xs bg-white rounded-lg border border-ink/10 text-ink focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-ink/50 ml-1">Ghi Chú Chi Tiết (Notes)</label>
                <input
                  type="text"
                  value={tipNotes}
                  onChange={(e) => setTipNotes(e.target.value)}
                  placeholder="Nhập ghi chú quan trọng khác..."
                  className="px-3 py-2 text-xs bg-white rounded-lg border border-ink/10 text-ink focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 bg-ink text-white font-black text-[10px] rounded-lg tracking-wider uppercase cursor-pointer"
                >
                  {editingTipId ? "Cập Nhật" : "Lưu Ghi Chép"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tabular bookmarks lists */}
        {filteredTips.length === 0 ? (
          <div className="py-12 border border-dashed border-ink/10 rounded-xl text-center select-none bg-slate-50">
            <p className="text-xs text-ink/40 font-hand italic">Chưa lưu mẹo hay hoặc địa điểm hấp dẫn nào. Nhấn Thêm mới để tạo ngay!</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin max-w-full">
            {/* Mobile layout: Card stacking */}
            <div className="block sm:hidden space-y-3">
              {filteredTips.map((tip) => (
                <div key={tip.id} className="bg-white p-4 rounded-xl border border-ink/10 flex flex-col gap-2 shadow-xs text-left relative group">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-black text-ink">{tip.name}</h4>
                      <span className="inline-block mt-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2 py-0.5 font-sans font-black text-[9px] uppercase tracking-wide">
                        {tip.address || "Khác / Tips"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEditTip(tip)}
                        className="hover:text-blue-600 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        title="Sửa hàng"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteTip(tip.id)}
                        className="hover:text-crimson p-1.5 bg-rose-50/50 hover:bg-rose-100 rounded-md transition-all cursor-pointer"
                        title="Xóa hàng"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  
                  {tip.price ? (
                    <div className="text-[11px] font-bold text-emerald-700 font-mono mt-0.5">
                      <span className="text-ink/50 font-normal">Giá tiền: </span>{tip.price.toLocaleString("vi-VN")} đ
                    </div>
                  ) : null}
                  
                  {tip.notes && (
                    <p className="text-[11px] italic text-ink/65 border-t border-ink/5 pt-1.5 text-left font-sans">
                      <strong>Ghi chú:</strong> {tip.notes}
                    </p>
                  )}
                  
                  {tip.link ? (
                    <div className="border-t border-ink/5 pt-1.5">
                      <a 
                        href={tip.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold hover:underline text-[11px]"
                      >
                        <Link2 size={11} className="shrink-0" />
                        <span>Xem link gốc</span>
                      </a>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Desktop layout: Large table */}
            <table className="hidden sm:table min-w-full divide-y divide-ink/10">
              <thead className="bg-ink/5 text-ink text-[10px] font-black uppercase tracking-wider text-left">
                <tr>
                  <th scope="col" className="px-5 py-3">Mô Tả / Tên</th>
                  <th scope="col" className="px-5 py-3">Mục Nào</th>
                  <th scope="col" className="px-5 py-3">Link Dẫn</th>
                  <th scope="col" className="px-5 py-3">Giá Tiền (VND)</th>
                  <th scope="col" className="px-5 py-3">Ghi Chú</th>
                  <th scope="col" className="px-5 py-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-ink/5 text-xs text-ink/80 text-left">
                {filteredTips.map((tip) => (
                  <tr key={tip.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-ink max-w-[200px] break-words">
                      {tip.name}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-0.5 font-sans font-extrabold text-[10px] uppercase tracking-wide">
                        {tip.address || "Khác / Tips"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-[150px] truncate">
                      {tip.link ? (
                        <a 
                          href={tip.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold hover:underline"
                        >
                          <Link2 size={12} className="shrink-0" />
                          <span>Link gốc</span>
                        </a>
                      ) : (
                        <span className="text-ink/30 font-hand">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-emerald-700 font-mono">
                      {tip.price ? (
                        `${tip.price.toLocaleString("vi-VN")} đ`
                      ) : (
                        <span className="text-ink/30 italic text-[10px]">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 italic max-w-[200px] break-words text-ink/65 font-sans">
                      {tip.notes || <span className="text-ink/20">-</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleStartEditTip(tip)}
                          className="hover:text-blue-600 p-1 cursor-pointer transition-colors"
                          title="Sửa hàng"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteTip(tip.id)}
                          className="hover:text-crimson p-1 cursor-pointer transition-all"
                          title="Xóa hàng"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </div>
        )}
      </div>

      {/* Thẻ Quà Tặng Overlay */}
      <AnimatePresence>
        {rewardPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amber-900/40 backdrop-blur-sm"
          >
            <div 
              className="absolute inset-0 cursor-pointer"
              onClick={() => setRewardPopup(null)}
            />
            
            <motion.div 
              initial={{ scale: 0.85, y: 50, rotate: -3 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.85, y: 50, opacity: 0, rotate: 5 }}
              transition={{ type: "spring", bounce: 0.6 }}
              className="bg-[#fffdf5] p-8 md:p-10 rounded-3xl sketch-border border-amber-300 max-w-sm w-full relative z-10 shadow-2xl flex flex-col items-center justify-center border-[3px]"
            >
              <div className="absolute -top-10 bg-white w-20 h-20 flex items-center justify-center rounded-full border-[3px] border-amber-300 rotate-12 shadow-xl shrink-0">
                <span className="text-4xl">{rewardPopup.emoji}</span>
              </div>
              
              <div className="mt-8 text-center space-y-4 w-full">
                <p className="text-[10px] font-black tracking-[0.2em] text-amber-700/60 uppercase">
                  ✨ Phần Thưởng Bất Ngờ ✨
                </p>
                <h3 className="font-sans font-black text-3xl text-amber-900 leading-tight drop-shadow-sm">
                  {rewardPopup.title}
                </h3>
                <div className="p-5 bg-amber-50 rounded-2xl border border-dashed border-amber-300 relative shadow-sm">
                   <p className="text-amber-800 font-bold leading-relaxed text-sm">
                     {rewardPopup.desc}
                   </p>
                </div>
              </div>
              
              <button 
                onClick={() => setRewardPopup(null)}
                className="mt-8 w-full py-3.5 text-sm font-black uppercase text-white tracking-widest bg-amber-600 outline-none rounded-xl hover:bg-amber-700 active:scale-95 transition-all shadow-md"
              >
                Nhận Quà 🎁
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
