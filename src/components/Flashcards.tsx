import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Check, Volume2, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Word } from '../types';

export default function Flashcards({ 
  words, 
  setWords 
}: { 
  words: Word[]; 
  setWords: (words: Word[]) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [reviewMode, setReviewMode] = useState<'flip' | 'type'>('flip');
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);

  const dueWords = useMemo(() => {
    return words.filter(w => !w.nextReview || new Date(w.nextReview) <= new Date())
      .sort((a, b) => new Date(a.nextReview || 0).getTime() - new Date(b.nextReview || 0).getTime());
  }, [words]);

  const currentCard = sessionActive ? dueWords[currentIndex] : null;

  const speak = (text: string, lang: 'en-US' | 'vi-VN' = 'en-US') => {
    if (!text || !window.speechSynthesis) return;
    
    // Stop any current speaking to avoid queue issues
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Check if the lang is supported or fallback
    const voices = window.speechSynthesis.getVoices();
    
    if (lang.startsWith('en')) {
      const enVoices = voices.filter(v => v.lang.startsWith('en'));
      const preferredVoice = localStorage.getItem("preferredVoice");
      const preferredRate = localStorage.getItem("preferredRate");
      const preferredPitch = localStorage.getItem("preferredPitch");

      let voiceToUse = null;
      if (preferredVoice) {
        voiceToUse = enVoices.find(v => v.name === preferredVoice);
      }

      if (!voiceToUse && enVoices.length > 0) {
        // Sort and prioritize high-quality natural/online/Google/Premium voices
        const sortedEn = [...enVoices].sort((a, b) => {
          const getScore = (voice: SpeechSynthesisVoice) => {
            const name = voice.name.toLowerCase();
            if (name.includes("natural")) return 100;
            if (name.includes("online")) return 90;
            if (name.includes("google")) return 80;
            if (name.includes("premium")) return 70;
            if (name.includes("neural")) return 60;
            if (name.includes("samantha")) return 50;
            if (name.includes("apple") || name.includes("macos")) return 40;
            if (name.includes("microsoft") || name.includes("desktop")) return 30;
            return 0;
          };
          return getScore(b) - getScore(a);
        });
        voiceToUse = sortedEn[0];
      }

      if (voiceToUse) {
        utterance.voice = voiceToUse;
      }
      utterance.lang = 'en-US';
      utterance.rate = preferredRate ? parseFloat(preferredRate) : 0.9;
      utterance.pitch = preferredPitch ? parseFloat(preferredPitch) : 1.0;
    } else {
      const hasVoice = voices.some(v => v.lang.startsWith('vi'));
      utterance.lang = hasVoice ? 'vi-VN' : 'en-US';
      utterance.rate = 0.9;
    }
    
    utterance.onerror = (e) => {
      console.error("SpeechSynthesis Error:", e);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Auto-speak question in typing mode
  React.useEffect(() => {
    if (sessionActive && reviewMode === 'type' && currentCard && !showResult) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        speak(currentCard.definition, 'vi-VN');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, sessionActive, reviewMode]);

  const handleSRSScore = (quality: number) => {
    if (!currentCard) return;

    let newInterval = 1;
    let newEF = currentCard.difficulty || 2.5; 
    
    if (quality >= 3) {
      if (!currentCard.lastReviewed) {
        newInterval = 1;
      } else if (new Date(currentCard.nextReview).getTime() - new Date(currentCard.lastReviewed).getTime() < 2 * 86400000) { 
        newInterval = 6;
      } else {
        const last = new Date(currentCard.lastReviewed).getTime();
        const next = new Date(currentCard.nextReview).getTime();
        const prevInterval = Math.max(1, Math.ceil((next - last) / 86400000));
        newInterval = Math.ceil(prevInterval * newEF);
      }
      
      newEF = newEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (newEF < 1.3) newEF = 1.3;
    } else {
      newInterval = 1;
      newEF = Math.max(1.3, newEF - 0.2);
    }

    const updatedWords = words.map(w => w.id === currentCard.id ? {
      ...w,
      difficulty: newEF,
      lastReviewed: new Date().toISOString(),
      nextReview: new Date(Date.now() + newInterval * 86400000).toISOString()
    } : w);

    setWords(updatedWords);
    
    if (currentIndex < dueWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setUserInput('');
      setShowResult(false);
    } else {
      setSessionActive(false);
      setCurrentIndex(0);
      setIsFlipped(false);
      setUserInput('');
      setShowResult(false);
    }
  };

  const checkTyping = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResult(true);
    setIsFlipped(true);
  };

  if (!sessionActive) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="sketch-border bg-white p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-crimson/10 text-crimson rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain size={40} />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">SRS Flashcards</h2>
          <p className="hand-text text-xl opacity-60">
            {dueWords.length > 0 
              ? `You have ${dueWords.length} words due for review today.` 
              : "Amazing! No words due for review right now."}
          </p>
          
          {dueWords.length > 0 && (
            <div className="flex flex-col gap-4 max-w-xs mx-auto">
              <button 
                onClick={() => { setReviewMode('flip'); setSessionActive(true); }}
                className="sketch-button bg-crimson text-white px-6 py-4 font-bold uppercase tracking-widest hover:scale-105 transition-transform"
              >
                Classic Flip
              </button>
              <button 
                onClick={() => { setReviewMode('type'); setSessionActive(true); }}
                className="sketch-button bg-white text-ink border-ink px-6 py-4 font-bold uppercase tracking-widest hover:scale-105 transition-transform"
              >
                Typing Challenge ⌨️
              </button>
            </div>
          )}
          
          {dueWords.length === 0 && (
            <div className="pt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-ink/20">Check back later or add more words</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 font-sans">
      <div className="flex flex-col items-center">
        <div className="mb-6 flex justify-between w-full text-[10px] uppercase font-bold tracking-widest text-ink/40">
          <button onClick={() => setSessionActive(false)} className="flex items-center gap-1 hover:text-ink transition-colors">
            <ArrowLeft size={12} /> Quit
          </button>
          <span>Progress: {currentIndex + 1} / {dueWords.length}</span>
        </div>

        <div 
          className="w-full aspect-video md:aspect-[2/1] relative perspective-1000 cursor-pointer mb-8"
          onClick={() => reviewMode === 'flip' && setIsFlipped(!isFlipped)}
        >
          <motion.div
            className="w-full h-full relative preserve-3d"
            initial={false}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
          >
            {/* Front */}
            <div className="absolute inset-0 backface-hidden sketch-border bg-white shadow-xl overflow-y-auto custom-scrollbar">
              <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-8 text-center relative">
                <span className="text-[10px] uppercase text-ink/10 absolute top-2 font-bold tracking-widest">Question</span>
                {reviewMode === 'flip' ? (
                  <>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter mb-4 break-words w-full">{currentCard?.vocabulary}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink/40 font-bold uppercase tracking-widest break-all">{currentCard?.ipa}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); speak(currentCard?.vocabulary || ''); }}
                        className="p-1.5 hover:bg-ink/5 rounded-full"
                      >
                        <Volume2 size={16} className="text-ink/30" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full space-y-4 py-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h2 className="text-lg md:text-xl font-bold italic text-ink/60 leading-tight">
                        {currentCard?.definition}
                      </h2>
                      <button 
                        onClick={(e) => { e.stopPropagation(); speak(currentCard?.definition || '', 'vi-VN'); }}
                        className="p-1.5 hover:bg-ink/5 rounded-full shrink-0"
                        title="Nghe lại"
                      >
                        <Volume2 size={16} className="text-ink/30" />
                      </button>
                    </div>
                    {!showResult ? (
                      <form onSubmit={checkTyping} className="w-full max-w-sm mx-auto">
                        <input 
                          autoFocus
                          value={userInput}
                          onChange={e => setUserInput(e.target.value)}
                          className="w-full sketch-input text-center text-xl font-bold bg-ink/5"
                          placeholder="Type the word..."
                          onClick={e => e.stopPropagation()}
                        />
                        <button className="hidden" type="submit">Submit</button>
                      </form>
                    ) : (
                      <div className="animate-in fade-in zoom-in duration-300">
                         <p className="text-[10px] font-bold uppercase text-ink/20">Your Answer</p>
                         <p className={cn("text-2xl font-black break-words", userInput.toLowerCase().trim() === currentCard?.vocabulary.toLowerCase().trim() ? "text-green-600" : "text-crimson scale-110")}>
                           {userInput || "(Empty)"}
                         </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 backface-hidden sketch-border bg-paper shadow-xl [transform:rotateY(180deg)] overflow-y-auto custom-scrollbar">
              <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-8 text-center relative">
                <span className="text-[10px] uppercase text-ink/10 absolute top-2 font-bold tracking-widest">Answer</span>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-crimson mb-3 break-words w-full">
                  {reviewMode === 'type' ? currentCard?.vocabulary : currentCard?.definition}
                </h2>
                {currentCard?.examples[0] && (
                  <p className="hand-text text-lg md:text-xl text-ink/80 italic leading-snug max-w-prose">
                    "{currentCard.examples[0]}"
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {isFlipped ? (
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
             {[
               { q: 0, label: 'Again', sub: '< 1m', color: 'bg-crimson text-white' },
               { q: 3, label: 'Hard', sub: '2d', color: 'bg-orange-50 text-orange-700 border-orange-200' },
               { q: 4, label: 'Good', sub: '4d', color: 'bg-green-50 text-green-700 border-green-200' },
               { q: 5, label: 'Easy', sub: '7d', color: 'bg-blue-50 text-blue-700 border-blue-200' }
             ].map((btn) => (
               <button 
                 key={btn.q}
                 onClick={(e) => { e.stopPropagation(); handleSRSScore(btn.q); }}
                 className={cn("sketch-border py-3 flex flex-col items-center transition-all hover:scale-105 active:scale-95", btn.color)}
               >
                 <span className="text-xs font-black uppercase tracking-tight">{btn.label}</span>
                 <span className="text-[10px] opacity-60 font-mono">{btn.sub}</span>
               </button>
             ))}
           </div>
        ) : (
          <div className="text-center">
            {reviewMode === 'flip' ? (
              <p className="text-sm text-ink/40 font-bold uppercase tracking-widest animate-pulse">Tap card to show answer</p>
            ) : (
              <p className="text-sm text-ink/40 font-bold uppercase tracking-widest">Type the word and press Enter</p>
            )}
          </div>
        )}
      </div>
    </div>

  );
}
