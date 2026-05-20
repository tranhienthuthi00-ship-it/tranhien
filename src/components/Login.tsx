import { useState } from "react";
import type { FormEvent } from "react";
import { Lock, Unlock, HelpCircle, History, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [useRawMode, setUseRawMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [history, setHistory] = useState<string[]>(() => {
    try {
      const h = localStorage.getItem("spatial_hub_username_history");
      return h ? JSON.parse(h) : [];
    } catch (e) {
      return [];
    }
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    
    // Process username according to Raw Mode setting
    const cleanUsername = useRawMode ? username : username.trim().toLowerCase();
    
    if (!cleanUsername) {
      setError("Tên đăng nhập không được để trống.");
      return;
    }

    const email = cleanUsername.includes("@") ? cleanUsername : `${cleanUsername}@spatialhub.abc`;
    
    try {
      if (isRegister) {
        // REGISTER MODE
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccessMsg("Đăng ký tài khoản mới thành công!");
        
        // Save to login history on success
        saveToHistory(cleanUsername);
        setTimeout(() => {
          onLogin();
        }, 1200);
      } else {
        // SIGN IN MODE
        await signInWithEmailAndPassword(auth, email, password);
        
        // Save to login history on success
        saveToHistory(cleanUsername);
        onLogin();
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === "auth/operation-not-allowed") {
        setError("LỖI: Bạn cần kích hoạt Email/Password trong Firebase Console.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác hoặc bấm Đăng nhập.");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        if (isRegister) {
          setError("Lỗi đăng ký tài khoản. Vui lòng kiểm tra lại mật khẩu (phải từ 6 ký tự).");
        } else {
          setError("Sai tên đăng nhập hoặc mật khẩu. Hãy kiểm tra kĩ chữ viết HOA/thường, khoảng trắng hoặc thử bật 'Đăng nhập nguyên bản'.");
        }
      } else {
        setError("Lỗi đăng nhập: " + err.message);
      }
    }
  };

  const saveToHistory = (name: string) => {
    try {
      const existing = localStorage.getItem("spatial_hub_username_history");
      let list: string[] = existing ? JSON.parse(existing) : [];
      if (!list.includes(name)) {
        list.push(name);
        localStorage.setItem("spatial_hub_username_history", JSON.stringify(list));
        setHistory(list);
      }
      localStorage.setItem("spatial_hub_last_username", name);
    } catch (e) {
      console.error(e);
    }
  };

  const selectFromHistory = (name: string) => {
    setUsername(name);
    setShowHistory(false);
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem("spatial_hub_username_history");
      setHistory([]);
    } catch (e) {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#f4f1ea]">
      {/* Hand-drawn background elements */}
      <svg className="absolute top-[10%] left-[10%] w-32 h-32 text-ink/10 -rotate-12" viewBox="0 0 100 100" fill="currentColor">
        <path d="M 50 10 C 20 10 10 40 10 50 C 10 60 20 90 50 90 C 80 90 90 60 90 50 C 90 40 80 10 50 10 Z M 35 40 A 5 5 0 1 1 45 40 A 5 5 0 1 1 35 40 M 55 40 A 5 5 0 1 1 65 40 A 5 5 0 1 1 55 40 M 35 60 Q 50 75 65 60" />
      </svg>
      <svg className="absolute bottom-[20%] right-[10%] w-24 h-24 text-crimson/10 rotate-12.5" viewBox="0 0 100 100" fill="currentColor">
        <path d="M 50 20 A 20 20 0 0 0 10 40 Q 10 60 50 90 Q 90 60 90 40 A 20 20 0 0 0 50 20 Z" />
      </svg>

      <div className="w-full max-w-md animate-in slide-in-from-bottom-8 fade-in duration-700">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4 relative z-10 group cursor-default">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="absolute w-[120%] h-[120%] text-emerald-200 drop-shadow-sm group-hover:animate-[spin_10s_linear_infinite]" viewBox="0 0 100 100" fill="currentColor" stroke="var(--color-ink)" strokeWidth="4" strokeLinejoin="round">
                <path d="M50 5 L60 30 L85 25 L75 50 L95 65 L70 70 L75 95 L50 80 L25 95 L30 70 L5 65 L25 50 L15 25 L40 30 Z" />
              </svg>
              <div className="w-[18px] h-[18px] bg-white border-[3px] border-ink rounded-full absolute z-10" />
            </div>
            <div className="absolute -inset-10 flex items-center justify-center pointer-events-none -z-10">
              <svg className="w-full h-full text-yellow-100 opacity-50" viewBox="0 0 200 200" fill="currentColor">
                <circle cx="100" cy="100" r="100" />
              </svg>
            </div>
          </div>

          <div className="relative mt-2 px-4 mb-2 inline-block">
            <svg className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] text-[#fbcfe8] -rotate-[1deg]" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path d="M5 10 Q 50 0 95 10 C 98 20 98 30 90 35 Q 50 45 10 35 C 2 30 2 20 5 10 Z" fill="currentColor" stroke="var(--color-ink)" strokeWidth="2.5" strokeDasharray="4 4"/>
            </svg>
            <h1 className="font-logo text-[36px] font-black tracking-widest text-ink relative z-10 uppercase pt-2 inline-block">TRAN HIEN</h1>
          </div>
          <p className="hand-text text-2xl text-ink/70">Welcome to your spatial hub</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 sketch-border shadow-xl relative z-20">
          
          {/* Dual Tabs selection */}
          <div className="flex border-b-2 border-dashed border-ink/20 mb-6 font-sans">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError("");
                setSuccessMsg("");
              }}
              className={cn(
                "flex-1 text-center py-2.5 font-bold text-sm uppercase tracking-wider transition-all border-b-3",
                !isRegister ? "border-ink text-ink scale-[1.02]" : "border-transparent text-ink/40 hover:text-ink/60"
              )}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError("");
                setSuccessMsg("");
              }}
              className={cn(
                "flex-1 text-center py-2.5 font-bold text-sm uppercase tracking-wider transition-all border-b-3",
                isRegister ? "border-crimson text-crimson scale-[1.02]" : "border-transparent text-ink/40 hover:text-ink/60"
              )}
            >
              Bộ Đăng ký mới
            </button>
          </div>

          <div className="flex items-center justify-center mb-4 text-ink">
            <div className="relative" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
              {isHovering || (username.length > 0 && password.length > 0) ? (
                <Unlock size={28} strokeWidth={2.5} className="animate-in zoom-in duration-300 text-emerald-600" />
              ) : (
                <Lock size={28} strokeWidth={2.5} />
              )}
            </div>
          </div>

          <div className="space-y-4 font-sans">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-sans font-bold text-[10px] opacity-60 tracking-widest uppercase">Username hoặc Email</label>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowHistory(!showHistory);
                      setShowHelp(false);
                    }}
                    className="text-[10px] text-crimson font-bold uppercase tracking-wide hover:underline flex items-center gap-1"
                  >
                    <History size={10} /> {showHistory ? "Ẩn lịch sử" : "Lịch sử thiết bị"}
                  </button>
                )}
              </div>

              {/* Saved Usernames on Device */}
              {showHistory && history.length > 0 && (
                <div className="bg-[#fcfbf9] border-2 border-dashed border-ink/20 p-3 rounded-lg my-1 animate-in slide-in-from-top-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold opacity-60 uppercase">Đã từng đăng nhập trên máy này:</span>
                    <button
                      type="button"
                      onClick={clearHistory}
                      className="text-[9px] text-gray-500 hover:text-crimson flex items-center gap-1 font-bold"
                    >
                      <Trash2 size={10} /> Xóa lịch sử
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {history.map((name, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectFromHistory(name)}
                        className="text-xs bg-ink/5 hover:bg-ink hover:text-white px-2 py-1 rounded border border-ink/10 transition-colors"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                className="sketch-input w-full text-base font-sans bg-white/50"
                placeholder={isRegister ? "Chọn tên viết liền không dấu, ví dụ: tranhien00" : "Nhập tên đăng nhập của bạn..."}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
                required
              />
            </div>
            
            <div className="space-y-1">
              <label className="font-sans font-bold text-[10px] opacity-60 tracking-widest uppercase">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="sketch-input w-full text-base font-mono tracking-widest bg-white/50"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Advanced & Diagnostics Options */}
            <div className="pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rawMode"
                  checked={useRawMode}
                  onChange={(e) => setUseRawMode(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-crimson focus:ring-crimson"
                />
                <label htmlFor="rawMode" className="text-xs text-ink/70 cursor-pointer select-none font-medium flex items-center gap-1">
                  💡 Giữ nguyên viết hoa & khoảng trắng nguyên bản
                </label>
              </div>
              <p className="text-[10px] text-ink/40 mt-0.5 ml-5 leading-normal">
                (Bật tính năng này nếu tài khoản cũ của bạn được tạo có viết HOA, khoảng trắng và hiện đang bị lỗi đăng nhập không đúng tài khoản).
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-crimson rounded-lg p-3 text-xs leading-normal flex items-start gap-2 animate-in fade-in duration-300">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-crimson" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-xs leading-normal flex items-start gap-2 animate-in fade-in duration-300">
                <CheckCircle size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                <div className="flex-1">{successMsg}</div>
              </div>
            )}

            <button 
              type="submit"
              disabled={!username || !password}
              className={cn(
                "w-full sketch-button py-2.5 text-base font-bold mt-2 transition-all duration-300",
                username && password 
                  ? (isRegister 
                      ? "bg-crimson border-crimson text-white hover:opacity-90" 
                      : "sketch-button-primary bg-ink text-paper hover:bg-crimson hover:text-white") 
                  : "opacity-40"
              )}
            >
              {isRegister ? "Đăng ký tài khoản" : "Truy cập hệ thống →"}
            </button>
          </div>

          <div className="mt-6 border-t border-dashed border-ink/10 pt-4 flex justify-between items-center text-xs text-ink/60">
            <button
              type="button"
              onClick={() => {
                setShowHelp(!showHelp);
                setShowHistory(false);
              }}
              className="hover:text-crimson flex items-center gap-1 font-medium transition-colors"
            >
              <HelpCircle size={14} /> Bạn đang tìm dữ liệu cũ?
              {showHelp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {showHelp && (
            <div className="bg-[#fdfdfd] border-2 border-dashed border-crimson/20 p-4 rounded-lg mt-3 text-xs text-ink/80 space-y-2 leading-relaxed animate-in slide-in-from-top-2">
              <h4 className="font-bold text-crimson flex items-center gap-1">🛡️ Hướng dẫn Khôi phục Dữ liệu:</h4>
              <p>
                1. <strong>Do lỗi gõ nhầm tên đăng nhập:</strong> Trước đây, khi sai tên đăng nhập hoặc gõ nhầm chữ HOA/thường, hệ thống cũ đã vô tình <strong className="text-crimson">tạo tài khoản trống mới</strong> thay vì báo lỗi.
              </p>
              <p>
                2. <strong>Cách sửa:</strong> Hãy bấm nút <strong>"Lịch sử thiết bị"</strong> ở góc phải mục Username để tìm ngay chính xác tên đăng nhập cũ bạn từng dùng trên máy này, hoặc thử gõ lại đúng chữ viết hoa của tài khoản gốc.
              </p>
              <p>
                3. Nếu bạn vẫn không tìm lại được dữ liệu cũ, đừng lo! Sau khi đăng nhập, hệ thống sẽ tự động quét cơ sở dữ liệu và <strong>Local Storage</strong> bản lưu để hỗ trợ khôi phục đầy đủ.
              </p>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
