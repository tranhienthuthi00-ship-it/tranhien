import React, { useState, useMemo, useEffect } from "react";
import { useFirebase } from "../context/FirebaseContext";
import { Plus, Trash2, Edit2, Wallet, Settings, Landmark, Car, MonitorSmartphone, Gem, PiggyBank, Briefcase, Bitcoin, Building, Home, Coins, CreditCard, TrendingUp, Smartphone, Laptop, Handshake, Users, Receipt, ChevronDown, ChevronUp, Calendar as CalendarIcon, Sparkles, Award } from "lucide-react";
import type { FormEvent } from "react";
import { cn, getAbsoluteUrl } from "@/lib/utils";
import type { Asset, AssetCategory } from "@/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const formatDateDot = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}.${month}.${year}`;
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}.${mm}.${yyyy}`;
    }
  } catch (err) {}
  return dateStr;
};

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

export function AssetsManager({ 
  assets, 
  setAssets, 
  categories, 
  setCategories,
  bulkDebts,
  setBulkDebts,
  bulkCardSpends,
  setBulkCardSpends,
  bulkCurrentCash,
  setBulkCurrentCash
}: {
  assets: Asset[];
  setAssets: (a: Asset[]) => void;
  categories: AssetCategory[];
  setCategories: (c: AssetCategory[]) => void;
  bulkDebts: {id: number, name: string, amount: string, notes: string}[];
  setBulkDebts: React.Dispatch<React.SetStateAction<{id: number, name: string, amount: string, notes: string}[]>>;
  bulkCardSpends: {id: number, name: string, amount: string, notes: string}[];
  setBulkCardSpends: React.Dispatch<React.SetStateAction<{id: number, name: string, amount: string, notes: string}[]>>;
  bulkCurrentCash: Record<number, number>;
  setBulkCurrentCash: React.Dispatch<React.SetStateAction<Record<number, number>>>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "value" | "date">("date");

  // Toggle Collapse UI States now default to expanded (false) inside the tab view for instant desktop visibility, but are click-adjustable.
  const [activeTab, setActiveTab2] = useState<"register" | "cards-liabilities" | "cash-audit" | "budget">("register");
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isNewMoneyCollapsed, setIsNewMoneyCollapsed] = useState(true);
  const [isSalaryPlannerCollapsed, setIsSalaryPlannerCollapsed] = useState(true);
  const [isBulkCardSpendsCollapsed, setIsBulkCardSpendsCollapsed] = useState(true);
  const [isBulkDebtsCollapsed, setIsBulkDebtsCollapsed] = useState(true);

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

  // Rely on bulkDebts, bulkCardSpends, bulkCurrentCash passed from App.tsx

  // --- HỆ THỐNG DỰ TÍNH TIỀN LƯƠNG & DỰ CHI ---
  const { salaryInput, setSalaryInput, plannedExpenses, setPlannedExpenses } = useFirebase();

  const [newExpName, setNewExpName] = useState("");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [newExpNotes, setNewExpNotes] = useState("");

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
     
     const isLoan = calculatedSum < 0;
     const isDebt = calculatedSum > 0;

     const catId = categories.find(c => c.name.toLowerCase().includes(isLoan ? "cho vay" : "nợ") || c.name.toLowerCase().includes("doanh thu") || c.name.toLowerCase().includes("tiền mặt"))?.id || defaultCatID;

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
       return `• ${formatDateHelper(d.name)}: ${val >= 0 ? "+" : ""}${val.toLocaleString('vi-VN')} đ${dayNote}`;
     }).join("\n");

     const aggregatedRevenue: Asset = {
        id: `rev-held-${now}`,
        name: isLoan ? `Cho vay tích lũy doanh thu ${formattedDateRange}` : `Nợ tích lũy doanh thu ${formattedDateRange}`,
        category: catId,
        value: totalSum,
        currency: "VND",
        notes: isLoan ? `Bảng kê chi tiết khoản cho vay doanh thu tuần:\n${detailNotesList}` : `Bảng kê chi tiết nợ doanh thu tuần:\n${detailNotesList}`,
        acquiredAt: now,
        isDebt: isDebt,
        isLoan: isLoan,
        isNewMoney: false,
        excludeFromNetWorth: false
     };

     setAssets([aggregatedRevenue, ...assets]);
     alert(isLoan 
       ? `Đã lưu tổng khoản cho vay doanh thu tuần trị giá +${totalSum.toLocaleString('vi-VN')}đ vào Sổ Tài Sản (Mục Cho Vay) thành công!`
       : `Đã lưu tổng nợ doanh thu tuần trị giá +${totalSum.toLocaleString('vi-VN')}đ vào Sổ Tài Sản (Mục Nợ) thành công!`
     );
     handleResetBulkDebts();
  };

  const [bulkCash, setBulkCash] = useState<Record<number, number>>({});
  const VND_DENOMINATIONS = [500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000];

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
    setIsAddAssetOpen(true); // Open adding box automatically on Edit

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
    setIsAddAssetOpen(false); // Close drawer on cancel
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
    setIsAddAssetOpen(false); // Close form drawer on successfully adding/updating
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

  // Replicating green (emerald) & pink (rose) themed custom colors like Habit tracker (xanh hồng)
  const COLORS = [
    '#10b981', // emerald
    '#ec4899', // pink/rose
    '#059669', // emerald dark
    '#f43f5e', // rose/pink dark
    '#14b8a6', // teal/green
    '#db2777', // pink dark
    '#34d399', // mint emerald
    '#fda4af', // light rose/pink
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
      <div className="sketch-border bg-[#e8f0fe] p-6 text-center shadow-md border-b-4 border-r-4 border-ink relative overflow-hidden rounded-3xl">
        <div className="absolute right-4 top-2 opacity-15 rotate-12">
          <Coins className="w-24 h-24" />
        </div>

        {/* Hand-drawn Header Block styled like the Habit Tracker's Pink Banner */}
        <div className="flex justify-center mb-6">
          <div className="bg-[#fbcfe8] rotate-2 px-6 py-2 border-2 border-ink shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] rounded-md tracking-wider relative inline-block">
            <h1 className="text-2xl md:text-4xl font-logo font-black uppercase text-ink flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500 animate-[bounce_1.5s_infinite]" />
              TÀI SẢN & CÔNG NỢ
            </h1>
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold italic text-ink/70">
          "Kỷ luật là cầu nối giữa mục tiêu và sự thành công. Hãy lặp lại mỗi ngày!" 🎯
        </p>

        {/* TOP STATUS BAR / SCOREBOARD */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="bg-white/70 p-3 sketch-border-sm flex flex-col justify-center items-center">
            <span className="text-xl md:text-2xl font-black text-emerald-700 font-mono">
              {formatCurrency(totalVND, 'VND')}
            </span>
            <span className="text-[10px] uppercase font-bold text-ink/50 mt-1">Vốn sở hữu (Net Worth)</span>
          </div>
          <div className="bg-white/70 p-3 sketch-border-sm flex flex-col justify-center items-center">
            <span className="text-xl md:text-2xl font-black text-[#0f766e] font-mono">
              {formatCurrency(totalAssetsVND, 'VND')}
            </span>
            <span className="text-[10px] uppercase font-bold text-ink/50 mt-1">Hạng mục tích lũy</span>
          </div>
          <div className="bg-white/70 p-3 sketch-border-sm flex flex-col justify-center items-center">
            <span className="text-xl md:text-2xl font-black text-blue-700 font-mono">
              {formatCurrency(totalLoansVND, 'VND')}
            </span>
            <span className="text-[10px] uppercase font-bold text-ink/50 mt-1">Tổng khoản phải thu</span>
          </div>
          <div className="bg-white/70 p-3 sketch-border-sm flex flex-col justify-center items-center">
            <span className="text-xl md:text-2xl font-black text-crimson font-mono">
              {formatCurrency(totalDebtsVND, 'VND')}
            </span>
            <span className="text-[10px] uppercase font-bold text-ink/50 mt-1">Tổng nghĩa vụ nợ</span>
          </div>
        </div>

        {/* MỨC ĐỘ KỶ LUẬT TÀI CHÍNH */}
        <div className="mt-4 p-4 bg-[#fffbeb] border-2 border-ink rounded-lg text-left shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] relative overflow-hidden">
          <div className="absolute right-3 -bottom-1 text-ink/5 pointer-events-none">
            <Award className="w-16 h-16 rotate-12" />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-ink bg-[#fef7e0] flex items-center justify-center text-2xl shadow-sm shrink-0">
                🌱
              </div>
              <div className="text-left font-sans animate-in fade-in zoom-in-95 duration-200">
                <div className="text-[10px] uppercase font-black tracking-wider text-crimson flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-crimson animate-ping" />
                  Mức Độ Kỷ Luật Toàn Diện
                </div>
                <h3 className="text-lg md:text-xl font-black text-ink flex items-center gap-2 uppercase tracking-tight">
                  {totalVND > 50000000 ? "NGƯỜI GIEO MẦM TÍCH LŨY" : "MỚI KHỞI ĐẦU HÀNH TRÌNH"}
                </h3>
                <p className="text-[11px] font-medium text-ink/75 leading-tight italic max-w-sm sm:max-w-md">
                  "Có công mài sắt có ngày nên kim, hạt mầm tài chính kỷ luật đang nảy nở mỗi ngày."
                </p>
              </div>
            </div>
            <div className="flex gap-2 self-start sm:self-auto shrink-0 bg-white border-2 border-ink rounded-lg p-2 font-black shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] items-center text-xs">
              <span className="text-crimson">🔥 Tích lũy tích cực</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons row underneath */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-6 bg-white p-4 rounded-xl border-2 border-dashed border-ink text-left w-full shadow-sm">
          <div className="text-left font-sans">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#065f46] bg-[#e6f4ea] border border-emerald-300 px-2.5 py-1 rounded-md">
              SỔ QUẢN LÝ FIN-APP
            </span>
            <p className="text-xs text-ink/60 mt-1.5">
              Theo dõi dòng vốn chủ sở hữu, tiền mặt dự phòng tích lũy và nghĩa vụ nợ tự động
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {/* Toggle Add form */}
            <button 
              onClick={() => setIsAddAssetOpen(!isAddAssetOpen)} 
              className={cn(
                "sketch-button flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 border-2 border-ink shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none bg-white cursor-pointer",
                isAddAssetOpen ? "bg-[#fbcfe8] text-ink font-black scale-[1.01]" : "hover:bg-neutral-50"
              )}
              id="btn-toggle-add-asset"
            >
              {isAddAssetOpen ? "✕ Đóng khung nhập" : "＋ Thêm tài sản mới"}
            </button>
            
            <button 
              onClick={() => setIsManagingCats(!isManagingCats)} 
              className={cn(
                "sketch-button flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 border-2 border-ink shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none bg-white cursor-pointer",
                isManagingCats ? "bg-ink text-paper" : "hover:bg-neutral-50"
              )}
              id="btn-manage-categories"
            >
              <Settings size={14} /> Danh Mục
            </button>
          </div>
        </div>

        {/* SUBTAB NAVIGATION SYSTEM FOR PROFESSIONAL fin-app FEEL */}
        <div className="flex flex-wrap items-center gap-2 mb-8 bg-white p-2 rounded-2xl border-[3px] border-ink shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] w-full">
          <button
            onClick={() => setActiveTab2("register")}
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[11px] uppercase tracking-wider font-extrabold transition-all cursor-pointer flex-1 min-w-[130px] border-2 border-transparent",
              activeTab === "register"
                ? "bg-[#e6f4ea] text-emerald-800 border-ink shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] scale-[1.01]"
                : "text-ink/75 hover:bg-emerald-50/50 hover:text-emerald-800"
            )}
          >
            <Wallet size={14} className="text-emerald-700 font-bold" />
            <span>Vốn & Tài sản</span>
          </button>
          <button
            onClick={() => setActiveTab2("cards-liabilities")}
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[11px] uppercase tracking-wider font-extrabold transition-all cursor-pointer flex-1 min-w-[130px] border-2 border-transparent",
              activeTab === "cards-liabilities"
                ? "bg-[#fce8e6] text-pink-800 border-ink shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] scale-[1.01]"
                : "text-ink/75 hover:bg-pink-50/50 hover:text-pink-800"
            )}
          >
            <CreditCard size={14} className="text-pink-700 font-bold" />
            <span>Chi tiêu Thẻ & Nợ</span>
          </button>
          <button
            onClick={() => setActiveTab2("cash-audit")}
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[11px] uppercase tracking-wider font-extrabold transition-all cursor-pointer flex-1 min-w-[130px] border-2 border-transparent",
              activeTab === "cash-audit"
                ? "bg-[#e6f4ea] text-emerald-800 border-ink shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] scale-[1.01]"
                : "text-ink/75 hover:bg-emerald-50/50 hover:text-emerald-800"
            )}
          >
            <Coins size={14} className="text-emerald-700 font-bold" />
            <span>Kiểm kê Ví tiền</span>
          </button>
          <button
            onClick={() => setActiveTab2("budget")}
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[11px] uppercase tracking-wider font-extrabold transition-all cursor-pointer flex-1 min-w-[130px] border-2 border-transparent",
              activeTab === "budget"
                ? "bg-[#fce8e6] text-pink-800 border-ink shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] scale-[1.01]"
                : "text-ink/75 hover:bg-pink-50/50 hover:text-pink-800"
            )}
          >
            <Briefcase size={14} className="text-pink-700 font-bold" />
            <span>Kế hoạch Lương</span>
          </button>
        </div>

        {activeTab === "register" && (
          <>
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

      <div className="flex flex-col xl:flex-row items-stretch gap-6 mb-10 w-full relative">
        {/* CHARTS CONTAINER */}
        <div className="flex-1 w-full bg-white/40 p-6 sketch-border flex flex-col md:flex-row items-center gap-6 relative">
          {(pieData.length > 0) ? (
            <>
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
            </>
          ) : (
            <div className="w-full text-center py-10 opacity-30 italic font-medium">Chưa có đủ dữ liệu để vẽ biểu đồ...</div>
          )}
        </div>

        {/* THÊM TÀI SẢN MỚI FORM (ALIGNED WITH CHART) */}
        {isAddAssetOpen && (
          <form onSubmit={addAsset} className={cn(
            "bg-paper p-5 sm:p-6 sketch-border duration-300 transition-all select-none relative xl:w-[350px] shrink-0 w-full h-max",
            editingId ? "border-amber-400 border-2 ring-4 ring-amber-400/20" : "border-dashed border-ink/30"
          )}>
            <div className="absolute -top-3 -left-3 rotate-[-5deg] z-10 transition-transform">
              <span className={cn(
                "text-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
                editingId ? "bg-amber-500 animate-pulse" : "bg-crimson"
              )}>
                {editingId ? "✨ Đang Cập Nhật Tài Sản" : "＋ Thêm Tài Sản Mới"}
              </span>
            </div>
          
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">Tên Tài Sản</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ví dụ: Sổ tiết kiệm..."
                  className="sketch-input bg-white/50 py-2"
                  required
                />
                
                {/* AI Auto-Categorization Suggestion Box */}
                {newName.trim() && !isNewMoney && (
                  <div className="mt-1 flex flex-col gap-1 text-[11px] transition-all duration-300">
                    {isCategorizing ? (
                      <span className="text-crimson/80 flex items-center gap-1.5 animate-pulse font-sans ml-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-crimson border border-ink/20 animate-bounce"></span>
                        ✨ Đang gợi ý...
                      </span>
                    ) : aiSuggestion ? (
                      <div className="bg-[#fff9f9] border border-dashed border-crimson/40 p-2 rounded-lg flex flex-col gap-1.5 shadow-2xs transition-all">
                        <div className="flex items-center justify-between font-sans">
                          <span className="flex items-center gap-1.5 text-ink text-[10px]">
                            <span>💡</span> <strong className="text-crimson uppercase tracking-wide">{aiSuggestion.name}</strong>
                          </span>
                          {newCategory === aiSuggestion.id ? (
                            <span className="py-0.5 px-1 bg-emerald-100 text-emerald-800 text-[8px] font-bold rounded uppercase tracking-wider shrink-0">
                              ✓
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setNewCategory(aiSuggestion.id)}
                              className="py-1 px-2 bg-crimson hover:bg-crimson/95 active:scale-95 text-white text-[8px] uppercase font-bold rounded cursor-pointer transition-all shadow-2xs shrink-0"
                            >
                              Áp dụng
                            </button>
                          )}
                        </div>
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
                      <option key={c.id} value={c.id}>{renderIcon(c.icon, 12)} {c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">Số Tiền</label>
                  <input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="0"
                    type="text"
                    inputMode="decimal"
                    className="sketch-input bg-white/50 py-2 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Advanced Options Group */}
              <div className="bg-white/30 border border-ink/5 p-3 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-ink/70 flex items-center gap-1">
                     <Wallet size={12} /> Tiền mới (Dự phòng)?
                   </label>
                   <input
                     type="checkbox"
                     checked={isNewMoney}
                     onChange={(e) => setIsNewMoney(e.target.checked)}
                     className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                   />
                </div>
                
                <div className="flex items-center justify-between gap-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-ink/70 flex items-center gap-1">
                     <CreditCard size={12} /> Là Khoản Nợ?
                   </label>
                   <input
                     type="checkbox"
                     checked={isDebt}
                     onChange={(e) => {
                       setIsDebt(e.target.checked);
                       if (e.target.checked) setIsNewMoney(false);
                     }}
                     className="w-4 h-4 accent-crimson rounded cursor-pointer"
                   />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">Ghi Chú</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Thông tin thêm (nếu có)"
                  className="sketch-input bg-white/50 py-2 resize-none custom-scrollbar h-16"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-ink/10">
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="flex-1 sketch-button py-2 bg-zinc-100 border-none font-bold">
                    Hủy
                  </button>
                )}
                <button type="submit" className="flex-1 sketch-button bg-ink text-white py-2 font-black uppercase tracking-widest shadow-sm">
                  {editingId ? "Ghi Nhận Thay Đổi" : "Tạo Mới"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

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

      {isAddAssetOpen && (
        <form onSubmit={addAsset} className={cn(
          "bg-paper p-6 sketch-border duration-300 transition-all select-none relative mb-8 mt-8 space-y-4",
          editingId ? "border-amber-400 border-2 ring-4 ring-amber-400/20" : "border-dashed border-ink/30"
        )}>
          <div className="absolute -top-3 -left-3 rotate-[-5deg] z-10 transition-transform">
            <span className={cn(
              "text-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
              editingId ? "bg-amber-500 animate-pulse" : "bg-crimson"
            )}>
              {editingId ? "✨ Đang Cập Nhật Tài Sản" : "＋ Thêm Tài Sản Mới"}
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
      )}

      <div className="space-y-8 mb-12">
        {(Object.entries(regularAssetsByCategory) as [string, Asset[]][]).map(([catId, items]) => {
          const cat = getCategory(catId);
          const catTotal = items.reduce((acc, curr) => {
            const val = getValueInVND(curr.value, curr.currency, curr.exchangeRate);
            return curr.isDebt ? acc - val : acc + val;
          }, 0);
          
          return (
            <div 
              key={catId} 
              className={cn(
                "rounded-2xl border-[3px] border-ink p-5 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] animate-in fade-in slide-in-from-bottom-2 text-left",
                catTotal < 0
                  ? "bg-[#fce8e6]"
                  : "bg-[#e6f4ea]"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b-2 border-dashed border-ink/15 mb-4">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 px-3 text-white rounded-xl shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] border-2 border-ink flex items-center justify-center shrink-0" style={{ backgroundColor: getCategoryColor(catId) }}>
                    {renderIcon(cat.icon, 20)}
                  </span>
                  <div className="text-left font-sans">
                    <h2 className="text-lg font-black text-ink uppercase tracking-wide">{cat.name}</h2>
                    <p className="text-[10px] font-black text-ink/40 uppercase tracking-widest">{items.length} hạng mục</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[9px] font-bold text-ink/50 uppercase tracking-widest">Tổng số dư danh mục</p>
                  <p className={cn("text-base font-black font-sans bg-white px-3 py-1 rounded-lg border-2 border-ink inline-block shadow-[1.5px_1.5px_0px_0px_rgba(26,26,26,1)]", catTotal < 0 ? "text-pink-800" : "text-emerald-800")}>
                    {catTotal < 0 ? "-" : ""}{formatCurrency(Math.abs(catTotal), 'VND')}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {items.map(asset => {
                  const isAutoSynced = asset.id.includes("auto-sync") || asset.id.includes("card-held") || asset.id.includes("revenue-held");
                  return (
                    <div 
                      key={asset.id} 
                      className={cn(
                        "flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-white hover:bg-neutral-50 border-2 border-ink rounded-xl transition-all relative group shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]",
                        asset.isDebt 
                          ? "bg-[#fff6f6]" 
                          : "bg-[#fbfdfb]"
                      )}
                    >
                      <div className="flex flex-col gap-0.5 text-left max-w-sm">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-[#111] text-sm tracking-tight">{asset.name}</span>
                          
                          {/* Sync badging */}
                          {isAutoSynced && (
                            <span className="inline-flex items-center gap-1 bg-white text-[#0369a1] text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-[#bae6fd] animate-pulse shadow-2xs">
                              <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                              Tự Động Sync
                            </span>
                          )}
                          
                          {/* Custom asset type labels */}
                          {asset.isDebt && (
                            <span className="bg-red-150 text-crimson text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                              Nợ Phải Trả
                            </span>
                          )}
                          
                          {asset.isLoan && (
                            <span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                              Mượn / Cho Vay
                            </span>
                          )}

                          {asset.isNewMoney && (
                            <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                              Tiền Mới Nhập
                            </span>
                          )}
                        </div>
                        
                        {/* Elegant direct note block */}
                        {asset.notes && (
                          <span className="text-[11px] text-ink/50 leading-normal line-clamp-2 max-w-md italic font-sans mt-0.5 whitespace-pre-line">
                            {asset.notes}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-3.5">
                        <div className="text-left sm:text-right font-sans">
                          {/* Currency Conversions details if applicable */}
                          {asset.currency !== "VND" && (
                            <div className="text-[10px] text-ink/40 font-bold whitespace-nowrap">
                              {asset.quantity} {asset.currency === "GOLD" ? "chỉ vàng" : asset.currency} × {asset.exchangeRate?.toLocaleString('vi-VN')}đ
                            </div>
                          )}
                          <div className={cn(
                            "text-sm font-extrabold font-mono whitespace-nowrap",
                            asset.isDebt ? "text-crimson" : "text-ink"
                          )}>
                            {asset.isDebt ? "-" : ""}{formatCurrency(asset.value, asset.currency)}
                          </div>
                        </div>

                        {/* Interactive Edit and Delete inline triggers */}
                        <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-all border-l border-ink/5 pl-2 relative z-10 shrink-0">
                          <button 
                            onClick={() => startEdit(asset)}
                            className="p-1.5 text-ink/50 hover:text-indigo-600 hover:bg-zinc-100 rounded-lg transition-all"
                            title="Sửa"
                          >
                            <Edit2 size={13} />
                          </button>
                          
                          <button 
                            onClick={() => {
                              if (isAutoSynced) {
                                if (!window.confirm("Đây là tài sản được đồng bộ tự động từ bảng kê. Bạn có chắc chắn muốn xóa không?")) {
                                  return;
                                }
                              } else {
                                if (!window.confirm(`Xóa "${asset.name}"?`)) {
                                  return;
                                }
                              }
                              removeAsset(asset.id);
                            }}
                            className="p-1.5 text-ink/50 hover:text-crimson hover:bg-red-50 rounded-lg transition-all"
                            title="Xóa"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      </>)}

      {/* Bảng Kê Tiền Mới - Specialized Section */}
      {activeTab === "cash-audit" && (
      <>
      <div className="mt-2 animate-in fade-in slide-in-from-bottom-4 bg-[#e6f4ea]/30 p-6 rounded-2xl border-2 border-emerald-300 hover:border-emerald-400 transition-all text-left">
        <div 
          onClick={() => setIsNewMoneyCollapsed(!isNewMoneyCollapsed)}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b-2 border-emerald-500/20 gap-4 cursor-pointer group select-none relative"
        >
           <div className="flex items-center gap-3">
              <button className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg group-hover:scale-105 transition-transform border border-emerald-400">
                <Coins size={22} />
              </button>
              <div className="text-left font-sans">
                <h2 className="text-xl font-bold uppercase tracking-tight text-emerald-800 flex items-center gap-2">
                  Bảng Kê Tiền Mới
                  <span className="text-[10px] font-bold text-emerald-700 bg-white border border-emerald-250 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {isNewMoneyCollapsed ? "Nhấp Để Mở" : "Thu Gọn"}
                  </span>
                </h2>
                <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Danh sách phân bổ mệnh giá tiền mặt chi tiết</p>
              </div>
           </div>
           
           <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2 bg-emerald-100/50 p-2 px-3 rounded-xl border border-emerald-200 shadow-2xs">
                <div className="text-right">
                  <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Bộ quỹ dự phòng</p>
                  <p className="text-sm font-black text-emerald-800">{formatCurrency(totalNewMoneyVND, 'VND')}</p>
                </div>
              </div>

              {hasUnsavedNewMoneyChanges && (
                <div className="flex items-center gap-2 bg-rose-50 p-2 px-3 rounded-xl border border-rose-200 animate-pulse">
                  <div className="text-right">
                    <p className="text-[8px] font-bold text-rose-600 uppercase tracking-widest">Chưa lưu mới</p>
                    <p className="text-sm font-black text-rose-700">{formatCurrency(liveNewMoneyVND, 'VND')}</p>
                  </div>
                </div>
              )}
              
              <div className="p-1 px-1.5 text-emerald-700 bg-[#e6f4ea] rounded-lg group-hover:bg-emerald-100 transition-all border border-emerald-250">
                {isNewMoneyCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </div>
           </div>
        </div>

        {!isNewMoneyCollapsed && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">

        <div className="bg-white/50 sketch-border p-4 rounded-xl overflow-hidden mb-6">
          <div className="overflow-x-auto max-w-full">
            <table className="min-w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-500/10 text-[9px] font-black uppercase tracking-widest text-[#065f46] border-b-2 border-emerald-500">
                  <th className="px-4 py-3 font-black">Mệnh giá VND</th>
                  <th className="px-4 py-3 text-center font-black w-44">Số lượng</th>
                  <th className="px-4 py-3 text-right font-black">Thành tiền</th>
                  <th className="px-4 py-3 text-center font-black w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="font-sans divide-y divide-emerald-500/10">
                {VND_DENOMINATIONS.map(den => {
                  const currentAsset = assets.find(a => a.isNewMoney && a.denomination === den);
                  const isModifiedLocally = bulkCash[den] !== undefined;
                  const val = isModifiedLocally ? bulkCash[den] : (currentAsset?.quantity || 0);

                  return (
                    <tr 
                      key={den} 
                      className={cn(
                        "transition-colors hover:bg-emerald-50/45", 
                        val > 0 ? "bg-emerald-50/15 font-bold" : "opacity-60"
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
                            className="w-16 text-center font-bold text-emerald-700 bg-white border border-ink/15 rounded-lg py-1 outline-none focus:border-emerald-500 text-xs shadow-inner"
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
                      <td className="px-4 py-3 text-right font-mono font-black text-emerald-700 text-sm whitespace-nowrap">
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
       )}
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
            disabled={Object.values(bulkCurrentCash).reduce((sum: number, v: any) => sum + Number(v || 0), 0) === 0}
            className={cn(
              "sketch-button text-xs py-2 px-6 font-bold uppercase tracking-widest shrink-0 transition-all font-sans",
              Object.values(bulkCurrentCash).reduce((sum: number, v: any) => sum + Number(v || 0), 0) === 0 
                ? "text-ink/20 cursor-not-allowed border-ink/5" 
                : "text-crimson hover:bg-crimson/5 border-crimson hover:border-crimson cursor-pointer"
            )}
          >
            Đặt lại toàn bộ về 0
          </button>
        </div>
      </div>
      </>)}

      {/* COMPONENT SYNC BẢNG KÊ CHI TIÊU & DOANH THU TỪ HOME */}
      {activeTab === "cards-liabilities" && (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-2 w-full animate-in fade-in slide-in-from-bottom-4 mb-8">
        {/* LEFT CARD: BẢNG KÊ CHI TIÊU THẺ TÍN DỤNG */}
        <div className="bg-white p-6 rounded-2xl border-2 border-ink shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] space-y-4 text-left">
          <div 
            onClick={() => setIsBulkCardSpendsCollapsed(!isBulkCardSpendsCollapsed)}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-[#3b82f6] pb-2.5 gap-2 cursor-pointer group select-none"
          >
            <div className="flex items-center gap-2 text-left w-full sm:w-auto">
              <span className="p-2 bg-[#dbeafe] rounded-xl text-[#1e40af] border border-blue-250 group-hover:scale-105 transition-transform shrink-0">
                <CreditCard size={18} className="animate-pulse" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-tight text-[#1e40af] font-sans flex flex-wrap items-center gap-1.5 leading-tight">
                  <span>Bảng Kê Chi Tiêu Thẻ Tín Dụng</span>
                  <span className="text-[9px] font-bold text-blue-700 bg-blue-100/60 border border-blue-200 px-1.5 py-0.5 rounded tracking-wider whitespace-nowrap">
                    {isBulkCardSpendsCollapsed ? "Nhấp Để Mở" : "Thu Gọn"}
                  </span>
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
              {!isBulkCardSpendsCollapsed && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setBulkCardSpends([...bulkCardSpends, {
                        id: Date.now(),
                        name: new Date().toISOString().split("T")[0],
                        amount: "",
                        notes: ""
                      }]);
                    }}
                    className="px-2.5 py-1 text-[10px] bg-blue-50 text-blue-700 rounded-lg border border-blue-200 uppercase font-black tracking-widest hover:bg-[#1e40af] hover:text-white transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={10} /> Thêm Dòng
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Reset toàn bộ bảng kê chi tiêu thẻ tín dụng?")) {
                        setBulkCardSpends([]);
                      }
                    }}
                    className="px-2.5 py-1 text-[10px] bg-red-50 text-crimson rounded-lg border border-red-200 uppercase font-black tracking-widest hover:bg-crimson hover:text-white transition-all cursor-pointer"
                  >
                    Reset
                  </button>
                </>
              )}
              {isBulkCardSpendsCollapsed && (
                <div className="text-[10px] bg-blue-100/40 text-blue-800 px-2 py-1 rounded font-mono font-bold">
                  Tổng: {(() => {
                    const total = bulkCardSpends.reduce((sum, d) => sum + parseFloat(d.amount.replace(/,/g, '') || "0"), 0);
                    return total.toLocaleString("vi-VN") + " đ";
                  })()}
                </div>
              )}
              <div 
                className="p-1 text-blue-600 bg-blue-50 rounded group-hover:bg-blue-100 transition-all cursor-pointer shrink-0"
                onClick={() => setIsBulkCardSpendsCollapsed(!isBulkCardSpendsCollapsed)}
              >
                {isBulkCardSpendsCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </div>
            </div>
          </div>

          {!isBulkCardSpendsCollapsed && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="w-full overflow-x-auto sm:overflow-visible scrollbar-none sm:scrollbar-thin">
                <table className="w-full text-left border-collapse text-xs table-fixed sm:table-auto">
                  <thead>
                    <tr className="bg-blue-100/50 text-[#1e40af] font-bold uppercase tracking-wider text-[9px]">
                      <th className="px-1.5 sm:px-3 py-2 w-[95px] sm:w-32 border border-blue-100">
                        <span className="hidden sm:inline">Ngày / Tên</span>
                        <span className="inline sm:hidden">Ngày</span>
                      </th>
                      <th className="px-1.5 sm:px-3 py-2 w-[100px] sm:w-40 border border-blue-100">
                        <span className="hidden sm:inline">Số Tiền (VND)</span>
                        <span className="inline sm:hidden">Số Tiền</span>
                      </th>
                      <th className="px-1.5 sm:px-3 py-2 border border-blue-100">Ghi Chú</th>
                      <th className="px-1 sm:py-2 w-8 sm:w-10 text-center border border-blue-100">Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkCardSpends.map((item, index) => (
                      <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="p-0.5 sm:p-1 border border-blue-100/50">
                          <div className="flex items-center justify-between gap-0.5 px-1 sm:px-2.5 py-0.5 sm:py-1 text-left relative">
                            <span className="text-[11px] sm:text-xs font-black text-blue-950 font-mono">
                              {formatDateDot(item.name)}
                            </span>
                            <div className="relative w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shrink-0 hover:bg-blue-100 rounded transition-all cursor-pointer">
                              <CalendarIcon className="text-blue-500 cursor-pointer w-3 h-3 sm:w-[12px] sm:h-[12px]" />
                              <input
                                type="date"
                                value={item.name}
                                onChange={(e) => {
                                  const updated = [...bulkCardSpends];
                                  updated[index].name = e.target.value;
                                  setBulkCardSpends(updated);
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-0.5 sm:p-1 border border-blue-100/50">
                          <input
                            type="text"
                            placeholder="Số tiền"
                            value={
                              item.amount === "-" 
                                ? "-" 
                                : item.amount 
                                  ? Number(item.amount.replace(/[^0-9-]/g, "")).toLocaleString("vi-VN") 
                                  : ""
                            }
                            onChange={(e) => {
                              const cleanVal = e.target.value.replace(/[^0-9-]/g, "");
                              if (!cleanVal) {
                                const updated = [...bulkCardSpends];
                                updated[index].amount = "";
                                setBulkCardSpends(updated);
                                return;
                              }
                              if (cleanVal === "-") {
                                const updated = [...bulkCardSpends];
                                updated[index].amount = "-";
                                setBulkCardSpends(updated);
                                return;
                              }
                              const isNeg = cleanVal.startsWith("-");
                              const digits = cleanVal.replace("-", "");
                              const parsedVal = parseInt(digits, 10);
                              if (!isNaN(parsedVal)) {
                                const formatted = (isNeg ? "-" : "") + parsedVal.toLocaleString('en-US');
                                const updated = [...bulkCardSpends];
                                updated[index].amount = formatted;
                                setBulkCardSpends(updated);
                              }
                            }}
                            className="w-full px-1 sm:px-2 py-1 sm:py-1.5 text-[11px] sm:text-xs bg-transparent text-right font-bold text-indigo-950 focus:outline-none focus:bg-white rounded"
                          />
                        </td>
                        <td className="p-0.5 sm:p-1 border border-blue-100/50">
                          <input
                            type="text"
                            placeholder="Chi tiết chi tiêu..."
                            value={item.notes || ""}
                            onChange={(e) => {
                              const updated = [...bulkCardSpends];
                              updated[index].notes = e.target.value;
                              setBulkCardSpends(updated);
                            }}
                            className="w-full px-1 sm:px-2 py-1 sm:py-1.5 text-[11px] sm:text-xs bg-transparent text-left text-blue-900 focus:outline-none focus:bg-white rounded"
                          />
                        </td>
                        <td className="p-0.5 sm:p-1 border border-blue-100/50 text-center">
                          <button
                            onClick={() => {
                              const updated = bulkCardSpends.filter((_, i) => i !== index);
                              setBulkCardSpends(updated);
                            }}
                            className="p-1 text-rose-300 hover:text-crimson hover:bg-rose-50 rounded transition-colors mx-auto"
                            title="Xóa hàng"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {bulkCardSpends.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center p-4 text-[10px] text-blue-400 italic">
                          Dữ liệu trống. Nhấp "Thêm Dòng" để tạo bảng kê mới.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sum footer */}
              <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-150">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-800">Tổng chi tiêu thẻ:</span>
                <span className="text-sm font-black text-[#1e40af] font-mono">
                  {(() => {
                    const total = bulkCardSpends.reduce((sum, d) => sum + parseFloat(d.amount.replace(/,/g, '') || "0"), 0);
                    return total.toLocaleString("vi-VN") + " đ";
                  })()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT CARD: DOANH THU */}
        <div className="bg-white p-6 rounded-2xl border-2 border-ink shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] space-y-4 text-left">
          <div 
            onClick={() => setIsBulkDebtsCollapsed(!isBulkDebtsCollapsed)}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-[#10b981] pb-2.5 gap-2 cursor-pointer group select-none"
          >
            <div className="flex items-center gap-2 text-left w-full sm:w-auto">
              <span className="p-2 bg-[#d1fae5] rounded-xl text-[#065f46] border border-emerald-250 group-hover:scale-105 transition-transform shrink-0">
                <Receipt size={18} className="animate-pulse" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-tight text-[#065f46] font-sans flex flex-wrap items-center gap-1.5 leading-tight">
                  <span>Doanh Thu</span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/60 border border-emerald-200 px-1.5 py-0.5 rounded tracking-wider whitespace-nowrap">
                    {isBulkDebtsCollapsed ? "Nhấp Để Mở" : "Thu Gọn"}
                  </span>
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
              {!isBulkDebtsCollapsed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Đặt lại toàn bộ bảng kê doanh thu tuần này?")) {
                      setBulkDebts(bulkDebts.map(item => ({ ...item, amount: "", notes: "" })));
                    }
                  }}
                  className="px-2.5 py-1 text-[10px] bg-red-50 text-crimson rounded-lg border border-red-200 uppercase font-black tracking-widest hover:bg-crimson hover:text-white transition-all cursor-pointer"
                >
                  Reset tuần
                </button>
              )}
              {isBulkDebtsCollapsed && (
                <div className="text-[10px] bg-emerald-100/40 text-emerald-800 px-2 py-1 rounded font-mono font-bold">
                  Tổng: {(() => {
                    const total = bulkDebts.reduce((sum, d) => sum + parseFloat(d.amount.replace(/,/g, '') || "0"), 0);
                    return (total > 0 ? "+" : "") + total.toLocaleString("vi-VN") + " đ";
                  })()}
                </div>
              )}
              <div 
                className="p-1 text-emerald-600 bg-emerald-50 rounded group-hover:bg-emerald-100 transition-all cursor-pointer shrink-0"
                onClick={() => setIsBulkDebtsCollapsed(!isBulkDebtsCollapsed)}
              >
                {isBulkDebtsCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </div>
            </div>
          </div>

          {!isBulkDebtsCollapsed && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="w-full overflow-x-auto sm:overflow-visible scrollbar-none sm:scrollbar-thin">
                <table className="w-full text-left border-collapse text-xs table-fixed sm:table-auto">
                  <thead>
                    <tr className="bg-emerald-100/50 text-[#065f46] font-bold uppercase tracking-wider text-[9px]">
                      <th className="px-1.5 sm:px-3 py-2 w-[95px] sm:w-32 border border-emerald-100">
                        <span className="hidden sm:inline">Ngày / Tên</span>
                        <span className="inline sm:hidden">Ngày</span>
                      </th>
                      <th className="px-1.5 sm:px-3 py-2 w-[100px] sm:w-40 border border-emerald-100">
                        <span className="hidden sm:inline">Số Tiền (VND)</span>
                        <span className="inline sm:hidden">Số Tiền</span>
                      </th>
                      <th className="px-1.5 sm:px-3 py-2 border border-emerald-100">Ghi Chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkDebts.map((item, index) => {
                      return (
                        <tr key={item.id} className="hover:bg-emerald-50/50 transition-colors">
                          <td className="p-0.5 sm:p-1 border border-emerald-100/50">
                            <div className="flex items-center justify-between gap-0.5 px-1 sm:px-2.5 py-0.5 sm:py-1 text-left relative">
                              <span className="text-[11px] sm:text-xs font-black text-emerald-950 font-mono">
                                {formatDateDot(item.name)}
                              </span>
                              <div className="relative w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shrink-0 hover:bg-emerald-100 rounded transition-all cursor-pointer">
                                <CalendarIcon className="text-emerald-500 cursor-pointer w-3 h-3 sm:w-[12px] sm:h-[12px]" />
                                <input
                                  type="date"
                                  value={item.name}
                                  onChange={(e) => {
                                    const updated = [...bulkDebts];
                                    updated[index].name = e.target.value;
                                    setBulkDebts(updated);
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-0.5 sm:p-1 border border-emerald-100/50">
                            <input
                              type="text"
                              placeholder="Số tiền"
                              value={
                                item.amount === "-" 
                                  ? "-" 
                                  : item.amount 
                                    ? Number(item.amount.replace(/[^0-9-]/g, "")).toLocaleString("vi-VN") 
                                    : ""
                              }
                              onChange={(e) => {
                                const cleanVal = e.target.value.replace(/[^0-9-]/g, "");
                                if (!cleanVal) {
                                  const updated = [...bulkDebts];
                                  updated[index].amount = "";
                                  setBulkDebts(updated);
                                  return;
                                }
                                if (cleanVal === "-") {
                                  const updated = [...bulkDebts];
                                  updated[index].amount = "-";
                                  setBulkDebts(updated);
                                  return;
                                }
                                const isNeg = cleanVal.startsWith("-");
                                const digits = cleanVal.replace("-", "");
                                const parsedVal = parseInt(digits, 10);
                                if (!isNaN(parsedVal)) {
                                  const formatted = (isNeg ? "-" : "") + parsedVal.toLocaleString('en-US');
                                  const updated = [...bulkDebts];
                                  updated[index].amount = formatted;
                                  setBulkDebts(updated);
                                }
                              }}
                              className="w-full px-1 sm:px-2 py-1 sm:py-1.5 text-[11px] sm:text-xs bg-transparent text-right font-bold text-emerald-950 focus:outline-none focus:bg-white rounded"
                            />
                          </td>
                          <td className="p-0.5 sm:p-1 border border-emerald-100/50">
                            <input
                              type="text"
                              placeholder="Nội dung..."
                              value={item.notes || ""}
                              onChange={(e) => {
                                const updated = [...bulkDebts];
                                updated[index].notes = e.target.value;
                                setBulkDebts(updated);
                              }}
                              className="w-full px-1 sm:px-2 py-1 sm:py-1.5 text-[11px] sm:text-xs bg-transparent text-left focus:outline-none focus:bg-white rounded"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Sum footer */}
              <div className="flex flex-col gap-2 bg-[#f4fbf7] p-3 rounded-xl border border-emerald-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">Tổng:</span>
                  <span className={`text-sm font-black font-mono ${(() => {
                    const total = bulkDebts.reduce((sum, d) => sum + parseFloat(d.amount.replace(/,/g, '') || "0"), 0);
                    return total > 0 ? "text-amber-700" : total < 0 ? "text-emerald-700" : "text-slate-500";
                  })()}`}>
                    {(() => {
                      const total = bulkDebts.reduce((sum, d) => sum + parseFloat(d.amount.replace(/,/g, '') || "0"), 0);
                      return (total > 0 ? "+" : "") + total.toLocaleString("vi-VN");
                    })()} đ
                  </span>
                </div>

                <div className="text-[10px] text-emerald-800/80 border-t border-[#10b981]/20 pt-1.5 leading-relaxed font-sans">
                  {(() => {
                    const total = bulkDebts.reduce((sum, d) => sum + parseFloat(d.amount.replace(/,/g, '') || "0"), 0);
                    if (total < 0) {
                      const abs = Math.abs(total);
                      return (
                        <span className="text-emerald-800 font-medium">
                          📈 <strong>Số dư âm (-{abs.toLocaleString("vi-VN")} đ)</strong>: Chuyển thành khoản khách hàng mượn nợ <strong>Cho vay doanh thu</strong> trị giá <code>+{abs.toLocaleString("vi-VN")} đ</code> (cộng thêm tài sản ròng).
                        </span>
                      );
                    } else {
                      return "💡 Nhập số tiền hàng ngày. Tiền dương là khoản nợ, tiền âm (-) là khoản cho vay.";
                    }
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* --- PHÂN KHÚC DỰ TÍNH TIỀN LƯƠNG & DỰ CHI --- */}
      {activeTab === "budget" && (
      <div className="mt-2 animate-in fade-in slide-in-from-bottom-4 border-t-2 border-dashed border-ink/20 pt-6 font-sans">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 border-b-2 border-ink/10 pb-4 gap-4 font-sans">
           <div className="flex items-center gap-3">
              <button className="p-2 bg-ink/5 hover:bg-ink/10 text-ink rounded-xl border border-ink/15">
                <Briefcase size={18} />
              </button>
              <div className="text-left font-sans">
                <h2 className="text-lg font-black uppercase tracking-tight text-ink font-sans">Dự tính lương & Kế hoạch chi tiêu</h2>
                <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest font-sans">Lập ngân sách chủ động trước khi nhận lương</p>
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
      )}

      {activeTab === "register" && filteredAssets.length === 0 && (
        <div className="text-center py-20 opacity-30">
          <Wallet size={48} className="mx-auto mb-4" />
          <p className="font-hand text-xl">Không tìm thấy tài sản nào</p>
        </div>
      )}
    </div>
  );
}
