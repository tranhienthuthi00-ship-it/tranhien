import { cn } from "@/lib/utils";
import { 
  Home, 
  FolderTree, 
  FolderKanban, 
  GraduationCap, 
  Languages, 
  Calendar as CalendarIcon,
  LogOut,
  LogIn
} from "lucide-react";

export type Tab = "Journal" | "Collections" | "Projects" | "Học hành" | "English Hub" | "Calendar";

export function NavBar({ 
  activeTab, 
  setActiveTab, 
  lastSaved, 
  onLogout, 
  dueCount = 0,
  theme = "handdrawn",
  onToggleTheme,
  isLoggedIn = false
}: { 
  activeTab: Tab; 
  setActiveTab: (tab: Tab) => void; 
  lastSaved?: string; 
  onLogout: () => void; 
  dueCount?: number;
  theme?: "handdrawn" | "minimal";
  onToggleTheme?: () => void;
  isLoggedIn?: boolean;
}) {
  const tabs: { id: Tab; label: string; short: string; icon: any }[] = [
    { id: "Journal", label: "Home", short: "HOME", icon: Home },
    { id: "Collections", label: "Collections", short: "HUB", icon: FolderTree },
    { id: "Projects", label: "Projects", short: "PRJ", icon: FolderKanban },
    { id: "Học hành", label: "Học hành", short: "HỌC", icon: GraduationCap },
    { id: "English Hub", label: "English Hub", short: "ENG", icon: Languages },
    { id: "Calendar", label: "Calendar", short: "CAL", icon: CalendarIcon },
  ];

  return (
    <aside className="w-full md:w-60 lg:w-64 bg-paper border-b-2 md:border-b-0 md:border-r-2 border-dashed border-ink/20 flex flex-col justify-between shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto z-40 p-3 md:p-5 select-none transition-all">
      {/* Top: Logo & Brand */}
      <div className="flex flex-col gap-4">
        <div 
          onClick={onToggleTheme}
          title="Nhấp để chuyển giao diện (Vẽ tay 🎨 / Tối giản ✨)"
          className="flex items-center gap-2 cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          {/* Handdrawn Star Icon */}
          <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
            <svg 
              className="absolute w-[120%] h-[120%] text-emerald-200 drop-shadow-sm group-hover:animate-[spin_4s_linear_infinite]" 
              viewBox="0 0 100 100" 
              fill="currentColor" 
              stroke="var(--color-ink)" 
              strokeWidth="4" 
              strokeLinejoin="round"
            >
              <path d="M50 5 L60 30 L85 25 L75 50 L95 65 L70 70 L75 95 L50 80 L25 95 L30 70 L5 65 L25 50 L15 25 L40 30 Z" />
            </svg>
            <div className="w-[10px] h-[10px] bg-white border-[2.5px] border-ink rounded-full absolute z-10" />
          </div>

          <div className="relative flex-1 min-w-0">
            <svg className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] text-[#fbcfe8] -rotate-[1deg]" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path d="M5 10 Q 50 0 95 10 C 98 20 98 30 90 35 Q 50 45 10 35 C 2 30 2 20 5 10 Z" fill="currentColor" stroke="var(--color-ink)" strokeWidth="2.5" strokeDasharray="4 4"/>
            </svg>
            <span className="font-logo keep-logo-style text-[18px] md:text-[22px] font-black tracking-widest text-ink relative z-10 uppercase pt-1 inline-block truncate">
              TRAN HIEN
            </span>
          </div>

          <div className="relative w-5 h-5 hidden md:flex items-center justify-center group-hover:-translate-y-0.5 transition-transform">
            <svg className="w-full h-full text-yellow-300 drop-shadow-sm" viewBox="0 0 100 100" fill="currentColor" stroke="var(--color-ink)" strokeWidth="5" strokeLinejoin="round">
              <path d="M50 0 L58 35 L100 50 L58 65 L50 100 L42 65 L0 50 L42 35 Z" />
            </svg>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-full border-t border-dashed border-ink/15 my-1" />

        {/* Vertical Navigation Tabs */}
        <nav className="flex flex-row md:flex-col gap-1.5 md:gap-2 overflow-x-auto md:overflow-x-visible py-1 md:py-0">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const isFirst = index === 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={isFirst ? { backgroundColor: "#faf3eb" } : undefined}
                className={cn(
                  "relative w-full text-left px-3 py-2 md:py-2.5 rounded-xl transition-all duration-150 flex items-center justify-between group",
                  isActive
                    ? "bg-[#FEF08A] text-ink font-black border-2 border-ink shadow-[2.5px_2.5px_0px_#141414] translate-x-0.5"
                    : "text-ink/75 font-bold hover:text-ink hover:bg-black/5 border-2 border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={cn("w-4 h-4 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-ink stroke-[2.5]" : "text-ink/60")} />
                  <span className="text-xs md:text-sm uppercase tracking-wider truncate">
                    <span className="md:hidden">{tab.short}</span>
                    <span className="hidden md:inline">{tab.label}</span>
                  </span>
                </div>

                {/* Due Count Badge for English Hub */}
                {tab.id === "English Hub" && dueCount > 0 && (
                  <span className="shrink-0 bg-crimson text-white text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-full font-black shadow-sm ml-1">
                    {dueCount > 99 ? "99+" : dueCount}
                  </span>
                )}

                {/* Active Indicator Squiggle / Dot */}
                {isActive && (
                  <span className="hidden md:block w-2 h-2 rounded-full bg-ink shrink-0 ml-1" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Cloud Sync Status & Account */}
      <div className="hidden md:flex flex-col gap-3 pt-4 border-t border-dashed border-ink/20">
        <div 
          onClick={!isLoggedIn ? onLogout : undefined}
          className={cn(
            "flex items-center justify-between text-[11px] font-bold px-3 py-2 rounded-xl border-2 transition-all cursor-pointer",
            isLoggedIn 
              ? "bg-emerald-50 text-emerald-900 border-emerald-500 shadow-[2px_2px_0px_#059669]" 
              : "bg-emerald-50/80 text-emerald-950 border-emerald-400"
          )}
          title="Đã kết nối Firebase Firestore - Dữ liệu tự động đồng bộ thời gian thực trên mọi thiết bị!"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Đã đồng bộ ☁️</span>
          </div>
          <span className="text-[9px] font-mono text-emerald-700 uppercase">Live</span>
        </div>

        <button
          onClick={onLogout}
          title={isLoggedIn ? "Đăng xuất tài khoản" : "Đăng nhập để đồng bộ dữ liệu trên các thiết bị"}
          className="w-full flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider px-3 py-2 rounded-xl border-2 border-ink/30 hover:border-ink hover:bg-ink hover:text-paper transition-all active:translate-x-0.5 active:translate-y-0.5"
        >
          {isLoggedIn ? (
            <>
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng Xuất</span>
            </>
          ) : (
            <>
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng Nhập</span>
            </>
          )}
        </button>

        {lastSaved && (
          <div className="text-[10px] text-ink/40 text-center font-mono">
            {lastSaved}
          </div>
        )}
      </div>
    </aside>
  );
}
