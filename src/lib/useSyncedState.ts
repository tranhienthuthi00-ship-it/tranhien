import { useState, useEffect } from 'react';
import { useFirebase } from '../context/FirebaseContext';

export function useSyncedState<T>(key: string, defaultValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const { kvStore, setKvStoreTarget } = useFirebase();
  
  const [val, setVal] = useState<T>(() => {
    if (kvStore[key] !== undefined) return kvStore[key];
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        try { return JSON.parse(saved); } catch { return saved as unknown as T; }
      }
    } catch {}
    return defaultValue;
  });

  useEffect(() => {
    if (kvStore[key] !== undefined) {
      // Deep compare to avoid unnecessary renders
      if (JSON.stringify(kvStore[key]) !== JSON.stringify(val)) {
        setVal(kvStore[key]);
      }
    }
  }, [key, kvStore[key]]);

  const setBoth = (newValOrFunc: T | ((prev: T) => T)) => {
    setVal(prev => {
       const finalVal = typeof newValOrFunc === 'function' ? (newValOrFunc as Function)(prev) : newValOrFunc;
       const valStr = typeof finalVal === 'string' ? finalVal : JSON.stringify(finalVal);
       try {
         localStorage.setItem(key, valStr);
       } catch (e) {
         console.warn("localStorage.setItem failed in useSyncedState:", e);
       }
       setKvStoreTarget(key, finalVal);
       return finalVal;
    });
  };

  return [val, setBoth];
}
