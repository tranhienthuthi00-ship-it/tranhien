import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db, auth } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import type { Word, Task, WishlistItem, LogEntry, FoodPlace, ContentIdea, Asset, AssetCategory, VideoDictation, CustomSentence, PracticeParagraph, StudyGoal, Achievement, WritingSentence, KanbanTask } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("localStorage.getItem failed for key: " + key, e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("localStorage.setItem failed for key: " + key, e);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("localStorage.removeItem failed for key: " + key, e);
    }
  }
};

const DEFAULT_KANBAN_TASKS: KanbanTask[] = [
  {
    id: "kb-1",
    title: "🎯 Lập kế hoạch học Tiếng Anh hàng tuần",
    tag: "Học tập",
    hashtags: ["#tienganh", "#kehoach"],
    priority: "Cao",
    status: "todo",
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    desc: "Ôn tập 50 từ vựng chuyên ngành du lịch và làm bài tập chép chính tả trên YouTube.",
    subtasks: [
      { date: new Date().toLocaleDateString("vi-VN"), text: "Học 10 từ vựng mới", money: 0 },
      { date: new Date().toLocaleDateString("vi-VN"), text: "Nghe bài Dictation 15 phút", money: 0 }
    ]
  },
  {
    id: "kb-2",
    title: "💼 Hoàn thiện sơ yếu lý lịch & Portfolio",
    tag: "Công việc",
    hashtags: ["#cv", "#career"],
    priority: "Trung bình",
    status: "doing",
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
    desc: "Cập nhật các dự án cá nhân, chứng chỉ và kinh nghiệm làm việc mới nhất.",
    subtasks: [
      { date: new Date().toLocaleDateString("vi-VN"), text: "Viết phần giới thiệu bản thân", money: 0 },
      { date: new Date().toLocaleDateString("vi-VN"), text: "Thiết kế file PDF chuẩn", money: 0 }
    ]
  },
  {
    id: "kb-3",
    title: "🛒 Mua sắm dụng cụ học tập & Tài liệu",
    tag: "Cá nhân",
    hashtags: ["#shopping", "#books"],
    priority: "Thấp",
    status: "done",
    dueDate: new Date().toISOString().split("T")[0],
    desc: "Mua sổ ghi chép, bút nhớ dòng và sách luyện đọc hiểu.",
    subtasks: [
      { date: new Date().toLocaleDateString("vi-VN"), text: "Sổ tay A5 chống lóa", money: 45000 }
    ]
  }
];

const DEFAULT_WORDS: Word[] = [
  {
    id: "w-1",
    vocabulary: "Hospitality",
    wordType: "noun",
    ipa: "/ˌhɒspɪˈtæləti/",
    definition: "Lòng hiếu khách, ngành dịch vụ khách sạn - nhà hàng",
    examples: ["The hotel is famous for its warm hospitality."],
    tags: ["Hospitality"],
    difficulty: 1,
    lastReviewed: new Date().toISOString(),
    nextReview: new Date(Date.now() + 86400000).toISOString()
  },
  {
    id: "w-2",
    vocabulary: "Itinerary",
    wordType: "noun",
    ipa: "/aɪˈtɪnərəri/",
    definition: "Lịch trình chuyến đi, hành trình du lịch",
    examples: ["We received our detailed travel itinerary."],
    tags: ["Tourism"],
    difficulty: 2,
    lastReviewed: new Date().toISOString(),
    nextReview: new Date(Date.now() + 86400000).toISOString()
  }
];

const DEFAULT_TASKS: Task[] = [
  { id: "t-1", content: "Luyện đọc 1 bài báo Tiếng Anh", completed: false, priority: "High" },
  { id: "t-2", content: "Ôn tập 10 từ vựng Flashcard", completed: true, priority: "Medium" },
  { id: "t-3", content: "Ghi nhật ký học tập ngày hôm nay", completed: false, priority: "Medium" }
];

const DEFAULT_HABITS = [
  {
    id: "h-water",
    name: "Uống nước 2L mỗi ngày",
    icon: "🥤",
    category: "Sức khỏe",
    reminderTimes: ["08:00", "11:00", "14:00", "17:00", "20:00"],
    daysOfWeek: [],
    streak: 3,
    maxStreak: 12,
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    isActive: true,
    lastCompletedDate: new Date().toISOString().split('T')[0],
    history: {}
  },
  {
    id: "h-english",
    name: "Học 10 từ vựng Tiếng Anh",
    icon: "🇬🇧",
    category: "Học tập",
    reminderTimes: ["08:30", "20:30"],
    daysOfWeek: [],
    streak: 5,
    maxStreak: 15,
    createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
    isActive: true,
    lastCompletedDate: new Date().toISOString().split('T')[0],
    history: {}
  }
];

const DEFAULT_WISHLIST: WishlistItem[] = [
  {
    id: "wish-1",
    content: "Tai nghe chống ồn Sony WH-1000XM5",
    addedDate: new Date().toISOString().split('T')[0],
    price: 7500000,
    necessity: "High",
    note: "Phục vụ việc tập trung học tập và nghe Tiếng Anh ở nơi công cộng",
    isWorthBuying: true
  }
];

const DEFAULT_LOGS: LogEntry[] = [
  {
    id: "log-1",
    date: new Date().toISOString().split('T')[0],
    content: "Bắt đầu mục tiêu nâng cao trình độ Tiếng Anh và quản lý tài chính cá nhân.",
    type: "Reflection",
    emoji: "🚀"
  }
];

const DEFAULT_FOOD_PLACES: FoodPlace[] = [
  {
    id: "fp-1",
    name: "Phở Thìn Hà Nội",
    category: "Food",
    status: "Visited",
    rating: 5,
    city: "Hà Nội",
    address: "13 Lò Đúc, Hai Bà Trưng",
    review: "Nước dùng đậm đà, thịt bò tái lăn rất thơm ngon.",
    isFavorite: true
  }
];

const DEFAULT_CONTENT_IDEAS: ContentIdea[] = [
  {
    id: "ci-1",
    title: "10 Cụm từ Tiếng Anh hay nhất trong ngành Du lịch",
    description: "Tổng hợp các mẫu câu giao tiếp tự nhiên cho nhân viên khách sạn.",
    platform: "TikTok / Reels",
    status: "Pending",
    createdAt: Date.now()
  }
];

const DEFAULT_ASSETS: Asset[] = [
  {
    id: "asset-cash-1",
    name: "Tài khoản ngân hàng / Tiền mặt",
    category: "cat-money",
    value: 15000000,
    currency: "VND",
    notes: "Sổ tiết kiệm & Tiền mặt dự phòng"
  }
];

const getLocalData = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = safeLocalStorage.getItem(key);
    if (!saved) return defaultValue;
    return JSON.parse(saved);
  } catch (e) {
    return defaultValue;
  }
};

export function useFirebaseSync() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // States
  const [words, setWords] = useState<Word[]>(() => getLocalData('spatial_hub_words', DEFAULT_WORDS));
  const [writingSentences, setWritingSentences] = useState<WritingSentence[]>(() => getLocalData('spatial_hub_writingSentences', []));
  const [tasks, setTasks] = useState<Task[]>(() => getLocalData('spatial_hub_tasks', DEFAULT_TASKS));
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => getLocalData('spatial_hub_wishlist', DEFAULT_WISHLIST));
  const [logs, setLogs] = useState<LogEntry[]>(() => getLocalData('spatial_hub_logs', DEFAULT_LOGS));
  const [foodPlaces, setFoodPlaces] = useState<FoodPlace[]>(() => getLocalData('spatial_hub_places', DEFAULT_FOOD_PLACES));
  const [tags, setTags] = useState<string[]>(() => getLocalData('spatial_hub_tags', ['Tourism', 'Hospitality', 'Cruise Industry']));
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>(() => getLocalData('spatial_hub_content_ideas', DEFAULT_CONTENT_IDEAS));
  const [assets, setAssets] = useState<Asset[]>(() => getLocalData('spatial_hub_assets', DEFAULT_ASSETS));
  const [dictations, setDictations] = useState<VideoDictation[]>(() => getLocalData('spatial_hub_dictations', []));
  const [customSentences, setCustomSentences] = useState<CustomSentence[]>(() => getLocalData('spatial_hub_custom_sentences', []));
  const [practiceParagraphs, setPracticeParagraphs] = useState<PracticeParagraph[]>(() => getLocalData('spatial_hub_practice_paragraphs', []));
  const [studyGoals, setStudyGoals] = useState<StudyGoal[]>(() => getLocalData('spatial_hub_study_goals', []));
  const [achievements, setAchievements] = useState<Achievement[]>(() => getLocalData('spatial_hub_achievements', []));
  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>(() => getLocalData('spatial_hub_kanban_tasks', DEFAULT_KANBAN_TASKS));
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>(() => getLocalData('spatial_hub_asset_cats', [
    { id: 'cat-money', name: 'Tiền mặt & NH', icon: 'Wallet' },
    { id: 'cat-realestate', name: 'Bất động sản', icon: 'Home' },
    { id: 'cat-vehicles', name: 'Xe cộ', icon: 'Car' },
    { id: 'cat-tech', name: 'Công nghệ', icon: 'Laptop' }
  ]));

  // Sync state for Salary Planner
  const [salaryInput, setSalaryInput] = useState<string>(() => {
    return safeLocalStorage.getItem("studyHub_salaryInput") || "15,000,000";
  });
  const [plannedExpenses, setPlannedExpenses] = useState<{ id: string; name: string; amount: string; notes: string }[]>(() => {
    try {
      const saved = safeLocalStorage.getItem("studyHub_plannedExpenses");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: "pe-1", name: "Tiền thuê nhà / phòng", amount: "3,500,000", notes: "Thanh toán cố định đầu tháng" },
      { id: "pe-2", name: "Chi phí ăn uống sinh hoạt", amount: "3,000,000", notes: "Ngân sách ăn uống ước tính" },
      { id: "pe-3", name: "Cước phí dịch vụ (Điện, nước, net)", amount: "800,000", notes: "Thanh toán hóa đơn hàng tháng" },
      { id: "pe-4", name: "Học tập & Sách vở", amount: "1,200,000", notes: "Luyện tiếng Anh và phát triển cá nhân" },
      { id: "pe-5", name: "Tích lũy tài sản / Tiết kiệm", amount: "3,000,000", notes: "Khoản để riêng đầu tư" }
    ];
  });

  // Sync state for Habits
  const [habits, setHabits] = useState<any[]>(() => {
    const saved = safeLocalStorage.getItem("studyHub_habits");
    return saved ? JSON.parse(saved) : [];
  });

  // Sync state for Custom Rewards
  const [customRewards, setCustomRewards] = useState<{ id: string, emoji: string, title: string, desc: string, isUnlocked: boolean, unlockedAt?: string, isRedeemed?: boolean }[]>(() => {
    const saved = safeLocalStorage.getItem("studyHub_customRewardsList");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: "r1", emoji: "🧋", title: "Cốc trà sữa tự thưởng", desc: "Được gọi một cốc trà sữa full topping yêu thích mà không lo lắng béo khỏe.", isUnlocked: false, isRedeemed: false },
      { id: "r2", emoji: "🎮", title: "1 Tiếng chơi game thả ga", desc: "Tận hưởng 60 phút chơi game PC/Console hoàn toàn thư giãn không lo nghĩ.", isUnlocked: false, isRedeemed: false },
      { id: "r3", emoji: "🍿", title: "Suất xem phim cuối tuần", desc: "Tự tin rủ bạn bè hoặc đi một mình xem bộ phim rạp bom tấn mới nhất.", isUnlocked: false, isRedeemed: false },
      { id: "r4", emoji: "🛌", title: "Nghỉ ngơi lười biếng 30p", desc: "Được phép nằm ườn, lướt điện thoại vô điều kiện vào khung giờ học tập.", isUnlocked: false, isRedeemed: false },
      { id: "r5", emoji: "🍵", title: "Trà đạo thong thả", desc: "Tự pha một tách ấm trà mật ong, vừa uống vừa lướt truyện tranh yên bình.", isUnlocked: false, isRedeemed: false }
    ];
  });

  // Cross-Device Synced inputs for AssetsManager
  const getLast7Dates = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  };

  const DEFAULT_WEEK_DEBTS = getLast7Dates().map((dateStr, idx) => ({
    id: idx + 1,
    name: dateStr,
    amount: "",
    notes: ""
  }));

  const [bulkDebts, setBulkDebts] = useState<{id: number, name: string, amount: string, notes: string}[]>(() => {
    try {
      const saved = safeLocalStorage.getItem("studyHub_bulkDebts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 7) return parsed;
      }
    } catch (e) {}
    return DEFAULT_WEEK_DEBTS.map(item => ({ ...item }));
  });

  const [bulkCardSpends, setBulkCardSpends] = useState<{id: number, name: string, amount: string, notes: string}[]>(() => {
    try {
      const saved = safeLocalStorage.getItem("studyHub_bulkCardSpends");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_WEEK_DEBTS.map(item => ({ ...item, amount: "", notes: "" }));
  });

  const [kvStore, setKvStore] = useState<Record<string, any>>(() => {
    try {
      const saved = safeLocalStorage.getItem("studyHub_kvStore");
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return {};
  });
  const kvStoreRef = React.useRef(kvStore);
  useEffect(() => { kvStoreRef.current = kvStore; }, [kvStore]);

  const [bulkCurrentCash, setBulkCurrentCash] = useState<Record<number, number>>(() => {
    try {
      const saved = safeLocalStorage.getItem("studyHub_bulkCurrentCash");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const [saveTrigger, setSaveTrigger] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
      } else {
        migrateLocalStorage(u.uid);
      }
    });
    return unsub;
  }, []);

  const migrateLocalStorage = async (uid: string) => {
    const migratedV4 = safeLocalStorage.getItem(`migrated_${uid}_v4`);
    const migratedV5 = safeLocalStorage.getItem(`migrated_${uid}_v5`);
    if (migratedV5) return;

    const safeSetDoc = async (path: string, item: any) => {
      try {
        const cleanItem = Object.fromEntries(Object.entries(item).filter(([_, v]) => v !== undefined));
        await setDoc(doc(db, path), cleanItem);
      } catch (err) {
        console.error("Failed to migrate item", path, err);
      }
    };

    try {
      const storageMap: Record<string, string> = {
        'spatial_hub_assets': `users/${uid}/assets`,
        'spatial_hub_asset_cats': `users/${uid}/assetCategories`,
        'spatial_hub_words': `users/${uid}/words`,
        'spatial_hub_tasks': `users/${uid}/tasks`,
        'spatial_hub_wishlist': `users/${uid}/wishlistItems`,
        'spatial_hub_logs': `users/${uid}/logEntries`,
        'spatial_hub_places': `users/${uid}/foodPlaces`,
        'spatial_hub_content_ideas': `users/${uid}/contentIdeas`,
        'spatial_hub_dictations': `users/${uid}/dictations`,
        'spatial_hub_practice_paragraphs': `users/${uid}/practiceParagraphs`,
        'spatial_hub_custom_sentences': `users/${uid}/customSentences`,
        'spatial_hub_study_goals': `users/${uid}/studyGoals`,
        'spatial_hub_achievements': `users/${uid}/achievements`,
        'spatial_hub_kanban_tasks': `users/${uid}/kanbanTasks`,
      };

      for (const [lsKey, firestorePath] of Object.entries(storageMap)) {
        // v5 migration specifically targets those that might have failed rule checks earlier
        // but we can re-migrate everything safely as setDoc is idempotent
        const data = safeLocalStorage.getItem(lsKey);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                if (item.id) {
                  await safeSetDoc(`${firestorePath}/${item.id}`, item);
                }
              }
            }
          } catch (e) {
            console.error(`Migration error for ${lsKey}`, e);
          }
        }
      }

      const savedTags = safeLocalStorage.getItem('spatial_hub_tags');
      if (savedTags) {
        try {
          const parsed = JSON.parse(savedTags);
          await setDoc(doc(db, `users/${uid}/data/tags`), { tags: parsed });
        } catch(e) {}
      }

      safeLocalStorage.setItem(`migrated_${uid}_v4`, 'true');
      safeLocalStorage.setItem(`migrated_${uid}_v5`, 'true');
    } catch (e) {
      console.error("Migration error", e);
    }
  };

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const syncCollection = async <T extends { id: string }>(
      snapDocs: T[],
      setLocalState: React.Dispatch<React.SetStateAction<T[]>>,
      localRef: React.MutableRefObject<T[]>,
      lsKey: string,
      firestoreCollectionPath: string,
      defaultItems: T[] = []
    ) => {
      if (snapDocs.length > 0) {
        setLocalState(snapDocs);
        safeLocalStorage.setItem(lsKey, JSON.stringify(snapDocs));
      } else {
        const current = localRef.current;
        if (current && current.length > 0) {
          setLocalState(current);
          safeLocalStorage.setItem(lsKey, JSON.stringify(current));
          for (const item of current) {
            if (item.id) {
              const cleanItem = Object.fromEntries(Object.entries(item).filter(([_, v]) => v !== undefined));
              await setDoc(doc(db, `${firestoreCollectionPath}/${item.id}`), cleanItem).catch(e => console.error("Auto upload local item error:", e));
            }
          }
        } else if (safeLocalStorage.getItem(lsKey) === null && defaultItems.length > 0) {
          setLocalState(defaultItems);
          safeLocalStorage.setItem(lsKey, JSON.stringify(defaultItems));
          for (const item of defaultItems) {
            if (item.id) {
              const cleanItem = Object.fromEntries(Object.entries(item).filter(([_, v]) => v !== undefined));
              await setDoc(doc(db, `${firestoreCollectionPath}/${item.id}`), cleanItem).catch(e => console.error("Auto upload default item error:", e));
            }
          }
        } else {
          setLocalState([]);
          safeLocalStorage.setItem(lsKey, JSON.stringify([]));
        }
      }
    };

    const unsubWords = onSnapshot(collection(db, `users/${user.uid}/words`), (snap) => {
      syncCollection(snap.docs.map(d => d.data() as Word), setWords, wordsRef, 'spatial_hub_words', `users/${user.uid}/words`, DEFAULT_WORDS);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/words`));

    const unsubWritingSentences = onSnapshot(collection(db, `users/${user.uid}/writingSentences`), (snap) => {
      syncCollection(snap.docs.map(d => d.data() as WritingSentence), setWritingSentences, writingSentencesRef, 'spatial_hub_writingSentences', `users/${user.uid}/writingSentences`, []);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/writingSentences`));

    const unsubTasks = onSnapshot(collection(db, `users/${user.uid}/tasks`), (snap) => {
      syncCollection(snap.docs.map(d => d.data() as Task), setTasks, tasksRef, 'spatial_hub_tasks', `users/${user.uid}/tasks`, DEFAULT_TASKS);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/tasks`));

    const unsubWishlist = onSnapshot(collection(db, `users/${user.uid}/wishlistItems`), (snap) => {
      syncCollection(snap.docs.map(d => d.data() as WishlistItem), setWishlist, wishlistRef, 'spatial_hub_wishlist', `users/${user.uid}/wishlistItems`, DEFAULT_WISHLIST);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/wishlistItems`));

    const unsubLogs = onSnapshot(collection(db, `users/${user.uid}/logEntries`), (snap) => {
      syncCollection(snap.docs.map(d => d.data() as LogEntry), setLogs, logsRef, 'spatial_hub_logs', `users/${user.uid}/logEntries`, DEFAULT_LOGS);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/logEntries`));

    const unsubFood = onSnapshot(collection(db, `users/${user.uid}/foodPlaces`), (snap) => {
      syncCollection(snap.docs.map(d => d.data() as FoodPlace), setFoodPlaces, foodRef, 'spatial_hub_places', `users/${user.uid}/foodPlaces`, DEFAULT_FOOD_PLACES);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/foodPlaces`));

    const unsubIdeas = onSnapshot(collection(db, `users/${user.uid}/contentIdeas`), (snap) => {
      syncCollection(snap.docs.map(d => d.data() as ContentIdea), setContentIdeas, ideasRef, 'spatial_hub_content_ideas', `users/${user.uid}/contentIdeas`, DEFAULT_CONTENT_IDEAS);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/contentIdeas`));

    const unsubAssets = onSnapshot(collection(db, `users/${user.uid}/assets`), (snap) => {
      syncCollection(snap.docs.map(d => d.data() as Asset), setAssets, assetsRef, 'spatial_hub_assets', `users/${user.uid}/assets`, DEFAULT_ASSETS);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/assets`));

    const unsubCats = onSnapshot(collection(db, `users/${user.uid}/assetCategories`), (snap) => {
      const cats = snap.docs.map(d => d.data() as AssetCategory);
      if (cats.length > 0) setAssetCategories(cats);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/assetCategories`));

    const unsubDictations = onSnapshot(collection(db, `users/${user.uid}/dictations`), (snap) => {
      syncCollection(snap.docs.map(d => d.data() as VideoDictation).sort((a,b) => b.lastModified - a.lastModified), setDictations, dictationsRef, 'spatial_hub_dictations', `users/${user.uid}/dictations`, []);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/dictations`));

    const unsubCustomSentences = onSnapshot(collection(db, `users/${user.uid}/customSentences`), (snap) => {
      syncCollection(snap.docs.map(d => d.data() as CustomSentence).sort((a,b) => b.createdAt - a.createdAt), setCustomSentences, sentencesRef, 'spatial_hub_custom_sentences', `users/${user.uid}/customSentences`, []);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/customSentences`));

    const unsubPracticeParagraphs = onSnapshot(collection(db, `users/${user.uid}/practiceParagraphs`), (snap) => {
      syncCollection(snap.docs.map(d => d.data() as PracticeParagraph).sort((a,b) => b.createdAt - a.createdAt), setPracticeParagraphs, paragraphsRef, 'spatial_hub_practice_paragraphs', `users/${user.uid}/practiceParagraphs`, []);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/practiceParagraphs`));

    const unsubStudyGoals = onSnapshot(collection(db, `users/${user.uid}/studyGoals`), (snap) => {
      syncCollection(snap.docs.map(d => d.data() as StudyGoal).sort((a,b) => b.createdAt - a.createdAt), setStudyGoals, goalsRef, 'spatial_hub_study_goals', `users/${user.uid}/studyGoals`, []);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/studyGoals`));

    const unsubAchievements = onSnapshot(collection(db, `users/${user.uid}/achievements`), (snap) => {
      syncCollection(snap.docs.map(d => d.data() as Achievement).sort((a,b) => b.unlockedAt - a.unlockedAt), setAchievements, achievementsRef, 'spatial_hub_achievements', `users/${user.uid}/achievements`, []);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/achievements`));

    const unsubKanbanTasks = onSnapshot(collection(db, `users/${user.uid}/kanbanTasks`), (snap) => {
      syncCollection(snap.docs.map(d => d.data() as KanbanTask), setKanbanTasks, kanbanTasksRef, 'spatial_hub_kanban_tasks', `users/${user.uid}/kanbanTasks`, DEFAULT_KANBAN_TASKS);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/kanbanTasks`));

    const unsubTags = onSnapshot(doc(db, `users/${user.uid}/data/tags`), (docSnap) => {
      if (docSnap.exists() && docSnap.data().tags) {
        setTags(docSnap.data().tags);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/data/tags`));

    const unsubSalary = onSnapshot(doc(db, `users/${user.uid}/data/salaryPlanner`), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.salaryInput !== undefined) {
          setSalaryInput(data.salaryInput);
          safeLocalStorage.setItem("studyHub_salaryInput", data.salaryInput);
        }
        if (data.plannedExpenses !== undefined && Array.isArray(data.plannedExpenses)) {
          setPlannedExpenses(data.plannedExpenses);
          safeLocalStorage.setItem("studyHub_plannedExpenses", JSON.stringify(data.plannedExpenses));
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/data/salaryPlanner`));

    const unsubHabits = onSnapshot(doc(db, `users/${user.uid}/data/habits`), (docSnap) => {
      if (docSnap.exists() && docSnap.data().habits && docSnap.data().habits.length > 0) {
        setHabits(docSnap.data().habits);
        safeLocalStorage.setItem("studyHub_habits", JSON.stringify(docSnap.data().habits));
      } else if (habitsRef.current && habitsRef.current.length > 0) {
        setDoc(doc(db, `users/${user.uid}/data/habits`), { habits: habitsRef.current }, { merge: true });
      } else {
        setHabits(DEFAULT_HABITS);
        safeLocalStorage.setItem("studyHub_habits", JSON.stringify(DEFAULT_HABITS));
        setDoc(doc(db, `users/${user.uid}/data/habits`), { habits: DEFAULT_HABITS }, { merge: true });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/data/habits`));

    const unsubRewards = onSnapshot(doc(db, `users/${user.uid}/data/customRewards`), (docSnap) => {
      if (docSnap.exists() && docSnap.data().customRewards) {
        setCustomRewards(docSnap.data().customRewards);
        safeLocalStorage.setItem("studyHub_customRewardsList", JSON.stringify(docSnap.data().customRewards));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/data/customRewards`));

    const unsubKvStore = onSnapshot(doc(db, `users/${user.uid}/data/kvStore`), (docSnap) => {
      if (docSnap.exists() && docSnap.data().data) {
        if (JSON.stringify(kvStoreRef.current) !== JSON.stringify(docSnap.data().data)) {
          setKvStore(docSnap.data().data);
          safeLocalStorage.setItem("studyHub_kvStore", JSON.stringify(docSnap.data().data));
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/data/kvStore`));

    const unsubAssetsBulk = onSnapshot(doc(db, `users/${user.uid}/data/assetsBulk`), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.bulkDebts !== undefined && Array.isArray(data.bulkDebts)) {
          if (JSON.stringify(bulkDebtsRef.current) !== JSON.stringify(data.bulkDebts)) {
            setBulkDebts(data.bulkDebts);
            safeLocalStorage.setItem("studyHub_bulkDebts", JSON.stringify(data.bulkDebts));
          }
        }
        if (data.bulkCardSpends !== undefined && Array.isArray(data.bulkCardSpends)) {
          if (JSON.stringify(bulkCardSpendsRef.current) !== JSON.stringify(data.bulkCardSpends)) {
            setBulkCardSpends(data.bulkCardSpends);
            safeLocalStorage.setItem("studyHub_bulkCardSpends", JSON.stringify(data.bulkCardSpends));
          }
        }
        if (data.bulkCurrentCash !== undefined && typeof data.bulkCurrentCash === 'object') {
          if (JSON.stringify(bulkCurrentCashRef.current) !== JSON.stringify(data.bulkCurrentCash)) {
            setBulkCurrentCash(data.bulkCurrentCash);
            safeLocalStorage.setItem("studyHub_bulkCurrentCash", JSON.stringify(data.bulkCurrentCash));
          }
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/data/assetsBulk`));

    const timer = setTimeout(() => { setLoading(false); }, 1500);

    return () => {
      clearTimeout(timer);
      unsubWords(); unsubWritingSentences(); unsubTasks(); unsubWishlist(); unsubLogs(); unsubFood();
      unsubIdeas(); unsubAssets(); unsubCats(); unsubDictations(); unsubCustomSentences(); 
      unsubPracticeParagraphs(); unsubStudyGoals(); unsubAchievements(); unsubKanbanTasks(); unsubTags();
      unsubSalary(); unsubHabits(); unsubRewards(); unsubAssetsBulk();
    };
  }, [user]);

  // Refs for sync closures
  const wordsRef = React.useRef(words);
  const writingSentencesRef = React.useRef(writingSentences);
  const tasksRef = React.useRef(tasks);
  const wishlistRef = React.useRef(wishlist);
  const logsRef = React.useRef(logs);
  const foodRef = React.useRef(foodPlaces);
  const ideasRef = React.useRef(contentIdeas);
  const assetsRef = React.useRef(assets);
  const assetCategoriesRef = React.useRef(assetCategories);
  const dictationsRef = React.useRef(dictations);
  const sentencesRef = React.useRef(customSentences);
  const paragraphsRef = React.useRef(practiceParagraphs);
  const goalsRef = React.useRef(studyGoals);
  const achievementsRef = React.useRef(achievements);
  const kanbanTasksRef = React.useRef(kanbanTasks);
  const habitsRef = React.useRef(habits);
  const customRewardsRef = React.useRef(customRewards);
  const salaryInputRef = React.useRef(salaryInput);
  const plannedExpensesRef = React.useRef(plannedExpenses);
  const bulkDebtsRef = React.useRef(bulkDebts);
  const bulkCardSpendsRef = React.useRef(bulkCardSpends);
  const bulkCurrentCashRef = React.useRef(bulkCurrentCash);

  useEffect(() => { wordsRef.current = words; }, [words]);
  useEffect(() => { writingSentencesRef.current = writingSentences; }, [writingSentences]);
  useEffect(() => { kanbanTasksRef.current = kanbanTasks; }, [kanbanTasks]);
  useEffect(() => { habitsRef.current = habits; }, [habits]);
  useEffect(() => { customRewardsRef.current = customRewards; }, [customRewards]);
  useEffect(() => { salaryInputRef.current = salaryInput; }, [salaryInput]);
  useEffect(() => { plannedExpensesRef.current = plannedExpenses; }, [plannedExpenses]);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => { wishlistRef.current = wishlist; }, [wishlist]);
  useEffect(() => { logsRef.current = logs; }, [logs]);
  useEffect(() => { foodRef.current = foodPlaces; }, [foodPlaces]);
  useEffect(() => { ideasRef.current = contentIdeas; }, [contentIdeas]);
  useEffect(() => { assetsRef.current = assets; }, [assets]);
  useEffect(() => { assetCategoriesRef.current = assetCategories; }, [assetCategories]);
  useEffect(() => { dictationsRef.current = dictations; }, [dictations]);
  useEffect(() => { sentencesRef.current = customSentences; }, [customSentences]);
  useEffect(() => { paragraphsRef.current = practiceParagraphs; }, [practiceParagraphs]);
  useEffect(() => { goalsRef.current = studyGoals; }, [studyGoals]);
  useEffect(() => { achievementsRef.current = achievements; }, [achievements]);
  useEffect(() => { bulkDebtsRef.current = bulkDebts; }, [bulkDebts]);
  useEffect(() => { bulkCardSpendsRef.current = bulkCardSpends; }, [bulkCardSpends]);
  useEffect(() => { bulkCurrentCashRef.current = bulkCurrentCash; }, [bulkCurrentCash]);

  // Debounce saving assetsBulk to Firestore
  useEffect(() => {
    if (!user || saveTrigger === 0) return;

    const t = setTimeout(async () => {
      try {
        await setDoc(doc(db, `users/${user.uid}/data/assetsBulk`), {
          bulkDebts: bulkDebtsRef.current,
          bulkCardSpends: bulkCardSpendsRef.current,
          bulkCurrentCash: bulkCurrentCashRef.current
        });
      } catch (err) {
        console.error("Error syncing assetsBulk to Firebase:", err);
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [saveTrigger, user]);

  // Diff sync wrapper
  const createSyncSetter = useCallback(<T extends { id: string }>(
    collectionName: string, 
    itemsRef: React.MutableRefObject<T[]>,
    setLocalState: React.Dispatch<React.SetStateAction<T[]>>,
    isSingleDoc: boolean = false
  ) => {
    return async (newItems: T[] | string[] | ((prev: T[]) => T[])) => {
      const currentItems = itemsRef.current;
      let targetItems: T[];

      if (typeof newItems === 'function') {
        targetItems = (newItems as (prev: T[]) => T[])(currentItems);
      } else {
        targetItems = newItems as T[];
      }

      if (targetItems === currentItems) return;

      // Optimistic update
      if (!isSingleDoc) {
        setLocalState(targetItems);
      }

      // Local storage sync mapping
      let lsKey = collectionName;
      if (collectionName === 'words') lsKey = 'spatial_hub_words';
      else if (collectionName === 'writingSentences') lsKey = 'spatial_hub_writingSentences';
      else if (collectionName === 'tasks') lsKey = 'spatial_hub_tasks';
      else if (collectionName === 'wishlistItems') lsKey = 'spatial_hub_wishlist';
      else if (collectionName === 'logEntries') lsKey = 'spatial_hub_logs';
      else if (collectionName === 'foodPlaces') lsKey = 'spatial_hub_places';
      else if (collectionName === 'contentIdeas') lsKey = 'spatial_hub_content_ideas';
      else if (collectionName === 'assets') lsKey = 'spatial_hub_assets';
      else if (collectionName === 'assetCategories') lsKey = 'spatial_hub_asset_cats';
      else if (collectionName === 'dictations') lsKey = 'spatial_hub_dictations';
      else if (collectionName === 'customSentences') lsKey = 'spatial_hub_custom_sentences';
      else if (collectionName === 'practiceParagraphs') lsKey = 'spatial_hub_practice_paragraphs';
      else if (collectionName === 'studyGoals') lsKey = 'spatial_hub_study_goals';
      else if (collectionName === 'achievements') lsKey = 'spatial_hub_achievements';
      else if (collectionName === 'kanbanTasks') lsKey = 'spatial_hub_kanban_tasks';
      else if (collectionName === 'tags') lsKey = 'spatial_hub_tags';

      safeLocalStorage.setItem(lsKey, JSON.stringify(targetItems));

      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        if (isSingleDoc) {
          await setDoc(doc(db, `users/${currentUser.uid}/data/${collectionName}`), { [collectionName]: targetItems });
          return;
        }
        
        const newIds = new Set(targetItems.map(i => i.id));

        const toAddOrUpdate = targetItems.filter(i => {
          const existing = currentItems.find(c => c.id === i.id);
          if (!existing) return true;
          // Cleaner comparison
          const cleanNew = JSON.stringify(Object.keys(i).sort().reduce((obj: any, key) => {
            if (i[key as keyof T] !== undefined) obj[key] = i[key as keyof T];
            return obj;
          }, {}));
          const cleanOld = JSON.stringify(Object.keys(existing).sort().reduce((obj: any, key) => {
            if (existing[key as keyof T] !== undefined) obj[key] = existing[key as keyof T];
            return obj;
          }, {}));
          return cleanNew !== cleanOld;
        });
        
        const toDelete = currentItems.filter(i => !newIds.has(i.id));

        for (const item of toAddOrUpdate) {
          const cleanItem = Object.fromEntries(Object.entries(item).filter(([_, v]) => v !== undefined));
          await setDoc(doc(db, `users/${currentUser.uid}/${collectionName}/${item.id}`), cleanItem);
        }
        for (const item of toDelete) {
          await deleteDoc(doc(db, `users/${currentUser.uid}/${collectionName}/${item.id}`));
        }
      } catch (err: any) {
        console.error("Sync error:", err);
      }
    };
  }, []);

  const setWordsSync = useCallback(createSyncSetter<Word>('words', wordsRef, setWords), [createSyncSetter]);
  const setWritingSentencesSync = useCallback(createSyncSetter<WritingSentence>('writingSentences', writingSentencesRef, setWritingSentences), [createSyncSetter]);
  const setTasksSync = useCallback(createSyncSetter<Task>('tasks', tasksRef, setTasks), [createSyncSetter]);
  const setWishlistSync = useCallback(createSyncSetter<WishlistItem>('wishlistItems', wishlistRef, setWishlist), [createSyncSetter]);
  const setLogsSync = useCallback(createSyncSetter<LogEntry>('logEntries', logsRef, setLogs), [createSyncSetter]);
  const setFoodPlacesSync = useCallback(createSyncSetter<FoodPlace>('foodPlaces', foodRef, setFoodPlaces), [createSyncSetter]);
  const setContentIdeasSync = useCallback(createSyncSetter<ContentIdea>('contentIdeas', ideasRef, setContentIdeas), [createSyncSetter]);
  const setAssetsSync = useCallback(createSyncSetter<Asset>('assets', assetsRef, setAssets), [createSyncSetter]);
  const setAssetCategoriesSync = useCallback(createSyncSetter<AssetCategory>('assetCategories', assetCategoriesRef, setAssetCategories), [createSyncSetter]);
  const setDictationsSync = useCallback(createSyncSetter<VideoDictation>('dictations', dictationsRef, setDictations as any), [createSyncSetter]);
  const setCustomSentencesSync = useCallback(createSyncSetter<CustomSentence>('customSentences', sentencesRef, setCustomSentences), [createSyncSetter]);
  const setPracticeParagraphsSync = useCallback(createSyncSetter<PracticeParagraph>('practiceParagraphs', paragraphsRef, setPracticeParagraphs), [createSyncSetter]);
  const setStudyGoalsSync = useCallback(createSyncSetter<StudyGoal>('studyGoals', goalsRef, setStudyGoals), [createSyncSetter]);
  const setAchievementsSync = useCallback(createSyncSetter<Achievement>('achievements', achievementsRef, setAchievements), [createSyncSetter]);
  const setKanbanTasksSync = useCallback(createSyncSetter<KanbanTask>('kanbanTasks', kanbanTasksRef, setKanbanTasks), [createSyncSetter]);
  const setTagsSync = useCallback(createSyncSetter<any>('tags', React.createRef(), setTags as any, true), [createSyncSetter]);

  const setBulkDebtsSync = useCallback(async (valOrFunc: any) => {
     let nextVal;
     if (typeof valOrFunc === 'function') {
       nextVal = valOrFunc(bulkDebtsRef.current);
     } else {
       nextVal = valOrFunc;
     }
     setBulkDebts(nextVal);
     safeLocalStorage.setItem("studyHub_bulkDebts", JSON.stringify(nextVal));
     setSaveTrigger(p => p + 1);
  }, []);

  const setBulkCardSpendsSync = useCallback(async (valOrFunc: any) => {
     let nextVal;
     if (typeof valOrFunc === 'function') {
       nextVal = valOrFunc(bulkCardSpendsRef.current);
     } else {
       nextVal = valOrFunc;
     }
     setBulkCardSpends(nextVal);
     safeLocalStorage.setItem("studyHub_bulkCardSpends", JSON.stringify(nextVal));
     setSaveTrigger(p => p + 1);
  }, []);

  const setBulkCurrentCashSync = useCallback(async (valOrFunc: any) => {
     let nextVal;
     if (typeof valOrFunc === 'function') {
       nextVal = valOrFunc(bulkCurrentCashRef.current);
     } else {
       nextVal = valOrFunc;
     }
     setBulkCurrentCash(nextVal);
     safeLocalStorage.setItem("studyHub_bulkCurrentCash", JSON.stringify(nextVal));
     setSaveTrigger(p => p + 1);
  }, []);

  return {
    user, loading,
    words, setWords: setWordsSync,
    writingSentences, setWritingSentences: setWritingSentencesSync,
    tasks, setTasks: setTasksSync,
    wishlist, setWishlist: setWishlistSync,
    logs, setLogs: setLogsSync,
    foodPlaces, setFoodPlaces: setFoodPlacesSync,
    contentIdeas, setContentIdeas: setContentIdeasSync,
    assets, setAssets: setAssetsSync,
    assetCategories, setAssetCategories: setAssetCategoriesSync,
    dictations, setDictations: setDictationsSync,
    customSentences, setCustomSentences: setCustomSentencesSync,
    practiceParagraphs, setPracticeParagraphs: setPracticeParagraphsSync,
    studyGoals, setStudyGoals: setStudyGoalsSync,
    achievements, setAchievements: setAchievementsSync,
    kanbanTasks, setKanbanTasks: setKanbanTasksSync,
    tags, setTags: setTagsSync,
    bulkDebts, setBulkDebts: setBulkDebtsSync,
    bulkCardSpends, setBulkCardSpends: setBulkCardSpendsSync,
    bulkCurrentCash, setBulkCurrentCash: setBulkCurrentCashSync,
    salaryInput,
    setSalaryInput: async (newVal: string) => {
       setSalaryInput(newVal);
       safeLocalStorage.setItem("studyHub_salaryInput", newVal);
       if (user) {
         try {
           await setDoc(doc(db, `users/${user.uid}/data/salaryPlanner`), {
             salaryInput: newVal,
             plannedExpenses: plannedExpensesRef.current
           }, { merge: true });
         } catch (err) {
           console.error("Salary sync error:", err);
         }
       }
    },
    plannedExpenses,
    setPlannedExpenses: async (newValOrFunc: any) => {
       let nextVal;
       if (typeof newValOrFunc === 'function') {
         nextVal = newValOrFunc(plannedExpensesRef.current);
       } else {
         nextVal = newValOrFunc;
       }
       setPlannedExpenses(nextVal);
       safeLocalStorage.setItem("studyHub_plannedExpenses", JSON.stringify(nextVal));
       if (user) {
         try {
           await setDoc(doc(db, `users/${user.uid}/data/salaryPlanner`), {
             salaryInput: salaryInputRef.current,
             plannedExpenses: nextVal
           }, { merge: true });
         } catch (err) {
           console.error("Planned expenses sync error:", err);
         }
       }
    },
    habits,
    setHabits: async (newValOrFunc: any) => {
       let nextVal;
       if (typeof newValOrFunc === 'function') {
         nextVal = newValOrFunc(habitsRef.current);
       } else {
         nextVal = newValOrFunc;
       }
       setHabits(nextVal);
       safeLocalStorage.setItem("studyHub_habits", JSON.stringify(nextVal));
       if (user) {
         try {
           await setDoc(doc(db, `users/${user.uid}/data/habits`), { habits: nextVal });
         } catch (err) {
           console.error("Habits sync error:", err);
         }
       }
    },
    customRewards,
    kvStore,
    setKvStoreTarget: async (key: string, value: any) => {
       const updated = { ...kvStoreRef.current, [key]: value };
       setKvStore(updated);
       safeLocalStorage.setItem("studyHub_kvStore", JSON.stringify(updated));
       if (auth.currentUser) {
         try {
           await setDoc(doc(db, `users/${auth.currentUser.uid}/data/kvStore`), { data: updated }, { merge: true });
         } catch (e) { console.error("KV sync error", e); }
       }
    },
    setCustomRewards: async (newValOrFunc: any) => {
       let nextVal;
       if (typeof newValOrFunc === 'function') {
         nextVal = newValOrFunc(customRewardsRef.current);
       } else {
         nextVal = newValOrFunc;
       }
       setCustomRewards(nextVal);
       safeLocalStorage.setItem("studyHub_customRewardsList", JSON.stringify(nextVal));
       if (user) {
         try {
           await setDoc(doc(db, `users/${user.uid}/data/customRewards`), { customRewards: nextVal });
         } catch (err) {
           console.error("Custom rewards sync error:", err);
         }
       }
    }
  };
}
