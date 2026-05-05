import { useState, useEffect, useCallback } from 'react';
import { db, auth } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import type { Word, Task, WishlistItem, LogEntry, FoodPlace, ContentIdea, Asset, AssetCategory } from '../types';

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
    const migrated = localStorage.getItem(`migrated_${uid}`);
    if (migrated) return;

    try {
      const savedAssets = localStorage.getItem('spatial_hub_assets');
      if (savedAssets) {
        const parsed = JSON.parse(savedAssets);
        for (const item of parsed) {
          await setDoc(doc(db, `users/${uid}/assets/${item.id}`), { ...item });
        }
      }

      const savedCats = localStorage.getItem('spatial_hub_asset_cats');
      if (savedCats) {
        const parsed = JSON.parse(savedCats);
        for (const item of parsed) {
          await setDoc(doc(db, `users/${uid}/assetCategories/${item.id}`), { ...item });
        }
      }

      const savedWords = localStorage.getItem('spatial_hub_words');
      if (savedWords) {
        const parsed = JSON.parse(savedWords);
        for (const item of parsed) {
          await setDoc(doc(db, `users/${uid}/words/${item.id}`), { ...item });
        }
      }

      const savedTasks = localStorage.getItem('spatial_hub_tasks');
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        for (const item of parsed) {
          await setDoc(doc(db, `users/${uid}/tasks/${item.id}`), { ...item });
        }
      }

      const savedWishlist = localStorage.getItem('spatial_hub_wishlist');
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist);
        for (const item of parsed) {
          await setDoc(doc(db, `users/${uid}/wishlistItems/${item.id}`), { ...item });
        }
      }

      const savedLogs = localStorage.getItem('spatial_hub_logs');
      if (savedLogs) {
        const parsed = JSON.parse(savedLogs);
        for (const item of parsed) {
          await setDoc(doc(db, `users/${uid}/logEntries/${item.id}`), { ...item });
        }
      }

      const savedPlaces = localStorage.getItem('spatial_hub_places');
      if (savedPlaces) {
        const parsed = JSON.parse(savedPlaces);
        for (const item of parsed) {
          await setDoc(doc(db, `users/${uid}/foodPlaces/${item.id}`), { ...item });
        }
      }

      const savedIdeas = localStorage.getItem('spatial_hub_content_ideas');
      if (savedIdeas) {
        const parsed = JSON.parse(savedIdeas);
        for (const item of parsed) {
          await setDoc(doc(db, `users/${uid}/contentIdeas/${item.id}`), { ...item });
        }
      }

      const savedTags = localStorage.getItem('spatial_hub_tags');
      if (savedTags) {
        const parsed = JSON.parse(savedTags);
        await setDoc(doc(db, `users/${uid}/data/tags`), { tags: parsed });
      }

      localStorage.setItem(`migrated_${uid}`, 'true');
    } catch (e) {
      console.error("Migration error", e);
    }
  };

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const unsubWords = onSnapshot(collection(db, `users/${user.uid}/words`), (snap) => {
      setWords(snap.docs.map(d => d.data() as Word));
    });
    const unsubTasks = onSnapshot(collection(db, `users/${user.uid}/tasks`), (snap) => {
      setTasks(snap.docs.map(d => d.data() as Task));
    });
    const unsubWishlist = onSnapshot(collection(db, `users/${user.uid}/wishlistItems`), (snap) => {
      setWishlist(snap.docs.map(d => d.data() as WishlistItem));
    });
    const unsubLogs = onSnapshot(collection(db, `users/${user.uid}/logEntries`), (snap) => {
      setLogs(snap.docs.map(d => d.data() as LogEntry));
    });
    const unsubFood = onSnapshot(collection(db, `users/${user.uid}/foodPlaces`), (snap) => {
      setFoodPlaces(snap.docs.map(d => d.data() as FoodPlace));
    });
    const unsubIdeas = onSnapshot(collection(db, `users/${user.uid}/contentIdeas`), (snap) => {
      setContentIdeas(snap.docs.map(d => d.data() as ContentIdea));
    });
    const unsubAssets = onSnapshot(collection(db, `users/${user.uid}/assets`), (snap) => {
      setAssets(snap.docs.map(d => d.data() as Asset));
    });
    const unsubCats = onSnapshot(collection(db, `users/${user.uid}/assetCategories`), (snap) => {
      const cats = snap.docs.map(d => d.data() as AssetCategory);
      if (cats.length > 0) setAssetCategories(cats);
    });
    const unsubTags = onSnapshot(doc(db, `users/${user.uid}/data/tags`), (docSnap) => {
      if (docSnap.exists() && docSnap.data().tags) {
        setTags(docSnap.data().tags);
      }
    });

    const timer = setTimeout(() => { setLoading(false); }, 1500);

    return () => {
      clearTimeout(timer);
      unsubWords(); unsubTasks(); unsubWishlist(); unsubLogs(); unsubFood();
      unsubIdeas(); unsubAssets(); unsubCats(); unsubTags();
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
    tags, setTags: createSyncSetter<any>('tags', tags as any, setTags as any, true),
  };
}
