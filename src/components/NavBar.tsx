import { cn } from "@/lib/utils";

export type Tab = "English Hub" | "Calendar" | "Collections" | "Journal";

export function NavBar({ 
  activeTab, 
  setActiveTab, 
  lastSaved, 
  onLogout, 
  dueCount = 0,
  theme = "handdrawn",
  onToggleTheme
}: { 
  activeTab: Tab; 
  setActiveTab: (tab: Tab) => void; 
  lastSaved?: string; 
  onLogout: () => void; 
  dueCount?: number;
  theme?: "handdrawn" | "minimal";
  onToggleTheme?: () => void;
}) {
  const tabs: Tab[] = ["Journal", "English Hub", "Calendar", "Collections"];

  const getTabLabel = (tab: Tab) => {
    switch (tab) {
      case "English Hub": return "ENG";
      case "Collections": return "HUB";
      case "Calendar": return "CAL";
      case "Journal": return "HOME";
      default: return tab;
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-paper border-b-2 border-dashed border-ink/20 py-2 md:py-3">
      <div className="max-w-5xl mx-auto px-2 md:px-4 flex justify-between items-center gap-1 md:gap-4 overflow-hidden">
        <div 
          onClick={onToggleTheme}
          title="Nhấp vào đây để thay đổi giao diện (Phong cách vẽ tay 🎨 / Phong cách tối giản ✨)"
          className="shrink-0 flex items-center gap-1.5 select-none group cursor-pointer pt-1 md:pt-2 pb-1 pr-1 md:pr-6 pl-1 relative hover:scale-[1.03] transition-transform duration-200"
        >
           <div className="relative w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">
             <svg className={cn("absolute w-[120%] h-[120%] drop-shadow-sm group-hover:animate-[spin_4s_linear_infinite]", theme === "minimal" ? "text-rose-200" : "text-emerald-200")} viewBox="0 0 100 100" fill="currentColor" stroke="var(--color-ink)" strokeWidth="4" strokeLinejoin="round">
               <path d="M50 5 L60 30 L85 25 L75 50 L95 65 L70 70 L75 95 L50 80 L25 95 L30 70 L5 65 L25 50 L15 25 L40 30 Z" />
             </svg>
             <div className="w-[8px] h-[8px] md:w-[12px] md:h-[12px] bg-white border-[2px] md:border-[3px] border-ink rounded-full absolute z-10" />
           </div>
           
           <div className="relative mt-1 px-1 md:px-2 hidden sm:block">
              {theme !== "minimal" && (
                <svg className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] text-[#fbcfe8] -rotate-[1deg]" viewBox="0 0 100 40" preserveAspectRatio="none">
                   <path d="M5 10 Q 50 0 95 10 C 98 20 98 30 90 35 Q 50 45 10 35 C 2 30 2 20 5 10 Z" fill="currentColor" stroke="var(--color-ink)" strokeWidth="2.5" strokeDasharray="4 4"/>
                </svg>
              )}
              <span className={cn(
                "font-logo text-[14px] sm:text-[18px] md:text-[28px] font-black tracking-widest text-ink relative z-10 uppercase pt-2 inline-block transition-colors",
                theme === "minimal" ? "text-rose-600 hover:text-rose-700" : ""
              )}>
                TRAN HIEN
              </span>
           </div>

           {theme !== "minimal" && (
             <div className="relative w-6 h-6 flex items-center justify-center -mt-4 ml-1 group-hover:-translate-y-1 transition-transform duration-300 hidden md:flex">
                <svg className="absolute w-full h-full text-yellow-300 drop-shadow-sm" viewBox="0 0 100 100" fill="currentColor" stroke="var(--color-ink)" strokeWidth="5" strokeLinejoin="round">
                   <path d="M50 0 L58 35 L100 50 L58 65 L50 100 L42 65 L0 50 L42 35 Z" />
                </svg>
             </div>
           )}
        </div>
        <ul className="flex flex-1 justify-center md:justify-start items-center gap-3 sm:gap-6 md:gap-10">
          {tabs.map((tab) => (
            <li key={tab} className="relative px-0 md:px-2 flex items-center">
              <button
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "font-sans font-bold md:font-semibold text-[9px] sm:text-[11px] md:text-[13px] uppercase tracking-wider md:tracking-[0.05em] transition-colors pb-1 flex items-center gap-1",
                  activeTab === tab ? "text-crimson" : "text-ink hover:text-crimson"
                )}
              >
                <span className="md:hidden">{getTabLabel(tab)}</span>
                <span className="hidden md:inline">{tab === "Journal" ? "Home" : tab}</span>
                {tab === "English Hub" && dueCount > 0 && (
                  <span className="inline-flex items-center justify-center bg-crimson text-white text-[8px] md:text-[10px] w-3.5 h-3.5 md:w-5 md:h-5 rounded-full font-black -mt-1 shadow-sm">
                    {dueCount > 99 ? "99+" : dueCount}
                  </span>
                )}
              </button>
              {activeTab === tab && (
                theme === "minimal" ? (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-crimson rounded-full" />
                ) : (
                  <svg
                    className="absolute -bottom-2 md:-bottom-2 left-1/2 -translate-x-1/2 w-[30px] md:w-[60px] h-[6px] md:h-[10px] text-crimson preserve-3d pointer-events-none"
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
                )
              )}
            </li>
          ))}
        </ul>
        <div className="flex items-center shrink-0">
          {lastSaved && (
            <div className="hidden lg:flex flex-col items-end opacity-20 hover:opacity-100 transition-opacity ml-2 mr-4">
              <span className="text-[8px] font-mono uppercase tracking-tighter">Auto-Saved</span>
              <span className="text-[10px] font-mono leading-none">{lastSaved}</span>
            </div>
          )}
          <button
            onClick={onLogout}
            className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest px-2 py-1 md:px-3 md:py-1.5 rounded border border-ink/20 hover:bg-ink hover:text-paper transition-colors"
          >
            Out
          </button>
        </div>
      </div>
    </nav>
  );
}
