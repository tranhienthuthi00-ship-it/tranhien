import { useState } from "react";
import { Plus, Target, Calendar, Award, Trash2, CheckCircle2, TrendingUp, X, FileText, ChevronDown, ChevronUp } from "lucide-react";
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
        description: `Bạn đã thực hiện xong "${completedGoal.title}" vào ngày ${new Date(completedGoal.completedAt).toLocaleDateString('vi-VN')}`,
        unlockedAt: completedGoal.completedAt,
        icon: 'Award'
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
        const goal = goals.find(g => g.id === id);
        return {
          ...ach,
          unlockedAt: timestamp,
          description: `Bạn đã thực hiện xong "${goal?.title}" vào ngày ${new Date(timestamp).toLocaleDateString('vi-VN')}`
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
                      className="mt-1 w-8 h-8 sketch-border-sm rounded-lg flex items-center justify-center text-transparent hover:text-emerald-500 hover:border-emerald-500 transition-all shrink-0 bg-white"
                    >
                      <CheckCircle2 size={20} style={{ filter: 'url(#hand-drawn-filter)' }} />
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

          {/* Completed Goals */}
          {goals.some(g => g.isCompleted) && (
            <div className="space-y-4 pt-8">
              <h3 className="text-xs font-black uppercase text-ink/40 tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" style={{ filter: 'url(#hand-drawn-filter)' }} /> Đã hoàn thành ({goals.filter(g => g.isCompleted).length})
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {goals.filter(g => g.isCompleted).map(goal => (
                  <div key={goal.id} className="sketch-border-sm bg-emerald-50/20 p-5 flex items-start gap-4 group hover:bg-emerald-50/40 transition-colors">
                    <button 
                      onClick={() => toggleGoalCompletion(goal.id)}
                      className="mt-1 w-6 h-6 sketch-border-sm rounded-md flex items-center justify-center bg-emerald-500 text-white shrink-0 shadow-sm"
                    >
                      <CheckCircle2 size={16} style={{ filter: 'url(#hand-drawn-filter)' }} />
                    </button>
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-bold text-emerald-900 line-through opacity-40">{goal.title}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                            <div className="flex items-center gap-2">
                              <label className="text-[9px] font-black uppercase text-emerald-700/40 tracking-widest whitespace-nowrap">Xong ngày:</label>
                              <input 
                                type="date"
                                value={goal.completedAt ? new Date(goal.completedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                                onChange={(e) => updateCompletionDate(goal.id, e.target.value)}
                                className="bg-transparent border-none p-0 text-[10px] font-bold text-emerald-700 focus:outline-none h-auto w-32 cursor-pointer hover:bg-emerald-100/50 rounded px-1 transition-colors"
                              />
                            </div>
                            {goal.notes && (
                              <div className="text-[8px] font-bold text-emerald-600/40 uppercase tracking-widest flex items-center gap-1">
                                <FileText size={10} style={{ filter: 'url(#hand-drawn-filter)' }} /> Có ghi chú
                              </div>
                            )}
                          </div>
                        </div>
                        <button onClick={() => removeGoal(goal.id)} className="text-emerald-900/10 hover:text-crimson transition-colors p-1"><Trash2 size={16} style={{ filter: 'url(#hand-drawn-filter)' }} /></button>
                      </div>

                      {/* Review Section */}
                      <div className="pt-3 border-t border-emerald-900/5 space-y-2">
                        <label className="flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-800/40 tracking-widest">
                          <FileText size={12} style={{ filter: 'url(#hand-drawn-filter)' }} /> Bài học / Review sau khi hoàn thành
                        </label>
                        <textarea 
                          value={goal.review || ""}
                          onChange={(e) => updateReview(goal.id, e.target.value)}
                          placeholder="Bạn đã học được gì? Cảm tưởng sau khi xong việc..."
                          className="w-full bg-paper/10 sketch-border-sm p-3 text-sm font-sans focus:outline-none focus:bg-emerald-500/5 transition-all h-20 resize-none italic text-emerald-900/80"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Achievements Column */}
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase text-ink/40 tracking-widest flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" style={{ filter: 'url(#hand-drawn-filter)' }} /> Vinh danh ({achievements.length})
          </h3>
          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 scrollbar-none">
            {achievements.length === 0 ? (
              <div className="text-center py-16 bg-white/20 sketch-border border-ink/5 flex flex-col items-center gap-4">
                 <Award className="w-12 h-12 text-ink/5" style={{ filter: 'url(#hand-drawn-filter)' }} />
                 <p className="text-ink/20 italic text-xs">Hãy bắt đầu để nhận huân chương!</p>
              </div>
            ) : (
              achievements.map(ach => (
                <motion.div 
                  key={ach.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="sketch-border bg-yellow-50/50 p-4 space-y-2 border-yellow-200 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex gap-4">
                    <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl text-white shrink-0 shadow-lg">
                      <Award size={20} style={{ filter: 'url(#hand-drawn-filter)' }} />
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-[12px] font-black uppercase tracking-tight leading-tight text-ink">{ach.title}</h5>
                      <p className="text-[10px] text-ink/70 leading-relaxed">{ach.description}</p>
                      <div className="pt-1 flex items-center gap-1.5 text-[8px] font-black text-ink/30 uppercase tracking-widest">
                        <Calendar size={10} style={{ filter: 'url(#hand-drawn-filter)' }} />
                        {new Date(ach.unlockedAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
