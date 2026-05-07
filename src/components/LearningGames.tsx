import { useState, useMemo } from "react";
import type { FormEvent } from "react";
import { BrainCircuit, RotateCcw, ShieldCheck, Layers, Keyboard, Shuffle, ListTodo, Headphones, Mic } from "lucide-react";
import type { Word } from "@/types";
import { cn } from "@/lib/utils";

export function LearningGames({
  words,
  updateWordDifficulty,
  setActiveEnglishSubTab,
}: {
  words: Word[];
  updateWordDifficulty: (id: string, newDifficulty: number) => void;
  setActiveEnglishSubTab?: (tab: "Academy" | "Learning Games" | "Dictation" | "Speech") => void;
}) {
  const [activeWordInfo, setActiveWordInfo] = useState<{ word: Word | null, isFlipped: boolean }>({ word: null, isFlipped: false });
  const [streak, setStreak] = useState(0);
  const [gameMode, setGameMode] = useState<'Flashcard' | 'Typing' | 'Scramble' | 'Quiz' | 'Dictation'>('Flashcard');
  const [userInput, setUserInput] = useState('');
  const [scrambledWords, setScrambledWords] = useState<string[]>([]);
  const [scrambleAnswer, setScrambleAnswer] = useState<string[]>([]);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

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
    
    if (gameMode === 'Dictation' && randomWord) {
      setTimeout(() => speak(randomWord.vocabulary), 300);
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
      speak(activeWordInfo.word.vocabulary);
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
      speak(activeWordInfo.word.vocabulary);
      handleScore(1);
    } else {
      setFeedback('incorrect');
      updateWordDifficulty(activeWordInfo.word!.id, 3);
      setStreak(0);
    }
  };

  if (words.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] md:min-h-[60vh] text-center max-w-lg mx-auto space-y-4 md:space-y-6 p-4">
        <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-ink/5 flex items-center justify-center text-ink/40">
          <BrainCircuit className="w-8 h-8 md:w-12 md:h-12" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold font-sans">Brain Training</h2>
        <p className="hand-text text-xl md:text-2xl">
          You need at least 3 words in your Academy before you can start the Random Challenge. Head over there to log some vocab!
        </p>
      </div>
    );
  }

  if (!activeWordInfo.word) {
    const dueCount = words.filter(w => new Date(w.nextReview) <= new Date()).length;

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] md:min-h-[60vh] text-center max-w-lg mx-auto space-y-6 md:space-y-8 p-4">
        <div className="w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-dashed border-ink/20 flex items-center justify-center text-ink p-4 md:p-8 relative">
           <BrainCircuit className="w-10 h-10 md:w-16 md:h-16 animate-pulse" />
           <div className="absolute -bottom-3 md:-bottom-4 bg-crimson text-white px-3 md:px-4 py-0.5 md:py-1 rounded-full font-sans font-bold text-[10px] md:text-sm tracking-widest uppercase whitespace-nowrap">SRS Active</div>
        </div>
        <div className="w-full">
          <h2 className="text-3xl md:text-4xl font-bold font-sans tracking-tight mb-2 md:mb-4 px-2">Random Challenge</h2>
          <p className="hand-text text-xl md:text-2xl opacity-90 mb-4 px-2">
            Our Spaced Repetition engine will bias towards words you find difficult. Let's build that memory muscle.
          </p>
          <div className="mb-6 md:mb-8 font-sans font-bold uppercase tracking-widest text-[10px] md:text-sm p-2 md:p-3 border-2 border-dashed border-ink/20 inline-block">
            {dueCount > 0 ? (
              <span className="text-crimson">🔥 {dueCount} Words due for review!</span>
            ) : (
              <span className="text-ink/60">✅ You're all caught up! Practice anyway?</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 md:flex md:gap-4 justify-center px-2">
            <button 
              onClick={() => setGameMode('Flashcard')} 
              className={cn("flex items-center gap-2 px-2 py-2 md:px-4 md:py-2 border-2 text-[10px] md:text-sm font-bold uppercase tracking-widest rounded-full transition-all", gameMode === 'Flashcard' ? "bg-ink text-paper border-ink scale-105" : "border-ink/20")}
            >
              <Layers className="w-3 h-3 md:w-4 md:h-4" style={{ filter: 'url(#hand-drawn-filter)' }} /> Flashcards
            </button>
            <button 
              onClick={() => setGameMode('Typing')} 
              className={cn("flex items-center gap-2 px-2 py-2 md:px-4 md:py-2 border-2 text-[10px] md:text-sm font-bold uppercase tracking-widest rounded-full transition-all", gameMode === 'Typing' ? "bg-ink text-paper border-ink scale-105" : "border-ink/20")}
            >
              <Keyboard className="w-3 h-3 md:w-4 md:h-4" style={{ filter: 'url(#hand-drawn-filter)' }} /> Typing
            </button>
            <button 
              onClick={() => setGameMode('Scramble')} 
              className={cn("flex items-center gap-2 px-2 py-2 md:px-4 md:py-2 border-2 text-[10px] md:text-sm font-bold uppercase tracking-widest rounded-full transition-all", gameMode === 'Scramble' ? "bg-ink text-paper border-ink scale-105" : "border-ink/20")}
            >
              <Shuffle className="w-3 h-3 md:w-4 md:h-4" style={{ filter: 'url(#hand-drawn-filter)' }} /> Scramble
            </button>
            <button 
              onClick={() => setGameMode('Quiz')} 
              className={cn("flex items-center gap-2 px-2 py-2 md:px-4 md:py-2 border-2 text-[10px] md:text-sm font-bold uppercase tracking-widest rounded-full transition-all", gameMode === 'Quiz' ? "bg-ink text-paper border-ink scale-105" : "border-ink/20")}
            >
              <ListTodo className="w-3 h-3 md:w-4 md:h-4" style={{ filter: 'url(#hand-drawn-filter)' }} /> Quiz
            </button>
            <button 
              onClick={() => setGameMode('Dictation')} 
              className={cn("flex items-center gap-2 px-2 py-2 md:px-4 md:py-2 border-2 text-[10px] md:text-sm font-bold uppercase tracking-widest rounded-full transition-all", gameMode === 'Dictation' ? "bg-ink text-paper border-ink scale-105" : "border-ink/20")}
            >
              <Headphones className="w-3 h-3 md:w-4 md:h-4" style={{ filter: 'url(#hand-drawn-filter)' }} /> Dictation
            </button>
            <button 
              onClick={() => setActiveEnglishSubTab?.('Speech')} 
              className={cn("flex items-center gap-2 px-2 py-2 md:px-4 md:py-2 border-2 text-[10px] md:text-sm font-bold uppercase tracking-widest rounded-full border-crimson/30 text-crimson hover:bg-crimson/5 transition-all")}
            >
              <Mic className="w-3 h-3 md:w-4 md:h-4" style={{ filter: 'url(#hand-drawn-filter)' }} /> Speech
            </button>
          </div>
        </div>
        <button onClick={handleStart} className="sketch-button sketch-button-primary text-lg md:text-xl px-10 md:px-12 py-3 md:py-4 mt-4 md:mt-8">
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
      speak(word.vocabulary);
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

  const handleFlip = () => {
    if (!isFlipped) speak(word.vocabulary);
    setActiveWordInfo(prev => ({ ...prev, isFlipped: true }));
  };

  return (
    <div className="max-w-3xl mx-auto p-3 md:p-6 flex flex-col items-center">
       <div className="w-full flex justify-between items-center mb-4 md:mb-6">
          <div className="flex items-center gap-2 font-sans font-bold text-ink/50 text-xs md:text-sm">
             <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" /> Streak: <span className="text-crimson text-lg md:text-xl">{streak}</span>
             <span className="ml-2 md:ml-4 px-2 py-0.5 md:py-1 bg-ink/5 rounded text-[10px] md:text-xs">{gameMode} Mode</span>
          </div>
          <button onClick={() => setActiveWordInfo({ word: null, isFlipped: false })} className="text-[10px] md:text-sm font-sans font-medium text-ink/40 hover:text-ink flex items-center gap-1 md:gap-2 shrink-0">
             <RotateCcw className="w-3 h-3 md:w-4 md:h-4" /> End Session
          </button>
       </div>

       {gameMode === 'Flashcard' ? (
         <>
           {/* Flashcard */}
           <div 
             onClick={handleFlip}
             className={cn(
               "w-full aspect-auto min-h-[300px] md:aspect-[16/9] sketch-border bg-white p-4 md:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-500 preserve-3d shadow-xl",
               !isFlipped ? "hover:scale-[1.02] hover:shadow-2xl" : "cursor-default border-crimson"
             )}
           >
              <div className="space-y-1 md:space-y-2">
                <h2 className="text-3xl md:text-5xl font-sans font-black tracking-tight break-words max-w-full px-2">{word.vocabulary}</h2>
                <p className="text-base md:text-xl font-sans text-ink/60">{word.ipa} <span className="italic text-crimson mx-2">{word.wordType}</span></p>
              </div>

              <div className={cn("mt-4 md:mt-6 space-y-3 md:space-y-4 pt-4 border-t-2 border-dashed border-ink/20 w-full transition-all duration-300", isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")}>
                 <p className="text-lg md:text-xl font-sans font-medium px-2">{word.definition}</p>
                 {word.examples[0] && (
                   <p className="hand-text text-xl md:text-2xl px-2">"{word.examples[0]}"</p>
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
            <div className="sketch-border bg-white p-4 md:p-8 mb-4 md:mb-6 shadow-xl">
               <div className="mb-4 md:mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Definition</span>
                  <p className="text-base md:text-lg font-sans font-medium mt-1">{word.definition}</p>
               </div>
               
               {word.examples[0] && (
                 <div className="mb-4 md:mb-6 p-2 md:p-3 bg-ink/5 rounded-lg border border-ink/10">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Example</span>
                    <p className="hand-text text-xl md:text-2xl mt-1">"{word.examples[0].replace(new RegExp(word.vocabulary, 'gi'), '________')}"</p>
                 </div>
               )}

               <form onSubmit={handleTypingSubmit} className="mt-4 md:mt-6 flex flex-col md:flex-row gap-2 md:gap-3">
                 <input 
                   type="text"
                   disabled={feedback === 'correct'}
                   value={userInput} 
                   onChange={(e) => setUserInput(e.target.value)} 
                   placeholder="Type the word..." 
                   className={cn(
                     "sketch-input flex-1 text-lg md:text-xl font-serif text-center py-2 md:py-1",
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
                 <div className="mt-2 md:mt-4 text-center animate-in fade-in px-2">
                   <p className="text-crimson font-bold uppercase text-[9px] md:text-[10px] tracking-widest mb-0.5 md:mb-1">Incorrect</p>
                   <p className="text-base md:text-lg font-sans">The word was: <span className="font-bold text-ink text-lg md:text-xl">{word.vocabulary}</span></p>
                   <button onClick={() => selectNextWord()} className="mt-2 md:mt-3 sketch-button py-1 px-4 text-xs md:text-sm">Next Word</button>
                 </div>
               )}

               {feedback === 'correct' && (
                 <div className="mt-2 md:mt-4 text-center animate-in fade-in px-2">
                   <p className="text-green-600 font-bold uppercase text-[9px] md:text-[10px] tracking-widest mb-1 md:mb-2">Correct!</p>
                   <p className="text-base md:text-lg font-sans mb-2 md:mb-4 opacity-60">{word.ipa}</p>
                 </div>
               )}
            </div>
         </div>
       ) : gameMode === 'Dictation' ? (
         <div className="w-full">
            {/* Dictation Mode */}
            <div className="sketch-border bg-white p-4 md:p-8 mb-4 md:mb-6 shadow-xl flex flex-col items-center">
               <div className="mb-4 md:mb-6 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Listen and Type</span>
               </div>
               
               <button 
                 onClick={() => speak(word.vocabulary)}
                 className="w-20 h-20 md:w-24 md:h-24 sketch-border border-4 border-ink/20 rounded-full flex justify-center items-center hover:bg-ink/5 hover:border-ink/40 transition-colors mb-6 group cursor-pointer shadow-sm focus:outline-none"
               >
                 <span className="text-4xl group-hover:scale-110 transition-transform">🔊</span>
               </button>

               <form onSubmit={handleTypingSubmit} className="flex flex-col md:flex-row gap-2 md:gap-3 w-full">
                 <input 
                   type="text"
                   disabled={feedback === 'correct'}
                   value={userInput} 
                   onChange={(e) => setUserInput(e.target.value)} 
                   placeholder="Type what you hear..." 
                   className={cn(
                     "sketch-input flex-1 text-lg md:text-xl font-serif text-center py-2 md:py-1",
                     feedback === 'correct' ? "border-green-600 text-green-600 bg-green-50" : 
                     feedback === 'incorrect' ? "border-crimson text-crimson bg-crimson/10" : ""
                   )}
                   autoComplete="off"
                   autoFocus
                 />
                 {feedback !== 'correct' && (
                   <button type="submit" className="sketch-button sketch-button-primary px-6 py-1">Submit</button>
                 )}
               </form>
               
               {feedback === 'incorrect' && (
                 <div className="mt-2 md:mt-4 text-center animate-in fade-in px-2 w-full">
                   <p className="text-crimson font-bold uppercase text-[9px] md:text-[10px] tracking-widest mb-0.5 md:mb-1">Incorrect</p>
                   <p className="text-base md:text-lg font-sans">The word was: <span className="font-bold text-ink text-lg md:text-xl">{word.vocabulary}</span></p>
                   <div className="mt-2 bg-ink/5 p-2 rounded-lg text-left inline-block w-full text-xs">
                     <p><strong>Meaning:</strong> {word.definition}</p>
                     <p className="italic opacity-70">{word.ipa}</p>
                   </div>
                   <button onClick={() => selectNextWord()} className="mt-4 sketch-button py-1 px-4 text-xs md:text-sm">Next Word</button>
                 </div>
               )}

               {feedback === 'correct' && (
                 <div className="mt-2 md:mt-4 text-center animate-in fade-in px-2 w-full">
                   <p className="text-green-600 font-bold uppercase text-[9px] md:text-[10px] tracking-widest mb-1 md:mb-2">Correct!</p>
                   <p className="text-base md:text-lg font-sans mb-1 opacity-60">{word.ipa}</p>
                   <p className="text-sm font-sans mb-4 opacity-80">{word.definition}</p>
                 </div>
               )}
            </div>
         </div>
       ) : gameMode === 'Quiz' ? (
         <div className="w-full">
            {/* Quiz Mode */}
            <div className="sketch-border bg-white p-4 md:p-8 mb-4 md:mb-6 shadow-xl flex flex-col items-center text-center">
              <div className="mb-4 md:mb-8 text-center w-full px-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Select correct definition</span>
                <h2 className="text-3xl md:text-5xl font-sans font-black tracking-tight mt-2 md:mt-4 text-ink break-words">{word.vocabulary}</h2>
                <p className="text-base md:text-lg font-sans text-ink/60 mt-1 md:mt-2 italic">{word.ipa} • {word.wordType}</p>
              </div>

              <div className="grid grid-cols-1 gap-2 md:gap-3 w-full">
                {quizOptions.map((opt, i) => (
                  <button 
                    key={i}
                    onClick={() => handleQuizSelect(opt)}
                    className={cn(
                      "p-3 md:p-4 sketch-border text-left font-sans transition-all text-sm md:text-base",
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
            <div className="sketch-border bg-white p-4 md:p-8 mb-4 md:mb-6 shadow-xl flex flex-col items-center text-center">
              <div className="mb-4 md:mb-8 text-center w-full px-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">
                  {word.vocabulary.trim().split(/\s+/).length < 2 ? "Unscramble Letters" : "Reconstruct Sentence"}
                </span>
                <p className="text-base md:text-lg font-sans font-medium mt-1 md:mt-2">{word.definition}</p>
              </div>

              <div className="min-h-[80px] md:min-h-[100px] w-full p-2 md:p-4 bg-ink/5 rounded-xl sketch-border border-dashed border-ink/20 flex flex-wrap gap-1 md:gap-2 justify-center content-center mb-6 md:mb-8">
                {scrambleAnswer.map((w, i) => (
                  <button 
                    key={`${w}-${i}`} 
                    onClick={() => removeFromAnswer(w, i)}
                    className="px-2 py-1 md:px-4 md:py-2 bg-white sketch-border text-sm md:text-base font-sans font-bold hover:scale-105 transition-transform"
                  >
                    {w}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 md:gap-3 justify-center px-1">
                {scrambledWords.map((w, i) => (
                  <button 
                    key={`${w}-${i}`} 
                    onClick={() => toggleScrambleWord(w, i)}
                    className="px-2 py-1 md:px-4 md:py-2 bg-ink/5 sketch-border border-ink/20 text-sm md:text-base font-sans hover:bg-ink hover:text-white transition-colors"
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
