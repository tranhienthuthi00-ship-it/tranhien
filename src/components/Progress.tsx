import type { Word, Task, LogEntry } from "@/types";
import { BookA, CheckSquare, CalendarDays } from "lucide-react";

export function Progress({
  words,
  tasks,
  logs,
}: {
  words: Word[];
  tasks: Task[];
  logs: LogEntry[];
}) {
  const masteredWords = words.filter(w => w.difficulty === 1).length;
  const completedTasks = tasks.filter(t => t.completed).length;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
       <div className="sketch-border p-6 bg-white/40 flex flex-col items-center text-center gap-3">
          <BookA size={40} className="text-crimson" />
          <h2 className="text-4xl font-sans font-black">{words.length}</h2>
          <p className="hand-text text-xl">Words Logged</p>
          <div className="mt-2 pt-3 border-t border-ink/10 w-full text-[10px] font-sans font-bold uppercase tracking-widest text-ink/50">
             {masteredWords} Mastered
          </div>
       </div>

       <div className="sketch-border p-6 bg-white/40 flex flex-col items-center text-center gap-3">
          <CheckSquare size={40} className="text-ink" />
          <h2 className="text-4xl font-sans font-black">{completedTasks}</h2>
          <p className="hand-text text-xl">Tasks Completed</p>
          <div className="mt-2 pt-3 border-t border-ink/10 w-full text-[10px] font-sans font-bold uppercase tracking-widest text-ink/50">
             Out of {tasks.length} total
          </div>
       </div>

       <div className="sketch-border p-6 bg-white/40 flex flex-col items-center text-center gap-3">
          <CalendarDays size={40} className="text-ink" />
          <h2 className="text-4xl font-sans font-black">{logs.length}</h2>
          <p className="hand-text text-xl">Diary Entries</p>
          <div className="mt-2 pt-3 border-t border-ink/10 w-full text-[10px] font-sans font-bold uppercase tracking-widest text-ink/50">
             Keep reflecting!
          </div>
       </div>
    </div>
  );
}
