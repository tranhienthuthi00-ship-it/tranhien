import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
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
import { PictureDescriptionPractice } from "./components/PictureDescriptionPractice";
import { HabitTracker } from "./components/HabitTracker";
import { DigitalJournal } from "./components/DigitalJournal";
import { FirebaseProvider, useFirebase } from "./context/FirebaseContext";
import { BookText, Gamepad2, Headphones, Mic, Loader2, ClipboardList, MapPin, Lightbulb, Wallet, Brain, Languages, Target, Sparkles, Flame, Search, X } from "lucide-react";

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
    achievements, setAchievements,
    bulkDebts, setBulkDebts,
    bulkCardSpends, setBulkCardSpends,
    bulkCurrentCash, setBulkCurrentCash
  } = useFirebase();

  // AUTOMATIC SYNC: Update bulk card spends credit card debt into the central assets state
  useEffect(() => {
    if (!setAssets || !assets) return;
    try {
      const validSpends = bulkCardSpends.filter(d => d.amount.trim() && !isNaN(parseFloat(d.amount.replace(/,/g, ''))));
      const totalSum = validSpends.reduce((sum, d) => sum + parseFloat(d.amount.replace(/,/g, '')), 0);
      const absTotalSum = Math.abs(totalSum);

      const existingDebtIdx = assets.findIndex(a => a.id === "card-debt-auto-sync");

      if (absTotalSum === 0) {
        if (existingDebtIdx !== -1) {
          setAssets(assets.filter(a => a.id !== "card-debt-auto-sync"));
        }
        return;
      }

      const catId = assetCategories.find(c => 
        c.name.toLowerCase().includes("ngân hàng") || 
        c.name.toLowerCase().includes("bank") || 
        c.name.toLowerCase().includes("landmark")
      )?.id || assetCategories.find(c => 
        c.name.toLowerCase().includes("tín dụng") || 
        c.name.toLowerCase().includes("thẻ") || 
        c.name.toLowerCase().includes("credit") || 
        c.name.toLowerCase().includes("nợ")
      )?.id || (assetCategories.length > 0 ? assetCategories[0].id : '');

      const formatDateHelper = (ymd: string) => {
        try {
          const parts = ymd.split("-");
          return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ymd;
        } catch {
          return ymd;
        }
      };

      const detailNotesList = validSpends.map(d => {
        const val = parseFloat(d.amount.replace(/,/g, ''));
        const dayNote = d.notes && d.notes.trim() ? ` - [Ghi chú: ${d.notes.trim()}]` : "";
        return `• ${formatDateHelper(d.name)}: ${val.toLocaleString('vi-VN')} đ${dayNote}`;
      }).join("\n");

      const activeDates = bulkCardSpends
        .map(d => d.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      
      let dateRangeText = "";
      if (activeDates.length > 0) {
        const formatDateStr = (ymd: string) => {
          const parts = ymd.split("-");
          return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ymd;
        };
        dateRangeText = ` (${formatDateStr(activeDates[0])} - ${formatDateStr(activeDates[activeDates.length - 1])})`;
      }

      const updatedDebtAsset: any = {
        id: "card-debt-auto-sync",
        name: `Nợ thẻ tín dụng${dateRangeText} (Tự động)`,
        category: catId,
        value: absTotalSum,
        currency: "VND",
        notes: `Dư nợ tín dụng tổng hợp tự động từ chi tiết bảng kê hàng ngày:\n${detailNotesList}`,
        acquiredAt: Date.now(),
        isDebt: true,
        isNewMoney: false,
        excludeFromNetWorth: false
      };

      if (existingDebtIdx === -1) {
        setAssets([updatedDebtAsset, ...assets]);
      } else {
        const existing = assets[existingDebtIdx];
        if (existing.value !== updatedDebtAsset.value || existing.notes !== updatedDebtAsset.notes || existing.name !== updatedDebtAsset.name || existing.category !== updatedDebtAsset.category) {
          const updatedList = [...assets];
          updatedList[existingDebtIdx] = {
            ...existing,
            name: updatedDebtAsset.name,
            value: updatedDebtAsset.value,
            notes: updatedDebtAsset.notes,
            category: updatedDebtAsset.category
          };
          setAssets(updatedList);
        }
      }
    } catch (err) {
      console.error("Lỗi tự động đồng bộ nợ thẻ tín dụng:", err);
    }
  }, [bulkCardSpends, assetCategories, assets, setAssets]);

  // AUTOMATIC SYNC: Update bulk debts (Doanh thu / Bảng kê nợ) into the central assets state
  useEffect(() => {
    if (!setAssets || !assets) return;
    try {
      const validDebts = bulkDebts.filter(d => d.amount.trim() && !isNaN(parseFloat(d.amount.replace(/,/g, ''))));
      const totalSum = validDebts.reduce((sum, d) => sum + parseFloat(d.amount.replace(/,/g, '')), 0);
      const absTotalSum = Math.abs(totalSum);

      const existingDebtIdx = assets.findIndex(a => a.id === "revenue-debt-auto-sync");

      if (absTotalSum === 0) {
        if (existingDebtIdx !== -1) {
          setAssets(assets.filter(a => a.id !== "revenue-debt-auto-sync"));
        }
        return;
      }

      const isLoan = totalSum < 0;
      const isDebt = totalSum > 0;

      // Ensure appropriate category is used
      let catId = assetCategories.find(c => 
        c.name.toLowerCase().includes(isLoan ? "cho vay" : "nợ") ||
        c.name.toLowerCase().includes("tiền mặt") ||
        c.name.toLowerCase().includes("doanh thu")
      )?.id;

      if (!catId) catId = assetCategories.length > 0 ? assetCategories[0].id : '';

      const formatDateHelper = (ymd: string) => {
        try {
          const parts = ymd.split("-");
          return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ymd;
        } catch {
          return ymd;
        }
      };

      const detailNotesList = validDebts.map(d => {
        const val = parseFloat(d.amount.replace(/,/g, ''));
        const dayNote = d.notes && d.notes.trim() ? ` - [Ghi chú: ${d.notes.trim()}]` : "";
        return `• ${formatDateHelper(d.name)}: ${val >= 0 ? "+" : ""}${val.toLocaleString('vi-VN')} đ${dayNote}`;
      }).join("\n");

      const activeDates = bulkDebts
        .map(d => d.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      
      let dateRangeText = "";
      if (activeDates.length > 0) {
        const formatDateStr = (ymd: string) => {
          const parts = ymd.split("-");
          return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ymd;
        };
        dateRangeText = ` (${formatDateStr(activeDates[0])} - ${formatDateStr(activeDates[activeDates.length - 1])})`;
      }

      const updatedDebtAsset: any = {
        id: "revenue-debt-auto-sync",
        name: isLoan ? `Cho vay doanh thu${dateRangeText} (Tự động)` : `Nợ doanh thu${dateRangeText} (Tự động)`,
        category: catId,
        value: absTotalSum,
        currency: "VND",
        notes: `Tích lũy tự động từ chi tiết bảng kê hàng ngày:\n${detailNotesList}`,
        acquiredAt: Date.now(),
        isDebt: isDebt,
        isLoan: isLoan,
        isNewMoney: false,
        excludeFromNetWorth: false
      };

      if (existingDebtIdx === -1) {
        setAssets([updatedDebtAsset, ...assets]);
      } else {
        const existing = assets[existingDebtIdx];
        if (
          existing.value !== updatedDebtAsset.value || 
          existing.notes !== updatedDebtAsset.notes || 
          existing.name !== updatedDebtAsset.name || 
          existing.category !== updatedDebtAsset.category || 
          existing.isDebt !== updatedDebtAsset.isDebt ||
          existing.isLoan !== updatedDebtAsset.isLoan
        ) {
          const updatedList = [...assets];
          updatedList[existingDebtIdx] = {
            ...existing,
            ...updatedDebtAsset
          };
          setAssets(updatedList);
        }
      }
    } catch (err) {
      console.error("Lỗi tự động đồng bộ doanh thu nợ:", err);
    }
  }, [bulkDebts, assetCategories, assets, setAssets]);

  // AUTOMATIC SYNC: Update bulk current cash (Bảng kê tiền mặt đang có) into the central assets state
  useEffect(() => {
    if (!setAssets || !assets) return;
    try {
      const denominations = [500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000];
      const totalSum = denominations.reduce((sum, den) => {
        const val = bulkCurrentCash[den] || 0;
        return sum + (den * val);
      }, 0);

      const existingCashIdx = assets.findIndex(a => a.id === "current-cash-auto-sync");

      if (totalSum === 0) {
        if (existingCashIdx !== -1) {
          setAssets(assets.filter(a => a.id !== "current-cash-auto-sync"));
        }
        return;
      }

      const catId = assetCategories.find(c => 
        c.name.toLowerCase().includes("tiền mặt") || 
        c.name.toLowerCase().includes("tiền") || 
        c.name.toLowerCase().includes("wallet")
      )?.id || "cat-money";

      const detailNotesList = denominations.map(den => {
        const qty = bulkCurrentCash[den] || 0;
        if (qty <= 0) return null;
        return `• ${den.toLocaleString('vi-VN')} đ: ${qty} tờ = ${(den * qty).toLocaleString('vi-VN')} đ`;
      }).filter(Boolean).join("\n");

      const updatedCashAsset: any = {
        id: "current-cash-auto-sync",
        name: `Tiền mặt đang có (Bảng kê tự động)`,
        category: catId,
        value: totalSum,
        currency: "VND",
        notes: `Tổng tiền mặt đang có từ bảng kê chi tiết:\n${detailNotesList}`,
        acquiredAt: Date.now(),
        isDebt: false,
        isNewMoney: false,
        excludeFromNetWorth: false
      };

      if (existingCashIdx === -1) {
        setAssets([updatedCashAsset, ...assets]);
      } else {
        const existing = assets[existingCashIdx];
        if (existing.value !== updatedCashAsset.value || existing.notes !== updatedCashAsset.notes || existing.name !== updatedCashAsset.name || existing.category !== updatedCashAsset.category) {
          const updatedList = [...assets];
          updatedList[existingCashIdx] = {
            ...existing,
            name: updatedCashAsset.name,
            value: updatedCashAsset.value,
            notes: updatedCashAsset.notes,
            category: updatedCashAsset.category
          };
          setAssets(updatedList);
        }
      }
    } catch (err) {
      console.error("Lỗi tự động đồng bộ tiền mặt đang có:", err);
    }
  }, [bulkCurrentCash, assetCategories, assets, setAssets]);

  const [theme, setTheme] = useState<"handdrawn" | "minimal">(() => {
    return (localStorage.getItem("glowup_theme") as "handdrawn" | "minimal") || "handdrawn";
  });

  const [activeTab, setActiveTab] = useState<Tab>("Journal");
  const [collectionSearchQuery, setCollectionSearchQuery] = useState("");
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
    <div className={cn("min-h-screen pb-20 relative overflow-x-clip w-full transition-colors duration-300", theme === "minimal" ? "theme-minimal" : "")}>
      {theme !== "minimal" && <Doodles />}
      <svg width="0" height="0" className="absolute pointer-events-none" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="hand-drawn-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <NavBar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        lastSaved={lastSaved} 
        onLogout={handleLogout} 
        dueCount={dueCount} 
        theme={theme}
        onToggleTheme={() => {
          const nextTheme = theme === "handdrawn" ? "minimal" : "handdrawn";
          setTheme(nextTheme);
          localStorage.setItem("glowup_theme", nextTheme);
        }}
      />
      
      <main className="mt-4 relative z-10 overflow-x-clip w-full">
        <div className="max-w-[100vw] px-1 sm:px-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
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
                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 outline-none focus:outline-none focus:ring-0 ${activeEnglishSubTab === tab ? "bg-amber-500 text-white shadow-sm" : "text-amber-800/60 hover:text-amber-700 hover:bg-amber-100"}`}
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
                      { id: "Picture", label: "🖼️ Miêu tả tranh", name: "Picture" },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActivePracticeSubTab(tab.id as any)}
                        className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border-2 transition-all outline-none focus:outline-none focus:ring-0 ${activePracticeSubTab === tab.id ? "bg-white text-ink border-ink" : "bg-white/50 text-ink/40 border-transparent hover:border-ink/20"}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full px-2 md:px-6">
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
                  {activePracticeSubTab === "Picture" && <PictureDescriptionPractice />}
                </>
              )}
            </div>
          </div>
        )}
        
        {activeTab === "Collections" && (
          <div className="flex flex-col gap-4">
            <div className="max-w-md mx-auto w-full px-4 mb-2">
              <div className="flex items-center bg-[#f8f5ed] border-2 border-[#3A1412] px-4 py-2 rounded-xl shadow-[3px_3px_0px_#3A1412]">
                <Search className="w-5 h-5 text-[#3A1412] mr-2" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm..." 
                  value={collectionSearchQuery} 
                  onChange={e => setCollectionSearchQuery(e.target.value)}
                  className="bg-transparent outline-none flex-1 text-sm font-hand font-bold text-[#3A1412] placeholder-[#3A1412]/50" 
                />
                {collectionSearchQuery && (
                  <button onClick={() => setCollectionSearchQuery("")} className="ml-2 hover:scale-110">
                    <X className="w-4 h-4 text-[#3A1412]/50" />
                  </button>
                )}
              </div>
            </div>
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
                  {tab === "Lists" && "MỤC TIÊU & NHIỆM VỤ"}
                  {tab === "Habits" && "HÀNH TRÌNH GLOW UP"}
                  {tab === "Places" && "ĐỊA ĐIỂM & ĂN UỐNG"}
                  {tab === "Content" && "Ý TƯỞNG & SÁNG TẠO"}
                  {tab === "Assets" && "TÀI SẢN & TÀI CHÍNH"}
                </button>
              ))}
            </div>
            
            <div className="w-full px-2 md:px-6">
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
                    wishlist={wishlist}
                    setWishlist={setWishlist}
                  />
                  <div className="sketch-border-sm border-t-8 border-ink/5 pt-12">
                    <MyList 
                      wishlist={wishlist} 
                      setWishlist={setWishlist} 
                      tasks={tasks}
                      setTasks={setTasks}
                    />
                  </div>
                </div>
              )}
              {activeCollectionSubTab === "Habits" && <HabitTracker logs={logs} setLogs={setLogs} />}
              {activeCollectionSubTab === "Places" && <Places places={foodPlaces} setPlaces={setFoodPlaces} />}
              {activeCollectionSubTab === "Content" && <ContentManager ideas={contentIdeas} setIdeas={setContentIdeas} />}
              {activeCollectionSubTab === "Assets" && <AssetsManager assets={assets} setAssets={setAssets} categories={assetCategories} setCategories={setAssetCategories} bulkDebts={bulkDebts} setBulkDebts={setBulkDebts} bulkCardSpends={bulkCardSpends} setBulkCardSpends={setBulkCardSpends} bulkCurrentCash={bulkCurrentCash} setBulkCurrentCash={setBulkCurrentCash} />}
            </div>
          </div>
        )}
        <div className="w-full px-2 md:px-6">
          {activeTab === "Calendar" && <CalendarView logs={logs} setLogs={setLogs} />}
          {activeTab === "Journal" && (
            <DigitalJournal 
              onSearch={(q) => {
                setCollectionSearchQuery(q);
                setActiveTab("Collections");
              }}
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
              setGoals={setStudyGoals}
              bulkDebts={bulkDebts}
              setBulkDebts={setBulkDebts}
              bulkCardSpends={bulkCardSpends}
              setBulkCardSpends={setBulkCardSpends}
              bulkCurrentCash={bulkCurrentCash}
              setBulkCurrentCash={setBulkCurrentCash}
            />
          )}
        </div>
            </motion.div>
          </AnimatePresence>
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
