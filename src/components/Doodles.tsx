export function Doodles() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] opacity-[0.15] overflow-hidden text-[#1A1A1A]">
      {/* Stars */}
      <svg className="absolute top-[10%] left-[5%] w-8 h-8 rotate-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 10 L55 40 L85 45 L55 50 L50 80 L45 50 L15 45 L45 40 Z" />
      </svg>
      <svg className="absolute top-[40%] right-[8%] w-6 h-6 -rotate-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 10 L55 40 L85 45 L55 50 L50 80 L45 50 L15 45 L45 40 Z" />
      </svg>
      <svg className="absolute bottom-[25%] left-[8%] w-5 h-5 rotate-[25deg]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 10 L55 40 L85 45 L55 50 L50 80 L45 50 L15 45 L45 40 Z" />
      </svg>

      {/* Tea Cup */}
      <svg className="absolute top-[15%] right-[15%] w-20 h-20 -rotate-3" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 30 C 20 80, 70 80, 70 30 Z" />
        <path d="M20 30 Q 45 40 70 30" />
        <path d="M70 40 C 90 40, 90 60, 70 60" />
        <path d="M35 15 Q 38 10 35 5" opacity="0.6"/>
        <path d="M45 20 Q 48 10 45 5" opacity="0.6"/>
        <path d="M55 15 Q 58 10 55 5" opacity="0.6"/>
        <circle cx="40" cy="50" r="2" fill="currentColor"/>
        <circle cx="50" cy="50" r="2" fill="currentColor"/>
        <path d="M42 55 Q 45 58 48 55" />
        {/* Tea bag tag */}
        <path d="M20 45 L 5 55 L 10 65 L 25 55 Z" strokeWidth="2"/>
        <path d="M22 42 Q 15 40 18 50" strokeWidth="1.5" strokeDasharray="2 2"/>
      </svg>

      {/* Alarm Clock */}
      <svg className="absolute top-[30%] left-[10%] w-24 h-24 rotate-[8deg]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="50" cy="55" r="30" />
        <circle cx="50" cy="55" r="24" strokeDasharray="4 4" />
        <path d="M50 55 L50 40" />
        <path d="M50 55 L65 55" />
        <path d="M30 25 C 20 20, 20 10, 35 10 C 40 10, 45 15, 45 20" />
        <path d="M70 25 C 80 20, 80 10, 65 10 C 60 10, 55 15, 55 20" />
        <path d="M40 25 L 60 25" />
        <path d="M35 80 L 25 90" />
        <path d="M65 80 L 75 90" />
        {/* Ring lines */}
        <path d="M15 40 L 5 35 M 10 50 L 0 50 M 15 60 L 5 65" opacity="0.7"/>
        <path d="M85 40 L 95 35 M 90 50 L 100 50 M 85 60 L 95 65" opacity="0.7"/>
      </svg>

      {/* Cactus */}
      <svg className="absolute bottom-[10%] left-[18%] w-32 h-32 -rotate-3" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M35 60 L 35 90 L 65 90 L 65 60" />
        <path d="M30 60 L 70 60 L 70 70 L 30 70 Z" />
        <path d="M50 60 L 50 30 C 50 20, 40 20, 40 30 L 40 60" />
        <path d="M60 50 L 60 40 C 60 30, 70 30, 70 40 L 70 50" />
        <path d="M50 50 L 60 50" />
        <path d="M40 45 L 30 45 C 20 45, 20 35, 30 35" />
        <path d="M43 35 L40 30 M48 45 L45 40 M55 45 L58 40 M65 35 L68 30 M25 40 L28 35 M32 48 L35 45 M50 25 L50 20" strokeWidth="2"/>
        <path d="M40 70 L 60 70 M 40 80 L 60 80" opacity="0.5"/>
      </svg>

      {/* Game Controller */}
      <svg className="absolute bottom-[20%] right-[15%] w-28 h-28 rotate-[15deg]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 40 C 10 40, 10 60, 25 65 L 35 60 L 65 60 L 75 65 C 90 60, 90 40, 80 40 Z" />
        <circle cx="30" cy="50" r="5" />
        <path d="M30 40 L30 60 M20 50 L40 50" strokeWidth="2"/>
        <circle cx="65" cy="55" r="3" fill="currentColor" />
        <circle cx="75" cy="45" r="3" fill="currentColor" />
        <path d="M25 35 Q 30 30 50 30 Q 70 30 75 35" strokeDasharray="4 4" opacity="0.5" />
        <path d="M15 70 L 5 80 M 85 70 L 95 80" opacity="0.6"/>
      </svg>
      
      {/* Radio */}
      <svg className="absolute top-[65%] left-[8%] w-24 h-24 rotate-[-12deg]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="20" y="40" width="60" height="35" rx="5" />
        <path d="M30 40 L30 20 L75 20 M 70 20 C 70 15, 80 15, 80 20 Z" />
        <circle cx="35" cy="58" r="8" />
        <circle cx="65" cy="58" r="8" />
        <path d="M32 58 L38 58 M35 55 L35 61 M62 58 L68 58 M65 55 L65 61" strokeWidth="1"/>
        <rect x="30" y="45" width="40" height="5" />
        {/* Music notes */}
        <path d="M80 30 L 90 25 L 90 40 M 80 30 L 80 45" strokeWidth="2"/>
        <circle cx="78" cy="45" r="3" fill="currentColor"/>
        <circle cx="88" cy="40" r="3" fill="currentColor"/>
      </svg>

      {/* Slippers */}
      <svg className="absolute top-[45%] right-[25%] w-24 h-24 rotate-[10deg]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 30 C 50 30, 50 70, 30 70 C 10 70, 10 30, 30 30 Z" />
        <path d="M70 30 C 90 30, 90 70, 70 70 C 50 70, 50 30, 70 30 Z" />
        <path d="M20 50 C 20 40, 40 40, 40 50 L 40 45 C 40 35, 20 35, 20 45 Z" />
        <path d="M60 50 C 60 40, 80 40, 80 50 L 80 45 C 80 35, 60 35, 60 45 Z" />
      </svg>
      
      {/* Pillow */}
      <svg className="absolute bottom-[35%] left-[30%] w-28 h-28 -rotate-[15deg] hidden lg:block" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 30 C 10 30, 10 40, 10 50 C 10 60, 10 70, 20 70 L 80 70 C 90 70, 90 60, 90 50 C 90 40, 90 30, 80 30 Z" />
        <path d="M30 30 L 30 70 M 50 30 L 50 70 M 70 30 L 70 70" strokeWidth="6" opacity="0.7"/>
        <path d="M10 30 L 5 25 M 10 70 L 5 75 M 90 30 L 95 25 M 90 70 L 95 75" />
        <path d="M5 20 L 0 25 M 5 80 L 0 75 M 95 20 L 100 25 M 95 80 L 100 75" opacity="0.5"/>
      </svg>
    </div>
  );
}
