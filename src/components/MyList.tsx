import React, { useState } from "react";
import { Check, Plus, Trash2, Heart, HeartPulse } from "lucide-react";
import type { Task, WishlistItem } from "@/types";
import { cn } from "@/lib/utils";

export function MyList({
  tasks,
  setTasks,
  wishlist,
  setWishlist,
}: {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  wishlist: WishlistItem[];
  setWishlist: (list: WishlistItem[]) => void;
}) {
  const [newTask, setNewTask] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [taskSortBy, setTaskSortBy] = useState<'Default' | 'Priority'>('Default');

  const [newWish, setNewWish] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newNecessity, setNewNecessity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [sortBy, setSortBy] = useState<'Date' | 'Necessity' | 'Price'>('Date');
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewNecessity, setReviewNecessity] = useState<'Low' | 'Medium' | 'High'>('Medium');

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([{ id: Date.now().toString(), content: newTask, completed: false, priority: newTaskPriority }, ...tasks]);
    setNewTask("");
    setNewTaskPriority("Medium");
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (taskSortBy === 'Priority') {
      const weight = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return weight[b.priority] - weight[a.priority];
    }
    return 0; // Default order (last added first)
  });

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const addWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWish.trim()) return;
    setWishlist([{ 
      id: Date.now().toString(), 
      content: newWish, 
      addedDate: new Date().toISOString(),
      price: newPrice ? parseFloat(newPrice) : undefined,
      necessity: newNecessity
    }, ...wishlist]);
    setNewWish("");
    setNewPrice("");
    setNewNecessity("Medium");
  };

  const sortedWishlist = [...wishlist].sort((a, b) => {
    if (sortBy === 'Date') {
      return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
    } else if (sortBy === 'Price') {
      return (b.price || 0) - (a.price || 0);
    } else if (sortBy === 'Necessity') {
      const weight = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return weight[b.necessity] - weight[a.necessity];
    }
    return 0;
  });

  const removeWish = (id: string) => {
    setWishlist(wishlist.filter(w => w.id !== id));
  };

  const addWishlistReview = (id: string) => {
    if (!reviewNote.trim()) return;
    setWishlist(wishlist.map(w => {
      if (w.id === id) {
        return {
          ...w,
          necessity: reviewNecessity,
          history: [
            ...(w.history || []),
            {
              date: new Date().toISOString(),
              necessity: reviewNecessity,
              note: reviewNote
            }
          ]
        };
      }
      return w;
    }));
    setActiveReviewId(null);
    setReviewNote("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-4 md:p-6 max-w-5xl mx-auto">
      {/* CHECKLIST */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-2xl font-bold font-sans">Todo</h2>
          <div className="flex-1 border-b-2 border-ink border-dashed"></div>
        </div>

        <form onSubmit={addTask} className="flex flex-col gap-2 mb-4">
          <div className="flex gap-2">
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="What needs doing?"
              className="sketch-input flex-1 bg-white/50 py-1.5"
              required
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-1 items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mr-1">Priority:</span>
              {(['Low', 'Medium', 'High'] as const).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setNewTaskPriority(level)}
                  className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-colors", newTaskPriority === level ? "bg-ink text-paper border-ink" : "border-ink/20 text-ink/60 hover:bg-ink/5")}
                >
                  {level}
                </button>
              ))}
            </div>
            <button type="submit" className="sketch-button sketch-button-primary px-3 py-1 text-xs bg-ink text-paper">
              <Plus size={12} className="fill-current inline mr-1" /> Add
            </button>
          </div>
        </form>

        <div className="flex justify-between items-center mb-2 text-[10px] font-sans font-bold uppercase tracking-widest text-ink/50 border-b border-ink/10 pb-1.5">
          <span>Sort By</span>
          <div className="flex gap-3">
            <button onClick={() => setTaskSortBy('Default')} className={cn("transition-colors", taskSortBy === 'Default' ? 'text-crimson' : 'hover:text-ink')}>Date</button>
            <button onClick={() => setTaskSortBy('Priority')} className={cn("transition-colors", taskSortBy === 'Priority' ? 'text-crimson' : 'hover:text-ink')}>Priority</button>
          </div>
        </div>

        <ul className="text-sm space-y-2 font-sans border-t border-transparent">
          {sortedTasks.map(task => (
            <li key={task.id} className={cn(
              "flex items-center group relative py-3 px-4 sketch-border transition-all",
              task.completed ? "opacity-50 border-ink/10" : task.priority === 'High' ? "bg-crimson/5 border-crimson" : "bg-white/50 border-ink/10 hover:border-ink/30"
            )}>
              <button
                onClick={() => toggleTask(task.id)}
                className={cn(
                  "w-4 h-4 border border-ink mr-4 flex-shrink-0 transition-colors shadow-sm cursor-pointer",
                  task.completed ? "bg-crimson border-crimson" : "bg-white"
                )}
              />
              <div className="flex-1 flex flex-col justify-center">
                <span className={cn("font-medium text-base transition-all", task.completed ? "text-ink/40" : "", task.priority === 'High' && !task.completed ? "text-crimson" : "")}>
                  {task.content}
                  {task.completed && (
                    <svg className="absolute left-10 right-0 w-[calc(100%-2.5rem)] h-[12px] top-1/2 -translate-y-1/2 pointer-events-none" preserveAspectRatio="none">
                      <path
                        d="M 0 6 Q 50 2 100 6"
                        stroke="var(--color-ink)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="none"
                        className="strike-through-path"
                        vectorEffect="non-scaling-stroke"
                        opacity="0.4"
                      />
                    </svg>
                  )}
                </span>
                <div className="flex justify-between items-end mt-1">
                  <span className={cn(
                    "text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border",
                    task.completed ? "border-ink/10 text-ink/40 bg-transparent" :
                    task.priority === 'High' ? "border-crimson text-crimson bg-white" : 
                    task.priority === 'Medium' ? "border-orange-400 text-orange-600 bg-white" : "border-ink/20 text-ink/40 bg-white"
                  )}>
                    {task.priority} Priority
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-ink/40 hover:text-crimson ml-4 transition-opacity absolute -top-3 -right-3 bg-paper border-2 border-ink rounded-full p-1 hover:bg-crimson hover:border-crimson hover:text-white shadow-sm"
              >
                <Trash2 size={12} />
              </button>
            </li>
          ))}
          {sortedTasks.length === 0 && <p className="hand-text text-xl text-center py-4 opacity-50">All clear. Good job!</p>}
        </ul>
      </section>

      {/* WISHLIST */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-2xl font-bold font-sans">Waitlist / Wishlist</h2>
          <div className="flex-1 border-b-2 border-ink border-dashed"></div>
        </div>

        <form onSubmit={addWish} className="flex flex-col gap-2 mb-4">
          <div className="flex gap-2">
            <input
              value={newWish}
              onChange={(e) => setNewWish(e.target.value)}
              placeholder="Add to wishlist..."
              className="sketch-input flex-1 bg-white/50 py-1.5"
              required
            />
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="VNĐ"
              className="sketch-input w-24 bg-white/50 font-mono text-xs py-1.5"
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-1 items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mr-1">Need:</span>
              {(['Low', 'Medium', 'High'] as const).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setNewNecessity(level)}
                  className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-colors", newNecessity === level ? "bg-ink text-paper border-ink" : "border-ink/20 text-ink/60 hover:bg-ink/5")}
                >
                  {level}
                </button>
              ))}
            </div>
            <button type="submit" className="sketch-button flex items-center gap-1 px-3 py-1 text-xs bg-crimson/5 border-crimson text-crimson hover:bg-crimson hover:text-white">
              <Heart size={12} className="fill-current" /> Add
            </button>
          </div>
        </form>

        <div className="flex justify-between items-center mb-2 text-[10px] font-sans font-bold uppercase tracking-widest text-ink/50 border-b border-ink/10 pb-1.5">
          <span>Sort By</span>
          <div className="flex gap-3">
            <button onClick={() => setSortBy('Date')} className={cn("transition-colors", sortBy === 'Date' ? 'text-crimson' : 'hover:text-ink')}>Date</button>
            <button onClick={() => setSortBy('Necessity')} className={cn("transition-colors", sortBy === 'Necessity' ? 'text-crimson' : 'hover:text-ink')}>Necessity</button>
            <button onClick={() => setSortBy('Price')} className={cn("transition-colors", sortBy === 'Price' ? 'text-crimson' : 'hover:text-ink')}>Price</button>
          </div>
        </div>

        <div className="space-y-2 text-sm font-sans border-t border-transparent">
          {sortedWishlist.map(wish => (
            <div key={wish.id} className={cn(
              "flex flex-col py-2 px-3 sketch-border transition-all relative group",
              wish.necessity === 'High' ? "bg-crimson/5 border-crimson" : "bg-white/50 border-ink/10 hover:border-ink/30"
            )}>
               <div className="flex justify-between items-start">
                  <span className={cn("font-bold text-base pr-8", wish.necessity === 'High' && "text-crimson")}>{wish.content}</span>
                  {wish.price !== undefined && <span className="font-mono font-medium text-ink/60 bg-white px-1.5 py-0.5 border border-ink/10 rounded">{wish.price.toLocaleString()} VNĐ</span>}
               </div>
               
               <div className="flex justify-between items-end mt-2">
                 <span className={cn(
                   "text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border",
                   wish.necessity === 'High' ? "border-crimson text-crimson bg-white" : 
                   wish.necessity === 'Medium' ? "border-orange-400 text-orange-600 bg-white" : "border-ink/20 text-ink/40 bg-white"
                 )}>
                   {wish.necessity} Need
                 </span>
                 <span className="text-xs opacity-40">{new Date(wish.addedDate).toLocaleDateString()}</span>
               </div>
               
               {wish.history && wish.history.length > 0 && (
                 <div className="mt-4 space-y-2 border-t border-ink/10 pt-3">
                   {wish.history.map((entry, idx) => (
                     <div key={idx} className="flex gap-2 items-start text-xs">
                       <span className={cn("px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase", 
                          entry.necessity === 'High' ? "border-crimson text-crimson bg-crimson/5" :
                          entry.necessity === 'Medium' ? "border-orange-400 text-orange-600 bg-orange-400/5" :
                          "border-ink/20 text-ink/50 bg-ink/5"
                       )}>{entry.necessity}</span>
                       <span className="opacity-50 min-w-16">{new Date(entry.date).toLocaleDateString()}</span>
                       <span className="font-hand italic text-ink/80 flex-1">{entry.note}</span>
                     </div>
                   ))}
                 </div>
               )}

               {activeReviewId !== wish.id && (
                 <button 
                   onClick={() => {
                     setActiveReviewId(wish.id);
                     setReviewNecessity(wish.necessity);
                     setReviewNote("");
                   }}
                   className="mt-3 text-[11px] font-bold text-ink/40 hover:text-ink text-left w-max transition-colors"
                 >
                   + Add Review
                 </button>
               )}

               {activeReviewId === wish.id && (
                 <div className="mt-3 bg-white/60 p-3 rounded border border-ink/20 border-dashed">
                    <textarea 
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Đánh giá mức độ cần thiết hôm nay..."
                      className="sketch-input bg-white w-full min-h-[50px] resize-y text-xs mb-2 p-1.5 rounded"
                      rows={2}
                    />
                    <div className="flex justify-between items-center">
                       <div className="flex gap-1 items-center">
                         {(['Low', 'Medium', 'High'] as const).map(level => (
                           <button
                             key={level}
                             type="button"
                             onClick={() => setReviewNecessity(level)}
                             className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-colors", reviewNecessity === level ? "bg-ink text-paper border-ink" : "border-ink/20 text-ink/60 hover:bg-ink/5")}
                           >
                             {level}
                           </button>
                         ))}
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => setActiveReviewId(null)} className="text-[11px] text-ink/60 hover:text-ink font-bold px-2">Hủy</button>
                          <button onClick={() => addWishlistReview(wish.id)} className="text-[11px] sketch-button sketch-button-primary bg-ink text-paper px-3 py-1 flex items-center gap-1">Lưu</button>
                       </div>
                    </div>
                 </div>
               )}
               
               <button 
                  onClick={() => removeWish(wish.id)}
                  className="absolute -top-3 -right-3 bg-paper text-ink/40 opacity-0 group-hover:opacity-100 transition-opacity border-2 border-ink rounded-full p-1 hover:bg-crimson hover:border-crimson hover:text-white shadow-sm"
                >
                  <Trash2 size={12} />
               </button>
            </div>
          ))}
          {wishlist.length === 0 && <p className="hand-text text-xl text-center py-4 opacity-50">Keep it intentional.</p>}
        </div>
      </section>
    </div>
  );
}
