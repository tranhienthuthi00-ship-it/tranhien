import { useState, useEffect } from "react";
import { NavBar, type Tab } from "./components/NavBar";
import { Academy } from "./components/Academy";
import { MyList } from "./components/MyList";
import { CalendarView } from "./components/CalendarView";
import { LearningGames } from "./components/LearningGames";
import { Progress } from "./components/Progress";
import { Places } from "./components/Places";
import { Doodles } from "./components/Doodles";
import { Login } from "./components/Login";
import { ContentManager } from "./components/ContentManager";
import { AssetsManager } from "./components/AssetsManager";
import { YouTubeDictation } from "./components/YouTubeDictation";
import { PersonalGoals } from "./components/PersonalGoals";
import { SpeechGame } from "./components/SpeechGame";
import { TranslationPractice } from "./components/TranslationPractice";
import { ReflexPractice } from "./components/ReflexPractice";
import Flashcards from "./components/Flashcards";
import { HabitTracker } from "./components/HabitTracker";
import { DigitalJournal } from "./components/DigitalJournal";
import { FirebaseProvider, useFirebase } from "./context/FirebaseContext";
import { BookText, Gamepad2, Headphones, Mic, Loader2, ClipboardList, MapPin, Lightbulb, Wallet, Brain, Languages, Target, Sparkles, Flame } from "lucide-react";

function AppContent() {
  const {
    user, loading,
    words, setWords,
    tasks, setTasks,
    wishlist, setWishlist,
    logs, setLogs,
    foodPlaces, setFoodPlaces,
    tags, setTags,
    contentIdeas, setContentIdeas,
    assets, setAssets,
    assetCategories, setAssetCategories,
    dictations, setDictations,
    practiceParagraphs, setPracticeParagraphs,
    studyGoals, setStudyGoals,
    achievements, setAchievements
  } = useFirebase();

  const [activeTab, setActiveTab] = useState<Tab>("English Hub");
  const [activeEnglishSubTab, setActiveEnglishSubTab] = useState<"Academy" | "Learning Games" | "Dictation" | "Speech" | "SRS" | "Translation" | "Reflex">("Academy");
  const [activeCollectionSubTab, setActiveCollectionSubTab] = useState<"Lists" | "Habits" | "Places" | "Content" | "Assets">("Lists");

  const [lastSaved, setLastSaved] = useState<string>("Synced");

  const updateWordDifficulty = (id: string, newDifficulty: number) => {
    const w = words.find(x => x.id === id);
    if (!w) return;

    let nextReviewDate = new Date();
    // Spaced repetition logic
    if (newDifficulty === 1) { // Easy
      nextReviewDate.setDate(nextReviewDate.getDate() + 4); 
    } else if (newDifficulty === 2) { // Good
      nextReviewDate.setDate(nextReviewDate.getDate() + 1); 
    } else if (newDifficulty === 3) { // Hard / Incorrect
      nextReviewDate.setHours(nextReviewDate.getHours() + 12); 
    }

    setWords([...words.filter(x => x.id !== id), { 
      ...w, 
      difficulty: newDifficulty,
      lastReviewed: new Date().toISOString(),
      nextReview: nextReviewDate.toISOString()
    }]);
  };

  const handleLogin = () => {
    // Rely on onAuthStateChanged in useFirebaseSync
  };

  const handleLogout = async () => {
    const { auth } = await import("./lib/firebase");
    auth.signOut();
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f1ea]">
        <div className="flex flex-col items-center gap-4 text-ink">
          <Loader2 className="animate-spin" size={40} />
          <p className="hand-text text-xl">Loading your space...</p>
        </div>
      </div>
    );
  }

  const dueCount = words.filter(w => new Date(w.nextReview) <= new Date()).length;

  return (
    <div className="min-h-screen pb-20 relative overflow-x-clip w-full">
      <Doodles />
      <svg width="0" height="0" className="absolute pointer-events-none" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="hand-drawn-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} lastSaved={lastSaved} onLogout={handleLogout} dueCount={dueCount} />
      
      <main className="mt-4 relative z-10 animate-in fade-in duration-500 overflow-x-clip w-full">
        <div className="max-w-[100vw] px-1 sm:px-2">
          {activeTab === "English Hub" && (
            <div className="flex flex-col gap-4">
              <div className="bg-paper py-2 flex justify-center gap-1.5 md:gap-4 mb-2 px-1 md:px-4 flex-wrap max-w-full">
                <button 
                  onClick={() => setActiveEnglishSubTab("Academy")}
                  className={`text-[10px] md:text-sm font-sans font-bold uppercase tracking-widest px-2.5 md:px-4 py-1.5 rounded-full border-2 transition-all flex items-center gap-1.5 md:gap-2 shrink-0 ${activeEnglishSubTab === "Academy" ? "bg-ink text-paper border-ink scale-105 shadow-md" : "text-ink/60 border-ink/20 hover:border-ink/50"}`}
                >
                <BookText className="w-4 h-4" style={{ filter: 'url(#hand-drawn-filter)' }} />
                Vocab
              </button>
              <button 
                onClick={() => setActiveEnglishSubTab("Learning Games")}
                className={`text-[10px] md:text-sm font-sans font-bold uppercase tracking-widest px-2.5 md:px-4 py-1.5 rounded-full border-2 transition-all flex items-center gap-1.5 md:gap-2 shrink-0 ${activeEnglishSubTab === "Learning Games" ? "bg-ink text-paper border-ink scale-105 shadow-md" : "text-ink/60 border-ink/20 hover:border-ink/50"}`}
              >
                <Gamepad2 className="w-4 h-4" style={{ filter: 'url(#hand-drawn-filter)' }} />
                Practice
              </button>
              <button 
                onClick={() => setActiveEnglishSubTab("Dictation")}
                className={`text-[10px] md:text-sm font-sans font-bold uppercase tracking-widest px-2.5 md:px-4 py-1.5 rounded-full border-2 transition-all flex items-center gap-1.5 md:gap-2 shrink-0 ${activeEnglishSubTab === "Dictation" ? "bg-ink text-paper border-ink scale-105 shadow-md" : "text-ink/60 border-ink/20 hover:border-ink/50"}`}
                >
                <Headphones className="w-4 h-4" style={{ filter: 'url(#hand-drawn-filter)' }} />
                Dictation
              </button>
              <button 
                onClick={() => setActiveEnglishSubTab("Speech")}
                className={`text-[10px] md:text-sm font-sans font-bold uppercase tracking-widest px-2.5 md:px-4 py-1.5 rounded-full border-2 transition-all flex items-center gap-1.5 md:gap-2 shrink-0 ${activeEnglishSubTab === "Speech" ? "bg-ink text-paper border-ink scale-105 shadow-md" : "text-ink/60 border-ink/20 hover:border-ink/50"}`}
              >
                <Mic className="w-4 h-4" style={{ filter: 'url(#hand-drawn-filter)' }} />
                Speech
              </button>
              <button 
                onClick={() => setActiveEnglishSubTab("Translation")}
                className={`text-[10px] md:text-sm font-sans font-bold uppercase tracking-widest px-2.5 md:px-4 py-1.5 rounded-full border-2 transition-all flex items-center gap-1.5 md:gap-2 shrink-0 ${activeEnglishSubTab === "Translation" ? "bg-ink text-paper border-ink scale-105 shadow-md" : "text-ink/60 border-ink/20 hover:border-ink/50"}`}
              >
                <Languages className="w-4 h-4" style={{ filter: 'url(#hand-drawn-filter)' }} />
                Translation
              </button>
              <button 
                onClick={() => setActiveEnglishSubTab("Reflex")}
                className={`text-[10px] md:text-sm font-sans font-bold uppercase tracking-widest px-2.5 md:px-4 py-1.5 rounded-full border-2 transition-all flex items-center gap-1.5 md:gap-2 shrink-0 ${activeEnglishSubTab === "Reflex" ? "bg-ink text-paper border-ink scale-105 shadow-md" : "text-ink/60 border-ink/20 hover:border-ink/50"}`}
              >
                <Sparkles className="w-4 h-4" style={{ filter: 'url(#hand-drawn-filter)' }} />
                Reflex
              </button>
              <button 
                onClick={() => setActiveEnglishSubTab("SRS")}
                className={`text-[10px] md:text-sm font-sans font-bold uppercase tracking-widest px-2.5 md:px-4 py-1.5 rounded-full border-2 transition-all flex items-center gap-1.5 md:gap-2 shrink-0 ${activeEnglishSubTab === "SRS" ? "bg-crimson text-white border-crimson scale-105 shadow-md" : "text-ink/60 border-ink/20 hover:border-ink/50"}`}
              >
                <Brain className="w-4 h-4" />
                SRS
              </button>
            </div>
            <div className="max-w-7xl mx-auto w-full px-2 md:px-6">
              {activeEnglishSubTab === "Academy" && <Academy words={words} setWords={setWords} tags={tags} setTags={setTags} />}
              {activeEnglishSubTab === "Learning Games" && <LearningGames words={words} updateWordDifficulty={updateWordDifficulty} setActiveEnglishSubTab={setActiveEnglishSubTab} />}
              {activeEnglishSubTab === "Dictation" && <YouTubeDictation dictations={dictations} setDictations={setDictations} words={words} setWords={setWords} />}
              {activeEnglishSubTab === "Speech" && <SpeechGame words={words} updateWordDifficulty={updateWordDifficulty} />}
              {activeEnglishSubTab === "Translation" && <TranslationPractice words={words} setWords={setWords} />}
              {activeEnglishSubTab === "Reflex" && <ReflexPractice />}
              {activeEnglishSubTab === "SRS" && <Flashcards words={words} setWords={setWords} />}
            </div>
          </div>
        )}
        
        {activeTab === "Collections" && (
          <div className="flex flex-col gap-4">
            <div className="bg-paper py-2 flex justify-center flex-wrap gap-1.5 md:gap-4 mb-2 px-1 md:px-4 text-ink/60 max-w-full">
              {(["Lists", "Habits", "Places", "Content", "Assets"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveCollectionSubTab(tab)}
                  className={`text-[10px] md:text-sm font-sans font-bold uppercase tracking-widest px-3 md:px-4 py-1.5 rounded-full border-2 transition-all flex items-center gap-1.5 md:gap-2 shrink-0 ${activeCollectionSubTab === tab ? "bg-ink text-paper border-ink scale-105 shadow-md" : "border-ink/20 hover:border-ink/50"}`}
                >
                  {tab === "Lists" && <ClipboardList className="w-4 h-4" style={{ filter: 'url(#hand-drawn-filter)' }} />}
                  {tab === "Habits" && <Flame className="w-4 h-4 text-orange-500" style={{ filter: 'url(#hand-drawn-filter)' }} />}
                  {tab === "Places" && <MapPin className="w-4 h-4" style={{ filter: 'url(#hand-drawn-filter)' }} />}
                  {tab === "Content" && <Lightbulb className="w-4 h-4" style={{ filter: 'url(#hand-drawn-filter)' }} />}
                  {tab === "Assets" && <Wallet className="w-4 h-4" style={{ filter: 'url(#hand-drawn-filter)' }} />}
                  {tab === "Content" ? "TREND / CONTENT" : tab === "Assets" ? "TÀI SẢN" : tab === "Habits" ? "THÓI QUEN / LỊCH TRÌNH" : tab}
                </button>
              ))}
            </div>
            
            <div className="max-w-7xl mx-auto w-full px-2 md:px-6">
              {activeCollectionSubTab === "Lists" && (
                <div className="max-w-5xl mx-auto space-y-12">
                  <PersonalGoals 
                    goals={studyGoals} 
                    setGoals={setStudyGoals} 
                    achievements={achievements} 
                    setAchievements={setAchievements}
                    tasks={tasks}
                    setTasks={setTasks}
                  />
                  <div className="sketch-border-sm border-t-8 border-ink/5 pt-12">
                    <MyList wishlist={wishlist} setWishlist={setWishlist} />
                  </div>
                </div>
              )}
              {activeCollectionSubTab === "Habits" && <HabitTracker logs={logs} setLogs={setLogs} />}
              {activeCollectionSubTab === "Places" && <Places places={foodPlaces} setPlaces={setFoodPlaces} />}
              {activeCollectionSubTab === "Content" && <ContentManager ideas={contentIdeas} setIdeas={setContentIdeas} />}
              {activeCollectionSubTab === "Assets" && <AssetsManager assets={assets} setAssets={setAssets} categories={assetCategories} setCategories={setAssetCategories} />}
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto w-full px-2 md:px-6">
          {activeTab === "Calendar" && <CalendarView logs={logs} setLogs={setLogs} />}
          {activeTab === "Dashboard" && <Progress words={words} tasks={tasks} logs={logs} wishlist={wishlist} goals={studyGoals} assets={assets} />}
          {activeTab === "Journal" && <DigitalJournal logs={logs} wishlist={wishlist} assets={assets} words={words} places={foodPlaces} ideas={contentIdeas} tasks={tasks} achievements={achievements} goals={studyGoals} />}
        </div>
      </div>
    </main>
  </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
