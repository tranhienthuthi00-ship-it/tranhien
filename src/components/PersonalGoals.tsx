import { useState } from "react";
import { 
  Plus, Target, Calendar, Trash2, CheckCircle2, 
  TrendingUp, X, FileText, ChevronDown, ChevronUp,
  Medal, Square
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { StudyGoal, Achievement } from "../types";

export function PersonalGoals({ 
  goals, 
  setGoals, 
  achievements, 
  setAchievements 
}: { 
  goals: StudyGoal[], 
  setGoals: (goals: StudyGoal[]) => void,
  achievements: Achievement[],
  setAchievements: (achs: Achievement[]) => void
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [deadline, setDeadline] = useState("");
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().split('T')[0]);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<string[]>([]);

  const toggleNotes = (id: string) => {
    setExpandedNotes(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
      createdAt: new Date(createdAt).getTime() || Date.now(),
      isCompleted: false
    };
    await setGoals([newGoal, ...goals]);
    setTitle("");
    setNotes("");
    setDeadline("");
    setCreatedAt(new Date().toISOString().split('T')[0]);
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
    }
    await setGoals(updated);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b-2 border-ink/10 pb-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Target className="w-6 h-6 text-crimson" style={{ filter: 'url(#hand-drawn-filter)' }} />
            Mục tiêu
          </h2>
          <p className="hand-text text-lg opacity-60">Đặt mục tiêu & thực hiện</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="sketch-button bg-ink text-white py-2 px-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-crimson transition-colors"
        >
          {showAdd ? <X size={16} /> : <Plus size={16} />}
          {showAdd ? "Hủy" : "Thêm mục tiêu"}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sketch-border bg-white p-6 space-y-6 shadow-xl"
          >
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
                  <label className="text-[10px] font-black uppercase text-ink/40 tracking-widest">Thời hạn (Deadline)</label>
                  <input 
                    type="date" 
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full bg-paper/20 sketch-border-sm p-4 text-xs font-sans focus:outline-none h-[54px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-ink/40 tracking-widest">Ngày tạo (Tùy chọn)</label>
                  <input 
                    type="date" 
                    value={createdAt}
                    onChange={e => setCreatedAt(e.target.value)}
                    className="w-full bg-paper/20 sketch-border-sm p-4 text-xs font-sans focus:outline-none h-[54px]"
                  />
                </div>
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
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Active Goals */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-ink/40 tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ filter: 'url(#hand-drawn-filter)' }} /> Đang thực hiện ({goals.filter(g => !g.isCompleted).length})
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
                <div key={goal.id} className="sketch-border bg-white p-6 flex flex-col gap-4 transition-all hover:bg-paper/10 relative group">
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
                              <div className="flex items-center gap-1 text-[10px] font-bold text-crimson uppercase tracking-widest">
                                <Calendar size={12} style={{ filter: 'url(#hand-drawn-filter)' }} />
                                Deadline: {new Date(goal.deadline).toLocaleDateString('vi-VN')}
                              </div>
                            )}
                            <div className="text-[10px] font-bold text-ink/20 uppercase tracking-widest flex items-center gap-1">
                              <FileText size={12} style={{ filter: 'url(#hand-drawn-filter)' }} />
                              Ngày tạo: {new Date(goal.createdAt).toLocaleDateString('vi-VN')}
                            </div>
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
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Achievements Column */}
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase text-ink/40 tracking-widest flex items-center gap-2">
            <Medal className="w-4 h-4 text-ink" style={{ filter: 'url(#hand-drawn-filter)' }} /> Vinh danh ({achievements.length})
          </h3>
          <div className="space-y-6 max-h-[1000px] overflow-y-auto pr-2 scrollbar-none">
            {achievements.length === 0 ? (
              <div className="text-center py-16 bg-white/20 sketch-border border-ink/5 flex flex-col items-center gap-4">
                 <Medal className="w-12 h-12 text-ink/5" style={{ filter: 'url(#hand-drawn-filter)' }} />
                 <p className="text-ink/20 italic text-xs">Hãy bắt đầu để nhận huân chương!</p>
              </div>
            ) : (
              achievements.map(ach => {
                const linkedGoal = goals.find(g => g.id === ach.goalId);
                return (
                  <motion.div 
                    key={ach.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="sketch-border bg-white p-5 space-y-4 border-ink/20 relative group shadow-sm hover:shadow-md transition-all"
                  >
                    {/* Decorative Hand-drawn corner */}
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
                          Bạn đã thực hiện xong {linkedGoal?.title ? `"${linkedGoal.title}"` : ""} vào ngày {new Date(linkedGoal?.completedAt || ach.unlockedAt).toLocaleDateString('vi-VN')}
                        </p>
                        
                        {linkedGoal && (
                          <div className="mt-2 pt-2 border-t border-ink/5 flex items-center gap-2">
                            <Calendar size={10} className="text-ink/30" />
                            <input 
                              type="date"
                              value={linkedGoal.completedAt ? new Date(linkedGoal.completedAt).toISOString().split('T')[0] : ""}
                              onChange={(e) => updateCompletionDate(linkedGoal.id, e.target.value)}
                              className="bg-paper/20 sketch-border-sm border-none p-1.5 text-[10px] font-bold text-ink/60 focus:outline-none h-auto w-auto min-w-[120px] cursor-pointer hover:bg-paper/40 rounded transition-all"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {linkedGoal && (
                      <div className="pt-3 border-t-2 border-dashed border-ink/5 space-y-2">
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
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
