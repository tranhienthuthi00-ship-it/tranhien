import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSyncedState } from "../lib/useSyncedState";
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
  X,
  Camera,
  CircleDot,
  Edit
} from "lucide-react";
import { useFirebase } from "../context/FirebaseContext";
import { cn } from "../lib/utils";
import { PolaroidPreset, STICKER_PRESETS } from "./CalendarView";


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
  onSearch?: (query: string) => void;
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
  onSearch,
  assets = [],
  setAssets,
  categories = [],
  wishlist = [],
  ideas = [],
  bulkDebts,
  setBulkDebts,
  bulkCardSpends,
  setBulkCardSpends,
  bulkCurrentCash,
  setBulkCurrentCash
}: DigitalJournalProps) {
  
  // ---------------- BUCKET LIST PREVIEW STATE ----------------
  const [localCompletedDefaultGoals, setLocalCompletedDefaultGoals] = useSyncedState<Record<string, boolean>>("studyHub_localBucketListDefaultDone", {});

  const [localRenamedDefaultGoals, setLocalRenamedDefaultGoals] = useSyncedState<Record<string, string>>("studyHub_localBucketListRenamed", {});

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalText, setEditingGoalText] = useState("");

  const [newBucketGoalTitle, setNewBucketGoalTitle] = useState("");

  const [bucketListSubtitle, setBucketListSubtitle] = useSyncedState("studyHub_bucketListSubtitle", "🍉 SUMMER");
  const [bucketListTitle, setBucketListTitle] = useSyncedState("studyHub_bucketListTitle", "BUCKET LIST");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitlePrefix, setEditTitlePrefix] = useState("");
  const [editTitleMain, setEditTitleMain] = useState("");

  const handleSaveTitle = () => {
    const finalSub = editTitlePrefix.trim() || "🍉 SUMMER";
    const finalTitle = editTitleMain.trim() || "BUCKET LIST";
    setBucketListSubtitle(finalSub);
    setBucketListTitle(finalTitle);
    
    
    setIsEditingTitle(false);
  };

  const saveRename = async (id: string, isReal: boolean) => {
    const trimmed = editingGoalText.trim();
    if (!trimmed) {
      setEditingGoalId(null);
      return;
    }

    if (isReal) {
      if (goals && setGoals) {
        const updated = goals.map(g => {
          if (g.id === id) {
            return { ...g, title: trimmed };
          }
          return g;
         });
         await setGoals(updated);
      }
    } else {
      const updatedRenamed = { ...localRenamedDefaultGoals, [id]: trimmed };
      setLocalRenamedDefaultGoals(updatedRenamed);
      
    }
    setEditingGoalId(null);
  };

  const toggleLocalDefaultGoal = (id: string) => {
    const updated = { ...localCompletedDefaultGoals, [id]: !localCompletedDefaultGoals[id] };
    setLocalCompletedDefaultGoals(updated);
    
    try {
      if (updated[id]) {
        confetti({ particleCount: 50, spread: 50, colors: ["#5C0612", "#EFAEBB", "#ED7CB8"] });
      }
    } catch (e) {}
  };

  const handleToggleRealGoal = async (id: string) => {
    if (!goals || !setGoals) return;
    let completedGoal: StudyGoal | undefined;
    const updated = goals.map(g => {
      if (g.id === id) {
        const isCompleted = !g.isCompleted;
        const now = Date.now();
        const completedAt = isCompleted ? now : undefined;
        const updatedGoal = { ...g, isCompleted, completedAt, currentValue: isCompleted ? g.targetValue : 0 };
        if (isCompleted) completedGoal = updatedGoal;
        return updatedGoal;
      }
      return g;
    });

    if (completedGoal && completedGoal.completedAt) {
      try {
        confetti({ particleCount: 70, spread: 60, colors: ["#5C0612", "#EFAEBB", "#ED7CB8", "#fbbf24"] });
      } catch(e){}
    }
    await setGoals(updated);
  };

  const handleAddBucketGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketGoalTitle.trim() || !goals || !setGoals) return;
    const newGoal: StudyGoal = {
      id: `goal-${Date.now()}`,
      title: newBucketGoalTitle.trim(),
      type: 'custom',
      targetValue: 1,
      currentValue: 0,
      createdAt: Date.now(),
      isCompleted: false
    };
    await setGoals([newGoal, ...goals]);
    setNewBucketGoalTitle("");
    try {
      confetti({ particleCount: 30, spread: 40, colors: ["#EFAEBB", "#5C0612"] });
    } catch(e){}
  };

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

  const monthStr = useMemo(() => {
    return `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
  }, [currentMonth]);

  const [dayStickers, setDayStickers] = useSyncedState<Record<string, { type: 'preset' | 'upload'; data: string }>>(`studyHub_calendarDayPics_${monthStr}`, {});
  const [dayRings, setDayRings] = useSyncedState<Record<string, boolean>>(`studyHub_calendarRings_${monthStr}`, {});

  const setDayStickerValue = (dateStr: string, stickerId: string, imageBase64?: string) => {
    const updated = { ...dayStickers };
    if (stickerId === "none" && !imageBase64) {
      delete updated[dateStr];
    } else if (imageBase64) {
      updated[dateStr] = { type: 'upload' as const, data: imageBase64 };
    } else {
      updated[dateStr] = { type: 'preset' as const, data: stickerId };
    }
    setDayStickers(updated);
  };

  const handleStickerFileChange = (dateStr: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDayStickerValue(dateStr, "", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDayRing = (dateStr: string) => {
    const updated = { ...dayRings, [dateStr]: !dayRings[dateStr] };
    setDayRings(updated);
  };
  
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
  const [quickLogLocation, setQuickLogLocation] = useState("");
  const [quickLogType, setQuickLogType] = useState<'Reflection' | 'Event'>('Reflection');
  const [quickLogEmoji, setQuickLogEmoji] = useState("📝5");

  // AI-powered 'Improve English' states and handler
  const [isImproving, setIsImproving] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    improved: string;
    corrections: Array<{ originalPart: string; correctedPart: string; explanation: string }>;
    overallFeedback: string;
  } | null>(null);
  const [aiError, setAiError] = useState("");

  const handleImproveEnglish = async () => {
    if (!quickLogContent.trim()) return;
    setIsImproving(true);
    setAiError("");
    setAiSuggestions(null);
    try {
      const res = await fetch("/api/journal/improve-english", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: quickLogContent })
      });
      if (!res.ok) {
        throw new Error("Không thể kết nối đến máy chủ AI.");
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAiSuggestions(data);
    } catch (err: any) {
      setAiError(err.message || "Đã xảy ra lỗi khi tối ưu hóa tiếng Anh.");
    } finally {
      setIsImproving(false);
    }
  };

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
    
    // Start index (0: Monday, 1: Tuesday, ... 6: Sunday) to align with Monday-Sunday headers nicely
    const startOffset = (firstDay.getDay() + 6) % 7; 
    
    const cells: { day: number | null; dateStr: string | null }[] = [];
    
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

    // Pad post-month blanks so they form a beautiful grid table without any missing bounding box or border cells
    const remainder = cells.length % 7;
    if (remainder > 0) {
      const paddingNeeded = 7 - remainder;
      for (let i = 0; i < paddingNeeded; i++) {
        cells.push({ day: null, dateStr: null });
      }
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
      time: quickLogLocation.trim() || undefined
    };

    setLogs(prev => [...prev, newLog]);
    setQuickLogContent("");
    setQuickLogLocation("");
    setAiSuggestions(null);
    setAiError("");
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

  const [bucketStickers, setBucketStickers] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('studyHub_bucketStickers') || '[]');
    } catch { return []; }
  });

  const saveBucketStickers = (updated: any[]) => {
    setBucketStickers(updated);
    localStorage.setItem('studyHub_bucketStickers', JSON.stringify(updated));
  };

  const handleStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const newSticker = { 
        id: "stk_" + Date.now(), 
        data: reader.result as string, 
        x: 0, y: 0, scale: 1, rotation: 0, 
        type: 'image'
      };
      saveBucketStickers([...bucketStickers, newSticker]);
    };
    reader.readAsDataURL(file);
  };

  const addPresetSticker = () => {
    const newSticker = {
      id: "stk_" + Date.now(),
      data: "⭐",
      x: 0, y: 0, scale: 1.5, rotation: 10,
      type: 'text',
      color: '#ED7CB8'
    };
    saveBucketStickers([...bucketStickers, newSticker]);
  };

  const [homeSearch, setHomeSearch] = useState("");

  const [localInteractiveTasks, setLocalInteractiveTasks] = useState([
    { id: 't1', text: 'Clean my room', done: false, isReal: false }, 
    { id: 't2', text: 'Study English', done: false, isReal: false }, 
    { id: 't3', text: 'Meeting with bigboss', done: false, isReal: false },
    { id: 't4', text: 'To do 1', done: false, isReal: false },
    { id: 't5', text: 'Meeting with bigboss', done: false, isReal: false },
    { id: 't6', text: 'Meeting with bigboss', done: false, isReal: false },
    { id: 't7', text: 'Meeting with bigboss', done: false, isReal: false },
    { id: 't8', text: 'Meeting with bigboss', done: false, isReal: false },
    { id: 't9', text: 'Meeting with bigboss', done: false, isReal: false },
  ]);

  return (
    <div className="min-h-screen bg-[#f8f5ed] w-full pb-20 overflow-x-hidden font-hand text-[#3A1412] mt-4">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 space-y-12 animate-in fade-in duration-500">
        
        {/* Top bar with Search */}
        <div className="flex justify-end w-full">
            <div className="flex items-center bg-[#f8f5ed] border-[3px] border-[#3A1412] px-4 py-1.5 shadow-[3px_3px_0px_#3A1412]" style={{ borderRadius: '12px 25px 12px 25px', width: '280px' }}>
                <input 
                  type="text" 
                  placeholder="Tìm kiếm..." 
                  value={homeSearch} 
                  onChange={e => setHomeSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && homeSearch.trim() && onSearch) {
                      onSearch(homeSearch.trim());
                    }
                  }}
                  className="bg-transparent outline-none flex-1 text-sm font-hand font-bold text-[#3A1412] placeholder-[#3A1412]/50" 
                />
                <button onClick={() => { if (homeSearch.trim() && onSearch) onSearch(homeSearch.trim()); }} className="cursor-pointer hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[#3A1412] stroke-current stroke-[3]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3a7 7 0 0 0-7 7 c0 3 2 5 4 6 s5 2 7-1 s4-5 1-8 s-3-4-5-4 z" /><path d="M16 16 l5 4" /></svg>
                </button>
            </div>
        </div>

                {/* MAIN LAYOUT */}
        {/* MAIN LAYOUT OR SEARCH RESULTS */}
                {homeSearch.trim() !== "" ? (
                    <div className="w-full flex flex-col max-w-[1440px] px-4 mx-auto gap-8 animate-in fade-in duration-300">
                      <div className="bg-white/90 p-6 shadow-[5px_5px_0px_#3A1412] rounded-2xl border-[3px] border-[#3A1412] min-h-[400px]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-4 border-[#3A1412] pb-4 mb-6 gap-4">
                          <div>
                            <h2 className="font-hand font-black text-2xl md:text-3xl text-[#8A1E2B] tracking-wide uppercase flex items-center gap-2">
                              <span>🔍 KẾT QUẢ TÌM KIẾM BỘ SƯU TẬP</span>
                            </h2>
                            <p className="text-xs text-[#3A1412]/60 font-sans font-bold uppercase mt-1">Kết quả khớp từ các chuyên mục Lists, Habits, Places, Ideas, và Assets</p>
                          </div>
                          <button onClick={() => setHomeSearch("")} className="px-4 py-2 font-hand font-black text-lg border-[3px] border-[#3A1412] rounded-xl bg-[#FAF3EB] hover:bg-[#8A1E2B]/10 active:scale-95 shadow-[3px_3px_0px_#3A1412] hover:shadow-[1px_1px_0px_#3A1412] transition-all cursor-pointer">Xóa Tìm Kiếm</button>
                        </div>
                        
                        {(() => {
                          const q = homeSearch.toLowerCase().trim();
                          const resGoals = goals.filter(g => g.title.toLowerCase().includes(q) || (g.type && g.type.toLowerCase().includes(q)));
                          const resTasks = tasks.filter(t => t.content.toLowerCase().includes(q));
                          const resPlaces = places.filter(p => p.name.toLowerCase().includes(q) || (p.notes && p.notes.toLowerCase().includes(q)) || (p.city && p.city.toLowerCase().includes(q)) || p.category.toLowerCase().includes(q));
                          const resIdeas = (ideas || []).filter(i => i.title.toLowerCase().includes(q) || (i.description && i.description.toLowerCase().includes(q)));
                          const resWish = (wishlist || []).filter(w => w.content.toLowerCase().includes(q) || (w.note && w.note.toLowerCase().includes(q)));
                          const resAssets = (assets || []).filter(a => a.name.toLowerCase().includes(q) || (a.notes && a.notes.toLowerCase().includes(q)));
                          
                          const totalCount = resGoals.length + resTasks.length + resPlaces.length + resIdeas.length + resWish.length + resAssets.length;
                          
                          if (totalCount === 0) {
                            return (
                              <div className="text-center py-16 space-y-4">
                                <span className="text-5xl">🏜️</span>
                                <p className="text-[#8A1E2B] font-black text-2xl uppercase tracking-wider">Không tìm thấy kết quả nào phù hợp</p>
                                <p className="text-[#3A1412]/60 text-lg max-w-md mx-auto">Hãy thử nhập từ khóa khác hoặc xóa tìm kiếm để xem toàn bộ nội dung nhé!</p>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                              {/* 1. Goals & Tasks */}
                              {(resGoals.length > 0 || resTasks.length > 0) && (
                                <div className="border-[3px] border-[#3A1412] p-4 rounded-xl bg-[#FFF9F0] shadow-[3px_3px_0px_#3A1412]">
                                  <h3 className="font-hand font-black text-xl text-[#8A1E2B] mb-3 border-b-2 border-dashed border-[#8A1E2B]/20 pb-1 flex items-center gap-2">🎯 MỤC TIÊU & NHIỆM VỤ <span className="text-xs bg-[#8A1E2B] text-white rounded-full px-2 py-0.5">{resGoals.length + resTasks.length}</span></h3>
                                  <ul className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    {resGoals.map(g => (
                                      <li key={g.id} className="text-xs p-2 rounded bg-white border border-neutral-200">
                                        <div className="font-bold text-[#3A1412] text-sm">{g.title}</div>
                                        <div className="text-[10px] text-neutral-500 italic mt-0.5 font-bold uppercase">Mục tiêu • Trạng thái: {g.isCompleted ? "🎉 Hoàn thành" : "⏳ Đang tiến hành"}</div>
                                      </li>
                                    ))}
                                    {resTasks.map(t => (
                                      <li key={t.id} className="text-xs p-2 rounded bg-white border border-neutral-200">
                                        <div className="font-semibold text-[#3A1412] text-sm">{t.content}</div>
                                        <div className="text-[10px] text-neutral-500 italic mt-0.5 font-bold uppercase">Nhiệm vụ • {t.completed ? "✅ Đã xong" : "⏳ Đang thực hiện"}</div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {/* 2. Food & Places */}
                              {resPlaces.length > 0 && (
                                <div className="border-[3px] border-[#3A1412] p-4 rounded-xl bg-[#FFF9F0] shadow-[3px_3px_0px_#3A1412]">
                                  <h3 className="font-hand font-black text-xl text-[#8A1E2B] mb-3 border-b-2 border-dashed border-[#8A1E2B]/20 pb-1 flex items-center gap-2 font-black uppercase font-bold">🍔 ĐỊA ĐIỂM & ĂN UỐNG <span className="text-xs bg-[#8A1E2B] text-white rounded-full px-2 py-0.5">{resPlaces.length}</span></h3>
                                  <ul className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    {resPlaces.map(p => (
                                      <li key={p.id} className="text-sm p-2 rounded bg-white border border-neutral-200">
                                        <div className="font-bold text-[#3A1412] flex items-center justify-between">
                                          <span>{p.name}</span>
                                          {p.rating ? <span className="text-amber-500 text-xs">⭐{p.rating}</span> : null}
                                        </div>
                                        {p.address && <div className="text-xs text-neutral-600 mt-0.5">📍 Địa chỉ: {p.address}</div>}
                                        {p.notes && <div className="text-xs text-neutral-500 italic mt-1 bg-amber-50/50 p-1.5 rounded font-serif">{p.notes}</div>}
                                        <div className="text-[10px] font-bold text-neutral-400 mt-1 uppercase font-semibold">Danh mục: {p.category} • {p.status === 'Visited' ? '✅ Đã ghé thăm' : 'Want to visit'}</div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {/* 3. Content Ideas */}
                              {resIdeas.length > 0 && (
                                <div className="border-[3px] border-[#3A1412] p-4 rounded-xl bg-[#FFF9F0] shadow-[3px_3px_0px_#3A1412]">
                                  <h3 className="font-hand font-black text-xl text-[#8A1E2B] mb-3 border-b-2 border-dashed border-[#8A1E2B]/20 pb-1 flex items-center gap-2">💡 Ý TƯỞNG & SÁNG TẠO <span className="text-xs bg-[#8A1E2B] text-white rounded-full px-2 py-0.5">{resIdeas.length}</span></h3>
                                  <ul className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    {resIdeas.map(i => (
                                      <li key={i.id} className="text-sm p-2 rounded bg-white border border-neutral-200">
                                        <div className="font-bold text-[#3A1412]">{i.title}</div>
                                        {i.description && <div className="text-xs text-neutral-600 mt-1 bg-neutral-50 p-1.5 rounded">{i.description}</div>}
                                        <div className="text-[10px] uppercase font-bold text-neutral-400 mt-1">Nền tảng: {i.platform || "Chưa đặt"} • Trạng thái: {i.status}</div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {/* 4. Wishlist */}
                              {resWish.length > 0 && (
                                <div className="border-[3px] border-[#3A1412] p-4 rounded-xl bg-[#FFF9F0] shadow-[3px_3px_0px_#3A1412]">
                                  <h3 className="font-hand font-black text-xl text-[#8A1E2B] mb-3 border-b-2 border-dashed border-[#8A1E2B]/20 pb-1 flex items-center gap-2">🎁 DANH SÁCH MONG ƯỚC <span className="text-xs bg-[#8A1E2B] text-white rounded-full px-2 py-0.5">{resWish.length}</span></h3>
                                  <ul className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    {resWish.map(w => (
                                      <li key={w.id} className="text-sm p-2 rounded bg-white border border-neutral-200">
                                        <div className="font-bold text-[#3A1412]">{w.content}</div>
                                        {w.price ? <div className="text-xs text-neutral-600 font-mono font-bold mt-0.5">Giá: {Number(w.price).toLocaleString()} ₫</div> : null}
                                        {w.note && <div className="text-xs text-neutral-500 italic mt-1 bg-pink-50/30 p-1.5 rounded font-serif">{w.note}</div>}
                                        <div className="text-[10px] font-bold uppercase text-neutral-400 mt-1">Mức mong muốn: {w.necessity}</div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {/* 5. Assets */}
                              {resAssets.length > 0 && (
                                <div className="border-[3px] border-[#3A1412] p-4 rounded-xl bg-[#FFF9F0] shadow-[3px_3px_0px_#3A1412] col-span-1 md:col-span-2">
                                  <h3 className="font-hand font-black text-xl text-[#8A1E2B] mb-3 border-b-2 border-dashed border-[#8A1E2B]/20 pb-1 flex items-center gap-2 font-black uppercase font-bold">💰 TÀI SẢN & TÀI CHÍNH <span className="text-xs bg-[#8A1E2B] text-white rounded-full px-2 py-0.5">{resAssets.length}</span></h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-1">
                                    {resAssets.map(a => (
                                      <div key={a.id} className="text-sm p-3 rounded bg-white border border-neutral-200 shadow-sm flex flex-col justify-between">
                                        <div>
                                          <div className="font-bold text-[#3A1412]">{a.name}</div>
                                          {a.notes && <div className="text-xs text-neutral-500 italic mt-1 font-serif bg-neutral-50 p-1 rounded">{a.notes}</div>}
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100">
                                          <span className="font-extrabold text-[#8A1E2B] font-mono text-base">{a.value.toLocaleString()} {a.currency || 'VND'}</span>
                                          <span className={"text-[9px] px-2 py-0.5 rounded font-extrabold uppercase " + (a.isDebt ? 'bg-red-100 text-red-800' : a.isLoan ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800')}>{a.isDebt ? 'Khoản nợ' : a.isLoan ? 'Cho vay' : 'Tài sản'}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 xl:gap-12 items-start max-w-[1440px] px-2 mx-auto w-full">
            {/* LEFT: CALENDAR */}
            <div className="lg:col-span-2 flex flex-col pt-2 relative z-10 w-full mb-10">
               <div className="text-center font-caveat text-[#8A1E2B] font-black tracking-widest text-xl md:text-3xl uppercase flex items-center justify-center gap-6 mb-6">
                  <button onClick={() => changeMonth(-1)} className="hover:-translate-x-1 transition-transform cursor-pointer">
                    <svg className="w-8 h-8 stroke-[#8A1E2B] stroke-[3]" fill="none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <span className="min-w-[200px]">{currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span>
                  <button onClick={() => changeMonth(1)} className="hover:translate-x-1 transition-transform cursor-pointer">
                    <svg className="w-8 h-8 stroke-[#8A1E2B] stroke-[3]" fill="none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
               </div>
               
               <div className="bg-[#f8f5ed] relative">
                  {/* Headers */}
                  <div className="grid grid-cols-7 border-[2.5px] border-b-0 border-[#8A1E2B] text-center text-[#8A1E2B] font-bold text-sm md:text-lg">
                     {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d, idx) => (
                         <div key={d} className={`p-3 ${idx < 6 ? 'border-r-[2.5px] border-[#8A1E2B]' : ''}`}>{d.substring(0,3)}</div>
                     ))}
                  </div>
                  {/* Grid */}
                  <div className="grid grid-cols-7 auto-rows-fr border-[2.5px] border-[#8A1E2B] bg-[#f8f5ed] shadow-[4px_4px_0_rgba(138,30,43,0.15)] relative min-h-[450px] lg:min-h-[550px]">
                     {calendarDays.map((cell, i) => {
                        const isLastInRow = (i + 1) % 7 === 0;
                        const isLastRow = i >= calendarDays.length - 7;
                        const hasSticker = cell.dateStr ? !!dayStickers[cell.dateStr] : false;
                        const stickerData = cell.dateStr ? dayStickers[cell.dateStr] : null;
                        const ringStyle = cell.dateStr ? dayRings[cell.dateStr] : null;

                        return (
                          <div 
                             key={i} 
                             className={`p-2 flex flex-col relative group transition-colors ${cell.day ? 'cursor-pointer hover:bg-[#8A1E2B]/5 bg-transparent' : 'bg-neutral-100/20 cursor-default'} ${!isLastInRow ? 'border-r-[2px] border-[#8A1E2B]' : ''} ${!isLastRow ? 'border-b-[2px] border-[#8A1E2B]' : ''}`} 
                             onClick={() => {
                               if (cell.dateStr) {
                                  setSelectedDateStr(cell.dateStr);
                                  setIsCalendarDetailsOpen(true);
                               }
                             }}
                          >
                              {cell.day && (
                                <div className="flex items-center justify-between z-10 relative">
                                  <span className="text-sm md:text-lg font-caveat font-black text-[#8A1E2B] group-hover:scale-110 transition-transform underline decoration-[#8A1E2B] decoration-[1.5px] underline-offset-4">{cell.day}</span>
                                </div>
                              )}
                              
                              {/* Decoratives logic based on interactions */}
                              {ringStyle && (
                                <span className="absolute inset-x-1 inset-y-1 pointer-events-none z-0">
                                  <svg className="w-full h-full text-red-600/70" viewBox="0 0 100 100" fill="none">
                                    <path d="M 15,50 C 10,25 90,15 85,45 C 80,75 12,85 20,55 C 28,25 92,30 82,60" stroke="#8A1E2B" strokeWidth="6" strokeLinecap="round" />
                                  </svg>
                                </span>
                              )}

                                                            {/* Interaction Rendering - Constrained to bottom 2/3 of day frame */}
                              {cell.dateStr && (
                                <div className="absolute top-[28%] left-0 right-0 bottom-0 flex flex-col items-center justify-center z-0 opacity-95 overflow-visible pointer-events-none pb-1 px-1">
                                  {hasSticker ? (
                                    <div className="flex flex-col items-center justify-center w-full h-full mt-1">
                                      {stickerData?.type === 'preset' && (
                                        <PolaroidPreset type={stickerData.data} className="w-9 h-9 drop-shadow-sm text-[#8A1E2B] hover:scale-110 transition-transform" />
                                      )}
                                      {stickerData?.type === 'upload' && (
                                        <img src={stickerData.data} alt="sticker" className="w-11 h-11 object-contain rounded border border-neutral-200/50" />
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-between w-full h-full pt-1">
                                      {/* Auto Sticker for Day Events occupying bottom 2/3 area */}
                                      {(() => {
                                        const dayEvents = logs.filter(l => l.date === cell.dateStr && l.type === 'Event');
                                        if (dayEvents.length > 0) {
                                          const firstEv = dayEvents[0];
                                          // Display a cute visual sticker representation of the event
                                          if (firstEv.emoji) {
                           const isLastInRow = (i + 1) % 7 === 0;
                        const isLastRow = i >= calendarDays.length - 7;
                        const hasSticker = cell.dateStr ? !!dayStickers[cell.dateStr] : false;
                        const stickerData = cell.dateStr ? dayStickers[cell.dateStr] : null;
                        const ringStyle = cell.dateStr ? dayRings[cell.dateStr] : null;

                        return (
                                              <span className="text-2xl md:text-3xl filter drop-shadow-md select-none transform hover:scale-125 hover:rotate-6 transition-transform animate-bounce mt-1">
                                                {firstEv.emoji}
                                              </span>
                                            );
                                          }
                                          return (
                                            <PolaroidPreset type="star" className="w-8 h-8 drop-shadow-sm text-[#8A1E2B] mt-1 animate-pulse" />
                                          );
                                        }
                                        return null;
                                      })()}
                                      
                                      {/* Event text summary below auto sticker block */}
                                      <div className="flex flex-col gap-0.5 w-full mt-auto">
                                        {logs.filter(l => l.date === cell.dateStr).slice(0, 1).map((l, idx) => (
                                          <div key={idx} className="text-[9px] md:text-[10px] truncate text-[#8A1E2B] font-bold font-sans bg-[#8A1E2B]/10 rounded px-1 text-center scale-90 border border-[#8A1E2B]/10">
                                            {l.emoji || '📌'} {l.content}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Hover details hint */}
                              {cell.day && (
                                <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <svg className="w-4 h-4 text-[#8A1E2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                                </div>
                              )}
                          </div>
                         )
                     })}
                  </div>
               </div>
               
               {/* Puppy drawing relative to top */}
               <div className="absolute -top-12 -right-8 w-16 h-16 pointer-events-none opacity-80 rotate-12">
                  <svg viewBox="0 0 100 100" fill="none" stroke="#8A1E2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20,50 Q30,40 40,50 Q50,45 60,50 Q70,40 80,45 Q75,55 85,60 Q80,70 65,70 Q55,65 40,65 Q30,70 20,60 Q25,55 15,45 Z" />
                    <circle cx="30" cy="50" r="2.5" fill="#8A1E2B"/>
                    <path d="M25,55 Q35,60 40,55" />
                    <path d="M30,35 L25,20 L40,30" />
                    <path d="M50,80 L50,90 M70,75 L75,85 M25,75 L20,85 M35,80 L35,90" />
                  </svg>
               </div>
            </div>

            {/* MIDDLE: TO DO LIST */}
            <div className="lg:col-span-1 flex flex-col pt-16 xl:pl-4">
                
                {/* To Do List */}
                <div className="space-y-4">
                   <div className="flex items-center gap-6 mb-4">
                     <h3 className="font-hand font-black text-xl text-[#3A1412] tracking-wider uppercase m-0 flex-1">TODAY TO DO LIST:</h3>
                     
                     {/* Mascot */}
                     <div className="w-24 h-24 pointer-events-none relative -mt-9 shrink-0 -mr-4" style={{ zIndex: 50 }}>
                        {(() => {
                            const allDisplayTasks = [
                              ...tasks.map(t => ({ id: t.id, text: t.content, done: t.completed, isReal: true })),
                              ...localInteractiveTasks
                            ].slice(0, 9);
                            
                            const completedCount = allDisplayTasks.filter(t => t.done).length;
                            const totalDisplayTasks = allDisplayTasks.length;
                            const ratio = totalDisplayTasks === 0 ? 1 : completedCount / totalDisplayTasks;
                            const controlY = 45 + ratio * 30;

                            return (
                              <svg viewBox="0 0 100 110" className="w-full h-full stroke-[#8A1E2B] stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round" style={{ overflow: 'visible' }}>
                                 {/* 1. Mascot Hair Back (Wavy, dark brown) */}
                                 <motion.path 
                                   d="M 24 45 
                                      C 10 52, 6 65, 12 78 
                                      C 6 86, 14 96, 26 95 
                                      C 22 104, 38 108, 48 102 
                                      C 60 106, 74 102, 74 94 
                                      C 84 92, 92 80, 84 70 
                                      C 96 58, 88 46, 76 43 Z" 
                                   fill="#5C382A" stroke="#3A1412" strokeWidth="2.5" 
                                   animate={{ 
                                      rotate: ratio === 1 ? [0, -1, 1, -1, 0] : 0,
                                      y: ratio === 1 ? [0, -1, 0] : 0 
                                    }}
                                 />
                                 
                                 {/* 2. Body/Shoulders is next */}
                                 <motion.path 
                                    d="M 32 82 L 68 82 L 72 110 L 28 110 Z" 
                                    fill="#FFF9F0" stroke="#3A1412" strokeWidth="2.5"
                                 />
                                 
                                 {/* White tank top dress matching photo */}
                                 <path d="M 33 82 L 67 82 L 71 110 L 29 110 Z" fill="#FFFFFF" />
                                 {/* Spaghetti straps */}
                                 <line x1="36" y1="82" x2="36" y2="76" stroke="#3A1412" strokeWidth="1.5" />
                                 <line x1="64" y1="82" x2="64" y2="76" stroke="#3A1412" strokeWidth="1.5" />
                                 
                                 {/* Cute sunglasses hanging on her neck frame */}
                                 <ellipse cx="46" cy="88" rx="4" ry="5.5" fill="#2D2D2D" stroke="#3A1412" strokeWidth="1.5" />
                                 <ellipse cx="54" cy="88" rx="4" ry="5.5" fill="#2D2D2D" stroke="#3A1412" strokeWidth="1.5" />
                                 <line x1="46" y1="84" x2="54" y2="84" stroke="#3A1412" strokeWidth="2" />

                                 {/* 3. Coconut of Right hand */}
                                 <circle cx="20" cy="85" r="10.5" fill="#8FA03B" stroke="#3A1412" strokeWidth="2.5" />
                                 {/* Cut flat top center list of coco */}
                                 <ellipse cx="20" cy="76" rx="6" ry="2.2" fill="#EAD9C2" stroke="#3A1412" strokeWidth="1.5" />
                                 <circle cx="20" cy="76" r="2.5" fill="#8A1E2B" opacity="0.4" />
                                 {/* Straw */}
                                 <path d="M 21 76 L 16 64 L 14 64" fill="none" stroke="#FAF3EB" strokeWidth="2.5" />
                                 <path d="M 21 76 L 16 64 L 14 64" fill="none" stroke="#3A1412" strokeWidth="1" />

                                 {/* 4. Left Arm gesturing cute to her face */}
                                 <path d="M 68 85 Q 78 80 75 70" fill="none" stroke="#FFF9F0" strokeWidth="7" strokeLinecap="round" />
                                 <path d="M 68 85 Q 78 80 75 70" fill="none" stroke="#3A1412" strokeWidth="9" strokeLinecap="round" style={{ zIndex: -1 }} />
                                 <path d="M 68 85 Q 78 80 75 70" fill="none" stroke="#FFF9F0" strokeWidth="6" strokeLinecap="round" />

                                 {/* 5. Face/Head */}
                                 <motion.path 
                                    d="M 26 48 C 26 30 74 30 74 48 C 74 65 65 73 50 73 C 35 73 26 65 26 48 Z" 
                                    fill="#FFF9F0" stroke="#3A1412" strokeWidth="2.5"
                                    animate={{ 
                                      rotate: ratio === 1 ? [0, -1, 1, -1, 0] : 0,
                                      y: ratio === 1 ? [0, -1, 0] : 0 
                                    }}
                                    transition={{ duration: 0.5, repeat: ratio === 1 ? Infinity : 0, repeatDelay: 2 }}
                                 />

                                 {/* Rosy Peach Cheek blushes */}
                                 <ellipse cx="34" cy="58" rx="6.5" ry="3.5" fill="#FF9E9E" opacity="0.75" />
                                 <ellipse cx="66" cy="58" rx="6.5" ry="3.5" fill="#FF9E9E" opacity="0.75" />
                                 
                                 {/* Big expression eyes looking sideways (viewer right) */}
                                 <ellipse cx="38" cy="48" rx="6" ry="5.5" fill="#FFFFFF" stroke="#3A1412" strokeWidth="2.2" />
                                 <circle cx="41.5" cy="48" r="4" fill="#3A1412" />
                                 <circle cx="43" cy="46" r="1.2" fill="#FFFFFF" />

                                 <ellipse cx="62" cy="48" rx="6" ry="5.5" fill="#FFFFFF" stroke="#3A1412" strokeWidth="2.2" />
                                 <circle cx="65.5" cy="48" r="4" fill="#3A1412" />
                                 <circle cx="67" cy="46" r="1.2" fill="#FFFFFF" />
                                 
                                 {/* Cute Little Curve Nose */}
                                 <path d="M 48 54 Q 50 51 51 54" fill="none" stroke="#3A1412" strokeWidth="2" strokeLinecap="round" />
                                 
                                 {/* Animated Smile */}
                                 {ratio <1 ? (
                                    <path d="M 46 61 Q 50 64 54 61" fill="none" stroke="#3A1412" strokeWidth="2.5" strokeLinecap="round" />
                                 ) : (
                                    <motion.path 
                                       d="M 44 60 Q 50 67 56 60 Z" 
                                       fill="#E56B6F" stroke="#3A1412" strokeWidth="2.2" strokeLinejoin="round"
                                       animate={{ scale: [1, 1.1, 1] }}
                                    />
                                 )}

                                 {/* Bangs (wavy/curly, framing forehead) */}
                                 <path d="M 25 48 C 30 32, 48 27, 50 36 C 52 27, 70 32, 75 48 C 65 34, 35 34, 25 48 Z" fill="#5C382A" stroke="#3A1412" strokeWidth="2" strokeLinejoin="round" />
                                 {/* Hair Side strand details */}
                                 <path d="M 25 48 Q 28 58 26 66" fill="none" stroke="#3A1412" strokeWidth="2" />
                                 <path d="M 75 48 Q 72 58 74 66" fill="none" stroke="#3A1412" strokeWidth="2" />

                                 {/* 6. Straw Hat (Crown + Red Ribbon Band + Wide Brim) */}
                                 <ellipse cx="50" cy="23" rx="19" ry="11.5" fill="#DEC083" stroke="#3A1412" strokeWidth="2.5" />
                                 {/* Red Ribbon Band (Crimson accent) */}
                                 <path d="M 31 24 C 31 24, 50 21, 69 24 L 70 28 C 70 28, 50 25, 30 28 Z" fill="#8A1E2B" stroke="#3A1412" strokeWidth="1" />
                                 {/* Wide Brim */}
                                 <ellipse cx="50" cy="30" rx="36" ry="7.2" fill="#DEC083" stroke="#3A1412" strokeWidth="2.5" />
                                 {/* Straw Texture details */}
                                 <path d="M 40 18 Q 45 15 50 18" fill="none" stroke="#B89753" strokeWidth="1" />
                                 <path d="M 50 16 Q 55 13 60 16" fill="none" stroke="#B89753" strokeWidth="1" />
                                 
                                 {/* Sparkles if Happy (100% complete) */}
                                 <AnimatePresence>
                                  {ratio === 1 && (
                                     <motion.g
                                       initial={{ opacity: 0, scale: 0 }}
                                       animate={{ opacity: 1, scale: 1 }}
                                       exit={{ opacity: 0, scale: 0 }}
                                     >
                                        <path d="M 5 20 L 10 10 L 15 20 L 25 25 L 15 30 L 10 40 L 5 30 L -5 25 Z" fill="#FFA39E" stroke="none" transform="scale(0.5) translate(10, 20)"/>
                                        <path d="M 85 20 L 90 10 L 95 20 L 105 25 L 95 30 L 90 40 L 85 30 L 75 25 Z" fill="#EAB308" stroke="none" transform="scale(0.5) translate(100, 30)"/>
                                     </motion.g>
                                  )}
                                 </AnimatePresence>
                              </svg>
                            );
                        })()}
                     </div>
                   </div>

                   {(() => {
                      const allDisplayTasks = [
                        ...tasks.map(t => ({ id: t.id, text: t.content, done: t.completed, isReal: true })),
                        ...localInteractiveTasks
                      ].slice(0, 9);

                      return allDisplayTasks.map((t, idx) => (
                          <div key={t.id + idx} className="flex items-center gap-4 cursor-pointer group" onClick={() => {
                             if (t.isReal) {
                                handleToggleTask(t.id);
                             } else {
                                setLocalInteractiveTasks(prev => prev.map(item => item.id === t.id ? { ...item, done: !item.done } : item));
                             }
                          }}>
                              <div className="w-8 h-8 border-[2.5px] border-[#8A1E2B] rounded-[4px] shrink-0 flex items-center justify-center transition-all group-hover:scale-105 bg-white shadow-sm overflow-hidden relative">
                                  <AnimatePresence>
                                    {t.done && (
                                      <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="w-full h-full bg-transparent flex items-center justify-center"
                                      >
                                        <svg className="text-[#8A1E2B] w-6 h-6 stroke-[4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <motion.path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            d="M4 14 Q9 18 10 18 Q15 11 20 6"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.2 }}
                                          />
                                        </svg>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                              </div>
                              <span className={`font-hand font-black text-xl md:text-2xl transition-all select-none ${t.done ? "text-[#8A1E2B]/50 line-through decoration-[#8A1E2B] decoration-[2px]" : "text-[#8A1E2B] group-hover:text-red-700"}`}>{t.text}</span>
                          </div>
                      ));
                   })()}
                   
                   <form onSubmit={handleAddTask} className="flex items-center gap-3 mt-4 pt-4 border-t-[1.5px] border-[#8A1E2B]/20 border-dashed">
                     <span className="text-[#8A1E2B] font-black text-2xl">+</span>
                     <input type="text" placeholder="Add new task..." value={newTaskContent} onChange={e => setNewTaskContent(e.target.value)} className="bg-transparent outline-none font-hand font-bold text-xl text-[#8A1E2B] placeholder-[#8A1E2B]/50 w-full uppercase" />
                   </form>
                </div>

                </div>
    {/* RIGHT: EVENTS */}
    <div className="lg:col-span-1 flex flex-col pt-16 xl:pl-4">
                <div className="space-y-4">
                   <h3 className="font-hand font-black text-xl text-[#3A1412] tracking-wider uppercase mb-4">TODAY EVENT:</h3>
                   <ul className="space-y-3 list-none">
                      {logs.filter(l => l.date === new Date().toISOString().split("T")[0] && l.type === 'Event').length === 0 && (
                          <li className="text-[#8A1E2B]/50 font-hand font-bold text-lg italic">No events today.</li>
                      )}
                      {logs.filter(l => l.date === new Date().toISOString().split("T")[0] && l.type === 'Event').map(l => (
                         <li key={l.id} className="flex items-start gap-4"><div className="w-2 h-2 mt-3 rounded-full bg-[#8A1E2B] shrink-0" /> <span className="font-hand font-black text-xl md:text-2xl text-[#8A1E2B]">{l.emoji} {l.content}</span></li>
                      ))}
                   </ul>
                </div>
            </div>

            
        </div>
        )}

        {/* BOTTOM: BUCKET LIST */}
        <div className="pt-24 z-20 w-full max-w-5xl mx-auto">
            {/* RIGHT: BUCKET LIST */}
            <div className="relative pt-8 z-20 w-full">
              <div className="bg-[#862939] p-4 rounded-[40px] shadow-[8px_8px_0px_#f8f5ed,10px_10px_0px_rgba(0,0,0,0.1)] relative"
                style={{
                  backgroundImage: "repeating-linear-gradient(90deg, #8A1E2B, #8A1E2B 24px, #bc707b 24px, #bc707b 48px)"
                }}
              >
                  <div className="bg-[#FAF3EB] border-[8px] border-[#862939] rounded-[30px] p-8 md:p-10 text-[#5C0612] relative min-h-[600px] overflow-hidden">
                      
                      {/* Stickers Area */}
                      {bucketStickers.map((stk, i) => (
                        <motion.div
                          key={stk.id}
                          drag
                          dragMomentum={false}
                          className="absolute z-50 cursor-grab active:cursor-grabbing origin-center group"
                          style={{ x: stk.x, y: stk.y, rotate: stk.rotation, scale: stk.scale }}
                          onDragEnd={(e, info) => {
                            const updated = [...bucketStickers];
                            updated[i].x += info.offset.x;
                            updated[i].y += info.offset.y;
                            saveBucketStickers(updated);
                          }}
                        >
                          {stk.type === 'image' ? (
                            <img draggable={false} src={stk.data} className="w-24 h-24 object-contain pointer-events-none" style={{ filter: stk.color ? `drop-shadow(0 0 10px ${stk.color})` : 'none' }} />
                          ) : (
                            <div className="text-6xl pointer-events-none" style={{ color: stk.color }}>{stk.data}</div>
                          )}
                          
                          <div className="absolute -top-10 -right-10 bg-white/95 rounded-xl shadow-lg border-2 border-[#5C0612] flex gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-50 cursor-default" onPointerDown={e => e.stopPropagation()}>
                            <button className="w-6 h-6 hover:bg-gray-100 rounded text-xs flex items-center justify-center font-bold" onClick={() => { const up = [...bucketStickers]; up[i].scale = (up[i].scale || 1) + 0.2; saveBucketStickers(up); }}>+</button>
                            <button className="w-6 h-6 hover:bg-gray-100 rounded text-xs flex items-center justify-center font-bold" onClick={() => { const up = [...bucketStickers]; up[i].scale = Math.max(0.3, (up[i].scale || 1) - 0.2); saveBucketStickers(up); }}>-</button>
                            {stk.type === 'text' && (
                              <input type="color" className="w-6 h-6 rounded cursor-pointer" value={stk.color || '#000000'} onChange={(e) => { const up = [...bucketStickers]; up[i].color = e.target.value; saveBucketStickers(up); }} />
                            )}
                            <button className="w-6 h-6 hover:bg-red-100 text-red-600 rounded text-xs flex items-center justify-center font-bold" onClick={() => saveBucketStickers(bucketStickers.filter(s => s.id !== stk.id))}>×</button>
                          </div>
                        </motion.div>
                      ))}

                      {/* Header */}
                      {isEditingTitle ? (
                        <form 
                          onSubmit={(e) => { e.preventDefault(); handleSaveTitle(); }}
                          className="flex flex-col items-center gap-1 mb-10 select-none relative z-40 bg-white/80 p-4 rounded-xl shadow-sm"
                        >
                          <input type="text" value={editTitlePrefix} onChange={e => setEditTitlePrefix(e.target.value)} onBlur={handleSaveTitle} onKeyDown={e => e.key === 'Enter' ? handleSaveTitle() : null} autoFocus className="text-xl md:text-2xl font-hand font-extrabold text-center tracking-[0.1em] text-[#7D1E2B]/85 bg-transparent border-b-2 border-dashed border-[#5C0612]/30 outline-none w-full max-w-xs focus:border-[#5C0612]" />
                          <input type="text" value={editTitleMain} onChange={e => setEditTitleMain(e.target.value)} onBlur={handleSaveTitle} onKeyDown={e => e.key === 'Enter' ? handleSaveTitle() : null} className="text-3xl md:text-5xl font-hand font-black text-center tracking-tighter text-[#5C0612] bg-transparent border-b-2 border-dashed border-[#5C0612]/30 outline-none w-full max-w-md focus:border-[#5C0612]" placeholder="BUCKET LIST" />
                          <span className="text-[10px] font-bold text-[#5C0612]/40 uppercase mt-2">Ấn ENTER để lưu</span>
                        </form>
                      ) : (
                        <div 
                          className="relative text-center mb-10 select-none cursor-pointer group z-10 pt-2"
                          onDoubleClick={(e) => { e.stopPropagation(); setEditTitlePrefix(bucketListSubtitle); setEditTitleMain(bucketListTitle); setIsEditingTitle(true); }}
                          title="Nhấp đúp chuột để đổi tiêu đề!"
                        >
                          <h2 className="text-[#5C0612] font-hand font-black text-3xl md:text-5xl tracking-normal leading-none rotate-[-1deg] select-none flex flex-col items-center group-hover:scale-[1.02] transition-transform">
                            <span className="text-base md:text-xl block tracking-[0.2em] text-[#7D1E2B]/85 font-extrabold rotate-[2deg] opacity-95">🍉 {bucketListSubtitle.replace('🍉', '').trim()}</span>
                            <span className="text-4xl md:text-[54px] font-black block mt-2 tracking-tighter drop-shadow-sm uppercase">{bucketListTitle}</span>
                          </h2>
                          <div className="w-24 h-1.5 bg-[#5C0612] mx-auto mt-4 rounded-full rotate-[1deg] opacity-10" />
                        </div>
                      )}

                      {/* Items */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 md:gap-y-4 text-left font-hand text-[#5C0612] relative z-10 mt-6">
                        {(() => {
                           const activeCustom = goals.map(g => ({ id: g.id, text: g.title, isCompleted: g.isCompleted, isReal: true }));
                           const defaultG = [
                             { id: "def-1", text: "VỀ NHÀ CHƠI THƯỜNG XUYÊN HƠN", isReal: false },
                             { id: "def-2", text: "SINH NHẬT MINH", isReal: false },
                             { id: "def-3", text: "SỬC KHOẺ TINH THẦN", isReal: false },
                             { id: "def-4", text: "LÝ SƠN", isReal: false, isCompleted: true },
                             { id: "def-5", text: "IPAD M3 11 INCH", isReal: false },
                             { id: "def-6", text: "NIỀNG RĂNG", isReal: false },
                             { id: "def-7", text: "GIVE A STRANGER A COMPLIMENT", isReal: false },
                             { id: "def-8", text: "WALK THROUGH GRASS BAREFOOT", isReal: false },
                             { id: "def-9", text: "TRY A NEW RECIPE & SHARE", isReal: false },
                             { id: "def-10", text: "HOST A DINNER PARTY", isReal: false },
                             { id: "def-11", text: "LEARN A NEW GAME", isReal: false },
                             { id: "def-12", text: "START A SCRAPBOOK & STICK WITH IT!", isReal: false },
                             { id: "def-13", text: "HAVE A BUBBLY DRINK BY A POOL", isReal: false },
                             { id: "def-14", text: "WATCH A FILM THAT GIVES YOU NEW PERSPECTIVE", isReal: false },
                             { id: "def-15", text: "MAKE A BOUQUET OF FLOWERS", isReal: false },
                             { id: "def-16", text: "SOAK IN SUNSHINE", isReal: false },
                             { id: "def-17", text: "CALL SOMEONE YOU SUSPECT MAY BE LONELY", isReal: false },
                             { id: "def-18", text: "TAKE PHOTOS OF THINGS THAT MADE YOU SMILE", isReal: false },
                             { id: "def-19", text: "MAKE A CHANGE YOU NEED TO MAKE", isReal: false },
                             { id: "def-20", text: "DANCE (IN ANY CAPACITY)", isReal: false },
                             { id: "def-21", text: "JUMP IN A COLD POOL", isReal: false },
                             { id: "def-22", text: "FLOAT IN AN INNER TUBE", isReal: false },
                             { id: "def-23", text: "EAT FRENCH FRIES IN THE SUN", isReal: false },
                             { id: "def-24", text: "EXPLORE A NEW CITY'S BEST LOCAL SPOTS", isReal: false }
                           ].map(d => ({ ...d, text: localRenamedDefaultGoals[d.id] || d.text, isCompleted: d.isCompleted || !!localCompletedDefaultGoals[d.id] }));
                           
                           const allItems = [...activeCustom, ...defaultG];
                           const half = Math.ceil(allItems.length / 2);
                           
                           const renderItem = (item: any) => {
                             const isEditing = editingGoalId === item.id;
                             return (
                               <div key={item.id} onDoubleClick={e => { e.stopPropagation(); setEditingGoalId(item.id); setEditingGoalText(item.text); }} className="flex items-start gap-3 group cursor-pointer z-10 w-full">
                                 <button type="button" onClick={e => { e.stopPropagation(); item.isReal ? handleToggleRealGoal(item.id) : toggleLocalDefaultGoal(item.id); }} className="w-[18px] h-[18px] md:w-[20px] md:h-[20px] rounded-full border-[2.5px] border-[#5C0612] shrink-0 mt-[2px] transition-all flex items-center justify-center relative bg-transparent hover:scale-110">
                                   {item.isCompleted && <div className="w-[8px] h-[8px] md:w-[10px] md:h-[10px] rounded-full bg-[#5C0612] absolute" />}
                                 </button>
                                 {isEditing ? (
                                   <input type="text" value={editingGoalText} onChange={e => setEditingGoalText(e.target.value)} onBlur={() => saveRename(item.id, item.isReal)} onKeyDown={e => { if (e.key === 'Enter') saveRename(item.id, item.isReal); else if (e.key === 'Escape') setEditingGoalId(null); }} autoFocus onClick={e => e.stopPropagation()} className="flex-1 bg-white/95 border-b-2 border-[#5C0612] px-1 py-0 rounded-none text-[11px] sm:text-[13px] md:text-[14px] font-hand font-bold text-[#5C0612] outline-none" />
                                 ) : (
                                   <span className={`font-hand font-bold text-[10px] sm:text-[12px] md:text-[14px] tracking-wide leading-tight transition-all text-[#5C0612] select-none ${item.isCompleted ? "line-through opacity-50 decoration-[1.5px]" : "group-hover:text-red-700"}`}>
                                      {item.isReal ? `🎯 ${item.text}` : item.text}
                                   </span>
                                 )}
                               </div>
                             );
                           };
                           
                           return (
                             <>
                               <div className="space-y-3 lg:space-y-4">{allItems.slice(0, half).map(renderItem)}</div>
                               <div className="space-y-3 lg:space-y-4">{allItems.slice(half).map(renderItem)}</div>
                             </>
                           );
                        })()}
                      </div>

                      {/* Add Form */}
                      <form onSubmit={handleAddBucketGoal} className="mt-12 pt-6 border-t-[2px] border-dashed border-[#5C0612]/20 flex flex-col items-center justify-center font-hand relative z-10 w-full">
                        <div className="flex w-full max-w-[90%] bg-white border-[3px] border-[#5C0612] rounded-full overflow-hidden px-2 py-1.5 shadow-[2px_2px_0_#5C0612] focus-within:bg-white transition-all">
                          <span className="pl-3 pt-0.5 text-[#eab308] text-xl">✨</span>
                          <input type="text" placeholder="Thêm mục tiêu vào Bucket List..." value={newBucketGoalTitle} onChange={e => setNewBucketGoalTitle(e.target.value)} className="flex-1 px-3 py-1 text-xs md:text-sm font-bold text-[#5C0612] bg-transparent outline-none placeholder-[#5C0612]/50 font-hand" required />
                          <button type="submit" className="px-5 py-1.5 bg-[#5C0612] hover:bg-black text-white rounded-full text-[10px] md:text-xs font-bold tracking-widest transition-colors font-hand shrink-0 uppercase cursor-pointer">Ghi Nhanh</button>
                        </div>
                      </form>

                      

                  </div>
              </div>
            </div>

        
        </div>
{/* BOTTOM: PERSONAL FINANCE OVERVIEW */}
        <div className="pt-20 pb-12 w-full flex flex-col items-center justify-center">
           <h3 className="text-center font-hand font-black text-2xl md:text-3xl text-[#8A1E2B] tracking-[0.2em] uppercase mb-10 w-fit mx-auto border-b-2 border-dashed border-[#8A1E2B]/30 pb-2">PERSONAL FINANCE OVERVIEW</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-40 pointer-events-none grayscale max-w-4xl w-full">
              {/* Simplified overview from previous logic */}
              <div className="bg-[#f7ebe1] p-6 border-[3px] border-[#8A1E2B] text-center rounded-[30px] rounded-tl-none">
                 <h4 className="font-hand font-bold text-[#8A1E2B] text-sm uppercase mb-2">TỔNG THU NHẬP</h4>
                 <p className="text-2xl font-hand font-black text-[#8A1E2B]">{salaryInput} đ</p>
              </div>
              <div className="bg-[#f7ebe1] p-6 border-[3px] border-[#8A1E2B] text-center rounded-[30px] rounded-tr-none">
                 <h4 className="font-hand font-bold text-[#8A1E2B] text-sm uppercase mb-2">ĐÃ LÊN KẾ HOẠCH</h4>
                 <p className="text-2xl font-hand font-black text-[#8A1E2B]">{totalPlannedOutflows.toLocaleString('vi-VN')} đ</p>
              </div>
              <div className="bg-[#f7ebe1] p-6 border-[3px] border-[#8A1E2B] text-center rounded-[30px] rounded-br-none md:col-span-1 border-dashed">
                 <h4 className="font-hand font-bold text-[#8A1E2B] text-sm uppercase mb-2">DƯ KIẾN CÒN LẠI</h4>
                 <p className="text-2xl font-hand font-black text-[#8A1E2B]">{remainingBalance.toLocaleString('vi-VN')} đ</p>
              </div>
           </div>
        </div>

      
      {/* CALENDAR DETAILS MODAL */}
      <AnimatePresence>
        {isCalendarDetailsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              ref={calendarContainerRef}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#FAF3EB] w-full max-w-sm rounded-[30px] border-[3px] border-[#5C0612] shadow-[8px_8px_0_rgba(92,6,18,0.15)] flex flex-col font-caveat"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b-[2px] border-dashed border-[#5C0612]/30">
                <h3 className="font-black text-[#5C0612] text-xl flex items-center gap-2">
                  <span className="text-2xl">📅</span> {selectedDateStr}
                </h3>
                <button onClick={() => setIsCalendarDetailsOpen(false)} className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-[#5C0612] transition-colors">
                  <svg className="w-5 h-5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
                
                {/* 1. Add Sticker */}
                <div className="space-y-3">
                  <h4 className="font-bold text-[#5C0612] text-sm uppercase tracking-wider flex items-center gap-2">
                    <span className="text-lg">✨</span> Thêm Sticker
                  </h4>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {STICKER_PRESETS.map(preset => {
                      const activeSticker = dayStickers[selectedDateStr];
                      const isSelected = activeSticker?.type === 'preset' && activeSticker?.data === preset.id;
                      const isNoneSelected = preset.id === "none" && !activeSticker;

                      return (
                        <button
                          key={preset.id}
                          onClick={() => setDayStickerValue(selectedDateStr, preset.id)}
                          className={cn(
                            "p-1 border text-[9px] font-sans font-bold rounded flex flex-col items-center gap-0.5 bg-white/50 transition-all text-center justify-center h-[46px] cursor-pointer",
                            isSelected || isNoneSelected
                              ? "border-[#5C0612] bg-[#5C0612]/10 text-[#5C0612] scale-105" 
                              : "border-[#5C0612]/20 hover:border-[#5C0612]/50 text-[#5C0612]/70"
                          )}
                        >
                          {preset.id !== "none" && <PolaroidPreset type={preset.visual || preset.id} className="w-5 h-5" />}
                          {preset.id === "none" && <span className="text-sm">❌</span>}
                          <span className="truncate w-full block">{preset.id === "none" ? "Gỡ bỏ" : preset.label.split(" ").slice(1).join(" ")}</span>
                        </button>
                      );
                    })}
                  </div>
                  <label className="flex items-center gap-2 mt-2 w-fit bg-[#FAF3EB] border-[2px] border-[#5C0612] rounded-full px-4 py-2 cursor-pointer hover:bg-[#5C0612] hover:text-[#FAF3EB] transition-all text-[#5C0612] font-bold text-sm shadow-[2px_2px_0_#5C0612]">
                    <svg className="w-4 h-4 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8 Q3 7 4 7 L6 4 Q7 3 8 3 L14 3 Q15 3 16 4 L18 7 Q19 7 20 7 L21 7 Q22 7 22 8 L22 19 Q22 20 21 20 L3 20 Q2 20 2 19 Z"/><path d="M12 11 Q14 11 15 14 Q15 16 12 17 Q9 16 10 14 Z"/></svg>
                    Tải ảnh lên...
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleStickerFileChange(selectedDateStr, e)} />
                  </label>
                </div>

                {/* 2. Highlight Ring */}
                <div className="space-y-3 pt-4 border-t-[2px] border-dashed border-[#5C0612]/20">
                  <h4 className="font-bold text-[#5C0612] text-sm uppercase tracking-wider flex items-center gap-2">
                    <span className="text-lg">⭕</span> Làm nổi bật ngày
                  </h4>
                  <button 
                    onClick={() => toggleDayRing(selectedDateStr)}
                    className={`w-full py-2.5 rounded-full font-bold text-sm transition-all border-[2px] ${dayRings[selectedDateStr] ? 'bg-[#5C0612] text-[#FAF3EB] border-[#5C0612]' : 'bg-transparent text-[#5C0612] border-[#5C0612] hover:bg-[#5C0612]/10'} shadow-[3px_3px_0_rgba(92,6,18,1)]`}
                  >
                    {dayRings[selectedDateStr] ? 'Đã khoanh đỏ (Nhấn để hủy)' : 'Khoanh đỏ ngày này'}
                  </button>
                </div>

                {/* 3. Quick Note */}
                <div className="space-y-3 pt-4 border-t-[2px] border-dashed border-[#5C0612]/20">
                  <h4 className="font-bold text-[#5C0612] text-sm uppercase tracking-wider flex items-center gap-2">
                    <span className="text-lg">✍️</span> Thêm ghi chú nhanh
                  </h4>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!quickLogContent.trim() || !setLogs) return;
                    setLogs([{
                      id: "log_" + Date.now().toString(),
                      date: selectedDateStr,
                      content: quickLogContent.trim(),
                      location: quickLogLocation.trim() || undefined,
                      emoji: quickLogEmoji,
                      type: quickLogType as 'Reflection' | 'Event',
                      createdAt: Date.now()
                    }, ...logs]);
                    setQuickLogContent("");
                    setQuickLogLocation("");
                    setIsCalendarDetailsOpen(false);
                  }} className="flex flex-col gap-3">
                    <input type="text" placeholder="Bạn đã làm gì?" value={quickLogContent} onChange={e => setQuickLogContent(e.target.value)} className="w-full bg-white/50 border-[2px] border-[#5C0612] rounded-xl px-3 py-2 text-sm font-bold text-[#5C0612] placeholder-[#5C0612]/50 outline-none focus:bg-white transition-colors" required />
                    <div className="flex gap-2">
                      <select value={quickLogEmoji} onChange={e => setQuickLogEmoji(e.target.value)} className="bg-white/50 border-[2px] border-[#5C0612] rounded-xl px-2 py-2 text-sm outline-none w-16 text-center cursor-pointer">
                         <option value="📝">📝</option>
                         <option value="⭐">⭐</option>
                         <option value="❤️">❤️</option>
                         <option value="🎉">🎉</option>
                         <option value="☕">☕</option>
                         <option value="✈️">✈️</option>
                         <option value="🌧️">🌧️</option>
                      </select>
                      <input type="text" placeholder="Địa điểm (ops)" value={quickLogLocation} onChange={e => setQuickLogLocation(e.target.value)} className="flex-1 bg-white/50 border-[2px] border-[#5C0612] rounded-xl px-3 py-2 text-sm font-bold text-[#5C0612] placeholder-[#5C0612]/50 outline-none focus:bg-white transition-colors" />
                    </div>
                    <button type="submit" className="w-full bg-[#5C0612] text-[#FAF3EB] font-bold py-2.5 rounded-xl uppercase tracking-widest text-xs hover:bg-black transition-colors mt-2 shadow-[3px_3px_0_rgba(0,0,0,1)]">
                      Lưu ghi chú
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
</div>
    </div>
  );
}
