import fs from 'fs';

let app = fs.readFileSync('src/App.tsx', 'utf8');

// App component state for global collection search
if (app.indexOf('const [collectionSearchQuery, setCollectionSearchQuery] =') === -1) {
  app = app.replace('const [activeTab, setActiveTab] = useState("Home");', 'const [activeTab, setActiveTab] = useState("Home");\n  const [collectionSearchQuery, setCollectionSearchQuery] = useState("");');
}

// Pass onSearch
app = app.replace('<DigitalJournal \n              logs={logs}', '<DigitalJournal \n              onSearch={(q) => {\n                setCollectionSearchQuery(q);\n                setActiveTab("Collections");\n              }}\n              logs={logs}');

// Apply search filter locally inside Collections header and pass down
const cHeaderOld = `<div className="flex flex-col gap-4">
            <div className="bg-paper py-2 flex justify-center flex-wrap gap-1.5 md:gap-4 mb-2 px-1 md:px-4 text-ink/60 max-w-full">`;
  
const cHeaderNew = `<div className="flex flex-col gap-4">
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
            <div className="bg-paper py-2 flex justify-center flex-wrap gap-1.5 md:gap-4 mb-2 px-1 md:px-4 text-ink/60 max-w-full">`;

if(app.indexOf(cHeaderOld) !== -1) {
  app = app.replace(cHeaderOld, cHeaderNew);
  console.log("Replaced collection header");
}

fs.writeFileSync('src/App.tsx', app);
