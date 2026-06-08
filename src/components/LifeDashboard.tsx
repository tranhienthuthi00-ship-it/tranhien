import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Heart,
  CheckSquare,
  Calendar,
  Compass,
  Clock,
  Zap,
  Plus,
  Smile,
  ClipboardList,
  Trash2,
  Edit2,
  Check,
  ChevronDown,
  PlusCircle,
  Activity,
  Award,
  Coffee,
  Sun,
  Moon,
  Save,
  CheckCircle2,
  X,
  FileText,
  RotateCcw,
  CheckCircle,
  Brain,
  Video,
  Shirt,
  Scissors
} from "lucide-react";

interface SummaryItem {
  id: string;
  text: string;
  icon: string;
  value: string;
  type: "blue" | "gray" | "green" | "rose";
}

interface Timeblock {
  id: string;
  time: string;
  activity: string;
  category: "routine" | "creative" | "finance" | "wellness" | "leisure";
}

interface TodoItem {
  id: string;
  text: string;
  category: "home" | "social" | "personal" | "work";
  priority: "high" | "medium" | "low";
  date: string;
  checked: boolean;
}

interface PlannerTask {
  id: string;
  text: string;
  icon: string;
}

interface PlannerDay {
  id: string;
  day: string;
  date: string;
  priority: string;
  tasks: PlannerTask[];
}

interface OutfitSlot {
  label: string; // top, pants, shoes, accessory
  name: string;
  img: string;
}

interface OutfitCard {
  id: string;
  day: string;
  mood: string;
  items: OutfitSlot[];
  note: string;
}

interface CleaningTask {
  id: string;
  name: string;
  cycle: "Hàng ngày" | "Hàng tuần" | "Hàng tháng";
  completed: boolean;
  assignedTo: string;
}

interface WatchlistItem {
  id: string;
  title: string;
  type: "Movie" | "Series" | "Anime" | "Study Course";
  platform: "Netflix" | "YouTube" | "Coursera" | "Disney+" | "Other";
  progress: string; // e.g., "Ep 2/12"
  rating: number;
}

export function LifeDashboard() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("life_dashboard_theme") === "dark";
  });

  // Active sub-tabs
  const [todoTab, setTodoTab] = useState<"Today" | "Overdue" | "This week" | "Calendar" | "Table">("Today");
  const [plannerTab, setPlannerTab] = useState<"Weekly plan" | "Monthly plan">("Weekly plan");
  const [lifestyleTab, setLifestyleTab] = useState<"Daily cleaning" | "Weekly outfits" | "Watchlist calendar">("Weekly outfits");

  // Dynamic user data
  const [userName, setUserName] = useState<string>(() => localStorage.getItem("ld_username") || "Hien");
  const [welcomeMessage, setWelcomeMessage] = useState<string>(
    () => localStorage.getItem("ld_welcome_msg") || "Chào mừng quay trở lại góc nhỏ sáng tạo! Nơi lưu giữ gọn gàng thói quen, phong cách thời trang và định hướng phát triển bản thân."
  );

  // States with localStorage persistence
  const [summaryItems, setSummaryItems] = useState<SummaryItem[]>(() => {
    const cached = localStorage.getItem("ld_summary_items");
    return cached ? JSON.parse(cached) : [
      { id: "s1", text: "To-Do List", icon: "check-circle", value: "85%", type: "blue" },
      { id: "s2", text: "Planner Goals", icon: "compass", value: "3 of 5", type: "blue" },
      { id: "s3", text: "Healthy Lifestyle", icon: "activity", value: "100%", type: "green" },
      { id: "s4", text: "Daily Cleaning", icon: "sparkles", value: "Sạch Sẽ", type: "gray" }
    ];
  });

  const [timeblocks, setTimeblocks] = useState<Timeblock[]>(() => {
    const cached = localStorage.getItem("ld_timeblocks");
    return cached ? JSON.parse(cached) : [
      { id: "tb1", time: "05:00 AM", activity: "Routine sáng + Viết Nhật ký", category: "routine" },
      { id: "tb2", time: "07:00 AM", activity: "Luyện phát âm Tiếng Anh (Youtube Dictation)", category: "routine" },
      { id: "tb3", time: "08:30 AM", activity: "Nghiên cứu dự án & Thiết kế UI/UX", category: "creative" },
      { id: "tb4", time: "11:30 AM", activity: "Nấu ăn + Xem phim chữa lành", category: "leisure" },
      { id: "tb5", time: "01:30 PM", activity: "Ôn tập Flashcards từ vựng CEFR C1", category: "routine" },
      { id: "tb6", time: "02:30 PM", activity: "Đi dạo phố, chụp hình & uống cafe", category: "leisure" },
      { id: "tb7", time: "04:00 PM", activity: "Học lập trình UI động React", category: "creative" }
    ];
  });

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const cached = localStorage.getItem("ld_todos");
    return cached ? JSON.parse(cached) : [
      { id: "t1", text: "Xây dựng sườn bài thuyết trình tranh Tiếng Anh dã ngoại", category: "work", priority: "high", date: "2026-06-08", checked: false },
      { id: "t2", text: "Ghi âm phát âm 10 từ vựng CEFR Level C1", category: "personal", priority: "high", date: "2026-06-08", checked: true },
      { id: "t3", text: "Chụp ảnh style dạo phố đăng Nhật ký (Aesthetic Photo)", category: "social", priority: "low", date: "2026-06-09", checked: false },
      { id: "t4", text: "Dọn dẹp bàn trang điểm & sắp xếp khay cài tóc retro", category: "home", priority: "low", date: "2026-06-08", checked: false },
      { id: "t5", text: "Cân đối báo cáo thu nhập danh mục Vốn ròng cá nhân", category: "work", priority: "high", date: "2026-06-08", checked: false }
    ];
  });

  const [plannerDays, setPlannerDays] = useState<PlannerDay[]>(() => {
    const cached = localStorage.getItem("ld_planner_days");
    return cached ? JSON.parse(cached) : [
      {
        id: "pd1",
        day: "Thứ Hai",
        date: "08/06",
        priority: "Focus: English dictation practice",
        tasks: [
          { id: "pdt1", text: "Hoàn thành 1 bài YouTube Dictation 10 phút", icon: "check-circle" },
          { id: "pdt2", text: "Cập nhật chi phí đi ăn uống với gia đình", icon: "dollar-sign" },
          { id: "pdt3", text: "Tập thiền chánh niệm trước ngủ", icon: "activity" }
        ]
      },
      {
        id: "pd2",
        day: "Thứ Ba",
        date: "09/06",
        priority: "Focus: Creative UI layout review",
        tasks: [
          { id: "pdt4", text: "Vẽ nháp wireframe sổ tay bằng tay", icon: "feather" },
          { id: "pdt5", text: "Học 20 từ vựng SRS mới", icon: "brain" },
          { id: "pdt6", text: "Gọi điện hỏi thăm người thân", icon: "message-circle" }
        ]
      },
      {
        id: "pd3",
        day: "Thứ Tư",
        date: "10/06",
        priority: "Focus: Self reflection and study",
        tasks: [
          { id: "pdt7", text: "Viết Nhật ký suy ngẫm tuần qua", icon: "book-open" },
          { id: "pdt8", text: "Review lại biểu đồ thói quen tháng", icon: "pie-chart" },
          { id: "pdt9", text: "Kiểm tra số dư tiết kiệm & ví", icon: "wallet" }
        ]
      }
    ];
  });

  const [outfitCards, setOutfitCards] = useState<OutfitCard[]>(() => {
    const cached = localStorage.getItem("ld_outfit_cards");
    return cached ? JSON.parse(cached) : [
      {
        id: "o1",
        day: "Monday Style",
        mood: "Cozy Minimalist",
        items: [
          { label: "Top", name: "Beige Knit Sweater", img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=300" },
          { label: "Pants", name: "Straight White Jeans", img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=300" },
          { label: "Shoes", name: "Retro Cream Sneakers", img: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=300" },
          { label: "Clips", name: "Amber Tortoise Claw", img: "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?auto=format&fit=crop&q=80&w=300" }
        ],
        note: "Bộ đồ ấm áp lý tưởng cho quán cà phê sáng thứ hai lạnh nhẹ."
      },
      {
        id: "o2",
        day: "Tuesday Vibe",
        mood: "Classic Workday",
        items: [
          { label: "Blazer", name: "Charcoal Structured Blazer", img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=300" },
          { label: "Midi Skirt", name: "Pleated Beige Skirt", img: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&q=80&w=300" },
          { label: "Boots", name: "Black Ankle Leather Boots", img: "https://images.unsplash.com/photo-1621996346565-e3bb69182a59?auto=format&fit=crop&q=80&w=300" },
          { label: "Bag", name: "Classic Tote Bag", img: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=300" }
        ],
        note: "Chuyên nghiệp nhưng vẫn vô cùng thanh lịch và có phong vị cổ điển."
      },
      {
        id: "o3",
        day: "Wednesday Vibe",
        mood: "Coffee Date",
        items: [
          { label: "Cardigan", name: "Oversized Pastel Cardigan", img: "https://images.unsplash.com/photo-1574164904299-3a102b110380?auto=format&fit=crop&q=80&w=300" },
          { label: "Bottoms", name: "High-Waist Washed Denim", img: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=300" },
          { label: "Loafers", name: "Leather Penny Loafers", img: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&q=80&w=300" },
          { label: "Hair Pin", name: "Minimal Pearl Hair Pin", img: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=300" }
        ],
        note: "Phong cách Parisian chic nhẹ nhàng, dạo bước thoải mái ở phố sách."
      }
    ];
  });

  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>(() => {
    const cached = localStorage.getItem("ld_cleaning_tasks");
    return cached ? JSON.parse(cached) : [
      { id: "c1", name: "Hút bụi thảm trải phòng ngủ", cycle: "Hàng ngày", completed: true, assignedTo: "Hien" },
      { id: "c2", name: "Vệ sinh bồn rửa & kệ trang điểm", cycle: "Hàng ngày", completed: false, assignedTo: "Hien" },
      { id: "c3", name: "Giặt chăn ga, gối decor và rèm voan", cycle: "Hàng tuần", completed: false, assignedTo: "Hien" },
      { id: "c4", name: "Dọn dẹp lại tủ kẹp tóc & kẹp càng cua", cycle: "Hàng tuần", completed: true, assignedTo: "Hien" }
    ];
  });

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    const cached = localStorage.getItem("ld_watchlist");
    return cached ? JSON.parse(cached) : [
      { id: "w1", title: "Gilmore Girls", type: "Series", platform: "Netflix", progress: "Season 3 Ep 4", rating: 5 },
      { id: "w2", title: "Aesthetic Interior Design Mastery", type: "Study Course", platform: "YouTube", progress: "Lớp 3/10", rating: 4 },
      { id: "w3", title: "Flipped (Trái tim cuối đầu)", type: "Movie", platform: "Netflix", progress: "Đã xong", rating: 5 },
      { id: "w4", title: "CEFR C1 Speaking Strategy Guide", type: "Study Course", platform: "YouTube", progress: "Chưa xem", rating: 5 }
    ];
  });

  // UI States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Modals / Interactivity
  const [navDropdown, setNavDropdown] = useState<string | null>(null);
  const [editingWelcome, setEditingWelcome] = useState<boolean>(false);
  const [editingSummaryId, setEditingSummaryId] = useState<string | null>(null);
  const [addingTodo, setAddingTodo] = useState<boolean>(false);
  const [addingSummary, setAddingSummary] = useState<boolean>(false);
  
  // Custom outfits curation modal
  const [outfitEditTarget, setOutfitEditTarget] = useState<{ cardId: string; slotIdx: number } | null>(null);

  // Todo Form Data
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoCategory, setNewTodoCategory] = useState<"home" | "social" | "personal" | "work">("personal");
  const [newTodoPriority, setNewTodoPriority] = useState<"high" | "medium" | "low">("medium");
  const [newTodoDate, setNewTodoDate] = useState("2026-06-08");

  // Summary Form Data
  const [newSumText, setNewSumText] = useState("");
  const [newSumVal, setNewSumVal] = useState("");
  const [newSumType, setNewSumType] = useState<"blue" | "gray" | "green" | "rose">("blue");

  // Auto caching
  useEffect(() => {
    localStorage.setItem("ld_summary_items", JSON.stringify(summaryItems));
  }, [summaryItems]);

  useEffect(() => {
    localStorage.setItem("ld_timeblocks", JSON.stringify(timeblocks));
  }, [timeblocks]);

  useEffect(() => {
    localStorage.setItem("ld_todos", JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem("ld_planner_days", JSON.stringify(plannerDays));
  }, [plannerDays]);

  useEffect(() => {
    localStorage.setItem("ld_outfit_cards", JSON.stringify(outfitCards));
  }, [outfitCards]);

  useEffect(() => {
    localStorage.setItem("ld_cleaning_tasks", JSON.stringify(cleaningTasks));
  }, [cleaningTasks]);

  useEffect(() => {
    localStorage.setItem("ld_watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem("ld_username", userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem("ld_welcome_msg", welcomeMessage);
  }, [welcomeMessage]);

  useEffect(() => {
    localStorage.setItem("life_dashboard_theme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Handle live ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Show functional toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
    showToast(`Đã chuyển sang Chế độ ${!isDarkMode ? "Tối" : "Sáng"} cực đẹp!`);
  };

  // Live calculation for time blocks
  const activeTimeblockIdx = useMemo(() => {
    const hour = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    
    // Simple mock heuristic matching mock times
    if (hour >= 5 && hour < 7) return 0; // 05:00 AM
    if (hour >= 7 && hour < 8.5) return 1; // 07:00 AM
    if (hour >= 8.5 && hour < 11.5) return 2; // 08:30 AM
    if (hour >= 11.5 && hour < 13.5) return 3; // 11:30 AM
    if (hour >= 13.5 && hour < 14.5) return 4; // 01:30 PM
    if (hour >= 14.5 && hour < 16) return 5; // 02:30 PM
    if (hour >= 16) return 6; // 04:00 PM
    return -1;
  }, [currentTime]);

  // Filter Tasks based on Select Tag Tab
  const listToRender = useMemo(() => {
    if (todoTab === "Today") {
      return todos.filter(t => t.date === "2026-06-08");
    }
    if (todoTab === "Overdue") {
      return todos.filter(t => t.date < "2026-06-08" && !t.checked);
    }
    if (todoTab === "This week") {
      // Basic match for active mock calendar dates close to 08
      return todos.filter(t => t.date >= "2026-06-01" && t.date <= "2026-06-15");
    }
    return todos; // Table or Calendar displays all
  }, [todos, todoTab]);

  const toggleTodoState = (id: string) => {
    setTodos(prev => prev.map(t => {
      if (t.id === id) {
        const nextState = !t.checked;
        showToast(nextState ? `Wow! Đã hoàn thành nhiệm vụ 🎉` : `Đã chuyển nhiệm vụ về trạng thái bận`);
        return { ...t, checked: nextState };
      }
      return t;
    }));
  };

  const deleteTodoItem = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    showToast("Đã xóa nhiệm vụ thành công");
  };

  const handleCreateTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    
    const newTodo: TodoItem = {
      id: "t_" + Date.now(),
      text: newTodoText,
      category: newTodoCategory,
      priority: newTodoPriority,
      date: newTodoDate,
      checked: false
    };

    setTodos(prev => [newTodo, ...prev]);
    setNewTodoText("");
    setAddingTodo(false);
    showToast("Đã thêm nhiệm vụ mới vào To-Do List!");
  };

  const handleCreateSummary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSumText.trim()) return;

    const newItem: SummaryItem = {
      id: "s_" + Date.now(),
      text: newSumText,
      icon: "bookmark",
      value: newSumVal || "New",
      type: newSumType
    };

    setSummaryItems(prev => [...prev, newItem]);
    setNewSumText("");
    setNewSumVal("");
    setAddingSummary(false);
    showToast("Đã tạo mục danh mục tổng kết mới!");
  };

  const deleteSummaryItem = (id: string) => {
    setSummaryItems(prev => prev.filter(s => s.id !== id));
    showToast("Đã xóa danh mục tổng kết");
  };

  const handleAddNewTaskToDay = (dayId: string) => {
    const text = prompt("Nhập nhiệm vụ mới cho ngày hôm nay:");
    if (!text || !text.trim()) return;

    setPlannerDays(prev => prev.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          tasks: [
            ...day.tasks,
            { id: "pt_" + Date.now(), text: text.trim(), icon: "star" }
          ]
        };
      }
      return day;
    }));
    showToast("Đã thêm kế hoạch tuần cho hoạt động ngày!");
  };

  const handleRemoveTaskFromDay = (dayId: string, taskId: string) => {
    setPlannerDays(prev => prev.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          tasks: day.tasks.filter(t => t.id !== taskId)
        };
      }
      return day;
    }));
    showToast("Đã xóa một nhiệm vụ khỏi ngày!");
  };

  const dayTaskTickHeuristic = (dayId: string, taskId: string) => {
    setPlannerDays(prev => prev.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          tasks: day.map ? day.tasks : day.tasks.map(t => {
            if (t.id === taskId) {
              const currentIcon = t.icon === "check" ? "circle" : "check";
              return { ...t, icon: currentIcon };
            }
            return t;
          })
        };
      }
      return day;
    }));
  };

  const handleEditPlannerPriority = (dayId: string) => {
    const current = plannerDays.find(d => d.id === dayId);
    const newPriority = prompt("Cập nhật tiêu điểm / mục tiêu quan trọng (Focus Priority):", current?.priority);
    if (newPriority !== null) {
      setPlannerDays(prev => prev.map(d => d.id === dayId ? { ...d, priority: newPriority.trim() || "No Focus" } : d));
      showToast("Đã lưu mục tiêu tiêu điểm ngày thành công!");
    }
  };

  const handleAddNewDay = () => {
    const dayName = prompt("Nhập tên ngày mới (VD: Thứ Năm, Thứ Sáu):");
    if (!dayName) return;
    const dayDate = prompt("Nhập ngày tháng định dạng dd/mm (VD: 11/06):") || "";
    const priority = prompt("Mục tiêu trọng tâm ngày này:") || "Tiêu điểm cá nhân";

    const newDay: PlannerDay = {
      id: "pd_" + Date.now(),
      day: dayName,
      date: dayDate,
      priority: priority,
      tasks: [
        { id: "pdt_init", text: "Thêm ghi nhớ thói quen", icon: "activity" }
      ]
    };

    setPlannerDays(prev => [...prev, newDay]);
    showToast(`Đã bổ sung ngày ${dayName} vào kế hoạch tuần!`);
  };

  const resetPlannerWeek = () => {
    if (window.confirm("Bạn có chắc chắn muốn làm mới toàn bộ kế hoạch tuần này không?")) {
      setPlannerDays([
        {
          id: "pd_m",
          day: "Thứ Hai",
          date: "08/06",
          priority: "Focus: English dictation practice",
          tasks: [{ id: "pd_mt1", text: "Hoàn thành 1 bài YouTube Dictation 10 phút", icon: "check-circle" }]
        },
        {
          id: "pd_t",
          day: "Thứ Ba",
          date: "09/06",
          priority: "Focus: Creative UI layout review",
          tasks: [{ id: "pd_tt1", text: "Thiết kế nháp wireframe sổ tay bằng tay", icon: "feather" }]
        }
      ]);
      showToast("Đã khởi tạo tuần kế hoạch phong cách tối giản siêu mới!");
    }
  };

  // Outfit Wardrobe Styling Feature
  const handleOutfitSlotClick = (cardId: string, slotIdx: number) => {
    setOutfitEditTarget({ cardId, slotIdx });
  };

  const saveOutfitSlotDetails = (name: string, url: string) => {
    if (!outfitEditTarget) return;
    const { cardId, slotIdx } = outfitEditTarget;

    setOutfitCards(prev => prev.map(c => {
      if (c.id === cardId) {
        const nextItems = [...c.items];
        nextItems[slotIdx] = {
          ...nextItems[slotIdx],
          name: name.trim() || "Phụ kiện độc đáo",
          img: url.trim() || "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?auto=format&fit=crop&q=80&w=300"
        };
        return { ...c, items: nextItems };
      }
      return c;
    }));

    setOutfitEditTarget(null);
    showToast("Phối đồ phong cách hoàn tất! Bộ trang phục đã được lưu.");
  };

  const handleEditOutfitMoodAndNote = (cardId: string) => {
    const card = outfitCards.find(c => c.id === cardId);
    if (!card) return;

    const nextMood = prompt("Chỉnh sửa tâm trạng thời trang (Mood Vibe):", card.mood);
    const nextNote = prompt("Ghi chú thiết kế hoặc cách phối đồ cụ thể hơn:", card.note);

    setOutfitCards(prev => prev.map(c => {
      if (c.id === cardId) {
        return {
          ...c,
          mood: nextMood ? nextMood.trim() : c.mood,
          note: nextNote ? nextNote.trim() : c.note
        };
      }
      return c;
    }));
    showToast("Đã lưu ghi chú cho outfit thành công!");
  };

  // Navigation Items Dynamic Modal info
  const renderNavDropdown = () => {
    if (!navDropdown) return null;

    let title = "";
    let content: React.ReactNode = null;

    if (navDropdown === "Productivity") {
      title = "🚀 Mẹo tối ưu hóa năng suất (Productivity)";
      content = (
        <div className="space-y-2">
          <p className="text-zinc-600 dark:text-zinc-400">Áp dụng các thói quen thông minh để quản lý thời gian cực hiệu quả:</p>
          <ul className="list-disc pl-4 space-y-1.5 text-zinc-500 dark:text-zinc-400">
            <li><strong>Pomodoro 25/5:</strong> Tập trung hoàn toàn rồi tự thưởng 5 phút dạo bộ thư giãn.</li>
            <li><strong>Time Blocking:</strong> Điền chính xác hoạt động vào các khung giờ vàng trong ngày.</li>
            <li><strong>Nhật ký CEFR Level C1:</strong> Tạo phản xạ tự nhiên khi tích hợp luyện nói trong lịch làm việc.</li>
          </ul>
        </div>
      );
    } else if (navDropdown === "Finance") {
      title = "💰 Quản lý Tài chính Thông minh (Finance)";
      content = (
        <div className="space-y-2">
          <p className="text-zinc-600 dark:text-zinc-400">Cân đối ví tiền tiện dụng với báo cáo thực tế từ ảnh chụp:</p>
          <ul className="list-disc pl-4 space-y-1.5 text-zinc-500 dark:text-zinc-400">
            <li><strong>Quỹ Tiết kiệm:</strong> Mục tiêu lưu trữ 35% trên tổng mức dòng thu nhập hàng tháng.</li>
            <li><strong>Chi tiêu hạn mức:</strong> Tránh chi vượt ngân sách bằng quản lý thẻ Visa ghi nợ tự động trong ứng dụng.</li>
            <li>Thống kê tuần này: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">+18.400.000 đ</span> thặng dư.</li>
          </ul>
        </div>
      );
    } else if (navDropdown === "Health") {
      title = "🤍 Sức khỏe & Chữa lành (Health & Wellness)";
      content = (
        <div className="space-y-2">
          <p className="text-zinc-600 dark:text-zinc-400">Chuỗi thói quen vàng duy trì năng lượng rực rỡ:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-rose-50 dark:bg-rose-950/20 p-2 rounded-xl text-rose-900 dark:text-rose-200">
              <span className="font-black block">💧 Nước: 2.1 Lít</span>
              7 cốc nước mỗi ngày sạch khỏe cơ thể.
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 p-2 rounded-xl text-amber-900 dark:text-amber-200">
              <span className="font-black block">🧘 Thiền: 15 Phút</span>
              Giúp cân bằng tinh thần và ngủ thật sâu.
            </div>
          </div>
        </div>
      );
    } else if (navDropdown === "Lifestyle") {
      title = "🏡 Phong cách Sống & Trang phục (Home Lifestyle)";
      content = (
        <div className="space-y-2">
          <p className="text-zinc-600 dark:text-zinc-400">Lựa chọn quần áo, dọn dẹp trang trí decor ngôi nhà nhỏ:</p>
          <ul className="list-disc pl-4 space-y-1 text-zinc-500 dark:text-zinc-400">
            <li>Tập trung tối giản hóa nội thất ngôi nhà, bài trí góc học tập tràn ánh nắng hoàng hôn.</li>
            <li><strong>Góc Outfit:</strong> Sử dụng clip càng cua đồi mồi kết hợp blazer tông xám ấm tạo cá tính.</li>
          </ul>
        </div>
      );
    }

    return (
      <div 
        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] border-2 border-zinc-950 dark:border-zinc-800 p-5 rounded-2xl shadow-[4px_4px_0px_#1a1a1a] z-50 text-left animate-in slide-in-from-top-2 duration-250"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            {title}
          </h3>
          <button 
            onClick={() => setNavDropdown(null)}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-zinc-400 hover:text-zinc-900" />
          </button>
        </div>
        {content}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fcfcfb] dark:bg-[#121212] text-zinc-900 dark:text-zinc-100 transition-colors duration-300 font-sans relative">
      
      {/* 1. Header Banner Ambient (Desk objects, claws hair pin, coffee vibe) */}
      <div className="relative w-full h-72 md:h-80 overflow-hidden bg-zinc-100 border-b border-zinc-200 dark:border-zinc-800">
        <img
          src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1600"
          alt="Coffee flatlay with minimalist desk accessories and clips vibes"
          className="w-full h-full object-cover object-[center_35%] filter brightness-95 contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#fcfcfb] dark:from-[#121212] via-transparent to-black/10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-32">
        
        {/* 2. Title Header Area (With Asterisk logo and Light Home Text) */}
        <header className="relative -mt-16 z-10 mb-8 p-6 bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl rounded-3xl border-2 border-zinc-950 dark:border-zinc-800 shadow-[3px_3px_0px_#1a1a1a]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  showToast("Life Dashboard Asterisk - Giữ ngọn lửa hành trình rực cháy!");
                }}
                className="p-2.5 bg-[#ebf0f6] dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 rounded-2xl border border-zinc-350 dark:border-zinc-700 hover:rotate-90 transition-transform duration-300 shadow-[2px_2px_0px_#1a1a1a]"
              >
                <Sparkles className="w-7 h-7 text-amber-500 fill-amber-500/10 animate-pulse" />
              </button>
              <div className="text-left">
                <h1 className="font-serif text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
                  Life Dashboard
                </h1>
                <p className="text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold font-mono mt-0.5 flex items-center gap-1.5">
                  Home <span className="inline-block w-1 h-1 bg-zinc-300 dark:bg-zinc-650 rounded-full" /> 
                  <span>Màn hình điều khiển thói quen sống thanh tao</span>
                </p>
              </div>
            </div>

            {/* Quick Live Clock Information */}
            <div className="flex items-center gap-3 bg-[#f4f4f3] dark:bg-zinc-800/80 p-2.5 px-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 self-start md:self-auto shadow-inner">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin-slow shrink-0" />
              <div className="text-left leading-none">
                <span className="text-[10px] text-zinc-500 uppercase font-black block tracking-wider">Thời gian hệ thống</span>
                <span className="font-mono text-sm font-black text-zinc-800 dark:text-zinc-100">
                  {currentTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* 3. Navigation Bar with Chevron Dropdowns */}
        <nav className="relative mb-10 border-y border-zinc-200 dark:border-zinc-800 py-2.5 z-40">
          <ul className="flex flex-wrap items-center gap-y-2 gap-x-8 md:gap-x-12 list-none">
            {[
              { id: "Productivity", key: "Productivity", icon: <ClipboardList className="w-4 h-4 text-zinc-400" /> },
              { id: "Finance", key: "Finance", icon: <Award className="w-4 h-4 text-zinc-400" /> },
              { id: "Health", key: "Health | Wellness", icon: <Heart className="w-4 h-4 text-zinc-400" /> },
              { id: "Lifestyle", key: "Home | Lifestyle", icon: <Shirt className="w-4 h-4 text-zinc-400" /> }
            ].map(item => (
              <li key={item.id}>
                <button
                  onClick={() => setNavDropdown(navDropdown === item.id ? null : item.id)}
                  className={`nav-item flex items-center gap-2 group transition-all duration-200 text-sm font-bold tracking-tight py-1 px-2.5 rounded-lg border-2 ${
                    navDropdown === item.id 
                      ? "border-zinc-950 dark:border-zinc-100 bg-zinc-900 text-white" 
                      : "border-transparent text-zinc-600 dark:text-zinc-300 hover:border-zinc-200 dark:hover:border-zinc-800"
                  }`}
                >
                  {item.icon}
                  <span>{item.key}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-y-0.5 transition-transform shrink-0" />
                </button>
              </li>
            ))}
          </ul>

          {/* Render the dropdown layout beautifully */}
          <AnimatePresence>
            {renderNavDropdown()}
          </AnimatePresence>
        </nav>

        {/* 4. Main Two Column Grid Layout (25% Sidebar | 75% Content Area) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sidebar Layout (approx 25% or 3 cols in a 12-col layout) */}
          <aside className="lg:col-span-3 space-y-6">
            
            {/* 4.1 "Welcome!" Segment with Inline Editor */}
            <div className="bg-[#ebf0f6] dark:bg-zinc-900 border-l-4 border-amber-500 rounded-r-2xl p-5 shadow-sm text-left relative group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Smile className="w-5 h-5 text-amber-500" />
                  <span className="text-xs uppercase font-black tracking-wider text-amber-800 dark:text-amber-400">Welcome!</span>
                </div>
                <button 
                  onClick={() => setEditingWelcome(!editingWelcome)}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/40 dark:hover:bg-zinc-800 rounded transition-all"
                  title="Chỉnh sửa lời chào"
                >
                  <Edit2 className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
                </button>
              </div>

              {editingWelcome ? (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500">Tên của bạn</label>
                    <input
                      type="text"
                      className="w-full text-xs p-1.5 border border-zinc-300 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-500">Lời phát biểu mục tiêu</label>
                    <textarea
                      rows={3}
                      className="w-full text-xs p-1.5 border border-zinc-300 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setEditingWelcome(false);
                      showToast("Đã lưu phát biểu của bạn thành công!");
                    }}
                    className="w-full bg-zinc-950 hover:bg-zinc-800 text-white text-[10px] font-black py-1 rounded shadow"
                  >
                    LƯU THAY ĐỔI
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-bold text-zinc-950 dark:text-white">
                    Hi, {userName}!
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed font-medium">
                    {welcomeMessage}
                  </p>
                </div>
              )}
            </div>

            {/* 4.2 "Summary" Segment */}
            <div className="bg-white dark:bg-[#1a1a1a] border-2 border-zinc-950 dark:border-zinc-800 rounded-3xl p-5 shadow-[3px_3px_0px_#1a1a1a] text-left">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5 mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white font-serif">Summary</span>
                </div>
                <button
                  onClick={() => setAddingSummary(!addingSummary)}
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>

              {/* Dynamic Summary Category Creation Form */}
              {addingSummary && (
                <form onSubmit={handleCreateSummary} className="mb-4 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2.5">
                  <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Danh mục tổng kết mới</h4>
                  <input
                    type="text"
                    required
                    placeholder="Tên danh mục (VD: Habit Streak...)"
                    className="w-full text-xs p-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    value={newSumText}
                    onChange={(e) => setNewSumText(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Chỉ số chính (VD: 95% hoặc 5 of 8)"
                    className="w-full text-xs p-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    value={newSumVal}
                    onChange={(e) => setNewSumVal(e.target.value)}
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-500 font-bold">Màu sắc:</span>
                    {["blue", "gray", "green", "rose"].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewSumType(color as any)}
                        className={`w-3.5 h-3.5 rounded-full border ${newSumType === color ? 'border-zinc-950 scale-125' : 'border-transparent'}`}
                        style={{
                          backgroundColor: 
                            color === "blue" ? "#ebf0f6" :
                            color === "gray" ? "#f4f4f3" :
                            color === "green" ? "#eefbf6" : "#fef0f0"
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-[10px] font-black py-1.5 rounded transition"
                    >
                      Bổ sung
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingSummary(false)}
                      className="px-2.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-white text-[10px] font-bold rounded"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}

              {/* Sub-header mimics image_0.png with simple styled box */}
              <div className="bg-[#f4f4f3] dark:bg-zinc-800/80 rounded-xl p-3 mb-4 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-black text-xs uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                  <span>Life Dashboard Summary</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-1 flex items-center justify-between">
                  <span>Khởi động ngày gọn gàng</span>
                  <span className="font-bold">08:00 AM</span>
                </div>
              </div>

              {/* Summary Items List */}
              <div className="space-y-3">
                {summaryItems.map(item => (
                  <div 
                    key={item.id} 
                    className="flex justify-between items-center group/item border-b border-zinc-50 dark:border-zinc-900 pb-1.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-amber-500/80 shrink-0" />
                      <span className="text-zinc-700 dark:text-zinc-300 text-xs font-semibold">{item.text}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        item.type === "blue" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300" :
                        item.type === "green" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300" :
                        item.type === "rose" ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300" :
                        "bg-zinc-100 text-zinc-600 dark:bg-zinc-850 dark:text-zinc-400"
                      }`}>
                        {item.value}
                      </span>
                      <button
                        onClick={() => deleteSummaryItem(item.id)}
                        className="p-0.5 opacity-0 group-hover/item:opacity-100 text-zinc-400 hover:text-rose-600 rounded transition-all"
                        title="Xóa danh mục"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setAddingSummary(true)}
                className="w-full mt-4 flex items-center justify-center gap-1.5 border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-white py-2 rounded-xl text-xs font-bold transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New</span>
              </button>
            </div>

            {/* 4.3 "Time Blocking" Section */}
            <div className="bg-white dark:bg-[#1a1a1a] border-2 border-zinc-950 dark:border-[#222] rounded-3xl p-5 shadow-[3px_3px_0px_#1a1a1a] text-left">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white font-serif">Time Blocking</span>
                </div>
                <div className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-black font-mono">
                  ACTIVE
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 mb-3 leading-snug">
                Thời khóa biểu đồng bộ thời gian trực quan của Hien. Khối sáng màu là nhiệm vụ được highlight.
              </div>

              {/* Timeblock chronogrid table */}
              <div className="space-y-1.5 overflow-hidden">
                {timeblocks.map((block, idx) => {
                  const isActive = idx === activeTimeblockIdx;
                  return (
                    <div 
                      key={block.id}
                      onClick={() => {
                        const newAct = prompt(`Thay đổi hoạt động khung ${block.time}:`, block.activity);
                        if (newAct !== null) {
                          setTimeblocks(prev => prev.map(pt => pt.id === block.id ? { ...pt, activity: newAct.trim() ||"Nghỉ ngơi" } : pt));
                          showToast(`Đã thay đổi lịch trình khung ${block.time}`);
                        }
                      }}
                      className={`group/tb text-xs flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                        isActive 
                          ? "border-amber-400 bg-amber-50/70 dark:bg-amber-950/20 font-black shadow-sm" 
                          : "border-zinc-100 dark:border-zinc-850 bg-zinc-50/40 dark:bg-[#202020]/20 hover:border-zinc-200 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-[10px] font-bold text-zinc-400 shrink-0 select-none">
                          {block.time}
                        </span>
                        <span className={`truncate text-[11.5px] ${isActive ? "text-amber-900 dark:text-amber-200" : "text-zinc-700 dark:text-zinc-300"}`}>
                          {block.activity}
                        </span>
                      </div>
                      {isActive && (
                        <span className="text-[9px] uppercase font-black tracking-widest text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded animate-pulse shrink-0">
                          Now
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </aside>

          {/* Right Main Content Area (75% or 9 cols in 12-col layout) */}
          <main className="lg:col-span-9 space-y-10 text-left">
            
            {/* 4.4 "To-Do List" Section */}
            <section className="bg-white dark:bg-[#1a1a1a] border-2 border-zinc-950 dark:border-zinc-800 rounded-3xl p-6 shadow-[4px_4px_0px_#1a1a1a]">
              
              {/* Header with flashy icon and subtitle details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                    <CheckSquare className="w-6 h-6 text-amber-500" />
                    <span>To-Do List</span>
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
                    Danh sách các đầu việc chuẩn xác được phân loại trực quan theo độ ưu tiên và khu vực hoạt động.
                  </p>
                </div>

                <button
                  onClick={() => setAddingTodo(!addingTodo)}
                  className="bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs p-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-[2px_2px_0px_#1a1a1a] dark:shadow-none self-start sm:self-auto shrink-0 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ New Task</span>
                </button>
              </div>

              {/* Sub Tab bar options */}
              <div className="flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 mb-5 overflow-x-auto scrollbar-none">
                {(["Today", "Overdue", "This week", "Calendar", "Table"] as const).map(tabKey => (
                  <button
                    key={tabKey}
                    onClick={() => setTodoTab(tabKey)}
                    className={`pb-2.5 px-4 text-xs font-bold transition-all relative whitespace-nowrap ${
                      todoTab === tabKey 
                        ? "text-zinc-950 dark:text-white font-black" 
                        : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    }`}
                  >
                    {tabKey}
                    {todoTab === tabKey && (
                      <motion.div 
                        layoutId="activeTodoTabLine"
                        className="absolute bottom-0 left-4 right-4 h-0.5 bg-zinc-950 dark:bg-amber-400 rounded-full" 
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Form expanding when user wants to add todo */}
              <AnimatePresence>
                {addingTodo && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border-2 border-zinc-900 dark:border-zinc-700"
                  >
                    <form onSubmit={handleCreateTodo} className="space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700 pb-2">
                        <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <PlusCircle className="w-4 h-4" />
                          Thêm đầu việc mới vào sổ tay
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setAddingTodo(false)}
                          className="hover:bg-zinc-200 dark:hover:bg-zinc-700 p-1 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-12">
                          <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Nội dung nhiệm vụ</label>
                          <input
                            type="text"
                            required
                            placeholder="VD: Cập nhật CEFR Speaking, Phác thảo moodboard trang điểm..."
                            className="w-full text-xs p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-850 text-zinc-900 dark:text-white font-bold"
                            value={newTodoText}
                            onChange={(e) => setNewTodoText(e.target.value)}
                          />
                        </div>

                        <div className="md:col-span-4">
                          <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Khu vực (Category)</label>
                          <select
                            className="w-full text-xs p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-850 text-zinc-900 dark:text-white"
                            value={newTodoCategory}
                            onChange={(e) => setNewTodoCategory(e.target.value as any)}
                          >
                            <option value="personal">Personal - Cá nhân</option>
                            <option value="work">Work - Học tập & Làm việc</option>
                            <option value="social">Social - Xã hội, Bạn bè</option>
                            <option value="home">Home - Gia đình, Dọn dẹp</option>
                          </select>
                        </div>

                        <div className="md:col-span-4">
                          <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Độ ưu tiên</label>
                          <select
                            className="w-full text-xs p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-850 text-zinc-900 dark:text-white"
                            value={newTodoPriority}
                            onChange={(e) => setNewTodoPriority(e.target.value as any)}
                          >
                            <option value="high">High - Khẩn cấp</option>
                            <option value="medium">Medium - Vừa phải</option>
                            <option value="low">Low - Thư thả</option>
                          </select>
                        </div>

                        <div className="md:col-span-4">
                          <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Hạn ngày (Due Date)</label>
                          <input
                            type="date"
                            className="w-full text-xs p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-850 text-zinc-900 dark:text-white"
                            value={newTodoDate}
                            onChange={(e) => setNewTodoDate(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setAddingTodo(false)}
                          className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-white rounded-lg text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          Đóng
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-white rounded-lg text-xs font-black shadow"
                        >
                          Thêm Nhiệm Vụ
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Todo List Render Grid */}
              <div className="space-y-3">
                {listToRender.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-zinc-200 dark:border-zinc-805 rounded-2xl">
                    <p className="text-sm text-zinc-400 font-serif italic">Không còn việc nào tồn đọng ở tab này rồi! Tuyệt vời Hien ơi! ✨</p>
                  </div>
                ) : (
                  listToRender.map(todo => (
                    <div
                      key={todo.id}
                      className={`todo-item flex items-start gap-3.5 p-3 px-4 border rounded-xl bg-white dark:bg-[#1a1a1a] transition-all hover:translate-x-1 ${
                        todo.checked 
                          ? "border-zinc-105 dark:border-zinc-900 opacity-60" 
                          : "border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={todo.checked}
                        onChange={() => toggleTodoState(todo.id)}
                        className="todo-checkbox mt-1 w-4.5 h-4.5 rounded-md border-2 border-zinc-350 dark:border-zinc-700 focus:ring-0 checked:bg-zinc-950 cursor-pointer accent-amber-500"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <span className={`text-[13.5px] font-bold block ${
                          todo.checked ? "line-through text-zinc-400" : "text-zinc-900 dark:text-zinc-100"
                        }`}>
                          {todo.text}
                        </span>
                        
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {/* Color Coded tags matching image_0.png styled with elegant pills */}
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            todo.category === "home" ? "bg-amber-100 text-amber-800 dark:bg-amber-955/20 dark:text-amber-300" :
                            todo.category === "social" ? "bg-cyan-100 text-cyan-850 dark:bg-cyan-955/20 dark:text-cyan-300" :
                            todo.category === "personal" ? "bg-rose-100 text-rose-800 dark:bg-rose-955/20 dark:text-rose-300" :
                            "bg-indigo-100 text-indigo-800 dark:bg-indigo-955/20 dark:text-indigo-300"
                          }`}>
                            [{todo.category}]
                          </span>

                          <span className={`text-[10px] font-bold px-1.5 rounded uppercase tracking-wider ${
                            todo.priority === "high" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                            todo.priority === "medium" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                            "bg-zinc-100 text-zinc-500"
                          }`}>
                            {todo.priority}
                          </span>

                          <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 ml-auto block">
                            Hạn: {todo.date.replace("2026-06-", "")}/06
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteTodoItem(todo.id)}
                        className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors self-center opacity-0 hover:opacity-100 group-hover:opacity-100 inline"
                        title="Xóa đầu việc"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* "+ New" mock trigger bar underneath */}
              <button
                onClick={() => setAddingTodo(true)}
                className="w-full mt-4 flex items-center justify-center gap-1.5 border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 py-2.5 rounded-xl text-xs font-bold transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <Plus className="w-4 h-4 animate-bounce" />
                <span>Thêm công việc nhanh vào Today</span>
              </button>

            </section>

            {/* 4.5 "Planner" Section */}
            <section className="bg-white dark:bg-[#1a1a1a] border-2 border-zinc-950 dark:border-zinc-800 rounded-3xl p-6 shadow-[4px_4px_0px_#1a1a1a]">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-5">
                <div>
                  <h2 className="font-serif text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-amber-500" />
                    <span>Planner</span>
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Bản kế hoạch tuần lễ chi tiết, đặt trọng tâm công việc và phân chia phân cảnh mỗi ngày tối ưu.
                  </p>
                </div>

                <div className="flex bg-[#fcfcfb] dark:bg-zinc-800 border border-zinc-150 dark:border-zinc-700 p-0.5 rounded-xl shadow-inner shrink-0 self-start sm:self-auto">
                  <button
                    onClick={() => setPlannerTab("Weekly plan")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                      plannerTab === "Weekly plan"
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-350"
                    }`}
                  >
                    Weekly plan
                  </button>
                  <button
                    onClick={() => {
                      setPlannerTab("Monthly plan");
                      showToast("Monthly plan loaded - Đang hiển thị bản nháp 4 tuần!");
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                      plannerTab === "Monthly plan"
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-905 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-350"
                    }`}
                  >
                    Monthly plan
                  </button>
                </div>
              </div>

              {plannerTab === "Weekly plan" ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-zinc-400 dark:text-zinc-500">Kế hoạch chi tiết theo tuần</span>
                    <button
                      onClick={resetPlannerWeek}
                      className="text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 font-bold transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>New Week</span>
                    </button>
                  </div>

                  {/* Grid of days Monday to Sunday */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {plannerDays.map(day => (
                      <div 
                        key={day.id}
                        className="border-2 border-zinc-950 dark:border-zinc-850 rounded-2xl p-4 bg-white dark:bg-[#1a1a1a] flex flex-col gap-3 shadow-[2px_2px_0px_#1a1a1a]"
                      >
                        <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-2">
                          <div>
                            <h4 className="text-sm font-black text-zinc-950 dark:text-white leading-none">{day.day}</h4>
                            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-1 block">Ngày {day.date}</span>
                          </div>
                          
                          <button
                            onClick={() => handleAddNewTaskToDay(day.id)}
                            className="p-1 hover:bg-[#ebf0f6] rounded text-zinc-500 hover:text-zinc-900 transition"
                            title="Thêm mục tiêu dán ngày"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Priority Block styled matching Notion */}
                        <div 
                          onClick={() => handleEditPlannerPriority(day.id)}
                          className="bg-amber-50 dark:bg-amber-950/25 p-2 px-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40 font-bold text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-1.5 cursor-pointer hover:bg-amber-100/50"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span className="leading-tight">{day.priority}</span>
                        </div>

                        {/* List of sub-tasks */}
                        <div className="flex-1 space-y-2 pt-1 text-left">
                          {day.tasks.map(task => (
                            <div 
                              key={task.id}
                              className="group/pt flex items-start justify-between gap-1.5"
                            >
                              <div className="flex items-start gap-2 text-[12px] text-zinc-700 dark:text-zinc-300 min-w-0">
                                <span className="w-1.5 h-1.5 bg-zinc-305 dark:bg-zinc-650 rounded-full mt-1.5 shrink-0" />
                                <span className="leading-tight">{task.text}</span>
                              </div>
                              <button
                                onClick={() => handleRemoveTaskFromDay(day.id, task.id)}
                                className="p-0.5 opacity-0 group-hover/pt:opacity-100 text-zinc-400 hover:text-rose-600 transition"
                                title="Xóa"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Placeholder Card for addition */}
                    <button
                      onClick={handleAddNewDay}
                      className="border-2 border-dashed border-zinc-305 dark:border-zinc-800 hover:border-zinc-950 dark:hover:border-zinc-400 rounded-2xl min-h-[180px] flex flex-col items-center justify-center gap-2 p-5 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/10"
                    >
                      <Plus className="w-6 h-6 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-wider">Add Day to Week</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[#f4f4f3] dark:bg-zinc-850 p-4 rounded-2xl border text-xs">
                    <h3 className="font-serif text-sm font-bold text-zinc-900 dark:text-white mb-2">Tháng 6, 2026 - Bản Đồ Mục Tiêu Vĩ Mô</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] leading-relaxed">
                      <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl">
                        <span className="font-black block text-amber-600">Tuần 1 (Tiêu điểm)</span>
                        Kiểm soát kẹp tóc, hoàn thiện các file dictation Tiếng Anh.
                      </div>
                      <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl">
                        <span className="font-black block text-amber-600">Tuần 2 (Sắp tới)</span>
                        Thiết kế Layout Nhật ký & Scrapbook Retro UI hoàn chỉnh.
                      </div>
                      <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl">
                        <span className="font-black block text-emerald-600">Tuần 3</span>
                        Review 120 thẻ ôn tập từ vựng CEFR C1. Lập biểu đồ gia đình.
                      </div>
                      <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl">
                        <span className="font-black block text-rose-600">Tuần 4</span>
                        Du lịch cuối tuần, tự sướng 20 kiểu phong cách Cozy Aesthetic.
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </section>

            {/* 4.6 "Home & Lifestyle" Section (Outfit Interactive Styling) */}
            <section className="bg-white dark:bg-[#1a1a1a] border-2 border-zinc-950 dark:border-zinc-800 rounded-3xl p-6 shadow-[4px_4px_0px_#1a1a1a]">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-5">
                <div>
                  <h2 className="font-serif text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                    <Shirt className="w-6 h-6 text-amber-500" />
                    <span>Home & Lifestyle</span>
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Góc định nghĩa phong cách sống của Hien, chọn lựa trang phục tuần, lịch dọn dẹp và watchlist thú vị.
                  </p>
                </div>

                <div className="flex bg-[#fcfcfb] dark:bg-zinc-800 border border-zinc-150 dark:border-zinc-700 p-0.5 rounded-xl shadow-inner shrink-0 self-start sm:self-auto">
                  {(["Daily cleaning", "Weekly outfits", "Watchlist calendar"] as const).map(subTab => (
                    <button
                      key={subTab}
                      onClick={() => setLifestyleTab(subTab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all relative ${
                        lifestyleTab === subTab
                          ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-350"
                      }`}
                    >
                      {subTab === "Daily cleaning" ? "Daily cleaning" :
                       subTab === "Weekly outfits" ? "Weekly outfits" : "Watchlist"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub tabs view definitions */}
              {lifestyleTab === "Weekly outfits" && (
                <div className="space-y-6">
                  <div className="bg-amber-50/50 dark:bg-amber-950/10 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-xs text-amber-950 dark:text-amber-200">
                    <span className="font-black">🎨 Thử thách Sáng tạo Cách phối đồ:</span> Nhấp vào bất kỳ ô phụ kiện/áo/quần nào bên dưới để phối trang phục và kẹp tóc đồi mồi tùy hứng cho Hien!
                  </div>

                  {/* Outfit Grids */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {outfitCards.map(outfit => (
                      <div 
                        key={outfit.id}
                        className="border-2 border-zinc-950 dark:border-zinc-800 rounded-2xl p-4 bg-white dark:bg-[#1e1e1e] flex flex-col gap-4 relative group shadow-[2px_2px_0px_#1a1a1a]"
                      >
                        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                          <div>
                            <h3 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">{outfit.day}</h3>
                            <span className="text-[10px] uppercase font-black text-amber-600 dark:text-amber-400 mt-0.5 block">{outfit.mood}</span>
                          </div>
                          
                          <button
                            onClick={() => handleEditOutfitMoodAndNote(outfit.id)}
                            className="p-1 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded text-zinc-400 group-hover:text-zinc-900"
                            title="Đổi Vibe / Mood"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Clothing Item Slots Multi-Aesthetic Grid */}
                        <div className="grid grid-cols-4 gap-2">
                          {outfitfitItemsGrid(outfit)}
                        </div>

                        <p className="text-[11.5px] italic text-zinc-500 dark:text-zinc-400 border-t border-dashed border-zinc-150 dark:border-zinc-800 pt-2.5">
                          {outfit.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lifestyleTab === "Daily cleaning" && (
                <div className="space-y-4">
                  <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">Danh sách vệ sinh trong nhà</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cleaningTasks.map(task => (
                      <div 
                        key={task.id}
                        onClick={() => {
                          setCleaningTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
                          showToast(`Đã cập nhật trạng thái dọn dẹp của: ${task.name}`);
                        }}
                        className={`p-3.5 border rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                          task.completed 
                            ? "bg-zinc-100/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700 opacity-60" 
                            : "bg-white dark:bg-zinc-900 border-zinc-950 dark:border-zinc-850 hover:shadow-xs shadow-[1.5px_1.5px_0px_#1a1a1a]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            task.completed ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold" : "border-zinc-400"
                          }`}>
                            {task.completed && <Check className="w-3 h-3" />}
                          </div>
                          <div>
                            <span className={`text-[12.5px] font-bold block ${task.completed ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-105'}`}>
                              {task.name}
                            </span>
                            <span className="text-[10px] text-zinc-400">{task.cycle} • {task.assignedTo}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lifestyleTab === "Watchlist calendar" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">Lịch phim ảnh & Bài học giải trí</span>
                    <button
                      onClick={() => {
                        const title = prompt("Nhập tên bộ phim hoặc bài học YouTube:");
                        if (!title) return;
                        const platform = prompt("Nền tảng phát hành (Netflix, YouTube, Coursera...):") || "Other";
                        
                        const newItem: WatchlistItem = {
                          id: "w_" + Date.now(),
                          title,
                          type: "Series",
                          platform: platform as any,
                          progress: "Mới tinh",
                          rating: 5
                        };
                        setWatchlist(prev => [...prev, newItem]);
                        showToast(`Đã đưa ${title} vào danh sách của bạn rồi nhé!`);
                      }}
                      className="text-xs bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 px-2.5 py-1 rounded"
                    >
                      + Thêm Phim
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {watchlist.map(item => (
                      <div key={item.id} className="border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl bg-[#fcfcfb] dark:bg-zinc-850 flex flex-col justify-between gap-3 text-left">
                        <div>
                          <span className="text-[9px] uppercase font-black text-amber-600 bg-amber-50 dark:bg-amber-955/20 px-1.5 py-0.5 rounded leading-none">
                            {item.platform}
                          </span>
                          <h4 className="font-extrabold text-[#1a1a1a] dark:text-white text-[13px] leading-snug mt-1.5">
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-zinc-400 font-mono mt-1">{item.type} • Tiến độ: {item.progress}</p>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800">
                          <span className="text-zinc-400">Đánh giá:</span>
                          <div className="flex items-center text-amber-400">
                            {"★".repeat(item.rating)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </section>

          </main>

        </div>

      </div>

      {/* Outfit curating selector popover */}
      {outfitEditTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-950 rounded-3xl p-6 max-w-sm w-full text-left shadow-[5px_5px_0px_#1a1a1a]">
            <h3 className="font-serif text-lg font-bold text-zinc-950 dark:text-white mb-1 flex items-center gap-2">
              <Shirt className="w-5 h-5 text-amber-500" />
              <span>Phối Đồ Tự Do</span>
            </h3>
            <p className="text-xs text-zinc-500 mb-4 leading-normal">
              Stylist cho chiếc {outfitCards.find(c => c.id === outfitEditTarget.cardId)?.items[outfitEditTarget.slotIdx].label}. Nhập tên món đồ hoặc chọn từ gợi ý bên dưới.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Tên món đồ / Thương hiệu</label>
                <input
                  id="popOutfitName"
                  type="text"
                  placeholder="VD: Vintage Blazer, Vans Old Skool..."
                  className="w-full text-xs p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  defaultValue={outfitCards.find(c => c.id === outfitEditTarget.cardId)?.items[outfitEditTarget.slotIdx].name}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">Đường dẫn ảnh chụp phục phẩm (Unsplash URL)</label>
                <input
                  id="popOutfitImg"
                  type="text"
                  placeholder="Để trống để giữ ảnh mẫu chất lượng cao..."
                  className="w-full text-xs p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-850 text-zinc-90 \
                  0 dark:text-white text-ellipsis"
                  defaultValue={outfitCards.find(c => c.id === outfitEditTarget.cardId)?.items[outfitEditTarget.slotIdx].img}
                />
              </div>

              {/* Sample styles preset */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-400 block">Gợi ý phối đồ thịnh hành:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: "Áo Cardigan Oversized", img: "https://images.unsplash.com/photo-1574164904299-3a102b110380?auto=format&fit=crop&q=80&w=300" },
                    { name: "Kẹp Càng Cua Vintage", img: "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?auto=format&fit=crop&q=80&w=300" },
                    { name: "Quần Ống Suông Comfy", img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=300" },
                    { name: "Loafers Da Đen", img: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&q=80&w=300" }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const nameEl = document.getElementById("popOutfitName") as HTMLInputElement;
                        const imgEl = document.getElementById("popOutfitImg") as HTMLInputElement;
                        if (nameEl) nameEl.value = preset.name;
                        if (imgEl) imgEl.value = preset.img;
                        showToast(`Đã đưa phong cách "${preset.name}" vào bảng chọn.`);
                      }}
                      className="text-[10px] bg-zinc-100 hover:bg-amber-100 text-zinc-700 px-2.5 py-1 rounded-full border border-zinc-200 transition"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setOutfitEditTarget(null)}
                  className="px-3.5 py-2 border border-zinc-200 dark:border-zinc-700 text-zinc-600 rounded-xl text-xs font-bold"
                >
                  Bỏ qua
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const name = (document.getElementById("popOutfitName") as HTMLInputElement)?.value || "";
                    const img = (document.getElementById("popOutfitImg") as HTMLInputElement)?.value || "";
                    saveOutfitSlotDetails(name, img);
                  }}
                  className="px-4 py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl text-xs font-black shadow"
                >
                  Lưu Lựa Chọn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast box alerts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-zinc-900 border-2 border-zinc-800 text-white p-3.5 px-6 rounded-2xl shadow-[5px_5px_0px_rgba(0,0,0,0.3)] flex items-center gap-2.5 max-w-sm text-left"
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span className="text-xs font-bold font-sans tracking-wide leading-tight">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clean Float Button for Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 left-6 z-55 w-12 h-12 rounded-full border-2 border-zinc-950 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white flex items-center justify-center hover:scale-105 hover:bg-neutral-50 shadow-[2px_2px_0px_#1a1a1a] transition-all"
        title="Đổi chủ đề sáng nhẹ/tối"
      >
        {isDarkMode ? <Sun className="w-5 h-5 text-amber-500 fill-amber-500/10" /> : <Moon className="w-5 h-5 text-zinc-600" />}
      </button>

    </div>
  );

  // Quick render slots matrix for styling
  function outfitfitItemsGrid(outfit: OutfitCard) {
    return outfit.items.map((item, idx) => (
      <div 
        key={idx}
        onClick={() => handleOutfitSlotClick(outfit.id, idx)}
        className="flex flex-col items-center gap-1.5 cursor-pointer text-center group/slot"
      >
        <div className="w-full aspect-square bg-[#f4f4f3] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden relative group-hover/slot:border-amber-500 transition-all">
          <img
            src={item.img}
            alt={item.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-300 group-hover/slot:scale-110"
          />
          <div className="absolute inset-0 bg-black/0 group-hover/slot:bg-black/10 flex items-center justify-center transition-all">
            <span className="opacity-0 group-hover/slot:opacity-100 bg-white/90 text-[8px] font-black uppercase text-zinc-900 px-1 py-0.5 rounded shadow whitespace-nowrap">
              Đổi đồ
            </span>
          </div>
        </div>
        <span className="text-[9.5px] text-zinc-400 font-bold block truncate max-w-full" title={item.label}>
          {item.label}
        </span>
      </div>
    ));
  }
}
