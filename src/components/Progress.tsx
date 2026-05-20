import React, { useState, useEffect } from "react";
import type { Word, Task, LogEntry, WishlistItem, StudyGoal, FoodPlace, ContentIdea, Asset, VideoDictation, PracticeParagraph, CustomSentence, Achievement } from "@/types";
import { BookA, CheckSquare, CalendarDays, Target, ShieldAlert, BadgeInfo, Download, Upload, RefreshCw, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";

export function Progress({
  words, setWords,
  tasks, setTasks,
  logs, setLogs,
  wishlist, setWishlist,
  goals = [], setGoals,
  foodPlaces = [], setFoodPlaces,
  contentIdeas = [], setContentIdeas,
  assets = [], setAssets,
  dictations = [], setDictations,
  practiceParagraphs = [], setPracticeParagraphs,
  customSentences = [], setCustomSentences,
  achievements = [], setAchievements,
}: {
  words: Word[];
  setWords?: (items: Word[]) => void;
  tasks: Task[];
  setTasks?: (items: Task[]) => void;
  logs: LogEntry[];
  setLogs?: (items: LogEntry[]) => void;
  wishlist: WishlistItem[];
  setWishlist?: (items: WishlistItem[]) => void;
  goals?: StudyGoal[];
  setGoals?: (items: StudyGoal[]) => void;
  foodPlaces?: FoodPlace[];
  setFoodPlaces?: (items: FoodPlace[]) => void;
  contentIdeas?: ContentIdea[];
  setContentIdeas?: (items: ContentIdea[]) => void;
  assets?: Asset[];
  setAssets?: (items: Asset[]) => void;
  dictations?: VideoDictation[];
  setDictations?: (items: VideoDictation[]) => void;
  practiceParagraphs?: PracticeParagraph[];
  setPracticeParagraphs?: (items: PracticeParagraph[]) => void;
  customSentences?: CustomSentence[];
  setCustomSentences?: (items: CustomSentence[]) => void;
  achievements?: Achievement[];
  setAchievements?: (items: Achievement[]) => void;
}) {
  const masteredWords = words.filter(w => w.difficulty === 1).length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const completedGoals = goals.filter(g => g.isCompleted).length;

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedBackups, setDetectedBackups] = useState<any[]>([]);

  useEffect(() => {
    const detect = () => {
      const backupKeys = [
        { key: 'spatial_hub_words', label: 'Từ vựng (Vocab)', current: words, setterName: 'setWords' },
        { key: 'spatial_hub_tasks', label: 'Nhiệm vụ (Tasks)', current: tasks, setterName: 'setTasks' },
        { key: 'spatial_hub_wishlist', label: 'Danh Sách Ước (Wishlist)', current: wishlist, setterName: 'setWishlist' },
        { key: 'spatial_hub_logs', label: 'Nhật ký (Logs)', current: logs, setterName: 'setLogs' },
        { key: 'spatial_hub_places', label: 'Địa điểm ăn uống (Food Places)', current: foodPlaces, setterName: 'setFoodPlaces' },
        { key: 'spatial_hub_content_ideas', label: 'Ý tưởng nội dung (Ideas)', current: contentIdeas, setterName: 'setContentIdeas' },
        { key: 'spatial_hub_assets', label: 'Tài sản (Assets)', current: assets, setterName: 'setAssets' },
        { key: 'spatial_hub_dictations', label: 'Chép chính tả (Dictation)', current: dictations, setterName: 'setDictations' },
        { key: 'spatial_hub_practice_paragraphs', label: 'Đoạn luyện dịch đối chiếu (Paragraphs)', current: practiceParagraphs, setterName: 'setPracticeParagraphs' },
        { key: 'spatial_hub_custom_sentences', label: 'Câu luyện dịch (Sentences)', current: customSentences, setterName: 'setCustomSentences' },
        { key: 'spatial_hub_study_goals', label: 'Mục tiêu (Goals)', current: goals, setterName: 'setGoals' },
        { key: 'spatial_hub_achievements', label: 'Thành tựu (Achievements)', current: achievements, setterName: 'setAchievements' },
      ];

      const found: any[] = [];
      backupKeys.forEach(info => {
        try {
          const raw = localStorage.getItem(info.key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              found.push({
                key: info.key,
                label: info.label,
                data: parsed,
                setterName: info.setterName,
                current: info.current,
              });
            }
          }
        } catch (e) {}
      });
      setDetectedBackups(found);
    };
    detect();
  }, [words, tasks, wishlist, logs, foodPlaces, contentIdeas, assets, dictations, practiceParagraphs, customSentences, goals, achievements]);

  const handleMergeItem = async (detected: any) => {
    setErrorMessage(null);
    setStatusMessage(null);

    const current = detected.current;
    const setterMap: Record<string, any> = {
      setWords, setTasks, setLogs, setWishlist, setGoals, setFoodPlaces, setContentIdeas, setAssets, setDictations, setPracticeParagraphs, setCustomSentences, setAchievements
    };
    const setter = setterMap[detected.setterName];
    if (!setter) {
      setErrorMessage("Ứng dụng chưa được cấu hình đầy đủ để phục hồi phần này.");
      return;
    }

    try {
      const existingIds = new Set(current.map((x: any) => x.id));
      const newItems = detected.data.filter((x: any) => x.id && !existingIds.has(x.id));
      
      if (newItems.length > 0) {
        await setter([...current, ...newItems]);
        setStatusMessage(`🎉 Khôi phục sáp nhập thành công ${newItems.length} mục '${detected.label}' mới từ bộ nhớ thiết bị của bạn lên đám mây!`);
      } else {
        setStatusMessage(`✅ Toàn bộ dữ liệu '${detected.label}' này đã có khớp trên đám mây của bạn (0 mục mới cần thêm).`);
      }
    } catch (err: any) {
      setErrorMessage("Có lỗi xảy ra: " + err.message);
    }
  };

  const handleDownloadBackup = () => {
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const backup = {
        words, tasks, wishlist, logs, foodPlaces, contentIdeas, assets, dictations, practiceParagraphs, customSentences, studyGoals: goals, achievements
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spatial_hub_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setStatusMessage("💾 Đã tải bộ sao lưu (JSON) của toàn bộ 12 mục dữ liệu thành công! Hãy lưu giữ tệp này an toàn.");
    } catch (err: any) {
      setErrorMessage("Lỗi tạo bản sao lưu: " + err.message);
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setStatusMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const backup = JSON.parse(text);
        let restoreCount = 0;

        const setters: Record<string, { current: any[], set: any }> = {
          words: { current: words, set: setWords },
          tasks: { current: tasks, set: setTasks },
          wishlist: { current: wishlist, set: setWishlist },
          logs: { current: logs, set: setLogs },
          foodPlaces: { current: foodPlaces, set: setFoodPlaces },
          contentIdeas: { current: contentIdeas, set: setContentIdeas },
          assets: { current: assets, set: setAssets },
          dictations: { current: dictations, set: setDictations },
          practiceParagraphs: { current: practiceParagraphs, set: setPracticeParagraphs },
          customSentences: { current: customSentences, set: setCustomSentences },
          studyGoals: { current: goals, set: setGoals },
          achievements: { current: achievements, set: setAchievements },
        };

        for (const [key, config] of Object.entries(setters)) {
          if (backup[key] && Array.isArray(backup[key]) && config.set) {
            const existingIds = new Set(config.current.map(x => x.id));
            const newItems = backup[key].filter((x: any) => x.id && !existingIds.has(x.id));
            if (newItems.length > 0) {
              await config.set([...config.current, ...newItems]);
              restoreCount += newItems.length;
            }
          }
        }

        setStatusMessage(`🚀 Sáp nhập thành công ${restoreCount} lịch sử dữ liệu mới từ tệp backup của bạn vào đám mây!`);
      } catch (err: any) {
        setErrorMessage("Lỗi xử lý file sao lưu. Đảm bảo đây đúng là tệp backup JSON hợp lệ.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8 font-sans">
      
      {/* 4 Core Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="sketch-border p-6 bg-white/40 flex flex-col items-center text-center gap-3 shadow-sm">
          <BookA size={32} className="text-crimson animate-pulse" />
          <h2 className="text-3xl font-sans font-black text-ink">{words.length}</h2>
          <p className="hand-text text-lg">Từ vựng đã lưu</p>
          <div className="mt-2 pt-2 border-t border-ink/10 w-full text-[9px] font-sans font-bold uppercase tracking-widest text-ink/50">
            {masteredWords} Thành thạo (Mastered)
          </div>
        </div>

        <div className="sketch-border p-6 bg-white/40 flex flex-col items-center text-center gap-3 shadow-sm">
          <Target size={32} className="text-emerald-700" />
          <h2 className="text-3xl font-sans font-black text-ink">{completedGoals}</h2>
          <p className="hand-text text-lg">Mục tiêu học tập</p>
          <div className="mt-2 pt-2 border-t border-ink/10 w-full text-[9px] font-sans font-bold uppercase tracking-widest text-ink/50">
            Đạt {completedGoals} trên {goals.length} mục tiêu
          </div>
        </div>

        <div className="sketch-border p-6 bg-white/40 flex flex-col items-center text-center gap-3 shadow-sm">
          <CheckSquare size={32} className="text-blue-700" />
          <h2 className="text-3xl font-sans font-black text-ink">{completedTasks}</h2>
          <p className="hand-text text-lg">Nhiệm vụ hàng ngày</p>
          <div className="mt-2 pt-2 border-t border-ink/10 w-full text-[9px] font-sans font-bold uppercase tracking-widest text-ink/50">
            Đã xong {completedTasks} / {tasks.length}
          </div>
        </div>

        <div className="sketch-border p-6 bg-white/40 flex flex-col items-center text-center gap-3 shadow-sm">
          <CalendarDays size={32} className="text-indigo-700" />
          <h2 className="text-3xl font-sans font-black text-ink">{logs.length}</h2>
          <p className="hand-text text-lg">Nhật ký (Reflections)</p>
          <div className="mt-2 pt-2 border-t border-ink/10 w-full text-[9px] font-sans font-bold uppercase tracking-widest text-ink/50">
            Hãy tiếp tục rèn luyện!
          </div>
        </div>
      </div>

      {/* Main Rescue and Recovery Panel */}
      <div className="sketch-border bg-white/95 p-6 sm:p-8 shadow-md relative overflow-hidden">
        
        {/* Design accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-crimson/5 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-dashed border-ink/15 pb-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-crimson/5 text-crimson rounded-xl sketch-border-sm mt-1 shrink-0">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-ink tracking-tight flex items-center gap-2">
                Trợ thủ Khôi phục Dữ liệu
                <span className="bg-amber-100 text-amber-800 text-[10px] px-2.5 py-0.5 rounded-full tracking-wider font-extrabold uppercase animate-pulse">
                  Data Savior Suite
                </span>
              </h3>
              <p className="text-xs text-ink/65 mt-1 leading-normal max-w-2xl">
                Cung cấp các công cụ khôi phục dữ liệu ngoại tuyến, tự động quét bộ nhớ đệm trình duyệt, sáp nhập tài khoản và tự tạo tệp sao lưu vật lý dự phòng.
              </p>
            </div>
          </div>
        </div>

        {/* Message statuses */}
        {statusMessage && (
          <div className="bg-emerald-50 border-2 border-emerald-500/40 text-emerald-800 rounded-xl p-4 text-sm leading-normal flex items-start gap-2.5 mb-6 animate-in slide-in-from-top-2">
            <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-600" size={18} />
            <div className="flex-1 font-medium">{statusMessage}</div>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border-2 border-red-500/40 text-crimson rounded-xl p-4 text-sm leading-normal flex items-start gap-2.5 mb-6 animate-in slide-in-from-top-2">
            <AlertCircle className="shrink-0 mt-0.5 text-crimson" size={18} />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Section 1: Memory Scan (Local Storage Backups) */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-ink flex items-center gap-1.5 opacity-80">
              <RefreshCw size={16} className="text-amber-600 animate-[spin_5s_linear_infinite]" /> Quét bộ nhớ đệm thiết bị
            </h4>
            <p className="text-xs text-ink/60 leading-normal">
              Khi bạn đăng xuất hoặc mất kết nối ngoại tuyến, trình duyệt có thể giữ các bản lưu cũ làm đệm. Bấm "Cứu hộ Sáp nhập" để tích hợp an toàn dữ liệu này lên đám mây của tài khoản lúc này:
            </p>

            {detectedBackups.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {detectedBackups.map((bk, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#faf9f5] sketch-border-sm hover:bg-[#fffff8] transition-colors gap-3">
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-ink block truncate">{bk.label}</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 font-bold px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-1">
                        ✨ Phát hiện: {bk.data.length} bản ghi dự phòng
                      </span>
                    </div>
                    <button
                      onClick={() => handleMergeItem(bk)}
                      className="sketch-button bg-ink text-white border-ink hover:bg-crimson hover:border-crimson hover:text-white px-3 py-1.5 text-xs text-nowrap whitespace-nowrap"
                    >
                      Cứu hộ Sáp nhập
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#faf9f5] border-2 border-dashed border-ink/15 rounded-xl p-6 text-center space-y-2">
                <Sparkles size={24} className="mx-auto text-ink/30" />
                <p className="font-bold text-xs text-ink/50">Trình duyệt này đã được đồng bộ sạch sẽ!</p>
                <p className="text-[10px] text-ink/40 max-w-sm mx-auto leading-normal">
                  Không phát hiện tệp dữ liệu mồ côi nào trong Local Storage của trình duyệt hiện tại.
                </p>
              </div>
            )}
          </div>

          {/* Section 2: JSON Backup & Import */}
          <div className="lg:col-span-5 space-y-6 lg:border-l lg:border-dashed lg:border-ink/15 lg:pl-8">
            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-ink flex items-center gap-1.5 opacity-80">
                <Download size={16} className="text-indigo-600" /> Tải bản sao lưu (Backup)
              </h4>
              <p className="text-xs text-ink/65 leading-normal">
                Cách bảo mật dữ liệu tuyệt đối 100%: Tải ngay file backup chứa toàn bộ 12 bảng nội dung tài sản, từ vựng, nhật ký của bạn về máy.
              </p>
              <button
                onClick={handleDownloadBackup}
                className="w-full sketch-button sketch-button-primary py-2 px-4 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors uppercase tracking-wider"
              >
                <Download size={14} /> Tải bản sao lưu .json
              </button>
            </div>

            <div className="space-y-4 pt-4 border-t border-dashed border-ink/15">
              <h4 className="font-bold text-sm uppercase tracking-wider text-ink flex items-center gap-1.5 opacity-80">
                <Upload size={16} className="text-indigo-600" /> Nhập bản sao lưu (Restore)
              </h4>
              <p className="text-xs text-ink/65 leading-normal">
                Sáp nhập dữ liệu từ file backup .json đã lưu trước đây vào đám mây của tài khoản lúc này:
              </p>
              
              <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-ink/20 rounded-xl px-4 py-6 bg-[#faf9f5] cursor-pointer hover:bg-white transition-colors text-center group">
                <Upload size={20} className="text-ink/40 group-hover:text-ink transition-colors mb-2" />
                <span className="text-xs font-bold text-ink/80 block">Chọn tệp sao lưu JSON từ máy...</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">(Hệ thống sẽ chỉ nạp bù các mục chưa có)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>

        </div>

        {/* Informative advice */}
        <div className="bg-amber-50/50 border border-amber-500/15 rounded-xl p-4 mt-8 flex gap-3 text-xs text-ink/80 leading-relaxed">
          <BadgeInfo size={18} className="text-amber-700 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold text-amber-800">💡 Giải thích lý do mất dữ liệu:</span>
            <p className="mt-1">
              Do chế độ bảo mật kép của Firebase Firestore, dữ liệu đồng bộ đám mây được phân tách bảo mật tuyệt đối cho từng Tài khoản. Nếu bạn đăng xuất và đăng nhập lại bằng một tên mới hoặc sai lệch từng chữ cái viết hoa/khoảng trắng, bạn sẽ thấy ứng dụng của mình bị trống rỗng hoàn toàn vì bạn đang ở trong một tài khoản mới tinh! Hãy dùng lịch sử đăng nhập ở mục Đăng nhập để truy cập tài khoản cũ chứa dữ liệu hoặc sử dụng suite cứu hộ này để phục hồi.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
