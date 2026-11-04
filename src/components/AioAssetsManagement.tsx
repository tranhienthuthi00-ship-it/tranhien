import React, { useState, useMemo } from "react";
import { Trash2, Edit3, Plus, RotateCcw, Calendar as CalendarIcon, Check, X } from "lucide-react";
import { useFirebase } from "../context/FirebaseContext";
import { parseVNDAmount } from "@/lib/utils";
import type { Asset } from "@/types";

export interface CreditCardSpend {
  id: string;
  date: string; // e.g. "04/11/2026"
  shortDate: string; // e.g. "03/11"
  description: string;
  amount: number;
}

const DEFAULT_CREDIT_SPENDS: CreditCardSpend[] = [
  { id: "cs1", date: "03/11/2026", shortDate: "03/11", description: "Ăn tối", amount: 500000 },
  { id: "cs2", date: "01/11/2026", shortDate: "01/11", description: "Mua sắm Shopee", amount: 350000 },
];

export function AioAssetsManagement() {
  const { 
    assets = [], 
    setAssets,
    assetCategories = [],
    bulkCardSpends = [],
    setBulkCardSpends 
  } = useFirebase();

  // Credit card spends state - Preserves previously saved data from localStorage and bulkCardSpends
  const [creditSpends, setCreditSpends] = useState<CreditCardSpend[]>(() => {
    try {
      const saved = localStorage.getItem("aio_credit_spends_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // If bulkCardSpends has previous valid data, convert them
      const fromBulk = bulkCardSpends
        .filter((b) => b.amount && parseVNDAmount(b.amount) > 0)
        .map((b, idx) => {
          const parts = (b.name || "").split("-");
          const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : b.name || "01/11";
          const fullDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : "01/11/2026";
          return {
            id: "cs_bulk_" + idx,
            date: fullDate,
            shortDate,
            description: b.notes || "Chi tiêu thẻ",
            amount: parseVNDAmount(b.amount),
          };
        });
      if (fromBulk.length > 0) return fromBulk;
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CREDIT_SPENDS;
  });

  const saveCreditSpends = (items: CreditCardSpend[]) => {
    setCreditSpends(items);
    try {
      localStorage.setItem("aio_credit_spends_data", JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  };

  // Add Asset Form state
  const [assetName, setAssetName] = useState("");
  const [assetCategory, setAssetCategory] = useState<"Tiền mặt" | "Ngân hàng" | "Đầu tư" | "Cho vay" | "Đi vay">("Tiền mặt");
  const [assetValue, setAssetValue] = useState("");
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

  const handleAddOrEditAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) return;
    const numericValue = parseInt(assetValue.replace(/\D/g, ""), 10) || 0;
    if (numericValue <= 0) return;

    const isDebt = assetCategory === "Đi vay";
    const isLoan = assetCategory === "Cho vay";

    // Match or fallback category
    const catId = assetCategories.find((c) =>
      c.name.toLowerCase().includes(assetCategory.toLowerCase())
    )?.id || (assetCategory === "Ngân hàng" ? "cat-bank" : assetCategory === "Đầu tư" ? "cat-invest" : "cat-money");

    if (editingAssetId) {
      const updated = assets.map((a) =>
        a.id === editingAssetId
          ? {
              ...a,
              name: assetName.trim(),
              category: catId,
              value: numericValue,
              isDebt,
              isLoan,
            }
          : a
      );
      setAssets(updated);
      setEditingAssetId(null);
    } else {
      const newItem: Asset = {
        id: "asset_" + Date.now(),
        name: assetName.trim(),
        category: catId,
        value: numericValue,
        currency: "VND",
        acquiredAt: Date.now(),
        isDebt,
        isLoan,
        isNewMoney: false,
        excludeFromNetWorth: false,
      };
      setAssets([newItem, ...assets]);
    }

    setAssetName("");
    setAssetValue("");
    setAssetCategory("Tiền mặt");
  };

  const handleStartEditAsset = (item: Asset) => {
    setEditingAssetId(item.id);
    setAssetName(item.name);

    if (item.isDebt) {
      setAssetCategory("Đi vay");
    } else if (item.isLoan) {
      setAssetCategory("Cho vay");
    } else {
      const catObj = assetCategories.find((c) => c.id === item.category);
      const catName = catObj?.name.toLowerCase() || "";
      if (catName.includes("ngân hàng") || catName.includes("bank")) {
        setAssetCategory("Ngân hàng");
      } else if (catName.includes("đầu tư") || catName.includes("invest") || catName.includes("chứng khoán")) {
        setAssetCategory("Đầu tư");
      } else {
        setAssetCategory("Tiền mặt");
      }
    }

    setAssetValue(item.value.toString());
  };

  const handleDeleteAsset = (id: string) => {
    setAssets(assets.filter((a) => a.id !== id));
    if (editingAssetId === id) {
      setEditingAssetId(null);
      setAssetName("");
      setAssetValue("");
    }
  };

  // Add Credit Spend Form state
  const [spendDate, setSpendDate] = useState("04/11/2026");
  const [spendDesc, setSpendDesc] = useState("");
  const [spendAmount, setSpendAmount] = useState("");

  const handleAddCreditSpend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spendDesc.trim()) return;
    const numericAmount = parseInt(spendAmount.replace(/\D/g, ""), 10) || 0;
    if (numericAmount <= 0) return;

    let shortDate = spendDate;
    const parts = spendDate.split("/");
    if (parts.length >= 2) {
      shortDate = `${parts[0]}/${parts[1]}`;
    }

    const newSpend: CreditCardSpend = {
      id: "cs_" + Date.now(),
      date: spendDate.trim() || "04/11/2026",
      shortDate,
      description: spendDesc.trim(),
      amount: numericAmount,
    };

    saveCreditSpends([newSpend, ...creditSpends]);
    setSpendDesc("");
    setSpendAmount("");
  };

  const handleDeleteCreditSpend = (id: string) => {
    saveCreditSpends(creditSpends.filter((cs) => cs.id !== id));
  };

  const handleResetCreditSpends = () => {
    saveCreditSpends(DEFAULT_CREDIT_SPENDS);
    setSpendDesc("");
    setSpendAmount("");
  };

  // Helper to determine display category label
  const getCategoryLabel = (asset: Asset): "Ngân hàng" | "Tiền mặt" | "Đầu tư" | "Cho vay" | "Đi vay" => {
    if (asset.isDebt) return "Đi vay";
    if (asset.isLoan) return "Cho vay";
    const cat = assetCategories.find((c) => c.id === asset.category);
    const name = cat?.name.toLowerCase() || "";
    if (name.includes("ngân hàng") || name.includes("bank")) return "Ngân hàng";
    if (name.includes("đầu tư") || name.includes("invest") || name.includes("chứng khoán") || name.includes("cổ phiếu")) return "Đầu tư";
    return "Tiền mặt";
  };

  // Filter into 3 groups
  const currentAssets = useMemo(() => {
    return assets.filter((a) => !a.isDebt && !a.isLoan);
  }, [assets]);

  const loanAssets = useMemo(() => {
    return assets.filter((a) => a.isLoan && !a.isDebt);
  }, [assets]);

  const debtAssets = useMemo(() => {
    return assets.filter((a) => a.isDebt);
  }, [assets]);

  const currentTotal = useMemo(() => currentAssets.reduce((sum, a) => sum + (a.value || 0), 0), [currentAssets]);
  const loanTotal = useMemo(() => loanAssets.reduce((sum, a) => sum + (a.value || 0), 0), [loanAssets]);
  const debtTotal = useMemo(() => debtAssets.reduce((sum, a) => sum + (a.value || 0), 0), [debtAssets]);

  // Net worth = Current Assets + Loan Assets - Debt Assets
  const netWorth = currentTotal + loanTotal - debtTotal;

  // Credit Card Spend Total
  const totalCreditSpend = useMemo(
    () => creditSpends.reduce((sum, cs) => sum + cs.amount, 0),
    [creditSpends]
  );

  // Asset allocation percentages for Donut chart
  const allocation = useMemo(() => {
    let bankVal = 0;
    let cashVal = 0;
    let investVal = 0;
    let loanVal = loanTotal;

    currentAssets.forEach((a) => {
      const label = getCategoryLabel(a);
      if (label === "Ngân hàng") bankVal += a.value || 0;
      else if (label === "Đầu tư") investVal += a.value || 0;
      else cashVal += a.value || 0;
    });

    const totalPositive = bankVal + cashVal + investVal + loanVal || 1;

    return {
      bank: { val: bankVal, pct: Math.round((bankVal / totalPositive) * 100), color: "#5468B4" },
      cash: { val: cashVal, pct: Math.round((cashVal / totalPositive) * 100), color: "#F8EFCB" },
      invest: { val: investVal, pct: Math.round((investVal / totalPositive) * 100), color: "#A7F3D0" },
      loan: { val: loanVal, pct: Math.round((loanVal / totalPositive) * 100), color: "#38BDF8" },
    };
  }, [currentAssets, loanTotal, assetCategories]);

  // Donut SVG Segments
  const donutSegments = useMemo(() => {
    const data = [
      { key: "bank", pct: allocation.bank.pct, color: "#5468B4" },
      { key: "cash", pct: allocation.cash.pct, color: "#F8EFCB" },
      { key: "invest", pct: allocation.invest.pct, color: "#A7F3D0" },
      { key: "loan", pct: allocation.loan.pct, color: "#38BDF8" },
    ].filter((d) => d.pct > 0);

    let cumulative = 0;
    const circumference = 2 * Math.PI * 38; // r=38

    return data.map((d) => {
      const strokeDasharray = `${(d.pct / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -((cumulative / 100) * circumference);
      cumulative += d.pct;
      return { ...d, strokeDasharray, strokeDashoffset };
    });
  }, [allocation]);

  return (
    <div className="w-full max-w-[1520px] mx-auto py-1 px-2 sm:px-3 md:px-5 select-none font-sans">
      {/* 2x2 Grid compact layout that fits nicely inside the screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* ========================================================= */}
        {/* TOP LEFT (lg:col-span-7): Thêm Tài Sản Mới                */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="w-full h-full bg-[#EAEFFD] rounded-[22px] border-2 border-[#141414] shadow-[4px_4px_0px_#141414] p-3.5 md:p-4 flex flex-col justify-between">
            <h2 className="text-base md:text-lg font-bold text-center text-gray-900 mb-2 tracking-wide">
              {editingAssetId ? "Chỉnh Sửa Tài Sản" : "Thêm Tài Sản Mới"}
            </h2>

            <form onSubmit={handleAddOrEditAsset} className="flex flex-col gap-2">
              {/* Field 1: Tên tài sản */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px] font-bold text-gray-800">
                  Tên tài sản / khoản mục
                </label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="VD: Tiền lương, Số tiết kiệm, Cho A vay..."
                  className="w-full bg-white border-2 border-[#141414] rounded-xl px-3 py-1.5 text-xs font-medium outline-none shadow-xs"
                />
              </div>

              {/* Field 2: Phân loại */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px] font-bold text-gray-800">
                  Phân loại
                </label>
                <select
                  value={assetCategory}
                  onChange={(e) => setAssetCategory(e.target.value as any)}
                  className="w-full bg-white border-2 border-[#141414] rounded-xl px-3 py-1.5 text-xs font-medium outline-none shadow-xs cursor-pointer"
                >
                  <option value="Tiền mặt">Tiền mặt (Đang có)</option>
                  <option value="Ngân hàng">Ngân hàng</option>
                  <option value="Đầu tư">Đầu tư</option>
                  <option value="Cho vay">Cho vay</option>
                  <option value="Đi vay">Đi vay</option>
                </select>
              </div>

              {/* Field 3: Giá trị (VND) */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[11px] font-bold text-gray-800">
                  Giá trị (VND)
                </label>
                <input
                  type="text"
                  value={assetValue}
                  onChange={(e) => setAssetValue(e.target.value)}
                  placeholder="VD: 10000000"
                  className="w-full bg-white border-2 border-[#141414] rounded-xl px-3 py-1.5 text-xs font-medium outline-none shadow-xs font-mono"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-[#5468B4] hover:bg-[#46579a] text-white font-bold py-2 rounded-xl border-2 border-[#141414] shadow-[2.5px_2.5px_0px_#141414] transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer text-xs"
                >
                  {editingAssetId ? "Cập nhật tài sản" : "Thêm tài sản"}
                </button>
                {editingAssetId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAssetId(null);
                      setAssetName("");
                      setAssetValue("");
                    }}
                    className="bg-white hover:bg-gray-100 text-black font-bold px-3 py-2 rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] text-xs cursor-pointer"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TOP RIGHT (lg:col-span-5): Phân Bổ Tài Sản                */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="w-full h-full bg-white rounded-[22px] border-2 border-[#141414] shadow-[4px_4px_0px_#141414] p-3.5 md:p-4 flex flex-col items-center justify-between">
            <h3 className="text-base md:text-lg font-bold text-center text-gray-900 mb-1 tracking-tight">
              Phân bổ tài sản
            </h3>

            {/* Circular Donut Chart */}
            <div className="relative w-32 h-32 md:w-36 md:h-36 flex items-center justify-center my-1">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F3F4F6" strokeWidth="16" />

                {donutSegments.map((seg) => (
                  <circle
                    key={seg.key}
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth="16"
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    className="transition-all duration-500"
                  />
                ))}
              </svg>

              {/* Center Net Worth Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] text-gray-500 font-medium">Tài sản ròng</span>
                <span className="text-xs md:text-sm font-black text-gray-900 font-mono tracking-tight">
                  {netWorth.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            {/* Legend at bottom */}
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 pt-1.5 text-[10px] text-gray-700 font-medium border-t border-gray-100 w-full">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#5468B4]" />
                <span>Ngân hàng ({allocation.bank.pct}%)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#F8EFCB] border border-gray-300" />
                <span>Tiền mặt ({allocation.cash.pct}%)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#A7F3D0]" />
                <span>Đầu tư ({allocation.invest.pct}%)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                <span>Cho vay ({allocation.loan.pct}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM LEFT (lg:col-span-7): Danh Mục Tài Sản             */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="w-full h-full bg-white rounded-[22px] border-2 border-[#141414] shadow-[4px_4px_0px_#141414] p-3.5 md:p-4 flex flex-col gap-2.5">
            <h3 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
              Danh mục tài sản
            </h3>

            <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1">
              {/* GROUP 1: Tài sản đang có */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 border-b border-dashed border-gray-300 pb-0.5">
                  <span className="text-xs font-bold text-[#5468B4]">
                    Tài sản đang có
                  </span>
                  <span className="text-xs font-bold text-[#5468B4]">
                    {currentTotal.toLocaleString("vi-VN")} đ
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  {currentAssets.length === 0 ? (
                    <span className="text-[10px] text-gray-400 italic">Chưa có tài sản đang có</span>
                  ) : (
                    currentAssets.map((item) => {
                      const label = getCategoryLabel(item);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between group hover:bg-gray-50/80 p-1 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-gray-900 truncate">
                              {item.name}
                            </span>
                            <span
                              className={`inline-block px-2 py-0.2 rounded-full text-[9px] font-bold ${
                                label === "Ngân hàng"
                                  ? "bg-[#5468B4] text-white"
                                  : label === "Tiền mặt"
                                  ? "bg-[#F8EFCB] text-black border border-black/20"
                                  : "bg-[#DCFCE7] text-emerald-900 border border-emerald-300"
                              }`}
                            >
                              {label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#5468B4] font-mono">
                              {(item.value || 0).toLocaleString("vi-VN")} đ
                            </span>
                            <button
                              onClick={() => handleStartEditAsset(item)}
                              title="Chỉnh sửa"
                              className="w-6 h-6 rounded-md border border-gray-300 hover:border-black flex items-center justify-center text-gray-600 hover:text-black bg-white shadow-xs cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteAsset(item.id)}
                              title="Xóa"
                              className="w-6 h-6 rounded-md border border-gray-300 hover:border-red-500 flex items-center justify-center text-gray-500 hover:text-red-500 bg-white shadow-xs cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* GROUP 2: Tài sản cho vay */}
              <div className="flex flex-col gap-1.5 pt-1 border-t border-gray-100">
                <div className="flex items-center justify-between gap-2 border-b border-dashed border-gray-300 pb-0.5">
                  <span className="text-xs font-bold text-teal-600">
                    Tài sản cho vay
                  </span>
                  <span className="text-xs font-bold text-teal-600">
                    {loanTotal.toLocaleString("vi-VN")} đ
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  {loanAssets.length === 0 ? (
                    <span className="text-[10px] text-gray-400 italic">Chưa có khoản cho vay</span>
                  ) : (
                    loanAssets.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between group hover:bg-gray-50/80 p-1 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {item.name}
                          </span>
                          <span className="inline-block px-2 py-0.2 rounded-full text-[9px] font-bold bg-[#E0F2FE] text-sky-800 border border-sky-300">
                            Cho vay
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-teal-600 font-mono">
                            {(item.value || 0).toLocaleString("vi-VN")} đ
                          </span>
                          <button
                            onClick={() => handleStartEditAsset(item)}
                            title="Chỉnh sửa"
                            className="w-6 h-6 rounded-md border border-gray-300 hover:border-black flex items-center justify-center text-gray-600 hover:text-black bg-white shadow-xs cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(item.id)}
                            title="Xóa"
                            className="w-6 h-6 rounded-md border border-gray-300 hover:border-red-500 flex items-center justify-center text-gray-500 hover:text-red-500 bg-white shadow-xs cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* GROUP 3: Tài sản đang đi vay */}
              <div className="flex flex-col gap-1.5 pt-1 border-t border-gray-100">
                <div className="flex items-center justify-between gap-2 border-b border-dashed border-gray-300 pb-0.5">
                  <span className="text-xs font-bold text-rose-500">
                    Tài sản đang đi vay
                  </span>
                  <span className="text-xs font-bold text-rose-500">
                    {debtTotal.toLocaleString("vi-VN")} đ
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  {debtAssets.length === 0 ? (
                    <span className="text-[10px] text-gray-400 italic">Chưa có khoản đi vay</span>
                  ) : (
                    debtAssets.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between group hover:bg-gray-50/80 p-1 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {item.name}
                          </span>
                          <span className="inline-block px-2 py-0.2 rounded-full text-[9px] font-bold bg-[#FEE2E2] text-rose-800 border border-rose-300">
                            Đi vay
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-rose-500 font-mono">
                            {(item.value || 0).toLocaleString("vi-VN")} đ
                          </span>
                          <button
                            onClick={() => handleStartEditAsset(item)}
                            title="Chỉnh sửa"
                            className="w-6 h-6 rounded-md border border-gray-300 hover:border-black flex items-center justify-center text-gray-600 hover:text-black bg-white shadow-xs cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(item.id)}
                            title="Xóa"
                            className="w-6 h-6 rounded-md border border-gray-300 hover:border-red-500 flex items-center justify-center text-gray-500 hover:text-red-500 bg-white shadow-xs cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM RIGHT (lg:col-span-5): Chi Tiêu Thẻ Tín Dụng       */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="w-full h-full bg-[#FAF0EB] rounded-[22px] border-2 border-[#141414] shadow-[4px_4px_0px_#141414] p-3.5 md:p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base md:text-lg font-bold text-gray-900 tracking-tight mb-2">
                Chi tiêu thẻ tín dụng
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Left side: Inputs (sm:col-span-6) */}
                <form onSubmit={handleAddCreditSpend} className="sm:col-span-6 flex flex-col gap-1.5">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-gray-800">Ngày</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={spendDate}
                        onChange={(e) => setSpendDate(e.target.value)}
                        placeholder="04/11/2026"
                        className="w-full bg-white border-2 border-[#141414] rounded-lg px-2.5 py-1 text-xs font-mono outline-none shadow-xs pr-7"
                      />
                      <CalendarIcon className="w-3 h-3 text-gray-500 absolute right-2 top-2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-gray-800">Nội dung chi</label>
                    <input
                      type="text"
                      value={spendDesc}
                      onChange={(e) => setSpendDesc(e.target.value)}
                      placeholder="VD: Mua sắm..."
                      className="w-full bg-white border-2 border-[#141414] rounded-lg px-2.5 py-1 text-xs outline-none shadow-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-gray-800">Số tiền (VND)</label>
                    <input
                      type="text"
                      value={spendAmount}
                      onChange={(e) => setSpendAmount(e.target.value)}
                      placeholder="VD: 500000"
                      className="w-full bg-white border-2 border-[#141414] rounded-lg px-2.5 py-1 text-xs font-mono outline-none shadow-xs"
                    />
                  </div>

                  {/* Buttons: Thêm & Reset */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="submit"
                      className="flex-1 bg-[#5468B4] hover:bg-[#46579a] text-white font-bold py-1.5 rounded-full border-2 border-[#141414] shadow-[1.5px_1.5px_0px_#141414] text-xs cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                    >
                      Thêm
                    </button>
                    <button
                      type="button"
                      onClick={handleResetCreditSpends}
                      className="flex-1 bg-white hover:bg-gray-100 text-black font-bold py-1.5 rounded-full border-2 border-[#141414] shadow-[1.5px_1.5px_0px_#141414] text-xs cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
                    >
                      Reset
                    </button>
                  </div>
                </form>

                {/* Right side: Spends List (sm:col-span-6) */}
                <div className="sm:col-span-6 flex flex-col gap-1 max-h-[175px] overflow-y-auto pr-1">
                  {creditSpends.map((cs) => (
                    <div
                      key={cs.id}
                      className="flex items-center justify-between gap-1 p-1 rounded-lg hover:bg-white/60 transition-colors group"
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="border border-gray-600 rounded-full px-1.5 py-0.2 text-[8px] font-mono text-gray-700 bg-white/80 shrink-0">
                          {cs.shortDate}
                        </span>
                        <span className="text-xs font-semibold text-gray-800 truncate">
                          {cs.description}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs font-bold text-rose-500 font-mono">
                          {cs.amount.toLocaleString("vi-VN")} đ
                        </span>
                        <button
                          onClick={() => handleDeleteCreditSpend(cs.id)}
                          title="Xóa chi tiêu"
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 rounded transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Total Line */}
            <div className="pt-2 mt-2 border-t border-dashed border-rose-300 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">Tổng chi tiêu:</span>
              <span className="text-xs md:text-sm font-black text-rose-500 font-mono tracking-tight">
                {totalCreditSpend.toLocaleString("vi-VN")} đ
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
