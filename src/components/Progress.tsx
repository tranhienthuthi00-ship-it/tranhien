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
  ChevronUp,
  Filter
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

  // States for purchase filtering
  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");

  const masteredWords = words.filter(w => w.difficulty === 1).length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const completedGoals = goals.filter(g => g.isCompleted).length;

  // Purchased items analysis
  const purchasedItemsList = useMemo(() => wishlist.filter(item => item.isPurchased), [wishlist]);
  const purchasedCount = purchasedItemsList.length;

  // Extract years dynamically from the list of purchased items to construct Year options
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    // Always pre-populate with the current year
    yearsSet.add(new Date().getFullYear());
    purchasedItemsList.forEach(item => {
      if (item.addedDate) {
        try {
          const d = new Date(item.addedDate);
          if (!isNaN(d.getTime())) {
            yearsSet.add(d.getFullYear());
          }
        } catch (e) {}
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [purchasedItemsList]);

  // Exclude option and format conversions
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

  // Filtered lists of purchased wishlist items
  const filteredPurchasedList = useMemo(() => {
    return purchasedItemsList.filter(item => {
      if (!item.addedDate) return true;
      try {
        const d = new Date(item.addedDate);
        if (isNaN(d.getTime())) return true;

        if (selectedYear !== "all" && d.getFullYear() !== selectedYear) {
          return false;
        }
        if (selectedMonth !== "all" && (d.getMonth() + 1) !== selectedMonth) {
          return false;
        }
        return true;
      } catch (e) {
        return true;
      }
    });
  }, [purchasedItemsList, selectedMonth, selectedYear]);

  // Cumulative value of items fitting the current month/year filters
  const filteredPurchasedValue = useMemo(() => {
    return filteredPurchasedList.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [filteredPurchasedList]);

  // Overall total value of purchased items (all time)
  const totalPurchasedValueAllTime = useMemo(() => {
    return purchasedItemsList.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [purchasedItemsList]);

  // Standard Net Worth calculation matching AssetsManager.tsx: skipping excludeFromNetWorth items
  const standardNetWorth = useMemo(() => {
    return assets.reduce((sum, item) => {
      if (item.excludeFromNetWorth) return sum;
      const val = getValueInVND(item.value, item.currency);
      return item.isDebt ? sum - val : sum + val;
    }, 0);
  }, [assets]);

  // Complete net worth including exclusions: counts everything
  const totalWithExcludedNetWorth = useMemo(() => {
    return assets.reduce((sum, item) => {
      const val = getValueInVND(item.value, item.currency);
      return item.isDebt ? sum - val : sum + val;
    }, 0);
  }, [assets]);

  // Excluded assets breakdown listing
  const excludedAssetsList = useMemo(() => {
    return assets.filter(item => item.excludeFromNetWorth);
  }, [assets]);

  const excludedTotal = useMemo(() => {
    return excludedAssetsList.reduce((sum, item) => {
      const val = getValueInVND(item.value, item.currency);
      return item.isDebt ? sum - val : sum + val;
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

        {/* Card 5: Purchased items */}
        <div className="sketch-border p-5 bg-emerald-50/50 flex flex-col items-center text-center gap-2 hover:bg-emerald-50/80 transition-colors shadow-sm">
          <ShoppingBag size={32} className="text-emerald-700" style={{ filter: 'url(#hand-drawn-filter)' }} />
          <h2 className="text-3xl font-sans font-black text-emerald-800">{purchasedCount}</h2>
          <p className="hand-text text-lg font-bold text-emerald-950">Đổ đã mua</p>
          <div className="mt-1 pt-2 border-t border-emerald-900/15 w-full text-[11px] font-mono font-bold text-emerald-700 uppercase" title="Tổng giá trị các món đã mua">
            {formatCurrency(totalPurchasedValueAllTime)}
          </div>
        </div>
      </div>

      {/* SECTION 2: Asset & Shopping Analysis Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Purchased Items Detail with Filters */}
        <div className="lg:col-span-6 sketch-border p-5 md:p-6 bg-white/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-ink/10">
            <div className="flex items-center gap-2">
              <ShoppingBag className="text-emerald-700 w-5 h-5 animate-pulse" />
              <h3 className="text-base font-black font-sans uppercase tracking-wider text-ink">
                MUA SẮM CHI TIẾT
              </h3>
            </div>
            {/* Short indicator of current filter state */}
            {(selectedMonth !== "all" || selectedYear !== "all") && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                Đang lọc dữ liệu
              </span>
            )}
          </div>

          <div className="space-y-4">
            
            {/* Filter controls */}
            <div className="bg-white/80 p-3 pt-2 rounded border border-ink/10 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink/70">
                <Filter size={12} className="text-emerald-600" />
                <span className="font-sans uppercase tracking-wider">Lọc theo thời gian mua sắm:</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-black uppercase text-ink/40 mb-1 font-sans">Tháng mua</label>
                  <select
                    id="filter-purchase-month"
                    value={selectedMonth}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedMonth(val === "all" ? "all" : parseInt(val));
                    }}
                    className="w-full text-xs font-bold bg-white text-ink border border-ink/15 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500 shadow-sm transition-colors cursor-pointer"
                  >
                    <option value="all">📅 Tất cả các tháng</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>Tháng {month}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-ink/40 mb-1 font-sans">Năm mua</label>
                  <select
                    id="filter-purchase-year"
                    value={selectedYear}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedYear(val === "all" ? "all" : parseInt(val));
                    }}
                    className="w-full text-xs font-bold bg-white text-ink border border-ink/15 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500 shadow-sm transition-colors cursor-pointer"
                  >
                    <option value="all">📅 Tất cả các năm</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>Năm {year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reset to show all button if any filter active */}
              {(selectedMonth !== "all" || selectedYear !== "all") && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMonth("all");
                      setSelectedYear("all");
                    }}
                    className="text-[9px] font-black uppercase text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                  >
                    ✖ Reset bộ lọc (Hiện tất cả)
                  </button>
                </div>
              )}
            </div>

            {/* Total display with current filter status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50/50 p-3 border border-emerald-900/10 rounded flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase text-emerald-800/60 block font-sans">Theo lọc đã chọn:</span>
                  <span className="text-xs font-medium text-ink/65 italic font-sans">
                    {selectedMonth !== "all" ? `Tháng ${selectedMonth}` : "Tất cả tháng"} 
                    {" / "} 
                    {selectedYear !== "all" ? `Năm ${selectedYear}` : "Tất cả năm"}
                  </span>
                </div>
                <span className="text-lg font-mono font-black text-emerald-800 mt-1">{formatCurrency(filteredPurchasedValue)}</span>
              </div>

              <div className="bg-white/60 p-3 border border-ink/5 rounded flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase text-ink/45 block font-sans">Tổng đầu tư mua sắm:</span>
                  <span className="text-xs font-medium text-ink/65 italic font-sans">Toàn thời gian</span>
                </div>
                <span className="text-lg font-mono font-black text-ink mt-1">{formatCurrency(totalPurchasedValueAllTime)}</span>
              </div>
            </div>

            {/* Render items list */}
            {filteredPurchasedList.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-ink/45 font-sans block">
                  DANH SÁCH ĐỒ ĐÃ MUA ({filteredPurchasedList.length} vật phẩm):
                </span>
                <div className="max-h-[250px] overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {filteredPurchasedList.slice().reverse().map(item => {
                    // Extract local readable date from item.addedDate
                    let dateLabel = "";
                    if (item.addedDate) {
                      try {
                        const d = new Date(item.addedDate);
                        if (!isNaN(d.getTime())) {
                          dateLabel = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                        }
                      } catch(e){}
                    }

                    return (
                      <div key={item.id} className="flex items-center justify-between p-2.5 hover:bg-white/80 rounded border border-ink/5 transition-colors font-sans">
                        <div className="min-w-0 pr-2 space-y-0.5">
                          <p className="font-bold text-ink truncate">{item.content}</p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {dateLabel && (
                              <span className="text-[8px] font-bold text-ink/40 bg-ink/5 px-1 rounded uppercase">
                                Ngày: {dateLabel}
                              </span>
                            )}
                            {item.necessity && (
                              <span className={`text-[8px] font-bold px-1 rounded uppercase ${
                                item.necessity === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-150' :
                                item.necessity === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-150' :
                                'bg-slate-50 text-slate-500 border border-slate-150'
                              }`}>
                                {item.necessity}
                              </span>
                            )}
                          </div>
                          {item.note && <p className="text-[10px] text-ink/45 italic font-hand truncate">{item.note}</p>}
                        </div>
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50/60 px-1.5 py-0.5 border border-emerald-100 rounded shrink-0">
                          {item.price ? formatCurrency(item.price) : "Miễn phí"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-ink/15 rounded bg-ink/5">
                <p className="text-xs text-ink/50 italic">
                  Không tìm thấy món đồ nào đã mua phù hợp với mốc thời gian lọc đã chọn.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Asset Reports */}
        <div className="lg:col-span-6 sketch-border p-5 md:p-6 bg-white/40 space-y-4 relative">
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
              
              {/* Dynamic asset status explanation */}
              <p className="text-xs text-ink/75 leading-relaxed bg-amber-50/25 p-2.5 rounded border border-ink/5 border-dashed">
                Mục hiển thị giá trị tích lũy tài sản và vốn ròng thực tế của bạn. Đã được đồng bộ hóa trực tiếp từ dữ liệu của tab <strong>TÀI SẢN</strong> trong Bộ sưu tập.
              </p>

              {/* Main report display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/70 p-4 border-2 border-ink rounded flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-transform">
                  <div>
                    <span className="text-[9px] font-black uppercase text-ink/40 tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3" /> Tài sản báo cáo chính thức
                    </span>
                    <p className="text-[10px] text-ink/50 font-hand italic mt-0.5">Bỏ qua tài sản đánh dấu loại trừ</p>
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
                    <p className="text-[10px] text-ink/50 font-hand italic mt-0.5">Bao gồm cả dòng tiền bị loại trừ</p>
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
                  className="w-full bg-ink text-paper hover:bg-slate-800 transition-colors p-2.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  {showAllAssets ? "Thu gọn báo cáo tài sản" : "Xem tất cả tài sản nếu tính vào báo cáo"}
                  {showAllAssets ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                </button>

                {showAllAssets && (
                  <div className="mt-4 bg-white p-4 border border-ink/20 rounded space-y-3 shadow-inner max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 text-xs">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-ink/5">
                      <Info className="w-4 h-4 text-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-ink/65">
                        Báo cáo tích lũy thực tế chi tiết
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between font-bold text-ink/70">
                        <span>Giá trị báo cáo chuẩn:</span>
                        <span className="font-mono text-emerald-700">{formatCurrency(standardNetWorth)}</span>
                      </div>

                      <div className="flex justify-between font-bold text-ink/70">
                        <span>Giá trị tài sản loại trừ (added back):</span>
                        <span className={`font-mono ${excludedTotal >= 0 ? "text-blue-600" : "text-crimson"}`}>
                          {excludedTotal >= 0 ? "+" : ""}{formatCurrency(excludedTotal)}
                        </span>
                      </div>

                      <div className="flex justify-between font-black text-ink border-t border-ink/10 pt-2 text-base">
                        <span>TỔNG THỰC TÀI SẢN:</span>
                        <span className="font-mono text-emerald-800 bg-emerald-50 px-1 border border-emerald-200 rounded">
                          {formatCurrency(totalWithExcludedNetWorth)}
                        </span>
                      </div>
                    </div>

                    {/* Excluded items list */}
                    {excludedAssetsList.length > 0 ? (
                      <div className="pt-2 space-y-1.5 border-t border-ink/5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-ink/40 block">Các tài sản loại trừ được tính gộp:</span>
                        {excludedAssetsList.map(asset => {
                          const totalVal = getValueInVND(asset.value, asset.currency);
                          return (
                            <div key={asset.id} className="flex justify-between items-center text-[11px] p-2 bg-amber-55/40 border border-amber-200/50 rounded font-sans leading-tight">
                              <div>
                                <span className="font-bold text-ink/80">{asset.name}</span>
                                <span className="text-[8px] font-bold uppercase text-amber-700 bg-amber-100 ml-1.5 px-1 rounded">Bị loại trừ</span>
                              </div>
                              <span className="font-mono font-bold text-amber-700">
                                {formatCurrency(totalVal)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="pt-2 text-center text-[10px] text-ink/40 italic">
                        Hiện không có tài sản nào đang bị loại trừ khỏi Vốn chủ sở hữu của bạn.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 px-4 border border-dashed border-ink/15 rounded bg-ink/5 flex flex-col items-center justify-center gap-3">
              <HelpCircle className="w-8 h-8 text-ink/30" />
              <p className="text-xs text-ink/65 max-w-sm">
                Bạn chưa thêm tài sản nào vào ngân khố. Bạn hãy vào tab <strong>Tài sản</strong> trong Bộ sưu tập để thêm các dòng tài sản, nợ, tiền mặt nhé!
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
