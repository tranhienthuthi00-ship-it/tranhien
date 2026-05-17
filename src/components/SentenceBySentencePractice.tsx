import { useState, useMemo } from "react";
import { Loader2, Send, Sparkles, CheckCircle2, ChevronRight, X, Play, RotateCcw, ListChecks, FileText, Save, Library, Trash2, Edit2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useFirebaseSync } from "../lib/useFirebaseSync";
import type { PracticeParagraph } from "../types";

interface Sentence {
  vi: string;
  en?: string;
  userTranslation?: string;
  status: 'pending' | 'correct' | 'thinking';
  grammar?: string[];
  explanation?: string;
}

export function SentenceBySentencePractice() {
  const { practiceParagraphs, setPracticeParagraphs } = useFirebaseSync();
  const [inputText, setInputText] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [title, setTitle] = useState("");
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isPracticing, setIsPracticing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [evaluation, setEvaluation] = useState<{ explanation?: string; isCorrect?: boolean } | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Character masking logic
  const maskedInput = useMemo(() => {
    const reference = sentences[currentIndex]?.en || "";
    if (!userInput) return "";
    
    return userInput.split('').map((char, i) => {
      if (i >= reference.length) return "*";
      // Case insensitive match but preserve reference case
      const targetChar = reference[i];
      if (char.toLowerCase() === targetChar.toLowerCase()) return targetChar;
      return "*";
    }).join('');
  }, [userInput, sentences, currentIndex]);

  const handleStart = async (p?: PracticeParagraph) => {
    const vi = p ? p.vietnamese : inputText;
    const en = p ? p.english : referenceText;
    
    if (!vi.trim()) return;
    setIsProcessing(true);
    
    // Simple split by punctuation
    const rawSentences = vi.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    const rawRefs = en ? en.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0) : [];

    const newSentences: Sentence[] = rawSentences.map((s, i) => ({
      vi: s.trim(),
      en: rawRefs[i]?.trim(),
      status: 'pending'
    }));

    setSentences(newSentences);
    setCurrentIndex(0);
    setIsPracticing(true);
    setIsProcessing(false);
    setUserInput("");
    setEvaluation(null);
    setShowLibrary(false);
  };

  const handleSave = async () => {
    if (!inputText.trim() || !referenceText.trim() || !title.trim()) return;
    
    const newParagraph: PracticeParagraph = {
      id: editingId || crypto.randomUUID(),
      title: title.trim(),
      vietnamese: inputText.trim(),
      english: referenceText.trim(),
      createdAt: Date.now(),
    };

    if (editingId) {
      await setPracticeParagraphs(practiceParagraphs.map(p => p.id === editingId ? newParagraph : p));
      setEditingId(null);
    } else {
      await setPracticeParagraphs([newParagraph, ...practiceParagraphs]);
    }
    
    setTitle("");
    setInputText("");
    setReferenceText("");
    setShowLibrary(true);
  };

  const handleEdit = (p: PracticeParagraph) => {
    setTitle(p.title);
    setInputText(p.vietnamese);
    setReferenceText(p.english);
    setEditingId(p.id);
    setShowLibrary(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xoá đoạn văn này?")) {
      await setPracticeParagraphs(practiceParagraphs.filter(p => p.id !== id));
    }
  };

  const handleVerify = () => {
    if (!userInput.trim()) return;
    setIsVerifying(true);
    
    const currentSentence = sentences[currentIndex];
    const reference = currentSentence.en;

    if (!reference) {
      setEvaluation({
        isCorrect: true,
        explanation: "No reference provided. Moving on."
      });
      setIsVerifying(false);
      return;
    }

    const normalize = (str: string) => str.toLowerCase().replace(/[.,!?;:()]/g, "").replace(/\s+/g, " ").trim();
    const isCorrect = normalize(userInput) === normalize(reference);

    if (isCorrect) {
      setEvaluation({
        isCorrect: true,
        explanation: "Chúc mừng! Bạn đã dịch chính xác."
      });
    } else {
      setEvaluation({
        isCorrect: false,
        explanation: "Bản dịch chưa trùng khớp với mẫu. Kiểm tra lại các từ bị đánh dấu *!"
      });
    }
    
    setIsVerifying(false);
  };

  const nextSentence = () => {
    const updated = [...sentences];
    updated[currentIndex].status = 'correct';
    setSentences(updated);
    
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput("");
      setEvaluation(null);
      setShowHint(false);
    }
  };

  const reset = () => {
    setIsPracticing(false);
    setInputText("");
    setReferenceText("");
    setSentences([]);
    setCurrentIndex(0);
    setUserInput("");
    setEvaluation(null);
  };

  if (!isPracticing) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="sketch-border bg-white/60 p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <FileText size={120} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <ListChecks className="w-8 h-8 text-crimson" />
                {editingId ? "Edit Paragraph" : "Reference-Based Practice"}
              </h2>
              <p className="text-xs font-bold text-ink/40 uppercase tracking-widest">
                {editingId ? "Cập nhật nội dung của bạn" : "Luyện dịch đối chiếu - Phải dịch đúng mẫu mới được qua câu tiếp theo"}
              </p>
            </div>
            
            <button 
              onClick={() => setShowLibrary(!showLibrary)}
              className="sketch-button bg-paper p-3 text-ink/60 hover:text-ink transition-colors flex items-center gap-2"
              title="Library"
            >
              <Library className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Thư viện</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {showLibrary ? (
              <motion.div 
                key="library"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b-2 border-ink/5 pb-2">
                  <h3 className="text-xs font-black uppercase text-ink/40 tracking-widest">Danh sách đã lưu ({practiceParagraphs.length})</h3>
                  <button onClick={() => setShowLibrary(false)} className="text-ink/40 hover:text-crimson"><X size={16} /></button>
                </div>
                
                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-none">
                  {practiceParagraphs.length === 0 ? (
                    <div className="text-center py-12 text-ink/20 italic text-sm">Chưa có đoạn văn nào được lưu.</div>
                  ) : (
                    practiceParagraphs.map(p => (
                      <div key={p.id} className="group relative sketch-border bg-white p-4 hover:bg-paper transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 cursor-pointer" onClick={() => handleStart(p)}>
                            <h4 className="font-bold text-ink leading-tight mb-1">{p.title}</h4>
                            <p className="text-[10px] text-ink/40 line-clamp-2 italic">{p.vietnamese}</p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                              className="p-2 text-ink/40 hover:text-ink hover:bg-ink/5 rounded-lg"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                              className="p-2 text-ink/40 hover:text-crimson hover:bg-crimson/5 rounded-lg"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-ink/60 tracking-widest ml-1">Tiêu đề đoạn văn</label>
                  <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Daily routine, Business email..."
                    className="w-full bg-paper/30 sketch-border px-4 py-3 font-sans text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ink/10"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-ink/60 tracking-widest ml-1">Đoạn văn Tiếng Việt (Gốc)</label>
                    <textarea 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Nhập đoạn văn tiếng Việt..."
                      className="w-full h-64 bg-paper/30 sketch-border p-4 font-sans text-lg focus:outline-none focus:ring-2 focus:ring-ink/10 resize-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-ink/60 tracking-widest ml-1">Bản dịch Tiếng Anh (Mẫu - Bắt buộc)</label>
                    <textarea 
                      value={referenceText}
                      onChange={(e) => setReferenceText(e.target.value)}
                      placeholder="Nhập bản dịch tiếng Anh tương ứng để đối chiếu..."
                      className="w-full h-64 bg-paper/10 sketch-border p-4 font-sans text-base italic focus:outline-none focus:ring-2 focus:ring-ink/10 resize-none transition-all placeholder:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={handleSave}
                    disabled={!inputText.trim() || !referenceText.trim() || !title.trim()}
                    className="flex-1 sketch-button bg-paper py-4 text-sm font-black uppercase tracking-widest hover:bg-ink/5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {editingId ? "Cập nhật" : "Lưu vào thư viện"}
                  </button>
                  <button 
                    onClick={() => handleStart()}
                    disabled={!inputText.trim() || !referenceText.trim() || isProcessing}
                    className="flex-2 sketch-button bg-ink text-white py-4 text-sm font-black uppercase tracking-widest hover:bg-ink/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <Play className="w-5 h-5" />}
                    Bắt đầu luyện tập
                  </button>
                  {editingId && (
                    <button 
                      onClick={() => { setEditingId(null); setTitle(""); setInputText(""); setReferenceText(""); }}
                      className="sketch-button bg-crimson/10 text-crimson p-4"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  const currentSentence = sentences[currentIndex];
  const progress = ((currentIndex) / sentences.length) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto p-2 md:p-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
        <button 
          onClick={reset}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-ink/40 hover:text-crimson transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Thoát
        </button>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-48 bg-ink/5 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-crimson"
            />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-ink/40">
            {currentIndex + 1} / {sentences.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Progress sidebar */}
        <div className="lg:col-span-3 space-y-2 hidden lg:block">
           <div className="grid grid-cols-1 gap-1.5 max-h-[500px] overflow-y-auto scrollbar-none">
            {sentences.map((s, i) => (
              <div 
                key={i} 
                className={`p-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 ${i === currentIndex ? "bg-white sketch-border-sm ring-1 ring-ink/10" : i < currentIndex ? "text-emerald-500/60 bg-emerald-50/20" : "text-ink/10"}`}
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[8px] ${i === currentIndex ? "bg-ink text-white" : i < currentIndex ? "bg-emerald-500 text-white" : "bg-ink/5"}`}>
                  {i + 1}
                </div>
                <p className="truncate">{s.vi}</p>
                {i < currentIndex && <CheckCircle2 className="w-3 h-3 ml-auto text-emerald-500" />}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-9 space-y-4">
          <div className="sketch-border bg-white p-4 md:p-6 space-y-6 shadow-xl relative overflow-hidden">
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <span className="text-[9px] font-black uppercase text-crimson tracking-widest">Đang dịch câu:</span>
                 {sentences[currentIndex]?.en && (
                   <button 
                    onClick={() => setShowHint(!showHint)}
                    className="text-[9px] font-black uppercase text-ink/40 hover:text-ink tracking-widest flex items-center gap-1.5 transition-colors"
                   >
                     <Sparkles className="w-3 h-3" />
                     {showHint ? "Ẩn gợi ý" : "Xem gợi ý"}
                   </button>
                 )}
               </div>
               
               <p className="text-lg md:text-xl font-sans font-bold leading-relaxed text-ink">
                 "{currentSentence.vi}"
               </p>

               {showHint && sentences[currentIndex]?.en && (
                 <motion.div 
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-paper/50 p-3 rounded-lg border border-dashed border-ink/10"
                 >
                   <p className="text-[11px] font-mono text-ink/60 leading-relaxed italic">
                     Gợi ý: {sentences[currentIndex].en.split(' ').map(word => {
                       if (word.length <= 1) return word;
                       const clean = word.replace(/[.,!?;:()]/g, "");
                       const punc = word.slice(clean.length);
                       return clean[0] + '*'.repeat(clean.length - 1) + punc;
                     }).join(' ')}
                   </p>
                 </motion.div>
               )}
             </div>

             <div className="space-y-2 pt-4 border-t border-ink/5">
                <label className="text-[9px] font-black uppercase text-ink/40 tracking-widest block">Bản dịch (nhập đúng hiện chữ):</label>
                
                <div className="relative group min-h-[100px] flex items-center bg-paper/20 rounded-xl overflow-hidden">
                  <div className="w-full min-h-[100px] p-4 font-sans text-xl md:text-2xl font-bold leading-relaxed whitespace-pre-wrap pointer-events-none break-words">
                    {maskedInput}
                    {!userInput && <span className="text-ink/10 italic text-sm font-medium">Bắt đầu nhập tại đây...</span>}
                    <motion.span 
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="inline-block w-0.5 h-6 bg-crimson ml-1 align-middle" 
                    />
                  </div>

                  <textarea
                    autoFocus
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-text resize-none"
                    disabled={isVerifying || evaluation?.isCorrect}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !evaluation?.isCorrect) {
                        e.preventDefault();
                        handleVerify();
                      }
                    }}
                  />
                  
                  {!evaluation?.isCorrect && (
                    <button
                      onClick={handleVerify}
                      disabled={isVerifying || !userInput.trim()}
                      className="absolute right-2 bottom-2 md:right-4 md:bottom-4 bg-ink text-white p-2.5 rounded-full shadow-lg hover:scale-110 disabled:opacity-0 transition-all z-10"
                    >
                      {isVerifying ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
                    </button>
                  )}
                </div>
             </div>

             <AnimatePresence mode="wait">
               {evaluation && (
                 <motion.div
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: "auto" }}
                   exit={{ opacity: 0, height: 0 }}
                   className="pt-2"
                 >
                   <div className={`p-4 rounded-xl flex items-center justify-between gap-4 ${evaluation.isCorrect ? "bg-emerald-50 border border-emerald-500/20" : "bg-crimson/5 border border-crimson/20"}`}>
                      <div className="flex items-center gap-3">
                        {evaluation.isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <X className="w-5 h-5 text-crimson" />}
                        <p className={`text-[11px] font-bold ${evaluation.isCorrect ? "text-emerald-900" : "text-crimson"}`}>
                           {evaluation.explanation}
                        </p>
                      </div>

                      {evaluation.isCorrect ? (
                        <button 
                          onClick={nextSentence}
                          className="sketch-button bg-ink text-white py-2 px-6 text-[10px] font-black uppercase tracking-widest hover:bg-ink/90 flex items-center gap-2"
                        >
                          Kế tiếp <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => setEvaluation(null)}
                          className="text-[9px] font-black uppercase text-crimson underline tracking-widest"
                        >
                          Thử lại
                        </button>
                      )}
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
