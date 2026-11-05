import React, { useState, useMemo } from "react";
import { 
  Check, 
  Bookmark, 
  X, 
  ChevronRight, 
  ChevronDown, 
  ChevronLeft, 
  Plus, 
  RotateCcw, 
  Save, 
  Trash2, 
  Calendar as CalendarIcon, 
  Sparkles,
  Edit2
} from "lucide-react";
import { useFirebase } from "../context/FirebaseContext";

interface BucketItem {
  id: string;
  text: string;
  completed: boolean;
}

const DEFAULT_BUCKET_LIST: BucketItem[] = [
  // Column 1
  { id: "b1", text: "Mua ipad M3", completed: false },
  { id: "b2", text: "Đi du lịch Hà Nội", completed: false },
  { id: "b3", text: "Tiết kiệm được nhiều tiền", completed: false },
  { id: "b4", text: "Niềng răng", completed: false },
  { id: "b5", text: "Học bằng lái xe", completed: false },
  { id: "b6", text: "Đi Lý Sơn", completed: true },
  { id: "b7", text: "New balance 533", completed: false },
  { id: "b8", text: "Tập thể dục thường xuyên", completed: false },
  { id: "b9", text: "Đưa cả nhà đi chơi", completed: false },
  { id: "b10", text: "Về thăm nhà nhiều", completed: false },
  { id: "b11", text: "Cười nhiều hơn", completed: false },
  // Column 2
  { id: "b12", text: "Mua ipad M3", completed: false },
  { id: "b13", text: "Đi du lịch Hà Nội", completed: false },
  { id: "b14", text: "Tiết kiệm được nhiều tiền", completed: false },
  { id: "b15", text: "Niềng răng", completed: false },
  { id: "b16", text: "Học bằng lái xe", completed: false },
  { id: "b17", text: "Đi Lý Sơn", completed: false },
  { id: "b18", text: "New balance 533", completed: false },
  { id: "b19", text: "Tập thể dục thường xuyên", completed: false },
  { id: "b20", text: "Đưa cả nhà đi chơi", completed: false },
  { id: "b21", text: "Về thăm nhà nhiều", completed: false },
  { id: "b22", text: "Cười nhiều hơn", completed: false },
  // Column 3
  { id: "b23", text: "Mua ipad M3", completed: false },
  { id: "b24", text: "Đi du lịch Hà Nội", completed: false },
  { id: "b25", text: "Tiết kiệm được nhiều tiền", completed: false },
  { id: "b26", text: "Niềng răng", completed: false },
  { id: "b27", text: "Học bằng lái xe", completed: false },
  { id: "b28", text: "Đi Lý Sơn", completed: false },
  { id: "b29", text: "New balance 533", completed: false },
  { id: "b30", text: "Tập thể dục thường xuyên", completed: false },
  { id: "b31", text: "Đưa cả nhà đi chơi", completed: false },
  { id: "b32", text: "Về thăm nhà nhiều", completed: false },
  { id: "b33", text: "Cười nhiều hơn", completed: false },
];

export interface DashboardEvent {
  id: string;
  date: string; // e.g. "08/11/2026" or "05/07/2016"
  dayMonth: string; // e.g. "8/11" or "05/07"
  title: string;
  note?: string;
}

const DEFAULT_EVENTS: DashboardEvent[] = [
  {
    id: "ev-1",
    date: "08/11/2026",
    dayMonth: "8/11",
    title: "Sinh nhật Anna",
    note: "Tổ chức tiệc sinh nhật cùng bạn bè lúc 19:00"
  },
  {
    id: "ev-2",
    date: "08/11/2026",
    dayMonth: "8/11",
    title: "Đi dự lịch",
    note: "Chuyến dã ngoại cuối tuần cùng nhóm bạn"
  },
  {
    id: "ev-3",
    date: "12/11/2026",
    dayMonth: "12/11",
    title: "Sự kiện A",
    note: "Họp nhóm dự án luyện tiếng Anh giao tiếp"
  },
  {
    id: "ev-4",
    date: "19/11/2026",
    dayMonth: "19/11",
    title: "Sự kiện B",
    note: "Kiểm tra định kỳ từ vựng B1 và luyện phản xạ"
  },
  {
    id: "ev-5",
    date: "05/07/2016",
    dayMonth: "05/07",
    title: "Sự kiện số 1",
    note: `Ghi chú: "Add up to" luôn đi liền ba từ và theo sau là con số hoặc kết quả: "The bills add up to $500." Đừng nhầm với "add up" (không có "to") nghĩa là "nghe có lý", như trong "His story doesn't add up."`
  }
];

interface CashItem {
  denom: number;
  qty: number;
}

const DEFAULT_CASH_LIST: CashItem[] = [
  { denom: 500000, qty: 3 },
  { denom: 200000, qty: 4 },
  { denom: 100000, qty: 2 },
  { denom: 50000, qty: 7 },
  { denom: 20000, qty: 5 },
  { denom: 10000, qty: 2 },
  { denom: 5000, qty: 1 },
  { denom: 2000, qty: 2 },
  { denom: 1000, qty: 3 },
];

const DEFAULT_CONTENT_NOTE = `"Add up to" là một cụm động từ, nghĩa đen là các con số cộng lại thành một tổng nào đó (ví dụ: các khoản chi cộng lại thành 500 đô la). Nghĩa bóng, nó chỉ việc nhiều chi tiết hay sự việc gộp lại tạo thành một kết quả, ý nghĩa chung nào đó, kiểu như "rốt cuộc là", "tựu chung lại thành". Cụm này rất hay gặp trong câu phủ định như "it doesn't add up to much" (chẳng đáng là bao).`;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function AioHomeDashboard({
  onNavigate,
  onOpenClassicJournal,
}: {
  onNavigate?: (tab: string) => void;
  onOpenClassicJournal?: () => void;
}) {
  // Real today date detection (marked day is TODAY, not default day 9)
  const today = useMemo(() => new Date(), []);
  const todayDate = today.getDate();
  const todayMonth = today.getMonth(); // 0 to 11
  const todayYear = today.getFullYear();

  // Calendar month/year navigation state
  const [currentMonth, setCurrentMonth] = useState<number>(todayMonth);
  const [currentYear, setCurrentYear] = useState<number>(todayYear);
  const [selectedDay, setSelectedDay] = useState<number>(todayDate);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentMonth(todayMonth);
    setCurrentYear(todayYear);
    setSelectedDay(todayDate);
  };

  // Days count for current month
  const daysInCurrentMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // Starting day of week for current month (MONDAY IS FIRST DAY: Mo=0, Tu=1, ..., Su=6)
  const firstDayOfWeek = useMemo(() => {
    const day = new Date(currentYear, currentMonth, 1).getDay(); // Sun=0, Mon=1, ..., Sat=6
    return (day + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
  }, [currentYear, currentMonth]);

  // Events list state (persisted, shared between Top-Left card and Bottom-Left card)
  const [events, setEvents] = useState<DashboardEvent[]>(() => {
    try {
      const saved = localStorage.getItem("aio_home_events");
      return saved ? JSON.parse(saved) : DEFAULT_EVENTS;
    } catch {
      return DEFAULT_EVENTS;
    }
  });

  const saveEvents = (newEvents: DashboardEvent[]) => {
    setEvents(newEvents);
    try {
      localStorage.setItem("aio_home_events", JSON.stringify(newEvents));
    } catch (e) {
      console.error(e);
    }
  };

  // Content note state (persisted with Save button)
  const [contentNote, setContentNote] = useState<string>(() => {
    try {
      return localStorage.getItem("aio_home_content_note") || DEFAULT_CONTENT_NOTE;
    } catch {
      return DEFAULT_CONTENT_NOTE;
    }
  });
  const [isNoteSaved, setIsNoteSaved] = useState(false);

  const handleSaveContentNote = () => {
    try {
      localStorage.setItem("aio_home_content_note", contentNote);
      setIsNoteSaved(true);
      setTimeout(() => setIsNoteSaved(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Default formatted date for new event
  const initialEventDate = useMemo(() => {
    const d = todayDate < 10 ? `0${todayDate}` : `${todayDate}`;
    const m = todayMonth + 1 < 10 ? `0${todayMonth + 1}` : `${todayMonth + 1}`;
    return `${d}/${m}/${todayYear}`;
  }, [todayDate, todayMonth, todayYear]);

  // New event form state
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState(initialEventDate);
  const [newEventNote, setNewEventNote] = useState("");
  const [showAddEventForm, setShowAddEventForm] = useState(false);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    let dayMonth = `${todayDate}/${todayMonth + 1}`;
    const parts = newEventDate.split("/");
    if (parts.length >= 2) {
      const d = parseInt(parts[0], 10) || 1;
      const m = parseInt(parts[1], 10) || (currentMonth + 1);
      dayMonth = `${d}/${m}`;
    }

    const newEv: DashboardEvent = {
      id: "ev-" + Date.now(),
      date: newEventDate.trim() || initialEventDate,
      dayMonth,
      title: newEventTitle.trim(),
      note: newEventNote.trim() || undefined,
    };

    const updated = [newEv, ...events];
    saveEvents(updated);
    setNewEventTitle("");
    setNewEventNote("");
    setShowAddEventForm(false);
  };

  const handleDeleteEvent = (id: string) => {
    const updated = events.filter((e) => e.id !== id);
    saveEvents(updated);
  };

  // Group events by dayMonth for the Top-Left Calendar Event Card
  const currentMonthEvents = useMemo(() => {
    const targetMonth = currentMonth + 1;
    return events.filter((ev) => {
      const parts = ev.date.split("/");
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        return m === targetMonth;
      }
      return false;
    });
  }, [events, currentMonth]);

  const groupedCurrentMonthEvents = useMemo(() => {
    const groups: { [key: string]: DashboardEvent[] } = {};
    currentMonthEvents.forEach((ev) => {
      const key = ev.dayMonth || "Sự kiện";
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    });
    return groups;
  }, [currentMonthEvents]);

  // Days in currently viewed month that have events
  const daysWithEvents = useMemo(() => {
    const daySet = new Set<number>();
    const targetMonth = currentMonth + 1;
    events.forEach((ev) => {
      const parts = ev.date.split("/");
      if (parts.length >= 2) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const y = parts.length >= 3 ? parseInt(parts[2], 10) : currentYear;
        if (m === targetMonth && (!parts[2] || y === currentYear) && !isNaN(d)) {
          daySet.add(d);
        }
      }
    });
    return daySet;
  }, [events, currentMonth, currentYear]);

  // Bucket list state
  const [bucketList, setBucketList] = useState<BucketItem[]>(() => {
    try {
      const saved = localStorage.getItem("aio_2026_bucket_list");
      return saved ? JSON.parse(saved) : DEFAULT_BUCKET_LIST;
    } catch {
      return DEFAULT_BUCKET_LIST;
    }
  });
  const [newGoalText, setNewGoalText] = useState("");

  const saveBucket = (items: BucketItem[]) => {
    setBucketList(items);
    try {
      localStorage.setItem("aio_2026_bucket_list", JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBucketItem = (id: string) => {
    const updated = bucketList.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveBucket(updated);
  };

  const addBucketGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    const newItem: BucketItem = {
      id: "b_" + Date.now(),
      text: newGoalText.trim(),
      completed: false,
    };
    saveBucket([...bucketList, newItem]);
    setNewGoalText("");
  };

  // State for double-click editing of bucket list items
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalText, setEditingGoalText] = useState("");

  const handleSaveEditedGoal = (id: string) => {
    const clean = editingGoalText.trim();
    if (!clean) {
      // Xoá hết ký tự để xoá mục tiêu theo yêu cầu
      const updated = bucketList.filter((item) => item.id !== id);
      saveBucket(updated);
    } else {
      const updated = bucketList.map((item) =>
        item.id === id ? { ...item, text: clean } : item
      );
      saveBucket(updated);
    }
    setEditingGoalId(null);
  };

  const { bulkCurrentCash, setBulkCurrentCash } = useFirebase();

  // Migrate localStorage aio_cash_breakdown to bulkCurrentCash if bulkCurrentCash is empty
  React.useEffect(() => {
    const hasBulk = bulkCurrentCash && Object.keys(bulkCurrentCash).length > 0;
    if (!hasBulk) {
      try {
        const saved = localStorage.getItem("aio_cash_breakdown");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const nextMap: Record<number, number> = {};
            parsed.forEach((it: CashItem) => {
              nextMap[it.denom] = it.qty;
            });
            setBulkCurrentCash(nextMap);
          }
        }
      } catch {}
    }
  }, [bulkCurrentCash, setBulkCurrentCash]);

  // Cash denomination state synced with bulkCurrentCash
  const cashItems: CashItem[] = useMemo(() => {
    const hasBulk = bulkCurrentCash && Object.keys(bulkCurrentCash).length > 0;
    if (hasBulk) {
      return DEFAULT_CASH_LIST.map((item) => ({
        denom: item.denom,
        qty: bulkCurrentCash[item.denom] ?? 0,
      }));
    }
    try {
      const saved = localStorage.getItem("aio_cash_breakdown");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_CASH_LIST;
  }, [bulkCurrentCash]);

  const saveCash = (items: CashItem[]) => {
    const nextMap: Record<number, number> = {};
    items.forEach((it) => {
      nextMap[it.denom] = it.qty;
    });
    setBulkCurrentCash(nextMap);
    try {
      localStorage.setItem("aio_cash_breakdown", JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  };

  const updateCashQty = (index: number, delta: number) => {
    const updated = cashItems.map((it, idx) =>
      idx === index ? { ...it, qty: Math.max(0, it.qty + delta) } : it
    );
    saveCash(updated);
  };

  const setCashQtyDirect = (index: number, val: number) => {
    const updated = cashItems.map((it, idx) =>
      idx === index ? { ...it, qty: Math.max(0, val) } : it
    );
    saveCash(updated);
  };

  const resetCash = () => {
    saveCash(DEFAULT_CASH_LIST);
  };

  // Computed total
  const computedCashTotal = cashItems.reduce(
    (sum, item) => sum + item.denom * item.qty,
    0
  );

  // Tree items expand state in bottom-left
  const [expandedEventId, setExpandedEventId] = useState<string | null>("ev-5");

  // Hashtags state with click-to-edit support
  const [tags, setTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("aio_home_hashtags");
      return saved ? JSON.parse(saved) : ["hastag", "hastag", "hastag", "hastag"];
    } catch {
      return ["hastag", "hastag", "hastag", "hastag"];
    }
  });
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState("");

  const saveTags = (newTags: string[]) => {
    setTags(newTags);
    try {
      localStorage.setItem("aio_home_hashtags", JSON.stringify(newTags));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveTag = (index: number) => {
    if (editingTagIndex === null) return;
    const clean = editingTagValue.trim().replace(/^#+/, "");
    if (!clean) {
      // If empty, remove tag
      const updated = tags.filter((_, i) => i !== index);
      saveTags(updated);
    } else {
      const updated = [...tags];
      updated[index] = clean;
      saveTags(updated);
    }
    setEditingTagIndex(null);
  };

  const handleAddNewTag = () => {
    const updated = [...tags, "hastag"];
    saveTags(updated);
    setEditingTagIndex(tags.length);
    setEditingTagValue("hastag");
  };

  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <div className="w-full max-w-[1520px] mx-auto py-1 px-2 sm:px-3 md:px-5 select-none font-sans">
      {/* Optional top switcher to classic journal */}
      {onOpenClassicJournal && (
        <div className="flex justify-end mb-1.5">
          <button
            onClick={onOpenClassicJournal}
            className="text-[11px] font-bold text-gray-500 hover:text-ink px-3 py-1 rounded-full border border-gray-300 hover:border-black bg-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>📖 Xem giao diện Nhật ký chi tiết & Sổ cái</span>
          </button>
        </div>
      )}

      {/* 2x2 Grid compact layout that fits nicely inside the screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* ========================================================= */}
        {/* TOP LEFT: Calendar & Events Card (cols 12 -> 5)           */}
        {/* Starts on MONDAY (Mo Tu We Th Fr Sa Su)                   */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="w-full h-full bg-[#5468B4] text-white rounded-[26px] border-2 border-[#141414] shadow-[5px_5px_0px_#141414] p-3.5 md:p-4 flex flex-col justify-between">
            {/* Header: Month, Year, and Prev/Next Navigation INSIDE */}
            <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-white/20">
              <button
                onClick={handlePrevMonth}
                title="Tháng trước"
                className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-all active:scale-90 cursor-pointer shadow-xs"
              >
                <ChevronLeft className="w-4 h-4 stroke-[3]" />
              </button>

              <div className="flex items-center gap-1.5">
                <h2 className="text-base md:text-lg font-black text-white tracking-wide text-center">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </h2>
                {(currentMonth !== todayMonth || currentYear !== todayYear) && (
                  <button
                    onClick={handleGoToToday}
                    title="Trở về tháng hiện tại"
                    className="text-[9px] bg-yellow-300 hover:bg-yellow-400 text-black font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer shadow-xs"
                  >
                    Hôm nay
                  </button>
                )}
              </div>

              <button
                onClick={handleNextMonth}
                title="Tháng sau"
                className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-all active:scale-90 cursor-pointer shadow-xs"
              >
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            {/* Days Header: BẮT ĐẦU VÀO THỨ 2 (Mo Tu We Th Fr Sa Su) THEO YÊU CẦU */}
            <div className="grid grid-cols-7 text-center font-bold text-xs tracking-wider mb-1 text-white/95">
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
              <span className="text-yellow-200">Su</span>
            </div>

            {/* Days Grid: Aligned with Monday as first day */}
            <div className="grid grid-cols-7 text-center gap-y-1 font-semibold text-xs md:text-sm mb-2">
              {/* Empty padding cells for start of the month */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-7 w-7 mx-auto opacity-0 pointer-events-none" />
              ))}

              {/* Day cells 1 to daysInCurrentMonth */}
              {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((day) => {
                const isToday =
                  day === todayDate &&
                  currentMonth === todayMonth &&
                  currentYear === todayYear;
                const isSelected = selectedDay === day;
                const hasEvent = daysWithEvents.has(day);

                return (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDay(day);
                      const dayStr = day < 10 ? `0${day}` : `${day}`;
                      const monthStr = currentMonth + 1 < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
                      setNewEventDate(`${dayStr}/${monthStr}/${currentYear}`);
                    }}
                    className="relative flex flex-col items-center justify-center h-7 w-7 mx-auto transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    {isToday ? (
                      /* ĐƯỢC ĐÁNH DẤU LÀ NGÀY HÔM NAY */
                      <span
                        title="Hôm nay"
                        className="w-7 h-7 rounded-full bg-[#1c2541] border-2 border-yellow-300 text-white flex items-center justify-center font-black shadow-inner"
                      >
                        {day}
                      </span>
                    ) : isSelected ? (
                      <span className="w-7 h-7 rounded-full bg-[#35467e] border border-white/60 text-white flex items-center justify-center font-bold shadow-xs">
                        {day}
                      </span>
                    ) : (
                      <span className="text-white hover:text-yellow-200">
                        {day}
                      </span>
                    )}

                    {/* Small event indicator dot */}
                    {hasEvent && !isToday && (
                      <span className="absolute bottom-0 w-1 h-1 rounded-full bg-yellow-300" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Section: Cartoon Avatar + DYNAMIC Event List from bottom card */}
            <div className="flex items-end justify-between pt-1.5 border-t border-white/20 mt-auto">
              {/* Curly hair cartoon illustration */}
              <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 -mb-1">
                <svg
                  viewBox="0 0 160 160"
                  className="w-full h-full drop-shadow-md overflow-visible"
                >
                  <g fill="#141414">
                    <circle cx="80" cy="55" r="38" />
                    <circle cx="50" cy="65" r="32" />
                    <circle cx="110" cy="65" r="32" />
                    <circle cx="40" cy="90" r="26" />
                    <circle cx="120" cy="90" r="26" />
                    <circle cx="65" cy="40" r="28" />
                    <circle cx="95" cy="40" r="28" />
                    <circle cx="35" cy="110" r="22" />
                    <circle cx="125" cy="110" r="22" />
                  </g>
                  <path d="M 45 155 Q 80 135 115 155 L 125 160 L 35 160 Z" fill="#3b4c8a" />
                  <path d="M 68 140 L 80 152 L 92 140 Z" fill="#ffffff" stroke="#141414" strokeWidth="2" />
                  <rect x="56" y="80" width="48" height="50" rx="18" fill="#f6d5be" stroke="#141414" strokeWidth="2.5" />
                  <circle cx="54" cy="98" r="7" fill="#f6d5be" stroke="#141414" strokeWidth="2" />
                  <circle cx="106" cy="98" r="7" fill="#f6d5be" stroke="#141414" strokeWidth="2" />
                  <rect x="58" y="88" width="19" height="16" rx="4" fill="#ffffff" stroke="#facc15" strokeWidth="3.5" />
                  <rect x="83" y="88" width="19" height="16" rx="4" fill="#ffffff" stroke="#facc15" strokeWidth="3.5" />
                  <line x1="77" y1="95" x2="83" y2="95" stroke="#facc15" strokeWidth="3.5" />
                  <circle cx="70" cy="95" r="2.5" fill="#141414" />
                  <circle cx="95" cy="95" r="2.5" fill="#141414" />
                  <path d="M 78 106 Q 80 109 83 107" fill="none" stroke="#141414" strokeWidth="2" strokeLinecap="round" />
                  <path d="M 74 116 Q 80 121 86 116" fill="none" stroke="#141414" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              {/* Event List - Dynamically synchronized with bottom events */}
              <div className="flex flex-col text-right pl-3 max-h-[110px] overflow-y-auto pr-1">
                <div className="flex items-center justify-end gap-1 text-[#fde047] font-black text-xs tracking-wide mb-1 sticky top-0 bg-[#5468B4] py-0.5">
                  <span>✦</span>
                  <span>Sự kiện tháng này</span>
                </div>

                {Object.keys(groupedCurrentMonthEvents).length === 0 ? (
                  <p className="text-[11px] text-white/70 italic">Chưa có sự kiện tháng {currentMonth + 1}</p>
                ) : (
                  <div className="space-y-1 text-[11px] font-medium text-white/95 leading-tight">
                    {Object.entries(groupedCurrentMonthEvents).map(([dateLabel, evList]) => (
                      <div key={dateLabel} className="pt-0.5">
                        <span className="font-bold text-yellow-200">{dateLabel}</span>
                        <div className="pl-1">
                          {evList.map((ev) => (
                            <p 
                              key={ev.id}
                              onClick={() => setExpandedEventId(ev.id)}
                              title="Bấm để xem chi tiết ở ô bên dưới"
                              className="hover:text-yellow-300 cursor-pointer transition-colors truncate max-w-[170px]"
                            >
                              • {ev.title}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TOP RIGHT: 2026 Bucket List (cols 12 -> 7)                */}
        {/* Compact sizing to fit inside screen                       */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="w-full h-full bg-white rounded-[26px] border-2 border-[#141414] shadow-[5px_5px_0px_#5468B4] p-3.5 md:p-4 flex flex-col justify-between">
            {/* Header: Title INSIDE Bucket list Card */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
              <h2 className="text-base md:text-lg font-black text-gray-900 tracking-tight">
                2026 Bucket list
              </h2>
              <span className="text-[11px] font-bold text-[#5468B4] bg-[#5468B4]/10 px-2.5 py-0.5 rounded-full border border-[#5468B4]/30">
                {bucketList.filter((b) => b.completed).length}/{bucketList.length} hoàn thành
              </span>
            </div>

            {/* 3 Columns Grid of Bucket List Items with Double-Click to Edit & Clear to Delete */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1.5 mb-2">
              {/* Column 1 */}
              <div className="flex flex-col gap-1.5">
                {bucketList.slice(0, 11).map((item) => {
                  const isEditing = editingGoalId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 text-left group transition-all min-h-[22px]"
                    >
                      <button
                        type="button"
                        onClick={() => toggleBucketItem(item.id)}
                        title={item.completed ? "Đánh dấu chưa hoàn thành" : "Đánh dấu đã hoàn thành"}
                        className="shrink-0 cursor-pointer"
                      >
                        <span
                          className={`w-4 h-4 rounded-full border-2 border-gray-700 shrink-0 flex items-center justify-center transition-all ${
                            item.completed
                              ? "bg-[#5468B4] border-[#5468B4] text-white"
                              : "group-hover:border-black"
                          }`}
                        >
                          {item.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                      </button>

                      {isEditing ? (
                        <input
                          autoFocus
                          type="text"
                          value={editingGoalText}
                          onChange={(e) => setEditingGoalText(e.target.value)}
                          onBlur={() => handleSaveEditedGoal(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEditedGoal(item.id);
                            if (e.key === "Escape") setEditingGoalId(null);
                          }}
                          placeholder="Xoá hết để xoá mục tiêu..."
                          className="text-[11px] md:text-xs font-medium text-gray-900 border-b-2 border-[#5468B4] bg-white rounded-xs outline-none w-full px-1 py-0.5"
                        />
                      ) : (
                        <span
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingGoalId(item.id);
                            setEditingGoalText(item.text);
                          }}
                          title="Nhấn đúp để sửa mục tiêu (xoá hết ký tự để xoá)"
                          className={`text-[11px] md:text-xs font-medium truncate flex-1 cursor-text select-text ${
                            item.completed
                              ? "line-through text-gray-400 italic"
                              : "text-gray-800 group-hover:text-black"
                          }`}
                        >
                          {item.text}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Column 2 */}
              <div className="flex flex-col gap-1.5">
                {bucketList.slice(11, 22).map((item) => {
                  const isEditing = editingGoalId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 text-left group transition-all min-h-[22px]"
                    >
                      <button
                        type="button"
                        onClick={() => toggleBucketItem(item.id)}
                        title={item.completed ? "Đánh dấu chưa hoàn thành" : "Đánh dấu đã hoàn thành"}
                        className="shrink-0 cursor-pointer"
                      >
                        <span
                          className={`w-4 h-4 rounded-full border-2 border-gray-700 shrink-0 flex items-center justify-center transition-all ${
                            item.completed
                              ? "bg-[#5468B4] border-[#5468B4] text-white"
                              : "group-hover:border-black"
                          }`}
                        >
                          {item.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                      </button>

                      {isEditing ? (
                        <input
                          autoFocus
                          type="text"
                          value={editingGoalText}
                          onChange={(e) => setEditingGoalText(e.target.value)}
                          onBlur={() => handleSaveEditedGoal(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEditedGoal(item.id);
                            if (e.key === "Escape") setEditingGoalId(null);
                          }}
                          placeholder="Xoá hết để xoá mục tiêu..."
                          className="text-[11px] md:text-xs font-medium text-gray-900 border-b-2 border-[#5468B4] bg-white rounded-xs outline-none w-full px-1 py-0.5"
                        />
                      ) : (
                        <span
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingGoalId(item.id);
                            setEditingGoalText(item.text);
                          }}
                          title="Nhấn đúp để sửa mục tiêu (xoá hết ký tự để xoá)"
                          className={`text-[11px] md:text-xs font-medium truncate flex-1 cursor-text select-text ${
                            item.completed
                              ? "line-through text-gray-400 italic"
                              : "text-gray-800 group-hover:text-black"
                          }`}
                        >
                          {item.text}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Column 3 */}
              <div className="flex flex-col gap-1.5">
                {bucketList.slice(22).map((item) => {
                  const isEditing = editingGoalId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 text-left group transition-all min-h-[22px]"
                    >
                      <button
                        type="button"
                        onClick={() => toggleBucketItem(item.id)}
                        title={item.completed ? "Đánh dấu chưa hoàn thành" : "Đánh dấu đã hoàn thành"}
                        className="shrink-0 cursor-pointer"
                      >
                        <span
                          className={`w-4 h-4 rounded-full border-2 border-gray-700 shrink-0 flex items-center justify-center transition-all ${
                            item.completed
                              ? "bg-[#5468B4] border-[#5468B4] text-white"
                              : "group-hover:border-black"
                          }`}
                        >
                          {item.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                      </button>

                      {isEditing ? (
                        <input
                          autoFocus
                          type="text"
                          value={editingGoalText}
                          onChange={(e) => setEditingGoalText(e.target.value)}
                          onBlur={() => handleSaveEditedGoal(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEditedGoal(item.id);
                            if (e.key === "Escape") setEditingGoalId(null);
                          }}
                          placeholder="Xoá hết để xoá mục tiêu..."
                          className="text-[11px] md:text-xs font-medium text-gray-900 border-b-2 border-[#5468B4] bg-white rounded-xs outline-none w-full px-1 py-0.5"
                        />
                      ) : (
                        <span
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingGoalId(item.id);
                            setEditingGoalText(item.text);
                          }}
                          title="Nhấn đúp để sửa mục tiêu (xoá hết ký tự để xoá)"
                          className={`text-[11px] md:text-xs font-medium truncate flex-1 cursor-text select-text ${
                            item.completed
                              ? "line-through text-gray-400 italic"
                              : "text-gray-800 group-hover:text-black"
                          }`}
                        >
                          {item.text}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Input Capsule */}
            <form
              onSubmit={addBucketGoal}
              className="w-full flex items-center justify-between border-2 border-[#141414] rounded-full p-1 pl-4 bg-white shadow-xs mt-auto"
            >
              <input
                type="text"
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                placeholder="Thêm mục tiêu..."
                className="w-full bg-transparent outline-none text-xs font-medium text-gray-800 placeholder-gray-400"
              />
              <button
                type="submit"
                className="shrink-0 bg-[#5468B4] hover:bg-[#46579a] text-white font-bold text-xs px-5 py-1.5 rounded-full transition-transform active:scale-95 shadow-xs cursor-pointer"
              >
                Thêm
              </button>
            </form>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM LEFT: Thêm sự kiện & ghi chú Card (cols 12 -> 8) */}
        {/* Nút lưu màu xanh đổ bóng giống calendar                   */}
        {/* Nhấn vào để sửa hashtag                                  */}
        {/* Bỏ dòng "Đồng bộ sang lịch tháng"                        */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="w-full h-full bg-white rounded-[26px] border-2 border-[#141414] shadow-[5px_5px_0px_#5468B4] p-3.5 md:p-4 flex flex-col justify-between">
            {/* Header with Title and Actions */}
            <div className="flex items-center justify-between pb-1.5">
              <h3 className="text-base md:text-lg font-black text-gray-900 tracking-tight">
                Thêm sự kiện & ghi chú
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={`w-7 h-7 rounded-lg border-2 border-gray-700 flex items-center justify-center transition-colors cursor-pointer ${
                    isBookmarked ? "bg-yellow-100 text-yellow-600 border-yellow-500" : "hover:bg-gray-100 text-gray-700"
                  }`}
                  title="Đánh dấu"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </button>
                <button
                  className="w-7 h-7 rounded-lg border-2 border-gray-700 flex items-center justify-center hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* NHẤN VÀO ĐỂ SỬA HASHTAG THEO YÊU CẦU */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {tags.map((tag, idx) => (
                editingTagIndex === idx ? (
                  <input
                    key={idx}
                    autoFocus
                    type="text"
                    value={editingTagValue}
                    onChange={(e) => setEditingTagValue(e.target.value)}
                    onBlur={() => handleSaveTag(idx)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTag(idx);
                      if (e.key === "Escape") setEditingTagIndex(null);
                    }}
                    className="text-[10px] font-semibold text-gray-800 border-2 border-[#5468B4] rounded-full px-2 py-0.5 bg-white outline-none w-20 shadow-xs"
                  />
                ) : (
                  <span
                    key={idx}
                    onClick={() => {
                      setEditingTagIndex(idx);
                      setEditingTagValue(tag);
                    }}
                    title="Bấm để sửa hashtag này"
                    className="group inline-flex items-center gap-1 text-[10px] font-medium text-gray-700 border border-gray-400 hover:border-[#5468B4] hover:text-[#5468B4] hover:bg-blue-50/70 rounded-full px-2.5 py-0.5 bg-gray-50 cursor-pointer transition-all"
                  >
                    <span>#{tag.replace(/^#+/, '')}</span>
                    <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                )
              ))}

              {/* Nút thêm hashtag mới */}
              <button
                onClick={handleAddNewTag}
                title="Thêm hashtag mới"
                className="text-[10px] font-bold text-gray-500 hover:text-[#5468B4] border border-dashed border-gray-300 hover:border-[#5468B4] rounded-full px-2 py-0.5 bg-white transition-colors cursor-pointer"
              >
                + Thêm
              </button>
            </div>

            {/* Deadline + Add Event Toggle */}
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 mb-2">
              <span>deadline : {newEventDate || "dd/mm/yyyy"}</span>
              <button
                onClick={() => setShowAddEventForm(!showAddEventForm)}
                className="text-[11px] font-bold text-[#5468B4] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{showAddEventForm ? "Đóng form" : "Thêm sự kiện"}</span>
              </button>
            </div>

            {/* Inline Add Event Form (when expanded) */}
            {showAddEventForm && (
              <form onSubmit={handleAddEvent} className="p-2.5 mb-2 bg-blue-50 border-2 border-[#5468B4] rounded-xl flex flex-col sm:flex-row gap-1.5 items-center">
                <input
                  type="text"
                  placeholder="Ngày (dd/mm/yyyy)"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="text-xs bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 w-full sm:w-32 font-mono outline-none"
                />
                <input
                  type="text"
                  placeholder="Tên sự kiện..."
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="text-xs bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 flex-1 w-full outline-none"
                />
                <button
                  type="submit"
                  className="bg-[#5468B4] hover:bg-[#46579a] text-white font-bold text-xs px-3 py-1.5 rounded-lg shrink-0 cursor-pointer shadow-xs"
                >
                  Thêm
                </button>
              </form>
            )}

            {/* Dual Content Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-2">
              {/* Left Column: Yellow Sticky Note Card WITH BLUE SAVE BUTTON WITH SHADOW (LIKE CALENDAR) */}
              <div className="bg-[#F8EFCB] rounded-2xl border-2 border-[#141414] p-3 text-xs leading-relaxed text-gray-900 shadow-[2px_2px_0px_#141414] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-black text-xs md:text-sm text-black">Nội dung</h4>
                    
                    {/* NÚT LƯU MÀU XANH CÓ ĐỔ BÓNG GIỐNG CALENDAR THEO YÊU CẦU */}
                    <button
                      onClick={handleSaveContentNote}
                      className={`px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1.5 border-2 border-[#141414] shadow-[3px_3px_0px_#141414] transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
                        isNoteSaved
                          ? "bg-emerald-600 text-white"
                          : "bg-[#5468B4] hover:bg-[#46579a] text-white"
                      }`}
                      title="Lưu lại nội dung ghi chú này"
                    >
                      {isNoteSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Đã lưu!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Lưu</span>
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    rows={4}
                    value={contentNote}
                    onChange={(e) => setContentNote(e.target.value)}
                    placeholder="Nhập nội dung ghi chú ở đây..."
                    className="w-full bg-transparent border border-yellow-500/30 focus:border-[#141414] rounded-lg p-1.5 text-xs font-medium text-gray-900 outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-yellow-500/20 mt-1">
                  <span className="text-[10px] text-gray-600 italic">
                    {isNoteSaved ? "✓ Đã lưu thành công" : "Nhấp 'Lưu' để ghi nhớ"}
                  </span>
                  <button
                    onClick={() => setContentNote(DEFAULT_CONTENT_NOTE)}
                    className="text-[10px] text-gray-600 hover:text-black underline cursor-pointer"
                  >
                    Mặc định mẫu
                  </button>
                </div>
              </div>

              {/* Right Column: Tree-list Container (ĐÃ BỎ DÒNG "Đồng bộ sang lịch tháng" THEO YÊU CẦU) */}
              <div className="bg-white rounded-2xl border-2 border-gray-300 p-2.5 text-xs text-gray-700 flex flex-col gap-1.5 max-h-[165px] overflow-y-auto">
                <div className="flex items-center justify-between pb-1 border-b border-gray-200">
                  <span className="font-bold text-gray-900 text-[11px]">Danh sách sự kiện ({events.length})</span>
                  {/* Đã bỏ dòng "Đồng bộ sang lịch tháng" */}
                </div>

                {events.map((ev) => {
                  const isExpanded = expandedEventId === ev.id;
                  return (
                    <div 
                      key={ev.id} 
                      className={`flex flex-col gap-1 rounded-lg p-1 transition-colors ${
                        isExpanded ? "bg-gray-50 border border-gray-200" : "hover:bg-gray-50/80"
                      }`}
                    >
                      <div className="flex items-center justify-between group">
                        <div
                          onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                          className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3 h-3 text-gray-600 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
                          )}
                          <span className="border border-gray-400 rounded-full px-1.5 py-0.2 text-[9px] text-gray-600 font-mono shrink-0">
                            {ev.date}
                          </span>
                          <span className={`truncate text-[11px] ${isExpanded ? "font-bold text-gray-900" : "text-gray-800"}`}>
                            {ev.title}
                          </span>
                        </div>

                        {/* Quick action: delete event */}
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          title="Xóa sự kiện này"
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 rounded transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Expanded note */}
                      {isExpanded && (
                        <div className="text-[10px] leading-relaxed text-gray-600 pl-5 pr-1 pt-1 border-t border-gray-200/60 font-medium">
                          {ev.note ? (
                            <p>{ev.note}</p>
                          ) : (
                            <p className="italic text-gray-400">Không có ghi chú thêm.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Footnote matching the screenshot */}
            <div className="pt-1 text-[10px] text-gray-500 italic leading-tight border-t border-gray-100 truncate">
              <p>
                Ghi chú: {contentNote.slice(0, 160)}...
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM RIGHT: Bảng kê tiền mặt Card (cols 12 -> 4) */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="w-full h-full bg-[#F8EFCB] rounded-[26px] border-2 border-[#141414] shadow-[5px_5px_0px_#141414] p-3.5 md:p-4 flex flex-col justify-between">
            {/* Header */}
            <h3 className="text-base md:text-lg font-black text-gray-900 text-center mb-2 tracking-tight">
              Bảng kê tiền mặt
            </h3>

            {/* Inner White Receipt Card */}
            <div className="bg-white rounded-2xl border-2 border-gray-300 p-3 shadow-xs flex flex-col justify-between">
              {/* Denominations table */}
              <div className="flex flex-col gap-1 font-mono text-[11px] md:text-xs text-gray-800">
                {cashItems.map((item, idx) => {
                  const subtotal = item.denom * item.qty;
                  return (
                    <div
                      key={item.denom}
                      className="flex items-center justify-between hover:bg-gray-50 px-1 py-0.5 rounded transition-colors group"
                    >
                      {/* Denomination */}
                      <span className="font-semibold w-14 text-right">
                        {item.denom.toLocaleString("vi-VN")}
                      </span>

                      <span className="text-gray-400 text-[10px]">*</span>

                      {/* Quantity with quick buttons on hover */}
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => updateCashQty(idx, -1)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-black w-3.5 h-3.5 flex items-center justify-center rounded text-[10px] cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) =>
                            setCashQtyDirect(idx, parseInt(e.target.value) || 0)
                          }
                          className="w-7 text-center font-bold bg-transparent border-b border-transparent group-hover:border-gray-300 focus:outline-none"
                        />
                        <button
                          onClick={() => updateCashQty(idx, 1)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-black w-3.5 h-3.5 flex items-center justify-center rounded text-[10px] cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-gray-400 text-[10px]">=</span>

                      {/* Subtotal */}
                      <span className="font-bold w-20 text-right">
                        {subtotal.toLocaleString("vi-VN")}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Total Line */}
              <div className="pt-2 mt-2 border-t-2 border-black flex flex-col items-end">
                <div className="flex items-center justify-between w-full font-mono font-black text-xs md:text-sm">
                  <button
                    onClick={resetCash}
                    title="Khôi phục mặc định ban đầu"
                    className="text-[10px] text-gray-400 hover:text-gray-700 flex items-center gap-1 font-sans cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Đặt lại</span>
                  </button>
                  <span className="text-right tracking-wider">
                    {computedCashTotal.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
