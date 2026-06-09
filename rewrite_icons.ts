import fs from 'fs';

let content = fs.readFileSync('src/components/DigitalJournal.tsx', 'utf8');

// Replace Search Icon
const searchIconOld = '<svg className="w-5 h-5 text-[#3A1412] font-black" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>';
const searchIconNew = '<svg className="w-6 h-6 text-[#3A1412] stroke-current stroke-[3]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3a7 7 0 0 0-7 7 c0 3 2 5 4 6 s5 2 7-1 s4-5 1-8 s-3-4-5-4 z" /><path d="M16 16 l5 4" /></svg>';
content = content.replace(searchIconOld, searchIconNew);

// Replace Camera
const cameraOld = '<Camera size={20} className="stroke-[2.5]" />';
const cameraNew = '<svg className="w-6 h-6 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8 Q3 7 4 7 L6 4 Q7 3 8 3 L14 3 Q15 3 16 4 L18 7 Q19 7 20 7 L21 7 Q22 7 22 8 L22 19 Q22 20 21 20 L3 20 Q2 20 2 19 Z" /><path d="M12 11 Q14 11 15 14 Q15 16 12 17 Q9 16 10 14 Z" /></svg>';
content = content.replace(cameraOld, cameraNew);

// Replace Sparkles
const sparklesOld = '<Sparkles size={20} className="stroke-[2.5]" />';
const sparklesNew = '<svg className="w-6 h-6 stroke-current stroke-[2.5]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 Q12 12 22 12 Q12 12 12 22 Q12 12 2 12 Q12 12 12 2 Z" /><path d="M18 4 Q18 8 22 8 Q18 8 18 12 Q18 8 14 8 Q18 8 18 4 Z" transform="scale(0.5) translate(20, -10)" /></svg>';
content = content.replace(sparklesOld, sparklesNew);

// Replace Checkmarks (both regular and local interactive tasks)
const checkmarkOld = 'd="M5 13l4 4L19 7"';
const checkmarkNew = 'd="M4 14 Q9 18 10 18 Q15 11 20 6"';
content = content.replaceAll(checkmarkOld, checkmarkNew);

fs.writeFileSync('src/components/DigitalJournal.tsx', content);
console.log("Replaced icons with handcrafted SVGs");
