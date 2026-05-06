import React, { useState, useMemo } from "react";
import { Plus, Trash2, Edit2, Wallet, Settings, Landmark, Car, MonitorSmartphone, Gem, PiggyBank, Briefcase, Bitcoin, Building, Home, Coins, CreditCard, TrendingUp, Smartphone, Laptop } from "lucide-react";
import type { FormEvent } from "react";
import { cn } from "@/lib/utils";
import type { Asset, AssetCategory } from "@/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export const ICON_MAP: Record<string, React.FC<any>> = {
  Wallet, Landmark, Car, MonitorSmartphone, Gem, PiggyBank, Briefcase, Bitcoin, Building, Home, Coins, CreditCard, TrendingUp, Smartphone, Laptop
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export const renderIcon = (iconName: string, size: number = 16, className?: string) => {
   const Icon = ICON_MAP[iconName];
   if (Icon) return <Icon size={size} className={className} />;
   return <span style={{fontSize: size}} className={className}>{iconName}</span>;
};

export function AssetsManager({ assets, setAssets, categories, setCategories }: {
  assets: Asset[];
  setAssets: (a: Asset[]) => void;
  categories: AssetCategory[];
  setCategories: (c: AssetCategory[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const defaultCatID = categories.length > 0 ? categories[0].id : '';
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>(defaultCatID);
  const [newValue, setNewValue] = useState("");
  const [newCurrency, setNewCurrency] = useState("VND");
  const [newNotes, setNewNotes] = useState("");
  const [isDebt, setIsDebt] = useState(false);

  const [isManagingCats, setIsManagingCats] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("Wallet");

  const startEdit = (asset: Asset) => {
    setEditingId(asset.id);
    setNewName(asset.name);
    setNewCategory(asset.category);
    setNewValue(asset.value.toString());
    setNewCurrency(asset.currency);
    setNewNotes(asset.notes || "");
    setIsDebt(!!asset.isDebt);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewName("");
    setNewCategory(defaultCatID);
    setNewValue("");
    setNewCurrency("VND");
    setNewNotes("");
    setIsDebt(false);
  };

  const formatCurrency = (val: number, cur: string) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: cur }).format(val);
  };

  const addAsset = (e: FormEvent) => {
    e.preventDefault();
    // Use the explicitly selected category, or defaultCatID if none selected
    const catToUse = newCategory || defaultCatID;
    if (!newName.trim() || !newValue || !catToUse) return;

    const val = parseFloat(newValue.replace(/,/g, ''));
    if (isNaN(val)) return;

    if (editingId) {
      setAssets(assets.map(a => a.id === editingId ? {
        ...a,
        name: newName,
        category: catToUse,
        value: val,
        currency: newCurrency,
        notes: newNotes || undefined,
        isDebt: isDebt
      } : a));
      setEditingId(null);
    } else {
      setAssets([{
        id: Date.now().toString(),
        name: newName,
        category: catToUse,
        value: val,
        currency: newCurrency,
        notes: newNotes || undefined,
        acquiredAt: Date.now(),
        isDebt: isDebt
      }, ...assets]);
    }

    setNewName("");
    setNewValue("");
    setNewNotes("");
    setIsDebt(false);
    setNewCategory(catToUse);
  };

  const removeAsset = (id: string) => {
    setAssets(assets.filter(a => a.id !== id));
  };

  const startEditCategory = (cat: AssetCategory) => {
    setEditingCatId(cat.id);
    setNewCatName(cat.name);
    setNewCatIcon(cat.icon);
  };

  const cancelEditCategory = () => {
    setEditingCatId(null);
    setNewCatName("");
    setNewCatIcon("Wallet");
  };

  const saveCategory = (e: FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatIcon.trim()) return;
    
    if (editingCatId) {
       setCategories(categories.map(c => c.id === editingCatId ? { ...c, name: newCatName, icon: newCatIcon } : c));
       setEditingCatId(null);
    } else {
       setCategories([...categories, {
         id: 'cat-' + Date.now(),
         name: newCatName,
         icon: newCatIcon
       }]);
    }
    setNewCatName("");
    setNewCatIcon("Wallet");
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
  };
  
  const getCategory = (catId: string) => {
    return categories.find(c => c.id === catId) || { id: catId || 'unknown', name: catId || 'Khác', icon: '❓' };
  };

  const getValueInVND = (value: number, currency: string) => {
    if (currency === 'VND') return value;
    if (currency === 'USD') return value * 25000;
    if (currency === 'EUR') return value * 27000;
    if (currency === 'GOLD') return value * 8000000; // estimation
    return value;
  };

  const totalVND = useMemo(() => {
    return assets.reduce((acc, curr) => {
      const val = getValueInVND(curr.value, curr.currency);
      return curr.isDebt ? acc - val : acc + val;
    }, 0);
  }, [assets]);

  const totalAssetsVND = useMemo(() => {
    return assets.filter(a => !a.isDebt).reduce((acc, curr) => acc + getValueInVND(curr.value, curr.currency), 0);
  }, [assets]);

  const totalDebtsVND = useMemo(() => {
    return assets.filter(a => a.isDebt).reduce((acc, curr) => acc + getValueInVND(curr.value, curr.currency), 0);
  }, [assets]);

  const COLORS = [
    '#2a2a2a', // ink
    '#d93838', // crimson
    '#eab308', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f97316', // orange
  ];

  const getCategoryColor = (catId: string) => {
    if (!catId || catId === 'unknown') return '#cbd5e1'; // slate-300 for missing
    let index = categories.findIndex(c => c.id === catId);
    if (index === -1) {
        let hash = 0;
        for (let i = 0; i < catId.length; i++) hash = catId.charCodeAt(i) + ((hash << 5) - hash);
        index = Math.abs(hash);
    }
    return COLORS[index % COLORS.length];
  };

  const pieData = useMemo(() => {
    const dataMap = new Map<string, { value: number, name: string, catId: string, fill: string }>();
    assets.forEach(a => {
      const val = getValueInVND(a.value, a.currency);
      const cat = getCategory(a.category);
      if (dataMap.has(cat.id)) {
        dataMap.get(cat.id)!.value += val;
      } else {
        dataMap.set(cat.id, { 
          value: val, 
          name: cat.name, 
          catId: cat.id,
          fill: getCategoryColor(cat.id)
        });
      }
    });
    return Array.from(dataMap.values()).filter(d => d.value > 0);
  }, [assets, categories, getCategory, getCategoryColor, getValueInVND]);

  return (
    <div className="max-w-4xl mx-auto px-4 font-sans pb-10">
      <div className="mb-8 text-center flex flex-col items-center">
         <h1 className="text-4xl font-black font-logo tracking-wide mb-2 uppercase">My Assets</h1>
         <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-4">
           <div className="flex flex-col">
             <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Tổng Tài Sản</span>
             <span className="text-lg font-bold text-emerald-600">{formatCurrency(totalAssetsVND, 'VND')}</span>
           </div>
           <div className="flex flex-col">
             <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Tổng Nợ</span>
             <span className="text-lg font-bold text-crimson">{formatCurrency(totalDebtsVND, 'VND')}</span>
           </div>
           <div className="flex flex-col border-t md:border-t-0 md:border-l border-ink/10 pt-2 md:pt-0 md:pl-8">
             <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Tài Sản Ròng</span>
             <span className="text-lg font-bold text-ink">{formatCurrency(totalVND, 'VND')}</span>
           </div>
         </div>
         
         <div className="flex gap-2">
           <button onClick={() => setIsManagingCats(!isManagingCats)} className={`sketch-button flex items-center gap-2 px-4 text-xs ${isManagingCats ? 'bg-ink text-paper' : ''}`}>
             <Settings size={14} /> Quản Lý Danh Mục
           </button>
         </div>
      </div>

      {isManagingCats && (
        <div className="bg-ink/5 p-4 rounded-xl mb-8 sketch-border border-dashed">
          <h3 className="font-bold text-sm tracking-widest uppercase mb-4">Các danh mục hiện có</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(c => {
              const inUse = assets.some(a => a.category === c.id);
              return (
              <div key={c.id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full sketch-border text-sm group">
                <span className="text-ink">{renderIcon(c.icon, 14)}</span>
                <span className="font-semibold">{c.name}</span>
                <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity pl-2 border-l border-ink/20">
                    <button onClick={() => startEditCategory(c)} className="text-ink hover:text-blue-600 p-0.5" title="Sửa danh mục"><Edit2 size={12} /></button>
                    {!inUse && (
                      <button onClick={() => removeCategory(c.id)} className="text-crimson hover:bg-crimson/10 p-0.5" title="Xóa danh mục"><Trash2 size={12} /></button>
                    )}
                </div>
              </div>
            )})}
          </div>
          <form onSubmit={saveCategory} className="flex flex-col gap-4 mt-4 pt-4 border-t border-ink/10">
            <h4 className="text-xs font-bold uppercase tracking-widest text-ink/70">
               {editingCatId ? "Cập Nhật Danh Mục" : "Thêm Danh Mục Mới"}
            </h4>
            
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ICONS.map(icon => (
                <button type="button" key={icon} onClick={() => setNewCatIcon(icon)}
                  className={cn("p-2 rounded sketch-border flex items-center justify-center transition-colors", newCatIcon === icon ? "bg-ink text-paper" : "bg-white text-ink hover:bg-ink/10")}>
                  {renderIcon(icon, 18)}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">Tên Danh Mục</label>
                  <input value={newCatName} onChange={e => setNewCatName(e.target.value)} className="sketch-input py-2" placeholder="Ví dụ: Cổ phiếu" required />
                </div>
                {editingCatId && (
                   <button type="button" onClick={cancelEditCategory} className="sketch-button py-2 px-4 whitespace-nowrap">Hủy</button>
                )}
                <button type="submit" className="sketch-button sketch-button-primary bg-ink text-paper py-2 px-4 whitespace-nowrap flex gap-2 items-center">
                   {editingCatId ? <Edit2 size={16} /> : <Plus size={16} />} 
                   {editingCatId ? "Cập Nhật" : "Thêm"}
                </button>
            </div>
          </form>
        </div>
      )}

      {(pieData.length > 0) && (
        <div className="h-64 mb-10 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="#faf9f6"
                strokeWidth={2}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value: number) => formatCurrency(value, 'VND')} contentStyle={{ borderRadius: '8px', border: '2px solid var(--color-ink)' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <form onSubmit={addAsset} className="bg-paper p-5 sketch-border border-dashed border-ink/30 mb-8 mt-8 space-y-4 relative">
        <div className="absolute -top-3 -left-3 rotate-[-10deg] z-10">
          <span className="bg-crimson text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider sketch-border">
            {editingId ? "Cập Nhật Tài Sản" : "Thêm Tài Sản"}
          </span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">Tên Tài Sản</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ví dụ: Sổ tiết kiệm, Xe máy..."
                className="sketch-input bg-white/50 py-2"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">Danh Mục</label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="sketch-input bg-white/50 py-2" required>
                  <option value="" disabled>-- Chọn --</option>
                  {categories.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">Giá Trị</label>
                <div className="flex gap-2">
                  <input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="0"
                    type="number"
                    className="sketch-input bg-white/50 py-2 min-w-0 flex-1 px-2"
                    required
                  />
                  <select value={newCurrency} onChange={(e) => setNewCurrency(e.target.value)} className="sketch-input bg-white/50 py-2 w-[72px] shrink-0 px-1 text-center">
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GOLD">Chỉ vàng</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 flex flex-col">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">Ghi chú thêm</label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Ngân hàng nào, để ở đâu..."
                className="sketch-input bg-white/50 py-2 flex-1 resize-none min-h-[60px]"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <input 
                type="checkbox" 
                id="isDebt" 
                checked={isDebt} 
                onChange={e => setIsDebt(e.target.checked)}
                className="w-5 h-5 accent-crimson"
              />
              <label htmlFor="isDebt" className="text-xs font-bold uppercase tracking-widest text-crimson flex items-center gap-2 cursor-pointer">
                Đây là một khoản nợ (Debt)
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4 gap-2 mt-2 border-t border-ink/10 border-dashed">
          {editingId && (
             <button type="button" onClick={cancelEdit} className="sketch-button text-xs py-2 px-6 whitespace-nowrap bg-paper">
               Hủy
             </button>
          )}
          <button type="submit" className="sketch-button sketch-button-primary bg-ink text-paper text-sm py-2 px-8 flex items-center gap-2 whitespace-nowrap">
            <Plus size={16} /> {editingId ? "Cập Nhật" : "Lưu"}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assets.map(asset => {
          const cat = getCategory(asset.category);
          return (
          <div key={asset.id} className={cn(
            "p-4 bg-white/60 sketch-border flex flex-col justify-between group relative overflow-hidden",
            asset.isDebt ? "border-l-4 border-l-crimson" : ""
          )} style={{ borderTopWidth: '4px', borderTopColor: getCategoryColor(asset.category) }}>
            <div className="absolute top-1 right-1 flex items-center justify-end px-2 gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20">
               <button 
                 onClick={() => startEdit(asset)}
                 className="p-1.5 bg-ink text-white rounded-lg shadow-sm hover:scale-110 transition-transform"
                 title="Sửa"
               >
                 <Edit2 size={12} />
               </button>
               <button 
                 onClick={() => removeAsset(asset.id)}
                 className="p-1.5 bg-crimson text-white rounded-lg shadow-sm hover:scale-110 transition-transform"
                 title="Xóa"
               >
                 <Trash2 size={12} />
               </button>
            </div>

            <div className="flex justify-between items-start mb-2 relative z-10 pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="p-1.5 text-white rounded-lg shadow-sm" style={{ backgroundColor: getCategoryColor(asset.category) }}>
                  {renderIcon(cat.icon, 20)}
                </span>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{asset.name}</h3>
                  <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: getCategoryColor(asset.category) }}>{cat.name}</p>
                </div>
              </div>
            </div>
            
            <div className="text-2xl font-mono font-bold tracking-tight mt-2 flex items-baseline gap-2">
              <span className={asset.isDebt ? "text-crimson" : "text-ink/90"}>
                {asset.isDebt ? "-" : ""}{formatCurrency(asset.value, asset.currency)}
              </span>
              {asset.isDebt && <span className="text-[10px] uppercase font-bold text-crimson bg-crimson/5 px-1 rounded">Nợ</span>}
            </div>
            
            {asset.notes && <div className="text-xs text-ink/60 mt-2 bg-ink/5 p-2 rounded">{asset.notes}</div>}
          </div>
        )})}
      </div>
      
      {assets.length === 0 && (
        <div className="text-center py-10 opacity-30 mt-10">
          <Wallet size={48} className="mx-auto mb-4" />
          <p className="font-hand text-xl">Chưa có tài sản nào được ghi nhận</p>
        </div>
      )}
    </div>
  );
}
