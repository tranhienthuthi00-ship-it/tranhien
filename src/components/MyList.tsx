import React, { useState } from "react";
import { Check, Plus, Trash2, Heart, HeartPulse, Star } from "lucide-react";
import type { Task, WishlistItem } from "@/types";
import { cn } from "@/lib/utils";

export function MyList({
  wishlist,
  setWishlist,
}: {
  wishlist: WishlistItem[];
  setWishlist: (list: WishlistItem[]) => void;
}) {
  const [newWish, setNewWish] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newNecessity, setNewNecessity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newTags, setNewTags] = useState("");
  const [newWishLink, setNewWishLink] = useState("");
  const [newWishNote, setNewWishNote] = useState("");
  const [editingWishId, setEditingWishId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'Date' | 'Necessity' | 'Price'>('Date');
  const [wishlistFilter, setWishlistFilter] = useState<'Active' | 'Purchased' | 'All'>('Active');
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewNecessity, setReviewNecessity] = useState<'Low' | 'Medium' | 'High'>('Medium');

  const addWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWish.trim()) return;
    
    if (editingWishId) {
      setWishlist(wishlist.map(w => w.id === editingWishId ? {
        ...w,
        content: newWish,
        price: newPrice ? parseFloat(newPrice) : undefined,
        necessity: newNecessity,
        tags: newTags ? newTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : undefined,
        link: newWishLink || undefined,
        note: newWishNote || undefined,
      } : w));
      setEditingWishId(null);
    } else {
      setWishlist([{ 
        id: Date.now().toString(), 
        content: newWish, 
        addedDate: new Date().toISOString(),
        price: newPrice ? parseFloat(newPrice) : undefined,
        necessity: newNecessity,
        tags: newTags ? newTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : undefined,
        link: newWishLink || undefined,
        note: newWishNote || undefined,
        isWorthBuying: false,
        isPurchased: false
      }, ...wishlist]);
    }
    setNewWish("");
    setNewPrice("");
    setNewNecessity("Medium");
    setNewTags("");
    setNewWishLink("");
    setNewWishNote("");
  };

  const startEditWish = (wish: WishlistItem) => {
    setEditingWishId(wish.id);
    setNewWish(wish.content);
    setNewPrice(wish.price ? wish.price.toString() : "");
    setNewNecessity(wish.necessity);
    setNewTags(wish.tags ? wish.tags.join(', ') : "");
    setNewWishLink(wish.link || "");
    setNewWishNote(wish.note || "");
  };

  const cancelEditWish = () => {
    setEditingWishId(null);
    setNewWish("");
    setNewPrice("");
    setNewNecessity("Medium");
    setNewTags("");
    setNewWishLink("");
    setNewWishNote("");
  };

  const toggleWorthBuying = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(wishlist.map(w => w.id === id ? { ...w, isWorthBuying: !w.isWorthBuying } : w));
  };

  const togglePurchased = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(wishlist.map(w => w.id === id ? { ...w, isPurchased: !w.isPurchased } : w));
  };

  const filteredWishlist = wishlist.filter(w => {
    if (wishlistFilter === 'Active') return !w.isPurchased;
    if (wishlistFilter === 'Purchased') return w.isPurchased;
    return true;
  });

  const sortedWishlist = [...filteredWishlist].sort((a, b) => {
    if (sortBy === 'Date') {
      return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
    } else if (sortBy === 'Price') {
      if ((a.price || 0) !== (b.price || 0)) {
        return (a.price || 0) - (b.price || 0);
      }
      const weight = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return weight[b.necessity] - weight[a.necessity];
    } else if (sortBy === 'Necessity') {
      const weight = { 'High': 3, 'Medium': 2, 'Low': 1 };
      if (weight[b.necessity] !== weight[a.necessity]) {
        return weight[b.necessity] - weight[a.necessity];
      }
      return (a.price || 0) - (b.price || 0);
    }
    return 0;
  });

  const removeWish = (id: string) => {
    setWishlist(wishlist.filter(w => w.id !== id));
  };

  const addWishlistReview = (id: string) => {
    if (!reviewNote.trim()) return;
    setWishlist(wishlist.map(w => {
      if (w.id === id) {
        return {
          ...w,
          necessity: reviewNecessity,
          history: [
            ...(w.history || []),
            {
              date: new Date().toISOString(),
              necessity: reviewNecessity,
              note: reviewNote
            }
          ]
        };
      }
      return w;
    }));
    setActiveReviewId(null);
    setReviewNote("");
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* WISHLIST */}
      <section id="wishlist-section" className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-2xl font-bold font-sans">Waitlist / Wishlist</h2>
          <div className="flex-1 border-b-2 border-ink border-dashed"></div>
        </div>

        <form onSubmit={addWish} className="flex flex-col gap-2 mb-4 bg-paper p-3 sketch-border border-dashed border-ink/30 relative">
          {editingWishId && (
            <div className="absolute -top-3 -left-3 rotate-[-5deg]">
              <span className="bg-amber-400 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider sketch-border">
                Cập Nhật Món Đồ
              </span>
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={newWish}
              onChange={(e) => setNewWish(e.target.value)}
              placeholder="Tên món đồ (Add to wishlist...)"
              className="sketch-input flex-1 bg-white/50 py-1.5 min-w-0"
              required
            />
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="VNĐ"
              className="sketch-input w-24 bg-white/50 font-mono text-xs py-1.5 shrink-0"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={newWishLink}
              onChange={(e) => setNewWishLink(e.target.value)}
              placeholder="Link mua hàng (nếu có)"
              className="sketch-input flex-1 bg-white/50 py-1.5 text-xs font-mono text-ink/70 min-w-0"
            />
            <input
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="Hashtags (cách nhau ,)..."
              className="sketch-input flex-1 bg-white/50 py-1.5 text-xs font-mono text-ink/70 min-w-0"
            />
          </div>
          <div className="flex">
             <textarea
               value={newWishNote}
               onChange={(e) => setNewWishNote(e.target.value)}
               placeholder="Ghi chú về món đồ này (lý do mua, ưu/nhược điểm...)"
               className="sketch-input flex-1 bg-white/50 py-1.5 text-xs text-ink/80 min-h-[50px] resize-y"
             />
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-1 gap-3 sm:gap-0">
            <div className="flex gap-1 items-center flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mr-1">Need:</span>
              {(['Low', 'Medium', 'High'] as const).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setNewNecessity(level)}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-colors", 
                    newNecessity === level 
                      ? level === 'High' ? "bg-crimson text-white border-crimson" 
                        : level === 'Medium' ? "bg-yellow-500 text-white border-yellow-500" 
                        : "bg-gray-500 text-white border-gray-500"
                      : "border-ink/20 text-ink/60 hover:bg-ink/5"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {editingWishId && (
                <button type="button" onClick={cancelEditWish} className="sketch-button px-3 py-1 text-xs bg-white text-ink/60 hover:text-ink">
                  Hủy
                </button>
              )}
              <button type="submit" className="sketch-button flex items-center gap-1 px-3 py-1 text-xs bg-crimson/5 border-crimson text-crimson hover:bg-crimson hover:text-white">
                <Heart size={12} className="fill-current" /> {editingWishId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </form>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2 border-b border-ink/10 pb-1.5">
          <div className="flex gap-3 text-[10px] font-sans font-bold uppercase tracking-widest text-ink/50">
            <span>Filter</span>
            <div className="flex gap-2">
              {(['Active', 'Purchased', 'All'] as const).map(f => (
                <button 
                  key={f}
                  onClick={() => setWishlistFilter(f)} 
                  className={cn("transition-colors", wishlistFilter === f ? 'text-emerald-600' : 'hover:text-ink')}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 text-[10px] font-sans font-bold uppercase tracking-widest text-ink/50">
            <span>Sort</span>
            <div className="flex gap-3">
              <button onClick={() => setSortBy('Date')} className={cn("transition-colors", sortBy === 'Date' ? 'text-crimson' : 'hover:text-ink')}>Date</button>
              <button onClick={() => setSortBy('Necessity')} className={cn("transition-colors", sortBy === 'Necessity' ? 'text-crimson' : 'hover:text-ink')}>Necessity</button>
              <button onClick={() => setSortBy('Price')} className={cn("transition-colors", sortBy === 'Price' ? 'text-crimson' : 'hover:text-ink')}>Price</button>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm font-sans border-t border-transparent max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
          {sortedWishlist.map(wish => (
            <div key={wish.id} className={cn(
              "flex flex-col py-2 px-3 sketch-border transition-all relative group w-full overflow-hidden",
              wish.necessity === 'High' ? "bg-crimson/5 border-crimson" : 
              wish.necessity === 'Medium' ? "bg-yellow-400/5 border-yellow-500" :
              "bg-gray-400/5 border-gray-400 hover:border-ink/30"
            )}>
                <div className="flex justify-between items-start gap-4">
                  <span className={cn("font-bold text-base flex-1 min-w-0 break-words", wish.necessity === 'High' && "text-crimson")}>{wish.content}</span>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {wish.price !== undefined && <span className="font-mono font-medium text-[11px] text-ink/60 bg-white px-1.5 py-0.5 border border-ink/10 rounded">{wish.price.toLocaleString()} VNĐ</span>}
                    <div className="flex gap-1.5 mt-1">
                       <button 
                        onClick={(e) => {
                          e.preventDefault();
                          startEditWish(wish);
                          document.getElementById('wishlist-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-ink/40 hover:text-ink"
                        title="Sửa"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                      </button>
                      <button 
                        onClick={(e) => toggleWorthBuying(wish.id, e)}
                        className={cn("hover:text-amber-500", wish.isWorthBuying ? "text-amber-500" : "text-ink/40")}
                        title="Đáng mua"
                      >
                        <Star size={12} className={wish.isWorthBuying ? "fill-current" : ""} />
                      </button>
                      <button 
                        onClick={(e) => togglePurchased(wish.id, e)}
                        className={cn("hover:text-emerald-500", wish.isPurchased ? "text-emerald-500" : "text-ink/40")}
                        title="Đã mua"
                      >
                        <Check size={14} className={wish.isPurchased ? "stroke-[4px]" : ""} />
                      </button>
                      <button 
                         onClick={() => removeWish(wish.id)}
                         className="text-ink/40 hover:text-crimson"
                         title="Xóa"
                       >
                         <Trash2 size={12} />
                       </button>
                    </div>
                  </div>
               </div>

               {wish.tags && wish.tags.length > 0 && (
                 <div className="flex flex-wrap gap-1 mt-2">
                   {wish.tags.map((tag, idx) => (
                     <span key={idx} className="text-[10px] font-mono bg-ink/5 text-ink/60 px-1.5 py-0.5 rounded">#{tag}</span>
                   ))}
                 </div>
               )}
               
               {wish.link && (
                 <a href={wish.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-2 inline-block truncate max-w-full">
                   {wish.link}
                 </a>
               )}
               
               {wish.note && (
                 <div className="mt-2 text-xs text-ink/80 font-hand italic bg-white/50 p-2 rounded border border-ink/5">
                   <strong className="text-[10px] uppercase font-sans tracking-widest text-ink/40 block mb-0.5">Ghi chú:</strong>
                   {wish.note}
                 </div>
               )}
               
               <div className="flex justify-between items-end mt-2">
                 <div className="flex gap-2 items-center">
                   <span className={cn(
                     "text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border",
                     wish.necessity === 'High' ? "border-crimson text-crimson bg-white" : 
                     wish.necessity === 'Medium' ? "border-yellow-500 text-yellow-600 bg-white" : "border-gray-400 text-gray-500 bg-white"
                   )}>
                     {wish.necessity} Need {wish.isPurchased && "✅"}
                   </span>
                 </div>
                 <span className="text-[10px] opacity-40 uppercase font-sans font-bold">{new Date(wish.addedDate).toLocaleDateString()}</span>
               </div>
               
               {wish.history && wish.history.length > 0 && (
                 <div className="mt-4 space-y-2 border-t border-ink/10 pt-3">
                   {wish.history.map((entry, idx) => (
                     <div key={idx} className="flex gap-2 items-start text-[11px]">
                       <span className={cn("px-1 py-0.5 rounded border text-[8px] font-bold uppercase", 
                          entry.necessity === 'High' ? "border-crimson text-crimson bg-crimson/5" :
                          entry.necessity === 'Medium' ? "border-yellow-500 text-yellow-600 bg-yellow-400/5" :
                          "border-gray-400 text-gray-500 bg-gray-400/5"
                       )}>{entry.necessity}</span>
                       <span className="opacity-50 min-w-[60px]">{new Date(entry.date).toLocaleDateString()}</span>
                       <span className="font-hand italic text-ink/80 flex-1">{entry.note}</span>
                     </div>
                   ))}
                 </div>
               )}

               {activeReviewId !== wish.id && (
                 <button 
                   onClick={() => {
                     setActiveReviewId(wish.id);
                     setReviewNecessity(wish.necessity);
                     setReviewNote("");
                   }}
                   className="mt-3 text-[10px] font-bold text-ink/40 hover:text-ink text-left w-max transition-colors border-b border-dotted"
                 >
                   + Review Progress
                 </button>
               )}

               {activeReviewId === wish.id && (
                 <div className="mt-3 bg-white/60 p-2 rounded border border-ink/20 border-dashed">
                    <textarea 
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Review necessity..."
                      className="sketch-input bg-white w-full min-h-[40px] resize-y text-[11px] mb-2 p-1.5 rounded"
                      rows={2}
                    />
                    <div className="flex justify-between items-center">
                       <div className="flex gap-1 items-center">
                         {(['Low', 'Medium', 'High'] as const).map(level => (
                           <button
                             key={level}
                             type="button"
                             onClick={() => setReviewNecessity(level)}
                             className={cn("px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border transition-colors", reviewNecessity === level ? "bg-ink text-paper border-ink" : "border-ink/20 text-ink/60 hover:bg-ink/5")}
                           >
                             {level}
                           </button>
                         ))}
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => setActiveReviewId(null)} className="text-[10px] text-ink/60 hover:text-ink font-bold px-1">X</button>
                          <button onClick={() => addWishlistReview(wish.id)} className="text-[10px] sketch-button sketch-button-primary bg-ink text-paper px-2 py-0.5">Save</button>
                       </div>
                    </div>
                 </div>
               )}
               
               {wish.isWorthBuying && (
                 <div className="absolute top-2 left-1 rotate-[-15deg] pointer-events-none opacity-20">
                    <Star size={24} className="fill-amber-400 text-amber-500 drop-shadow-sm" />
                 </div>
               )}
            </div>
          ))}
          {wishlist.length === 0 && <p className="hand-text text-xl text-center py-4 opacity-50">Keep it intentional.</p>}
        </div>
      </section>
    </div>
  );
}
