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
    } else {
      try {
        const saved = localStorage.getItem(key);
        if (saved !== null) {
          try { 
            const parsed = JSON.parse(saved);
            if (JSON.stringify(parsed) !== JSON.stringify(val)) setVal(parsed); 
            return; 
          } catch { 
            if (saved !== val as unknown as string) setVal(saved as unknown as T); 
            return; 
          }
        }
      } catch {}
      if (JSON.stringify(defaultValue) !== JSON.stringify(val)) {
        setVal(defaultValue);
      }
    }
  }, [key, kvStore[key]]);

  const setBoth = (newValOrFunc: T | ((prev: T) => T)) => {
    setVal(prev => {
       const finalVal = typeof newValOrFunc === 'function' ? (newValOrFunc as Function)(prev) : newValOrFunc;
       const valStr = typeof finalVal === 'string' ? finalVal : JSON.stringify(finalVal);
       localStorage.setItem(key, valStr);
       setKvStoreTarget(key, finalVal);
       return finalVal;
    });
  };

  return [val, setBoth];
}
