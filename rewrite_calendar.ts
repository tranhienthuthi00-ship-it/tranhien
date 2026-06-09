import fs from 'fs';

let content = fs.readFileSync('src/components/DigitalJournal.tsx', 'utf8');

// We want to replace the whole calendar block inside LEFT: CALENDAR
const calStart = content.indexOf('{/* LEFT: CALENDAR */}');
const calEnd = content.indexOf('{/* MIDDLE: TO DO LIST & EVENTS */}');

if (calStart === -1 || calEnd === -1) {
    console.error("Calendar block not found");
    process.exit(1);
}

const replacement = `{/* LEFT: CALENDAR */}
            <div className="flex flex-col pt-2 relative z-10 w-full mb-10">
               <div className="text-center font-hand text-[#8A1E2B] font-black tracking-widest text-xl md:text-3xl uppercase flex items-center justify-center gap-6 mb-6">
                  <button onClick={() => changeMonth(-1)} className="hover:-translate-x-1 transition-transform cursor-pointer">
                    <svg className="w-8 h-8 stroke-[#8A1E2B] stroke-[3]" fill="none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <span className="min-w-[200px]">{currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span>
                  <button onClick={() => changeMonth(1)} className="hover:translate-x-1 transition-transform cursor-pointer">
                    <svg className="w-8 h-8 stroke-[#8A1E2B] stroke-[3]" fill="none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
               </div>
               
               <div className="bg-[#f8f5ed] relative">
                  {/* Headers */}
                  <div className="grid grid-cols-7 border-[2.5px] border-[#8A1E2B] text-center text-[#8A1E2B] font-bold text-sm md:text-lg mb-2">
                     {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d, idx) => (
                         <div key={d} className={\`p-3 \${idx < 6 ? 'border-r-[2.5px] border-[#8A1E2B]' : ''}\`}>{d.substring(0,3)}</div>
                     ))}
                  </div>
                  {/* Grid */}
                  <div className="grid grid-cols-7 auto-rows-[minmax(100px,auto)] border-[2.5px] border-[#8A1E2B] bg-[#f8f5ed] shadow-[4px_4px_0_rgba(138,30,43,0.15)] relative">
                     {calendarDays.map((cell, i) => {
                        const isLastInRow = (i + 1) % 7 === 0;
                        const isLastRow = i >= calendarDays.length - 7;
                        
                        const hasSticker = cell.dateStr ? !!dayStickers[cell.dateStr] : false;
                        const stickerData = cell.dateStr ? dayStickers[cell.dateStr] : null;
                        const ringStyle = cell.dateStr ? dayRings[cell.dateStr] : null;

                        return (
                          <div 
                             key={i} 
                             className={\`p-2 flex flex-col relative group cursor-pointer hover:bg-[#8A1E2B]/5 transition-colors \${!isLastInRow ? 'border-r-[2px] border-[#8A1E2B]' : ''} \${!isLastRow ? 'border-b-[2px] border-[#8A1E2B]' : ''}\`} 
                             onClick={() => {
                               if (cell.dateStr) {
                                  setSelectedDateStr(cell.dateStr);
                                  setIsCalendarDetailsOpen(true);
                               }
                             }}
                          >
                              {cell.day && (
                                <div className="flex items-center justify-between z-10 relative">
                                  <span className="text-sm md:text-lg font-hand font-black text-[#8A1E2B] group-hover:scale-110 transition-transform">{cell.day}</span>
                                </div>
                              )}
                              
                              {/* Decoratives logic based on interactions */}
                              {ringStyle && (
                                <div className="absolute inset-2 border-[3px] rounded-full pointer-events-none opacity-80" style={{ borderColor: ringStyle === 'red-ring' ? '#e11d48' : '#8A1E2B', borderStyle: 'dashed' }} />
                              )}

                              {/* Interaction Rendering */}
                              {cell.dateStr && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 z-0 opacity-90 overflow-hidden">
                                  {stickerData && stickerData.type === 'image' && (
                                    <img draggable={false} src={stickerData.data} className="w-12 h-12 object-contain" style={{ filter: stickerData.color ? \`drop-shadow(0 0 10px \${stickerData.color})\` : 'none' }} />
                                  )}
                                  {stickerData && stickerData.type === 'text' && (
                                    <div className="text-3xl" style={{ color: stickerData.color }}>{stickerData.data}</div>
                                  )}
                                  {hasSticker && stickerData?.type === 'preset' && (
                                    <span className="text-3xl drop-shadow-sm">{stickerData.data === 'star' ? '⭐' : stickerData.data === 'heart' ? '❤️' : stickerData.data === 'fire' ? '🔥' : stickerData.data === 'check' ? '✅' : '🌟'}</span>
                                  )}
                                  {hasSticker && stickerData?.type === 'upload' && (
                                    <img src={stickerData.data} alt="sticker" className="w-12 h-12 object-contain" />
                                  )}
                                  {/* Render events summary */}
                                  {!hasSticker && (
                                    <div className="flex flex-col gap-0.5 mt-4 w-full px-1">
                                      {logs.filter(l => l.date === cell.dateStr).slice(0, 2).map((l, idx) => (
                                        <div key={idx} className="text-[9px] md:text-[11px] truncate text-[#8A1E2B] font-bold font-hand bg-[#8A1E2B]/10 rounded px-1">{l.emoji} {l.content}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Hover details hint */}
                              <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-4 h-4 text-[#8A1E2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                              </div>
                          </div>
                        )
                     })}
                  </div>
               </div>
               
               {/* Puppy drawing relative to top */}
               <div className="absolute -top-12 -right-8 w-16 h-16 pointer-events-none opacity-80 rotate-12">
                  <svg viewBox="0 0 100 100" fill="none" stroke="#8A1E2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20,50 Q30,40 40,50 Q50,45 60,50 Q70,40 80,45 Q75,55 85,60 Q80,70 65,70 Q55,65 40,65 Q30,70 20,60 Q25,55 15,45 Z" />
                    <circle cx="30" cy="50" r="2.5" fill="#8A1E2B"/>
                    <path d="M25,55 Q35,60 40,55" />
                    <path d="M30,35 L25,20 L40,30" />
                    <path d="M50,80 L50,90 M70,75 L75,85 M25,75 L20,85 M35,80 L35,90" />
                  </svg>
               </div>
            </div>

            `;

content = content.substring(0, calStart) + replacement + content.substring(calEnd);
fs.writeFileSync('src/components/DigitalJournal.tsx', content);
console.log("Calendar rewritten nicely");
