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
  const [filter, setFilter] = useState<'All' | 'Food' | 'Cafe' | 'Dessert' | 'Other'>('All');
  
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState<'Food' | 'Cafe' | 'Dessert' | 'Other'>('Food');
  const [newRating, setNewRating] = useState(5);
  const [newAddress, setNewAddress] = useState("");
  const [newReview, setNewReview] = useState("");

  const addPlace = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setPlaces([{
      id: Date.now().toString(),
      name: newName,
      category: newCat,
      rating: newRating,
      address: newAddress,
      review: newReview || undefined
    }, ...places]);
    
    setNewName("");
    setNewAddress("");
    setNewReview("");
    setNewRating(5);
  };

  const removePlace = (id: string) => {
    setPlaces(places.filter(p => p.id !== id));
  };

  const filteredPlaces = filter === 'All' ? places : places.filter(p => p.category === filter);

  return (
    <div className="max-w-3xl mx-auto px-4 font-sans pb-10">
      <div className="mb-10 text-center">
         <h1 className="text-4xl font-black font-logo tracking-wide mb-2">Good Eats</h1>
         <p className="text-ink/60 font-medium">Lưu lại những địa điểm ăn uống ngon</p>
      </div>

      <form onSubmit={addPlace} className="bg-paper p-4 sketch-border border-dashed border-ink/30 mb-6 space-y-3 relative">
        <div className="absolute -top-3 -left-3 rotate-[-10deg]">
          <span className="bg-crimson text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider sketch-border">New Place</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tên quán..."
            className="sketch-input flex-1 bg-white/50 py-1"
            required
          />
          <select 
            value={newCat} 
            onChange={(e) => setNewCat(e.target.value as any)}
            className="sketch-input bg-white/50 w-full sm:w-28 cursor-pointer py-1"
          >
            <option value="Food">Food</option>
            <option value="Cafe">Cafe</option>
            <option value="Dessert">Dessert</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Địa chỉ (không bắt buộc)..."
              className="sketch-input flex-1 bg-white/50 py-1"
            />
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold uppercase tracking-widest text-ink/50">Đánh giá:</span>
               <select 
                 value={newRating} 
                 onChange={(e) => setNewRating(Number(e.target.value))}
                 className="sketch-input bg-white/50 w-20 cursor-pointer py-1"
               >
                 {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} ⭐</option>)}
               </select>
            </div>
          </div>
          <textarea
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="Review món ăn, không gian... (không bắt buộc)"
            className="sketch-input bg-white/50 w-full min-h-[40px] resize-y py-1"
            rows={1}
          />
        </div>

        <div className="flex justify-end mt-2">
           <button type="submit" className="sketch-button sketch-button-primary bg-ink text-paper text-xs py-1 px-4 flex items-center gap-1">
              <Plus size={14} /> Lưu
           </button>
        </div>
      </form>

      <div className="flex gap-2 flex-wrap mb-6 justify-center">
        {(['All', 'Food', 'Cafe', 'Dessert', 'Other'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "px-4 py-1.5 rounded-full border-2 transition-all font-bold text-sm",
              filter === cat 
                ? "bg-ink text-paper border-ink shadow-md scale-105" 
                : "border-ink/20 text-ink/60 hover:bg-ink/5 hover:border-ink/40"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin content-start">
        {filteredPlaces.map(place => (
          <div key={place.id} className="p-5 sketch-border bg-white/60 relative group flex flex-col justify-between min-h-[140px] hover:bg-white transition-colors">
             <div>
               <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg leading-tight pr-6">{place.name}</h3>
                  <div className="flex bg-crimson/10 px-2 py-0.5 rounded-full gap-0.5">
                     {Array.from({ length: place.rating }).map((_, i) => (
                       <Star key={i} size={12} className="fill-crimson text-crimson" />
                     ))}
                  </div>
               </div>
               
               {place.address && (
                 <div className="flex items-start gap-1.5 text-sm text-ink/60 mt-2">
                   <MapPin size={14} className="mt-0.5 shrink-0" />
                   <p className="leading-snug">{place.address}</p>
                 </div>
               )}

               {place.review && (
                 <div className="mt-3 p-3 bg-white border border-dashed border-ink/10 text-sm font-hand leading-relaxed italic text-ink/80 rounded">
                   "{place.review}"
                 </div>
               )}
             </div>

             <div className="mt-4 flex justify-between items-end">
               <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm border border-ink/20 bg-ink/5">
                 {place.category}
               </span>
               <button 
                 onClick={() => removePlace(place.id)}
                 className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-crimson hover:text-white rounded-full bg-paper border border-ink shadow-sm"
               >
                 <Trash2 size={14} />
               </button>
             </div>
          </div>
        ))}
        {filteredPlaces.length === 0 && (
          <div className="col-span-full py-12 text-center text-ink/40 font-hand text-xl italic">
            Chưa có địa điểm nào ở đây. Thêm quán ruột của bạn nhé!
          </div>
        )}
      </div>
    </div>
  );
}
