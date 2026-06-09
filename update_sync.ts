import fs from 'fs';

let content = fs.readFileSync('src/lib/useFirebaseSync.ts', 'utf8');

// 1. Add kvStore state
const stateAdd = `const [bulkCurrentCash, setBulkCurrentCash] = useState<Record<number, number>>(() => {`;
const newStates = `const [kvStore, setKvStore] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem("studyHub_kvStore");
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return {};
  });
  const kvStoreRef = React.useRef(kvStore);
  useEffect(() => { kvStoreRef.current = kvStore; }, [kvStore]);

  const [bulkCurrentCash, setBulkCurrentCash] = useState<Record<number, number>>(() => {`;
content = content.replace(stateAdd, newStates);

// 2. Add kvStore effect
const effectAdd = `const unsubAssetsBulk = onSnapshot(doc(db, \`users/\${user.uid}/data/assetsBulk\`), (docSnap) => {`;
const newEffect = `const unsubKvStore = onSnapshot(doc(db, \`users/\${user.uid}/data/kvStore\`), (docSnap) => {
      if (docSnap.exists() && docSnap.data().data) {
        if (JSON.stringify(kvStoreRef.current) !== JSON.stringify(docSnap.data().data)) {
          setKvStore(docSnap.data().data);
          localStorage.setItem("studyHub_kvStore", JSON.stringify(docSnap.data().data));
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, \`users/\${user.uid}/data/kvStore\`));

    const unsubAssetsBulk = onSnapshot(doc(db, \`users/\${user.uid}/data/assetsBulk\`), (docSnap) => {`;
content = content.replace(effectAdd, newEffect);

// 3. Add to unsub function
const unsubAdd = `unsubRewards();
      unsubAssetsBulk();`;
const newUnsub = `unsubRewards();
      unsubAssetsBulk();
      unsubKvStore();`;
content = content.replace(unsubAdd, newUnsub);

// 4. Return it
const returnAdd = `setCustomRewards: async (newValOrFunc: any) => {`;
const newReturn = `kvStore,
    setKvStoreTarget: async (key: string, value: any) => {
      const updated = { ...kvStoreRef.current, [key]: value };
      setKvStore(updated);
      localStorage.setItem("studyHub_kvStore", JSON.stringify(updated));
      if (auth.currentUser) {
        try {
          await setDoc(doc(db, \`users/\${auth.currentUser.uid}/data/kvStore\`), { data: updated }, { merge: true });
        } catch (e) { console.error("KV sync error", e); }
      }
    },
    setCustomRewards: async (newValOrFunc: any) => {`;
content = content.replace(returnAdd, newReturn);

fs.writeFileSync('src/lib/useFirebaseSync.ts', content);
console.log("updated useFirebaseSync");
