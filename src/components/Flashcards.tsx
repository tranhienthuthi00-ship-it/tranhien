import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Brain, Check, X, Plus, Trash2, Volume2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Card {
  id: string;
  front: string;
  back: string;
  example?: string;
  strength: number; // 0 to 5
}

export default function Flashcards() {
  const [cards, setCards] = useState<Card[]>([
    { id: '1', front: 'Serendipity', back: 'Sự tình cờ may mắn', example: 'Meeting my old friend was a serendipity.', strength: 0 },
    { id: '2', front: 'Eloquent', back: 'Hùng hồn, có khả năng diễn đạt tốt', example: 'His speech was eloquent and moving.', strength: 0 },
    { id: '3', front: 'Pensive', back: 'Trầm tư, suy nghĩ sâu xa', example: 'She looked pensive as she stared out the window.', strength: 0 },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  const currentCard = sessionActive ? cards[currentIndex] : null;

  const addCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront || !newBack) return;
    const nc: Card = {
      id: Date.now().toString(),
      front: newFront,
      back: newBack,
      strength: 0
    };
    setCards([nc, ...cards]);
    setNewFront('');
    setNewBack('');
    setIsAdding(false);
  };

  const removeCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleScore = (success: boolean) => {
    const updated = [...cards];
    if (success) {
      updated[currentIndex].strength = Math.min(5, updated[currentIndex].strength + 1);
    } else {
      updated[currentIndex].strength = Math.max(0, updated[currentIndex].strength - 1);
    }
    setCards(updated);
    
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setSessionActive(false);
      setCurrentIndex(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Vocabulary Flashcards</h1>
          <p className="text-sm text-ink/40 font-bold uppercase italic">Master new words every day</p>
        </div>
        {!sessionActive && (
          <button 
            onClick={() => setSessionActive(true)}
            className="sketch-button bg-crimson text-white px-6 py-2 flex items-center gap-2"
            disabled={cards.length === 0}
          >
            <Brain size={18} /> ÔN TẬP
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {sessionActive ? (
          <motion.div 
            key="session"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center"
          >
            <div className="mb-4 flex justify-between w-full text-[10px] uppercase font-bold tracking-widest text-ink/40">
              <span>Tiến độ: {currentIndex + 1} / {cards.length}</span>
              <button onClick={() => setSessionActive(false)} className="hover:text-crimson">Thoát</button>
            </div>

            <div 
              className="w-full aspect-[4/3] relative perspective-1000 cursor-pointer mb-8"
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
                  <span className="text-[10px] uppercase text-ink/20 absolute top-4">Mặt trước</span>
                  <h2 className="text-4xl font-bold mb-4">{currentCard?.front}</h2>
                  <button 
                    onClick={(e) => { e.stopPropagation(); speak(currentCard?.front || ''); }}
                    className="p-2 hover:bg-ink/5 rounded-full"
                  >
                    <Volume2 size={24} className="text-ink/30" />
                  </button>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden sketch-border bg-paper flex flex-col items-center justify-center p-8 text-center shadow-xl [transform:rotateY(180deg)]">
                  <span className="text-[10px] uppercase text-ink/20 absolute top-4">Mặt sau</span>
                  <h2 className="text-3xl font-bold mb-4 text-crimson">{currentCard?.back}</h2>
                  {currentCard?.example && (
                    <p className="text-sm italic text-ink/60 font-hand">"{currentCard.example}"</p>
                  )}
                </div>
              </motion.div>
            </div>

            {isFlipped && (
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => handleScore(false)}
                  className="flex-1 sketch-button py-4 bg-white text-crimson border-crimson flex items-center justify-center gap-2"
                >
                  <X /> QUÊN RỒI
                </button>
                <button 
                  onClick={() => handleScore(true)}
                  className="flex-1 sketch-button py-4 bg-white text-green-600 border-green-600 flex items-center justify-center gap-2"
                >
                  <Check /> ĐÃ NHỚ
                </button>
              </div>
            )}
            {!isFlipped && (
              <p className="text-sm text-ink/40 font-bold uppercase animate-pulse">Chạm để lật thẻ</p>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setIsAdding(true)}
                className="sketch-border border-dashed p-6 flex flex-col items-center justify-center gap-2 text-ink/40 hover:text-ink hover:bg-white/50 transition-all border-2"
              >
                <Plus size={32} />
                <span className="font-bold uppercase text-xs">Thêm thẻ mới</span>
              </button>

              {cards.map(card => (
                <div key={card.id} className="sketch-border bg-white/60 p-4 relative group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{card.front}</h3>
                    <button onClick={() => removeCard(card.id)} className="opacity-0 group-hover:opacity-100 text-crimson transition-opacity p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-ink/60 italic">{card.back}</p>
                  <div className="mt-3 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={cn("w-2 h-2 rounded-full", i < card.strength ? "bg-crimson" : "bg-ink/10")} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-paper p-8 sketch-border w-full max-w-md relative"
            >
              <button onClick={() => setIsAdding(false)} className="absolute top-4 right-4 text-ink/40 hover:text-ink">
                <X />
              </button>
              <h2 className="text-xl font-bold uppercase mb-6">Thêm thẻ mới</h2>
              <form onSubmit={addCard} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Mặt trước (Tiếng Anh)</label>
                  <input 
                    autoFocus
                    value={newFront}
                    onChange={e => setNewFront(e.target.value)}
                    className="w-full sketch-input"
                    placeholder="E.g. Melancholy"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Mặt sau (Tiếng Việt)</label>
                  <input 
                    value={newBack}
                    onChange={e => setNewBack(e.target.value)}
                    className="w-full sketch-input"
                    placeholder="Nghĩa của từ..."
                  />
                </div>
                <button type="submit" className="w-full sketch-button bg-ink text-white py-3 font-bold uppercase">
                  LƯU THẺ
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
