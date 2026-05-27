import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import type { Word, Task, WishlistItem, LogEntry, FoodPlace, ContentIdea, Asset, AssetCategory, VideoDictation, CustomSentence, PracticeParagraph, StudyGoal, Achievement } from '../types';

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

export function useFirebaseSync() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // States
  const [words, setWords] = useState<Word[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [foodPlaces, setFoodPlaces] = useState<FoodPlace[]>([]);
  const [tags, setTags] = useState<string[]>(['Tourism', 'Hospitality', 'Cruise Industry']);
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [dictations, setDictations] = useState<VideoDictation[]>([]);
  const [customSentences, setCustomSentences] = useState<CustomSentence[]>([]);
  const [practiceParagraphs, setPracticeParagraphs] = useState<PracticeParagraph[]>([]);
  const [studyGoals, setStudyGoals] = useState<StudyGoal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>([
    { id: 'cat-money', name: 'Tiền mặt & NH', icon: 'Wallet' },
    { id: 'cat-realestate', name: 'Bất động sản', icon: 'Home' },
    { id: 'cat-vehicles', name: 'Xe cộ', icon: 'Car' },
    { id: 'cat-tech', name: 'Công nghệ', icon: 'Laptop' }
  ]);

  // Sync state for Salary Planner
  const [salaryInput, setSalaryInput] = useState<string>(() => {
    return localStorage.getItem("studyHub_salaryInput") || "15,000,000";
  });
  const [plannedExpenses, setPlannedExpenses] = useState<{ id: string; name: string; amount: string; notes: string }[]>(() => {
    try {
      const saved = localStorage.getItem("studyHub_plannedExpenses");
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
    const saved = localStorage.getItem("studyHub_habits");
    return saved ? JSON.parse(saved) : [];
  });

  // Sync state for Custom Rewards
  const [customRewards, setCustomRewards] = useState<{ id: string, emoji: string, title: string, desc: string, isUnlocked: boolean, unlockedAt?: string, isRedeemed?: boolean }[]>(() => {
    const saved = localStorage.getItem("studyHub_customRewardsList");
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
    const migratedV4 = localStorage.getItem(`migrated_${uid}_v4`);
    const migratedV5 = localStorage.getItem(`migrated_${uid}_v5`);
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
      };

      for (const [lsKey, firestorePath] of Object.entries(storageMap)) {
        // v5 migration specifically targets those that might have failed rule checks earlier
        // but we can re-migrate everything safely as setDoc is idempotent
        const data = localStorage.getItem(lsKey);
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

      const savedTags = localStorage.getItem('spatial_hub_tags');
      if (savedTags) {
        try {
          const parsed = JSON.parse(savedTags);
          await setDoc(doc(db, `users/${uid}/data/tags`), { tags: parsed });
        } catch(e) {}
      }

      localStorage.setItem(`migrated_${uid}_v4`, 'true');
      localStorage.setItem(`migrated_${uid}_v5`, 'true');
    } catch (e) {
      console.error("Migration error", e);
    }
  };

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const unsubWords = onSnapshot(collection(db, `users/${user.uid}/words`), (snap) => {
      setWords(snap.docs.map(d => d.data() as Word));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/words`));
    const unsubTasks = onSnapshot(collection(db, `users/${user.uid}/tasks`), (snap) => {
      setTasks(snap.docs.map(d => d.data() as Task));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/tasks`));
    const unsubWishlist = onSnapshot(collection(db, `users/${user.uid}/wishlistItems`), (snap) => {
      setWishlist(snap.docs.map(d => d.data() as WishlistItem));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/wishlistItems`));
    const unsubLogs = onSnapshot(collection(db, `users/${user.uid}/logEntries`), (snap) => {
      setLogs(snap.docs.map(d => d.data() as LogEntry));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/logEntries`));
    const unsubFood = onSnapshot(collection(db, `users/${user.uid}/foodPlaces`), (snap) => {
      setFoodPlaces(snap.docs.map(d => d.data() as FoodPlace));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/foodPlaces`));
    const unsubIdeas = onSnapshot(collection(db, `users/${user.uid}/contentIdeas`), (snap) => {
      setContentIdeas(snap.docs.map(d => d.data() as ContentIdea));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/contentIdeas`));
    const unsubAssets = onSnapshot(collection(db, `users/${user.uid}/assets`), (snap) => {
      setAssets(snap.docs.map(d => d.data() as Asset));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/assets`));
    const unsubCats = onSnapshot(collection(db, `users/${user.uid}/assetCategories`), (snap) => {
      const cats = snap.docs.map(d => d.data() as AssetCategory);
      if (cats.length > 0) setAssetCategories(cats);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/assetCategories`));
    const unsubDictations = onSnapshot(collection(db, `users/${user.uid}/dictations`), (snap) => {
      setDictations(snap.docs.map(d => d.data() as VideoDictation).sort((a,b) => b.lastModified - a.lastModified));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/dictations`));
    const unsubCustomSentences = onSnapshot(collection(db, `users/${user.uid}/customSentences`), (snap) => {
      setCustomSentences(snap.docs.map(d => d.data() as CustomSentence).sort((a,b) => b.createdAt - a.createdAt));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/customSentences`));
    const unsubPracticeParagraphs = onSnapshot(collection(db, `users/${user.uid}/practiceParagraphs`), (snap) => {
      setPracticeParagraphs(snap.docs.map(d => d.data() as PracticeParagraph).sort((a,b) => b.createdAt - a.createdAt));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/practiceParagraphs`));
    const unsubStudyGoals = onSnapshot(collection(db, `users/${user.uid}/studyGoals`), (snap) => {
      setStudyGoals(snap.docs.map(d => d.data() as StudyGoal).sort((a,b) => b.createdAt - a.createdAt));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/studyGoals`));
    const unsubAchievements = onSnapshot(collection(db, `users/${user.uid}/achievements`), (snap) => {
      setAchievements(snap.docs.map(d => d.data() as Achievement).sort((a,b) => b.unlockedAt - a.unlockedAt));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/achievements`));
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
          localStorage.setItem("studyHub_salaryInput", data.salaryInput);
        }
        if (data.plannedExpenses !== undefined && Array.isArray(data.plannedExpenses)) {
          setPlannedExpenses(data.plannedExpenses);
          localStorage.setItem("studyHub_plannedExpenses", JSON.stringify(data.plannedExpenses));
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/data/salaryPlanner`));

    const unsubHabits = onSnapshot(doc(db, `users/${user.uid}/data/habits`), (docSnap) => {
      if (docSnap.exists() && docSnap.data().habits) {
        setHabits(docSnap.data().habits);
        localStorage.setItem("studyHub_habits", JSON.stringify(docSnap.data().habits));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/data/habits`));

    const unsubRewards = onSnapshot(doc(db, `users/${user.uid}/data/customRewards`), (docSnap) => {
      if (docSnap.exists() && docSnap.data().customRewards) {
        setCustomRewards(docSnap.data().customRewards);
        localStorage.setItem("studyHub_customRewardsList", JSON.stringify(docSnap.data().customRewards));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/data/customRewards`));

    const timer = setTimeout(() => { setLoading(false); }, 1500);

    return () => {
      clearTimeout(timer);
      unsubWords(); unsubTasks(); unsubWishlist(); unsubLogs(); unsubFood();
      unsubIdeas(); unsubAssets(); unsubCats(); unsubDictations(); unsubCustomSentences(); 
      unsubPracticeParagraphs(); unsubStudyGoals(); unsubAchievements(); unsubTags();
      unsubSalary(); unsubHabits(); unsubRewards();
    };
  }, [user]);

  // Refs for sync closures
  const wordsRef = React.useRef(words);
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
  const habitsRef = React.useRef(habits);
  const customRewardsRef = React.useRef(customRewards);
  const salaryInputRef = React.useRef(salaryInput);
  const plannedExpensesRef = React.useRef(plannedExpenses);

  useEffect(() => { wordsRef.current = words; }, [words]);
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

  // Diff sync wrapper
  const createSyncSetter = <T extends { id: string }>(
    collectionName: string, 
    itemsRef: React.MutableRefObject<T[]>,
    setLocalState: React.Dispatch<React.SetStateAction<T[]>>,
    isSingleDoc: boolean = false
  ) => {
    return async (newItems: T[] | string[] | ((prev: T[]) => T[])) => {
      if (!user) return;

      const currentItems = itemsRef.current;
      let targetItems: T[];

      if (typeof newItems === 'function') {
        targetItems = (newItems as (prev: T[]) => T[])(currentItems);
      } else {
        targetItems = newItems as T[];
      }

      // Optimistic update
      if (!isSingleDoc) {
        setLocalState(targetItems);
      }

      try {
        if (isSingleDoc) {
          await setDoc(doc(db, `users/${user.uid}/data/${collectionName}`), { [collectionName]: targetItems });
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
          await setDoc(doc(db, `users/${user.uid}/${collectionName}/${item.id}`), cleanItem);
        }
        for (const item of toDelete) {
          await deleteDoc(doc(db, `users/${user.uid}/${collectionName}/${item.id}`));
        }
      } catch (err: any) {
        console.error("Sync error:", err);
      }
    };
  };

  return {
    user, loading,
    words, setWords: createSyncSetter<Word>('words', wordsRef, setWords),
    tasks, setTasks: createSyncSetter<Task>('tasks', tasksRef, setTasks),
    wishlist, setWishlist: createSyncSetter<WishlistItem>('wishlistItems', wishlistRef, setWishlist),
    logs, setLogs: createSyncSetter<LogEntry>('logEntries', logsRef, setLogs),
    foodPlaces, setFoodPlaces: createSyncSetter<FoodPlace>('foodPlaces', foodRef, setFoodPlaces),
    contentIdeas, setContentIdeas: createSyncSetter<ContentIdea>('contentIdeas', ideasRef, setContentIdeas),
    assets, setAssets: createSyncSetter<Asset>('assets', assetsRef, setAssets),
    assetCategories, setAssetCategories: createSyncSetter<AssetCategory>('assetCategories', assetCategoriesRef, setAssetCategories),
    dictations, setDictations: createSyncSetter<VideoDictation>('dictations', dictationsRef, setDictations as any),
    customSentences, setCustomSentences: createSyncSetter<CustomSentence>('customSentences', sentencesRef, setCustomSentences),
    practiceParagraphs, setPracticeParagraphs: createSyncSetter<PracticeParagraph>('practiceParagraphs', paragraphsRef, setPracticeParagraphs),
    studyGoals, setStudyGoals: createSyncSetter<StudyGoal>('studyGoals', goalsRef, setStudyGoals),
    achievements, setAchievements: createSyncSetter<Achievement>('achievements', achievementsRef, setAchievements),
    tags, setTags: createSyncSetter<any>('tags', React.createRef(), setTags as any, true),
    salaryInput,
    setSalaryInput: async (newVal: string) => {
      setSalaryInput(newVal);
      localStorage.setItem("studyHub_salaryInput", newVal);
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
      localStorage.setItem("studyHub_plannedExpenses", JSON.stringify(nextVal));
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
      localStorage.setItem("studyHub_habits", JSON.stringify(nextVal));
      if (user) {
        try {
          await setDoc(doc(db, `users/${user.uid}/data/habits`), { habits: nextVal });
        } catch (err) {
          console.error("Habits sync error:", err);
        }
      }
    },
    customRewards,
    setCustomRewards: async (newValOrFunc: any) => {
      let nextVal;
      if (typeof newValOrFunc === 'function') {
        nextVal = newValOrFunc(customRewardsRef.current);
      } else {
        nextVal = newValOrFunc;
      }
      setCustomRewards(nextVal);
      localStorage.setItem("studyHub_customRewardsList", JSON.stringify(nextVal));
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
