import { cn } from "@/lib/utils";

export type Tab = "English Hub" | "Calendar" | "Lists" | "Places" | "Content" | "Dashboard";

export function NavBar({ activeTab, setActiveTab, lastSaved, onLogout }: { activeTab: Tab; setActiveTab: (tab: Tab) => void, lastSaved?: string, onLogout: () => void }) {
  const tabs: Tab[] = ["English Hub", "Calendar", "Lists", "Places", "Content", "Dashboard"];

  return (
    <nav className="sticky top-0 z-50 bg-paper/95 backdrop-blur-sm border-b-2 border-dashed border-ink/20 py-3">
      <div className="max-w-5xl mx-auto px-4 flex justify-between items-center overflow-x-auto gap-4">
        <div className="shrink-0 flex items-center gap-1.5 select-none group cursor-pointer pt-2 pb-1 pr-6 pl-2 relative">
           <div className="relative w-8 h-8 flex items-center justify-center">
             <svg className="absolute w-[120%] h-[120%] text-emerald-200 drop-shadow-sm group-hover:animate-[spin_4s_linear_infinite]" viewBox="0 0 100 100" fill="currentColor" stroke="var(--color-ink)" strokeWidth="4" strokeLinejoin="round">
               <path d="M50 5 L60 30 L85 25 L75 50 L95 65 L70 70 L75 95 L50 80 L25 95 L30 70 L5 65 L25 50 L15 25 L40 30 Z" />
             </svg>
             <div className="w-[12px] h-[12px] bg-white border-[3px] border-ink rounded-full absolute z-10" />
           </div>
           
           <div className="relative mt-1 px-2">
              <svg className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] text-[#fbcfe8] -rotate-[1deg]" viewBox="0 0 100 40" preserveAspectRatio="none">
                 <path d="M5 10 Q 50 0 95 10 C 98 20 98 30 90 35 Q 50 45 10 35 C 2 30 2 20 5 10 Z" fill="currentColor" stroke="var(--color-ink)" strokeWidth="2.5" strokeDasharray="4 4"/>
              </svg>
              <span className="font-logo text-[24px] md:text-[28px] font-black tracking-widest text-ink relative z-10 uppercase pt-2 inline-block">TRAN HIEN</span>
           </div>

           <div className="relative w-6 h-6 flex items-center justify-center -mt-4 ml-1 group-hover:-translate-y-1 transition-transform duration-300 hidden md:flex">
              <svg className="absolute w-full h-full text-yellow-300 drop-shadow-sm" viewBox="0 0 100 100" fill="currentColor" stroke="var(--color-ink)" strokeWidth="5" strokeLinejoin="round">
                 <path d="M50 0 L58 35 L100 50 L58 65 L50 100 L42 65 L0 50 L42 35 Z" />
              </svg>
           </div>
        </div>
        <ul className="flex items-center gap-6 md:gap-10">
          {tabs.map((tab) => (
            <li key={tab} className="relative px-2">
              <button
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "font-sans font-semibold text-[13px] uppercase tracking-[0.05em] transition-colors pb-1",
                  activeTab === tab ? "text-crimson" : "text-ink hover:text-crimson"
                )}
              >
                {tab}
              </button>
              {activeTab === tab && (
                <svg
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[60px] h-[10px] text-crimson preserve-3d pointer-events-none"
                  viewBox="0 0 100 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M 5 15 Q 25 5 45 15 T 85 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="nav-squiggle"
                  />
                </svg>
              )}
            </li>
          ))}
        </ul>
        {lastSaved && (
          <div className="hidden lg:flex flex-col items-end opacity-20 hover:opacity-100 transition-opacity ml-4 mr-4">
            <span className="text-[8px] font-mono uppercase tracking-tighter">Auto-Saved</span>
            <span className="text-[10px] font-mono leading-none">{lastSaved}</span>
          </div>
        )}
        <button
          onClick={onLogout}
          className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded border border-ink/20 hover:bg-ink hover:text-paper transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
