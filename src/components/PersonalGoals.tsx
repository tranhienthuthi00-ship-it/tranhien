import { useState } from "react";
import { Plus, Target, Calendar, Award, Trash2, CheckCircle2, TrendingUp, X } from "lucide-react";
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
  const [target, setTarget] = useState(1);
  const [unit, setUnit] = useState("");
  const [type, setType] = useState<StudyGoal['type']>('custom');
  const [deadline, setDeadline] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const handleAddGoal = async () => {
    if (!title.trim()) return;
    const newGoal: StudyGoal = {
      id: `goal-${Date.now()}`,
      title: title.trim(),
      type,
      targetValue: target,
      currentValue: 0,
      unit: unit.trim() || undefined,
      deadline: deadline ? new Date(deadline).getTime() : undefined,
      createdAt: Date.now(),
      isCompleted: false
    };
    await setGoals([newGoal, ...goals]);
    setTitle("");
    setTarget(1);
    setUnit("");
    setDeadline("");
    setShowAdd(false);
  };

  const incrementProgress = async (id: string, amount: number = 1) => {
    const updated = goals.map(g => {
      if (g.id === id && !g.isCompleted) {
        const newValue = g.currentValue + amount;
        const isCompleted = newValue >= g.targetValue;
        
        if (isCompleted && !g.isCompleted) {
          const ach: Achievement = {
            id: `ach-${Date.now()}`,
            title: `Đạt mục tiêu: ${g.title}`,
            description: `Bạn đã hoàn thành "${g.title}" (${g.targetValue} ${g.unit || ''}) vào lúc ${new Date().toLocaleDateString('vi-VN')}`,
            unlockedAt: Date.now(),
            icon: 'Award'
          };
          setAchievements([ach, ...achievements]);
        }
        return { ...g, currentValue: newValue, isCompleted };
      }
      return g;
    });
    setGoals(updated);
  };

  const removeGoal = async (id: string) => {
    if (confirm("Chắc chắn xóa mục tiêu này?")) {
      setGoals(goals.filter(g => g.id !== id));
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
            <Target className="w-8 h-8 text-crimson" />
            Mục tiêu cá nhân
          </h2>
          <p className="hand-text text-xl">Dashboard theo dõi tiến độ & thành tựu</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="sketch-button bg-ink text-white py-3 px-6 text-sm font-black uppercase tracking-widest flex items-center gap-2"
        >
          {showAdd ? <X size={20} /> : <Plus size={20} />}
          {showAdd ? "Đóng" : "Mục tiêu mới"}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sketch-border bg-white p-6 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-ink/40 tracking-widest">Tên mục tiêu</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ví dụ: Đọc sách, Tập gym, Code app..."
                  className="w-full bg-paper/20 sketch-border-sm p-4 text-sm font-sans focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-ink/40 tracking-widest">Số lượng</label>
                  <input 
                    type="number" 
                    value={target}
                    onChange={e => setTarget(Number(e.target.value))}
                    className="w-full bg-paper/20 sketch-border-sm p-4 text-sm font-sans focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-ink/40 tracking-widest">Đơn vị</label>
                  <input 
                    type="text" 
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="trang, giờ..."
                    className="w-full bg-paper/20 sketch-border-sm p-4 text-sm font-sans focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-ink/40 tracking-widest">Deadline</label>
                  <input 
                    type="date" 
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full bg-paper/20 sketch-border-sm p-4 text-xs font-sans focus:outline-none h-[54px]"
                  />
                </div>
              </div>
            </div>
            <button 
              onClick={handleAddGoal}
              className="w-full sketch-button bg-crimson text-white py-4 font-black uppercase tracking-widest"
            >
              Thiết lập mục tiêu
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Active Goals */}
        <div className="md:col-span-2 space-y-6">
          <h3 className="text-xs font-black uppercase text-ink/40 tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Đang thực hiện
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {goals.filter(g => !g.isCompleted).length === 0 ? (
              <div className="text-center py-12 text-ink/20 italic">Chưa có mục tiêu nào đang chạy...</div>
            ) : (
              goals.filter(g => !g.isCompleted).map(goal => (
                <div key={goal.id} className="sketch-border bg-white p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-xl font-bold text-ink">{goal.title}</h4>
                      {goal.deadline && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-crimson">
                          <Calendar size={14} />
                          Hạn: {new Date(goal.deadline).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </div>
                    <button onClick={() => removeGoal(goal.id)} className="text-ink/20 hover:text-crimson"><Trash2 size={18} /></button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-black uppercase text-ink/40">
                      <span>Tiến độ: {Math.round((goal.currentValue / goal.targetValue) * 100)}%</span>
                      <span>{goal.currentValue}/{goal.targetValue} {goal.unit}</span>
                    </div>
                    <div className="h-2 bg-ink/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(goal.currentValue / goal.targetValue) * 100}%` }}
                        className="h-full bg-ink"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => incrementProgress(goal.id)}
                      className="sketch-button bg-paper py-2 px-4 text-[10px] font-black uppercase tracking-widest hover:bg-ink hover:text-white transition-all flex items-center gap-2"
                    >
                      <Plus size={14} /> Cập nhật +1
                    </button>
                    <button 
                       onClick={() => {
                         const val = prompt(`Nhập số lượng mới (hiện tại: ${goal.currentValue}):`, goal.currentValue.toString());
                         if (val !== null) {
                           const amount = Number(val) - goal.currentValue;
                           incrementProgress(goal.id, amount);
                         }
                       }}
                       className="sketch-button bg-paper py-2 px-4 text-[10px] font-black uppercase tracking-widest hover:bg-ink hover:text-white transition-all"
                    >
                       Tùy chỉnh
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Completed Goals */}
          {goals.some(g => g.isCompleted) && (
            <div className="space-y-4 pt-8">
              <h3 className="text-xs font-black uppercase text-ink/40 tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Đã hoàn thành
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.filter(g => g.isCompleted).map(goal => (
                  <div key={goal.id} className="sketch-border-sm bg-emerald-50/30 p-4 border-emerald-500/20">
                    <div className="flex justify-between">
                      <h4 className="text-sm font-bold text-emerald-900">{goal.title}</h4>
                      <CheckCircle2 className="text-emerald-500" size={16} />
                    </div>
                    <p className="text-[10px] text-emerald-700/60 mt-1">Hoàn thành: {goal.targetValue} {goal.unit}</p>
                    <button onClick={() => removeGoal(goal.id)} className="mt-2 text-[8px] font-black uppercase text-emerald-900/40 hover:text-crimson">Xóa</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Achievements Column */}
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase text-ink/40 tracking-widest flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" /> Thành tựu cá nhân
          </h3>
          <div className="space-y-4">
            {achievements.length === 0 ? (
              <div className="text-center py-12 text-ink/10 italic">Chưa có thành tựu nào.</div>
            ) : (
              achievements.map(ach => (
                <motion.div 
                  key={ach.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="sketch-border bg-yellow-50/50 p-4 space-y-2 border-yellow-200"
                >
                  <div className="flex gap-3">
                    <div className="p-2 bg-yellow-400 rounded-lg text-white shrink-0">
                      <Award size={16} />
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-[11px] font-black uppercase tracking-tight leading-tight">{ach.title}</h5>
                      <p className="text-[10px] text-ink/60 line-clamp-2">{ach.description}</p>
                      <span className="text-[8px] font-black text-ink/20 uppercase">
                        {new Date(ach.unlockedAt).toLocaleDateString('vi-VN')}
                      </span>
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
