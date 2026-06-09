import fs from 'fs';

let content = fs.readFileSync('src/components/DigitalJournal.tsx', 'utf8');

// Replace dayStickers
const dOld = `const [dayStickers, setDayStickers] = useState<Record<string, {type: 'preset'|'upload', data: string}>>(() => {
    const saved = localStorage.getItem(\`studyHub_calendarDayPics_\${monthStr}\`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  const [dayRings, setDayRings] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(\`studyHub_calendarRings_\${monthStr}\`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  // Keep state synced across month navigation
  useEffect(() => {
    const picsSaved = localStorage.getItem(\`studyHub_calendarDayPics_\${monthStr}\`);
    try {
      setDayStickers(picsSaved ? JSON.parse(picsSaved) : {});
    } catch {
      setDayStickers({});
    }

    const ringsSaved = localStorage.getItem(\`studyHub_calendarRings_\${monthStr}\`);
    try {
      setDayRings(ringsSaved ? JSON.parse(ringsSaved) : {});
    } catch {
      setDayRings({});
    }
  }, [monthStr]);

  const setDayStickerValue = (dateStr: string, stickerId: string, imageBase64?: string) => {
    const updated = { ...dayStickers };
    if (stickerId === "none" && !imageBase64) {
      delete updated[dateStr];
    } else if (imageBase64) {
      updated[dateStr] = { type: 'upload' as const, data: imageBase64 };
    } else {
      updated[dateStr] = { type: 'preset' as const, data: stickerId };
    }
    setDayStickers(updated);
    localStorage.setItem(\`studyHub_calendarDayPics_\${monthStr}\`, JSON.stringify(updated));
  };`;

const dNew = `const [dayStickers, setDayStickers] = useSyncedState<Record<string, {type: 'preset'|'upload', data: string}>>(\`studyHub_calendarDayPics_\${monthStr}\`, {});
  const [dayRings, setDayRings] = useSyncedState<Record<string, boolean>>(\`studyHub_calendarRings_\${monthStr}\`, {});

  const setDayStickerValue = (dateStr: string, stickerId: string, imageBase64?: string) => {
    const updated = { ...dayStickers };
    if (stickerId === "none" && !imageBase64) {
      delete updated[dateStr];
    } else if (imageBase64) {
      updated[dateStr] = { type: 'upload' as const, data: imageBase64 };
    } else {
      updated[dateStr] = { type: 'preset' as const, data: stickerId };
    }
    setDayStickers(updated);
  };`;

// What about toggleDayRing?
const tOld = `const toggleDayRing = (dateStr: string) => {
    const updated = { ...dayRings, [dateStr]: !dayRings[dateStr] };
    setDayRings(updated);
    localStorage.setItem(\`studyHub_calendarRings_\${monthStr}\`, JSON.stringify(updated));
  };`;
const tNew = `const toggleDayRing = (dateStr: string) => {
    const updated = { ...dayRings, [dateStr]: !dayRings[dateStr] };
    setDayRings(updated);
  };`;

content = content.replace(dOld, dNew);
content = content.replace(tOld, tNew);

fs.writeFileSync('src/components/DigitalJournal.tsx', content);
console.log("Updated DJ dynamic synced parts");
