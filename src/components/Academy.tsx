import React, { useState, useMemo, useEffect } from "react";
import { Search, BookA, Tag as TagIcon, Plus, X, Check, Layers, Volume2, HelpCircle, ArrowRight, RotateCcw, Award, CheckCircle, GraduationCap, ChevronLeft, ChevronRight, Edit2, Trash2 } from "lucide-react";
import type { Word, WordTag } from "@/types";
import { cn } from "@/lib/utils";
import { CEFRVocabulary } from "./CEFRVocabulary";
import { motion, AnimatePresence } from "motion/react";
import { useSyncedState } from "../lib/useSyncedState";

const WORD_TYPE_CHIPS = [
  { label: "Danh từ (n)", val: "noun", emoji: "📝" },
  { label: "Động từ (v)", val: "verb", emoji: "🔌" },
  { label: "Tính từ (adj)", val: "adj", emoji: "✨" },
  { label: "Trạng từ (adv)", val: "adv", emoji: "🚀" },
  { label: "Thành ngữ (idiom)", val: "idiom", emoji: "🌟" },
  { label: "Cụm từ (phrase)", val: "phrase", emoji: "💬" },
  { label: "Câu mẫu (sentence)", val: "sentence", emoji: "📖" }
];

const QUICK_TAG_CHIPS = [
  "Du lịch ✈️",
  "Học tập 📚",
  "Giao tiếp 💬",
  "Công việc 💼",
  "Đời sống 🏠",
  "Hàng ngày 📅"
];

// Helper to remove emojis from string for cleaner display
const stripEmojis = (str: string) => {
  return str.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, "").trim();
};

export function Academy({
  words,
  setWords,
  tags,
  setTags
}: {
  words: Word[];
  setWords: (words: Word[]) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
}) {
  const [activeTab, setActiveTab] = useState<'personal' | 'cefr'>('personal');
  
  // Table Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<WordTag | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [onlyDueForReview, setOnlyDueForReview] = useState(false);

  // Form input state
  const [editingWordId, setEditingWordId] = useSyncedState<string | null>("studyHub_academy_editingWordId", null);
  const [vocab, setVocab] = useSyncedState<string>("studyHub_academy_vocab", "");
  const [type, setType] = useSyncedState<string>("studyHub_academy_type", "noun");
  const [ipa, setIpa] = useSyncedState<string>("studyHub_academy_ipa", "");
  const [definition, setDefinition] = useSyncedState<string>("studyHub_academy_definition", "");
  const [example, setExample] = useSyncedState<string>("studyHub_academy_example", "");
  const [activeTags, setActiveTags] = useSyncedState<WordTag[]>("studyHub_academy_activeTags", []);
  const [newTagInput, setNewTagInput] = useSyncedState<string>("studyHub_academy_newTagInput", "");

  // Interactive Learning Session Overlay States
  const [isLearningActive, setIsLearningActive] = useState(false);
  const [learningList, setLearningList] = useState<Word[]>([]);
  const [learningIndex, setLearningIndex] = useState(0);
  const [learningIsFlipped, setLearningIsFlipped] = useState(false);
  const [learningMode, setLearningMode] = useState<'flashcard' | 'type_test'>('flashcard');
  
  // Type test mode states
  const [typeInput, setTypeInput] = useState("");
  const [typeShowFeedback, setTypeShowFeedback] = useState(false);
  const [typeIsCorrect, setTypeIsCorrect] = useState(false);
  const [typeShowHint, setTypeShowHint] = useState(false);
  
  // Learning session summary stats
  const [learningCompletedCount, setLearningCompletedCount] = useState(0);
  const [learningSessionFinished, setLearningSessionFinished] = useState(false);

  // SRS state estimation based on system algorithm
  const dueWords = useMemo(() => {
    return words.filter(w => !w.nextReview || new Date(w.nextReview) <= new Date());
  }, [words]);

  const todayDateStr = new Date().toISOString().split('T')[0];

  // Map database wordType code to friendly label
  const getFriendlyTypeLabel = (t: string) => {
    switch (t) {
      case "noun": return "(n)";
      case "verb": return "(v)";
      case "adj": return "(adj)";
      case "adv": return "(adv)";
      case "idiom": return "(idiom)";
      case "phrase": return "(phrase)";
      case "sentence": return "(sent)";
      default: return t ? `(${t})` : "";
    }
  };

  // Browser speech synthesis function
  const speakWord = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel previous speaking
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Filtered personal word list
  const filteredWords = useMemo(() => {
    return words.filter(w => {
      const normQuery = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        w.vocabulary.toLowerCase().includes(normQuery) || 
        w.definition.toLowerCase().includes(normQuery) ||
        (w.examples && w.examples.some(ex => ex.toLowerCase().includes(normQuery)));

      const matchesTag = selectedTag 
        ? w.tags.map(t => stripEmojis(t).toLowerCase()).includes(stripEmojis(selectedTag).toLowerCase()) 
        : true;

      const matchesType = selectedType ? w.wordType === selectedType : true;

      const matchesDue = onlyDueForReview 
        ? (!w.nextReview || new Date(w.nextReview) <= new Date()) 
        : true;

      return matchesSearch && matchesTag && matchesType && matchesDue;
    });
  }, [words, searchQuery, selectedTag, selectedType, onlyDueForReview]);

  // Form submission: save or update word
  const handleSaveWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vocab.trim() || !definition.trim()) return;

    const formattedTags = activeTags.map(t => stripEmojis(t).trim()).filter(Boolean);

    if (editingWordId) {
      setWords(words.map(w => w.id === editingWordId ? {
        ...w,
        vocabulary: vocab.trim(),
        wordType: type,
        ipa: ipa.trim(),
        definition: definition.trim(),
        examples: example.trim() ? [example.trim()] : [],
        tags: formattedTags,
      } : w));
      setEditingWordId(null);
    } else {
      const newWord: Word = {
        id: Date.now().toString(),
        vocabulary: vocab.trim(),
        wordType: type,
        ipa: ipa.trim(),
        definition: definition.trim(),
        examples: example.trim() ? [example.trim()] : [],
        tags: formattedTags,
        difficulty: 2.5, // Standard starting easiness factor
        lastReviewed: new Date().toISOString(),
        nextReview: new Date().toISOString(), // Study immediately
      };
      setWords([newWord, ...words]);
    }

    // Reset Form & active tags list
    setVocab("");
    setIpa("");
    setDefinition("");
    setExample("");
    setActiveTags([]);
    
    // Smooth scroll back to table
    const tableElement = document.getElementById("english-bank-table");
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const startEditWord = (word: Word) => {
    setEditingWordId(word.id);
    setVocab(word.vocabulary);
    setType(word.wordType);
    setIpa(word.ipa || "");
    setDefinition(word.definition);
    setExample(word.examples?.[0] || "");
    setActiveTags(word.tags || []);

    const formElement = document.getElementById("english-log-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleDeleteWord = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa từ vựng này khỏi sổ tay của mình không?")) {
      setWords(words.filter(w => w.id !== id));
      if (editingWordId === id) {
        setEditingWordId(null);
        setVocab(""); setIpa(""); setDefinition(""); setExample(""); setActiveTags([]);
      }
    }
  };

  const toggleTagChip = (tag: string) => {
    const cleanTag = stripEmojis(tag);
    const exists = activeTags.some(t => stripEmojis(t).toLowerCase() === cleanTag.toLowerCase());
    if (exists) {
      setActiveTags(activeTags.filter(t => stripEmojis(t).toLowerCase() !== cleanTag.toLowerCase()));
    } else {
      setActiveTags([...activeTags, tag]);
    }
  };

  // Add tag globally if it doesn't exist
  const handleAddNewTag = () => {
    const cleanInput = stripEmojis(newTagInput).trim();
    if (cleanInput) {
      const exists = tags.some(t => stripEmojis(t).toLowerCase() === cleanInput.toLowerCase());
      if (!exists) {
        setTags([...tags, cleanInput]);
      }
      if (!activeTags.some(t => stripEmojis(t).toLowerCase() === cleanInput.toLowerCase())) {
        setActiveTags([...activeTags, cleanInput]);
      }
      setNewTagInput("");
    }
  };

  // Update SRS Score for card review
  const submitSrsScore = (wordId: string, quality: number) => {
    const word = words.find(w => w.id === wordId);
    if (!word) return;

    let newInterval = 1;
    let newDifficulty = word.difficulty || 2.5;

    if (quality >= 3) {
      if (!word.lastReviewed) {
        newInterval = 1;
      } else {
        const last = new Date(word.lastReviewed).getTime();
        const next = new Date(word.nextReview).getTime();
        const prevInterval = Math.max(1, Math.ceil((next - last) / 86400000));
        newInterval = Math.ceil(prevInterval * newDifficulty);
      }
      // Update EF
      newDifficulty = newDifficulty + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (newDifficulty < 1.3) newDifficulty = 1.3;
    } else {
      newInterval = 1;
      newDifficulty = Math.max(1.3, newDifficulty - 0.2);
    }

    const updated = words.map(w => w.id === wordId ? {
      ...w,
      difficulty: newDifficulty,
      lastReviewed: new Date().toISOString(),
      nextReview: new Date(Date.now() + newInterval * 86400000).toISOString()
    } : w);

    setWords(updated);
  };

  // Launch interactive study overlays with filtered items
  const startLearningSession = () => {
    if (filteredWords.length === 0) return;
    setLearningList([...filteredWords].sort(() => Math.random() - 0.5)); // Shuffle for learning fun!
    setLearningIndex(0);
    setLearningIsFlipped(false);
    setLearningMode('flashcard');
    setTypeInput("");
    setTypeShowFeedback(false);
    setTypeShowHint(false);
    setLearningCompletedCount(0);
    setLearningSessionFinished(false);
    setIsLearningActive(true);
  };

  // Advance learning sequence
  const advanceLearning = (quality: number) => {
    const currentWord = learningList[learningIndex];
    submitSrsScore(currentWord.id, quality);
    setLearningCompletedCount(prev => prev + 1);

    if (learningIndex < learningList.length - 1) {
      setLearningIndex(prev => prev + 1);
      setLearningIsFlipped(false);
      setTypeInput("");
      setTypeShowFeedback(false);
      setTypeShowHint(false);
    } else {
      setLearningSessionFinished(true);
      // Trigger canvas confetti upon complete
      try {
        if (typeof window !== "undefined" && (window as any).confetti) {
          (window as any).confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
        }
      } catch (e) {}
    }
  };

  const handleTypeCheckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeInput.trim()) return;

    const correctWord = learningList[learningIndex].vocabulary.toLowerCase().trim();
    const userWord = typeInput.toLowerCase().trim();

    const isMatch = correctWord === userWord;
    setTypeIsCorrect(isMatch);
    setTypeShowFeedback(true);
  };

  return (
    <div className="w-full max-w-[1440px] px-2 md:px-4 mx-auto pb-20">
      
      {/* SECTION NAV TABS */}
      <div className="flex justify-center gap-4 md:gap-8 mb-8">
        <button
          onClick={() => setActiveTab('personal')}
          className={cn(
            "text-lg md:text-xl font-hand font-black transition-all pb-1 flex items-center gap-2 border-b-4",
            activeTab === 'personal' ? "opacity-100 border-[#8A1E2B] text-[#8A1E2B]" : "opacity-40 hover:opacity-70 border-transparent text-[#3A1412]"
          )}
        >
          📖 Sổ Từ Cá Nhân
        </button>
        <button
          onClick={() => setActiveTab('cefr')}
          className={cn(
            "text-lg md:text-xl font-hand font-black transition-all pb-1 flex items-center gap-2 border-b-4",
            activeTab === 'cefr' ? "opacity-100 border-[#8A1E2B] text-[#8A1E2B]" : "opacity-40 hover:opacity-70 border-transparent text-[#3A1412]"
          )}
        >
          🎓 Thư Viện Từ CEFR
        </button>
      </div>

      {activeTab === 'cefr' && (
        <div className="bg-white rounded-3xl border-[3px] border-[#3A1412] p-6 shadow-[6px_6px_0_rgba(138,30,43,0.15)]">
          <CEFRVocabulary words={words} setWords={setWords} />
        </div>
      )}

      {activeTab === 'personal' && (
        <div className="space-y-12">
          
          {/* HEADER BOARD */}
          <div className="bg-[#FCFAF5] rounded-3xl border-[3px] border-[#3A1412] p-6 md:p-8 shadow-[6px_6px_0_rgba(138,30,43,0.15)] relative overflow-hidden">
            <div className="absolute -top-3 -left-3 w-16 h-10 bg-amber-100/60 border-2 border-[#3A1412]/10 rotate-[-12deg] z-10" />
            <div className="absolute -top-3 -right-3 w-16 h-10 bg-amber-100/60 border-2 border-[#3A1412]/10 rotate-[15deg] z-10" />

            <div className="text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <h1 className="font-hand font-black text-2xl md:text-4xl text-[#8A1E2B] tracking-tight uppercase flex items-center justify-center md:justify-start gap-3">
                  <span>📓 Sổ Tay Từ Vựng Tiếng Anh Chủ Động</span>
                </h1>
                <p className="text-sm text-[#3A1412]/80 font-sans font-bold max-w-2xl">
                  Ghi chú các từ mới, cụm từ, hoặc mẫu câu học được hàng ngày. Lọc theo chủ đề hoặc mức độ và bấm nút <strong className="text-[#8A1E2B]">Học Ngay</strong> để bắt đầu ôn luyện Flashcard / Ghi nhớ siêu tốc!
                </p>
              </div>

              {/* Status Board widget */}
              <div className="flex gap-4 bg-white border-2 border-[#3A1412] p-4 rounded-2xl shadow-[4px_4px_0_#3A1412] min-w-[200px] justify-center md:justify-start">
                <div className="text-center pr-4 border-r border-[#3A1412]/10">
                  <div className="text-2xl font-black text-[#8A1E2B] font-mono">{words.length}</div>
                  <div className="text-[9px] font-sans font-black text-[#3A1412]/50 uppercase">Đã lưu</div>
                </div>
                <div className="text-center pl-2">
                  <div className="text-2xl font-black text-amber-500 font-mono">{dueWords.length}</div>
                  <div className="text-[9px] font-sans font-black text-[#3A1412]/50 uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Ôn tập gấp
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN GRID DASHBOARD */}
          <div className="bg-white rounded-3xl border-[3px] border-[#3A1412] p-6 md:p-8 shadow-[6px_6px_0_rgba(138,30,43,0.15)] relative overflow-hidden">
            
            {/* Binder ring deco */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-4 md:gap-6 z-10 -mt-1">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-2.5 h-5 bg-gradient-to-r from-neutral-300 to-neutral-100 border border-[#3A1412] rounded-full shadow-xs" />
                  <div className="w-1.5 h-1.5 bg-[#3A1412] rounded-full -mt-1.5" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start pt-6">
              
              {/* LEFT COLUMN: Input Form */}
              <div id="english-log-form" className="xl:col-span-1 border-b-2 xl:border-b-0 xl:border-r-2 border-dashed border-[#8A1E2B]/15 pb-6 xl:pb-0 xl:pr-6 space-y-5">
                <h3 className="font-hand font-black text-xl text-[#3A1412] uppercase tracking-wide flex items-center gap-2 mb-1">
                  <span>{editingWordId ? "📝 Chỉnh Sửa Từ Vựng:" : "📌 Ghi Chú Từ Mới:"}</span>
                </h3>

                <form onSubmit={handleSaveWord} className="space-y-4">
                  
                  {/* Word / Phrase / Sentence */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-sans font-black text-[#3A1412]/60 uppercase tracking-widest">
                      💬 Từ vựng / Cụm từ / Câu mẫu * :
                    </label>
                    <input 
                      type="text"
                      required
                      value={vocab}
                      onChange={e => setVocab(e.target.value)}
                      placeholder="Ví dụ: itinerary, break a leg..."
                      className="w-full font-hand font-bold text-lg text-[#8A1E2B] bg-[#FCFAF5] border-2 border-[#8A1E2B] rounded-xl px-3 py-2 outline-none focus:bg-white transition-all shadow-xs"
                    />
                  </div>

                  {/* Classification Type selector */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-sans font-black text-[#3A1412]/60 uppercase tracking-widest">
                      📂 Phân loại cấu trúc:
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {WORD_TYPE_CHIPS.map(chip => (
                        <button
                          key={chip.val}
                          type="button"
                          onClick={() => setType(chip.val)}
                          className={`text-[10px] font-sans font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-all ${type === chip.val ? "bg-[#8A1E2B] text-white border-[#8A1E2B]" : "bg-[#FCFAF5] text-[#3A1412]/60 border-neutral-200 hover:bg-neutral-50"}`}
                        >
                          {chip.emoji} {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* IPA Pronunciation */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-sans font-black text-[#3A1412]/60 uppercase tracking-widest">
                      🗣️ Phiên âm IPA (Nếu có):
                    </label>
                    <input 
                      type="text"
                      value={ipa}
                      onChange={e => setIpa(e.target.value)}
                      placeholder="/aɪˈtɪnərəri/"
                      className="w-full font-sans font-bold text-sm text-[#8A1E2B] bg-[#FCFAF5] border-2 border-[#8A1E2B] rounded-xl px-3 py-2 outline-none focus:bg-white transition-all shadow-xs"
                    />
                  </div>

                  {/* Definition / Vietnamese interpretation */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-sans font-black text-[#3A1412]/60 uppercase tracking-widest">
                      ✍️ Nghĩa tiếng Việt / Định nghĩa * :
                    </label>
                    <textarea 
                      required
                      value={definition}
                      onChange={e => setDefinition(e.target.value)}
                      placeholder="Nhập giải nghĩa hoặc bản dịch..."
                      rows={2}
                      className="w-full font-sans font-semibold text-sm text-[#8A1E2B] bg-[#FCFAF5] border-2 border-[#8A1E2B] rounded-xl px-3 py-2 outline-none focus:bg-white resize-none transition-all shadow-xs"
                    />
                  </div>

                  {/* Example sentence */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-sans font-black text-[#3A1412]/60 uppercase tracking-widest">
                      📖 Ví dụ minh họa (Tiếng Anh):
                    </label>
                    <textarea 
                      value={example}
                      onChange={e => setExample(e.target.value)}
                      placeholder="Ví dụ: We review the itinerary before the cruise departs."
                      rows={2}
                      className="w-full font-hand font-bold text-lg text-[#8A1E2B] bg-[#FCFAF5] border-2 border-[#8A1E2B] rounded-xl px-3 py-2 outline-none focus:bg-white resize-none transition-all shadow-xs"
                    />
                  </div>

                  {/* Tags selection */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-sans font-black text-[#3A1412]/60 uppercase tracking-widest">
                      🏷️ Chủ đề / Tag nhãn:
                    </label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {QUICK_TAG_CHIPS.map(chip => {
                        const cleanLabel = stripEmojis(chip);
                        const isSelected = activeTags.some(t => stripEmojis(t).toLowerCase() === cleanLabel.toLowerCase());
                        return (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => toggleTagChip(chip)}
                            className={`text-[9px] font-sans font-black uppercase tracking-wider px-2 py-0.5 rounded-full border transition-all ${isSelected ? "bg-pink-100 text-[#8A1E2B] border-[#8A1E2B]" : "bg-neutral-50 hover:bg-neutral-100 text-[#3A1412]/60 border-neutral-200"}`}
                          >
                            {chip}
                          </button>
                        );
                      })}
                    </div>

                    {/* Manual tag adder */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <input 
                        type="text"
                        value={newTagInput}
                        onChange={e => setNewTagInput(e.target.value)}
                        placeholder="Thêm nhãn tự do..."
                        className="flex-1 font-sans font-bold text-xs text-[#8A1E2B] bg-[#FCFAF5] border border-dashed border-[#8A1E2B] rounded-lg px-2.5 py-1 outline-none focus:bg-white"
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddNewTag();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddNewTag}
                        className="bg-[#8A1E2B]/10 hover:bg-[#8A1E2B]/20 text-[#8A1E2B] p-1.5 rounded-lg border border-[#8A1E2B]/20 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>

                    {/* Active tags visual list */}
                    {activeTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1.5">
                        {activeTags.map(t => (
                          <span 
                            key={t}
                            className="bg-pink-50 border border-pink-200 text-[#8A1E2B] text-[9px] font-sans font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1"
                          >
                            #{stripEmojis(t)}
                            <button type="button" onClick={() => toggleTagChip(t)} className="hover:text-red-700">
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Buttons submit */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="w-full bg-[#8A1E2B] hover:bg-[#5C0612] text-white font-hand font-black text-xl py-3 rounded-xl transition-all shadow-[4px_4px_0_rgba(138,30,43,0.15)] hover:translate-y-[-1px] active:translate-y-[1px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {editingWordId ? <Check className="w-5 h-5 stroke-[3]" /> : <Plus className="w-5 h-5 stroke-[3]" />}
                      {editingWordId ? "Cập Nhật Từ" : "Lưu Vào Sổ"}
                    </button>
                    {editingWordId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingWordId(null);
                          setVocab(""); setIpa(""); setDefinition(""); setExample(""); setActiveTags([]);
                        }}
                        className="px-4 bg-neutral-200 hover:bg-neutral-300 text-[#3A1412] font-hand font-black text-lg rounded-xl transition-all cursor-pointer"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* RIGHT COLUMN: Interactive Table & Filters */}
              <div id="english-bank-table" className="xl:col-span-2 space-y-6">
                
                {/* FILTER CONTROLS */}
                <div className="bg-[#FCFAF5] rounded-2xl border-2 border-[#3A1412] p-4 space-y-4">
                  <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                    
                    {/* Search query input */}
                    <div className="flex items-center bg-white border-2 border-[#3A1412] px-3 py-1.5 rounded-xl w-full md:max-w-xs shadow-xs">
                      <Search className="w-4 h-4 text-[#3A1412]/50 mr-2" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Tìm từ, nghĩa, ví dụ..."
                        className="bg-transparent border-none outline-none text-xs font-sans font-bold text-[#3A1412] placeholder-[#3A1412]/40 w-full"
                      />
                      {searchQuery && (
                        <button type="button" onClick={() => setSearchQuery("")} className="hover:scale-110 ml-1">
                          <X className="w-3.5 h-3.5 text-[#3A1412]/50" />
                        </button>
                      )}
                    </div>

                    {/* Quick filter checkboxes / review switch */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={onlyDueForReview}
                          onChange={e => setOnlyDueForReview(e.target.checked)}
                          className="rounded border-[#3A1412] text-[#8A1E2B] focus:ring-[#8A1E2B] w-4 h-4 accent-[#8A1E2B]"
                        />
                        <span className="text-xs font-sans font-black uppercase text-[#3A1412]/80 tracking-wide">
                          🚨 Chỉ từ đến hạn ôn tập
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Type horizontal filter bar */}
                  <div className="flex flex-wrap gap-1.5 items-center text-xs pt-1 border-t border-[#3A1412]/10">
                    <span className="text-[10px] font-sans font-black text-[#3A1412]/40 uppercase tracking-widest mr-1">Bộ lọc dạng:</span>
                    <button 
                      onClick={() => setSelectedType(null)} 
                      className={cn("px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase transition-all", !selectedType ? "bg-[#3A1412] text-white border-[#3A1412]" : "bg-white text-[#3A1412]/60 border-neutral-200 hover:bg-neutral-50")}
                    >
                      Tất cả
                    </button>
                    {WORD_TYPE_CHIPS.map(chip => (
                      <button 
                        key={chip.val}
                        onClick={() => setSelectedType(chip.val)} 
                        className={cn("px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase transition-all", selectedType === chip.val ? "bg-[#3A1412] text-white border-[#3A1412]" : "bg-white text-[#3A1412]/60 border-neutral-200 hover:bg-neutral-50")}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {/* Tags list filters */}
                  <div className="flex flex-wrap gap-1.5 items-center text-xs pt-1">
                    <span className="text-[10px] font-sans font-black text-[#3A1412]/40 uppercase tracking-widest mr-1">Bộ lọc tag:</span>
                    <button 
                      onClick={() => setSelectedTag(null)} 
                      className={cn("px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase transition-all", !selectedTag ? "bg-pink-100 text-[#8A1E2B] border-[#8A1E2B]" : "bg-white text-[#3A1412]/60 border-neutral-200 hover:bg-neutral-50")}
                    >
                      Tất cả tag
                    </button>
                    {tags.map(tag => (
                      <button 
                        key={tag}
                        onClick={() => setSelectedTag(tag)} 
                        className={cn("px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase transition-all", selectedTag === tag ? "bg-pink-100 text-[#8A1E2B] border-[#8A1E2B]" : "bg-white text-[#3A1412]/60 border-neutral-200 hover:bg-neutral-50")}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* THE CORE learning cta button */}
                {filteredWords.length > 0 && (
                  <button
                    type="button"
                    onClick={startLearningSession}
                    className="w-full bg-[#8A1E2B] hover:bg-[#5C0612] text-white rounded-2xl p-4 shadow-[4px_4px_0_#3A1412] border-2 border-[#3A1412] transition-all hover:translate-y-[-2px] active:translate-y-[0px] flex items-center justify-center gap-3 cursor-pointer group"
                  >
                    <GraduationCap className="w-6 h-6 animate-bounce group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <div className="font-hand font-black text-xl md:text-2xl uppercase tracking-wider leading-none">📖 BẮT ĐẦU HỌC NGAY ({filteredWords.length} TỪ)</div>
                      <div className="text-[10px] font-sans font-bold uppercase opacity-85 tracking-widest mt-1">Luyện flashcard và gõ ghi nhớ các từ đã lọc</div>
                    </div>
                  </button>
                )}

                {/* VOCAB TABLE DISPLAY */}
                <div className="border-[3px] border-[#3A1412] rounded-3xl overflow-hidden bg-[#FCFAF5] shadow-[4px_4px_0_rgba(58,20,18,0.15)] relative">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#8A1E2B]/5 border-b-2 border-[#3A1412] text-[#3A1412]">
                          <th className="p-3 font-sans font-black text-xs uppercase tracking-wider text-center w-12">Tick</th>
                          <th className="p-3 font-sans font-black text-xs uppercase tracking-wider">Từ vựng & Loại</th>
                          <th className="p-3 font-sans font-black text-xs uppercase tracking-wider">Phiên âm</th>
                          <th className="p-3 font-sans font-black text-xs uppercase tracking-wider w-[28%]">Định nghĩa tiếng Việt</th>
                          <th className="p-3 font-sans font-black text-xs uppercase tracking-wider w-[28%]">Ví dụ minh họa</th>
                          <th className="p-3 font-sans font-black text-xs uppercase tracking-wider text-center w-24">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y border-[#3A1412]/10 divide-[#3A1412]/10">
                        {filteredWords.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-12 text-center font-hand text-xl font-bold text-neutral-400 italic">
                              Chưa có từ vựng nào phù hợp bộ lọc của bạn. Hãy tạo mới nha!
                            </td>
                          </tr>
                        ) : (
                          filteredWords.map(word => {
                            // Check if SRS progress deems it fully mastered (e.g. interval high or manually checked)
                            const isMastered = word.difficulty === 1 || word.difficulty < 1.5;
                            const wordTags = word.tags || [];

                            return (
                              <tr key={word.id} className={cn("transition-colors hover:bg-[#8A1E2B]/5", isMastered ? "bg-emerald-50/25" : "")}>
                                
                                {/* TICK MASTERED CHECK */}
                                <td className="p-3 text-center">
                                  <input 
                                    type="checkbox"
                                    checked={isMastered}
                                    onChange={() => {
                                      // Toggle mastered difficulty state between 1 and 2.5
                                      const nextDiff = isMastered ? 2.5 : 1;
                                      setWords(words.map(w => w.id === word.id ? { ...w, difficulty: nextDiff } : w));
                                    }}
                                    className="rounded border-[#3A1412] text-[#8A1E2B] focus:ring-[#8A1E2B] w-4.5 h-4.5 accent-emerald-600 cursor-pointer"
                                    title={isMastered ? "Đánh dấu là chưa thuộc" : "Đánh dấu đã thuộc lòng"}
                                  />
                                </td>

                                {/* VOCAB WORD */}
                                <td className="p-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-serif font-black text-lg text-[#8A1E2B] hover:underline cursor-pointer" onClick={() => speakWord(word.vocabulary)} title="Bấm để nghe phát âm">
                                        {word.vocabulary}
                                      </span>
                                      <button type="button" onClick={() => speakWord(word.vocabulary)} className="text-[#8A1E2B]/50 hover:text-[#8A1E2B]" title="Bấm để nghe phát âm">
                                        <Volume2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      <span className="bg-[#8A1E2B]/5 border border-[#8A1E2B]/15 px-1.5 py-0.5 rounded text-[8px] font-sans font-black uppercase tracking-wider text-[#8A1E2B]/80">
                                        {getFriendlyTypeLabel(word.wordType)}
                                      </span>
                                      {wordTags.map((t, idx) => (
                                        <span key={idx} className="bg-pink-50 border border-pink-200 text-[#8A1E2B] text-[8px] font-sans font-extrabold uppercase px-1.5 py-0.5 rounded">
                                          #{stripEmojis(t)}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </td>

                                {/* IPA */}
                                <td className="p-3 font-sans text-xs text-[#3A1412]/70 font-bold whitespace-nowrap">
                                  {word.ipa || "—"}
                                </td>

                                {/* TRANSLATION */}
                                <td className="p-3 font-sans text-sm text-[#3A1412] font-semibold w-[28%] min-w-[150px] max-w-[320px] break-words">
                                  {word.definition}
                                </td>

                                {/* EXAMPLES */}
                                <td className="p-3 font-hand text-base text-[#3A1412]/80 leading-snug italic w-[28%] min-w-[150px] max-w-[320px] break-words">
                                  {word.examples?.[0] ? `"${word.examples[0]}"` : "—"}
                                </td>

                                {/* ACTIONS */}
                                <td className="p-3 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => startEditWord(word)}
                                      className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-lg transition-all"
                                      title="Chỉnh sửa thông tin từ"
                                    >
                                      <Edit2 className="w-4 h-4 stroke-[2.5]" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteWord(word.id)}
                                      className="text-[#8A1E2B] hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                                      title="Xóa từ vựng này"
                                    >
                                      <Trash2 className="w-4 h-4 stroke-[2.5]" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      )}

      {/* FULL SCREEN INTERACTIVE LEARNING SESSION OVERLAY MODAL */}
      <AnimatePresence>
        {isLearningActive && (
          <div className="fixed inset-0 bg-[#3A1412]/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FCFAF5] rounded-3xl border-[4px] border-[#3A1412] max-w-2xl w-full p-6 md:p-8 shadow-[8px_8px_0_#3A1412] relative overflow-hidden"
            >
              
              {/* Ring notebook holes decor at left edge */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-5 z-20 -ml-2 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-[#3A1412] rounded-full border-2 border-amber-100 shadow-inner" />
                ))}
              </div>

              {/* Close session button */}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Bạn có chắc chắn muốn thoát phiên học chủ động này không?")) {
                    setIsLearningActive(false);
                  }
                }}
                className="absolute top-4 right-4 bg-white hover:bg-red-50 border-2 border-[#3A1412] text-[#3A1412] p-2 rounded-xl transition-all shadow-xs hover:scale-105"
              >
                <X className="w-5 h-5 stroke-[3]" />
              </button>

              {!learningSessionFinished ? (
                <div className="space-y-6 pt-4 pl-4">
                  
                  {/* SESSION BAR HEADER */}
                  <div className="border-b-4 border-[#3A1412] pb-4 flex items-center justify-between">
                    <div>
                      <h2 className="font-hand font-black text-2xl text-[#8A1E2B] uppercase tracking-wide flex items-center gap-2">
                        <span>🎓 PHIÊN ÔN TẬP TIẾNG ANH</span>
                      </h2>
                      <p className="text-[10px] font-sans font-black text-[#3A1412]/50 uppercase tracking-widest mt-1">Đồng bộ lưu giữ trực tiếp vào sổ tay học tập</p>
                    </div>

                    {/* Progress indicator */}
                    <div className="text-right">
                      <span className="font-sans font-black text-xs text-[#3A1412] uppercase bg-white border-2 border-[#3A1412] px-3 py-1 rounded-full">
                        {learningIndex + 1} / {learningList.length}
                      </span>
                    </div>
                  </div>

                  {/* Progress visual bar */}
                  <div className="w-full bg-[#3A1412]/10 h-3 rounded-full overflow-hidden border-2 border-[#3A1412]">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${((learningIndex + 1) / learningList.length) * 100}%` }}
                    />
                  </div>

                  {/* INTERACTIVE MODE SELECTOR */}
                  <div className="flex bg-white border-2 border-[#3A1412] rounded-xl p-1 max-w-xs mx-auto mb-6 shadow-xs">
                    <button 
                      type="button" 
                      onClick={() => { setLearningMode('flashcard'); setLearningIsFlipped(false); }}
                      className={cn("w-1/2 py-1.5 rounded-lg text-xs font-sans font-black uppercase transition-all", learningMode === 'flashcard' ? 'bg-[#8A1E2B] text-white' : 'text-[#3A1412]/60')}
                    >
                      🎴 Thẻ Flashcard
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setLearningMode('type_test'); setTypeShowFeedback(false); setTypeInput(''); }}
                      className={cn("w-1/2 py-1.5 rounded-lg text-xs font-sans font-black uppercase transition-all", learningMode === 'type_test' ? 'bg-[#8A1E2B] text-white' : 'text-[#3A1412]/60')}
                    >
                      ✍️ Gõ Ghi Nhớ
                    </button>
                  </div>

                  {/* CARD CANVAS ZONE */}
                  <div className="min-h-[260px] flex items-center justify-center py-4">
                    {learningMode === 'flashcard' ? (
                      
                      /* FLASHCARD MODE INTERACTIVE CANVAS */
                      <div 
                        onClick={() => setLearningIsFlipped(!learningIsFlipped)}
                        className="w-full aspect-[2/1] bg-white rounded-3xl border-[3px] border-[#3A1412] shadow-[6px_6px_0_#3A1412] p-6 relative cursor-pointer overflow-y-auto flex flex-col items-center justify-center text-center select-none hover:bg-[#FFF9F0] transition-colors"
                      >
                        <span className="text-[9px] font-sans font-black uppercase tracking-widest text-[#3A1412]/30 absolute top-3">
                          {learningIsFlipped ? "ĐÁP ÁN (BẤM ĐỂ LẬT LẠI)" : "CÂU HỎI (BẤM ĐỂ LẬT THẺ)"}
                        </span>

                        {!learningIsFlipped ? (
                          <div className="space-y-3">
                            <h3 className="font-serif font-black text-3xl md:text-5xl text-[#8A1E2B] tracking-tight">
                              {learningList[learningIndex].vocabulary}
                            </h3>
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-sm font-sans font-bold text-[#3A1412]/60">
                                {learningList[learningIndex].ipa || "/—/"}
                              </span>
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); speakWord(learningList[learningIndex].vocabulary); }}
                                className="bg-[#8A1E2B]/10 hover:bg-[#8A1E2B]/20 text-[#8A1E2B] p-1.5 rounded-lg transition-all border border-[#8A1E2B]/20"
                                title="Bấm nghe phát âm"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                            </div>
                            <span className="bg-[#8A1E2B]/5 border border-[#8A1E2B]/15 px-2.5 py-0.5 rounded text-[9px] font-sans font-black uppercase text-[#8A1E2B]/80 inline-block">
                              {getFriendlyTypeLabel(learningList[learningIndex].wordType)}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] font-sans font-black text-neutral-400 uppercase tracking-widest">Ý nghĩa tiếng Việt:</span>
                              <h4 className="font-sans font-black text-xl md:text-2xl text-[#3A1412] mt-1">
                                {learningList[learningIndex].definition}
                              </h4>
                            </div>

                            {learningList[learningIndex].examples?.[0] && (
                              <div className="bg-[#FFF9F0] border border-dashed border-[#8A1E2B]/30 p-3 rounded-xl max-w-md mx-auto">
                                <span className="text-[9px] font-sans font-black text-rose-400 uppercase tracking-widest block mb-1">Ví dụ ngữ cảnh:</span>
                                <p className="font-hand font-bold text-lg text-[#8A1E2B] leading-snug italic">
                                  "{learningList[learningIndex].examples[0]}"
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                    ) : (

                      /* WRITING TEST INTERACTIVE CANVAS */
                      <div className="w-full bg-white rounded-3xl border-[3px] border-[#3A1412] shadow-[6px_6px_0_#3A1412] p-6 space-y-5">
                        <div className="text-center space-y-1">
                          <span className="text-[9px] font-sans font-black uppercase tracking-widest text-[#3A1412]/40 block">Dịch từ / Điền từ hoàn thành câu:</span>
                          <h4 className="font-sans font-black text-lg md:text-xl text-[#8A1E2B]">
                            {learningList[learningIndex].definition}
                          </h4>
                          <span className="bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded text-[8px] font-sans font-black uppercase text-[#3A1412]/60 inline-block">
                            {getFriendlyTypeLabel(learningList[learningIndex].wordType)}
                          </span>
                        </div>

                        {/* Highlight Context Sentence with gap */}
                        <div className="bg-[#FFF9F0] border-2 border-dashed border-[#3A1412]/10 p-4 rounded-xl text-center">
                          <p className="font-hand font-bold text-xl text-[#3A1412]/80 leading-relaxed italic">
                            {learningList[learningIndex].examples?.[0] ? (
                              <>
                                "{learningList[learningIndex].examples[0].replace(
                                  new RegExp(learningList[learningIndex].vocabulary, 'gi'),
                                  "________"
                                )}"
                              </>
                            ) : (
                              "Chưa có câu mẫu ví dụ cho từ này. Hãy gõ từ chuẩn xác!"
                            )}
                          </p>
                        </div>

                        {/* Interactive Submit Area */}
                        <form onSubmit={handleTypeCheckSubmit} className="space-y-3">
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              value={typeInput}
                              onChange={e => setTypeInput(e.target.value)}
                              placeholder="Nhập từ vựng tiếng Anh chính xác..."
                              className="flex-1 font-sans font-bold text-sm bg-[#FCFAF5] border-2 border-[#3A1412] rounded-xl px-4 py-2.5 outline-none focus:bg-white transition-all shadow-inner"
                              disabled={typeShowFeedback}
                              autoFocus
                            />
                            {!typeShowFeedback ? (
                              <button
                                type="submit"
                                className="bg-[#8A1E2B] hover:bg-[#5C0612] text-white font-sans font-black text-xs uppercase px-5 rounded-xl transition-all shadow-xs cursor-pointer"
                              >
                                Kiểm tra
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => advanceLearning(typeIsCorrect ? 5 : 0)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-sans font-black text-xs uppercase px-5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                Tiếp tục <ArrowRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Hints, Pronunciation buttons */}
                          <div className="flex items-center justify-between text-xs pt-1">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setTypeShowHint(true)}
                                className="text-[#8A1E2B] hover:underline font-bold uppercase tracking-wider text-[10px] flex items-center gap-0.5"
                              >
                                💡 Gợi ý chữ cái
                              </button>
                              <button
                                type="button"
                                onClick={() => speakWord(learningList[learningIndex].vocabulary)}
                                className="text-blue-600 hover:underline font-bold uppercase tracking-wider text-[10px] flex items-center gap-0.5"
                              >
                                🔊 Nghe phát âm
                              </button>
                            </div>

                            {/* Letters hint banner */}
                            {typeShowHint && (
                              <span className="font-mono text-xs font-black text-[#8A1E2B] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                Bắt đầu bằng: "{learningList[learningIndex].vocabulary.substring(0, 2)}..." (Dài {learningList[learningIndex].vocabulary.length} chữ)
                              </span>
                            )}
                          </div>
                        </form>

                        {/* FEEDBACK BANNERS */}
                        {typeShowFeedback && (
                          <div className={cn(
                            "p-3.5 rounded-xl border-2 flex items-center gap-3 animate-pulse",
                            typeIsCorrect 
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                              : "bg-red-50 border-red-200 text-red-800"
                          )}>
                            <div className="text-2xl">{typeIsCorrect ? "🎉" : "😢"}</div>
                            <div className="text-xs font-sans">
                              {typeIsCorrect ? (
                                <p className="font-black uppercase tracking-wider">Chính xác hoàn hảo! Tuyệt vời!</p>
                              ) : (
                                <p className="font-bold">
                                  Chưa đúng rồi! Từ đúng là: <strong className="font-black underline text-[#8A1E2B] text-sm">{learningList[learningIndex].vocabulary}</strong>
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                    )}
                  </div>

                  {/* BOTTOM GRADING CONTROLS (Only shows for Flashcard mode when flipped) */}
                  {learningMode === 'flashcard' && (
                    <div className="pt-2">
                      {learningIsFlipped ? (
                        <div className="space-y-3">
                          <p className="text-[10px] font-sans font-black text-center text-[#3A1412]/40 uppercase tracking-widest">Đánh giá mức độ nhớ của bạn để lưu lịch ôn tập:</p>
                          <div className="grid grid-cols-3 gap-3 w-full">
                            <button
                              type="button"
                              onClick={() => advanceLearning(0)}
                              className="bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-300 py-3 rounded-xl font-sans font-black uppercase text-xs tracking-wider transition-all shadow-xs cursor-pointer flex flex-col items-center justify-center gap-0.5"
                            >
                              <span>Quên rồi 😢</span>
                              <span className="text-[8px] opacity-60">Xem lại sớm</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => advanceLearning(3)}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-2 border-amber-300 py-3 rounded-xl font-sans font-black uppercase text-xs tracking-wider transition-all shadow-xs cursor-pointer flex flex-col items-center justify-center gap-0.5"
                            >
                              <span>Khó nhớ 🤔</span>
                              <span className="text-[8px] opacity-60">Ôn trung hạn</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => advanceLearning(5)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-2 border-emerald-300 py-3 rounded-xl font-sans font-black uppercase text-xs tracking-wider transition-all shadow-xs cursor-pointer flex flex-col items-center justify-center gap-0.5"
                            >
                              <span>Đã thuộc! 😎</span>
                              <span className="text-[8px] opacity-60">Thành thạo</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2 animate-bounce">
                          <p className="text-xs text-[#3A1412]/50 font-sans font-black uppercase tracking-wider">
                            💡 Nhấp vào Thẻ để xem đáp án & ví dụ giải nghĩa
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ) : (

                /* SUMMARY SESSION FINISHED BOARD */
                <div className="text-center py-12 pl-4 pr-4 space-y-6">
                  <div className="w-20 h-20 bg-emerald-100 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-scaleUp">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="font-hand font-black text-3xl md:text-4xl text-[#8A1E2B] uppercase">XUẤT SẮC HOÀN THÀNH!</h2>
                    <p className="font-hand font-bold text-xl text-[#3A1412]/80">
                      Bạn đã hoàn thành ôn tập toàn bộ <span className="text-[#8A1E2B] font-extrabold font-mono text-2xl">{learningCompletedCount}</span> từ vựng đã chọn!
                    </p>
                    <p className="text-xs text-[#3A1412]/50 font-sans font-bold uppercase tracking-wider pt-1">Lịch ôn tập thông minh đã được tính toán tự động lưu trữ</p>
                  </div>

                  {/* Motivator block */}
                  <div className="bg-amber-50 border-2 border-dashed border-amber-300 p-4 rounded-2xl max-w-sm mx-auto shadow-xs text-center space-y-1">
                    <Award className="w-8 h-8 text-amber-500 mx-auto" />
                    <p className="font-sans font-black text-xs text-[#3A1412] uppercase tracking-wider">Kỷ lục gia thông thái</p>
                    <p className="font-hand text-base text-[#3A1412]/70">"Kiên trì tích lũy từng từ vựng mỗi ngày là chiếc chìa khóa mở cánh cửa tri thức vươn ra thế giới."</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsLearningActive(false)}
                    className="bg-[#3A1412] hover:bg-[#5C0612] text-white font-sans font-black text-sm uppercase tracking-wider px-8 py-3 rounded-xl transition-all shadow-[4px_4px_0_rgba(138,30,43,0.15)] cursor-pointer"
                  >
                    Quay về Sổ Tay Từ Vựng
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
