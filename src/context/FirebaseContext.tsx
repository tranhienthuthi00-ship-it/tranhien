import React, { createContext, useContext, ReactNode } from 'react';
import { useFirebaseSync } from '../lib/useFirebaseSync';

const FirebaseContext = createContext<ReturnType<typeof useFirebaseSync> | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const sync = useFirebaseSync();
  return (
    <FirebaseContext.Provider value={sync}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
