import { useState, MouseEvent } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LogEntry } from "@/types";

export function HandDrawnIcon({ type, className, key }: { type: string, className?: string, key?: string | number }) {
  const baseProps = {
    width: "24", height: "24", viewBox: "0 0 100 100", fill: "none", 
    stroke: "currentColor", strokeWidth: "6", strokeLinecap: "round" as const, 
    strokeLinejoin: "round" as const, style: { filter: 'url(#hand-drawn-filter)' },
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
    case 'travel':
      return (
        <svg {...baseProps}>
          <path d="M 20 50 L 50 45 L 80 50 L 50 55 Z" fill="#FDFBF7" />
          <path d="M 50 35 L 50 65" />
          <path d="M 35 47 L 30 35" />
          <path d="M 35 53 L 30 65" />
        </svg>
      );
    case 'mountain':
      return (
        <svg {...baseProps}>
          <path d="M 10 85 L 40 30 L 60 55 L 80 40 L 90 85 Z" fill="#FDFBF7" />
          <path d="M 30 50 L 40 45 L 45 55" />
        </svg>
      );
    case 'home':
      return (
        <svg {...baseProps}>
          <path d="M 15 50 L 50 15 L 85 50 V 85 H 15 Z" fill="#FDFBF7" />
          <path d="M 40 85 V 60 H 60 V 85" />
        </svg>
      );
    case 'music':
      return (
        <svg {...baseProps}>
          <circle cx="30" cy="75" r="10" fill="#FDFBF7" />
          <circle cx="70" cy="65" r="10" fill="#FDFBF7" />
          <path d="M 40 75 V 20 L 80 15 V 65" />
          <path d="M 40 35 L 80 30" />
        </svg>
      );
    case 'food':
      return (
        <svg {...baseProps}>
          <path d="M 20 85 Q 20 40 50 40 Q 80 40 80 85 Z" fill="#FDFBF7" />
          <path d="M 50 40 V 25 Q 60 15 70 25" />
        </svg>
      );
    case 'pizza':
      return (
        <svg {...baseProps}>
          <path d="M 50 15 L 85 80 Q 50 90 15 80 Z" fill="#FDFBF7" />
          <circle cx="45" cy="50" r="3" fill="currentColor" opacity="0.4" />
          <circle cx="60" cy="65" r="3" fill="currentColor" opacity="0.4" />
          <circle cx="40" cy="70" r="3" fill="currentColor" opacity="0.4" />
        </svg>
      );
    case 'camera':
      return (
        <svg {...baseProps}>
          <path d="M 20 35 H 80 V 80 H 20 Z" fill="#FDFBF7" />
          <path d="M 40 35 V 25 H 60 V 35" />
          <circle cx="50" cy="57" r="15" fill="#FDFBF7" />
          <circle cx="72" cy="45" r="3" fill="currentColor" />
        </svg>
      );
    case 'bulb':
      return (
        <svg {...baseProps}>
          <path d="M 50 80 Q 25 70 30 40 Q 30 15 50 15 Q 70 15 70 40 Q 75 70 50 80 Z" fill="#FDFBF7" />
          <path d="M 40 80 H 60" />
          <path d="M 42 87 H 58" />
          <path d="M 50 40 V 55" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...baseProps}>
          <path d="M 15 35 H 85 V 85 H 15 Z" fill="#FDFBF7" />
          <path d="M 40 35 V 25 Q 50 15 60 25 V 35" />
          <path d="M 15 55 H 85" />
          <path d="M 48 55 V 65 H 52 V 55" />
        </svg>
      );
    case 'gym':
      return (
        <svg {...baseProps}>
          <path d="M 10 40 H 25 V 60 H 10 Z" fill="currentColor" />
          <path d="M 75 40 H 90 V 60 H 75 Z" fill="currentColor" />
          <path d="M 25 50 H 75" strokeWidth="6" />
        </svg>
      );
    case 'smile':
      return (
        <svg {...baseProps}>
          <circle cx="50" cy="50" r="40" fill="#FDFBF7" />
          <circle cx="35" cy="40" r="3" fill="currentColor" />
          <circle cx="65" cy="40" r="3" fill="currentColor" />
          <path d="M 30 65 Q 50 80 70 65" />
        </svg>
      );
    case 'tree':
      return (
        <svg {...baseProps}>
          <path d="M 50 20 Q 30 20 30 40 Q 30 50 40 50 Q 25 60 40 75 Q 60 75 75 60 Q 70 50 70 40 Q 70 20 50 20" fill="#FDFBF7" />
          <path d="M 45 75 V 90 H 55 V 75" fill="#FDFBF7" />
        </svg>
      );
    case 'rain':
      return (
        <svg {...baseProps}>
          <path d="M 20 40 Q 50 20 80 40 H 20" fill="#FDFBF7" />
          <path d="M 30 55 L 25 70" />
          <path d="M 50 55 L 45 70" />
          <path d="M 70 55 L 65 70" />
        </svg>
      );
    case 'car':
      return (
        <svg {...baseProps}>
          <path d="M 20 60 H 80 V 75 H 20 Z" fill="#FDFBF7" />
          <path d="M 30 60 L 40 40 H 60 L 70 60" fill="#FDFBF7" />
          <circle cx="30" cy="75" r="7" fill="#FDFBF7" />
          <circle cx="70" cy="75" r="7" fill="#FDFBF7" />
        </svg>
      );
    case 'game':
      return (
        <svg {...baseProps}>
          <path d="M 20 40 Q 50 30 80 40 Q 90 70 80 80 Q 50 70 20 80 Q 10 70 20 40" fill="#FDFBF7" />
          <path d="M 30 55 H 45 M 37 47 V 63" />
          <circle cx="65" cy="50" r="3" fill="currentColor" />
          <circle cx="75" cy="60" r="3" fill="currentColor" />
        </svg>
      );
    case 'cupcake':
      return (
        <svg {...baseProps}>
          <path d="M 30 85 L 25 60 H 75 L 70 85 Z" fill="#FDFBF7" />
          <path d="M 25 60 Q 20 40 50 40 Q 80 40 75 60 Z" fill="#FDFBF7" />
          <circle cx="50" cy="35" r="5" fill="currentColor" />
          <path d="M 35 60 V 85 M 50 60 V 85 M 65 60 V 85" opacity="0.3" />
        </svg>
      );
    case 'tooth':
      return (
        <svg {...baseProps}>
          <path d="M 25 30 Q 25 15 50 15 Q 75 15 75 30 V 50 Q 75 85 60 85 Q 50 85 50 65 Q 50 85 40 85 Q 25 85 25 50 Z" fill="#FDFBF7" />
          <path d="M 35 30 Q 50 25 65 30" />
        </svg>
      );
    case 'nail':
      return (
        <svg {...baseProps}>
          <path d="M 40 40 V 85 Q 40 95 50 95 Q 60 95 60 85 V 40 Z" fill="#FDFBF7" />
          <path d="M 40 40 Q 50 10 60 40 Z" fill="#FDFBF7" />
          <path d="M 35 45 H 65" />
        </svg>
      );
    case 'shopping':
      return (
        <svg {...baseProps}>
          <path d="M 20 40 H 80 L 75 90 H 25 Z" fill="#FDFBF7" />
          <path d="M 35 40 V 25 Q 50 5 65 25 V 40" />
          <circle cx="35" cy="50" r="3" fill="currentColor" />
          <circle cx="65" cy="50" r="3" fill="currentColor" />
        </svg>
      );
    case 'document':
    default:
      return (
        <svg {...baseProps}>
          <path d="M 25 15 Q 60 10 80 15 L 75 80 Q 40 85 20 80 Z" fill="#FDFBF7" />
          <path d="M 35 30 Q 55 25 65 30" />
          <path d="M 32 45 Q 52 40 62 45" />
          <path d="M 28 60 Q 48 55 58 60" />
          <circle cx="22" cy="30" r="2" fill="currentColor" />
          <circle cx="19" cy="45" r="2" fill="currentColor" />
          <circle cx="16" cy="60" r="2" fill="currentColor" />
        </svg>
      );
  }
}

export function CalendarView({
  logs,
  setLogs,
}: {
  logs: LogEntry[];
  setLogs: (logs: LogEntry[]) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'Month' | 'Year'>('Month');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Reflections' | 'Events'>('All');
  
  const [logText, setLogText] = useState("");
  const [logType, setLogType] = useState<'Reflection' | 'Event'>('Reflection');
  const [selectedIcon, setSelectedIcon] = useState('document');
  const [eventTime, setEventTime] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const ICONS = ['document', 'star', 'heart', 'anchor', 'coffee', 'moon', 'sun', 'cloud', 'book', 'gift', 'smile', 'travel', 'mountain', 'home', 'music', 'food', 'pizza', 'camera', 'bulb', 'briefcase', 'gym', 'tree', 'rain', 'car', 'game', 'cupcake', 'tooth', 'nail', 'shopping'];

  const onPrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const onNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
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
    return logs
      .filter(l => l.date === dStr)
      .filter(l => {
        if (typeFilter === 'All') return true;
        if (typeFilter === 'Reflections') return l.type === 'Reflection';
        if (typeFilter === 'Events') return l.type === 'Event';
        return true;
      })
      .sort((a, b) => {
        if (a.type === b.type) return 0;
        return a.type === 'Reflection' ? -1 : 1;
      });
  };

  const getGroupedEvents = () => {
    const events = logs
      .filter(l => l.date.startsWith(format(currentDate, 'yyyy-MM')))
      .filter(l => {
        if (typeFilter === 'All') return true;
        if (typeFilter === 'Reflections') return l.type === 'Reflection';
        if (typeFilter === 'Events') return l.type === 'Event';
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    if (events.length === 0) return [];

    const grouped: {
      content: string,
      startDate: string,
      endDate: string,
      time?: string,
      id: string
    }[] = [];

    events.forEach(event => {
      const lastGroup = grouped[grouped.length - 1];
      
      if (lastGroup && lastGroup.content === event.content) {
        // Check if it's consecutive (calculating difference in days)
        const prevDate = new Date(lastGroup.endDate);
        const currDate = new Date(event.date);
        const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) {
          lastGroup.endDate = event.date;
          return;
        }
      }
      
      grouped.push({
        id: event.id,
        content: event.content,
        startDate: event.date,
        endDate: event.date,
        time: event.time
      });
    });

    return grouped;
  };

  const groupedEvents = getGroupedEvents();

  const getYearlyEvents = () => {
    const year = format(currentDate, 'yyyy');
    return logs
      .filter(l => l.date.startsWith(year))
      .filter(l => {
        if (typeFilter === 'All') return true;
        if (typeFilter === 'Reflections') return l.type === 'Reflection';
        if (typeFilter === 'Events') return l.type === 'Event';
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const getYearlyStats = () => {
    const yearlyLogs = logs
      .filter(l => l.date.startsWith(format(currentDate, 'yyyy')))
      .filter(l => {
        if (typeFilter === 'All') return true;
        if (typeFilter === 'Reflections') return l.type === 'Reflection';
        if (typeFilter === 'Events') return l.type === 'Event';
        return true;
      });
    const entryCount = yearlyLogs.length;
    
    // Group events by month
    const months: Record<string, number> = {};
    yearlyLogs.forEach(l => {
      const month = format(new Date(l.date), 'MMMM');
      months[month] = (months[month] || 0) + 1;
    });
    
    const mostActiveMonth = Object.entries(months).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    return { entryCount, mostActiveMonth };
  };

  const yearlyStats = getYearlyStats();
  const yearlyEvents = getYearlyEvents();

  const getMonthlyStats = () => {
    const monthStr = format(currentDate, 'yyyy-MM');
    const monthlyLogs = logs
      .filter(l => l.date.startsWith(monthStr))
      .filter(l => {
        if (typeFilter === 'All') return true;
        if (typeFilter === 'Reflections') return l.type === 'Reflection';
        if (typeFilter === 'Events') return l.type === 'Event';
        return true;
      });
    return { entryCount: monthlyLogs.length };
  };

  const { entryCount: monthlyEntryCount } = getMonthlyStats();

  if (viewMode === 'Year') {
    return (
      <div className="w-full max-w-[1400px] mx-auto p-2 md:p-6 flex flex-col gap-6 md:gap-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={() => setViewMode('Month')}
                className="sketch-button px-4 py-2 text-sm font-bold uppercase tracking-widest text-ink/60 hover:text-ink"
              >
                ← Back to Month
              </button>
              <h2 className="text-4xl md:text-5xl font-black font-sans tracking-tighter uppercase">{format(currentDate, "yyyy")} Recap</h2>
              
              {/* Filter selector removed per request */}
           </div>
           <div className="flex gap-4">
              <div className="p-4 sketch-border border-dashed bg-white/40 shadow-sm flex flex-col items-center min-w-[120px]">
                <span className="text-[10px] font-bold uppercase text-ink/40 tracking-widest">Total Entries</span>
                <span className="text-3xl font-black text-ink">{yearlyStats.entryCount}</span>
              </div>
              <div className="hidden sm:flex p-4 sketch-border border-dashed bg-white/40 shadow-sm flex flex-col items-center min-w-[150px]">
                <span className="text-[10px] font-bold uppercase text-ink/40 tracking-widest">Peak Activity</span>
                <span className="text-xl font-bold text-emerald-600">{yearlyStats.mostActiveMonth}</span>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 12 }).map((_, i) => {
             const month = new Date(currentDate.getFullYear(), i, 1);
             const monthEvents = yearlyEvents.filter(e => e.date.startsWith(format(month, 'yyyy-MM')));
             
             if (monthEvents.length === 0) return null;

             return (
               <div key={i} className="sketch-border bg-white/60 p-6 flex flex-col gap-4 hover:shadow-xl transition-shadow group">
                  <div className="flex items-center justify-between border-b-2 border-ink pb-2">
                    <h4 className="text-2xl font-black font-sans uppercase text-ink group-hover:text-crimson transition-colors">{format(month, "MMMM")}</h4>
                    <span className="text-xs font-bold font-sans bg-ink/5 px-2 py-1 rounded">{monthEvents.length} items</span>
                  </div>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {monthEvents.map(event => (
                      <div key={event.id} className="relative pl-6 py-1 border-l-2 border-ink/10 hover:border-crimson transition-colors">
                        <div className="absolute left-[-5px] top-3 w-2 h-2 rounded-full bg-crimson" />
                        <div className="flex flex-col gap-0.5">
                           <span className="text-[9px] font-sans font-black uppercase text-ink/40 tracking-widest">
                             {format(new Date(event.date), "do")} {event.time && `- ${event.time}`}
                           </span>
                           <p className="text-base font-bold text-ink/90 leading-tight">{event.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
             );
          }).filter(Boolean)}

          {yearlyEvents.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-40">
               <p className="hand-text text-4xl">The year is still unfolding...</p>
               <p className="text-sm font-sans mt-2">Start logging events to see your yearly recap here.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto p-2 md:p-4 flex flex-col xl:flex-row gap-4 md:gap-6 items-start">
      {/* Calendar Grid */}
      <div className="w-full xl:w-[65%] space-y-2 md:space-y-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b-2 border-dashed border-ink/10">
          <div className="flex items-center justify-center sm:justify-start gap-4">
            <button onClick={onPrevMonth} className="sketch-button px-3 py-1.5"><ChevronLeft style={{ filter: 'url(#hand-drawn-filter)' }} /></button>
            <div className="flex flex-col items-center">
              <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-center min-w-[180px] flex items-center justify-center gap-2">
                <HandDrawnIcon type="document" className="w-5 h-5 text-crimson" />
                {format(currentDate, "MMMM yyyy")}
              </h2>
              <button 
                onClick={() => setViewMode('Year')}
                className="text-[9px] font-bold uppercase tracking-widest text-crimson hover:underline mt-0.5"
              >
                View Yearly Recap →
              </button>
            </div>
            <button onClick={onNextMonth} className="sketch-button px-3 py-1.5"><ChevronRight style={{ filter: 'url(#hand-drawn-filter)' }} /></button>
          </div>

          {/* Filter selector removed per request */}
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
            <div key={day} className="text-center font-sans font-bold uppercase text-[10px] md:text-xs tracking-widest opacity-60 py-1">
              {day}
            </div>
          ))}
          
          {Array.from({ length: startDay === 0 ? 6 : startDay - 1 }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[60px] md:min-h-[75px] xl:min-h-[85px] calendar-day bg-white/10 opacity-20" />
          ))}

          {daysInMonth.map((day) => {
            const dayLogs = getLogsForDate(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "min-h-[60px] md:min-h-[75px] xl:min-h-[85px] p-1.5 md:p-2 transition-all cursor-pointer bg-white/40 hover:bg-white/80 flex flex-col calendar-day relative overflow-hidden group",
                  isSelected ? "border-crimson bg-crimson/5 scale-[1.02] shadow-2xl z-20 border-2" : "border border-ink/5"
                )}
              >
                <div className="flex justify-between items-center relative z-10">
                  <span className={cn(
                    "font-sans font-bold text-base",
                    isSameDay(day, new Date()) ? "text-crimson bg-crimson/10 px-1.5 py-0.5 rounded" : "text-ink/60"
                  )}>
                    {format(day, "d")}
                  </span>
                  
                  {/* Visual Markers Section */}
                  <div className="flex gap-1 items-center">
                    {dayLogs.map((log, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shadow-sm",
                          log.type === 'Event' ? "bg-crimson" : "bg-amber-400"
                        )}
                        title={log.type === 'Event' ? "Sự kiện" : "Suy ngẫm / ghi chép"}
                      />
                    ))}
                  </div>
                </div>

                <div className="absolute inset-x-0 top-[15%] pointer-events-none overflow-hidden opacity-50 text-amber-500 flex flex-wrap gap-2 px-2 items-start justify-center z-0 group-hover:opacity-70 transition-opacity">
                  {dayLogs.map(log => (
                    <HandDrawnIcon key={log.id} type={log.icon || 'document'} className="w-8 h-8 md:w-10 md:h-10" />
                  ))}
                </div>
                
                {isSelected && (
                  <div className="flex-1 overflow-y-auto mt-6 space-y-1 relative z-10 max-h-[100px] scrollbar-thin">
                    {dayLogs.map(log => (
                      <div key={log.id} className="leading-tight flex items-center gap-1 relative z-10 px-1 rounded hand-text text-[11px] opacity-80 break-words">
                        <span className="shrink-0">•</span>
                        <span>
                          {log.time && <span className="font-bold mr-1">{log.time}</span>}
                          {log.content}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Side Section: Inputs and Recap */}
      <div className="w-full xl:w-[35%] flex flex-col gap-4 md:gap-6 xl:sticky xl:top-4 relative">
        {/* Daily Log Panel */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl md:text-2xl font-sans font-black uppercase tracking-tight">
              {selectedDate ? format(selectedDate, "MMMM do, yyyy") : "Select a day"}
            </h3>
            {selectedDate && (
               <span className="text-[10px] font-bold uppercase tracking-widest text-crimson animate-pulse">Recording...</span>
            )}
          </div>
          
          {selectedDate ? (
            <div className="p-4 md:p-5 sketch-border bg-white/60 shadow-xl flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                 <div className="flex gap-2 items-center">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-ink/50">Icon:</span>
                   <div className="flex gap-1 flex-wrap">
                     {ICONS.map(icon => (
                       <button 
                         key={icon}
                         onClick={() => setSelectedIcon(icon)}
                         className={cn("p-1 rounded transition-colors", selectedIcon === icon ? "bg-ink/10 text-crimson" : "hover:bg-ink/5 text-ink/60")}
                       >
                         <HandDrawnIcon type={icon} className="w-4 h-4" />
                       </button>
                     ))}
                   </div>
                 </div>
               </div>

               <div className="flex gap-2 items-center">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-ink/50">Type:</span>
                 <div className="flex gap-1.5">
                   {(['Reflection', 'Event'] as const).map(type => (
                     <button
                       key={type}
                       type="button"
                       onClick={() => setLogType(type)}
                       className={cn(
                         "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-all cursor-pointer",
                         logType === type 
                           ? "bg-crimson text-white border-crimson shadow-xs" 
                           : "text-ink/65 border-ink/20 hover:border-ink/45 hover:bg-ink/5"
                       )}
                     >
                       {type === 'Reflection' ? '✍️ Reflection' : '📅 Event'}
                     </button>
                   ))}
                 </div>
               </div>

               <div className="flex gap-2 items-center">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-ink/50">Time (Optional):</span>
                 <input 
                   type="time" 
                   value={eventTime}
                   onChange={e => setEventTime(e.target.value)}
                   className="sketch-input w-max font-sans text-sm py-1 border-ink/20"
                 />
               </div>

             <textarea 
               value={logText}
               onChange={(e) => setLogText(e.target.value)}
               placeholder="Log details..."
               className="w-full min-h-[60px] p-2 sketch-input resize-y hand-text text-lg"
               rows={2}
             />
             <div className="flex gap-2">
               <button onClick={handleSaveLog} className="flex-1 sketch-button sketch-button-primary uppercase py-1 text-sm">
                 {editingId ? "Update" : "Log it"}
               </button>
               {editingId && (
                 <>
                   <button 
                    onClick={(e) => handleDeleteLog(editingId, e as any)} 
                    className="sketch-button bg-crimson text-white uppercase py-1 text-sm px-4"
                   >
                     Delete
                   </button>
                   <button 
                    onClick={() => {
                      setEditingId(null);
                      setLogText("");
                      setEventTime("");
                    }} 
                    className="sketch-button uppercase py-1 text-sm px-4"
                   >
                     Cancel
                   </button>
                 </>
               )}
             </div>

             <div className="mt-2 space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {getLogsForDate(selectedDate).map(log => (
                  <div 
                    key={log.id} 
                    onClick={() => startEditLog(log)}
                    className={cn(
                      "p-2 bg-paper sketch-border border-dashed border-ink/30 relative mt-3 cursor-pointer transition-colors group",
                      editingId === log.id ? "bg-crimson/5 border-crimson" : "hover:border-ink/50"
                    )}
                  >
                     <span className="absolute -top-3 left-3 px-1 bg-paper text-[10px] font-sans font-bold flex items-center gap-1 text-ink/70">
                        <HandDrawnIcon type={log.icon || 'document'} className="w-3 h-3 mr-1 text-crimson inline" />
                        Entry
                     </span>
                     <button 
                       onClick={(e) => handleDeleteLog(log.id, e)}
                       className="absolute top-1 right-1 w-6 h-6 bg-crimson text-white rounded-full flex items-center justify-center text-xs opacity-40 group-hover:opacity-100 transition-opacity z-20 shadow-md border border-white/20"
                       title="Delete"
                     >
                       ×
                     </button>
                     {log.type === 'Event' && log.time && (
                       <div className="text-[10px] font-sans font-bold opacity-50 mb-0.5">{log.time}</div>
                     )}
                     <p className={cn(log.type === 'Reflection' ? "hand-text text-lg leading-tight" : "font-sans text-sm")}>
                       {log.content}
                     </p>
                  </div>
                ))}
             </div>
          </div>
        ) : (
          <div className="p-4 sketch-border border-dashed border-ink/20 text-center opacity-60">
            <p className="hand-text text-xl">Click a day on the calendar to view or add logs.</p>
          </div>
        )}
      </div>

      {/* Monthly Summary Section (Right) */}
      <div className="sketch-border bg-white/40 p-4 space-y-4 h-full min-h-[300px]">
          <div className="flex flex-col gap-4 border-b-2 border-ink pb-4">
            <h3 className="text-2xl font-sans font-black tracking-tight uppercase">Monthly Recap</h3>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 sketch-border border-dashed bg-paper/50 flex flex-col items-center">
                <span className="text-[9px] font-black uppercase text-ink/40 tracking-widest">Total Entries</span>
                <span className="text-xl font-black text-ink">{monthlyEntryCount}</span>
              </div>
            </div>
          </div>
          
          <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {groupedEvents.length > 0 ? (
              <div className="relative border-l-2 border-ink/10 ml-4 py-4 space-y-8">
                {groupedEvents.map((event) => (
                  <div key={event.id} className="relative pl-8">
                    {/* Timeline Dot */}
                    <div className="absolute left-[-9px] top-1.5 w-4 h-4 rounded-full bg-crimson sketch-border border-2 border-paper" />
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-sans font-black uppercase tracking-widest bg-ink text-paper px-2 py-0.5 rounded">
                          {event.startDate === event.endDate 
                            ? format(new Date(event.startDate), "do MMMM")
                            : `${format(new Date(event.startDate), "do")} - ${format(new Date(event.endDate), "do MMMM")}`
                          }
                        </span>
                        {event.time && (
                          <span className="text-xs font-sans font-bold text-ink/50 italic">{event.time}</span>
                        )}
                      </div>
                      <div className="p-4 bg-white/80 sketch-border border-dashed shadow-sm">
                        <p className="font-sans text-lg font-bold text-ink leading-tight">
                          {event.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 opacity-40">
                <p className="hand-text text-2xl">No events recorded this month.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
