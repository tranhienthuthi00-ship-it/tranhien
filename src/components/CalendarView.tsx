import { useState } from "react";
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

  const ICONS = ['document', 'star', 'heart', 'anchor', 'coffee'];

  const onPrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const onNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const startDay = getDay(monthStart);
  
  const handleSaveLog = () => {
    if (!selectedDate || !logText.trim()) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const newLog: LogEntry = {
      id: Date.now().toString(),
      date: dateStr,
      content: logText,
      type: logType,
      icon: logType === 'Reflection' ? selectedIcon : undefined,
      time: logType === 'Event' ? eventTime : undefined
    };
    setLogs([...logs, newLog]);
    setLogText("");
    setEventTime("");
    setSelectedDate(null);
  };

  const getLogsForDate = (date: Date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    return logs.filter(l => l.date === dStr);
  };

  return (
    <div className="max-w-5xl mx-auto p-2 md:p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between pointer-events-auto">
          <button onClick={onPrevMonth} className="sketch-button px-2"><ChevronLeft /></button>
          <h2 className="text-3xl font-bold font-sans tracking-tight">{format(currentDate, "MMMM yyyy")}</h2>
          <button onClick={onNextMonth} className="sketch-button px-2"><ChevronRight /></button>
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
             <button onClick={handleSaveLog} className="sketch-button sketch-button-primary uppercase py-1 text-sm">
               Log it
             </button>

             <div className="mt-2 space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {getLogsForDate(selectedDate).map(log => (
                  <div key={log.id} className="p-2 bg-paper sketch-border border-dashed border-ink/30 relative mt-3">
                     <span className={cn("absolute -top-3 left-3 px-1 bg-paper text-[10px] font-sans font-bold flex items-center gap-1", log.type === 'Event' ? "text-crimson" : "text-ink/50")}>
                        {log.type === 'Reflection' && <HandDrawnIcon type={log.icon || 'document'} className="w-3 h-3 mr-1 text-crimson inline" />}
                        {log.type} {log.type === 'Reflection' && "-"}
                     </span>
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
  );
}
