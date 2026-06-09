import fs from 'fs';

let content = fs.readFileSync('src/components/CalendarView.tsx', 'utf8');

if (content.indexOf('useSyncedState') === -1) {
  content = content.replace('import { Search, ChevronLeft, ChevronRight, X, Image as ImageIcon } from "lucide-react";', 'import { Search, ChevronLeft, ChevronRight, X, Image as ImageIcon } from "lucide-react";\nimport { useSyncedState } from "../lib/useSyncedState";');
}

const s1old = `const [themeTagline, setThemeTagline] = useState(() => {
    return localStorage.getItem(\`studyHub_calendarSubtitle_\${monthStr}\`) || "GLOW UP SEASON";
  });`;
const s1new = `const [themeTagline, setThemeTagline] = useSyncedState(\`studyHub_calendarSubtitle_\${monthStr}\`, "GLOW UP SEASON");`;

const s2old = `const [textNotes, setTextNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(\`studyHub_calendarNotes_\${monthStr}\`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });`;
const s2new = `const [textNotes, setTextNotes] = useSyncedState<Record<string, string>>(\`studyHub_calendarNotes_\${monthStr}\`, {});`;

const s3old = `const [dayStickers, setDayStickers] = useState<Record<string, {type: 'preset'|'upload', data: string}>>(() => {
    const saved = localStorage.getItem(\`studyHub_calendarDayPics_\${monthStr}\`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });`;
const s3new = `const [dayStickers, setDayStickers] = useSyncedState<Record<string, {type: 'preset'|'upload', data: string}>>(\`studyHub_calendarDayPics_\${monthStr}\`, {});`;

const s4old = `const [dayRings, setDayRings] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(\`studyHub_calendarRings_\${monthStr}\`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });`;
const s4new = `const [dayRings, setDayRings] = useSyncedState<Record<string, boolean>>(\`studyHub_calendarRings_\${monthStr}\`, {});`;

content = content.replace(s1old, s1new);
content = content.replace(s2old, s2new);
content = content.replace(s3old, s3new);
content = content.replace(s4old, s4new);

// Remove the useEffect for month change sync
const effectOld = `useEffect(() => {
    const savedTag = localStorage.getItem(\`studyHub_calendarSubtitle_\${currentMonth}\`) || "GLOW UP SEASON";
    setThemeTagline(savedTag);
    setTaglineDraft(savedTag);

    const savedNotes = localStorage.getItem(\`studyHub_calendarNotes_\${currentMonth}\`);
    try {
      setTextNotes(savedNotes ? JSON.parse(savedNotes) : {});
    } catch {
      setTextNotes({});
    }

    const savedPics = localStorage.getItem(\`studyHub_calendarDayPics_\${currentMonth}\`);
    try {
      setDayStickers(savedPics ? JSON.parse(savedPics) : {});
    } catch {
      setDayStickers({});
    }

    const savedRings = localStorage.getItem(\`studyHub_calendarRings_\${currentMonth}\`);
    try {
      setDayRings(savedRings ? JSON.parse(savedRings) : {});
    } catch {
      setDayRings({});
    }
  }, [currentMonth]);`;

content = content.replace(effectOld, `// Automatic sync via useSyncedState handles month change seamlessly
  useEffect(() => {
    setTaglineDraft(themeTagline); // draft updates when synced state changes
  }, [themeTagline]);`);

// Remove manual sets
content = content.replace(`localStorage.setItem(\`studyHub_calendarSubtitle_\${monthStr}\`, cleanTag);`, "");
content = content.replace(`localStorage.setItem(\`studyHub_calendarNotes_\${monthStr}\`, JSON.stringify(updated));`, "");
content = content.replace(`localStorage.setItem(\`studyHub_calendarRings_\${monthStr}\`, JSON.stringify(updated));`, "");
content = content.replace(`localStorage.setItem(\`studyHub_calendarDayPics_\${monthStr}\`, JSON.stringify(updated));`, "");

fs.writeFileSync('src/components/CalendarView.tsx', content);
console.log("Updated CalendarView synced states");
