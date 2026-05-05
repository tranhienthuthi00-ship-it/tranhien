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
import type { Word, Task, WishlistItem, LogEntry, FoodPlace, ContentIdea, Asset, AssetCategory } from "./types";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  
  const [activeTab, setActiveTab] = useState<Tab>("English Hub");
  const [activeEnglishSubTab, setActiveEnglishSubTab] = useState<"Academy" | "Learning Games">("Academy");
  const [activeCollectionSubTab, setActiveCollectionSubTab] = useState<"Lists" | "Places" | "Content" | "Assets">("Lists");

  // State (loading from localStorage if available)
  const [words, setWords] = useState<Word[]>(() => {
    try {
      const saved = localStorage.getItem('spatial_hub_words');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { console.error("Error loading words", e); }
    return [
      {
        id: "1",
        vocabulary: "Itinerary",
        wordType: "noun",
        ipa: "/aɪˈtɪnəreri/",
        definition: "A planned route or journey.",
        examples: ["We will review the itinerary before the cruise departs."],
        tags: ["Tourism", "Cruise Industry"],
        difficulty: 0,
        lastReviewed: new Date().toISOString(),
        nextReview: new Date().toISOString(),
      },
      {
        id: "2",
        vocabulary: "Concierge",
        wordType: "noun",
        ipa: "/kɒnsiˈeəʒ/",
        definition: "A hotel employee whose job is to assist guests by booking tours, making theatre and restaurant reservations, etc.",
        examples: ["The concierge arranged a private tour of the city for us."],
        tags: ["Hospitality"],
        difficulty: 1,
        lastReviewed: new Date().toISOString(),
        nextReview: new Date().toISOString(),
      }
    ];
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('spatial_hub_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    try {
      const saved = localStorage.getItem('spatial_hub_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('spatial_hub_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  const [foodPlaces, setFoodPlaces] = useState<FoodPlace[]>(() => {
    try {
      const saved = localStorage.getItem('spatial_hub_places');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Migration: Add status if missing, and ensure category is valid
          return parsed.map(p => ({
            ...p,
            status: p.status || 'Visited', // Default to Visited for old entries
            category: (p.category === 'Food' || p.category === 'Cafe' || p.category === 'Dessert' || p.category === 'Travel' || p.category === 'Other') 
              ? p.category 
              : 'Other'
          }));
        }
      }
      return [];
    } catch (e) { return []; }
  });
  const [tags, setTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('spatial_hub_tags');
      return saved ? JSON.parse(saved) : ['Tourism', 'Hospitality', 'Cruise Industry'];
    } catch (e) { return ['Tourism', 'Hospitality', 'Cruise Industry']; }
  });

  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>(() => {
    try {
      const saved = localStorage.getItem('spatial_hub_content_ideas');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [assets, setAssets] = useState<Asset[]>(() => {
    try {
      const saved = localStorage.getItem('spatial_hub_assets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>(() => {
    try {
      const saved = localStorage.getItem('spatial_hub_asset_cats');
      if (saved) {
        let parsed = JSON.parse(saved);
        parsed = parsed.map((p: any) => {
            if (p.icon === '💰') return { ...p, icon: 'Wallet' };
            if (p.icon === '🏠') return { ...p, icon: 'Home' };
            if (p.icon === '🚗') return { ...p, icon: 'Car' };
            if (p.icon === '💻') return { ...p, icon: 'Laptop' };
            return p;
        });
        return parsed;
      }
      return [
        { id: 'cat-money', name: 'Tiền mặt & NH', icon: 'Wallet' },
        { id: 'cat-realestate', name: 'Bất động sản', icon: 'Home' },
        { id: 'cat-vehicles', name: 'Xe cộ', icon: 'Car' },
        { id: 'cat-tech', name: 'Công nghệ', icon: 'Laptop' }
      ];
    } catch (e) { return [
        { id: 'cat-money', name: 'Tiền mặt & NH', icon: 'Wallet' },
        { id: 'cat-realestate', name: 'Bất động sản', icon: 'Home' },
        { id: 'cat-vehicles', name: 'Xe cộ', icon: 'Car' },
        { id: 'cat-tech', name: 'Công nghệ', icon: 'Laptop' }
    ]; }
  });

  const [lastSaved, setLastSaved] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Saving to localStorage whenever state changes
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('spatial_hub_words', JSON.stringify(words));
    localStorage.setItem('spatial_hub_tasks', JSON.stringify(tasks));
    localStorage.setItem('spatial_hub_wishlist', JSON.stringify(wishlist));
    localStorage.setItem('spatial_hub_logs', JSON.stringify(logs));
    localStorage.setItem('spatial_hub_places', JSON.stringify(foodPlaces));
    localStorage.setItem('spatial_hub_tags', JSON.stringify(tags));
    localStorage.setItem('spatial_hub_content_ideas', JSON.stringify(contentIdeas));
    localStorage.setItem('spatial_hub_assets', JSON.stringify(assets));
    localStorage.setItem('spatial_hub_asset_cats', JSON.stringify(assetCategories));
    setLastSaved(new Date().toLocaleTimeString());
  }, [words, tasks, wishlist, logs, foodPlaces, tags, contentIdeas, assets, assetCategories, isLoaded]);

  const updateWordDifficulty = (id: string, newDifficulty: number) => {
    setWords(words.map(w => w.id === id ? { ...w, difficulty: newDifficulty } : w));
  };

  const handleLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen pb-20 relative overflow-x-hidden">
      <Doodles />
      <svg width="0" height="0" className="absolute pointer-events-none" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="hand-drawn-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} lastSaved={lastSaved} onLogout={handleLogout} />
      
      <main className="mt-4 relative z-10 animate-in fade-in duration-500">
        {activeTab === "English Hub" && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-center gap-4 mb-2">
              <button 
                onClick={() => setActiveEnglishSubTab("Academy")}
                className={`text-sm font-sans font-bold uppercase tracking-widest px-4 py-1 rounded-full border-2 transition-colors ${activeEnglishSubTab === "Academy" ? "bg-ink text-paper border-ink" : "text-ink/60 border-ink/20 hover:border-ink/50"}`}
              >
                Vocabulary
              </button>
              <button 
                onClick={() => setActiveEnglishSubTab("Learning Games")}
                className={`text-sm font-sans font-bold uppercase tracking-widest px-4 py-1 rounded-full border-2 transition-colors ${activeEnglishSubTab === "Learning Games" ? "bg-ink text-paper border-ink" : "text-ink/60 border-ink/20 hover:border-ink/50"}`}
              >
                Practice
              </button>
            </div>
            {activeEnglishSubTab === "Academy" && <Academy words={words} setWords={setWords} tags={tags} setTags={setTags} />}
            {activeEnglishSubTab === "Learning Games" && <LearningGames words={words} updateWordDifficulty={updateWordDifficulty} />}
          </div>
        )}
        
        {activeTab === "Collections" && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-center flex-wrap gap-2 mb-2 px-4">
              {(["Lists", "Places", "Content", "Assets"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveCollectionSubTab(tab)}
                  className={`text-xs md:text-sm font-sans font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border-2 transition-colors ${activeCollectionSubTab === tab ? "bg-ink text-paper border-ink" : "text-ink/60 border-ink/20 hover:border-ink/50"}`}
                >
                  {tab === "Content" ? "TREND / CONTENT" : tab === "Assets" ? "TÀI SẢN" : tab}
                </button>
              ))}
            </div>
            
            {activeCollectionSubTab === "Lists" && <MyList tasks={tasks} setTasks={setTasks} wishlist={wishlist} setWishlist={setWishlist} />}
            {activeCollectionSubTab === "Places" && <Places places={foodPlaces} setPlaces={setFoodPlaces} />}
            {activeCollectionSubTab === "Content" && <ContentManager ideas={contentIdeas} setIdeas={setContentIdeas} />}
            {activeCollectionSubTab === "Assets" && <AssetsManager assets={assets} setAssets={setAssets} categories={assetCategories} setCategories={setAssetCategories} />}
          </div>
        )}
        {activeTab === "Calendar" && <CalendarView logs={logs} setLogs={setLogs} />}
        {activeTab === "Dashboard" && <Progress words={words} tasks={tasks} logs={logs} />}
      </main>
    </div>
  );
}
