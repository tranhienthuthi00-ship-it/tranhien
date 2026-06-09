import fs from 'fs';

let content = fs.readFileSync('src/components/DigitalJournal.tsx', 'utf8');

// 1. Add import
if (content.indexOf('useSyncedState') === -1) {
  content = content.replace('import { motion, AnimatePresence } from "motion/react";', 'import { motion, AnimatePresence } from "motion/react";\nimport { useSyncedState } from "../lib/useSyncedState";');
}

// 2. Wrap state
const s1old = `const [localCompletedDefaultGoals, setLocalCompletedDefaultGoals] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("studyHub_localBucketListDefaultDone");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });`;
const s1new = `const [localCompletedDefaultGoals, setLocalCompletedDefaultGoals] = useSyncedState<Record<string, boolean>>("studyHub_localBucketListDefaultDone", {});`;
content = content.replace(s1old, s1new);

const s2old = `const [localRenamedDefaultGoals, setLocalRenamedDefaultGoals] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("studyHub_localBucketListRenamed");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });`;
const s2new = `const [localRenamedDefaultGoals, setLocalRenamedDefaultGoals] = useSyncedState<Record<string, string>>("studyHub_localBucketListRenamed", {});`;
content = content.replace(s2old, s2new);

const s3old = `const [bucketListSubtitle, setBucketListSubtitle] = useState(() => {
    return localStorage.getItem("studyHub_bucketListSubtitle") || "🍉 SUMMER";
  });`;
const s3new = `const [bucketListSubtitle, setBucketListSubtitle] = useSyncedState("studyHub_bucketListSubtitle", "🍉 SUMMER");`;
content = content.replace(s3old, s3new);

const s4old = `const [bucketListTitle, setBucketListTitle] = useState(() => {
    return localStorage.getItem("studyHub_bucketListTitle") || "BUCKET LIST";
  });`;
const s4new = `const [bucketListTitle, setBucketListTitle] = useSyncedState("studyHub_bucketListTitle", "BUCKET LIST");`;
content = content.replace(s4old, s4new);

// Let's rip out all the manual localStorage.setItem inside handleSaveTitle and handleSave goals
content = content.replace(`localStorage.setItem("studyHub_bucketListSubtitle", finalSub);`, "");
content = content.replace(`localStorage.setItem("studyHub_bucketListTitle", finalTitle);`, "");
content = content.replace(`localStorage.setItem("studyHub_localBucketListRenamed", JSON.stringify(updatedRenamed));`, "");
content = content.replace(`localStorage.setItem("studyHub_localBucketListDefaultDone", JSON.stringify(updated));`, "");

// Now for Stickers
const sStickersOld = `const [bucketStickers, setBucketStickers] = useState<{ id: string, type: 'preset' | 'image' | 'text', data: string, x: number, y: number, rotation: number, scale: number, color?: string }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('studyHub_bucketStickers') || '[]');
    } catch { return []; }
  });

  const saveBucketStickers = (updated: any[]) => {
    setBucketStickers(updated);
    localStorage.setItem('studyHub_bucketStickers', JSON.stringify(updated));
  };`;
const sStickersNew = `const [bucketStickers, setBucketStickers] = useSyncedState<{ id: string, type: 'preset' | 'image' | 'text', data: string, x: number, y: number, rotation: number, scale: number, color?: string }[]>("studyHub_bucketStickers", []);
  
  const saveBucketStickers = (updated: any[]) => {
    setBucketStickers(updated);
  };`;
content = content.replace(sStickersOld, sStickersNew);

fs.writeFileSync('src/components/DigitalJournal.tsx', content);
console.log("Updated DigitalJournal simple states");
