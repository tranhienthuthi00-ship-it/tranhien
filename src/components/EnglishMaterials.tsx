import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { EnglishBook, EnglishMaterialUnit, Word } from "../types";
import { 
  BookOpen, 
  FileText, 
  Upload, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowLeft, 
  Search, 
  Download, 
  Play, 
  Pause, 
  Volume2, 
  GraduationCap, 
  Tag, 
  ChevronRight, 
  X, 
  BookMarked, 
  FileAudio, 
  FileImage, 
  FileCode, 
  Check, 
  RotateCcw, 
  FolderPlus,
  Layers,
  Award,
  BookCheck,
  Copy,
  ExternalLink
} from "lucide-react";

import { MindmapView } from "./MindmapView";
import { RichTextEditor } from "./RichTextEditor";

interface EnglishMaterialsProps {
  books: EnglishBook[];
  setBooks: (books: EnglishBook[] | ((prev: EnglishBook[]) => EnglishBook[])) => void;
  words: Word[];
  setWords: (words: Word[] | ((prev: Word[]) => Word[])) => void;
}

export function EnglishMaterials({ books, setBooks, words, setWords }: EnglishMaterialsProps) {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Modals
  const [showAddBookModal, setShowAddBookModal] = useState<boolean>(false);
  const [editingBook, setEditingBook] = useState<EnglishBook | null>(null);
  const [showAddUnitModal, setShowAddUnitModal] = useState<boolean>(false);
  const [targetBookIdForUnit, setTargetBookIdForUnit] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<{ bookId: string; unit: EnglishMaterialUnit } | null>(null);
  const [selectedBookOption, setSelectedBookOption] = useState<string>("");

  const handleMarkUnitAsEdited = (bookId: string, unitId: string) => {
    setBooks(prev => prev.map(b => {
      if (b.id !== bookId) return b;
      return {
        ...b,
        units: b.units.map(u => u.id === unitId ? { ...u, isNew: false, isEdited: true, updatedAt: Date.now() } : u)
      };
    }));
    showToast("Đã đánh dấu bài học là đã chỉnh sửa!");
  };

  // Active sub-tab inside Unit View
  const [activeUnitTab, setActiveUnitTab] = useState<"document" | "vocabulary" | "notes" | "flashcards" | "mindmap">("document");
  
  // Reader font size state
  const [readerFontSize, setReaderFontSize] = useState<number>(16);

  // Flashcards state inside Unit
  const [flashcardIndex, setFlashcardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Notification / Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Categories derived from books
  const categories = useMemo(() => {
    const set = new Set<string>();
    set.add("Tất cả");
    books.forEach(b => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [books]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesCategory = selectedCategory === "Tất cả" || book.category === selectedCategory;
      const matchesSearch = searchQuery === "" || 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.author && book.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
        book.units.some(u => u.title.toLowerCase().includes(searchQuery.toLowerCase()) || u.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [books, selectedCategory, searchQuery]);

  // Currently opened Book and Unit
  const currentBook = useMemo(() => {
    return books.find(b => b.id === selectedBookId) || null;
  }, [books, selectedBookId]);

  const currentUnit = useMemo(() => {
    if (!currentBook) return null;
    return currentBook.units.find(u => u.id === selectedUnitId) || null;
  }, [currentBook, selectedUnitId]);

  // Overall statistics
  const stats = useMemo(() => {
    let totalUnits = 0;
    let completedUnits = 0;
    let inProgressUnits = 0;
    let totalWords = 0;

    books.forEach(book => {
      book.units.forEach(unit => {
        totalUnits++;
        if (unit.status === "Completed") completedUnits++;
        if (unit.status === "In Progress") inProgressUnits++;
        if (unit.vocabularyList) totalWords += unit.vocabularyList.length;
      });
    });

    const completionRate = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;
    return { totalBooks: books.length, totalUnits, completedUnits, inProgressUnits, totalWords, completionRate };
  }, [books]);

  // Book color theme helper
  const getCoverColorClass = (color?: string) => {
    switch (color) {
      case "amber": return { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-900", badge: "bg-amber-500", accent: "#f59e0b" };
      case "emerald": return { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-900", badge: "bg-emerald-500", accent: "#10b981" };
      case "indigo": return { bg: "bg-indigo-100", border: "border-indigo-300", text: "text-indigo-900", badge: "bg-indigo-500", accent: "#6366f1" };
      case "rose": return { bg: "bg-rose-100", border: "border-rose-300", text: "text-rose-900", badge: "bg-rose-500", accent: "#f43f5e" };
      case "sky": return { bg: "bg-sky-100", border: "border-sky-300", text: "text-sky-900", badge: "bg-sky-500", accent: "#0284c7" };
      case "purple": return { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-900", badge: "bg-purple-500", accent: "#a855f7" };
      default: return { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-900", badge: "bg-amber-500", accent: "#f59e0b" };
    }
  };

  // Delete Book
  const handleDeleteBook = (bookId: string, title: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa cuốn sách "${title}" và toàn bộ các Unit bên trong không?`)) {
      setBooks(prev => prev.filter(b => b.id !== bookId));
      if (selectedBookId === bookId) {
        setSelectedBookId(null);
        setSelectedUnitId(null);
      }
      showToast("Đã xóa cuốn sách thành công!");
    }
  };

  // Delete Unit
  const handleDeleteUnit = (bookId: string, unitId: string, unitTitle: string) => {
    if (confirm(`Xóa Unit "${unitTitle}"?`)) {
      setBooks(prev => prev.map(book => {
        if (book.id !== bookId) return book;
        return {
          ...book,
          units: book.units.filter(u => u.id !== unitId),
          updatedAt: Date.now()
        };
      }));
      if (selectedUnitId === unitId) setSelectedUnitId(null);
      showToast("Đã xóa Unit thành công!");
    }
  };

  // Toggle Unit Status
  const handleToggleUnitStatus = (bookId: string, unitId: string, currentStatus: string) => {
    const nextStatusMap: Record<string, "Not Started" | "In Progress" | "Completed"> = {
      "Not Started": "In Progress",
      "In Progress": "Completed",
      "Completed": "Not Started"
    };
    const nextStatus = nextStatusMap[currentStatus] || "In Progress";

    setBooks(prev => prev.map(book => {
      if (book.id !== bookId) return book;
      return {
        ...book,
        updatedAt: Date.now(),
        units: book.units.map(u => u.id === unitId ? { ...u, status: nextStatus, updatedAt: Date.now() } : u)
      };
    }));

    showToast(`Đã chuyển trạng thái Unit sang: ${nextStatus === "Completed" ? "Đã hoàn thành 🎉" : nextStatus === "In Progress" ? "Đang học 📖" : "Chưa học ⏳"}`);
  };

  // Sync Unit Vocabulary to main Academy words
  const handleSyncVocabularyToAcademy = (unit: EnglishMaterialUnit, bookTitle: string) => {
    if (!unit.vocabularyList || unit.vocabularyList.length === 0) {
      alert("Unit này chưa có danh sách từ vựng nào để đồng bộ.");
      return;
    }

    const newWordsCount = unit.vocabularyList.length;
    const nowIso = new Date().toISOString();

    const newAcademyWords: Word[] = unit.vocabularyList.map((item, idx) => ({
      id: `synced-${unit.id}-${Date.now()}-${idx}`,
      vocabulary: item.word,
      wordType: "noun",
      ipa: item.ipa || "",
      definition: item.meaning,
      examples: item.example ? [item.example] : [],
      tags: [bookTitle, unit.unitNumber],
      difficulty: 0,
      lastReviewed: nowIso,
      nextReview: nowIso
    }));

    setWords(prev => {
      const existingVocabs = new Set(prev.map(w => w.vocabulary.toLowerCase()));
      const filteredNew = newAcademyWords.filter(w => !existingVocabs.has(w.vocabulary.toLowerCase()));
      return [...filteredNew, ...prev];
    });

    showToast(`🎉 Đã đưa ${newWordsCount} từ vựng vào Kho Từ Vựng Tiếng Anh chính!`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 md:px-4 py-4 text-ink">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-4 z-[999] bg-ink text-white px-4 py-2.5 rounded-xl shadow-xl border-2 border-amber-300 font-bold text-xs md:text-sm flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SUMMARY SECTION */}
      {!selectedUnitId && (
        <div className="mb-6 bg-white border-[2px] border-[#141414] rounded-2xl p-4 md:p-6 shadow-[5px_5px_0px_#141414]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#141414] font-extrabold text-lg md:text-2xl tracking-tight uppercase">
                <BookMarked className="w-6 h-6 text-[#FF5A5F]" />
                <span>Tài Liệu Tiếng Anh Theo Sách & Unit</span>
              </div>
              <p className="text-xs md:text-sm text-[#555] font-semibold mt-1">
                Tải lên và lưu trữ sách học, bài giảng, từ vựng & tài liệu cá nhân chia theo từng Bài/Unit.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                onClick={() => {
                  setEditingBook(null);
                  setShowAddBookModal(true);
                }}
                className="flex-1 md:flex-none px-4 py-2 bg-[#141414] hover:bg-[#333] text-white font-extrabold text-xs md:text-sm rounded-xl border-2 border-[#141414] shadow-[3px_3px_0px_rgba(0,0,0,0.2)] transition-transform active:translate-y-0.5 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Tạo Sách Mới</span>
              </button>

              <button
                onClick={() => {
                  setTargetBookIdForUnit(books[0]?.id || null);
                  setEditingUnit(null);
                  setShowAddUnitModal(true);
                }}
                className="flex-1 md:flex-none px-4 py-2 bg-[#FF5A5F] hover:bg-rose-600 text-white font-extrabold text-xs md:text-sm rounded-xl border-2 border-[#141414] shadow-[3px_3px_0px_#141414] transition-transform active:translate-y-0.5 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Tài Liệu / Unit</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t-2 border-[#141414]/10">
            <div className="bg-[#FFFDF5] p-3 rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 border border-[#141414] flex items-center justify-center text-[#141414] font-black">
                <BookOpen className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#666]">Tổng Sách</p>
                <p className="text-lg font-black text-[#141414]">{stats.totalBooks} Sách</p>
              </div>
            </div>

            <div className="bg-[#FFFDF5] p-3 rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 border border-[#141414] flex items-center justify-center text-[#141414] font-black">
                <Layers className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#666]">Tổng Số Unit</p>
                <p className="text-lg font-black text-[#141414]">{stats.totalUnits} Units</p>
              </div>
            </div>

            <div className="bg-[#FFFDF5] p-3 rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 border border-[#141414] flex items-center justify-center text-[#141414] font-black">
                <BookCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#666]">Hoàn Thành</p>
                <p className="text-lg font-black text-[#141414]">{stats.completedUnits} / {stats.totalUnits}</p>
              </div>
            </div>

            <div className="bg-[#FFFDF5] p-3 rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-100 border border-[#141414] flex items-center justify-center text-[#141414] font-black">
                <GraduationCap className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#666]">Từ Vựng Trong Unit</p>
                <p className="text-lg font-black text-[#141414]">{stats.totalWords} Từ</p>
              </div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center text-xs font-extrabold text-[#141414] mb-1">
              <span>Tiến độ học tổng quan</span>
              <span>{stats.completionRate}% Đã xong</span>
            </div>
            <div className="w-full h-3 bg-[#EFECE6] rounded-full overflow-hidden border-2 border-[#141414]">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* IF A SPECIFIC UNIT IS OPENED -> UNIT STUDY WORKSPACE */}
      {selectedBookId && selectedUnitId && currentBook && currentUnit ? (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          {/* Breadcrumb Header */}
          <div className="bg-white p-3 md:p-4 rounded-2xl border-2 border-ink shadow-[3px_3px_0px_#000] flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setSelectedUnitId(null)}
              className="px-3 py-1.5 bg-paper hover:bg-amber-100 font-bold text-xs rounded-xl border border-ink flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Trở về {currentBook.title}</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-ink/70 overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="hidden sm:inline">{currentBook.title}</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-crimson font-black flex items-center gap-1.5">
                <span>{currentUnit.unitNumber}: {currentUnit.title}</span>
                {(currentUnit.isNew && !currentUnit.isEdited) && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight flex items-center gap-1 shadow-sm">
                    <span>(new)</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkUnitAsEdited(currentBook.id, currentUnit.id);
                      }}
                      title="Đánh dấu bài học này đã kiểm tra / chỉnh sửa"
                      className="hover:underline text-amber-200 text-[9px] ml-1 bg-black/20 px-1 py-0.2 rounded"
                    >
                      ✓ Đã sửa
                    </button>
                  </span>
                )}
              </span>
            </div>

            {/* Status Switcher */}
            <div className="flex items-center gap-1 bg-paper p-1 rounded-xl border border-ink/20">
              {(["Not Started", "In Progress", "Completed"] as const).map(st => (
                <button
                  key={st}
                  onClick={() => handleToggleUnitStatus(currentBook.id, currentUnit.id, currentUnit.status === st ? "Not Started" : currentUnit.status)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    currentUnit.status === st 
                      ? st === "Completed" ? "bg-emerald-600 text-white shadow-sm" : st === "In Progress" ? "bg-amber-500 text-white shadow-sm" : "bg-gray-400 text-white shadow-sm"
                      : "text-ink/50 hover:text-ink hover:bg-black/5"
                  }`}
                >
                  {st === "Completed" ? "Đã xong ✓" : st === "In Progress" ? "Đang học 📖" : "Chưa học"}
                </button>
              ))}
            </div>
          </div>

          {/* UNIT STUDY SUB-TABS */}
          <div className="flex flex-wrap gap-2 border-b-2 border-dashed border-ink/20 pb-2">
            {[
              { id: "document", label: "📄 Nội Dung & Tài Liệu", icon: FileText },
              { id: "vocabulary", label: `🔤 Từ Vựng (${currentUnit.vocabularyList?.length || 0})`, icon: GraduationCap },
              { id: "notes", label: "📝 Ghi Chú Ôn Tập", icon: Edit3 },
              { id: "flashcards", label: "🎴 Thẻ Lật Luyện Nhớ", icon: RotateCcw },
              { id: "mindmap", label: "🧠 Mindmap", icon: Edit3 }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveUnitTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    activeUnitTab === tab.id
                      ? "bg-amber-500 text-white border-2 border-amber-900 shadow-[2px_2px_0px_#78350f]"
                      : "bg-white text-ink border-2 border-ink/20 hover:border-ink"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingUnit({ bookId: currentBook.id, unit: currentUnit });
                  setShowAddUnitModal(true);
                }}
                className="px-3 py-1.5 bg-paper hover:bg-amber-100 border border-ink text-xs font-bold rounded-xl flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh Sửa Unit</span>
              </button>

              <button
                onClick={() => handleSyncVocabularyToAcademy(currentUnit, currentBook.title)}
                title="Đưa toàn bộ từ vựng trong Unit này vào Kho Từ Vựng chính (Academy)"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Đồng bộ từ vựng</span>
              </button>
            </div>
          </div>

          {/* TAB 1: DOCUMENT CONTENT & ATTACHMENT */}
          {activeUnitTab === "document" && (
            <div className="bg-white p-4 md:p-6 rounded-2xl border-2 border-ink shadow-[4px_4px_0px_#000] flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg border border-amber-300">
                    {currentUnit.unitNumber}
                  </span>
                  <h2 className="text-lg md:text-xl font-black text-ink">{currentUnit.title}</h2>
                </div>

                {/* Font Size controls */}
                <div className="flex items-center gap-1 bg-paper px-2 py-1 rounded-lg border border-ink/20 text-xs font-bold">
                  <span className="text-ink/60">Cỡ chữ:</span>
                  <button 
                    onClick={() => setReaderFontSize(p => Math.max(12, p - 2))} 
                    className="w-6 h-6 hover:bg-black/10 rounded flex items-center justify-center font-black"
                  >
                    A-
                  </button>
                  <span className="w-6 text-center">{readerFontSize}</span>
                  <button 
                    onClick={() => setReaderFontSize(p => Math.min(28, p + 2))} 
                    className="w-6 h-6 hover:bg-black/10 rounded flex items-center justify-center font-black"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Description */}
              {currentUnit.description && (
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs font-medium text-amber-900 italic">
                  💡 {currentUnit.description}
                </div>
              )}

              {/* Attachment Preview (Audio / Image / File) */}
              {currentUnit.fileUrl && (
                <div className="bg-paper p-3 rounded-xl border-2 border-dashed border-ink/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-ink/70">
                    <span className="flex items-center gap-1.5">
                      {currentUnit.fileType === "audio" && <FileAudio className="w-4 h-4 text-purple-600" />}
                      {currentUnit.fileType === "image" && <FileImage className="w-4 h-4 text-emerald-600" />}
                      {currentUnit.fileType === "text" && <FileCode className="w-4 h-4 text-amber-600" />}
                      {currentUnit.fileName || "Tài liệu đính kèm"}
                    </span>
                    <a 
                      href={currentUnit.fileUrl} 
                      download={currentUnit.fileName || "document"}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-ink text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-crimson transition-colors"
                    >
                      <Download className="w-3 h-3" /> Tải về File
                    </a>
                  </div>

                  {/* HTML5 Audio Player */}
                  {currentUnit.fileType === "audio" && (
                    <audio controls className="w-full mt-1">
                      <source src={currentUnit.fileUrl} />
                      Trình duyệt không hỗ trợ phát audio.
                    </audio>
                  )}

                  {/* Image Preview */}
                  {currentUnit.fileType === "image" && (
                    <div className="mt-2 max-h-96 overflow-hidden rounded-xl border border-ink/20 bg-black/5 flex items-center justify-center">
                      <img src={currentUnit.fileUrl} alt={currentUnit.fileName || "Tài liệu đính kèm"} className="max-h-96 object-contain" />
                    </div>
                  )}
                </div>
              )}

              {/* Document Text Body */}
              <div 
                className="leading-relaxed font-sans text-ink selection:bg-amber-200 p-2 prose max-w-none"
                style={{ fontSize: `${readerFontSize}px` }}
              >
                {currentUnit.content ? (
                  <div dangerouslySetInnerHTML={{ __html: currentUnit.content }} />
                ) : (
                  <p className="text-gray-400 italic text-sm text-center py-8">
                    Chưa có nội dung văn bản. Nhấp "Chỉnh Sửa Unit" để dán tài liệu học hoặc tải tệp lên.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: VOCABULARY LIST IN UNIT */}
          {activeUnitTab === "vocabulary" && (
            <div className="bg-white p-4 md:p-6 rounded-2xl border-2 border-ink shadow-[4px_4px_0px_#000] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-ink uppercase tracking-tight flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-amber-600" />
                    Từ Vựng Trọng Tâm Unit
                  </h3>
                  <p className="text-xs text-ink/60">
                    Danh sách các từ mới, cụm từ và thành ngữ thuộc bài học này.
                  </p>
                </div>

                <button
                  onClick={() => handleSyncVocabularyToAcademy(currentUnit, currentBook.title)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>Đưa hết vào Kho Từ Vựng chính</span>
                </button>
              </div>

              {(!currentUnit.vocabularyList || currentUnit.vocabularyList.length === 0) ? (
                <div className="text-center py-10 border-2 border-dashed border-ink/20 rounded-2xl bg-paper">
                  <p className="text-sm font-bold text-ink/50">Chưa có từ vựng nào được thêm vào Unit này.</p>
                  <button
                    onClick={() => {
                      setEditingUnit({ bookId: currentBook.id, unit: currentUnit });
                      setShowAddUnitModal(true);
                    }}
                    className="mt-3 px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    + Thêm Từ Vựng Cho Unit
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentUnit.vocabularyList.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-paper rounded-xl border-2 border-ink/20 hover:border-ink transition-all flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-base text-amber-900">{item.word}</span>
                        {item.ipa && <span className="text-xs font-mono text-ink/60 bg-amber-100 px-2 py-0.5 rounded">{item.ipa}</span>}
                      </div>

                      <p className="text-xs font-bold text-ink">{item.meaning}</p>

                      {item.example && (
                        <p className="text-[11px] text-ink/70 italic mt-1 bg-white/70 p-1.5 rounded border border-ink/10">
                          "{item.example}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NOTES */}
          {activeUnitTab === "notes" && (
            <div className="bg-white p-4 md:p-6 rounded-2xl border-2 border-ink shadow-[4px_4px_0px_#000] flex flex-col gap-3">
              <h3 className="text-base font-black text-ink uppercase tracking-tight flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-600" />
                Ghi Chú Cá Nhân Cho Unit
              </h3>
              <p className="text-xs text-ink/60">
                Ghi lại các quy tắc ngữ pháp, lưu ý đặc biệt hoặc mẹo làm bài riêng của bạn cho Unit này.
              </p>

              <textarea
                value={currentUnit.notes || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setBooks(prev => prev.map(b => {
                    if (b.id !== currentBook.id) return b;
                    return {
                      ...b,
                      units: b.units.map(u => u.id === currentUnit.id ? { ...u, notes: val, updatedAt: Date.now() } : u)
                    };
                  }));
                }}
                placeholder="Viết ghi chú ôn tập của bạn ở đây..."
                rows={10}
                className="w-full p-4 text-sm font-sans rounded-xl border-2 border-ink/30 focus:border-amber-500 focus:outline-none bg-amber-50/30"
              />
              <p className="text-[10px] text-ink/50 italic text-right">💡 Ghi chú tự động được lưu liên tục.</p>
            </div>
          )}

          {/* TAB 4: FLASHCARDS IN UNIT */}
          {activeUnitTab === "flashcards" && (
            <div className="bg-white p-4 md:p-6 rounded-2xl border-2 border-ink shadow-[4px_4px_0px_#000] flex flex-col items-center gap-4">
              <h3 className="text-base font-black text-ink uppercase tracking-tight flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                Thẻ Ôn Tập Từ Vựng Unit
              </h3>

              {(!currentUnit.vocabularyList || currentUnit.vocabularyList.length === 0) ? (
                <p className="text-sm text-ink/50 py-8">Chưa có từ vựng nào trong Unit này để lật thẻ.</p>
              ) : (
                <div className="w-full max-w-md flex flex-col items-center gap-4">
                  {/* Progress Indicator */}
                  <div className="text-xs font-bold text-ink/60">
                    Thẻ {flashcardIndex + 1} / {currentUnit.vocabularyList.length}
                  </div>

                  {/* Card Flipper */}
                  <div 
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="w-full h-64 cursor-pointer perspective-1000 relative group"
                  >
                    <motion.div
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.4 }}
                      className="w-full h-full relative rounded-2xl border-2 border-ink bg-amber-50 shadow-[4px_4px_0px_#000] flex flex-col items-center justify-center p-6 text-center select-none"
                    >
                      {!isFlipped ? (
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-2xl font-black text-amber-950">
                            {currentUnit.vocabularyList[flashcardIndex]?.word}
                          </span>
                          {currentUnit.vocabularyList[flashcardIndex]?.ipa && (
                            <span className="text-xs font-mono text-amber-800/70 bg-amber-200/50 px-2 py-1 rounded">
                              {currentUnit.vocabularyList[flashcardIndex]?.ipa}
                            </span>
                          )}
                          <p className="text-[10px] font-bold text-ink/40 mt-4 uppercase">Nhấp để xem nghĩa 🔄</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 [transform:rotateY(180deg)]">
                          <span className="text-xl font-black text-emerald-950">
                            {currentUnit.vocabularyList[flashcardIndex]?.meaning}
                          </span>
                          {currentUnit.vocabularyList[flashcardIndex]?.example && (
                            <p className="text-xs text-ink/70 italic mt-2 bg-white/80 p-2 rounded border border-ink/10">
                              "{currentUnit.vocabularyList[flashcardIndex]?.example}"
                            </p>
                          )}
                          <p className="text-[10px] font-bold text-ink/40 mt-4 uppercase">Nhấp để lật lại 🔄</p>
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setFlashcardIndex(p => p > 0 ? p - 1 : currentUnit.vocabularyList!.length - 1);
                      }}
                      className="px-4 py-2 bg-paper border border-ink font-bold text-xs rounded-xl hover:bg-amber-100"
                    >
                      ← Thẻ trước
                    </button>

                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setFlashcardIndex(p => (p + 1) % currentUnit.vocabularyList!.length);
                      }}
                      className="px-4 py-2 bg-amber-500 text-white border-2 border-amber-900 font-bold text-xs rounded-xl shadow-sm hover:bg-amber-600"
                    >
                      Thẻ tiếp theo →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MINDMAP */}
          {activeUnitTab === "mindmap" && (
            <div className="bg-white p-4 md:p-6 rounded-2xl border-2 border-ink shadow-[4px_4px_0px_#000] flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                <h3 className="text-base font-black text-ink uppercase tracking-tight flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-600" />
                  Mindmap Chủ Đề
                </h3>
              </div>
              <p className="text-xs text-ink/60">
                Tạo mindmap để hệ thống hóa kiến thức cho Unit này.
              </p>
              
              <MindmapView
                nodes={(currentUnit as any).mindmapNodes || []}
                edges={(currentUnit as any).mindmapEdges || []}
                onChange={(nodes, edges) => {
                  setBooks(prev => prev.map(b => {
                    if (b.id !== currentBook.id) return b;
                    return {
                      ...b,
                      units: b.units.map(u => u.id === currentUnit.id ? { 
                        ...u, 
                        mindmapNodes: nodes,
                        mindmapEdges: edges,
                        updatedAt: Date.now() 
                      } : u)
                    };
                  }));
                }}
              />
            </div>
          )}
        </div>
      ) : (
        /* LIST OF BOOKS AND UNITS VIEW */
        <div className="flex flex-col gap-6">
          {/* SEARCH & CATEGORY FILTER BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border-2 border-ink shadow-[3px_3px_0px_#000]">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm sách, unit, chủ đề..."
                className="w-full pl-9 pr-3 py-1.5 text-xs font-bold rounded-xl border border-ink/30 focus:border-amber-500 focus:outline-none bg-paper"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                    selectedCategory === cat 
                      ? "bg-amber-500 text-white border-2 border-amber-900 shadow-sm"
                      : "bg-paper text-ink/70 hover:text-ink hover:bg-amber-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* BOOKS GRID */}
          {filteredBooks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-ink/30 p-6">
              <BookOpen className="w-12 h-12 text-amber-500/50 mx-auto mb-3" />
              <h3 className="text-base font-black text-ink">Chưa tìm thấy sách học nào</h3>
              <p className="text-xs text-ink/60 mt-1">Thử đổi từ khóa tìm kiếm hoặc tạo thêm cuốn sách mới.</p>
              <button
                onClick={() => {
                  setEditingBook(null);
                  setShowAddBookModal(true);
                }}
                className="mt-4 px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                + Tạo Sách Học Mới
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map(book => {
                const completedCount = book.units.filter(u => u.status === "Completed").length;
                const bookProgress = book.units.length > 0 ? Math.round((completedCount / book.units.length) * 100) : 0;
                const isSelected = selectedBookId === book.id;

                return (
                  <div
                    key={book.id}
                    className={`relative w-full transition-all hover:-translate-y-1 flex flex-col h-[320px] ${
                      isSelected ? "ring-2 ring-black rounded-2xl" : ""
                    }`}
                  >
                    {/* Folder Tab */}
                    <div className="flex">
                      <div className="bg-white border-t-[2px] border-l-[2px] border-r-[2px] border-[#141414] rounded-t-xl px-4 py-1.5 relative z-20 translate-y-[2px] flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#141414] flex items-center gap-1">
                          📁 SÁCH TÀI LIỆU
                        </span>
                        {book.units.some(u => u.isNew && !u.isEdited) && (
                          <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter animate-pulse">
                            (new)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Folder Body */}
                    <div className="bg-[#FFFDF5] rounded-2xl rounded-tl-none border-[2px] border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col flex-1 overflow-hidden relative z-10">
                      <div className="p-4 flex flex-col gap-2 border-b-2 border-[#141414]/10 bg-white">
                        <div className="flex items-center justify-between">
                          <h3 className="font-extrabold text-lg text-[#141414] line-clamp-1 uppercase tracking-tight">
                            {book.title}
                          </h3>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditingBook(book);
                                setShowAddBookModal(true);
                              }}
                              title="Sửa thông tin sách"
                              className="p-1.5 hover:bg-[#F5F5F5] rounded-md text-[#666] hover:text-[#141414] transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteBook(book.id, book.title)}
                              title="Xóa cuốn sách này"
                              className="p-1.5 hover:bg-rose-50 rounded-md text-rose-500 hover:text-rose-700 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {book.author && (
                          <p className="text-xs font-semibold text-[#666]">
                            {book.author}
                          </p>
                        )}
                      </div>

                      {/* UNITS LIST IN BOOK */}
                      <div className="p-4 flex-1 flex flex-col justify-between gap-3 bg-[#FFFDF5] overflow-hidden">
                        <div className="flex-1 overflow-hidden flex flex-col">
                          {/* Units list previews */}
                          {book.units.length === 0 ? (
                            <p className="text-xs text-[#999] font-medium py-2">Trống.</p>
                          ) : (
                            <div className="space-y-1.5 overflow-y-auto pr-1 flex-1">
                              {book.units.map(unit => (
                                <div
                                  key={unit.id}
                                  onClick={() => {
                                    setSelectedBookId(book.id);
                                    setSelectedUnitId(unit.id);
                                  }}
                                  className="group cursor-pointer flex items-center justify-between text-[11px] hover:bg-white border border-transparent hover:border-[#E5E5E5] rounded-md px-1.5 py-1 -mx-1.5 transition-colors"
                                >
                                  <div className="flex items-center gap-2 overflow-hidden w-full">
                                    <FileText className="w-3.5 h-3.5 text-[#999] group-hover:text-[#141414] shrink-0" />
                                    <span className="font-semibold text-[#555] group-hover:text-[#141414] line-clamp-1 flex items-center gap-1.5">
                                      <span>{unit.unitNumber}: {unit.title}</span>
                                      {(unit.isNew && !unit.isEdited) && (
                                        <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter shrink-0 animate-pulse">
                                          (new)
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  {unit.status === "Completed" && (
                                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="flex gap-2 pt-3 mt-1 border-t border-[#141414]/10 shrink-0">
                          <button
                            onClick={() => {
                              setTargetBookIdForUnit(book.id);
                              setEditingUnit(null);
                              setShowAddUnitModal(true);
                            }}
                            className="flex items-center gap-1.5 text-xs font-bold text-[#666] hover:text-[#141414] transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Thêm Unit
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD / EDIT BOOK */}
      {showAddBookModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border-2 border-ink shadow-[6px_6px_0px_#000] w-full max-w-md p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <h3 className="font-black text-base uppercase text-ink flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                {editingBook ? "Chỉnh Sửa Sách Học" : "Thêm Sách Học Mới"}
              </h3>
              <button onClick={() => setShowAddBookModal(false)} className="p-1 text-ink/40 hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const title = (form.elements.namedItem("title") as HTMLInputElement).value.trim();
                const author = (form.elements.namedItem("author") as HTMLInputElement).value.trim();
                const category = (form.elements.namedItem("category") as HTMLInputElement).value.trim();
                const description = (form.elements.namedItem("description") as HTMLTextAreaElement).value.trim();
                const coverColor = (form.elements.namedItem("coverColor") as HTMLSelectElement).value;

                if (!title) {
                  alert("Vui lòng nhập tên sách!");
                  return;
                }

                if (editingBook) {
                  setBooks(prev => prev.map(b => b.id === editingBook.id ? {
                    ...b,
                    title,
                    author,
                    category: category || "Khác",
                    description,
                    coverColor,
                    updatedAt: Date.now()
                  } : b));
                  showToast("Đã cập nhật sách thành công!");
                } else {
                  const newBook: EnglishBook = {
                    id: `book-${Date.now()}`,
                    title,
                    author,
                    category: category || "Tự chọn",
                    coverColor: coverColor || "amber",
                    description,
                    units: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                  };
                  setBooks(prev => [newBook, ...prev]);
                  showToast("Đã tạo cuốn sách mới!");
                }

                setShowAddBookModal(false);
              }}
              className="flex flex-col gap-3"
            >
              <div>
                <label className="text-xs font-bold text-ink">Tên Sách / Tài Liệu (*)</label>
                <input
                  name="title"
                  defaultValue={editingBook?.title || ""}
                  placeholder="Ví dụ: English Grammar in Use, IELTS Cambridge 18..."
                  required
                  className="w-full mt-1 p-2.5 text-xs font-bold rounded-xl border-2 border-ink/30 focus:border-amber-500 focus:outline-none bg-paper"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-ink">Tác giả / Nguồn</label>
                  <input
                    name="author"
                    defaultValue={editingBook?.author || ""}
                    placeholder="Raymond Murphy, Oxford..."
                    className="w-full mt-1 p-2.5 text-xs font-bold rounded-xl border-2 border-ink/30 focus:border-amber-500 focus:outline-none bg-paper"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink">Thể loại / Phân loại</label>
                  <input
                    name="category"
                    defaultValue={editingBook?.category || "Ngữ pháp"}
                    placeholder="Ngữ pháp, Từ vựng, IELTS..."
                    className="w-full mt-1 p-2.5 text-xs font-bold rounded-xl border-2 border-ink/30 focus:border-amber-500 focus:outline-none bg-paper"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-ink">Màu Bìa Sách</label>
                <select
                  name="coverColor"
                  defaultValue={editingBook?.coverColor || "amber"}
                  className="w-full mt-1 p-2.5 text-xs font-bold rounded-xl border-2 border-ink/30 focus:border-amber-500 focus:outline-none bg-paper"
                >
                  <option value="amber">Vàng Hổ Phách (Amber)</option>
                  <option value="emerald">Xanh Ngọc (Emerald)</option>
                  <option value="indigo">Xanh Chàm (Indigo)</option>
                  <option value="rose">Hồng Đỏ (Rose)</option>
                  <option value="sky">Xanh Da Trời (Sky)</option>
                  <option value="purple">Tím (Purple)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-ink">Mô Tả / Ghi Chú Ngắn</label>
                <textarea
                  name="description"
                  defaultValue={editingBook?.description || ""}
                  rows={3}
                  placeholder="Giới thiệu mục tiêu cuốn sách này..."
                  className="w-full mt-1 p-2.5 text-xs font-medium rounded-xl border-2 border-ink/30 focus:border-amber-500 focus:outline-none bg-paper"
                />
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBookModal(false)}
                  className="px-4 py-2 bg-paper border border-ink text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-xl border-2 border-amber-900 shadow-sm"
                >
                  Lưu Cuốn Sách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD / ADD UNIT */}
      {showAddUnitModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border-2 border-ink shadow-[6px_6px_0px_#000] w-full max-w-lg p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <h3 className="font-black text-base uppercase text-ink flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                {editingUnit ? "Chỉnh Sửa Unit" : "Upload Tài Liệu / Thêm Unit Mới (Thủ Công)"}
              </h3>
              <button onClick={() => setShowAddUnitModal(false)} className="p-1 text-ink/40 hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                
                let targetBookTitle = "";
                let targetBookId = "";

                if (editingUnit) {
                  const bObj = books.find(b => b.id === editingUnit.bookId);
                  targetBookTitle = bObj ? bObj.title : "";
                  targetBookId = editingUnit.bookId;
                } else {
                  const bookSelectVal = (form.elements.namedItem("bookSelect") as HTMLSelectElement)?.value || selectedBookOption || (books[0]?.id || "__NEW_BOOK__");
                  if (bookSelectVal === "__NEW_BOOK__" || books.length === 0) {
                    const customTitle = (form.elements.namedItem("customBookTitle") as HTMLInputElement)?.value.trim();
                    targetBookTitle = customTitle || "";
                  } else {
                    const foundBook = books.find(b => b.id === bookSelectVal);
                    if (foundBook) {
                      targetBookTitle = foundBook.title;
                      targetBookId = foundBook.id;
                    }
                  }
                }

                const unitNumberRaw = (form.elements.namedItem("unitNumber") as HTMLInputElement).value.trim();
                const unitTitleRaw = (form.elements.namedItem("title") as HTMLInputElement).value.trim();
                const description = (form.elements.namedItem("description") as HTMLInputElement).value.trim();
                const contentInput = document.getElementById("unit-content-input") as HTMLInputElement;
                const content = contentInput ? contentInput.value.trim() : (form.elements.namedItem("content") as HTMLInputElement)?.value.trim() || "";
                const fileUrl = (form.elements.namedItem("fileUrl") as HTMLInputElement).value;
                const fileName = (form.elements.namedItem("fileName") as HTMLInputElement).value;
                const fileType = (form.elements.namedItem("fileType") as HTMLInputElement).value as any;

                // MANDATORY FIELDS VALIDATION: Book Title, Unit Number, Unit Title are ALL required!
                if (!targetBookTitle || !unitNumberRaw || !unitTitleRaw) {
                  alert("⚠️ THÔNG TIN BẮT BUỘC CHƯA ĐẦY ĐỦ!\n\nVui lòng nhập đầy đủ:\n1. Tên Sách (*)\n2. Unit / Số Bài (*)\n3. Tiêu Đề Unit (*)");
                  return;
                }

                const unitNumberFormatted = unitNumberRaw.toLowerCase().startsWith("unit") ? unitNumberRaw : `Unit ${unitNumberRaw}`;

                if (editingUnit) {
                  // User explicitly edits existing unit -> mark as edited, remove (new) badge
                  setBooks(prev => prev.map(b => {
                    if (b.id !== editingUnit.bookId) return b;
                    return {
                      ...b,
                      updatedAt: Date.now(),
                      units: b.units.map(u => u.id === editingUnit.unit.id ? {
                        ...u,
                        unitNumber: unitNumberFormatted,
                        title: unitTitleRaw,
                        description,
                        content,
                        fileUrl: fileUrl || u.fileUrl,
                        fileName: fileName || u.fileName,
                        fileType: fileType || u.fileType,
                        isNew: false,
                        isEdited: true,
                        updatedAt: Date.now()
                      } : u)
                    };
                  }));
                  showToast("Đã lưu các thay đổi của Unit!");
                } else {
                  // Creating/Inputting manually -> Merge with existing Book & Unit if matching Title, Unit Number, Title!
                  setBooks(prev => {
                    const normBookTitle = targetBookTitle.trim().toLowerCase();
                    let bookIndex = prev.findIndex(b => b.title.trim().toLowerCase() === normBookTitle);

                    let updatedBooks = [...prev];
                    let bookToModify: EnglishBook;

                    if (bookIndex >= 0) {
                      bookToModify = { ...updatedBooks[bookIndex] };
                    } else {
                      // Create new book
                      bookToModify = {
                        id: `book-${Date.now()}`,
                        title: targetBookTitle.trim(),
                        category: "Tự chọn",
                        coverColor: "amber",
                        units: [],
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        isNew: true
                      };
                      updatedBooks = [bookToModify, ...updatedBooks];
                      bookIndex = 0;
                    }

                    // Check if unit with same unit number & title exists in this book
                    const normUnitNum = unitNumberFormatted.trim().toLowerCase();
                    const normUnitTitle = unitTitleRaw.trim().toLowerCase();

                    const existingUnitIndex = bookToModify.units.findIndex(u =>
                      u.unitNumber.trim().toLowerCase() === normUnitNum &&
                      u.title.trim().toLowerCase() === normUnitTitle
                    );

                    if (existingUnitIndex >= 0) {
                      // MERGE CONTENTS TOGETHER!
                      const existingUnit = bookToModify.units[existingUnitIndex];
                      let mergedContent = existingUnit.content || "";
                      if (content) {
                        if (mergedContent) {
                          mergedContent += `<div class="my-4 pt-3 border-t-2 border-emerald-500/30 font-bold text-xs text-emerald-800">📌 Nội dung bổ sung vừa gộp (${new Date().toLocaleDateString("vi-VN")}):</div>` + content;
                        } else {
                          mergedContent = content;
                        }
                      }

                      const mergedUnit: EnglishMaterialUnit = {
                        ...existingUnit,
                        description: description ? (existingUnit.description ? `${existingUnit.description} | ${description}` : description) : existingUnit.description,
                        content: mergedContent,
                        fileUrl: fileUrl || existingUnit.fileUrl,
                        fileName: fileName || existingUnit.fileName,
                        fileType: fileType || existingUnit.fileType,
                        isNew: true, // Marked as new so (new) tag is shown until edited
                        isEdited: false,
                        updatedAt: Date.now()
                      };

                      const updatedUnits = [...bookToModify.units];
                      updatedUnits[existingUnitIndex] = mergedUnit;
                      bookToModify.units = updatedUnits;
                      bookToModify.updatedAt = Date.now();

                      showToast(`Đã gộp thành công nội dung trùng Sách, Unit & Tiêu đề! (Hiện nhãn (new))`);
                    } else {
                      // Create new Unit
                      const newUnit: EnglishMaterialUnit = {
                        id: `unit-${Date.now()}`,
                        unitNumber: unitNumberFormatted,
                        title: unitTitleRaw,
                        description,
                        content,
                        fileUrl: fileUrl || undefined,
                        fileName: fileName || undefined,
                        fileType: fileType || "text",
                        status: "Not Started",
                        updatedAt: Date.now(),
                        isNew: true,
                        isEdited: false
                      };

                      bookToModify.units = [...bookToModify.units, newUnit];
                      bookToModify.updatedAt = Date.now();
                      showToast(`Đã thêm Unit mới thành công (hiện (new))!`);
                    }

                    updatedBooks[bookIndex] = bookToModify;
                    return updatedBooks;
                  });
                }

                setShowAddUnitModal(false);
              }}
              className="flex flex-col gap-3"
            >
              {/* Target Book Selector */}
              <div>
                <label className="text-xs font-bold text-ink">Tên Sách Học (* bắt buộc)</label>
                {editingUnit ? (
                  <input
                    disabled
                    value={books.find(b => b.id === editingUnit.bookId)?.title || ""}
                    className="w-full mt-1 p-2.5 text-xs font-bold rounded-xl border-2 border-ink/30 bg-gray-100"
                  />
                ) : (
                  <div className="flex flex-col gap-2 mt-1">
                    <select
                      name="bookSelect"
                      value={selectedBookOption || targetBookIdForUnit || (books[0]?.id || "__NEW_BOOK__")}
                      onChange={(e) => setSelectedBookOption(e.target.value)}
                      required
                      className="w-full p-2.5 text-xs font-bold rounded-xl border-2 border-ink/30 focus:border-emerald-500 focus:outline-none bg-paper"
                    >
                      {books.map(b => (
                        <option key={b.id} value={b.id}>📚 {b.title} ({b.units.length} Units)</option>
                      ))}
                      <option value="__NEW_BOOK__">➕ Nhập Tên Sách Mới Thủ Công...</option>
                    </select>

                    {(selectedBookOption === "__NEW_BOOK__" || (books.length === 0 && !selectedBookOption)) && (
                      <input
                        name="customBookTitle"
                        placeholder="Nhập tên sách mới thủ công (BẮT BUỘC)..."
                        required
                        className="w-full p-2.5 text-xs font-bold rounded-xl border-2 border-emerald-600 focus:outline-none bg-emerald-50 text-emerald-950 placeholder-emerald-700/60"
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-ink">Số Bài / Unit (* bắt buộc)</label>
                  <input
                    name="unitNumber"
                    defaultValue={editingUnit?.unit.unitNumber || "Unit 1"}
                    placeholder="Unit 1, Bài 2..."
                    required
                    className="w-full mt-1 p-2.5 text-xs font-bold rounded-xl border-2 border-ink/30 focus:border-emerald-500 focus:outline-none bg-paper"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-ink">Tiêu Đề Unit / Chủ đề (* bắt buộc)</label>
                  <input
                    name="title"
                    defaultValue={editingUnit?.unit.title || ""}
                    placeholder="Tên bài học (VD: Present Continuous)..."
                    required
                    className="w-full mt-1 p-2.5 text-xs font-bold rounded-xl border-2 border-ink/30 focus:border-emerald-500 focus:outline-none bg-paper"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-ink">Tóm Tắt Ngắn Dấu Hiệu / Chủ Đề</label>
                <input
                  name="description"
                  defaultValue={editingUnit?.unit.description || ""}
                  placeholder="Ghi chú khái quát chủ đề..."
                  className="w-full mt-1 p-2.5 text-xs font-medium rounded-xl border-2 border-ink/30 focus:border-emerald-500 focus:outline-none bg-paper"
                />
              </div>

              {/* FILE UPLOAD DROPZONE */}
              <div>
                <label className="text-xs font-bold text-ink">Tải Tệp / File Đính Kèm (Text, Audio, Ảnh, PDF...)</label>
                <div className="mt-1 p-3 border-2 border-dashed border-ink/30 rounded-xl bg-paper flex flex-col items-center justify-center text-center">
                  <Upload className="w-6 h-6 text-emerald-600 mb-1" />
                  <p className="text-xs font-bold text-ink">Kéo thả file tài liệu vào đây hoặc chọn tệp</p>
                  <p className="text-[10px] text-ink/50 mt-0.5">Hỗ trợ .txt, .pdf, .mp3, .png, .jpg (Tự đọc văn bản nếu là tệp .txt)</p>

                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const reader = new FileReader();
                      const fileExt = file.name.split('.').pop()?.toLowerCase();

                      // Set hidden inputs
                      const nameInput = (e.target.form?.elements.namedItem("fileName") as HTMLInputElement);
                      const urlInput = (e.target.form?.elements.namedItem("fileUrl") as HTMLInputElement);
                      const typeInput = (e.target.form?.elements.namedItem("fileType") as HTMLInputElement);
                      const contentArea = (e.target.form?.elements.namedItem("content") as HTMLTextAreaElement);

                      if (nameInput) nameInput.value = file.name;

                      if (fileExt === "txt" || fileExt === "md") {
                        if (typeInput) typeInput.value = "text";
                        reader.onload = (event) => {
                          const text = event.target?.result as string;
                          if (contentArea) contentArea.value = text;
                        };
                        reader.readAsText(file);
                      } else {
                        if (["mp3", "m4a", "wav", "ogg"].includes(fileExt || "")) {
                          if (typeInput) typeInput.value = "audio";
                        } else if (["png", "jpg", "jpeg", "webp"].includes(fileExt || "")) {
                          if (typeInput) typeInput.value = "image";
                        } else {
                          if (typeInput) typeInput.value = "other";
                        }

                        reader.onload = (event) => {
                          const dataUrl = event.target?.result as string;
                          if (urlInput) urlInput.value = dataUrl;
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="mt-2 text-xs text-ink/70 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                  />
                </div>

                {/* Hidden state inputs for upload details */}
                <input type="hidden" name="fileUrl" defaultValue={editingUnit?.unit.fileUrl || ""} />
                <input type="hidden" name="fileName" defaultValue={editingUnit?.unit.fileName || ""} />
                <input type="hidden" name="fileType" defaultValue={editingUnit?.unit.fileType || "text"} />
              </div>

              {/* MANUAL CONTENT PASTE */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-ink">Nội Dung Văn Bản / Bài Học</label>
                <input type="hidden" name="content" id="unit-content-input" defaultValue={editingUnit?.unit.content || ""} />
                <RichTextEditor 
                  content={editingUnit?.unit.content || ""} 
                  onChange={(html) => {
                    const input = document.getElementById('unit-content-input') as HTMLInputElement;
                    if (input) input.value = html;
                  }}
                  placeholder="Soạn thảo văn bản bài học, ngữ pháp..."
                />
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUnitModal(false)}
                  className="px-4 py-2 bg-paper border border-ink text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl border-2 border-emerald-950 shadow-sm"
                >
                  Lưu Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
