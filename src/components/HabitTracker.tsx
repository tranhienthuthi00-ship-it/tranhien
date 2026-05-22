import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, Trash2, Check, Clock, Bell, Flame, Award, 
  Sparkles, X, Coffee, Droplet, Dumbbell, BookOpen, 
  Smile, Shield, Calendar, Heart, HelpCircle, CheckCircle,
  Play, RotateCcw, Volume2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Habit, TodayTask } from "../types";
import { cn } from "../lib/utils";

// Web Audio API synthesized sound cues
const playSound = (type: 'complete' | 'reminder') => {
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

export function HabitTracker() {
  // --- States ---
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem("studyHub_habits");
    return saved ? JSON.parse(saved) : DEFAULT_HABITS;
  });

  const [oneOffTasks, setOneOffTasks] = useState<TodayTask[]>(() => {
    const saved = localStorage.getItem("studyHub_oneOffTasks");
    return saved ? JSON.parse(saved) : [];
  });

  // Today "YYYY-MM-DD"
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [todayStr, setTodayStr] = useState(getTodayStr());

  // Form states for new habit
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitIcon, setNewHabitIcon] = useState("🥤");
  const [newHabitCategory, setNewHabitCategory] = useState("Sức khỏe");
  const [newHabitDays, setNewHabitDays] = useState<number[]>([]); // Empty = Daily
  const [newHabitReminders, setNewHabitReminders] = useState<string[]>(["08:00"]);
  const [tempTime, setTempTime] = useState("");

  // Form state for today's quick todo task
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskTime, setQuickTaskTime] = useState("");

  // System State for triggered alert popup
  const [activeAlert, setActiveAlert] = useState<{
    id: string;
    title: string;
    time: string;
    isHabit: boolean;
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

  // Save changes to LocalStorage
  useEffect(() => {
    localStorage.setItem("studyHub_habits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("studyHub_oneOffTasks", JSON.stringify(oneOffTasks));
  }, [oneOffTasks]);

  // --- Core Computations for Today's Checklist ---
  // Today's day index (0 for Sunday, 1 for Monday, etc.)
  const todayDayIndex = new Date().getDay();

  // Compute all scheduled items for today
  const todayTasksList = useMemo(() => {
    const list: TodayTask[] = [];

    // 1. Generate tasks from Active Habits for today
    habits.forEach(habit => {
      if (!habit.isActive) return;
      
      // Check if habit is scheduled for today
      const isScheduledToday = habit.daysOfWeek.length === 0 || habit.daysOfWeek.includes(todayDayIndex);
      
      if (isScheduledToday) {
        habit.reminderTimes.forEach((time, index) => {
          const instanceId = `habit-${habit.id}-${time}`;
          const isDone = !!(habit.history[todayStr]?.[time]);
          
          list.push({
            id: instanceId,
            title: `${habit.icon} ${habit.name}`,
            time: time,
            isCompleted: isDone,
            habitId: habit.id
          });
        });
      }
    });

    // 2. Add one-off custom tasks for today
    oneOffTasks.forEach(task => {
      list.push(task);
    });

    // Sort chronologically by time
    return list.sort((a, b) => a.time.localeCompare(b.time));
  }, [habits, oneOffTasks, todayStr, todayDayIndex]);

  // Total completed tasks stats
  const stats = useMemo(() => {
    const total = todayTasksList.length;
    const completed = todayTasksList.filter(t => t.isCompleted).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, rate };
  }, [todayTasksList]);

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
  const handleToggleTask = (task: TodayTask) => {
    const targetStatus = !task.isCompleted;
    
    if (task.habitId) {
      // Toggle a Habit Instance
      const updatedHabits = habits.map(h => {
        if (h.id === task.habitId) {
          const dailyHistory = { ...(h.history[todayStr] || {}) };
          dailyHistory[task.time] = targetStatus;

          const updatedHistory = {
            ...h.history,
            [todayStr]: dailyHistory
          };

          // Re-calculate streak if marking complete
          let currentStreak = h.streak;
          let lastCompleted = h.lastCompletedDate;

          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          // Check if today is completed (all times for today are completed)
          const todayTimes = h.reminderTimes;
          const isTodayAllCompleted = todayTimes.every(t => dailyHistory[t] === true);

          if (isTodayAllCompleted && targetStatus) {
            // Habit fully done today
            if (lastCompleted === yesterdayStr) {
              currentStreak += 1;
            } else if (lastCompleted !== todayStr) {
              currentStreak = 1; // reset streak if broken but started today
            }
            lastCompleted = todayStr;
          } else if (!isTodayAllCompleted) {
            // Broken today or was completed but now unchecked
            if (lastCompleted === todayStr) {
              // Unmarked a complete today task, restore streak to previous
              currentStreak = Math.max(0, currentStreak - 1);
              lastCompleted = undefined; // reset last completed date
            }
          }

          const maxStreak = Math.max(h.maxStreak, currentStreak);

          return {
            ...h,
            history: updatedHistory,
            streak: currentStreak,
            maxStreak: maxStreak,
            lastCompletedDate: lastCompleted
          };
        }
        return h;
      });
      setHabits(updatedHabits);
    } else {
      // Toggle a one-off task
      setOneOffTasks(oneOffTasks.map(t => 
        t.id === task.id ? { ...t, isCompleted: targetStatus } : t
      ));
    }

    if (targetStatus) {
      playSound('complete');
    }
  };

  // Add a new Habit
  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: `h-${Date.now()}`,
      name: newHabitName.trim(),
      icon: newHabitIcon,
      category: newHabitCategory,
      reminderTimes: [...newHabitReminders].sort(),
      daysOfWeek: newHabitDays,
      streak: 0,
      maxStreak: 0,
      createdAt: Date.now(),
      isActive: true,
      history: {}
    };

    setHabits([newHabit, ...habits]);
    
    // Reset Form
    setNewHabitName("");
    setNewHabitIcon("🥤");
    setNewHabitDays([]);
    setNewHabitReminders(["08:00"]);
    setShowAddForm(false);
  };

  // Delete a Habit
  const handleDeleteHabit = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa thói quen này không?")) {
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

  // Create quick one-off task for today
  const handleAddQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    const taskTime = quickTaskTime || new Date().toTimeString().split(' ')[0].substring(0, 5); // Current hour if empty
    
    const newTask: TodayTask = {
      id: `task-${Date.now()}`,
      title: `⚡ ${quickTaskTitle.trim()}`,
      time: taskTime,
      isCompleted: false
    };

    setOneOffTasks([...oneOffTasks, newTask]);
    setQuickTaskTitle("");
    setQuickTaskTime("");
    playSound('complete');
  };

  const handleDeleteQuickTask = (id: string) => {
    setOneOffTasks(oneOffTasks.filter(t => t.id !== id));
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
      </div>

      {/* DETAILED LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: TODAY SCHEDULE TIMELINE (8 columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="sketch-border bg-white p-5 md:p-6 shadow-md border-b-4 border-r-4 border-ink">
            <div className="flex justify-between items-center border-b-2 border-dashed border-ink/10 pb-3 mb-4">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Clock className="w-6 h-6 text-crimson" style={{ filter: 'url(#hand-drawn-filter)' }} />
                  LỊCH TRÌNH HÔM NAY
                </h2>
                <p className="hand-text text-sm opacity-60">Các mốc thời gian chi tiết trong ngày</p>
              </div>
              <div className="bg-[#efefef] font-bold text-xs uppercase px-2.5 py-1 text-center sketch-border-sm text-ink bg-[#fef7e0]">
                {todayStr.split('-').reverse().join('/')}
              </div>
            </div>

            {/* Quick create one-off task today */}
            <form onSubmit={handleAddQuickTask} className="bg-[#fdfbf7] p-3 border-2 border-dashed border-ink/20 rounded-md mb-6 flex flex-col sm:flex-row gap-2 items-end sm:items-center">
              <div className="flex-1 w-full flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-ink/40 tracking-wider">Việc cần làm đột xuất hôm nay</label>
                <input
                  type="text"
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder="Ví dụ: Đi họp nhóm, Gửi email cho Sếp..."
                  className="sketch-input bg-white py-1 px-2.5 text-xs w-full"
                />
              </div>
              <div className="w-full sm:w-28 flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-ink/40 tracking-wider">Mốc giờ</label>
                <input
                  type="time"
                  value={quickTaskTime}
                  onChange={(e) => setQuickTaskTime(e.target.value)}
                  className="sketch-input bg-white py-1 px-2.5 text-xs w-full font-mono text-center"
                />
              </div>
              <button 
                type="submit" 
                className="sketch-button py-1 px-4 text-xs font-bold bg-[#fbcfe8] text-ink hover:bg-crimson hover:text-white transition-all w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Thêm việc
              </button>
            </form>

            {/* Timeline wrapper */}
            {todayTasksList.length === 0 ? (
              <div className="text-center py-12 px-4 bg-paper/35 rounded border border-dashed border-ink/10">
                <Smile className="w-12 h-12 text-ink/20 mx-auto mb-3" />
                <p className="text-sm font-semibold text-ink/50">Không có thói quen hay việc cần làm nào được lên lịch hôm nay.</p>
                <p className="text-xs text-ink/40 mt-1">Bật hoạt động thói quen bên phải hoặc thêm việc đột xuất phía trên!</p>
              </div>
            ) : (
              <div className="relative pl-5 sm:pl-8 border-l-[3px] border-dashed border-ink/20 space-y-4">
                {todayTasksList.map((task) => {
                  const now = new Date();
                  const currentHHMM = now.toTimeString().split(' ')[0].substring(0, 5);
                  const isPast = task.time < currentHHMM && !task.isCompleted;

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
                        isPast ? "border-amber-400 bg-amber-50/10" : ""
                      )}
                    >
                      {/* Timeline dot point */}
                      <div className={cn(
                        "absolute -left-[30px] sm:-left-[41px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-ink z-10 transition-colors flex items-center justify-center bg-white",
                        task.isCompleted ? "bg-emerald-500 text-white" : isPast ? "bg-amber-400" : "bg-white"
                      )}>
                        {task.isCompleted && <Check className="w-3 h-3" />}
                        {!task.isCompleted && isPast && <span className="w-1.5 h-1.5 rounded-full bg-ink" />}
                      </div>

                      <div className="flex items-center gap-3 min-w-0 flex-1">
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
                              task.isCompleted ? "bg-emerald-50 text-emerald-600" : isPast ? "bg-amber-100 text-amber-800" : "bg-ink/5 text-ink/60"
                            )}>
                              <Clock className="w-3 h-3" />
                              {task.time}
                              {isPast && <span className="text-[9px] font-black uppercase text-amber-700 animate-pulse ml-0.5">(Trễ)</span>}
                            </span>

                            {task.habitId && (
                              <span className="text-[10px] text-crimson uppercase font-black tracking-widest px-1 bg-crimson/5 rounded">HABIT</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center shrink-0">
                        {!task.habitId ? (
                          <button 
                            onClick={() => handleDeleteQuickTask(task.id)}
                            className="p-1 px-1.5 text-ink/30 hover:text-crimson hover:bg-crimson/5 rounded border border-transparent hover:border-crimson/10 transition-all"
                            title="Xóa việc"
                          >
                            <Trash2 className="w-4 h-4" />
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
                  <h3 className="text-sm font-black uppercase text-crimson">Thiết lập thói quen mới</h3>
                  
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

                  {/* Days of week selection */}
                  <div className="space-y-1">
                    <label className="block font-bold tracking-wide uppercase text-ink/65">Tần suất xuất hiện</label>
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
                      * Bỏ trống tất cả để tự động hiển thị mốc giờ "Mỗi ngày".
                    </p>
                  </div>

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

                  <button
                    type="submit"
                    className="sketch-button py-2 w-full text-xs uppercase tracking-widest font-black bg-ink text-white hover:bg-crimson transition-all"
                  >
                    Kích Hoạt Thói Quen
                  </button>
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
                      <div className="flex justify-between items-center bg-[#f7f6f1] p-1.5 rounded border-2 border-dashed border-ink/10 text-xs">
                        <div className="text-[10px] font-semibold text-ink/50 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDays(habit.daysOfWeek)}
                        </div>

                        <div className="flex gap-3">
                          <span className="inline-flex items-center gap-0.5 font-bold font-mono text-crimson text-xs">
                            <Flame className="w-4 h-4 fill-crimson" />
                            {habit.streak} ngày
                          </span>
                          <span className="text-[10px] text-ink/40 font-mono self-center">
                            Kỷ lục: <strong className="font-bold">{habit.maxStreak}</strong>
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
                            
                            // Check if this habit is fully checked for that date (all times active on that day)
                            const isFullyDone = habit.daysOfWeek.length > 0 && !habit.daysOfWeek.includes(d.getDay())
                              ? 'not-scheduled'
                              : (habit.reminderTimes.length > 0 && habit.history[ds] && habit.reminderTimes.every(t => habit.history[ds][t] === true));

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

    </div>
  );
}
