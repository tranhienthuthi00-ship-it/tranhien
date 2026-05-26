import React, { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Edit2, Wallet, Settings, Landmark, Car, MonitorSmartphone, Gem, PiggyBank, Briefcase, Bitcoin, Building, Home, Coins, CreditCard, TrendingUp, Smartphone, Laptop, Handshake, Users, Receipt } from "lucide-react";
import type { FormEvent } from "react";
import { cn, getAbsoluteUrl } from "@/lib/utils";
import type { Asset, AssetCategory } from "@/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export const ICON_MAP: Record<string, React.FC<any>> = {
  Wallet, Landmark, Car, MonitorSmartphone, Gem, PiggyBank, Briefcase, Bitcoin, Building, Home, Coins, CreditCard, TrendingUp, Smartphone, Laptop, Handshake, Users
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export const CATEGORY_ICON_DEFINITIONS = [
  { key: "Wallet", label: "Ví tiền (Wallet)" },
  { key: "Home", label: "Nhà cửa (Home)" },
  { key: "Car", label: "Xe cộ (Car)" },
  { key: "Laptop", label: "Công nghệ (Tech)" },
  { key: "PiggyBank", label: "Tiết kiệm (Savings)" },
  { key: "TrendingUp", label: "Đầu tư (Investment)" },
  { key: "Landmark", label: "Ngân hàng (Bank)" },
  { key: "Bitcoin", label: "Crypto (Bitcoin)" },
  { key: "Gem", label: "Trang sức (Jewelry/Gem)" },
  { key: "Briefcase", label: "Kinh doanh (Business)" },
  { key: "Building", label: "BĐS Dự án (Building)" },
  { key: "Coins", label: "Tiền mặt (Cash)" },
  { key: "CreditCard", label: "Thẻ tín dụng (Card)" },
  { key: "Handshake", label: "Cho vay (Loans)" },
  { key: "Users", label: "Dùng chung (Shared)" },
  { key: "Smartphone", label: "Điện thoại (Phone)" },
  { key: "MonitorSmartphone", label: "Thiết bị số (Devices)" }
];

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
  const [sortBy, setSortBy] = useState<"name" | "value" | "date">("date");

  const defaultCatID = categories.length > 0 ? categories[0].id : '';
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>(defaultCatID);
  const [newValue, setNewValue] = useState("");
  const [newCurrency, setNewCurrency] = useState("VND");
  const [newNotes, setNewNotes] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newExchangeRate, setNewExchangeRate] = useState("");
  const [newDenomination, setNewDenomination] = useState("");
  const [isDebt, setIsDebt] = useState(false);
  const [isLoan, setIsLoan] = useState(false);
  const [isNewMoney, setIsNewMoney] = useState(false);
  const [excludeFromNetWorth, setExcludeFromNetWorth] = useState(false);

  const [isCategorizing, setIsCategorizing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ id: string; name: string; reasoning: string } | null>(null);

  // AI-powered Auto Categorization triggered when newName changes
  useEffect(() => {
    if (!newName.trim() || isNewMoney) {
      setAiSuggestion(null);
      return;
    }

    const handler = setTimeout(() => {
      const fetchSuggestion = async () => {
        setIsCategorizing(true);
        try {
          const response = await fetch(getAbsoluteUrl("/api/assets/categorize"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itemName: newName,
              categories: categories.map(c => ({ id: c.id, name: c.name }))
            })
          });
          if (response.ok) {
            const data = await response.json();
            const matchingCat = categories.find(c => c.id === data.suggestedCategoryId);
            if (matchingCat) {
              setAiSuggestion({
                id: matchingCat.id,
                name: matchingCat.name,
                reasoning: data.reasoning
              });
            }
          }
        } catch (error) {
          console.error("Auto-categorization fetch failed", error);
        } finally {
          setIsCategorizing(false);
        }
      };

      fetchSuggestion();
    }, 800);

    return () => clearTimeout(handler);
  }, [newName, categories, isNewMoney]);

  // Generate last 7 dates in YYYY-MM-DD
  const getLast7Dates = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  };

  // Bulk Debt State with exactly 7 rows for days of the week
  const DEFAULT_WEEK_DEBTS = getLast7Dates().map((dateStr, idx) => ({
    id: idx + 1,
    name: dateStr,
    amount: "",
    notes: ""
  }));

  const [bulkDebts, setBulkDebts] = useState<{id: number, name: string, amount: string, notes: string}[]>(() => {
    try {
      const saved = localStorage.getItem("studyHub_bulkDebts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 7) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_WEEK_DEBTS.map(item => ({ ...item }));
  });

  const [bulkCardSpends, setBulkCardSpends] = useState<{id: number, name: string, amount: string, notes: string}[]>(() => {
    try {
      const saved = localStorage.getItem("studyHub_bulkCardSpends");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_WEEK_DEBTS.map(item => ({ ...item, amount: "", notes: "" }));
  });

  const [bulkCurrentCash, setBulkCurrentCash] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem("studyHub_bulkCurrentCash");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  // 1. Cross-Device Sync: FROM remote Firebase meta-assets TO local state
  useEffect(() => {
    if (!assets) return;
    
    // a. Debts sync
    const debtsMeta = assets.find(a => a.id === "meta_bulk_debts");
    if (debtsMeta && debtsMeta.notes) {
      try {
        const remoteArr = JSON.parse(debtsMeta.notes);
        if (Array.isArray(remoteArr) && remoteArr.length === 7) {
          if (JSON.stringify(bulkDebts) !== debtsMeta.notes) {
            setBulkDebts(remoteArr);
          }
        }
      } catch (err) {
        console.error("Lỗi đồng bộ remote bulkDebts:", err);
      }
    }

    // b. Card Spends sync
    const cardsMeta = assets.find(a => a.id === "meta_bulk_card_spends");
    if (cardsMeta && cardsMeta.notes) {
      try {
        const remoteArr = JSON.parse(cardsMeta.notes);
        if (Array.isArray(remoteArr) && remoteArr.length > 0) {
          if (JSON.stringify(bulkCardSpends) !== cardsMeta.notes) {
            setBulkCardSpends(remoteArr);
          }
        }
      } catch (err) {
        console.error("Lỗi đồng bộ remote bulkCardSpends:", err);
      }
    }

    // c. Current Cash sync
    const cashMeta = assets.find(a => a.id === "meta_bulk_current_cash");
    if (cashMeta && cashMeta.notes) {
      try {
        const remoteObj = JSON.parse(cashMeta.notes);
        if (JSON.stringify(bulkCurrentCash) !== cashMeta.notes) {
          setBulkCurrentCash(remoteObj);
        }
      } catch (err) {
        console.error("Lỗi đồng bộ remote bulkCurrentCash:", err);
      }
    }
  }, [assets]);

  // 2. Cross-Device Sync: FROM local state TO remote Firebase meta-assets & localStorage
  useEffect(() => {
    try {
      const localStr = JSON.stringify(bulkDebts);
      localStorage.setItem("studyHub_bulkDebts", localStr);

      const existing = assets.find(a => a.id === "meta_bulk_debts");
      if (!existing || existing.notes !== localStr) {
        const updatedMeta: Asset = {
          id: "meta_bulk_debts",
          name: "Meta Bulk Debts (Sync)",
          category: "meta",
          value: 0,
          currency: "VND",
          notes: localStr,
          excludeFromNetWorth: true
        };
        const filtered = assets.filter(a => a.id !== "meta_bulk_debts");
        setAssets([updatedMeta, ...filtered]);
      }
    } catch (e) {
      console.error(e);
    }
  }, [bulkDebts, setAssets, assets]);

  useEffect(() => {
    try {
      const localStr = JSON.stringify(bulkCardSpends);
      localStorage.setItem("studyHub_bulkCardSpends", localStr);

      const existing = assets.find(a => a.id === "meta_bulk_card_spends");
      if (!existing || existing.notes !== localStr) {
        const updatedMeta: Asset = {
          id: "meta_bulk_card_spends",
          name: "Meta Bulk Card Spends (Sync)",
          category: "meta",
          value: 0,
          currency: "VND",
          notes: localStr,
          excludeFromNetWorth: true
        };
        const filtered = assets.filter(a => a.id !== "meta_bulk_card_spends");
        setAssets([updatedMeta, ...filtered]);
      }
    } catch (e) {
      console.error(e);
    }
  }, [bulkCardSpends, setAssets, assets]);

  useEffect(() => {
    try {
      const localStr = JSON.stringify(bulkCurrentCash);
      localStorage.setItem("studyHub_bulkCurrentCash", localStr);

      const existing = assets.find(a => a.id === "meta_bulk_current_cash");
      if (!existing || existing.notes !== localStr) {
        const updatedMeta: Asset = {
          id: "meta_bulk_current_cash",
          name: "Meta Bulk Current Cash (Sync)",
          category: "meta",
          value: 0,
          currency: "VND",
          notes: localStr,
          excludeFromNetWorth: true
        };
        const filtered = assets.filter(a => a.id !== "meta_bulk_current_cash");
        setAssets([updatedMeta, ...filtered]);
      }
    } catch (e) {
      console.error(e);
    }
  }, [bulkCurrentCash, setAssets, assets]);

  // AUTOMATIC SYNC: Update bulk card spends credit card debt into the central assets state
  useEffect(() => {
    if (!setAssets || !assets) return;
    try {
      const validSpends = bulkCardSpends.filter(d => d.amount.trim() && !isNaN(parseFloat(d.amount.replace(/,/g, ''))));
      const totalSum = validSpends.reduce((sum, d) => sum + parseFloat(d.amount.replace(/,/g, '')), 0);
      const absTotalSum = Math.abs(totalSum);

      const existingDebtIdx = assets.findIndex(a => a.id === "card-debt-auto-sync");

      if (absTotalSum === 0) {
        if (existingDebtIdx !== -1) {
          setAssets(assets.filter(a => a.id !== "card-debt-auto-sync"));
        }
        return;
      }

      const catId = categories.find(c => 
        c.name.toLowerCase().includes("tín dụng") || 
        c.name.toLowerCase().includes("thẻ") || 
        c.name.toLowerCase().includes("credit") || 
        c.name.toLowerCase().includes("nợ")
      )?.id || defaultCatID;

      const formatDateHelper = (ymd: string) => {
        try {
          const parts = ymd.split("-");
          return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ymd;
        } catch {
          return ymd;
        }
      };

      const detailNotesList = validSpends.map(d => {
        const val = parseFloat(d.amount.replace(/,/g, ''));
        const dayNote = d.notes && d.notes.trim() ? ` - [Ghi chú: ${d.notes.trim()}]` : "";
        return `• ${formatDateHelper(d.name)}: ${val.toLocaleString('vi-VN')} đ${dayNote}`;
      }).join("\n");

      const activeDates = bulkCardSpends
        .map(d => d.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      
      let dateRangeText = "";
      if (activeDates.length > 0) {
        const formatDateStr = (ymd: string) => {
          const parts = ymd.split("-");
          return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ymd;
        };
        dateRangeText = ` (${formatDateStr(activeDates[0])} - ${formatDateStr(activeDates[activeDates.length - 1])})`;
      }

      const updatedDebtAsset: Asset = {
        id: "card-debt-auto-sync",
        name: `Nợ thẻ tín dụng${dateRangeText} (Tự động)`,
        category: catId,
        value: absTotalSum,
        currency: "VND",
        notes: `Dư nợ tín dụng tổng hợp tự động từ chi tiết bảng kê hàng ngày:\n${detailNotesList}`,
        acquiredAt: Date.now(),
        isDebt: true,
        isNewMoney: false,
        excludeFromNetWorth: false
      };

      if (existingDebtIdx === -1) {
        setAssets([updatedDebtAsset, ...assets]);
      } else {
        const existing = assets[existingDebtIdx];
        if (existing.value !== updatedDebtAsset.value || existing.notes !== updatedDebtAsset.notes || existing.name !== updatedDebtAsset.name) {
          const updatedList = [...assets];
          updatedList[existingDebtIdx] = {
            ...existing,
            name: updatedDebtAsset.name,
            value: updatedDebtAsset.value,
            notes: updatedDebtAsset.notes,
            category: updatedDebtAsset.category
          };
          setAssets(updatedList);
        }
      }
    } catch (err) {
      console.error("Lỗi tự động đồng bộ nợ thẻ tín dụng:", err);
    }
  }, [bulkCardSpends, categories, assets, setAssets, defaultCatID]);

  // AUTOMATIC SYNC: Update bulk current cash (Bảng kê tiền mặt đang có) into the central assets state
  useEffect(() => {
    if (!setAssets || !assets) return;
    try {
      const denominations = [500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000];
      const totalSum = denominations.reduce((sum, den) => {
        const val = bulkCurrentCash[den] || 0;
        return sum + (den * val);
      }, 0);

      const existingCashIdx = assets.findIndex(a => a.id === "current-cash-auto-sync");

      if (totalSum === 0) {
        if (existingCashIdx !== -1) {
          setAssets(assets.filter(a => a.id !== "current-cash-auto-sync"));
        }
        return;
      }

      const catId = categories.find(c => 
        c.name.toLowerCase().includes("tiền mặt") || 
        c.name.toLowerCase().includes("tiền") || 
        c.name.toLowerCase().includes("wallet")
      )?.id || "cat-money";

      const detailNotesList = denominations.map(den => {
        const qty = bulkCurrentCash[den] || 0;
        if (qty <= 0) return null;
        return `• ${den.toLocaleString('vi-VN')} đ: ${qty} tờ = ${(den * qty).toLocaleString('vi-VN')} đ`;
      }).filter(Boolean).join("\n");

      const updatedCashAsset: Asset = {
        id: "current-cash-auto-sync",
        name: `Tiền mặt đang có (Bảng kê tự động)`,
        category: catId,
        value: totalSum,
        currency: "VND",
        notes: `Tổng tiền mặt đang có từ bảng kê chi tiết:\n${detailNotesList}`,
        acquiredAt: Date.now(),
        isDebt: false,
        isNewMoney: false, // SHOW IN NORMAL ASSETS!
        excludeFromNetWorth: false
      };

      if (existingCashIdx === -1) {
        setAssets([updatedCashAsset, ...assets]);
      } else {
        const existing = assets[existingCashIdx];
        if (existing.value !== updatedCashAsset.value || existing.notes !== updatedCashAsset.notes || existing.name !== updatedCashAsset.name || existing.category !== updatedCashAsset.category) {
          const updatedList = [...assets];
          updatedList[existingCashIdx] = {
            ...existing,
            name: updatedCashAsset.name,
            value: updatedCashAsset.value,
            notes: updatedCashAsset.notes,
            category: updatedCashAsset.category
          };
          setAssets(updatedList);
        }
      }
    } catch (err) {
      console.error("Lỗi tự động đồng bộ tiền mặt đang có:", err);
    }
  }, [bulkCurrentCash, categories, assets, setAssets]);

  // --- HỆ THỐNG DỰ TÍNH TIỀN LƯƠNG & DỰ CHI ---
  const [salaryInput, setSalaryInput] = useState<string>(() => {
    return localStorage.getItem("studyHub_salaryInput") || "15,000,000";
  });

  const [plannedExpenses, setPlannedExpenses] = useState<{ id: string; name: string; amount: string; notes: string }[]>(() => {
    try {
      const saved = localStorage.getItem("studyHub_plannedExpenses");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: "pe-1", name: "Tiền thuê nhà / phòng", amount: "3,500,000", notes: "Thanh toán cố định đầu tháng" },
      { id: "pe-2", name: "Chi phí ăn uống sinh hoạt", amount: "3,000,000", notes: "Ngân sách ăn uống ước tính" },
      { id: "pe-3", name: "Cước phí dịch vụ (Điện, nước, net)", amount: "800,000", notes: "Thanh toán hóa đơn hàng tháng" },
      { id: "pe-4", name: "Học tập & Sách vở", amount: "1,200,000", notes: "Luyện tiếng Anh và phát triển cá nhân" },
      { id: "pe-5", name: "Tích lũy tài sản / Tiết kiệm", amount: "3,000,000", notes: "Khoản để riêng đầu tư" }
    ];
  });

  const [newExpName, setNewExpName] = useState("");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [newExpNotes, setNewExpNotes] = useState("");

  useEffect(() => {
    localStorage.setItem("studyHub_salaryInput", salaryInput);
  }, [salaryInput]);

  useEffect(() => {
    localStorage.setItem("studyHub_plannedExpenses", JSON.stringify(plannedExpenses));
  }, [plannedExpenses]);

  const handleResetSalaryPlanner = () => {
    setSalaryInput("15,000,000");
    setPlannedExpenses([
      { id: "pe-1", name: "Tiền thuê nhà / phòng", amount: "3,500,000", notes: "Thanh toán cố định đầu tháng" },
      { id: "pe-2", name: "Chi phí ăn uống sinh hoạt", amount: "3,000,000", notes: "Ngân sách ăn uống ước tính" },
      { id: "pe-3", name: "Cước phí dịch vụ (Điện, nước, net)", amount: "800,000", notes: "Thanh toán hóa đơn hàng tháng" },
      { id: "pe-4", name: "Học tập & Sách vở", amount: "1,200,000", notes: "Luyện tiếng Anh và phát triển cá nhân" },
      { id: "pe-5", name: "Tích lũy tài sản / Tiết kiệm", amount: "3,000,000", notes: "Khoản để riêng đầu tư" }
    ]);
    setNewExpName("");
    setNewExpAmount("");
    setNewExpNotes("");
  };

  const handleAddPlannedExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpName.trim()) return;
    const newExpense = {
      id: `pe-${Date.now()}-${Math.random()}`,
      name: newExpName.trim(),
      amount: newExpAmount || "0",
      notes: newExpNotes.trim()
    };
    setPlannedExpenses([...plannedExpenses, newExpense]);
    setNewExpName("");
    setNewExpAmount("");
    setNewExpNotes("");
  };

  const handleRemovePlannedExpense = (id: string) => {
    setPlannedExpenses(plannedExpenses.filter(pe => pe.id !== id));
  };

  const justCardRangeText = useMemo(() => {
    const activeDates = bulkCardSpends
      .map(d => d.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    if (activeDates.length === 0) {
      return "(Từ ngày … đến ngày …)";
    }
    const formatDateStr = (ymd: string) => {
      try {
        const portions = ymd.split("-");
        if (portions.length === 3) {
          return `${portions[2]}/${portions[1]}/${portions[0]}`; // DD/MM/YYYY
        }
        return ymd;
      } catch {
        return ymd;
      }
    };
    const minDate = formatDateStr(activeDates[0]);
    const maxDate = formatDateStr(activeDates[activeDates.length - 1]);
    return `(Từ ngày ${minDate} đến ngày ${maxDate})`;
  }, [bulkCardSpends]);

  const handleResetBulkCardSpends = () => {
    setBulkCardSpends(DEFAULT_WEEK_DEBTS.map(item => ({ ...item, amount: "", notes: "" })));
  };

  const handleSaveBulkCardSpends = () => {
     const now = Date.now();
     const validSpends = bulkCardSpends.filter(d => d.amount.trim() && !isNaN(parseFloat(d.amount.replace(/,/g, ''))));
     if (validSpends.length === 0) {
       alert("Hãy nhập số tiền sử dụng thẻ cho ít nhất một ngày!");
       return;
     }

     const formattedDateRange = justCardRangeText;
     const calculatedSum = validSpends.reduce((sum, d) => sum + parseFloat(d.amount.replace(/,/g, '')), 0);
     const totalSum = Math.abs(calculatedSum);
     const catId = categories.find(c => 
       c.name.toLowerCase().includes("tín dụng") || 
       c.name.toLowerCase().includes("thẻ") || 
       c.name.toLowerCase().includes("credit") || 
       c.name.toLowerCase().includes("nợ")
     )?.id || defaultCatID;

     const formatDateHelper = (ymd: string) => {
       try {
         const parts = ymd.split("-");
         return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ymd;
       } catch {
         return ymd;
       }
     };

     const detailNotesList = validSpends.map(d => {
       const val = parseFloat(d.amount.replace(/,/g, ''));
       const dayNote = d.notes && d.notes.trim() ? ` - [Ghi chú: ${d.notes.trim()}]` : "";
       return `• ${formatDateHelper(d.name)}: ${val.toLocaleString('vi-VN')} đ${dayNote}`;
     }).join("\n");

     const aggregatedCardDebt: Asset = {
        id: `card-held-${now}`,
        name: `Nợ thẻ tín dụng ${formattedDateRange}`,
        category: catId,
        value: totalSum,
        currency: "VND",
        notes: `Bảng kê chi tiết nợ tiêu dùng thẻ tín dụng:\n${detailNotesList}`,
        acquiredAt: now,
        isDebt: true,
        isNewMoney: false,
        excludeFromNetWorth: false
     };

     setAssets([aggregatedCardDebt, ...assets]);
     alert(`Đã lưu tổng nợ thẻ tín dụng tuần trị giá +${totalSum.toLocaleString('vi-VN')}đ vào Sổ Tài Sản (Mục Nợ) thành công!`);
     handleResetBulkCardSpends();
  };

  const justDateRangeText = useMemo(() => {
    const activeDates = bulkDebts
      .map(d => d.name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    if (activeDates.length === 0) {
      return "(Từ ngày … đến ngày …)";
    }
    const formatDateStr = (ymd: string) => {
      try {
        const portions = ymd.split("-");
        if (portions.length === 3) {
          return `${portions[2]}/${portions[1]}/${portions[0]}`; // DD/MM/YYYY
        }
        return ymd;
      } catch {
        return ymd;
      }
    };
    const minDate = formatDateStr(activeDates[0]);
    const maxDate = formatDateStr(activeDates[activeDates.length - 1]);
    return `(Từ ngày ${minDate} đến ngày ${maxDate})`;
  }, [bulkDebts]);

  const handleResetBulkDebts = () => {
    setBulkDebts(DEFAULT_WEEK_DEBTS.map(item => ({ ...item, amount: "", notes: "" })));
  };

  const handleSaveBulkDebts = () => {
     const now = Date.now();
     const validDebts = bulkDebts.filter(d => d.amount.trim() && !isNaN(parseFloat(d.amount.replace(/,/g, ''))));
     if (validDebts.length === 0) {
       alert("Hãy nhập số tiền doanh thu cho ít nhất một ngày!");
       return;
     }

     const formattedDateRange = justDateRangeText;
     const calculatedSum = validDebts.reduce((sum, d) => sum + parseFloat(d.amount.replace(/,/g, '')), 0);
     const totalSum = Math.abs(calculatedSum);
     const catId = categories.find(c => c.name.toLowerCase().includes("doanh thu") || c.name.toLowerCase().includes("thu") || c.name.toLowerCase().includes("tiền mặt"))?.id || defaultCatID;

     const formatDateHelper = (ymd: string) => {
       try {
         const parts = ymd.split("-");
         return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ymd;
       } catch {
         return ymd;
       }
     };

     const detailNotesList = validDebts.map(d => {
       const val = parseFloat(d.amount.replace(/,/g, ''));
       const dayNote = d.notes && d.notes.trim() ? ` - [Ghi chú: ${d.notes.trim()}]` : "";
       return `• ${formatDateHelper(d.name)}: +${val.toLocaleString('vi-VN')} đ${dayNote}`;
     }).join("\n");

     const aggregatedRevenue: Asset = {
        id: `rev-held-${now}`,
        name: `Nợ tích lũy doanh thu ${formattedDateRange}`,
        category: catId,
        value: totalSum,
        currency: "VND",
        notes: `Bảng kê chi tiết nợ doanh thu tuần:\n${detailNotesList}`,
        acquiredAt: now,
        isDebt: true,
        isNewMoney: false,
        excludeFromNetWorth: false
     };

     setAssets([aggregatedRevenue, ...assets]);
     alert(`Đã lưu tổng nợ doanh thu tuần trị giá +${totalSum.toLocaleString('vi-VN')}đ vào Sổ Tài Sản (Mục Nợ) thành công!`);
     handleResetBulkDebts();
  };

  const [bulkCash, setBulkCash] = useState<Record<number, number>>({});
  const VND_DENOMINATIONS = [500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000];

  const [isManagingCats, setIsManagingCats] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("Wallet");

  const startEdit = (asset: Asset) => {
    setEditingId(asset.id);
    setNewName(asset.name);
    setNewCategory(asset.category);
    setNewCurrency(asset.currency);
    setNewNotes(asset.notes || "");
    setIsDebt(!!asset.isDebt);
    setIsLoan(!!asset.isLoan);
    setIsNewMoney(!!asset.isNewMoney);
    setExcludeFromNetWorth(!!asset.excludeFromNetWorth);

    if (asset.currency === "GOLD" || asset.currency === "USD") {
      setNewQuantity(asset.quantity?.toString() || asset.value.toString());
      setNewExchangeRate(asset.exchangeRate?.toString() || "");
      setNewValue("");
      setNewDenomination("");
    } else {
      setNewValue(asset.value.toString());
      setNewQuantity(asset.quantity?.toString() || "");
      setNewExchangeRate("");
      setNewDenomination(asset.denomination?.toString() || "");
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewName("");
    setNewCategory(defaultCatID);
    setNewValue("");
    setNewCurrency("VND");
    setNewNotes("");
    setNewQuantity("");
    setNewExchangeRate("");
    setNewDenomination("");
    setIsDebt(false);
    setIsLoan(false);
    setIsNewMoney(false);
    setExcludeFromNetWorth(false);
    setAiSuggestion(null);
    setIsCategorizing(false);
  };

  const formatCurrency = (val: number, cur: string) => {
    if (cur === 'GOLD') {
      return `${new Intl.NumberFormat('vi-VN').format(val)} chỉ vàng`;
    }
    try {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: cur }).format(val);
    } catch (e) {
      return `${new Intl.NumberFormat('vi-VN').format(val)} ${cur}`;
    }
  };

  const addAsset = (e: FormEvent) => {
    e.preventDefault();
    // Use the explicitly selected category, or defaultCatID if none selected
    const catToUse = newCategory || defaultCatID;
    if (!newName.trim() || !catToUse) return;

    let val = parseFloat(newValue.replace(/,/g, ''));
    const qty = parseFloat(newQuantity.replace(/,/g, ''));
    const rate = parseFloat(newExchangeRate.replace(/,/g, ''));
    const den = parseFloat(newDenomination.replace(/,/g, ''));

    if (isNewMoney && !isNaN(qty) && !isNaN(den)) {
      val = qty * den;
    }

    const isGoldOrUsd = !isNewMoney && (newCurrency === "GOLD" || newCurrency === "USD");

    if (isGoldOrUsd) {
      if (isNaN(qty) || isNaN(rate) || !newName.trim()) return;
    } else if (!isNewMoney) {
      if (isNaN(val) || !newName.trim()) return;
    } else {
      if (isNaN(qty) || isNaN(den) || !newName.trim()) return;
    }

    const finalValue = isGoldOrUsd ? qty : val;
    const finalQty = isGoldOrUsd ? qty : (isNewMoney ? qty : undefined);
    const finalRate = isGoldOrUsd ? rate : undefined;

    if (editingId) {
      setAssets(assets.map(a => a.id === editingId ? {
        ...a,
        name: newName,
        category: catToUse,
        value: finalValue,
        currency: newCurrency,
        notes: newNotes || undefined,
        isDebt: isDebt,
        isLoan: isLoan,
        isNewMoney: isNewMoney,
        excludeFromNetWorth: excludeFromNetWorth,
        quantity: finalQty,
        denomination: isNewMoney ? den : undefined,
        exchangeRate: finalRate
      } : a));
      setEditingId(null);
    } else {
      setAssets([{
        id: Date.now().toString(),
        name: newName,
        category: catToUse,
        value: finalValue,
        currency: newCurrency,
        notes: newNotes || undefined,
        acquiredAt: Date.now(),
        isDebt: isDebt,
        isLoan: isLoan,
        isNewMoney: isNewMoney,
        excludeFromNetWorth: excludeFromNetWorth,
        quantity: finalQty,
        denomination: isNewMoney ? den : undefined,
        exchangeRate: finalRate
      }, ...assets]);
    }

    setNewName("");
    setNewValue("");
    setNewNotes("");
    setNewQuantity("");
    setNewExchangeRate("");
    setNewDenomination("");
    setIsDebt(false);
    setIsLoan(false);
    setIsNewMoney(false);
    setExcludeFromNetWorth(false);
    setNewCategory(catToUse);
    setAiSuggestion(null);
    setIsCategorizing(false);
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

  const getValueInVND = (value: number, currency: string, exchangeRate?: number) => {
    if (currency === 'VND') return value;
    if (exchangeRate && exchangeRate > 0) {
      return value * exchangeRate;
    }
    if (currency === 'USD') return value * 25400;
    if (currency === 'EUR') return value * 27000;
    if (currency === 'GOLD') return value * 8000000; // estimation
    return value;
  };

  const sanitizedAssets = useMemo(() => {
    return assets.filter(a => !a.id.startsWith("meta_"));
  }, [assets]);

  const totalVND = useMemo(() => {
    return sanitizedAssets.reduce((acc, curr) => {
      if (curr.excludeFromNetWorth) return acc;
      const val = getValueInVND(curr.value, curr.currency, curr.exchangeRate);
      return curr.isDebt ? acc - val : acc + val;
    }, 0);
  }, [sanitizedAssets]);

  const totalAssetsVND = useMemo(() => {
    // Assets that are not debt, not loan, NOT new money, and NOT excluded from report
    return sanitizedAssets.filter(a => !a.isDebt && !a.isLoan && !a.isNewMoney && !a.excludeFromNetWorth).reduce((acc, curr) => acc + getValueInVND(curr.value, curr.currency, curr.exchangeRate), 0);
  }, [sanitizedAssets]);

  const totalLoansVND = useMemo(() => {
    return sanitizedAssets.filter(a => a.isLoan && !a.excludeFromNetWorth).reduce((acc, curr) => acc + getValueInVND(curr.value, curr.currency, curr.exchangeRate), 0);
  }, [sanitizedAssets]);

  const totalNewMoneyVND = useMemo(() => {
    return sanitizedAssets.filter(a => a.isNewMoney).reduce((acc, curr) => acc + getValueInVND(curr.value, curr.currency, curr.exchangeRate), 0);
  }, [sanitizedAssets]);

  const liveNewMoneyVND = useMemo(() => {
    return VND_DENOMINATIONS.reduce((sum, den) => {
      const currentAsset = sanitizedAssets.find(a => a.isNewMoney && a.denomination === den);
      const val = bulkCash[den] !== undefined ? bulkCash[den] : (currentAsset?.quantity || 0);
      return sum + (den * val);
    }, 0);
  }, [sanitizedAssets, bulkCash]);

  const hasUnsavedNewMoneyChanges = useMemo(() => {
    return Object.keys(bulkCash).length > 0;
  }, [bulkCash]);

  const totalDebtsVND = useMemo(() => {
    return sanitizedAssets.filter(a => a.isDebt && !a.excludeFromNetWorth).reduce((acc, curr) => acc + getValueInVND(curr.value, curr.currency, curr.exchangeRate), 0);
  }, [sanitizedAssets]);

  const saveBulkCash = () => {
    const newAssets = assets.filter(a => !a.isNewMoney);
    const now = Date.now();
    const bulkCategories = categories.find(c => c.name.toLowerCase().includes("tiền")) || categories[0];
    
    // We update denominations using values from bulkCash if they were changed
    // Otherwise we keep existing denominations if they weren't in bulkCash yet
    const entries = VND_DENOMINATIONS.map(den => {
      const qty = bulkCash[den] !== undefined ? bulkCash[den] : (assets.find(a => a.isNewMoney && a.denomination === den)?.quantity || 0);
      if (qty <= 0) return null;
      
      return {
        id: `new-money-${den}-${now}`,
        name: `Tiền mặt ${formatCurrency(den, "VND")}`,
        category: bulkCategories.id,
        value: den * qty,
        currency: "VND",
        quantity: qty,
        denomination: den,
        acquiredAt: now,
        isNewMoney: true,
        excludeFromNetWorth: true
      } as Asset;
    }).filter(Boolean) as Asset[];
      
    setAssets([...newAssets, ...entries]);
    setBulkCash({});
  };

  const updateBulkQty = (den: number, qtyStr: string) => {
    const qty = parseInt(qtyStr) || 0;
    setBulkCash(prev => ({ ...prev, [den]: qty }));
  };

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
    return sanitizedAssets
      .filter(a => !a.isDebt && !a.isNewMoney && !a.excludeFromNetWorth)
      .map(a => ({
        id: a.id,
        name: a.name,
        value: getValueInVND(a.value, a.currency, a.exchangeRate),
        fill: getCategoryColor(a.category)
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [sanitizedAssets, getCategoryColor, getValueInVND]);

  const filteredAssets = useMemo(() => {
    let result = [...sanitizedAssets];

    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "value") {
      result.sort((a, b) => getValueInVND(b.value, b.currency, b.exchangeRate) - getValueInVND(a.value, a.currency, a.exchangeRate));
    } else {
      result.sort((a, b) => (b.acquiredAt || 0) - (a.acquiredAt || 0));
    }

    return result;
  }, [sanitizedAssets, sortBy, getValueInVND]);

  const regularAssetsByCategory = useMemo(() => {
    const groups: Record<string, Asset[]> = {};
    filteredAssets.filter(a => !a.isNewMoney).forEach(a => {
      if (!groups[a.category]) groups[a.category] = [];
      groups[a.category].push(a);
    });
    return groups;
  }, [filteredAssets]);

  const newMoneyAssets = useMemo(() => {
    return sanitizedAssets.filter(a => a.isNewMoney).sort((a, b) => (b.acquiredAt || 0) - (a.acquiredAt || 0));
  }, [sanitizedAssets]);

  const totalSalIncome = useMemo(() => {
    const parsed = parseFloat(salaryInput.replace(/,/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }, [salaryInput]);

  const totalPlannedOutflows = useMemo(() => {
    return plannedExpenses.reduce((sum, item) => {
      const parsed = parseFloat(item.amount.replace(/,/g, ''));
      return sum + (isNaN(parsed) ? 0 : parsed);
    }, 0);
  }, [plannedExpenses]);

  const remainingBalance = totalSalIncome - totalPlannedOutflows;

  const percentageSpent = totalSalIncome > 0 ? (totalPlannedOutflows / totalSalIncome) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 font-sans pb-10">
      <div className="mb-8 text-center flex flex-col items-center">
         <h1 className="text-4xl font-black font-logo tracking-wide mb-2 uppercase">My Assets</h1>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Tài sản hiện có</span>
              <span className="text-lg font-bold text-emerald-600">{formatCurrency(totalAssetsVND, 'VND')}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Tiền mới</span>
              <span className="text-lg font-bold text-amber-500">{formatCurrency(totalNewMoneyVND, 'VND')}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Khoản cho vay</span>
              <span className="text-lg font-bold text-blue-600">{formatCurrency(totalLoansVND, 'VND')}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Tổng Nợ</span>
              <span className="text-lg font-bold text-crimson">{formatCurrency(totalDebtsVND, 'VND')}</span>
            </div>
            <div className="flex flex-col border-t md:border-t-0 md:border-l border-ink/10 pt-2 md:pt-0 md:pl-8">
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Vốn chủ sở hữu</span>
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
            
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">
                Chọn Biểu Tượng Danh Mục (Select Category Icon)
              </span>
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-2 bg-white/70 p-3.5 rounded-xl border border-dashed border-ink/20 max-h-[200px] overflow-y-auto">
                {CATEGORY_ICON_DEFINITIONS.map(({ key, label }) => {
                  const isSelected = newCatIcon === key;
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setNewCatIcon(key)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-left border transition-all duration-200 cursor-pointer shadow-xs",
                        isSelected
                          ? "bg-ink text-[#fcfbf9] border-ink font-bold scale-[1.03]"
                          : "bg-white/90 text-ink/80 border-ink/10 hover:bg-ink/5 hover:border-ink/30"
                      )}
                      id={`icon-select-${key}`}
                    >
                      <span className={cn(
                        "p-1.5 rounded flex items-center justify-center shrink-0",
                        isSelected ? "bg-[#fcfbf9]/20 text-[#fcfbf9]" : "bg-ink/5 text-ink"
                      )}>
                        {renderIcon(key, 15)}
                      </span>
                      <span className="truncate text-[11px] leading-tight flex-1">{label}</span>
                    </button>
                  );
                })}
              </div>
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
        <div className="flex flex-col md:flex-row items-center gap-6 mb-10 bg-white/40 p-6 sketch-border">
          <div className="h-48 w-48 shrink-0">
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
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2">
             {pieData.map(d => (
               <div key={d.id} className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                    <span className="text-[10px] font-bold uppercase tracking-tight text-ink/70 truncate">{d.name}</span>
                  </div>
                  <span className="text-xs font-bold pl-4 text-ink flex flex-col sm:flex-row sm:items-center gap-1">
                    <span>{totalAssetsVND > 0 ? Math.round((d.value / totalAssetsVND) * 100) : 0}%</span>
                    <span className="text-[10px] font-semibold text-ink/65">({formatCurrency(d.value, 'VND')})</span>
                  </span>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex justify-end mb-6">
        <div className="flex gap-2">
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="sketch-input text-xs bg-white/50 px-4 py-2">
            <option value="date">Mới nhất</option>
            <option value="value">Giá trị giảm dần</option>
            <option value="name">Tên A-Z</option>
          </select>
        </div>
      </div>

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
              
              {/* AI Auto-Categorization Suggestion Box */}
              {newName.trim() && !isNewMoney && (
                <div className="mt-1 flex flex-col gap-1 text-[11px] transition-all duration-300">
                  {isCategorizing ? (
                    <span className="text-crimson/80 flex items-center gap-1.5 animate-pulse font-sans ml-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-crimson border border-ink/20 animate-bounce"></span>
                      ✨ Trí tuệ nhân tạo (AI) đang phân tích gợi ý danh mục...
                    </span>
                  ) : aiSuggestion ? (
                    <div className="bg-[#fff9f9] border border-dashed border-crimson/40 p-3 rounded-lg flex flex-col gap-1.5 shadow-2xs transition-all">
                      <div className="flex items-center justify-between font-sans">
                        <span className="flex items-center gap-1.5 text-ink">
                          <span className="text-sm">💡</span> Gợi ý danh mục phù hợp: <strong className="text-crimson font-extrabold uppercase tracking-wide">{aiSuggestion.name}</strong>
                        </span>
                        {newCategory === aiSuggestion.id ? (
                          <span className="py-0.5 px-2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-full border border-emerald-200 uppercase tracking-wider shrink-0">
                            Đã Đống Nhất ✓
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setNewCategory(aiSuggestion.id)}
                            className="py-1 px-3 bg-crimson hover:bg-crimson/95 active:scale-95 text-white text-[9px] uppercase font-bold rounded-lg cursor-pointer transition-all shadow-2xs shrink-0"
                          >
                            Áp dụng ngay
                          </button>
                        )}
                      </div>
                      {aiSuggestion.reasoning && (
                        <p className="text-ink/65 italic font-sans leading-relaxed text-[10px] pl-5 border-l-2 border-crimson/20">
                          {aiSuggestion.reasoning}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
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
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">
                  {isNewMoney 
                    ? "Tên (Ví dụ: Tiền VNĐ)" 
                    : (newCurrency === "GOLD" || newCurrency === "USD")
                      ? "Số lượng & Tỷ giá / Đơn giá"
                      : "Giá Trị"}
                </label>
                <div className="flex gap-2">
                  {!isNewMoney ? (
                    (newCurrency === "GOLD" || newCurrency === "USD") ? (
                      <div className="flex gap-2 flex-1">
                        <input
                          value={newQuantity}
                          onChange={(e) => setNewQuantity(e.target.value)}
                          placeholder={newCurrency === "GOLD" ? "Số chỉ (vd: 5)" : "Số lượng (vd: 100)"}
                          type="number"
                          step="any"
                          className="sketch-input bg-white/50 py-2 min-w-0 w-1/2 px-2"
                          required
                        />
                        <input
                          value={newExchangeRate}
                          onChange={(e) => setNewExchangeRate(e.target.value)}
                          placeholder={newCurrency === "GOLD" ? "Giá 1 chỉ (VND)" : "Tỷ giá (VND/USD)"}
                          type="number"
                          step="any"
                          className="sketch-input bg-white/50 py-2 min-w-0 w-1/2 px-2"
                          required
                        />
                      </div>
                    ) : (
                      <input
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder="0"
                        type="number"
                        className="sketch-input bg-white/50 py-2 min-w-0 flex-1 px-2"
                        required
                      />
                    )
                  ) : (
                    <div className="flex gap-2 flex-1">
                       <input
                        value={newDenomination}
                        onChange={(e) => setNewDenomination(e.target.value)}
                        placeholder="Mệnh giá"
                        type="number"
                        className="sketch-input bg-white/50 py-2 min-w-0 w-1/2 px-2"
                        required
                      />
                      <input
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        placeholder="Số lượng"
                        type="number"
                        className="sketch-input bg-white/50 py-2 min-w-0 w-1/2 px-2"
                        required
                      />
                    </div>
                  )}
                  <select value={newCurrency} onChange={(e) => setNewCurrency(e.target.value)} className="sketch-input bg-[#efefef] font-bold py-2 w-[82px] shrink-0 px-1 text-center">
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
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="isDebt" 
                  checked={isDebt} 
                  onChange={e => {
                    setIsDebt(e.target.checked);
                    if (e.target.checked) {
                      setIsLoan(false);
                      setIsNewMoney(false);
                    }
                  }}
                  className="w-5 h-5 accent-crimson"
                />
                <label htmlFor="isDebt" className="text-xs font-bold uppercase tracking-widest text-crimson flex items-center gap-2 cursor-pointer">
                  Đây là một khoản nợ (Debt)
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="isLoan" 
                  checked={isLoan} 
                  onChange={e => {
                    setIsLoan(e.target.checked);
                    if (e.target.checked) {
                      setIsDebt(false);
                      setIsNewMoney(false);
                    }
                  }}
                  className="w-5 h-5 accent-blue-600"
                />
                <label htmlFor="isLoan" className="text-xs font-bold uppercase tracking-widest text-blue-600 flex items-center gap-2 cursor-pointer">
                   Khoản cho vay (Loan Given)
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="isNewMoney" 
                  checked={isNewMoney} 
                  onChange={e => {
                    setIsNewMoney(e.target.checked);
                    if (e.target.checked) {
                      setIsDebt(false);
                      setIsLoan(false);
                      setExcludeFromNetWorth(true); // Default to exclude
                      setNewName("Tiền mới");
                    }
                  }}
                  className="w-5 h-5 accent-amber-500"
                />
                <label htmlFor="isNewMoney" className="text-xs font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2 cursor-pointer">
                   Tiền mới (Sẽ hiện trong bảng kê riêng)
                </label>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-ink/5">
                <input 
                  type="checkbox" 
                  id="exclude" 
                  checked={excludeFromNetWorth} 
                  onChange={e => setExcludeFromNetWorth(e.target.checked)}
                  className="w-5 h-5 accent-ink"
                />
                <label htmlFor="exclude" className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-2 cursor-pointer">
                   Loại bỏ khỏi Vốn chủ sở hữu
                </label>
              </div>
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

      <div className="space-y-12 mb-12">
        {(Object.entries(regularAssetsByCategory) as [string, Asset[]][]).map(([catId, items]) => {
          const cat = getCategory(catId);
          const catTotal = items.reduce((acc, curr) => {
            const val = getValueInVND(curr.value, curr.currency, curr.exchangeRate);
            return curr.isDebt ? acc - val : acc + val;
          }, 0);
          
          return (
            <div key={catId} className="animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-end justify-between mb-4 border-b-2 border-ink pb-2">
                <div className="flex items-center gap-3">
                  <span className="p-2 text-white rounded-xl" style={{ backgroundColor: getCategoryColor(catId) }}>
                    {renderIcon(cat.icon, 20)}
                  </span>
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-tight">{cat.name}</h2>
                    <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">{items.length} tài sản</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Số dư</p>
                  <p className={cn("text-lg font-bold", catTotal < 0 ? "text-crimson" : "text-ink")}>
                    {catTotal < 0 ? "-" : ""}{formatCurrency(Math.abs(catTotal), 'VND')}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2.5">
                {items.map(asset => (
                  <div key={asset.id} className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-2 bg-white/70 hover:bg-white rounded-xl border border-ink/10 text-xs transition-all relative group shadow-sm shrink-0",
                    asset.isDebt ? "bg-red-50/55 hover:bg-red-50 border-red-200" : ""
                  )}>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-ink">{asset.name}</span>
                      <span className={cn(
                        "font-mono font-bold px-2 py-0.5 rounded-lg text-[10px]",
                        asset.isDebt ? "text-crimson bg-crimson/5" : asset.isLoan ? "text-blue-600 bg-blue-50" : asset.isNewMoney ? "text-amber-500 bg-amber-50" : "text-[#0369a1] bg-[#e0f2fe]"
                      )}>
                        {asset.isDebt ? "-" : ""}{formatCurrency(asset.value, asset.currency)}
                      </span>
                    </div>
                    
                    {/* Compact actions showing on hover */}
                    <div className="flex items-center gap-1.5 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-all ml-1.5 pl-2 border-l border-ink/10">
                      <button 
                        onClick={() => startEdit(asset)}
                        className="p-1 text-ink/70 hover:text-blue-600 transition-colors"
                        title="Sửa"
                      >
                        <Edit2 size={10} />
                      </button>
                      <button 
                        onClick={() => removeAsset(asset.id)}
                        className="p-1 text-ink/70 hover:text-crimson transition-all"
                        title="Xóa"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>

                    {asset.notes && (
                      <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-ink text-paper text-[10px] px-2 py-1 rounded shadow-lg z-30 pointer-events-none whitespace-pre max-w-[200px] truncate leading-tight italic">
                        {asset.notes}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bảng Kê Tiền Mới - Specialized Section */}
      <div className="mt-16 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 border-b-4 border-amber-500 pb-2 gap-4">
           <div className="flex items-center gap-3">
              <button className="p-2 bg-amber-500 text-white rounded-xl shadow-lg">
                <Coins size={24} />
              </button>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-amber-600">Bảng Kê Tiền Mới</h2>
                <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Danh sách mệnh giá từ cao đến thấp</p>
              </div>
           </div>
           
           <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2 bg-amber-50 p-2 px-3 rounded-xl sketch-border border-amber-200">
                <div className="text-right">
                  <p className="text-[8px] font-bold text-amber-600 uppercase tracking-widest">Đã lưu</p>
                  <p className="text-sm font-black text-amber-700">{formatCurrency(totalNewMoneyVND, 'VND')}</p>
                </div>
              </div>

              {hasUnsavedNewMoneyChanges && (
                <div className="flex items-center gap-2 bg-rose-50 p-2 px-3 rounded-xl sketch-border border-rose-200 animate-pulse">
                  <div className="text-right">
                    <p className="text-[8px] font-bold text-rose-600 uppercase tracking-widest">Chưa lưu mới</p>
                    <p className="text-sm font-black text-rose-700">{formatCurrency(liveNewMoneyVND, 'VND')}</p>
                  </div>
                </div>
              )}
           </div>
        </div>

        <div className="bg-white/50 sketch-border p-4 rounded-xl overflow-hidden mb-6">
          <div className="overflow-x-auto max-w-full">
            <table className="min-w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-amber-500/10 text-[9px] font-black uppercase tracking-widest text-amber-600 border-b-2 border-amber-500">
                  <th className="px-4 py-3 font-black">Mệnh giá VND</th>
                  <th className="px-4 py-3 text-center font-black w-44">Số lượng</th>
                  <th className="px-4 py-3 text-right font-black">Thành tiền</th>
                  <th className="px-4 py-3 text-center font-black w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="font-sans divide-y divide-amber-500/10">
                {VND_DENOMINATIONS.map(den => {
                  const currentAsset = assets.find(a => a.isNewMoney && a.denomination === den);
                  const isModifiedLocally = bulkCash[den] !== undefined;
                  const val = isModifiedLocally ? bulkCash[den] : (currentAsset?.quantity || 0);

                  return (
                    <tr 
                      key={den} 
                      className={cn(
                        "transition-colors hover:bg-amber-50/45", 
                        val > 0 ? "bg-amber-50/15 font-bold" : "opacity-60"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-ink text-sm">
                            {formatCurrency(den, "VND")}
                          </span>
                          {isModifiedLocally && (
                            <span className="text-[8px] font-black uppercase text-rose-600 bg-rose-50 px-1 rounded border border-rose-200">
                              Chưa lưu
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const newQty = Math.max(0, val - 1);
                              updateBulkQty(den, newQty.toString());
                            }}
                            className="w-7 h-7 rounded-lg border border-ink/15 hover:bg-ink/5 flex items-center justify-center text-xs font-black select-none cursor-pointer"
                          >
                            −
                          </button>
                          <input 
                            type="number"
                            min="0"
                            value={val || ""}
                            onChange={(e) => updateBulkQty(den, e.target.value)}
                            placeholder="0"
                            className="w-16 text-center font-bold text-amber-600 bg-white border border-ink/15 rounded-lg py-1 outline-none focus:border-amber-500 text-xs shadow-inner"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newQty = val + 1;
                              updateBulkQty(den, newQty.toString());
                            }}
                            className="w-7 h-7 rounded-lg border border-ink/15 hover:bg-ink/5 flex items-center justify-center text-xs font-black select-none cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-amber-600 text-sm whitespace-nowrap">
                        {formatCurrency(den * val, 'VND')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          type="button"
                          onClick={() => {
                            updateBulkQty(den, "0");
                          }}
                          disabled={val === 0}
                          className={cn(
                            "text-[10px] font-bold px-2 py-1 rounded transition-all",
                            val === 0 
                              ? "text-ink/20 cursor-not-allowed" 
                              : "text-crimson hover:bg-crimson/5 hover:text-red-700 cursor-pointer"
                          )}
                          title="Đặt lại về 0"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-amber-50/50 sketch-border border-dashed border-amber-200 rounded-xl mb-10">
          <div className="text-center sm:text-left">
            <p className="text-xs text-ink/70 leading-relaxed">
              💡 Bạn có thể nhập số lượng hoặc bấm các nút <span className="font-bold">− / +</span> để căn chỉnh mệnh giá. 
              {hasUnsavedNewMoneyChanges && (
                <span className="text-rose-600 font-bold block sm:inline sm:ml-1">
                  Có thay đổi chưa lưu! Vui lòng ấn Lưu để đồng bộ vào hệ thống.
                </span>
              )}
            </p>
          </div>
          
          <div className="flex gap-2 shrink-0">
             <button 
               type="button"
               onClick={() => setBulkCash({})}
               disabled={!hasUnsavedNewMoneyChanges}
               className={cn(
                 "sketch-button text-xs py-2 px-4 font-bold uppercase tracking-widest transition-all",
                 !hasUnsavedNewMoneyChanges 
                   ? "text-ink/20 cursor-not-allowed border-ink/5" 
                   : "text-ink hover:bg-white cursor-pointer"
               )}
             >
               Hủy thay đổi
             </button>
             <button 
               type="button"
               onClick={saveBulkCash}
               disabled={!hasUnsavedNewMoneyChanges}
               className={cn(
                 "sketch-button sketch-button-primary py-2 px-6 flex items-center gap-2 text-xs transition-all",
                 !hasUnsavedNewMoneyChanges 
                   ? "bg-amber-600/30 text-white/50 cursor-not-allowed border-none shadow-none" 
                   : "bg-amber-600 text-white hover:bg-amber-700 hover:shadow-lg active:scale-95 cursor-pointer"
               )}
             >
               <PiggyBank size={14} /> Lưu Bảng Kê
             </button>
          </div>
        </div>
      </div>

      {/* Bảng Kê Tiền Mặt Đang Có - Specialized Section */}
      <div className="mt-16 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 border-b-4 border-emerald-500 pb-2 gap-4">
           <div className="flex items-center gap-3">
              <button className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg font-sans">
                <Coins size={24} />
              </button>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-emerald-600 font-sans">Tiền Mặt Đang Có</h2>
                <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest font-sans">Tự động cộng dồn và cập nhật vào Sổ Tài Sản mục Tiền mặt</p>
              </div>
           </div>
           
           <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2 bg-emerald-50 p-2 px-3 rounded-xl sketch-border border-emerald-200">
                <div className="text-right">
                  <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest font-sans">Tổng tiền mặt đang có</p>
                  <p className="text-sm font-black text-emerald-700">
                    {formatCurrency(
                      VND_DENOMINATIONS.reduce((sum, den) => sum + den * (bulkCurrentCash[den] || 0), 0), 
                      'VND'
                    )}
                  </p>
                </div>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 border border-emerald-200 p-1.5 px-2.5 rounded-lg animate-pulse whitespace-nowrap font-sans">
                ● Tự động đồng bộ
              </span>
           </div>
        </div>

        <div className="bg-white/50 sketch-border p-4 rounded-xl overflow-hidden mb-6">
          <div className="overflow-x-auto max-w-full">
            <table className="min-w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-500/10 text-[9px] font-black uppercase tracking-widest text-emerald-600 border-b-2 border-emerald-500">
                  <th className="px-4 py-3 font-black">Mệnh giá VND</th>
                  <th className="px-4 py-3 text-center font-black w-44">Số lượng tờ</th>
                  <th className="px-4 py-3 text-right font-black">Thành tiền</th>
                  <th className="px-4 py-3 text-center font-black w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="font-sans divide-y divide-emerald-500/10">
                {VND_DENOMINATIONS.map(den => {
                  const val = bulkCurrentCash[den] || 0;

                  return (
                    <tr 
                      key={den} 
                      className={cn(
                        "transition-colors hover:bg-emerald-50/45", 
                        val > 0 ? "bg-emerald-50/15 font-bold" : "opacity-60"
                      )}
                    >
                      <td className="px-4 py-3">
                        <span className="font-black text-ink text-sm">
                          {formatCurrency(den, "VND")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const newQty = Math.max(0, val - 1);
                              setBulkCurrentCash(prev => ({ ...prev, [den]: newQty }));
                            }}
                            className="w-7 h-7 rounded-lg border border-ink/15 hover:bg-ink/5 flex items-center justify-center text-xs font-black select-none cursor-pointer"
                          >
                            −
                          </button>
                          <input 
                            type="number"
                            min="0"
                            value={val || ""}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 0;
                              setBulkCurrentCash(prev => ({ ...prev, [den]: qty }));
                            }}
                            placeholder="0"
                            className="w-16 text-center font-bold text-emerald-600 bg-white border border-ink/15 rounded-lg py-1 outline-none focus:border-emerald-500 text-xs shadow-inner"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newQty = val + 1;
                              setBulkCurrentCash(prev => ({ ...prev, [den]: newQty }));
                            }}
                            className="w-7 h-7 rounded-lg border border-ink/15 hover:bg-ink/5 flex items-center justify-center text-xs font-black select-none cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-emerald-600 text-sm whitespace-nowrap">
                        {formatCurrency(den * val, 'VND')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          type="button"
                          onClick={() => {
                            setBulkCurrentCash(prev => ({ ...prev, [den]: 0 }));
                          }}
                          disabled={val === 0}
                          className={cn(
                            "text-[10px] font-bold px-2 py-1 rounded transition-all",
                            val === 0 
                              ? "text-ink/20 cursor-not-allowed" 
                              : "text-crimson hover:bg-crimson/5 hover:text-red-700 cursor-pointer"
                          )}
                          title="Đặt lại về 0"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-emerald-50/50 sketch-border border-dashed border-emerald-200 rounded-xl mb-10">
          <p className="text-xs text-ink/70 leading-relaxed text-center sm:text-left font-sans">
            💡 Số tiền từ bảng kê này được tự động cộng dồn và đồng bộ trực tiếp thành tài sản <span className="font-bold text-emerald-600">"Tiền mặt đang có (Bảng kê tự động)"</span> trong Sổ Tài Sản. Trực quan và tức thời trên mọi thiết bị!
          </p>
          <button 
            type="button"
            onClick={() => setBulkCurrentCash({})}
            disabled={Object.values(bulkCurrentCash).reduce((sum, v) => sum + v, 0) === 0}
            className={cn(
              "sketch-button text-xs py-2 px-6 font-bold uppercase tracking-widest shrink-0 transition-all font-sans",
              Object.values(bulkCurrentCash).reduce((sum, v) => sum + v, 0) === 0 
                ? "text-ink/20 cursor-not-allowed border-ink/5" 
                : "text-crimson hover:bg-crimson/5 border-crimson hover:border-crimson cursor-pointer"
            )}
          >
            Đặt lại toàn bộ về 0
          </button>
        </div>
      </div>
      
      {false && (
      <>
      {/* Bảng Kê Doanh Thu Tuần - Specialized Section */}
      <div className="mt-16 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 border-b-4 border-crimson/80 pb-2 gap-4">
           <div className="flex items-center gap-3">
              <button className="p-2 bg-crimson/80 text-white rounded-xl shadow-lg">
                <Receipt size={24} />
              </button>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-crimson">Doanh thu</h2>
                <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">{justDateRangeText}</p>
              </div>
           </div>
        </div>

        <div className="bg-[#fffbeb] sketch-border p-4 rounded-xl overflow-hidden mb-6">
          <div className="overflow-x-auto max-w-full">
            <table className="min-w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-crimson/10 text-[9px] font-black uppercase tracking-widest text-crimson border-b-2 border-crimson/50">
                  <th className="px-4 py-3 font-black w-44">Ngày</th>
                  <th className="px-4 py-3 text-right font-black">Số Tiền (VND)</th>
                </tr>
              </thead>
              <tbody className="font-sans divide-y divide-crimson/10">
                {bulkDebts.map((item, idx) => (
                  <tr key={item.id} className="transition-colors hover:bg-crimson/5">
                    <td className="px-4 py-2 bg-crimson/5">
                      <input 
                        type="date" 
                        value={item.name} 
                        onChange={e => {
                          const newDebts = [...bulkDebts];
                          newDebts[idx].name = e.target.value;
                          if (idx === 0 && e.target.value) {
                            try {
                              const baseDate = new Date(e.target.value + "T12:00:00");
                              if (!isNaN(baseDate.getTime())) {
                                for (let i = 1; i < 7; i++) {
                                  const nextDate = new Date(baseDate.getTime());
                                  nextDate.setDate(baseDate.getDate() + i);
                                  newDebts[i].name = nextDate.toISOString().split("T")[0];
                                }
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }
                          setBulkDebts(newDebts);
                        }} 
                        className="w-full font-bold text-ink bg-white border border-ink/15 rounded-lg px-2.5 py-1 outline-none focus:border-crimson text-xs shadow-inner"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="text" 
                        value={item.amount} 
                        onChange={e => {
                          const valStr = e.target.value.replace(/,/g, '');
                          if (!/^-?\d*$/.test(valStr)) return;
                          
                          let formatted = "";
                          if (valStr === "-") {
                            formatted = "-";
                          } else if (valStr) {
                            const isNeg = valStr.startsWith("-");
                            const cleanDigits = valStr.replace('-', '');
                            if (cleanDigits) {
                              const parsedVal = parseInt(cleanDigits, 10);
                              if (!isNaN(parsedVal)) {
                                formatted = (isNeg ? "-" : "") + parsedVal.toLocaleString('en-US');
                              }
                            }
                          }
                          const newDebts = [...bulkDebts];
                          newDebts[idx].amount = formatted;
                          setBulkDebts(newDebts);
                        }} 
                        placeholder="0"
                        className="w-full text-right font-mono font-bold text-crimson bg-white border border-ink/15 rounded-lg px-3 py-1 outline-none focus:border-crimson text-sm shadow-inner"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-crimson/10 font-bold text-crimson border-t-2 border-crimson/50 font-sans text-xs">
                  <td className="px-4 py-3">
                    <span className="uppercase text-[10px] tracking-widest font-black block">Tổng Doanh Thu Tuần</span>
                    <span className="text-ink/50 text-[10px] font-medium italic">
                      {(() => {
                        const count = bulkDebts.filter(d => d.amount.trim() && !isNaN(parseFloat(d.amount.replace(/,/g, '')))).length;
                        return `* Tổng hợp từ ${count}/7 ngày có số liệu`;
                      })()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-black text-sm">
                    {(() => {
                      const rawSum = bulkDebts.reduce((sum, item) => sum + (parseFloat(item.amount.replace(/,/g, '')) || 0), 0);
                      const formatted = Math.abs(rawSum).toLocaleString('vi-VN');
                      return `+${formatted} đ`;
                    })()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action Panel below */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-crimson/5 sketch-border border-dashed border-crimson/20 rounded-xl mb-10">
          <div className="text-center sm:text-left">
            <p className="text-xs text-ink/75 leading-relaxed">
              ⚠️ <strong>Quy tắc cộng doanh thu:</strong> Hệ thống tự động gom cả 7 ngày thành một khoản doanh thu tuần tích lũy trong danh mục tài sản, giúp bạn theo dõi tổng tiến trình tích lũy đơn giản hơn.
            </p>
          </div>
          
          <div className="flex gap-2 shrink-0">
             <button 
               onClick={handleResetBulkDebts}
               className="sketch-button text-xs py-2 px-4 font-bold uppercase tracking-widest text-ink hover:bg-white cursor-pointer transition-all"
             >
               Reset Bảng
             </button>
             <button 
               onClick={handleSaveBulkDebts}
               className="sketch-button sketch-button-primary py-2 px-6 flex items-center gap-2 text-xs transition-all bg-crimson/90 text-white hover:bg-crimson hover:shadow-lg active:scale-95 cursor-pointer font-black"
             >
               <Receipt size={14} /> Lưu Doanh Thu
             </button>
          </div>
        </div>
      </div>

      {/* Bảng Kê Chi Tiêu Thẻ Tín Dụng - Specialized Section */}
      <div className="mt-12 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 border-b-4 border-indigo-600/80 pb-2 gap-4">
           <div className="flex items-center gap-3">
              <button className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg">
                <CreditCard size={24} />
              </button>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-indigo-600">Nợ thẻ tín dụng</h2>
                <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">{justCardRangeText}</p>
              </div>
           </div>
        </div>

        <div className="bg-[#f0f4ff] sketch-border p-4 rounded-xl overflow-hidden mb-6">
          <div className="overflow-x-auto max-w-full">
            <table className="min-w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-indigo-100 text-[9px] font-black uppercase tracking-widest text-indigo-700 border-b-2 border-indigo-200">
                  <th className="px-4 py-3 font-black w-44">Ngày</th>
                  <th className="px-4 py-3 text-right font-black">Số Tiền (VND)</th>
                  <th className="px-4 py-3 text-center font-black w-14">Xóa</th>
                </tr>
              </thead>
              <tbody className="font-sans divide-y divide-indigo-100">
                {bulkCardSpends.map((item, idx) => (
                  <tr key={item.id} className="transition-colors hover:bg-indigo-50/50">
                    <td className="px-4 py-2 bg-indigo-50/30">
                      <input 
                        type="date" 
                        value={item.name} 
                        onChange={e => {
                          const newSpends = [...bulkCardSpends];
                          newSpends[idx].name = e.target.value;
                          if (idx === 0 && e.target.value) {
                            try {
                              const baseDate = new Date(e.target.value + "T12:00:00");
                              if (!isNaN(baseDate.getTime())) {
                                for (let i = 1; i < newSpends.length; i++) {
                                  const nextDate = new Date(baseDate.getTime());
                                  nextDate.setDate(baseDate.getDate() + i);
                                  newSpends[i].name = nextDate.toISOString().split("T")[0];
                                }
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }
                          setBulkCardSpends(newSpends);
                        }} 
                        className="w-full font-bold text-ink bg-white border border-ink/15 rounded-lg px-2.5 py-1 outline-none focus:border-indigo-600 text-xs shadow-inner"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="text" 
                        value={item.amount} 
                        onChange={e => {
                          const valStr = e.target.value.replace(/,/g, '');
                          if (!/^-?\d*$/.test(valStr)) return;
                          
                          let formatted = "";
                          if (valStr === "-") {
                            formatted = "-";
                          } else if (valStr) {
                            const isNeg = valStr.startsWith("-");
                            const cleanDigits = valStr.replace('-', '');
                            if (cleanDigits) {
                              const parsedVal = parseInt(cleanDigits, 10);
                              if (!isNaN(parsedVal)) {
                                formatted = (isNeg ? "-" : "") + parsedVal.toLocaleString('en-US');
                              }
                            }
                          }
                          const newSpends = [...bulkCardSpends];
                          newSpends[idx].amount = formatted;
                          setBulkCardSpends(newSpends);
                        }} 
                        placeholder="0"
                        className="w-full text-right font-mono font-bold text-indigo-700 bg-white border border-ink/15 rounded-lg px-3 py-1 outline-none focus:border-indigo-600 text-sm shadow-inner"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => {
                          const newSpends = bulkCardSpends.filter(s => s.id !== item.id);
                          setBulkCardSpends(newSpends);
                        }}
                        className="p-1 text-[#e11d48] hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Xóa ngày chi tiêu này"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-indigo-100 font-bold text-indigo-700 border-t-2 border-indigo-200 font-sans text-xs">
                  <td className="px-4 py-3">
                    <span className="uppercase text-[10px] tracking-widest font-black block">Tổng Nợ Thẻ Đã Tiêu</span>
                    <span className="text-indigo-950/50 text-[10px] font-medium italic">
                      {(() => {
                        const count = bulkCardSpends.filter(d => d.amount.trim() && !isNaN(parseFloat(d.amount.replace(/,/g, '')))).length;
                        return `* Tổng hợp từ ${count}/${bulkCardSpends.length} ngày ghi chi tiêu`;
                      })()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-black text-sm">
                    {(() => {
                      const rawSum = bulkCardSpends.reduce((sum, item) => sum + (parseFloat(item.amount.replace(/,/g, '')) || 0), 0);
                      const formatted = Math.abs(rawSum).toLocaleString('vi-VN');
                      return `+${formatted} đ`;
                    })()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action Panel */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-emerald-50/50 sketch-border border-dashed border-emerald-200 rounded-xl mb-12">
          <div className="text-center sm:text-left flex-1">
            <p className="text-xs text-emerald-950 font-bold leading-relaxed">
              ⚡ <strong>Tự động đồng bộ:</strong> Toàn bộ chi tiêu thẻ hàng ngày ở trên đang được tự động cộng dồn & cập nhật trực tiếp thành một khoản nợ thẻ tín dụng trong Sổ Tài Sản. Net Worth sẽ tự cập nhật real-time mà không cần thao tác bấm Lưu!
            </p>
          </div>
          
          <div className="flex gap-2 shrink-0 items-center">
             <button 
               onClick={() => {
                 let nextDateStr = "";
                 if (bulkCardSpends.length > 0) {
                   const lastDateStr = bulkCardSpends[bulkCardSpends.length - 1].name;
                   try {
                     const d = new Date(lastDateStr + "T12:00:00");
                     if (!isNaN(d.getTime())) {
                       d.setDate(d.getDate() + 1);
                       nextDateStr = d.toISOString().split("T")[0];
                     }
                   } catch {}
                 }
                 if (!nextDateStr) {
                   nextDateStr = new Date().toISOString().split("T")[0];
                 }
                 setBulkCardSpends([
                   ...bulkCardSpends,
                   {
                     id: Date.now() + Math.random(),
                     name: nextDateStr,
                     amount: "",
                     notes: ""
                   }
                 ]);
               }}
               className="sketch-button py-2 px-4 text-xs font-bold bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200 cursor-pointer transition-all flex items-center gap-1 animate-pulse"
             >
               <Plus size={14} /> Thêm Hàng
             </button>
             <button 
               onClick={handleResetBulkCardSpends}
               className="sketch-button text-xs py-2 px-4 font-bold uppercase tracking-widest text-[#1a2530] hover:bg-white cursor-pointer transition-all border border-ink/10"
             >
               Reset Bảng
             </button>
             <div className="py-2 px-5 flex items-center gap-2 text-xs rounded-xl bg-emerald-600 text-white font-black uppercase tracking-wider select-none shadow-[3px_3px_0_rgba(16,185,129,0.3)]">
               <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
               <span>✓ Đã liên kết nợ tự động</span>
             </div>
          </div>
        </div>
      </div>

      {/* --- PHÂN KHÚC DỰ TÍNH TIỀN LƯƠNG & DỰ CHI --- */}
      <div className="mt-16 animate-in fade-in slide-in-from-bottom-4 border-t-4 border-dashed border-emerald-600/30 pt-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 border-b-4 border-emerald-600/80 pb-2 gap-4">
           <div className="flex items-center gap-3">
              <button className="p-1.5 bg-emerald-600 text-white rounded-xl shadow-lg">
                <Briefcase size={22} />
              </button>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-emerald-600">Dự tính lương & Kế hoạch chi tiêu</h2>
                <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Lập ngân sách chủ động trước khi nhận lương</p>
              </div>
           </div>

           {/* Quick Stats Badges */}
           <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2 bg-emerald-50 p-2 px-3 rounded-xl sketch-border border-emerald-200">
                <div className="text-right">
                  <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Dự tính lương</p>
                  <div className="flex items-center gap-1.5 font-mono font-black text-xs text-emerald-700">
                    <input
                      type="text"
                      value={salaryInput}
                      onChange={e => {
                        const valStr = e.target.value.replace(/[^0-9]/g, "");
                        let formatted = "0";
                        if (valStr) {
                          const parsedVal = parseInt(valStr, 10);
                          if (!isNaN(parsedVal)) {
                            formatted = parsedVal.toLocaleString('en-US');
                          }
                        }
                        setSalaryInput(formatted);
                      }}
                      className="w-24 text-right bg-white border border-emerald-300 font-mono font-bold rounded px-1 py-0.5 outline-none focus:border-emerald-600 text-xs shadow-inner"
                      placeholder="0"
                    />
                    <span>đ</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-rose-50 p-2 px-3 rounded-xl sketch-border border-rose-200">
                <div className="text-right">
                  <p className="text-[8px] font-bold text-rose-600 uppercase tracking-widest font-sans">Tổng dự chi</p>
                  <p className="text-xs font-black text-rose-700 font-mono">
                    {totalPlannedOutflows.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </div>

              <div className={`flex items-center gap-2 p-2 px-3 rounded-xl sketch-border ${
                remainingBalance >= 0 
                  ? "bg-blue-50 border-blue-200 text-blue-700" 
                  : "bg-red-50 border-red-200 text-red-600 animate-pulse"
              }`}>
                <div className="text-right">
                  <p className="text-[8px] font-bold uppercase tracking-widest opacity-80 font-sans">Còn lại</p>
                  <p className="text-xs font-black font-mono">
                    {remainingBalance.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </div>
           </div>
        </div>

        {/* Visual Allocation Meter */}
        <div className="bg-white sketch-border p-4 rounded-xl mb-6">
          <div className="flex justify-between items-center text-xs mb-1.5 font-sans">
            <span className="font-bold text-ink/70">Tỷ lệ phân bổ ngân sách dự tính:</span>
            <span className={`font-mono font-black ${percentageSpent > 100 ? "text-rose-600" : "text-emerald-600"}`}>
              {percentageSpent.toFixed(1)}% {percentageSpent > 100 ? "(Vượt hạn mức!)" : ""}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-ink/10 shadow-inner flex">
            <div 
              style={{ width: `${Math.min(percentageSpent, 100)}%` }} 
              className={`h-full transition-all duration-500 ${
                percentageSpent > 100 ? "bg-rose-500" :
                percentageSpent > 80 ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
          </div>
          <p className="text-[10px] text-ink/50 mt-2 leading-relaxed italic">
            * Khuyên dùng: Giữ tổng dự chi dưới 80% lương để dành từ 20% lương gửi tiết kiệm, đầu tư tài sản dài hạn.
          </p>
        </div>

        {/* Expenses List Table */}
        <div className="bg-white/70 sketch-border p-4 rounded-xl overflow-hidden mb-6">
          <div className="overflow-x-auto max-w-full">
            <table className="min-w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-50 text-[9px] font-black uppercase tracking-widest text-emerald-800 border-b-2 border-emerald-200">
                  <th className="px-4 py-3 font-black w-56">Khoản Mục Dự Chi</th>
                  <th className="px-4 py-3 text-right font-black">Số Tiền (VND)</th>
                  <th className="px-4 py-3 text-center font-black w-14">Xóa</th>
                </tr>
              </thead>
              <tbody className="font-sans divide-y divide-emerald-100">
                {plannedExpenses.map((item, idx) => (
                  <tr key={item.id} className="transition-colors hover:bg-emerald-50/20">
                    <td className="px-4 py-2 font-bold text-ink">
                      <input 
                        type="text" 
                        value={item.name} 
                        onChange={e => {
                          const newExp = [...plannedExpenses];
                          newExp[idx].name = e.target.value;
                          setPlannedExpenses(newExp);
                        }} 
                        className="w-full bg-transparent font-bold text-ink border-b border-transparent focus:border-emerald-500 outline-none py-0.5 text-xs"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="text" 
                        value={item.amount} 
                        onChange={e => {
                          const valStr = e.target.value.replace(/[^0-9]/g, "");
                          let formatted = "0";
                          if (valStr) {
                            const parsedVal = parseInt(valStr, 10);
                            if (!isNaN(parsedVal)) {
                              formatted = parsedVal.toLocaleString('en-US');
                            }
                          }
                          const newExp = [...plannedExpenses];
                          newExp[idx].amount = formatted;
                          setPlannedExpenses(newExp);
                        }} 
                        placeholder="0"
                        className="w-full text-right font-mono font-bold text-emerald-700 bg-white border border-ink/15 rounded-lg px-2.5 py-1 outline-none focus:border-emerald-600 text-xs shadow-inner"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleRemovePlannedExpense(item.id)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Xóa khoản dự chi"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Inline adder row */}
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td className="px-4 py-2.5 font-semibold text-ink">
                    <input 
                      type="text" 
                      value={newExpName} 
                      onChange={e => setNewExpName(e.target.value)} 
                      placeholder="Thêm khoản mới (Ví dụ: Sự kiện, Sách dã ngoại...)"
                      className="w-full bg-white border border-ink/15 rounded-lg px-2.5 py-1 outline-none focus:border-slate-500 text-xs shadow-inner font-sans font-medium"
                    />
                  </td>
                  <td colSpan={2} className="px-4 py-2.5">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newExpAmount} 
                        onChange={e => {
                          const valStr = e.target.value.replace(/[^0-9]/g, "");
                          let formatted = "";
                          if (valStr) {
                            const parsedVal = parseInt(valStr, 10);
                            if (!isNaN(parsedVal)) {
                              formatted = parsedVal.toLocaleString('en-US');
                            }
                          }
                          setNewExpAmount(formatted);
                        }} 
                        placeholder="Số tiền (đ)"
                        className="flex-1 text-right font-mono font-bold text-slate-700 bg-white border border-ink/15 rounded-lg px-2.5 py-1 outline-none focus:border-slate-500 text-xs shadow-inner"
                      />
                      <button
                        onClick={handleAddPlannedExpense}
                        disabled={!newExpName.trim()}
                        className="p-1.5 bg-emerald-600 disabled:opacity-30 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                        title="Xác nhận thêm khoản"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-emerald-100 font-bold text-emerald-800 border-t-2 border-emerald-200">
                  <td className="px-4 py-2.5 font-sans">
                    <span className="uppercase text-[10px] tracking-widest font-black block">Tổng Dự Chi Tháng Này</span>
                    <span className="text-emerald-950/50 text-[10px] font-medium italic">
                      * Tổng {plannedExpenses.length} vị trí phân phối dòng tiền dự tính
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-xs" colSpan={2}>
                    {totalPlannedOutflows.toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action button panel */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-emerald-50/20 sketch-border border-dashed border-emerald-200 rounded-xl mb-12">
          <div className="text-center sm:text-left">
            <p className="text-xs text-ink/75 leading-relaxed font-sans">
              ℹ️ <strong>Mục Tiêu Tài Chính:</strong> Dự toán trước khi tiền lương về ví sẽ hạn chế tối đa việc chi tiêu tùy hứng và thiết lập ý thức tích lũy tài sản đều đặn mỗi chu kỳ.
            </p>
          </div>
          
          <div className="flex gap-2 shrink-0">
             <button 
               onClick={handleResetSalaryPlanner}
               className="sketch-button text-xs py-2 px-6 font-bold uppercase tracking-widest text-ink bg-white hover:bg-emerald-50 cursor-pointer transition-all border border-ink/10"
             >
               Reset Bảng Lương
             </button>
          </div>
        </div>
      </div>

      </>)}

      {filteredAssets.length === 0 && (
        <div className="text-center py-20 opacity-30">
          <Wallet size={48} className="mx-auto mb-4" />
          <p className="font-hand text-xl">Không tìm thấy tài sản nào</p>
        </div>
      )}
    </div>
  );
}
