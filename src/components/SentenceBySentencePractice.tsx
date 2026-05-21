import { useState, useMemo, useEffect, useRef } from "react";
import {
  Loader2,
  Send,
  CheckCircle2,
  ChevronRight,
  X,
  Play,
  RotateCcw,
  ListChecks,
  FileText,
  Save,
  Library,
  Trash2,
  Edit2,
  Plus,
  Trophy,
  Target,
  Calendar,
  Award,
  Volume2,
  Sliders,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkle,
  Mic,
  MicOff,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useFirebase } from "../context/FirebaseContext";
import type { PracticeParagraph, StudyGoal, Achievement, Word } from "../types";
import { cn } from "../lib/utils";

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

interface Sentence {
  vi: string;
  en?: string;
  userTranslation?: string;
  status: "pending" | "correct" | "thinking";
  hint?: string;
  explanation?: string;
}

export function SentenceBySentencePractice({
  words = [],
  setWords = () => {},
}: {
  words?: Word[];
  setWords?: (words: Word[]) => void;
}) {
  const { practiceParagraphs, setPracticeParagraphs } = useFirebase();
  const [inputText, setInputText] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [title, setTitle] = useState("");
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [sessionMistakes, setSessionMistakes] = useState(0);
  const [isPracticing, setIsPracticing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [evaluation, setEvaluation] = useState<{
    explanation?: string;
    isCorrect?: boolean;
    accuracy?: number;
  } | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPracticeId, setCurrentPracticeId] = useState<string | null>(
    null,
  );
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isEditingHint, setIsEditingHint] = useState(false);

  useEffect(() => {
    setShowAnswer(false);
  }, [currentIndex]);
  const [tempHint, setTempHint] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(
    localStorage.getItem("preferredVoice"),
  );
  const [speechRate, setSpeechRate] = useState<number>(() => {
    const r = localStorage.getItem("preferredRate");
    return r ? parseFloat(r) : 0.9;
  });
  const [speechPitch, setSpeechPitch] = useState<number>(() => {
    const p = localStorage.getItem("preferredPitch");
    return p ? parseFloat(p) : 1.0;
  });
  const [showVoiceControl, setShowVoiceControl] = useState(false);
  const [showVoiceGuide, setShowVoiceGuide] = useState(false);

  // Full Transcript states
  const [showFullTranscript, setShowFullTranscript] = useState(true);
  const [editingHintIndex, setEditingHintIndex] = useState<number | null>(null);
  const [tempHintText, setTempHintText] = useState("");
  const [activeTab, setActiveTab] = useState<"practice" | "transcript">(
    "practice",
  );

  // Word selection and highlight popover state
  const [selectedText, setSelectedText] = useState("");
  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isDefiningWord, setIsDefiningWord] = useState(false);
  const [definedWordResult, setDefinedWordResult] = useState<any | null>(null);
  const [showQuickAddDialog, setShowQuickAddDialog] = useState(false);

  // Editable fields for Quick Add
  const [quickWord, setQuickWord] = useState("");
  const [quickType, setQuickType] = useState("noun");
  const [quickIpa, setQuickIpa] = useState("");
  const [quickDefinition, setQuickDefinition] = useState("");
  const [quickExample, setQuickExample] = useState("");

  // Sync API results to editor
  useEffect(() => {
    if (definedWordResult) {
      setQuickWord(definedWordResult.vocabulary || "");
      setQuickType(definedWordResult.wordType || "noun");
      setQuickIpa(definedWordResult.ipa || "");
      setQuickDefinition(definedWordResult.definition || "");
      setQuickExample(definedWordResult.example || "");
    }
  }, [definedWordResult]);

  // Voice recording states & functions
  const [voiceRecordingField, setVoiceRecordingField] = useState<"userInput" | "inputText" | "referenceText" | null>(null);
  const recognitionRef = useRef<any>(null);

  const startVoiceInput = (field: "userInput" | "inputText" | "referenceText", lang: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Speech Recognition). Vui lòng sử dụng Google Chrome hoặc Safari.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onstart = () => {
      setVoiceRecordingField(field);
    };

    rec.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptText = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptText;
        } else {
          interimTranscript += transcriptText;
        }
      }

      const currentTranscript = (finalTranscript || interimTranscript);
      if (currentTranscript) {
        if (field === "userInput") {
          setUserInput(currentTranscript);
        } else if (field === "inputText") {
          setInputText(currentTranscript);
        } else if (field === "referenceText") {
          setReferenceText(currentTranscript);
        }
      }
    };

    rec.onerror = (e: any) => {
      console.error("Speech recognition error:", e);
      stopVoiceInput();
    };

    rec.onend = () => {
      setVoiceRecordingField(null);
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      console.error(err);
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setVoiceRecordingField(null);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    stopVoiceInput();
  }, [currentIndex]);

  // Handle text selection events
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection) return;

      const text = selection.toString().trim();
      // Only process English/Vietnamese highlighted phrase/sentence segment with max 60 chars
      if (
        text &&
        text.length > 0 &&
        text.length < 60 &&
        /[a-zA-Z\u00C0-\u1EF9]/g.test(text)
      ) {
        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const container = document.getElementById(
            "sentence-by-sentence-practice-container",
          );
          const containerRect = container?.getBoundingClientRect();

          if (containerRect && rect.width > 0) {
            setSelectedText(text);
            // Position above the selection center relative to practice card
            setSelectionRect({
              x: rect.left - containerRect.left + rect.width / 2,
              y: rect.top - containerRect.top - 45,
            });
          }
        } catch (e) {
          // Range rect exception safe
        }
      } else {
        // Delay to let button click trigger before hiding
        setTimeout(() => {
          const sel = window.getSelection();
          if (!sel || !sel.toString().trim()) {
            setSelectedText("");
            setSelectionRect(null);
          }
        }, 120);
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleAddNewHighlightedWord = async () => {
    if (!selectedText) return;
    setIsDefiningWord(true);
    setDefinedWordResult(null);
    setShowQuickAddDialog(true);

    try {
      const response = await fetch(getAbsoluteUrl("/api/translation/define-word"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: selectedText }),
      });
      if (response.ok) {
        const data = await response.json();
        setDefinedWordResult(data);
      } else {
        setDefinedWordResult({
          vocabulary: selectedText,
          wordType: "noun",
          ipa: "",
          definition: "",
          example: "",
        });
      }
    } catch (e) {
      setDefinedWordResult({
        vocabulary: selectedText,
        wordType: "noun",
        ipa: "",
        definition: "",
        example: "",
      });
    } finally {
      setIsDefiningWord(false);
      setSelectedText("");
      setSelectionRect(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleSaveQuickWord = () => {
    if (!quickWord.trim() || !quickDefinition.trim()) return;

    const newWord: Word = {
      id: Date.now().toString(),
      vocabulary: quickWord,
      wordType: quickType,
      ipa: quickIpa,
      definition: quickDefinition,
      examples: quickExample ? [quickExample] : [],
      tags: ["Translation"],
      difficulty: 0,
      lastReviewed: new Date().toISOString(),
      nextReview: new Date(Date.now() + 86400000).toISOString(),
    };

    setWords([newWord, ...words]);
    setShowQuickAddDialog(false);
    setDefinedWordResult(null);
  };

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      const enVoices = availableVoices.filter((v) => v.lang.startsWith("en"));

      // Score and prioritize high-quality natural/online/Google/Premium voices
      const sorted = [...enVoices].sort((a, b) => {
        const getScore = (voice: SpeechSynthesisVoice) => {
          const name = voice.name.toLowerCase();
          if (name.includes("natural")) return 100;
          if (name.includes("online")) return 90;
          if (name.includes("google")) return 80;
          if (name.includes("premium")) return 70;
          if (name.includes("neural")) return 60;
          if (name.includes("samantha")) return 50;
          if (name.includes("apple") || name.includes("macos")) return 40;
          if (name.includes("microsoft") || name.includes("desktop")) return 30;
          return 0;
        };
        return getScore(b) - getScore(a);
      });

      setVoices(sorted);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const isPunctuation = (char: string) => /[.,!?;:()"]/.test(char);

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .replace(/[.,!?;:()"]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  // Character display logic (Shadow Typing)
  const typingStatus = useMemo(() => {
    const reference = sentences[currentIndex]?.en || "";
    return userInput.split("").map((char, i) => {
      const target = reference[i];
      let isMatch = false;
      if (target) {
        if (isPunctuation(target)) {
          isMatch = true; // Automatically match punctuation
        } else {
          isMatch = char.toLowerCase() === target.toLowerCase();
        }
      }
      return { char, isMatch, target };
    });
  }, [userInput, sentences, currentIndex]);

  // Auto-advance logic
  const isCorrect = useMemo(() => {
    const reference = sentences[currentIndex]?.en;
    if (!reference || !userInput) return false;
    return normalize(userInput) === normalize(reference);
  }, [userInput, sentences, currentIndex]);

  const handlePrepare = () => {
    if (!inputText.trim() || !referenceText.trim()) return;

    // Simple split by punctuation
    const rawSentences = inputText
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().length > 0);
    const rawRefs = referenceText
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().length > 0);

    const newSentences: Sentence[] = rawSentences.map((s, i) => ({
      vi: s.trim(),
      en: rawRefs[i]?.trim() || "",
      status: "pending",
      hint: sentences[i]?.hint, // Keep existing hints if re-preparing
    }));

    setSentences(newSentences);
    setIsReviewing(true);
  };

  useEffect(() => {
    if (showSummary) return;
    if (isCorrect && !evaluation?.isCorrect) {
      const reference = sentences[currentIndex]?.en || "";
      // Read the sentence, then move to next when finished
      speak(reference, () => {
        // Add a buffer delay after speaking finishes
        setTimeout(() => {
          nextSentence();
        }, 1000);
      });
    }
  }, [isCorrect, evaluation, currentIndex, sentences, showSummary]);

  const handleStart = async (p?: PracticeParagraph) => {
    if (p) {
      setCurrentPracticeId(p.id);
      setTitle(p.title);
      setInputText(p.vietnamese);
      setReferenceText(p.english);

      let initialSentences: Sentence[] = [];
      if (p.sentences) {
        initialSentences = p.sentences.map((s) => ({
          ...s,
          status: "pending" as const,
        }));
      } else {
        const vi = p.vietnamese;
        const en = p.english;
        const rawSentences = vi
          .split(/(?<=[.!?])\s+/)
          .filter((s) => s.trim().length > 0);
        const rawRefs = en
          ? en.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0)
          : [];
        initialSentences = rawSentences.map((s, i) => ({
          vi: s.trim(),
          en: rawRefs[i]?.trim() || "",
          status: "pending" as const,
        }));
      }

      if (p.lastProgress) {
        const confirmResume = confirm(
          "Bạn có muốn tiếp tục phần bài đang dở không?",
        );
        if (confirmResume) {
          setSentences(p.lastProgress.sentences);
          setCurrentIndex(p.lastProgress.currentIndex || 0);
          setTotalMistakes(p.lastProgress.totalMistakes || 0);
        } else {
          setSentences(initialSentences);
          setCurrentIndex(0);
          setTotalMistakes(0);

          // Tracking start
          const updatedParagraph = {
            ...p,
            practiceCount: (p.practiceCount || 0) + 1,
          };
          void setPracticeParagraphs(
            practiceParagraphs.map((item) =>
              item.id === p.id ? updatedParagraph : item,
            ),
          );
        }
      } else {
        setSentences(initialSentences);
        setCurrentIndex(0);
        setTotalMistakes(0);

        // Tracking start
        const updatedParagraph = {
          ...p,
          practiceCount: (p.practiceCount || 0) + 1,
        };
        void setPracticeParagraphs(
          practiceParagraphs.map((item) =>
            item.id === p.id ? updatedParagraph : item,
          ),
        );
      }

      setIsPracticing(true);
      setShowLibrary(false);
      setIsReviewing(false);
    } else {
      setCurrentPracticeId(null);
      setCurrentIndex(0);
      setTotalMistakes(0);
      setIsPracticing(true);
      setIsReviewing(false);
    }

    setUserInput("");
    setSessionMistakes(0);
    setEvaluation(null);
    setShowHint(false);
    setActiveTab("practice");
  };

  const handleSave = async () => {
    if (!inputText.trim() || !referenceText.trim() || !title.trim()) {
      alert("Vui lòng nhập đầy đủ Tiêu đề, văn bản Gốc và bản dịch Mẫu!");
      return;
    }

    const id =
      editingId || `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newParagraph: PracticeParagraph = {
      id,
      title: title.trim(),
      vietnamese: inputText.trim(),
      english: referenceText.trim(),
      sentences:
        sentences.length > 0
          ? sentences.map(({ vi, en, hint }) => ({ vi, en: en || "", hint }))
          : inputText
              .split(/(?<=[.!?])\s+/)
              .filter((s) => s.trim().length > 0)
              .map((s, i) => ({
                vi: s.trim(),
                en:
                  referenceText
                    .split(/(?<=[.!?])\s+/)
                    .filter((r) => r.trim().length > 0)
                    [i]?.trim() || "",
                hint: "",
              })),
      createdAt: Date.now(),
    };

    try {
      let updated;
      if (editingId) {
        updated = practiceParagraphs.map((p) =>
          p.id === editingId ? newParagraph : p,
        );
      } else {
        updated = [newParagraph, ...practiceParagraphs];
      }

      await setPracticeParagraphs(updated);
      setEditingId(null);
      alert("Đã lưu thành công!");
      setShowLibrary(true);
      setIsReviewing(false);
    } catch (error) {
      console.error("Save error:", error);
      alert("Có lỗi khi lưu bài tập!");
    }
  };

  const handleEdit = (p: PracticeParagraph) => {
    setTitle(p.title);
    setInputText(p.vietnamese);
    setReferenceText(p.english);
    if (p.sentences) {
      setSentences(p.sentences.map((s) => ({ ...s, status: "pending" })));
      setIsReviewing(true);
    }
    setEditingId(p.id);
    setShowLibrary(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xoá đoạn văn này?")) {
      await setPracticeParagraphs(
        practiceParagraphs.filter((p) => p.id !== id),
      );
    }
  };

  const speak = (text: string, onEnd?: () => void) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      const v =
        voices.find((v) => v.name === selectedVoiceName) ||
        voices[0] ||
        voices.find((v) => v.lang === "en-US");
      if (v) utterance.voice = v;

      utterance.lang = "en-US";
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;
      if (onEnd) utterance.onend = () => onEnd();
      window.speechSynthesis.speak(utterance);
    } else if (onEnd) {
      onEnd();
    }
  };

  const handleVerify = () => {
    if (!userInput.trim()) return;
    setIsVerifying(true);

    const currentSentence = sentences[currentIndex];
    const reference = currentSentence.en || "";

    const normalizeWordLevel = (str: string) =>
      str
        .toLowerCase()
        .replace(/[.,!?;:()"]/g, "")
        .trim();

    const userWords = normalizeWordLevel(userInput)
      .split(/\s+/)
      .filter(Boolean);
    const refWords = normalizeWordLevel(reference).split(/\s+/).filter(Boolean);

    let currentMistakes = 0;
    const m = userWords.length;
    const n = refWords.length;
    const dp = Array(m + 1)
      .fill(0)
      .map(() => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = userWords[i - 1] === refWords[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost,
        );
      }
    }

    currentMistakes = dp[m][n];
    setSessionMistakes(currentMistakes);

    const maxWords = Math.max(1, userWords.length, refWords.length);
    const accuracy = Math.max(
      0,
      Math.round(((maxWords - currentMistakes) / maxWords) * 100),
    );

    const isActuallyCorrect = normalize(userInput) === normalize(reference);

    if (currentMistakes === 0 || isActuallyCorrect) {
      speak(reference);
      setEvaluation({
        isCorrect: true,
        accuracy,
        explanation: "Tuyệt vời! Bạn đã dịch phần lớn chính xác.",
      });
    } else {
      setEvaluation({
        isCorrect: false,
        accuracy,
        explanation:
          accuracy >= 70
            ? "Khá ổn! Chú ý một vài từ chưa chính xác so với mẫu."
            : "Bản dịch có khá nhiều từ sai khác. Bạn nên thử lại!",
      });
    }

    setTotalMistakes((prev) => prev + currentMistakes);
    setIsVerifying(false);
  };

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isShiftCombination = useRef(false);

  useEffect(() => {
    if (isPracticing && !isReviewing && !evaluation) {
      // Small timeout to allow React to render the enabled textarea
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isPracticing, isReviewing, evaluation]);

  const nextSentence = (wasCorrectOrEvent?: boolean | any) => {
    const isCompleted =
      typeof wasCorrectOrEvent === "boolean"
        ? wasCorrectOrEvent
        : isCorrect || (evaluation ? !!evaluation.isCorrect : false);
    const updated = [...sentences];
    updated[currentIndex].userTranslation = userInput;
    updated[currentIndex].status = isCompleted ? "correct" : "failed";
    setSentences(updated);
    setIsEditingHint(false);

    let isFinished = false;

    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput("");
      setSessionMistakes(0);
      setEvaluation(null);
      setShowHint(false);

      // Save progress
      if (currentPracticeId) {
        const pIndex = practiceParagraphs.findIndex(
          (p) => p.id === currentPracticeId,
        );
        if (pIndex !== -1) {
          const newP = { ...practiceParagraphs[pIndex] };
          newP.lastProgress = {
            sentences: updated,
            currentIndex: currentIndex + 1,
            totalMistakes: totalMistakes + sessionMistakes,
          };
          void setPracticeParagraphs([
            ...practiceParagraphs.slice(0, pIndex),
            newP,
            ...practiceParagraphs.slice(pIndex + 1),
          ]);
        }
      }
    } else {
      isFinished = true;
      // Last sentence completed => Clear progress
      if (currentPracticeId) {
        const pIndex = practiceParagraphs.findIndex(
          (p) => p.id === currentPracticeId,
        );
        if (pIndex !== -1) {
          const newP = { ...practiceParagraphs[pIndex] };
          newP.lastProgress = undefined;
          void setPracticeParagraphs([
            ...practiceParagraphs.slice(0, pIndex),
            newP,
            ...practiceParagraphs.slice(pIndex + 1),
          ]);
        }
      }

      // Let's compute average accuracy of sentences or just keep a simple metric
      const avgAccuracy = Math.max(
        0,
        100 - (totalMistakes + sessionMistakes) * 10,
      );

      const failedCount = updated.filter((s) => s.status === "failed").length;
      const msg =
        failedCount > 0
          ? `Bạn đã hoàn thành bài dịch, nhưng còn ${failedCount} câu chưa chính xác. Cố gắng ghi nhớ nhé!`
          : `Tuyệt vời! Xin chúc mừng, bạn đã hoàn thành xuất sắc bài dịch!`;

      setShowSummary(true);
      setEvaluation(null);
    }
  };

  const restartCurrent = () => {
    setCurrentIndex(0);
    setUserInput("");
    setSessionMistakes(0);
    setTotalMistakes(0);
    setEvaluation(null);
    setShowHint(false);
    setShowSummary(false);
    setSentences(sentences.map((s) => ({ ...s, status: "pending" as const })));
    setActiveTab("practice");
  };

  const reset = () => {
    setIsPracticing(false);
    setIsReviewing(false);
    setSentences([]);
    setCurrentIndex(0);
    setUserInput("");
    setSessionMistakes(0);
    setTotalMistakes(0);
    setEvaluation(null);
    setShowSummary(false);
    setActiveTab("practice");
  };

  if (!isPracticing) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="sketch-border bg-white/60 p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <FileText size={120} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <ListChecks className="w-8 h-8 text-crimson" />
                {editingId ? "Hiệu chỉnh bài tập" : "Luyện dịch đối chiếu"}
              </h2>
              <p className="text-xs font-bold text-ink/40 uppercase tracking-widest">
                {editingId
                  ? "Cập nhật nội dung bài tập hiện tại"
                  : "Dịch sát theo mẫu - Tính điểm dựa trên lỗi gõ"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowLibrary(!showLibrary);
                  setIsReviewing(false);
                }}
                className={`sketch-button p-3 transition-colors flex items-center gap-2 ${showLibrary ? "bg-ink text-white" : "bg-paper text-ink/60 hover:text-ink"}`}
                title="Library"
              >
                <Library className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                  {showLibrary ? "Đóng thư viện" : "Thư viện"}
                </span>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {showLibrary ? (
              <motion.div
                key="library"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b-2 border-ink/5 pb-2">
                  <h3 className="text-xs font-black uppercase text-ink/40 tracking-widest">
                    Danh sách đã lưu ({practiceParagraphs.length})
                  </h3>
                  <button
                    onClick={() => setShowLibrary(false)}
                    className="text-ink/40 hover:text-crimson"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-none">
                  {practiceParagraphs.length === 0 ? (
                    <div className="text-center py-12 text-ink/20 italic text-sm">
                      Chưa có đoạn văn nào được lưu.
                    </div>
                  ) : (
                    practiceParagraphs.map((p) => (
                      <div
                        key={p.id}
                        className="group relative sketch-border bg-white p-4 hover:bg-paper transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => handleStart(p)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-ink leading-tight">
                                {p.title}
                              </h4>
                              {p.lastProgress && (
                                <span className="text-[8px] bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest leading-none">
                                  Đang dở
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-ink/40 line-clamp-2 italic mb-2">
                              {p.vietnamese}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-ink/30 uppercase tracking-widest flex items-center gap-1">
                                <Award size={10} />
                                Đã luyện {p.practiceCount || 0} lần
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(p);
                              }}
                              className="p-2 text-ink/40 hover:text-ink hover:bg-ink/5 rounded-lg"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(p.id);
                              }}
                              className="p-2 text-ink/40 hover:text-crimson hover:bg-crimson/5 rounded-lg"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            ) : isReviewing ? (
              <motion.div
                key="review"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-ink/40 tracking-widest">
                    Bước 2: Hiệu chỉnh câu & Gợi ý
                  </h3>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-none">
                  {sentences.map((s, i) => (
                    <div
                      key={i}
                      className="sketch-border bg-white p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-ink/40">
                          Câu {i + 1}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-ink leading-relaxed">
                        "{s.vi}"
                      </p>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-ink/30 tracking-widest block">
                          Bản dịch mẫu
                        </label>
                        <input
                          type="text"
                          value={s.en}
                          onChange={(e) => {
                            const updated = [...sentences];
                            updated[i].en = e.target.value;
                            setSentences(updated);
                          }}
                          placeholder="Bản dịch mẫu..."
                          className="w-full bg-paper/20 sketch-border-sm p-3 text-sm font-sans focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-ink/30 tracking-widest block">
                          Gợi ý (Mỗi dòng một ý)
                        </label>
                        <textarea
                          value={s.hint || ""}
                          onChange={(e) => {
                            const updated = [...sentences];
                            updated[i].hint = e.target.value;
                            setSentences(updated);
                          }}
                          placeholder="Gợi ý cấu trúc, cụm từ..."
                          className="w-full h-20 bg-paper/10 sketch-border-sm p-3 text-xs font-sans focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setIsReviewing(false)}
                    className="flex-1 sketch-button bg-paper py-4 text-sm font-black uppercase tracking-widest hover:bg-ink/5"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 sketch-button bg-paper py-4 text-sm font-black uppercase tracking-widest border-emerald-500/30 text-emerald-700"
                  >
                    Lưu vào thư viện
                  </button>
                  <button
                    onClick={() => handleStart()}
                    className="flex-2 sketch-button bg-ink text-white py-4 text-sm font-black uppercase tracking-widest hover:bg-ink/90 flex items-center justify-center gap-3"
                  >
                    Bắt đầu luyện tập
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-ink/60 tracking-widest ml-1">
                    Tiêu đề đoạn văn
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Daily routine, Business email..."
                    className="w-full bg-paper/30 sketch-border px-4 py-3 font-sans text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ink/10"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-ink/60 tracking-widest ml-1">
                      Đoạn văn Tiếng Việt (Gốc)
                    </label>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Nhập đoạn văn tiếng Việt..."
                      className="w-full h-64 bg-paper/30 sketch-border p-4 font-sans text-lg focus:outline-none focus:ring-2 focus:ring-ink/10 resize-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-ink/60 tracking-widest ml-1">
                      Bản dịch Tiếng Anh (Mẫu - Bắt buộc)
                    </label>
                    <textarea
                      value={referenceText}
                      onChange={(e) => setReferenceText(e.target.value)}
                      placeholder="Nhập bản dịch tiếng Anh tương ứng để đối chiếu..."
                      className="w-full h-64 bg-paper/10 sketch-border p-4 font-sans text-base italic focus:outline-none focus:ring-2 focus:ring-ink/10 resize-none transition-all placeholder:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleSave}
                    disabled={
                      !inputText.trim() ||
                      !referenceText.trim() ||
                      !title.trim()
                    }
                    className="flex-1 sketch-button bg-paper py-4 text-sm font-black uppercase tracking-widest hover:bg-ink/5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {editingId ? "Cập nhật" : "Lưu vào thư viện"}
                  </button>
                  <button
                    onClick={handlePrepare}
                    disabled={!inputText.trim() || !referenceText.trim()}
                    className="flex-2 sketch-button bg-ink text-white py-4 text-sm font-black uppercase tracking-widest hover:bg-ink/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                    Tiếp tục
                  </button>
                  {editingId && (
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setTitle("");
                        setInputText("");
                        setReferenceText("");
                      }}
                      className="sketch-button bg-paper text-ink/60 py-4 text-sm font-black uppercase tracking-widest hover:text-ink"
                      title="Hủy hiệu chỉnh"
                    >
                      Huỷ bỏ
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  const handleSaveHint = async () => {
    const updatedSentences = [...sentences];
    updatedSentences[currentIndex].hint = tempHint;
    setSentences(updatedSentences);
    setIsEditingHint(false);

    // If it's a saved exercise, update the library automatically
    if (editingId) {
      const p = practiceParagraphs.find((item) => item.id === editingId);
      if (p) {
        const newParagraph: PracticeParagraph = {
          ...p,
          sentences: updatedSentences.map(({ vi, en, hint }) => ({
            vi,
            en: en || "",
            hint: hint || "",
          })),
        };
        const updatedLibrary = practiceParagraphs.map((item) =>
          item.id === editingId ? newParagraph : item,
        );
        await setPracticeParagraphs(updatedLibrary);
      }
    }
  };

  const handleSaveHintAtIndex = async (idx: number) => {
    const updatedSentences = [...sentences];
    updatedSentences[idx].hint = tempHintText;
    setSentences(updatedSentences);
    setEditingHintIndex(null);

    // If it's a practicing saved exercise, let's auto-update it in Firestore too!
    const targetId = currentPracticeId || editingId;
    if (targetId) {
      const p = practiceParagraphs.find((item) => item.id === targetId);
      if (p) {
        const newParagraph: PracticeParagraph = {
          ...p,
          sentences: updatedSentences.map(({ vi, en, hint }) => ({
            vi,
            en: en || "",
            hint: hint || "",
          })),
        };
        const updatedLibrary = practiceParagraphs.map((item) =>
          item.id === targetId ? newParagraph : item,
        );
        await setPracticeParagraphs(updatedLibrary);
      }
    }
  };

  const currentSentence = sentences[currentIndex];
  const progress = (currentIndex / sentences.length) * 100;

  return (
    <div
      id="sentence-by-sentence-practice-container"
      className="w-full max-w-4xl mx-auto p-2 md:p-6 animate-in fade-in duration-500 relative"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={reset}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-ink/40 hover:text-crimson transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Thoát
          </button>
          <button
            onClick={restartCurrent}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-ink/40 hover:text-ink transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Làm lại bài này
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {voices.length > 0 && (
            <div className="flex items-center gap-2 relative">
              <Volume2 className="w-4 h-4 text-ink animate-pulse-slow shrink-0" />
              <select
                value={selectedVoiceName || ""}
                onChange={(e) => {
                  setSelectedVoiceName(e.target.value);
                  localStorage.setItem("preferredVoice", e.target.value);
                  setTimeout(() => {
                    speak("Voice updated");
                  }, 150);
                }}
                className="text-[10px] font-black uppercase tracking-wider bg-white border border-ink/15 shadow-sm rounded-lg px-2.5 py-1.5 outline-none max-w-[150px] sm:max-w-[200px]"
              >
                <option value="">🍀 Giọng mặc định</option>
                {voices.some(v => 
                  v.name.toLowerCase().includes("natural") ||
                  v.name.toLowerCase().includes("online") ||
                  v.name.toLowerCase().includes("google") ||
                  v.name.toLowerCase().includes("premium")
                ) && (
                  <optgroup label="✨ GIỌNG AI SIÊU THỰC (KHUYÊN DÙNG)">
                    {voices
                      .filter(v => 
                        v.name.toLowerCase().includes("natural") ||
                        v.name.toLowerCase().includes("online") ||
                        v.name.toLowerCase().includes("google") ||
                        v.name.toLowerCase().includes("premium")
                      )
                      .map((v) => {
                        const displayName = v.name
                          .replace("Microsoft", "")
                          .replace("Google", "")
                          .replace("Desktop", "")
                          .trim();
                        return (
                          <option key={v.name} value={v.name} className="font-sans font-bold py-1">
                            ✨ {displayName}
                          </option>
                        );
                      })}
                  </optgroup>
                )}
                <optgroup label="🐌 GIỌNG PHỔ THÔNG (OFFLINE / ROBOTIC)">
                  {voices
                    .filter(v => 
                      !(v.name.toLowerCase().includes("natural") ||
                        v.name.toLowerCase().includes("online") ||
                        v.name.toLowerCase().includes("google") ||
                        v.name.toLowerCase().includes("premium"))
                    )
                    .map((v) => {
                      const displayName = v.name
                        .replace("Microsoft", "")
                        .replace("Google", "")
                        .replace("Desktop", "")
                        .trim();
                      return (
                        <option key={v.name} value={v.name} className="font-sans py-1 text-ink/70">
                          {displayName}
                        </option>
                      );
                    })}
                </optgroup>
              </select>

              <button
                onClick={() => setShowVoiceControl(!showVoiceControl)}
                title="Cân chỉnh giọng đọc (Tốc độ & Cao độ)"
                className={`p-1.5 rounded-lg border transition-all hover:bg-ink/5 ${showVoiceControl ? "bg-crimson/5 border-crimson/30 text-crimson" : "border-ink/10 text-ink/60"}`}
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>

              <AnimatePresence>
                {showVoiceControl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 z-30 w-72 p-4 bg-white/95 backdrop-blur-md sketch-border shadow-xl flex flex-col gap-3.5 pointer-events-auto text-left"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-ink pb-1.5 border-b border-ink/10">
                      <Sparkles className="w-3.5 h-3.5 text-crimson animate-pulse" />
                      <span>Hiệu chỉnh giọng đọc</span>
                    </div>

                    {/* Speech Rate (Speed) */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-ink/60 uppercase tracking-wider">
                          Tốc độ đọc:
                        </span>
                        <span className="text-[10px] font-black text-crimson font-mono bg-crimson/5 px-1.5 py-0.5 rounded">
                          {speechRate.toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="1.3"
                        step="0.05"
                        value={speechRate}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setSpeechRate(val);
                          localStorage.setItem("preferredRate", val.toString());
                        }}
                        className="w-full accent-crimson cursor-ew-resize h-1 bg-ink/5 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[8px] font-bold text-ink/30 px-0.5">
                        <span>Chậm (0.6x)</span>
                        <span>Mặc định (0.9x)</span>
                        <span>Nhanh (1.3x)</span>
                      </div>
                    </div>

                    {/* Speech Pitch */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-ink/60 uppercase tracking-wider">
                          Cao độ giọng:
                        </span>
                        <span className="text-[10px] font-black text-teal-600 font-mono bg-teal-50 px-1.5 py-0.5 rounded">
                          {speechPitch.toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.75"
                        max="1.25"
                        step="0.05"
                        value={speechPitch}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setSpeechPitch(val);
                          localStorage.setItem(
                            "preferredPitch",
                            val.toString(),
                          );
                        }}
                        className="w-full accent-teal-600 cursor-ew-resize h-1 bg-ink/5 rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[8px] font-bold text-ink/30 px-0.5">
                        <span>Thấp/Trầm</span>
                        <span>Bình thường</span>
                        <span>Thanh/Cao</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setShowVoiceGuide(!showVoiceGuide)}
                        className="w-full text-left p-2 rounded bg-crimson/5 hover:bg-crimson/10 border border-crimson/15 text-[10px] text-crimson font-bold flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 font-sans uppercase tracking-wider">
                          💡 Cách bật Giọng AI Siêu Thực như người
                        </span>
                        <span className="font-mono text-xs font-black">{showVoiceGuide ? "−" : "+"}</span>
                      </button>

                      {showVoiceGuide && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="bg-paper p-2.5 rounded border border-ink/10 space-y-2.5 text-[9px] text-ink/70 leading-relaxed font-sans overflow-hidden"
                        >
                          <div>
                            <span className="font-black text-[10px] text-teal-600 block mb-0.5">🌐 TRÊN MICROSOFT EDGE:</span>
                            <p>Không cần cài đặt! Edge hỗ trợ giọng **Microsoft Natural** tốt nhất thế giới. Hãy tìm các giọng bắt đầu bằng **"✨"** trong menu (ví dụ: *Aria, Guy*).</p>
                          </div>
                          <div>
                            <span className="font-black text-[10px] text-teal-600 block mb-0.5">🌐 TRÊN GOOGLE CHROME:</span>
                            <p>Chrome cài sẵn giọng nói đám mây **"✨ Google US English"** vô cùng ấm áp và tự nhiên. Hãy kết nối Internet và chọn giọng có biểu tượng **"✨"**.</p>
                          </div>
                          <div>
                            <span className="font-black text-[10px] text-teal-600 block mb-0.5">🍎 TRÊN IPHONE / IPAD / MACBOOK (SAFARI):</span>
                            <p>Hãy tải giọng đọc Siri cao cấp miễn phí từ Apple:</p>
                            <ol className="list-decimal pl-3.5 space-y-0.5 mt-1">
                              <li>Vào **Cài đặt** &gt; **Trợ năng** &gt; **Nội dung được nói**.</li>
                              <li>Chọn **Giọng nói** &gt; **Tiếng Anh** &gt; chọn **Siri (Giọng 1-4)** hoặc **Samantha (Nâng cao)**.</li>
                              <li>Nhấn biểu tượng đám mây để tải xuống, rồi tải lại trang này để sử dụng giọng siêu thực!</li>
                            </ol>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        speak(
                          "Hello! Practice makes perfect. Try translating sentences correctly!",
                        )
                      }
                      className="w-full bg-ink text-white text-[10px] font-bold uppercase tracking-widest py-1.5 rounded-lg hover:scale-102 transition-transform shadow-md cursor-pointer"
                    >
                      🔊 Thử giọng hiện tại
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <div className="flex-1 md:w-32 bg-ink/5 h-1.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-crimson"
            />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-ink/40">
            {currentIndex + 1} / {sentences.length}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mb-6 border-b border-ink/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("practice")}
          className={cn(
            "px-4 py-2 text-xs font-black uppercase tracking-widest transition-all rounded-lg flex items-center gap-2 border cursor-pointer",
            activeTab === "practice"
              ? "bg-ink text-[#fcfbf9] border-ink shadow-sm scale-102"
              : "bg-white text-ink/60 border-ink/10 hover:bg-ink/5",
          )}
          id="practice-tab-button"
        >
          <Target className="w-3.5 h-3.5" />
          Practice (Làm bài)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("transcript")}
          className={cn(
            "px-4 py-2 text-xs font-black uppercase tracking-widest transition-all rounded-lg flex items-center gap-2 border cursor-pointer",
            activeTab === "transcript"
              ? "bg-ink text-[#fcfbf9] border-ink shadow-sm scale-102"
              : "bg-white text-ink/60 border-ink/10 hover:bg-ink/5",
          )}
          id="transcript-tab-button"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Full Transcript (Bản dịch toàn bộ)
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "practice" ? (
          <motion.div
            key="practice-sub-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* Progress sidebar */}
            <div className="lg:col-span-3 space-y-2 hidden lg:block">
              <div className="grid grid-cols-1 gap-1.5 max-h-[500px] overflow-y-auto scrollbar-none">
                {sentences.map((s, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 ${i === currentIndex ? "bg-white sketch-border-sm ring-1 ring-ink/10" : s.status === "correct" ? "text-emerald-500/60 bg-emerald-50/20" : s.status === "failed" ? "text-crimson/60 bg-crimson/10" : "text-ink/10"}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[8px] ${i === currentIndex ? "bg-ink text-white" : s.status === "correct" ? "bg-emerald-500 text-white" : s.status === "failed" ? "bg-crimson text-white" : "bg-ink/5"}`}
                    >
                      {i + 1}
                    </div>
                    <p className="truncate">{s.vi}</p>
                    {s.status === "correct" && (
                      <CheckCircle2 className="w-3 h-3 ml-auto text-emerald-500" />
                    )}
                    {s.status === "failed" && (
                      <X className="w-3 h-3 ml-auto text-crimson" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-9 space-y-4">
              <div className="sketch-border bg-white p-4 md:p-6 space-y-6 shadow-xl relative overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-crimson tracking-widest">
                      Đang dịch câu:
                    </span>
                    {sentences[currentIndex]?.en && (
                      <div className="flex items-center gap-3">
                        {showHint && (
                          <button
                            onClick={() => {
                              if (!isEditingHint) {
                                setTempHint(currentSentence.hint || "");
                              }
                              setIsEditingHint(!isEditingHint);
                            }}
                            className="text-[9px] font-black uppercase text-ink/40 hover:text-ink tracking-widest flex items-center gap-1 transition-colors"
                          >
                            <Edit2 size={12} />
                            {isEditingHint ? "Hủy sửa" : "Sửa gợi ý"}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowHint(!showHint);
                            if (showHint) setIsEditingHint(false);
                          }}
                          className="text-[9px] font-black uppercase text-ink/40 hover:text-ink tracking-widest flex items-center gap-1.5 transition-colors"
                        >
                          <ListChecks className="w-3 h-3" />
                          {showHint ? "Ẩn gợi ý" : "Xem gợi ý"}
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-lg md:text-xl font-sans font-bold leading-relaxed text-ink">
                    "{currentSentence.vi}"
                  </p>

                  {showHint && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-paper/50 p-4 rounded-lg border border-dashed border-ink/10"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-2">
                          <ListChecks className="w-3 h-3 text-crimson mt-0.5 shrink-0" />
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-ink/60">
                            Gợi ý cấu trúc & từ vựng
                          </h5>
                        </div>
                        {isEditingHint && (
                          <button
                            onClick={handleSaveHint}
                            className="text-[9px] font-black uppercase text-emerald-600 hover:text-emerald-700 tracking-widest flex items-center gap-1"
                          >
                            Lưu lại
                          </button>
                        )}
                      </div>

                      {isEditingHint ? (
                        <textarea
                          value={tempHint}
                          onChange={(e) => setTempHint(e.target.value)}
                          className="w-full h-24 bg-white/50 sketch-border-sm p-3 text-[11px] font-sans focus:outline-none resize-none"
                          placeholder="Nhập gợi ý mới (Mỗi dòng một ý)..."
                          autoFocus
                        />
                      ) : (
                        <>
                          <ul className="space-y-1.5 font-sans">
                            {currentSentence.hint ? (
                              currentSentence.hint
                                .split("\n")
                                .filter((h) => h.trim())
                                .map((hint, i) => (
                                  <li
                                    key={i}
                                    className="text-[11px] text-ink/70 leading-relaxed flex items-start gap-2"
                                  >
                                    <span className="w-1 h-1 rounded-full bg-ink/20 mt-1.5 shrink-0" />
                                    {hint}
                                  </li>
                                ))
                            ) : (
                              <li className="text-[11px] text-ink/40 italic">
                                Không có gợi ý cho câu này.
                              </li>
                            )}
                          </ul>

                          {/* View Answer (Xem đáp án) portion */}
                          <div className="mt-4 pt-3 border-t border-dashed border-ink/10 flex flex-col gap-2 font-sans text-left">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase text-ink/40 tracking-widest flex items-center gap-1">
                                <Sparkle className="w-3 h-3 text-crimson" /> Vẫn chưa dịch được?
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowAnswer(!showAnswer)}
                                className="text-[9px] font-black uppercase text-crimson hover:text-red-700 tracking-widest flex items-center gap-1 transition-colors bg-crimson/5 hover:bg-crimson/10 px-2 py-1 rounded border border-crimson/20 cursor-pointer"
                              >
                                {showAnswer ? "Ẩn đáp án" : "Xem đáp án"}
                              </button>
                            </div>

                            {showAnswer && (
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-paper p-3 border border-ink/20 rounded shadow-sm relative group/ans"
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">Bản dịch chính xác:</span>
                                  <button
                                    type="button"
                                    onClick={() => speak(currentSentence.en || "")}
                                    className="p-1 rounded hover:bg-ink/5 text-ink/60 hover:text-ink transition-colors cursor-pointer"
                                    title="Nghe phát âm"
                                  >
                                    <Volume2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <p className="text-sm font-bold text-ink select-all break-words leading-relaxed">
                                  {currentSentence.en}
                                </p>
                              </motion.div>
                            )}
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-ink/5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black uppercase text-ink/40 tracking-widest block">
                      Gõ lại bản dịch (Sai sẽ hiện màu đỏ):
                    </label>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-ink/30">
                      <span className="text-crimson">
                        Lỗi: {sessionMistakes}
                      </span>
                    </div>
                  </div>

                  <div className="relative group min-h-[100px] flex items-center bg-paper/20 rounded-xl overflow-hidden border-2 border-transparent focus-within:border-ink/5 transition-all">
                    <div className="w-full min-h-[100px] p-4 font-sans text-xl md:text-2xl font-bold leading-relaxed whitespace-pre-wrap pointer-events-none break-words">
                      {typingStatus.map((item, idx) => (
                        <span
                          key={idx}
                          className={
                            item.isMatch
                              ? "text-ink"
                              : "text-crimson bg-crimson/10"
                          }
                        >
                          {item.char}
                        </span>
                      ))}
                      {!userInput && (
                        <span className="text-ink/10 italic text-sm font-medium">
                          Bắt đầu nhập tại đây...
                        </span>
                      )}
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="inline-block w-0.5 h-6 bg-crimson ml-0.5 align-middle"
                      />
                    </div>

                    <textarea
                      ref={inputRef}
                      autoFocus
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-text resize-none"
                      disabled={isVerifying || evaluation?.isCorrect}
                      onKeyDown={(e) => {
                        if (e.key === "Shift") {
                          isShiftCombination.current = false;
                        } else if (e.shiftKey) {
                          isShiftCombination.current = true;
                        }
                        if (
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          !evaluation?.isCorrect
                        ) {
                          e.preventDefault();
                          handleVerify();
                        }
                      }}
                      onKeyUp={(e) => {
                        if (e.key === "Shift" && !isShiftCombination.current) {
                          e.preventDefault();
                          setShowHint((prev) => {
                            if (prev) setIsEditingHint(false);
                            return !prev;
                          });
                        }
                      }}
                    />

                    {!evaluation?.isCorrect && (
                      <button
                        onClick={handleVerify}
                        disabled={isVerifying || !userInput.trim()}
                        className="absolute right-2 bottom-2 md:right-4 md:bottom-4 bg-ink text-white p-2.5 rounded-full shadow-lg hover:scale-110 disabled:opacity-0 transition-all z-10"
                      >
                        {isVerifying ? (
                          <Loader2 className="animate-spin w-4 h-4" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {evaluation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-2"
                    >
                      <div
                        className={`p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 ${evaluation.isCorrect ? "bg-emerald-50 border border-emerald-500/20" : "bg-crimson/5 border border-crimson/20"}`}
                      >
                        <div className="flex items-center gap-3 w-full">
                          {evaluation.isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : (
                            <X className="w-5 h-5 text-crimson shrink-0" />
                          )}
                          <div className="space-y-0.5">
                            <p
                              className={`text-[11px] font-bold ${evaluation.isCorrect ? "text-emerald-900" : "text-crimson"}`}
                            >
                              {evaluation.explanation}
                            </p>
                            {evaluation.accuracy !== undefined && (
                              <p className="text-[9px] font-black uppercase text-ink/30 tracking-tight">
                                Độ chính xác: {evaluation.accuracy}% | Lỗi:{" "}
                                {sessionMistakes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                          <button
                            onClick={() => speak(currentSentence.en || "")}
                            className="p-2 rounded-full hover:bg-black/5 text-ink/40 hover:text-ink transition-colors"
                            title="Nghe lại"
                          >
                            <Volume2 size={16} />
                          </button>
                          {currentIndex === sentences.length - 1 &&
                            evaluation.isCorrect && (
                              <div className="flex items-center gap-2">
                                {!editingId && (
                                  <button
                                    onClick={handleSave}
                                    className="text-[9px] font-black uppercase text-emerald-600 hover:text-emerald-800 flex items-center gap-1 px-3 py-2 bg-emerald-50 rounded-lg transition-colors"
                                  >
                                    <Save size={12} /> Lưu vào thư viện
                                  </button>
                                )}
                                <button
                                  onClick={restartCurrent}
                                  className="text-[9px] font-black uppercase text-ink/60 hover:text-ink underline tracking-widest px-4 py-2"
                                >
                                  Làm lại
                                </button>
                              </div>
                            )}
                          {!evaluation.isCorrect && (
                            <button
                              onClick={() => {
                                setUserInput("");
                                setSessionMistakes(0);
                                setEvaluation(null);
                              }}
                              className="flex-1 md:flex-none text-[9px] font-black uppercase text-crimson underline tracking-widest px-4 py-2"
                            >
                              Thử lại
                            </button>
                          )}
                          <button
                            onClick={() => nextSentence()}
                            className={`flex-2 md:flex-none sketch-button py-2 px-6 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 whitespace-nowrap transition-all ${evaluation.isCorrect ? "bg-ink text-white" : "bg-paper text-ink"}`}
                          >
                            {currentIndex < sentences.length - 1
                              ? evaluation.isCorrect
                                ? "Kế tiếp"
                                : "Bỏ qua & Tiếp"
                              : "Xem kết quả"}{" "}
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="transcript-sub-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {/* Full Transcript Section */}
            <div
              className="sketch-border bg-white/80 p-4 md:p-6 space-y-4 shadow-xl relative overflow-hidden"
              id="full-transcript-section"
            >
              <div className="flex items-center justify-between border-b-2 border-ink/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <BookOpen
                    className="w-5 h-5 text-crimson"
                    style={{ filter: "url(#hand-drawn-filter)" }}
                  />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight">
                      Bài đọc toàn bộ (Full Transcript)
                    </h3>
                    <p className="text-[9px] font-bold text-ink/40 uppercase tracking-widest mt-0.5">
                      Tiếng Việt phía trên • Tiếng Anh phía dưới • Sửa gợi ý
                      trực quan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullTranscript(!showFullTranscript)}
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-ink/50 hover:text-ink transition-colors px-2 py-1 bg-paper rounded-lg"
                >
                  {showFullTranscript ? (
                    <>
                      Thu gọn <ChevronUp size={12} />
                    </>
                  ) : (
                    <>
                      Hiển thị <ChevronDown size={12} />
                    </>
                  )}
                </button>
              </div>

              <AnimatePresence>
                {showFullTranscript && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-1 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar"
                  >
                    <div className="grid grid-cols-1 gap-4">
                      {sentences.map((s, idx) => {
                        const isCurrent = idx === currentIndex;
                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                              isCurrent
                                ? "border-crimson bg-crimson/5 shadow-md ring-2 ring-crimson/10"
                                : "border-ink/5 bg-paper/20 hover:bg-paper/40"
                            }`}
                          >
                            {/* Badge and action row */}
                            <div className="flex items-center justify-between mb-3 text-[10px]">
                              <span
                                className={`font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                  isCurrent
                                    ? "bg-crimson text-white animate-pulse"
                                    : "bg-ink/5 text-ink/40"
                                }`}
                              >
                                Câu {idx + 1} {isCurrent && "⚡ Đang luyện tập"}
                              </span>

                              {editingHintIndex === idx ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveHintAtIndex(idx)}
                                    className="text-[9px] font-black uppercase text-emerald-600 hover:text-emerald-700 tracking-widest flex items-center gap-1 transition-colors"
                                    id={`save-hint-btn-${idx}`}
                                  >
                                    <Save size={11} /> Lưu lại
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingHintIndex(null)}
                                    className="text-[9px] font-black uppercase text-ink/40 hover:text-crimson tracking-widest flex items-center gap-1 transition-colors"
                                    id={`cancel-hint-btn-${idx}`}
                                  >
                                    <X size={11} /> Huỷ
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingHintIndex(idx);
                                    setTempHintText(s.hint || "");
                                  }}
                                  className="text-[9px] font-black uppercase text-crimson hover:underline tracking-widest flex items-center gap-1.5 transition-colors"
                                  title="Sửa gợi ý từ vựng cho câu này"
                                  id={`edit-hint-btn-${idx}`}
                                >
                                  <Edit2 size={11} className="stroke-[2.5]" />{" "}
                                  Sửa gợi ý
                                </button>
                              )}
                            </div>

                            {/* Bilingual box */}
                            <div className="space-y-3">
                              {/* Vietnamese sentence on top */}
                              <div className="space-y-0.5">
                                <span className="text-[8px] font-sans font-black text-ink/30 uppercase tracking-widest block">
                                  Tiếng Việt
                                </span>
                                <p className="text-sm font-sans font-bold leading-relaxed text-ink">
                                  {s.vi}
                                </p>
                              </div>

                              {/* English sentence below */}
                              <div className="space-y-0.5 pt-2 border-t border-dashed border-ink/5">
                                <span className="text-[8px] font-sans font-black text-teal-600 uppercase tracking-widest block">
                                  English (Bản dịch mẫu)
                                </span>
                                <p className="text-sm font-sans font-black leading-relaxed text-teal-800 font-mono">
                                  {s.en || (
                                    <span className="text-ink/20 italic font-sans font-medium">
                                      Chưa có bản dịch
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Suggestions list / editor */}
                            <div className="mt-3 pt-3 border-t border-ink/5">
                              <span className="text-[8px] font-black uppercase text-ink/40 tracking-widest block mb-1">
                                Gợi ý từ vựng & cấu trúc
                              </span>
                              {editingHintIndex === idx ? (
                                <textarea
                                  value={tempHintText}
                                  onChange={(e) =>
                                    setTempHintText(e.target.value)
                                  }
                                  className="w-full h-20 bg-white sketch-border-sm p-3 text-xs font-sans focus:outline-none resize-none border border-ink/10"
                                  placeholder="Nhập gợi ý mới (Mỗi dòng một ý)..."
                                  autoFocus
                                />
                              ) : (
                                <div className="bg-[#fcfbf9]/60 p-2.5 rounded-lg border border-dashed border-ink/5 flex flex-col">
                                  {s.hint ? (
                                    <ul className="space-y-1">
                                      {s.hint
                                        .split("\n")
                                        .filter((h) => h.trim())
                                        .map((hintLine, hIdx) => (
                                          <li
                                            key={hIdx}
                                            className="text-[11px] font-sans text-ink/70 flex items-start gap-1.5 leading-relaxed"
                                          >
                                            <span className="w-1 h-1 rounded-full bg-ink/20 mt-1.5 shrink-0" />
                                            <span>{hintLine}</span>
                                          </li>
                                        ))}
                                    </ul>
                                  ) : (
                                    <p className="text-[10px] font-sans text-ink/30 italic">
                                      Chưa có gợi ý nào cho câu này. Hãy bấm
                                      "Sửa gợi ý" để bổ sung!
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper/95 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="sketch-border bg-white p-6 md:p-8 max-w-2xl w-full flex flex-col gap-6 shadow-2xl my-auto"
            >
              <div className="text-center space-y-2">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="flex justify-center"
                >
                  <Trophy
                    className="w-12 h-12 text-amber-500"
                    style={{ filter: "url(#hand-drawn-filter)" }}
                  />
                </motion.div>
                <h2 className="text-3xl font-black uppercase tracking-tight">
                  Kết quả bài dịch
                </h2>
                <p className="text-xs font-bold uppercase tracking-widest text-ink/40">
                  Hoàn thành bài luyện dịch song ngữ
                </p>
              </div>

              {/* Chấm điểm & Thống kê */}
              {(() => {
                const correctCount = sentences.filter(
                  (s) => s.status === "correct",
                ).length;
                const totalCount = sentences.length;
                const scorePercent =
                  totalCount > 0
                    ? Math.round((correctCount / totalCount) * 100)
                    : 0;

                let gradeLabel = "Khá";
                let gradeColor =
                  "text-amber-500 bg-amber-50 border-amber-500/20";
                if (scorePercent === 100) {
                  gradeLabel = "Xuất Sắc 🌟";
                  gradeColor =
                    "text-emerald-600 bg-emerald-50 border-emerald-500/20";
                } else if (scorePercent >= 80) {
                  gradeLabel = "Tuyệt Vời 👍";
                  gradeColor = "text-teal-600 bg-teal-50 border-teal-500/20";
                } else if (scorePercent >= 50) {
                  gradeLabel = "Đạt Yêu Cầu 🙂";
                  gradeColor = "text-amber-600 bg-amber-50 border-amber-500/20";
                } else {
                  gradeLabel = "Cần Cố Gắng 💔";
                  gradeColor = "text-crimson bg-crimson/5 border-crimson/20";
                }

                return (
                  <div className="grid grid-cols-3 gap-3 md:gap-4 text-center">
                    <div className="p-3 sketch-border bg-paper/40 flex flex-col justify-center items-center">
                      <span className="text-[8px] md:text-[9px] font-black uppercase text-ink/40 tracking-widest">
                        Đúng / Tổng
                      </span>
                      <span className="text-base md:text-xl font-black text-ink">
                        {correctCount} / {totalCount}
                      </span>
                      <span className="text-[9px] font-bold text-ink/40">
                        Câu
                      </span>
                    </div>
                    <div className="p-3 sketch-border bg-paper/40 flex flex-col justify-center items-center">
                      <span className="text-[8px] md:text-[9px] font-black uppercase text-ink/40 tracking-widest">
                        Độ Chính Xác
                      </span>
                      <span className="text-base md:text-xl font-black text-ink">
                        {scorePercent}%
                      </span>
                      <span className="text-[9px] font-bold text-ink/40">
                        Tỉ lệ
                      </span>
                    </div>
                    <div className="p-3 sketch-border flex flex-col justify-center items-center bg-paper/40">
                      <span className="text-[8px] md:text-[9px] font-black uppercase text-ink/40 tracking-widest">
                        Xếp Loại
                      </span>
                      <span
                        className={`text-[11px] md:text-xs font-black px-2 py-0.5 rounded-full border ${gradeColor} mt-1`}
                      >
                        {gradeLabel}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                {sentences.map((s, i) => {
                  const isCorrect = s.status === "correct";
                  const hasUserTranslation = !!s.userTranslation?.trim();
                  const statusColor = isCorrect
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-950"
                    : "border-crimson/30 bg-crimson/5 text-crimson-950";

                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border transition-all ${statusColor}`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${isCorrect ? "bg-emerald-500 text-white shadow-sm" : "bg-crimson text-white shadow-sm"}`}
                        >
                          {i + 1}
                        </div>
                        <div className="space-y-2 w-full text-left">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold leading-relaxed">
                              {s.vi}
                            </p>
                            <span
                              className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${isCorrect ? "bg-emerald-500/15 text-emerald-700" : "bg-crimson/15 text-crimson"}`}
                            >
                              {isCorrect
                                ? "Đúng"
                                : !hasUserTranslation
                                  ? "Bản Nháp / Bỏ Qua"
                                  : "Chưa Đúng"}
                            </span>
                          </div>
                          <div className="space-y-1.5 pt-1 border-t border-dashed border-ink/5">
                            <p className="text-xs font-medium">
                              Bạn dịch:{" "}
                              <span
                                className={
                                  isCorrect
                                    ? "text-emerald-700 font-bold"
                                    : "text-crimson font-bold italic"
                                }
                              >
                                {s.userTranslation?.trim() || "(Bỏ qua)"}
                              </span>
                            </p>
                            {!isCorrect && (
                              <p className="text-xs text-emerald-800 font-bold bg-emerald-500/10 inline-block px-2 py-1 rounded">
                                Bản dịch mẫu:{" "}
                                <span className="font-mono">{s.en}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 pt-4 border-t-2 border-ink/10">
                <button
                  onClick={restartCurrent}
                  className="flex-1 sketch-button bg-paper py-3 font-black text-[10px] uppercase tracking-widest hover:bg-ink/5 transition-colors"
                >
                  Làm lại
                </button>
                <button
                  onClick={reset}
                  className="flex-1 sketch-button bg-ink text-white py-3 font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
                >
                  Hoàn tất
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Selection Tooltip */}
      {selectionRect && selectedText && (
        <div
          style={{
            position: "absolute",
            left: `${selectionRect.x}px`,
            top: `${selectionRect.y}px`,
            transform: "translateX(-50%)",
          }}
          className="z-50 animate-in fade-in zoom-in duration-100 pointer-events-auto"
        >
          <button
            type="button"
            onClick={handleAddNewHighlightedWord}
            className="flex items-center gap-1.5 bg-ink text-paper text-[10px] font-black uppercase tracking-widest px-3 py-1.5 shadow-xl cursor-pointer hover:bg-slate-800 transition-colors border-2 border-ink rounded-none shrink-0"
            style={{ filter: "url(#hand-drawn-filter)" }}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Thêm vào Vocab
          </button>
          {/* Small tail to match hand-drawn sketch style */}
          <div className="w-2 h-2 bg-ink rotate-45 mx-auto -mt-1 shadow-md border-r-2 border-b-2 border-ink" />
        </div>
      )}

      {/* Quick Add Word Modal */}
      <AnimatePresence>
        {showQuickAddDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper/95 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-paper border-4 border-ink p-6 md:p-8 max-w-md w-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative"
            >
              <button
                onClick={() => setShowQuickAddDialog(false)}
                className="absolute top-4 right-4 text-ink/40 hover:text-ink transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-6">
                <Sparkles
                  className="w-5 h-5 text-crimson"
                  style={{ filter: "url(#hand-drawn-filter)" }}
                />
                <h3 className="text-lg font-black uppercase tracking-wider text-ink font-sans">
                  Quick Add Vocabulary
                </h3>
              </div>

              {isDefiningWord ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-ink/60">
                  <Loader2 className="w-8 h-8 animate-spin text-ink" />
                  <p className="text-xs font-mono tracking-widest uppercase">
                    Đang tra cứu từ điển AI...
                  </p>
                </div>
              ) : (
                <div className="space-y-4 font-sans text-left">
                  {/* Word Input */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-ink/40">
                      Từ vựng (Vocabulary)
                    </label>
                    <input
                      type="text"
                      value={quickWord}
                      onChange={(e) => setQuickWord(e.target.value)}
                      className="w-full bg-transparent border-b-2 border-ink py-1 focus:outline-none font-bold text-lg hand-text"
                    />
                  </div>

                  {/* Word Details Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-black text-ink/40">
                        Loại từ
                      </label>
                      <select
                        value={quickType}
                        onChange={(e) => setQuickType(e.target.value)}
                        className="w-full bg-transparent border-b-2 border-ink py-1 focus:outline-none uppercase font-black text-xs h-8 cursor-pointer"
                      >
                        {[
                          "noun",
                          "verb",
                          "adj",
                          "adv",
                          "idiom",
                          "phrasal verb",
                          "phrase",
                          "sentence",
                        ].map((t) => (
                          <option
                            key={t}
                            value={t}
                            className="bg-paper uppercase text-ink"
                          >
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest font-black text-ink/40">
                        Phiên âm (IPA)
                      </label>
                      <input
                        type="text"
                        value={quickIpa}
                        onChange={(e) => setQuickIpa(e.target.value)}
                        placeholder="/.../"
                        className="w-full bg-transparent border-b-2 border-ink py-1 focus:outline-none text-sm font-mono"
                      />
                    </div>
                  </div>

                  {/* Definition */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-ink/40">
                      Nghĩa tiếng Việt (Definition)
                    </label>
                    <textarea
                      value={quickDefinition}
                      onChange={(e) => setQuickDefinition(e.target.value)}
                      className="w-full bg-transparent border-b-2 border-ink py-1 focus:outline-none text-sm leading-relaxed"
                      rows={2}
                    />
                  </div>

                  {/* Example */}
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-ink/40">
                      Câu ví dụ (Example sentence)
                    </label>
                    <textarea
                      value={quickExample}
                      onChange={(e) => setQuickExample(e.target.value)}
                      className="w-full bg-transparent border-2 border-ink p-2 text-xs leading-relaxed focus:outline-none font-mono"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-1.5 items-center bg-emerald-500/10 p-2 text-[10px] text-emerald-800 uppercase tracking-widest font-bold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Sẽ được tự động thêm nhãn "Translation"</span>
                  </div>

                  {/* Save button */}
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowQuickAddDialog(false)}
                      className="flex-1 border-2 border-ink py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-ink/5 transition-colors"
                    >
                      Hủy và Đóng
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveQuickWord}
                      className="flex-1 bg-ink text-paper py-2.5 text-[10px] font-black uppercase tracking-widest hover:scale-[1.03] transition-transform"
                    >
                      Lưu Từ Điển
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
