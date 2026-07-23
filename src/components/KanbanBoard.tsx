import React, { useState } from 'react';
import { KanbanTask, KanbanSubtask } from '@/types';
import { Search, Plus, Edit2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KanbanBoardProps {
  tasks: KanbanTask[];
  setTasks: (tasks: KanbanTask[] | ((prev: KanbanTask[]) => KanbanTask[])) => void;
}

export function KanbanBoard({ tasks, setTasks }: KanbanBoardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [newTaskInput, setNewTaskInput] = useState("");
  const [newTaskTag, setNewTaskTag] = useState("Công việc");
  const [newTaskStatus, setNewTaskStatus] = useState<'todo'|'doing'|'done'>("todo");

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSubtasks, setEditingSubtasks] = useState<KanbanSubtask[]>([]);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDesc, setEditingDesc] = useState("");
  const [editingTag, setEditingTag] = useState("");
  const [editingStatus, setEditingStatus] = useState<'todo'|'doing'|'done'>("todo");

  const tags = ["Công việc", "Cá nhân", "Học tập"];

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' đ';
  };

  const calculateTotalMoney = (subtasks: KanbanSubtask[] = []) => {
    return subtasks.reduce((sum, sub) => sum + (Number(sub.money) || 0), 0);
  };

  const formatDateDDMM = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  const extractYear = (dateStr: string) => {
    if (!dateStr) return new Date().getFullYear().toString();
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return parts[0];
    }
    return new Date().getFullYear().toString();
  };

  const filteredTasks = tasks.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (tagFilter !== 'all' && t.tag !== tagFilter) return false;
    return true;
  });

  const columns = [
    { id: 'todo', title: 'Cần làm (To Do)' },
    { id: 'doing', title: 'Đang làm (In Progress)' },
    { id: 'done', title: 'Hoàn thành (Done)' }
  ] as const;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('taskId', id);
  };

  const handleDrop = (e: React.DragEvent, status: 'todo'|'doing'|'done') => {
    e.preventDefault();
    const id = e.dataTransfer.getData('taskId');
    if (id) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const addTask = () => {
    if (!newTaskInput.trim()) return;
    
    const newTask: KanbanTask = {
      id: Date.now().toString(),
      title: newTaskInput.trim(),
      tag: newTaskTag,
      status: newTaskStatus,
      desc: 'Chưa có mô tả chi tiết.',
      subtasks: [{ date: new Date().toISOString().split('T')[0], text: 'Khởi tạo công việc', money: 0 }]
    };

    setTasks(prev => [...prev, newTask]);
    setNewTaskInput("");
  };

  const deleteTask = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== id));
    if (activeTaskId === id) closeModal();
  };

  const openModal = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    setActiveTaskId(id);
    setIsEditing(false);
  };

  const closeModal = () => {
    setActiveTaskId(null);
    setIsEditing(false);
  };

  const startEdit = () => {
    const task = tasks.find(t => t.id === activeTaskId);
    if (!task) return;
    setIsEditing(true);
    setEditingTitle(task.title);
    setEditingDesc(task.desc || "");
    setEditingTag(task.tag);
    setEditingStatus(task.status);
    setEditingSubtasks(JSON.parse(JSON.stringify(task.subtasks || [])));
  };

  const saveEdit = () => {
    if (!editingTitle.trim()) return;
    setTasks(prev => prev.map(t => {
      if (t.id === activeTaskId) {
        return {
          ...t,
          title: editingTitle.trim(),
          desc: editingDesc.trim(),
          tag: editingTag,
          status: editingStatus,
          subtasks: editingSubtasks.filter(s => s.text.trim() !== '')
        };
      }
      return t;
    }));
    setIsEditing(false);
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <div className="flex flex-col gap-6 font-['Plus_Jakarta_Sans'] pb-20">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3 flex-grow">
          <div className="w-10 h-10 rounded-full bg-[#f6b8db] flex items-center justify-center shadow-[0_4px_10px_rgba(246,184,219,0.4)] shrink-0">
            <Search size={18} className="text-[#141414]" strokeWidth={2.5} />
          </div>
          <div className="flex flex-wrap md:flex-nowrap items-center border-2 border-[#141414] rounded-full px-4 py-1.5 gap-3 bg-transparent w-full max-w-2xl">
            <input 
              type="text" 
              placeholder="Search..." 
              className="border-none bg-transparent outline-none text-sm grow text-[#1A1A1A] min-w-[100px]"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <div className="flex items-center gap-1.5 md:border-l border-[#D1CCD5] md:pl-3 text-xs text-[#8E8E93] overflow-x-auto whitespace-nowrap">
              <span className="font-semibold px-2">In:</span>
              <span 
                className={cn("px-2.5 py-1 rounded-full cursor-pointer transition-colors", tagFilter === 'all' ? "bg-[#141414] text-white font-medium" : "bg-[#EFECE6] text-[#444] hover:bg-[#141414] hover:text-white")}
                onClick={() => setTagFilter('all')}
              >
                All
              </span>
              {tags.map(t => (
                <span 
                  key={t}
                  className={cn("px-2.5 py-1 rounded-full cursor-pointer transition-colors", tagFilter === t ? "bg-[#141414] text-white font-medium" : "bg-[#EFECE6] text-[#444] hover:bg-[#141414] hover:text-white")}
                  onClick={() => setTagFilter(t)}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border-2 border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-wrap gap-3 items-center">
        <input 
          type="text" 
          placeholder="Nhập tên công việc mới..." 
          className="border-2 border-[#141414] bg-[#FAFAFA] px-3.5 py-2 rounded-xl text-sm outline-none font-medium text-[#1A1A1A] grow min-w-[180px]"
          value={newTaskInput}
          onChange={e => setNewTaskInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
        />
        <select 
          className="border-2 border-[#141414] bg-[#FAFAFA] px-3.5 py-2 rounded-xl text-sm outline-none font-medium cursor-pointer min-w-[120px]"
          value={newTaskTag}
          onChange={e => setNewTaskTag(e.target.value)}
        >
          <option value="Công việc">💼 Công việc</option>
          <option value="Cá nhân">🎯 Cá nhân</option>
          <option value="Học tập">📚 Học tập</option>
        </select>
        <select 
          className="border-2 border-[#141414] bg-[#FAFAFA] px-3.5 py-2 rounded-xl text-sm outline-none font-medium cursor-pointer min-w-[120px]"
          value={newTaskStatus}
          onChange={e => setNewTaskStatus(e.target.value as any)}
        >
          <option value="todo">Cần làm</option>
          <option value="doing">Đang làm</option>
          <option value="done">Hoàn thành</option>
        </select>
        <button 
          onClick={addTask}
          className="bg-[#141414] text-white font-semibold text-sm px-5 py-2 rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_#141414] transition-all whitespace-nowrap"
        >
          Thêm
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          return (
            <div 
              key={col.id} 
              className="flex flex-col gap-3.5 bg-black/5 p-3 rounded-2xl min-h-[400px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="flex justify-between items-center px-1 font-extrabold text-[15px] uppercase tracking-wide text-[#1A1A1A]">
                <span>{col.title}</span>
                <span className="bg-[#141414] text-white px-2 py-0.5 rounded-lg text-xs">{colTasks.length}</span>
              </div>
              <div className="flex flex-col gap-3.5 min-h-[200px]">
                {colTasks.map(task => {
                  const totalMoney = calculateTotalMoney(task.subtasks);
                  let bgColor = 'bg-white';
                  if (task.status === 'done') bgColor = 'bg-[#ece7d7]';
                  else if (task.tag === 'Cá nhân') bgColor = 'bg-[#f6b8db]';
                  else if (task.tag === 'Học tập') bgColor = 'bg-[#b5caeb]';

                  return (
                    <div 
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => openModal(task.id)}
                      className={cn(
                        "border-2 border-[#141414] rounded-2xl p-4 cursor-pointer relative shadow-[4px_4px_0px_#141414] transition-transform hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0px_#141414] select-none",
                        bgColor
                      )}
                    >
                      <button 
                        onClick={(e) => deleteTask(e, task.id)}
                        className="absolute top-3 right-3 text-[#111] hover:text-red-600 transition-colors z-10 p-1 font-bold"
                      >
                        <X size={16} />
                      </button>
                      
                      <div className="font-bold text-sm text-[#111] pr-5 leading-tight break-words mb-2">
                        {task.title}
                      </div>
                      
                      {task.desc && (
                        <div className="text-xs text-[#444] mb-2 line-clamp-2">
                          {task.desc}
                        </div>
                      )}
                      
                      {totalMoney > 0 && (
                        <div className="text-xs font-bold italic text-[#1b7a3a] mb-2">
                          {formatMoney(totalMoney)}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center text-xs font-semibold text-[#111] mt-3 border-t-2 border-dashed border-[#141414]/20 pt-2">
                        <span className="bg-[#141414] text-white text-[11px] px-2 py-0.5 rounded-md font-bold">{task.tag}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {activeTask && (
        <div className="fixed inset-0 bg-[#141414]/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4" onClick={closeModal}>
          <div 
            className="w-full max-w-xl max-h-[90vh] border-[3px] border-[#141414] rounded-3xl shadow-[8px_8px_0px_#141414] overflow-hidden relative flex flex-col bg-white animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 pb-4 relative overflow-y-auto max-h-[60vh]">
              <div className="flex justify-between items-center mb-3">
                <span className="inline-block bg-[#141414] text-white border-2 border-[#141414] px-3 py-1 rounded-lg text-[11px] font-extrabold uppercase shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
                  {activeTask.tag}
                </span>
                {!isEditing && (
                  <button onClick={startEdit} className="bg-[#141414] text-white w-8 h-8 rounded-full flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,0.3)] hover:scale-110 transition-transform">
                    <Edit2 size={14} />
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div>
                  <div className="text-xl font-extrabold text-[#141414] leading-snug mb-3 tracking-tight break-words">
                    {activeTask.title}
                  </div>
                  <div className="text-[11px] font-extrabold uppercase mb-1.5 text-[#444]">Mô tả chi tiết:</div>
                  <div className="text-[13px] text-[#333] leading-relaxed bg-[#FAFAFA] border-2 border-[#141414] p-3 rounded-xl max-h-[100px] overflow-y-auto mb-3.5 break-words">
                    {activeTask.desc || 'Không có mô tả.'}
                  </div>

                  {activeTask.subtasks && activeTask.subtasks.length > 0 && (
                    <div className="mt-4">
                      <div className="text-[11px] font-extrabold uppercase text-[#444] mb-3 tracking-wide">Timeline & Số tiền:</div>
                      <div className="relative pl-5 ml-1 flex flex-col gap-4 before:content-[''] before:absolute before:top-1.5 before:bottom-1.5 before:left-[5px] before:w-[2px] before:bg-[#141414]">
                        {(() => {
                          const groupedByYear: Record<string, KanbanSubtask[]> = {};
                          activeTask.subtasks.forEach(sub => {
                            const year = extractYear(sub.date);
                            if (!groupedByYear[year]) groupedByYear[year] = [];
                            groupedByYear[year].push(sub);
                          });
                          const sortedYears = Object.keys(groupedByYear).sort();
                          
                          return sortedYears.map(year => (
                            <div key={year} className="flex flex-col gap-2.5">
                              <div className="self-start bg-[#141414] text-white text-xs font-extrabold px-2.5 py-1 rounded-lg -ml-5 border-2 border-[#141414] shadow-[2px_2px_0px_rgba(0,0,0,0.2)] tracking-wide">
                                {year}
                              </div>
                              {groupedByYear[year].map((sub, idx) => (
                                <div key={idx} className="relative flex items-center justify-between bg-[#FAFAFA] border-2 border-[#141414] p-2.5 rounded-xl shadow-[2px_2px_0px_#141414] gap-3 before:content-[''] before:absolute before:-left-5 before:top-1/2 before:-translate-y-1/2 before:w-2.5 before:h-2.5 before:bg-[#141414] before:rounded-full before:border-2 before:border-white">
                                  <div className="flex items-center gap-2.5 grow min-w-0">
                                    <span className="bg-[#EFECE6] border-[1.5px] border-[#141414] px-1.5 py-0.5 rounded-md text-[11px] font-extrabold text-[#141414] shrink-0">
                                      {formatDateDDMM(sub.date)}
                                    </span>
                                    <div className="text-[13px] font-bold text-[#141414] break-words">{sub.text}</div>
                                  </div>
                                  {Number(sub.money) > 0 && (
                                    <div className="text-xs font-bold italic text-[#1b7a3a] shrink-0">{formatMoney(sub.money)}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3 mt-1">
                  <div>
                    <label className="text-[11px] font-extrabold uppercase text-[#444] block mb-1">Tiêu đề:</label>
                    <input 
                      type="text" 
                      className="w-full border-2 border-[#141414] bg-white px-3.5 py-2.5 rounded-xl text-[13px] font-semibold outline-none text-[#141414]"
                      value={editingTitle}
                      onChange={e => setEditingTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold uppercase text-[#444] block mb-1">Mô tả:</label>
                    <textarea 
                      className="w-full border-2 border-[#141414] bg-white px-3.5 py-2.5 rounded-xl text-[13px] font-semibold outline-none text-[#141414] resize-y h-[70px]"
                      value={editingDesc}
                      onChange={e => setEditingDesc(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <div className="flex-1 min-w-[130px]">
                      <label className="text-[11px] font-extrabold uppercase text-[#444] block mb-1">Tag:</label>
                      <select 
                        className="w-full border-2 border-[#141414] bg-white px-3.5 py-2.5 rounded-xl text-[13px] font-semibold outline-none text-[#141414] cursor-pointer"
                        value={editingTag}
                        onChange={e => setEditingTag(e.target.value)}
                      >
                        <option value="Công việc">💼 Công việc</option>
                        <option value="Cá nhân">🎯 Cá nhân</option>
                        <option value="Học tập">📚 Học tập</option>
                      </select>
                    </div>
                    <div className="flex-1 min-w-[130px]">
                      <label className="text-[11px] font-extrabold uppercase text-[#444] block mb-1">Trạng thái:</label>
                      <select 
                        className="w-full border-2 border-[#141414] bg-white px-3.5 py-2.5 rounded-xl text-[13px] font-semibold outline-none text-[#141414] cursor-pointer"
                        value={editingStatus}
                        onChange={e => setEditingStatus(e.target.value as any)}
                      >
                        <option value="todo">Cần làm</option>
                        <option value="doing">Đang làm</option>
                        <option value="done">Hoàn thành</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-[#444] block mb-2">Timeline & Số tiền:</label>
                    <div className="flex flex-col gap-2">
                      {editingSubtasks.map((sub, idx) => (
                        <div key={idx} className="flex flex-wrap items-center gap-1.5">
                          <input 
                            type="date" 
                            className="w-[125px] border-2 border-[#141414] bg-white p-2 rounded-lg text-[11px] font-bold outline-none"
                            value={sub.date}
                            onChange={e => {
                              const newSubs = [...editingSubtasks];
                              newSubs[idx].date = e.target.value;
                              setEditingSubtasks(newSubs);
                            }}
                          />
                          <input 
                            type="text" 
                            placeholder="Nội dung..."
                            className="grow min-w-[120px] border-2 border-[#141414] bg-white px-2.5 py-2 rounded-lg text-xs font-semibold outline-none"
                            value={sub.text}
                            onChange={e => {
                              const newSubs = [...editingSubtasks];
                              newSubs[idx].text = e.target.value;
                              setEditingSubtasks(newSubs);
                            }}
                          />
                          <input 
                            type="number" 
                            placeholder="Số tiền..."
                            className="w-[100px] border-2 border-[#141414] bg-white px-2.5 py-2 rounded-lg text-xs font-bold outline-none text-[#1b7a3a]"
                            value={sub.money}
                            onChange={e => {
                              const newSubs = [...editingSubtasks];
                              newSubs[idx].money = Number(e.target.value);
                              setEditingSubtasks(newSubs);
                            }}
                          />
                          <button 
                            type="button" 
                            onClick={() => {
                              const newSubs = [...editingSubtasks];
                              newSubs.splice(idx, 1);
                              setEditingSubtasks(newSubs);
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-[#FF5A5F] hover:bg-[#E02424] text-white border-2 border-[#141414] rounded-lg font-bold shrink-0 shadow-[2px_2px_0px_#141414]"
                          >
                            <X size={14} strokeWidth={3} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setEditingSubtasks([...editingSubtasks, { date: new Date().toISOString().split('T')[0], text: '', money: 0 }]);
                      }}
                      className="w-full mt-2 bg-[#EFECE6] hover:bg-[#E5E0D5] border-2 border-dashed border-[#141414] text-[#141414] p-2 rounded-lg text-xs font-extrabold text-center transition-colors"
                    >
                      + Thêm mốc timeline
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative h-0 border-t-[3px] border-dashed border-[#141414] mx-2.5 shrink-0 before:content-[''] before:absolute before:-top-3.5 before:-left-6 before:w-6 before:h-6 before:bg-[#141414]/60 before:border-[3px] before:border-[#141414] before:rounded-full after:content-[''] after:absolute after:-top-3.5 after:-right-6 after:w-6 after:h-6 after:bg-[#141414]/60 after:border-[3px] after:border-[#141414] after:rounded-full"></div>
            
            <div className={cn(
              "p-5 flex flex-wrap justify-between items-center gap-3 shrink-0 transition-colors",
              (!isEditing && activeTask.status === 'done') ? "bg-[#ece7d7]" : 
              (!isEditing && activeTask.tag === 'Cá nhân') ? "bg-[#f6b8db]" : 
              (!isEditing && activeTask.tag === 'Học tập') ? "bg-[#b5caeb]" : "bg-white"
            )}>
              {!isEditing ? (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#333]">Status</span>
                  <span className="text-[15px] font-extrabold text-[#141414]">
                    {activeTask.status === 'todo' ? 'Cần làm' : activeTask.status === 'doing' ? 'Đang làm' : 'Hoàn thành'}
                  </span>
                </div>
              ) : <div></div>}
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} className="bg-white text-[#141414] border-2 border-[#141414] px-4 py-2 rounded-full font-bold shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:-translate-y-px hover:-translate-x-px text-[13px]">
                      Hủy
                    </button>
                    <button onClick={saveEdit} className="bg-[#141414] text-white border-2 border-[#141414] px-4 py-2 rounded-full font-bold shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:-translate-y-px hover:-translate-x-px text-[13px]">
                      Lưu thay đổi
                    </button>
                  </>
                ) : (
                  <button onClick={closeModal} className="bg-[#141414] text-white border-2 border-[#141414] px-4 py-2 rounded-full font-bold shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:-translate-y-px hover:-translate-x-px text-[13px]">
                    Đóng vé
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
