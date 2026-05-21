import React, { useState, useEffect, useRef } from 'react';
import type { VideoDictation } from '../types';
import { cn } from '../lib/utils';
import { Plus, Trash2, Edit2, Check, Video, ChevronLeft, Type, Headphones, Download, Loader2, Mic, Library, PlayCircle, Star, MicOff, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { YoutubeTranscript } from 'youtube-transcript';
import YouTube from 'react-youtube';
import { RECOMMENDED_VIDEOS } from '../constants/recommendedVideos';
import stringSimilarity from "string-similarity";

export function YouTubeDictation({ dictations, setDictations }: { dictations: VideoDictation[], setDictations: (d: VideoDictation[]) => void }) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [mode, setMode] = useState<'transcript' | 'practice' | 'shadowing'>('practice');
  const [userInput, setUserInput] = useState('');
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [transcriptError, setTranscriptError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
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
      const res = await fetch(`/api/transcript?videoId=${videoId}`);
      const data = await res.json();
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
      } else {
         throw new Error("Transcript data is invalid");
      }
    } catch (err: any) {
      setTranscriptError(err.message || 'Không thể lấy phụ đề tự động do giới hạn từ YouTube. Vui lòng copy phụ đề và dán thủ công.');
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
    setDictations(dictations.map(d => 
      d.id === id ? { ...d, [field]: value, lastModified: Date.now() } : d
    ));
  };
  
  const removeSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm('Are you sure you want to delete this dictation session?')) {
      if (activeSessionId === id) setActiveSessionId(null);
      setDictations(dictations.filter(d => d.id !== id));
    }
  };

  const getSentences = (text: string) => {
    return text.match(/[^.!?\n]+[.!?]*/g)?.map(s => s.trim()).filter(Boolean) || [];
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
              {mode === 'transcript' ? (
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

        <button 
          onClick={() => setShowLibrary(true)}
          className="sketch-button bg-crimson text-white border-crimson py-3 px-8 flex items-center gap-2 font-bold uppercase tracking-widest hover:scale-105 transition-all w-full sm:w-auto"
        >
          <Library size={18} /> Vào Kho Video
        </button>
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
