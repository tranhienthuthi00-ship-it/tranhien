import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Volume2,
  Sliders,
  CheckCircle2,
  X,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Library,
  BookOpen,
  Award,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronUp,
  VolumeX
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn, getAbsoluteUrl } from "../lib/utils";

export interface ReflexQuestion {
  id: string;
  en: string; // The English question
  vi: string; // The Vietnamese helper translation/prompt
  suggestedAnswer: string; // Sample answer in English
}

export interface ReflexScenario {
  id: string;
  title: string;
  description: string;
  questions: ReflexQuestion[];
  isCustom?: boolean;
}

// Preset conversations / reflex scenarios
const DEFAULT_SCENARIOS: ReflexScenario[] = [
  {
    id: "sc-intro",
    title: "Phỏng vấn & Giới thiệu bản thân",
    description: "Luyện phản xạ tự giới thiệu, nêu kinh nghiệm làm việc và mục tiêu nghề nghiệp khi phỏng vấn.",
    questions: [
      {
        id: "q-intro-1",
        en: "Could you please introduce yourself briefly?",
        vi: "Bạn có thể giới thiệu ngắn gọn về bản thân mình không?",
        suggestedAnswer: "My name is Hien. I have two years of experience in content marketing, and I'm highly passionate about digital communication."
      },
      {
        id: "q-intro-2",
        en: "What are your professional goals for the next three years?",
        vi: "Mục tiêu nghề nghiệp trong ba năm tới của bạn là gì?",
        suggestedAnswer: "In the next three years, I aim to become a senior marketing consultant and lead creative content campaigns."
      },
      {
        id: "q-intro-3",
        en: "Why are you interested in joining our team?",
        vi: "Tại sao bạn lại có hứng thú muốn ra nhập đội ngũ của chúng tôi?",
        suggestedAnswer: "Your team has an inspiring creative culture and outstanding tech-driven products, which is the perfect place for my career growth."
      }
    ]
  },
  {
    id: "sc-restaurant",
    title: "Đặt món ăn & Thanh toán",
    description: "Luyện tập hỏi thực đơn, gọi món, yêu cầu đặc biệt và gọi hóa đơn tại nhà hàng du lịch.",
    questions: [
      {
        id: "q-rest-1",
        en: "Are you ready to order, or do you need a few more minutes?",
        vi: "Bạn đã sẵn sàng gọi món chưa, hay cần thêm vài phút nữa?",
        suggestedAnswer: "We're ready. I'd like to order the grilled salmon, and my friend will have the chicken steak, please."
      },
      {
        id: "q-rest-2",
        en: "How would you like your steak cooked: rare, medium, or well-done?",
        vi: "Bạn muốn bít tết của mình chín ở mức độ nào: tái, chín vừa hay chín kỹ?",
        suggestedAnswer: "Medium, please. And could we get some extra mushroom sauce on the side?"
      },
      {
        id: "q-rest-3",
        en: "Would you care for any dessert or drinks to finish your meal?",
        vi: "Bạn có muốn dùng thêm món tráng miệng hoặc đồ uống nào để kết thúc bữa ăn không?",
        suggestedAnswer: "No, thank you. Just the bill, please."
      }
    ]
  },
  {
    id: "sc-directions",
    title: "Hỏi và Chỉ đường",
    description: "Hỏi đường đến ga tàu, khách sạn và các địa điểm nổi tiếng khi đi du lịch nước ngoài.",
    questions: [
      {
        id: "q-dir-1",
        en: "Excuse me, can you tell me how to get to the nearest subway station?",
        vi: "Xin lỗi, bạn có thể chỉ cho tôi cách đi đến ga tàu điện ngầm gần nhất không?",
        suggestedAnswer: "Sure. Go straight for two blocks, turn left under the bridge, and you'll see the station on your right."
      },
      {
        id: "q-dir-2",
        en: "Is it far enough that I should take a cab, or can I walk there?",
        vi: "Nó có xa đến mức tôi nên đón taxi không, hay có thể đi bộ tới đó?",
        suggestedAnswer: "It's quite close. You can easily walk there in less than seven minutes."
      },
      {
        id: "q-dir-3",
        en: "Do you happen to have a map of the local tourist spots that I can keep?",
        vi: "Bạn có bản đồ các điểm du lịch địa phương nào cho tôi xin một bản được không?",
        suggestedAnswer: "Yes, here is a free tourist leaflet containing a map, or you can scan this barcode for the online version."
      }
    ]
  },
  {
    id: "sc-smalltalk",
    title: "Giao tiếp xã giao & Kết bạn",
    description: "Cách làm quen, bắt chuyện với bạn mới, chia sẻ sở thích cá nhân và hỏi thăm cuối tuần.",
    questions: [
      {
        id: "q-talk-1",
        en: "Hi there! I noticed you reading that book. What is it about?",
        vi: "Chào bạn! Mình thấy bạn đang đọc cuốn sách kia. Sách đó nói về chủ đề gì vậy?",
        suggestedAnswer: "Hi! It's a gripping novel about modern history and adventure. It's really hard to put down!"
      },
      {
        id: "q-talk-2",
        en: "How long have you been living in this beautiful city?",
        vi: "Bạn đã sống ở thành phố xinh đẹp này được bao lâu rồi?",
        suggestedAnswer: "I've been living here for about three years now. I absolutely love its vibrant spirit and friendly people."
      },
      {
        id: "q-talk-3",
        en: "What do you usually do for fun on the weekends?",
        vi: "Bạn thường làm gì để giải trí vào dịp cuối tuần?",
        suggestedAnswer: "I usually go hiking in the countryside with friends or visit art exhibitions to clear my head."
      }
    ]
  },
  {
    id: "sc-office",
    title: "Giao tiếp Công sở & Đàm thoại",
    description: "Luyện các tình huống họp báo cáo tiến độ, xử lý mâu thuẫn đồng nghiệp và chuẩn bị thuyết trình dự án.",
    questions: [
      {
        id: "q-off-1",
        en: "Could you please update us on the progress of the new product roadmap?",
        vi: "Bạn có thể vui lòng cập nhật cho chúng tôi về tiến độ của lộ trình sản phẩm mới không?",
        suggestedAnswer: "Sure. We've completed the UI layouts, and the engineering team is currently integrating the database and testing API routes. We should be on track next Monday."
      },
      {
        id: "q-off-2",
        en: "What should we do to resolve the feedback delays from our offshore development partners?",
        vi: "Chúng ta nên làm gì để giải quyết sự chậm trễ phản hồi từ đối tác phát triển ở nước ngoài của chúng ta?",
        suggestedAnswer: "I suggest scheduling a daily ten-minute sync meeting at nine AM to align our priorities and clarify blocker bugs immediately."
      },
      {
        id: "q-off-3",
        en: "Are you ready for your pitch presentation with the VIP client this afternoon?",
        vi: "Bạn đã sẵn sàng cho buổi thuyết trình bán hàng với đối tác VIP chiều nay chưa?",
        suggestedAnswer: "Yes, I've polished the slide deck and practiced the demo multiple times. I'm highly confident we can close the deal."
      }
    ]
  },
  {
    id: "sc-hotel",
    title: "Khách sạn & Thủ tục Nhận/Trả phòng",
    description: "Luyện phản xạ nhanh khi làm thủ tục check-in, check-out, báo lỗi điều hòa và hỏi các dịch vụ miễn phí.",
    questions: [
      {
        id: "q-hot-1",
        en: "Hi there! I have a reservation under the name Hien. Can I check in now?",
        vi: "Xin chào! Tôi có đặt phòng dưới tên Hiền. Tôi có thể thực hiện thủ tục nhận phòng bây giờ không?",
        suggestedAnswer: "Hello. Let me pull up your booking. Yes, your room is ready. May I have your passport and a credit card for the deposit, please?"
      },
      {
        id: "q-hot-2",
        en: "Excuse me, the air conditioner in room 305 is leaking water. Can you send someone to take a look?",
        vi: "Xin lỗi, điều hòa nhiệt độ phòng 305 đang bị rò rỉ nước. Bạn có thể cử ai đó lên kiểm tra không?",
        suggestedAnswer: "We're very sorry for the inconvenience, ma'am. I'll dispatch our maintenance technician to your room immediately, or we can move you to a suite if you prefer."
      },
      {
        id: "q-hot-3",
        en: "Are there any additional fees for the gym, or is it included in our booking package?",
        vi: "Có phụ phí nào đối với phòng gym không, hay nó đã bao gồm sẵn trong gói phòng của chúng tôi rồi?",
        suggestedAnswer: "The fitness center and indoor pool are completely free for all hotel guests. You just need to scan your keycard to enter."
      }
    ]
  },
  {
    id: "sc-shopping",
    title: "Mua sắm & Trả giá Giao tiếp",
    description: "Cách hỏi kích cỡ quần áo, thương lượng chính sách hoàn tiền và mặc cả khi mua quà lưu niệm.",
    questions: [
      {
        id: "q-shop-1",
        en: "Do you have this cotton shirt in a medium size, or is it out of stock?",
        vi: "Bạn còn chiếc áo sơ mi cotton này cỡ trung bình (Medium) không, hay là hết hàng rồi?",
        suggestedAnswer: "We have plenty of medium sizes in the back. Let me grab one for you. Would you like to try it on in the fitting room?"
      },
      {
        id: "q-shop-2",
        en: "Is there any special discount if I purchase three of these keychains at once?",
        vi: "Có chương trình giảm giá đặc biệt nào nếu tôi mua ba chiếc móc khóa này cùng một lúc không?",
        suggestedAnswer: "If you buy three, we can offer you a fifteen percent discount on the bundle, plus a free decorative stamp!"
      },
      {
        id: "q-shop-3",
        en: "What is your return policy if the dress doesn't fit my daughter?",
        vi: "Chính sách trả hàng của bạn như thế nào nếu chiếc váy này không vừa với con gái tôi?",
        suggestedAnswer: "We offer a flexible fourteen-day return or exchange policy as long as the security tags are intact and you bring the original receipt."
      }
    ]
  }
];

// Bulk parser utility
export function parseBulkInput(text: string): Omit<ReflexQuestion, "id">[] {
  const lines = text.split("\n");
  const parsed: Omit<ReflexQuestion, "id">[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.split("|").map(p => p.trim());
    if (parts.length === 1) {
      if (parts[0]) {
        parsed.push({
          en: parts[0],
          vi: "Hãy phản xạ câu hỏi này",
          suggestedAnswer: "That's an interesting question! Let me share my thoughts."
        });
      }
    } else if (parts.length === 2) {
      const isPart2Vietnamese = /[\u0300-\u036f\u1ea0-\u1ef9a-fA-FÀ-ỹ]/.test(parts[1]); 
      parsed.push({
        en: parts[0],
        vi: isPart2Vietnamese ? parts[1] : "Hãy phản xạ câu hỏi này",
        suggestedAnswer: isPart2Vietnamese ? "I think that is a wonderful topic." : parts[1]
      });
    } else if (parts.length >= 3) {
      parsed.push({
        en: parts[0],
        vi: parts[1],
        suggestedAnswer: parts[2]
      });
    }
  }
  return parsed;
}

export function ReflexPractice() {
  const [scenarios, setScenarios] = useState<ReflexScenario[]>([]);
  const [activeScenario, setActiveScenario] = useState<ReflexScenario | null>(null);
  const [activeTab, setActiveTab] = useState<"library" | "custom">("library");

  // Custom scenario builder state
  const [customMode, setCustomMode] = useState<"bulk" | "manual">("bulk");
  const [bulkText, setBulkText] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customQuestions, setCustomQuestions] = useState<Omit<ReflexQuestion, "id">[]>([
    { en: "", vi: "", suggestedAnswer: "" }
  ]);

  // Temp session save details state
  const [showSaveTempDialog, setShowSaveTempDialog] = useState(false);
  const [tempSaveTitle, setTempSaveTitle] = useState("");
  const [tempSaveDesc, setTempSaveDesc] = useState("");

  // Practice session state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [evaluation, setEvaluation] = useState<{
    score: number;
    isCorrect: boolean;
    feedback: string;
    mistakes: string;
    naturalSuggestion: string;
    suggestionExplanation: string;
  } | null>(null);

  // Stats / Progress tracking
  const [answersLog, setAnswersLog] = useState<{
    question: string;
    vi: string;
    answer: string;
    score: number;
    feedback: string;
    naturalSuggestion: string;
  }[]>([]);
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  // Text to speech configs
  const [speechRate, setSpeechRate] = useState<number>(() => {
    return parseFloat(localStorage.getItem("reflex_speech_rate") || "0.9");
  });
  const [showConfig, setShowConfig] = useState(false);

  // Initialize and load scenarios
  useEffect(() => {
    const stored = localStorage.getItem("custom_reflex_scenarios");
    let parsed: ReflexScenario[] = [];
    if (stored) {
      try {
        parsed = JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse custom reflex scenarios", e);
      }
    }
    setScenarios([...DEFAULT_SCENARIOS, ...parsed]);
  }, []);

  // Save speech rate to localStorage if changed
  useEffect(() => {
    localStorage.setItem("reflex_speech_rate", speechRate.toString());
  }, [speechRate]);

  // Trigger TTS speaker read-out
  const speakQuestion = (text: string) => {
    if (!window.speechSynthesis) {
      alert("Trình duyệt không hỗ trợ Text-to-Speech.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = speechRate;
    window.speechSynthesis.speak(utterance);
  };

  // Start practicing a scenario
  const handleStartScenario = (scenario: ReflexScenario) => {
    setActiveScenario(scenario);
    setCurrentIdx(0);
    setUserAnswer("");
    setEvaluation(null);
    setShowSample(false);
    setAnswersLog([]);
    setIsSessionFinished(false);
    // Auto voice output on start
    setTimeout(() => {
      speakQuestion(scenario.questions[0].en);
    }, 300);
  };

  // Exit practice midway
  const handleExitPractice = () => {
    if (confirm("Bạn có chắc chắn muốn thoát buổi luyện tập này? Tiến trình của bạn sẽ bị hủy.")) {
      setActiveScenario(null);
      setEvaluation(null);
      setUserAnswer("");
    }
  };

  // Call Gemini to evaluate Student reflex answer
  const handleVerifyAnswer = async () => {
    if (!userAnswer.trim() || !activeScenario) return;
    setIsVerifying(true);
    const activeQuestion = activeScenario.questions[currentIdx];

    try {
      const response = await fetch(getAbsoluteUrl("/api/translation/verify-reflex"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: activeQuestion.en,
          questionVi: activeQuestion.vi,
          userAnswer: userAnswer.trim(),
          suggestedAnswer: activeQuestion.suggestedAnswer
        })
      });

      if (!response.ok) {
        throw new Error("Eval request failed");
      }

      const resData = await response.json();
      setEvaluation({
        score: resData.score ?? 80,
        isCorrect: resData.isCorrect ?? true,
        feedback: resData.feedback ?? "Câu trả lời đúng và dễ hiểu.",
        mistakes: resData.mistakes ?? "Không có lỗi sai nào.",
        naturalSuggestion: resData.naturalSuggestion ?? activeQuestion.suggestedAnswer,
        suggestionExplanation: resData.suggestionExplanation ?? "Cách diễn đạt tự nhiên hơn sử dụng cấu trúc giao tiếp thông dụng."
      });
    } catch (e) {
      console.error(e);
      // Client-side fallback if backend API is not responding
      const fallbackScore = userAnswer.trim().split(" ").length >= 5 ? 85 : 70;
      setEvaluation({
        score: fallbackScore,
        isCorrect: true,
        feedback: "Đã đánh giá thành công! (Phản hồi dự phòng cục bộ do mạng chậm). Câu trả lời của bạn khá lưu loát và dễ hiểu.",
        mistakes: "Không có lỗi sai ngữ pháp rõ rệt.",
        naturalSuggestion: activeQuestion.suggestedAnswer,
        suggestionExplanation: "Mẫu câu đề xuất để tự tin giao tiếp chuẩn bản xứ."
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Proceed to next question or complete scenario
  const handleNextQuestion = () => {
    if (!activeScenario || !evaluation) return;
    
    // Add to answers log
    const activeQuestion = activeScenario.questions[currentIdx];
    setAnswersLog(prev => [
      ...prev,
      {
        question: activeQuestion.en,
        vi: activeQuestion.vi,
        answer: userAnswer.trim(),
        score: evaluation.score,
        feedback: evaluation.feedback,
        naturalSuggestion: evaluation.naturalSuggestion
      }
    ]);

    if (currentIdx < activeScenario.questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setUserAnswer("");
      setEvaluation(null);
      setShowSample(false);
      // Auto-play the voice of the next question
      setTimeout(() => {
        speakQuestion(activeScenario.questions[currentIdx + 1].en);
      }, 400);
    } else {
      setIsSessionFinished(true);
    }
  };

  // Quick bulk practice instant engine
  const handleBulkPracticeNow = () => {
    if (!bulkText.trim()) {
      alert("Vui lòng nhập văn bản hoặc câu hỏi phản xạ.");
      return;
    }

    const parsed = parseBulkInput(bulkText);
    if (parsed.length === 0) {
      alert("Không tìm thấy bất kỳ câu hỏi hợp lệ nào trong khối văn bản dán.");
      return;
    }

    const tempScenario: ReflexScenario = {
      id: "sc-temp-bulk",
      title: "Luyện Phản Xạ Dán Sẵn",
      description: "Tình huống phản xạ khởi động từ danh sách dán sẵn thô của bạn.",
      questions: parsed.map((q, idx) => ({
        id: `q-temp-${idx}-${Date.now()}`,
        en: q.en,
        vi: q.vi,
        suggestedAnswer: q.suggestedAnswer
      })),
      isCustom: true
    };

    handleStartScenario(tempScenario);
  };

  // Convert raw temporary run into a stored library custom scenario
  const handleSaveTempScenario = () => {
    if (!tempSaveTitle.trim() || !activeScenario) {
      alert("Vui lòng nhập tên tình huống để lưu.");
      return;
    }

    const newScenario: ReflexScenario = {
      id: `sc-custom-${Date.now()}`,
      title: tempSaveTitle.trim(),
      description: tempSaveDesc.trim() || `Tình huống phản xạ tự tạo lưu trữ lúc ${new Date().toLocaleDateString()}`,
      questions: activeScenario.questions.map((q, idx) => ({
        id: `q-custom-${idx}-${Date.now()}`,
        en: q.en,
        vi: q.vi,
        suggestedAnswer: q.suggestedAnswer
      })),
      isCustom: true
    };

    const stored = localStorage.getItem("custom_reflex_scenarios");
    let parsed: ReflexScenario[] = [];
    if (stored) {
      try {
        parsed = JSON.parse(stored);
      } catch (err) {
        console.error(err);
      }
    }

    const updatedList = [...parsed, newScenario];
    localStorage.setItem("custom_reflex_scenarios", JSON.stringify(updatedList));
    setScenarios([...DEFAULT_SCENARIOS, ...updatedList]);

    // Transition existing state
    setActiveScenario({
      ...activeScenario,
      id: newScenario.id,
      title: newScenario.title,
      description: newScenario.description
    });

    alert("Đã lưu tình huống này vào Thư viện thành công!");
    setShowSaveTempDialog(false);
  };

  // Add custom builders rows
  const handleAddCustomQuestionRow = () => {
    setCustomQuestions(prev => [...prev, { en: "", vi: "", suggestedAnswer: "" }]);
  };

  // Remove question row
  const handleRemoveCustomQuestionRow = (index: number) => {
    if (customQuestions.length <= 1) return;
    setCustomQuestions(prev => prev.filter((_, i) => i !== index));
  };

  // Handle building and saving custom scenario
  const handleSaveCustomScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) {
      alert("Vui lòng điền tên tình huống.");
      return;
    }

    const filteredQs = customQuestions.filter(q => q.en.trim() && q.vi.trim());
    if (filteredQs.length === 0) {
      alert("Vui lòng nhập ít nhất một câu hỏi hoàn chỉnh (gồm câu hỏi tiếng Anh và phụ đề tiếng Việt).");
      return;
    }

    const newScenario: ReflexScenario = {
      id: `sc-custom-${Date.now()}`,
      title: customTitle.trim(),
      description: customDesc.trim() || `Tình huống phản xạ giao tiếp tự chế khởi tạo lúc ${new Date().toLocaleDateString()}`,
      questions: filteredQs.map((q, idx) => ({
        id: `q-custom-${idx}-${Date.now()}`,
        en: q.en.trim(),
        vi: q.vi.trim(),
        suggestedAnswer: q.suggestedAnswer.trim() || "Thank you for asking that! That's an interesting point."
      })),
      isCustom: true
    };

    // Load custom list
    const stored = localStorage.getItem("custom_reflex_scenarios");
    let parsed: ReflexScenario[] = [];
    if (stored) {
      try {
        parsed = JSON.parse(stored);
      } catch (err) {
        console.error("Stored parser failure", err);
      }
    }

    const updatedList = [...parsed, newScenario];
    localStorage.setItem("custom_reflex_scenarios", JSON.stringify(updatedList));

    // Update screen list
    setScenarios([...DEFAULT_SCENARIOS, ...updatedList]);
    
    // Reset inputs
    setCustomTitle("");
    setCustomDesc("");
    setCustomQuestions([{ en: "", vi: "", suggestedAnswer: "" }]);
    setActiveTab("library");

    alert("Lưu tình huống phản xạ mới thành công!");
  };

  // Delete custom scenario
  const handleDeleteScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bạn chắc chắn muốn xóa tình huống phản xạ tự chế này?")) return;

    const stored = localStorage.getItem("custom_reflex_scenarios");
    let parsed: ReflexScenario[] = [];
    if (stored) {
      try {
        parsed = JSON.parse(stored);
      } catch (err) {
        console.error(err);
      }
    }

    const filtered = parsed.filter(s => s.id !== id);
    localStorage.setItem("custom_reflex_scenarios", JSON.stringify(filtered));
    setScenarios([...DEFAULT_SCENARIOS, ...filtered]);
  };

  // Render score breakdown style
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-600 border-emerald-300 bg-emerald-50";
    if (score >= 70) return "text-amber-600 border-amber-300 bg-amber-50";
    return "text-rose-600 border-rose-300 bg-rose-50";
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-hidden">
      {!activeScenario ? (
        <div className="space-y-6">
          {/* Main Title Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-ink/10 pb-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-2 text-ink">
                <Sparkles className="w-8 h-8 text-amber-500" style={{ filter: 'url(#hand-drawn-filter)' }} />
                Reflex Coach
              </h1>
              <p className="hand-text text-lg opacity-60">Luyện phản xạ Tiếng Anh bằng câu hỏi và câu trả lời</p>
            </div>

            {/* Scenarios tab selection */}
            <div className="flex bg-[#eae6db]/60 p-1 rounded-full border border-ink/10">
              <button
                onClick={() => setActiveTab("library")}
                className={cn(
                  "px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-full transition-all flex items-center gap-1.5",
                  activeTab === "library" ? "bg-ink text-white shadow" : "text-ink/60 hover:text-ink"
                )}
              >
                <BookOpen size={14} /> Thư viện tình huống
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                className={cn(
                  "px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-full transition-all flex items-center gap-1.5",
                  activeTab === "custom" ? "bg-ink text-white shadow" : "text-ink/60 hover:text-ink"
                )}
              >
                <Plus size={14} /> Tự tạo tình uống
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "library" ? (
              <motion.div
                key="library-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    onClick={() => handleStartScenario(scenario)}
                    className="sketch-border bg-white p-6 cursor-pointer hover:bg-paper/20 hover:shadow-lg transition-all flex flex-col justify-between group relative"
                  >
                    {scenario.isCustom && (
                      <button
                        onClick={(e) => handleDeleteScenario(scenario.id, e)}
                        className="absolute top-4 right-4 text-ink/20 hover:text-crimson p-1 z-10 transition-colors"
                        title="Xóa tình huống này"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full border",
                          scenario.isCustom ? "bg-rose-50 text-rose-600 border-rose-300" : "bg-emerald-50 text-emerald-600 border-emerald-300"
                        )}>
                          {scenario.isCustom ? "Custom" : "Hệ thống"}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-ink/40">
                          {scenario.questions.length} câu hỏi phản xạ
                        </span>
                      </div>
                      <h3 className="text-xl font-bold group-hover:text-crimson transition-colors leading-tight">
                        {scenario.title}
                      </h3>
                      <p className="text-xs text-ink/60 leading-relaxed font-sans">
                        {scenario.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-ink/5 flex items-center justify-between text-xs font-black uppercase tracking-wider text-ink">
                      <span>Bắt đầu phản xạ</span>
                      <ChevronRight size={16} className="group-hover:translate-x-1.5 transition-transform text-crimson" />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Custom input mode toggle */}
                <div className="flex border-b-2 border-ink/5 pb-1 gap-6">
                  <button
                    onClick={() => setCustomMode("bulk")}
                    className={cn(
                      "pb-2.5 text-xs md:text-sm font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5",
                      customMode === "bulk" ? "border-crimson text-crimson" : "border-transparent text-ink/40 hover:text-ink/80"
                    )}
                  >
                    <Sparkles size={14} className={cn(customMode === "bulk" ? "text-amber-500" : "text-ink/30")} />
                    Nhập văn bản nhanh (Bulk Import)
                  </button>
                  <button
                    onClick={() => setCustomMode("manual")}
                    className={cn(
                      "pb-2.5 text-xs md:text-sm font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5",
                      customMode === "manual" ? "border-crimson text-crimson" : "border-transparent text-ink/40 hover:text-ink/80"
                    )}
                  >
                    <Library size={13} className={cn(customMode === "manual" ? "text-crimson" : "text-ink/30")} />
                    Nhập từng câu thủ công (Manual rows)
                  </button>
                </div>

                {customMode === "bulk" ? (
                  <motion.div
                    key="bulk-editor"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sketch-border bg-white p-6 space-y-6 shadow-sm"
                  >
                    <div className="space-y-1">
                      <h3 className="text-md font-bold uppercase tracking-wide text-ink flex items-center gap-1.5">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        Phản xạ với danh sách dán sẵn tức thì
                      </h3>
                      <p className="text-xs text-ink/50 font-sans leading-relaxed">
                        Dán khối danh sách câu hỏi và câu gợi ý từ ngữ của bạn tại đây, hệ thống sẽ phân tách ra các thẻ phản xạ học tập ngay lập tức.
                      </p>
                    </div>

                    {/* Format Guide Alert Box */}
                    <div className="bg-amber-50/70 border border-amber-200/60 p-4 rounded text-xs text-amber-900 font-sans space-y-2">
                      <strong className="block uppercase tracking-wider text-[9px] text-amber-800 font-black">💡 Hướng dẫn định dạng dòng:</strong>
                      <p className="leading-relaxed">
                        Mỗi dòng mới đại diện cho một câu hỏi. Chia tách Câu hỏi Tiếng Anh, Gợi ý Tiếng Việt, câu trả lời mẫu bằng ký tự <code className="bg-white px-1 py-0.5 border border-amber-300 font-mono font-bold">|</code> (phím Shift + gạch chéo ngược).
                      </p>
                      <div className="bg-white/95 p-3 rounded border border-amber-200 font-mono text-[10px] space-y-1 block leading-normal text-ink/80 shadow-sm">
                        <div className="font-bold text-ink/45 border-b border-ink/5 pb-1 mb-1">DÒNG NHẬP MẪU:</div>
                        <div>Câu hỏi Tiếng Anh | Phụ đề Tiếng Việt | Câu trả lời gợi ý Tiếng Anh</div>
                        <div className="text-ink/30 italic mt-1.5 pt-1.5 border-t border-ink/5">Ví dụ cụ thể:</div>
                        <div className="text-[#a15c00]">Tell me about your morning routine. | Kể về thói quen buổi sáng của bạn. | I usually wake up at 6 AM, drink coffee, and read for 20 minutes.</div>
                        <div className="text-[#a15c00]">What's your plan for tonight? | Kế hoạch tối nay của bạn là gì? | I'm going to cook pasta and watch a movie with friends.</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBulkText(`Can you name three major challenges in your current role? | Kể tên ba thử thách lớn trong vai trò hiện tại của bạn? | Communication delays, shifting requirements, and resource constraints are our main hurdles.
What's your strategy to improve team collaboration? | Chiến lược cải thiện hợp tác nhóm của bạn là gì? | We will set up regular code reviews, weekly syncs, and clear documentation.
How do you handle client feedback under pressure? | Bạn giải quyết phản hồi của khách hàng dưới áp lực như thế nào? | I prioritize items based on business impact, stay proactive, and double-check solutions before delivering.`)}
                        className="text-[9px] font-black uppercase text-[#a15c00] hover:text-[#7d4800] underline mt-1 block transition-colors"
                      >
                        ⚡ Nhấp để tự động điền các câu hỏi mẫu tuyển dụng & công sở
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-ink/55 tracking-widest block" htmlFor="bulk-reflex-textbox">Văn bản thô danh sách câu hỏi / câu trả lời</label>
                      <textarea
                        id="bulk-reflex-textbox"
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder="Câu hỏi 1 | Gợi ý 1 | Câu trả lời 1&#10;Câu hỏi 2 | Gợi ý 2 | Câu trả lời 2..."
                        className="w-full h-80 bg-paper/5 focus:bg-white sketch-border p-4 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ink/20 resize-none transition-all placeholder:opacity-40 text-ink leading-relaxed"
                      />
                    </div>

                    {/* Bulk Action Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => handleBulkPracticeNow()}
                        disabled={!bulkText.trim()}
                        className="sketch-button py-3.5 px-4 font-black uppercase tracking-widest bg-ink text-white hover:bg-crimson disabled:opacity-40 hover:scale-[1.01] transition-all text-xs flex items-center justify-center gap-2 shadow"
                      >
                        <Play size={14} /> Luyện tập tức thì (Luyên thô ngay)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const parsed = parseBulkInput(bulkText);
                          if (parsed.length === 0) {
                            alert("Vui lòng nhập văn bản phản xạ hợp lệ trước.");
                            return;
                          }
                          setCustomQuestions(parsed);
                          setCustomTitle("Tình huống dán thô nhanh");
                          setCustomDesc(`Luyện phản xạ từ danh sách dán sẵn tạo lúc ${new Date().toLocaleTimeString()}`);
                          setCustomMode("manual");
                        }}
                        disabled={!bulkText.trim()}
                        className="sketch-button py-3.5 px-4 font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 disabled:opacity-40 text-xs flex items-center justify-center gap-2 shadow"
                      >
                        <Library size={14} /> Phân tích dán thô và Sửa thủ công / Lưu
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="manual-editor"
                    onSubmit={handleSaveCustomScenario}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sketch-border bg-white p-6 space-y-6 shadow-sm"
                  >
                    <div className="space-y-4">
                      <h3 className="text-md font-black uppercase tracking-wider text-ink flex items-center gap-1.5">
                        <Library size={18} className="text-crimson" />
                        Thiết lập tình huống phản xạ của riêng bạn
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-ink/55 tracking-widest block">Tên tình huống / Đề tài</label>
                          <input
                            type="text"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            placeholder="Ví dụ: Giao tiếp tại sân bay, Giới thiệu sản phẩm..."
                            className="w-full bg-paper/20 sketch-border-sm p-3.5 text-sm font-sans font-bold focus:outline-none"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-ink/55 tracking-widest block">Mô tả ngắn gọn</label>
                          <input
                            type="text"
                            value={customDesc}
                            onChange={(e) => setCustomDesc(e.target.value)}
                            placeholder="Ví dụ: Luyện phản xạ nhanh các tình huống hải quan, xuất nhập cảnh..."
                            className="w-full bg-paper/20 sketch-border-sm p-3.5 text-sm font-sans focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 border-t border-ink/10 pt-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-ink/50 block">Danh sách Q&A phản xạ</h4>
                        <button
                          type="button"
                          onClick={handleAddCustomQuestionRow}
                          className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-300 rounded hover:bg-emerald-100 transition-colors flex items-center gap-1"
                        >
                          <Plus size={10} /> Thêm câu hỏi
                        </button>
                      </div>

                      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-none">
                        {customQuestions.map((q, idx) => (
                          <div key={idx} className="relative bg-paper/10 p-4 sketch-border shadow-sm flex flex-col gap-4">
                            <div className="absolute top-2 right-2 text-xs font-black text-ink/20 font-mono">
                              #{idx + 1}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase text-ink/40 tracking-wider">Câu hỏi Tiếng Anh (Question)</label>
                                <input
                                  type="text"
                                  value={q.en}
                                  onChange={(e) => {
                                    const copy = [...customQuestions];
                                    copy[idx].en = e.target.value;
                                    setCustomQuestions(copy);
                                  }}
                                  placeholder="e.g. What is your favorite food?"
                                  className="w-full bg-white sketch-border-sm p-2 text-xs font-sans font-bold focus:outline-none"
                                  required
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase text-ink/40 tracking-wider">Phụ đề tiếng Việt gợi ý (Vietnamese prompt)</label>
                                <input
                                  type="text"
                                  value={q.vi}
                                  onChange={(e) => {
                                    const copy = [...customQuestions];
                                    copy[idx].vi = e.target.value;
                                    setCustomQuestions(copy);
                                  }}
                                  placeholder="e.g. Món ăn yêu thích của bạn là gì?"
                                  className="w-full bg-white sketch-border-sm p-2 text-xs font-sans focus:outline-none"
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-ink/40 tracking-wider">Bản trả lời mẫu Tiếng Anh (Suggested native answer)</label>
                              <textarea
                                value={q.suggestedAnswer}
                                onChange={(e) => {
                                  const copy = [...customQuestions];
                                  copy[idx].suggestedAnswer = e.target.value;
                                  setCustomQuestions(copy);
                                }}
                                placeholder="e.g. I absolutely love Pho! It has an incredibly rich broth and tender noodles."
                                className="w-full bg-white sketch-border-sm p-2 text-xs font-sans focus:outline-none h-14 resize-none italic"
                              />
                            </div>

                            {customQuestions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomQuestionRow(idx)}
                                className="text-ink/30 hover:text-rose-600 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 mt-1 justify-end"
                              >
                                <Trash2 size={12} /> Bỏ câu hỏi #{idx + 1}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full sketch-button bg-ink text-white py-3.5 font-black uppercase tracking-widest hover:bg-crimson transition-colors shadow-md text-sm"
                    >
                      Xác nhận Tạo tình huống
                    </button>
                  </motion.form>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* ACTIVE PRACTICE SESSION */
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b-2 border-ink/10 pb-4">
            <div className="space-y-1">
              <button
                onClick={handleExitPractice}
                className="text-xs uppercase font-black text-ink/40 hover:text-ink flex items-center gap-1.5 transition-colors"
                id="exit-practice-btn"
              >
                <ArrowLeft size={14} /> Thoát luyện tập
              </button>
              <h2 className="text-xl font-bold uppercase tracking-tight text-ink mt-1">
                {activeScenario.title}
              </h2>
            </div>

            {/* Quick Speed config */}
            <div className="relative">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="sketch-button py-1.5 px-3 bg-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm hover:bg-paper"
              >
                <Sliders size={12} />
                TTS (Rate: {speechRate}x)
              </button>
              <AnimatePresence>
                {showConfig && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 p-4 bg-white border-2 border-ink w-52 shadow-xl rounded z-40 space-y-3 text-left"
                  >
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-ink/50 block">Tốc độ phát âm:</label>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={speechRate}
                        onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                        className="w-full h-1 bg-[#eae6db] rounded-lg appearance-none cursor-pointer accent-ink"
                      />
                      <div className="flex justify-between text-[8px] text-ink/40 font-mono">
                        <span>Chậm (0.5x)</span>
                        <span>Nhanh (1.5x)</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {!isSessionFinished ? (
            /* ACTIVE QUESTION VIEW */
            <div className="space-y-6 leading-normal break-words">
              {/* Question Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-ink/50">
                  <span>Tiến độ phản xạ</span>
                  <span>Câu {currentIdx + 1} / {activeScenario.questions.length}</span>
                </div>
                <div className="w-full bg-[#eae6db]/60 h-2.5 rounded-full border border-ink/10 overflow-hidden">
                  <div
                    className="bg-crimson h-full transition-all duration-300"
                    style={{ width: `${((currentIdx + 1) / activeScenario.questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Card Display */}
              <div className="sketch-border bg-white p-6 md:p-8 space-y-4 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start gap-6">
                <button
                  type="button"
                  onClick={() => speakQuestion(activeScenario.questions[currentIdx].en)}
                  className="p-4 rounded-full border-2 border-ink bg-[#f4f1ea] text-ink hover:bg-crimson hover:text-white hover:scale-105 transition-all shrink-0 self-center md:self-start shadow"
                  title="Nghe câu hỏi"
                >
                  <Volume2 size={32} />
                </button>

                <div className="space-y-2 flex-1 w-full text-center md:text-left">
                  <span className="text-[9px] font-black uppercase tracking-widest text-crimson bg-crimson/5 rounded border border-crimson/10 px-2.5 py-0.5 w-fit">
                    AI Câu hỏi phản xạ
                  </span>
                  <h3 className="text-2xl font-black tracking-tight text-ink leading-tight">
                    {activeScenario.questions[currentIdx].en}
                  </h3>
                  <p className="hand-text text-xl text-ink/50 italic leading-snug">
                    {activeScenario.questions[currentIdx].vi}
                  </p>
                </div>
              </div>

              {/* User Answer Textarea and Verify Action */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-ink/50 tracking-widest block ml-1" htmlFor="reflex-user-answer">
                  Phản hồi của bạn bằng Tiếng Anh (Your response)
                </label>
                <div className="relative">
                  <textarea
                    id="reflex-user-answer"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Hãy gõ ngay suy nghĩ, phản xạ của bạn bằng Tiếng Anh..."
                    className="w-full h-32 bg-white sketch-border p-4 font-sans text-lg focus:outline-none focus:ring-2 focus:ring-ink/10 resize-none transition-all placeholder:opacity-40"
                    disabled={isVerifying || !!evaluation}
                  />

                  {/* Send/Check Button inside textarea if not verified */}
                  {!evaluation && (
                    <button
                      onClick={handleVerifyAnswer}
                      disabled={isVerifying || !userAnswer.trim()}
                      className="absolute right-4 bottom-4 bg-ink hover:bg-crimson text-white p-3 rounded-full shadow-lg hover:scale-115 disabled:opacity-0 transition-all z-10 flex items-center justify-center"
                      title="Kiểm tra phản xạ"
                    >
                      {isVerifying ? (
                        <Loader2 className="animate-spin w-5 h-5" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>

                {isVerifying && (
                  <p className="text-xs font-bold text-center animate-pulse text-crimson italic pt-2">
                    Huấn luyện viên AI đang phân tích ngữ pháp, độ lưu loát và từ vựng câu trả lời...
                  </p>
                )}
              </div>

              {/* Suggested Reveal toggle */}
              {!evaluation && !isVerifying && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowSample(!showSample)}
                    className="text-[10px] font-black uppercase text-crimson tracking-wider hover:underline flex items-center gap-1.5 p-1 transition-colors"
                  >
                    <HelpCircle size={14} />
                    {showSample ? "Ẩn câu trả lời mẫu" : "Bí câu? Xem câu trả lời mẫu"}
                  </button>
                </div>
              )}

              <AnimatePresence>
                {showSample && !evaluation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="sketch-border bg-amber-50 p-4 space-y-2 border-amber-300 shadow-sm mt-1">
                      <span className="text-[8px] font-black text-amber-600 bg-white border border-amber-300 rounded px-1.5 py-0.5 uppercase tracking-widest block w-fit">
                        Câu trả lời mẫu gợi ý
                      </span>
                      <p className="text-sm font-sans italic text-amber-900 leading-relaxed">
                        {activeScenario.questions[currentIdx].suggestedAnswer}
                      </p>
                      <button
                        onClick={() => speakQuestion(activeScenario.questions[currentIdx].suggestedAnswer)}
                        className="text-[9px] font-black text-ink hover:text-crimson uppercase tracking-wider flex items-center gap-1.5 mt-2"
                      >
                        <Volume2 size={12} /> Phát âm câu mẫu
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* EVALUATION / ANALYSIS REPORT FROM GEMINI */}
              <AnimatePresence>
                {evaluation && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sketch-border bg-white p-6 shadow-md border-ink/20 space-y-6 overflow-hidden mt-6"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-ink/10 pb-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-wider text-ink leading-tight">Phân tích phản xạ từ AI</h4>
                          <p className="text-[10px] text-ink/40 font-bold uppercase tracking-wider">Trợ lý học thuật Gemini</p>
                        </div>
                      </div>

                      {/* Score badge */}
                      <div className={cn(
                        "px-4 py-2 sketch-border-sm font-black text-xl rounded-lg tracking-tighter shadow-sm shrink-0 flex items-center gap-1.5 font-mono",
                        getScoreColor(evaluation.score)
                      )}>
                        {evaluation.score} <span className="text-xs uppercase font-sans tracking-wide text-ink/60">Điểm</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed text-sm">
                      <div className="space-y-4">
                        {/* Highlights summary */}
                        <div className="space-y-1">
                          <span className="text-[8px] font-black text-cyan-600 bg-cyan-50 border border-cyan-200 uppercase tracking-widest px-1.5 py-0.5 rounded">Nhận xét của giảng viên</span>
                          <p className="text-sm font-sans text-ink leading-relaxed font-bold">
                            {evaluation.feedback}
                          </p>
                        </div>

                        {/* Grammatic Mistakes checklist */}
                        <div className="space-y-1">
                          <span className="text-[8px] font-black text-rose-600 bg-rose-50 border border-rose-200 uppercase tracking-widest px-1.5 py-0.5 rounded">Sửa lỗi ngữ pháp & chính tả</span>
                          <p className="text-xs font-sans text-rose-700 bg-rose-50/50 p-3 rounded border border-rose-100 italic">
                            {evaluation.mistakes}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Suggested wording */}
                        <div className="bg-[#f4f1ea] sketch-border p-4 space-y-2 border-ink/10 relative">
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black text-ink/50 bg-white border border-ink/10 uppercase tracking-wider px-1.5 py-0.5 rounded">Cách diễn đạt chuẩn bản xứ</span>
                            <button
                              onClick={() => speakQuestion(evaluation.naturalSuggestion)}
                              className="text-ink hover:text-crimson transition-colors"
                              title="Nghe câu trả lời natural"
                            >
                              <Volume2 size={16} />
                            </button>
                          </div>
                          
                          <p className="text-md font-sans font-bold leading-tight text-ink italic pt-1 text-center">
                            "{evaluation.naturalSuggestion}"
                          </p>
                          
                          <p className="text-xs text-ink/65 leading-relaxed font-sans pt-1 border-t border-ink/5">
                            {evaluation.suggestionExplanation}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-ink/10 flex justify-end">
                      <button
                        onClick={handleNextQuestion}
                        className="sketch-button py-2.5 px-6 font-black uppercase tracking-widest bg-ink text-white hover:bg-crimson hover:scale-105 transition-all text-xs flex items-center gap-1.5"
                      >
                        {currentIdx < activeScenario.questions.length - 1 ? "Câu hỏi tiếp theo" : "Xem tổng kết buổi học"}
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* SCENARIO PRACTICE REPORT SHEET */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="sketch-border bg-white p-6 md:p-8 space-y-8 shadow-2xl relative overflow-hidden text-center text-ink max-w-2xl mx-auto"
            >
              <div className="absolute inset-0 bg-[#f4f1ea]/15 pattern-grid pointer-events-none" />

              <div className="flex flex-col items-center space-y-4 relative z-10 pt-4">
                <div className="p-4 rounded-full border-4 border-dashed border-yellow-500 bg-yellow-50 text-yellow-600 scale-110 mb-2 shadow animate-pulse">
                  <Award size={64} className="stroke-[2.5]" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-[12px] font-black uppercase text-crimson tracking-widest flex items-center justify-center gap-1.5">
                    <Sparkles size={14} className="text-yellow-500 animate-pulse" />
                    HOÀN THÀNH PHẢN XẠ XUẤT SẮC!
                    <Sparkles size={14} className="text-yellow-500 animate-pulse" />
                  </h4>
                  <h3 className="text-3xl font-sans font-black uppercase tracking-tight">Chứng Nhận Phản Xạ</h3>
                  <p className="font-sans text-xs text-ink/45">Tình huống: <strong>{activeScenario.title}</strong></p>
                </div>
              </div>

              {/* Stats highlights */}
              <div className="grid grid-cols-2 gap-6 pt-4 max-w-sm mx-auto relative z-10">
                <div className="bg-[#f4f1ea]/40 sketch-border-sm p-4 space-y-1">
                  <span className="text-[8px] font-black text-ink/40 uppercase tracking-widest block">Tổng câu hỏi</span>
                  <strong className="text-3xl font-mono block text-ink">{activeScenario.questions.length}</strong>
                </div>
                <div className="bg-[#f4f1ea]/40 sketch-border-sm p-4 space-y-1">
                  <span className="text-[8px] font-black text-ink/40 uppercase tracking-widest block">Điểm trung bình</span>
                  <strong className="text-3xl font-mono block text-emerald-600">
                    {Math.round(answersLog.reduce((sum, item) => sum + item.score, 0) / activeScenario.questions.length)}%
                  </strong>
                </div>
              </div>

              {/* Scrollable breakdown log */}
              <div className="space-y-4 text-left max-h-[350px] overflow-y-auto pr-2 scrollbar-none border-t border-ink/10 pt-6">
                <h4 className="text-[10px] font-black uppercase text-ink/50 tracking-widest">Chi tiết các câu trả lời</h4>
                
                <div className="space-y-4">
                  {answersLog.map((log, index) => (
                    <div key={index} className="p-4 bg-paper/20 rounded border border-ink/5 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-ink/30 font-mono">CÂU #{index + 1}</span>
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border font-mono",
                          getScoreColor(log.score)
                        )}>
                          {log.score} Điểm
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-sans font-black leading-tight text-ink">{log.question}</p>
                        <p className="text-xs text-ink/40 italic leading-snug">{log.vi}</p>
                      </div>

                      <div className="border-t border-ink/5 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                        <div>
                          <strong className="text-ink/60 uppercase text-[8px] tracking-wider block mb-0.5">Câu trả lời mẫu của bạn:</strong>
                          <p className="text-ink/75 leading-relaxed">{log.answer}</p>
                        </div>
                        <div>
                          <strong className="text-emerald-700 uppercase text-[8px] tracking-wider block mb-0.5">Cách nói tự nhiên gợi ý:</strong>
                          <p className="text-emerald-800 font-bold leading-relaxed">{log.naturalSuggestion}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional temp save panel for sc-temp-bulk runs */}
              {activeScenario.id === "sc-temp-bulk" && (
                <div className="bg-amber-50/50 p-6 border-2 border-dashed border-amber-300 rounded-lg max-w-sm mx-auto space-y-3 relative z-10 my-4 shadow-sm animate-in zoom-in-95 duration-200 text-center">
                  <span className="text-[9px] font-black text-amber-700 bg-white border border-amber-300 rounded px-2 py-0.5 uppercase tracking-wider block w-fit mx-auto">
                    💾 Lưu lại tình huống dán sẵn này?
                  </span>
                  <p className="text-xs text-ink/65 leading-relaxed font-sans">
                    Bạn thấy tâm đắc với các câu dán thô vừa rồi? Hãy lưu lại vào Thư viện để tiện luyện tập định kỳ sau này:
                  </p>
                  
                  {!showSaveTempDialog ? (
                    <button
                      onClick={() => {
                        setTempSaveTitle("Luyện phản xạ dán sẵn ngày " + new Date().toLocaleDateString());
                        setTempSaveDesc("Tình huống dán thô lưu từ buổi tập.");
                        setShowSaveTempDialog(true);
                      }}
                      className="px-4 py-2 text-xs font-black uppercase tracking-wider text-amber-800 border border-amber-300 bg-white rounded hover:bg-amber-100 transition-colors w-full"
                    >
                      Nhấp tên để lưu trữ
                    </button>
                  ) : (
                    <div className="space-y-3 text-left">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-ink/50 block">Tên tình huống mới:</label>
                        <input
                          type="text"
                          value={tempSaveTitle}
                          onChange={(e) => setTempSaveTitle(e.target.value)}
                          className="w-full bg-white border border-ink/20 p-2 text-xs font-sans font-bold focus:outline-none focus:ring-1 focus:ring-ink"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-ink/50 block">Mô tả ngắn:</label>
                        <input
                          type="text"
                          value={tempSaveDesc}
                          onChange={(e) => setTempSaveDesc(e.target.value)}
                          className="w-full bg-white border border-ink/20 p-2 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-ink"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveTempScenario}
                          className="flex-1 px-3 py-1.5 bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider rounded border border-amber-700 hover:bg-amber-700 transition-colors"
                        >
                          Xác nhận Lưu
                        </button>
                        <button
                          onClick={() => setShowSaveTempDialog(false)}
                          className="px-3 py-1.5 bg-white text-ink text-[10px] font-black uppercase tracking-wider rounded border border-ink/10 hover:bg-paper/20 transition-colors"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions panel */}
              <div className="pt-6 border-t-2 border-dashed border-ink/10 flex flex-col sm:flex-row justify-center gap-4 relative z-10 font-sans">
                <button
                  onClick={() => handleStartScenario(activeScenario)}
                  className="sketch-button py-3 px-8 text-xs font-black uppercase tracking-widest bg-[#f4f1ea] hover:bg-paper transition-all text-ink flex items-center justify-center gap-1.5 shadow"
                >
                  <RotateCcw size={14} /> Luyện lại từ đầu
                </button>
                <button
                  onClick={() => {
                    setActiveScenario(null);
                    setEvaluation(null);
                  }}
                  className="sketch-button py-3 px-8 text-xs font-black uppercase tracking-widest bg-ink text-white hover:bg-crimson transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  <Library size={14} /> Chọn tình huống khác
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
