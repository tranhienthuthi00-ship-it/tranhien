import fs from 'fs';

let content = fs.readFileSync('src/components/DigitalJournal.tsx', 'utf8');

const lastDiv = content.lastIndexOf('</div>');
const secondLastDiv = content.lastIndexOf('</div>', lastDiv - 1);

const modalCode = `
      {/* CALENDAR DETAILS MODAL */}
      <AnimatePresence>
        {isCalendarDetailsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              ref={calendarContainerRef}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#FAF3EB] w-full max-w-sm rounded-[30px] border-[3px] border-[#5C0612] shadow-[8px_8px_0_rgba(92,6,18,0.15)] flex flex-col font-hand"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b-[2px] border-dashed border-[#5C0612]/30">
                <h3 className="font-black text-[#5C0612] text-xl flex items-center gap-2">
                  <span className="text-2xl">📅</span> {selectedDateStr}
                </h3>
                <button onClick={() => setIsCalendarDetailsOpen(false)} className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-[#5C0612] transition-colors">
                  <svg className="w-5 h-5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
                
                {/* 1. Add Sticker */}
                <div className="space-y-3">
                  <h4 className="font-bold text-[#5C0612] text-sm uppercase tracking-wider flex items-center gap-2">
                    <span className="text-lg">✨</span> Thêm Sticker
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setDayStickerValue(selectedDateStr, "star")} className="text-3xl hover:scale-125 transition-transform active:scale-95 drop-shadow-sm">⭐</button>
                    <button onClick={() => setDayStickerValue(selectedDateStr, "heart")} className="text-3xl hover:scale-125 transition-transform active:scale-95 drop-shadow-sm">❤️</button>
                    <button onClick={() => setDayStickerValue(selectedDateStr, "fire")} className="text-3xl hover:scale-125 transition-transform active:scale-95 drop-shadow-sm">🔥</button>
                    <button onClick={() => setDayStickerValue(selectedDateStr, "check")} className="text-3xl hover:scale-125 transition-transform active:scale-95 drop-shadow-sm">✅</button>
                    <button onClick={() => setDayStickerValue(selectedDateStr, "none")} className="text-sm font-bold bg-[#5C0612]/10 text-[#5C0612] px-3 py-1.5 rounded-full hover:bg-[#5C0612]/20 transition-colors h-10 ml-auto">Gỡ bỏ</button>
                  </div>
                  <label className="flex items-center gap-2 mt-2 w-fit bg-[#FAF3EB] border-[2px] border-[#5C0612] rounded-full px-4 py-2 cursor-pointer hover:bg-[#5C0612] hover:text-[#FAF3EB] transition-all text-[#5C0612] font-bold text-sm shadow-[2px_2px_0_#5C0612]">
                    <svg className="w-4 h-4 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8 Q3 7 4 7 L6 4 Q7 3 8 3 L14 3 Q15 3 16 4 L18 7 Q19 7 20 7 L21 7 Q22 7 22 8 L22 19 Q22 20 21 20 L3 20 Q2 20 2 19 Z"/><path d="M12 11 Q14 11 15 14 Q15 16 12 17 Q9 16 10 14 Z"/></svg>
                    Tải ảnh lên...
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleStickerFileChange(selectedDateStr, e)} />
                  </label>
                </div>

                {/* 2. Highlight Ring */}
                <div className="space-y-3 pt-4 border-t-[2px] border-dashed border-[#5C0612]/20">
                  <h4 className="font-bold text-[#5C0612] text-sm uppercase tracking-wider flex items-center gap-2">
                    <span className="text-lg">⭕</span> Làm nổi bật ngày
                  </h4>
                  <button 
                    onClick={() => toggleDayRing(selectedDateStr)}
                    className={\`w-full py-2.5 rounded-full font-bold text-sm transition-all border-[2px] \${dayRings[selectedDateStr] ? 'bg-[#5C0612] text-[#FAF3EB] border-[#5C0612]' : 'bg-transparent text-[#5C0612] border-[#5C0612] hover:bg-[#5C0612]/10'} shadow-[3px_3px_0_rgba(92,6,18,1)]\`}
                  >
                    {dayRings[selectedDateStr] ? 'Đã khoanh đỏ (Nhấn để hủy)' : 'Khoanh đỏ ngày này'}
                  </button>
                </div>

                {/* 3. Quick Note */}
                <div className="space-y-3 pt-4 border-t-[2px] border-dashed border-[#5C0612]/20">
                  <h4 className="font-bold text-[#5C0612] text-sm uppercase tracking-wider flex items-center gap-2">
                    <span className="text-lg">✍️</span> Thêm ghi chú nhanh
                  </h4>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!quickLogContent.trim() || !addLog) return;
                    addLog({
                      id: "log_" + Date.now().toString(),
                      date: selectedDateStr,
                      content: quickLogContent.trim(),
                      location: quickLogLocation.trim() || undefined,
                      emoji: quickLogEmoji,
                      type: quickLogType,
                      createdAt: Date.now()
                    });
                    setQuickLogContent("");
                    setQuickLogLocation("");
                    setIsCalendarDetailsOpen(false);
                  }} className="flex flex-col gap-3">
                    <input type="text" placeholder="Bạn đã làm gì?" value={quickLogContent} onChange={e => setQuickLogContent(e.target.value)} className="w-full bg-white/50 border-[2px] border-[#5C0612] rounded-xl px-3 py-2 text-sm font-bold text-[#5C0612] placeholder-[#5C0612]/50 outline-none focus:bg-white transition-colors" required />
                    <div className="flex gap-2">
                      <select value={quickLogEmoji} onChange={e => setQuickLogEmoji(e.target.value)} className="bg-white/50 border-[2px] border-[#5C0612] rounded-xl px-2 py-2 text-sm outline-none w-16 text-center cursor-pointer">
                         <option value="📝">📝</option>
                         <option value="⭐">⭐</option>
                         <option value="❤️">❤️</option>
                         <option value="🎉">🎉</option>
                         <option value="☕">☕</option>
                         <option value="✈️">✈️</option>
                         <option value="🌧️">🌧️</option>
                      </select>
                      <input type="text" placeholder="Địa điểm (ops)" value={quickLogLocation} onChange={e => setQuickLogLocation(e.target.value)} className="flex-1 bg-white/50 border-[2px] border-[#5C0612] rounded-xl px-3 py-2 text-sm font-bold text-[#5C0612] placeholder-[#5C0612]/50 outline-none focus:bg-white transition-colors" />
                    </div>
                    <button type="submit" className="w-full bg-[#5C0612] text-[#FAF3EB] font-bold py-2.5 rounded-xl uppercase tracking-widest text-xs hover:bg-black transition-colors mt-2 shadow-[3px_3px_0_rgba(0,0,0,1)]">
                      Lưu ghi chú
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

content = content.substring(0, secondLastDiv) + modalCode + content.substring(secondLastDiv);

fs.writeFileSync('src/components/DigitalJournal.tsx', content);
console.log("Added modal back in!");
