import { useState } from "react";
import type { FormEvent } from "react";
import { Plus, Trash2, MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FoodPlace } from "@/types";

export function Places({ 
  places, 
  setPlaces 
}: { 
  places: FoodPlace[]; 
  setPlaces: (p: FoodPlace[]) => void 
}) {
  const [filter, setFilter] = useState<'All' | 'Food' | 'Cafe' | 'Dessert' | 'Travel' | 'Other'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Visited' | 'Want to visit'>('All');
  const [sortBy, setSortBy] = useState<'Recent' | 'Rating'>('Recent');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState<'Food' | 'Cafe' | 'Dessert' | 'Travel' | 'Other'>('Food');
  const [newStatus, setNewStatus] = useState<'Visited' | 'Want to visit'>('Want to visit');
  const [newRating, setNewRating] = useState(5);
  const [newAddress, setNewAddress] = useState("");
  const [newReview, setNewReview] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);

  const addTag = () => {
    if (tagInput.trim() && !newTags.includes(tagInput.trim())) {
      setNewTags([...newTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeNewTag = (tag: string) => {
    setNewTags(newTags.filter(t => t !== tag));
  };

  const addPlace = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setPlaces([{
      id: Date.now().toString(),
      name: newName,
      category: newCat,
      status: newStatus,
      rating: newRating,
      address: newAddress,
      review: newReview || undefined,
      notes: newNotes || undefined,
      tags: newTags.length > 0 ? newTags : undefined
    }, ...places]);
    
    setNewName("");
    setNewAddress("");
    setNewReview("");
    setNewNotes("");
    setNewRating(5);
    setNewStatus('Want to visit');
    setNewTags([]);
  };

  const removePlace = (id: string) => {
    if (window.confirm("Xóa địa điểm này?")) {
      setPlaces(places.filter(p => p.id !== id));
    }
  };

  const toggleStatus = (id: string) => {
    setPlaces(places.map(p => 
      p.id === id ? { ...p, status: p.status === 'Visited' ? 'Want to visit' : 'Visited' } : p
    ));
  };

  const allTags = Array.from(new Set(places.flatMap(p => p.tags || [])));

  const filteredPlaces = places
    .filter(p => {
      const matchCat = filter === 'All' || p.category === filter;
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchTag = !selectedTag || (p.tags && p.tags.includes(selectedTag));
      return matchCat && matchStatus && matchTag;
    })
    .sort((a, b) => {
      if (sortBy === 'Rating') {
        return b.rating - a.rating || b.id.localeCompare(a.id);
      }
      return b.id.localeCompare(a.id);
    });

  return (
    <div className="max-w-4xl mx-auto px-4 font-sans pb-10">
      <div className="mb-8 text-center">
         <h1 className="text-4xl font-black font-logo tracking-wide mb-2 uppercase">Spatial Spots</h1>
         <p className="text-ink/60 font-medium">Lưu lại những nơi tâm đắc hoặc muốn ghé thăm</p>
      </div>

      <form onSubmit={addPlace} className="bg-paper p-5 sketch-border border-dashed border-ink/30 mb-8 space-y-4 relative">
        <div className="absolute -top-3 -left-3 rotate-[-10deg]">
          <span className="bg-crimson text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider sketch-border">Thêm Địa Điểm</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">Tên địa điểm</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ví dụ: Cà phê Phê La, Đà Lạt..."
                className="sketch-input bg-white/50 py-2"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">Phân loại</label>
                <select 
                  value={newCat} 
                  onChange={(e) => setNewCat(e.target.value as any)}
                  className="sketch-input bg-white/50 cursor-pointer py-2"
                >
                  <option value="Food">Food (Quán ăn)</option>
                  <option value="Cafe">Cafe (Cà phê)</option>
                  <option value="Dessert">Dessert (Đồ ngọt)</option>
                  <option value="Travel">Travel (Du lịch)</option>
                  <option value="Other">Other (Khai khác)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">Trạng thái</label>
                <select 
                  value={newStatus} 
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="sketch-input bg-white/50 cursor-pointer py-2"
                >
                  <option value="Want to visit">Muốn đi ✨</option>
                  <option value="Visited">Đã đi ✅</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">Địa chỉ (nếu có)</label>
              <input
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Đường, quận, thành phố..."
                className="sketch-input bg-white/50 py-2"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">Tags (Ví dụ: Chill, Hẹn hò, Đắt...)</label>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Nhấn Enter để thêm..."
                  className="sketch-input bg-white/50 py-2 flex-1"
                />
                <button type="button" onClick={addTag} className="sketch-button px-3 py-1">Add</button>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {newTags.map(tag => (
                  <span key={tag} className="bg-ink/5 border border-ink/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                    #{tag}
                    <button type="button" onClick={() => removeNewTag(tag)} className="text-crimson hover:text-red-700">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5 h-full">
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">Ghi chú / Review</label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Ghi chú thông tin quan trọng, giờ mở cửa, món must-try..."
                className="sketch-input bg-white/50 w-full flex-1 min-h-[100px] resize-none py-2"
              />
              <div className="flex items-center justify-between mt-1">
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ink/50">Đánh giá:</span>
                    <select 
                      value={newRating} 
                      onChange={(e) => setNewRating(Number(e.target.value))}
                      className="sketch-input bg-white/50 w-16 cursor-pointer py-1"
                    >
                      {[5,4,3,2,1].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                 </div>
                 <button type="submit" className="sketch-button sketch-button-primary bg-ink text-paper text-sm py-2 px-8 flex items-center gap-2">
                    <Plus size={16} /> Lưu Địa Điểm
                 </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className="flex flex-col gap-4 mb-8">
        <div className="flex gap-2 flex-wrap justify-center">
          {(['All', 'Food', 'Cafe', 'Dessert', 'Travel', 'Other'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "px-4 py-1 rounded-full border-2 transition-all font-bold text-[11px] uppercase tracking-wider",
                filter === cat 
                  ? "bg-ink text-paper border-ink shadow-md" 
                  : "border-ink/20 text-ink/60 hover:bg-ink/5 hover:border-ink/40"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex gap-4 justify-center items-center">
          {(['All', 'Want to visit', 'Visited'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "font-sans font-bold text-xs transition-colors px-2 py-0.5",
                statusFilter === status ? "text-crimson border-b-2 border-crimson" : "text-ink/40 hover:text-ink/70"
              )}
            >
              {status === 'All' ? 'Tất cả' : status === 'Want to visit' ? 'Muốn đi' : 'Đã đi'}
            </button>
          ))}
          <div className="w-[1px] h-3 bg-ink/10 mx-2" />
          <div className="flex gap-2">
            <button 
              onClick={() => setSortBy('Recent')}
              className={cn("text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 transition-opacity", sortBy === 'Recent' ? "text-ink opacity-100" : "text-ink opacity-30 hover:opacity-50")}
            >
              Mới nhất
            </button>
            <button 
              onClick={() => setSortBy('Rating')}
              className={cn("text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 transition-opacity", sortBy === 'Rating' ? "text-ink opacity-100" : "text-ink opacity-30 hover:opacity-50")}
            >
              Đánh giá
            </button>
          </div>
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center border-t border-dashed border-ink/10 pt-4">
            <button 
              onClick={() => setSelectedTag(null)}
              className={cn("px-2 py-0.5 text-[10px] font-bold uppercase rounded transition-all", !selectedTag ? "text-crimson bg-crimson/5 underline underline-offset-4" : "text-ink/40 hover:text-ink/60")}
            >
              #Tất cả
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-bold uppercase rounded transition-all",
                  selectedTag === tag ? "text-crimson bg-crimson/5 underline underline-offset-4 font-black" : "text-ink/40 hover:text-ink/60"
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin content-start">
        {filteredPlaces.map(place => (
          <div key={place.id} className="p-5 sketch-border bg-white/60 relative group flex flex-col justify-between hover:bg-white transition-all hover:translate-y-[-2px]">
             <div>
               <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xl leading-tight text-ink">{place.name}</h3>
                      <button 
                        onClick={() => toggleStatus(place.id)}
                        className={cn(
                          "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border transition-all",
                          place.status === 'Visited' 
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        )}
                      >
                        {place.status === 'Visited' ? 'Visited' : 'Want to visit'}
                      </button>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-ink/40">
                      {place.category}
                    </span>
                    {place.tags && place.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {place.tags.map(tag => (
                          <span key={tag} className="text-[8px] font-mono uppercase text-crimson/60">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-0.5">
                     {Array.from({ length: place.rating }).map((_, i) => (
                       <Star key={i} size={14} className="fill-crimson text-crimson" />
                     ))}
                  </div>
               </div>
               
               {place.address && (
                 <div className="flex items-start gap-1.5 text-xs text-ink/60 mb-3 bg-ink/5 p-2 rounded">
                   <MapPin size={12} className="mt-0.5 shrink-0" />
                   <p className="leading-snug">{place.address}</p>
                 </div>
               )}

               {place.notes && (
                 <div className="mt-2 p-3 bg-yellow-50/50 border border-dashed border-amber-200 text-sm font-hand leading-relaxed text-ink/80 rounded relative">
                   <div className="absolute -top-2 right-2 flex gap-1">
                      <div className="w-1 h-1 rounded-full bg-amber-400" />
                      <div className="w-1 h-1 rounded-full bg-amber-400" />
                   </div>
                   {place.notes}
                 </div>
               )}
             </div>

             <div className="mt-5 flex justify-end">
               <button 
                 onClick={() => removePlace(place.id)}
                 className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-crimson hover:text-white rounded-lg border border-ink/10 shadow-sm"
                 title="Xóa địa điểm"
               >
                 <Trash2 size={16} />
               </button>
             </div>
          </div>
        ))}
        {filteredPlaces.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <div className="text-ink/20 mb-4 flex justify-center">
              <MapPin size={64} strokeWidth={1} />
            </div>
            <p className="hand-text text-2xl text-ink/40">Chưa có địa điểm nào ở mục này. Hãy thêm vào nhé!</p>
          </div>
        )}
      </div>
    </div>
  );
}
