import { useState } from "react";
import type { FormEvent } from "react";
import { Plus, Trash2, MapPin, Star, Edit2, ExternalLink } from "lucide-react";
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
  const [selectedCityForTop, setSelectedCityForTop] = useState<string>("");
  const [selectedCategoryForTop, setSelectedCategoryForTop] = useState<string>("");
  const [showTopCities, setShowTopCities] = useState(false);
  
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState<'Food' | 'Cafe' | 'Dessert' | 'Travel' | 'Other'>('Food');
  const [newStatus, setNewStatus] = useState<'Visited' | 'Want to visit'>('Want to visit');
  const [newRating, setNewRating] = useState(5);
  const [newAddress, setNewAddress] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newReview, setNewReview] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newPrice, setNewPrice] = useState<string>("");
  const [newCity, setNewCity] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const startEdit = (place: FoodPlace) => {
    setEditingId(place.id);
    setNewName(place.name);
    setNewCat(place.category);
    setNewStatus(place.status);
    setNewRating(place.rating);
    setNewAddress(place.address || "");
    setNewLink(place.link || "");
    setNewReview(place.review || "");
    setNewNotes(place.notes || "");
    setNewPrice(place.price?.toString() || "");
    setNewCity(place.city || "");
    setNewTags(place.tags || []);
    setTagInput("");
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewName("");
    setNewAddress("");
    setNewLink("");
    setNewReview("");
    setNewNotes("");
    setNewPrice("");
    setNewCity("");
    setNewRating(5);
    setNewStatus('Want to visit');
    setNewTags([]);
  };

  const addTag = () => {
    const normalizedTag = tagInput.trim().toLowerCase();
    if (normalizedTag && !newTags.includes(normalizedTag)) {
      setNewTags([...newTags, normalizedTag]);
      setTagInput("");
    }
  };

  const removeNewTag = (tag: string) => {
    setNewTags(newTags.filter(t => t !== tag));
  };

  const addPlace = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    if (editingId) {
      setPlaces(places.map(p => p.id === editingId ? {
        ...p,
        name: newName,
        category: newCat,
        status: newStatus,
        rating: newRating,
        address: newAddress,
        link: newLink || undefined,
        review: newReview || undefined,
        notes: newNotes || undefined,
        price: newPrice ? Number(newPrice) : undefined,
        city: newCity || undefined,
        tags: newTags.length > 0 ? newTags.map(t => t.toLowerCase()) : undefined
      } : p));
      setEditingId(null);
    } else {
      setPlaces([{
        id: Date.now().toString(),
        name: newName,
        category: newCat,
        status: newStatus,
        rating: newRating,
        address: newAddress,
        link: newLink || undefined,
        review: newReview || undefined,
        notes: newNotes || undefined,
        price: newPrice ? Number(newPrice) : undefined,
        city: newCity || undefined,
        tags: newTags.length > 0 ? newTags.map(t => t.toLowerCase()) : undefined
      }, ...places]);
    }
    
    setNewName("");
    setNewAddress("");
    setNewLink("");
    setNewReview("");
    setNewNotes("");
    setNewPrice("");
    setNewCity("");
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

  const toggleFavorite = (id: string) => {
    setPlaces(places.map(p => 
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    ));
  };

  const allTags = Array.from(new Set(places.flatMap(p => (p.tags || []).map(t => t.toLowerCase()))));
  const allCities = Array.from(new Set(places.map(p => p.city).filter(Boolean))) as string[];
  const categories = ['Food', 'Cafe', 'Dessert', 'Travel', 'Other'] as const;
  
  // Calculate top 10 places overall or by city/category prioritized by rating and cheapness
  const topPlaces = places
    .filter(p => 
      p.status === 'Visited' && 
      p.rating >= 4 && 
      (!selectedCityForTop || p.city === selectedCityForTop) &&
      (!selectedCategoryForTop || p.category === selectedCategoryForTop)
    )
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return (a.price ?? Infinity) - (b.price ?? Infinity);
    })
    .slice(0, 10);

  const filteredPlaces = places
    .filter(p => {
      const matchCat = filter === 'All' || p.category === filter || (filter as any) === 'Favorite';
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchTag = !selectedTag || (p.tags && p.tags.map(t => t.toLowerCase()).includes(selectedTag.toLowerCase()));
      const matchFav = (filter as any) === 'Favorite' ? p.isFavorite : true;
      return matchCat && matchStatus && matchTag && matchFav;
    })
    .sort((a, b) => {
      if (sortBy === 'Rating') {
        return b.rating - a.rating || b.id.localeCompare(a.id);
      }
      return b.id.localeCompare(a.id);
    });

  return (
    <div className="max-w-4xl mx-auto px-2 md:px-4 font-sans pb-10">
      <div className="mb-6 text-center">
         <h1 className="text-3xl md:text-4xl font-black font-logo tracking-wide mb-2 uppercase">Spatial Spots</h1>
         <p className="text-xs md:text-sm text-ink/60 font-medium">Lưu lại những nơi tâm đắc hoặc muốn ghé thăm</p>
      </div>

      <form onSubmit={addPlace} className="bg-paper p-4 md:p-5 sketch-border border-dashed border-ink/30 mb-8 space-y-4 relative mx-1">
        <div className="absolute -top-3 -left-2 rotate-[-10deg]">
          <span className="bg-crimson text-white px-2 py-0.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider sketch-border whitespace-nowrap">
            {editingId ? "Cập Nhật Địa Điểm" : "Thêm Địa Điểm"}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-ink/50 ml-1">Tên địa điểm</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ví dụ: Cà phê Phê La..."
                className="sketch-input bg-white/50 py-2 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-ink/50 ml-1">Phân loại</label>
                <select 
                  value={newCat} 
                  onChange={(e) => setNewCat(e.target.value as any)}
                  className="sketch-input bg-white/50 cursor-pointer py-2 text-xs"
                >
                  <option value="Food">Food</option>
                  <option value="Cafe">Cafe</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Travel">Travel</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-ink/50 ml-1">Trạng thái</label>
                <select 
                  value={newStatus} 
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="sketch-input bg-white/50 cursor-pointer py-2 text-xs"
                >
                  <option value="Want to visit">Muốn đi ✨</option>
                  <option value="Visited">Đã đi ✅</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-ink/50 ml-1">Địa chỉ (nếu có)</label>
              <input
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Đường, quận, thành phố..."
                className="sketch-input bg-white/50 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-ink/50 ml-1">Tỉnh/Thành phố</label>
              <input
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="Ví dụ: Đà Lạt, Hà Nội..."
                className="sketch-input bg-white/50 py-2 text-sm"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-ink/50 ml-1">Giá tiền (nếu có - VNĐ)</label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Ví dụ: 50000"
                className="sketch-input bg-white/50 py-2 text-sm"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-ink/50 ml-1">Link (nếu có)</label>
              <input
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="https://..."
                className="sketch-input bg-white/50 py-2 text-sm"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-ink/50 ml-1">Tags</label>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Thêm tag..."
                  className="sketch-input bg-white/50 py-2 flex-1 text-xs"
                />
                <button type="button" onClick={addTag} className="sketch-button px-2 py-1 text-xs">Add</button>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {newTags.map(tag => (
                  <span key={tag} className="bg-ink/5 border border-ink/20 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1">
                    #{tag}
                    <button type="button" onClick={() => removeNewTag(tag)} className="text-crimson">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-ink/50 ml-1">Ghi chú</label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Giờ mở cửa..."
                className="sketch-input bg-white/50 w-full min-h-[50px] resize-none py-2 text-sm"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold uppercase tracking-widest text-ink/50 ml-1">Review</label>
              <textarea
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                placeholder="Trải nghiệm thực tế..."
                className="sketch-input bg-white/50 w-full min-h-[50px] flex-1 resize-none py-2 text-sm"
              />
              <div className="flex flex-wrap items-center justify-between mt-1 gap-2">
                 <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-ink/50">Đánh giá:</span>
                    <select 
                      value={newRating} 
                      onChange={(e) => setNewRating(Number(e.target.value))}
                      className="sketch-input bg-white/50 w-14 cursor-pointer py-1 text-xs px-1"
                    >
                      {[5,4,3,2,1].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                 </div>
                 <div className="flex items-center gap-2">
                    {editingId && (
                      <button type="button" onClick={cancelEdit} className="sketch-button text-xs py-1.5 px-3">
                        Hủy
                      </button>
                    )}
                    <button type="submit" className="sketch-button sketch-button-primary bg-ink text-paper text-xs py-1.5 px-4 flex items-center gap-1">
                       <Plus size={14} /> {editingId ? "Cập Nhật" : "Lưu"}
                    </button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className="flex flex-col gap-4 mb-8 sticky top-0 bg-[#f4f1ea]/80 backdrop-blur-md py-4 z-20 mx-[-1rem] px-4">
        <div className="flex gap-1.5 flex-wrap justify-center">
          {(['All', 'Food', 'Cafe', 'Dessert', 'Travel', 'Other'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "px-3 py-1 rounded-full border-2 transition-all font-bold text-[10px] uppercase tracking-wider",
                filter === cat 
                  ? "bg-ink text-paper border-ink shadow-sm" 
                  : "border-ink/10 text-ink/60 hover:bg-ink/5 hover:border-ink/40"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 justify-center items-center">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter(filter === 'Favorite' ? 'All' : 'Favorite')}
              className={cn(
                "px-2 py-1 font-bold text-[10px] uppercase tracking-widest rounded transition-all sketch-border flex items-center gap-1",
                filter === 'Favorite' ? "bg-amber-100/50 text-amber-700" : "bg-white/50 text-ink/60 hover:bg-white"
              )}
            >
              <Star size={10} className={filter === 'Favorite' ? "fill-amber-400 text-amber-400" : "text-ink/60"} /> Yêu thích
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
                onClick={() => setShowTopCities(!showTopCities)}
                className={cn(
                  "px-2 py-1 font-bold text-[10px] uppercase tracking-widest rounded transition-all sketch-border",
                  showTopCities ? "bg-amber-100/50 text-amber-700" : "bg-white/50 text-ink/60 hover:bg-white"
                )}
              >
                🏆 Top 10
            </button>
            {showTopCities && (
              <div className="flex gap-1">
                <select 
                  value={selectedCityForTop}
                  onChange={(e) => setSelectedCityForTop(e.target.value)}
                  className="bg-paper border-2 border-ink text-[10px] uppercase font-bold py-1 px-1 rounded sketch-border outline-none"
                >
                  <option value="">Tất cả Tỉnh</option>
                  {allCities.sort().map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <select 
                  value={selectedCategoryForTop}
                  onChange={(e) => setSelectedCategoryForTop(e.target.value)}
                  className="bg-paper border-2 border-ink text-[10px] uppercase font-bold py-1 px-1 rounded sketch-border outline-none"
                >
                  <option value="">Tất cả Phân loại</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {(['All', 'Want to visit', 'Visited'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "font-sans font-bold text-[10px] transition-colors px-1.5 py-0.5 uppercase tracking-tighter",
                statusFilter === status ? "text-crimson border-b-2 border-crimson" : "text-ink/40 hover:text-ink/70"
              )}
            >
              {status === 'All' ? 'Tất cả' : status === 'Want to visit' ? 'Muốn đi' : 'Đã đi'}
            </button>
          ))}

          <div className="flex gap-2 ml-1">
            <button 
              onClick={() => setSortBy('Recent')}
              className={cn("text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5", sortBy === 'Recent' ? "text-ink opacity-100" : "text-ink opacity-30")}
            >
              Mới
            </button>
            <button 
              onClick={() => setSortBy('Rating')}
              className={cn("text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5", sortBy === 'Rating' ? "text-ink opacity-100" : "text-ink opacity-30")}
            >
              Rate
            </button>
          </div>
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center border-t border-dashed border-ink/10 pt-3 pb-1">
            <button 
              onClick={() => setSelectedTag(null)}
              className={cn("px-2 py-0.5 text-[9px] font-bold uppercase rounded transition-all", !selectedTag ? "text-crimson bg-crimson/5 underline underline-offset-4" : "text-ink/40 hover:text-ink/60")}
            >
              #Tất cả
            </button>
            {allTags.sort().map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={cn(
                  "px-2 py-0.5 text-[9px] font-bold uppercase rounded transition-all",
                  selectedTag === tag ? "text-crimson bg-crimson/5 underline underline-offset-4 font-black" : "text-ink/40 hover:text-ink/60"
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {showTopCities && topPlaces.length > 0 && (
        <div className="mb-8 p-4 bg-amber-50 sketch-border rounded relative mx-1">
           <h2 className="font-bold uppercase tracking-widest text-[10px] text-amber-900 mb-4 text-center">
             Top 10 {selectedCategoryForTop || "Địa Điểm"} {selectedCityForTop ? `tại ${selectedCityForTop}` : "Toàn Quốc"}
           </h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {topPlaces.map((place, idx) => (
               <div key={place.id} className="bg-white p-3 rounded sketch-border border-amber-200 relative overflow-hidden">
                 <div className="absolute -top-1 -right-1 bg-amber-500 text-white font-black text-[10px] w-6 h-6 flex items-center justify-center rounded-bl-lg">
                   {idx + 1}
                 </div>
                 <div className="flex justify-between items-center mb-1 pr-4">
                   <div className="flex">
                     {Array.from({ length: place.rating }).map((_, i) => (
                       <Star key={i} size={8} className="fill-amber-400 text-amber-400" />
                     ))}
                   </div>
                 </div>
                 <h4 className="font-bold text-xs leading-tight text-ink w-full truncate mb-0.5">{place.name}</h4>
                 <div className="flex flex-col gap-0.5">
                   {place.price !== undefined && (
                     <div className="text-[9px] font-mono font-bold text-crimson">
                       {place.price.toLocaleString()} VNĐ
                     </div>
                   )}
                   {place.address && (
                     <div className="text-[8px] text-ink/50 uppercase truncate">
                       {place.address}
                     </div>
                   )}
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pr-1 content-start mx-1 pb-20">
        {filteredPlaces.map(place => (
          <div key={place.id} className="p-3 sketch-border bg-white/60 relative group flex flex-col justify-between hover:bg-white transition-all text-sm">
             <div>
               <div className="flex justify-between items-start mb-2 gap-2 w-full">
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-start gap-1 flex-wrap">
                      <button 
                        onClick={() => toggleFavorite(place.id)}
                        className="mt-0.5 text-amber-400 hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star size={14} className={place.isFavorite ? "fill-amber-400" : "text-ink/20 hover:text-amber-400"} />
                      </button>
                      <h3 className="font-bold text-base leading-tight text-ink break-words min-w-0">
                        {place.name}
                        {place.city && <span className="ml-1 text-[10px] font-normal text-ink/40 uppercase tracking-widest">({place.city})</span>}
                      </h3>
                      {place.price !== undefined && (
                        <span className="font-mono font-bold text-[10px] bg-crimson/10 text-crimson px-1.5 py-0.5 rounded border border-crimson/20">
                          {place.price.toLocaleString()} VNĐ
                        </span>
                      )}
                      <button 
                        onClick={() => toggleStatus(place.id)}
                        className={cn(
                          "text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border transition-all ml-1",
                          place.status === 'Visited' 
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        )}
                      >
                        {place.status === 'Visited' ? 'Visited' : 'Want to visit'}
                      </button>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-tighter text-ink/40 mt-1">
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
                  <div className="flex gap-0.5 mt-1 shrink-0">
                     {Array.from({ length: place.rating }).map((_, i) => (
                       <Star key={i} size={10} className="fill-crimson text-crimson" />
                     ))}
                  </div>
               </div>
               
               {place.address && (
                 <div className="flex items-start gap-1.5 text-[10px] text-ink/60 mb-2 bg-ink/5 p-1.5 rounded">
                   <MapPin size={10} className="mt-0.5 shrink-0" />
                   <p className="leading-snug">{place.address}</p>
                 </div>
               )}
               
               {place.link && (
                 <div className="flex items-start gap-1.5 text-[10px] text-ink/60 mb-2 bg-ink/5 p-1.5 rounded w-full min-w-0 overflow-hidden">
                   <ExternalLink size={10} className="mt-0.5 shrink-0" />
                   <a href={place.link} target="_blank" rel="noopener noreferrer" className="leading-snug hover:text-crimson transition-colors truncate flex-1 min-w-0 block">
                     {place.link}
                   </a>
                 </div>
               )}

               {place.notes && (
                 <div className="mt-1.5 p-2 bg-yellow-50/50 border border-dashed border-amber-200 text-xs font-hand leading-relaxed text-ink/80 rounded relative">
                   <div className="absolute -top-1.5 right-1.5 flex gap-1">
                      <div className="w-1 h-1 rounded-full bg-amber-400" />
                   </div>
                   <strong className="text-[8px] uppercase tracking-widest text-ink/40 font-sans block mb-0.5">Ghi chú:</strong>
                   {place.notes}
                 </div>
               )}
               {place.review && (
                 <div className="mt-1.5 p-2 bg-emerald-50/50 border border-dashed border-emerald-200 text-xs font-hand leading-relaxed text-ink/80 rounded relative">
                   <div className="absolute -top-1.5 right-1.5 flex gap-1">
                      <div className="w-1 h-1 rounded-full bg-emerald-400" />
                   </div>
                   <strong className="text-[8px] uppercase tracking-widest text-ink/40 font-sans block mb-0.5">Review:</strong>
                   {place.review}
                 </div>
               )}
             </div>

             <div className="mt-3 flex justify-between items-center">
               <button
                 onClick={() => {
                   startEdit(place);
                   setNewStatus('Visited'); // Automatically prepare for review if wanting to rate
                 }}
                 className="text-[10px] sketch-button text-ink py-1 px-2"
               >
                 {place.status === 'Visited' ? 'Viết lại Review' : 'Thêm Review'}
               </button>
               <div className="flex gap-1.5">
                 <button 
                   onClick={() => startEdit(place)}
                   className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-ink hover:text-white rounded border border-ink/10 shadow-sm"
                   title="Sửa địa điểm"
                 >
                   <Edit2 size={12} />
                 </button>
                 <button 
                   onClick={() => removePlace(place.id)}
                   className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-crimson hover:text-white rounded border border-ink/10 shadow-sm"
                   title="Xóa địa điểm"
                 >
                   <Trash2 size={12} />
                 </button>
               </div>
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
