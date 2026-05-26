import React, { useState } from 'react';
import { CreditCard, Wallet, Building2, Save } from 'lucide-react';
import type { Asset, AssetCategory } from '../types';

interface HomeLedgersProps {
  assets: Asset[];
  setAssets: (assets: Asset[]) => void;
  categories: AssetCategory[];
}

export const HomeLedgers: React.FC<HomeLedgersProps> = ({ assets, setAssets, categories }) => {
  const [openSection, setOpenSection] = useState<'none' | 'card' | 'salary' | 'cash'>('none');

  // --- CARD SPENDS ---
  const [cardSpends, setCardSpends] = useState<{ id: string, name: string, amount: string, notes: string }[]>(() => {
    const defaultDays = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
    return defaultDays.map(d => ({ id: Math.random().toString(), name: d, amount: "", notes: "" }));
  });

  const handleUpdateCardSpend = (id: string, field: string, val: string) => {
    setCardSpends(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const saveCardDebt = () => {
    const validSpends = cardSpends.filter(d => d.amount.trim() && !isNaN(parseFloat(d.amount.replace(/,/g, ''))));
    if (validSpends.length === 0) return alert("Chưa có hồ sơ thẻ hợp lệ.");
    
    const totalSum = validSpends.reduce((sum, d) => sum + parseFloat(d.amount.replace(/,/g, '')), 0);
    const detailNotesList = validSpends.map(d => `• ${d.name}: ${parseFloat(d.amount.replace(/,/g, '')).toLocaleString('vi-VN')} đ ${d.notes ? `(${d.notes})` : ""}`).join("\n");
    const catId = categories.find(c => c.name.toLowerCase().includes("tín dụng") || c.name.toLowerCase().includes("thẻ") || c.name.toLowerCase().includes("nợ"))?.id || "default";

    const aggregatedCardDebt: Asset = {
       id: `card-held-${Date.now()}`,
       name: `Nợ thẻ tín dụng tuần`,
       category: catId,
       value: Math.abs(totalSum),
       currency: "VND",
       notes: `Bảng kê chi tiết nợ thẻ tín dụng:\n${detailNotesList}`,
       acquiredAt: Date.now(),
       isDebt: true,
       isNewMoney: false,
       excludeFromNetWorth: false
    };

    setAssets([aggregatedCardDebt, ...assets]);
    alert(`Đã lưu nợ thẻ tín dụng trị giá +${totalSum.toLocaleString('vi-VN')}đ!`);
    setCardSpends(cardSpends.map(c => ({ ...c, amount: "", notes: "" })));
  };

  // --- SALARY PROJECTED (REVENUE) ---
  const [projectedIncome, setProjectedIncome] = useState<{ id: string, name: string, amount: string }[]>([
    { id: '1', name: 'Lương cố định tháng tới', amount: "" },
    { id: '2', name: 'Khoản thu khác', amount: "" },
  ]);

  const saveProjectedSalary = () => {
    const valid = projectedIncome.filter(d => d.amount.trim() && !isNaN(parseFloat(d.amount.replace(/,/g, ''))));
    if (valid.length === 0) return alert("Chưa có dự thu hợp lệ.");
    
    const totalSum = valid.reduce((sum, d) => sum + parseFloat(d.amount.replace(/,/g, '')), 0);
    const detailNotesList = valid.map(d => `• ${d.name}: ${parseFloat(d.amount.replace(/,/g, '')).toLocaleString('vi-VN')} đ`).join("\n");
    const catId = categories.find(c => c.name.toLowerCase().includes("tiền mặt") || c.name.toLowerCase().includes("ví"))?.id || "default";

    const aggregatedAsset: Asset = {
       id: `salary-${Date.now()}`,
       name: `Dự tính doanh thu / Lương`,
       category: catId,
       value: Math.abs(totalSum),
       currency: "VND",
       notes: `Dự tính thu nhập:\n${detailNotesList}`,
       acquiredAt: Date.now(),
       isDebt: false,
       isNewMoney: true,
       excludeFromNetWorth: true 
    };

    setAssets([aggregatedAsset, ...assets]);
    alert(`Đã lưu dự thu +${totalSum.toLocaleString('vi-VN')}đ!`);
    setProjectedIncome(projectedIncome.map(c => ({ ...c, amount: "" })));
  };

  // --- CASH ON HAND ---
  const [cashOnHand, setCashOnHand] = useState<{ id: string, denomination: string, count: string }[]>([
    { id: '1', denomination: "500,000", count: "" },
    { id: '2', denomination: "200,000", count: "" },
    { id: '3', denomination: "100,000", count: "" },
    { id: '4', denomination: "50,000", count: "" },
  ]);

  const saveCashOnHand = () => {
    const valid = cashOnHand.filter(d => d.count.trim() && parseInt(d.count, 10) > 0);
    if (valid.length === 0) return alert("Chưa đếm tiền.");
    
    let totalSum = 0;
    valid.forEach(d => {
       const denom = parseInt(d.denomination.replace(/,/g, ''), 10);
       const cnt = parseInt(d.count, 10);
       totalSum += denom * cnt;
    });

    const catId = categories.find(c => c.name.toLowerCase().includes("tiền mặt") || c.name.toLowerCase().includes("ví"))?.id || "default";

    const cashAsset: Asset = {
       id: `cash-on-hand-${Date.now()}`,
       name: `Tiền mặt thực tế đang có`,
       category: catId,
       value: totalSum,
       currency: "VND",
       notes: `Bảng kê tiền mặt đã đếm:\n${valid.map(v => `- Mệnh giá ${v.denomination}đ: ${v.count} tờ`).join('\n')}`,
       acquiredAt: Date.now(),
       isDebt: false,
       isNewMoney: false, 
       excludeFromNetWorth: false
    };

    setAssets([cashAsset, ...assets.filter(a => !a.name.includes("Tiền mặt thực tế đang có"))]);
    alert(`Đã lưu đếm quỹ: ${totalSum.toLocaleString('vi-VN')}đ!`);
  };

  return (
    <div className="space-y-4">
      {/* HEADER SECTION - TOGGLE BUTTONS */}
      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
        <button 
          onClick={() => setOpenSection(openSection === 'card' ? 'none' : 'card')}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${openSection === 'card' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 shadow-sm'}`}
        >
          <CreditCard size={14} /> Bảng kê Thẻ Tín Dụng
        </button>

        <button 
          onClick={() => setOpenSection(openSection === 'salary' ? 'none' : 'salary')}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${openSection === 'salary' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 shadow-sm'}`}
        >
          <Building2 size={14} /> Dự tính Lương / Kế hoạch
        </button>

        <button 
          onClick={() => setOpenSection(openSection === 'cash' ? 'none' : 'cash')}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${openSection === 'cash' ? 'bg-amber-600 text-white' : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 shadow-sm'}`}
        >
          <Wallet size={14} /> Kiểm kê Tiền Mặt
        </button>
      </div>

      {/* PANELS */}
      {openSection === 'card' && (
        <div className="bg-indigo-50/50 p-5 rounded-2xl border border-dashed border-indigo-200 animate-in slide-in-from-top-2 mx-auto max-w-2xl text-left">
          <h4 className="text-[11px] font-black text-indigo-800 uppercase tracking-widest mb-3 flex items-center gap-1.5">
             <CreditCard size={13} /> Nhập liệu chi tiết nợ tiêu dùng thẻ
          </h4>
          <div className="space-y-2.5 mb-4">
             {cardSpends.map(item => (
                <div key={item.id} className="flex gap-2">
                   <input type="text" value={item.name} onChange={(e) => handleUpdateCardSpend(item.id, 'name', e.target.value)} className="w-[80px] sm:w-[130px] shrink-0 px-3 py-1.5 bg-white text-xs font-bold rounded-lg border border-indigo-200 outline-none text-indigo-900" placeholder="Ngày..." />
                   <input type="number" value={item.amount} onChange={(e) => handleUpdateCardSpend(item.id, 'amount', e.target.value)} className="w-1/3 px-3 py-1.5 bg-white text-xs font-bold rounded-lg border border-indigo-200 outline-none text-ink" placeholder="Số tiền..." />
                   <input type="text" value={item.notes} onChange={(e) => handleUpdateCardSpend(item.id, 'notes', e.target.value)} className="flex-1 px-3 py-1.5 bg-white text-xs font-semibold rounded-lg border border-indigo-200 outline-none text-ink" placeholder="Ghi chú (Optional)" />
                </div>
             ))}
          </div>
          <button onClick={saveCardDebt} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-sm cursor-pointer border-none">Lưu vào Sổ Tài Sản (Nợ)</button>
        </div>
      )}

      {openSection === 'salary' && (
        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-dashed border-emerald-200 animate-in slide-in-from-top-2 mx-auto max-w-2xl text-left">
          <h4 className="text-[11px] font-black text-emerald-800 uppercase tracking-widest mb-3 flex items-center gap-1.5">
             <Building2 size={13} /> Kế hoạch Doanh thu / Nhận lương
          </h4>
          <div className="space-y-2.5 mb-4">
             {projectedIncome.map(item => (
                <div key={item.id} className="flex gap-2">
                   <input type="text" value={item.name} onChange={(e) => setProjectedIncome(prev => prev.map(p => p.id === item.id ? { ...p, name: e.target.value } : p))} className="w-1/2 px-3 py-1.5 bg-white text-xs font-bold rounded-lg border border-emerald-200 outline-none text-emerald-900" placeholder="Tên khoản thu..." />
                   <input type="number" value={item.amount} onChange={(e) => setProjectedIncome(prev => prev.map(p => p.id === item.id ? { ...p, amount: e.target.value } : p))} className="flex-1 px-3 py-1.5 bg-white text-xs font-bold rounded-lg border border-emerald-200 outline-none text-ink" placeholder="Số tiền..." />
                </div>
             ))}
          </div>
          <button onClick={saveProjectedSalary} className="w-full py-2.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-sm cursor-pointer border-none">Lưu dự thu vào Tài Sản</button>
        </div>
      )}

      {openSection === 'cash' && (
        <div className="bg-amber-50/50 p-5 rounded-2xl border border-dashed border-amber-200 animate-in slide-in-from-top-2 mx-auto max-w-2xl text-left">
          <h4 className="text-[11px] font-black text-amber-800 uppercase tracking-widest mb-3 flex items-center gap-1.5">
             <Wallet size={13} /> Bảng kê tiền mặt thực tế
          </h4>
          <div className="space-y-2.5 mb-4">
             {cashOnHand.map(item => (
                <div key={item.id} className="flex gap-2 items-center">
                   <div className="w-[100px] text-xs font-black text-amber-900 text-right">{item.denomination}đ</div>
                   <input type="number" value={item.count} onChange={(e) => setCashOnHand(prev => prev.map(p => p.id === item.id ? { ...p, count: e.target.value } : p))} className="flex-1 px-3 py-1.5 bg-white text-xs font-bold rounded-lg border border-amber-200 outline-none text-ink" placeholder="Số tờ..." min="0" />
                </div>
             ))}
          </div>
          <button onClick={saveCashOnHand} className="w-full py-2.5 bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 shadow-sm cursor-pointer border-none flex items-center justify-center gap-1.5"><Save size={13} /> Đồng bộ lên Quỹ Tài Sản</button>
        </div>
      )}
    </div>
  );
};
