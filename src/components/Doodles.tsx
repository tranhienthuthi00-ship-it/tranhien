export function Doodles() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] opacity-[0.08] overflow-hidden text-[#1A1A1A]">
      {/* Stars - Just two small ones for accent */}
      <svg className="absolute top-[5%] left-[10%] w-6 h-6 rotate-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 10 L55 40 L85 45 L55 50 L50 80 L45 50 L15 45 L45 40 Z" />
      </svg>
      <svg className="absolute bottom-[15%] right-[10%] w-5 h-5 -rotate-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 10 L55 40 L85 45 L55 50 L50 80 L45 50 L15 45 L45 40 Z" />
      </svg>

      {/* Tea Cup - Top Right Corner Area */}
      <svg className="absolute top-[10%] right-[10%] w-20 h-20 -rotate-3" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 30 C 20 80, 70 80, 70 30 Z" />
        <path d="M20 30 Q 45 40 70 30" />
        <path d="M70 40 C 90 40, 90 60, 70 60" />
        <path d="M35 15 Q 38 10 35 5" opacity="0.6"/>
        <path d="M45 20 Q 48 10 45 5" opacity="0.6"/>
        <path d="M55 15 Q 58 10 55 5" opacity="0.6"/>
        <circle cx="40" cy="50" r="2" fill="currentColor"/>
        <circle cx="50" cy="50" r="2" fill="currentColor"/>
      </svg>

      {/* Alarm Clock - Top Left Corner Area */}
      <svg className="absolute top-[25%] left-[5%] w-20 h-20 rotate-[12deg]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="50" cy="55" r="30" />
        <path d="M50 55 L50 40 M50 55 L65 55" />
        <path d="M30 25 C 20 20, 20 10, 35 10 C 40 10, 45 15, 45 20" />
        <path d="M70 25 C 80 20, 80 10, 65 10 C 60 10, 55 15, 55 20" />
        <path d="M40 25 L 60 25" />
        <path d="M35 80 L 25 90 M65 80 L 75 90" />
      </svg>

      {/* Cactus - Bottom Left Area */}
      <svg className="absolute bottom-[8%] left-[5%] w-24 h-24 -rotate-3" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M35 65 L 35 90 L 65 90 L 65 65" />
        <path d="M30 65 L 70 65 L 70 75 L 30 75 Z" />
        <path d="M50 65 L 50 35 C 50 25, 40 25, 40 35 L 40 65" />
        <path d="M60 55 L 60 45 C 60 35, 70 35, 70 45 L 70 55" />
        <path d="M50 55 L 60 55" />
      </svg>

      {/* Game Controller - Bottom Right Area */}
      <svg className="absolute bottom-[10%] right-[5%] w-24 h-24 rotate-[15deg]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 40 C 10 40, 10 60, 25 65 L 35 60 L 65 60 L 75 65 C 90 60, 90 40, 80 40 Z" />
        <circle cx="30" cy="50" r="4" />
        <path d="M30 40 L30 60 M20 50 L40 50" strokeWidth="2"/>
        <circle cx="65" cy="55" r="2.5" fill="currentColor" />
        <circle cx="75" cy="45" r="2.5" fill="currentColor" />
      </svg>
    </div>
  );
}
