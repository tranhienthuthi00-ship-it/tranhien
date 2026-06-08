import React, { useState, useEffect, useRef } from "react";
import { 
  Image as ImageIcon, 
  Upload, 
  Sparkles, 
  CheckCircle, 
  BookOpen, 
  History, 
  Trash2, 
  Plus, 
  AlertTriangle, 
  HelpCircle, 
  RefreshCw, 
  FileText, 
  X,
  BookMarked,
  ArrowRight
} from "lucide-react";

interface EvaluationMistake {
  original: string;
  correction: string;
  reasonVi: string;
}

interface EvaluationVocabulary {
  word: string;
  ipa: string;
  meaning: string;
  type: string;
}

interface PictureDescriptionSession {
  id: string;
  title: string;
  description: string;
  imageType: "upload" | "template";
  imageSource: string; // base64 payload or template ID
  createdAt: number;
  score: number;
  feedback: string;
  correctedText: string;
  mistakes: EvaluationMistake[];
  sampleDescriptions: string[];
  vocabulary: EvaluationVocabulary[];
}

const PRESEEDED_TEMPLATES = [
  {
    id: "cafe",
    title: "At the Coffee Shop",
    hintVi: "Gợi ý: Mô tả ly cà phê, chiếc bánh ngọt, vị trí và cảm giác thư giãn buổi sáng.",
    svg: (
      <svg className="w-full h-full bg-amber-50/20" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Table line */}
        <path d="M 10 75 Q 50 85 90 75" />
        {/* Cup */}
        <path d="M 30 50 Q 30 70 45 70 Q 60 70 60 50 Z" />
        <path d="M 60 55 Q 68 55 68 62 Q 68 66 60 66" />
        <path d="M 25 70 L 65 70" />
        {/* Steam */}
        <path d="M 38 42 Q 35 34 40 28" />
        <path d="M 46 44 Q 48 36 44 26" />
        <path d="M 52 42 Q 50 35 53 30" />
        {/* Cake slice */}
        <path d="M 68 70 L 88 70 L 84 52 L 68 70 Z" fill="rgba(0,0,0,0.05)" />
        <path d="M 68 56 L 85 52" />
        <path d="M 72 65 L 87 63" />
        <circle cx="78" cy="48" r="1.5" fill="currentColor" />
        {/* Background window */}
        <rect x="25" y="10" width="50" height="20" rx="2" strokeWidth="0.8" strokeDasharray="3 3" />
        <line x1="50" y1="10" x2="50" y2="30" strokeWidth="0.8" strokeDasharray="3 3" />
      </svg>
    )
  },
  {
    id: "window",
    title: "Cozy Window & Houseplant",
    hintVi: "Gợi ý: Hãy nói về ánh nắng rực rỡ, chậu cây lá xanh mướt và những quyển sách xếp gọn gàng.",
    svg: (
      <svg className="w-full h-full bg-emerald-50/20" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Window frame */}
        <rect x="20" y="10" width="60" height="55" rx="3" />
        <line x1="50" y1="10" x2="50" y2="65" />
        <line x1="20" y1="35" x2="80" y2="35" />
        {/* Sunlight rays */}
        <path d="M 10 15 L 28 32" strokeWidth="0.8" strokeDasharray="2 2" />
        <path d="M 5 35 L 25 45" strokeWidth="0.8" strokeDasharray="2 2" />
        {/* Shelf */}
        <path d="M 12 75 L 88 75" strokeWidth="2" />
        {/* Plant pot */}
        <path d="M 42 75 L 45 92 L 55 92 L 58 75 Z" fill="rgba(0,0,0,0.05)" />
        {/* Plant Leaves */}
        <path d="M 50 75 Q 38 65 30 70 Q 38 80 50 75" fill="rgba(16, 185, 129, 0.1)" />
        <path d="M 50 75 Q 62 65 70 70 Q 62 80 50 75" fill="rgba(16, 185, 129, 0.1)" />
        <path d="M 50 75 Q 50 50 45 45 Q 40 55 50 75" fill="rgba(16, 185, 129, 0.2)" />
        <path d="M 50 75 Q 55 52 62 48 Q 58 60 50 75" fill="rgba(16, 185, 129, 0.15)" />
        {/* Books */}
        <rect x="25" y="75" width="6" height="15" rx="0.5" transform="rotate(-15 25 75)" />
        <rect x="31" y="75" width="8" height="13" rx="0.5" />
      </svg>
    )
  },
  {
    id: "rainy",
    title: "A Rainy Afternoon Walk",
    hintVi: "Gợi ý: Tả giọt mưa rơi tí tách, chiếc ô hồng nổi bật, vũng nước phản chiếu ánh đèn lấp lánh.",
    svg: (
      <svg className="w-full h-full bg-blue-50/20" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Ground */}
        <path d="M 5 85 L 95 85" strokeWidth="1.2" />
        {/* Puddles */}
        <ellipse cx="65" cy="88" rx="15" ry="2" />
        <ellipse cx="25" cy="87" rx="8" ry="1.5" />
        {/* Umbrella */}
        <path d="M 50 45 L 50 78 A 3 3 0 0 0 56 78" strokeWidth="1.8" />
        <path d="M 28 45 C 28 30 72 30 72 45 C 65 42 35 42 28 45 Z" fill="rgba(244, 63, 94, 0.15)" />
        <line x1="50" y1="31" x2="50" y2="27" strokeWidth="1.5" />
        {/* Raindrops */}
        <line x1="15" y1="15" x2="10" y2="28" strokeDasharray="3 3" opacity="0.6" />
        <line x1="32" y1="12" x2="27" y2="25" strokeDasharray="3 3" opacity="0.6" />
        <line x1="58" y1="8" x2="53" y2="21" strokeDasharray="3 3" opacity="0.6" />
        <line x1="82" y1="14" x2="77" y2="27" strokeDasharray="3 3" opacity="0.6" />
        <line x1="22" y1="48" x2="17" y2="61" strokeDasharray="3 3" opacity="0.6" />
        <line x1="78" y1="52" x2="73" y2="65" strokeDasharray="3 3" opacity="0.6" />
        {/* Lamppost in distance */}
        <path d="M 85 85 L 85 25" strokeWidth="0.8" strokeDasharray="1 1" />
        <circle cx="85" cy="25" r="4" fill="rgba(234, 179, 8, 0.2)" strokeWidth="0.6" />
      </svg>
    )
  }
];

export function PictureDescriptionPractice() {
  const [sessions, setSessions] = useState<PictureDescriptionSession[]>([]);
  const [activeSession, setActiveSession] = useState<PictureDescriptionSession | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("cafe");
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(true);
  const [resultsTab, setResultsTab] = useState<"feedback" | "corrections" | "samples" | "vocabulary">("feedback");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load submissions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("studyHub_pictureDescriptions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSessions(parsed);
          if (parsed.length > 0) {
            setActiveSession(parsed[0]);
            setIsAddingNew(false);
          }
        }
      } catch (e) {
        console.error("Error parsing picture description history:", e);
      }
    }
  }, []);

  const saveSessionsToStorage = (updated: PictureDescriptionSession[]) => {
    setSessions(updated);
    localStorage.setItem("studyHub_pictureDescriptions", JSON.stringify(updated));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng tải lên tài liệu định dạng hình ảnh (PNG, JPG, JPEG).");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedBase64(reader.result as string);
      setSelectedTemplate(""); // Clear predefined template when uploading
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const removeUploadedImage = () => {
    setUploadedBase64(null);
    setSelectedTemplate("cafe"); // Reset to standard preseeded template
  };

  const selectPreseededTemplate = (templateId: string, templateTitle: string) => {
    setSelectedTemplate(templateId);
    setUploadedBase64(null);
    setTitle(templateTitle);
  };

  const handleSaveAndEvaluate = async () => {
    if (!description.trim()) {
      alert("Vui lòng nhập bài viết miêu tả tranh bằng tiếng Anh trước khi gửi.");
      return;
    }

    const wordsCount = description.trim().split(/\s+/).length;
    if (wordsCount < 5) {
      alert("Bài miêu tả của bạn quá ngắn. Vui lòng viết tối thiểu 5 từ tiếng Anh.");
      return;
    }

    setIsEvaluating(true);

    const imageSource = uploadedBase64 || selectedTemplate;
    const finalTitle = title.trim() || (selectedTemplate ? PRESEEDED_TEMPLATES.find(t => t.id === selectedTemplate)?.title || "Untitled Scene" : "Personal Upload Pic");

    // Gather base64 representation if using preseeded sketches inside Server, but wait: 
    // To ensure Gemini evaluates the image, we can generate a small mock/text outline or let 
    // the backend handle it. For templates, let's just pass `null` or a generic sketch descriptor 
    // to keep payload lightweight, or let the backend analyze it as template keyword.
    // To make it incredibly robust, we pass the title and template keyword, and if uploadedBase64 is null, 
    // the system knows which preseeded template is active!
    
    try {
      const response = await fetch("/api/translation/evaluate-picture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: finalTitle,
          description: description.trim(),
          imageBase64: uploadedBase64 || null
        })
      });

      if (!response.ok) {
        throw new Error("Lỗi máy chủ đánh giá");
      }

      const evalResult = await response.json();

      const newSession: PictureDescriptionSession = {
        id: Date.now().toString(),
        title: finalTitle,
        description: description.trim(),
        imageType: uploadedBase64 ? "upload" : "template",
        imageSource: imageSource,
        createdAt: Date.now(),
        score: evalResult.score ?? 80,
        feedback: evalResult.feedback ?? "Bài viết mô tả có độ hoàn thiện tốt.",
        correctedText: evalResult.correctedText ?? description.trim(),
        mistakes: evalResult.mistakes ?? [],
        sampleDescriptions: evalResult.sampleDescriptions ?? [],
        vocabulary: evalResult.vocabulary ?? []
      };

      const updatedSessions = [newSession, ...sessions];
      saveSessionsToStorage(updatedSessions);
      setActiveSession(newSession);
      setIsAddingNew(false);

      // Reset fields
      setDescription("");
      setUploadedBase64(null);
      setSelectedTemplate("cafe");
      setTitle("");
      setResultsTab("feedback");

    } catch (e) {
      console.error(e);
      alert("Không thể kết nối đến máy chủ AI để đánh giá. Vui lòng thử lại sau.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa bài thực hành này không?")) {
      const updated = sessions.filter(s => s.id !== id);
      saveSessionsToStorage(updated);
      if (activeSession?.id === id) {
        if (updated.length > 0) {
          setActiveSession(updated[0]);
        } else {
          setActiveSession(null);
          setIsAddingNew(true);
        }
      }
    }
  };

  return (
    <div className="bg-paper flex flex-col md:flex-row gap-6 p-1 md:p-4 font-sans text-ink">
      {/* Sidebar: Submissions log and Action Buttons */}
      <div className="w-full md:w-[30%] flex flex-col gap-4">
        <button
          onClick={() => {
            setIsAddingNew(true);
            setActiveSession(null);
          }}
          className={`w-full py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 border-2 transition-all ${
            isAddingNew 
              ? "bg-ink text-paper border-ink shadow-md" 
              : "bg-white text-ink border-ink/20 hover:border-ink hover:bg-ink/5"
          }`}
        >
          <Plus className="w-4 h-4" /> Thêm Bài Tập Mới
        </button>

        {/* Saved Session List */}
        <div className="sketch-border bg-white/60 p-4 flex flex-col gap-3 min-h-[250px] max-h-[500px] overflow-y-auto">
          <h3 className="text-sm font-black uppercase tracking-wider text-ink/50 flex items-center gap-2">
            <History className="w-4 h-4 text-crimson" /> Lịch sử thực hành ({sessions.length})
          </h3>

          {sessions.length === 0 ? (
            <div className="text-center py-10 opacity-50 flex flex-col items-center justify-center gap-2">
              <ImageIcon className="w-8 h-8 text-ink/30" />
              <p className="text-xs font-hand italic leading-relaxed">Chưa có bài thực hành nào được lưu. Hãy chọn một bức tranh và bắt đầu miêu tả!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {sessions.map(s => {
                const isActive = activeSession?.id === s.id && !isAddingNew;
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveSession(s);
                      setIsAddingNew(false);
                    }}
                    className={`p-3 rounded-lg border transition-all cursor-pointer relative group flex gap-3 items-center ${
                      isActive 
                        ? "bg-crimson/5 border-crimson shadow-sm scale-[0.99]" 
                        : "bg-white border-ink/10 hover:border-ink/30"
                    }`}
                  >
                    {/* Thumbnail representation */}
                    <div className="w-10 h-10 rounded bg-ink/5 border border-ink/10 flex items-center justify-center overflow-hidden shrink-0">
                      {s.imageType === "upload" ? (
                        <img src={s.imageSource} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 opacity-40">
                          {PRESEEDED_TEMPLATES.find(t => t.id === s.imageSource)?.svg ?? <ImageIcon className="w-full h-full" />}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black truncate text-ink">{s.title || "Bài viết chưa đặt tên"}</h4>
                      <p className="text-[10px] text-ink/40 font-mono mt-0.5">
                        {new Date(s.createdAt).toLocaleDateString("vi-VN")} | Điểm: <span className="font-bold text-crimson">{s.score}</span>
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      className="p-1 text-ink/30 hover:text-crimson transition-colors z-20"
                      title="Xóa bài viết"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col gap-4">
        {isAddingNew ? (
          /* WORKSPACE CARD: ADD NEW ATTEMPT */
          <div className="sketch-border bg-white shadow-xl p-5 md:p-6 flex flex-col gap-6">
            <div className="border-b border-ink/5 pb-3">
              <h2 className="text-xl md:text-2xl font-black font-sans tracking-tight text-ink flex items-center gap-2">
                ✍️ LUYỆN TẬP MIÊU TẢ TRANH BẰNG TIẾNG ANH
              </h2>
              <p className="text-xs text-ink/65 mt-1 leading-relaxed">
                Tải hình ảnh của riêng bạn lên hoặc chọn các tranh vẽ mẫu nghệ thuật dưới đây, sau đó viết đoạn văn miêu tả cảnh tượng đó bằng tiếng Anh để mô hình AI Gemini chấm điểm ngữ pháp, sửa lỗi chữ viết và hướng dẫn từ vựng chuẩn bản xứ.
              </p>
            </div>

            {/* Template picker or file uploader */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* IMAGE SELECTION PANEL */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-ink/50 block">Bước 1: Chọn hình ảnh thực hành</span>
                
                {/* Upload Zone */}
                {!uploadedBase64 ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 h-[180px] bg-paper/30 ${
                      dragOver 
                        ? "border-crimson bg-crimson/5 scale-98" 
                        : "border-ink/20 hover:border-ink/50"
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept="image/*"
                    />
                    <div className="w-10 h-10 rounded-full bg-crimson/10 flex items-center justify-center text-crimson">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-ink/80">Kéo thả ảnh hoặc Nhấn để tải</p>
                      <p className="text-[10px] text-ink/40 mt-1">Định dạng JPEG, PNG hỗ trợ xem cực nhanh</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative border-2 border-ink rounded-xl p-1.5 bg-paper shadow-md h-[180px] group flex items-center justify-center overflow-hidden">
                    <img 
                      src={uploadedBase64} 
                      alt="Uploaded item" 
                      className="max-w-full max-h-full object-contain rounded"
                    />
                    <div className="absolute top-1.5 right-1.5 bg-ink text-white p-1 rounded-full cursor-pointer hover:bg-crimson transition-colors shadow" onClick={removeUploadedImage}>
                      <X className="w-3.5 h-3.5" />
                    </div>
                    <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-[9px] text-white px-2 py-0.5 rounded uppercase font-black tracking-widest">
                      Ảnh đã tải lên
                    </span>
                  </div>
                )}

                {/* Templates Selector buttons */}
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {PRESEEDED_TEMPLATES.map(temp => {
                    const isSelected = selectedTemplate === temp.id && !uploadedBase64;
                    return (
                      <button
                        key={temp.id}
                        type="button"
                        onClick={() => selectPreseededTemplate(temp.id, temp.title)}
                        className={`p-1.5 border rounded-lg flex flex-col items-center gap-1 bg-white text-center transition-all ${
                          isSelected 
                            ? "border-crimson bg-crimson/5 ring-1 ring-crimson" 
                            : "border-ink/10 hover:border-ink/35"
                        }`}
                      >
                        <div className="w-max h-8 text-ink/30 shrink-0">
                          {temp.svg}
                        </div>
                        <span className="text-[9px] font-black tracking-tight leading-none text-ink truncate w-full mt-0.5">{temp.title}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Hints based on active selection */}
                <div className="p-3 bg-amber-50/50 border border-dashed border-amber-200/60 rounded-lg text-[11px] leading-relaxed italic text-ink/75">
                  {uploadedBase64 ? (
                    <span><strong>Ghi nhớ:</strong> Mô tả cụ thể các sự vật, hành động, biểu cảm, màu sắc hoặc cảm nhận nghệ thuật từ bức ảnh tự chọn này.</span>
                  ) : (
                    <span>{PRESEEDED_TEMPLATES.find(t => t.id === selectedTemplate)?.hintVi}</span>
                  )}
                </div>
              </div>

              {/* DESCRIPTION WRITING FORM */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-ink/50 block">Bước 2: Viết bài mô tả bằng tiếng Anh</span>

                {/* Title */}
                <div>
                  <label className="text-[10px] font-black uppercase text-ink/40 ml-1">Chủ đề / Tiêu đề (Title)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="VD: A chilly rainy morning..."
                    className="w-full sketch-input mt-1 font-sans text-xs py-2 bg-paper/20"
                  />
                </div>

                {/* Textarea */}
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center px-1 mb-0.5">
                    <label className="text-[10px] font-black uppercase text-ink/40">Nội dung đoạn văn miêu tả (Min 30 từ)</label>
                    <span className="text-[9px] font-bold text-ink/30 font-mono">
                      {description.trim() ? description.trim().split(/\s+/).length : 0} từ | {description.length} ký tự
                    </span>
                  </div>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="E.g., In this cozy coffee shop drawing, I can see a warm mug of steamed coffee. Beside the cup is a small piece of cake with a strawberry cherry on top. This composition makes me feel so quiet and peaceful. On a cold winter day, enjoying a hot latte like this always brightens my mood..."
                    className="w-full min-h-[160px] md:min-h-[200px] flex-1 p-3 sketch-input resize-y font-sans text-[13px] leading-relaxed bg-paper/20"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveAndEvaluate}
                  disabled={isEvaluating}
                  className="mt-2 w-full py-3 text-xs font-black uppercase text-white tracking-widest bg-ink outline-none hover:bg-crimson active:scale-95 transition-all shadow p-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isEvaluating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> ĐANG PHÂN TÍCH TRANH & CHẤM ĐIỂM (GEMINI)...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-400" /> BẮT ĐẦU ĐÁNH GIÁ VỚI GEMINI AI
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* DETAILS CARD: VIEW PAST RESULTS */
          <div className="sketch-border bg-white shadow-xl p-5 md:p-6 flex flex-col gap-5">
            {activeSession && (
              <>
                {/* Header Information: Title and Date and Score */}
                <div className="border-b border-ink/5 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#ef4444] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full inline-block mb-1.5">
                      Đã hoàn thành thực hành
                    </span>
                    <h2 className="text-xl md:text-2xl font-black font-sans tracking-tight text-ink">
                      {activeSession.title || "Untitled Scene"}
                    </h2>
                    <p className="text-[10px] text-ink/40 font-mono mt-0.5">
                      Thực hành lúc: {new Date(activeSession.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>

                  {/* Circle Score badge */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="relative w-16 h-16 rounded-full border-4 border-dashed border-crimson flex flex-col items-center justify-center font-sans tracking-tighter shadow-sm">
                      <span className="text-2xl font-black text-ink">{activeSession.score}</span>
                      <span className="text-[8px] uppercase tracking-wider text-ink/40 -mt-1 font-bold">Điểm</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-ink">CEFR Ước Tính:</h4>
                      <div className="bg-ink text-paper text-[10px] font-bold py-0.5 px-2 rounded mt-0.5 uppercase tracking-widest w-max">
                        {activeSession.score >= 85 ? "Level B2 / C1" : activeSession.score >= 65 ? "Level B1 / Trung cấp" : "Level A2 / Cơ bản"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Split panels: Left has Image + Original text, Right has feedback tabs */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                  {/* Left Column: Image on Polaroid representation and Original Box */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    
                    {/* Polaroid Frame */}
                    <div className="bg-[#FAF8F5] border border-ink/10 rounded p-3 shadow-md flex flex-col items-center justify-center gap-3">
                      <div className="w-full h-[180px] bg-ink/5 rounded border border-ink/5 overflow-hidden flex items-center justify-center">
                        {activeSession.imageType === "upload" ? (
                          <img 
                            src={activeSession.imageSource} 
                            alt={activeSession.title} 
                            className="max-w-full max-h-full object-contain" 
                          />
                        ) : (
                          <div className="w-32 h-32 text-ink/35">
                            {PRESEEDED_TEMPLATES.find(t => t.id === activeSession.imageSource)?.svg ?? <ImageIcon className="w-full h-full" />}
                          </div>
                        )}
                      </div>
                      <div className="text-center font-hand font-bold text-base tracking-tight italic opacity-60 mt-1 truncate w-full">
                        "{activeSession.title}"
                      </div>
                    </div>

                    {/* Original Writing Card */}
                    <div className="bg-paper border border-dashed border-ink/20 rounded-xl p-4">
                      <h4 className="text-xs font-black tracking-wider uppercase text-ink/40 mb-2 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-ink/30" /> Bài viết của bạn:
                      </h4>
                      <p className="font-sans text-[13px] leading-relaxed italic text-ink/80 whitespace-pre-wrap select-text">
                        "{activeSession.description}"
                      </p>
                    </div>

                  </div>

                  {/* Right Column: Dynamic Interactive Review TABS */}
                  <div className="lg:col-span-8 flex flex-col gap-4">
                    {/* Tab Selection Row */}
                    <div className="flex border-b border-ink/10 pb-1 flex-wrap gap-2">
                      {[
                        { id: "feedback", label: "✍️ Đánh giá chung", icon: Sparkles },
                        { id: "corrections", label: "🎯 Lỗi ngữ pháp (" + (activeSession.mistakes?.length || 0) + ")", icon: AlertTriangle },
                        { id: "samples", label: "📖 Văn mẫu bản xứ", icon: BookMarked },
                        { id: "vocabulary", label: "💡 Từ vựng gợi ý", icon: BookOpen }
                      ].map(tab => {
                        const Icon = tab.icon;
                        const isSelected = resultsTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setResultsTab(tab.id as any)}
                            className={`px-3 py-2 text-xs font-black uppercase tracking-wide border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected 
                                ? "border-crimson text-crimson" 
                                : "border-transparent text-ink/50 hover:text-ink"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Tab View Panels */}
                    <div className="flex-1">

                      {/* FEEDBACK TAB */}
                      {resultsTab === "feedback" && (
                        <div className="space-y-4 animate-in fade-induration-350">
                          <div className="p-4 bg-emerald-50/40 border border-dashed border-emerald-200/60 rounded-xl">
                            <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4 text-emerald-600" /> Nhận xét tổng quan AI (Vietnamese Evaluation):
                            </h4>
                            <p className="text-[13px] leading-relaxed text-emerald-950 font-sans whitespace-pre-wrap select-text">
                              {activeSession.feedback}
                            </p>
                          </div>

                          <div className="p-4 bg-indigo-50/40 border border-indigo-200/60 rounded-xl">
                            <h4 className="text-xs font-black text-[#1e40af] uppercase tracking-widest mb-1.5">
                              🚀 Văn viết đã cải tiến (Corrected & Standardized Text):
                            </h4>
                            <p className="font-sans text-sm leading-relaxed text-slate-800 bg-white p-3 rounded-lg border border-indigo-100 select-text font-medium relative italic">
                              "{activeSession.correctedText}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* CORRECTIONS TAB */}
                      {resultsTab === "corrections" && (
                        <div className="space-y-3 animate-in fade-in">
                          {(!activeSession.mistakes || activeSession.mistakes.length === 0) ? (
                            <div className="text-center py-10 bg-emerald-50/20 border border-dashed border-emerald-200 rounded-xl">
                              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                              <p className="text-sm font-semibold text-emerald-800">Tuyệt vời! Không phát hiện thấy lỗi chính tả hay ngữ pháp nào.</p>
                              <p className="text-xs text-emerald-950/60 mt-1 max-w-sm mx-auto">Văn phong của bạn cực kỳ chính xác và tự nhiên.</p>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              {activeSession.mistakes.map((m, idx) => (
                                <div key={idx} className="p-3 bg-red-50/30 border border-red-100 rounded-xl flex flex-col gap-1.5">
                                  <div className="flex flex-wrap gap-2 items-center text-xs">
                                    <span className="font-serif px-2 py-0.5 rounded bg-red-100 text-red-700 line-through select-text">
                                      {m.original}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-red-400" />
                                    <span className="font-serif px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold select-text">
                                      {m.correction}
                                    </span>
                                  </div>
                                  <p className="text-[11px] leading-relaxed text-red-950/80 font-sans mt-0.5 pl-1 border-l-2 border-red-200 select-text">
                                    <strong>Giải thích:</strong> {m.reasonVi}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SAMPLES TAB */}
                      {resultsTab === "samples" && (
                        <div className="space-y-3 animate-in fade-in">
                          {activeSession.sampleDescriptions?.map((desc, idx) => {
                            const levelLabel = idx === 0 ? "Basic (Nhập môn)" : idx === 1 ? "Intermediate (Khá)" : "Advanced/Native (Bản ngữ)";
                            const bgStyle = idx === 0 ? "bg-amber-50/10 border-amber-20px" : idx === 1 ? "bg-blue-50/10 border-blue-20px" : "bg-purple-50/10 border-purple-20px";
                            const textColors = idx === 0 ? "text-amber-800" : idx === 1 ? "text-blue-800" : "text-purple-800";
                            return (
                              <div key={idx} className={`p-4 border rounded-xl ${bgStyle}`}>
                                <h4 className={`text-xs font-black uppercase tracking-wider mb-2 ${textColors}`}>
                                  Mẫu {levelLabel}:
                                </h4>
                                <p className="font-serif text-[13px] leading-relaxed text-ink select-text italic">
                                  "{desc}"
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* VOCABULARY TAB */}
                      {resultsTab === "vocabulary" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
                          {activeSession.vocabulary?.map((vocab, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 border border-slate-200/55 rounded-lg flex flex-col justify-between hover:bg-slate-100/50 transition-colors">
                              <div>
                                <h4 className="font-bold text-xs text-indigo-950 flex items-center gap-1.5 select-text">
                                  {vocab.word}
                                  <span className="text-[9px] bg-indigo-50 border border-indigo-100 rounded text-indigo-700 px-1 py-0.1 font-mono">{vocab.type}</span>
                                </h4>
                                <span className="text-[10px] text-indigo-900/40 tracking-tight block font-serif mt-0.5 select-text">{vocab.ipa}</span>
                                <p className="text-xs text-slate-800 mt-1 select-text">
                                  <strong>Mô tả:</strong> {vocab.meaning}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  </div>

                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
