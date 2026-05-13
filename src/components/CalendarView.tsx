import { useState, MouseEvent } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LogEntry } from "@/types";

export function HandDrawnIcon({ type, className }: { type: string, className?: string }) {
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
    case 'smile':
      return (
        <svg {...baseProps}>
          <circle cx="50" cy="50" r="40" fill="#FDFBF7" />
          <circle cx="35" cy="40" r="3" fill="currentColor" />
          <circle cx="65" cy="40" r="3" fill="currentColor" />
          <path d="M 30 65 Q 50 80 70 65" />
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
  
  const [logText, setLogText] = useState("");
  const [logType, setLogType] = useState<'Reflection' | 'Event'>('Reflection');
  const [selectedIcon, setSelectedIcon] = useState('document');
  const [eventTime, setEventTime] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const ICONS = ['document', 'star', 'heart', 'anchor', 'coffee', 'moon', 'sun', 'cloud', 'book', 'gift', 'smile'];

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
        icon: logType === 'Reflection' ? selectedIcon : undefined,
        time: logType === 'Event' ? eventTime : undefined
      } : log));
      setEditingId(null);
    } else {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        date: dateStr,
        content: logText,
        type: logType,
        icon: logType === 'Reflection' ? selectedIcon : undefined,
        time: logType === 'Event' ? eventTime : undefined
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
    if (log.icon) setSelectedIcon(log.icon);
    if (log.time) setEventTime(log.time);
  };

  const getLogsForDate = (date: Date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    return logs
      .filter(l => l.date === dStr)
      .sort((a, b) => {
        if (a.type === b.type) return 0;
        return a.type === 'Reflection' ? -1 : 1;
      });
  };

  const getGroupedEvents = () => {
    const events = logs
      .filter(l => l.type === 'Event' && l.date.startsWith(format(currentDate, 'yyyy-MM')))
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

  return (
    <div className="max-w-6xl mx-auto p-2 md:p-4 flex flex-col gap-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2">
            <button onClick={onPrevMonth} className="sketch-button px-2"><ChevronLeft /></button>
            <h2 className="text-3xl font-bold font-sans tracking-tight text-center">{format(currentDate, "MMMM yyyy")}</h2>
            <button onClick={onNextMonth} className="sketch-button px-2"><ChevronRight /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
            <div key={day} className="text-center font-sans font-bold uppercase text-xs opacity-50 py-1">
              {day}
            </div>
          ))}
          
          {Array.from({ length: startDay === 0 ? 6 : startDay - 1 }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[60px] calendar-day bg-white/20 opacity-30" />
          ))}

          {daysInMonth.map((day) => {
            const dayLogs = getLogsForDate(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "min-h-[60px] p-1.5 transition-all cursor-pointer bg-white/40 hover:bg-white/80 flex flex-col calendar-day relative overflow-hidden group",
                  isSelected ? "border-crimson bg-crimson/5 scale-105 shadow-xl z-10 border-2" : ""
                )}
              >
                <div className="flex justify-between items-center relative z-10 h-5">
                  <span className={cn(
                    "font-sans font-semibold text-sm",
                    isSameDay(day, new Date()) ? "text-crimson" : "text-ink/60"
                  )}>
                    {format(day, "d")}
                  </span>
                </div>

                {dayLogs.some(l => l.type === 'Reflection') && (
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 z-0 opacity-70 text-crimson pointer-events-none group-hover:scale-110 transition-transform duration-300">
                    <HandDrawnIcon type={dayLogs.find(l => l.type === 'Reflection')?.icon || 'document'} className="-rotate-3 w-8 h-8" />
                  </div>
                )}
                
                <div className="flex-1 overflow-hidden mt-4 space-y-[2px] relative z-10">
                  {dayLogs.map(log => (
                    <div key={log.id} className={cn(
                      "leading-tight truncate flex items-center gap-1 relative z-10",
                      log.type === 'Event' ? "big-project w-full text-left" : "hand-text text-[10px] opacity-90"
                    )}>
                      {log.type === 'Reflection' && <span>-</span>}
                      {log.type === 'Reflection' && <span className="truncate">{log.content}</span>}
                      {log.type === 'Event' && <span>{log.time ? `${log.time} ` : ''}{log.content}</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Log Panel */}
      <div className="space-y-3">
        <h3 className="text-xl font-sans font-bold">
          {selectedDate ? format(selectedDate, "MMMM do, yyyy") : "Select a day"}
        </h3>
        {selectedDate ? (
          <div className="p-3 sketch-border bg-white/60 shadow-lg flex flex-col gap-2">
              <div className="flex gap-2">
                <button 
                  onClick={() => setLogType('Reflection')}
                  className={cn("px-3 py-1 rounded-full font-sans text-xs border-2 border-ink", logType === 'Reflection' ? "bg-ink text-paper" : "bg-transparent")}
                >
                  Reflection
                </button>
                <button 
                  onClick={() => setLogType('Event')}
                  className={cn("px-3 py-1 rounded-full font-sans text-xs border-2 border-crimson", logType === 'Event' ? "bg-crimson text-paper" : "bg-transparent text-crimson")}
                >
                  Event
                </button>
             </div>
             
             {logType === 'Reflection' && (
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
             )}

             {logType === 'Event' && (
               <input 
                 type="time" 
                 value={eventTime}
                 onChange={e => setEventTime(e.target.value)}
                 className="sketch-input w-max font-sans text-sm py-1"
               />
             )}

             <textarea 
               value={logText}
               onChange={(e) => setLogText(e.target.value)}
               placeholder={logType === 'Reflection' ? "Dear diary..." : "Event title & details..."}
               className={cn("w-full min-h-[60px] p-2 sketch-input resize-y", logType === 'Reflection' ? "hand-text text-lg" : "font-sans text-sm")}
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
                     <span className={cn("absolute -top-3 left-3 px-1 bg-paper text-[10px] font-sans font-bold flex items-center gap-1", log.type === 'Event' ? "text-crimson" : "text-ink/50")}>
                        {log.type === 'Reflection' && <HandDrawnIcon type={log.icon || 'document'} className="w-3 h-3 mr-1 text-crimson inline" />}
                        {log.type} {log.type === 'Reflection' && "-"}
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
    </div>

    {/* Monthly Summary Section */}
      <div className="sketch-border bg-white/40 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-sans font-black tracking-tight uppercase">Monthly Recap: {format(currentDate, "MMMM yyyy")}</h3>
          <div className="flex gap-4 text-xs font-sans font-bold text-ink/40">
            <span>{groupedEvents.length} Events Grouped</span>
          </div>
        </div>
        
        {groupedEvents.length > 0 ? (
          <div className="relative border-l-2 border-ink/10 ml-4 py-4 space-y-8">
            {groupedEvents.map((event, idx) => (
              <div key={event.id} className="relative pl-8">
                {/* Timeline Dot */}
                <div className="absolute left-[-9px] top-1.5 w-4 h-4 rounded-full bg-crimson sketch-border border-2 border-paper" />
                
                <div className="flex flex-col gap-1">
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
  );
}
