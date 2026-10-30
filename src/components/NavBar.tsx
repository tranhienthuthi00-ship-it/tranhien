import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Home, 
  GitFork, 
  Kanban, 
  Calendar as CalendarIcon, 
  BookMarked, 
  Languages, 
  Cloud, 
  Palette, 
  LogOut, 
  LogIn, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from "lucide-react";

export type Tab = "Journal" | "Collections" | "Projects" | "Học hành" | "English Hub" | "Calendar";

interface NavItemConfig {
  id: Tab;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  badge?: number;
}

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems: NavItemConfig[] = [
    {
      id: "Journal",
      label: "Dashboard",
      sublabel: "Trang chủ & Nhật ký",
      icon: <Home size={18} className="shrink-0" />,
    },
    {
      id: "Học hành",
      label: "Sơ đồ tư duy",
      sublabel: "Mindmap xương cá & bài học",
      icon: <GitFork size={18} className="shrink-0 text-emerald-400" />,
    },
    {
      id: "Projects",
      label: "Projects",
      sublabel: "Bảng Kanban công việc",
      icon: <Kanban size={18} className="shrink-0 text-amber-400" />,
    },
    {
      id: "Calendar",
      label: "Calendar",
      sublabel: "Lịch trình & Kế hoạch",
      icon: <CalendarIcon size={18} className="shrink-0 text-sky-400" />,
    },
    {
      id: "Collections",
      label: "Note",
      sublabel: "Mục tiêu & Thói quen",
      icon: <BookMarked size={18} className="shrink-0 text-rose-400" />,
    },
    {
      id: "English Hub",
      label: "Sách & Unit",
      sublabel: "English Hub & Luyện tập",
      icon: <Languages size={18} className="shrink-0 text-indigo-400" />,
      badge: dueCount > 0 ? dueCount : undefined,
    },
  ];

  const handleSelectTab = (tab: Tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* ================= MOBILE TOP HEADER (Screen < md) ================= */}
      <header className="md:hidden sticky top-0 z-40 bg-[#141414] text-white px-4 py-3 flex items-center justify-between border-b border-white/10 shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Mở menu điều hướng"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-white">intelly</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-medium">
              {navItems.find(i => i.id === activeTab)?.label || activeTab}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dueCount > 0 && activeTab !== "English Hub" && (
            <button 
              onClick={() => handleSelectTab("English Hub")}
              className="bg-crimson text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
            >
              ENG {dueCount > 99 ? "99+" : dueCount}
            </button>
          )}
          <div 
            className="flex items-center gap-1.5 text-[10px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-full"
            title="Dữ liệu đồng bộ đám mây Firestore thời gian thực"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sync</span>
          </div>
        </div>
      </header>

      {/* ================= MOBILE SLIDE-OVER DRAWER ================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-[270px] bg-[#141414] text-[#8E8E93] p-5 flex flex-col justify-between z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-white shadow-sm font-black text-sm">
                    ✨
                  </div>
                  <div>
                    <div className="text-[20px] font-bold text-white tracking-tight leading-tight">
                      intelly
                    </div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-[#8E8E93]">
                      Tran Hien Space
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* General Section */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider text-[#555] pl-3 mb-1.5 font-bold">
                  General
                </span>
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left",
                        isActive 
                          ? "bg-white/10 text-white font-bold" 
                          : "hover:bg-white/10 hover:text-white text-[#8E8E93]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="bg-crimson text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tools Section */}
              <div className="flex flex-col gap-1.5 mt-6 pt-4 border-t border-white/10">
                <span className="text-[11px] uppercase tracking-wider text-[#555] pl-3 mb-1.5 font-bold">
                  Tools
                </span>
                
                {/* Cloud Sync Status */}
                <div 
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/20"
                  title="Dữ liệu tự động đồng bộ tức thì trên mọi thiết bị qua Cloud Firestore"
                >
                  <Cloud size={16} className="shrink-0 text-emerald-400 animate-pulse" />
                  <span>Đã đồng bộ Cloud ☁️</span>
                </div>

                {/* Theme switch */}
                {onToggleTheme && (
                  <button 
                    onClick={onToggleTheme}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#8E8E93] hover:bg-white/10 hover:text-white transition-colors text-left"
                    title="Đổi phong cách giao diện"
                  >
                    <div className="flex items-center gap-3">
                      <Palette size={16} />
                      <span>Giao diện</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white">
                      {theme === "handdrawn" ? "Vẽ tay 🎨" : "Tối giản ✨"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Logout button */}
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-[#FF5A5F] hover:bg-white/5 transition-colors text-left mt-auto border-t border-white/10 pt-4"
            >
              {isLoggedIn ? (
                <>
                  <LogOut size={16} />
                  <span>Log out</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Log in</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ================= DESKTOP VERTICAL SIDEBAR (Screen >= md) ================= */}
      <aside 
        className={cn(
          "hidden md:flex flex-col justify-between bg-[#141414] text-[#8E8E93] shrink-0 h-screen sticky top-0 transition-all duration-300 z-40 select-none border-r border-white/5",
          isCollapsed ? "w-[76px] p-3" : "w-[260px] p-5"
        )}
      >
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
          {/* Logo & Collapse button */}
          <div className={cn("flex items-center mb-6", isCollapsed ? "justify-center" : "justify-between pl-2 pr-1")}>
            {!isCollapsed ? (
              <div 
                onClick={onToggleTheme}
                className="flex items-center gap-2.5 cursor-pointer group"
                title="Nhấp để đổi phong cách giao diện"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-white shadow-sm font-black text-sm group-hover:scale-105 transition-transform">
                  ✨
                </div>
                <div>
                  <div className="text-[22px] font-bold text-white tracking-tight leading-none group-hover:text-amber-200 transition-colors">
                    intelly
                  </div>
                  <div className="text-[9px] uppercase font-bold tracking-widest text-[#8E8E93] mt-1">
                    Tran Hien Space
                  </div>
                </div>
              </div>
            ) : (
              <div 
                onClick={onToggleTheme}
                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-white shadow-sm font-black text-base cursor-pointer hover:scale-105 transition-transform"
                title="intelly - Nhấp đổi theme"
              >
                ✨
              </div>
            )}

            {/* Collapse toggle */}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors",
                isCollapsed && "hidden"
              )}
              title={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* If collapsed, quick expand button at top */}
          {isCollapsed && (
            <div className="flex justify-center mb-4">
              <button 
                onClick={() => setIsCollapsed(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title="Mở rộng menu"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* GENERAL SECTION */}
          <div className="flex flex-col gap-1.5">
            {!isCollapsed && (
              <span className="text-[11px] uppercase tracking-wider text-[#555] pl-3 mb-1.5 font-bold">
                General
              </span>
            )}

            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  title={isCollapsed ? `${item.label} (${item.sublabel})` : undefined}
                  className={cn(
                    "flex items-center rounded-xl text-sm font-semibold transition-all text-left relative group",
                    isCollapsed 
                      ? "justify-center p-3" 
                      : "justify-between px-3 py-2.5",
                    isActive 
                      ? "bg-white/10 text-white font-bold shadow-sm ring-1 ring-white/10" 
                      : "hover:bg-white/10 hover:text-white text-[#8E8E93]"
                  )}
                >
                  <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                    {item.icon}
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge !== undefined && (
                    <span className="bg-crimson text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}

                  {isCollapsed && item.badge !== undefined && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-crimson" />
                  )}
                </button>
              );
            })}
          </div>

          {/* TOOLS SECTION */}
          <div className="flex flex-col gap-1.5 mt-6 pt-4 border-t border-white/5">
            {!isCollapsed && (
              <span className="text-[11px] uppercase tracking-wider text-[#555] pl-3 mb-1.5 font-bold">
                Tools
              </span>
            )}

            {/* Cloud Sync Status */}
            <div 
              className={cn(
                "flex items-center rounded-xl text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 cursor-default",
                isCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"
              )}
              title="Dữ liệu tự động đồng bộ thời gian thực trên mọi thiết bị qua Cloud Firestore"
            >
              <Cloud size={15} className="shrink-0 text-emerald-400 animate-pulse" />
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="font-semibold leading-tight">Đã đồng bộ Cloud</span>
                  <span className="text-[9px] text-emerald-400/70">Thời gian thực ☁️</span>
                </div>
              )}
            </div>

            {/* Theme switch */}
            {onToggleTheme && (
              <button 
                onClick={onToggleTheme}
                title="Thay đổi phong cách giao diện: Vẽ tay 🎨 / Tối giản ✨"
                className={cn(
                  "flex items-center rounded-xl text-xs font-semibold text-[#8E8E93] hover:bg-white/10 hover:text-white transition-colors text-left",
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Palette size={15} />
                  {!isCollapsed && <span>Giao diện</span>}
                </div>
                {!isCollapsed && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white">
                    {theme === "handdrawn" ? "🎨 Vẽ tay" : "✨ Tối giản"}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* LOGOUT / LOGIN FOOTER */}
        <div className="pt-4 border-t border-white/10 mt-auto">
          <button 
            onClick={onLogout}
            title={isLoggedIn ? "Đăng xuất tài khoản" : "Đăng nhập để đồng bộ đám mây"}
            className={cn(
              "flex items-center rounded-xl text-sm font-bold text-[#FF5A5F] hover:bg-white/5 transition-colors text-left w-full",
              isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
            )}
          >
            {isLoggedIn ? (
              <>
                <LogOut size={16} className="shrink-0" />
                {!isCollapsed && <span>Log out</span>}
              </>
            ) : (
              <>
                <LogIn size={16} className="shrink-0" />
                {!isCollapsed && <span>Log in</span>}
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
