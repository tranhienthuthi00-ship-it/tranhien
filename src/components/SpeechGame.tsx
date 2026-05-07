import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, Trophy, RotateCcw, ShieldCheck, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Word } from "@/types";
import { cn } from "@/lib/utils";
import stringSimilarity from "string-similarity";

interface SpeechGameProps {
  words: Word[];
  updateWordDifficulty: (id: string, newDifficulty: number) => void;
}

export function SpeechGame({ words, updateWordDifficulty }: SpeechGameProps) {
  const [activeWord, setActiveWord] = useState<Word | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{ message: string; color: string } | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        setFeedback(null);
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          const processed = finalTranscript.trim();
          setTranscript(processed);
          
          // If the word is correct or ending with period, stop
          if (processed.includes(".") || processed.toLowerCase().includes(activeWord?.vocabulary.toLowerCase() || "")) {
             validateSpeech(processed);
             recognitionRef.current.stop();
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
        setFeedback({ message: "Có lỗi xảy ra. Vui lòng thử lại.", color: "text-crimson" });
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [activeWord]);

  const selectNextWord = () => {
    if (words.length === 0) return;
    const randomIndex = Math.floor(Math.random() * words.length);
    setActiveWord(words[randomIndex]);
    setTranscript("");
    setScore(null);
    setFeedback(null);
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      setFeedback({ message: "Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói.", color: "text-crimson" });
      return;
    }
    setTranscript("");
    setScore(null);
    setFeedback(null);
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("Start error:", err);
      // If already started, just ignore or stop first
      try {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 100);
      } catch (e) {}
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const validateSpeech = (speech: string) => {
    if (!activeWord) return;

    const target = activeWord.vocabulary.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    const recognized = speech.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");

    const similarity = stringSimilarity.compareTwoStrings(target, recognized);
    const finalScore = Math.round(similarity * 100);
    setScore(finalScore);

    if (finalScore >= 80) {
      setFeedback({ message: "Tuyệt vời! Phát âm rất chuẩn.", color: "text-green-600" });
      setStreak(prev => prev + 1);
      updateWordDifficulty(activeWord.id, 1); // Easy
    } else if (finalScore >= 50) {
      setFeedback({ message: "Khá tốt, hãy thử lại để hoàn thiện hơn.", color: "text-orange-500" });
      updateWordDifficulty(activeWord.id, 2); // Medium
    } else {
      setFeedback({ message: "Chưa chính xác lắm, hãy nghe lại và thử nhé.", color: "text-crimson" });
      setStreak(0);
      updateWordDifficulty(activeWord.id, 3); // Hard
    }
  };

  if (words.length < 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="hand-text text-2xl">Bạn cần thêm từ vựng vào Academy trước khi chơi.</p>
      </div>
    );
  }

  if (!activeWord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-8 animate-in fade-in">
        <div className="w-32 h-32 rounded-full border-4 border-dashed border-ink/20 flex items-center justify-center text-ink p-8">
          <Mic className="w-16 h-16 animate-pulse" />
        </div>
        <div>
          <h2 className="text-4xl font-bold font-sans tracking-tight mb-4">Trò chơi Phát âm</h2>
          <p className="hand-text text-2xl opacity-90">
            Luyện nói các từ trong bộ sưu tập của bạn. Hệ thống sẽ chấm điểm độ chính xác!
          </p>
        </div>
        <button onClick={selectNextWord} className="sketch-button sketch-button-primary text-xl px-12 py-4">
          Bắt đầu ngay
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-3 md:p-6 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 font-sans font-bold text-ink/50 text-xs md:text-sm">
          <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" /> Streak: <span className="text-crimson text-lg md:text-xl">{streak}</span>
          <span className="ml-4 px-2 py-1 bg-ink/5 rounded text-xs">Speech Mode</span>
        </div>
        <button onClick={() => setActiveWord(null)} className="text-sm font-sans font-medium text-ink/40 hover:text-ink flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> Thoát
        </button>
      </div>

      <motion.div 
        key={activeWord.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full sketch-border bg-white p-8 mb-6 shadow-xl flex flex-col items-center text-center relative overflow-hidden"
      >
        <div className="absolute top-4 right-4">
           {score !== null && (
             <div className={cn(
               "w-16 h-16 rounded-full flex items-center justify-center border-4 font-sans font-black text-xl",
               score >= 80 ? "border-green-500 text-green-500" : score >= 50 ? "border-orange-500 text-orange-500" : "border-crimson text-crimson"
             )}>
               {score}%
             </div>
           )}
        </div>

        <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Nói từ này:</span>
        <h2 className="text-4xl md:text-6xl font-sans font-black tracking-tight mt-4 text-ink">{activeWord.vocabulary}</h2>
        <p className="text-lg md:text-xl font-sans text-ink/60 mt-2">{activeWord.ipa}</p>

        <div className="flex gap-4 mt-8">
          <button 
            onClick={() => speak(activeWord.vocabulary)}
            className="w-12 h-12 rounded-full border-2 border-ink/20 flex items-center justify-center hover:bg-ink/5 transition-colors"
            title="Nghe mẫu"
          >
            <Volume2 className="w-6 h-6 text-ink/60" />
          </button>
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg",
              isRecording ? "bg-crimson text-white animate-pulse" : "bg-ink text-white hover:scale-110"
            )}
          >
            {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
          </button>

          <div className="w-12 h-12" /> {/* Spacer for symmetry */}
        </div>

        <div className="mt-8 min-h-[60px] w-full">
          <AnimatePresence mode="wait">
            {transcript && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-2"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Kết quả nhận dạng:</p>
                <p className="text-2xl hand-text text-ink/80 italic">"{transcript}"</p>
              </motion.div>
            )}
            {!transcript && isRecording && (
                <p className="text-ink/40 animate-pulse font-sans italic">Đang lắng nghe...</p>
            )}
          </AnimatePresence>
        </div>

        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("mt-6 p-4 rounded-lg bg-ink/5 w-full", feedback.color)}
          >
            <p className="font-sans font-bold flex items-center justify-center gap-2">
              {score && score >= 80 && <Trophy className="w-5 h-5" />}
              {feedback.message}
            </p>
            {score !== null && score >= 80 && (
              <button 
                onClick={selectNextWord}
                className="mt-4 sketch-button bg-ink text-white border-ink py-2 px-8 flex items-center gap-2 mx-auto"
              >
                Tiếp theo <Play className="w-4 h-4 fill-current" />
              </button>
            )}
             {score !== null && score < 80 && (
              <button 
                onClick={startRecording}
                className="mt-4 sketch-button border-crimson text-crimson py-2 px-8 mx-auto"
              >
                Thử lại
              </button>
            )}
          </motion.div>
        )}
      </motion.div>
      
      {score !== null && score < 80 && (
        <button onClick={selectNextWord} className="text-sm text-ink/40 hover:text-ink font-sans">
          Bỏ qua từ này
        </button>
      )}
    </div>
  );
}
