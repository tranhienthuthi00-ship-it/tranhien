import fs from 'fs';
const path = './src/components/DigitalJournal.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add task filter state
code = code.replace(/const activeTasks = useMemo/g, `
  const [taskFilter, setTaskFilter] = useState<string>("All");
  
  const activeTasks = useMemo`);

// Restructure layout
code = code.replace(/<div className="bg-gradient-to-tr from-\[\#fff9f0\]/g, `
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2 border-b-2 border-ink/5">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-gradient-to-tr from-[#fff9f0]`);

code = code.replace(/<\/div>\n\n      \{\/\* 2\. MAIN HUB GRID: CALENDAR \& TASKS \*\/\}\n      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2 border-b-2 border-ink\/5">\n        \n        \{\/\* INTERACTIVE MINI-CALENDAR GRID \(6 Cols\) \*\/\}\n        <div className="lg:col-span-6 space-y-4">/g, `</div>\n\n          {/* GOALS & WHAT'S THE NEXT THING TO DO (8 Cols) MOVED HERE */}
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
                  className="px-2 py-1 bg-ink/5 border border-ink/10 rounded-lg text-xs font-bold font-sans text-ink outline-none"
                >
                  <option value="All">Lọc Tất Cả</option>
                  <option value="Priority:High">🔴 Quan trọng cao</option>
                  <option value="Priority:Medium">🟡 Trung bình</option>
                  <option value="Priority:Low">⚪ Thấp</option>
                  {goals.map(g => <option key={g.id} value={"Goal:" + g.id}>🎯 {g.title}</option>)}
                </select>
                <button onClick={() => setShowAddTask(!showAddTask)} className="p-1 hover:bg-ink hover:text-paper rounded border border-ink/20 shrink-0">
                  <Plus size={14} className={showAddTask ? "rotate-45" : ""} />
                </button>
              </div>
            </div>
            
            {/* ... form logic ... */}
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
                        <span className={\`text-[8px] font-black uppercase px-2 py-0.5 rounded border \${priorityStyles} font-mono shrink-0\`}>
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
`);

code = code.replace(/\{\/\* GOALS \& WHAT'S THE NEXT THING TO DO \(7 Cols\) \*\/\}/g, "{/* REMOVED PREVIOUS TASKS */} {/*");
code = code.replace(/<div className="lg:col-span-6 space-y-4">\n          <div className="bg-white\/90 p-5 rounded-2xl sketch-border/g, " <div className=\"hidden bg-white/90 p-5 rounded-2xl sketch-border");

code = code.replace(/             \{ \/\* 3\. ACHIEMENT WALL/g, "             </div> </div> { /* 3. ACHIEMENT WALL");


fs.writeFileSync(path, code);
console.log("Updated DigitalJournal");
