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
    achievements, setAchievements} = useFirebase();

  const [activeTab, setActiveTab] = useState<Tab>("Journal");
  const [activeEnglishSubTab, setActiveEnglishSubTab] = useState<"Từ Vựng" | "Luyện Tập" | "Trò Chơi">("Từ Vựng");
  const [activePracticeSubTab, setActivePracticeSubTab] = useState<"Dictation" | "Speech" | "Translation" | "Reflex" | "SRS">("Dictation");
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
              {/* GỘP ENGLISH HUB: TỪ VỰNG, LUYỆN TẬP, TRÒ CHƠI */}
              <div className="mx-auto max-w-2xl w-full px-2 mb-2">
                <div className="bg-[#fffbeb] p-2 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-sm border border-amber-200">
                  <div className="pl-2">
                    <h3 className="text-sm font-black text-amber-900 uppercase tracking-tight flex items-center justify-center sm:justify-start gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" /> English Hub
                    </h3>
                  </div>

                  <div className="flex bg-amber-100/50 p-1 rounded-xl">
                    {(["Từ Vựng", "Luyện Tập", "Trò Chơi"] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveEnglishSubTab(tab)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeEnglishSubTab === tab ? "bg-amber-500 text-white shadow-sm" : "text-amber-800/60 hover:text-amber-700 hover:bg-amber-100"}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-tabs for Practice Module */}
                {activeEnglishSubTab === "Luyện Tập" && (
                  <div className="flex justify-center flex-wrap gap-2 mt-3 animate-in slide-in-from-top-2">
                    {[
                      { id: "Dictation", label: "🎧 Chép chính tả", name: "Dictation" },
                      { id: "Speech", label: "🎙️ Phát âm", name: "Speech" },
                      { id: "Translation", label: "🔤 Dịch thuật", name: "Translation" },
                      { id: "Reflex", label: "⚡ Phản xạ", name: "Reflex" },
                      { id: "SRS", label: "🧠 Ghi nhớ (SRS)", name: "SRS" },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActivePracticeSubTab(tab.id as any)}
                        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border-2 transition-all ${activePracticeSubTab === tab.id ? "bg-white text-ink border-ink" : "bg-white/50 text-ink/40 border-transparent hover:border-ink/20"}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="max-w-7xl mx-auto w-full px-2 md:px-6">
              {activeEnglishSubTab === "Từ Vựng" && <Academy words={words} setWords={setWords} tags={tags} setTags={setTags} />}
              {activeEnglishSubTab === "Trò Chơi" && <LearningGames words={words} updateWordDifficulty={updateWordDifficulty} setActiveEnglishSubTab={(val) => {
                if(val === "Academy") setActiveEnglishSubTab("Từ Vựng");
                else { setActiveEnglishSubTab("Luyện Tập"); setActivePracticeSubTab(val as any); }
              }} />}
              
              {activeEnglishSubTab === "Luyện Tập" && (
                <>
                  {activePracticeSubTab === "Dictation" && <YouTubeDictation dictations={dictations} setDictations={setDictations} words={words} setWords={setWords} />}
                  {activePracticeSubTab === "Speech" && <SpeechGame words={words} updateWordDifficulty={updateWordDifficulty} />}
                  {activePracticeSubTab === "Translation" && <TranslationPractice words={words} setWords={setWords} />}
                  {activePracticeSubTab === "Reflex" && <ReflexPractice />}
                  {activePracticeSubTab === "SRS" && <Flashcards words={words} setWords={setWords} />}
                </>
              )}
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
                    logs={logs}
                    setLogs={setLogs}
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
          {activeTab === "Journal" && (
            <DigitalJournal 
              logs={logs} 
              setLogs={setLogs} 
              wishlist={wishlist} 
              assets={assets} 
              setAssets={setAssets}
              categories={assetCategories}
              words={words} 
              places={foodPlaces} 
              setPlaces={setFoodPlaces} 
              ideas={contentIdeas} 
              tasks={tasks} 
              setTasks={setTasks} 
              achievements={achievements} 
              goals={studyGoals} 
              
            />
          )}
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
