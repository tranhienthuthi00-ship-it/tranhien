import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Receipt
} from "lucide-react";


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
  
  // ---------------- CUSTOM REWARDS MODAL STATE ----------------
  const CUSTOM_REWARDS = [
    { emoji: "☕", title: "Cà phê Time!", desc: "Thưởng 1 ly cà phê/trà sữa (50k)!" },
    { emoji: "🍿", title: "Nghỉ Ngơi 30 Phút", desc: "Được phép thư giãn xem phim chill chill 30 phút." },
    { emoji: "🛍️", title: "Mua Sắm Linh Tinh", desc: "Tự thưởng món đồ lặt vặt thú vị dưới 100k!" },
    { emoji: "🍫", title: "Ăn Vặt Lên Ngôi", desc: "Thưởng ngay món snack yêu thích nhất!" },
    { emoji: "🌿", title: "Chilling Walk", desc: "Đi dạo 20 phút không cầm điện thoại." },
    { emoji: "💸", title: "Thưởng Nóng", desc: "Cộng ngay 50k vào heo đất." },
    { emoji: "🎮", title: "Gaming Time", desc: "Thoải mái chơi 1 ván game yêu thích." }
  ];
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
    let shouldAddLog = false;

    const updated = tasks.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        if (nextCompleted) shouldAddLog = true;
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? Date.now() : undefined
        };
      }
      return t;
    });

    setTasks(updated);

    if (shouldAddLog && taskObj && setLogs) {
      const isGoalTask = !!taskObj.goalId;
      const associatedGoal = goals.find(g => g.id === taskObj.goalId);
      const newLog: LogEntry = {
        id: "task_complete_" + Date.now(),
        date: new Date().toISOString().split("T")[0],
        type: "Event",
        content: `Đã hoàn thành: "${taskObj.content}"${associatedGoal ? ` (${associatedGoal.title})` : ""}`,
        emoji: "🚀"
      };
      setLogs(prev => [...prev, newLog]);
      
      const randReward = CUSTOM_REWARDS[Math.floor(Math.random() * CUSTOM_REWARDS.length)];
      setRewardPopup({ id: Date.now().toString(), ...randReward });
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
      
      {/* OVERRIDE GRID 1: WELCOME & TASKS (8 cols) and CALENDAR (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2 border-b-2 border-ink/5">
        
        {/* LEFT COLUMN: WELCOME + TASKS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. MOTIVATIONAL WELCOME HEADER */}
          <div className="bg-[#fffdf5] p-8 md:p-12 rounded-3xl sketch-border border-amber-200/80 relative overflow-hidden flex items-center justify-center shadow-sm min-h-[160px]">
             <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-100 via-transparent to-transparent"></div>
             <h1 className="font-sans text-3xl md:text-5xl font-black uppercase tracking-widest text-amber-900/80 flex items-center gap-4 md:gap-6 relative z-10 drop-shadow-sm">
               <Sparkles size={36} className="text-amber-500 animate-pulse" />
               Welcome Home
               <Sparkles size={36} className="text-amber-500 animate-pulse" />
             </h1>
          </div>
          
          {/* TASKS COMPONENT */}
          <div className="bg-[#fffdf5] p-5 rounded-3xl sketch-border border-amber-200/80 space-y-4 shadow-sm min-h-[380px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-200/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-3 border-amber-200/50 gap-2 relative z-10">
              <span className="text-xs uppercase font-black tracking-widest text-amber-900 flex items-center gap-2 shrink-0">
                <span className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
                  <Check size={16} className="stroke-[3]" />
                </span>
                What's The Next Thing To Do?
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                <select
                  value={taskFilter}
                  onChange={(e) => setTaskFilter(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-amber-200 rounded-lg text-[9px] uppercase font-bold font-sans text-amber-900 outline-none tracking-widest cursor-pointer shadow-xs"
                >
                  <option value="All">Tất Cả</option>
                  <option value="Priority:High">Ưu tiên Cao</option>
                  <option value="Priority:Medium">Ưu tiên Trung</option>
                  <option value="Priority:Low">Ưu tiên Thấp</option>
                  {goals.map(g => <option key={g.id} value={"Goal:" + g.id}>Mục tiêu: {g.title}</option>)}
                </select>
                <button onClick={() => setShowAddTask(!showAddTask)} className="p-1.5 hover:bg-amber-500 hover:text-white rounded-lg border border-amber-300 text-amber-600 bg-white shadow-xs shrink-0 transition-colors">
                  <Plus size={14} className={showAddTask ? "rotate-45" : ""} />
                </button>
              </div>
            </div>

            {showAddTask && (
              <form onSubmit={handleAddTask} className="bg-amber-50/60 p-4 rounded-xl border border-amber-100 flex flex-col gap-3 relative z-10">
                <input
                  type="text"
                  placeholder="Tôi sẽ bắt tay vào làm việc gì?"
                  value={newTaskContent}
                  onChange={e => setNewTaskContent(e.target.value)}
                  className="px-3 py-2 text-xs bg-white rounded-lg border border-amber-200 outline-none w-full font-bold text-amber-950 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  required
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={newTaskGoalId}
                    onChange={e => setNewTaskGoalId(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs bg-white rounded-lg border border-amber-200 outline-none text-amber-900 font-medium"
                  >
                    <option value="">(Không có mục tiêu lớn)</option>
                    {goals.map(g => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as any)}
                    className="flex-1 px-2 py-1.5 text-xs bg-white text-amber-900 font-bold rounded-lg border border-amber-200 outline-none uppercase"
                  >
                    <option value="High">Cao</option>
                    <option value="Medium">Trung Bình</option>
                    <option value="Low">Thấp</option>
                  </select>
                  <button type="submit" className="flex-1 px-3 py-1.5 bg-amber-600 text-white font-black text-xs uppercase tracking-widest rounded-lg hover:bg-amber-700 shadow-md">
                    Thêm Ngay
                  </button>
                </div>
              </form>
            )}

            {/* list display */}
            <div className="relative z-10">
              {activeTasks.filter(t => {
                if (taskFilter === "All") return true;
                if (taskFilter.startsWith("Priority:")) return t.priority === taskFilter.split(":")[1];
                if (taskFilter.startsWith("Goal:")) return t.goalId === taskFilter.split(":")[1];
                return true;
              }).length === 0 ? (
                <div className="text-center py-10 select-none">
                  <span className="text-4xl block opacity-80">🌱</span>
                  <p className="text-[11px] font-sans font-bold uppercase tracking-wider text-amber-800/50 mt-3">Sẵn sàng để bắt đầu kế hoạch mới.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 pb-2">
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
                        className="flex items-start justify-between bg-white px-3.5 py-3 rounded-xl border border-amber-100 hover:border-amber-300 hover:shadow-sm transition-all group"
                      >
                        <div className="flex gap-3 min-w-0 flex-1 pr-2">
                          <button
                            onClick={() => handleToggleTask(task.id)}
                            className="w-5 h-5 rounded hover:border-emerald-500 bg-amber-50/50 border-2 border-amber-200 shrink-0 cursor-pointer flex items-center justify-center mt-0.5"
                          ></button>
                          
                          <div className="min-w-0 text-left flex-1">
                            <p className="font-bold text-xs text-amber-950 leading-snug break-words group-hover:text-amber-700 transition-colors">{task.content}</p>
                            {targetGoal && (
                              <span className="inline-flex mt-1 text-[9px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-wider">
                                🎯 {targetGoal.title}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${priorityStyles} font-sans tracking-wider shrink-0`}>
                            {task.priority}
                          </span>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg hover:text-crimson text-amber-900/30 cursor-pointer shrink-0 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={12} />
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
        
        {/* RIGHT COLUMN: CALENDAR (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div ref={calendarContainerRef} className="bg-white/90 p-5 rounded-2xl sketch-border border-ink/60 space-y-4 shadow-sm relative">
            
            <div className="flex items-center justify-between border-b pb-2.5 border-ink/15">
              <span className="text-xs uppercase font-extrabold tracking-wider text-ink flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-crimson" /> 
                Mini Calendar
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
              className={`absolute left-0 right-0 z-50 bg-[#fffdf5] rounded-xl border border-dashed border-amber-400 shadow-xl space-y-3 transition-all duration-300 origin-top overflow-hidden p-4 ${isCalendarDetailsOpen ? 'opacity-100 scale-y-100 mt-2' : 'opacity-0 scale-y-0 h-0 p-0 m-0 border-0'}`}
              style={{ top: '100%' }}
            >
              <div className="flex items-center justify-between border-b border-amber-200/40 pb-1.5">
                <span className="text-[10px] font-black uppercase text-amber-800 font-sans tracking-wide">
                  Chi tiết ngày: <strong className="text-ink">{selectedDateStr.split("-").reverse().join("/")}</strong>
                </span>
                <span className="text-[10px] font-black text-amber-700 font-mono bg-white px-1.5 py-0.5 rounded border border-amber-100">
                  {selectedDateLogs.length} sự kiện
                </span>
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
                <p className="text-[10px] font-bold text-blue-700/60 uppercase tracking-widest leading-none mt-0.5">
                  Tự động đồng bộ dư nợ vào mục Ngân hàng
                </p>
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
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...bulkCardSpends];
                          updated[index].name = e.target.value;
                          setBulkCardSpends(updated);
                        }}
                        className="w-full px-2 py-1.5 text-xs bg-transparent text-blue-950 font-bold focus:outline-none focus:bg-white rounded"
                      />
                    </td>
                    <td className="p-1 border border-blue-100/50">
                      <input
                        type="text"
                        placeholder="Số tiền"
                        value={item.amount ? Number(item.amount.replace(/,/g, "")).toLocaleString("vi-VN") : ""}
                        onChange={(e) => {
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
                          const updated = [...bulkCardSpends];
                          updated[index].amount = formatted;
                          setBulkCardSpends(updated);
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
                  Doanh Thu / Khách Nợ Tuần Qua
                </h3>
                <p className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-widest leading-none mt-0.5">
                  Lưu trữ nhanh doanh thu đạt được và danh sách nợ khách
                </p>
              </div>
            </div>
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

          <div className="w-full overflow-x-auto scrollbar-thin">
            <table className="min-w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-100/50 text-[#065f46] font-bold uppercase tracking-wider text-[9px]">
                  <th className="px-3 py-2 w-32 border border-emerald-100">Ngày / Tên</th>
                  <th className="px-3 py-2 w-40 border border-emerald-100">Số Tiền (VND)</th>
                  <th className="px-3 py-2 border border-emerald-100">Ghi Chú</th>
                </tr>
              </thead>
              <tbody>
                {bulkDebts.map((item, index) => {
                  const dateObj = new Date(item.name);
                  const dayStr = isNaN(dateObj.getTime())
                    ? item.name
                    : dateObj.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" });

                  return (
                    <tr key={item.id} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="p-1 border border-emerald-100/50">
                        <div className="px-2 py-1.5 flex flex-col">
                          <span className="text-xs font-black text-emerald-950 font-sans truncate capitalize">
                            {dayStr}
                          </span>
                          <span className="text-[9px] font-mono text-emerald-600 block">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-1 border border-emerald-100/50">
                        <input
                          type="text"
                          placeholder="Số tiền"
                          value={item.amount}
                          onChange={(e) => {
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
                            const updated = [...bulkDebts];
                            updated[index].amount = formatted;
                            setBulkDebts(updated);
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Sum footer */}
          <div className="flex items-center justify-between bg-emerald-50/50 p-3 rounded-xl border border-emerald-150">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">Tổng thu nhập / Nợ tuần:</span>
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
