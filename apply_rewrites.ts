import fs from 'fs';

let content = fs.readFileSync('src/components/DigitalJournal.tsx', 'utf8');

// 1. Layout to 3 cols
content = content.replace(
  '<div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1.2fr] gap-6 xl:gap-12 items-start max-w-6xl mx-auto">',
  '<div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr] gap-8 xl:gap-12 items-start max-w-[1440px] px-2 mx-auto w-full">'
);

// 2. Split To Do List and Events
content = content.replace(
  '{/* MIDDLE: TO DO LIST & EVENTS */}',
  '{/* MIDDLE: TO DO LIST */}'
);

const todoContainerStart = '<div className="flex flex-col space-y-12 px-2 md:px-0 pt-16 -ml-4">';
// Replace with just a normal container for To Do
content = content.replace(
  '<div className="flex flex-col space-y-12 px-2 md:px-0 pt-16 -ml-4">',
  '<div className="flex flex-col pt-16 xl:pl-4">'
);

// To split Events, I need to find {/* Events */} and close the middle div and open the right div
const eventsStart = '{/* Events */}';
content = content.replace(
    '{/* Events */}',
    `</div>
    {/* RIGHT: EVENTS */}
    <div className="flex flex-col pt-16 xl:pl-4">`
);

// 3. Update Mascot SVG
const oldMascotSVG = `<motion.path 
                                    d="M20 30 Q 20 15 35 15 L 65 15 Q 80 15 80 30 L 85 80 Q 85 90 75 90 L 25 90 Q 15 90 15 80 Z" 
                                    animate={{ 
                                      rotate: ratio === 1 ? [0, -5, 5, -5, 0] : 0,
                                      y: ratio === 1 ? [0, -5, 0] : 0 
                                    }}
                                    transition={{ duration: 0.5, repeat: ratio === 1 ? Infinity : 0, repeatDelay: 2 }}
                                 />`;

const newMascotSVG = `
                                 {/* Back Hair (Curly) */}
                                 <path d="M 30 20 Q 10 30 15 50 Q 10 60 20 70 Q 15 80 25 90 Q 30 95 40 90 L 60 90 Q 70 95 75 90 Q 85 80 80 70 Q 90 60 85 50 Q 90 30 70 20 Z" fill="#3A1412" stroke="none" />
                                 {/* Body/Face */}
                                 <motion.path 
                                    d="M25 40 Q 25 20 50 20 Q 75 20 75 40 L 80 80 Q 80 90 70 90 L 30 90 Q 20 90 20 80 Z" 
                                    fill="#FAF3EB"
                                    animate={{ 
                                      rotate: ratio === 1 ? [0, -5, 5, -5, 0] : 0,
                                      y: ratio === 1 ? [0, -5, 0] : 0 
                                    }}
                                    transition={{ duration: 0.5, repeat: ratio === 1 ? Infinity : 0, repeatDelay: 2 }}
                                 />
                                 {/* Front Hair Bangs */}
                                 <path d="M 25 40 Q 35 25 50 25 Q 65 25 75 40 Q 65 20 50 20 Q 35 20 25 40 Z" fill="#3A1412" stroke="none" />
`;
content = content.replace(oldMascotSVG, newMascotSVG);

// 4. Update Calendar Underlines
// I need to add underline decoration to the cell.day
const daySpanOld = '<span className="text-sm md:text-lg font-hand font-black text-[#8A1E2B] group-hover:scale-110 transition-transform">{cell.day}</span>';
const daySpanNew = '<span className="text-sm md:text-lg font-hand font-black text-[#8A1E2B] group-hover:scale-110 transition-transform underline decoration-[#8A1E2B] decoration-[1.5px] underline-offset-4">{cell.day}</span>';
content = content.replace(daySpanOld, daySpanNew);

// 5. Kẻ bảng lại cho đều - calendar Grid
const calendarGridOld = 'className="grid grid-cols-7 auto-rows-[minmax(100px,auto)] border-[2.5px] border-[#8A1E2B] bg-[#f8f5ed] shadow-[4px_4px_0_rgba(138,30,43,0.15)] relative"';
const calendarGridNew = 'className="grid grid-cols-7 auto-rows-[minmax(60px,1fr)] lg:auto-rows-[minmax(80px,1fr)] border-[2.5px] border-[#8A1E2B] bg-[#f8f5ed] shadow-[4px_4px_0_rgba(138,30,43,0.15)] relative"';
content = content.replace(calendarGridOld, calendarGridNew);

// Remove the mb-2 from headers so the table looks continuous
const headerOld = '<div className="grid grid-cols-7 border-[2.5px] border-[#8A1E2B] text-center text-[#8A1E2B] font-bold text-sm md:text-lg mb-2">';
const headerNew = '<div className="grid grid-cols-7 border-[2.5px] border-b-0 border-[#8A1E2B] text-center text-[#8A1E2B] font-bold text-sm md:text-lg">';
content = content.replace(headerOld, headerNew);

fs.writeFileSync('src/components/DigitalJournal.tsx', content);
console.log("Rewrote layout");
