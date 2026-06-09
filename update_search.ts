import fs from 'fs';

let content = fs.readFileSync('src/components/DigitalJournal.tsx', 'utf8');

// 1. Add onSearch to props
content = content.replace("export function DigitalJournal({", "  onSearch?: (query: string) => void;\n}\n\nexport function DigitalJournal({");
content = content.replace("setLogs,", "setLogs,\n  onSearch,");

// 2. Wrap search input in a form or just detect Enter key
const searchOld = `<input 
                  type="text" 
                  placeholder="Tìm kiếm..." 
                  value={homeSearch} 
                  onChange={e => setHomeSearch(e.target.value)}
                  className="bg-transparent outline-none flex-1 text-sm font-hand font-bold text-[#3A1412] placeholder-[#3A1412]/50" 
                />`;
const searchNew = `<input 
                  type="text" 
                  placeholder="Tìm kiếm..." 
                  value={homeSearch} 
                  onChange={e => setHomeSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && homeSearch.trim() && onSearch) {
                      onSearch(homeSearch.trim());
                    }
                  }}
                  className="bg-transparent outline-none flex-1 text-sm font-hand font-bold text-[#3A1412] placeholder-[#3A1412]/50" 
                />`;
content = content.replace(searchOld, searchNew);

// Add search execution via button click
const btnOld = `<svg className="w-6 h-6 text-[#3A1412] stroke-current stroke-[3]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3a7 7 0 0 0-7 7 c0 3 2 5 4 6 s5 2 7-1 s4-5 1-8 s-3-4-5-4 z" /><path d="M16 16 l5 4" /></svg>
            </div>`;
const btnNew = `<button onClick={() => { if (homeSearch.trim() && onSearch) onSearch(homeSearch.trim()); }} className="cursor-pointer hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[#3A1412] stroke-current stroke-[3]" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3a7 7 0 0 0-7 7 c0 3 2 5 4 6 s5 2 7-1 s4-5 1-8 s-3-4-5-4 z" /><path d="M16 16 l5 4" /></svg>
                </button>
            </div>`;
content = content.replace(btnOld, btnNew);

fs.writeFileSync('src/components/DigitalJournal.tsx', content);

let app = fs.readFileSync('src/App.tsx', 'utf8');

// 3. App component state for global collection search
if (app.indexOf('const [collectionSearchQuery, setCollectionSearchQuery] =') === -1) {
  app = app.replace('const [activeTab, setActiveTab] = useState("Home");', 'const [activeTab, setActiveTab] = useState("Home");\n  const [collectionSearchQuery, setCollectionSearchQuery] = useState("");');
}

// 4. Pass onSearch
app = app.replace('<DigitalJournal \n              logs={logs}', '<DigitalJournal \n              onSearch={(q) => {\n                setCollectionSearchQuery(q);\n                setActiveTab("Collections");\n              }}\n              logs={logs}');

// 5. Apply the search query globally to collections?
// Wait, passing it down to Collections is tricky because they are scattered. 
// At least we can add a search bar inside Collections that syncs with `collectionSearchQuery`!
fs.writeFileSync('src/App.tsx', app);
console.log("Added search routing");
