import { useState, useMemo } from "react";
import type { Word, Task, LogEntry, WishlistItem, StudyGoal, Asset } from "@/types";
import { 
  BookA, 
  CheckSquare, 
  CalendarDays, 
  ShoppingBag, 
  Target, 
  Wallet, 
  TrendingUp, 
  Info, 
  HelpCircle,
  PiggyBank,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export function Progress({
  words,
  tasks,
  logs,
  wishlist,
  goals = [],
  assets = [],
}: {
  words: Word[];
  tasks: Task[];
  logs: LogEntry[];
  wishlist: WishlistItem[];
  goals?: StudyGoal[];
  assets?: Asset[];
}) {
  const [showAllAssets, setShowAllAssets] = useState(false);

  const masteredWords = words.filter(w => w.difficulty === 1).length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const completedGoals = goals.filter(g => g.isCompleted).length;

  // Purchased items analysis
  const purchasedItemsList = useMemo(() => wishlist.filter(item => item.isPurchased), [wishlist]);
  const purchasedCount = purchasedItemsList.length;
  const totalPurchasedValue = useMemo(() => {
    return purchasedItemsList.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [purchasedItemsList]);

  // Asset Currency Exchangers
  const getValueInVND = (value: number, currency: string) => {
    if (currency === 'VND') return value;
    if (currency === 'USD') return value * 25000;
    if (currency === 'EUR') return value * 27000;
    if (currency === 'GOLD') return value * 8000000; // estimation
    return value;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Standard Net Worth: excludes assets that have excludeFromNetWorth === true
  const standardNetWorth = useMemo(() => {
    return assets.reduce((sum, item) => {
      if (item.excludeFromNetWorth) return sum;
      const val = getValueInVND(item.value, item.currency);
      const absValue = item.quantity ? val * item.quantity : val;
      return item.isDebt ? sum - absValue : sum + absValue;
    }, 0);
  }, [assets]);

  // All Assets net worth: includes absolutely everything (debt is subtracted, assets added, even excluded ones)
  const totalWithExcludedNetWorth = useMemo(() => {
    return assets.reduce((sum, item) => {
      const val = getValueInVND(item.value, item.currency);
      const absValue = item.quantity ? val * item.quantity : val;
      return item.isDebt ? sum - absValue : sum + absValue;
    }, 0);
  }, [assets]);

  // Excluded assets breakdown
  const excludedAssetsList = useMemo(() => {
    return assets.filter(item => item.excludeFromNetWorth);
  }, [assets]);

  const excludedTotal = useMemo(() => {
    return excludedAssetsList.reduce((sum, item) => {
      const val = getValueInVND(item.value, item.currency);
      const absValue = item.quantity ? val * item.quantity : val;
      return item.isDebt ? sum - absValue : sum + absValue;
    }, 0);
  }, [excludedAssetsList]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-300">
      
      {/* SECTION 1: Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Words */}
        <div className="sketch-border p-5 bg-white/40 flex flex-col items-center text-center gap-2 hover:bg-white/60 transition-colors">
          <BookA size={32} className="text-crimson" style={{ filter: 'url(#hand-drawn-filter)' }} />
          <h2 className="text-3xl font-sans font-black">{words.length}</h2>
          <p className="hand-text text-lg">Words Logged</p>
          <div className="mt-1 pt-2 border-t border-ink/10 w-full text-[10px] font-sans font-bold uppercase tracking-widest text-ink/50">
            {masteredWords} Mastered
          </div>
        </div>

        {/* Card 2: Goals */}
        <div className="sketch-border p-5 bg-white/40 flex flex-col items-center text-center gap-2 hover:bg-white/60 transition-colors">
          <Target size={32} className="text-ink" style={{ filter: 'url(#hand-drawn-filter)' }} />
          <h2 className="text-3xl font-sans font-black">{completedGoals}</h2>
          <p className="hand-text text-lg">Goals Achieved</p>
          <div className="mt-1 pt-2 border-t border-ink/10 w-full text-[10px] font-sans font-bold uppercase tracking-widest text-ink/50">
            Out of {goals.length} active
          </div>
        </div>

        {/* Card 3: Tasks */}
        <div className="sketch-border p-5 bg-white/40 flex flex-col items-center text-center gap-2 hover:bg-white/60 transition-colors">
          <CheckSquare size={32} className="text-ink" style={{ filter: 'url(#hand-drawn-filter)' }} />
          <h2 className="text-3xl font-sans font-black">{completedTasks}</h2>
          <p className="hand-text text-lg">Tasks Done</p>
          <div className="mt-1 pt-2 border-t border-ink/10 w-full text-[10px] font-sans font-bold uppercase tracking-widest text-ink/50">
            Out of {tasks.length} total
          </div>
        </div>

        {/* Card 4: Diary */}
        <div className="sketch-border p-5 bg-white/40 flex flex-col items-center text-center gap-2 hover:bg-white/60 transition-colors">
          <CalendarDays size={32} className="text-ink" style={{ filter: 'url(#hand-drawn-filter)' }} />
          <h2 className="text-3xl font-sans font-black">{logs.length}</h2>
          <p className="hand-text text-lg">Diary Entries</p>
          <div className="mt-1 pt-2 border-t border-ink/10 w-full text-[10px] font-sans font-bold uppercase tracking-widest text-ink/50">
            Keep reflecting!
          </div>
        </div>

        {/* Card 5: Purchased items (NEW REQUEST) */}
        <div className="sketch-border p-5 bg-emerald-50/50 flex flex-col items-center text-center gap-2 hover:bg-emerald-50/80 transition-colors shadow-sm">
          <ShoppingBag size={32} className="text-emerald-700" style={{ filter: 'url(#hand-drawn-filter)' }} />
          <h2 className="text-3xl font-sans font-black text-emerald-800">{purchasedCount}</h2>
          <p className="hand-text text-lg font-bold text-emerald-950">Đồ đã mua</p>
          <div className="mt-1 pt-2 border-t border-emerald-900/15 w-full text-[11px] font-mono font-bold text-emerald-700 uppercase" title="Tổng giá trị các món đã mua">
            {formatCurrency(totalPurchasedValue)}
          </div>
        </div>
      </div>

      {/* SECTION 2: Asset & Shopping Analysis Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Purchased Items Detail */}
        <div className="md:col-span-5 sketch-border p-6 bg-white/40 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-ink/10">
            <ShoppingBag className="text-emerald-700 w-5 h-5" />
            <h3 className="text-base font-black font-sans uppercase tracking-wider text-ink">
              MUA SẮM CHI TIẾT
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center bg-emerald-50/30 p-3 border border-ink/5 rounded">
              <div>
                <span className="text-[10px] font-black uppercase text-ink/40 block font-sans">Tổng tiền đầu tư sắm đồ</span>
                <span className="text-xl font-mono font-black text-emerald-800">{formatCurrency(totalPurchasedValue)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-ink/40 block font-sans">Đã mua</span>
                <span className="text-sm font-bold text-ink">{purchasedCount} vật phẩm</span>
              </div>
            </div>

            {purchasedItemsList.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-ink/40 font-sans block mb-1">CÁC MÓN ĐỒ ĐÃ TẬU GẦN ĐÂY:</span>
                <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {purchasedItemsList.slice().reverse().map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 hover:bg-white/80 rounded border border-ink/5 transition-colors font-sans">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-ink truncate">{item.content}</p>
                        {item.note && <p className="text-[10px] text-ink/45 italic font-hand truncate">{item.note}</p>}
                      </div>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50/60 px-1.5 py-0.5 border border-emerald-100 rounded shrink-0">
                        {item.price ? formatCurrency(item.price) : "Miễn phí"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-ink/15 rounded bg-ink/5">
                <p className="text-xs text-ink/50 italic">Bạn chưa đánh dấu mua món đồ nào trong Waitlist / Wishlist của mình.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Asset Reports (NEW REQUEST with Total toggle) */}
        <div className="md:col-span-7 sketch-border p-6 bg-white/40 space-y-4 relative">
          <div className="flex items-center justify-between pb-2 border-b border-ink/10">
            <div className="flex items-center gap-2">
              <Wallet className="text-crimson w-5 h-5 animate-pulse" />
              <h3 className="text-base font-black font-sans uppercase tracking-wider text-ink">
                BÁO CÁO TÀI SẢN (NET WORTH)
              </h3>
            </div>
            {assets.length > 0 && (
              <span className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded uppercase font-sans">
                {assets.length} loại tài sản
              </span>
            )}
          </div>

          {assets.length > 0 ? (
            <div className="space-y-4 font-sans text-left">
              {/* Main report display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/70 p-4 border-2 border-ink rounded flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-transform">
                  <div>
                    <span className="text-[9px] font-black uppercase text-ink/40 tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3" /> Tài sản báo cáo chính thức
                    </span>
                    <p className="text-sm text-ink/50 font-hand italic mt-0.5">Đã loại trừ tài sản không tính vào Tổng tích lũy</p>
                  </div>
                  <p className="text-xl font-mono font-black text-emerald-700 mt-2">
                    {formatCurrency(standardNetWorth)}
                  </p>
                </div>

                <div className="bg-paper p-4 border border-ink/20 rounded flex flex-col justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] font-black uppercase text-ink/40 tracking-wider flex items-center gap-1">
                      <PiggyBank className="w-3" /> Nếu tính hết tất cả tài sản
                    </span>
                    <p className="text-sm text-ink/50 font-hand italic mt-0.5">Báo cáo bao gồm cả tài sản bị loại trừ</p>
                  </div>
                  <p className="text-xl font-mono font-black text-ink mt-2">
                    {formatCurrency(totalWithExcludedNetWorth)}
                  </p>
                </div>
              </div>

              {/* Toggle to see breakdown of all assets if calculated into report */}
              <div className="pt-2 border-t border-dashed border-ink/10">
                <button
                  type="button"
                  id="toggle-all-assets-report-btn"
                  onClick={() => setShowAllAssets(!showAllAssets)}
                  className="w-full bg-ink text-paper hover:bg-slate-800 transition-colors p-2.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  {showAllAssets ? "Thu gọn báo cáo tài sản" : "Xem tất cả tài sản nếu tính vào báo cáo"}
                  {showAllAssets ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                </button>

                {showAllAssets && (
                  <div className="mt-4 bg-white p-4 border border-ink/20 rounded space-y-3 shadow-inner max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-ink/5">
                      <Info className="w-4 h-4 text-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-ink/65">
                        Bảo cáo ước tính tích lũy thực tế
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-ink/70">
                        <span>Giá trị báo cáo chuẩn:</span>
                        <span className="font-mono text-emerald-700">{formatCurrency(standardNetWorth)}</span>
                      </div>

                      <div className="flex justify-between text-xs font-bold text-ink/70">
                        <span>Giá trị tài sản loại trừ (added back):</span>
                        <span className={`font-mono ${excludedTotal >= 0 ? "text-blue-600" : "text-crimson"}`}>
                          {excludedTotal >= 0 ? "+" : ""}{formatCurrency(excludedTotal)}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs font-black text-ink border-t border-ink/10 pt-2 text-base">
                        <span>KẾT QUẢ TỔNG TÀI SẢN:</span>
                        <span className="font-mono text-emerald-800 bg-emerald-50 px-1 border border-emerald-200 rounded">
                          {formatCurrency(totalWithExcludedNetWorth)}
                        </span>
                      </div>
                    </div>

                    {/* Excluded items list */}
                    {excludedAssetsList.length > 0 ? (
                      <div className="pt-2 space-y-1.5 border-t border-ink/5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-ink/40 block">Tài sản loại trừ được tính gộp:</span>
                        {excludedAssetsList.map(asset => {
                          const val = getValueInVND(asset.value, asset.currency);
                          const totalVal = asset.quantity ? val * asset.quantity : val;
                          return (
                            <div key={asset.id} className="flex justify-between items-center text-[11px] p-1.5 bg-amber-50/40 border border-amber-200/50 rounded font-sans leading-tight">
                              <div>
                                <span className="font-bold text-ink/80">{asset.name}</span>
                                <span className="text-[8px] font-bold uppercase text-amber-700 bg-amber-100 ml-1.5 px-1 rounded">Bị loại trừ</span>
                              </div>
                              <span className="font-mono font-bold text-ink/60">
                                {formatCurrency(totalVal)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="pt-2 text-center text-[10px] text-ink/40 italic">
                        Hiện không có tài sản nào đang bị loại trừ khỏi Net Worth của bạn.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 px-4 border border-dashed border-ink/15 rounded bg-ink/5 flex flex-col items-center justify-center gap-3">
              <HelpCircle className="w-8 h-8 text-ink/30" />
              <p className="text-xs text-ink/60 max-w-sm">
                Bạn chưa thêm tài sản nào vào ngân khố. Bạn hãy vào tab <strong>Tài sản</strong> trong Bộ sưu tập để thêm các dòng tài sản, nợ, tiền mặt nhé!
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
