import React, { useState, useEffect, useRef } from "react";
import type { Word } from "../types";
import { SentenceBySentencePractice } from "./SentenceBySentencePractice";
import { 
  Play, RotateCcw, Volume2, Mic, MicOff, Check, AlertCircle, BookOpen, Star, HelpCircle, 
  ArrowRight, Loader2, Search, Plus, Youtube, Headphones, Sparkles, BookText, 
  ChevronRight, MessageSquare, ListCheck, X, Sparkle, RefreshCw, VolumeX
} from "lucide-react";
import YouTube from "react-youtube";
import { motion, AnimatePresence } from "motion/react";

function getAbsoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  let origin = window.location.origin;
  if (!origin || origin === "null") {
    try {
      const url = new URL(window.location.href);
      origin = `${url.protocol}//${url.host}`;
    } catch (e) {
      origin = "";
    }
  }
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

const RECOMMENDED_VIDEOS = [
  { id: "sY7L5Y_yUPg", title: "Daily English Conversation Topics for Beginners", duration: "10:14" },
  { id: "J3_S81yBia4", title: "How to Introduce Yourself Fluently", duration: "8:25" },
  { id: "UuB2pX7n6-M", title: "10 Essential Idioms for Everyday Success", duration: "6:12" }
];

export function TranslationPractice({
  words,
  setWords
}: {
  words: Word[];
  setWords: (words: Word[]) => void;
}) {
  const [practiceMode, setPracticeMode] = useState<"youtube" | "free">("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState("");
  const [learningPackage, setLearningPackage] = useState<any | null>(null);
  
  // YouTube Player State
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [player, setPlayer] = useState<any | null>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [activeSubIndex, setActiveSubIndex] = useState(-1);
  const [autoScoll, setAutoScroll] = useState(true);

  // Tab State for YouTube Mode
  const [activeTab, setActiveTab] = useState<"subtitles" | "pronunciation" | "listening" | "conversation" | "vocabulary" | "quizzes">("subtitles");

  // Dictionary Lookup State
  const [lookupWord, setLookupWord] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupData, setLookupData] = useState<any | null>(null);
  const [wordSavedStatus, setWordSavedStatus] = useState(false);

  // Pronunciation Practice State
  const [scoringSpeech, setScoringSpeech] = useState<number | null>(null);
  const [isRecordingSpeech, setIsRecordingSpeech] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [activePronIndex, setActivePronIndex] = useState(0);
  const recognitionRef = useRef<any>(null);

  // Listening/Dictation Practice State
  const [listeningAnswers, setListeningAnswers] = useState<Record<string, string>>({});
  const [listeningResults, setListeningResults] = useState<Record<string, "correct" | "incorrect" | "hint" | null>>({});

  // Conversation Simulation State
  const [selectedDialogueTurn, setSelectedDialogueTurn] = useState<number | null>(null);

  // Quizzes State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Scroll ref for subtitles auto scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Browser Speech-to-Text Initialization
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      recognitionRef.current = rec;
    }
  }, []);

  // Sync Subtitles highlight during player playback
  useEffect(() => {
    let timer: any;
    if (player && activeTab === "subtitles") {
      timer = setInterval(() => {
        try {
          const t = player.getCurrentTime();
          setPlaybackTime(t);
          if (learningPackage && learningPackage.subtitles) {
            const idx = learningPackage.subtitles.findIndex((sub: any) => 
              t >= sub.startSec && t <= (sub.startSec + sub.durationSec)
            );
            if (idx !== -1 && idx !== activeSubIndex) {
              setActiveSubIndex(idx);
              if (autoScoll && scrollContainerRef.current) {
                const activeEl = scrollContainerRef.current.querySelector(`[data-sub-idx="${idx}"]`);
                if (activeEl) {
                  activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }
            }
          }
        } catch (e) {}
      }, 350);
    }
    return () => clearInterval(timer);
  }, [player, learningPackage, activeSubIndex, autoScoll, activeTab]);

  // Extract video ID from any YouTube URL format
  const extractYoutubeId = (url: string) => {
    if (!url) return null;
    const trimmed = url.trim();
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/;
    const match = trimmed.match(regExp);
    if (match && match[1]) return match[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    try {
      const urlObj = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      return urlObj.searchParams.get("v") || urlObj.pathname.split("/").pop()?.split("?")[0] || null;
    } catch (e) {
      const matchFallback = url.match(/[a-zA-Z0-9_-]{11}/);
      return matchFallback ? matchFallback[0] : null;
    }
  };

  const handleStartAnalysis = async (id: string, customTitle?: string) => {
    setIsAnalyzing(true);
    setAnalyzingStep("Đang kết nối để tải phụ đề video...");
    setYoutubeId(id);
    setLearningPackage(null);

    try {
      // 1. Fetch transcript segments from server API
      const transcriptRes = await fetch(getAbsoluteUrl(`/api/transcript?videoId=${id}`));
      const transcriptData = await transcriptRes.json();
      
      if (!transcriptRes.ok || transcriptData.error) {
        throw new Error(transcriptData.error || "Cannot load YouTube transcript.");
      }

      setAnalyzingStep("Gemini 3.5 đang biên soạn bộ tư liệu 4YOU (Phụ đề, Luyện nói, Luyện nghe, Hội thoại, Từ vựng, Trắc nghiệm)...");

      // 2. Query Gemini 4You Package API to get full structured content
      const packageRes = await fetch(getAbsoluteUrl("/api/translation/generate-4you-package"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: id,
          transcript: transcriptData.transcript,
          title: customTitle || "YouTube Lesson"
        })
      });

      if (!packageRes.ok) {
        throw new Error("Lỗi khi kết nối với học trình trích xuất.");
      }

      const packageData = await packageRes.json();
      setLearningPackage(packageData);
      setActiveTab("subtitles");
      // Reset quiz states
      setQuizAnswers({});
      setQuizSubmitted(false);
      setScore(null);
      setListeningAnswers({});
      setListeningResults({});
      setActivePronIndex(0);
      setScoringSpeech(null);
    } catch (e: any) {
      console.error("Lỗi phân tích học trình 4YOU:", e);
      alert("Lỗi phân tích: " + e.message + "\nHệ thống đã tự động kích hoạt gói bài mẫu để bạn học.");
      // Fallback sample data package
      setLearningPackage({
        subtitles: [
          { id: "sub0", en: "Welcome back to our English communication lesson.", vi: "Chào mừng bạn quay trở lại với bài học giao tiếp tiếng Anh.", startSec: 1, durationSec: 4 },
          { id: "sub1", en: "Today, we'll explore essential phrases for daily life.", vi: "Hôm nay chúng ta sẽ khám phá các cụm từ thiết yếu trong cuộc sống.", startSec: 5, durationSec: 5 },
          { id: "sub2", en: "This is a great opportunity to master native accents.", vi: "Đây là một cơ hội tuyệt vời để học phát âm chuẩn bản xứ.", startSec: 10, durationSec: 5 },
          { id: "sub3", en: "Don't be afraid of making mistakes when practicing.", vi: "Đừng lo sợ việc mắc lỗi khi luyện nói tiếng Anh.", startSec: 15, durationSec: 4 }
        ],
        pronunciation: [
          {
            id: "p1",
            en: "This is a great opportunity to practice.",
            vi: "Đây là một cơ hội tuyệt vời để thực hành.",
            tips: "Nối âm: 'great_opportunity' đọc mềm mại thành 'grea-topportunity'. Nuốt âm /t/ nhẹ.",
            words: [
              { word: "opportunity", ipa: "/ˌɒp.əˈtʃuː.nə.ti/", meaning: "cơ hội, dịp may" },
              { word: "practice", ipa: "/ˈpræk.tɪs/", meaning: "thực hành, tập luyện" },
              { word: "great", ipa: "/ɡreɪt/", meaning: "tuyệt vời" }
            ]
          }
        ],
        listening: [
          {
            id: "l1",
            en: "Focus on your communication goals every day.",
            vi: "Tập trung vào các mục tiêu giao tiếp của bạn mỗi ngày.",
            blankText: "Focus on your [blank] goals every day.",
            missingWord: "communication",
            clue: "ngành giao tiếp, sự trao đổi thông tin",
            startSec: 1
          }
        ],
        conversation: [
          { speaker: "Joe", textEn: "Hey, do you find shadowing practice useful?", textVi: "Này, cậu thấy luyện shadowing có ích không?" },
          { speaker: "Hana", textEn: "Yes! It definitely boosts our speaking confidence.", textVi: "Có chứ! Nó chắc chắn làm tăng sự tự tin khi nói của tụi mình." }
        ],
        vocabulary: [
          { vocabulary: "opportunity", wordType: "noun", ipa: "/ˌɒp.əˈtʃuː.nə.ti/", definition: "Một tình huống thuận lợi làm việc gì có khả năng", example: "Studying abroad is a once-in-a-lifetime opportunity." }
        ],
        quizzes: [
          {
            id: "q1",
            type: "mc",
            question: "What is the meaning of the word 'opportunity'?",
            options: ["Cơ hội", "Khó khăn", "Phép màu", "Thất bại"],
            answer: "Cơ hội",
            explanation: "'Opportunity' dịch chuẩn xác nhất là cơ hội, thời cơ."
          }
        ]
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const speakText = (text: string) => {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const handleWordLookup = async (word: string) => {
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").trim();
    if (!cleanWord) return;
    setLookupWord(cleanWord);
    setLookupLoading(true);
    setLookupData(null);
    setWordSavedStatus(words.some(w => w.vocabulary.toLowerCase() === cleanWord.toLowerCase()));

    try {
      const res = await fetch(getAbsoluteUrl("/api/translation/define-word"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: cleanWord })
      });
      if (res.ok) {
        const data = await res.json();
        setLookupData(data);
        setWordSavedStatus(words.some(w => w.vocabulary.toLowerCase() === (data.vocabulary || cleanWord).toLowerCase()));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSaveToWordbook = (item: any) => {
    const vocab = item.vocabulary || lookupWord || "";
    if (!vocab) return;

    const exists = words.some(w => w.vocabulary.toLowerCase() === vocab.toLowerCase());
    if (exists) {
      setWordSavedStatus(true);
      return;
    }

    const newWord: Word = {
      id: crypto.randomUUID(),
      vocabulary: vocab,
      wordType: item.wordType || "noun",
      ipa: item.ipa || "",
      definition: item.definition || "Xem ý nghĩa từ YouTube",
      examples: item.example ? [item.example] : (item.examples ? item.examples : []),
      tags: ["YouTube Subtitles"],
      difficulty: 0,
      lastReviewed: new Date().toISOString(),
      nextReview: new Date().toISOString()
    };

    setWords([newWord, ...words]);
    setWordSavedStatus(true);
  };

  const startPronunciationRecording = (targetText: string) => {
    if (!recognitionRef.current) {
      alert("Trình duyệt không hỗ trợ micro nhận diện giọng nói. Bạn vui lòng sử dụng Google Chrome.");
      return;
    }
    setSpokenText("");
    setScoringSpeech(null);
    setIsRecordingSpeech(true);

    recognitionRef.current.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setSpokenText(resultText);

      // Simple character / word normalized similarity check
      const normTarget = targetText.toLowerCase().replace(/[.,!?;:()"'’\-]/g, "").replace(/\s+/g, " ").trim();
      const normSpoken = resultText.toLowerCase().replace(/[.,!?;:()"'’\-]/g, "").replace(/\s+/g, " ").trim();

      if (normTarget === normSpoken) {
        setScoringSpeech(100);
      } else {
        const tWords = normTarget.split(" ");
        const sWords = normSpoken.split(" ");
        let matching = 0;
        tWords.forEach(w => {
          if (sWords.includes(w)) matching++;
        });
        const finalScore = Math.min(100, Math.round((matching / tWords.length) * 100));
        setScoringSpeech(finalScore);
      }
    };

    recognitionRef.current.onerror = () => {
      setIsRecordingSpeech(false);
    };

    recognitionRef.current.onend = () => {
      setIsRecordingSpeech(false);
    };

    recognitionRef.current.start();
  };

  const handleVerifyListening = (id: string, input: string, correct: string) => {
    if (!input) return;
    const cleanIn = input.toLowerCase().replace(/[.,!?;:()"'’\-]/g, "").trim();
    const cleanCorr = correct.toLowerCase().replace(/[.,!?;:()"'’\-]/g, "").trim();

    if (cleanIn === cleanCorr) {
      setListeningResults(prev => ({ ...prev, [id]: "correct" }));
    } else {
      setListeningResults(prev => ({ ...prev, [id]: "incorrect" }));
    }
  };

  const handleQuizSubmit = () => {
    if (!learningPackage?.quizzes) return;
    let correct = 0;
    const total = learningPackage.quizzes.length;
    const results: Record<string, boolean> = {};

    learningPackage.quizzes.forEach((q: any) => {
      const uAns = (quizAnswers[q.id] || "").trim().toLowerCase();
      const cAns = q.answer.trim().toLowerCase();
      const isCorrect = uAns === cAns || q.options?.findIndex((o: string) => o.toLowerCase() === uAns) === q.options?.findIndex((o: string) => o.toLowerCase() === cAns);
      
      results[q.id] = !!isCorrect;
      if (isCorrect) correct++;
    });

    setScore(Math.round((correct / total) * 100));
    setQuizSubmitted(true);
  };

  return (
    <div className="w-full max-w-full md:px-2 py-2 overflow-x-hidden">
      {/* Segment Selector / Hub Title */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-paper sketch-border-sm p-4 w-full">
        <div className="flex items-center gap-3">
          <div className="bg-amber-100 text-amber-800 p-2 rounded-xl sketch-border-sm">
            <Sparkle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-sans font-bold text-xl md:text-2xl text-ink uppercase tracking-wider flex items-center gap-2">
              Bản dịch & English practice
            </h2>
            <p className="text-xs text-ink/70 font-mono">APP 4YOU MULTIPRACTICE CORE</p>
          </div>
        </div>

        {/* Practice Mode Selector */}
        <div className="flex items-center gap-1 bg-[#eae5d8] p-1 rounded-full sketch-border-sm">
          <button
            onClick={() => setPracticeMode("youtube")}
            className={`font-sans font-bold text-xs px-4 py-2 rounded-full transition-all flex items-center gap-2 ${practiceMode === "youtube" ? "bg-ink text-paper shadow-sm scale-105" : "text-ink/60 hover:text-ink"}`}
          >
            <Youtube className="w-4 h-4" /> YouTube Video
          </button>
          <button
            onClick={() => setPracticeMode("free")}
            className={`font-sans font-bold text-xs px-4 py-2 rounded-full transition-all flex items-center gap-2 ${practiceMode === "free" ? "bg-ink text-paper shadow-sm scale-105" : "text-ink/60 hover:text-ink"}`}
          >
            <BookText className="w-4 h-4" /> Dịch tự do từng câu
          </button>
        </div>
      </div>

      {practiceMode === "free" ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <SentenceBySentencePractice words={words} setWords={setWords} />
        </div>
      ) : (
        <div className="space-y-6 w-full max-w-full">
          {/* Analyze / Input Segment */}
          {!learningPackage && (
            <div className="bg-paper sketch-border-lg p-6 md:p-10 text-center flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center sketch-border-sm relative">
                <Youtube className="w-10 h-10" />
                <Sparkle className="w-4 h-4 text-ink absolute right-1 top-1 animate-pulse" />
              </div>
              <div className="max-w-xl mx-auto space-y-2">
                <h3 className="font-sans font-bold text-xl text-ink">Bắt đầu học Anh văn kiểu 4YOU</h3>
                <p className="text-sm text-ink/60">
                  Dán bất kỳ liên kết video học tiếng Anh nào từ YouTube. Trình AI sẽ tự động phân tích và tạo bài học phụ đề song ngữ, luyện nghe chuyên sâu, phát âm, hội thoại, trích xuất từ vựng và bài kiểm tra cá nhân hóa.
                </p>
              </div>

              {isAnalyzing ? (
                <div className="flex flex-col items-center space-y-3 py-6 bg-[#fcfbf9] px-6 rounded-2xl sketch-border-sm max-w-lg w-full">
                  <Loader2 className="w-8 h-8 text-ink animate-spin" />
                  <p className="text-sm text-ink font-sans font-medium">{analyzingStep}</p>
                  <p className="text-[10px] text-ink/40 font-mono animate-pulse">Vui lòng chờ khoảng 10 đến 25 giây...</p>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const id = extractYoutubeId(youtubeUrl);
                    if (!id) {
                      alert("Đường dẫn YouTube không hợp lệ. Vui lòng thử lại!");
                      return;
                    }
                    handleStartAnalysis(id);
                  }}
                  className="w-full max-w-2xl flex flex-col sm:flex-row gap-2"
                >
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="Dán liên kết YouTube (e.g. https://www.youtube.com/watch?v=sY7L5Y_yUPg)..."
                    className="flex-1 bg-white sketch-border-sm px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                  <button
                    type="submit"
                    className="bg-ink hover:bg-neutral-800 text-paper font-sans font-black uppercase text-xs tracking-wider px-6 py-3 sketch-border-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    Phân tích Video <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Recommended list */}
              {!isAnalyzing && (
                <div className="w-full max-w-2xl pt-6 border-t border-ink/5 text-left">
                  <p className="text-xs font-mono text-ink/50 uppercase mb-3 tracking-widest">Gợi ý video học ngay</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {RECOMMENDED_VIDEOS.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleStartAnalysis(v.id, v.title)}
                        className="p-3 bg-white text-left list-none rounded-xl hover:bg-amber-50 cursor-pointer text-ink border-2 border-dashed border-ink/20 hover:border-ink/50 transition-all text-xs"
                      >
                        <p className="font-sans font-bold line-clamp-1 mb-1">{v.title}</p>
                        <div className="flex items-center justify-between text-[11px] text-ink/65 font-mono">
                          <span>YouTube Lesson</span>
                          <span>{v.duration}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Core Learner Workspace */}
          {learningPackage && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-full">
              {/* Left Column: Player & Subtitles & Features tabs */}
              <div className="lg:col-span-8 flex flex-col gap-4 max-w-full">
                
                {/* Embedded Video Player container */}
                <div className="bg-black w-full aspect-video rounded-3xl overflow-hidden shadow-lg sketch-border-sm relative group">
                  <YouTube
                    videoId={youtubeId || ""}
                    containerClassName="w-full h-full"
                    className="w-full h-full"
                    onReady={(event) => setPlayer(event.target)}
                    opts={{
                      width: "100%",
                      height: "100%",
                      playerVars: {
                        autoplay: 1,
                        controls: 1,
                        modestbranding: 1,
                        rel: 0
                      }
                    }}
                  />
                  
                  {/* Action Bar overlay */}
                  <div className="absolute top-2 right-2 bg-paper/95 px-3 py-1.5 rounded-full shadow-md backdrop-blur-md sketch-border-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button 
                      onClick={() => {
                        setLearningPackage(null);
                        setYoutubeId(null);
                        setPlayer(null);
                      }}
                      className="text-xs font-sans font-bold text-ink/80 hover:text-red-600 flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Chọn video khác
                    </button>
                  </div>
                </div>

                {/* Tab Controls (4You Categories) */}
                <div className="bg-[#fcfbf9] sketch-border-sm p-1 flex items-center gap-1 overflow-x-auto w-full [&::-webkit-scrollbar]:hidden">
                  <button
                    onClick={() => setActiveTab("subtitles")}
                    className={`px-3 py-2 text-xs font-sans font-bold uppercase rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${activeTab === "subtitles" ? "bg-ink text-paper" : "text-ink/60 hover:text-ink hover:bg-ink/5"}`}
                  >
                    <BookText className="w-4 h-4" /> 🎬 Phụ Đề
                  </button>
                  <button
                    onClick={() => setActiveTab("pronunciation")}
                    className={`px-3 py-2 text-xs font-sans font-bold uppercase rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${activeTab === "pronunciation" ? "bg-ink text-paper" : "text-ink/60 hover:text-ink hover:bg-ink/5"}`}
                  >
                    <Mic className="w-4 h-4" /> 🗣️ Phát Âm
                  </button>
                  <button
                    onClick={() => setActiveTab("listening")}
                    className={`px-3 py-2 text-xs font-sans font-bold uppercase rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${activeTab === "listening" ? "bg-ink text-paper" : "text-ink/60 hover:text-ink hover:bg-ink/5"}`}
                  >
                    <Headphones className="w-4 h-4" /> 🎧 Luyện Nghe
                  </button>
                  <button
                    onClick={() => setActiveTab("conversation")}
                    className={`px-3 py-2 text-xs font-sans font-bold uppercase rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${activeTab === "conversation" ? "bg-ink text-paper" : "text-ink/60 hover:text-ink hover:bg-ink/5"}`}
                  >
                    <MessageSquare className="w-4 h-4" /> 💬 Hội Thoại
                  </button>
                  <button
                    onClick={() => setActiveTab("vocabulary")}
                    className={`px-3 py-2 text-xs font-sans font-bold uppercase rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${activeTab === "vocabulary" ? "bg-ink text-paper" : "text-ink/60 hover:text-ink hover:bg-ink/5"}`}
                  >
                    <BookOpen className="w-4 h-4" /> 📚 Từ Vựng
                  </button>
                  <button
                    onClick={() => setActiveTab("quizzes")}
                    className={`px-3 py-2 text-xs font-sans font-bold uppercase rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${activeTab === "quizzes" ? "bg-ink text-paper" : "text-ink/60 hover:text-ink hover:bg-ink/5"}`}
                  >
                    <ListCheck className="w-4 h-4" /> 📝 Kiểm Tra
                  </button>
                </div>

                {/* Active Tab View Rendering */}
                <div className="bg-paper sketch-border-sm p-4 md:p-6 min-h-[350px] w-full">
                  
                  {/* TAB 1: SUBTITLES (Bilingual Scrolling Player) */}
                  {activeTab === "subtitles" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-xs font-mono text-ink/50 uppercase tracking-widest">Bilingual Playback Subtitles</span>
                        <label className="flex items-center gap-2 text-xs text-ink/75 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={autoScoll}
                            onChange={(e) => setAutoScroll(e.target.checked)}
                            className="rounded accent-ink cursor-pointer"
                          />
                          Tự động cuộn theo video
                        </label>
                      </div>

                      <div 
                        ref={scrollContainerRef}
                        className="max-h-[350px] overflow-y-auto pr-2 space-y-3 divide-y divide-ink/5"
                      >
                        {learningPackage.subtitles?.map((sub: any, idx: number) => {
                          const isActive = idx === activeSubIndex;
                          return (
                            <div
                              key={sub.id || idx}
                              data-sub-idx={idx}
                              className={`py-3 px-2 rounded-xl transition-all duration-300 ${isActive ? "bg-amber-50/70 border-l-4 border-amber-500 scale-[1.01] shadow-sm" : "hover:bg-amber-50/20 active:opacity-90"}`}
                            >
                              <div className="flex gap-3 justify-between items-start">
                                <div className="space-y-1">
                                  {/* Clickable English Words for Lookup */}
                                  <div className="font-sans font-semibold text-[15px] text-ink leading-relaxed flex flex-wrap gap-x-1 gap-y-0.5">
                                    {sub.en.split(/\s+/).map((word: string, wIdx: number) => (
                                      <span
                                        key={wIdx}
                                        onClick={() => handleWordLookup(word)}
                                        className="cursor-help hover:text-amber-700 hover:underline hover:bg-amber-100/50 rounded px-0.5"
                                      >
                                        {word}
                                      </span>
                                    ))}
                                  </div>
                                  <p className="font-sans text-xs text-ink/65 leading-relaxed">{sub.vi}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (player) {
                                      player.seekTo(sub.startSec, true);
                                      player.playVideo();
                                    }
                                  }}
                                  className="bg-transparent hover:bg-ink hover:text-paper text-ink p-1 rounded-lg transition-colors border border-ink/10 cursor-pointer shrink-0"
                                  title="Phát phân đoạn này"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PRONUNCIATION */}
                  {activeTab === "pronunciation" && (
                    <div className="space-y-6">
                      <div className="border-b pb-2 flex justify-between items-center">
                        <span className="text-xs font-mono text-ink/50 uppercase">Phát âm huấn luyện học viên</span>
                        <span className="text-xs text-ink/70 font-sans">
                          Câu {activePronIndex + 1} trên {learningPackage.pronunciation?.length || 0}
                        </span>
                      </div>

                      {learningPackage.pronunciation && learningPackage.pronunciation[activePronIndex] && (
                        <div className="space-y-6">
                          {/* Main sentence panel */}
                          <div className="bg-amber-50/30 border-2 border-dashed border-amber-200 p-6 rounded-2xl text-center space-y-3">
                            <p className="text-lg md:text-xl font-sans font-black tracking-tight text-ink">
                              "{learningPackage.pronunciation[activePronIndex].en}"
                            </p>
                            <p className="text-sm font-sans text-ink/70">
                              {learningPackage.pronunciation[activePronIndex].vi}
                            </p>
                            <p className="text-[13px] font-mono text-amber-800 bg-amber-50/60 inline-block px-3 py-1 rounded-full text-center">
                              💡 Mẹo: {learningPackage.pronunciation[activePronIndex].tips}
                            </p>
                          </div>

                          {/* Words IPA lookup */}
                          <div>
                            <p className="text-xs font-mono text-ink/60 uppercase mb-2">Các từ quan trọng</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {learningPackage.pronunciation[activePronIndex].words?.map((w: any, idx: number) => (
                                <div key={idx} className="p-3 bg-white hover:bg-neutral-50 rounded-xl border flex items-center justify-between">
                                  <div>
                                    <p className="font-sans font-black text-sm text-ink">{w.word}</p>
                                    <p className="font-mono text-xs text-ink/65">{w.ipa}</p>
                                    <p className="text-[11px] text-ink/60 italic">{w.meaning}</p>
                                  </div>
                                  <button
                                    onClick={() => speakText(w.word)}
                                    className="p-1 rounded-full border hover:bg-amber-100 text-ink/70 hover:text-ink cursor-pointer"
                                  >
                                    <Volume2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Controller section */}
                          <div className="flex flex-col items-center space-y-4 pt-4 border-t">
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => speakText(learningPackage.pronunciation[activePronIndex].en)}
                                className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-ink font-sans font-bold text-xs rounded-full sketch-border-sm cursor-pointer flex items-center gap-2"
                              >
                                <Volume2 className="w-4 h-4" /> Nghe phát âm mẫu
                              </button>

                              <button
                                onClick={() => startPronunciationRecording(learningPackage.pronunciation[activePronIndex].en)}
                                className={`px-6 py-2.5 rounded-full font-sans font-bold text-xs sketch-border-sm flex items-center gap-2 cursor-pointer transition-all ${isRecordingSpeech ? "bg-red-500 text-white animate-pulse" : "bg-ink text-paper hover:bg-neutral-800"}`}
                              >
                                {isRecordingSpeech ? (
                                  <>
                                    <MicOff className="w-4 h-4" /> Đang ghi âm...
                                  </>
                                ) : (
                                  <>
                                    <Mic className="w-4 h-4" /> Luyện nói ngay
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Scoring & Recognition text */}
                            <AnimatePresence mode="wait">
                              {spokenText && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0 }}
                                  className="w-full text-center space-y-2 bg-[#fdfdfd] p-4 rounded-xl border"
                                >
                                  <p className="text-xs font-mono text-ink/50 uppercase">Giọng nói nhận diện được</p>
                                  <p className="text-sm font-sans font-medium text-ink italic">"{spokenText}"</p>
                                  {scoringSpeech !== null && (
                                    <div className="flex flex-col items-center py-2 space-y-1">
                                      <span className={`text-xl font-mono font-black ${scoringSpeech >= 80 ? "text-green-600" : scoringSpeech >= 50 ? "text-amber-600" : "text-red-500"}`}>
                                        Độ tương đồng: {scoringSpeech}%
                                      </span>
                                      <p className="text-xs text-ink/65 font-sans">
                                        {scoringSpeech >= 80 ? "Xuất sắc! Bạn phát âm cực kỳ xuất sắc." : scoringSpeech >= 50 ? "Khá tốt. Hãy tự tin luyện tập thêm để chuẩn xác hơn!" : "Chưa khớp lắm, hãy nghe lại phát âm mẫu và thử luyện nói lại."}
                                      </p>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Pagination buttons */}
                            <div className="flex items-center justify-between w-full pt-2">
                              <button
                                disabled={activePronIndex === 0}
                                onClick={() => {
                                  setActivePronIndex(prev => prev - 1);
                                  setSpokenText("");
                                  setScoringSpeech(null);
                                }}
                                className="px-3 py-1 bg-white sketch-border-sm rounded-lg hover:bg-neutral-50 text-xs text-ink font-sans disabled:opacity-40 font-bold"
                              >
                                Câu trước
                              </button>
                              <button
                                disabled={activePronIndex === (learningPackage.pronunciation?.length || 1) - 1}
                                onClick={() => {
                                  setActivePronIndex(prev => prev + 1);
                                  setSpokenText("");
                                  setScoringSpeech(null);
                                }}
                                className="px-3 py-1 bg-white sketch-border-sm rounded-lg hover:bg-neutral-50 text-xs text-ink font-sans disabled:opacity-40 font-bold"
                              >
                                Câu tiếp theo
                              </button>
                            </div>

                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: LISTENING PRACTICE */}
                  {activeTab === "listening" && (
                    <div className="space-y-6">
                      <div className="border-b pb-2 flex justify-between items-center">
                        <span className="text-xs font-mono text-ink/50 uppercase">Luyện Nghe / Điền Vào Ô Trống</span>
                        <span className="text-[11px] text-amber-700 font-mono bg-amber-50 px-2.5 py-0.5 rounded-full">Seeks Video Context</span>
                      </div>

                      <div className="space-y-5 max-h-[350px] overflow-y-auto pr-2 divide-y divide-neutral-100">
                        {learningPackage.listening?.map((item: any, idx: number) => (
                          <div key={item.id || idx} className="pt-4 first:pt-0 space-y-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1.5 flex-1">
                                <span className="font-mono text-[10px] text-ink/40 uppercase">Thử Thách {idx + 1}</span>
                                
                                {/* Fill in the blank display sentence */}
                                <p className="font-sans text-base font-bold text-ink leading-relaxed">
                                  {item.blankText}
                                </p>
                                
                                <p className="text-xs text-ink/70">
                                  {item.vi}
                                </p>

                                {listeningResults[item.id] === "hint" && (
                                  <p className="text-xs text-amber-800 bg-amber-50/50 p-2 rounded-lg border-l-2 border-amber-500 flex items-center gap-1.5 font-mono">
                                    <AlertCircle className="w-3.5 h-3.5" /> Gợi ý: {item.clue} (Có {item.missingWord.length} chữ cái)
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  if (player) {
                                    player.seekTo(item.startSec, true);
                                    player.playVideo();
                                  }
                                }}
                                className="bg-amber-100 hover:bg-amber-200 text-amber-800 p-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer font-sans font-bold text-[11px] shrink-0 border"
                              >
                                <Headphones className="w-3.5 h-3.5" /> Nghe câu này
                              </button>
                            </div>

                            {/* Answer typing row */}
                            <div className="flex items-center gap-2 w-full max-w-lg">
                              <input
                                type="text"
                                placeholder="Gõ từ khóa còn thiếu..."
                                value={listeningAnswers[item.id] || ""}
                                onChange={(e) => setListeningAnswers(prev => ({ ...prev, [item.id]: e.target.value }))}
                                disabled={listeningResults[item.id] === "correct"}
                                className={`flex-1 min-w-[120px] bg-white sketch-border-sm px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ink ${listeningResults[item.id] === "correct" ? "bg-green-50 border-green-600 text-green-800" : ""}`}
                              />
                              
                              {listeningResults[item.id] !== "correct" && (
                                <>
                                  <button
                                    onClick={() => handleVerifyListening(item.id, listeningAnswers[item.id], item.missingWord)}
                                    className="px-3 py-1.5 bg-ink hover:bg-neutral-800 text-paper font-sans font-black text-[11px] rounded sketch-border-sm cursor-pointer"
                                  >
                                    Kiểm tra
                                  </button>
                                  <button
                                    onClick={() => setListeningResults(prev => ({ ...prev, [item.id]: "hint" }))}
                                    className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-ink/70 font-sans font-medium text-[11px] rounded border"
                                    title="Xem gợi ý ý nghĩa"
                                  >
                                    Gợi ý
                                  </button>
                                </>
                              )}

                              {listeningResults[item.id] === "correct" && (
                                <span className="text-green-600 font-sans text-xs font-bold flex items-center gap-1 px-2.5 py-1 bg-green-50 rounded-full border border-green-200">
                                  <Check className="w-3.5 h-3.5" /> Chuẩn xác!
                                </span>
                              )}

                              {listeningResults[item.id] === "incorrect" && (
                                <div className="flex items-center gap-2">
                                  <span className="text-red-500 font-sans text-xs font-bold flex items-center gap-1">
                                    Chưa đúng
                                  </span>
                                  <button
                                    onClick={() => {
                                      setListeningResults(prev => ({ ...prev, [item.id]: "hint" }));
                                    }}
                                    className="text-[10px] hover:underline text-amber-700"
                                  >
                                    Xem gợi ý
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: CONVERSATION SIMULATOR */}
                  {activeTab === "conversation" && (
                    <div className="space-y-6">
                      <div className="border-b pb-2 flex justify-between items-center">
                        <span className="text-xs font-mono text-ink/50 uppercase">Hội Thoại Joe & Hana</span>
                        <span className="text-xs text-ink/70 italic font-sans">Dialog practice</span>
                      </div>

                      <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                        {learningPackage.conversation?.map((turn: any, idx: number) => {
                          const isJoe = turn.speaker === "Joe";
                          const isSelected = selectedDialogueTurn === idx;
                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedDialogueTurn(idx)}
                              className={`flex gap-3 leading-relaxed rounded-2xl p-3 cursor-pointer transition-colors border ${isJoe ? "bg-white border-neutral-100" : "bg-[#fcfbf9] border-[#eae5d8]"} ${isSelected ? "ring-2 ring-ink" : "hover:bg-neutral-50"}`}
                            >
                              <div className={`w-8 h-8 rounded-full sketch-border-sm flex items-center justify-center font-sans font-black text-xs shrink-0 ${isJoe ? "bg-indigo-100 text-indigo-800" : "bg-teal-100 text-teal-800"}`}>
                                {turn.speaker[0]}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-sans font-black text-xs text-ink">{turn.speaker}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      speakText(turn.textEn);
                                    }}
                                    className="p-1 rounded hover:bg-neutral-100 text-ink/50 hover:text-ink cursor-pointer"
                                    title="Nghe hội thoại này"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <p className="font-sans text-[13px] font-semibold text-ink leading-relaxed">
                                  {turn.textEn}
                                </p>
                                <p className="font-sans text-xs text-ink/65 leading-relaxed">
                                  {turn.textVi}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-amber-50/20 p-3 rounded-xl sketch-border-sm flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-amber-700 leading-none shrink-0" />
                        <p className="text-[11px] text-ink/80 leading-normal">
                          Luyện tập hội thoại mô phỏng: Nhấp vào bất kỳ bong bóng thoại nào để chọn vai diễn và bấm nút loa để luyện nghe giọng đọc bản xứ chuẩn xác.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: VOCABULARY EXTRACT CARDS */}
                  {activeTab === "vocabulary" && (
                    <div className="space-y-6">
                      <div className="border-b pb-2 flex justify-between items-center">
                        <span className="text-xs font-mono text-ink/50 uppercase">Bộ từ vựng trích lục</span>
                        <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-sans">
                          Sổ từ vựng video
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
                        {learningPackage.vocabulary?.map((item: any, idx: number) => {
                          const isSaved = words.some(w => w.vocabulary.toLowerCase() === item.vocabulary.toLowerCase());
                          return (
                            <div
                              key={idx}
                              className="bg-white hover:bg-neutral-50/30 p-4 rounded-2xl sketch-border-sm flex flex-col justify-between space-y-4 group transition-shadow"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-baseline gap-2">
                                    <h4 className="font-sans font-black text-base text-ink tracking-tight">{item.vocabulary}</h4>
                                    <span className="text-[10px] font-mono text-ink/50 uppercase bg-neutral-100 px-1.5 py-0.5 rounded-full font-bold">
                                      {item.wordType}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => speakText(item.vocabulary)}
                                    className="p-1 rounded-full border hover:bg-amber-100 text-ink/70 hover:text-ink cursor-pointer"
                                  >
                                    <Volume2 className="w-4 h-4" />
                                  </button>
                                </div>

                                <p className="font-mono text-xs text-amber-800 bg-amber-50/50 inline-block px-2 py-0.5 rounded">
                                  {item.ipa}
                                </p>
                                
                                <p className="font-sans text-xs text-ink/85 leading-relaxed font-semibold">
                                  {item.definition}
                                </p>

                                <div className="border-t pt-2 mt-2">
                                  <span className="text-[10px] font-mono text-ink/40 uppercase block">Ví câu minh họa</span>
                                  <p className="font-sans text-xs text-ink/65 italic leading-relaxed">
                                    "{item.example}"
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={isSaved}
                                onClick={() => handleSaveToWordbook(item)}
                                className={`w-full py-2 rounded-xl text-[11px] font-sans font-black uppercase tracking-wider sketch-border-sm cursor-pointer transition-all ${isSaved ? "bg-green-100 text-green-800 opacity-80 cursor-default" : "bg-ink hover:bg-neutral-800 text-paper"}`}
                              >
                                {isSaved ? "✓ Đã lưu sổ từ" : "+ Lưu vào học sổ từ [SRS]"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 6: QUIZZES */}
                  {activeTab === "quizzes" && (
                    <div className="space-y-6">
                      <div className="border-b pb-2 flex justify-between items-center">
                        <span className="text-xs font-mono text-ink/50 uppercase">Bài kiểm tra đánh giá năng lực</span>
                        {score !== null && (
                          <span className={`text-sm font-mono font-black ${score >= 80 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-500"}`}>
                            Điểm số: {score}/100
                          </span>
                        )}
                      </div>

                      <div className="space-y-6 max-h-[350px] overflow-y-auto pr-2">
                        {learningPackage.quizzes?.map((quiz: any, idx: number) => {
                          const userAns = quizAnswers[quiz.id] || "";
                          const isIncorrect = quizSubmitted && (userAns.toLowerCase() !== quiz.answer.toLowerCase() && quiz.options?.findIndex((o: string) => o.toLowerCase() === userAns.toLowerCase()) !== quiz.options?.findIndex((o: string) => o.toLowerCase() === quiz.answer.toLowerCase()));
                          const isCorrect = quizSubmitted && !isIncorrect && userAns;
                          
                          return (
                            <div key={quiz.id || idx} className="space-y-3 bg-white p-4 rounded-2xl border">
                              <div className="flex items-start gap-2.5">
                                <span className="bg-neutral-100 font-sans font-black text-xs text-ink px-2.5 py-1 rounded-lg">
                                  Q{idx + 1}
                                </span>
                                <div className="space-y-1">
                                  <p className="font-sans font-bold text-sm text-ink leading-relaxed">
                                    {quiz.question}
                                  </p>
                                </div>
                              </div>

                              {/* Rendering Multiple Choice options */}
                              {quiz.type === "mc" ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-8">
                                  {quiz.options?.map((opt: string, optIdx: number) => {
                                    const isSelected = quizAnswers[quiz.id] === opt;
                                    const isOptCorrect = quiz.answer === opt || quiz.options?.findIndex((o: string) => o.toLowerCase() === opt.toLowerCase()) === quiz.options?.findIndex((o: string) => o.toLowerCase() === quiz.answer.toLowerCase());
                                    
                                    let btnClass = "bg-white hover:bg-neutral-50 text-ink/80 hover:text-ink border";
                                    if (isSelected && !quizSubmitted) {
                                      btnClass = "bg-ink text-paper border-ink";
                                    } else if (quizSubmitted) {
                                      if (isOptCorrect) {
                                        btnClass = "bg-green-50 text-green-800 border-green-600 font-bold";
                                      } else if (isSelected) {
                                        btnClass = "bg-red-50 text-red-800 border-red-600 font-bold line-through";
                                      } else {
                                        btnClass = "bg-white text-ink/40 border border-neutral-100 opacity-60";
                                      }
                                    }

                                    return (
                                      <button
                                        key={optIdx}
                                        type="button"
                                        disabled={quizSubmitted}
                                        onClick={() => setQuizAnswers(prev => ({ ...prev, [quiz.id]: opt }))}
                                        className={`p-2.5 rounded-xl text-left font-sans text-xs transition-all cursor-pointer ${btnClass}`}
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                // Spelling / Translation Box
                                <div className="pl-8 space-y-2">
                                  <input
                                    type="text"
                                    placeholder="Điền từ khóa chính xác..."
                                    value={quizAnswers[quiz.id] || ""}
                                    onChange={(e) => setQuizAnswers(prev => ({ ...prev, [quiz.id]: e.target.value }))}
                                    disabled={quizSubmitted}
                                    className={`w-full max-w-sm bg-white sketch-border-sm px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ink ${isCorrect ? "bg-green-50 border-green-600 text-green-800" : isIncorrect ? "bg-red-50 border-red-600 text-red-800" : ""}`}
                                  />
                                  {quizSubmitted && (
                                    <p className="text-xs text-green-700 font-mono">
                                      Đáp án chính xác: <span className="font-bold underline">{quiz.answer}</span>
                                    </p>
                                  )}
                                </div>
                              )}

                              {quizSubmitted && (
                                <p className="text-xs text-amber-800 bg-amber-50/50 p-2.5 rounded-xl border-l-2 border-amber-500 pl-8 font-sans leading-normal">
                                  💡 Giải thích: {quiz.explanation}
                                </p>
                              )}
                            </div>
                          );
                        })}

                        {/* Submit Actions */}
                        <div className="pt-4 border-t flex items-center gap-3">
                          {!quizSubmitted ? (
                            <button
                              onClick={handleQuizSubmit}
                              className="px-6 py-3 bg-ink hover:bg-neutral-800 text-paper font-sans font-black uppercase text-xs tracking-wider rounded sketch-border-sm cursor-pointer transition-colors active:scale-95"
                            >
                              Nộp bài kiểm tra
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setQuizAnswers({});
                                setQuizSubmitted(false);
                                setScore(null);
                              }}
                              className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-ink font-sans font-black uppercase text-xs tracking-wider rounded border cursor-pointer transition-colors"
                            >
                              Làm lại bài khác
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Right Column: Mini Dictionary Dashboard & Word Saver */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                
                {/* Visual dictionary lookup panel */}
                <div className="bg-[#fcfbf9] bg-[radial-gradient(#e1dbcd_1px,transparent_1px)] bg-[size:16px_16px] sketch-border-sm p-4 md:p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <BookOpen className="w-5 h-5 text-ink/70" />
                    <h3 className="font-sans font-black text-sm uppercase text-ink tracking-wider">Từ Điển Tra Nhanh 4YOU</h3>
                  </div>

                  <p className="text-xs text-ink/65 leading-relaxed font-sans">
                    Nhấp vào bất kỳ từ tiếng Anh nào trong phụ đề song ngữ bên trái để tra cứu nghĩa nhanh bằng AI, nghe phiên âm chuẩn IPA và thêm trực tiếp vào Sổ học từ.
                  </p>

                  <div className="bg-white p-3 rounded-2xl border space-y-4 min-h-[180px] flex flex-col justify-between">
                    {lookupLoading ? (
                      <div className="flex-1 flex flex-col items-center justify-center space-y-2 text-ink/65 font-sans">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-xs font-mono">Đang truy vấn từ điển...</span>
                      </div>
                    ) : lookupData ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <h4 className="font-sans font-black text-base text-ink line-clamp-1">{lookupData.vocabulary}</h4>
                            <span className="text-[9px] font-mono bg-neutral-100 text-ink/75 px-1.5 py-0.5 rounded-full uppercase">
                              {lookupData.wordType}
                            </span>
                          </div>
                          <button
                            onClick={() => speakText(lookupData.vocabulary)}
                            className="p-1 rounded-full border hover:bg-amber-100 text-ink/70 hover:text-ink cursor-pointer shrink-0"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="font-mono text-[11px] text-amber-800">
                          {lookupData.ipa}
                        </div>

                        <p className="font-sans text-xs text-ink/80 font-semibold leading-relaxed">
                          {lookupData.definition}
                        </p>

                        {lookupData.example && (
                          <div className="border-t pt-2 mt-2">
                            <span className="text-[9px] font-mono text-ink/40 uppercase block">Ví câu mẫu</span>
                            <p className="font-sans text-[11px] text-ink/60 italic leading-snug">
                              "{lookupData.example}"
                            </p>
                          </div>
                        )}

                        <div className="pt-2 border-t mt-4 flex justify-end">
                          <button
                            type="button"
                            disabled={wordSavedStatus}
                            onClick={() => handleSaveToWordbook(lookupData)}
                            className={`w-full py-2 rounded-xl text-[10px] font-sans font-black uppercase tracking-wider sketch-border-sm cursor-pointer transition-all ${wordSavedStatus ? "bg-green-100 text-green-800 border-green-200 cursor-default" : "bg-ink hover:bg-neutral-800 text-paper"}`}
                          >
                            {wordSavedStatus ? "✓ Đã đưa vào sổ từ" : "+ Lưu vào học sổ [SRS]"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-ink/40">
                        <Search className="w-8 h-8 opacity-40 mb-2" />
                        <p className="text-xs font-sans">Chọn một từ hoặc tự nhập bên dưới!</p>
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const input = form.elements.namedItem("searchWord") as HTMLInputElement;
                      if (input && input.value.trim()) {
                        handleWordLookup(input.value.trim());
                      }
                    }}
                    className="flex gap-1"
                  >
                    <input
                      name="searchWord"
                      type="text"
                      placeholder="Tra từ khác..."
                      className="flex-1 bg-white sketch-border-sm px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                    <button
                      type="submit"
                      className="bg-ink hover:bg-neutral-800 text-paper px-3 py-1.5 sketch-border-sm text-xs font-sans font-black uppercase cursor-pointer"
                    >
                      Tra
                    </button>
                  </form>
                </div>

                {/* Achievement Checklist / Video Stats list */}
                <div className="bg-paper sketch-border-sm p-4 md:p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Star className="w-5 h-5 text-amber-500 animate-spin-slow" />
                    <h3 className="font-sans font-black text-sm uppercase text-ink tracking-wider">Tiến trình bài 4YOU</h3>
                  </div>

                  <div className="space-y-3.5 text-xs font-sans">
                    <div className="flex items-center justify-between p-2 rounded-xl border bg-white">
                      <span>🎬 Đọc phụ đề song ngữ</span>
                      <span className="font-mono text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">Hoàn thành</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl border bg-white">
                      <span>🗣️ Luyện phát âm (câu thứ)</span>
                      <span className="font-mono text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                        {activePronIndex + 1}/5
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl border bg-white">
                      <span>🎧 Điền từ luyện nghe</span>
                      <span className="font-mono text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                        {Object.values(listeningResults).filter(r => r === "correct").length} câu đúng
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl border bg-white">
                      <span>📝 Làm bài kiểm tra</span>
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold ${quizSubmitted ? "bg-green-100 text-green-800" : "bg-neutral-100 text-ink/50"}`}>
                        {quizSubmitted ? `Đã nộp (${score || 0}đ)` : "Chưa làm"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
