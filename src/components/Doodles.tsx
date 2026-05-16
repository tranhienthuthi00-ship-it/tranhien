import { useState } from "react";
import { Search, X } from "lucide-react";

interface Doodle {
  id: string;
  name: string;
  tags: string[];
  viewBox: string;
  elements: JSX.Element;
  className: string;
}

const DOODLES: Doodle[] = [
  {
    id: 'star-1',
    name: 'Star',
    tags: ['star', 'space', 'accent', 'magic', 'shine'],
    viewBox: '0 0 100 100',
    elements: <path d="M50 10 L55 40 L85 45 L55 50 L50 80 L45 50 L15 45 L45 40 Z" />,
    className: "absolute top-[5%] left-[10%] w-6 h-6 rotate-12"
  },
  {
    id: 'star-2',
    name: 'Star',
    tags: ['star', 'space', 'accent', 'magic', 'shine'],
    viewBox: '0 0 100 100',
    elements: <path d="M50 10 L55 40 L85 45 L55 50 L50 80 L45 50 L15 45 L45 40 Z" />,
    className: "absolute bottom-[15%] right-[10%] w-5 h-5 -rotate-12"
  },
  {
    id: 'tea-cup',
    name: 'Tea Cup',
    tags: ['tea', 'cup', 'drink', 'relax', 'hot', 'coffee'],
    viewBox: '0 0 100 100',
    elements: (
      <>
        <path d="M20 30 C 20 80, 70 80, 70 30 Z" />
        <path d="M20 30 Q 45 40 70 30" />
        <path d="M70 40 C 90 40, 90 60, 70 60" />
        <path d="M35 15 Q 38 10 35 5" opacity="0.6"/>
        <path d="M45 20 Q 48 10 45 5" opacity="0.6"/>
        <path d="M55 15 Q 58 10 55 5" opacity="0.6"/>
        <circle cx="40" cy="50" r="2" fill="currentColor"/>
        <circle cx="50" cy="50" r="2" fill="currentColor"/>
      </>
    ),
    className: "absolute top-[10%] right-[10%] w-20 h-20 -rotate-3"
  },
  {
    id: 'alarm-clock',
    name: 'Alarm Clock',
    tags: ['clock', 'time', 'alarm', 'wake', 'morning'],
    viewBox: '0 0 100 100',
    elements: (
      <>
        <circle cx="50" cy="55" r="30" />
        <path d="M50 55 L50 40 M50 55 L65 55" />
        <path d="M30 25 C 20 20, 20 10, 35 10 C 40 10, 45 15, 45 20" />
        <path d="M70 25 C 80 20, 80 10, 65 10 C 60 10, 55 15, 55 20" />
        <path d="M40 25 L 60 25" />
        <path d="M35 80 L 25 90 M65 80 L 75 90" />
      </>
    ),
    className: "absolute top-[25%] left-[5%] w-20 h-20 rotate-[12deg]"
  },
  {
    id: 'cactus',
    name: 'Cactus',
    tags: ['cactus', 'plant', 'desert', 'nature', 'green'],
    viewBox: '0 0 100 100',
    elements: (
      <>
        <path d="M35 65 L 35 90 L 65 90 L 65 65" />
        <path d="M30 65 L 70 65 L 70 75 L 30 75 Z" />
        <path d="M50 65 L 50 35 C 50 25, 40 25, 40 35 L 40 65" />
        <path d="M60 55 L 60 45 C 60 35, 70 35, 70 45 L 70 55" />
        <path d="M50 55 L 60 55" />
      </>
    ),
    className: "absolute bottom-[8%] left-[5%] w-24 h-24 -rotate-3"
  },
  {
    id: 'game-controller',
    name: 'Game Controller',
    tags: ['game', 'controller', 'play', 'fun', 'joystick'],
    viewBox: '0 0 100 100',
    elements: (
      <>
        <path d="M20 40 C 10 40, 10 60, 25 65 L 35 60 L 65 60 L 75 65 C 90 60, 90 40, 80 40 Z" />
        <circle cx="30" cy="50" r="4" />
        <path d="M30 40 L30 60 M20 50 L40 50" strokeWidth="2"/>
        <circle cx="65" cy="55" r="2.5" fill="currentColor" />
        <circle cx="75" cy="45" r="2.5" fill="currentColor" />
      </>
    ),
    className: "absolute bottom-[10%] right-[5%] w-24 h-24 rotate-[15deg]"
  },
  {
    id: 'book',
    name: 'Book',
    tags: ['book', 'read', 'study', 'learn', 'knowledge'],
    viewBox: '0 0 100 100',
    elements: (
      <>
        <path d="M20 20 L 80 20 L 80 80 L 20 80 Z" />
        <path d="M25 20 L 25 80" />
        <path d="M30 30 L 70 30" opacity="0.3" />
        <path d="M30 40 L 70 40" opacity="0.3" />
        <path d="M30 50 L 70 50" opacity="0.3" />
      </>
    ),
    className: "absolute top-[45%] right-[8%] w-16 h-16 rotate-6"
  },
  {
    id: 'pencil',
    name: 'Pencil',
    tags: ['pencil', 'write', 'draw', 'create', 'art'],
    viewBox: '0 0 100 100',
    elements: (
      <>
        <path d="M20 80 L 30 70 L 80 20 L 90 30 L 40 80 L 20 90 Z" />
        <path d="M20 90 L 25 85" />
      </>
    ),
    className: "absolute top-[40%] left-[10%] w-12 h-12 -rotate-45"
  }
];

export function Doodles() {
  const [search, setSearch] = useState("");

  const filteredDoodles = DOODLES.filter(doodle => 
    doodle.name.toLowerCase().includes(search.toLowerCase()) ||
    doodle.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden text-[#1A1A1A]">
      {/* Background Doodles Layer */}
      <div className="absolute inset-0 opacity-[0.08]">
        {filteredDoodles.map(doodle => (
          <svg 
            key={doodle.id}
            className={doodle.className} 
            viewBox={doodle.viewBox} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {doodle.elements}
          </svg>
        ))}
      </div>

      {/* Search Interface Layer */}
      <div className="absolute top-4 right-4 pointer-events-auto z-[100]">
        <div className="relative group">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doodles..."
            className="w-48 md:w-64 bg-paper/60 backdrop-blur-md border-2 border-ink/20 rounded-full py-1.5 pl-10 pr-4 text-xs font-sans font-medium focus:outline-none focus:border-ink/50 transition-all shadow-sm opacity-20 group-hover:opacity-100 focus:opacity-100"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
          {search && (
            <button 
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-crimson transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {search && (
          <div className="mt-2 text-[10px] font-sans font-bold uppercase tracking-widest text-ink/40 text-right">
            Found {filteredDoodles.length} {filteredDoodles.length === 1 ? 'doodle' : 'doodles'}
          </div>
        )}
      </div>
    </div>
  );
}

