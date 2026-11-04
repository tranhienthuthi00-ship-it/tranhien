import React, { useState, useMemo } from "react";
import { Check, Bookmark, X, ChevronRight, ChevronDown, Plus, RotateCcw, Save, Trash2, Calendar as CalendarIcon, Sparkles } from "lucide-react";

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
    note: "Chuyến dã ngoại dã ngoại cuối tuần cùng nhóm bạn"
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

export function AioHomeDashboard({
  onNavigate,
  onOpenClassicJournal,
}: {
  onNavigate?: (tab: string) => void;
  onOpenClassicJournal?: () => void;
}) {
  // Calendar state (defaults to day 9 as in screenshot)
  const [selectedDay, setSelectedDay] = useState<number>(9);

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

  // New event form state
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("09/11/2026");
  const [newEventNote, setNewEventNote] = useState("");
  const [showAddEventForm, setShowAddEventForm] = useState(false);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    // derive dayMonth from date string (e.g. "09/11/2026" -> "9/11")
    let dayMonth = "9/11";
    const parts = newEventDate.split("/");
    if (parts.length >= 2) {
      const d = parseInt(parts[0], 10) || 1;
      const m = parseInt(parts[1], 10) || 11;
      dayMonth = `${d}/${m}`;
    }

    const newEv: DashboardEvent = {
      id: "ev-" + Date.now(),
      date: newEventDate.trim() || "09/11/2026",
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
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: DashboardEvent[] } = {};
    events.forEach((ev) => {
      const key = ev.dayMonth || "Sự kiện";
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    });
    return groups;
  }, [events]);

  // Days in November that have events
  const daysWithEvents = useMemo(() => {
    const daySet = new Set<number>();
    events.forEach((ev) => {
      const parts = ev.date.split("/");
      if (parts.length >= 2) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (m === 11 && !isNaN(d)) {
          daySet.add(d);
        }
      }
    });
    return daySet;
  }, [events]);

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

  // Cash denomination state
  const [cashItems, setCashItems] = useState<CashItem[]>(() => {
    try {
      const saved = localStorage.getItem("aio_cash_breakdown");
      return saved ? JSON.parse(saved) : DEFAULT_CASH_LIST;
    } catch {
      return DEFAULT_CASH_LIST;
    }
  });

  const saveCash = (items: CashItem[]) => {
    setCashItems(items);
    try {
      localStorage.setItem("aio_cash_breakdown", JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  };

  const updateCashQty = (index: number, delta: number) => {
    const updated = [...cashItems];
    updated[index].qty = Math.max(0, updated[index].qty + delta);
    saveCash(updated);
  };

  const setCashQtyDirect = (index: number, val: number) => {
    const updated = [...cashItems];
    updated[index].qty = Math.max(0, val);
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

  // Hashtags
  const [tags, setTags] = useState(["hastag", "hastag", "hastag", "hastag"]);
  const [isBookmarked, setIsBookmarked] = useState(false);

  return (
    <div className="w-full max-w-[1520px] mx-auto py-3 px-2 sm:px-4 md:px-6 select-none font-sans">
      {/* Optional top switcher to classic journal */}
      {onOpenClassicJournal && (
        <div className="flex justify-end mb-3">
          <button
            onClick={onOpenClassicJournal}
            className="text-xs font-bold text-gray-500 hover:text-ink px-3 py-1.5 rounded-full border border-gray-300 hover:border-black bg-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>📖 Xem giao diện Nhật ký chi tiết & Sổ cái</span>
          </button>
        </div>
      )}

      {/* 2x2 Grid matching the screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* TOP LEFT: November Calendar & Events Card (cols 12 -> 5) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-wide mb-2 text-center">
            November
          </h2>

          <div className="w-full bg-[#5468B4] text-white rounded-[32px] border-2 border-[#141414] shadow-[6px_6px_0px_#141414] p-5 md:p-6 flex flex-col justify-between min-h-[460px]">
            {/* Days Header */}
            <div className="grid grid-cols-7 text-center font-bold text-sm md:text-base tracking-wider mb-3 text-white/95">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Days Grid (Nov 1 to 30) */}
            <div className="grid grid-cols-7 text-center gap-y-3 font-semibold text-base md:text-lg mb-4">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                const isSelected = selectedDay === day;
                const hasEvent = daysWithEvents.has(day);

                return (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDay(day);
                      // Update default date for new event to this day
                      const dayStr = day < 10 ? `0${day}` : `${day}`;
                      setNewEventDate(`${dayStr}/11/2026`);
                    }}
                    className="relative flex flex-col items-center justify-center h-9 w-9 mx-auto transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    {isSelected ? (
                      <span className="w-9 h-9 rounded-full bg-[#1c2541] border border-black/30 text-white flex items-center justify-center font-bold shadow-inner">
                        {day}
                      </span>
                    ) : (
                      <span className="text-white hover:text-yellow-200">
                        {day}
                      </span>
                    )}

                    {/* Small event indicator dot */}
                    {hasEvent && !isSelected && (
                      <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-yellow-300" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Section: Cartoon Avatar + DYNAMIC Event List from bottom card */}
            <div className="flex items-end justify-between pt-2 border-t border-white/20 mt-auto">
              {/* Curly hair cartoon illustration matching the image */}
              <div className="relative w-32 h-32 md:w-36 md:h-36 shrink-0 -mb-2">
                <svg
                  viewBox="0 0 160 160"
                  className="w-full h-full drop-shadow-md overflow-visible"
                >
                  {/* Afro / Curly hair cloud */}
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

                  {/* Body / Shirt */}
                  <path
                    d="M 45 155 Q 80 135 115 155 L 125 160 L 35 160 Z"
                    fill="#3b4c8a"
                  />
                  <path
                    d="M 68 140 L 80 152 L 92 140 Z"
                    fill="#ffffff"
                    stroke="#141414"
                    strokeWidth="2"
                  />

                  {/* Face */}
                  <rect
                    x="56"
                    y="80"
                    width="48"
                    height="50"
                    rx="18"
                    fill="#f6d5be"
                    stroke="#141414"
                    strokeWidth="2.5"
                  />

                  {/* Ears */}
                  <circle
                    cx="54"
                    cy="98"
                    r="7"
                    fill="#f6d5be"
                    stroke="#141414"
                    strokeWidth="2"
                  />
                  <circle
                    cx="106"
                    cy="98"
                    r="7"
                    fill="#f6d5be"
                    stroke="#141414"
                    strokeWidth="2"
                  />

                  {/* Glasses frame (yellow/tan) */}
                  <rect
                    x="58"
                    y="88"
                    width="19"
                    height="16"
                    rx="4"
                    fill="#ffffff"
                    stroke="#facc15"
                    strokeWidth="3.5"
                  />
                  <rect
                    x="83"
                    y="88"
                    width="19"
                    height="16"
                    rx="4"
                    fill="#ffffff"
                    stroke="#facc15"
                    strokeWidth="3.5"
                  />
                  <line
                    x1="77"
                    y1="95"
                    x2="83"
                    y2="95"
                    stroke="#facc15"
                    strokeWidth="3.5"
                  />

                  {/* Eyes looking to the right */}
                  <circle cx="70" cy="95" r="2.5" fill="#141414" />
                  <circle cx="95" cy="95" r="2.5" fill="#141414" />

                  {/* Nose */}
                  <path
                    d="M 78 106 Q 80 109 83 107"
                    fill="none"
                    stroke="#141414"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Smile */}
                  <path
                    d="M 74 116 Q 80 121 86 116"
                    fill="none"
                    stroke="#141414"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Event List - Dynamically synchronized with bottom events! */}
              <div className="flex flex-col text-right pl-4 max-h-[180px] overflow-y-auto pr-1">
                <div className="flex items-center justify-end gap-1 text-[#fde047] font-black text-sm md:text-base tracking-wide mb-2 sticky top-0 bg-[#5468B4] py-0.5">
                  <span>✦</span>
                  <span>Sự kiện tháng này</span>
                </div>

                {Object.keys(groupedEvents).length === 0 ? (
                  <p className="text-xs text-white/70 italic">Chưa có sự kiện nào</p>
                ) : (
                  <div className="space-y-1.5 text-xs md:text-sm font-medium text-white/95 leading-snug">
                    {Object.entries(groupedEvents).map(([dateLabel, evList]) => (
                      <div key={dateLabel} className="pt-0.5">
                        <span className="font-bold text-yellow-200">{dateLabel}</span>
                        <div className="pl-2">
                          {evList.map((ev) => (
                            <p 
                              key={ev.id}
                              onClick={() => setExpandedEventId(ev.id)}
                              title="Bấm để xem chi tiết ở ô bên dưới"
                              className="hover:text-yellow-300 cursor-pointer transition-colors"
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
        {/* TOP RIGHT: 2026 Bucket List (cols 12 -> 7) */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-wide mb-2 text-center">
            2026 Bucket list
          </h2>

          <div className="w-full bg-white rounded-[32px] border-2 border-[#141414] shadow-[6px_6px_0px_#5468B4] p-5 md:p-7 flex flex-col justify-between min-h-[460px]">
            {/* 3 Columns Grid of Bucket List Items */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 mb-6">
              {/* Column 1 */}
              <div className="flex flex-col gap-2.5">
                {bucketList.slice(0, 11).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleBucketItem(item.id)}
                    className="flex items-center gap-2.5 text-left group transition-all cursor-pointer"
                  >
                    <span
                      className={`w-5 h-5 rounded-full border-2 border-gray-700 shrink-0 flex items-center justify-center transition-all ${
                        item.completed
                          ? "bg-[#5468B4] border-[#5468B4] text-white"
                          : "group-hover:border-black"
                      }`}
                    >
                      {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                    <span
                      className={`text-xs md:text-sm font-semibold truncate ${
                        item.completed
                          ? "line-through text-gray-400 font-normal italic"
                          : "text-gray-800 group-hover:text-black"
                      }`}
                    >
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>

              {/* Column 2 */}
              <div className="flex flex-col gap-2.5">
                {bucketList.slice(11, 22).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleBucketItem(item.id)}
                    className="flex items-center gap-2.5 text-left group transition-all cursor-pointer"
                  >
                    <span
                      className={`w-5 h-5 rounded-full border-2 border-gray-700 shrink-0 flex items-center justify-center transition-all ${
                        item.completed
                          ? "bg-[#5468B4] border-[#5468B4] text-white"
                          : "group-hover:border-black"
                      }`}
                    >
                      {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                    <span
                      className={`text-xs md:text-sm font-semibold truncate ${
                        item.completed
                          ? "line-through text-gray-400 font-normal italic"
                          : "text-gray-800 group-hover:text-black"
                      }`}
                    >
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>

              {/* Column 3 */}
              <div className="flex flex-col gap-2.5">
                {bucketList.slice(22).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleBucketItem(item.id)}
                    className="flex items-center gap-2.5 text-left group transition-all cursor-pointer"
                  >
                    <span
                      className={`w-5 h-5 rounded-full border-2 border-gray-700 shrink-0 flex items-center justify-center transition-all ${
                        item.completed
                          ? "bg-[#5468B4] border-[#5468B4] text-white"
                          : "group-hover:border-black"
                      }`}
                    >
                      {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                    <span
                      className={`text-xs md:text-sm font-semibold truncate ${
                        item.completed
                          ? "line-through text-gray-400 font-normal italic"
                          : "text-gray-800 group-hover:text-black"
                      }`}
                    >
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Input Capsule */}
            <form
              onSubmit={addBucketGoal}
              className="w-full flex items-center justify-between border-2 border-[#141414] rounded-full p-1 pl-5 bg-white shadow-sm mt-auto"
            >
              <input
                type="text"
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                placeholder="Thêm mục tiêu..."
                className="w-full bg-transparent outline-none text-xs md:text-sm font-medium text-gray-800 placeholder-gray-400"
              />
              <button
                type="submit"
                className="shrink-0 bg-[#5468B4] hover:bg-[#46579a] text-white font-bold text-xs md:text-sm px-7 py-2.5 rounded-full transition-transform active:scale-95 shadow-sm cursor-pointer"
              >
                Thêm
              </button>
            </form>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM LEFT: Thêm sự kiện & ghi chú Card (cols 12 -> 8) */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="w-full bg-white rounded-[32px] border-2 border-[#141414] shadow-[6px_6px_0px_#5468B4] p-6 md:p-8 flex flex-col justify-between">
            {/* Header with Title and Actions */}
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                Thêm sự kiện & ghi chú
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={`w-8 h-8 rounded-lg border-2 border-gray-700 flex items-center justify-center transition-colors cursor-pointer ${
                    isBookmarked ? "bg-yellow-100 text-yellow-600 border-yellow-500" : "hover:bg-gray-100 text-gray-700"
                  }`}
                  title="Đánh dấu"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                <button
                  className="w-8 h-8 rounded-lg border-2 border-gray-700 flex items-center justify-center hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tags row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium text-gray-600 border border-gray-400 rounded-full px-3 py-0.5 bg-gray-50"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Deadline + Add Event Toggle */}
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-4">
              <span>deadline : {newEventDate || "dd/mm/yyyy"}</span>
              <button
                onClick={() => setShowAddEventForm(!showAddEventForm)}
                className="text-xs font-bold text-[#5468B4] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddEventForm ? "Đóng form thêm" : "Thêm sự kiện mới vào lịch"}</span>
              </button>
            </div>

            {/* Inline Add Event Form (when expanded) */}
            {showAddEventForm && (
              <form onSubmit={handleAddEvent} className="p-3 mb-4 bg-blue-50 border-2 border-[#5468B4] rounded-2xl flex flex-col md:flex-row gap-2 items-center">
                <input
                  type="text"
                  placeholder="Ngày (dd/mm/yyyy ví dụ: 09/11/2026)"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="text-xs bg-white border border-gray-300 rounded-xl px-3 py-2 w-full md:w-36 font-mono outline-none"
                />
                <input
                  type="text"
                  placeholder="Tên sự kiện (ví dụ: Sinh nhật, Họp nhóm...)"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="text-xs bg-white border border-gray-300 rounded-xl px-3 py-2 flex-1 w-full outline-none"
                />
                <button
                  type="submit"
                  className="bg-[#5468B4] hover:bg-[#46579a] text-white font-bold text-xs px-4 py-2 rounded-xl shrink-0 cursor-pointer shadow-xs"
                >
                  Thêm sự kiện
                </button>
              </form>
            )}

            {/* Dual Content Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Left Column: Yellow Sticky Note Card WITH SAVE BUTTON */}
              <div className="bg-[#FEF08A] rounded-2xl border-2 border-[#141414] p-4 text-xs leading-relaxed text-gray-900 shadow-[2px_2px_0px_#141414] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-black text-sm text-black">Nội dung</h4>
                    
                    {/* NÚT LƯU THEO YÊU CẦU CỦA NGƯỜI DÙNG */}
                    <button
                      onClick={handleSaveContentNote}
                      className={`px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_#141414] transition-all active:scale-95 cursor-pointer ${
                        isNoteSaved
                          ? "bg-emerald-600 text-white border-2 border-[#141414]"
                          : "bg-[#141414] hover:bg-black text-white border-2 border-[#141414]"
                      }`}
                      title="Lưu lại nội dung ghi chú này"
                    >
                      {isNoteSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
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
                    rows={7}
                    value={contentNote}
                    onChange={(e) => setContentNote(e.target.value)}
                    placeholder="Nhập nội dung ghi chú ở đây..."
                    className="w-full bg-transparent border border-yellow-400/60 focus:border-[#141414] rounded-xl p-2 font-medium text-gray-900 outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-yellow-400/40 mt-1">
                  <span className="text-[10px] text-gray-600 italic">
                    {isNoteSaved ? "✓ Đã tự động lưu thành công" : "Nhấp 'Lưu' để ghi nhớ nội dung"}
                  </span>
                  <button
                    onClick={() => setContentNote(DEFAULT_CONTENT_NOTE)}
                    className="text-[10px] text-gray-600 hover:text-black underline cursor-pointer"
                  >
                    Mặc định mẫu
                  </button>
                </div>
              </div>

              {/* Right Column: Tree-list Container (Dữ liệu sự kiện đồng bộ với phía trên) */}
              <div className="bg-white rounded-2xl border-2 border-gray-300 p-3.5 text-xs text-gray-700 flex flex-col gap-2.5 max-h-[250px] overflow-y-auto">
                <div className="flex items-center justify-between pb-1 border-b border-gray-200">
                  <span className="font-bold text-gray-900 text-xs">Danh sách sự kiện ({events.length})</span>
                  <span className="text-[10px] text-gray-400">Đồng bộ sang lịch tháng</span>
                </div>

                {events.map((ev) => {
                  const isExpanded = expandedEventId === ev.id;
                  return (
                    <div 
                      key={ev.id} 
                      className={`flex flex-col gap-1 rounded-xl p-1.5 transition-colors ${
                        isExpanded ? "bg-gray-50 border border-gray-200" : "hover:bg-gray-50/80"
                      }`}
                    >
                      <div className="flex items-center justify-between group">
                        <div
                          onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                          className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          )}
                          <span className="border border-gray-400 rounded-full px-2 py-0.5 text-[10px] text-gray-600 font-mono shrink-0">
                            {ev.date}
                          </span>
                          <span className={`truncate font-medium ${isExpanded ? "font-bold text-gray-900" : "text-gray-800"}`}>
                            {ev.title}
                          </span>
                        </div>

                        {/* Quick action: delete event */}
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          title="Xóa sự kiện này"
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Expanded note */}
                      {isExpanded && (
                        <div className="text-[11px] leading-relaxed text-gray-600 pl-6 pr-2 pt-1 border-t border-gray-200/60 font-medium">
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
            <div className="pt-2 text-[11px] text-gray-500 italic leading-relaxed border-t border-gray-100">
              <p>
                Ghi chú: {contentNote.slice(0, 180)}...
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM RIGHT: Bảng kê tiền mặt Card (cols 12 -> 4) */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="w-full bg-[#FEF08A] rounded-[32px] border-2 border-[#141414] shadow-[6px_6px_0px_#141414] p-6 flex flex-col">
            {/* Header */}
            <h3 className="text-xl md:text-2xl font-black text-gray-900 text-center mb-5 tracking-tight">
              Bảng kê tiền mặt
            </h3>

            {/* Inner White Receipt Card */}
            <div className="bg-white rounded-2xl border-2 border-gray-300 p-5 shadow-sm flex flex-col justify-between min-h-[360px]">
              {/* Denominations table */}
              <div className="flex flex-col gap-2.5 font-mono text-xs md:text-sm text-gray-800">
                {cashItems.map((item, idx) => {
                  const subtotal = item.denom * item.qty;
                  return (
                    <div
                      key={item.denom}
                      className="flex items-center justify-between hover:bg-gray-50 px-1 py-0.5 rounded transition-colors group"
                    >
                      {/* Denomination */}
                      <span className="font-semibold w-16 text-right">
                        {item.denom.toLocaleString("vi-VN")}
                      </span>

                      <span className="text-gray-400 text-xs">*</span>

                      {/* Quantity with quick buttons on hover */}
                      <div className="flex items-center gap-1">
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
                          className="w-8 text-center font-bold bg-transparent border-b border-transparent group-hover:border-gray-300 focus:outline-none"
                        />
                        <button
                          onClick={() => updateCashQty(idx, 1)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-black w-3.5 h-3.5 flex items-center justify-center rounded text-[10px] cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-gray-400 text-xs">=</span>

                      {/* Subtotal */}
                      <span className="font-bold w-24 text-right">
                        {subtotal.toLocaleString("vi-VN")}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Total Line */}
              <div className="pt-3 mt-4 border-t-2 border-black flex flex-col items-end">
                <div className="flex items-center justify-between w-full font-mono font-black text-sm md:text-base">
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
