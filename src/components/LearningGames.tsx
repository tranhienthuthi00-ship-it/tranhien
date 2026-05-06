import { useState, useMemo } from "react";
import type { FormEvent } from "react";
import { BrainCircuit, RotateCcw, ShieldCheck } from "lucide-react";
import type { Word } from "@/types";
import { cn } from "@/lib/utils";

export function LearningGames({
  words,
  updateWordDifficulty,
}: {
  words: Word[];
  updateWordDifficulty: (id: string, newDifficulty: number) => void;
}) {
  const [activeWordInfo, setActiveWordInfo] = useState<{ word: Word | null, isFlipped: boolean }>({ word: null, isFlipped: false });
  const [streak, setStreak] = useState(0);
  const [gameMode, setGameMode] = useState<'Flashcard' | 'Typing' | 'Scramble' | 'Quiz'>('Flashcard');
  const [userInput, setUserInput] = useState('');
  const [scrambledWords, setScrambledWords] = useState<string[]>([]);
  const [scrambleAnswer, setScrambleAnswer] = useState<string[]>([]);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  // Simple weighted random selection
  const selectNextWord = () => {
    if (words.length === 0) return;
    
    // Calculate due words based on nextReview
    const now = new Date();
    const dueWords = words.filter(w => new Date(w.nextReview) <= now);
    
    let pool = dueWords.length > 0 ? dueWords : words; // fallback to all words if nothing is due but user wants to practice

    // If Scramble mode, prefer sentences/phrases
    if (gameMode === 'Scramble') {
      const multiWordPool = pool.filter(w => w.vocabulary.trim().split(/\s+/).length >= 2);
      if (multiWordPool.length > 0) pool = multiWordPool;
    }

    // Higher difficulty number means it should appear MORE often.
    const weightedArray = pool.flatMap(w => {
      let weight = 4;
      if (w.difficulty === 1) weight = 1;
      else if (w.difficulty === 2) weight = 3;
      else if (w.difficulty === 3) weight = 5;
      return Array(weight).fill(w);
    });

    const randomWord = weightedArray[Math.floor(Math.random() * weightedArray.length)];
    setActiveWordInfo({ word: randomWord, isFlipped: false });
    setUserInput('');
    setFeedback(null);

    if (gameMode === 'Scramble' && randomWord) {
      const parts = randomWord.vocabulary.split(/\s+/).filter(w => w.trim() !== '');
      if (parts.length >= 2) {
        setScrambledWords([...parts].sort(() => Math.random() - 0.5));
      } else {
        // Single word: Letter scramble
        const letters = randomWord.vocabulary.split('').filter(c => c.trim() !== '');
        setScrambledWords([...letters].sort(() => Math.random() - 0.5));
      }
      setScrambleAnswer([]);
    }

    if (gameMode === 'Quiz' && randomWord) {
      // Pick 3 other random definitions
      const otherWords = words.filter(w => w.id !== randomWord.id);
      const decoys = [...otherWords].sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.definition);
      const options = [...decoys, randomWord.definition].sort(() => Math.random() - 0.5);
      setQuizOptions(options);
    }
  };

  const handleStart = () => {
    selectNextWord();
    setStreak(0);
  };

  const handleScore = (score: number) => {
    if (activeWordInfo.word) {
      updateWordDifficulty(activeWordInfo.word.id, score);
      setStreak(prev => prev + 1);
      setTimeout(() => {
        selectNextWord();
      }, 400); // Small delay for visual feedback
    }
  };

  const toggleScrambleWord = (wordValue: string, index: number) => {
    if (feedback) return;
    setScrambledWords(prev => prev.filter((_, i) => i !== index));
    setScrambleAnswer(prev => [...prev, wordValue]);
  };

  const removeFromAnswer = (wordValue: string, index: number) => {
    if (feedback) return;
    setScrambleAnswer(prev => prev.filter((_, i) => i !== index));
    setScrambledWords(prev => [...prev, wordValue]);
  };

  const checkScramble = () => {
    if (!activeWordInfo.word) return;
    const isSingleWord = activeWordInfo.word.vocabulary.trim().split(/\s+/).length < 2;
    const currentAnswer = scrambleAnswer.join(isSingleWord ? '' : ' ').toLowerCase();
    const correctAnswer = activeWordInfo.word.vocabulary.toLowerCase();
    
    if (currentAnswer === correctAnswer) {
      setFeedback('correct');
      handleScore(1);
    } else {
      setFeedback('incorrect');
      updateWordDifficulty(activeWordInfo.word.id, 3);
      setStreak(0);
    }
  };

  const handleQuizSelect = (option: string) => {
    if (feedback) return;
    if (option === activeWordInfo.word?.definition) {
      setFeedback('correct');
      handleScore(1);
    } else {
      setFeedback('incorrect');
      updateWordDifficulty(activeWordInfo.word!.id, 3);
      setStreak(0);
    }
  };

  if (words.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg mx-auto space-y-6">
        <div className="w-24 h-24 rounded-full bg-ink/5 flex items-center justify-center text-ink/40">
          <BrainCircuit size={48} />
        </div>
        <h2 className="text-3xl font-bold font-sans">Brain Training</h2>
        <p className="hand-text text-2xl">
          You need at least 3 words in your Academy before you can start the Random Challenge. Head over there to log some vocab!
        </p>
      </div>
    );
  }

  if (!activeWordInfo.word) {
    const dueCount = words.filter(w => new Date(w.nextReview) <= new Date()).length;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg mx-auto space-y-8">
        <div className="w-32 h-32 rounded-full border-4 border-dashed border-ink/20 flex items-center justify-center text-ink p-8 relative">
           <BrainCircuit size={64} className="animate-pulse" />
           <div className="absolute -bottom-4 bg-crimson text-white px-4 py-1 rounded-full font-sans font-bold text-sm tracking-widest uppercase">SRS Active</div>
        </div>
        <div>
          <h2 className="text-4xl font-bold font-sans tracking-tight mb-4">Random Challenge</h2>
          <p className="hand-text text-2xl opacity-90 mb-4">
            Our Spaced Repetition engine will bias towards words you find difficult. Let's build that memory muscle.
          </p>
          <div className="mb-8 font-sans font-bold uppercase tracking-widest text-sm p-3 border-2 border-dashed border-ink/20 inline-block">
            {dueCount > 0 ? (
              <span className="text-crimson">🔥 {dueCount} Words due for review!</span>
            ) : (
              <span className="text-ink/60">✅ You're all caught up! Practice anyway?</span>
            )}
          </div>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => setGameMode('Flashcard')} 
              className={cn("px-4 py-2 border-2 text-sm font-bold uppercase tracking-widest rounded-full", gameMode === 'Flashcard' ? "bg-ink text-paper border-ink" : "border-ink/20")}
            >
              Flashcards
            </button>
            <button 
              onClick={() => setGameMode('Typing')} 
              className={cn("px-4 py-2 border-2 text-sm font-bold uppercase tracking-widest rounded-full", gameMode === 'Typing' ? "bg-ink text-paper border-ink" : "border-ink/20")}
            >
              Typing Test
            </button>
            <button 
              onClick={() => setGameMode('Scramble')} 
              className={cn("px-4 py-2 border-2 text-sm font-bold uppercase tracking-widest rounded-full", gameMode === 'Scramble' ? "bg-ink text-paper border-ink" : "border-ink/20")}
            >
              Scramble
            </button>
            <button 
              onClick={() => setGameMode('Quiz')} 
              className={cn("px-4 py-2 border-2 text-sm font-bold uppercase tracking-widest rounded-full", gameMode === 'Quiz' ? "bg-ink text-paper border-ink" : "border-ink/20")}
            >
              Quiz
            </button>
          </div>
        </div>
        <button onClick={handleStart} className="sketch-button sketch-button-primary text-xl px-12 py-4 mt-8">
          Begin Tryout
        </button>
      </div>
    );
  }

  const { word, isFlipped } = activeWordInfo;

  const handleTypingSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (userInput.trim().toLowerCase() === word.vocabulary.toLowerCase()) {
      setFeedback('correct');
      handleScore(1); // Grade as easy if they typed it correctly first try
    } else {
      setFeedback('incorrect');
      // show correct answer or give hint?
      // simple version: flip card to show it
      setActiveWordInfo(prev => ({ ...prev, isFlipped: true }));
      updateWordDifficulty(word.id, 3); // incorrect means hard
      setStreak(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 flex flex-col items-center">
       <div className="w-full flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 font-sans font-bold text-ink/50">
             <ShieldCheck size={20} /> Streak: <span className="text-crimson text-xl">{streak}</span>
             <span className="ml-4 px-2 py-1 bg-ink/5 rounded text-xs">{gameMode} Mode</span>
          </div>
          <button onClick={() => setActiveWordInfo({ word: null, isFlipped: false })} className="text-sm font-sans font-medium text-ink/40 hover:text-ink flex items-center gap-2">
             <RotateCcw size={16} /> End Session
          </button>
       </div>

       {gameMode === 'Flashcard' ? (
         <>
           {/* Flashcard */}
           <div 
             onClick={() => !isFlipped && setActiveWordInfo(prev => ({ ...prev, isFlipped: true }))}
             className={cn(
               "w-full aspect-[4/3] md:aspect-[16/9] sketch-border bg-white p-6 md:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-500 preserve-3d shadow-xl",
               !isFlipped ? "hover:scale-[1.02] hover:shadow-2xl" : "cursor-default border-crimson"
             )}
           >
              <div className="space-y-2">
                <h2 className="text-4xl md:text-5xl font-sans font-black tracking-tight">{word.vocabulary}</h2>
                <p className="text-lg md:text-xl font-sans text-ink/60">{word.ipa} <span className="italic text-crimson mx-2">{word.wordType}</span></p>
              </div>

              <div className={cn("mt-6 space-y-4 pt-4 border-t-2 border-dashed border-ink/20 w-full transition-all duration-300", isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")}>
                 <p className="text-xl font-sans font-medium">{word.definition}</p>
                 {word.examples[0] && (
                   <p className="hand-text text-2xl">"{word.examples[0]}"</p>
                 )}
              </div>

              {!isFlipped && (
                <div className="absolute bottom-4 hand-text text-lg animate-pulse opacity-60">
                  Tap card to reveal
                </div>
              )}
           </div>

           {/* Controls */}
           <div className={cn("mt-6 flex gap-3 transition-all duration-500", isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none")}>
              <button 
                onClick={() => handleScore(3)} // Hard
                className="sketch-button border-crimson text-crimson hover:bg-crimson hover:text-white px-6 md:px-8 py-2 text-base"
              >
                Hard
              </button>
              <button 
                onClick={() => handleScore(2)} // Medium
                className="sketch-button px-6 md:px-8 py-2 text-base"
              >
                Good
              </button>
              <button 
                onClick={() => handleScore(1)} // Easy
                className="sketch-button bg-ink text-white border-ink hover:bg-transparent hover:text-ink px-6 md:px-8 py-2 text-base"
              >
                Easy
              </button>
           </div>
         </>
       ) : gameMode === 'Typing' ? (
         <div className="w-full">
            {/* Typing Mode */}
            <div className="sketch-border bg-white p-6 md:p-8 mb-6 shadow-xl">
               <div className="mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Definition</span>
                  <p className="text-lg font-sans font-medium mt-1">{word.definition}</p>
               </div>
               
               {word.examples[0] && (
                 <div className="mb-6 p-3 bg-ink/5 rounded-lg border border-ink/10">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Example</span>
                    <p className="hand-text text-2xl mt-1">"{word.examples[0].replace(new RegExp(word.vocabulary, 'gi'), '________')}"</p>
                 </div>
               )}

               <form onSubmit={handleTypingSubmit} className="mt-6 flex gap-3">
                 <input 
                   type="text"
                   disabled={feedback === 'correct'}
                   value={userInput} 
                   onChange={(e) => setUserInput(e.target.value)} 
                   placeholder="Type the word..." 
                   className={cn(
                     "sketch-input flex-1 text-xl font-serif text-center py-1",
                     feedback === 'correct' ? "border-green-600 text-green-600 bg-green-50" : 
                     feedback === 'incorrect' ? "border-crimson text-crimson bg-crimson/10" : ""
                   )}
                   autoFocus
                 />
                 {feedback !== 'correct' && (
                   <button type="submit" className="sketch-button sketch-button-primary px-6 py-1">Submit</button>
                 )}
               </form>
               
               {feedback === 'incorrect' && (
                 <div className="mt-4 text-center animate-in fade-in">
                   <p className="text-crimson font-bold uppercase text-[10px] tracking-widest mb-1">Incorrect</p>
                   <p className="text-lg font-sans">The word was: <span className="font-bold text-ink text-xl">{word.vocabulary}</span></p>
                   <button onClick={() => selectNextWord()} className="mt-3 sketch-button py-1 px-4 text-sm">Next Word</button>
                 </div>
               )}

               {feedback === 'correct' && (
                 <div className="mt-4 text-center animate-in fade-in">
                   <p className="text-green-600 font-bold uppercase tracking-widest mb-2">Correct!</p>
                   <p className="text-lg font-sans mb-4 opacity-60">{word.ipa}</p>
                 </div>
               )}
            </div>
         </div>
       ) : gameMode === 'Quiz' ? (
         <div className="w-full">
            {/* Quiz Mode */}
            <div className="sketch-border bg-white p-6 md:p-8 mb-6 shadow-xl flex flex-col items-center">
              <div className="mb-8 text-center w-full">
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Select correct definition</span>
                <h2 className="text-4xl md:text-5xl font-sans font-black tracking-tight mt-4 text-ink">{word.vocabulary}</h2>
                <p className="text-lg font-sans text-ink/60 mt-2 italic">{word.ipa} • {word.wordType}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 w-full">
                {quizOptions.map((opt, i) => (
                  <button 
                    key={i}
                    onClick={() => handleQuizSelect(opt)}
                    className={cn(
                      "p-4 sketch-border text-left font-sans transition-all",
                      feedback === 'correct' && opt === word.definition ? "bg-green-100 border-green-600 text-green-800" :
                      feedback === 'incorrect' && opt === word.definition ? "bg-green-50 border-green-400" :
                      feedback === 'incorrect' && opt !== word.definition ? "bg-red-50 opacity-40" :
                      "hover:bg-ink/5 bg-white"
                    )}
                  >
                    <span className="font-bold mr-3">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                ))}
              </div>

              {feedback === 'incorrect' && (
                <div className="mt-8 text-center animate-in fade-in">
                   <p className="text-crimson font-bold uppercase text-[10px] tracking-widest mb-2">Incorrect Selection</p>
                   <button onClick={() => selectNextWord()} className="sketch-button py-2 px-8">Next Question</button>
                </div>
              )}
            </div>
         </div>
       ) : (
         <div className="w-full">
            {/* Scramble Mode */}
            <div className="sketch-border bg-white p-6 md:p-8 mb-6 shadow-xl flex flex-col items-center">
              <div className="mb-8 text-center w-full">
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">
                  {word.vocabulary.trim().split(/\s+/).length < 2 ? "Unscramble the Letters" : "Reconstruct the Sentence"}
                </span>
                <p className="text-lg font-sans font-medium mt-2">{word.definition}</p>
              </div>

              <div className="min-h-[100px] w-full p-4 bg-ink/5 rounded-xl sketch-border border-dashed border-ink/20 flex flex-wrap gap-2 justify-center content-center mb-8">
                {scrambleAnswer.map((w, i) => (
                  <button 
                    key={`${w}-${i}`} 
                    onClick={() => removeFromAnswer(w, i)}
                    className="px-4 py-2 bg-white sketch-border text-lg font-sans font-bold hover:scale-105 transition-transform"
                  >
                    {w}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                {scrambledWords.map((w, i) => (
                  <button 
                    key={`${w}-${i}`} 
                    onClick={() => toggleScrambleWord(w, i)}
                    className="px-4 py-2 bg-ink/5 sketch-border border-ink/20 text-lg font-sans hover:bg-ink hover:text-white transition-colors"
                  >
                    {w}
                  </button>
                ))}
              </div>

              <div className="mt-12 flex gap-4">
                {feedback === null && scrambleAnswer.length > 0 && (
                  <button onClick={checkScramble} className="sketch-button sketch-button-primary px-12 py-2 text-xl">
                    Check Answer
                  </button>
                )}
                
                {feedback === 'incorrect' && (
                  <div className="text-center animate-in zoom-in-95">
                    <p className="text-crimson font-black uppercase text-xs tracking-widest mb-2">Sequence Invalid</p>
                    <p className="text-lg mb-4 italic">"{word.vocabulary}"</p>
                    <button onClick={() => selectNextWord()} className="sketch-button px-8 py-2">
                      Continue
                    </button>
                  </div>
                )}
              </div>
            </div>
         </div>
       )}
    </div>
  );
}
