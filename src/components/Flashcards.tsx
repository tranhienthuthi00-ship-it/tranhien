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

  const dueWords = useMemo(() => {
    return words.filter(w => !w.nextReview || new Date(w.nextReview) <= new Date())
      .sort((a, b) => new Date(a.nextReview || 0).getTime() - new Date(b.nextReview || 0).getTime());
  }, [words]);

  const currentCard = sessionActive ? dueWords[currentIndex] : null;

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleSRSScore = (quality: number) => {
    if (!currentCard) return;

    let newInterval = 1;
    let newEF = currentCard.difficulty || 2.5; // Difficulty used as EF
    
    if (quality >= 3) {
      if (!currentCard.lastReviewed) { // First time
        newInterval = 1;
      } else if (new Date(currentCard.nextReview).getTime() - new Date(currentCard.lastReviewed).getTime() < 2 * 86400000) { 
        // Approx 1-2 days interval previously
        newInterval = 6;
      } else {
        const last = new Date(currentCard.lastReviewed).getTime();
        const next = new Date(currentCard.nextReview).getTime();
        const prevInterval = Math.max(1, Math.ceil((next - last) / 86400000));
        newInterval = Math.ceil(prevInterval * newEF);
      }
      
      // EF = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))
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
    } else {
      setSessionActive(false);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
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
          
          {dueWords.length > 0 ? (
            <button 
              onClick={() => setSessionActive(true)}
              className="sketch-button bg-crimson text-white px-10 py-4 font-bold uppercase tracking-widest hover:scale-105 transition-transform"
            >
              Start Session
            </button>
          ) : (
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
            <ArrowLeft size={12} /> Quit Session
          </button>
          <span>Progress: {currentIndex + 1} / {dueWords.length}</span>
        </div>

        <div 
          className="w-full aspect-video md:aspect-[2/1] relative perspective-1000 cursor-pointer mb-8"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <motion.div
            className="w-full h-full relative preserve-3d"
            initial={false}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
          >
            {/* Front */}
            <div className="absolute inset-0 backface-hidden sketch-border bg-white flex flex-col items-center justify-center p-8 text-center shadow-xl">
              <span className="text-[10px] uppercase text-ink/10 absolute top-4 font-bold tracking-widest">Front</span>
              <h2 className="text-4xl font-black tracking-tighter mb-4">{currentCard?.vocabulary}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink/40 font-bold uppercase tracking-widest">{currentCard?.ipa}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); speak(currentCard?.vocabulary || ''); }}
                  className="p-1.5 hover:bg-ink/5 rounded-full"
                >
                  <Volume2 size={16} className="text-ink/30" />
                </button>
              </div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 backface-hidden sketch-border bg-paper flex flex-col items-center justify-center p-8 text-center shadow-xl [transform:rotateY(180deg)]">
              <span className="text-[10px] uppercase text-ink/10 absolute top-4 font-bold tracking-widest">Back</span>
              <h2 className="text-2xl font-bold text-crimson mb-4">{currentCard?.definition}</h2>
              {currentCard?.examples[0] && (
                <p className="hand-text text-xl text-ink/80 italic">"{currentCard.examples[0]}"</p>
              )}
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
                 className={cn("sketch-border py-3 flex flex-col items-center transition-all hover:scale-105", btn.color)}
               >
                 <span className="text-xs font-black uppercase tracking-tight">{btn.label}</span>
                 <span className="text-[10px] opacity-60 font-mono">{btn.sub}</span>
               </button>
             ))}
           </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-ink/40 font-bold uppercase tracking-widest animate-pulse">Tap card to show answer</p>
          </div>
        )}
      </div>
    </div>
  );
}
