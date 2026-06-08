import React, { useState, useEffect, useRef, MouseEvent } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths, 
  getDay,
  parseISO
} from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Plus, 
  Trash2, 
  Camera, 
  Check, 
  X, 
  Sliders, 
  Heart, 
  MapPin, 
  RotateCcw,
  BookOpen,
  Edit,
  CircleDot
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LogEntry } from "@/types";

export function HandDrawnIcon({ type, className, style }: { type: string, className?: string, style?: React.CSSProperties }) {
  const baseProps = {
    width: "24", height: "24", viewBox: "0 0 100 100", fill: "none", 
    stroke: "currentColor", strokeWidth: "6", strokeLinecap: "round" as const, 
    strokeLinejoin: "round" as const, style: { filter: 'url(#hand-drawn-filter)', ...style },
    className
  };
  
  switch (type) {
    case 'star':
      return (
        <svg {...baseProps}>
          <path d="M 50 10 L 60 40 L 95 45 L 70 65 L 75 95 L 50 80 L 25 95 L 30 65 L 5 45 L 40 40 Z" fill="#FDFBF7" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...baseProps}>
          <path d="M 50 30 C 50 30 40 10 20 15 C 5 20 10 50 50 90 C 90 50 95 20 80 15 C 60 10 50 30 50 30 Z" fill="#FDFBF7" />
        </svg>
      );
    case 'anchor':
      return (
        <svg {...baseProps}>
          <path d="M 50 20 L 50 80" />
          <path d="M 35 30 L 65 30" />
          <circle cx="50" cy="15" r="5" fill="#FDFBF7" />
          <path d="M 20 60 Q 50 95 80 60" />
          <path d="M 15 65 L 25 55" />
          <path d="M 85 65 L 75 55" />
        </svg>
      );
    case 'coffee':
      return (
        <svg {...baseProps}>
          <path d="M 25 30 Q 50 25 75 30 L 70 80 Q 50 95 30 80 Z" fill="#FDFBF7" />
          <path d="M 75 40 Q 95 40 90 60 Q 70 65 72 65" />
          <path d="M 40 10 Q 50 20 40 25" />
          <path d="M 60 15 Q 70 25 60 30" />
        </svg>
      );
    case 'moon':
      return (
        <svg {...baseProps}>
          <path d="M 30 20 Q 75 25 70 85 Q 90 60 75 15 Z" fill="#FDFBF7" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...baseProps}>
          <circle cx="50" cy="50" r="15" fill="#FDFBF7" />
          <path d="M 50 10 L 50 25" />
          <path d="M 50 75 L 50 90" />
          <path d="M 10 50 L 25 50" />
          <path d="M 75 50 L 90 50" />
          <path d="M 22 22 L 32 32" />
          <path d="M 68 68 L 78 78" />
          <path d="M 22 78 L 32 68" />
          <path d="M 68 22 L 78 32" />
        </svg>
      );
    case 'cloud':
      return (
        <svg {...baseProps}>
          <path d="M 20 60 Q 15 40 35 35 Q 50 20 65 35 Q 85 40 80 60 Q 90 75 70 85 L 30 85 Q 10 75 20 60 Z" fill="#FDFBF7" />
        </svg>
      );
    case 'book':
      return (
        <svg {...baseProps}>
          <path d="M 15 25 Q 50 20 50 85 Q 15 90 15 25" fill="#FDFBF7" />
          <path d="M 85 25 Q 50 20 50 85 Q 85 90 85 25" fill="#FDFBF7" />
          <path d="M 25 40 H 40" />
          <path d="M 25 55 H 40" />
          <path d="M 60 40 H 75" />
          <path d="M 60 55 H 75" />
        </svg>
      );
    case 'gift':
      return (
        <svg {...baseProps}>
          <path d="M 20 40 H 80 V 85 H 20 Z" fill="#FDFBF7" />
          <path d="M 15 30 H 85 V 45 H 15 Z" fill="#FDFBF7" />
          <path d="M 50 30 V 85" />
          <path d="M 50 30 Q 30 5 20 30" />
          <path d="M 50 30 Q 70 5 80 30" />
        </svg>
      );
    default:
      return (
        <svg {...baseProps}>
          <path d="M 20 20 H 80 V 80 H 20 Z" />
          <path d="M 30 30 L 70 70" />
          <path d="M 70 30 L 30 70" />
        </svg>
      );
  }
}

// Preset Colored SVG Doodles that look handdrawn to overlay on specific calendar days
function PolaroidPreset({ type, className }: { type: string, className?: string }) {
  switch (type) {
    case 'notebook':
      return (
        <svg className={cn("w-7 h-7 text-indigo-600/90", className)} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 20 15 H 80 V 85 H 20 Z" fill="#EEF2FF" />
          <path d="M 32 15 V 85" strokeWidth="4" strokeDasharray="3 3" />
          <path d="M 45 35 H 70" strokeWidth="4" />
          <path d="M 45 50 H 70" strokeWidth="4" />
          <path d="M 45 65 H 70" strokeWidth="4" />
        </svg>
      );
    case 'grocery':
      return (
        <svg className={cn("w-7 h-7 text-amber-800/95", className)} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 30 45 L 35 85 Q 50 92 65 85 L 70 45 Z" fill="#FEF3C7" />
          <path d="M 42 45 Q 52 28 46 12 Q 58 10 56 22 L 48 45" strokeWidth="7" stroke="currentColor"/> {/* Bread baguette */}
          <path d="M 38 65 Q 50 72 62 65" strokeWidth="4" />
          <circle cx="55" cy="55" r="5" fill="#10B981" stroke="none" />
        </svg>
      );
    case 'flowers':
      return (
        <svg className={cn("w-7 h-7 text-rose-600/90", className)} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 50 85 L 38 52 Q 50 42 62 52 Z" fill="#FDF2F8" />
          {/* Flower buds */}
          <circle cx="42" cy="36" r="10" fill="#FECDD3" stroke="currentColor" strokeWidth="4" />
          <circle cx="58" cy="36" r="10" fill="#FECDD3" stroke="currentColor" strokeWidth="4" />
          <circle cx="50" cy="22" r="11" fill="#FDA4AF" stroke="currentColor" strokeWidth="4" />
          <circle cx="50" cy="22" r="2.5" fill="#EA580C" stroke="none" />
          <path d="M 42 36 L 50 85" strokeWidth="3" />
          <path d="M 58 36 L 50 85" strokeWidth="3" />
        </svg>
      );
    case 'journal':
      return (
        <svg className={cn("w-7 h-7 text-pink-600/90", className)} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 25 15 H 75 V 85 H 25 Z" fill="#FCE7F3" />
          <rect x="35" y="28" width="30" height="38" rx="2" fill="#fff" strokeWidth="4" />
          <path d="M 40 40 H 60" strokeWidth="3" />
          <path d="M 40 52 H 60" strokeWidth="3" />
          <circle cx="50" cy="74" r="3.5" fill="#DB2777" stroke="none" />
        </svg>
      );
    case 'closet':
      return (
        <svg className={cn("w-7 h-7 text-indigo-900", className)} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 50 24 Q 50 14 42 16 Q 38 20 50 28" strokeWidth="5" />
          <path d="M 20 38 L 50 28 L 80 38 L 68 85 H 32 Z" fill="#EEF2FF" />
          <line x1="20" y1="38" x2="80" y2="38" strokeWidth="5" />
          <circle cx="50" cy="55" r="4" fill="#DB2777" stroke="none" />
        </svg>
      );
    case 'ideas':
      return (
        <svg className={cn("w-7 h-7 text-yellow-600/90", className)} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 50 50 A 18 18 0 1 0 50 14 A 18 18 0 0 0 50 50 Z" fill="#FEF9C3" />
          <path d="M 42 60 H 58 V 75 H 42 Z" fill="#E2E8F0" />
          <path d="M 45 75 L 42 88 H 58 L 55 75" />
          <line x1="50" y1="20" x2="50" y2="32" strokeWidth="4" stroke="currentColor" />
        </svg>
      );
    case 'coffee':
      return (
        <svg className={cn("w-7 h-7 text-amber-700/90", className)} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 25 35 H 75 L 70 80 Q 50 90 30 80 Z" fill="#FFFBEB" />
          <path d="M 75 45 Q 88 45 85 60 Q 72 63 72 63" strokeWidth="5" />
          <path d="M 40 14 Q 45 20 40 25" strokeWidth="3" />
          <path d="M 55 16 Q 60 22 55 28" strokeWidth="3" />
        </svg>
      );
    case 'tree':
      return (
        <svg className={cn("w-7 h-7 text-emerald-800/90", className)} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 50 40 L 35 58 H 65 Z" fill="#D1FAE5" />
          <path d="M 50 16 L 25 40 H 75 Z" fill="#D1FAE5" />
          <rect x="46" y="58" width="8" height="25" fill="#78350F" stroke="none" />
          {/* ground log */}
          <line x1="30" y1="83" x2="70" y2="83" strokeWidth="5" />
        </svg>
      );
    case 'sun':
      return (
        <svg className={cn("w-7 h-7 text-amber-500", className)} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="50" cy="50" r="18" fill="#FEF08A" />
          <path d="M 50 15 V 23" />
          <path d="M 50 77 V 85" />
          <path d="M 15 50 H 23" />
          <path d="M 77 50 H 85" />
          <path d="M 25 25 L 32 32" strokeWidth="5" />
          <path d="M 68 68 L 75 75" strokeWidth="5" />
        </svg>
      );
    default:
      return null;
  }
}

const STICKER_PRESETS = [
  { id: "none", label: "❌ Không Sticker" },
  { id: "notebook", label: "📔 Sổ Mở", visual: "notebook" },
  { id: "grocery", label: "🥖 Túi Đồ Ăn", visual: "grocery" },
  { id: "flowers", label: "💐 Bó Hoa", visual: "flowers" },
  { id: "journal", label: "📕 Tập Nhật Ký", visual: "journal" },
  { id: "closet", label: "👗 Váy Xinh", visual: "closet" },
  { id: "ideas", label: "💡 Bóng Ý Tưởng", visual: "ideas" },
  { id: "coffee", label: "☕ Ly Cà Phê", visual: "coffee" },
  { id: "tree", label: "🌲 Cây Xanh", visual: "tree" },
  { id: "sun", label: "☀️ Mặt Trời", visual: "sun" }
];

interface CalendarViewProps {
  logs: LogEntry[];
  setLogs: (logs: LogEntry[]) => void;
}

export function CalendarView({ logs, setLogs }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [viewMode, setViewMode] = useState<'Month' | 'Year'>('Month');

  // Input states
  const [logText, setLogText] = useState("");
  const [logType, setLogType] = useState<'Reflection' | 'Event'>('Reflection');
  const [selectedIcon, setSelectedIcon] = useState('document');
  const [eventTime, setEventTime] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Month-Specific visual assets saved in LocalStorage
  const monthStr = format(currentDate, "yyyy-MM");

  // Editable theme tagline: e.g. "GLOW UP SEASON"
  const [themeTagline, setThemeTagline] = useState(() => {
    return localStorage.getItem(`studyHub_calendarSubtitle_${monthStr}`) || "GLOW UP SEASON";
  });
  const [isEditingTagline, setIsEditingTagline] = useState(false);
  const [taglineDraft, setTaglineDraft] = useState(themeTagline);

  // Responsive panel toggle for mobile drawer
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Bottom Notes section data - 3 intention statements
  const [notesList, setNotesList] = useState<string[]>(() => {
    const saved = localStorage.getItem(`studyHub_calendarNotes_${monthStr}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 3) return parsed;
      } catch (e) {}
    }
    return [
      "This month I am becoming the version of me I've been dreaming about.",
      "This month I am creating habits that future me will thank me for.",
      "This month I am focusing on consistency over intensity."
    ];
  });
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [noteEditVal, setNoteEditVal] = useState("");

  // Polaroid day images: Preset sticker IDs or user-uploaded base64 string
  const [dayStickers, setDayStickers] = useState<Record<string, { type: 'preset' | 'upload'; data: string }>>(() => {
    const saved = localStorage.getItem(`studyHub_calendarDayPics_${monthStr}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  // Circle highlight ring states (which days are ring highlighted like Day 30 in photo)
  const [dayRings, setDayRings] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(`studyHub_calendarRings_${monthStr}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  const ICONS = ['document', 'star', 'heart', 'anchor', 'coffee', 'moon', 'sun', 'cloud', 'book', 'gift'];

  // Handle month selection load changes
  useEffect(() => {
    const currentMonth = format(currentDate, "yyyy-MM");
    const savedTag = localStorage.getItem(`studyHub_calendarSubtitle_${currentMonth}`) || "GLOW UP SEASON";
    setThemeTagline(savedTag);
    setTaglineDraft(savedTag);

    const savedNotes = localStorage.getItem(`studyHub_calendarNotes_${currentMonth}`);
    if (savedNotes) {
      try {
        setNotesList(JSON.parse(savedNotes));
      } catch (e) {
        setNotesList([
          "This month I am becoming the version of me I've been dreaming about.",
          "This month I am creating habits that future me will thank me for.",
          "This month I am focusing on consistency over intensity."
        ]);
      }
    } else {
      setNotesList([
        "This month I am becoming the version of me I've been dreaming about.",
        "This month I am creating habits that future me will thank me for.",
        "This month I am focusing on consistency over intensity."
      ]);
    }

    const savedPics = localStorage.getItem(`studyHub_calendarDayPics_${currentMonth}`);
    if (savedPics) {
      try {
        setDayStickers(JSON.parse(savedPics));
      } catch (e) {
        setDayStickers({});
      }
    } else {
      setDayStickers({});
    }

    const savedRings = localStorage.getItem(`studyHub_calendarRings_${currentMonth}`);
    if (savedRings) {
      try {
        setDayRings(JSON.parse(savedRings));
      } catch (e) {
        setDayRings({});
      }
    } else {
      setDayRings({});
    }
  }, [currentDate]);

  // Persists top subtitle tagline
  const handleSaveTagline = () => {
    const cleanTag = taglineDraft.trim() || "MONTHLY PLANNER";
    setThemeTagline(cleanTag);
    localStorage.setItem(`studyHub_calendarSubtitle_${monthStr}`, cleanTag);
    setIsEditingTagline(false);
  };

  // Persists bottom 3 intention line notes
  const handleSaveNoteLine = (idx: number) => {
    const updated = [...notesList];
    updated[idx] = noteEditVal.trim() || `Intention line ${idx + 1}...`;
    setNotesList(updated);
    localStorage.setItem(`studyHub_calendarNotes_${monthStr}`, JSON.stringify(updated));
    setEditingNoteIndex(null);
  };

  // Toggle Red Scribbled Pencil Ring on selected day (like Day 30 monthly reflection highlights)
  const toggleDayRing = (dateStr: string) => {
    const updated = { ...dayRings, [dateStr]: !dayRings[dateStr] };
    setDayRings(updated);
    localStorage.setItem(`studyHub_calendarRings_${monthStr}`, JSON.stringify(updated));
  };

  // Set sticker preset or custom file upload for specified Date
  const setDayStickerValue = (dateStr: string, stickerId: string, imageBase64?: string) => {
    const updated = { ...dayStickers };
    if (stickerId === "none" && !imageBase64) {
      delete updated[dateStr];
    } else if (imageBase64) {
      updated[dateStr] = { type: 'upload', data: imageBase64 };
    } else {
      updated[dateStr] = { type: 'preset', data: stickerId };
    }
    setDayStickers(updated);
    localStorage.setItem(`studyHub_calendarDayPics_${monthStr}`, JSON.stringify(updated));
  };

  // Trigger Image File picker to embed customizable visual snapshot inside Polaroid
  const handleStickerFileChange = (dateStr: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDayStickerValue(dateStr, "", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onPrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const onNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Day indexing offset
  const startDay = getDay(monthStart);
  
  const handleSaveLog = () => {
    if (!selectedDate || !logText.trim()) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    if (editingId) {
      setLogs(logs.map(log => log.id === editingId ? {
        ...log,
        content: logText,
        type: logType,
        icon: selectedIcon,
        time: eventTime || undefined
      } : log));
      setEditingId(null);
    } else {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        date: dateStr,
        content: logText,
        type: logType,
        icon: selectedIcon,
        time: eventTime || undefined
      };
      setLogs([...logs, newLog]);
    }

    setLogText("");
    setEventTime("");
  };

  const handleDeleteLog = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setLogs(logs.filter(l => l.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setLogText("");
      setEventTime("");
    }
  };

  const startEditLog = (log: LogEntry) => {
    setEditingId(log.id);
    setLogText(log.content);
    setLogType(log.type);
    setSelectedIcon(log.icon || 'document');
    setEventTime(log.time || "");
  };

  const getLogsForDate = (date: Date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    return logs.filter(l => l.date === dStr);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-1 md:p-4 flex flex-col xl:flex-row gap-5 items-start text-ink">
      
      {/* LEFT PORTION: THE CALENDAR JOURNAL SPREAD PAGE */}
      <div className="w-full xl:w-[70%] bg-paper sketch-border p-4 md:p-6 space-y-6 shadow-xl relative min-h-[500px]">
        
        {/* JOURNAL HEADBAND RULINGS */}
        <div className="absolute top-0 left-10 right-10 h-[5px] bg-[#af1e2d]/6 opacity-20 border-b border-dashed border-ink/15 pointer-events-none" />

        {/* TOP LEVEL NAVIGATION HEADER & VIBES SUBTITLE */}
        <div className="flex flex-col items-center border-b-2 border-ink pb-4 gap-2">
          
          {/* Logo Brand Title like "THE SELF OBSESSED JOURNAL" */}
          <div className="text-[9px] font-sans font-black tracking-[0.25em] text-[#af1e2d] uppercase text-center block">
            THE DIGITAL WELLNESS JOURNAL
          </div>

          <div className="flex items-center justify-between w-full max-w-md pt-1">
            <button onClick={onPrevMonth} className="sketch-button p-2 text-xs hover:bg-[#af1e2d]/5"><ChevronLeft className="w-4 h-4" /></button>
            
            <div className="text-center">
              {/* Main Month Display */}
              <h1 className="text-3xl md:text-4xl font-sans font-black uppercase tracking-tight text-ink">
                {format(currentDate, "MMMM yyyy")}
              </h1>
            </div>

            <button onClick={onNextMonth} className="sketch-button p-2 text-xs hover:bg-[#af1e2d]/5"><ChevronRight className="w-4 h-4" /></button>
          </div>

          {/* EDITABLE VIBE SUBTITLE (e.g., "GLOW UP SEASON") */}
          <div className="mt-1 flex items-center justify-center gap-2">
            {isEditingTagline ? (
              <div className="flex items-center gap-1.5 animate-in zoom-in-95">
                <input
                  type="text"
                  value={taglineDraft}
                  onChange={e => setTaglineDraft(e.target.value)}
                  className="sketch-input py-0.5 px-3 uppercase text-xs tracking-widest text-center font-hand text-[#af1e2d] max-w-[200px]"
                  placeholder="Glow Up Season..."
                  autoFocus
                />
                <button onClick={handleSaveTagline} className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 py-0.5 px-2 rounded-lg hover:bg-emerald-100 transition-colors">Lưu</button>
                <button onClick={() => setIsEditingTagline(false)} className="text-xs font-bold text-ink/40 py-0.5 px-2 hover:underline">Hủy</button>
              </div>
            ) : (
              <p 
                onClick={() => {
                  setTaglineDraft(themeTagline);
                  setIsEditingTagline(true);
                }}
                className="text-indigo-900 font-hand italic text-lg opacity-85 hover:text-[#af1e2d] cursor-pointer transition-colors flex items-center gap-1 group"
                title="Sửa khẩu hiệu tháng này"
              >
                <span>✨ "{themeTagline}"</span>
                <span className="text-[10px] opacity-0 group-hover:opacity-100 uppercase tracking-widest font-sans font-black text-ink/30 ml-1">Sửa</span>
              </p>
            )}
          </div>

        </div>

        {/* CALENDAR WEEK COLS AND DATE CELLS GRID */}
        <div>
          {/* Weekday indicator labels */}
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-1">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day, idx) => {
              const headerColor = idx === 0 ? "text-[#af1e2d] font-bold" : idx === 6 ? "text-[#b45309] font-bold" : "text-ink/60";
              return (
                <div key={day} className={cn("text-center font-sans text-[10px] md:text-xs tracking-wider opacity-90 py-1.5 border-b border-ink/10", headerColor)}>
                  {day}
                </div>
              );
            })}
          </div>
          
          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 md:gap-2 border-l border-t border-ink/5 bg-paper/20">
            
            {/* Pad pre-month blanks */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] md:min-h-[110px] bg-[#FAF8F5]/30 border-r border-b border-ink/5 opacity-10" />
            ))}

            {/* Iterating month days */}
            {daysInMonth.map((day) => {
              const dStr = format(day, 'yyyy-MM-dd');
              const dayLogs = getLogsForDate(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const sticker = dayStickers[dStr];
              const isRinged = dayRings[dStr];

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                    setIsMobileDrawerOpen(true);
                  }}
                  className={cn(
                    "min-h-[85px] md:min-h-[115px] p-1.5 cursor-pointer relative overflow-hidden group border-r border-b border-ink/10 flex flex-col justify-between transition-all hover:bg-amber-50/20 bg-white/40",
                    isSelected ? "bg-amber-100/15 border-2 border-indigo-950 z-20 shadow-lg scale-[1.01]" : ""
                  )}
                >
                  {/* Top Day Number Row */}
                  <div className="flex justify-between items-start relative z-10">
                    <span className="relative inline-block w-6 h-6 flex items-center justify-center shrink-0">
                      
                      {/* OPTIONAL ORGANISED SCRIBBLE highlight RED CIRCLE around date */}
                      {isRinged && (
                        <span className="absolute inset-x-[-4px] inset-y-[-4px] pointer-events-none z-0">
                          <svg className="w-full h-full text-red-600/70" viewBox="0 0 100 100" fill="none">
                            <path d="M 15,50 C 10,25 90,15 85,45 C 80,75 12,85 20,55 C 28,25 92,30 82,60" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                          </svg>
                        </span>
                      )}

                      <span className={cn(
                        "font-sans font-extrabold text-[13px] md:text-base relative z-10",
                        isToday ? "text-[#af1e2d] bg-red-100/80 px-1 py-0.5 rounded font-black border border-red-200" : "text-ink/60"
                      )}>
                        {format(day, "d")}
                      </span>
                    </span>

                    {/* Compact Icon indicator for Event vs log */}
                    <div className="flex gap-0.5">
                      {dayLogs.map((log) => (
                        <div 
                          key={log.id} 
                          className={cn(
                            "w-1 h-1 rounded-full",
                            log.type === 'Event' ? "bg-indigo-600" : "bg-[#af1e2d]"
                          )} 
                        />
                      ))}
                    </div>
                  </div>

                  {/* CELL BODY: INLINE HANDWRITTEN RECAP TEXT DIRECTLY (Exact request match) */}
                  <div className="flex-1 mt-1.5 overflow-hidden text-left relative z-10 max-h-[48px] md:max-h-[64px]">
                    {dayLogs.slice(0, 2).map((log) => (
                      <p 
                        key={log.id} 
                        className="text-[9px] md:text-[11px] leading-tight font-hand italic text-indigo-900/90 truncate pl-0.5 border-l-2 border-indigo-200/50 mb-0.5"
                        title={log.content}
                      >
                        {log.time && <span className="font-sans font-bold pr-0.5">{log.time}</span>}
                        {log.content}
                      </p>
                    ))}
                  </div>

                  {/* CALENDAR EMBED POLAROID PIC OR PRESSED STICKER ON DESKTOP */}
                  {sticker && (
                    <div 
                      className="absolute bottom-1 right-1 pointer-events-none z-15 shadow-sm border border-black/5 bg-white p-0.5 rotate-6 hover:rotate-0 transition-transform origin-bottom-right"
                      style={{ width: "32px", height: "35px" }}
                    >
                      <div className="w-full h-[25px] bg-ink/5 overflow-hidden flex items-center justify-center">
                        {sticker.type === 'upload' ? (
                          <img src={sticker.data} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <PolaroidPreset type={sticker.data} className="w-4 h-4" />
                        )}
                      </div>
                      <div className="h-[5px] bg-white" /> {/* spacer mimicking real polaroid bezel */}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM NOTES SECTION: EDIT INTENT DETAILS ON PAPER GRIDS (matches May 2026 photo lines) */}
        <div className="border-t-2 border-ink pt-5 mt-4">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#af1e2d] mb-3">
            <BookOpen className="w-4 h-4" /> 🗒️ SỔ TAY MỤC TIÊU THÁNG / MONTH DECLARATIONS (NOTES)
          </div>

          <div className="relative bg-paper py-3 px-4 rounded-xl border border-dashed border-ink/20 space-y-3.5">
            {/* notebook grid spacing overlay effects */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1.5px)] bg-[size:100%_28px] pointer-events-none rounded-xl" />
            
            {notesList.map((note, index) => {
              const isEditing = editingNoteIndex === index;
              return (
                <div key={index} className="flex gap-4 items-start relative z-10">
                  <span className="text-sm font-black font-sans text-indigo-950/40 w-5 shrink-0 pt-0.5">{index + 1}</span>
                  
                  {isEditing ? (
                    <div className="flex-1 flex gap-2 animate-in slide-in-from-top-1">
                      <input
                        type="text"
                        value={noteEditVal}
                        onChange={e => setNoteEditVal(e.target.value)}
                        className="flex-1 px-2 py-0.5 font-hand text-base text-ink outline-none border-b-2 border-indigo-900 bg-white"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSaveNoteLine(index)}
                        className="text-xs bg-emerald-600 text-white rounded px-2.5 py-0.5 font-bold hover:bg-emerald-700 transition"
                      >
                        Lưu
                      </button>
                      <button 
                        onClick={() => setEditingNoteIndex(null)}
                        className="text-xs text-ink/40 font-bold hover:underline"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex justify-between items-start group/note">
                      <p 
                        onClick={() => {
                          setNoteEditVal(note);
                          setEditingNoteIndex(index);
                        }}
                        className="font-hand italic text-base text-indigo-950/85 hover:text-indigo-900 cursor-pointer select-text flex-1"
                      >
                        {note}
                      </p>
                      <button
                        onClick={() => {
                          setNoteEditVal(note);
                          setEditingNoteIndex(index);
                        }}
                        className="opacity-0 group-hover/note:opacity-100 text-[10px] text-indigo-900/40 hover:text-[#af1e2d] uppercase font-sans font-black tracking-wider ml-2 transition-all cursor-pointer"
                      >
                        [Sửa]
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* RIGHT PORTION: EDITOR CONTROL PANEL (STILL VISIBLE SIDEWAYS ON WIDE SCREEN) */}
      <div className="hidden xl:flex w-full xl:w-[30%] flex-col gap-5 sticky top-4">
        
        {/* Editor panel Container */}
        {selectedDate ? (
          <div className="sketch-border bg-white p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-ink/5 pb-2">
              <h3 className="text-md font-black uppercase tracking-wider text-ink flex items-center gap-1.5">
                <Edit className="w-4 h-4 text-crimson" /> {format(selectedDate, "do MMMM yyyy")}
              </h3>
              <button 
                onClick={() => setSelectedDate(null)}
                className="text-xs font-mono opacity-40 hover:opacity-100"
              >
                Đóng
              </button>
            </div>

            {/* STICKER PICKER BLOCK (The crucial photo embedding request) */}
            <div className="space-y-2 border-b border-ink/5 pb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-ink/50 block">🖼️ Dán Ảnh Polaroid & Sticker Ngày Này</span>
              
              {/* Preset grids */}
              <div className="grid grid-cols-4 gap-1.5">
                {STICKER_PRESETS.map(preset => {
                  const dStr = format(selectedDate, 'yyyy-MM-dd');
                  const activeSticker = dayStickers[dStr];
                  const isSelected = activeSticker?.type === 'preset' && activeSticker?.data === preset.id;
                  const isNoneSelected = preset.id === "none" && !activeSticker;

                  return (
                    <button
                      key={preset.id}
                      onClick={() => setDayStickerValue(dStr, preset.id)}
                      className={cn(
                        "p-1 border text-[9px] rounded flex flex-col items-center gap-0.5 bg-paper/5 transition-all text-center leading-tight truncate justify-center h-[42px]",
                        isSelected || isNoneSelected
                          ? "border-[#af1e2d] bg-pink-50/20 font-bold text-red-700" 
                          : "border-ink/10 hover:border-ink/30"
                      )}
                      title={preset.label}
                    >
                      {preset.visual ? (
                        <PolaroidPreset type={preset.visual} className="w-4 h-4" />
                      ) : (
                        <span className="text-[14px]">🚫</span>
                      )}
                      <span className="text-[7.5px] font-sans truncate w-full">{preset.label.split(" ")[1] || preset.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Upload custom sticker image */}
              <div className="pt-1.5">
                <label className="text-[9.5px] font-black uppercase text-[#af1e2d] tracking-widest block mb-1">
                  🏞️ HOẶC GHÉP ẢNH TỰ CHỌN (POLAROID CLIP)
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="sticker-file"
                    accept="image/*"
                    onChange={(e) => handleStickerFileChange(format(selectedDate, 'yyyy-MM-dd'), e)}
                    className="hidden"
                  />
                  <button
                    onClick={() => document.getElementById("sticker-file")?.click()}
                    className="flex-1 py-1 px-3 border border-dashed border-ink/20 rounded text-[10px] bg-amber-50/10 hover:border-ink/50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" /> Ghép ảnh lên Polaroid
                  </button>
                  
                  {dayStickers[format(selectedDate, 'yyyy-MM-dd')] && (
                    <button
                      onClick={() => setDayStickerValue(format(selectedDate, 'yyyy-MM-dd'), "none")}
                      className="p-1 px-2 border border-red-200 text-crimson bg-red-50 hover:bg-red-100 rounded text-[10px] cursor-pointer"
                      title="Gỡ ảnh dán"
                    >
                      Gỡ
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* CIRCLE OUTLINE TOGGLER (Highlights day with hand-drawn red ring) */}
            <div className="flex items-center justify-between border-b border-ink/5 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-ink/50 block">⭕ Tô Điểm Vòng Tròn Đỏ (Highlights)</span>
                <span className="text-[8.5px] text-ink/40 block leading-tight">Vẽ viền đỏ xung quanh ngày này (như May 30 trong ảnh)</span>
              </div>
              <button
                onClick={() => toggleDayRing(format(selectedDate, 'yyyy-MM-dd'))}
                className={cn(
                  "p-1.5 rounded border text-xs font-bold transition flex items-center gap-1 cursor-pointer",
                  dayRings[format(selectedDate, 'yyyy-MM-dd')]
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-red-50 text-[#af1e2d] border-red-200 hover:border-[#af1e2d]"
                )}
              >
                <CircleDot className="w-3.5 h-3.5" /> Vẽ/Xóa viền
              </button>
            </div>

            {/* ADD AND REMOVE ACTUAL TEXT ENTRIES TIMELINE */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-ink/50 block">✍️ Ghi Chú & Sự Kiện Ngày Này</span>

              {/* Time specification */}
              <div className="flex gap-2 items-center text-xs">
                <span className="text-xs font-semibold text-ink/60 shrink-0">Giờ (Tùy chọn):</span>
                <input 
                  type="time" 
                  value={eventTime}
                  onChange={e => setEventTime(e.target.value)}
                  className="sketch-input max-w-[120px] py-0.5 text-xs inline border-ink/15 bg-paper/20"
                />
              </div>

              {/* Type selector */}
              <div className="flex gap-2">
                {(['Reflection', 'Event'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setLogType(type)}
                    className={cn(
                      "flex-1 text-[10px] font-bold uppercase tracking-wider py-1 rounded border transition-colors cursor-pointer",
                      logType === type 
                        ? "bg-ink text-white border-ink" 
                        : "text-ink/60 border-ink/15 hover:border-ink/30 bg-[#FAF8F5]/30"
                    )}
                  >
                    {type === 'Reflection' ? '✍️ Suy Nghĩ' : '📅 Sự Kiện'}
                  </button>
                ))}
              </div>

              {/* Text Input area */}
              <textarea 
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
                placeholder="VD: Đi dạo công viên ngắm cảnh, học từ vựng mới..."
                className="w-full min-h-[60px] p-2 text-xs sketch-input bg-paper/10 resize-y"
                rows={2.5}
              />

              <button 
                onClick={handleSaveLog} 
                className="w-full py-2 bg-indigo-950 text-white hover:bg-crimson uppercase text-xs font-black tracking-widest cursor-pointer shadow border border-white/10"
              >
                {editingId ? "Cập Nhật" : "Lưu Nhật Ký"}
              </button>

              {/* LISTS OF DAILY LOGS */}
              <div className="mt-3 space-y-2 max-h-[170px] overflow-y-auto pr-1">
                {getLogsForDate(selectedDate).map(log => (
                  <div 
                    key={log.id} 
                    onClick={() => startEditLog(log)}
                    className={cn(
                      "p-2 bg-paper sketch-border border-dashed border-ink/20 relative mt-2.5 cursor-pointer transition-colors group",
                      editingId === log.id ? "bg-amber-100/10 border-[#af1e2d]" : "hover:border-ink/40"
                    )}
                  >
                    <button 
                      onClick={(e) => handleDeleteLog(log.id, e)}
                      className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] opacity-40 group-hover:opacity-100 transition-opacity z-10"
                    >
                      ×
                    </button>
                    {log.time && <span className="text-[9px] font-sans font-bold bg-indigo-50 border border-indigo-100 px-1 py-0.1 select-none text-indigo-800 rounded mr-1 inline-block">{log.time}</span>}
                    <span className="text-[10px] font-sans font-bold text-ink/40">[{log.type === 'Reflection' ? 'Nhật ký' : 'Sự kiện'}]</span>
                    <p className="font-hand italic text-sm mt-0.5 text-indigo-950/80 leading-snug whitespace-pre-wrap">
                      {log.content}
                    </p>
                  </div>
                ))}
              </div>

            </div>

          </div>
        ) : (
          <div className="p-5 sketch-border border-dashed border-ink/20 text-center opacity-60 bg-white">
            <p className="hand-text text-lg">Bấm chọn một ngày bất kỳ trên lịch để viết nhật ký, tô vòng tròn đỏ hoặc dán Sticker Polaroid!</p>
          </div>
        )}

      </div>

      {/* MOBILE FULL DRAWER COMPONENT: SLIDEOUT TOUCH PANEL SPECIFICALLY OPTIMIZED FOR MOBILE PHONE SIZES (Crucial request) */}
      {selectedDate && isMobileDrawerOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-2 animate-in fade-in duration-200 animate-out fade-out">
          {/* Backdrop Click */}
          <div className="absolute inset-0 z-40" onClick={() => setIsMobileDrawerOpen(false)} />
          
          {/* Slider content */}
          <div className="w-full bg-[#FAF8F5] rounded-t-2xl shadow-2xl relative z-50 max-h-[90vh] overflow-y-auto p-4 md:p-5 flex flex-col gap-4 border-t-4 border-indigo-950 animate-in slide-in-from-bottom duration-300">
            {/* Grabber bar styling */}
            <div className="w-12 h-1 bg-ink/20 rounded-full mx-auto" />

            <div className="flex justify-between items-center border-b border-ink/5 pb-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-ink flex items-center gap-1.5">
                <Edit className="w-4 h-4 text-crimson" /> CHI TIẾT NGÀY: {format(selectedDate, "dd/MM/yyyy")}
              </h3>
              <button 
                onClick={() => setIsMobileDrawerOpen(false)}
                className="bg-ink text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-crimson"
              >
                X
              </button>
            </div>

            {/* STICKER PICKER BLOCK */}
            <div className="space-y-2 border-b border-ink/5 pb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-ink/50 block">🖼️ Dán Sticker Polaroid Nghệ Thuật</span>
              
              <div className="grid grid-cols-5 gap-1.5">
                {STICKER_PRESETS.map(preset => {
                  const dStr = format(selectedDate, 'yyyy-MM-dd');
                  const activeSticker = dayStickers[dStr];
                  const isSelected = activeSticker?.type === 'preset' && activeSticker?.data === preset.id;
                  const isNoneSelected = preset.id === "none" && !activeSticker;

                  return (
                    <button
                      key={preset.id}
                      onClick={() => setDayStickerValue(dStr, preset.id)}
                      className={cn(
                        "p-1 border text-[9px] rounded flex flex-col items-center gap-0.5 bg-paper/5 transition-all text-center justify-center h-[42px]",
                        isSelected || isNoneSelected
                          ? "border-[#af1e2d] bg-pink-50/20 font-bold text-red-700" 
                          : "border-ink/10 hover:border-ink/30"
                      )}
                    >
                      {preset.visual ? (
                        <PolaroidPreset type={preset.visual} className="w-3.5 h-3.5" />
                      ) : (
                        <span className="text-[11px]">🚫</span>
                      )}
                      <span className="text-[7.5px] truncate w-full">{preset.label.split(" ")[1] || preset.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Upload custom sticker image */}
              <div className="pt-1.5">
                <input
                  type="file"
                  id="sticker-file-mobile"
                  accept="image/*"
                  onChange={(e) => handleStickerFileChange(format(selectedDate, 'yyyy-MM-dd'), e)}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => document.getElementById("sticker-file-mobile")?.click()}
                    className="flex-1 py-1.5 px-3 border border-dashed border-ink/20 rounded text-[10px] bg-amber-50/10 hover:border-ink/50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" /> Ghép ảnh lên Polaroid
                  </button>
                  {dayStickers[format(selectedDate, 'yyyy-MM-dd')] && (
                    <button
                      onClick={() => setDayStickerValue(format(selectedDate, 'yyyy-MM-dd'), "none")}
                      className="p-1 px-2 border border-red-200 text-crimson bg-red-50 text-[10px] rounded"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* CIRCLE OUTLINE TOGGLER */}
            <div className="flex items-center justify-between border-b border-ink/5 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-ink/50 block">⭕ Vòng Tròn Đỏ (Highlights)</span>
                <span className="text-[8px] text-ink/40 block leading-tight">Gạch khoanh đỏ (giống ngày 30 trong ảnh mẫu)</span>
              </div>
              <button
                onClick={() => toggleDayRing(format(selectedDate, 'yyyy-MM-dd'))}
                className={cn(
                  "p-1.5 rounded border text-xs font-bold transition flex items-center gap-1",
                  dayRings[format(selectedDate, 'yyyy-MM-dd')]
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-red-50 text-[#af1e2d] border-red-200"
                )}
              >
                Khoanh tròn đỏ
              </button>
            </div>

            {/* NOTING AND EVENT WRITING FORM */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-ink/50 block">✍️ Nhật Ký Ghi Chép</span>

              <div className="flex gap-2 items-center text-xs">
                <span className="font-semibold text-ink/60 shrink-0">Giờ:</span>
                <input 
                  type="time" 
                  value={eventTime}
                  onChange={e => setEventTime(e.target.value)}
                  className="sketch-input max-w-[120px] py-1 text-xs border-ink/15 bg-paper/20"
                />
              </div>

              <div className="flex gap-2">
                {(['Reflection', 'Event'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setLogType(type)}
                    className={cn(
                      "flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded border transition-colors",
                      logType === type 
                        ? "bg-ink text-white border-ink" 
                        : "text-ink/60 border-ink/15 bg-white"
                    )}
                  >
                    {type === 'Reflection' ? '✍️ Suy Nghĩ' : '📅 Sự Kiện'}
                  </button>
                ))}
              </div>

              <textarea 
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
                placeholder="Nhập nội dung nhật ký..."
                className="w-full min-h-[50px] p-2 text-xs sketch-input bg-white"
                rows={2}
              />

              <button 
                onClick={() => {
                  handleSaveLog();
                  setIsMobileDrawerOpen(false);
                }} 
                className="w-full py-2 bg-indigo-950 text-white hover:bg-crimson uppercase text-xs font-black tracking-widest cursor-pointer shadow"
              >
                {editingId ? "Cập Nhật" : "Lưu nhật ký"}
              </button>

              {/* SAVED TIMELINE ENTRIES LIST */}
              <div className="space-y-2 mt-2 max-h-[140px] overflow-y-auto">
                {getLogsForDate(selectedDate).map(log => (
                  <div 
                    key={log.id}
                    onClick={() => startEditLog(log)}
                    className="p-2 bg-white border border-ink/15 rounded relative flex justify-between items-start"
                  >
                    <div className="flex-1">
                      {log.time && <span className="font-sans font-bold text-[9px] bg-indigo-50 border border-indigo-100 px-1 py-0.1 text-indigo-800 rounded mr-1 inline-block">{log.time}</span>}
                      <span className="text-[9px] text-ink/40 font-bold">[{log.type === 'Reflection' ? 'Nhật ký' : 'Sự kiện'}]</span>
                      <p className="font-hand italic text-xs mt-0.5 text-indigo-950/80 leading-normal">{log.content}</p>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteLog(log.id, e)}
                      className="text-red-650 font-bold px-1.5 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
