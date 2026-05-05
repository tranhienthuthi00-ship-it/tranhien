import { useState } from "react";
import type { FormEvent } from "react";
import { Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

export function Login({ onLogin }: { onLogin: () => void }) {
  const [error, setError] = useState("");
  const [isHovering, setIsHovering] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLogin(); // App.tsx can also rely on auth state listener
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#f4f1ea]">
      {/* Hand-drawn background elements just for login */}
      <svg className="absolute top-[10%] left-[10%] w-32 h-32 text-ink/10 -rotate-12" viewBox="0 0 100 100" fill="currentColor">
        <path d="M 50 10 C 20 10 10 40 10 50 C 10 60 20 90 50 90 C 80 90 90 60 90 50 C 90 40 80 10 50 10 Z M 35 40 A 5 5 0 1 1 45 40 A 5 5 0 1 1 35 40 M 55 40 A 5 5 0 1 1 65 40 A 5 5 0 1 1 55 40 M 35 60 Q 50 75 65 60" />
      </svg>
      <svg className="absolute bottom-[20%] right-[10%] w-24 h-24 text-crimson/10 rotate-12.5" viewBox="0 0 100 100" fill="currentColor">
        <path d="M 50 20 A 20 20 0 0 0 10 40 Q 10 60 50 90 Q 90 60 90 40 A 20 20 0 0 0 50 20 Z" />
      </svg>

      <div className="w-full max-w-md animate-in slide-in-from-bottom-8 fade-in duration-700">
        <div className="text-center mb-8">
           <div className="flex justify-center mb-4 relative z-10 group cursor-default">
             <div className="relative w-16 h-16 flex items-center justify-center">
               <svg className="absolute w-[120%] h-[120%] text-emerald-200 drop-shadow-sm animate-[spin_10s_linear_infinite]" viewBox="0 0 100 100" fill="currentColor" stroke="var(--color-ink)" strokeWidth="4" strokeLinejoin="round">
                 <path d="M50 5 L60 30 L85 25 L75 50 L95 65 L70 70 L75 95 L50 80 L25 95 L30 70 L5 65 L25 50 L15 25 L40 30 Z" />
               </svg>
               <div className="w-[20px] h-[20px] bg-white border-[4px] border-ink rounded-full absolute z-10" />
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

        <div className="bg-white/80 backdrop-blur-sm p-8 sketch-border shadow-xl relative z-20">
          <div className="flex items-center justify-center mb-6 text-ink">
            <div className="relative" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
              {isHovering ? (
                <Unlock size={32} strokeWidth={2.5} className="animate-in zoom-in duration-300 text-emerald-600" />
              ) : (
                <Lock size={32} strokeWidth={2.5} />
              )}
            </div>
          </div>

          <div className="space-y-5">
            {error && (
              <div className="text-crimson hand-text text-xl pt-2 animate-in slide-in-from-top-2 text-center">
                * {error}
              </div>
            )}

            <button 
              onClick={handleGoogleLogin}
              className={cn(
                "w-full sketch-button py-3 text-lg font-bold mt-4 transition-all duration-300",
                "sketch-button-primary bg-ink text-paper hover:bg-crimson hover:text-white"
              )}
            >
              Sign In with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
