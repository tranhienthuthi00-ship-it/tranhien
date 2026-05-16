import { useState, useEffect } from "react";
import { Loader2, Send, Sparkles, RefreshCw, CheckCircle2, ChevronRight, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Evaluation {
  score: number;
  corrected: string;
  feedback: string;
  vocabulary: { word: string; meaning: string }[];
}

export function TranslationPractice() {
  const [original, setOriginal] = useState("");
  const [translation, setTranslation] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [topic, setTopic] = useState("daily life");

  const topics = [
    "daily life", "work & business", "technology", "travel", "food & dining", "feelings & emotions", "nature"
  ];

  const fetchNewSentence = async (selectedTopic?: string) => {
    setLoading(true);
    setEvaluation(null);
    setTranslation("");
    try {
      const response = await fetch(`/api/translation/sentence?topic=${selectedTopic || topic}`);
      const data = await response.json();
      if (data.sentence) {
        setOriginal(data.sentence);
      }
    } catch (error) {
      console.error("Error fetching sentence:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!translation.trim()) return;
    setEvaluating(true);
    try {
      const response = await fetch("/api/translation/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original, translation }),
      });
      const data = await response.json();
      setEvaluation(data);
    } catch (error) {
      console.error("Error evaluating translation:", error);
    } finally {
      setEvaluating(false);
    }
  };

  useEffect(() => {
    fetchNewSentence();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto px-2 md:px-4 py-4 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-hidden">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-8 border-b-4 border-ink pb-4 gap-6">
        <div className="shrink-0">
          <h2 className="text-2xl md:text-3xl font-sans font-black tracking-tighter uppercase text-ink flex items-center gap-3">
            <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-crimson" />
            Translation
          </h2>
          <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mt-1">Luyện dịch Anh - Việt cùng AI</p>
        </div>
        
        <div className="w-full xl:w-auto overflow-x-auto pb-2 scrollbar-none">
          <div className="flex bg-paper/50 rounded-xl p-1 sketch-border gap-1 min-w-max">
            {topics.map(t => (
              <button
                key={t}
                onClick={() => { setTopic(t); fetchNewSentence(t); }}
                className={`text-[9px] md:text-[10px] whitespace-nowrap font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${topic === t ? "bg-ink text-white shadow-sm" : "text-ink/40 hover:text-ink hover:bg-white/50"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        {/* Input Side */}
        <div className="space-y-6">
          <div className="sketch-border bg-white/60 p-6 space-y-4 relative overflow-hidden group">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-ink/40 tracking-widest flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-yellow-500" />
                Dịch Câu Này
              </span>
              <button 
                onClick={() => fetchNewSentence()} 
                disabled={loading}
                className="p-1 hover:bg-ink/5 rounded-full transition-colors disabled:opacity-30"
              >
                <RefreshCw className={`w-4 h-4 text-ink/40 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
            
            <div className="min-h-[80px] flex items-center">
              {loading ? (
                <div className="flex items-center gap-3 text-ink/30 animate-pulse">
                  <div className="h-4 w-48 bg-ink/10 rounded" />
                </div>
              ) : (
                <p className="text-xl md:text-2xl font-sans font-bold leading-relaxed text-ink italic break-words w-full">
                  "{original}"
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-ink/60 tracking-widest ml-1">Bản dịch của bạn</label>
            <div className="relative">
              <textarea
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="Type your English translation here..."
                className="w-full h-40 bg-paper/30 sketch-border p-4 font-sans text-lg focus:outline-none focus:ring-2 focus:ring-ink/10 resize-none transition-all placeholder:text-ink/20"
                disabled={evaluating}
              />
              <button
                onClick={handleEvaluate}
                disabled={evaluating || !translation.trim() || loading}
                className="absolute bottom-4 right-4 bg-ink text-white p-3 rounded-full shadow-lg hover:scale-110 active:scale-95 disabled:scale-100 disabled:opacity-20 transition-all z-10"
              >
                {evaluating ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Results Side */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {!evaluation ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-12 text-center h-[400px] sketch-border border-dashed border-ink/10 bg-white/10"
              >
                <div className="w-16 h-16 rounded-full bg-paper flex items-center justify-center mb-4 opacity-50">
                  <Sparkles className="w-8 h-8 text-ink/20" />
                </div>
                <h3 className="text-lg font-sans font-bold text-ink/30 uppercase tracking-tighter">Submit your translation</h3>
                <p className="text-sm text-ink/20 max-w-[200px]">AI will analyze your grammar and suggest improvements.</p>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Score Circle */}
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-white/80 sketch-border p-6 shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-ink/5 -translate-y-1/2 translate-x-1/2 rounded-full hidden sm:block" />
                   
                   <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                     <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                       <circle cx="50" cy="50" r="45" className="fill-none stroke-ink/10" strokeWidth="6" />
                       <circle 
                         cx="50" cy="50" r="45" 
                         className="fill-none stroke-crimson" 
                         strokeWidth="6" 
                         strokeDasharray={2 * Math.PI * 45}
                         strokeDashoffset={2 * Math.PI * 45 * (1 - evaluation.score / 100)}
                         strokeLinecap="round"
                         style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                       />
                     </svg>
                     <span className="absolute text-2xl font-black">{evaluation.score}</span>
                   </div>
                   
                   <div className="text-center sm:text-left">
                     <h4 className="text-[10px] font-black uppercase text-ink/40 tracking-widest mb-1">Feedback</h4>
                     <p className="text-sm font-sans font-medium leading-snug">{evaluation.feedback}</p>
                   </div>
                </div>

                {/* Correction */}
                <div className="bg-emerald-50/80 sketch-border border-emerald-500/30 p-6 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Suggested Version</span>
                  </div>
                  <p className="text-lg font-sans font-bold leading-relaxed text-emerald-900 bg-white/50 p-4 rounded-xl">
                    {evaluation.corrected}
                  </p>
                </div>

                {/* Vocabulary */}
                {evaluation.vocabulary && evaluation.vocabulary.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-ink/60 tracking-widest ml-1">Key Vocabulary</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                       {evaluation.vocabulary.map((v, i) => (
                         <div key={i} className="flex items-center gap-3 bg-white/40 p-3 sketch-border hover:bg-paper transition-colors group">
                           <div className="w-6 h-6 flex-shrink-0 rounded bg-ink/5 flex items-center justify-center group-hover:bg-crimson group-hover:text-white transition-colors">
                             <ChevronRight className="w-4 h-4" />
                           </div>
                           <div>
                             <p className="text-sm font-bold leading-none">{v.word}</p>
                             <p className="text-[11px] text-ink/60 mt-1">{v.meaning}</p>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={() => fetchNewSentence()}
                  className="w-full sketch-button bg-paper py-4 text-xs font-black uppercase tracking-widest hover:bg-ink hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Next Challenge
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
