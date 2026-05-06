import React, { useState } from "react";
import { Search, BookA, Tag as TagIcon, Plus, X } from "lucide-react";
import type { Word, WordTag } from "@/types";
import { cn } from "@/lib/utils";

const WORD_TYPES = ['noun', 'verb', 'adj', 'adv', 'idiom', 'phrasal verb', 'phrase', 'sentence'];

export function Academy({
  words,
  setWords,
  tags,
  setTags
}: {
  words: Word[];
  setWords: (words: Word[]) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
}) {
  const [activeView, setActiveView] = useState<'log' | 'bank'>('log');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<WordTag | null>(null);
  const [editingWordId, setEditingWordId] = useState<string | null>(null);

  // Form State
  const [vocab, setVocab] = useState("");
  const [type, setType] = useState(WORD_TYPES[0]);
  const [ipa, setIpa] = useState("");
  const [definition, setDefinition] = useState("");
  const [example, setExample] = useState("");
  const [activeTags, setActiveTags] = useState<WordTag[]>([]);
  const [newTag, setNewTag] = useState("");

  const handleLogWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vocab.trim() || !definition.trim()) return;

    if (editingWordId) {
      setWords(words.map(w => w.id === editingWordId ? {
        ...w,
        vocabulary: vocab,
        wordType: type,
        ipa,
        definition,
        examples: example ? [example] : [],
        tags: activeTags,
      } : w));
      setEditingWordId(null);
    } else {
      const newWord: Word = {
        id: Date.now().toString(),
        vocabulary: vocab,
        wordType: type,
        ipa,
        definition,
        examples: example ? [example] : [],
        tags: activeTags,
        difficulty: 0,
        lastReviewed: new Date().toISOString(),
        nextReview: new Date(Date.now() + 86400000).toISOString(), // +1 day
      };
      setWords([newWord, ...words]);
    }
    
    setVocab(""); setIpa(""); setDefinition(""); setExample(""); setActiveTags([]);
    setActiveView('bank');
  };

  const startEdit = (word: Word) => {
    setEditingWordId(word.id);
    setVocab(word.vocabulary);
    setType(word.wordType);
    setIpa(word.ipa);
    setDefinition(word.definition);
    setExample(word.examples[0] || "");
    setActiveTags(word.tags);
    setActiveView('log');
  };

  const deleteWord = (id: string) => {
    if (window.confirm("Are you sure you want to delete this word?")) {
      setWords(words.filter(w => w.id !== id));
    }
  };

  const toggleTag = (tag: WordTag) => {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const filteredWords = words.filter(w => {
    const matchesSearch = w.vocabulary.toLowerCase().includes(searchQuery.toLowerCase()) || w.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? w.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="max-w-4xl mx-auto p-2 md:p-4">
       <div className="flex justify-center gap-6 mb-4">
         <button 
           onClick={() => {
             if (editingWordId) {
               setEditingWordId(null);
               setVocab(""); setIpa(""); setDefinition(""); setExample(""); setActiveTags([]);
             }
             setActiveView('log');
           }}
           className={cn("text-xl font-sans font-bold transition-opacity", activeView === 'log' ? "opacity-100 border-b-4 border-ink" : "opacity-40 hover:opacity-70")}
         >
           {editingWordId ? "Edit Word" : "Log New Word"}
         </button>
         <button 
           onClick={() => setActiveView('bank')}
           className={cn("text-xl font-sans font-bold transition-opacity", activeView === 'bank' ? "opacity-100 border-b-4 border-ink" : "opacity-40 hover:opacity-70")}
         >
           Word Bank
         </button>
       </div>

       {activeView === 'log' && (
         <div className="max-w-xl mx-auto bg-white/60 p-4 sketch-border shadow-md">
           <form onSubmit={handleLogWord} className="space-y-3">
             <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                  <label className="font-sans font-bold text-[10px] opacity-60 tracking-widest uppercase">Vocabulary / Phrase *</label>
                  <input required value={vocab} onChange={e => setVocab(e.target.value)} className="bg-transparent border-b-2 border-ink py-1 focus:outline-none text-xl hand-text w-full" placeholder="e.g. Itinerary" />
                </div>
                <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                  <label className="font-sans font-bold text-[10px] opacity-60 tracking-widest uppercase">IPA Pronunciation</label>
                  <input value={ipa} onChange={e => setIpa(e.target.value)} className="bg-transparent border-b-2 border-ink py-1 focus:outline-none font-sans text-sm" placeholder="/aɪˈtɪnərəri/" />
                </div>
             </div>

             <div className="flex gap-1.5 flex-wrap pt-1">
               {WORD_TYPES.map(t => (
                 <button 
                   key={t} type="button" onClick={() => setType(t)}
                   className={cn("px-2.5 py-0.5 font-sans text-xs rounded-full border-2", type === t ? "border-ink bg-ink text-paper" : "border-ink/20 text-ink/60")}
                 >
                   {t}
                 </button>
               ))}
             </div>

             <div className="flex flex-col gap-1">
                <label className="font-sans font-bold text-[10px] opacity-60 tracking-widest uppercase">Definition *</label>
                <textarea required value={definition} onChange={e => setDefinition(e.target.value)} className="sketch-input min-h-[40px] text-sm py-1.5" placeholder="A planned route or journey..." rows={1} />
             </div>

             <div className="flex flex-col gap-1">
                <label className="font-sans font-bold text-[10px] opacity-60 tracking-widest uppercase">Example Sentence</label>
                <textarea value={example} onChange={e => setExample(e.target.value)} className="sketch-input min-h-[40px] hand-text text-lg py-1.5" placeholder="We will briefly review the itinerary before the cruise departs." rows={1} />
             </div>

             <div className="flex flex-col gap-1">
                <label className="font-sans font-bold text-[10px] opacity-60 tracking-widest uppercase flex items-center gap-1">
                  <TagIcon size={12} /> Tags
                </label>
                <div className="flex gap-2 flex-wrap mt-1 items-center">
                  {tags.map(tag => (
                    <div key={tag} className="flex items-center gap-1 group">
                      <button 
                        type="button" onClick={() => toggleTag(tag)}
                        className={cn("pill cursor-pointer hover:bg-ink/5 transition-colors m-0", activeTags.includes(tag) ? "bg-crimson/10 border-crimson text-crimson" : "")}
                      >
                        {tag}
                      </button>
                      <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="text-ink/20 hover:text-crimson opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-1 ml-2">
                    <input 
                      value={newTag} 
                      onChange={e => setNewTag(e.target.value)} 
                      placeholder="New Tag..." 
                      className="sketch-input py-1 px-2 text-xs w-24"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newTag.trim() && !tags.includes(newTag.trim())) {
                            setTags([...tags, newTag.trim()]);
                            setNewTag('');
                          }
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      className="text-ink/60 hover:text-ink"
                      onClick={() => {
                        if (newTag.trim() && !tags.includes(newTag.trim())) {
                          setTags([...tags, newTag.trim()]);
                          setNewTag('');
                        }
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
             </div>

             <div className="pt-4 border-t-2 border-dashed border-ink/20 flex justify-between items-center">
               {editingWordId && (
                 <button 
                   type="button" 
                   onClick={() => {
                     setEditingWordId(null);
                     setVocab(""); setIpa(""); setDefinition(""); setExample(""); setActiveTags([]);
                     setActiveView('bank');
                   }}
                   className="text-ink/60 hover:text-ink font-sans font-bold text-sm"
                 >
                   Cancel Edit
                 </button>
               )}
               <button type="submit" className={cn("sketch-button sketch-button-primary py-2 px-6 text-base flex items-center gap-2 inline-flex", !editingWordId && "ml-auto")}>
                 <Plus size={20} /> {editingWordId ? "Update Word" : "Save Word"}
               </button>
             </div>
           </form>
         </div>
       )}

       {activeView === 'bank' && (
         <div className="space-y-4">
           <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" size={20} />
                <input 
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search vocabs, definitions..."
                  className="sketch-input pl-10 w-full bg-white/50"
                />
             </div>
             <div className="flex gap-2 p-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
               <button onClick={() => setSelectedTag(null)} className={cn("pill cursor-pointer", !selectedTag ? "bg-ink text-paper border-ink" : "")}>All</button>
               {tags.map(tag => (
                 <button 
                   key={tag} onClick={() => setSelectedTag(tag)}
                   className={cn("pill cursor-pointer", selectedTag === tag ? "bg-crimson text-white border-crimson" : "hover:border-crimson/40")}
                 >
                   {tag}
                 </button>
               ))}
             </div>
           </div>

           <section className="sketch-border p-4 bg-white/30 max-w-sm ml-auto">
             <h3 className="text-sm font-bold uppercase mb-2 font-sans tracking-tight">SRS Status Engine</h3>
             <div className="flex justify-between items-end text-xs mb-2">
               <span className="hand-text text-sm">{words.filter(w => new Date(w.nextReview) <= new Date()).length} Due Now</span>
               <span className="font-mono">{words.filter(w => w.difficulty === 1).length} Mastered</span>
             </div>
             <div className="srs-bar">
               <div className="srs-progress" style={{ width: `${words.length ? (words.filter(w => w.difficulty === 1).length / words.length) * 100 : 0}%` }}></div>
             </div>
           </section>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin content-start">
             {filteredWords.map(word => (
               <div key={word.id} className="p-4 sketch-border bg-white/40 flex flex-col gap-3 relative group">
                 <div className="flex justify-between items-start">
                   <div>
                     <h3 className="font-serif text-xl font-bold text-ink">{word.vocabulary}</h3>
                     <p className="font-sans text-xs text-ink/60">{word.ipa} • <span className="italic">{word.wordType}</span></p>
                   </div>
                    <div className="flex gap-3 items-center">
                       <button onClick={() => startEdit(word)} className="font-sans text-[10px] font-bold uppercase tracking-wider text-ink/40 hover:text-ink transition-colors">
                          Edit
                       </button>
                       <button onClick={() => deleteWord(word.id)} className="font-sans text-[10px] font-bold uppercase tracking-wider text-ink/40 hover:text-crimson transition-colors">
                          Delete
                       </button>
                       <BookA className="text-ink/20 group-hover:text-crimson transition-colors w-4 h-4 ml-1" />
                    </div>
                 </div>
                 <p className="font-sans font-medium line-clamp-3 text-sm">{word.definition}</p>
                 {word.examples[0] && (
                   <p className="hand-text text-lg">"{word.examples[0]}"</p>
                 )}
                 <div className="mt-auto flex gap-1.5 flex-wrap pt-2">
                   {word.tags.map(t => (
                     <span key={t} className="px-2 py-0.5 rounded-full border border-ink/20 text-[10px] uppercase font-bold tracking-widest text-ink/60">
                       {t}
                     </span>
                   ))}
                 </div>
               </div>
             ))}
             {filteredWords.length === 0 && (
               <div className="col-span-full py-16 text-center flex flex-col items-center gap-3 opacity-50">
                 <BookA size={40} />
                 <p className="hand-text text-2xl">No words found. Time to log some more!</p>
               </div>
             )}
           </div>
         </div>
       )}
    </div>
  );
}
