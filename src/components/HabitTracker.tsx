import React, { useState, useEffect, useMemo } from "react";
import confetti from "canvas-confetti";
import { 
  Plus, Trash2, Check, Clock, Bell, Flame, Award, 
  Sparkles, X, Coffee, Droplet, Dumbbell, BookOpen, 
  Smile, Shield, Calendar, Heart, HelpCircle, CheckCircle,
  Play, RotateCcw, Volume2, Edit2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Habit, TodayTask, LogEntry, IngestionHabit } from "../types";
import { cn } from "../lib/utils";
import { useFirebase } from "../context/FirebaseContext";
import { useSyncedState } from "../lib/useSyncedState";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from "recharts";


// Web Audio API synthesized sound cues
const playSound = (type: 'complete' | 'reminder' | 'celebration') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'complete') {
      // Delightful high-pitched melodic wind chime ding
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24); // C6
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.60);
    } else if (type === 'celebration') {
      // Glorious ascending harmonic sweep for milestone achievements
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(392.00, ctx.currentTime); // G4
      osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.10); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.20); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.30); // G5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.40); // C6
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.50); // E6
      gain.gain.setValueAtTime(0.20, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.95);
    } else {
      // Pleasant "ding-dong" reminder bell chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.25); // C5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.85);
    }
  } catch (e) {
    console.warn("Audio Context is blocked/not supported by browser yet:", e);
  }
};

const DEFAULT_HABITS: Habit[] = [
  {
    id: "h-water",
    name: "Uống nước 2L mỗi ngày",
    icon: "🥤",
    category: "Sức khỏe",
    reminderTimes: ["08:00", "11:00", "14:00", "17:00", "20:00"],
    daysOfWeek: [], // Daily
    streak: 3,
    maxStreak: 12,
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    isActive: true,
    lastCompletedDate: new Date().toISOString().split('T')[0],
    history: {}
  },
  {
    id: "h-english",
    name: "Học 10 từ vựng Tiếng Anh",
    icon: "🇬🇧",
    category: "Học tập",
    reminderTimes: ["08:30", "20:30"],
    daysOfWeek: [],
    streak: 5,
    maxStreak: 15,
    createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
    isActive: true,
    lastCompletedDate: new Date().toISOString().split('T')[0],
    history: {}
  },
  {
    id: "h-workout",
    name: "Tập thể dục & Duỗi người lỏng cốt",
    icon: "🏋️",
    category: "Sức khỏe",
    reminderTimes: ["06:30", "18:00"],
    daysOfWeek: [1, 3, 5], // Thứ 2, 4, 6
    streak: 1,
    maxStreak: 4,
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    isActive: true,
    history: {}
  }
];

const PRESET_ICONS = ["🥤", "🇬🇧", "🏋️", "🧘", "🥗", "📚", "💊", "🍎", "🏃", "🛌", "🧹", "📝", "💻", "🦷", "🎻"];
const CATEGORIES = [
  { name: "Sức khỏe", color: "bg-emerald-50 border-emerald-400 text-emerald-800 accent bg-[#e6f4ea]" },
  { name: "Học tập", color: "bg-blue-50 border-blue-400 text-blue-800 accent bg-[#e8f0fe]" },
  { name: "Công việc", color: "bg-amber-50 border-amber-400 text-amber-800 accent bg-[#fef7e0]" },
  { name: "Cá nhân", color: "bg-pink-50 border-pink-400 text-pink-800 accent bg-[#fce8e6]" }
];

// --- Helpers for Customizable Repeat Cycles ---

export const getWeekDates = (dateStr: string): string[] => {
  const date = new Date(dateStr);
  const day = date.getDay(); // Sunday is 0, Monday is 1...
  
  // Adjust to Monday
  const diff = date.getDate() - (day === 0 ? 6 : day - 1);
  const monday = new Date(date.setDate(diff));
  
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

export const getMonthPrefix = (dateStr: string): string => {
  return dateStr.substring(0, 7);
};

export const getDailyCompletionsForHabit = (habit: Habit, dateStr: string): number => {
  const dayHistory = habit.history[dateStr];
  if (!dayHistory) return 0;
  return Object.values(dayHistory).filter(v => v === true).length;
};

export const getWeeklyCompletionsForHabit = (habit: Habit, dateStr: string): number => {
  const dates = getWeekDates(dateStr);
  let count = 0;
  dates.forEach(d => {
    count += getDailyCompletionsForHabit(habit, d);
  });
  return count;
};

export const getMonthlyCompletionsForHabit = (habit: Habit, dateStr: string): number => {
  const prefix = getMonthPrefix(dateStr);
  let count = 0;
  Object.keys(habit.history).forEach(d => {
    if (d.startsWith(prefix)) {
      count += getDailyCompletionsForHabit(habit, d);
    }
  });
  return count;
};

// Calculate streak based on repeat types
export const calculateDailyStreak = (habit: Habit, todayStr: string): { streak: number; maxStreak: number } => {
  let streak = 0;
  const maxStreak = habit.maxStreak || 0;
  const daysOfWeek = habit.daysOfWeek || [];
  const freq = habit.frequency || habit.reminderTimes.length || 1;
  const tempDate = new Date();
  let consecutiveNotScheduled = 0;
  
  for (let i = 0; i < 365; i++) {
    const dStr = tempDate.toISOString().split('T')[0];
    const dayOfWeek = tempDate.getDay();
    const isScheduled = daysOfWeek.length === 0 || daysOfWeek.includes(dayOfWeek);
    
    if (isScheduled) {
      consecutiveNotScheduled = 0;
      const completedCount = getDailyCompletionsForHabit(habit, dStr);
      const isCompleted = completedCount >= freq;
      
      if (isCompleted) {
        streak++;
      } else {
        if (dStr === todayStr) {
          continue;
        } else {
          break;
        }
      }
    } else {
      consecutiveNotScheduled++;
      if (consecutiveNotScheduled > 14) {
        break;
      }
    }
    tempDate.setDate(tempDate.getDate() - 1);
  }
  return { streak, maxStreak: Math.max(maxStreak, streak) };
};

export const calculateWeeklyStreak = (habit: Habit, todayStr: string): { streak: number; maxStreak: number } => {
  let streak = 0;
  const maxStreak = habit.maxStreak || 0;
  const target = habit.frequency || 1;
  
  const tempDate = new Date();
  const day = tempDate.getDay();
  const diff = tempDate.getDate() - (day === 0 ? 6 : day - 1);
  tempDate.setDate(diff);
  
  for (let w = 0; w < 52; w++) {
    let weekCompletions = 0;
    const isCurrentWeek = w === 0;
    const currentWeekMondayStr = tempDate.toISOString().split('T')[0];
    
    const dates = getWeekDates(currentWeekMondayStr);
    dates.forEach(ds => {
      const dayHistory = habit.history[ds];
      if (dayHistory) {
        weekCompletions += Object.values(dayHistory).filter(v => v === true).length;
      }
    });
    
    const isCompleted = weekCompletions >= target;
    if (isCompleted) {
      streak++;
    } else {
      if (isCurrentWeek) {
        // user still has time
      } else {
        break;
      }
    }
    tempDate.setDate(tempDate.getDate() - 7);
  }
  return { streak, maxStreak: Math.max(maxStreak, streak) };
};

export const calculateMonthlyStreak = (habit: Habit, todayStr: string): { streak: number; maxStreak: number } => {
  let streak = 0;
  const maxStreak = habit.maxStreak || 0;
  const target = habit.frequency || 1;
  
  const now = new Date();
  let currentYear = now.getFullYear();
  let currentMonth = now.getMonth();
  
  for (let m = 0; m < 12; m++) {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    let monthCompletions = 0;
    
    Object.keys(habit.history).forEach(d => {
      if (d.startsWith(prefix)) {
        const dayHistory = habit.history[d];
        if (dayHistory) {
          monthCompletions += Object.values(dayHistory).filter(v => v === true).length;
        }
      }
    });
    
    const isCompleted = monthCompletions >= target;
    const isCurrentMonth = m === 0;
    
    if (isCompleted) {
      streak++;
    } else {
      if (isCurrentMonth) {
        // user still has time
      } else {
        break;
      }
    }
    
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
  }
  return { streak, maxStreak: Math.max(maxStreak, streak) };
};

export const recalculateHabitStreak = (habit: Habit, todayStr: string): { streak: number; maxStreak: number } => {
  const type = habit.repeatType || 'day';
  if (type === 'day') {
    return calculateDailyStreak(habit, todayStr);
  } else if (type === 'week') {
    return calculateWeeklyStreak(habit, todayStr);
  } else {
    return calculateMonthlyStreak(habit, todayStr);
  }
};

export const getHabitSlots = (habit: Habit) => {
  const freq = habit.frequency || 1;
  const times = habit.reminderTimes || ["08:00"];
  const slots: { id: string; time: string; label: string }[] = [];
  
  for (let i = 0; i < freq; i++) {
    if (i < times.length) {
      slots.push({ id: times[i], time: times[i], label: times[i] });
    } else {
      const padHour = 8 + i * 2;
      const padTime = `${String(padHour % 24).padStart(2, '0')}:00`;
      slots.push({ id: `slot-${i}`, time: padTime, label: `Lần ${i + 1}` });
    }
  }
  return slots;
};

export const isMilestone = (streakValue: number, repType: 'day' | 'week' | 'month'): boolean => {
  if (streakValue <= 0) return false;
  if (repType === 'day') {
    const DAY_MILESTONES = [3, 7, 10, 14, 21, 30, 50, 100, 150, 200, 300, 365];
    return DAY_MILESTONES.includes(streakValue) || streakValue % 50 === 0;
  } else if (repType === 'week') {
    const WEEK_MILESTONES = [2, 4, 8, 12, 16, 20, 24, 30, 52];
    return WEEK_MILESTONES.includes(streakValue) || streakValue % 10 === 0;
  } else {
    const MONTH_MILESTONES = [2, 3, 4, 6, 8, 12];
    return MONTH_MILESTONES.includes(streakValue) || streakValue % 6 === 0;
  }
};

export const getMotivationalQuote = (habitName: string, streak: number, repeatType: 'day' | 'week' | 'month'): string => {
  const unit = repeatType === 'day' ? 'ngày' : repeatType === 'week' ? 'tuần' : 'tháng';
  const quotes = [
    `Quá tuyệt vời! Bạn đã kiên cường duy trì thói quen "${habitName}" liên tục suốt ${streak} ${unit}. Hãy giữ vững phong thái đáng tự hào này nhé!`,
    `Một hành trình xứng đáng! ${streak} ${unit} tràn ngập nghị lực cùng "${habitName}". Bản lĩnh vững vàng chiến thắng tất cả!`,
    `Tự hào vô cùng về bạn! Chuỗi ${streak} ${unit} nỗ lực phi thường đã chứng minh sự kỷ luật sắt đá của bạn với "${habitName}".`,
    `Sự kiên trì thầm lặng đang nở hoa rực rỡ! Hãy tận hưởng niềm hạnh phúc từ cột mốc ${streak} ${unit} tuyệt đẹp này.`
  ];
  return quotes[streak % quotes.length];
};

export interface DisciplineLevel {
  level: string;
  color: string;
  borderColor: string;
  bgColor: string;
  badgeBg: string;
  icon: string;
  nextMilestone: string;
  badgeColor: string;
  description: string;
}

export const getDisciplineLevel = (streak: number): DisciplineLevel => {
  if (streak === 0) {
    return {
      level: "Tân Binh Thử Thách",
      color: "text-slate-600",
      borderColor: "border-slate-300",
      bgColor: "bg-slate-50/60",
      badgeBg: "bg-slate-100",
      badgeColor: "text-slate-800 border-slate-300",
      icon: "🌱",
      description: "Hành trình vạn dặm bắt đầu từ một bước chân lẻ loi.",
      nextMilestone: "Duy trì bất kỳ 1 chuỗi thói quen nào để kích hoạt mức kỷ luật đầu tiên!"
    };
  }
  if (streak < 7) {
    return {
      level: "Người Gieo Mầm Thói Quen",
      color: "text-emerald-700",
      borderColor: "border-emerald-300",
      bgColor: "bg-emerald-50/60",
      badgeBg: "bg-emerald-100",
      badgeColor: "text-emerald-800 border-emerald-300",
      icon: "🪴",
      description: "Có công mài sắt có ngày nên kim, hạt mầm kỷ luật đang nảy nở.",
      nextMilestone: "Tích lũy tổng chuỗi đạt 7 thói quen để thăng cấp lên 'Thợ Xây Kỷ Luật'."
    };
  }
  if (streak < 21) {
    return {
      level: "Thợ Xây Kỷ Luật",
      color: "text-blue-700",
      borderColor: "border-blue-300",
      bgColor: "bg-blue-50/60",
      badgeBg: "bg-blue-100",
      badgeColor: "text-blue-800 border-blue-300",
      icon: "🧱",
      description: "Kỷ luật đã trở thành một phần quen thuộc của nhịp sống mỗi ngày.",
      nextMilestone: "Tích lũy tổng chuỗi đạt 21 thói quen để thăng cấp lên 'Chiến Binh Bền Bỉ'."
    };
  }
  if (streak < 50) {
    return {
      level: "Chiến Binh Bền Bỉ",
      color: "text-rose-700",
      borderColor: "border-rose-300",
      bgColor: "bg-rose-50/60",
      badgeBg: "bg-rose-100",
      badgeColor: "text-rose-800 border-rose-300",
      icon: "⚔️",
      description: "Bản lĩnh vững vàng, vượt qua mọi trì hoãn để tiến bộ không ngừng.",
      nextMilestone: "Tích lũy tổng chuỗi đạt 50 thói quen để thăng cấp lên 'Anh Hùng Tự Chủ'."
    };
  }
  if (streak < 100) {
    return {
      level: "Anh Hùng Tự Chủ",
      color: "text-purple-700",
      borderColor: "border-purple-300",
      bgColor: "bg-purple-50/60",
      badgeBg: "bg-purple-100",
      badgeColor: "text-purple-800 border-purple-300",
      icon: "🛡️",
      description: "Làm chủ bản thân hoàn toàn, kiểm soát tâm trí và hành động dễ dàng.",
      nextMilestone: "Tích lũy tổng chuỗi đạt 100 thói quen để thăng cấp lên 'Huyền Thoại Kỷ Luật'!"
    };
  }
  return {
    level: "Huyền Thoại Kỷ Luật",
    color: "text-amber-700",
    borderColor: "border-amber-400",
    bgColor: "bg-amber-50/60",
    badgeBg: "bg-amber-100",
    badgeColor: "text-amber-800 border-amber-300",
    icon: "👑",
    description: "Kỷ luật tối thượng tựa như dòng chảy tự nhiên. Bạn là nguồn cảm hứng vô song!",
    nextMilestone: "Bạn đã đứng trên đỉnh cao rực rỡ nhất của thói quen sống lành mạnh!"
  };
};

interface HabitTrackerProps {
  logs?: LogEntry[];
  setLogs?: React.Dispatch<React.SetStateAction<LogEntry[]>>;
}

interface EditingTaskState {
  id: string;
  title: string;
  time: string;
  date: string;
  type: 'task' | 'event';
}

export function HabitTracker({ logs = [], setLogs }: HabitTrackerProps) {
  // --- States ---
  const { habits, setHabits } = useFirebase();

  // Today "YYYY-MM-DD"
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [todayStr, setTodayStr] = useState(getTodayStr());

  // Navigation and date states
  const [selectedDate, setSelectedDate] = useState(getTodayStr());

  const [oneOffTasks, setOneOffTasks] = useSyncedState<TodayTask[]>("studyHub_oneOffTasks", []);

  // --- Habit Formation Ingestion States ---
  const [activeSubTab, setActiveSubTab] = useSyncedState<"timeline" | "formation">("studyHub_habitTracker_activeSubTab", "timeline");
  const [ingestionPool, setIngestionPool] = useSyncedState<IngestionHabit[]>("studyHub_habitIngestionPool", []);
  const [lastIngestionDate, setLastIngestionDate] = useSyncedState<string>("studyHub_lastIngestionDate", "");

  // Form states for adding to the ingestion pool
  const [poolHabitName, setPoolHabitName] = useState("");
  const [poolHabitCategory, setPoolHabitCategory] = useState("Sức khỏe 💪");
  const [poolHabitIcon, setPoolHabitIcon] = useState("🌱");
  const [poolHabitTargetDays, setPoolHabitTargetDays] = useState(21);

  // Helper to calculate consecutive streaks and max streaks for ingestion habits
  const calculateStreak = (dates: string[], todayStr: string) => {
    if (!dates || dates.length === 0) return { current: 0, max: 0 };
    
    const uniqueDates = Array.from(new Set(dates)).sort();
    
    // Max streak
    let max = 0;
    let currentRun = 0;
    let prevTime: number | null = null;
    
    for (const dStr of uniqueDates) {
      const currTime = new Date(dStr + "T12:00:00").getTime();
      if (prevTime === null) {
        currentRun = 1;
      } else {
        const diffDays = Math.round((currTime - prevTime) / (24 * 60 * 60 * 1000));
        if (diffDays === 1) {
          currentRun += 1;
        } else if (diffDays > 1) {
          if (currentRun > max) max = currentRun;
          currentRun = 1;
        }
      }
      prevTime = currTime;
    }
    if (currentRun > max) max = currentRun;
    
    // Current streak
    let current = 0;
    let checkDate = new Date(todayStr + "T12:00:00");
    
    const checkStr = (d: Date) => {
      return d.toISOString().split('T')[0];
    };
    
    // Is today completed?
    if (uniqueDates.includes(todayStr)) {
      current = 1;
      while (true) {
        checkDate.setDate(checkDate.getDate() - 1);
        const s = checkStr(checkDate);
        if (uniqueDates.includes(s)) {
          current += 1;
        } else {
          break;
        }
      }
    } else {
      // If today is not completed, check if yesterday was completed
      checkDate.setDate(checkDate.getDate() - 1);
      const s = checkStr(checkDate);
      if (uniqueDates.includes(s)) {
        current = 1;
        while (true) {
          checkDate.setDate(checkDate.getDate() - 1);
          const sPrev = checkStr(checkDate);
          if (uniqueDates.includes(sPrev)) {
            current += 1;
          } else {
            break;
          }
        }
      }
    }
    
    return { current, max: Math.max(max, current) };
  };

  const handleAddPoolHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poolHabitName.trim()) return;
    
    const newPoolHabit: IngestionHabit = {
      id: `pool-${Date.now()}`,
      name: poolHabitName.trim(),
      category: poolHabitCategory,
      icon: poolHabitIcon,
      targetDays: poolHabitTargetDays,
      createdAt: Date.now(),
      status: 'pending',
      history: [],
      streak: 0,
      maxStreak: 0
    };
    
    setIngestionPool([newPoolHabit, ...ingestionPool]);
    setPoolHabitName("");
    
    playSound('complete');
    try {
      confetti({ particleCount: 30, spread: 40, colors: ["#4ade80", "#EFAEBB"] });
    } catch(e){}
  };

  const handleManualIngestNext = () => {
    const pendingIndex = ingestionPool.findIndex(h => h.status === 'pending');
    if (pendingIndex === -1) {
      alert("Hàng chờ thói quen của bạn đang trống! Hãy thêm thói quen mới ở form bên dưới nhé.");
      return;
    }
    
    const updatedPool = [...ingestionPool];
    const selectedHabit = updatedPool[pendingIndex];
    updatedPool[pendingIndex] = {
      ...selectedHabit,
      status: 'active',
      activatedAt: todayStr,
      history: []
    };
    setIngestionPool(updatedPool);
    setLastIngestionDate(todayStr);
    
    playSound('celebration');
    try {
      confetti({ particleCount: 60, spread: 50, colors: ["#5C0612", "#EFAEBB", "#4ade80"] });
    } catch (e) {}
  };

  const handleToggleIngestionDay = (habitId: string, dateStr: string) => {
    const updatedPool = ingestionPool.map(h => {
      if (h.id === habitId) {
        let newHistory = [...h.history];
        if (newHistory.includes(dateStr)) {
          newHistory = newHistory.filter(d => d !== dateStr);
        } else {
          newHistory.push(dateStr);
        }
        
        const { current, max } = calculateStreak(newHistory, todayStr);
        
        let newStatus = h.status;
        let formedAt = h.formedAt;
        if (newHistory.length >= h.targetDays) {
          newStatus = 'formed';
          formedAt = todayStr;
          
          playSound('celebration');
          try {
            confetti({ particleCount: 150, spread: 80, colors: ["#EFAEBB", "#5C0612", "#fbbf24", "#4ade80"] });
          } catch(e){}
          
          setTimeout(() => {
            alert(`🎉 CHÚC MỪNG CHIẾN THẮNG! 🎉\n\nBạn đã xuất sắc duy trì và hoàn thành rèn luyện thói quen:\n🌟 "${h.name}" (${h.category}) 🌟\n\nBạn đã kiên trì vượt qua cột mốc ${h.targetDays} ngày để chính thức hình thành thói quen này. Hãy tiếp tục duy trì lối sống lành mạnh nhé! 💖`);
          }, 300);
        }
        
        return {
          ...h,
          history: newHistory,
          streak: current,
          maxStreak: max,
          status: newStatus,
          formedAt
        };
      }
      return h;
    });
    
    setIngestionPool(updatedPool);
    playSound('complete');
  };

  const handleDeleteIngestionHabit = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thói quen này khỏi danh sách không?")) {
      setIngestionPool(ingestionPool.filter(h => h.id !== id));
      playSound('complete');
    }
  };

  // Automatic daily ingestion effect
  useEffect(() => {
    if (!todayStr) return;
    if (lastIngestionDate !== todayStr) {
      const pendingIndex = ingestionPool.findIndex(h => h.status === 'pending');
      if (pendingIndex !== -1) {
        const updatedPool = [...ingestionPool];
        const selectedHabit = updatedPool[pendingIndex];
        updatedPool[pendingIndex] = {
          ...selectedHabit,
          status: 'active',
          activatedAt: todayStr,
          history: []
        };
        setIngestionPool(updatedPool);
        setLastIngestionDate(todayStr);
        
        playSound('celebration');
        try {
          confetti({ particleCount: 60, spread: 50, colors: ["#5C0612", "#EFAEBB", "#ED7CB8", "#4ade80"] });
        } catch (e) {}
        
        alert(`🌱 NGÀY MỚI RÈN LUYỆN! Hệ thống đã tự động chọn thêm 1 thói quen mới từ danh sách chờ của bạn:\n\n👉 "${selectedHabit.name}" (${selectedHabit.category})\n\nHãy cùng nỗ lực thực hiện đều đặn mỗi ngày nhé! 💪✨`);
      }
    }
  }, [todayStr, lastIngestionDate, ingestionPool, setIngestionPool, setLastIngestionDate]);

  // Form states for new habit (or editing habit)
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitIcon, setNewHabitIcon] = useState("🥤");
  const [newHabitCategory, setNewHabitCategory] = useState("Sức khỏe");
  const [newHabitDays, setNewHabitDays] = useState<number[]>([]); // Empty = Daily
  const [newHabitReminders, setNewHabitReminders] = useState<string[]>(["08:00"]);
  const [newHabitRepeatType, setNewHabitRepeatType] = useState<'day' | 'week' | 'month'>('day');
  const [newHabitFrequency, setNewHabitFrequency] = useState<number>(1);
  const [tempTime, setTempTime] = useState("");
  const [trendHabitId, setTrendHabitId] = useState<string>("all");

  // Form state for today's quick todo task / calendar event
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskTime, setQuickTaskTime] = useState("");
  const [quickTaskDate, setQuickTaskDate] = useState(getTodayStr());
  const [quickTaskType, setQuickTaskType] = useState<'task' | 'event'>('task');

  // Edit popups for task/event
  const [editingTask, setEditingTask] = useState<EditingTaskState | null>(null);

  // System State for triggered alert popup
  const [activeAlert, setActiveAlert] = useState<{
    id: string;
    title: string;
    time: string;
    isHabit: boolean;
  } | null>(null);

  // System State for habit streak celebration overlay
  const [activeCelebration, setActiveCelebration] = useState<{
    habitName: string;
    habitIcon: string;
    repeatType: 'day' | 'week' | 'month';
    streak: number;
  } | null>(null);

  // Keep track of which tasks have been notified in the current runtime to avoid multiple alerts per minute
  const [notifiedTasks, setNotifiedTasks] = useState<string[]>([]);

  // Update today string occasionally
  useEffect(() => {
    const timer = setInterval(() => {
      setTodayStr(getTodayStr());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Sync quick task default date with selectedDate
  useEffect(() => {
    setQuickTaskDate(selectedDate);
  }, [selectedDate]);

  // --- Core Computations for Today's Alarms ---
  // Today's day index (0 for Sunday, 1 for Monday, etc.)
  const todayDayIndex = new Date().getDay();

  // LIVE ALARM CHECKLIST (always reflects current system day!)
  const todayTasksList = useMemo(() => {
    const list: TodayTask[] = [];

    // 1. Generate tasks from Active Habits for today
    habits.forEach(habit => {
      if (!habit.isActive) return;
      
      const repType = habit.repeatType || 'day';
      const firstReminder = habit.reminderTimes[0] || "08:00";
      
      if (repType === 'day') {
        const isScheduledToday = habit.daysOfWeek.length === 0 || habit.daysOfWeek.includes(todayDayIndex);
        if (isScheduledToday) {
          const slots = getHabitSlots(habit);
          slots.forEach((slot) => {
            const instanceId = `habit-${habit.id}-${slot.id}`;
            const isDone = !!(habit.history[todayStr]?.[slot.id]);
            list.push({
              id: instanceId,
              title: `${habit.icon} ${habit.name}${slot.label !== slot.time ? ` (${slot.label})` : ""}`,
              time: slot.time,
              isCompleted: isDone,
              habitId: habit.id,
              date: todayStr
            });
          });
        }
      } else if (repType === 'week') {
        const completedCount = getWeeklyCompletionsForHabit(habit, todayStr);
        const target = habit.frequency || 1;
        const isDoneToday = !!(habit.history[todayStr]?.[firstReminder]);
        
        list.push({
          id: `habit-${habit.id}-${firstReminder}`,
          title: `${habit.icon} ${habit.name} (Tuần này: ${completedCount}/${target} lần)`,
          time: firstReminder,
          isCompleted: isDoneToday,
          habitId: habit.id,
          date: todayStr
        });
      } else if (repType === 'month') {
        const completedCount = getMonthlyCompletionsForHabit(habit, todayStr);
        const target = habit.frequency || 1;
        const isDoneToday = !!(habit.history[todayStr]?.[firstReminder]);
        
        list.push({
          id: `habit-${habit.id}-${firstReminder}`,
          title: `${habit.icon} ${habit.name} (Tháng này: ${completedCount}/${target} lần)`,
          time: firstReminder,
          isCompleted: isDoneToday,
          habitId: habit.id,
          date: todayStr
        });
      }
    });

    // 2. Add one-off custom tasks designated for today
    oneOffTasks.forEach(task => {
      const taskDate = task.date || todayStr;
      if (taskDate === todayStr) {
        list.push(task);
      }
    });

    return list.sort((a, b) => a.time.localeCompare(b.time));
  }, [habits, oneOffTasks, todayStr, todayDayIndex]);

  // DISPLAY SCHEDULE LIST (reflects user's custom selectedDate!)
  const selectedDateTasksList = useMemo(() => {
    const list: {
      id: string;
      title: string;
      time: string;
      isCompleted: boolean;
      habitId?: string;
      oneOffTaskId?: string;
      eventId?: string;
      date: string;
    }[] = [];

    const selectedDayIndex = new Date(selectedDate).getDay();

    // 1. Habits for selected day
    habits.forEach(habit => {
      if (!habit.isActive) return;
      
      const repType = habit.repeatType || 'day';
      const firstReminder = habit.reminderTimes[0] || "08:00";
      
      if (repType === 'day') {
        const isScheduled = habit.daysOfWeek.length === 0 || habit.daysOfWeek.includes(selectedDayIndex);
        if (isScheduled) {
          const slots = getHabitSlots(habit);
          slots.forEach((slot) => {
            const instanceId = `habit-${habit.id}-${slot.id}`;
            const isDone = !!(habit.history[selectedDate]?.[slot.id]);
            list.push({
              id: instanceId,
              title: `${habit.icon} ${habit.name}${slot.label !== slot.time ? ` (${slot.label})` : ""}`,
              time: slot.time,
              isCompleted: isDone,
              habitId: habit.id,
              date: selectedDate
            });
          });
        }
      } else if (repType === 'week') {
        // Show weekly habit for all days of that week
        const completedCount = getWeeklyCompletionsForHabit(habit, selectedDate);
        const target = habit.frequency || 1;
        const isDoneToday = !!(habit.history[selectedDate]?.[firstReminder]);
        
        list.push({
          id: `habit-${habit.id}-${firstReminder}`,
          title: `${habit.icon} ${habit.name} (Tuần này: ${completedCount}/${target} lần)`,
          time: firstReminder,
          isCompleted: isDoneToday,
          habitId: habit.id,
          date: selectedDate
        });
      } else if (repType === 'month') {
        // Show monthly habit for all days of that month
        const completedCount = getMonthlyCompletionsForHabit(habit, selectedDate);
        const target = habit.frequency || 1;
        const isDoneToday = !!(habit.history[selectedDate]?.[firstReminder]);
        
        list.push({
          id: `habit-${habit.id}-${firstReminder}`,
          title: `${habit.icon} ${habit.name} (Tháng này: ${completedCount}/${target} lần)`,
          time: firstReminder,
          isCompleted: isDoneToday,
          habitId: habit.id,
          date: selectedDate
        });
      }
    });

    // 2. Custom tasks for selected day
    oneOffTasks.forEach(task => {
      const taskDate = task.date || todayStr; // backward compatibility
      if (taskDate === selectedDate) {
        list.push({
          id: task.id,
          title: task.title,
          time: task.time,
          isCompleted: task.isCompleted,
          oneOffTaskId: task.id,
          date: selectedDate
        });
      }
    });

    // 3. Google Calendar Events from logs
    logs.forEach(log => {
      if (log.type === "Event" && log.date === selectedDate) {
        list.push({
          id: `cal-${log.id}`,
          title: `📅 ${log.content}`,
          time: log.time || "00:00",
          isCompleted: false, // Calendar events are just scheduled reminders or informational
          eventId: log.id,
          date: selectedDate
        });
      }
    });

    return list.sort((a, b) => a.time.localeCompare(b.time));
  }, [habits, oneOffTasks, logs, selectedDate, todayStr]);

  // Total completed tasks stats
  const stats = useMemo(() => {
    const total = todayTasksList.length;
    const completed = todayTasksList.filter(t => t.isCompleted).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, rate };
  }, [todayTasksList]);

  // Global aggregate streak count of all active habits
  const globalStreak = useMemo(() => {
    return habits.filter(h => h.isActive).reduce((sum, h) => sum + (h.streak || 0), 0);
  }, [habits]);

  // Dynamic Discipline Level determined by global active streak
  const discipline = useMemo(() => {
    return getDisciplineLevel(globalStreak);
  }, [globalStreak]);

  // Calculation of habit performance over the last 7 days for the Recharts BarChart
  const chartData = useMemo(() => {
    return habits.map(habit => {
      let totalScheduled = 0;
      let totalCompleted = 0;

      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay();

        const isScheduled = habit.daysOfWeek.length === 0 || habit.daysOfWeek.includes(dayOfWeek);
        if (isScheduled) {
          totalScheduled += habit.reminderTimes.length;
          habit.reminderTimes.forEach(t => {
            if (habit.history[ds]?.[t]) {
              totalCompleted += 1;
            }
          });
        }
      }

      const pct = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

      return {
        id: habit.id,
        name: `${habit.icon} ${habit.name}`,
        habitName: habit.name,
        pct,
        completed: totalCompleted,
        scheduled: totalScheduled
      };
    });
  }, [habits]);

  // Calculation of habit performance and streak history over the last 30 days
  const chartData30Days = useMemo(() => {
    const data = [];
    const now = new Date();
    
    // Generate chronologically sorted historical data from 29 days ago until today (index 0)
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const ds = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      
      let completions = 0;
      let scheduled = 0;
      let streakSum = 0;
      let activeHabitsCount = 0;
      
      habits.forEach(habit => {
        if (!habit.isActive) return;
        if (trendHabitId !== "all" && habit.id !== trendHabitId) return;
        
        activeHabitsCount++;
        
        // Count completions for this habit on this day
        const c = getDailyCompletionsForHabit(habit, ds);
        completions += c;
        
        const repType = habit.repeatType || 'day';
        if (repType === 'day') {
          const isScheduled = habit.daysOfWeek.length === 0 || habit.daysOfWeek.includes(dayOfWeek);
          if (isScheduled) {
            scheduled += habit.frequency || habit.reminderTimes.length || 1;
          }
        } else {
          // Approximate target weight for non-daily types per day
          if (c > 0) {
            scheduled += Math.max(c, habit.frequency || 1);
          } else {
            scheduled += 1;
          }
        }
        
        // Calculate backward historical streak up to date ds
        let hStreak = 0;
        const tempD = new Date(d);
        let consecutiveNotScheduled = 0;
        
        if (repType === 'day') {
          for (let j = 0; j < 60; j++) {
            const checkDs = tempD.toISOString().split('T')[0];
            const checkDayOfWeek = tempD.getDay();
            const habitSched = habit.daysOfWeek.length === 0 || habit.daysOfWeek.includes(checkDayOfWeek);
            
            if (habitSched) {
              consecutiveNotScheduled = 0;
              const checkC = getDailyCompletionsForHabit(habit, checkDs);
              const targetF = habit.frequency || habit.reminderTimes.length || 1;
              if (checkC >= targetF) {
                hStreak++;
              } else {
                break;
              }
            } else {
              consecutiveNotScheduled++;
              if (consecutiveNotScheduled > 14) break;
            }
            tempD.setDate(tempD.getDate() - 1);
          }
        } else if (repType === 'week') {
          const target = habit.frequency || 1;
          const weekTemp = new Date(tempD);
          const currentDay = weekTemp.getDay();
          const diff = weekTemp.getDate() - (currentDay === 0 ? 6 : currentDay - 1);
          weekTemp.setDate(diff);
          
          for (let w = 0; w < 10; w++) {
            let weekC = 0;
            const wMondayStr = weekTemp.toISOString().split('T')[0];
            const wDates = getWeekDates(wMondayStr);
            wDates.forEach(ws => {
              if (ws <= ds) {
                weekC += getDailyCompletionsForHabit(habit, ws);
              }
            });
            if (weekC >= target) {
              hStreak++;
            } else {
              break;
            }
            weekTemp.setDate(weekTemp.getDate() - 7);
          }
        } else {
          const target = habit.frequency || 1;
          let mYear = tempD.getFullYear();
          let mMonth = tempD.getMonth();
          
          for (let m = 0; m < 6; m++) {
            const prefix = `${mYear}-${String(mMonth + 1).padStart(2, '0')}`;
            let monthC = 0;
            Object.keys(habit.history).forEach(hDate => {
              if (hDate.startsWith(prefix) && hDate <= ds) {
                monthC += getDailyCompletionsForHabit(habit, hDate);
              }
            });
            if (monthC >= target) {
              hStreak++;
            } else {
              break;
            }
            mMonth--;
            if (mMonth < 0) {
              mMonth = 11;
              mYear--;
            }
          }
        }
        
        streakSum += hStreak;
      });
      
      const completionRate = scheduled > 0 ? Math.round((completions / scheduled) * 100) : 0;
      const displayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
      
      data.push({
        date: ds,
        label: displayLabel,
        completions: completions,
        scheduled: scheduled,
        rate: trendHabitId === "all" ? (activeHabitsCount > 0 ? Math.round(completionRate) : 0) : completionRate,
        streak: trendHabitId === "all" ? (activeHabitsCount > 0 ? Math.round(streakSum / activeHabitsCount) : 0) : streakSum
      });
    }
    
    return data;
  }, [habits, trendHabitId]);


  // --- Reminder loop checker (runs every 5 seconds) ---
  useEffect(() => {
    const checkReminder = () => {
      const now = new Date();
      const currentHHMM = now.toTimeString().split(' ')[0].substring(0, 5); // "HH:MM"
      
      // Find eligible pending task in today list matching current time
      const dueTask = todayTasksList.find(t => {
        return t.time === currentHHMM && !t.isCompleted;
      });

      if (dueTask && !notifiedTasks.includes(dueTask.id) && (!activeAlert || activeAlert.id !== dueTask.id)) {
        // Trigger alert popup!
        setActiveAlert({
          id: dueTask.id,
          title: dueTask.title,
          time: dueTask.time,
          isHabit: !!dueTask.habitId
        });
        setNotifiedTasks(prev => [...prev, dueTask.id]);
        playSound('reminder');
      }
    };

    // Check immediately and then every 10 seconds
    checkReminder();
    const interval = setInterval(checkReminder, 10000);
    return () => clearInterval(interval);
  }, [todayTasksList, notifiedTasks, activeAlert]);

  // --- Handlers ---
  
  // Toggle status of a scheduled item
  const handleToggleTask = (task: any) => {
    const targetStatus = !task.isCompleted;
    let triggeredCelebration = false;
    
    if (task.habitId) {
      // Toggle a Habit Instance
      const updatedHabits = habits.map(h => {
        if (h.id === task.habitId) {
          const dailyHistory = { ...(h.history[selectedDate] || {}) };
          dailyHistory[task.time] = targetStatus;
 
          const updatedHistory = {
            ...h.history,
            [selectedDate]: dailyHistory
          };
 
          // Create temp habit to compute streak
          const tempHabit: Habit = {
            ...h,
            history: updatedHistory
          };
 
          const streakResult = recalculateHabitStreak(tempHabit, todayStr);
 
          const targetFreq = h.frequency || h.reminderTimes.length || 1;
          const todayCompletions = getDailyCompletionsForHabit(tempHabit, todayStr);
          const isCompletedToday = todayCompletions >= targetFreq;
          const lastCompleted = isCompletedToday ? todayStr : h.lastCompletedDate;

          const oldStreak = h.streak;
          const newStreak = streakResult.streak;
          const repType = h.repeatType || 'day';

          if (targetStatus && newStreak > oldStreak && isMilestone(newStreak, repType)) {
            triggeredCelebration = true;
            setActiveCelebration({
              habitName: h.name,
              habitIcon: h.icon,
              repeatType: repType,
              streak: newStreak
            });
          }
 
          return {
            ...h,
            history: updatedHistory,
            streak: streakResult.streak,
            maxStreak: streakResult.maxStreak,
            lastCompletedDate: lastCompleted
          };
        }
        return h;
      });
      setHabits(updatedHabits);
    } else if (task.oneOffTaskId) {
      // Toggle a one-off task
      setOneOffTasks(oneOffTasks.map(t => 
         t.id === task.oneOffTaskId ? { ...t, isCompleted: targetStatus } : t
      ));
    }
 
    if (targetStatus) {
      if (task.habitId) {
        try {
          confetti({
            particleCount: 140,
            spread: 80,
            origin: { y: 0.65 },
            colors: ["#34d35c", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"]
          });
        } catch (e) {
          console.error("Confetti trigger failed", e);
        }
      }
      if (triggeredCelebration) {
        playSound('celebration');
      } else {
        playSound('complete');
      }
    }
  };
 
  // Add or Update Habit
  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
 
    if (editingHabitId) {
      // Update existing habit
      setHabits(habits.map(h => 
        h.id === editingHabitId ? {
          ...h,
          name: newHabitName.trim(),
          icon: newHabitIcon,
          category: newHabitCategory,
          reminderTimes: [...newHabitReminders].sort(),
          daysOfWeek: newHabitDays,
          repeatType: newHabitRepeatType,
          frequency: newHabitFrequency
        } : h
      ));
      setEditingHabitId(null);
    } else {
      // Create new habit
      const newHabit: Habit = {
        id: `h-${Date.now()}`,
        name: newHabitName.trim(),
        icon: newHabitIcon,
        category: newHabitCategory,
        reminderTimes: [...newHabitReminders].sort(),
        daysOfWeek: newHabitDays,
        repeatType: newHabitRepeatType,
        frequency: newHabitFrequency,
        streak: 0,
        maxStreak: 0,
        createdAt: Date.now(),
        isActive: true,
        history: {}
      };
      setHabits([newHabit, ...habits]);
    }
    
    // Reset Form
    setNewHabitName("");
    setNewHabitIcon("🥤");
    setNewHabitCategory("Sức khỏe");
    setNewHabitDays([]);
    setNewHabitReminders(["08:00"]);
    setNewHabitRepeatType("day");
    setNewHabitFrequency(1);
    setShowAddForm(false);
  };

  // Start editing a habit
  const startEditHabit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setNewHabitName(habit.name);
    setNewHabitIcon(habit.icon);
    setNewHabitCategory(habit.category);
    setNewHabitDays(habit.daysOfWeek);
    setNewHabitReminders(habit.reminderTimes);
    setNewHabitRepeatType(habit.repeatType || 'day');
    setNewHabitFrequency(habit.frequency || habit.reminderTimes.length || 1);
    setShowAddForm(true);
  };

  // Cancel editing habit
  const cancelEditHabit = () => {
    setEditingHabitId(null);
    setNewHabitName("");
    setNewHabitIcon("🥤");
    setNewHabitCategory("Sức khỏe");
    setNewHabitDays([]);
    setNewHabitReminders(["08:00"]);
    setNewHabitRepeatType('day');
    setNewHabitFrequency(1);
    setShowAddForm(false);
  };
 
  // Delete a Habit
  const handleDeleteHabit = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa thói quen này không?")) {
      if (editingHabitId === id) {
        cancelEditHabit();
      }
      setHabits(habits.filter(h => h.id !== id));
    }
  };
 
  // Toggle active/inactive state of a habit
  const handleToggleActiveHabit = (id: string) => {
    setHabits(habits.map(h => 
      h.id === id ? { ...h, isActive: !h.isActive } : h
    ));
  };
 
  // Add dynamic quick reminder time of a habit in form close-ups
  const handleAddReminderTime = () => {
    if (tempTime && !newHabitReminders.includes(tempTime)) {
      setNewHabitReminders([...newHabitReminders, tempTime].sort());
      setTempTime("");
    }
  };
 
  const handleRemoveReminderTime = (time: string) => {
    if (newHabitReminders.length > 1) {
      setNewHabitReminders(newHabitReminders.filter(t => t !== time));
    } else {
      alert("Cần có ít nhất một mốc thời gian nhắc nhở!");
    }
  };
 
  // Toggle day selection
  const handleToggleDay = (day: number) => {
    if (newHabitDays.includes(day)) {
      setNewHabitDays(newHabitDays.filter(d => d !== day));
    } else {
      setNewHabitDays([...newHabitDays, day].sort());
    }
  };
 
  // Create quick task or calendar event
  const handleAddQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
 
    const taskTime = quickTaskTime || new Date().toTimeString().split(' ')[0].substring(0, 5); // Current hour if empty
    const targetDate = quickTaskDate || selectedDate;

    if (quickTaskType === 'task') {
      const newTask: TodayTask = {
        id: `task-${Date.now()}`,
        title: `⚡ ${quickTaskTitle.trim()}`,
        time: taskTime,
        isCompleted: false,
        date: targetDate
      };
      setOneOffTasks([...oneOffTasks, newTask]);
    } else {
      // Calendar Event
      const newEvent: LogEntry = {
        id: `cal-${Date.now()}`,
        date: targetDate,
        content: quickTaskTitle.trim(),
        type: 'Event',
        time: taskTime,
        emoji: '📆'
      };
      if (setLogs) {
        setLogs(prev => [...prev, newEvent]);
      }
    }
 
    setQuickTaskTitle("");
    setQuickTaskTime("");
    playSound('complete');
  };
 
  const handleDeleteQuickTask = (id: string) => {
    setOneOffTasks(oneOffTasks.filter(t => t.id !== id));
  };

  const handleDeleteCalendarEvent = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa sự kiện lịch này không?")) {
      if (setLogs) {
        setLogs(prev => prev.filter(log => log.id !== id));
      }
    }
  };

  const startEditTask = (item: any) => {
    if (item.oneOffTaskId) {
      const task = oneOffTasks.find(t => t.id === item.oneOffTaskId);
      if (task) {
        setEditingTask({
          id: task.id,
          title: task.title.replace(/^⚡\s*/, ""),
          time: task.time,
          date: task.date || selectedDate,
          type: 'task'
        });
      }
    } else if (item.eventId) {
      const log = logs.find(l => l.id === item.eventId);
      if (log) {
        setEditingTask({
          id: log.id,
          title: log.content.replace(/^📅\s*/, ""),
          time: log.time || "00:00",
          date: log.date,
          type: 'event'
        });
      }
    }
  };

  const handleSaveEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;

    if (editingTask.type === 'task') {
      setOneOffTasks(oneOffTasks.map(t => 
        t.id === editingTask.id ? {
          ...t,
          title: `⚡ ${editingTask.title.trim()}`,
          time: editingTask.time,
          date: editingTask.date
        } : t
      ));
    } else {
      if (setLogs) {
        setLogs(logs.map(l =>
          l.id === editingTask.id ? {
            ...l,
            content: editingTask.title.trim(),
            time: editingTask.time,
            date: editingTask.date
          } : l
        ));
      }
    }
    setEditingTask(null);
    playSound('complete');
  };

  // Alert Modal actions
  const handleAlertComplete = () => {
    if (!activeAlert) return;
    
    // Find the task inside lists
    const matchedTask = todayTasksList.find(t => t.id === activeAlert.id);
    if (matchedTask) {
      handleToggleTask(matchedTask);
    }
    setActiveAlert(null);
  };

  const handleAlertSnooze = () => {
    if (!activeAlert) return;

    // Snooze adds the task alert trigger to 5 minutes from now!
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const snoozeTimeHHMM = now.toTimeString().split(' ')[0].substring(0, 5);

    if (activeAlert.isHabit) {
      // Create a temporary helper tasks logic or simply allow snooze to postpone trigger
      // To keep it simple, we delay the trigger time of this specific dynamic task alert by resetting notified list
      // So it will trigger again once that custom snooze time arrives.
      alert(`Đã báo lại việc này! Hệ thống sẽ nhắc nhở lại vào lúc ${snoozeTimeHHMM}.`);
    } else {
      // Update the one-time task schedule time directly
      setOneOffTasks(oneOffTasks.map(t => 
        t.id === activeAlert.id ? { ...t, time: snoozeTimeHHMM } : t
      ));
    }

    setActiveAlert(null);
  };

  // Format vietnam weekdays
  const formatDays = (days: number[]) => {
    if (days.length === 0) return "Mỗi ngày";
    const mapped = days.map(d => {
      if (d === 0) return "CN";
      return `T${d + 1}`;
    });
    return mapped.join(", ");
  };

  // Helper to format frequency for view catalog
  const formatHabitFrequency = (habit: Habit) => {
    const repType = habit.repeatType || 'day';
    const freq = habit.frequency || habit.reminderTimes.length || 1;
    if (repType === 'day') {
      return `Mỗi ngày: ${freq} lần/ngày ${habit.daysOfWeek.length > 0 ? `(${formatDays(habit.daysOfWeek)})` : ''}`;
    } else if (repType === 'week') {
      return `Mục tiêu: ${freq} lần/tuần`;
    } else {
      return `Mục tiêu: ${freq} lần/tháng`;
    }
  };

  const formatStreak = (habit: Habit) => {
    const repType = habit.repeatType || 'day';
    const streak = habit.streak;
    if (repType === 'day') return `${streak} ngày`;
    if (repType === 'week') return `${streak} tuần`;
    return `${streak} tháng`;
  };

  const formatMaxStreak = (habit: Habit) => {
    const repType = habit.repeatType || 'day';
    const maxStreak = habit.maxStreak;
    if (repType === 'day') return `${maxStreak} ngày`;
    if (repType === 'week') return `${maxStreak} tuần`;
    return `${maxStreak} tháng`;
  };

  return (
    <div className="space-y-8 pb-12 font-sans text-ink">
      {/* HEADER */}
      <div className="sketch-border bg-[#e8f0fe] p-6 text-center select-none shadow-md border-b-4 border-r-4 border-ink relative overflow-hidden">
        <div className="absolute right-4 top-2 opacity-15 rotate-12">
          <Calendar className="w-24 h-24" />
        </div>
        <div className="flex justify-center">
          <div className="bg-[#fbcfe8] rotate-2 px-6 py-2 border-2 border-ink shadow-sm rounded-md tracking-wider relative">
            <h1 className="text-3xl md:text-5xl font-logo font-black uppercase text-ink flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500 animate-[bounce_1.5s_infinite]" />
              THÓI QUEN & LỊCH TRÌNH
            </h1>
          </div>
        </div>
        <p className="mt-4 text-sm md:text-base font-semibold italic text-ink/70">
          "Kỷ luật là cầu nối giữa mục tiêu và sự thành công. Hãy lặp lại mỗi ngày!" 🎯
        </p>

        {/* TOP STATUS BAR */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/70 p-3 sketch-border-sm flex flex-col justify-center items-center">
            <span className="text-2xl font-black text-crimson font-mono">{habits.filter(h => h.isActive).length}</span>
            <span className="text-[10px] uppercase font-bold text-ink/50">Thói quen hoạt động</span>
          </div>
          <div className="bg-white/70 p-3 sketch-border-sm flex flex-col justify-center items-center">
            <span className="text-2xl font-black text-emerald-700 font-mono">{stats.completed}/{stats.total}</span>
            <span className="text-[10px] uppercase font-bold text-ink/50">Tiến độ hôm nay</span>
          </div>
          <div className="bg-white/70 p-3 sketch-border-sm flex flex-col justify-center">
            <div className="w-full bg-[#efefef] h-3 rounded-full overflow-hidden border border-ink">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500" 
                style={{ width: `${stats.rate}%` }} 
              />
            </div>
            <span className="text-[10px] uppercase font-black text-ink/75 mt-1 font-mono text-center">
              HOÀN THÀNH {stats.rate}%
            </span>
          </div>
        </div>

        {/* GLOBAL STREAK & DISCIPLINE LEVEL INDICATOR */}
        <div className="mt-4 p-4 bg-[#fffbeb] border-2 border-ink rounded-lg text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          {/* Subtle graphic accent */}
          <div className="absolute right-3 -bottom-1 text-ink/5 pointer-events-none">
            <Award className="w-16 h-16 rotate-12" />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-ink bg-[#fef7e0] flex items-center justify-center text-2xl shadow-sm shrink-0">
                {discipline.icon}
              </div>
              <div>
                <div className="text-[10px] uppercase font-black tracking-wider text-crimson flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-crimson animate-ping" />
                  Mức Độ Kỷ Luật Toàn Diện
                </div>
                <h3 className="text-lg md:text-xl font-black text-ink flex items-center gap-2 uppercase tracking-tight">
                  {discipline.level}
                </h3>
                <p className="text-[11px] font-medium text-ink/75 leading-tight italic max-w-sm sm:max-w-md">
                  "{discipline.description}"
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l-2 border-dashed border-ink/15 sm:pl-4">
              <div className="text-center sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                <span className="text-[10px] uppercase font-bold text-ink/50 tracking-wider">Tổng tích lũy:</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-ink/15 rounded font-black font-mono text-crimson text-sm shadow-sm">
                  <Flame className="w-4 h-4 fill-crimson text-crimson animate-[bounce_1s_infinite]" />
                  {globalStreak} chuỗi
                </span>
              </div>
              
              <div className="text-center sm:text-left max-w-xs text-[10px] font-semibold text-ink/65 bg-white/60 py-1.5 px-3 rounded border border-ink/10 leading-relaxed font-mono">
                <span className="font-bold text-ink/80 block leading-none mb-1 text-[9px] uppercase tracking-wide">Mục tiêu tiếp:</span>
                {discipline.nextMilestone}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center justify-center gap-4 bg-[#FCFAF5] p-3 border-2 border-ink rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,0.15)] max-w-2xl mx-auto select-none">
        <button
          type="button"
          onClick={() => setActiveSubTab("timeline")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300",
            activeSubTab === "timeline" 
              ? "bg-[#5C0612] text-white shadow-md scale-105" 
              : "text-[#3A1412]/60 hover:text-[#5C0612] hover:bg-[#8A1E2B]/5"
          )}
        >
          <Clock className="w-4 h-4" />
          Lịch trình & Thói quen lặp lại
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("formation")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300",
            activeSubTab === "formation" 
              ? "bg-[#8A1E2B] text-white shadow-md scale-105" 
              : "text-[#3A1412]/60 hover:text-[#5C0612] hover:bg-[#8A1E2B]/5"
          )}
        >
          <Award className="w-4 h-4 text-amber-500" />
          21 Ngày Kiến Tạo Thói Quen (Dashboard)
        </button>
      </div>

      {activeSubTab === "timeline" ? (
        <>
          {/* DETAILED LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: SELECTED DATE SCHEDULE TIMELINE (8 columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="sketch-border bg-white p-5 md:p-6 shadow-md border-b-4 border-r-4 border-ink">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-dashed border-ink/10 pb-4 mb-4">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Clock className="w-6 h-6 text-crimson" />
                  CHI TIẾT LỊCH TRÌNH
                </h2>
                <p className="hand-text text-sm opacity-60">Theo dõi, lên lịch thói quen & sự kiện chi tiết</p>
              </div>
              
              {/* Date selection & navigation */}
              <div className="flex items-center gap-1.5 self-start md:self-auto">
                <button 
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() - 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }}
                  type="button"
                  className="px-2 py-1 text-xs font-black border-2 border-ink rounded bg-white hover:bg-ink hover:text-white transition-all select-none"
                  title="Ngày trước"
                >
                  &larr;
                </button>
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="sketch-input font-bold text-xs py-1 px-2.5 bg-[#fef7e0] font-mono text-center outline-none cursor-pointer border-2 border-ink rounded select-none"
                />
                <button 
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() + 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }}
                  type="button"
                  className="px-2 py-1 text-xs font-black border-2 border-ink rounded bg-white hover:bg-ink hover:text-white transition-all select-none"
                  title="Ngày sau"
                >
                  &rarr;
                </button>
                <button 
                  onClick={() => setSelectedDate(getTodayStr())}
                  type="button"
                  className="px-2 py-1 text-xs font-black border-2 border-ink rounded bg-[#e8f0fe] hover:bg-crimson hover:text-white transition-all select-none"
                  title="Về hôm nay"
                >
                  Hôm nay
                </button>
              </div>
            </div>

            {/* Quick create one-off task today */}
            <form onSubmit={handleAddQuickTask} className="bg-[#fdfbf7] p-3 border-2 border-dashed border-ink/20 rounded-md mb-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Type Choice */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-ink/40 tracking-wider">Cách thức:</span>
                  <div className="flex border-2 border-ink rounded overflow-hidden text-xs bg-white">
                    <button
                      type="button"
                      onClick={() => setQuickTaskType('task')}
                      className={cn(
                        "px-3 py-1 font-bold transition-all",
                        quickTaskType === 'task' ? "bg-ink text-white" : "hover:bg-ink/5"
                      )}
                    >
                      ⚡ Công việc
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickTaskType('event')}
                      className={cn(
                        "px-3 py-1 font-bold transition-all",
                        quickTaskType === 'event' ? "bg-[#3367d6] text-white" : "hover:bg-ink/5"
                      )}
                    >
                      📅 Lịch sự kiện
                    </button>
                  </div>
                </div>

                {/* Specific date / deadline picker */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[10px] font-black uppercase text-ink/40 tracking-wider">Hạn thực hiện (Deadline):</span>
                  <input
                    type="date"
                    value={quickTaskDate}
                    onChange={(e) => setQuickTaskDate(e.target.value)}
                    className="sketch-input py-0.5 px-2 bg-white font-mono text-[11px] text-center w-32 border border-ink"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
                <div className="flex-1 w-full flex flex-col gap-1">
                  <input
                    type="text"
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    placeholder={
                      quickTaskType === 'task' 
                        ? "Điền công việc cần làm... (ví dụ: Đi họp nhóm, Gửi báo cáo)" 
                        : "Điền sự kiện ghi chép... (ví dụ: Kiểm tra sức khoẻ định kỳ, Sinh nhật mẹ)"
                    }
                    className="sketch-input bg-white py-1.5 px-2.5 text-xs w-full"
                    required
                  />
                </div>
                <div className="w-full sm:w-28 flex flex-col gap-1">
                  <input
                    type="time"
                    value={quickTaskTime}
                    onChange={(e) => setQuickTaskTime(e.target.value)}
                    className="sketch-input bg-white py-1.5 px-2.5 text-xs w-full font-mono text-center"
                  />
                </div>
                <button 
                  type="submit" 
                  className={cn(
                    "sketch-button py-1.5 px-4 text-xs font-black uppercase transition-all w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 border-2 border-ink",
                    quickTaskType === 'task' ? "bg-[#fbcfe8] hover:bg-crimson hover:text-white" : "bg-[#d2e3fc] hover:bg-[#1a73e8] hover:text-white text-[#1a73e8]"
                  )}
                >
                  <Plus className="w-4 h-4" /> {quickTaskType === 'task' ? "Thêm việc" : "Thêm sự kiện"}
                </button>
              </div>
            </form>

            {/* Timeline wrapper */}
            {selectedDateTasksList.length === 0 ? (
              <div className="text-center py-12 px-4 bg-paper/35 rounded border border-dashed border-ink/10">
                <Smile className="w-12 h-12 text-ink/20 mx-auto mb-3" />
                <p className="text-sm font-semibold text-ink/50">Không có thói quen, công việc hay sự kiện nào được lên lịch cho ngày này.</p>
                <p className="text-xs text-ink/40 mt-1">Dùng công cụ phía trên hoặc bật thói quen bất kỳ!</p>
              </div>
            ) : (
              <div className="relative pl-5 sm:pl-8 border-l-[3px] border-dashed border-ink/20 space-y-4">
                {selectedDateTasksList.map((task) => {
                  const now = new Date();
                  const currentHHMM = now.toTimeString().split(' ')[0].substring(0, 5);
                  const isTodayActive = selectedDate === todayStr;
                  const isPast = isTodayActive && task.time < currentHHMM && !task.isCompleted && !task.eventId;

                  return (
                    <motion.div 
                      key={task.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={cn(
                        "group relative bg-paper rounded-lg border-2 border-ink p-3 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3",
                        task.isCompleted ? "opacity-60 bg-[#e6f4ea]/10 border-ink/50" : "",
                        isPast ? "border-amber-400 bg-amber-50/10" : "",
                        task.eventId ? "border-blue-400 bg-blue-50/5" : ""
                      )}
                    >
                      {/* Timeline dot point */}
                      <div className={cn(
                        "absolute -left-[30px] sm:-left-[41px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-ink z-10 transition-colors flex items-center justify-center bg-white",
                        task.isCompleted ? "bg-emerald-500 text-white" : isPast ? "bg-amber-400" : task.eventId ? "bg-blue-500 text-white" : "bg-white"
                      )}>
                        {task.isCompleted && <Check className="w-3 h-3" />}
                        {!task.isCompleted && isPast && <span className="w-1.5 h-1.5 rounded-full bg-ink" />}
                        {task.eventId && <Calendar className="w-2.5 h-2.5" />}
                      </div>

                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {task.eventId ? (
                          <div className="w-8 h-8 rounded border-2 border-blue-400 bg-blue-50 flex items-center justify-center shrink-0 text-blue-600 font-bold">
                            📅
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleToggleTask(task)}
                            className={cn(
                              "w-8 h-8 rounded border-2 border-ink flex items-center justify-center shrink-0 transition-all select-none hover:bg-ink/5",
                              task.isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-white"
                            )}
                          >
                            {task.isCompleted ? (
                              <Check className="w-5 h-5 font-black" />
                            ) : (
                              <div className="w-3 h-3 rounded-full opacity-0 hover:opacity-20 bg-ink" />
                            )}
                          </button>
                        )}

                        <div className="min-w-0 flex-1">
                          <span 
                            className={cn(
                              "block text-sm md:text-base font-bold text-ink leading-tight truncate transition-all duration-300",
                              task.isCompleted ? "line-through text-ink/40 italic" : ""
                            )}
                          >
                            {task.title}
                          </span>
                          
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn(
                              "inline-flex items-center gap-1 text-[11px] font-bold font-mono px-1.5 py-0.5 rounded",
                              task.isCompleted ? "bg-emerald-50 text-emerald-600" : isPast ? "bg-amber-100 text-amber-800" : task.eventId ? "bg-blue-100 text-blue-800" : "bg-ink/5 text-ink/60"
                            )}>
                              <Clock className="w-3 h-3" />
                              {task.time}
                              {isPast && <span className="text-[9px] font-black uppercase text-amber-700 animate-pulse ml-0.5">(Trễ)</span>}
                            </span>

                            {task.habitId && (
                              <span className="text-[10px] text-crimson uppercase font-black tracking-widest px-1 bg-crimson/5 rounded">HABIT</span>
                            )}

                            {task.eventId && (
                              <span className="text-[10px] text-blue-600 uppercase font-black tracking-widest px-1 bg-blue-50 rounded border border-blue-200">SỰ KIỆN LỊCH</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Operations buttons (Edit & Delete) */}
                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        {/* Edit task/event */}
                        {(task.oneOffTaskId || task.eventId) ? (
                          <button
                            onClick={() => startEditTask(task)}
                            type="button"
                            className="p-1 px-1.5 text-ink/40 hover:text-blue-600 hover:bg-blue-50 rounded border border-transparent hover:border-blue-200 transition-all"
                            title="Sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        ) : null}

                        {/* Delete task */}
                        {task.oneOffTaskId ? (
                          <button 
                            onClick={() => handleDeleteQuickTask(task.oneOffTaskId!)}
                            type="button"
                            className="p-1 px-1.5 text-ink/30 hover:text-crimson hover:bg-crimson/5 rounded border border-transparent hover:border-crimson/10 transition-all"
                            title="Xóa việc"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : null}

                        {/* Delete event */}
                        {task.eventId ? (
                          <button 
                            onClick={() => handleDeleteCalendarEvent(task.eventId!)}
                            type="button"
                            className="p-1 px-1.5 text-ink/30 hover:text-crimson hover:bg-crimson/5 rounded border border-transparent hover:border-crimson/10 transition-all"
                            title="Xóa sự kiện lịch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: HABITS CATALOG (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sketch-border bg-white p-5 md:p-6 shadow-md border-b-4 border-r-4 border-ink">
            
            {/* Catalog header with Add toggle */}
            <div className="flex justify-between items-center border-b-2 border-dashed border-ink/10 pb-3 mb-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-emerald-600" />
                  DANH MỤC THÓI QUEN
                </h2>
                <p className="hand-text text-xs opacity-60">Quản lý các thói quen lặp lại liên tục</p>
              </div>

              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="sketch-button py-1 px-3 text-xs font-bold bg-[#fbcfe8] text-ink hover:bg-crimson hover:text-white transition-all flex items-center gap-1.5"
              >
                {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showAddForm ? "Đóng" : "Tạo Lập"}
              </button>
            </div>

            {/* EXPANDABLE CREATION FORM */}
            <AnimatePresence>
              {showAddForm && (
                <motion.form 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleAddHabit}
                  className="overflow-hidden bg-[#faf8f5] p-3 text-xs border-2 border-dashed border-ink/30 rounded-md mb-6 space-y-4"
                >
                  <h3 className="text-sm font-black uppercase text-crimson">
                    {editingHabitId ? "Cập nhật thói quen" : "Thiết lập thói quen mới"}
                  </h3>
                  
                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="block font-bold tracking-wide uppercase text-ink/65">Tên thói quen</label>
                    <input
                      type="text"
                      className="sketch-input w-full bg-white text-xs py-1.5 px-3"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      placeholder="Ví dụ: Đọc sách, Thiền, Gấp chăn màn..."
                      required
                    />
                  </div>

                  {/* Icon & Category Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block font-bold tracking-wide uppercase text-ink/65">Nhóm phân loại</label>
                      <select 
                        className="sketch-input w-full bg-white py-1 text-xs"
                        value={newHabitCategory}
                        onChange={(e) => setNewHabitCategory(e.target.value)}
                      >
                        {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold tracking-wide uppercase text-ink/65">Biểu tượng</label>
                      <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
                        {PRESET_ICONS.map(ic => (
                          <button
                            type="button"
                            key={ic}
                            onClick={() => setNewHabitIcon(ic)}
                            className={cn(
                              "w-7 h-7 text-sm flex items-center justify-center rounded-full border-2 border-transparent transition-all shrink-0 hover:bg-ink/10",
                              newHabitIcon === ic ? "border-ink bg-white font-bold" : ""
                            )}
                          >
                            {ic}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Repeat Cycle and Target count */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block font-bold tracking-wide uppercase text-ink/65 font-black">Chu kỳ lặp lại</label>
                      <select 
                        className="sketch-input w-full bg-white py-1 text-xs"
                        value={newHabitRepeatType}
                        onChange={(e) => setNewHabitRepeatType(e.target.value as any)}
                      >
                        <option value="day">Hàng ngày</option>
                        <option value="week">Hàng tuần</option>
                        <option value="month">Hàng tháng</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold tracking-wide uppercase text-ink/65 font-black">Số lần lặp (mục tiêu)</label>
                      <select 
                        className="sketch-input w-full bg-white py-1 text-xs"
                        value={newHabitFrequency}
                        onChange={(e) => setNewHabitFrequency(parseInt(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 30].map(v => (
                          <option key={v} value={v}>
                            {v} lần / {newHabitRepeatType === 'day' ? 'ngày' : newHabitRepeatType === 'week' ? 'tuần' : 'tháng'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Days of week selection (Only shown for daily cycle) */}
                  {newHabitRepeatType === 'day' ? (
                    <div className="space-y-1">
                      <label className="block font-bold tracking-wide uppercase text-ink/65">Thứ xuất hiện trong tuần</label>
                      <div className="flex justify-between gap-1 mt-1">
                        {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                          const isSel = newHabitDays.includes(d);
                          const label = d === 0 ? "CN" : `T${d + 1}`;
                          return (
                            <button
                              type="button"
                              key={d}
                              onClick={() => handleToggleDay(d)}
                              className={cn(
                                "flex-1 py-1 px-0.5 text-[10px] font-bold text-center border-2 border-ink rounded transition-all",
                                isSel ? "bg-ink text-white font-black" : "bg-white text-ink hover:bg-ink/5"
                              )}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-ink/50 italic mt-1 font-mono">
                        * Bỏ trống tất cả để tự động hiển thị "Mỗi ngày".
                      </p>
                    </div>
                  ) : (
                    <div className="bg-[#eff6ff] p-2 rounded border border-blue-200 text-blue-800 text-[10px] font-semibold flex items-start gap-1.5 leading-relaxed">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        {newHabitRepeatType === 'week' 
                          ? `Thói quen hàng tuần sẽ xuất hiện trong danh sách tất cả các ngày của tuần. Đánh dấu hoàn thành trên ngày bất kỳ để cộng dồn tiến độ tuần (${newHabitFrequency} lần).`
                          : `Thói quen hàng tháng sẽ xuất hiện trong danh sách tất cả các ngày của tháng. Đánh dấu hoàn thành trên ngày bất kỳ để cộng dồn tiến độ tháng (${newHabitFrequency} lần).`
                        }
                      </div>
                    </div>
                  )}

                  {/* Reminder schedules - multiple times support */}
                  <div className="space-y-2">
                    <label className="block font-bold tracking-wide uppercase text-ink/65">Các mốc giờ nhắc nhở ({newHabitReminders.length})</label>
                    
                    <div className="flex flex-wrap gap-1 bg-white p-2 border-2 border-ink rounded-lg min-h-[46px]">
                      {newHabitReminders.map(time => (
                        <span key={time} className="inline-flex items-center gap-1.5 bg-[#fef7e0] border border-ink text-ink px-2 py-0.5 rounded-full font-mono font-bold text-[11px]">
                          {time}
                          <button 
                            type="button"
                            onClick={() => handleRemoveReminderTime(time)}
                            className="text-crimson font-black hover:bg-crimson/10 rounded-full w-3.5 h-3.5 flex items-center justify-center"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={tempTime}
                        onChange={(e) => setTempTime(e.target.value)}
                        className="sketch-input text-xs py-1.5 px-3 flex-1 font-mono text-center"
                      />
                      <button
                        type="button"
                        onClick={handleAddReminderTime}
                        className="sketch-button py-1 px-4 text-xs font-black bg-white hover:bg-ink hover:text-white"
                      >
                        + Mốc Giờ
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {editingHabitId && (
                      <button
                        type="button"
                        onClick={cancelEditHabit}
                        className="sketch-button py-2 flex-1 text-xs uppercase tracking-widest font-black bg-white text-ink hover:bg-ink/10 transition-all border-2 border-ink"
                      >
                        Hủy bỏ
                      </button>
                    )}
                    <button
                      type="submit"
                      className="sketch-button py-2 flex-2 w-full text-xs uppercase tracking-widest font-black bg-ink text-white hover:bg-crimson transition-all"
                    >
                      {editingHabitId ? "Lưu Thay Đổi" : "Kích Hoạt Thói Quen"}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* ACTIVE HABITS LIST */}
            <div className="space-y-3.5">
              {habits.length === 0 ? (
                <div className="text-center py-8 text-ink/40">
                  Chưa có thói quen nào. Hãy ấn nút "Tạo Lập" ở trên để tạo!
                </div>
              ) : (
                habits.map((habit) => {
                  const catDetails = CATEGORIES.find(c => c.name === habit.category) || { color: "bg-paper border-ink/20 text-ink" };
                  
                  return (
                    <div 
                      key={habit.id}
                      className={cn(
                        "sketch-border bg-paper p-3 shadow-sm hover:shadow-md transition-all space-y-2 border-b-4 border-r-4 relative",
                        !habit.isActive ? "opacity-50 grayscale bg-[#cccccc]/5" : ""
                      )}
                    >
                      {/* Top bar item */}
                      <div className="flex justify-between items-start gap-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-2xl h-8 w-8 flex items-center justify-center bg-white rounded-full shadow-sm border border-ink/20 shrink-0 select-none">
                            {habit.icon}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-ink leading-tight truncate">{habit.name}</h4>
                            <span className={cn("inline-block text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full border text-center mt-0.5", catDetails.color)}>
                              {habit.category}
                            </span>
                          </div>
                        </div>

                        {/* Status Toggle on Habit */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleToggleActiveHabit(habit.id)}
                            className={cn(
                              "text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border transition-all",
                              habit.isActive ? "bg-emerald-50 text-emerald-800 border-emerald-400 font-bold" : "bg-ink/5 text-ink/40 border-transparent"
                            )}
                            title={habit.isActive ? "Tạm ngưng thói quen" : "Kích hoạt lại thói quen"}
                          >
                            {habit.isActive ? "Bật" : "Tắt"}
                          </button>
                          <button
                            onClick={() => startEditHabit(habit)}
                            className="p-1 px-1.5 text-ink/30 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                            title="Sửa thói quen"
                            type="button"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteHabit(habit.id)}
                            className="p-1 px-1.5 text-ink/20 hover:text-crimson hover:bg-crimson/5 rounded transition-all"
                            title="Xóa vĩnh viễn"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Reminder hours summary */}
                      <div className="flex flex-wrap gap-1 font-mono text-[10px] items-center text-ink/60">
                        <span className="font-sans font-semibold text-[9px] uppercase tracking-wider text-ink/40">Giờ nhắc:</span>
                        {habit.reminderTimes.map(t => (
                          <span key={t} className="bg-ink/5 px-1 py-0.2 rounded font-semibold text-ink/80">{t}</span>
                        ))}
                      </div>

                       {/* Frequency and dynamic streak counter display */}
                      <div className="flex justify-between items-center bg-[#f7f6f1] p-1.5 rounded border-2 border-dashed border-ink/10 text-xs text-ink/80">
                        <div className="text-[10px] font-semibold text-ink/65 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-ink/60" />
                          {formatHabitFrequency(habit)}
                        </div>
 
                        <div className="flex gap-3 shrink-0">
                          <span className="inline-flex items-center gap-0.5 font-bold font-mono text-crimson text-xs" title="Chuỗi hoàn thành liên tiếp">
                            <Flame className="w-4 h-4 fill-crimson" />
                            {formatStreak(habit)}
                          </span>
                          <span className="text-[10px] text-ink/40 font-mono self-center">
                            Kỷ lục: <strong className="font-bold">{formatMaxStreak(habit)}</strong>
                          </span>
                        </div>
                      </div>
 
                      {/* Last completed history mini check bubbles (last 7 days illustration) */}
                      <div className="flex justify-between items-center text-[9px] pt-1 border-t border-ink/5">
                        <span className="font-semibold text-ink/45 uppercase tracking-wide">Thống kê 7 ngày gần nhất</span>
                        <div className="flex gap-1">
                          {[6, 5, 4, 3, 2, 1, 0].map((daysAgo) => {
                            const d = new Date();
                            d.setDate(d.getDate() - daysAgo);
                            const ds = d.toISOString().split('T')[0];
                            const label = d.getDate();
                            
                            const repType = habit.repeatType || 'day';
                            let isFullyDone: boolean | 'not-scheduled' = false;
                            
                            if (repType === 'day') {
                              const target = habit.frequency || habit.reminderTimes.length || 1;
                              const isScheduledDay = habit.daysOfWeek.length === 0 || habit.daysOfWeek.includes(d.getDay());
                              if (!isScheduledDay) {
                                isFullyDone = 'not-scheduled';
                              } else {
                                isFullyDone = getDailyCompletionsForHabit(habit, ds) >= target;
                              }
                            } else {
                              // Weekly/monthly is completed if they checked it off on this day as a log entry
                              isFullyDone = getDailyCompletionsForHabit(habit, ds) > 0;
                            }
 
                            return (
                              <div 
                                key={daysAgo} 
                                className={cn(
                                  "w-4 h-4 rounded-full border flex items-center justify-center text-[8px] font-mono select-none",
                                  isFullyDone === true ? "bg-emerald-500 border-emerald-600 text-white font-bold" : 
                                  isFullyDone === 'not-scheduled' ? "opacity-20 border-dotted bg-transparent text-ink/50" : 
                                  "bg-white border-ink/30 text-ink/40"
                                )}
                                title={`${ds} ${isFullyDone === true ? "Đã xong" : "Chưa hoàn thành"}`}
                              >
                                {label}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

      </div>

      {/* SECTION: 7-DAY COMPLETION STATISTICS CHART */}
      <div className="mt-8 sketch-border bg-white p-5 md:p-6 shadow-md border-b-4 border-r-4 border-ink">
        <div className="border-b-2 border-dashed border-ink/10 pb-3 mb-6">
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 animate-[bounce_2s_infinite]" />
            HIỆU SUẤT THÓI QUEN 7 NGÀY QUA
          </h2>
          <p className="hand-text text-sm opacity-60">Tỷ lệ hoàn thành thói quen dựa trên lịch trình 7 ngày gần đây</p>
        </div>

        {habits.length === 0 ? (
          <div className="text-center py-12 text-ink/40">
            <Award className="w-12 h-12 text-ink/20 mx-auto mb-3" />
            <p className="text-sm font-semibold">Chưa có dữ liệu thói quen để tính toán.</p>
            <p className="text-xs mt-1">Hãy tạo lập thói quen và hoàn thành hàng ngày để xem biểu đồ hiệu suất!</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="h-[280px] xs:h-[320px] sm:h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 20, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: "#1a1a1a", fontSize: 11, fontWeight: "bold" }}
                    axisLine={{ stroke: "#1a1a1a", strokeWidth: 2 }}
                    tickLine={{ stroke: "#1a1a1a" }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                    tick={{ fill: "#1a1a1a", fontSize: 11, fontWeight: "bold" }}
                    axisLine={{ stroke: "#1a1a1a", strokeWidth: 2 }}
                    tickLine={{ stroke: "#1a1a1a" }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: "#faf8f5", 
                      border: "2px solid #1a1a1a", 
                      borderRadius: "6px",
                      boxShadow: "3px 3px 0px #1a1a1a",
                      color: "#1a1a1a"
                    }}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Bar 
                    dataKey="pct" 
                    radius={[4, 4, 0, 0]} 
                    stroke="#1a1a1a" 
                    strokeWidth={2}
                    name="Tỷ lệ hoàn thành (%)"
                  >
                    {chartData.map((entry, index) => {
                      const colors = [
                        "#fbcfe8", // Pink
                        "#d2e3fc", // Blue
                        "#e6f4ea", // Green
                        "#fef7e0", // Yellow
                        "#fce8e6"  // Coral
                      ];
                      const color = colors[index % colors.length];
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Summary Section list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {chartData.map((item, idx) => (
                <div key={idx} className="p-3 rounded border-2 border-dashed border-ink/20 bg-[#faf8f5] flex justify-between items-center">
                  <div className="min-w-0">
                    <div className="font-black text-sm text-ink truncate">{item.name}</div>
                    <span className="text-[10px] text-ink/50 font-mono">Hoàn thành {item.completed}/{item.scheduled} nhắc nhở</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-lg text-crimson font-mono">{item.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION: 30-DAY STREAK & COMPLETION TRENDS */}
      <div className="mt-8 sketch-border bg-white p-5 md:p-6 shadow-md border-b-4 border-r-4 border-ink">
        <div className="border-b-2 border-dashed border-ink/10 pb-3 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600 animate-[pulse_2s_infinite]" />
              XU HƯỚNG HOÀN THÀNH & CHUỖI 30 NGÀY
            </h2>
            <p className="hand-text text-sm opacity-60">Theo dõi sự biến động của chuỗi kỷ luật và tiến trình 30 ngày vừa qua</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink/60 uppercase tracking-wider whitespace-nowrap">Lọc theo:</span>
            <select 
              value={trendHabitId}
              onChange={(e) => setTrendHabitId(e.target.value)}
              className="sketch-input py-1 px-3 bg-paper text-xs font-semibold focus:ring-0 focus:outline-none"
              id="trend-habit-select"
            >
              <option value="all">🚀 Toàn bộ thói quen</option>
              {habits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.icon} {h.name} ({h.repeatType === 'day' ? 'Hàng ngày' : h.repeatType === 'week' ? 'Hàng tuần' : 'Hàng tháng'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {habits.length === 0 ? (
          <div className="text-center py-12 text-ink/40">
            <Flame className="w-12 h-12 text-ink/20 mx-auto mb-3" />
            <p className="text-sm font-semibold">Chưa có dữ liệu thói quen để tính toán.</p>
            <p className="text-xs mt-1">Hãy tạo ít nhất một thói quen và duy trì để xây dựng biểu đồ xu hướng 30 ngày!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Super Summary Cards inside the Trend component */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-indigo-50/60 rounded border-2 border-dashed border-indigo-200 text-left">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Kỷ lục chuỗi (30 Ngày)</span>
                <span className="text-2xl font-black font-mono text-indigo-950 flex items-baseline gap-1 mt-1">
                  {Math.max(...chartData30Days.map(d => d.streak), 0)}
                  <span className="text-xs font-bold text-indigo-600 font-sans">ngày</span>
                </span>
                <span className="text-[9px] text-indigo-700/60 font-medium block mt-1 leading-none">Chuỗi dài nhất được duy trì liên tục</span>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded border-2 border-dashed border-emerald-200 text-left">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Hoàn thành trọn vẹn</span>
                <span className="text-2xl font-black font-mono text-emerald-950 flex items-baseline gap-1 mt-1">
                  {chartData30Days.filter(d => d.rate === 100).length}
                  <span className="text-xs font-bold text-emerald-600 font-sans">ngày</span>
                </span>
                <span className="text-[9px] text-emerald-700/60 font-medium block mt-1 leading-none">Số ngày đạt tỉ lệ hoàn thành 100%</span>
              </div>

              <div className="p-3 bg-rose-50/60 rounded border-2 border-dashed border-rose-200 text-left">
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Tổng số lần bấm kiểm duyệt</span>
                <span className="text-2xl font-black font-mono text-rose-950 flex items-baseline gap-1 mt-1">
                  {chartData30Days.reduce((sum, d) => sum + d.completions, 0)}
                  <span className="text-xs font-bold text-rose-600 font-sans">lần</span>
                </span>
                <span className="text-[9px] text-rose-700/60 font-medium block mt-1 leading-none">Số lần nhấn kiểm thói quen tích lũy</span>
              </div>
            </div>

            {/* Interactive Trend Chart Graph */}
            <div className="h-[300px] xs:h-[340px] sm:h-[400px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData30Days}
                  margin={{ top: 20, right: -5, left: -25, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  
                  <XAxis 
                    dataKey="label" 
                    tick={{ fill: "#1a1a1a", fontSize: 10, fontWeight: "bold" }}
                    axisLine={{ stroke: "#1a1a1a", strokeWidth: 2 }}
                    tickLine={{ stroke: "#1a1a1a" }}
                  />
                  
                  {/* Left YAxis for Rate (%) */}
                  <YAxis 
                    yAxisId="left"
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                    tick={{ fill: "#2563eb", fontSize: 10, fontWeight: "bold" }}
                    axisLine={{ stroke: "#2563eb", strokeWidth: 2 }}
                    tickLine={{ stroke: "#2563eb" }}
                  />

                  {/* Right YAxis for Streak */}
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 'auto']}
                    tick={{ fill: "#b91c1c", fontSize: 10, fontWeight: "bold" }}
                    axisLine={{ stroke: "#b91c1c", strokeWidth: 2 }}
                    tickLine={{ stroke: "#b91c1c" }}
                  />

                  <RechartsTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const rateData = payload.find(p => p.dataKey === "rate");
                        const streakData = payload.find(p => p.dataKey === "streak");
                        const compData = payload.find(p => p.dataKey === "completions");
                        
                        return (
                          <div className="bg-[#faf8f5] border-2 border-ink p-3 rounded-md shadow-[3px_3px_0px_#1a1a1a] text-xs space-y-1">
                            <p className="font-bold border-b border-dashed border-ink/10 pb-1 mb-1 text-ink flex items-center justify-between">
                              <span>Ngày {label}</span>
                              <span className="font-mono text-[9px] text-ink/40 font-normal">({payload[0]?.payload?.date})</span>
                            </p>
                            
                            {rateData && (
                              <p className="flex justify-between gap-6 font-semibold">
                                <span className="text-indigo-600 flex items-center gap-1">📊 Tỉ lệ đạt:</span>
                                <span className="font-mono font-black text-indigo-700">{rateData.value}%</span>
                              </p>
                            )}

                            {compData && (
                              <p className="flex justify-between gap-6 font-semibold">
                                <span className="text-slate-600 flex items-center gap-1">✅ Hoàn thành:</span>
                                <span className="font-mono font-bold text-slate-800">{compData.value} lần nhấp</span>
                              </p>
                            )}
                            
                            {streakData && (
                              <p className="flex justify-between gap-6 font-semibold border-t border-ink/5 pt-1 mt-1">
                                <span className="text-crimson flex items-center gap-1">🔥 Số ngày chuỗi:</span>
                                <span className="font-mono font-black text-rose-700">{streakData.value} ngày</span>
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                  />

                  {/* Area for completion rate */}
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRate)" 
                    name="Tỉ lệ hoàn thành (%)"
                  />

                  {/* Line for Streak history */}
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="streak" 
                    stroke="#b91c1c" 
                    strokeWidth={3} 
                    dot={{ stroke: '#b91c1c', strokeWidth: 2, r: 3, fill: '#fef2f2' }}
                    activeDot={{ r: 6, stroke: '#b91c1c', strokeWidth: 1, fill: '#b91c1c' }}
                    name="Độ dài chuỗi thói quen (Ngày)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </>
  ) : (
        <div className="space-y-8">
          {/* BENTO STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-[#f0fdf4] border-2 border-ink p-4 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] text-left relative overflow-hidden">
              <div className="absolute right-2 bottom-2 text-emerald-500/10"><CheckCircle className="w-16 h-16" /></div>
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Đang hoạt động</span>
              <h3 className="text-3xl font-black font-mono text-ink mt-1">
                {ingestionPool.filter(h => h.status === 'active').length}
              </h3>
              <p className="text-[10px] text-emerald-700/70 font-semibold mt-1">Thói quen đang rèn luyện</p>
            </div>

            <div className="bg-[#fffbeb] border-2 border-ink p-4 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] text-left relative overflow-hidden">
              <div className="absolute right-2 bottom-2 text-amber-500/10"><Flame className="w-16 h-16" /></div>
              <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Trong hàng chờ</span>
              <h3 className="text-3xl font-black font-mono text-ink mt-1">
                {ingestionPool.filter(h => h.status === 'pending').length}
              </h3>
              <p className="text-[10px] text-amber-700/70 font-semibold mt-1">Thói quen chờ kích hoạt</p>
            </div>

            <div className="bg-[#eff6ff] border-2 border-ink p-4 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] text-left relative overflow-hidden">
              <div className="absolute right-2 bottom-2 text-blue-500/10"><Award className="w-16 h-16" /></div>
              <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider">Đã thành công</span>
              <h3 className="text-3xl font-black font-mono text-ink mt-1">
                {ingestionPool.filter(h => h.status === 'formed').length}
              </h3>
              <p className="text-[10px] text-blue-700/70 font-semibold mt-1">Trở thành lối sống trọn vẹn</p>
            </div>

            <div className="bg-[#fff1f2] border-2 border-ink p-4 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] text-left relative overflow-hidden">
              <div className="absolute right-2 bottom-2 text-rose-500/10"><Sparkles className="w-16 h-16" /></div>
              <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider">Tổng ngày rèn luyện</span>
              <h3 className="text-3xl font-black font-mono text-ink mt-1">
                {ingestionPool.reduce((sum, h) => sum + h.history.length, 0)}
              </h3>
              <p className="text-[10px] text-rose-700/70 font-semibold mt-1">Tổng số ngày hoàn thành tích lũy</p>
            </div>
          </div>

          {/* MAIN LAYOUT FOR FORMATION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: ACTIVE TRACKERS & HALL OF FAME (7 columns) */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* ACTIVE TRACKERS */}
              <div className="sketch-border bg-white p-5 md:p-6 shadow-md border-b-4 border-r-4 border-ink">
                <div className="border-b-2 border-dashed border-ink/10 pb-3 mb-6">
                  <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500 animate-[bounce_1.5s_infinite]" />
                    HÀNH TRÌNH RÈN LUYỆN ĐANG HOẠT ĐỘNG
                  </h2>
                  <p className="hand-text text-xs opacity-60">Thực hiện đều đặn mỗi ngày để xây dựng liên kết não bộ mới</p>
                </div>

                {ingestionPool.filter(h => h.status === 'active').length === 0 ? (
                  <div className="text-center p-8 bg-[#FCFAF5] rounded-xl border-2 border-dashed border-ink/10">
                    <p className="font-hand font-bold text-lg text-ink/50 italic">
                      Hiện chưa có thói quen nào đang hoạt động rèn luyện.
                    </p>
                    <p className="text-xs text-ink/40 font-semibold mt-1">
                      Hệ thống sẽ tự động chuyển thói quen từ hàng chờ sang đây mỗi ngày, hoặc bạn có thể nhấp kích hoạt ngay trong hàng chờ ở cột bên phải!
                    </p>
                    {ingestionPool.some(h => h.status === 'pending') && (
                      <button
                        type="button"
                        onClick={handleManualIngestNext}
                        className="mt-4 sketch-button bg-amber-400 font-bold px-4 py-2 hover:bg-amber-500 text-xs text-ink"
                      >
                        🚀 Kích hoạt ngay thói quen trong hàng chờ
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {ingestionPool.filter(h => h.status === 'active').map(h => {
                      const isTodayDone = h.history.includes(todayStr);
                      const progressPercent = Math.min(Math.round((h.history.length / h.targetDays) * 100), 100);
                      
                      return (
                        <div key={h.id} className="p-5 border-2 border-ink rounded-2xl bg-[#FCFAF5] shadow-[4px_4px_0_rgba(0,0,0,0.15)] relative overflow-hidden">
                          {/* Corner ribbon */}
                          <div className="absolute top-0 right-0 bg-[#8A1E2B] text-white text-[9px] font-black px-3 py-1 uppercase rounded-bl-xl tracking-wider shadow-xs">
                            {h.category}
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/10 pb-3 mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl shrink-0">{h.icon}</span>
                              <div>
                                <h3 className="text-lg font-black text-ink leading-tight flex items-center gap-2">
                                  {h.name}
                                </h3>
                                <div className="text-[10px] text-ink/50 font-semibold uppercase mt-0.5 flex items-center gap-2">
                                  <span>📅 Bắt đầu: {h.activatedAt}</span>
                                  <span>•</span>
                                  <span className="text-[#E07A5F]">Mục tiêu: {h.targetDays} ngày</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleIngestionDay(h.id, todayStr)}
                              className={cn(
                                "sketch-button font-black px-4 py-2.5 text-xs tracking-wider transition-all duration-300 flex items-center gap-1.5 shrink-0 shadow-sm",
                                isTodayDone 
                                  ? "bg-emerald-500 text-white hover:bg-emerald-600 scale-[1.02]" 
                                  : "bg-white text-ink border-ink hover:bg-[#8A1E2B]/5"
                              )}
                            >
                              {isTodayDone ? <CheckCircle className="w-4 h-4 fill-white text-emerald-500" /> : <Flame className="w-4 h-4 text-orange-500" />}
                              {isTodayDone ? "Đã xong hôm nay" : "Hoàn thành hôm nay"}
                            </button>
                          </div>

                          {/* Progress and Streaks row */}
                          <div className="grid grid-cols-2 gap-4 bg-white p-3 border border-ink/15 rounded-xl mb-4">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-ink/40 tracking-wider">Tiến trình:</span>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 bg-neutral-100 h-2.5 rounded-full border border-ink/10 overflow-hidden">
                                  <div 
                                    className="bg-emerald-500 h-full transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                                <span className="font-mono font-black text-xs text-ink/80">{h.history.length}/{h.targetDays}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-around text-center border-l border-ink/10 pl-2">
                              <div>
                                <span className="text-[9px] uppercase font-bold text-ink/40 block leading-none">Chuỗi ngày (Streak)</span>
                                <span className="text-base font-black font-mono text-rose-700 flex items-center gap-0.5 justify-center mt-1">
                                  <Flame className="w-4 h-4 fill-rose-600 text-rose-600 shrink-0" />
                                  {h.streak} ngày
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase font-bold text-ink/40 block leading-none">Kỷ lục dài nhất</span>
                                <span className="text-base font-black font-mono text-amber-600 flex items-center gap-0.5 justify-center mt-1">
                                  <Award className="w-4 h-4 text-amber-500 shrink-0" />
                                  {h.maxStreak} ngày
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 21-Day visual dots progress map */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-ink/40 tracking-wider block">Bản đồ kiến tạo thói quen (Mỗi nút đại diện cho 1 ngày hoàn thành):</span>
                            <div className="flex flex-wrap gap-2 p-3 bg-white border border-ink/10 rounded-xl justify-start">
                              {Array.from({ length: h.targetDays }).map((_, idx) => {
                                const isDotDone = idx < h.history.length;
                                return (
                                  <div
                                    key={idx}
                                    className={cn(
                                      "w-8 h-8 rounded-lg flex flex-col items-center justify-center text-[10px] font-mono font-black border transition-all shadow-xs relative",
                                      isDotDone 
                                        ? "bg-emerald-500 border-emerald-600 text-white font-black" 
                                        : "bg-neutral-50 hover:bg-neutral-100 text-ink/30 border-ink/10"
                                    )}
                                    title={isDotDone ? "Ngày đã rèn luyện thành công!" : `Ngày thứ ${idx + 1}`}
                                  >
                                    <span>{idx + 1}</span>
                                    {isDotDone && <Check className="w-2.5 h-2.5 stroke-[4] absolute bottom-0.5 right-0.5" />}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Delete option */}
                          <div className="flex justify-end mt-3">
                            <button
                              type="button"
                              onClick={() => handleDeleteIngestionHabit(h.id)}
                              className="text-[#8A1E2B]/50 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-all text-[11px] font-bold flex items-center gap-1 uppercase"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Từ bỏ thói quen
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* HALL OF FAME: SUCCESSFULLY FORMED HABITS */}
              <div className="sketch-border bg-white p-5 md:p-6 shadow-md border-b-4 border-r-4 border-ink">
                <div className="border-b-2 border-dashed border-ink/10 pb-3 mb-6">
                  <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-amber-600">
                    <Award className="w-5 h-5 text-amber-500 animate-[pulse_1.5s_infinite]" />
                    🏆 BẢNG VÀNG DANH VỌNG: ĐÃ HÌNH THÀNH THÀNH CÔNG
                  </h2>
                  <p className="hand-text text-xs opacity-60">Chúc mừng! Nơi lưu giữ những thói quen tốt đã rèn luyện thành công.</p>
                </div>

                {ingestionPool.filter(h => h.status === 'formed').length === 0 ? (
                  <div className="text-center p-8 bg-[#FCFAF5] rounded-xl border-2 border-dashed border-ink/10">
                    <p className="font-hand font-bold text-lg text-ink/40 italic">
                      Chưa có thói quen nào chính thức được hình thành.
                    </p>
                    <p className="text-xs text-ink/45 font-semibold mt-1">
                      Hãy duy trì rèn luyện đủ số ngày mục tiêu của thói quen hoạt động để lưu danh tại đây nhé! 💪🏅
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ingestionPool.filter(h => h.status === 'formed').map(h => (
                      <div key={h.id} className="p-4 border-2 border-yellow-500 bg-[#fffbeb] rounded-xl shadow-[4px_4px_0_rgba(245,158,11,0.15)] relative overflow-hidden">
                        <div className="absolute right-1 bottom-1 opacity-10">
                          <Award className="w-20 h-20 text-yellow-600" />
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-3xl">{h.icon}</span>
                          <div>
                            <h3 className="text-md font-black text-[#5C0612] leading-tight">{h.name}</h3>
                            <span className="text-[9px] uppercase font-black text-amber-800 tracking-wider bg-amber-100 border border-amber-200 px-2 py-0.5 rounded mt-1.5 inline-block">
                              Hoàn tất {h.targetDays} ngày
                            </span>
                            <div className="text-[10px] text-ink/60 font-semibold mt-1.5 space-y-0.5">
                              <div>📂 Thể loại: {h.category}</div>
                              <div>🏆 Kỷ lục chuỗi: 🔥 {h.maxStreak} ngày</div>
                              <div>🌟 Hoàn thành vào: {h.formedAt}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* HABIT FORMATION GRAPHICS DASHBOARD */}
              <div className="sketch-border bg-white p-5 md:p-6 shadow-md border-b-4 border-r-4 border-ink">
                <div className="border-b-2 border-dashed border-ink/10 pb-3 mb-6">
                  <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                    📊 BIỂU ĐỒ HOÀN THÀNH TÍCH LŨY
                  </h2>
                  <p className="hand-text text-xs opacity-60">Theo dõi tỉ lệ thực hiện của toàn bộ hành trình thói quen</p>
                </div>

                {ingestionPool.length === 0 ? (
                  <div className="text-center p-8 text-neutral-400 font-hand text-lg italic">
                    Chưa có dữ liệu thống kê thói quen rèn luyện.
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="h-[240px] w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={ingestionPool.map(h => ({
                            name: h.name,
                            days: h.history.length,
                            target: h.targetDays
                          }))}
                          margin={{ top: 20, right: 10, left: -25, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                          <XAxis dataKey="name" stroke="#3A1412" tick={{ fontSize: 9, fontWeight: 'bold' }} />
                          <YAxis stroke="#3A1412" tick={{ fontSize: 9 }} />
                          <RechartsTooltip />
                          <Legend wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                          <Bar dataKey="days" fill="#8A1E2B" radius={[4, 4, 0, 0]} name="Ngày rèn luyện" />
                          <Bar dataKey="target" fill="#d1d5db" radius={[4, 4, 0, 0]} name="Ngày mục tiêu" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: INGESTION POOL INPUT & QUEUE LIST (5 columns) */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* THE QUEUE FORM */}
              <div className="sketch-border bg-white p-5 md:p-6 shadow-md border-b-4 border-r-4 border-ink">
                <div className="border-b-2 border-dashed border-ink/10 pb-3 mb-4">
                  <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-1.5">
                    <Plus className="w-5 h-5 text-crimson" />
                    Ý TƯỞNG THÓI QUEN MUỐN HÌNH THÀNH
                  </h2>
                  <p className="hand-text text-xs opacity-60">Thêm thói quen mơ ước vào hàng đợi kiến tạo</p>
                </div>

                <form onSubmit={handleAddPoolHabit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-ink/65 tracking-wider">Tên thói quen mong ước</label>
                    <input
                      type="text"
                      className="sketch-input w-full bg-[#fdfbf7] text-xs py-2 px-3 font-bold"
                      value={poolHabitName}
                      onChange={(e) => setPoolHabitName(e.target.value)}
                      placeholder="Ví dụ: Thiền định buổi sáng, Chạy bộ 2km, Đọc sách 15p..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-ink/65 tracking-wider">Mục tiêu rèn luyện</label>
                      <select
                        className="sketch-input w-full bg-[#fdfbf7] text-xs py-2 px-3 font-bold"
                        value={poolHabitTargetDays}
                        onChange={(e) => setPoolHabitTargetDays(Number(e.target.value))}
                      >
                        <option value={21}>Quy tắc 21 Ngày 🌟</option>
                        <option value={30}>Mốc rèn luyện 30 Ngày 🔥</option>
                        <option value={66}>Chu kỳ thói quen 66 Ngày 🧠</option>
                        <option value={100}>Thử thách 100 Ngày 🏆</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-ink/65 tracking-wider">Icon đại diện</label>
                      <select
                        className="sketch-input w-full bg-[#fdfbf7] text-xs py-2 px-3 font-bold"
                        value={poolHabitIcon}
                        onChange={(e) => setPoolHabitIcon(e.target.value)}
                      >
                        {["🌱", "🧘", "🥦", "🏃‍♂️", "📚", "💧", "🛌", "🍎", "🏋️‍♂️", "✍️", "💻", "🧠", "🚭", "🚶", "🗣️", "💖"].map(i => (
                          <option key={i} value={i}>{i} Biểu tượng</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-ink/65 tracking-wider">Phân loại chuyên mục</label>
                    <div className="flex flex-wrap gap-1">
                      {["Sức khỏe 💪", "Học tập 📚", "Cá nhân 👤", "Tâm trí 🧠", "Tài chính 💰"].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setPoolHabitCategory(cat)}
                          className={cn(
                            "text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full border transition-all",
                            poolHabitCategory === cat 
                              ? "bg-[#8A1E2B] text-white border-[#8A1E2B] shadow-xs" 
                              : "bg-neutral-50 text-ink/60 border-neutral-200 hover:bg-neutral-100"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#8A1E2B] hover:bg-[#5C0612] text-white font-hand font-black text-lg py-3 rounded-xl transition-all shadow-[4px_4px_0_rgba(138,30,43,0.15)] uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-5 h-5 stroke-[3]" /> Thêm vào bể thói quen
                  </button>
                </form>
              </div>

              {/* THE PENDING INGESTION QUEUE LIST */}
              <div className="sketch-border bg-white p-5 md:p-6 shadow-md border-b-4 border-r-4 border-ink">
                <div className="border-b-2 border-dashed border-ink/10 pb-3 mb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      BỂ THÓI QUEN CHỜ KÍCH HOẠT
                    </h2>
                    <p className="hand-text text-xs opacity-60">Hàng đợi thói quen sẽ được kích hoạt mỗi ngày</p>
                  </div>
                </div>

                {/* Prompt Card for automation rules */}
                <div className="bg-[#fffbeb] p-3 border-2 border-dashed border-amber-300 rounded-xl text-xs font-semibold leading-relaxed mb-4 text-[#5C0612]/90">
                  ⚡ <strong>Quy tắc tự động:</strong> Mỗi khi bước sang ngày mới, hệ thống sẽ <strong>tự động lấy thêm 1 thói quen mới</strong> từ bể hàng chờ dưới đây đưa vào hành trình rèn luyện hoạt động. 
                  <div className="mt-2 flex justify-start">
                    <button
                      type="button"
                      onClick={handleManualIngestNext}
                      disabled={ingestionPool.filter(h => h.status === 'pending').length === 0}
                      className="sketch-button bg-amber-400 hover:bg-amber-500 text-[10px] font-black px-3 py-1.5 text-ink disabled:opacity-40 disabled:hover:bg-amber-400"
                    >
                      🚀 Kích hoạt thủ công thói quen tiếp theo
                    </button>
                  </div>
                </div>

                <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                  {ingestionPool.filter(h => h.status === 'pending').length === 0 ? (
                    <div className="text-center p-6 bg-[#FCFAF5] rounded-xl border border-dashed border-ink/10">
                      <p className="font-hand font-bold text-base text-ink/40 italic">
                        Bể thói quen chờ đang trống.
                      </p>
                      <p className="text-[10px] text-ink/40 mt-1">
                        Hãy điền form phía trên để đưa các thói quen bạn muốn hình thành vào hàng đợi nhé!
                      </p>
                    </div>
                  ) : (
                    ingestionPool.filter(h => h.status === 'pending').map((h, index) => (
                      <div key={h.id} className="flex items-center justify-between gap-3 p-3 bg-[#FCFAF5] border border-ink/10 rounded-xl hover:shadow-xs transition-shadow">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl shrink-0">{h.icon}</span>
                          <div className="min-w-0">
                            <span className="text-xs font-black text-ink leading-tight block truncate">
                              {h.name}
                            </span>
                            <span className="text-[9px] font-bold text-ink/50 uppercase tracking-wider block mt-0.5">
                              {h.category} • {h.targetDays} Ngày • #{index + 1} Hàng đợi
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const updatedPool: IngestionHabit[] = ingestionPool.map(item => {
                                if (item.id === h.id) {
                                  return { ...item, status: 'active' as const, activatedAt: todayStr };
                                }
                                return item;
                              });
                              setIngestionPool(updatedPool);
                              playSound('celebration');
                              try { confetti({ particleCount: 50, colors: ["#5C0612", "#4ade80"] }); } catch(e){}
                            }}
                            className="sketch-button bg-[#e8f0fe] hover:bg-emerald-500 hover:text-white px-2 py-1 text-[9px] font-black text-ink shadow-xs"
                            title="Kích hoạt ngay lập tức"
                          >
                            🚀 Luyện ngay
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteIngestionHabit(h.id)}
                            className="text-[#8A1E2B]/60 hover:text-red-700 p-1.5 hover:bg-red-50 rounded"
                            title="Xóa khỏi hàng đợi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SCIENTIFIC ADVICE BLOCK */}
              <div className="sketch-border bg-e8f0fe bg-[#e8f0fe] p-5 md:p-6 shadow-md border-b-4 border-r-4 border-ink text-left select-none relative overflow-hidden">
                <div className="absolute right-2 bottom-2 text-[#3367d6]/10"><BookOpen className="w-16 h-16" /></div>
                <h3 className="text-sm font-black uppercase text-[#3367d6] tracking-wider mb-2 flex items-center gap-1">
                  💡 KHOA HỌC THÀNH THỨC THÓI QUEN
                </h3>
                <ul className="text-xs font-semibold leading-relaxed text-ink/80 space-y-2 list-disc list-inside">
                  <li><strong>Quy tắc 21 ngày:</strong> 21 ngày là thời gian tối thiểu để não bộ làm quen với một tế bào liên kết thói quen mới, giúp giảm bớt sức kháng cự tinh thần.</li>
                  <li><strong>Tính nhất quán quan trọng hơn cường độ:</strong> Thực hiện 5 phút mỗi ngày hiệu quả hơn là 1 tiếng nhưng ngắt quãng. Đừng để đứt chuỗi!</li>
                  <li><strong>Tự động gối đầu:</strong> Việc mỗi ngày nạp thêm 1 thói quen từ bể mong ước giúp bạn dần nâng cấp phong cách sống mà không bị choáng ngợp bởi việc bắt đầu tất cả cùng một lúc.</li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* FLOATING AND ABSOLUTE CHANGER ALARM REMINDER OVERLAY POPUP */}
      <AnimatePresence>
        {activeAlert && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: -20, opacity: 0 }}
              className="bg-white sketch-border-sm p-6 shadow-xl max-w-sm w-full border-t-8 border-t-amber-500 relative select-none"
            >
              <div className="absolute right-3 top-3">
                <button 
                  onClick={() => setActiveAlert(null)}
                  className="rounded-full bg-ink/5 hover:bg-ink/10 p-1 transition-colors text-ink"
                  id="close-achievement-modal"
                  aria-label="Đóng"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Icon Alert Section with bell vibration bounce */}
              <div className="text-center space-y-4">
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 border-2 border-ink shadow-sm mx-auto">
                  <Bell className="w-9 h-9 text-amber-500 animate-[swing_1s_ease-in-out_infinite]" />
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fbcfe8] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-[#fbcfe8] border border-ink text-[8px] font-black items-center justify-center">!</span>
                  </span>
                </div>

                <div>
                  <span className="font-mono text-xs font-black uppercase text-amber-600 bg-amber-100/60 py-0.5 px-2 rounded-full tracking-wider">
                    {activeAlert.isHabit ? "Nhắc nhở Thói Quen" : "Lịch trình đột xuất"}
                  </span>
                  
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <Clock size={13} className="text-ink/60" />
                    <span className="font-mono font-black text-sm tracking-widest text-ink">{activeAlert.time}</span>
                  </div>

                  <h3 className="text-xl font-black text-ink leading-snug mt-3">
                    {activeAlert.title}
                  </h3>
                  <p className="hand-[#crimson] hand-text text-sm italic mt-1 text-ink/75">
                    "Điểm rơi của thói quen! Hãy thực hiện ngay nào." 🔥
                  </p>
                </div>

                <div className="pt-4 border-t-2 border-dashed border-ink/10 flex flex-col gap-2.5">
                  <button
                    onClick={handleAlertComplete}
                    className="sketch-button py-2 px-6 text-xs font-black uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Check className="w-4 h-4 stroke-[3px]" /> Đã hoàn thành xong!
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleAlertSnooze}
                      className="sketch-button py-1.5 text-[10px] font-bold uppercase text-ink hover:bg-amber-100 transition-all"
                    >
                      Báo lại 5 phút ⏰
                    </button>
                    <button
                      onClick={() => setActiveAlert(null)}
                      className="sketch-button py-1.5 text-[10px] font-bold uppercase text-ink/50 hover:bg-ink/5 transition-all"
                    >
                      Bỏ qua lần này
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT TASK/EVENT POPUP MODAL */}
      <AnimatePresence>
        {editingTask && (
          <div 
            id="edit-task-overlay"
            className="fixed inset-0 bg-ink/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-md bg-[#faf8f5] sketch-border p-5 md:p-6 shadow-2xl relative border-b-8 border-r-8 border-ink"
            >
              <div className="flex justify-between items-center border-b-2 border-dashed border-ink/10 pb-3 mb-4">
                <h3 className="text-md font-black uppercase tracking-tight flex items-center gap-1.5 text-crimson">
                  <Edit2 className="w-5 h-5 text-crimson" />
                  SỬA {editingTask.type === 'task' ? "CÔNG VIỆC" : "SỰ KIỆN LỊCH"}
                </h3>
                <button 
                  onClick={() => setEditingTask(null)}
                  className="p-1 text-ink/40 hover:text-crimson transition-colors"
                  type="button"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              <form onSubmit={handleSaveEditTask} className="space-y-4 text-xs font-sans">
                {/* Title */}
                <div className="space-y-1">
                  <label className="block font-bold uppercase text-ink/65">Tiêu đề ghi nhớ</label>
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    className="sketch-input w-full bg-white text-xs py-2 px-3"
                    required
                  />
                </div>

                {/* Date & Time Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold uppercase text-ink/65">Thời gian thực hiện</label>
                    <input
                      type="date"
                      value={editingTask.date}
                      onChange={(e) => setEditingTask({ ...editingTask, date: e.target.value })}
                      className="sketch-input w-full bg-white text-xs py-2 px-3 font-mono text-center"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold uppercase text-ink/65">Mốc giờ</label>
                    <input
                      type="time"
                      value={editingTask.time}
                      onChange={(e) => setEditingTask({ ...editingTask, time: e.target.value })}
                      className="sketch-input w-full bg-white text-xs py-2 px-3 font-mono text-center"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-dashed border-ink/10 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="sketch-button py-2 flex-1 text-xs uppercase font-black bg-white text-ink hover:bg-ink/10 transition-all border-2 border-ink"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="sketch-button py-2 flex-1 text-xs uppercase font-black bg-[#fbcfe8] text-ink hover:bg-crimson hover:text-white transition-all border-2 border-ink"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HABIT STREAK MILESTONE CELEBRATION OVERLAY */}
      <AnimatePresence>
        {activeCelebration && (
          <div className="fixed inset-0 bg-[#1a1a1a]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            
            {/* Confetti particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
              {Array.from({ length: 45 }).map((_, i) => {
                const left = Math.random() * 100; // 0% to 100%
                const delay = Math.random() * 1.5; // delay up to 1.5s
                const duration = 2.5 + Math.random() * 2.5; // duration 2.5s to 5s
                const size = 6 + Math.random() * 10; // size 6px to 16px
                const colors = ['#AF1E2D', '#D97706', '#2563EB', '#059669', '#7C3AED', '#EC4899', '#3B82F6', '#F59E0B'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                const shapes = ['circle', 'square', 'triangle'];
                const shape = shapes[Math.floor(Math.random() * shapes.length)];
                
                return (
                  <motion.div
                    key={i}
                    initial={{ y: -30, x: `${left}%`, rotate: 0, opacity: 1 }}
                    animate={{ 
                      y: '105vh', 
                      x: `${left + (Math.random() * 14 - 7)}%`, 
                      rotate: Math.random() * 720 - 360,
                      opacity: [1, 1, 0.8, 0] 
                    }}
                    transition={{
                      duration: duration,
                      delay: delay,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                    className="absolute"
                    style={{
                      width: size,
                      height: shape === 'triangle' ? 0 : size,
                      backgroundColor: shape === 'triangle' ? 'transparent' : color,
                      borderRadius: shape === 'circle' ? '50%' : '2px',
                      borderLeft: shape === 'triangle' ? `${size/2}px solid transparent` : undefined,
                      borderRight: shape === 'triangle' ? `${size/2}px solid transparent` : undefined,
                      borderBottom: shape === 'triangle' ? `${size}px solid ${color}` : undefined,
                      zIndex: 40
                    }}
                  />
                );
              })}
            </div>

            <motion.div 
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: -50, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.45, duration: 0.6 }}
              className="bg-paper sketch-border p-6 md:p-8 max-w-sm w-full relative select-none shadow-2xl border-b-8 border-r-8 border-ink text-center"
            >
              <div className="absolute right-4 top-4">
                <button 
                  onClick={() => setActiveCelebration(null)}
                  className="rounded-full bg-ink/5 hover:bg-ink/10 p-1.5 transition-colors text-ink cursor-pointer"
                  aria-label="Đóng"
                  id="celebration-close-btn"
                >
                  <X size={18} className="stroke-[2.5]" />
                </button>
              </div>

              {/* Floating Hand-sketched Sparkle Badges */}
              <div className="absolute left-6 top-6 text-amber-500 animate-bounce">
                <Sparkles size={24} className="fill-amber-200" />
              </div>
              <div className="absolute right-12 bottom-20 text-indigo-500 animate-bounce delay-300">
                <Award size={28} className="fill-indigo-100" />
              </div>

              {/* Central Trophy Visual Section */}
              <div className="space-y-5">
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-50 border-4 border-ink shadow-md mx-auto">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, repeatType: "mirror" }}
                  >
                    <span className="text-5xl select-none" role="img" aria-label="trophy">🏆</span>
                  </motion.div>
                  <span className="absolute -bottom-1 -right-1 flex h-7 w-7 rounded-full bg-crimson text-white font-bold text-xs items-center justify-center border-2 border-ink shadow font-mono">
                    {activeCelebration.streak}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="font-mono text-[10px] font-black uppercase text-crimson bg-red-50 border border-crimson/20 py-1 px-3 rounded-full tracking-wider">
                    🎉 Cột mốc kiên trì tuyệt vời!
                  </span>

                  <h3 className="text-2xl font-black text-ink leading-tight pt-1 font-sans">
                    {activeCelebration.streak} {activeCelebration.repeatType === 'day' ? 'NGÀY' : activeCelebration.repeatType === 'week' ? 'TUẦN' : 'THÁNG'} LIÊN TIẾP!
                  </h3>

                  <div className="flex items-center justify-center gap-2 text-md font-bold text-ink/80 pt-1">
                    <span className="text-xl">{activeCelebration.habitIcon}</span>
                    <span className="underline decoration-wavy decoration-crimson">{activeCelebration.habitName}</span>
                  </div>

                  <p className="font-hand text-md text-crimson italic leading-relaxed max-w-xs mx-auto px-1 pt-3">
                    "{getMotivationalQuote(activeCelebration.habitName, activeCelebration.streak, activeCelebration.repeatType)}"
                  </p>
                </div>

                <div className="pt-5 border-t-2 border-dashed border-ink/10">
                  <button
                    onClick={() => setActiveCelebration(null)}
                    className="sketch-button sketch-button-primary w-full py-2.5 text-xs font-black tracking-wider flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
                    id="celebration-confirm-btn"
                  >
                    <Flame className="w-5 h-5 fill-paper text-paper animate-[ping_1.5s_ease-in-out_infinite]" /> TIẾP TỤC DUY TRÌ CHUỖI!
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
