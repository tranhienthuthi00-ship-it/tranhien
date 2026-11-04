import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  LogIn,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  FileText,
  Users
} from "lucide-react";

export type Tab = "Journal" | "Collections" | "Projects" | "Học hành" | "Gõ Câu" | "English Hub" | "Calendar" | "Assets";
export type CollectionSubTab = "Lists" | "Habits" | "Places" | "Content" | "Assets";

interface NavBarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  activeCollectionSubTab?: CollectionSubTab;
  setActiveCollectionSubTab?: (subTab: CollectionSubTab) => void;
  lastSaved?: string;
  onLogout: () => void;
  dueCount?: number;
  theme?: "handdrawn" | "minimal";
  onToggleTheme?: () => void;
  isLoggedIn?: boolean;
}

export function NavBar({ 
  activeTab, 
  setActiveTab, 
  activeCollectionSubTab = "Lists",
  setActiveCollectionSubTab,
  lastSaved, 
  onLogout, 
  dueCount = 0,
  theme = "handdrawn",
  onToggleTheme,
  isLoggedIn = false
}: NavBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(true);
  const [activeModal, setActiveModal] = useState<"friends" | "feedback" | "notes" | "coming_soon" | null>(null);

  const mainNavItems = [
    { id: "Journal" as Tab, label: "Trang chủ" },
    { id: "Collections" as Tab, label: "Bộ sưu tập" },
    { id: "Projects" as Tab, label: "Dự án" },
    { id: "Học hành" as Tab, label: "Lộ trình & Kiến thức" },
    { id: "English Hub" as Tab, label: "English" },
    { id: "Calendar" as Tab, label: "Calendar" },
    { id: "Assets" as Tab, label: "Quản lý tài sản" },
    { id: "coming2", label: "Coming soon", isComingSoon: true },
  ];

  const bottomNavItems = [
    { id: "friends", label: "Tiến độ & Bạn bè", icon: Users },
    { id: "feedback", label: "Yêu cầu tính năng", icon: HelpCircle },
    { id: "notes", label: "Ghi chú", icon: FileText },
  ];

  return (
    <>
      <aside 
        className={cn(
          "relative bg-[#FAF7F2] border-r-2 border-gray-300 flex flex-col justify-between shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto z-40 p-4 select-none transition-all duration-300 font-sans",
          isCollapsed ? "w-20" : "w-full md:w-64"
        )}
      >
        {/* Collapse toggle button on the right edge */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          className="hidden md:flex absolute -right-3 top-28 w-6 h-6 rounded-full border-2 border-black bg-white shadow-sm items-center justify-center text-gray-700 hover:bg-gray-100 z-50 transition-transform hover:scale-110 active:scale-95"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          )}
        </button>

        {/* Top: Logo & Nav items */}
        <div className="flex flex-col gap-5">
          {/* Brand Header */}
          <div 
            onClick={onToggleTheme}
            className="flex items-center justify-center gap-1.5 cursor-pointer group py-1"
            title="Nhấp để chuyển giao diện"
          >
            {/* Mint Green 5-point Star */}
            <div className="relative w-6 h-6 shrink-0 flex items-center justify-center">
              <svg 
                className="w-full h-full text-emerald-200 drop-shadow-sm group-hover:rotate-45 transition-transform" 
                viewBox="0 0 100 100" 
                fill="currentColor" 
                stroke="#141414" 
                strokeWidth="4" 
                strokeLinejoin="round"
              >
                <path d="M50 5 L60 30 L85 25 L75 50 L95 65 L70 70 L75 95 L50 80 L25 95 L30 70 L5 65 L25 50 L15 25 L40 30 Z" />
              </svg>
              <div className="w-2 h-2 bg-white border-2 border-[#141414] rounded-full absolute z-10" />
            </div>

            {/* Pink Banner with TRAN HIEN */}
            {!isCollapsed && (
              <div className="relative px-3 py-1 bg-[#F0D5E4] border-2 border-dashed border-[#141414] rounded-xl flex items-center justify-center shadow-xs">
                <span className="font-mono text-sm md:text-base font-black tracking-widest text-[#141414] uppercase">
                  TRAN HIEN
                </span>
              </div>
            )}

            {/* Yellow 4-point Sparkle Star */}
            {!isCollapsed && (
              <div className="relative w-4 h-4 flex items-center justify-center group-hover:scale-125 transition-transform">
                <svg className="w-full h-full text-yellow-300 drop-shadow-xs" viewBox="0 0 100 100" fill="currentColor" stroke="#141414" strokeWidth="6" strokeLinejoin="round">
                  <path d="M50 0 L58 35 L100 50 L58 65 L50 100 L42 65 L0 50 L42 35 Z" />
                </svg>
              </div>
            )}
          </div>

          {/* Navigation List */}
          <nav className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible py-1 md:py-0">
            {mainNavItems.map((item) => {
              const isComing = (item as any).isComingSoon;
              const isCollections = item.id === "Collections";
              const isActive = !isComing && activeTab === item.id;

              const collectionSubItems: { id: CollectionSubTab; label: string }[] = [
                { id: "Lists", label: "Mục tiêu & Nhiệm vụ" },
                { id: "Habits", label: "Hành trình Glow up" },
                { id: "Places", label: "Địa điểm & Ăn uống" },
                { id: "Content", label: "Ý tưởng & Sáng tạo" },
              ];

              return (
                <div key={item.id} className="flex flex-col gap-1 w-full">
                  <button
                    onClick={() => {
                      if (isComing) {
                        setActiveModal("coming_soon");
                      } else if (isCollections) {
                        if (activeTab !== "Collections") {
                          setActiveTab("Collections");
                          setIsCollectionsOpen(true);
                        } else {
                          setIsCollectionsOpen(!isCollectionsOpen);
                        }
                      } else {
                        setActiveTab(item.id as Tab);
                      }
                    }}
                    className={cn(
                      "relative w-full text-left transition-all duration-150 flex items-center justify-between rounded-2xl group",
                      isCollapsed ? "px-2 py-2.5 justify-center" : "px-4 py-2.5",
                      isActive
                        ? "bg-[#5468B4] text-white font-bold border-2 border-[#141414] shadow-[3.5px_3.5px_0px_#141414]"
                        : isComing
                        ? "text-gray-400 font-medium hover:text-gray-600 bg-transparent"
                        : "text-gray-700 font-semibold hover:text-black hover:bg-black/5 bg-transparent"
                    )}
                  >
                    <span className={cn("text-sm md:text-[15px] truncate", isCollapsed && "hidden")}>
                      {item.label}
                    </span>

                    {isCollapsed && (
                      <span className="text-xs font-bold uppercase">
                        {item.label.substring(0, 2)}
                      </span>
                    )}

                    {/* Due count badge for English */}
                    {item.id === "English Hub" && dueCount > 0 && !isCollapsed && (
                      <span className="shrink-0 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">
                        {dueCount > 99 ? "99+" : dueCount}
                      </span>
                    )}

                    {/* Toggle Chevron for Collections */}
                    {isCollections && !isCollapsed && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeTab !== "Collections") {
                            setActiveTab("Collections");
                            setIsCollectionsOpen(true);
                          } else {
                            setIsCollectionsOpen(!isCollectionsOpen);
                          }
                        }}
                        className="p-1 hover:bg-black/10 rounded-lg transition-colors cursor-pointer"
                        title={isCollectionsOpen ? "Thu gọn mục nhỏ" : "Mở rộng mục nhỏ"}
                      >
                        <ChevronDown 
                          className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            isCollectionsOpen && "rotate-180",
                            isActive ? "text-white" : "text-gray-600"
                          )} 
                        />
                      </span>
                    )}
                  </button>

                  {/* Collections Toggle Submenu */}
                  {isCollections && !isCollapsed && isCollectionsOpen && (
                    <div className="flex flex-col gap-1 pl-3.5 ml-3 border-l-2 border-gray-300 py-1 transition-all">
                      {collectionSubItems.map((sub) => {
                        const isSubActive = activeTab === "Collections" && activeCollectionSubTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setActiveTab("Collections");
                              setActiveCollectionSubTab?.(sub.id);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between",
                              isSubActive
                                ? "bg-[#F8EFCB] text-black border-2 border-[#141414] shadow-[2px_2px_0px_#141414]"
                                : "text-gray-600 hover:text-black hover:bg-black/5"
                            )}
                          >
                            <span className="truncate">{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-4 pt-4">
          {/* Thin Divider Line */}
          <div className="w-full border-t border-gray-300" />

          {/* Bottom Links */}
          {!isCollapsed ? (
            <div className="flex flex-col gap-2">
              {bottomNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveModal(item.id as any)}
                  className="w-full text-left px-2 py-1.5 text-sm md:text-[15px] font-bold text-gray-800 hover:text-black hover:bg-black/5 rounded-xl transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {bottomNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveModal(item.id as any)}
                    title={item.label}
                    className="p-2 text-gray-600 hover:text-black rounded-lg hover:bg-black/5"
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          )}

          {/* User Profile Card */}
          <div className="w-full bg-white rounded-2xl border-2 border-gray-300 p-2.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Cute Cartoon Avatar */}
              <div className="w-9 h-9 rounded-full bg-amber-100 border border-gray-400 overflow-hidden shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="48" fill="#fef3c7" />
                  {/* Cap / Hair */}
                  <path d="M 20 40 Q 50 15 80 40 Q 85 45 75 48 Q 50 30 25 48 Z" fill="#3b4c8a" />
                  {/* Face */}
                  <ellipse cx="50" cy="56" rx="28" ry="24" fill="#fed7aa" />
                  {/* Eyes */}
                  <circle cx="40" cy="54" r="3" fill="#141414" />
                  <circle cx="60" cy="54" r="3" fill="#141414" />
                  {/* Smile */}
                  <path d="M 44 65 Q 50 70 56 65" fill="none" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Cheeks */}
                  <circle cx="34" cy="60" r="3" fill="#fca5a5" opacity="0.8" />
                  <circle cx="66" cy="60" r="3" fill="#fca5a5" opacity="0.8" />
                </svg>
              </div>

              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs md:text-sm text-gray-900 truncate">
                    Hien Tran
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Trình độ B1
                  </span>
                </div>
              )}
            </div>

            {/* Logout/Login small button */}
            {!isCollapsed && (
              <button
                onClick={onLogout}
                title={isLoggedIn ? "Đăng xuất" : "Đăng nhập"}
                className="p-1.5 text-gray-400 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isLoggedIn ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Interactive Modal for bottom links */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border-2 border-black shadow-[6px_6px_0px_#141414] p-6 max-w-md w-full animate-in fade-in zoom-in-95">
            {activeModal === "friends" && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-[#5468B4]" />
                  <h3 className="font-black text-lg text-gray-900">Tiến độ & Bạn bè</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Theo dõi tiến độ học tập hàng ngày cùng bạn bè, chia sẻ streak từ vựng và bảng xếp hạng thành viên năng nổ!
                </p>
                <div className="space-y-2 mb-5">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                    <span className="text-sm font-bold">Hien Tran (Bạn)</span>
                    <span className="text-xs font-semibold text-emerald-600">Streak: 12 ngày 🔥</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                    <span className="text-sm font-bold">Anna Le</span>
                    <span className="text-xs font-semibold text-emerald-600">Streak: 9 ngày 🔥</span>
                  </div>
                </div>
              </div>
            )}

            {activeModal === "feedback" && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle className="w-5 h-5 text-[#5468B4]" />
                  <h3 className="font-black text-lg text-gray-900">Yêu cầu tính năng</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Bạn có ý tưởng hay tính năng mới nào muốn bổ sung cho góc học tập Aio English không?
                </p>
                <textarea 
                  rows={3} 
                  placeholder="Nhập góp ý hoặc tính năng bạn mong muốn..." 
                  className="w-full border-2 border-gray-300 rounded-xl p-3 text-sm outline-none focus:border-black mb-4"
                />
              </div>
            )}

            {activeModal === "notes" && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-[#5468B4]" />
                  <h3 className="font-black text-lg text-gray-900">Ghi chú cá nhân</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Khu vực ghi chép nhanh những lưu ý quan trọng khi ôn luyện Tiếng Anh và kế hoạch năm 2026.
                </p>
                <div className="p-3 bg-[#F8EFCB] rounded-xl border-2 border-black text-xs leading-relaxed font-medium mb-4">
                  "Add up to": con số cộng lại thành tổng, hoặc tổng hợp ý nghĩa thành một kết quả chung.
                </div>
              </div>
            )}

            {activeModal === "coming_soon" && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-[#5468B4]" />
                  <h3 className="font-black text-lg text-gray-900">Tính năng sắp ra mắt</h3>
                </div>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                  Phân hệ này đang được phát triển để mang đến trải nghiệm học tập và ghi chép toàn diện nhất. Hãy đón chờ bản cập nhật tiếp theo nhé!
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-[#5468B4] hover:bg-[#46579a] text-white font-bold text-sm px-5 py-2 rounded-xl border border-black shadow-[2px_2px_0px_#141414] transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
