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
    const migrated = localStorage.getItem(`migrated_${uid}_v3`);
    if (migrated) return;

    const safeSetDoc = async (path: string, item: any) => {
      try {
        const cleanItem = Object.fromEntries(Object.entries(item).filter(([_, v]) => v !== undefined));
        await setDoc(doc(db, path), cleanItem);
      } catch (err) {
        console.error("Failed to migrate item", path, err);
      }
    };

    try {
      const savedAssets = localStorage.getItem('spatial_hub_assets');
      if (savedAssets) {
        for (const item of JSON.parse(savedAssets)) await safeSetDoc(`users/${uid}/assets/${item.id}`, item);
      }

      const savedCats = localStorage.getItem('spatial_hub_asset_cats');
      if (savedCats) {
        for (const item of JSON.parse(savedCats)) await safeSetDoc(`users/${uid}/assetCategories/${item.id}`, item);
      }

      const savedWords = localStorage.getItem('spatial_hub_words');
      if (savedWords) {
        for (const item of JSON.parse(savedWords)) await safeSetDoc(`users/${uid}/words/${item.id}`, item);
      }

      const savedTasks = localStorage.getItem('spatial_hub_tasks');
      if (savedTasks) {
        for (const item of JSON.parse(savedTasks)) await safeSetDoc(`users/${uid}/tasks/${item.id}`, item);
      }

      const savedWishlist = localStorage.getItem('spatial_hub_wishlist');
      if (savedWishlist) {
        for (const item of JSON.parse(savedWishlist)) await safeSetDoc(`users/${uid}/wishlistItems/${item.id}`, item);
      }

      const savedLogs = localStorage.getItem('spatial_hub_logs');
      if (savedLogs) {
        for (const item of JSON.parse(savedLogs)) await safeSetDoc(`users/${uid}/logEntries/${item.id}`, item);
      }

      const savedPlaces = localStorage.getItem('spatial_hub_places');
      if (savedPlaces) {
        for (const item of JSON.parse(savedPlaces)) await safeSetDoc(`users/${uid}/foodPlaces/${item.id}`, item);
      }

      const savedIdeas = localStorage.getItem('spatial_hub_content_ideas');
      if (savedIdeas) {
        for (const item of JSON.parse(savedIdeas)) await safeSetDoc(`users/${uid}/contentIdeas/${item.id}`, item);
      }

      const savedTags = localStorage.getItem('spatial_hub_tags');
      if (savedTags) {
        try {
          const parsed = JSON.parse(savedTags);
          await setDoc(doc(db, `users/${uid}/data/tags`), { tags: parsed });
        } catch(e) {}
      }

      localStorage.setItem(`migrated_${uid}_v3`, 'true');
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

    const timer = setTimeout(() => { setLoading(false); }, 1500);

    return () => {
      clearTimeout(timer);
      unsubWords(); unsubTasks(); unsubWishlist(); unsubLogs(); unsubFood();
      unsubIdeas(); unsubAssets(); unsubCats(); unsubDictations(); unsubCustomSentences(); 
      unsubPracticeParagraphs(); unsubStudyGoals(); unsubAchievements(); unsubTags();
    };
  }, [user]);

  // Diff sync wrapper
  const createSyncSetter = <T extends { id: string }>(
    collectionName: string, 
    currentItems: T[], 
    setLocalState: React.Dispatch<React.SetStateAction<T[]>>,
    isSingleDoc: boolean = false
  ) => {
    return async (newItems: T[] | string[]) => {
      if (!user) return;

      // Optimistic update
      if (!isSingleDoc) {
        setLocalState(newItems as T[]);
      }

      try {
        if (isSingleDoc) {
          await setDoc(doc(db, `users/${user.uid}/data/${collectionName}`), { [collectionName]: newItems });
          return;
        }
        
        const newItemsArr = newItems as T[];
        const oldIds = new Set(currentItems.map(i => i.id));
        const newIds = new Set(newItemsArr.map(i => i.id));

        const toAddOrUpdate = newItemsArr.filter(i => !oldIds.has(i.id) || JSON.stringify(i) !== JSON.stringify(currentItems.find(c => c.id === i.id)));
        const toDelete = currentItems.filter(i => !newIds.has(i.id));

        for (const item of toAddOrUpdate) {
          // Remove undefined values to prevent Firestore errors
          const cleanItem = Object.fromEntries(Object.entries(item).filter(([_, v]) => v !== undefined));
          await setDoc(doc(db, `users/${user.uid}/${collectionName}/${item.id}`), cleanItem);
        }
        for (const item of toDelete) {
          await deleteDoc(doc(db, `users/${user.uid}/${collectionName}/${item.id}`));
        }
      } catch (err: any) {
        console.error("Sync error:", err);
        alert("Đã xảy ra lỗi đồng bộ! " + err.message);
      }
    };
  };

  return {
    user, loading,
    words, setWords: createSyncSetter<Word>('words', words, setWords),
    tasks, setTasks: createSyncSetter<Task>('tasks', tasks, setTasks),
    wishlist, setWishlist: createSyncSetter<WishlistItem>('wishlistItems', wishlist, setWishlist),
    logs, setLogs: createSyncSetter<LogEntry>('logEntries', logs, setLogs),
    foodPlaces, setFoodPlaces: createSyncSetter<FoodPlace>('foodPlaces', foodPlaces, setFoodPlaces),
    contentIdeas, setContentIdeas: createSyncSetter<ContentIdea>('contentIdeas', contentIdeas, setContentIdeas),
    assets, setAssets: createSyncSetter<Asset>('assets', assets, setAssets),
    assetCategories, setAssetCategories: createSyncSetter<AssetCategory>('assetCategories', assetCategories, setAssetCategories),
    dictations, setDictations: createSyncSetter<VideoDictation>('dictations', dictations, setDictations as any),
    customSentences, setCustomSentences: createSyncSetter<CustomSentence>('customSentences', customSentences, setCustomSentences),
    practiceParagraphs, setPracticeParagraphs: createSyncSetter<PracticeParagraph>('practiceParagraphs', practiceParagraphs, setPracticeParagraphs),
    studyGoals, setStudyGoals: createSyncSetter<StudyGoal>('studyGoals', studyGoals, setStudyGoals),
    achievements, setAchievements: createSyncSetter<Achievement>('achievements', achievements, setAchievements),
    tags, setTags: createSyncSetter<any>('tags', tags as any, setTags as any, true),
  };
}
