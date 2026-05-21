import React, { useState, useMemo } from "react";
import { 
  Plus, Target, Calendar, Trash2, CheckCircle2, Edit2,
  TrendingUp, X, FileText, ChevronDown, ChevronUp,
  Medal, Square, History, Send, Clock, ClipboardList,
  Check, Trophy, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import type { StudyGoal, Achievement, Task } from "../types";
import { cn } from "../lib/utils";

export function PersonalGoals({ 
  goals, 
  setGoals, 
  achievements, 
  setAchievements,
  tasks,
  setTasks
}: { 
  goals: StudyGoal[], 
  setGoals: (goals: StudyGoal[]) => void,
  achievements: Achievement[],
  setAchievements: (achs: Achievement[]) => void,
  tasks: Task[],
  setTasks: (tasks: Task[]) => void
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [deadline, setDeadline] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<string[]>([]);
  const [expandedJourney, setExpandedJourney] = useState<string[]>([]);
  const [journeyInput, setJourneyInput] = useState<{ [key: string]: string }>({});
  const [editingJourneyId, setEditingJourneyId] = useState<string | null>(null);
  const [editJourneyContent, setEditJourneyContent] = useState("");

  // Task related states
  const [newTask, setNewTask] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [taskSortBy, setTaskSortBy] = useState<'Default' | 'Priority'>('Default');
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddTodo, setShowAddTodo] = useState(false);

  // Achievement modal / celebration states
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [isCelebration, setIsCelebration] = useState(false);

  const toggleNotes = (id: string) => {
    setExpandedNotes(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleJourney = (id: string) => {
    setExpandedJourney(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const addJourneyEntry = async (goalId: string) => {
    const text = (editingJourneyId ? editJourneyContent : journeyInput[goalId]);
    if (!text?.trim()) return;

    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        if (editingJourneyId) {
          return {
            ...g,
            journey: g.journey?.map(e => e.id === editingJourneyId ? { ...e, content: text.trim() } : e)
          };
        }
        const newEntry = {
          id: `entry-${Date.now()}`,
          timestamp: Date.now(),
          content: text.trim()
        };
        return {
          ...g,
          journey: [newEntry, ...(g.journey || [])]
        };
      }
      return g;
    });

    await setGoals(updatedGoals);
    if (editingJourneyId) {
      setEditingJourneyId(null);
      setEditJourneyContent("");
    } else {
      setJourneyInput(prev => ({ ...prev, [goalId]: "" }));
    }
  };

  const startEditJourney = (entry: { id: string, content: string }) => {
    setEditingJourneyId(entry.id);
    setEditJourneyContent(entry.content);
  };

  const removeJourneyEntry = async (goalId: string, entryId: string) => {
    if (!confirm("Xóa dòng hành trình này?")) return;
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          journey: g.journey?.filter(e => e.id !== entryId)
        };
      }
      return g;
    });
    await setGoals(updatedGoals);
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([{ id: Date.now().toString(), content: newTask, completed: false, priority: newTaskPriority }, ...tasks]);
    setNewTask("");
    setNewTaskPriority("Medium");
    setShowAddTodo(false);
  };

  const sortedTasks = useMemo(() => {
    const list = [...tasks];
    if (taskSortBy === 'Priority') {
      const weight = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return list.sort((a, b) => weight[b.priority] - weight[a.priority]);
    }
    return list; // Default order (last added first)
  }, [tasks, taskSortBy]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleAddGoal = async () => {
    if (!title.trim()) return;
    const newGoal: StudyGoal = {
      id: `goal-${Date.now()}`,
      title: title.trim(),
      type: 'custom',
      targetValue: 1,
      currentValue: 0,
      notes: notes.trim() || undefined,
      deadline: deadline ? new Date(deadline).getTime() : undefined,
      createdAt: Date.now(),
      isCompleted: false
    };
    await setGoals([newGoal, ...goals]);
    setTitle("");
    setNotes("");
    setDeadline("");
    setShowAdd(false);
  };

  const toggleGoalCompletion = async (id: string) => {
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
      const ach: Achievement = {
        id: `ach-${Date.now()}`,
        goalId: completedGoal.id,
        title: `Hoàn thành: ${completedGoal.title}`,
        description: "Mục tiêu đã hoàn tất!",
        unlockedAt: completedGoal.completedAt,
        icon: 'Medal'
      };
      await setAchievements([ach, ...achievements]);
      setSelectedAchievement(ach);
      setIsCelebration(true);
    }
    await setGoals(updated);
  };

  const updateDeadline = async (id: string, newDate: string) => {
    const timestamp = new Date(newDate).getTime();
    const updatedGoals = goals.map(g => 
      g.id === id ? { ...g, deadline: isNaN(timestamp) ? undefined : timestamp } : g
    );
    await setGoals(updatedGoals);
  };

  const updateCompletionDate = async (id: string, newDate: string) => {
    const timestamp = new Date(newDate).getTime();
    if (isNaN(timestamp)) return;
    
    // Update goal
    const updatedGoals = goals.map(g => 
      g.id === id ? { ...g, completedAt: timestamp } : g
    );
    await setGoals(updatedGoals);

    // Sync Achievement
    const updatedAchs = achievements.map(ach => {
      if (ach.goalId === id) {
        return {
          ...ach,
          unlockedAt: timestamp
        };
      }
      return ach;
    });
    await setAchievements(updatedAchs);
  };

  const removeGoal = async (id: string) => {
    if (confirm("Chắc chắn xóa mục tiêu này?")) {
      await setGoals(goals.filter(g => g.id !== id));
    }
  };

  const updateReview = async (id: string, review: string) => {
    const updated = goals.map(g => 
      g.id === id ? { ...g, review } : g
    );
    await setGoals(updated);
  };

  const updateStartDate = async (id: string, newDate: string) => {
    const timestamp = new Date(newDate).getTime();
    if (isNaN(timestamp)) return;
    const updated = goals.map(g => 
      g.id === id ? { ...g, createdAt: timestamp } : g
    );
    await setGoals(updated);
  };

  const getTimeRemaining = (deadline: number) => {
    const now = Date.now();
    const diff = deadline - now;
    if (diff <= 0) return "Quá hạn";

    const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const years = Math.floor(totalDays / 365);
    const months = Math.floor((totalDays % 365) / 30);
    const days = (totalDays % 365) % 30;

    const parts = [];
    if (years > 0) parts.push(`${years} năm`);
    if (months > 0) parts.push(`${months} tháng`);
    if (days > 0 || (parts.length === 0)) parts.push(`${days} ngày`);

    return `Còn ${parts.join(" ")}`;
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-500 overflow-hidden break-words">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-ink/10 pb-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Target className="w-6 h-6 text-crimson" style={{ filter: 'url(#hand-drawn-filter)' }} />
            Goal Hub
          </h2>
          <p className="hand-text text-lg opacity-60">Mục tiêu & Công việc cần làm</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setShowAddGoal(!showAddGoal); setShowAddTodo(false); }}
            className={cn(
              "sketch-button py-2 px-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-sm",
              showAddGoal ? "bg-crimson text-white border-crimson" : "bg-white text-ink hover:bg-paper"
            )}
          >
            {showAddGoal ? <X size={14} /> : <Target size={14} />}
            Mục tiêu
          </button>
          <button 
            onClick={() => { setShowAddTodo(!showAddTodo); setShowAddGoal(false); }}
            className={cn(
              "sketch-button py-2 px-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-sm",
              showAddTodo ? "bg-crimson text-white border-crimson" : "bg-white text-ink hover:bg-paper"
            )}
          >
            {showAddTodo ? <X size={14} /> : <ClipboardList size={14} />}
            Việc cần làm
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAddGoal && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sketch-border bg-white p-6 space-y-6 shadow-xl relative z-20"
          >
              <div className="flex items-center gap-2 mb-2">
                <Target size={18} className="text-crimson" />
                <h3 className="text-sm font-black uppercase tracking-widest">Thêm mục tiêu mới</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase text-ink/40 tracking-widest">Bạn muốn đạt được điều gì?</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ví dụ: Đọc xong cuốn sách, Đi gym 3 buổi/tuần..."
                    className="w-full bg-paper/20 sketch-border-sm p-4 text-sm font-sans focus:outline-none focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-ink/40 tracking-widest flex items-center gap-1">
                      <Calendar size={10} style={{ filter: 'url(#hand-drawn-filter)' }} /> Thời hạn (Deadline)
                    </label>
                    <div className="relative">
                      <input 
                        type="date" 
                        value={deadline}
                        onChange={e => setDeadline(e.target.value)}
                        className="w-full bg-paper/20 sketch-border-sm p-4 text-xs font-sans focus:outline-none h-[54px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-ink/40 tracking-widest">Ghi chú / Chi tiết</label>
                  <textarea 
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Thêm mô tả..."
                    className="w-full bg-paper/20 sketch-border-sm p-4 text-sm font-sans focus:outline-none focus:bg-white transition-all h-[54px] min-h-[54px]"
                  />
                </div>
              </div>

            <button 
              onClick={handleAddGoal}
              className="w-full sketch-button bg-ink text-white py-4 font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-crimson transition-colors"
            >
              <Target size={20} style={{ filter: 'url(#hand-drawn-filter)' }} /> Xác nhận mục tiêu
            </button>
          </motion.div>
        )}

        {showAddTodo && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sketch-border bg-amber-50/50 p-6 space-y-6 shadow-xl relative z-20"
          >
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList size={18} className="text-ink" />
              <h3 className="text-sm font-black uppercase tracking-widest">Thêm việc cần làm</h3>
            </div>
            <form onSubmit={addTask} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-ink/40 tracking-widest">Nội dung công việc</label>
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Ví dụ: Mua sữa, Soạn mail, Gọi điện cho mẹ..."
                  className="w-full bg-white sketch-border-sm p-4 text-sm font-sans focus:outline-none focus:border-ink transition-all"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-2 items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-ink/40">Ưu tiên:</span>
                  {(['Low', 'Medium', 'High'] as const).map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setNewTaskPriority(level)}
                      className={cn(
                        "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-2 transition-all", 
                        newTaskPriority === level 
                          ? level === 'High' ? "bg-crimson text-white border-crimson shadow-md" 
                            : level === 'Medium' ? "bg-yellow-500 text-white border-yellow-500 shadow-md" 
                            : "bg-gray-500 text-white border-gray-500 shadow-md"
                          : "bg-white text-ink/40 border-ink/10 hover:border-ink/30"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <button type="submit" className="w-full sm:w-auto sketch-button bg-ink text-white py-3 px-8 font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors">
                  <Plus size={16} /> Thêm vào danh sách
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-12">
          {/* TO-DO Section inside Goals */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-ink/40 tracking-widest flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> Việc cần làm ({tasks.filter(t => !t.completed).length})
              </h3>
              <div className="flex gap-3 text-[9px] font-black uppercase tracking-widest text-ink/30">
                <button onClick={() => setTaskSortBy('Default')} className={cn("transition-colors", taskSortBy === 'Default' ? 'text-crimson' : 'hover:text-ink')}>Ngày</button>
                <button onClick={() => setTaskSortBy('Priority')} className={cn("transition-colors", taskSortBy === 'Priority' ? 'text-crimson' : 'hover:text-ink')}>Ưu tiên</button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {sortedTasks.length === 0 ? (
                <div className="text-center py-10 bg-white/40 sketch-border border-ink/5 border-dashed flex flex-col items-center gap-2">
                  <p className="text-ink/20 italic text-sm">Chưa có việc nào cần làm. Hãy thêm việc mới!</p>
                </div>
              ) : (
                sortedTasks.map(task => (
                  <motion.div 
                    layout
                    key={task.id} 
                    className={cn(
                      "flex items-center group relative py-3 px-4 sketch-border transition-all",
                      task.completed ? "opacity-50 grayscale bg-paper/20" : 
                      task.priority === 'High' ? "bg-crimson/5 border-crimson" : 
                      task.priority === 'Medium' ? "bg-yellow-400/5 border-yellow-500" :
                      "bg-white border-ink/10 hover:border-ink/20"
                    )}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "w-5 h-5 sketch-border-sm mr-4 flex-shrink-0 transition-all flex items-center justify-center",
                        task.completed ? "bg-crimson border-crimson text-white" : "bg-white border-ink/20"
                      )}
                    >
                      {task.completed && <Check size={14} strokeWidth={4} />}
                    </button>
                    <div className="flex-1">
                      <p className={cn(
                        "font-bold text-sm transition-all font-sans", 
                        task.completed ? "line-through text-ink/40" : 
                        task.priority === 'High' ? "text-crimson" : 
                        task.priority === 'Medium' ? "text-yellow-700" : "text-ink/70"
                      )}>
                        {task.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "text-[7px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded shadow-sm border",
                          task.completed ? "bg-ink/5 text-ink/20 border-transparent" :
                          task.priority === 'High' ? "bg-white text-crimson border-crimson" : 
                          task.priority === 'Medium' ? "bg-white text-yellow-600 border-yellow-500" : "bg-white text-ink/40 border-ink/20"
                        )}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-ink/20 hover:text-crimson ml-4 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-ink/40 tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ filter: 'url(#hand-drawn-filter)' }} /> Mục tiêu ({goals.filter(g => !g.isCompleted).length})
              </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {goals.filter(g => !g.isCompleted).length === 0 ? (
                <div className="text-center py-16 bg-white/40 sketch-border border-ink/5 flex flex-col items-center gap-4 group">
                  <Target className="w-12 h-12 text-ink/10 group-hover:scale-110 transition-transform" style={{ filter: 'url(#hand-drawn-filter)' }} />
                  <p className="text-ink/30 italic text-sm">Mọi thứ đã xong, hãy đặt thêm mục tiêu mới!</p>
                </div>
              ) : (
                goals.filter(g => !g.isCompleted).map(goal => (
                  <div key={goal.id} className="sketch-border bg-white p-6 flex flex-col gap-4 transition-all hover:bg-paper/10 relative group shadow-sm hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <button 
                        onClick={() => toggleGoalCompletion(goal.id)}
                        className="mt-1 w-8 h-8 sketch-border-sm rounded-lg flex items-center justify-center text-ink/20 hover:text-emerald-600 hover:border-emerald-500 transition-all shrink-0 bg-white group-hover:border-ink/20 shadow-sm"
                      >
                        <Square size={20} style={{ filter: 'url(#hand-drawn-filter)' }} />
                      </button>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <h4 className="text-xl font-bold text-ink leading-tight group-hover:text-crimson transition-colors">{goal.title}</h4>
                            <div className="flex flex-wrap gap-3">
                              {goal.deadline && (
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-crimson uppercase tracking-widest">
                                    <Calendar size={12} style={{ filter: 'url(#hand-drawn-filter)' }} />
                                    Deadline:
                                  </div>
                                  <input 
                                    type="date"
                                    value={new Date(goal.deadline).toISOString().split('T')[0]}
                                    onChange={(e) => updateDeadline(goal.id, e.target.value)}
                                    className="bg-crimson/5 border-none p-1 text-[10px] font-bold text-crimson focus:outline-none w-fit cursor-pointer hover:bg-crimson/10 rounded transition-colors"
                                  />
                                  <div className="text-[10px] font-black text-crimson bg-crimson/5 px-2 py-0.5 rounded-full w-fit mt-1">
                                    {getTimeRemaining(goal.deadline)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <button onClick={() => removeGoal(goal.id)} className="text-ink/10 hover:text-crimson transition-colors p-1"><Trash2 size={18} style={{ filter: 'url(#hand-drawn-filter)' }} /></button>
                        </div>

                        {goal.notes && (
                          <div className="pt-2 border-t border-ink/5">
                            <button 
                              onClick={() => toggleNotes(goal.id)}
                              className="flex items-center gap-1 text-[9px] font-black uppercase text-ink/30 hover:text-ink transition-colors"
                            >
                              {expandedNotes.includes(goal.id) ? <ChevronUp size={12} style={{ filter: 'url(#hand-drawn-filter)' }} /> : <ChevronDown size={12} style={{ filter: 'url(#hand-drawn-filter)' }} />}
                              {expandedNotes.includes(goal.id) ? "Thu gọn ghi chú" : "Xem ghi chú"}
                            </button>
                            <AnimatePresence>
                              {expandedNotes.includes(goal.id) && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <p className="text-sm text-ink/70 bg-paper/10 p-3 rounded mt-2 border-l-2 border-ink/20 italic whitespace-pre-wrap">
                                    {goal.notes}
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Journey Section */}
                        <div className="pt-2">
                          <button 
                            onClick={() => toggleJourney(goal.id)}
                            className="flex items-center gap-1.5 text-[9px] font-black uppercase text-crimson transition-all"
                          >
                            <History size={14} style={{ filter: 'url(#hand-drawn-filter)' }} />
                            Ghi lại hành trình ({goal.journey?.length || 0})
                          </button>

                          <AnimatePresence>
                            {expandedJourney.includes(goal.id) && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-4 mt-3"
                              >
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    value={journeyInput[goal.id] || ""}
                                    onChange={e => setJourneyInput(prev => ({ ...prev, [goal.id]: e.target.value }))}
                                    placeholder="Hôm nay bạn làm gì? (Ví dụ: Hôm nay tôi niềng răng...)"
                                    onKeyDown={e => e.key === 'Enter' && addJourneyEntry(goal.id)}
                                    className="flex-1 bg-paper/10 sketch-border-sm p-3 text-sm font-sans focus:outline-none focus:bg-white transition-all h-10 italic"
                                  />
                                  <button 
                                    onClick={() => addJourneyEntry(goal.id)}
                                    className="w-10 h-10 sketch-border-sm bg-ink text-white flex items-center justify-center hover:bg-crimson transition-colors"
                                  >
                                    <Send size={16} />
                                  </button>
                                </div>

                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-none">
                                  {Object.entries(
                                    (goal.journey || []).reduce((acc, entry) => {
                                      const date = format(new Date(entry.timestamp), 'dd/MM/yyyy');
                                      if (!acc[date]) acc[date] = [];
                                      acc[date].push(entry);
                                      return acc;
                                    }, {} as { [key: string]: any[] })
                                  ).sort((a,b) => new Date(b[0].split('/').reverse().join('-')).getTime() - new Date(a[0].split('/').reverse().join('-')).getTime()).map(([date, entries]) => (
                                    <div key={date} className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <div className="h-px bg-crimson/10 flex-1" />
                                        <span className="text-[8px] font-black text-crimson uppercase tracking-widest bg-white px-2 border border-crimson/10 rounded-full">{date}</span>
                                        <div className="h-px bg-crimson/10 flex-1" />
                                      </div>
                                      <div className="space-y-3">
                                        {entries.map((entry) => (
                                          <motion.div 
                                            key={entry.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex gap-3 items-start group/entry"
                                          >
                                            <div className="w-1.5 h-1.5 rounded-full bg-crimson/30 mt-2 shrink-0 group-hover/entry:scale-150 transition-transform" />
                                            <div className="flex-1">
                                              <div className="flex items-center justify-between gap-2">
                                                <div className="text-[8px] font-bold text-ink/20 uppercase tracking-widest mb-0.5">
                                                  {new Date(entry.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  <button 
                                                    onClick={() => startEditJourney(entry)}
                                                    className="text-ink/0 group-hover/entry:text-ink/20 hover:!text-ink transition-all p-0.5"
                                                  >
                                                    <Edit2 size={10} />
                                                  </button>
                                                  <button 
                                                    onClick={() => removeJourneyEntry(goal.id, entry.id)}
                                                    className="text-ink/0 group-hover/entry:text-ink/20 hover:!text-crimson transition-all p-0.5"
                                                  >
                                                    <X size={10} />
                                                  </button>
                                                </div>
                                              </div>
                                              {editingJourneyId === entry.id ? (
                                                <div className="flex gap-2 mt-1">
                                                  <input 
                                                    type="text" 
                                                    value={editJourneyContent}
                                                    onChange={e => setEditJourneyContent(e.target.value)}
                                                    onKeyDown={e => {
                                                      if (e.key === 'Enter') addJourneyEntry(goal.id);
                                                      if (e.key === 'Escape') setEditingJourneyId(null);
                                                    }}
                                                    autoFocus
                                                    className="flex-1 bg-white sketch-border-sm p-1 text-xs font-sans focus:outline-none"
                                                  />
                                                  <button 
                                                    onClick={() => addJourneyEntry(goal.id)}
                                                    className="text-emerald-600 hover:text-emerald-700"
                                                  >
                                                    <CheckCircle2 size={14} />
                                                  </button>
                                                </div>
                                              ) : (
                                                <p className="text-sm text-ink/80 leading-relaxed font-sans">{entry.content}</p>
                                              )}
                                            </div>
                                          </motion.div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                  {(!goal.journey || goal.journey.length === 0) && (
                                    <p className="text-[10px] text-ink/30 text-center py-4 italic">Chưa có hành trình nào được ghi lại.</p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Achievements Column */}
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase text-ink/40 tracking-widest flex items-center gap-2">
            <Medal className="w-4 h-4 text-ink" style={{ filter: 'url(#hand-drawn-filter)' }} /> Vinh danh ({achievements.length})
          </h3>
          <div className="space-y-8 max-h-[1000px] overflow-y-auto pr-2 scrollbar-none">
            {achievements.length === 0 ? (
              <div className="text-center py-16 bg-white/20 sketch-border border-ink/5 flex flex-col items-center gap-4">
                 <Medal className="w-12 h-12 text-ink/5" style={{ filter: 'url(#hand-drawn-filter)' }} />
                 <p className="text-ink/20 italic text-xs">Hãy bắt đầu để nhận huân chương!</p>
              </div>
            ) : (
              Object.entries(
                achievements.reduce((acc, ach) => {
                  const date = format(new Date(ach.unlockedAt), 'dd/MM/yyyy');
                  if (!acc[date]) acc[date] = [];
                  acc[date].push(ach);
                  return acc;
                }, {} as { [key: string]: Achievement[] })
              ).sort((a,b) => new Date(b[0].split('/').reverse().join('-')).getTime() - new Date(a[0].split('/').reverse().join('-')).getTime()).map(([date, dateAchs]) => (
                <div key={date} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px bg-ink/10 flex-1" />
                    <span className="text-[10px] font-black text-ink/40 uppercase tracking-widest bg-paper px-3 py-1 sketch-border-sm">{date}</span>
                    <div className="h-px bg-ink/10 flex-1" />
                  </div>
                  <div className="space-y-4">
                    {dateAchs.map(ach => {
                      const linkedGoal = goals.find(g => g.id === ach.goalId);
                      return (
                        <motion.div 
                          key={ach.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          whileHover={{ scale: 1.02 }}
                          className="sketch-border bg-white p-5 space-y-4 border-ink/20 relative group shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none opacity-10">
                             <svg viewBox="0 0 100 100" className="w-full h-full text-ink">
                               <path d="M 10,90 Q 50,50 90,10 M 40,10 L 90,10 L 90,60" fill="none" stroke="currentColor" strokeWidth="4" />
                             </svg>
                          </div>

                          <div className="flex gap-5">
                            <div className="p-3 text-ink shrink-0 bg-paper/20 rounded-full h-fit flex items-center justify-center" style={{ filter: 'url(#hand-drawn-filter)' }}>
                              <Medal size={32} style={{ filter: 'url(#hand-drawn-filter)' }} />
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="flex justify-between items-start">
                                <h5 className="text-[14px] font-black uppercase tracking-tight leading-tight text-ink">{ach.title}</h5>
                                <div className="flex items-center gap-2">
                                  {linkedGoal && (
                                    <button 
                                      onClick={() => toggleGoalCompletion(linkedGoal.id)}
                                      className="text-ink/10 hover:text-crimson transition-colors p-1"
                                      title="Hủy hoàn thành"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-[11px] text-ink/60 italic leading-relaxed">
                                Bạn đã thực hiện xong {linkedGoal?.title ? `"${linkedGoal.title}"` : ""}
                              </p>
                              
                              {linkedGoal && (
                                <div className="mt-2 pt-2 border-t border-ink/5 flex flex-wrap gap-3 items-center justify-between">
                                  <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-1.5 font-sans">
                                      <span className="text-[9px] uppercase font-black tracking-wider text-ink/40 font-sans" title="Ngày bắt đầu">Bắt đầu:</span>
                                      <div className="relative">
                                        <div className="bg-paper/20 rounded border border-ink/10 px-2 py-0.5 text-[10px] font-bold text-ink/70 font-sans min-w-[75px] text-center">
                                          {linkedGoal.createdAt ? format(new Date(linkedGoal.createdAt), "dd/MM/yyyy") : "Chưa chọn"}
                                        </div>
                                        <input 
                                          type="date"
                                          value={linkedGoal.createdAt ? new Date(linkedGoal.createdAt).toISOString().split('T')[0] : ""}
                                          onChange={(e) => updateStartDate(linkedGoal.id, e.target.value)}
                                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 font-sans">
                                      <span className="text-[9px] uppercase font-black tracking-wider text-ink/40 font-sans" title="Ngày hoàn thành">Đạt được:</span>
                                      <div className="relative">
                                        <div className="bg-paper/20 rounded border border-ink/10 px-2 py-0.5 text-[10px] font-bold text-ink/70 font-sans min-w-[75px] text-center">
                                          {linkedGoal.completedAt ? format(new Date(linkedGoal.completedAt), "dd/MM/yyyy") : "Chưa chọn"}
                                        </div>
                                        <input 
                                          type="date"
                                          value={linkedGoal.completedAt ? new Date(linkedGoal.completedAt).toISOString().split('T')[0] : ""}
                                          onChange={(e) => updateCompletionDate(linkedGoal.id, e.target.value)}
                                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSelectedAchievement(ach);
                                      setIsCelebration(false);
                                    }}
                                    className="text-[10px] font-black uppercase text-crimson hover:underline flex items-center gap-1.5"
                                    title="Xem chi tiết"
                                  >
                                    <Trophy size={11} className="stroke-[2.5]" style={{ filter: 'url(#hand-drawn-filter)' }} /> Chi tiết
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {linkedGoal && (
                            <div className="pt-3 border-t-2 border-dashed border-ink/5 space-y-4">
                              {/* Review */}
                              <div className="space-y-2">
                                <label className="flex items-center gap-1.5 text-[9px] font-black uppercase text-ink/40 tracking-widest">
                                  <FileText size={12} style={{ filter: 'url(#hand-drawn-filter)' }} /> Review
                                </label>
                                <textarea 
                                  value={linkedGoal.review || ""}
                                  onChange={(e) => updateReview(linkedGoal.id, e.target.value)}
                                  placeholder="Thêm review"
                                  className="w-full bg-paper/5 p-3 text-sm font-sans focus:outline-none focus:bg-white transition-all h-20 resize-none italic text-ink/80 sketch-border-sm"
                                />
                              </div>

                              {/* Journey History */}
                              {linkedGoal.journey && linkedGoal.journey.length > 0 && (
                                <div className="space-y-2">
                                  <label className="flex items-center gap-1.5 text-[9px] font-black uppercase text-ink/40 tracking-widest">
                                    <History size={12} style={{ filter: 'url(#hand-drawn-filter)' }} /> Hành trình đã ghi lại
                                  </label>
                                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-none border-l-2 border-ink/5 pl-3">
                                    {linkedGoal.journey.map(entry => (
                                      <div key={entry.id} className="space-y-0.5">
                                        <div className="text-[7px] font-bold text-ink/20 uppercase">
                                          {format(new Date(entry.timestamp), 'dd/MM/yyyy')}
                                        </div>
                                        <p className="text-[11px] text-ink/70 leading-snug">{entry.content}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedAchievement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative bg-[#f4f1ea] sketch-border w-full max-w-lg p-5 md:p-8 space-y-5 md:space-y-6 shadow-2xl my-auto max-h-[92vh] overflow-y-auto scrollbar-thin text-ink focus:outline-none"
            >
              {/* Confetti or hand-drawn sparkles behind icon in celebration mode */}
              {isCelebration && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
                  <div className="absolute top-1/4 left-1/4 w-3.5 h-3.5 bg-crimson rounded-full animate-ping opacity-75" />
                  <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-yellow-500 rounded-full animate-ping opacity-50 delay-100" />
                  <div className="absolute bottom-1/3 left-1/3 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-60 delay-300" />
                </div>
              )}

              {/* Close Button */}
              <button 
                onClick={() => {
                  setSelectedAchievement(null);
                  setIsCelebration(false);
                }}
                className="absolute top-4 right-4 text-ink/40 hover:text-crimson bg-paper/30 hover:bg-paper/80 p-1 rounded-full transition-colors z-20"
                aria-label="Đóng"
                id="close-achievement-modal"
              >
                <X size={20} />
              </button>

              {/* Header Icons and Styling */}
              <div className="flex flex-col items-center text-center space-y-3 pt-4 font-sans">
                <div 
                  className={cn(
                    "p-4 rounded-full border-4 border-dashed border-amber-500 bg-yellow-50 text-amber-500",
                    isCelebration && "animate-bounce"
                  )}
                  style={{ filter: 'url(#hand-drawn-filter)' }}
                >
                  {isCelebration ? <Trophy size={48} className="stroke-[2.5]" /> : <Medal size={48} className="stroke-[2.5]" />}
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-[11px] font-black uppercase text-crimson tracking-widest flex items-center justify-center gap-1.5 font-sans">
                    {isCelebration ? (
                      <>
                        <Sparkles size={12} className="text-yellow-500 animate-pulse" />
                        MỞ KHÓA THÀNH TÍCH MỚI!
                        <Sparkles size={12} className="text-yellow-500 animate-pulse" />
                      </>
                    ) : "CHI TIẾT THÀNH TÍCH"}
                  </h4>
                  <h3 className="text-2xl font-sans font-black uppercase tracking-tight leading-tight">
                    {selectedAchievement.title}
                  </h3>
                  <p className="text-xs text-ink/45 flex items-center justify-center gap-1.5 mt-1 font-mono">
                    <Clock size={12} /> Đạt được vào: {format(new Date(selectedAchievement.unlockedAt), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              </div>

              {/* Associated Goal Details */}
              {(() => {
                const goal = goals.find(g => g.id === selectedAchievement.goalId);
                if (!goal) {
                  return (
                    <p className="text-xs text-ink/40 italic text-center py-4 bg-white/50 rounded border border-dashed border-ink/10 relative z-10">
                      Mục tiêu liên kết đã bị xóa hoặc không tìm thấy.
                    </p>
                  );
                }

                const completedDate = goal.completedAt ? format(new Date(goal.completedAt), "dd/MM/yyyy") : null;
                const deadlineDate = goal.deadline ? format(new Date(goal.deadline), "dd/MM/yyyy") : null;
                
                let durationDays = 0;
                if (goal.completedAt) {
                  durationDays = Math.ceil((goal.completedAt - goal.createdAt) / (1000 * 60 * 60 * 24));
                }

                let isOnTime = true;
                if (goal.completedAt && goal.deadline && goal.completedAt > goal.deadline) {
                  isOnTime = false;
                }

                return (
                  <div className="space-y-5 text-left relative z-10">
                    
                    {/* Goal Overview Card */}
                    <div className="sketch-border bg-white p-4 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none opacity-[0.03]">
                        <Target size={32} />
                      </div>
                      
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-ink/40 bg-[#f4f1ea] border border-ink/10 px-2 py-0.5 rounded-full w-fit block">
                          Thông tin Mục tiêu liên kết
                        </span>
                        <h4 className="text-lg font-bold text-ink leading-snug">
                          {goal.title}
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-ink/5 font-sans text-xs">
                        <div>
                          <span className="text-[9px] uppercase font-black tracking-wider text-ink/40 block mb-1 font-sans">Ngày bắt đầu</span>
                          <div className="relative">
                            <div className="bg-paper/20 sketch-border-sm p-1.5 text-[11px] font-bold text-ink/80 text-center w-full min-h-[34px] flex items-center justify-center rounded">
                              {goal.createdAt ? format(new Date(goal.createdAt), "dd/MM/yyyy") : "Chưa chọn"}
                            </div>
                            <input 
                              type="date"
                              value={goal.createdAt ? new Date(goal.createdAt).toISOString().split('T')[0] : ""}
                              onChange={(e) => updateStartDate(goal.id, e.target.value)}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase font-black tracking-wider text-ink/40 block mb-1 font-sans">Ngày hoàn thành</span>
                          <div className="relative">
                            <div className="bg-paper/20 sketch-border-sm p-1.5 text-[11px] font-bold text-emerald-700 text-center w-full min-h-[34px] flex items-center justify-center rounded">
                              {completedDate || "Đã hoàn thành"}
                            </div>
                            <input 
                              type="date"
                              value={goal.completedAt ? new Date(goal.completedAt).toISOString().split('T')[0] : ""}
                              onChange={(e) => updateCompletionDate(goal.id, e.target.value)}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                          </div>
                        </div>

                        {durationDays > 0 && (
                          <div className="col-span-2">
                            <span className="text-[9px] uppercase font-black tracking-wider text-ink/40 block mb-1">Thời gian thực hiện</span>
                            <strong className="text-ink/85 font-mono text-xs">
                              {durationDays} ngày {durationDays === 1 ? "(Hoàn thành trong ngày!) 🚀" : ""}
                            </strong>
                          </div>
                        )}

                        {deadlineDate && (
                          <div className="col-span-2 space-y-1">
                            <span className="text-[9px] uppercase font-black tracking-wider text-ink/40 block">Kế hoạch (Deadline)</span>
                            <div className="flex items-center gap-1.5 font-sans">
                              <strong className="text-ink/80">{deadlineDate}</strong>
                              {isOnTime ? (
                                <span className="bg-emerald-50 text-emerald-700 text-[8px] font-bold uppercase tracking-widest border border-emerald-300 px-2 py-0.5 rounded-full inline-block">
                                  Đúng hạn ⚡
                                </span>
                              ) : (
                                <span className="bg-crimson/5 text-crimson text-[8px] font-bold uppercase tracking-widest border border-crimson/20 px-2 py-0.5 rounded-full inline-block">
                                  Trễ hạn
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {goal.notes && (
                        <div className="pt-2.5 border-t border-ink/5">
                          <span className="text-[9px] uppercase font-black tracking-wider text-ink/40 block mb-1">Ghi chú mục tiêu</span>
                          <p className="text-xs text-ink/70 italic bg-[#f4f1ea]/50 p-2.5 rounded border-l-2 border-ink/20 whitespace-pre-wrap font-sans">
                            {goal.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Review Section */}
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-ink/50 tracking-widest" htmlFor="goal-modal-review">
                        <FileText size={14} style={{ filter: 'url(#hand-drawn-filter)' }} /> Cảm xúc & Đánh giá (Review)
                      </label>
                      <textarea 
                        id="goal-modal-review"
                        value={goal.review || ""}
                        onChange={(e) => updateReview(goal.id, e.target.value)}
                        placeholder="Hãy chia sẻ những bài học, cảm xúc hay khó khăn bạn đã vượt qua để hoàn thành mục tiêu này..."
                        className="w-full bg-[#f4f1ea]/40 p-3.5 text-sm font-sans focus:outline-none focus:bg-white transition-all h-24 resize-none italic text-ink/85 sketch-border-sm"
                      />
                    </div>

                    {/* Journey history */}
                    {goal.journey && goal.journey.length > 0 && (
                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-ink/50 tracking-widest">
                          <History size={14} style={{ filter: 'url(#hand-drawn-filter)' }} /> Các dấu mốc hành trình
                        </label>
                        <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2 scrollbar-none border-l-2 border-ink/10 pl-4 py-1">
                          {goal.journey.map(entry => (
                            <div key={entry.id} className="space-y-0.5 font-sans relative group/modal-entry">
                              <div className="absolute -left-[21.5px] top-1.5 w-1.5 h-1.5 rounded-full bg-crimson" />
                              <div className="text-[8px] font-bold text-ink/30 uppercase tracking-wider">
                                {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm')}
                              </div>
                              <p className="text-xs text-ink/75 leading-relaxed">{entry.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Modal Actions */}
              <div className="pt-4 border-t-2 border-dashed border-ink/10 flex justify-end gap-3 font-sans relative z-10 shrink-0">
                <button
                  onClick={() => {
                    setSelectedAchievement(null);
                    setIsCelebration(false);
                  }}
                  className="sketch-button py-2 px-6 text-xs font-black uppercase tracking-widest bg-ink text-white hover:bg-crimson transition-all"
                  id="close-achievement-modal-btn"
                >
                  Đóng (Close)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
