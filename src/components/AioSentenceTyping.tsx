import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Keyboard,
  Volume2,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Flame,
  Trophy,
  Zap,
  ArrowRight,
  BookOpen,
  Filter,
  Check,
  ChevronRight,
  VolumeX,
  Play,
  Shuffle,
  Lightbulb,
  Plus,
  Share2,
  Settings,
  Star,
  FileText,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { LEVEL_THEMES } from './StudyHub';
import { INITIAL_KNOWLEDGE_TOPICS, type KnowledgeTopic } from './AioKnowledgeBase';

export interface PracticeSentence {
  id: string;
  en: string;
  vi: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  topicCode?: string;
  topicTitle?: string;
  category: 'Ngữ pháp' | 'Giao tiếp' | 'Học thuật' | 'Thành ngữ';
  hint?: string;
  explanation?: string;
}

// 60+ Curated Sentences for Sentence Typing synchronized with AIO English CEFR curriculum
export const DEFAULT_PRACTICE_SENTENCES: PracticeSentence[] = [
  // --- LEVEL A1: CĂN BẢN (MẤT GỐC) ---
  {
    id: 's-a1-1',
    en: 'I am very happy to meet you today.',
    vi: 'Tôi rất vui khi được gặp bạn hôm nay.',
    level: 'A1',
    topicCode: 'A1.1',
    topicTitle: 'Động từ To Be (am / is / are)',
    category: 'Giao tiếp',
    hint: 'Bắt đầu với "I am very..."',
    explanation: 'Cấu trúc To Be: S + am + adj (happy) + to V.'
  },
  {
    id: 's-a1-2',
    en: 'She is an excellent English teacher.',
    vi: 'Cô ấy là một giáo viên tiếng Anh xuất sắc.',
    level: 'A1',
    topicCode: 'A1.1',
    topicTitle: 'Động từ To Be (am / is / are)',
    category: 'Ngữ pháp',
    hint: 'Dùng mạo từ "an" trước nguyên âm E (excellent).',
    explanation: 'S + is + an + Adj + Noun.'
  },
  {
    id: 's-a1-3',
    en: 'This is my favorite notebook; she gave it to me.',
    vi: 'Đây là cuốn sổ tay yêu thích của tôi; cô ấy đã tặng nó cho tôi.',
    level: 'A1',
    topicCode: 'A1.2',
    topicTitle: 'Đại từ nhân xưng & Tính từ sở hữu',
    category: 'Ngữ pháp',
    hint: 'Tính từ sở hữu "my" đi với notebook, tân ngữ "me" đứng sau giới từ to.',
    explanation: 'Sở hữu: my + Noun; Tân ngữ: gave it to me.'
  },
  {
    id: 's-a1-4',
    en: 'The sun rises in the east every morning.',
    vi: 'Mặt trời mọc ở hướng đông mỗi buổi sáng.',
    level: 'A1',
    topicCode: 'A1.3',
    topicTitle: 'Thì Hiện Tại Đơn (Present Simple)',
    category: 'Ngữ pháp',
    hint: 'Chủ ngữ ngôi thứ 3 số ít "The sun" nên động từ rise thêm s.',
    explanation: 'Chân lý hiển nhiên dùng thì Hiện tại đơn: S + V(s/es).'
  },
  {
    id: 's-a1-5',
    en: 'He does not drink coffee after four in the afternoon.',
    vi: 'Anh ấy không uống cà phê sau 4 giờ chiều.',
    level: 'A1',
    topicCode: 'A1.3',
    topicTitle: 'Thì Hiện Tại Đơn (Present Simple)',
    category: 'Giao tiếp',
    hint: 'Phủ định hiện tại đơn với He: does not + V nguyên mẫu.',
    explanation: 'He/She/It + does not + V (bare).'
  },
  {
    id: 's-a1-6',
    en: 'The keys are on the wooden desk near the window.',
    vi: 'Chùm chìa khóa nằm ở trên bàn gỗ gần cửa sổ.',
    level: 'A1',
    topicCode: 'A1.5',
    topicTitle: 'Giới Từ Nơi Chốn & Thời Gian',
    category: 'Ngữ pháp',
    hint: 'Giới từ "on" chỉ vị trí tiếp xúc trên bề mặt.',
    explanation: 'On the desk (trên bàn), near the window (gần cửa sổ).'
  },

  // --- LEVEL A2: SƠ CẤP (GIAO TIẾP ĐỜI SỐNG) ---
  {
    id: 's-a2-1',
    en: 'We visited our grandparents in the countryside last weekend.',
    vi: 'Chúng tôi đã về thăm ông bà ở quê vào cuối tuần trước.',
    level: 'A2',
    topicCode: 'A2.1',
    topicTitle: 'Thì Quá Khứ Đơn (Past Simple)',
    category: 'Giao tiếp',
    hint: 'Động từ visit có quy tắc thêm -ed (visited).',
    explanation: 'Quá khứ đơn: S + V-ed/V2 + thời gian quá khứ (last weekend).'
  },
  {
    id: 's-a2-2',
    en: 'She bought a new laptop because her old one was broken.',
    vi: 'Cô ấy đã mua một chiếc laptop mới vì chiếc cũ đã bị hỏng.',
    level: 'A2',
    topicCode: 'A2.1',
    topicTitle: 'Thì Quá Khứ Đơn (Past Simple)',
    category: 'Ngữ pháp',
    hint: 'Quá khứ của buy là bought, quá khứ của is là was.',
    explanation: 'Động từ bất quy tắc: buy -> bought; be -> was/were.'
  },
  {
    id: 's-a2-3',
    en: 'My current smartphone is much faster than the old one.',
    vi: 'Chiếc điện thoại hiện tại của tôi nhanh hơn nhiều so với chiếc cũ.',
    level: 'A2',
    topicCode: 'A2.3',
    topicTitle: 'So Sánh Hơn & So Sánh Nhất',
    category: 'Ngữ pháp',
    hint: 'Tính từ ngắn fast -> faster than. Thêm "much" để nhấn mạnh.',
    explanation: 'So sánh hơn tính từ ngắn: Adj + er + than.'
  },
  {
    id: 's-a2-4',
    en: 'This is the most comfortable chair in the living room.',
    vi: 'Đây là chiếc ghế êm ái nhất trong phòng khách.',
    level: 'A2',
    topicCode: 'A2.3',
    topicTitle: 'So Sánh Hơn & So Sánh Nhất',
    category: 'Ngữ pháp',
    hint: 'Tính từ dài comfortable -> the most comfortable.',
    explanation: 'So sánh nhất tính từ dài: the most + Adj.'
  },
  {
    id: 's-a2-5',
    en: 'We need more accurate information before making an official decision.',
    vi: 'Chúng ta cần thông tin chính xác hơn trước khi đưa ra quyết định chính thức.',
    level: 'A2',
    topicCode: 'A2.4',
    topicTitle: 'Quy Tắc Trọng Âm Từ',
    category: 'Học thuật',
    hint: 'Hậu tố -tion hút trọng âm vào âm tiết đứng liền trước nó (de-CI-sion).',
    explanation: 'Infor-MA-tion, de-CI-sion.'
  },

  // --- LEVEL B1: TRUNG CẤP (TỰ TIN DIỄN ĐẠT) ---
  {
    id: 's-b1-1',
    en: 'I have lived in this dynamic city for more than five years.',
    vi: 'Tôi đã sống ở thành phố năng động này hơn năm năm rồi.',
    level: 'B1',
    topicCode: 'B1.1',
    topicTitle: 'Thì Hiện Tại Hoàn Thành',
    category: 'Giao tiếp',
    hint: 'Hiện tại hoàn thành với khoảng thời gian: have lived + for + time.',
    explanation: 'S + have/has + V3/ed + for + khoảng thời gian.'
  },
  {
    id: 's-b1-2',
    en: 'She has already submitted her research project to the professor.',
    vi: 'Cô ấy đã nộp đề tài nghiên cứu của mình cho giáo sư rồi.',
    level: 'B1',
    topicCode: 'B1.1',
    topicTitle: 'Thì Hiện Tại Hoàn Thành',
    category: 'Học thuật',
    hint: 'Trạng từ "already" đứng giữa has và động từ submitted.',
    explanation: 'Has already + V3/ed (nhấn mạnh hành động đã hoàn tất).'
  },
  {
    id: 's-b1-3',
    en: 'If it rains heavily tomorrow, we will stay at home and study.',
    vi: 'Nếu ngày mai trời mưa to, chúng tôi sẽ ở nhà và tự học.',
    level: 'B1',
    topicCode: 'B1.2',
    topicTitle: 'Câu Điều Kiện Loại 1 & Loại 2',
    category: 'Ngữ pháp',
    hint: 'Mệnh đề If dùng hiện tại đơn (rains), mệnh đề chính dùng will + V.',
    explanation: 'Điều kiện loại 1 (có thể xảy ra ở tương lai): If + S + V(s/es), S + will + V.'
  },
  {
    id: 's-b1-4',
    en: 'If I had more free time, I would learn how to code in Python.',
    vi: 'Nếu tôi có nhiều thời gian rảnh hơn, tôi sẽ học cách lập trình bằng Python.',
    level: 'B1',
    topicCode: 'B1.2',
    topicTitle: 'Câu Điều Kiện Loại 1 & Loại 2',
    category: 'Ngữ pháp',
    hint: 'Điều kiện loại 2 giả định trái ngược hiện tại: If + S + V2/ed, S + would + V.',
    explanation: 'If I had (quá khứ đơn), I would learn.'
  },
  {
    id: 's-b1-5',
    en: 'The mentor who guided me through the internship is extremely supportive.',
    vi: 'Người hướng dẫn đã dìu dắt tôi trong kỳ thực tập vô cùng nhiệt tình.',
    level: 'B1',
    topicCode: 'B1.3',
    topicTitle: 'Mệnh Đề Quan Hệ (Relative Clauses)',
    category: 'Học thuật',
    hint: 'Dùng đại từ quan hệ "who" thay thế cho người (The mentor).',
    explanation: 'Mệnh đề quan hệ xác định: The mentor who guided me...'
  },
  {
    id: 's-b1-6',
    en: 'English is spoken by millions of people across the globe.',
    vi: 'Tiếng Anh được nói bởi hàng triệu người trên khắp toàn cầu.',
    level: 'B1',
    topicCode: 'B1.4',
    topicTitle: 'Câu Bị Động (Passive Voice)',
    category: 'Ngữ pháp',
    hint: 'Bị động hiện tại đơn: is + spoken (V3 của speak) + by...',
    explanation: 'S + is/are + V3/ed + by O.'
  },

  // --- LEVEL B2: NÂNG CAO & HỌC THUẬT ---
  {
    id: 's-b2-1',
    en: 'If he had followed the advice, he would be successful today.',
    vi: 'Nếu anh ấy chịu nghe theo lời khuyên, thì hôm nay anh ấy đã thành công rồi.',
    level: 'B2',
    topicCode: 'B2.1',
    topicTitle: 'Câu Điều Kiện Nâng Cao & Hỗn Hợp',
    category: 'Ngữ pháp',
    hint: 'Hỗn hợp: Quá khứ giả định (had followed) dẫn tới kết quả hiện tại (would be today).',
    explanation: 'Mixed Conditional: If + had + V3, S + would + V (bare).'
  },
  {
    id: 's-b2-2',
    en: 'Rarely have I witnessed such dedication and passion for learning.',
    vi: 'Hiếm khi tôi được chứng kiến sự tận tụy và niềm đam mê học tập đến như vậy.',
    level: 'B2',
    topicCode: 'B2.2',
    topicTitle: 'Đảo Ngữ Nhấn Mạnh (Inversion)',
    category: 'Học thuật',
    hint: 'Đảo ngữ với phó từ phủ định: Rarely + trợ động từ have + S + V3.',
    explanation: 'Rarely + have + S + V3/ed.'
  },
  {
    id: 's-b2-3',
    en: 'Not only did she pass the exam, but she also achieved the highest score.',
    vi: 'Không những cô ấy vượt qua kỳ thi, mà cô ấy còn đạt số điểm cao nhất.',
    level: 'B2',
    topicCode: 'B2.2',
    topicTitle: 'Đảo Ngữ Nhấn Mạnh (Inversion)',
    category: 'Học thuật',
    hint: 'Cấu trúc Not only + did + S + V, but S also + V.',
    explanation: 'Cấu trúc đảo ngữ nhấn mạnh song song.'
  },
  {
    id: 's-b2-4',
    en: 'We need to hit the books tonight because the deadline is approaching.',
    vi: 'Chúng ta cần phải lao vào học đêm nay vì hạn chót đang đến gần rồi.',
    level: 'B2',
    topicCode: 'B2.4',
    topicTitle: 'Thành Ngữ & Cụm Từ Bản Xứ (Idioms & Collocations)',
    category: 'Thành ngữ',
    hint: 'Thành ngữ "hit the books" có nghĩa là học hành chăm chỉ.',
    explanation: 'Idiom: hit the books = study hard.'
  },

  // --- LEVEL C1: CHUYÊN SÂU & THÀNH THẠO BẢN XỨ ---
  {
    id: 's-c1-1',
    en: 'The committee recommended that every proposal be thoroughly evaluated.',
    vi: 'Ủy ban đề nghị rằng mọi đề xuất cần phải được đánh giá một cách thấu đáo.',
    level: 'C1',
    topicCode: 'C1.1',
    topicTitle: 'Thể Giả Định (Subjunctive Mood)',
    category: 'Học thuật',
    hint: 'Thể giả định trong câu mệnh lệnh/đề xuất: that + S + V nguyên mẫu (be evaluated).',
    explanation: 'Subjunctive: recommended that + S + (should) be + V3.'
  },
  {
    id: 's-c1-2',
    en: 'It is widely argued that digital transformation reshapes modern education.',
    vi: 'Có nhiều quan điểm lập luận rộng rãi rằng chuyển đổi số đang tái định hình nền giáo dục hiện đại.',
    level: 'C1',
    topicCode: 'C1.2',
    topicTitle: 'Kỹ Thuật Hedging & Lập Luận Học Thuật',
    category: 'Học thuật',
    hint: 'Cấu trúc khách quan gián tiếp: It is widely argued that...',
    explanation: 'Academic Hedging giúp luận điểm sắc sảo và mang tính khách quan cao.'
  },
  {
    id: 's-c1-3',
    en: 'It was her relentless persistence that ultimately led to the breakthrough.',
    vi: 'Chính sự bền bỉ kiên trì không ngừng của cô ấy đã dẫn đến bước đột phá.',
    level: 'C1',
    topicCode: 'C1.3',
    topicTitle: 'Cleft Sentences & Cấu Trúc Nhấn Mạnh',
    category: 'Học thuật',
    hint: 'Câu chẻ nhấn mạnh chủ ngữ: It was + X + that + V.',
    explanation: 'Cleft sentence: It was [Noun Phrase] that [Action].'
  }
];

export interface AioSentenceTypingProps {
  onOpenMindmapTopic?: (topicCode: string) => void;
  onBackToRoadmap?: () => void;
  onSwitchToKnowledgeTab?: () => void;
  onClose?: () => void;
  defaultFullscreen?: boolean;
}

export function AioSentenceTyping({
  onOpenMindmapTopic,
  onBackToRoadmap,
  onSwitchToKnowledgeTab,
  onClose,
  defaultFullscreen = false
}: AioSentenceTypingProps) {
  // Fullscreen view state
  const [isFullscreen, setIsFullscreen] = useState(defaultFullscreen);

  // Esc key to exit fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  // Practice Mode:
  // 'typing' = Gõ theo mẫu từng ký tự (Real-time char-by-char matching with WPM & accuracy)
  // 'translate' = Gõ dịch câu tiếng Việt sang tiếng Anh (Self translation & verify)
  // 'dictation' = Nghe audio rồi gõ lại câu (Audio Dictation)
  // 'scramble' = Gõ câu từ các từ xáo trộn
  const [practiceMode, setPracticeMode] = useState<'typing' | 'translate' | 'dictation' | 'scramble'>('typing');
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Sentence List state (can load custom or default)
  const [sentences, setSentences] = useState<PracticeSentence[]>(() => {
    try {
      const stored = localStorage.getItem('aio_custom_sentences');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_PRACTICE_SENTENCES;
  });

  // Filtered Sentences
  const filteredSentences = useMemo(() => {
    return sentences.filter((s) => {
      if (selectedLevel !== 'ALL' && s.level !== selectedLevel) return false;
      if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false;
      return true;
    });
  }, [sentences, selectedLevel, selectedCategory]);

  // Current sentence index
  const [currentIndex, setCurrentIndex] = useState(0);

  // Guard index when filtered list changes
  useEffect(() => {
    if (currentIndex >= filteredSentences.length) {
      setCurrentIndex(0);
    }
  }, [filteredSentences.length, currentIndex]);

  const currentSentence: PracticeSentence | undefined = filteredSentences[currentIndex];

  // User input string
  const [userInput, setUserInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Audio speech synthesis
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Metrics: Start time, WPM, accuracy, streak, error count
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(() => {
    const s = localStorage.getItem('aio_typing_best_streak');
    return s ? parseInt(s, 10) : 0;
  });
  const [wpm, setWpm] = useState(0);
  const [isCompletedSentence, setIsCompletedSentence] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  // Custom sentence modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEn, setNewEn] = useState('');
  const [newVi, setNewVi] = useState('');
  const [newLevel, setNewLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1'>('A1');

  // Mechanical typing audio click synthesizer using Web Audio API
  const playClickSound = (isError = false) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (isError) {
        // Lower buzzing sound for mistake
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else {
        // High crisp tactile click for correct key
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch {
      // AudioContext muted/unsupported
    }
  };

  const playSuccessChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.07, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
      });
    } catch {}
  };

  // Text-to-speech speaker
  const speakSentence = (text: string, rate = speechRate) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Auto focus input whenever sentence changes
  useEffect(() => {
    setUserInput('');
    setIsCompletedSentence(false);
    setShowHint(false);
    setShowAnswer(false);
    setStartTime(null);
    inputRef.current?.focus();

    // In dictation mode, auto play audio when sentence switches
    if (practiceMode === 'dictation' && currentSentence) {
      speakSentence(currentSentence.en);
    }
  }, [currentIndex, practiceMode, currentSentence?.id]);

  // Handle Input Changes with Real-time Character Matching & WPM calculation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentSentence || isCompletedSentence) return;
    const value = e.target.value;
    const targetEn = currentSentence.en;

    // Start timer on first keystroke
    if (!startTime) {
      setStartTime(Date.now());
    }

    // Keystroke metric tracking
    setTotalKeystrokes((prev) => prev + 1);

    // Check last typed character
    if (value.length > userInput.length) {
      const lastCharIdx = value.length - 1;
      const isCharCorrect =
        practiceMode === 'typing' ? value[lastCharIdx] === targetEn[lastCharIdx] : true;

      if (isCharCorrect) {
        setCorrectKeystrokes((prev) => prev + 1);
        playClickSound(false);
      } else {
        playClickSound(true);
      }
    }

    setUserInput(value);

    // Compute live WPM
    if (startTime) {
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      if (elapsedMinutes > 0.02) {
        const wordsTyped = value.trim().split(/\s+/).filter(Boolean).length;
        const currentWpm = Math.round(wordsTyped / elapsedMinutes);
        setWpm(currentWpm);
      }
    }

    // Check completion condition
    // For 'typing' mode: exact character-by-character match
    // For other modes: case-insensitive trimmed match or period tolerance
    const normalize = (str: string) =>
      str.trim().toLowerCase().replace(/[.,!?;:'"–—-]/g, '').replace(/\s+/g, ' ');

    const isMatch =
      practiceMode === 'typing'
        ? value === targetEn
        : normalize(value) === normalize(targetEn);

    if (isMatch) {
      setIsCompletedSentence(true);
      playSuccessChime();

      // Update streak
      setStreak((prev) => {
        const next = prev + 1;
        if (next > bestStreak) {
          setBestStreak(next);
          localStorage.setItem('aio_typing_best_streak', String(next));
        }
        return next;
      });

      // Speak sentence aloud for reinforcement
      speakSentence(targetEn);
    }
  };

  // Keyboard navigation shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter key: Next sentence if completed
    if (e.key === 'Enter') {
      if (isCompletedSentence) {
        handleNextSentence();
      } else if (practiceMode === 'translate' || practiceMode === 'dictation') {
        // Manual verification check on Enter
        if (currentSentence) {
          const normalize = (str: string) =>
            str.trim().toLowerCase().replace(/[.,!?;:'"–—-]/g, '').replace(/\s+/g, ' ');
          if (normalize(userInput) === normalize(currentSentence.en)) {
            setIsCompletedSentence(true);
            playSuccessChime();
            speakSentence(currentSentence.en);
          } else {
            playClickSound(true);
          }
        }
      }
    }
    // Tab key: Replay audio pronunciation
    if (e.key === 'Tab') {
      e.preventDefault();
      if (currentSentence) {
        speakSentence(currentSentence.en);
      }
    }
    // Escape key: Reset input
    if (e.key === 'Escape') {
      setUserInput('');
      setStartTime(null);
    }
  };

  const handleNextSentence = () => {
    if (currentIndex < filteredSentences.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Loop or finish
      setCurrentIndex(0);
    }
  };

  const handlePrevSentence = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Add custom sentence
  const handleAddSentence = () => {
    if (!newEn.trim() || !newVi.trim()) return;
    const newSentence: PracticeSentence = {
      id: `custom-${Date.now()}`,
      en: newEn.trim(),
      vi: newVi.trim(),
      level: newLevel,
      category: 'Giao tiếp',
      hint: 'Câu do bạn tự tạo để luyện gõ.'
    };
    const nextList = [newSentence, ...sentences];
    setSentences(nextList);
    try {
      localStorage.setItem('aio_custom_sentences', JSON.stringify(nextList));
    } catch {}
    setNewEn('');
    setNewVi('');
    setShowAddModal(false);
  };

  // Accuracy calculation
  const accuracyPercent = useMemo(() => {
    if (totalKeystrokes === 0) return 100;
    return Math.min(100, Math.round((correctKeystrokes / totalKeystrokes) * 100));
  }, [totalKeystrokes, correctKeystrokes]);

  const levelTheme = currentSentence
    ? LEVEL_THEMES[currentSentence.level] || LEVEL_THEMES.A1
    : LEVEL_THEMES.A1;

  return (
    <div
      className={cn(
        "transition-all duration-300 select-none",
        isFullscreen
          ? "fixed inset-0 z-[100] bg-[#FAF8F5] p-3 sm:p-6 w-screen h-screen overflow-y-auto"
          : "w-full max-w-4xl mx-auto pb-10"
      )}
    >
      <div className={cn("w-full flex flex-col gap-5", isFullscreen ? "max-w-5xl mx-auto" : "")}>
        {/* 1. HEADER BANNER */}
        <div className="bg-[#FFFDF7] p-4 sm:p-5 rounded-[24px] border-[2.5px] border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col gap-3.5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-400 border-2 border-[#141414] flex items-center justify-center shadow-[2px_2px_0px_#141414] text-ink shrink-0">
                <Keyboard className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-ink uppercase tracking-tight">
                    Luyện Gõ Câu Tiếng Anh (Sentence Typing)
                  </h2>
                  <span className="bg-amber-100 text-amber-900 border border-amber-600 font-black text-[10px] px-2 py-0.5 rounded-full">
                    aioenglish.com/go-cau
                  </span>
                </div>
                <p className="text-xs text-ink/70 font-medium mt-0.5">
                  Rèn phản xạ cơ tay, ghi nhớ trật tự từ và chính tả câu tiếng Anh chuẩn quốc tế.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 bg-white hover:bg-amber-100 text-ink text-xs font-black rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center gap-1.5 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                title="Thêm câu mới để luyện gõ"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Câu</span>
              </button>

              {/* Fullscreen Toggle Button */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={cn(
                  "px-3 py-1.5 rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] text-xs font-black flex items-center gap-1.5 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer",
                  isFullscreen ? "bg-rose-100 text-rose-800 hover:bg-rose-200" : "bg-[#F8EFCB] hover:bg-amber-200 text-ink"
                )}
                title={isFullscreen ? "Thu nhỏ (Esc)" : "Toàn Màn Hình"}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Thu nhỏ (Esc)</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Toàn Màn Hình</span>
                  </>
                )}
              </button>

              {onBackToRoadmap && !isFullscreen && (
                <button
                  onClick={onBackToRoadmap}
                  className="px-3 py-1.5 bg-white hover:bg-amber-50 text-ink text-xs font-black rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center gap-1.5 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Xem Lộ Trình</span>
                </button>
              )}

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 bg-gray-100 hover:bg-gray-200 text-ink text-xs font-black rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center justify-center transition-all cursor-pointer"
                  title="Đóng / Thoát về trang trước"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

        {/* Real-time Performance HUD (WPM, Accuracy, Streak) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-dashed border-[#141414]/20">
          <div className="bg-white p-2.5 rounded-xl border border-[#141414] shadow-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 border border-sky-600 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 fill-sky-500" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-ink/60 uppercase">Tốc Độ Gõ</span>
              <p className="text-sm font-black text-ink">{wpm} WPM</p>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-[#141414] shadow-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-600 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 fill-emerald-500" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-ink/60 uppercase">Độ Chính Xác</span>
              <p className="text-sm font-black text-ink">{accuracyPercent}%</p>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-[#141414] shadow-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 border border-amber-600 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-ink/60 uppercase">Chuỗi Chuẩn</span>
              <p className="text-sm font-black text-orange-600">{streak} câu</p>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-[#141414] shadow-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 border border-purple-600 flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 fill-purple-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-ink/60 uppercase">Kỷ Lục</span>
              <p className="text-sm font-black text-purple-700">{bestStreak} câu</p>
            </div>
          </div>
        </div>

        {/* Practice Mode Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-dashed border-[#141414]/20">
          <div className="flex items-center bg-[#EFECE6] p-1 rounded-xl border-2 border-[#141414] text-xs font-black overflow-x-auto">
            <button
              onClick={() => setPracticeMode('typing')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                practiceMode === 'typing'
                  ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#141414]'
                  : 'text-ink/65 hover:text-ink'
              )}
            >
              <Keyboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Gõ Theo Mẫu (Copy Typing)</span>
            </button>

            <button
              onClick={() => setPracticeMode('translate')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                practiceMode === 'translate'
                  ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#141414]'
                  : 'text-ink/65 hover:text-ink'
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Gõ Dịch Phản Xạ (Vi → En)</span>
            </button>

            <button
              onClick={() => setPracticeMode('dictation')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                practiceMode === 'dictation'
                  ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#141414]'
                  : 'text-ink/65 hover:text-ink'
              )}
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nghe & Chép Câu</span>
            </button>
          </div>

          {/* Sound & Speech Rate Toggles */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={cn(
                'p-1.5 rounded-lg border border-[#141414] text-xs font-black flex items-center gap-1 transition-colors cursor-pointer',
                soundEnabled ? 'bg-amber-100 text-amber-900' : 'bg-gray-100 text-ink/40'
              )}
              title={soundEnabled ? 'Đang bật âm bàn phím cơ' : 'Đang tắt âm bàn phím cơ'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="text-[10px]">Âm gõ</span>
            </button>

            <button
              onClick={() => setSpeechRate((prev) => (prev === 0.95 ? 0.75 : 0.95))}
              className="px-2 py-1 bg-white hover:bg-gray-100 border border-[#141414] rounded-lg text-[10px] font-black cursor-pointer"
              title="Tốc độ đọc câu"
            >
              Tốc độ: {speechRate}x
            </button>
          </div>
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold pt-1">
          <span className="text-[10px] font-black uppercase text-ink/50 mr-1 hidden sm:inline">
            Cấp độ:
          </span>
          <button
            onClick={() => setSelectedLevel('ALL')}
            className={cn(
              'px-2.5 py-1 rounded-lg border font-black text-xs transition-all cursor-pointer shrink-0',
              selectedLevel === 'ALL'
                ? 'bg-[#141414] text-white border-[#141414] shadow-xs'
                : 'bg-white hover:bg-gray-100 text-ink border-[#141414]/30'
            )}
          >
            Tất cả ({sentences.length})
          </button>
          {(['A1', 'A2', 'B1', 'B2', 'C1'] as const).map((lvl) => {
            const th = LEVEL_THEMES[lvl];
            const isSelected = selectedLevel === lvl;
            const count = sentences.filter((s) => s.level === lvl).length;
            return (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                style={{
                  backgroundColor: isSelected ? th.badgeBg : th.bg,
                  borderColor: th.border,
                  color: isSelected ? th.badgeText : '#141414'
                }}
                className={cn(
                  'px-2.5 py-1 rounded-lg border font-black text-xs transition-all cursor-pointer shrink-0',
                  isSelected ? 'shadow-[1.5px_1.5px_0px_#141414] scale-105' : 'hover:scale-102'
                )}
              >
                {lvl} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN INTERACTIVE TYPING WORKSPACE */}
      {currentSentence ? (
        <div
          className="rounded-[28px] border-[2.5px] border-[#141414] p-5 sm:p-7 shadow-[5px_5px_0px_#141414] flex flex-col gap-5 transition-all relative overflow-hidden"
          style={{ backgroundColor: levelTheme.bg }}
        >
          {/* Card Top Row: Meta Badge & Sentence Progress */}
          <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-[#141414]/20 pb-3">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-black px-2.5 py-1 rounded-lg text-white shadow-xs"
                style={{ backgroundColor: levelTheme.badgeBg }}
              >
                Level {currentSentence.level}
              </span>
              {currentSentence.topicCode && (
                <span className="text-[11px] font-bold text-ink/75 bg-white px-2 py-0.5 rounded-md border border-[#141414]/30">
                  {currentSentence.topicCode}: {currentSentence.topicTitle}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-ink">
                Câu {currentIndex + 1} / {filteredSentences.length}
              </span>

              {/* Audio Listen Button */}
              <button
                type="button"
                onClick={() => speakSentence(currentSentence.en)}
                className="p-1.5 bg-white hover:bg-amber-100 text-ink rounded-lg border border-[#141414] shadow-xs transition-transform hover:scale-105 cursor-pointer"
                title="Nghe phát âm chuẩn bản xứ (Phím Tab)"
              >
                <Volume2 className={cn('w-4 h-4', isSpeaking ? 'text-amber-600 animate-pulse' : '')} />
              </button>
            </div>
          </div>

          {/* Vietnamese Meaning Prompt */}
          <div className="bg-white/80 p-3.5 rounded-2xl border-2 border-[#141414] shadow-xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <span className="text-base select-none mt-0.5">🇻🇳</span>
              <div>
                <p className="text-sm sm:text-base font-extrabold text-ink leading-relaxed">
                  {currentSentence.vi}
                </p>
                {currentSentence.explanation && (
                  <p className="text-[11px] text-ink/65 mt-1 font-medium italic">
                    💡 {currentSentence.explanation}
                  </p>
                )}
              </div>
            </div>

            {/* Hint Trigger */}
            {practiceMode !== 'typing' && (
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg border border-amber-600 text-[10px] font-black shrink-0 cursor-pointer"
              >
                {showHint ? 'Ẩn Gợi Ý' : 'Gợi Ý'}
              </button>
            )}
          </div>

          {/* Display Hint if toggled */}
          {showHint && currentSentence.hint && (
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-400 text-xs font-bold text-amber-950 flex items-center gap-2 animate-in fade-in">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{currentSentence.hint}</span>
            </div>
          )}

          {/* English Target Sentence Display with Live Visual Typing Feedback */}
          {practiceMode === 'typing' || showAnswer || isCompletedSentence ? (
            <div className="bg-[#FFFDF7] p-4 sm:p-5 rounded-2xl border-2 border-[#141414] shadow-inner font-mono text-base sm:text-xl font-bold leading-relaxed tracking-wide min-h-[70px] flex items-center flex-wrap select-none">
              {currentSentence.en.split('').map((char, index) => {
                const isTyped = index < userInput.length;
                const isCurrentCursor = index === userInput.length;
                const isCorrect = isTyped && userInput[index] === char;
                const isError = isTyped && userInput[index] !== char;

                return (
                  <span
                    key={index}
                    className={cn(
                      'transition-colors duration-100 inline-block',
                      isCorrect ? 'text-emerald-600 bg-emerald-100/60 rounded px-0.5 font-black' : '',
                      isError ? 'text-rose-600 bg-rose-200/80 rounded px-0.5 underline font-black animate-pulse' : '',
                      !isTyped ? 'text-ink/35' : '',
                      isCurrentCursor ? 'border-b-4 border-amber-500 animate-pulse text-ink' : ''
                    )}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                );
              })}
            </div>
          ) : (
            /* Concealed mode for Translation & Dictation Practice */
            <div className="bg-[#FFFDF7] p-4 sm:p-5 rounded-2xl border-2 border-dashed border-[#141414]/30 min-h-[70px] flex items-center justify-between gap-3 text-ink/50 text-xs sm:text-sm font-medium">
              <span>
                {practiceMode === 'dictation'
                  ? '🎧 Đang ẩn câu tiếng Anh. Hãy bấm loa nghe phát âm và gõ lại câu hoàn chỉnh.'
                  : '🔤 Hãy dịch câu tiếng Việt ở trên và gõ câu tiếng Anh tương ứng vào ô bên dưới.'}
              </span>
              <button
                type="button"
                onClick={() => setShowAnswer(true)}
                className="px-2.5 py-1 bg-white hover:bg-gray-100 text-ink border border-[#141414] rounded-lg text-xs font-bold shrink-0 cursor-pointer"
              >
                Hiện đáp án
              </button>
            </div>
          )}

          {/* REAL-TIME TYPING INPUT BOX */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isCompletedSentence}
                placeholder={
                  practiceMode === 'typing'
                    ? 'Bắt đầu gõ câu tiếng Anh ở đây...'
                    : 'Gõ bản dịch tiếng Anh của bạn tại đây rồi nhấn Enter...'
                }
                className={cn(
                  'w-full px-4 py-3.5 rounded-2xl border-[2.5px] border-[#141414] font-mono text-sm sm:text-base font-bold text-ink outline-none transition-all shadow-[3px_3px_0px_#141414] bg-white',
                  isCompletedSentence
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-black'
                    : 'focus:bg-amber-50/50'
                )}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />

              {/* Reset Clear Icon */}
              {userInput && !isCompletedSentence && (
                <button
                  type="button"
                  onClick={() => {
                    setUserInput('');
                    setStartTime(null);
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink text-xs font-black cursor-pointer"
                >
                  Xóa
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-ink/60 font-medium px-1">
              <span>Phím tắt: [Tab] Nghe audio • [Esc] Xóa gõ lại • [Enter] Chuyển câu</span>
              <span>
                {userInput.length} / {currentSentence.en.length} ký tự
              </span>
            </div>
          </div>

          {/* SUCCESS BANNER WHEN COMPLETED */}
          <AnimatePresence>
            {isCompletedSentence && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-emerald-100 p-4 rounded-2xl border-2 border-emerald-700 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[3px_3px_0px_#047857]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Check className="w-6 h-6 stroke-[3.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-emerald-950">
                      Chính xác 100%! Xuất sắc! 🎉
                    </h4>
                    <p className="text-xs text-emerald-800 font-medium">
                      Tốc độ đạt: <span className="font-black">{wpm} WPM</span> • Độ chính xác:{' '}
                      <span className="font-black">{accuracyPercent}%</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setUserInput('');
                      setIsCompletedSentence(false);
                      setStartTime(null);
                      inputRef.current?.focus();
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 text-ink text-xs font-bold rounded-xl border border-[#141414] shadow-xs cursor-pointer"
                  >
                    Gõ Lại
                  </button>

                  <button
                    type="button"
                    onClick={handleNextSentence}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center gap-1.5 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    <span>Câu Tiếp Theo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls: Prev, Replay, Next */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-dashed border-[#141414]/20">
            <button
              type="button"
              onClick={handlePrevSentence}
              disabled={currentIndex === 0}
              className="px-3.5 py-1.5 bg-white hover:bg-gray-100 disabled:opacity-40 text-ink text-xs font-black rounded-xl border border-[#141414] shadow-xs cursor-pointer"
            >
              ← Câu Trước
            </button>

            {/* Quick Link to Topic Mindmap */}
            {currentSentence.topicCode && onOpenMindmapTopic && (
              <button
                type="button"
                onClick={() => onOpenMindmapTopic(currentSentence.topicCode!)}
                className="px-3 py-1 bg-amber-300 hover:bg-amber-400 text-ink text-xs font-black rounded-xl border border-[#141414] shadow-xs hidden sm:flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Xem Mindmap Chủ Điểm Này</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNextSentence}
              className="px-4 py-1.5 bg-[#141414] hover:bg-[#2a2a2a] text-white text-xs font-black rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center gap-1 cursor-pointer"
            >
              <span>Tiếp Theo →</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border-2 border-[#141414] text-center flex flex-col items-center gap-3">
          <AlertCircle className="w-8 h-8 text-amber-500" />
          <p className="text-sm font-bold text-ink">Không có câu nào trong bộ lọc này.</p>
          <button
            onClick={() => {
              setSelectedLevel('ALL');
              setSelectedCategory('ALL');
            }}
            className="px-3 py-1.5 bg-amber-400 text-ink text-xs font-black rounded-xl border border-[#141414]"
          >
            Hiện tất cả câu
          </button>
        </div>
      )}

      {/* 3. MODAL: ADD CUSTOM SENTENCE */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FFFDF7] w-full max-w-md p-6 rounded-[24px] border-[2.5px] border-[#141414] shadow-[6px_6px_0px_#141414] flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b-2 border-dashed border-[#141414]/20 pb-3">
                <h3 className="text-base font-black uppercase text-ink flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-500" />
                  Thêm Câu Mới Luyện Gõ
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-ink/50 hover:text-ink text-sm font-black p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-ink uppercase">
                  Câu Tiếng Anh (English):
                </label>
                <input
                  type="text"
                  value={newEn}
                  onChange={(e) => setNewEn(e.target.value)}
                  placeholder="Ví dụ: Consistent practice leads to fluency."
                  className="px-3 py-2 text-sm font-bold text-ink bg-white border-2 border-[#141414] rounded-xl outline-none focus:bg-amber-50"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-ink uppercase">
                  Nghĩa Tiếng Việt (Vietnamese):
                </label>
                <input
                  type="text"
                  value={newVi}
                  onChange={(e) => setNewVi(e.target.value)}
                  placeholder="Ví dụ: Luyện tập kiên trì sẽ dẫn tới sự thành thạo."
                  className="px-3 py-2 text-sm font-bold text-ink bg-white border-2 border-[#141414] rounded-xl outline-none focus:bg-amber-50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-ink uppercase">Cấp độ CEFR:</label>
                <div className="flex gap-1.5">
                  {(['A1', 'A2', 'B1', 'B2', 'C1'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setNewLevel(lvl)}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg border-2 text-xs font-black transition-all',
                        newLevel === lvl
                          ? 'bg-[#141414] text-white border-[#141414]'
                          : 'bg-white text-ink border-[#141414]/30'
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-ink text-xs font-black uppercase rounded-xl border-2 border-[#141414]"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleAddSentence}
                  className="flex-1 py-2 bg-amber-400 hover:bg-amber-300 text-ink text-xs font-black uppercase rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_#141414]"
                >
                  Lưu & Luyện Gõ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
