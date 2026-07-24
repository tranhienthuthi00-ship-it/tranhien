import React, { useState } from 'react';
import { KanbanTask, KanbanSubtask } from '@/types';
import { Search, Plus, Edit2, X, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KanbanBoardProps {
  tasks: KanbanTask[];
  setTasks: (tasks: KanbanTask[] | ((prev: KanbanTask[]) => KanbanTask[])) => void;
  setActiveTab?: (tab: any) => void;
}

export function KanbanBoard({ tasks, setTasks, setActiveTab }: KanbanBoardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dueFilter, setDueFilter] = useState<string>("all");
  const [hashtagFilter, setHashtagFilter] = useState<string>("all");
  const [showTag, setShowTag] = useState(true);
  const [showPriority, setShowPriority] = useState(true);
  const [showCreated, setShowCreated] = useState(true);
  const [showMoney, setShowMoney] = useState(true);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [newTaskInput, setNewTaskInput] = useState("");
  const [newTaskTag, setNewTaskTag] = useState("Công việc");
  const [newTaskPriority, setNewTaskPriority] = useState("Trung bình");
  const [newTaskStatus, setNewTaskStatus] = useState<'todo'|'doing'|'done'|'cancel'>("todo");
  const [newTaskHashtags, setNewTaskHashtags] = useState<string[]>([]);
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>("");

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSubtasks, setEditingSubtasks] = useState<KanbanSubtask[]>([]);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDesc, setEditingDesc] = useState("");
  const [editingTag, setEditingTag] = useState("");
  const [editingPriority, setEditingPriority] = useState("Trung bình");
  const [editingStatus, setEditingStatus] = useState<'todo'|'doing'|'done'|'cancel'>("todo");
  const [editingHashtags, setEditingHashtags] = useState<string[]>([]);
  const [editingDueDate, setEditingDueDate] = useState<string>("");

  const [viewMode, setViewMode] = useState<'board' | 'calendar'>('board');
  const [calendarDate, setCalendarDate] = useState(new Date());

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
    if (priorityFilter !== 'all' && (t.priority || 'Trung bình') !== priorityFilter) return false;
    if (hashtagFilter !== 'all' && (!t.hashtags || !t.hashtags.includes(hashtagFilter))) return false;
    if (dueFilter === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      const hasToday = t.subtasks && t.subtasks.some(sub => sub.date === todayStr);
      if (!hasToday) return false;
    }
    return true;
  });

  const columns = [
    { id: 'todo', title: 'Cần làm (To Do)' },
    { id: 'doing', title: 'Đang làm (In Progress)' },
    { id: 'done', title: 'Hoàn thành (Done)' },
    { id: 'cancel', title: 'Đã hủy (Cancel)' }
  ] as const;

  const [availableHashtags, setAvailableHashtags] = useState<string[]>([
    '#quan_trong', '#khan_cap', '#khach_hang', '#bao_cao', '#team_work', '#ca_nhan', '#bug', '#feature'
  ]);
  const [customHashtagInput, setCustomHashtagInput] = useState("");

  const addCustomHashtag = (tagToAdd: string, target: 'new' | 'edit') => {
    if (!tagToAdd.trim()) return;
    let formatted = tagToAdd.trim();
    if (!formatted.startsWith('#')) {
      formatted = '#' + formatted;
    }
    if (!availableHashtags.includes(formatted)) {
      setAvailableHashtags(prev => [...prev, formatted]);
    }
    if (target === 'new') {
      if (!newTaskHashtags.includes(formatted)) {
        setNewTaskHashtags(prev => [...prev, formatted]);
      }
    } else {
      if (!editingHashtags.includes(formatted)) {
        setEditingHashtags(prev => [...prev, formatted]);
      }
    }
  };

  const [isHashtagDropdownOpen, setIsHashtagDropdownOpen] = useState(false);
  const [isNewTaskHashtagDropdownOpen, setIsNewTaskHashtagDropdownOpen] = useState(false);
  const [isEditHashtagDropdownOpen, setIsEditHashtagDropdownOpen] = useState(false);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('taskId', id);
  };

  const handleDrop = (e: React.DragEvent, status: 'todo'|'doing'|'done'|'cancel') => {
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
      priority: newTaskPriority,
      hashtags: newTaskHashtags,
      dueDate: newTaskDueDate || undefined,
      status: newTaskStatus,
      desc: 'Chưa có mô tả chi tiết.',
      subtasks: [{ date: new Date().toISOString().split('T')[0], text: 'Khởi tạo công việc', money: 0 }]
    };

    setTasks(prev => [...prev, newTask]);
    setNewTaskInput("");
    setNewTaskHashtags([]);
    setNewTaskDueDate("");
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
    setEditingPriority(task.priority || 'Trung bình');
    setEditingStatus(task.status);
    setEditingHashtags(task.hashtags || []);
    setEditingDueDate(task.dueDate || "");
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
          priority: editingPriority,
          status: editingStatus,
          hashtags: editingHashtags,
          dueDate: editingDueDate || undefined,
          subtasks: editingSubtasks.filter(s => s.text.trim() !== '')
        };
      }
      return t;
    }));
    setIsEditing(false);
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // 0 is Monday, 6 is Sunday
  };

  const changeMonth = (offset: number) => {
    setCalendarDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + offset);
      return newDate;
    });
  };

  const goToday = () => setCalendarDate(new Date());

  return (
    <div className="flex flex-col md:flex-row gap-6 font-['Plus_Jakarta_Sans'] pb-20 -mx-2 md:-mx-6 -mt-4 p-4 md:p-6 bg-[#f9f4e4] min-h-screen">
      
      {/* Sidebar */}
      <div className="hidden md:flex flex-col justify-between w-[260px] bg-[#141414] rounded-[20px] p-6 text-[#8E8E93] shrink-0 h-[calc(100vh-2rem)] sticky top-4">
        <div>
          <div className="text-[22px] font-bold text-white tracking-tight mb-8 pl-3">
            intelly
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-[#555] pl-3 mb-1.5 font-bold">General</span>
            <button className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left", viewMode === 'board' ? "bg-white/10 text-white" : "hover:bg-white/10 hover:text-white")} onClick={() => setViewMode('board')}>
              🏠 Dashboard
            </button>
            <button className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left", viewMode === 'calendar' ? "bg-white/10 text-white" : "hover:bg-white/10 hover:text-white")} onClick={() => setViewMode('calendar')}>
              🗓️ Calendar
            </button>
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/10 hover:text-white transition-colors text-left">
              📊 Reports
            </button>
          </div>
          <div className="flex flex-col gap-1.5 mt-6">
            <span className="text-[11px] uppercase tracking-wider text-[#555] pl-3 mb-1.5 font-bold">Tools</span>
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/10 hover:text-white transition-colors text-left">
              💬 Chats
            </button>
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/10 hover:text-white transition-colors text-left">
              ⚙️ Settings
            </button>
          </div>
        </div>
        <button 
          onClick={() => setActiveTab && setActiveTab('Journal')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-[#FF5A5F] hover:bg-white/5 transition-colors text-left mt-auto"
        >
          🚪 Log out
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4">
        <div className="flex items-center gap-3 flex-grow">
          <div className="w-[42px] h-[42px] rounded-full bg-[#f6b8db] flex items-center justify-center shrink-0 border-[2px] border-[#141414]">
            <Search size={18} className="text-[#141414]" strokeWidth={2.5} />
          </div>
          <div className="flex flex-wrap items-center border-[2px] border-[#141414] rounded-full px-3 py-1.5 gap-2 bg-white max-w-full">
            <div className="flex items-center gap-2 pl-1 pr-3 border-r-[2px] border-[#141414]">
              <Search size={15} className="text-[#666]" strokeWidth={2.5} />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="bg-transparent text-sm outline-none font-medium text-[#1A1A1A] w-[110px] sm:w-[150px]"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <span 
              className={cn("px-3.5 py-1.5 rounded-full cursor-pointer transition-colors font-semibold text-sm whitespace-nowrap", tagFilter === 'all' ? "bg-[#141414] text-white" : "bg-transparent text-[#666] hover:text-[#1A1A1A]")}
              onClick={() => setTagFilter('all')}
            >
              Tất cả
            </span>
            {tags.map(t => (
              <span 
                key={t}
                className={cn("px-3.5 py-1.5 rounded-full cursor-pointer transition-colors font-semibold text-sm whitespace-nowrap", tagFilter === t ? "bg-[#141414] text-white" : "bg-transparent text-[#666] hover:text-[#1A1A1A]")}
                onClick={() => setTagFilter(t)}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-3 relative z-50">
          <button 
            onClick={() => setViewMode(viewMode === 'board' ? 'calendar' : 'board')}
            className="w-[42px] h-[42px] rounded-full bg-[#141414] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform" 
            title="Chuyển chế độ xem"
          >
            {viewMode === 'board' ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-white fill-none stroke-[2.5px] stroke-linecap-round stroke-linejoin-round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-white fill-none stroke-[2.5px] stroke-linecap-round stroke-linejoin-round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            )}
          </button>
          <div className="relative">
            <button 
              onClick={() => {
                setIsFilterDropdownOpen(!isFilterDropdownOpen);
                setIsSettingsDropdownOpen(false);
                setIsHashtagDropdownOpen(false);
              }}
              className="w-[42px] h-[42px] rounded-full bg-[#141414] flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-white fill-none stroke-[2.5px] stroke-linecap-round stroke-linejoin-round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            </button>
            
            {isFilterDropdownOpen && (
              <div className="absolute right-0 top-[52px] w-[240px] bg-[#FDFBF7] border-[2px] border-[#141414] rounded-[20px] shadow-[6px_6px_0px_#141414] p-5 flex flex-col gap-5 z-[60]">
                {/* Priority filter */}
                <div className="flex flex-col gap-3">
                  <span className="text-[11px] font-black uppercase text-[#141414] tracking-wider">Mức độ ưu tiên</span>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="priority" checked={priorityFilter === 'all'} onChange={() => setPriorityFilter('all')} className="hidden" />
                    <div className="w-[18px] h-[18px] rounded-full border-[2px] border-[#141414] flex items-center justify-center shrink-0 bg-white group-hover:bg-blue-50 transition-colors">
                      {priorityFilter === 'all' && <div className="w-[10px] h-[10px] rounded-full bg-[#3B82F6]" />}
                    </div>
                    <span className="text-[15px] font-semibold text-[#1A1A1A]">Tất cả ưu tiên</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="priority" checked={priorityFilter === 'Cao'} onChange={() => setPriorityFilter('Cao')} className="hidden" />
                    <div className="w-[18px] h-[18px] rounded-full border-[2px] border-[#141414] flex items-center justify-center shrink-0 bg-white group-hover:bg-blue-50 transition-colors">
                      {priorityFilter === 'Cao' && <div className="w-[10px] h-[10px] rounded-full bg-[#3B82F6]" />}
                    </div>
                    <div className="w-5 h-5 rounded-full bg-[#FF5A5F] shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]" />
                    <span className="text-[15px] font-semibold text-[#1A1A1A]">Cao</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="priority" checked={priorityFilter === 'Trung bình'} onChange={() => setPriorityFilter('Trung bình')} className="hidden" />
                    <div className="w-[18px] h-[18px] rounded-full border-[2px] border-[#141414] flex items-center justify-center shrink-0 bg-white group-hover:bg-blue-50 transition-colors">
                      {priorityFilter === 'Trung bình' && <div className="w-[10px] h-[10px] rounded-full bg-[#3B82F6]" />}
                    </div>
                    <div className="w-5 h-5 rounded-full bg-[#FFD166] shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]" />
                    <span className="text-[15px] font-semibold text-[#1A1A1A]">Trung bình</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="priority" checked={priorityFilter === 'Thấp'} onChange={() => setPriorityFilter('Thấp')} className="hidden" />
                    <div className="w-[18px] h-[18px] rounded-full border-[2px] border-[#141414] flex items-center justify-center shrink-0 bg-white group-hover:bg-blue-50 transition-colors">
                      {priorityFilter === 'Thấp' && <div className="w-[10px] h-[10px] rounded-full bg-[#3B82F6]" />}
                    </div>
                    <div className="w-5 h-5 rounded-full bg-[#06D6A0] shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]" />
                    <span className="text-[15px] font-semibold text-[#1A1A1A]">Thấp</span>
                  </label>
                </div>
                
                {/* Due date filter */}
                <div className="flex flex-col gap-3 pt-1">
                  <span className="text-[11px] font-black uppercase text-[#141414] tracking-wider">Đến hạn</span>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="dueDate" checked={dueFilter === 'all'} onChange={() => setDueFilter('all')} className="hidden" />
                    <div className="w-[18px] h-[18px] rounded-full border-[2px] border-[#141414] flex items-center justify-center shrink-0 bg-white group-hover:bg-blue-50 transition-colors">
                      {dueFilter === 'all' && <div className="w-[10px] h-[10px] rounded-full bg-[#3B82F6]" />}
                    </div>
                    <span className="text-[15px] font-semibold text-[#1A1A1A]">Tất cả thời gian</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="dueDate" checked={dueFilter === 'today'} onChange={() => setDueFilter('today')} className="hidden" />
                    <div className="w-[18px] h-[18px] rounded-full border-[2px] border-[#141414] flex items-center justify-center shrink-0 bg-white group-hover:bg-blue-50 transition-colors">
                      {dueFilter === 'today' && <div className="w-[10px] h-[10px] rounded-full bg-[#3B82F6]" />}
                    </div>
                    <span className="text-[15px] font-semibold text-[#1A1A1A] flex items-center gap-2">
                      <Calendar size={16} className="text-[#8E8E93]" strokeWidth={2.5} />
                      Đến hạn hôm nay
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button 
              onClick={() => {
                setIsSettingsDropdownOpen(!isSettingsDropdownOpen);
                setIsFilterDropdownOpen(false);
              }}
              className="w-[42px] h-[42px] rounded-full bg-[#141414] flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-white fill-none stroke-[2px] stroke-linecap-round stroke-linejoin-round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
            {isSettingsDropdownOpen && (
              <div className="absolute right-0 top-[52px] w-[200px] bg-[#FDFBF7] border-[2px] border-[#141414] rounded-[20px] shadow-[6px_6px_0px_#141414] p-4 flex flex-col gap-3 z-[60]">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={showTag} onChange={() => setShowTag(!showTag)} className="hidden" />
                  <div className="w-5 h-5 rounded-[6px] border-[2px] border-[#141414] flex items-center justify-center shrink-0 bg-white group-hover:bg-blue-50 transition-colors">
                    {showTag && <div className="w-[10px] h-[10px] rounded-sm bg-[#3B82F6]" />}
                  </div>
                  <span className="text-[14px] font-semibold text-[#1A1A1A]">Hiện hashtag</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={showPriority} onChange={() => setShowPriority(!showPriority)} className="hidden" />
                  <div className="w-5 h-5 rounded-[6px] border-[2px] border-[#141414] flex items-center justify-center shrink-0 bg-white group-hover:bg-blue-50 transition-colors">
                    {showPriority && <div className="w-[10px] h-[10px] rounded-sm bg-[#3B82F6]" />}
                  </div>
                  <span className="text-[14px] font-semibold text-[#1A1A1A]">Hiện ưu tiên</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={showCreated} onChange={() => setShowCreated(!showCreated)} className="hidden" />
                  <div className="w-5 h-5 rounded-[6px] border-[2px] border-[#141414] flex items-center justify-center shrink-0 bg-white group-hover:bg-blue-50 transition-colors">
                    {showCreated && <div className="w-[10px] h-[10px] rounded-sm bg-[#3B82F6]" />}
                  </div>
                  <span className="text-[14px] font-semibold text-[#1A1A1A]">Hiện ngày</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={showMoney} onChange={() => setShowMoney(!showMoney)} className="hidden" />
                  <div className="w-5 h-5 rounded-[6px] border-[2px] border-[#141414] flex items-center justify-center shrink-0 bg-white group-hover:bg-blue-50 transition-colors">
                    {showMoney && <div className="w-[10px] h-[10px] rounded-sm bg-[#3B82F6]" />}
                  </div>
                  <span className="text-[14px] font-semibold text-[#1A1A1A]">Hiện tài chính</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <h1 className="text-[28px] font-bold text-[#1A1A1A] mt-2 mb-1">
        {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"}, Ms Tran Hien
      </h1>

      {viewMode === 'board' ? (
        <>
          <div className="bg-white p-3.5 rounded-[16px] border-[2px] border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-wrap gap-3 items-center">
        <input 
          type="text" 
          placeholder="Nhập tên công việc mới..." 
          className="border-[2px] border-[#141414] bg-white px-4 py-2.5 rounded-[12px] text-sm outline-none font-medium text-[#1A1A1A] grow min-w-[200px]"
          value={newTaskInput}
          onChange={e => setNewTaskInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
        />
        <select 
          className="border-[2px] border-[#141414] bg-white px-4 py-2.5 rounded-[12px] text-sm outline-none font-medium cursor-pointer min-w-[130px]"
          value={newTaskTag}
          onChange={e => setNewTaskTag(e.target.value)}
        >
          <option value="Công việc">💼 Công việc</option>
          <option value="Cá nhân">🎯 Cá nhân</option>
          <option value="Học tập">📚 Học tập</option>
        </select>
        <select 
          className="border-[2px] border-[#141414] bg-white px-4 py-2.5 rounded-[12px] text-sm outline-none font-medium cursor-pointer min-w-[130px]"
          value={newTaskPriority}
          onChange={e => setNewTaskPriority(e.target.value)}
        >
          <option value="Cao">🔴 Cao</option>
          <option value="Trung bình">🟡 Trung bình</option>
          <option value="Thấp">🟢 Thấp</option>
        </select>
        <select 
          className="border-[2px] border-[#141414] bg-white px-4 py-2.5 rounded-[12px] text-sm outline-none font-medium cursor-pointer min-w-[130px]"
          value={newTaskStatus}
          onChange={e => setNewTaskStatus(e.target.value as any)}
        >
          <option value="todo">Cần làm</option>
          <option value="doing">Đang làm</option>
          <option value="done">Hoàn thành</option>
          <option value="cancel">Đã hủy</option>
        </select>

        {/* Deadline picker */}
        <div className="flex items-center gap-1.5 border-[2px] border-[#141414] bg-white px-3 py-2 rounded-[12px]">
          <span className="text-xs font-bold text-[#555] whitespace-nowrap">⏰ Hạn:</span>
          <input 
            type="date"
            className="bg-transparent text-xs font-semibold outline-none text-[#1A1A1A] cursor-pointer"
            value={newTaskDueDate}
            onChange={e => setNewTaskDueDate(e.target.value)}
          />
        </div>

        {/* Custom Hashtags Dropdown */}
        <div className="relative">
          <button 
            type="button"
            className="border-[2px] border-[#141414] bg-white px-4 py-2.5 rounded-[12px] text-sm outline-none font-medium cursor-pointer min-w-[130px] flex justify-between items-center"
            onClick={() => setIsNewTaskHashtagDropdownOpen(!isNewTaskHashtagDropdownOpen)}
          >
            <span className="truncate max-w-[100px]">
              {newTaskHashtags.length > 0 ? newTaskHashtags.join(', ') : '# Hashtags'}
            </span>
            <span className="text-[10px] ml-2">▼</span>
          </button>
          
          {isNewTaskHashtagDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-[220px] bg-white border-[2px] border-[#141414] rounded-xl shadow-[4px_4px_0px_#141414] p-3 flex flex-col gap-2 z-[60] max-h-[260px] overflow-y-auto">
              <div className="flex gap-1 mb-1 pb-2 border-b border-[#141414]/10">
                <input 
                  type="text" 
                  placeholder="Tạo #hashtag mới..." 
                  className="border border-[#141414] bg-white px-2 py-1 rounded-md text-xs outline-none grow font-medium"
                  value={customHashtagInput}
                  onChange={e => setCustomHashtagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomHashtag(customHashtagInput, 'new');
                      setCustomHashtagInput('');
                    }
                  }}
                />
                <button 
                  type="button"
                  onClick={() => {
                    addCustomHashtag(customHashtagInput, 'new');
                    setCustomHashtagInput('');
                  }}
                  className="bg-[#141414] text-white px-2.5 py-1 rounded-md text-xs font-bold shrink-0 hover:bg-[#333]"
                >
                  +
                </button>
              </div>
              {availableHashtags.map(ht => (
                <label key={ht} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={newTaskHashtags.includes(ht)} 
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewTaskHashtags([...newTaskHashtags, ht]);
                      } else {
                        setNewTaskHashtags(newTaskHashtags.filter(h => h !== ht));
                      }
                    }}
                    className="hidden" 
                  />
                  <div className="w-4 h-4 rounded-sm border-2 border-[#141414] flex items-center justify-center bg-white group-hover:bg-blue-50 transition-colors shrink-0">
                    {newTaskHashtags.includes(ht) && <div className="w-2 h-2 rounded-sm bg-[#3B82F6]" />}
                  </div>
                  <span className="text-[13px] font-semibold text-[#1A1A1A]">{ht}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={addTask}
          className="bg-[#141414] text-white font-semibold text-sm px-8 py-2.5 rounded-[12px] hover:scale-[1.02] transition-transform whitespace-nowrap ml-1"
        >
          Thêm
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          return (
            <div 
              key={col.id} 
              className="flex flex-col gap-4 bg-[#EFECE6] p-3.5 rounded-[20px] min-h-[400px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="flex justify-between items-center px-1.5 font-bold text-[15px] uppercase tracking-wide text-[#1A1A1A]">
                <span>{col.title.replace(/\(.*\)/, '').trim()}</span>
                <span className="bg-[#141414] text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">{colTasks.length}</span>
              </div>
              <div className="flex flex-col gap-4 min-h-[200px]">
                {colTasks.map(task => {
                  const totalMoney = calculateTotalMoney(task.subtasks);
                  let bgColor = 'bg-white';
                  if (task.status === 'cancel') bgColor = 'bg-[#f4ebeb] opacity-85';
                  else if (task.status === 'done') bgColor = 'bg-[#ece7d7]';
                  else if (task.tag === 'Cá nhân') bgColor = 'bg-[#f6b8db]';
                  else if (task.tag === 'Học tập') bgColor = 'bg-[#b5caeb]';

                  return (
                    <div 
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => openModal(task.id)}
                      className={cn(
                        "border-[2px] border-[#141414] rounded-[16px] p-4 cursor-pointer relative shadow-[4px_4px_0px_#141414] transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_#141414] select-none flex flex-col min-h-[140px]",
                        bgColor
                      )}
                    >
                      <button 
                        onClick={(e) => deleteTask(e, task.id)}
                        className="absolute top-3.5 right-3.5 text-[#111] hover:text-red-600 transition-colors z-10 p-1 font-bold"
                      >
                        <X size={16} strokeWidth={2.5} />
                      </button>
                      
                      <div className="flex items-start justify-between gap-3 mb-2 pr-6">
                        <div className="font-extrabold text-[15px] text-[#111] leading-snug break-words">
                          {task.title}
                        </div>
                        {showPriority && (task.priority || 'Trung bình') && (
                          <span className={cn(
                            "text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 border-[2px] border-[#141414] mt-0.5 shadow-[1px_1px_0px_#141414]",
                            task.priority === 'Cao' ? "bg-[#FF5A5F] text-white" :
                            task.priority === 'Thấp' ? "bg-[#06D6A0] text-[#141414]" :
                            "bg-[#FFD166] text-[#141414]"
                          )}>
                            {task.priority || 'Trung bình'}
                          </span>
                        )}
                      </div>
                      
                      {task.desc && (
                        <div className="text-[13px] text-[#444] mb-3 line-clamp-2">
                          {task.desc}
                        </div>
                      )}
                      
                      {showMoney && totalMoney > 0 && (
                        <div className="text-sm font-bold italic text-[#1b7a3a] mb-2">
                          {formatMoney(totalMoney)}
                        </div>
                      )}

                      {task.dueDate && (
                        <div className="text-[11px] font-bold text-[#D9383A] bg-[#FFF0F0] border border-[#FFD0D0] px-2 py-0.5 rounded-md flex items-center gap-1 mb-2 w-fit">
                          ⏰ Hạn: {formatDateDDMM(task.dueDate)}/{extractYear(task.dueDate)}
                        </div>
                      )}
                      
                      {task.hashtags && task.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {task.hashtags.map(ht => (
                            <span key={ht} className="text-[10px] font-bold text-[#3B82F6] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md">
                              {ht}
                            </span>
                          ))}
                        </div>
                      )}

                      {(showTag || showCreated) && (
                        <div className="flex justify-between items-center text-xs font-semibold text-[#111] mt-auto border-t-2 border-dashed border-[#141414]/20 pt-3 gap-2 flex-wrap">
                          {showTag && (
                            <span className="bg-[#141414] text-white text-[11px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">{task.tag}</span>
                          )}
                          {showCreated && task.subtasks && task.subtasks.length > 0 && (
                            <span className="text-[11px] font-bold text-[#444] flex items-center gap-1.5 px-1.5 py-0.5">
                              📅 {formatDateDDMM(task.subtasks[0].date)}/{extractYear(task.subtasks[0].date)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
        </>
      ) : (
        <div className="flex flex-col flex-grow bg-white border-2 border-[#141414] rounded-2xl shadow-[4px_4px_0px_#141414] p-4 gap-3 min-h-[600px]">
          <div className="flex justify-between items-center flex-wrap gap-3 mb-2">
            <div className="font-extrabold text-lg text-[#141414]">
              Tháng {calendarDate.getMonth() + 1}, {calendarDate.getFullYear()}
            </div>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="bg-[#FAFAFA] border-2 border-[#141414] px-3 py-1.5 rounded-lg font-bold text-[13px] shadow-[2px_2px_0px_#141414] hover:bg-[#EFECE6]">
                &lt; Tháng trước
              </button>
              <button onClick={goToday} className="bg-[#FAFAFA] border-2 border-[#141414] px-3 py-1.5 rounded-lg font-bold text-[13px] shadow-[2px_2px_0px_#141414] hover:bg-[#EFECE6]">
                Hôm nay
              </button>
              <button onClick={() => changeMonth(1)} className="bg-[#FAFAFA] border-2 border-[#141414] px-3 py-1.5 rounded-lg font-bold text-[13px] shadow-[2px_2px_0px_#141414] hover:bg-[#EFECE6]">
                Tháng sau &gt;
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 text-center font-extrabold text-xs uppercase bg-[#EFECE6] py-2 rounded-lg border-2 border-[#141414]">
            <div>Thứ 2</div><div>Thứ 3</div><div>Thứ 4</div><div>Thứ 5</div><div>Thứ 6</div><div>Thứ 7</div><div>CN</div>
          </div>
          
          <div className="grid grid-cols-7 gap-1.5 flex-grow">
            {(() => {
              const year = calendarDate.getFullYear();
              const month = calendarDate.getMonth();
              const firstDay = getFirstDayOfMonth(year, month);
              const daysInMonth = getDaysInMonth(year, month);
              const prevMonthDays = getDaysInMonth(year, month - 1);
              
              const todayStr = new Date().toISOString().split('T')[0];
              
              const eventsMap: Record<string, {task: KanbanTask, sub: KanbanSubtask}[]> = {};
              tasks.forEach(task => {
                if (task.dueDate) {
                  if (!eventsMap[task.dueDate]) eventsMap[task.dueDate] = [];
                  eventsMap[task.dueDate].push({
                    task,
                    sub: { date: task.dueDate, text: `⏰ Deadline: ${task.title}`, money: 0 }
                  });
                }
                if (task.subtasks) {
                  task.subtasks.forEach(sub => {
                    if (sub.date) {
                      if (!eventsMap[sub.date]) eventsMap[sub.date] = [];
                      eventsMap[sub.date].push({ task, sub });
                    }
                  });
                }
              });

              const cells = [];
              
              for (let i = firstDay; i > 0; i--) {
                cells.push(
                  <div key={`prev-${i}`} className="bg-[#F0F0F0] opacity-40 border-2 border-[#141414] rounded-lg p-1.5 flex flex-col gap-1 min-h-[80px]">
                    <div className="text-[11px] font-extrabold text-[#141414] self-end bg-black/5 px-1.5 py-0.5 rounded-md">{prevMonthDays - i + 1}</div>
                  </div>
                );
              }
              
              for (let d = 1; d <= daysInMonth; d++) {
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const isToday = dateKey === todayStr;
                
                cells.push(
                  <div key={`curr-${d}`} className={cn(
                    "bg-[#FAFAFA] border-2 rounded-lg p-1.5 flex flex-col gap-1 min-h-[100px] overflow-hidden",
                    isToday ? "border-[#FF5A5F] bg-[#FFFDF5] border-[3px]" : "border-[#141414]"
                  )}>
                    <div className="text-[11px] font-extrabold text-[#141414] self-end bg-black/5 px-1.5 py-0.5 rounded-md">{d}</div>
                    <div className="flex flex-col gap-1 overflow-y-auto">
                      {eventsMap[dateKey]?.map((item, idx) => (
                        <div 
                          key={idx}
                          onClick={() => openModal(item.task.id)}
                          title={item.sub.text}
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded-md border-[1.5px] border-[#141414] cursor-pointer truncate shadow-[1px_1px_0px_#141414]",
                            item.task.tag === 'Cá nhân' ? "bg-[#f6b8db] text-[#141414]" :
                            item.task.tag === 'Học tập' ? "bg-[#b5caeb] text-[#141414]" :
                            "bg-white text-[#141414]"
                          )}
                        >
                          📌 {item.sub.text}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              
              const totalRendered = firstDay + daysInMonth;
              const remaining = totalRendered % 7 === 0 ? 0 : 7 - (totalRendered % 7);
              
              for (let i = 1; i <= remaining; i++) {
                cells.push(
                  <div key={`next-${i}`} className="bg-[#F0F0F0] opacity-40 border-2 border-[#141414] rounded-lg p-1.5 flex flex-col gap-1 min-h-[80px]">
                    <div className="text-[11px] font-extrabold text-[#141414] self-end bg-black/5 px-1.5 py-0.5 rounded-md">{i}</div>
                  </div>
                );
              }
              
              return cells;
            })()}
          </div>
        </div>
      )}

      {activeTask && (
        <div className="fixed inset-0 bg-[#141414]/60 backdrop-blur-sm flex justify-center items-center z-[1000] p-4" onClick={closeModal}>
          <div 
            className="w-full max-w-xl max-h-[90vh] border-[3px] border-[#141414] rounded-3xl shadow-[8px_8px_0px_#141414] overflow-hidden relative flex flex-col bg-white animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 pb-4 relative overflow-y-auto max-h-[60vh]">
              <div className="flex justify-between items-center mb-3">
                <div className="flex gap-2 items-center">
                  <span className="inline-block bg-[#141414] text-white border-2 border-[#141414] px-3 py-1 rounded-lg text-[11px] font-extrabold uppercase shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
                    {activeTask.tag}
                  </span>
                  {!isEditing && (activeTask.priority || 'Trung bình') && (
                    <span className={cn(
                      "inline-block border-2 border-[#141414] px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase shadow-[2px_2px_0px_rgba(0,0,0,0.2)]",
                      activeTask.priority === 'Cao' ? "bg-[#FF5A5F] text-white" :
                      activeTask.priority === 'Thấp' ? "bg-[#06D6A0] text-[#141414]" :
                      "bg-[#FFD166] text-[#141414]"
                    )}>
                      {activeTask.priority || 'Trung bình'}
                    </span>
                  )}
                </div>
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
                  
                  {activeTask.dueDate && (
                    <div className="text-xs font-bold text-[#D9383A] bg-[#FFF0F0] border border-[#FFD0D0] px-2.5 py-1 rounded-lg w-fit mb-3">
                      ⏰ Hạn chót: {formatDateDDMM(activeTask.dueDate)}/{extractYear(activeTask.dueDate)}
                    </div>
                  )}

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
                  <div>
                    <label className="text-[11px] font-extrabold uppercase text-[#444] block mb-1">Hạn chót (Deadline):</label>
                    <input 
                      type="date" 
                      className="w-full border-2 border-[#141414] bg-white px-3.5 py-2.5 rounded-xl text-[13px] font-semibold outline-none text-[#141414]"
                      value={editingDueDate}
                      onChange={e => setEditingDueDate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <div className="flex-1 min-w-[100px]">
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
                    <div className="flex-1 min-w-[100px]">
                      <label className="text-[11px] font-extrabold uppercase text-[#444] block mb-1">Ưu tiên:</label>
                      <select 
                        className="w-full border-2 border-[#141414] bg-white px-3.5 py-2.5 rounded-xl text-[13px] font-semibold outline-none text-[#141414] cursor-pointer"
                        value={editingPriority}
                        onChange={e => setEditingPriority(e.target.value)}
                      >
                        <option value="Cao">🔴 Cao</option>
                        <option value="Trung bình">🟡 Trung bình</option>
                        <option value="Thấp">🟢 Thấp</option>
                      </select>
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <label className="text-[11px] font-extrabold uppercase text-[#444] block mb-1">Trạng thái:</label>
                      <select 
                        className="w-full border-2 border-[#141414] bg-white px-3.5 py-2.5 rounded-xl text-[13px] font-semibold outline-none text-[#141414] cursor-pointer"
                        value={editingStatus}
                        onChange={e => setEditingStatus(e.target.value as any)}
                      >
                        <option value="todo">Cần làm</option>
                        <option value="doing">Đang làm</option>
                        <option value="done">Hoàn thành</option>
                        <option value="cancel">Đã hủy</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-1.5 relative">
                    <label className="text-[11px] font-extrabold uppercase text-[#444] block mb-1">Hashtags:</label>
                    <button 
                      type="button"
                      className="w-full border-2 border-[#141414] bg-white px-3.5 py-2.5 rounded-xl text-[13px] font-semibold outline-none text-[#141414] cursor-pointer text-left flex justify-between items-center"
                      onClick={() => setIsEditHashtagDropdownOpen(!isEditHashtagDropdownOpen)}
                    >
                      <span className="truncate">
                        {editingHashtags.length > 0 ? editingHashtags.join(', ') : 'Thêm hashtag'}
                      </span>
                      <span className="text-[10px] ml-2">▼</span>
                    </button>
                    {isEditHashtagDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-full bg-white border-[2px] border-[#141414] rounded-xl shadow-[4px_4px_0px_#141414] p-3 flex flex-col gap-2 z-[60] max-h-[220px] overflow-y-auto">
                        <div className="flex gap-1 mb-1 pb-2 border-b border-[#141414]/10">
                          <input 
                            type="text" 
                            placeholder="Tạo #hashtag mới..." 
                            className="border border-[#141414] bg-white px-2 py-1 rounded-md text-xs outline-none grow font-medium"
                            value={customHashtagInput}
                            onChange={e => setCustomHashtagInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomHashtag(customHashtagInput, 'edit');
                                setCustomHashtagInput('');
                              }
                            }}
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              addCustomHashtag(customHashtagInput, 'edit');
                              setCustomHashtagInput('');
                            }}
                            className="bg-[#141414] text-white px-2.5 py-1 rounded-md text-xs font-bold shrink-0 hover:bg-[#333]"
                          >
                            +
                          </button>
                        </div>
                        {availableHashtags.map(ht => (
                          <label key={ht} className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              checked={editingHashtags.includes(ht)} 
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditingHashtags([...editingHashtags, ht]);
                                } else {
                                  setEditingHashtags(editingHashtags.filter(h => h !== ht));
                                }
                              }}
                              className="hidden" 
                            />
                            <div className="w-4 h-4 rounded-sm border-2 border-[#141414] flex items-center justify-center bg-white group-hover:bg-blue-50 transition-colors shrink-0">
                              {editingHashtags.includes(ht) && <div className="w-2 h-2 rounded-sm bg-[#3B82F6]" />}
                            </div>
                            <span className="text-[13px] font-semibold text-[#1A1A1A]">{ht}</span>
                          </label>
                        ))}
                      </div>
                    )}
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
              (!isEditing && activeTask.status === 'cancel') ? "bg-[#f4ebeb]" :
              (!isEditing && activeTask.status === 'done') ? "bg-[#ece7d7]" : 
              (!isEditing && activeTask.tag === 'Cá nhân') ? "bg-[#f6b8db]" : 
              (!isEditing && activeTask.tag === 'Học tập') ? "bg-[#b5caeb]" : "bg-white"
            )}>
              {!isEditing ? (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#333]">Status</span>
                  <span className="text-[15px] font-extrabold text-[#141414]">
                    {activeTask.status === 'todo' ? 'Cần làm' : activeTask.status === 'doing' ? 'Đang làm' : activeTask.status === 'done' ? 'Hoàn thành' : 'Đã hủy'}
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
    </div>
  );
}
