import fs from 'fs';

let content = fs.readFileSync('src/components/DigitalJournal.tsx', 'utf8');

const p1 = '{/* Toolbars for stickers added to the edge of Bucket List */}';
const i1 = content.indexOf(p1);
if(i1 !== -1) {
    const nextMainLayout = content.indexOf('</div>\n\n                  </div>', i1);
    const i2 = content.indexOf('</div>', i1 + 500);
    // Let's just use regex to remove the absolute right-4 top-4 div
    const right4Top4 = content.indexOf('<div className="absolute right-4 top-4 flex flex-col gap-3 z-50">');
    if (right4Top4 !== -1) {
        const afterDiv = content.indexOf('</div>', right4Top4 + 200) + 6;
        content = content.substring(0, i1) + content.substring(afterDiv);
    }
}

// 2. "ở calendar hiển thị sticker cho sự kiện ở 2/3 khung của ngày"
// And replace today's events from calendar logs
const eventsOld = `<ul className="space-y-3 list-none">
                      <li className="flex items-start gap-4"><div className="w-2 h-2 mt-3 rounded-full bg-[#8A1E2B] shrink-0" /> <span className="font-hand font-black text-xl md:text-2xl text-[#8A1E2B]">minh's birthday 27th</span></li>
                      <li className="flex items-start gap-4"><div className="w-2 h-2 mt-3 rounded-full bg-[#8A1E2B] shrink-0" /> <span className="font-hand font-black text-xl md:text-2xl text-[#8A1E2B]">happy motherday</span></li>
                      <li className="flex items-start gap-4"><div className="w-2 h-2 mt-3 rounded-full bg-[#8A1E2B] shrink-0" /> <span className="font-hand font-black text-xl md:text-2xl text-[#8A1E2B]">graduted</span></li>
                      <li className="flex items-start gap-4"><div className="w-2 h-2 mt-3 rounded-full bg-[#8A1E2B] shrink-0" /> <span className="font-hand font-black text-xl md:text-2xl text-[#8A1E2B]">the last examination</span></li>
                      {logs.filter(l => l.date === new Date().toISOString().split("T")[0] && l.type === 'Event').slice(0,3).map(l => (
                         <li key={l.id} className="flex items-start gap-4"><div className="w-2 h-2 mt-3 rounded-full bg-[#8A1E2B] shrink-0" /> <span className="font-hand font-black text-xl md:text-2xl text-[#8A1E2B]">{l.content}</span></li>
                      ))}
                   </ul>`;
const eventsNew = `<ul className="space-y-3 list-none">
                      {logs.filter(l => l.date === new Date().toISOString().split("T")[0] && l.type === 'Event').length === 0 && (
                          <li className="text-[#8A1E2B]/50 font-hand font-bold text-lg italic">No events today.</li>
                      )}
                      {logs.filter(l => l.date === new Date().toISOString().split("T")[0] && l.type === 'Event').map(l => (
                         <li key={l.id} className="flex items-start gap-4"><div className="w-2 h-2 mt-3 rounded-full bg-[#8A1E2B] shrink-0" /> <span className="font-hand font-black text-xl md:text-2xl text-[#8A1E2B]">{l.emoji} {l.content}</span></li>
                      ))}
                   </ul>`;
content = content.replace(eventsOld, eventsNew);

// 3. Mini calendar ở home match với calendar tab.
// I think replacing the sticker positions in Home mini calendar:
// It says "hiển thị sticker cho sự kiện ở 2/3 khung của ngày"
const oldStickerWrapper = `<div className="absolute inset-0 flex flex-col items-center justify-center p-2 z-0 opacity-90 overflow-hidden">`;
const newStickerWrapper = `<div className="absolute inset-0 flex flex-col items-center justify-start pt-[55%] z-0 opacity-90 overflow-visible pointer-events-none pb-[5%]">`;
content = content.replace(oldStickerWrapper, newStickerWrapper);

fs.writeFileSync('src/components/DigitalJournal.tsx', content);
console.log('Fixed buttons and events');
