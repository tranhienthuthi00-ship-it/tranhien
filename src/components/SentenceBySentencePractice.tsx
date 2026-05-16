import { useState, useMemo } from "react";
import { Loader2, Send, Sparkles, CheckCircle2, ChevronRight, X, Play, RotateCcw, ListChecks, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Sentence {
  vi: string;
  en?: string;
  userTranslation?: string;
  status: 'pending' | 'correct' | 'thinking';
  grammar?: string[];
  explanation?: string;
}

export function SentenceBySentencePractice() {
  const [inputText, setInputText] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isPracticing, setIsPracticing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [evaluation, setEvaluation] = useState<{ grammar?: string[]; explanation?: string; corrected?: string } | null>(null);

  const handleStart = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    
    // Simple split by punctuation
    const rawSentences = inputText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    const rawRefs = referenceText ? referenceText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0) : [];

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
  };

  const handleVerify = () => {
    if (!userInput.trim()) return;
    setIsVerifying(true);
    
    const currentSentence = sentences[currentIndex];
    const reference = currentSentence.en;

    if (!reference) {
      // If no reference was provided, we just show what they typed and allow moving forward
      setEvaluation({
        corrected: "No reference provided for this sentence.",
        explanation: "Bạn chưa cung cấp bản dịch mẫu cho câu này."
      });
      setIsVerifying(false);
      return;
    }

    // Local comparison: Normalize strings (lowercase, remove common punctuation, trim)
    const normalize = (str: string) => str.toLowerCase().replace(/[.,!?;:()]/g, "").replace(/\s+/g, " ").trim();
    
    const isCorrect = normalize(userInput) === normalize(reference);

    if (isCorrect) {
      setEvaluation({
        corrected: reference,
        explanation: "Chúc mừng! Bản dịch của bạn hoàn toàn chính xác so với bản mẫu."
      });
    } else {
      setEvaluation({
        corrected: reference,
        explanation: "Bản dịch chưa trùng khớp với bản mẫu. Hãy kiểm tra lại từng từ và cấu trúc!"
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
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              <ListChecks className="w-8 h-8 text-crimson" />
              Reference-Based Practice
            </h2>
            <p className="text-xs font-bold text-ink/40 uppercase tracking-widest">Luyện dịch đối chiếu - Phải dịch đúng mẫu mới được qua câu tiếp theo</p>
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

          <button 
            onClick={handleStart}
            disabled={!inputText.trim() || !referenceText.trim() || isProcessing}
            className="w-full sketch-button bg-ink text-white py-4 text-sm font-black uppercase tracking-widest hover:bg-ink/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <Play className="w-5 h-5" />}
            Bắt đầu luyện tập
          </button>
        </div>
      </div>
    );
  }

  const currentSentence = sentences[currentIndex];
  const progress = ((currentIndex) / sentences.length) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <button 
          onClick={reset}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-ink/40 hover:text-crimson transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Thoát & Làm đoạn khác
        </button>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-64 bg-ink/5 h-2 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-crimson"
            />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-ink/40 min-w-max">
            Câu {currentIndex + 1} / {sentences.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Progress List */}
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-none opacity-50 hover:opacity-100 transition-opacity">
            {sentences.map((s, i) => (
              <div 
                key={i} 
                className={`flex items-center gap-3 p-2 rounded-lg text-xs font-medium transition-all ${i === currentIndex ? "bg-white sketch-border-sm ring-1 ring-ink/10" : i < currentIndex ? "text-emerald-600 bg-emerald-50/50" : "text-ink/20"}`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${i === currentIndex ? "bg-ink text-white" : i < currentIndex ? "bg-emerald-500 text-white" : "bg-ink/5"}`}>
                  {i + 1}
                </div>
                <p className="truncate">{s.vi}</p>
                {i < currentIndex && <CheckCircle2 className="w-3 h-3 ml-auto" />}
              </div>
            ))}
          </div>

          {/* Current Target */}
          <div className="sketch-border bg-white p-6 space-y-4 shadow-lg min-h-[160px] flex flex-col justify-center text-center">
             <span className="text-[9px] font-black uppercase text-crimson tracking-widest block">Đang dịch câu:</span>
             <p className="text-xl md:text-2xl font-sans font-bold leading-relaxed text-ink mt-2">
               "{currentSentence.vi}"
             </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-ink/60 tracking-widest ml-1">Bản dịch của bạn</label>
            <div className="relative">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Nhập bản dịch tiếng Anh của bạn..."
                className="w-full h-32 bg-paper/30 sketch-border p-4 font-sans text-lg focus:outline-none focus:ring-2 focus:ring-ink/10 resize-none transition-all"
                disabled={isVerifying || !!evaluation}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !evaluation) {
                    e.preventDefault();
                    handleVerify();
                  }
                }}
              />
              <button
                onClick={handleVerify}
                disabled={isVerifying || !userInput.trim() || !!evaluation}
                className="absolute bottom-4 right-4 bg-ink text-white p-3 rounded-full shadow-lg hover:scale-110 disabled:opacity-20 transition-all z-10"
              >
                {isVerifying ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {!evaluation ? (
              <motion.div 
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-12 text-center h-full sketch-border border-dashed border-ink/10 bg-white/10"
              >
                <div className="w-16 h-16 rounded-full bg-paper flex items-center justify-center mb-4 opacity-50">
                  <Sparkles className="w-8 h-8 text-ink/20" />
                </div>
                <h3 className="text-lg font-sans font-bold text-ink/30 uppercase tracking-tighter italic">Waiting for your translation</h3>
                <p className="text-sm text-ink/20 max-w-[200px] mt-2">Dịch từng câu một để hoàn thành cả đoạn văn.</p>
              </motion.div>
            ) : (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className={`sketch-border p-6 shadow-xl space-y-4 transition-colors ${evaluation.explanation.includes("Chúc mừng") ? "bg-emerald-50/80 border-emerald-500/30" : "bg-white/80"}`}>
                  <div className="flex items-center gap-2 text-ink/40">
                    <FileText className={`w-4 h-4 ${evaluation.explanation.includes("Chúc mừng") ? "text-emerald-500" : "text-ink/20"}`} />
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Trạng thái đối chiếu</h4>
                  </div>
                  <p className={`text-sm font-sans font-medium leading-relaxed ${evaluation.explanation.includes("Chúc mừng") ? "text-emerald-900" : "text-ink"}`}>
                    {evaluation.explanation}
                  </p>
                </div>

                <div className="bg-paper/30 sketch-border p-6 space-y-4">
                  <div className="flex items-center gap-2 text-ink/40">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Bản dịch mẫu của bạn</span>
                  </div>
                  <p className="text-lg font-sans font-bold leading-relaxed text-ink bg-white/50 p-4 rounded-xl italic">
                    {evaluation.corrected}
                  </p>
                </div>

                <div className="flex gap-4">
                   <button 
                    onClick={() => setEvaluation(null)}
                    className="flex-1 sketch-button bg-paper py-3 text-[10px] font-black uppercase tracking-widest hover:bg-ink/5"
                  >
                    Dịch lại câu này
                  </button>
                  {evaluation.explanation.includes("Chúc mừng") && (
                    <button 
                      onClick={nextSentence}
                      className="flex-3 sketch-button bg-ink text-white py-3 px-8 text-[10px] font-black uppercase tracking-widest hover:bg-ink/90 flex items-center justify-center gap-2 animate-in zoom-in duration-300"
                    >
                      Tiếp tục câu sau <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
