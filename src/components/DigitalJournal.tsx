import React, { useMemo, useState } from "react";
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
  Heart
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
  categories = []
}: DigitalJournalProps) {
  
  // ---------------- STATIC QUOTES ----------------
  const quotes = [
    { text: "Hành trình vạn dặm khởi đầu từ một bước chân nhỏ bé.", author: "Lão Tử" },
    { text: "Nghị lực bền bỉ chiến thắng mọi trở lực cuộc đời.", author: "Marcus Aurelius" },
    { text: "Đầu tư vào tri thức luôn đem lại lãi suất tốt nhất.", author: "Benjamin Franklin" },
    { text: "Ngày mai thuộc về những ai có sự chuẩn bị tốt cho hôm nay.", author: "Malcolm X" }
  ];
  const [quoteIndex] = useState(() => Math.floor(Math.random() * quotes.length));

  // ---------------- INTERACTIVE MINI-CALENDAR STATE ----------------
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => new Date().toISOString().split("T")[0]);
  
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
          <div className="bg-gradient-to-tr from-[#fff9f0] to-[#fffdf9] p-8 rounded-3xl sketch-border border-ink relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-sm gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-[#fbcfe8] px-3 py-1 text-[10px] font-black uppercase rounded-full border-2 border-ink tracking-wider">
                <Sparkles size={12} className="text-pink-600 animate-spin" /> Welcome Home!
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold font-sans tracking-tight uppercase leading-none text-ink">
                Góc Bình Yên Của Bạn
              </h1>
              <p className="font-hand text-lg text-ink/75">
                "{quotes[quoteIndex].text}" – <span className="font-sans font-bold text-xs uppercase tracking-wider text-[#af1e2d]">{quotes[quoteIndex].author}</span>
              </p>
            </div>

            <div className="flex gap-4 md:border-l border-ink/10 pl-0 md:pl-8 text-center shrink-0">
              <div className="p-3 bg-white/75 rounded-2xl border border-dashed border-ink/20 min-w-[#100px]">
                <p className="text-[9px] font-extrabold text-ink/40 uppercase tracking-widest">Việc Cần Làm</p>
                <p className="text-2xl font-black text-sky-600 font-sans mt-1">{activeTasks.length}</p>
              </div>
              <div className="p-3 bg-white/75 rounded-2xl border border-dashed border-ink/20 min-w-[#100px]">
                <p className="text-[9px] font-extrabold text-ink/40 uppercase tracking-widest">Huy Chương</p>
                <p className="text-2xl font-black text-amber-500 font-sans mt-1">{achievements.length}</p>
              </div>
            </div>
          </div>
          
          {/* TASKS COMPONENT */}
          <div className="bg-white/90 p-5 rounded-2xl sketch-border border-ink/60 space-y-4 shadow-sm min-h-[380px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-2.5 border-ink/15 gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-sky-850 flex items-center gap-1.5 shrink-0">
                <Check size={16} className="text-emerald-500 stroke-[3]" />
                What's The Next Thing To Do?
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                <select
                  value={taskFilter}
                  onChange={(e) => setTaskFilter(e.target.value)}
                  className="px-2 py-1 bg-ink/5 border border-ink/10 rounded-lg text-[10px] uppercase font-bold font-sans text-ink outline-none tracking-widest cursor-pointer"
                >
                  <option value="All">Tất Cả</option>
                  <option value="Priority:High">Ưu tiên Cao</option>
                  <option value="Priority:Medium">Ưu tiên Trung</option>
                  <option value="Priority:Low">Ưu tiên Thấp</option>
                  {goals.map(g => <option key={g.id} value={"Goal:" + g.id}>Mục tiêu: {g.title}</option>)}
                </select>
                <button onClick={() => setShowAddTask(!showAddTask)} className="p-1 hover:bg-ink hover:text-paper rounded border border-ink/20 shrink-0">
                  <Plus size={14} className={showAddTask ? "rotate-45" : ""} />
                </button>
              </div>
            </div>

            {showAddTask && (
              <form onSubmit={handleAddTask} className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Tôi sẽ bắt tay vào làm việc gì?"
                  value={newTaskContent}
                  onChange={e => setNewTaskContent(e.target.value)}
                  className="px-3 py-2 text-xs bg-white rounded-lg border border-blue-200 outline-none w-full font-bold text-ink"
                  required
                />
                <div className="flex gap-2">
                  <select
                    value={newTaskGoalId}
                    onChange={e => setNewTaskGoalId(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs bg-white rounded-lg border border-blue-200 outline-none max-w-[150px]"
                  >
                    <option value="">(Không có mục tiêu lớn)</option>
                    {goals.map(g => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as any)}
                    className="flex-1 px-2 py-1 text-xs bg-white text-ink font-bold rounded-lg border border-blue-200 outline-none uppercase max-w-[100px]"
                  >
                    <option value="High">Cao</option>
                    <option value="Medium">Trung Bình</option>
                    <option value="Low">Thấp</option>
                  </select>
                  <button type="submit" className="flex-1 px-3 py-1 bg-ink text-white font-black text-xs uppercase tracking-widest rounded-lg">
                    Thêm Ngay
                  </button>
                </div>
              </form>
            )}

            {/* list display */}
            {activeTasks.filter(t => {
              if (taskFilter === "All") return true;
              if (taskFilter.startsWith("Priority:")) return t.priority === taskFilter.split(":")[1];
              if (taskFilter.startsWith("Goal:")) return t.goalId === taskFilter.split(":")[1];
              return true;
            }).length === 0 ? (
              <div className="text-center py-10 select-none">
                <span className="text-3xl block">🥳</span>
                <p className="text-xs font-hand italic text-ink/50 mt-1">Hoàn hảo! Trống trải không còn nhiệm vụ nào.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {activeTasks.filter(t => {
                  if (taskFilter === "All") return true;
                  if (taskFilter.startsWith("Priority:")) return t.priority === taskFilter.split(":")[1];
                  if (taskFilter.startsWith("Goal:")) return t.goalId === taskFilter.split(":")[1];
                  return true;
                }).map(task => {
                  const priorityStyles = 
                    task.priority === "High" ? "bg-red-50 text-crimson border-red-200" :
                    task.priority === "Medium" ? "bg-amber-50 text-amber-600 border-amber-200" :
                    "bg-slate-50 text-slate-500 border-slate-200";
                  const targetGoal = goals.find(g => g.id === task.goalId);

                  return (
                    <div 
                      key={task.id} 
                      className="flex items-start justify-between bg-white px-3.5 py-3 rounded-2xl border border-ink/10 hover:border-ink/20 hover:shadow-sm transition-all"
                    >
                      <div className="flex gap-3 min-w-0 flex-1 pr-2">
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className="w-5 h-5 rounded hover:border-emerald-500 bg-emerald-50/30 border-2 border-ink/20 shrink-0 cursor-pointer flex items-center justify-center mt-0.5"
                        ></button>
                        
                        <div className="min-w-0 text-left flex-1">
                          <p className="font-bold text-xs text-ink leading-snug break-words">{task.content}</p>
                          {targetGoal && (
                            <span className="inline-flex mt-1 text-[10px] font-black text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 uppercase">
                              🎯 Goal: {targetGoal.title}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${priorityStyles} font-mono shrink-0`}>
                          {task.priority}
                        </span>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 hover:text-crimson text-ink/30 cursor-pointer shrink-0"
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
        
        {/* RIGHT COLUMN: CALENDAR (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white/90 p-5 rounded-2xl sketch-border border-ink/60 space-y-4 shadow-sm">
            
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
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {calendarDays.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDateStr;
                const matchesToday = cell.dateStr === new Date().toISOString().split("T")[0];
                const dayLogs = cell.dateStr ? logs.filter(l => l.date === cell.dateStr) : [];
                const hasLogs = dayLogs.length > 0;

                return (
                  <button
                    key={idx}
                    disabled={!cell.day}
                    onClick={() => { if (cell.dateStr) setSelectedDateStr(cell.dateStr); }}
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
            <div className="p-4 bg-[#fffdf5]/80 rounded-xl border border-dashed border-amber-300 space-y-3">
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
          <div className="overflow-x-auto scrollbar-thin">
            <table className="min-w-full divide-y divide-ink/10">
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

    </div>
  );
}
