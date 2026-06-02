import React, { useState, useEffect, useRef } from 'react';
import type { VideoDictation, Word } from '../types';
import { cn, getAbsoluteUrl } from '../lib/utils';
import { Plus, Trash2, Edit2, Check, Video, ChevronLeft, ChevronRight, Type, Headphones, Download, Loader2, Mic, Library, PlayCircle, Star, MicOff, RotateCcw, Languages, Sparkles, BookOpen, Search, Volume2, X, Sparkle, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { YoutubeTranscript } from 'youtube-transcript';
import YouTube from 'react-youtube';
import { RECOMMENDED_VIDEOS } from '../constants/recommendedVideos';
import stringSimilarity from "string-similarity";

export function YouTubeDictation({ 
  dictations, 
  setDictations,
  words,
  setWords
}: { 
  dictations: VideoDictation[]; 
  setDictations: React.Dispatch<React.SetStateAction<VideoDictation[]>>;
  words?: Word[];
  setWords?: (w: Word[]) => void;
}) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [mode, setMode] = useState<'subtitles' | 'transcript' | 'practice' | 'shadowing'>('subtitles');
  const [userInput, setUserInput] = useState('');
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [transcriptError, setTranscriptError] = useState('');

  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0);
  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState<number>(-1);
  const [autoScrollSubtitles, setAutoScrollSubtitles] = useState<boolean>(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [lookedUpWord, setLookedUpWord] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [isSavedToWordbook, setIsSavedToWordbook] = useState<boolean>(false);
  const [translatingIndex, setTranslatingIndex] = useState<number | null>(null);
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);

  const [playerMode, setPlayerMode] = useState<'video' | 'audio'>('video');
  const [revealAll, setRevealAll] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSentenceList, setShowSentenceList] = useState(false);
  const [revealedWordIndices, setRevealedWordIndices] = useState<Set<number>>(new Set());

  const toggleRevealWord = (index: number) => {
    setRevealedWordIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const formatTime = (sec: number) => {
    if (isNaN(sec)) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const speakWord = (word: string) => {
    if (!word || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const translateTranscriptLine = async (index: number) => {
    if (!activeSession || !activeSession.transcriptItems) return;
    const items = [...activeSession.transcriptItems];
    const targetItem = items[index];
    if (!targetItem || targetItem.translation) return;

    setTranslatingIndex(index);
    try {
      const response = await fetch(getAbsoluteUrl("/api/translation/translate-line"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: targetItem.text }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.translation) {
          items[index] = { ...targetItem, translation: data.translation };
          updateSession(activeSession.id, "transcriptItems", items);
        }
      }
    } catch (err) {
      console.error("Failed to translate line:", err);
    } finally {
      setTranslatingIndex(null);
    }
  };

  const translateAllTranscriptLines = async () => {
    if (!activeSession || !activeSession.transcriptItems) return;
    const items = [...activeSession.transcriptItems];
    const untranslatedIndices = items
      .map((item, idx) => (item.translation ? -1 : idx))
      .filter((idx) => idx !== -1);

    if (untranslatedIndices.length === 0) {
      alert("Tất cả các dòng phụ đề đều đã có bản dịch!");
      return;
    }

    if (!confirm(`Bạn có muốn dịch tự động ${untranslatedIndices.length} dòng phụ đề còn lại bằng AI (mất một chút thời gian)?`)) {
      return;
    }

    setIsTranslatingAll(true);
    try {
      for (const idx of untranslatedIndices) {
        const item = items[idx];
        const response = await fetch(getAbsoluteUrl("/api/translation/translate-line"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: item.text }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.translation) {
            items[idx] = { ...item, translation: data.translation };
            updateSession(activeSession.id, "transcriptItems", [...items]);
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } catch (e) {
      console.error("Error translating all:", e);
    } finally {
      setIsTranslatingAll(false);
    }
  };

  const handleLookupWord = async (word: string) => {
    const cleaned = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").trim();
    if (!cleaned) return;
    setLookedUpWord(cleaned);
    setIsLookingUp(true);
    setLookupResult(null);
    setIsSavedToWordbook(false);
    
    try {
      const response = await fetch(getAbsoluteUrl("/api/translation/define-word"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: cleaned }),
      });
      if (response.ok) {
        const data = await response.json();
        setLookupResult(data);
        
        if (words) {
          const alreadyExists = words.some(w => w.vocabulary.toLowerCase() === cleaned.toLowerCase() || w.vocabulary.toLowerCase() === (data.vocabulary || "").toLowerCase());
          setIsSavedToWordbook(alreadyExists);
        }
      } else {
        setLookupResult({
          vocabulary: cleaned,
          wordType: "noun",
          ipa: "",
          definition: "Chưa tìm thấy nghĩa trực tuyến. Bạn có thể tự thêm.",
          example: "",
        });
      }
    } catch (err) {
      console.error("Error looking up word:", err);
      setLookupResult({
        vocabulary: cleaned,
        wordType: "noun",
        ipa: "",
        definition: "Lỗi kết nối từ điển.",
        example: "",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSaveToWordbook = () => {
    if (!lookupResult || !words || !setWords) return;
    
    const vocab = lookupResult.vocabulary || lookedUpWord || "";
    const exists = words.some(w => w.vocabulary.toLowerCase() === vocab.toLowerCase());
    if (exists) {
      setIsSavedToWordbook(true);
      return;
    }

    const newWord: Word = {
      id: crypto.randomUUID(),
      vocabulary: vocab,
      wordType: lookupResult.wordType || "noun",
      ipa: lookupResult.ipa || "",
      definition: lookupResult.definition || "",
      examples: lookupResult.example ? [lookupResult.example] : [],
      tags: ["YouTube Subtitles"],
      difficulty: 0,
      lastReviewed: new Date().toISOString(),
      nextReview: new Date().toISOString()
    };

    setWords([newWord, ...words]);
    setIsSavedToWordbook(true);
  };
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [dictationAutoPauseEnabled, setDictationAutoPauseEnabled] = useState(true);
  const [isDictationPausedByAuto, setIsDictationPausedByAuto] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [speechScore, setSpeechScore] = useState<number | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";
        let foundPeriod = false;
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const text = event.results[i][0].transcript;
          finalTranscript += text;
          if (text.includes(".")) {
             foundPeriod = true;
          }
        }
        
        if (finalTranscript) {
          const trimmed = finalTranscript.trim();
          if (mode === 'practice') {
            setUserInput(prev => {
              const p = prev.trim();
              if (p.toLowerCase().endsWith(trimmed.toLowerCase())) return p; // Prevent duplicates in interim results
              return p ? `${p} ${trimmed}` : trimmed;
            });
          } else if (mode === 'shadowing') {
            validateSpeech(trimmed);
          }
          
          if (foundPeriod) {
            try {
              recognitionRef.current.stop();
            } catch (e) {}
          }
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
      
      recognitionRef.current.onstart = () => {
        setIsRecording(true);
      };
    }
  }, [mode]);

  const [videoError, setVideoError] = useState('');

  const activeSession = dictations.find(d => d.id === activeSessionId);

  const playSentence = (index: number) => {
    if (!activeSession) return;
    const sentences = getSentences(activeSession.content);
    // Find offset from transcriptItems by matching text if possible, or just play video
    if (playerRef.current && activeSession.transcriptItems) {
       // rough match by finding the FIRST transcript item that contains part of the sentence
       // since sentences might span multiple items
       const targetSentence = sentences[index].toLowerCase();
       const targetItem = activeSession.transcriptItems.find(item => 
         targetSentence.includes(item.text.toLowerCase()) || 
         item.text.toLowerCase().includes(targetSentence.substring(0, 20))
       );
       
       if (targetItem) {
         playerRef.current.seekTo(targetItem.offset / 1000, true);
         playerRef.current.playVideo();
       } else {
         playerRef.current.playVideo();
       }
    } else if (playerRef.current) {
      playerRef.current.playVideo();
    }
  };

  const validateSpeech = (speech: string) => {
    if (!activeSession) return;
    const sentences = getSentences(activeSession.content);
    const target = sentences[activeSession.progress || 0];
    if (!target) return;

    const similarity = stringSimilarity.compareTwoStrings(
      normalizeString(target), 
      normalizeString(speech)
    );
    const score = Math.round(similarity * 100);
    setSpeechScore(score);
    
    if (score >= 70) {
      setTimeout(() => {
        const nextIndex = (activeSession.progress || 0) + 1;
        if (nextIndex < sentences.length) {
           updateSession(activeSession.id, 'progress', nextIndex);
           setSpeechScore(null);
           playSentence(nextIndex);
        }
      }, 1500);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
       alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Speech Recognition). Vui lòng dùng Chrome hoặc Edge.");
       return;
    }
    try {
       if (isRecording) {
         recognitionRef.current.stop();
       } else {
         recognitionRef.current.start();
       }
    } catch (err: any) {
       console.error("Speech Recognition Error:", err);
       // Handle "Recognition has already started" error
       if (err.message && err.message.includes('already started')) {
          setIsRecording(true);
       } else {
          setIsRecording(false);
          alert("Lỗi khi khởi động nhận diện giọng nói. Vui lòng thử lại.");
       }
    }
  };

  const extractYoutubeId = (url: string) => {
    if (!url) return null;
    try {
      const trimmed = url.trim();
      // Regex for all common YouTube URL formats
      const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/;
      const match = trimmed.match(regExp);
      if (match && match[1]) return match[1];

      // Handle raw 11-char ID
      if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

      // Fallback
      const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      return urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop()?.split('?')[0] || null;
    } catch (e) {
      const match = url.match(/[a-zA-Z0-9_-]{11}/);
      return match ? match[0] : null;
    }
  };

  const loadTranscript = async (videoId: string, sessionId: string) => {
    setIsLoadingTranscript(true);
    setTranscriptError('');
    try {
      const res = await fetch(getAbsoluteUrl(`/api/transcript?videoId=${videoId}`));
      const textResponse = await res.text();
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        if (textResponse.includes("<!DOCTYPE html>") || textResponse.toLowerCase().includes("page could not be found")) {
            throw new Error('Vercel backend missing. Please ensure /api is deployed or use Google Cloud Run.');
        }
        throw new Error('Invalid JSON from backend API');
      }
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch transcript');
      }

      if (data.transcript && Array.isArray(data.transcript)) {
        updateSession(sessionId, 'transcriptItems', data.transcript);
        
        const hasPunctuation = data.transcript.some((item: any) => /[.!?]/.test(item.text));
        let formattedText = "";
        
        if (hasPunctuation) {
          const fullText = data.transcript.map((item: any) => item.text).join(' ').replace(/\s+/g, ' ');
          formattedText = fullText
            .replace(/([.!?])([A-Z])/g, '$1 $2')
            .replace(/\s+/g, ' ')
            .trim();
        } else {
          // Fallback for auto-generated: group every 2-3 segments as a "sentence" to keep it manageable
          const segments = data.transcript;
          const grouped: string[] = [];
          for (let i = 0; i < segments.length; i += 3) {
            const group = segments.slice(i, i + 3).map((s: any) => s.text).join(' ');
            if (group) grouped.push(group.trim() + ".");
          }
          formattedText = grouped.join(' ');
        }
        
        updateSession(sessionId, 'content', formattedText);
        setMode('subtitles');
      } else {
         throw new Error("Transcript data is invalid");
      }
    } catch (err: any) {
      console.warn("Backend failed, attempting client-side fallback...", err.message);
      try {
        const pipedInstances = [
          "https://api.piped.projectsegfau.lt",
          "https://pipedapi.kavin.rocks",
          "https://pipedapi.moomoo.me"
        ];
        let foundTranscript = null;
        for (const instance of pipedInstances) {
           if (foundTranscript) break;
           try {
             const controller = new AbortController();
             const timeoutId = setTimeout(() => controller.abort(), 4000);
             const pRes = await fetch(`${instance}/streams/${videoId}`, { signal: controller.signal });
             clearTimeout(timeoutId);
             if (!pRes.ok) continue;
             const pData = await pRes.json() as any;
             if (pData && pData.subtitles && Array.isArray(pData.subtitles)) {
               let sub = pData.subtitles.find((s: any) => s.code === 'en' && !s.autoGenerated);
               if (!sub) sub = pData.subtitles.find((s: any) => s.code === 'en');
               if (!sub && pData.subtitles.length > 0) sub = pData.subtitles[0];
               if (sub && sub.url) {
                  const vttRes = await fetch(sub.url);
                  if (vttRes.ok) {
                     const vttText = await vttRes.text();
                     const parsed = [];
                     const vttLines = vttText.split('\n');
                     let currentOffset = 0;
                     let currentDuration = 0;
                     for (let i = 0; i < vttLines.length; i++) {
                       const line = vttLines[i].trim();
                       if (line.includes('-->')) {
                          const parts = line.split('-->');
                          const parseTime = (t: string) => {
                            const p = t.split(':');
                            if (p.length === 3) return (parseFloat(p[0]) * 3600 + parseFloat(p[1]) * 60 + parseFloat(p[2])) * 1000;
                            if (p.length === 2) return (parseFloat(p[0]) * 60 + parseFloat(p[1])) * 1000;
                            return 0;
                          };
                          currentOffset = parseTime(parts[0].trim());
                          currentDuration = parseTime(parts[1].trim()) - currentOffset;
                       } else if (line && !line.includes('WEBVTT') && !line.match(/^[\d]+$/)) {
                          if (currentOffset > 0) {
                             parsed.push({
                                text: line.replace(/<[^>]+>/g, ''),
                                offset: currentOffset,
                                duration: currentDuration > 0 ? currentDuration : 3000
                             });
                             currentOffset = 0;
                          }
                       }
                     }
                     if (parsed.length > 0) {
                       foundTranscript = parsed;
                     }
                  }
               }
             }
           } catch(e) {}
        }
        if (foundTranscript) {
          updateSession(sessionId, 'transcriptItems', foundTranscript);
          const joinedText = foundTranscript.map((t: any) => t.text).join(' ');
          updateSession(sessionId, 'content', joinedText);
        } else {
          setTranscriptError(err.message + " (Cả API và Client Fallback đều thất bại). Vui lòng gõ phụ đề và sử dụng dấu ';' để phân tách câu.");
        }
      } catch(fallbackErr) {
        setTranscriptError(err.message + ". Vui lòng gõ tên phụ đề và phân tách bằng dấu ';'.");
      }
    } finally {
      setIsLoadingTranscript(false);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const yId = extractYoutubeId(newUrl);
    if (!yId) {
      alert("Please enter a valid YouTube URL (e.g. youtube.com/watch?v=...)");
      return;
    }
    const newSession: VideoDictation = {
      id: crypto.randomUUID(),
      youtubeId: yId,
      title: "New Dictation",
      content: "",
      progress: 0,
      lastModified: Date.now()
    };
    setDictations([newSession, ...dictations]);
    setNewUrl('');
    setActiveSessionId(newSession.id);
    setMode('transcript'); // open transcript first for new video
    loadTranscript(yId, newSession.id);
  };

  const updateSession = (id: string, field: keyof VideoDictation, value: any) => {
    setDictations(prev => prev.map(d => {
      if (d.id === id) {
        let updated = { ...d, [field]: value, lastModified: Date.now() };
        
        // If content is modified, parse timestamps conditionally
        if (field === 'content') {
          const text = value || "";
          // Check if user input includes explicit timestamps like [0:00]
          const hasTimestamps = /\[\d+:\d+/.test(text) || /\[\d+\]/.test(text);

          if (hasTimestamps) {
            const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
            const timestampRegex = /^(?:\[)?(?:(\d+):)?(\d+)(?:\.(\d+))?(?:\])?[\s-:]*/;
            let lastOffset = 0;
            
            const parsedItems = lines.map((line: string) => {
              const match = line.match(timestampRegex);
              let offset = lastOffset;
              let textClean = line;
              
              if (match) {
                const minutes = match[1] ? parseInt(match[1], 10) : 0;
                const seconds = parseInt(match[2], 10);
                const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
                offset = ((minutes * 60) + seconds) * 1000 + ms;
                textClean = line.replace(timestampRegex, '').trim();
                lastOffset = offset + 5000;
              } else {
                offset = lastOffset;
                lastOffset += 5000;
              }
              return { text: textClean, offset, duration: 5000 };
            });
            
            for (let i = 0; i < parsedItems.length - 1; i++) {
              const diff = parsedItems[i+1].offset - parsedItems[i].offset;
              if (diff > 0) parsedItems[i].duration = diff;
            }
            updated.transcriptItems = parsedItems;
          }
        }
        
        return updated;
      }
      return d;
    }));
  };
  
  const removeSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm('Are you sure you want to delete this dictation session?')) {
      if (activeSessionId === id) setActiveSessionId(null);
      setDictations(prev => prev.filter(d => d.id !== id));
    }
  };

  const getSentences = (text: string) => {
    // Hệ thống cắt câu tự động theo dấu . ! ? hoặc ; 
    // Chỉ áp dụng ở phần YouTube Dictation và Translation. Các mục khác ngoài hai khu vực này không áp dụng để bảo mật mục đích nhập liệu của người học.
    const rawSentences = text.match(/[^.!?;\n]+[.!?;]*/g)?.map(s => s.trim()).filter(Boolean) || [];
    const timestampRegex = /^(?:\[)?(?:(\d+):)?(\d+)(?:\.(\d+))?(?:\])?[\s-:]*/;
    return rawSentences.map(s => s.replace(timestampRegex, '').trim()).filter(Boolean);
  };

  const normalizeString = (str: string) => {
    return str.toLowerCase().replace(/[.,!?;:()"'’\-]/g, '').replace(/\s+/g, ' ').trim();
  };

  const speakSentence = (text: string) => {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    const voices = window.speechSynthesis.getVoices();
    const enVoices = voices.filter((v) => v.lang.startsWith("en"));
    
    const preferredVoice = localStorage.getItem("preferredVoice");
    const preferredRate = localStorage.getItem("preferredRate");
    const preferredPitch = localStorage.getItem("preferredPitch");

    let voiceToUse = null;
    if (preferredVoice) {
      voiceToUse = enVoices.find((v) => v.name === preferredVoice);
    }

    if (!voiceToUse && enVoices.length > 0) {
      // Sort and prioritize high-quality natural/online/Google/Premium voices
      const sortedEn = [...enVoices].sort((a, b) => {
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
      voiceToUse = sortedEn[0];
    }

    if (voiceToUse) utterance.voice = voiceToUse;
    utterance.lang = 'en-US';
    utterance.rate = preferredRate ? parseFloat(preferredRate) : 0.9;
    utterance.pitch = preferredPitch ? parseFloat(preferredPitch) : 1.0;

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    let interval: any;
    if (activeSession && mode === 'practice' && isPlayerReady && activeSession.transcriptItems) {
      const sentences = getSentences(activeSession.content);
      const currentIndex = activeSession.progress || 0;
      
      if (currentIndex < sentences.length) {
         const sentence = sentences[currentIndex].toLowerCase();
         const transcriptItems = activeSession.transcriptItems;
         
         let startIndex = transcriptItems.findIndex(item => 
           sentence.includes(item.text.toLowerCase()) || 
           item.text.toLowerCase().includes(sentence.substring(0, 20))
         );
         
         if (startIndex !== -1) {
            let endIndex = startIndex;
            if (currentIndex + 1 < sentences.length) {
               const nextSentence = sentences[currentIndex+1].toLowerCase();
               let nextStartIndex = transcriptItems.findIndex((item, i) => 
                  i > startIndex && (
                     nextSentence.includes(item.text.toLowerCase()) || 
                     item.text.toLowerCase().includes(nextSentence.substring(0, 20))
                  )
               );
               if (nextStartIndex > startIndex) {
                  endIndex = nextStartIndex - 1;
               } else {
                  endIndex = startIndex; 
               }
            } else {
               endIndex = transcriptItems.length - 1;
            }
            
            const endItem = transcriptItems[endIndex];
            const endTimeOut = (endItem.offset + endItem.duration) / 1000 + 0.1; // 0.1s buffer

            interval = setInterval(async () => {
               if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                  try {
                    const t = await playerRef.current.getCurrentTime();
                    const state = await playerRef.current.getPlayerState();
                    // state 1 is playing
                    if (state === 1 && t >= endTimeOut) {
                       playerRef.current.pauseVideo();
                    }
                  } catch (e) {}
               }
            }, 200);
         }
      }
    }
    return () => clearInterval(interval);
  }, [activeSession?.progress, activeSession?.id, mode, activeSession?.transcriptItems, activeSession?.content, isPlayerReady]);

  // Time tracking effect for Subtitle highlighting and auto-pausing
  useEffect(() => {
    let interval: any;
    if (activeSession && mode === 'subtitles' && isPlayerReady) {
      interval = setInterval(async () => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          try {
            const time = await playerRef.current.getCurrentTime();
            setCurrentPlaybackTime(time);
            
            // Find which subtitle item is currently active
            if (activeSession.transcriptItems) {
              const activeIndex = activeSession.transcriptItems.findIndex((item) => {
                const start = item.offset / 1000;
                const end = (item.offset + item.duration) / 1000;
                return time >= start && time <= end;
              });
              
              if (activeIndex !== -1) {
                const oldIndex = activeSubtitleIndex;
                setActiveSubtitleIndex(activeIndex);
                
                // If dictationAutoPauseEnabled is active and we moved to a new sentence segment
                if (dictationAutoPauseEnabled && activeIndex > 0 && activeIndex > oldIndex && !isDictationPausedByAuto) {
                  playerRef.current.pauseVideo();
                  setIsDictationPausedByAuto(true);
                }
              } else {
                setIsDictationPausedByAuto(false);
              }
            }
          } catch (e) {}
        }
      }, 250);
    }
    return () => clearInterval(interval);
  }, [activeSession, mode, isPlayerReady, activeSubtitleIndex, dictationAutoPauseEnabled, isDictationPausedByAuto]);

  // Auto scroll effect to center the highlighted subtitle
  useEffect(() => {
    if (autoScrollSubtitles && activeSubtitleIndex !== -1 && scrollContainerRef.current) {
      try {
        const activeEl = scrollContainerRef.current.querySelector(`[data-subtitle-index="${activeSubtitleIndex}"]`);
        if (activeEl) {
          activeEl.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      } catch (err) {
        console.error("Auto scroll error:", err);
      }
    }
  }, [activeSubtitleIndex, autoScrollSubtitles]);

  useEffect(() => {
    setUserInput('');
    setRevealAll(false);
    setShowTranslation(false);
    setRevealedWordIndices(new Set());
  }, [activeSessionId, activeSession?.progress]);

  useEffect(() => {
    if (activeSession && mode === 'practice') {
      const sentences = getSentences(activeSession.content);
      const currentIndex = activeSession.progress || 0;
      if (currentIndex < sentences.length) {
        const currentSentence = sentences[currentIndex];
        if (normalizeString(userInput) === normalizeString(currentSentence)) {
          // Correct! Move to next
          setUserInput('');
          const nextIndex = currentIndex + 1;
          updateSession(activeSession.id, 'progress', nextIndex);
          
          if (nextIndex < sentences.length) {
             // Auto seek/play the next sentence
             if (playerRef.current && activeSession.transcriptItems) {
               const targetSentence = sentences[nextIndex].toLowerCase();
               const targetItem = activeSession.transcriptItems.find(item => 
                 targetSentence.includes(item.text.toLowerCase()) || 
                 item.text.toLowerCase().includes(targetSentence.substring(0, 20))
               );
               if (targetItem) {
                 playerRef.current.seekTo(targetItem.offset / 1000, true);
                 playerRef.current.playVideo();
               }
             }
           }
         }
       }
     }
  }, [userInput, activeSession, mode]);

  if (activeSession) {
    const sentences = getSentences(activeSession.content);
    const progressIndex = activeSession.progress || 0;
    const isCompleted = sentences.length > 0 && progressIndex >= sentences.length;

    const getCurrentTranslation = () => {
      if (!activeSession || !activeSession.transcriptItems) return "";
      const currentSentence = sentences[progressIndex];
      if (!currentSentence) return "";
      const cleanProgSentence = normalizeString(currentSentence);
      
      const matched = activeSession.transcriptItems.find(item => {
        const cleanItemText = normalizeString(item.text);
        return cleanProgSentence.includes(cleanItemText) || cleanItemText.includes(cleanProgSentence) || stringSimilarity.compareTwoStrings(cleanProgSentence, cleanItemText) > 0.6;
      });
      return matched?.translation || "";
    };
    const translation = getCurrentTranslation();

    const handlePlayPause = () => {
      if (!playerRef.current) return;
      try {
        const state = playerRef.current.getPlayerState();
        if (state === 1) {
          playerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          playerRef.current.playVideo();
          setIsPlaying(true);
        }
      } catch (e) {
        if (isPlaying) {
          playerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          playerRef.current.playVideo();
          setIsPlaying(true);
        }
      }
    };

    const handleReplaySentence = () => {
      if (!activeSession) return;
      playSentence(progressIndex);
    };

    const changeSpeed = (rate: number) => {
      setPlaybackSpeed(rate);
      if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
        try {
          playerRef.current.setPlaybackRate(rate);
        } catch (err) {}
      }
    };

    if (mode === 'practice') {
      return (
        <div className="max-w-7xl mx-auto p-1.5 md:p-3 font-sans h-[calc(100dvh-220px)] md:h-[calc(100vh-180px)] flex flex-col overflow-hidden bg-[#070708] mt-2 mb-2 rounded-[28px] border border-neutral-900 shadow-2xl">
          <div className="flex justify-between items-center mb-3 shrink-0 px-2 lg:px-0 gap-2">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setActiveSessionId(null)}
                className="flex items-center gap-0.5 text-neutral-400 hover:text-white transition-colors font-bold text-[9px] uppercase tracking-widest shrink-0 cursor-pointer"
              >
                <ChevronLeft size={14} /> Quay lại
              </button>
            </div>
            
            <div className="flex-1 max-w-xs mx-1">
               <input 
                 type="text" 
                 value={activeSession.title}
                 onChange={(e) => updateSession(activeSession.id, 'title', e.target.value)}
                 className="w-full bg-transparent border-b border-dashed border-neutral-800 text-neutral-400 focus:border-neutral-700 outline-none text-xs font-bold text-center py-0.5 transition-colors"
                 placeholder="Tiêu đề..."
               />
            </div>
            
            <div className="flex gap-1 shrink-0">
              <button 
                onClick={() => setMode('subtitles')}
                className="p-1.5 text-[9px] font-bold uppercase tracking-widest rounded transition-colors flex items-center gap-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800 cursor-pointer"
              >
                <Languages size={10} /> <span className="hidden xs:inline">Subtitles</span>
              </button>
              <button 
                onClick={() => setMode('transcript')}
                className="p-1.5 text-[9px] font-bold uppercase tracking-widest rounded transition-colors flex items-center gap-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800 cursor-pointer"
              >
                <Type size={10} /> <span className="hidden xs:inline">Transcript</span>
              </button>
              <button 
                onClick={() => setMode('practice')}
                className="p-1.5 text-[9px] font-bold uppercase tracking-widest rounded transition-colors flex items-center gap-1 bg-white text-black font-extrabold cursor-pointer"
              >
                <Headphones size={10} /> <span className="hidden xs:inline">Practice</span>
              </button>
              <button 
                onClick={() => setMode('shadowing')}
                className="p-1.5 text-[9px] font-bold uppercase tracking-widest rounded transition-colors flex items-center gap-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800 cursor-pointer"
              >
                <Video size={10} /> <span className="hidden xs:inline">Shadowing</span>
              </button>
            </div>
          </div>

          <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col min-h-0 bg-[#0d0d0f] text-neutral-200 p-3 md:p-6 rounded-[24px] border border-neutral-800/80 shadow-2xl relative overflow-hidden font-sans">
            {sentences.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                <Type size={32} className="mb-2 opacity-50 text-amber-500" />
                <p className="mb-2 text-sm font-semibold">Chưa có Transcript cho bài học này.</p>
                <button onClick={() => setMode('transcript')} className="px-4 py-2 bg-neutral-800 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-neutral-700 cursor-pointer">Thêm Transcript</button>
              </div>
            ) : isCompleted ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 animate-in zoom-in-95 duration-500 space-y-4">
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-2 border border-emerald-500/30 shadow-lg">
                  <Check size={40} />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-white animate-pulse">Hoàn thành bài tập!</h3>
                <p className="text-sm text-neutral-400 max-w-sm font-medium leading-relaxed">Tuyệt vời! Bạn đã nghe và viết chính xác tất cả {sentences.length} câu của bài học.</p>
                <div className="flex gap-4 pt-4 justify-center">
                  <button onClick={() => updateSession(activeSession.id, 'progress', 0)} className="px-6 py-2.5 bg-white text-black font-extrabold uppercase text-xs tracking-wider rounded-xl hover:bg-neutral-100 transition-all shadow-md cursor-pointer">Luyện lại</button>
                  <button onClick={() => setActiveSessionId(null)} className="px-6 py-2.5 bg-neutral-800 text-white font-extrabold uppercase text-xs tracking-wider rounded-xl hover:bg-neutral-700 transition-all border border-neutral-700 cursor-pointer">Bài khác</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full flex-1 justify-between min-h-0 gap-3">
                <div className="flex justify-between items-center mb-1 shrink-0 gap-2">
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setMode('subtitles')}
                      className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-inner"
                      title="Quay lại"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    <div className="bg-neutral-900 border border-neutral-850 px-3 py-1.5 rounded-full text-[11px] font-bold text-neutral-300 tracking-wide font-mono flex items-center justify-center gap-1.5 shadow-md">
                      #{progressIndex + 1} <span className="opacity-30">•</span> {progressIndex}/{sentences.length}
                    </div>
                  </div>

                  <div className="flex bg-[#161619] border border-neutral-800/80 p-0.5 rounded-full shadow-inner">
                    <button 
                      type="button"
                      onClick={() => setPlayerMode('video')}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer",
                        playerMode === 'video' 
                          ? "bg-white text-black shadow-md font-black" 
                          : "text-neutral-400 hover:text-white"
                      )}
                    >
                      <Video size={11} className={playerMode === 'video' ? "text-black fill-current" : "text-neutral-400"} />
                      <span>Video</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setPlayerMode('audio')}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer",
                        playerMode === 'audio' 
                          ? "bg-white text-black shadow-md font-black" 
                          : "text-neutral-400 hover:text-white"
                      )}
                    >
                      <Headphones size={11} className={playerMode === 'audio' ? "text-black" : "text-neutral-400"} />
                      <span>Audio</span>
                    </button>
                  </div>

                  <button 
                    type="button"
                    onClick={() => setShowSentenceList(!showSentenceList)}
                    className={cn(
                      "w-8 h-8 rounded-full bg-neutral-900 border text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer",
                      showSentenceList ? "border-amber-500/50 text-amber-400 bg-amber-500/10" : "border-neutral-800 hover:border-neutral-700"
                    )}
                    title="Mở danh sách câu"
                  >
                    <Library size={13} />
                  </button>
                </div>

                <div className="relative shrink-0 w-full mb-1">
                  {playerMode === 'video' ? (
                    <div className="w-full aspect-[1.58] sm:aspect-video bg-black relative shadow-2xl overflow-hidden rounded-[24px] border border-neutral-800/80 shrink-0">
                      <YouTube 
                        videoId={activeSession.youtubeId} 
                        onReady={(e) => {
                          playerRef.current = e.target;
                          setIsPlayerReady(true);
                          setVideoError('');
                          try {
                            e.target.setPlaybackRate(playbackSpeed);
                          } catch (err) {}
                        }}
                        onStateChange={(e) => {
                          setIsPlaying(e.data === 1);
                        }}
                        onError={() => {
                          setVideoError("Lỗi kết nối hoặc nhúng video.");
                        }}
                        opts={{ 
                          width: '100%', 
                          height: '100%', 
                          playerVars: { 
                            autoplay: 1, 
                            rel: 0, 
                            modestbranding: 1, 
                            playsinline: 1,
                            origin: window.location.origin,
                            controls: 0,
                            showinfo: 0,
                          } 
                        }}
                        className="w-full h-full" 
                      />
                      {videoError && (
                        <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center p-3 text-center z-20">
                          <Video size={24} className="text-red-500 mb-1.5" />
                          <p className="text-white text-xs font-bold mb-3">{videoError}</p>
                          <button onClick={() => { setVideoError(''); }} className="text-xs uppercase font-bold text-white/60 hover:text-white underline cursor-pointer">Thử lại</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full aspect-[1.58] sm:aspect-video rounded-[24px] bg-[#111113] border border-neutral-800/80 flex items-center justify-center p-4 relative overflow-hidden shadow-2xl shrink-0">
                      <div className="absolute w-[1px] h-[1px] -left-[9999px] opacity-0 pointer-events-none">
                        <YouTube 
                          videoId={activeSession.youtubeId}
                          onReady={(e) => {
                            playerRef.current = e.target;
                            setIsPlayerReady(true);
                            try {
                              e.target.setPlaybackRate(playbackSpeed);
                            } catch (err) {}
                          }}
                          onStateChange={(e) => {
                            setIsPlaying(e.data === 1);
                          }}
                          opts={{
                            width: '1',
                            height: '1',
                            playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 }
                          }}
                        />
                      </div>

                      <div className="flex flex-col items-center justify-center text-center space-y-3">
                        <div className="relative">
                          <div className={cn(
                            "w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-neutral-950 via-neutral-900 to-neutral-950 border-[3px] border-neutral-850 flex items-center justify-center shadow-2xl relative transition-transform duration-500",
                            isPlaying ? "animate-[spin_10s_linear_infinite]" : ""
                          )}>
                            <div className="absolute inset-1.5 rounded-full border border-neutral-800/20" />
                            <div className="absolute inset-3 rounded-full border border-neutral-800/20" />
                            <div className="absolute inset-6 rounded-full border border-neutral-850" />
                            
                            <div className="w-9 h-9 bg-amber-500 rounded-full border-2 border-neutral-950 flex items-center justify-center shadow-inner relative">
                              <Headphones size={12} className="text-neutral-950" />
                            </div>
                          </div>
                          
                          <div className={cn(
                            "absolute right-[-8px] top-[-6px] w-10 h-16 origin-top-right transition-transform duration-700 pointer-events-none",
                            isPlaying ? "rotate-[10deg]" : "rotate-0"
                          )}>
                            <div className="h-12 w-[2px] bg-neutral-600/70 shadow ml-5 rounded-full" />
                            <div className="h-2 w-2.5 bg-neutral-500 ml-4.5" />
                          </div>
                        </div>

                        <div className="flex flex-col items-center space-y-0.5">
                          <p className="text-[10px] font-mono font-bold text-amber-500 tracking-widest animate-pulse">
                            {isPlaying ? "🎙️ ĐANG PHÁT ÂM THANH" : "⏸️ ĐANG TẠM DỪNG"}
                          </p>
                          <div className="flex items-end gap-0.5 h-4 pt-1">
                            {Array.from({ length: 12 }).map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "w-[2px] bg-neutral-800 rounded-full transition-all duration-300",
                                  isPlaying ? "bg-amber-500/80" : ""
                                )}
                                style={{
                                  height: isPlaying ? `${Math.floor(Math.random() * 12) + 3}px` : '3px',
                                  animationDelay: `${i * 60}ms`
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative w-full shrink-0">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.preventDefault();
                      else if (e.code === 'Space' && e.ctrlKey) {
                        e.preventDefault();
                        handlePlayPause();
                      }
                    }}
                    placeholder="Nhập câu ở đây..."
                    className="w-full bg-[#141416] text-white placeholder-neutral-600 outline-none text-sm md:text-base py-3.5 px-5 rounded-2xl border border-neutral-850 focus:border-neutral-700 focus:ring-1 focus:ring-neutral-800 transition-all font-sans text-left"
                    spellCheck={false}
                    autoComplete="off"
                    autoFocus
                  />
                  {userInput && (
                    <button
                      onClick={() => setUserInput('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <div className="flex justify-between items-center text-[11px] font-bold text-neutral-400 select-none px-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowTranslation(!showTranslation)}
                    className={cn(
                      "flex items-center gap-1 cursor-pointer transition-colors hover:text-white",
                      showTranslation ? "text-amber-500 hover:text-amber-400" : ""
                    )}
                  >
                    <Languages size={12} />
                    <span>👁 Chạm để hiện nghĩa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevealAll(!revealAll)}
                    className={cn(
                      "flex items-center gap-1 cursor-pointer transition-colors hover:text-white",
                      revealAll ? "text-amber-500 hover:text-amber-400" : ""
                    )}
                  >
                    <Sparkles size={11} />
                    <span>👁 {revealAll ? "Che và ẩn đáp án" : "Hiện tất cả"}</span>
                  </button>
                </div>

                {showTranslation && (
                  <div className="px-4 py-2.5 rounded-xl bg-neutral-900/50 border border-neutral-850 text-xs md:text-sm text-neutral-300 text-center animate-in fade-in leading-relaxed select-none shrink-0 font-sans text-left">
                    {translation || "Chưa có bản dịch cho dòng này. Bạn có thể dịch tự động ở tab Subtitles."}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto min-h-[60px] flex flex-wrap justify-center items-center content-center gap-1.5 md:gap-2 px-1 py-1 custom-scrollbar">
                  {sentences[progressIndex].split(/\s+/).filter(Boolean).map((word, wIdx) => {
                    const cleanTarget = normalizeString(word);
                    const userWords = userInput.trim().split(/\s+/).filter(Boolean);
                    const cleanUser = userWords[wIdx] ? normalizeString(userWords[wIdx]) : undefined;
                    
                    const isWordCorrect = cleanUser === cleanTarget;
                    const isRevealed = revealAll || revealedWordIndices.has(wIdx) || isWordCorrect;
                    
                    const displayWord = isRevealed ? word : word.replace(/[a-zA-Z0-9À-ỹ]/g, '•');
                    
                    return (
                      <button
                        key={wIdx}
                        type="button"
                        onClick={() => {
                          speakWord(cleanTarget);
                          toggleRevealWord(wIdx);
                        }}
                        className={cn(
                          "px-3.5 py-2 font-mono rounded-xl border text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center justify-center relative touch-manipulation hover:scale-[1.02] active:scale-95 shadow-md",
                          isWordCorrect
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 animate-in zoom-in-95"
                            : isRevealed
                              ? "bg-neutral-800 border-neutral-700 text-neutral-200"
                              : "bg-[#141416]/90 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                        )}
                        title="Bấm để phát âm"
                      >
                        {displayWord}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center py-2 px-1 border-t border-neutral-900 mt-2 gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const p = Math.max(0, progressIndex - 1);
                      updateSession(activeSession.id, 'progress', p);
                      playSentence(p);
                    }}
                    disabled={progressIndex === 0}
                    className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-850 text-neutral-400 hover:text-white hover:border-neutral-700 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer shadow-md"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={handleReplaySentence}
                    className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-850 text-neutral-400 hover:text-white hover:border-neutral-700 flex items-center justify-center transition-all cursor-pointer shadow-md"
                    title="Nghe lại câu này (Ctrl+Space)"
                  >
                    <RotateCcw size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={handlePlayPause}
                    className="w-12 h-12 rounded-full bg-white text-black hover:bg-neutral-100 flex items-center justify-center shadow-lg transform hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    {isPlaying ? (
                      <svg className="w-5 h-5 text-black animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-black pl-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  <div className="flex bg-neutral-900/90 border border-neutral-800 p-0.5 rounded-full ring-1 ring-neutral-950 text-[10px] items-center font-mono shadow-md">
                    {([0.75, 1, 1.25]).map((rate) => {
                      const isSelected = playbackSpeed === rate;
                      return (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => changeSpeed(rate)}
                          className={cn(
                            "px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer",
                            isSelected 
                              ? "bg-white text-black font-black" 
                              : "text-neutral-400 hover:text-white"
                          )}
                        >
                          {rate}x
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const p = Math.min(sentences.length - 1, progressIndex + 1);
                      updateSession(activeSession.id, 'progress', p);
                      playSentence(p);
                    }}
                    disabled={progressIndex === sentences.length - 1}
                    className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-850 text-neutral-400 hover:text-white hover:border-neutral-700 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer shadow-md"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {showSentenceList && (
              <div className="absolute inset-y-0 right-0 w-80 bg-[#121215] border-l border-neutral-800 text-white z-50 p-4 flex flex-col shadow-2xl animate-in slide-in-from-right duration-350">
                <div className="flex justify-between items-center pb-3 border-b border-neutral-800 mb-3">
                  <h3 className="font-extrabold text-xs uppercase tracking-widest text-[#a8a8af]">Danh sách câu ({sentences.length})</h3>
                  <button onClick={() => setShowSentenceList(false)} className="p-1 rounded bg-[#1c1c20] hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer transition-colors shadow">
                    <X size={15} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {sentences.map((sentence, idx) => {
                    const isCurrent = idx === progressIndex;
                    const isCompleted = idx < progressIndex;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          updateSession(activeSession.id, 'progress', idx);
                          playSentence(idx);
                          setShowSentenceList(false);
                        }}
                        className={cn(
                          "w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start gap-2 border cursor-pointer",
                          isCurrent 
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-300 font-bold" 
                            : isCompleted 
                              ? "bg-emerald-500/5 border-emerald-500/15 text-emerald-400 font-semibold" 
                              : "bg-transparent border-transparent text-neutral-400 hover:bg-neutral-950"
                        )}
                      >
                        <span className="font-mono text-[10px] opacity-50 mt-0.5 text-neutral-500">#{idx + 1}</span>
                        <span className="flex-1 line-clamp-2 leading-tight text-neutral-300">{sentence}</span>
                        {isCompleted && <span className="text-[10px] text-emerald-400 shrink-0 font-bold self-center">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto p-1.5 md:p-3 font-sans h-[calc(100dvh-220px)] md:h-[calc(100vh-180px)] flex flex-col overflow-hidden bg-white/50 sketch-border-sm mt-2 mb-2">
        <div className="flex justify-between items-center mb-2 shrink-0 px-2 lg:px-0 gap-2">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setActiveSessionId(null)}
              className="flex items-center gap-0.5 text-ink/60 hover:text-ink transition-colors font-bold text-[9px] uppercase tracking-widest shrink-0"
            >
              <ChevronLeft size={14} /> Quay lại
            </button>
            <div className="w-[1px] h-3 bg-ink/10 mx-1 hidden xs:block" />
            <button 
              onClick={() => { if (confirm("Bạn có muốn làm lại từ đầu?")) { updateSession(activeSession.id, 'progress', 0); setUserInput(''); } }}
              className="flex items-center gap-1 text-ink/60 hover:text-crimson transition-colors font-bold text-[9px] uppercase tracking-widest shrink-0"
            >
              <RotateCcw size={12} /> <span className="hidden sm:inline">Làm lại</span>
            </button>
          </div>
          
          <div className="flex-1 max-w-sm mx-1">
             <input 
               type="text" 
               value={activeSession.title}
               onChange={(e) => updateSession(activeSession.id, 'title', e.target.value)}
               className="w-full bg-transparent border-b border-dashed border-ink/20 focus:border-ink/60 outline-none text-xs md:text-lg font-bold font-logo text-center py-0.5 transition-colors"
               placeholder="Tiêu đề..."
             />
          </div>
          
          <div className="flex gap-1 shrink-0">
            <button 
              onClick={() => {
                if (!activeSession.content) { alert("Vui lòng nhập transcript trước."); return; }
                setMode('subtitles');
              }}
              className={cn("p-1.5 text-[9px] font-bold uppercase tracking-widest rounded transition-colors flex items-center gap-1", 
                mode === 'subtitles' ? "bg-ink text-paper" : "bg-ink/5 text-ink/60 hover:bg-ink/10"
              )}
            >
              <Languages size={10} /> <span className="hidden xs:inline">Subtitles</span>
            </button>
            <button 
              onClick={() => setMode('transcript')}
              className={cn("p-1.5 text-[9px] font-bold uppercase tracking-widest rounded transition-colors flex items-center gap-1", 
                mode === 'transcript' ? "bg-ink text-paper" : "bg-ink/5 text-ink/60 hover:bg-ink/10"
              )}
            >
              <Type size={10} /> <span className="hidden xs:inline">Transcript</span>
            </button>
            <button 
              onClick={() => {
                if (!activeSession.content) { alert("Vui lòng nhập transcript trước."); return; }
                setMode('practice');
                if (playerRef.current) playerRef.current.pauseVideo();
              }}
              className={cn("p-1.5 text-[9px] font-bold uppercase tracking-widest rounded transition-colors flex items-center gap-1", 
                mode === 'practice' ? "bg-ink text-paper" : "bg-ink/5 text-ink/60 hover:bg-ink/10"
              )}
            >
              <Headphones size={10} /> <span className="hidden xs:inline">Practice</span>
            </button>
            <button 
              onClick={() => {
                if (!activeSession.content) { alert("Vui lòng nhập transcript trước."); return; }
                setMode('shadowing');
              }}
              className={cn("p-1.5 text-[9px] font-bold uppercase tracking-widest rounded transition-colors flex items-center gap-1", 
                mode === 'shadowing' ? "bg-ink text-paper" : "bg-ink/5 text-ink/60 hover:bg-ink/10"
              )}
            >
              <Video size={10} /> <span className="hidden xs:inline">Shadowing</span>
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 flex-1 min-h-0 overflow-hidden mb-1">
          <div className="w-full md:w-5/12 flex flex-col gap-2 shrink-0 h-auto md:h-full min-h-0 overflow-y-auto custom-scrollbar md:pr-1">
            <div className="w-full aspect-video sketch-border p-1 bg-black relative shadow-lg shrink-0 overflow-hidden rounded-lg">
              <YouTube 
                videoId={activeSession.youtubeId} 
                onReady={(e) => {
                  playerRef.current = e.target;
                  setIsPlayerReady(true);
                  setVideoError('');
                }}
                onPlay={() => {
                   if (mode === 'practice' && isPlayerReady) {
                      // Optionally seek if user is lost
                   }
                }}
                onError={(e) => {
                  const errorData = e.data;
                  let msg = "Lỗi video.";
                  if (errorData === 101 || errorData === 150) msg = "Video này không cho phép nhúng trên trang web khác.";
                  else if (errorData === 100) msg = "Video đã bị xóa hoặc đặt chế độ riêng tư.";
                  else if (errorData === 2) msg = "Tham số video không hợp lệ.";
                  setVideoError(msg);
                }}
                opts={{ 
                  width: '100%', 
                  height: '100%', 
                  playerVars: { 
                    autoplay: 1, 
                    rel: 0, 
                    modestbranding: 1, 
                    playsinline: 1,
                    origin: window.location.origin
                  } 
                }}
                className="w-full h-full" 
              />
              {videoError && (
                 <div className="absolute inset-0 bg-ink/90 flex flex-col items-center justify-center p-3 text-center z-20">
                    <Video size={24} className="text-crimson mb-1.5" />
                    <p className="text-white text-[10px] font-bold mb-3">{videoError}</p>
                    <button onClick={() => { setVideoError(''); setActiveSessionId(null); }} className="text-[9px] uppercase font-bold text-white/60 hover:text-white underline">Chọn video khác</button>
                 </div>
              )}
            </div>
            
            <div className="bg-ink/3 p-2 rounded text-[10px] text-ink/60 sketch-border border-dashed shrink-0 hidden sm:block">
              <p className="font-bold uppercase tracking-widest mb-1 text-ink/80 text-[8px]">Lưu ý:</p>
              <ul className="space-y-0.5 ml-3 list-disc marker:text-crimson">
                <li><span className="font-semibold">Phím tắt</span>: Ctrl+Space để Dừng/Phát.</li>
                <li><span className="font-semibold">Tự động</span>: Video sẽ tự dừng sau mỗi câu nếu có transcript.</li>
              </ul>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col min-h-0 bg-white sketch-border shadow-md relative overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {mode === 'subtitles' ? (
                <div className="flex-1 flex h-full min-h-0 overflow-hidden font-sans">
                  <div className="flex-1 flex flex-col p-2 md:p-4 min-h-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 shrink-0">
                      <div className="flex items-center gap-2 flex-1 max-w-sm">
                        <div className="relative w-full">
                          <span className="absolute inset-y-0 left-2.5 flex items-center text-ink/40">
                            <Search size={12} />
                          </span>
                          <input
                            type="text"
                            value={subSearchQuery}
                            onChange={(e) => setSubSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm trong phụ đề..."
                            className="w-full pl-8 pr-2.5 py-1 text-xs bg-ink/3 hover:bg-ink/5 focus:bg-white border border-ink/10 rounded outline-none focus:ring-1 focus:ring-ink/20 transition-all font-sans animate-in fade-in"
                          />
                          {subSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setSubSearchQuery("")}
                              className="absolute inset-y-0 right-2 flex items-center text-ink/40 hover:text-ink/80"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                        <label className="flex items-center gap-1.5 text-[10px] text-ink/50 cursor-pointer font-bold select-none hover:text-ink">
                          <input
                            type="checkbox"
                            checked={autoScrollSubtitles}
                            onChange={(e) => setAutoScrollSubtitles(e.target.checked)}
                            className="rounded text-crimson focus:ring-crimson"
                          />
                          Cuộn tự động
                        </label>

                        {activeSession.transcriptItems && activeSession.transcriptItems.length > 0 && (
                          <button
                            type="button"
                            onClick={translateAllTranscriptLines}
                            disabled={isTranslatingAll}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded transition-all cursor-pointer border",
                              isTranslatingAll
                                ? "bg-rose-50 border-rose-200 text-rose-600 animate-pulse font-bold"
                                : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                            )}
                          >
                            <Sparkles size={11} className={cn(isTranslatingAll ? "animate-spin" : "")} />
                            {isTranslatingAll ? "Đang dịch..." : "Dịch tất cả (AI)"}
                          </button>
                        )}
                      </div>
                    </div>

                    {!activeSession.transcriptItems || activeSession.transcriptItems.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-ink/65">
                        <Languages size={32} className="mb-2 opacity-50 text-crimson" />
                        <p className="text-xs font-semibold mb-2">Chưa có dữ liệu phụ đề hoặc dòng thời gian!</p>
                        <p className="text-[10px] text-ink/50 mb-4 max-w-xs">
                          Phụ đề chưa được lấy tự động hoặc chưa có mốc thời gian. Bạn hãy bấm vào chế độ <strong>Transcript</strong> để bổ sung hoặc tự động tìm kiếm.
                        </p>
                        <button onClick={() => setMode('transcript')} className="sketch-button py-1.5 px-4 text-[9px]">Lấy phụ đề ngay</button>
                      </div>
                    ) : (
                      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
                        {activeSession.transcriptItems
                          .map((item, idx) => ({ ...item, originalIndex: idx }))
                          .filter((item) => {
                            if (!subSearchQuery.trim()) return true;
                            return (
                              item.text.toLowerCase().includes(subSearchQuery.toLowerCase()) ||
                              (item.translation && item.translation.toLowerCase().includes(subSearchQuery.toLowerCase()))
                            );
                          })
                          .map((item) => {
                            const isActive = activeSubtitleIndex === item.originalIndex;
                            return (
                              <div
                                key={item.originalIndex}
                                data-subtitle-index={item.originalIndex}
                                onClick={() => {
                                  if (playerRef.current) {
                                    playerRef.current.seekTo(item.offset / 1000, true);
                                    playerRef.current.playVideo();
                                  }
                                }}
                                className={cn(
                                  "group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer text-left relative",
                                  isActive
                                    ? "bg-amber-50/70 border-amber-400/80 shadow-md ring-1 ring-amber-400/30"
                                    : "bg-paper/30 hover:bg-ink/[0.02] border-ink/5 hover:border-ink/10"
                                )}
                              >
                                {isActive && (
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-lg animate-pulse" />
                                )}

                                <span className={cn(
                                  "font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 self-start mt-0.5 shadow-sm",
                                  isActive
                                    ? "bg-amber-500 text-white"
                                    : "bg-ink/5 text-ink/50 group-hover:bg-ink/10 group-hover:text-ink/80 transition-colors"
                                )}>
                                  {formatTime(item.offset / 1000)}
                                </span>

                                <div className="flex-1 space-y-1 min-w-0">
                                  <div className="text-sm font-sans font-bold leading-relaxed text-ink/90 flex flex-wrap gap-x-1 gap-y-0.5">
                                    {item.text.trim().split(/\s+/).map((word, wIdx) => {
                                      const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").trim();
                                      const isLookedUp = lookedUpWord?.toLowerCase() === cleanWord.toLowerCase();
                                      return (
                                        <span
                                          key={wIdx}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (cleanWord) {
                                              handleLookupWord(cleanWord);
                                            }
                                          }}
                                          className={cn(
                                            "inline hover:bg-amber-200/90 hover:text-ink border-b-2 border-dashed border-transparent hover:border-amber-600 rounded px-0.5 transition-all text-sm font-extrabold cursor-pointer",
                                            isLookedUp ? "bg-amber-200/90 text-ink border-amber-600 font-extrabold scale-102" : ""
                                          )}
                                          title="Bấm để tra từ điển"
                                        >
                                          {word}{" "}
                                        </span>
                                      );
                                    })}
                                  </div>

                                  {item.translation ? (
                                    <p className="text-xs font-semibold text-ink/65 border-t border-dashed border-ink/5 pt-1.5 mt-1 leading-relaxed">
                                      {item.translation}
                                    </p>
                                  ) : (
                                    <div className="flex items-center gap-1.5 pt-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          translateTranscriptLine(item.originalIndex);
                                        }}
                                        disabled={translatingIndex === item.originalIndex}
                                        className="text-[9px] font-bold text-ink/40 hover:text-emerald-700 bg-black/[0.03] hover:bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                                      >
                                        {translatingIndex === item.originalIndex ? (
                                          <Loader2 size={8} className="animate-spin text-emerald-600" />
                                        ) : (
                                          <Sparkle size={8} className="text-indigo-500 fill-indigo-500" />
                                        )}
                                        {translatingIndex === item.originalIndex ? "Đang dịch..." : "Dịch dòng này"}
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (playerRef.current) {
                                        playerRef.current.seekTo(item.offset / 1000, true);
                                        playerRef.current.playVideo();
                                      }
                                    }}
                                    className="p-1.5 bg-ink/5 hover:bg-ink text-ink/70 hover:text-white rounded-full transition-all"
                                    title="Nghe lại câu này"
                                  >
                                    <PlayCircle size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {lookedUpWord && (
                    <div className="w-80 border-l border-ink/10 bg-paper/95 p-4 flex flex-col min-h-0 animate-in slide-in-from-right duration-300 shadow-lg relative shrink-0">
                      <div className="flex items-center justify-between pb-2 border-b border-ink/10">
                        <div className="flex items-center gap-1 text-crimson font-black text-xs uppercase tracking-widest font-logo">
                          <BookOpen size={14} />
                          Từ điển AI
                        </div>
                        <button
                          type="button"
                          onClick={() => setLookedUpWord(null)}
                          className="p-1 text-ink/40 hover:text-ink hover:bg-ink/5 rounded transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {isLookingUp ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-ink/50 space-y-3">
                          <Loader2 size={24} className="animate-spin text-amber-500" />
                          <p className="text-xs font-semibold font-sans">Đang tra từ <span className="font-bold text-ink">"{lookedUpWord}"</span>...</p>
                        </div>
                      ) : lookupResult ? (
                        <div className="flex-1 flex flex-col min-h-0 justify-between py-2">
                          <div className="space-y-4 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                            <div>
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <h4 className="text-md font-black tracking-tight text-ink first-letter:uppercase">{lookupResult.vocabulary || lookedUpWord}</h4>
                                <button
                                  type="button"
                                  onClick={() => speakWord(lookupResult.vocabulary || lookedUpWord)}
                                  className="p-1.5 bg-ink/5 hover:bg-ink text-ink/60 hover:text-paper rounded-full transition-all"
                                  title="Nghe phát âm"
                                >
                                  <Volume2 size={13} />
                                </button>
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {lookupResult.ipa && (
                                  <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-bold">
                                    {lookupResult.ipa}
                                  </span>
                                )}
                                {lookupResult.wordType && (
                                  <span className="text-[8px] font-extrabold uppercase tracking-widest text-[#900] bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5">
                                    {lookupResult.wordType}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase text-ink/40 tracking-wider">ĐỊNH NGHĨA</span>
                              <p className="text-xs font-sans font-semibold text-ink bg-amber-50/20 p-2.5 rounded border border-amber-200/50 leading-relaxed whitespace-pre-wrap">
                                {lookupResult.definition || "Chưa có định nghĩa tiếng Việt."}
                              </p>
                            </div>

                            {lookupResult.example && (
                              <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase text-ink/40 tracking-wider">VÍ DỤ</span>
                                <div className="bg-ink/[0.02] p-2.5 rounded border border-dashed border-ink/10 space-y-1.5 text-xs text-left">
                                  <p className="font-bold text-ink italic leading-relaxed">
                                    "{lookupResult.example}"
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="pt-3 border-t border-ink/10 mt-2 shrink-0">
                            {isSavedToWordbook ? (
                              <div className="w-full text-center py-2 bg-green-50 text-green-700 font-extrabold rounded-lg border border-green-200 text-xs flex items-center justify-center gap-1">
                                <Check size={14} />
                                Đã lưu vào sổ từ
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={handleSaveToWordbook}
                                className="w-full py-2 bg-ink text-paper hover:bg-slate-800 transition-colors text-xs font-black uppercase tracking-widest rounded flex items-center justify-center gap-1.5 shadow"
                              >
                                <BookOpen size={13} />
                                Thêm vào sổ từ
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-center p-4 text-xs text-ink/40 italic">
                          Không tìm thấy nghĩa của từ.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : mode === 'transcript' ? (
                <div className="flex-1 flex flex-col p-2 md:p-4 min-h-0">
                  <div className="flex justify-between items-center mb-2 shrink-0">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-ink/40">Transcript Editor</h3>
                    <button 
                      onClick={() => loadTranscript(activeSession.youtubeId, activeSession.id)}
                      disabled={isLoadingTranscript}
                      className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-ink text-paper hover:bg-ink/90 rounded disabled:opacity-50 transition-all shrink-0"
                    >
                      {isLoadingTranscript ? <Loader2 size={10} className="animate-spin" /> : <Download size={10} />}
                      Tự động lấy
                    </button>
                  </div>
                  {transcriptError && <div className="mb-2 p-1.5 bg-crimson/5 text-crimson text-[9px] leading-relaxed rounded border border-crimson/20 italic shrink-0">⚠️ {transcriptError}</div>}
                  <div className="flex-1 min-h-0 p-0.5 sketch-border border-dashed bg-ink/[0.02] overflow-hidden">
                    <textarea value={activeSession.content} onChange={(e) => updateSession(activeSession.id, 'content', e.target.value)} placeholder="Dán phụ đề hoặc bấm lấy tự động..." className="w-full h-full resize-none bg-transparent outline-none font-sans text-xs md:text-sm leading-relaxed p-2 custom-scrollbar" spellCheck="false" />
                  </div>
                </div>
              ) : mode === 'shadowing' ? (
                <div className="flex-1 flex flex-col p-2 md:p-4 overflow-y-auto min-h-0">
                  {sentences.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-ink/60"><Video size={24} className="mb-2 opacity-50" /><p className="text-xs">Chưa có Transcript.</p></div>
                  ) : (
                    <div className="flex-1 flex flex-col h-full min-h-0 justify-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-ink/40 mb-1.5">Shadowing - Câu {progressIndex + 1}</p>
                      <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-6 bg-ink/5 rounded-lg border border-dashed border-ink/20 text-center relative min-h-[100px] md:min-h-[160px]">
                        {progressIndex > 0 && <p className="text-ink/30 text-[10px] md:text-sm mb-2 italic line-clamp-1 blur-[0.5px]"> {sentences[progressIndex - 1]} </p>}
                        <p className="text-base md:text-2xl font-bold text-ink mb-3 md:mb-6 leading-tight px-1 break-words w-full">{sentences[progressIndex]}</p>
                        {progressIndex < sentences.length - 1 && <p className="text-ink/30 text-[10px] md:text-sm italic line-clamp-1 blur-[0.5px]"> {sentences[progressIndex + 1]} </p>}
                      </div>
                      <div className="flex justify-center flex-wrap gap-1.5 md:gap-3 mt-3 shrink-0">
                        <button onClick={() => { const p = Math.max(0, progressIndex - 1); updateSession(activeSession.id, 'progress', p); playSentence(p); }} disabled={progressIndex === 0} className="sketch-button py-1 px-2 text-[9px] disabled:opacity-50">Trước</button>
                        <button onClick={toggleRecording} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white shadow-md sketch-border border-2", isRecording ? "text-crimson border-crimson" : "text-ink border-ink/40 hover:scale-105")}>{isRecording ? <MicOff size={16} /> : <Mic size={16} />}</button>
                        <button onClick={() => playSentence(progressIndex)} className="sketch-button py-1 px-3 text-[9px] bg-ink text-paper hover:bg-ink/80 hover:text-paper">Nghe lại</button>
                        <button onClick={() => { const p = Math.min(sentences.length - 1, progressIndex + 1); updateSession(activeSession.id, 'progress', p); playSentence(p); }} disabled={progressIndex === sentences.length - 1} className="sketch-button py-1 px-2 text-[9px] disabled:opacity-50">Tiếp</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col p-2 md:p-4 overflow-y-auto min-h-0">
                  {sentences.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-ink/60"><Type size={22} className="mb-2 opacity-50" /><p className="mb-2 text-[10px]">Chưa có Transcript.</p><button onClick={() => setMode('transcript')} className="sketch-button py-1 px-3 text-[9px]">Thêm</button></div>
                  ) : isCompleted ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 animate-in zoom-in">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 sketch-border border-emerald-200">
                        <Check size={32} />
                      </div>
                      <h3 className="text-xl font-black mb-2 uppercase">Hoàn thành bài tập!</h3>
                      <p className="text-sm text-ink/60 mb-6 font-medium">Tuyệt vời! Bạn đã hoàn thành toàn bộ đoạn hội thoại.</p>
                      <div className="flex gap-3">
                        <button onClick={() => updateSession(activeSession.id, 'progress', 0)} className="sketch-button py-2 px-6 text-xs font-black uppercase tracking-widest bg-ink text-paper">Luyện lại</button>
                        <button onClick={() => setActiveSessionId(null)} className="sketch-button py-2 px-6 text-xs font-black uppercase tracking-widest bg-paper text-ink">Bài khác</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      <div className="mb-2 shrink-0">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-ink/40 mb-0.5">Câu {progressIndex + 1}</p>
                        <div className="p-2 bg-ink/5 rounded-lg border border-dashed border-ink/20 text-xs md:text-base leading-relaxed font-mono break-words">
                          {sentences[progressIndex].split(' ').map((word, wIdx) => {
                            const cleanTarget = normalizeString(word);
                            const userWords = userInput.trim().split(/\s+/);
                            const cleanUser = userWords[wIdx] ? normalizeString(userWords[wIdx]) : undefined;
                            const isCurrentWord = wIdx === (userInput.endsWith(' ') ? userWords.length : userWords.length - 1);
                            if (cleanUser === cleanTarget) return <span key={wIdx} className="inline-block mr-1 text-green-600 bg-green-100/50 px-1 rounded">{word}</span>;
                            else if (cleanUser !== undefined && !isCurrentWord) return <span key={wIdx} className="inline-block mr-1 text-red-500">{"*".repeat(word.length)}</span>;
                            else return <span key={wIdx} className="inline-block mr-1 text-ink/40">{word.replace(/[a-zA-Z0-9À-ỹ]/g, '*')}</span>;
                          })}
                        </div>
                      </div>
                      <div className="flex-1 min-h-0 relative">
                        <textarea ref={inputRef} value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={(e) => {
                          if (e.key === 'Enter') e.preventDefault();
                          else if (e.code === 'Space' && e.ctrlKey) {
                            e.preventDefault();
                            if (playerRef.current?.getPlayerState) {
                              const state = playerRef.current.getPlayerState();
                              if (state === 1) playerRef.current.pauseVideo(); else playerRef.current.playVideo();
                            }
                          }
                        }} placeholder="Gõ lại câu vừa nghe..." className="w-full h-full resize-none bg-transparent outline-none font-sans text-sm md:text-lg leading-relaxed p-2 custom-scrollbar sketch-border" spellCheck="false" autoFocus />
                        <button onClick={toggleRecording} className={cn("absolute bottom-2 right-2 p-2 rounded-full transition-all border-2 z-10 shadow-md", isRecording ? "bg-crimson text-white animate-pulse border-white" : "bg-white text-ink border-ink/10 hover:scale-105")}><Mic size={14} fill={isRecording ? "white" : "none"} /></button>
                        <div className="mt-0.5 text-right shrink-0"><button onClick={() => { if (confirm(`Đáp án: "${sentences[progressIndex]}"`)) setUserInput(sentences[progressIndex]); }} className="text-[8px] uppercase tracking-widest text-ink/40 hover:text-ink font-bold">Gợi ý</button></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {(mode === 'practice' || mode === 'shadowing') && sentences.length > 0 && (
              <div className="bg-ink/5 border-t border-dashed border-ink/20 px-2 py-1 shrink-0">
                <div className="flex items-center gap-1.5 mb-1">
                   <span className="text-[7px] font-black uppercase tracking-widest text-ink/40 shrink-0">BÀI HỌC</span>
                   <div className="flex-1 h-1 bg-ink/10 rounded-full overflow-hidden"><div className="h-full bg-crimson transition-all duration-500" style={{ width: `${(Math.min(progressIndex, sentences.length) / sentences.length) * 100}%` }} /></div>
                   <span className="text-[7px] font-bold text-ink/60 shrink-0">{progressIndex}/{sentences.length}</span>
                </div>
                <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
                   {sentences.map((_, i) => (
                      <button key={i} onClick={() => { updateSession(activeSession.id, 'progress', i); playSentence(i); }} className={cn("flex-none w-4 h-4 rounded flex items-center justify-center text-[8px] transition-all font-bold", i < progressIndex ? "bg-green-100 text-green-700" : i === progressIndex ? "bg-ink text-paper scale-110 shadow-sm" : "bg-white text-ink/30 border border-ink/5")}>{i + 1}</button>
                   ))}
                </div>
              </div>
            )}

            {mode === 'shadowing' && isRecording && <div className="absolute top-1.5 right-1.5 bg-crimson text-white px-1.5 py-0.5 rounded-full text-[7px] font-bold animate-pulse z-20">RECORDING</div>}
            {speechScore !== null && <div className={cn("absolute top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full sketch-border font-bold text-[10px] transition-all animate-in zoom-in z-30 shadow-lg", speechScore >= 70 ? "bg-green-100 text-green-700 border-green-200" : "bg-crimson text-white border-white")}>{speechScore}% {speechScore >= 70 ? "🎯" : "💪"}</div>}
          </div>
        </div>
      </div>
    );
  }

  const addFromLibrary = (video: any) => {
    const existing = dictations.find(d => d.youtubeId === video.youtubeId);
    if (existing) {
       setActiveSessionId(existing.id);
       setShowLibrary(false);
       return;
    }

    const newSession: VideoDictation = {
      id: crypto.randomUUID(),
      youtubeId: video.youtubeId,
      title: video.title,
      content: "",
      progress: 0,
      lastModified: Date.now()
    };
    setDictations([newSession, ...dictations]);
    setActiveSessionId(newSession.id);
    setMode('transcript');
    setShowLibrary(false);
    loadTranscript(video.youtubeId, newSession.id);
  };

  if (showLibrary) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 font-sans">
         <div className="flex justify-between items-center mb-8">
            <button 
              onClick={() => setShowLibrary(false)}
              className="flex items-center gap-1 text-ink/60 hover:text-ink transition-colors font-bold text-xs uppercase tracking-widest"
            >
              <ChevronLeft size={16} /> Quay lại
            </button>
            <h2 className="text-2xl font-black font-logo tracking-wide">Kho Video Học Tiếng Anh</h2>
            <div className="w-20" />
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {RECOMMENDED_VIDEOS.map(video => (
              <div 
                key={video.id}
                onClick={() => addFromLibrary(video)}
                className="sketch-border bg-white rounded-lg overflow-hidden group cursor-pointer hover:translate-y-[-4px] transition-all shadow-md hover:shadow-xl"
              >
                 <div className="aspect-video relative overflow-hidden">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-ink/20 group-hover:bg-ink/10 transition-colors" />
                    <div className="absolute bottom-2 right-2 bg-ink/80 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                       {video.level}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <PlayCircle size={48} className="text-white drop-shadow-lg" />
                    </div>
                 </div>
                 <div className="p-4">
                    <div className="flex items-center gap-1 text-[10px] font-black text-crimson uppercase tracking-widest mb-1">
                       <Star size={10} fill="currentColor" /> {video.category}
                    </div>
                    <h3 className="font-bold text-ink leading-snug line-clamp-2 h-10 group-hover:text-crimson transition-colors">
                       {video.title}
                    </h3>
                 </div>
              </div>
            ))}
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 font-sans">
      <div className="text-center mb-8">
        <div className="flex justify-center gap-4 mb-4">
          <div className="w-16 h-16 bg-ink text-paper rounded-full flex items-center justify-center sketch-border shadow-md">
             <Video size={28} />
          </div>
        </div>
        <h2 className="text-3xl font-black font-logo tracking-wide mb-2 uppercase">Video Dictation & Speech</h2>
        <p className="text-ink/60 text-sm font-medium">Luyện nghe chép & Shadowing với YouTube</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-10">
        <div className="sketch-border bg-white p-2 shadow-lg flex-1 max-w-lg w-full">
           <form onSubmit={handleCreate} className="flex gap-2">
             <input 
               type="text"
               value={newUrl}
               onChange={e => setNewUrl(e.target.value)}
               placeholder="Dán link YouTube mới..."
               className="sketch-input flex-1 bg-white/50 text-sm py-2 px-3 focus:ring-2 focus:ring-ink/20 transition-all outline-none"
               required
             />
             <button type="submit" className="bg-ink text-white px-4 py-2 rounded font-bold text-xs uppercase tracking-widest hover:bg-ink/80 transition-all whitespace-nowrap">
                Học video này
             </button>
           </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
        {dictations.map(doc => (
          <div 
            key={doc.id} 
            onClick={() => setActiveSessionId(doc.id)}
            className="sketch-border p-4 bg-white/50 hover:bg-white cursor-pointer group transition-all relative overflow-hidden flex gap-4"
          >
            <div className="w-24 h-[54px] shrink-0 bg-ink/5 sketch-border border-dashed rounded relative overflow-hidden flex items-center justify-center -rotate-2 group-hover:rotate-0 transition-transform">
               <img src={`https://img.youtube.com/vi/${doc.youtubeId}/mqdefault.jpg`} alt="" className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
               <div className="absolute inset-0 bg-ink/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-6 h-6 bg-crimson rounded-full flex items-center justify-center text-white pl-0.5">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M8 5v14l11-7z" /></svg>
                  </div>
               </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h3 className="font-bold text-ink truncate mb-1">{doc.title}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">
                {format(new Date(doc.lastModified), 'dd/MM/yyyy')}
              </p>
            </div>
            <button 
              onClick={(e) => removeSession(doc.id, e)}
              className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 text-ink/40 hover:text-crimson hover:bg-crimson/10 rounded transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {dictations.length === 0 && (
          <div className="col-span-full py-12 text-center text-ink/40 font-hand text-xl">
            Chưa có bài nghe nào. Hãy dán link YouTube để bắt đầu nhé.
          </div>
        )}
      </div>
    </div>
  );
}
