import React, { useState, useEffect, useRef } from 'react';
import type { VideoDictation } from '../types';
import { cn } from '../lib/utils';
import { Plus, Trash2, Edit2, Check, Video, ChevronLeft, Type, Headphones, Download, Loader2, Mic, Library, PlayCircle, Star, MicOff } from 'lucide-react';
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
      // Clean url first
      const trimmed = url.trim();
      if (trimmed.length === 11 && !trimmed.includes('/') && !trimmed.includes('?')) return trimmed;

      const parsedUrl = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      if (parsedUrl.hostname === 'youtu.be') {
        return parsedUrl.pathname.slice(1);
      }
      if (parsedUrl.hostname.includes('youtube.com')) {
        if (parsedUrl.pathname.includes('/v/') || parsedUrl.pathname.includes('/embed/') || parsedUrl.pathname.includes('/shorts/') || parsedUrl.pathname.includes('/live/')) {
          const parts = parsedUrl.pathname.split('/');
          return parts[parts.length - 1].split('?')[0];
        }
        return parsedUrl.searchParams.get('v');
      }
    } catch (e) {
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[7].length === 11) ? match[7] : null;
    }
    return null;
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
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
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
      <div className="max-w-7xl mx-auto p-2 md:p-4 font-sans h-full md:h-[calc(100vh-120px)] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4 shrink-0 px-2 lg:px-0">
          <button 
            onClick={() => setActiveSessionId(null)}
            className="flex items-center gap-1 text-ink/60 hover:text-ink transition-colors font-bold text-[10px] uppercase tracking-widest shrink-0"
          >
            <ChevronLeft size={16} /> Quay lại
          </button>
          
          <div className="flex-1 max-w-sm mx-4">
             <input 
               type="text" 
               value={activeSession.title}
               onChange={(e) => updateSession(activeSession.id, 'title', e.target.value)}
               className="w-full bg-transparent border-b border-dashed border-ink/20 focus:border-ink/60 outline-none text-lg font-bold font-logo text-center py-1 transition-colors"
               placeholder="Tiêu đề bài nghe..."
             />
          </div>
          
          <div className="flex gap-1.5 shrink-0">
            <button 
              onClick={() => setMode('transcript')}
              className={cn("px-2 md:px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-colors flex items-center gap-1", 
                mode === 'transcript' ? "bg-ink text-paper" : "bg-ink/5 text-ink/60 hover:bg-ink/10"
              )}
            >
              <Type size={12} /> <span className="hidden sm:inline">Transcript</span>
            </button>
            <button 
              onClick={() => {
                if (!activeSession.content) {
                  alert("Vui lòng nhập transcript trước.");
                  return;
                }
                setMode('practice');
                if (playerRef.current) playerRef.current.pauseVideo();
              }}
              className={cn("px-2 md:px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-colors flex items-center gap-1", 
                mode === 'practice' ? "bg-ink text-paper" : "bg-ink/5 text-ink/60 hover:bg-ink/10"
              )}
            >
              <Headphones size={12} /> <span className="hidden sm:inline">Practice</span>
            </button>
            <button 
              onClick={() => {
                if (!activeSession.content) {
                  alert("Vui lòng nhập transcript trước.");
                  return;
                }
                setMode('shadowing');
              }}
              className={cn("px-2 md:px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-colors flex items-center gap-1", 
                mode === 'shadowing' ? "bg-ink text-paper" : "bg-ink/5 text-ink/60 hover:bg-ink/10"
              )}
            >
              <Video size={12} /> <span className="hidden sm:inline">Shadowing</span>
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0 overflow-hidden">
          <div className="w-full md:w-5/12 flex flex-col gap-3 shrink-0 h-auto md:h-full min-h-0 overflow-y-auto custom-scrollbar md:pr-1">
            <div className="w-full aspect-video sketch-border p-1 bg-white relative shadow-md shrink-0">
              <YouTube 
                videoId={activeSession.youtubeId} 
                onReady={(e) => {
                  playerRef.current = e.target;
                  setIsPlayerReady(true);
                  setVideoError('');
                }}
                onError={(e) => {
                  const errorData = e.data;
                  let msg = "Lỗi video.";
                  if (errorData === 101 || errorData === 150) msg = "Video bị chặn nhúng.";
                  else if (errorData === 100) msg = "Video đã bị xóa.";
                  setVideoError(msg);
                }}
                opts={{ width: '100%', height: '100%', playerVars: { autoplay: 0, rel: 0, modestbranding: 1, playsinline: 1 } }}
                className="w-full h-full rounded-sm overflow-hidden" 
              />
              {videoError && (
                 <div className="absolute inset-0 bg-ink/90 flex flex-col items-center justify-center p-4 text-center z-20">
                    <Video size={32} className="text-crimson mb-2" />
                    <p className="text-white text-xs font-bold mb-4">{videoError}</p>
                    <button 
                      onClick={() => { setVideoError(''); setActiveSessionId(null); }}
                      className="text-[10px] uppercase font-bold text-white/60 hover:text-white underline"
                    >
                      Chọn video khác
                    </button>
                 </div>
              )}
            </div>
            
            <div className="bg-ink/5 p-4 rounded text-xs text-ink/60 sketch-border border-dashed shrink-0">
              <p className="font-bold uppercase tracking-widest mb-2 text-ink/80 text-[10px]">Hướng dẫn học:</p>
              <ul className="space-y-1.5 ml-4 list-disc marker:text-crimson">
                <li><span className="font-bold text-ink">Transcript</span>: Lấy phụ đề (Tự động hoặc Dán thủ công).</li>
                <li><span className="font-bold text-ink">Practice</span>: Chép chính tả để luyện nghe.</li>
                <li><span className="font-bold text-ink">Shadowing</span>: Nói đuổi theo video để tập nói.</li>
              </ul>
            </div>

            {(mode === 'practice' || mode === 'shadowing') && sentences.length > 0 && (
              <div className="bg-white p-3 rounded sketch-border border-ink/10 flex-1 min-h-0 flex flex-col overflow-hidden">
                 <p className="font-bold uppercase tracking-widest text-ink/80 text-[10px] mb-2 font-logo shrink-0">Tiến độ: {progressIndex}/{sentences.length} câu</p>
                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                   {sentences.map((s, i) => (
                     <button 
                       key={i} 
                       onClick={() => {
                         updateSession(activeSession.id, 'progress', i);
                         playSentence(i);
                       }}
                       className={cn("p-1.5 rounded text-[10px] transition-all w-full text-left cursor-pointer hover:bg-ink/10 block break-words", 
                         i < progressIndex ? "bg-green-100/40 text-green-700 line-through opacity-50" : 
                         i === progressIndex ? "bg-ink text-paper font-bold shadow-sm" : "text-ink/40"
                       )}>
                       {i < progressIndex ? s : i === progressIndex ? (mode === 'shadowing' || isCompleted ? s : "Câu hiện tại") : `Câu ${i + 1}`}
                     </button>
                   ))}
                 </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 flex flex-col min-h-0 bg-white sketch-border shadow-2xl relative overflow-hidden">
            {mode === 'transcript' ? (
              <div className="flex-1 flex flex-col p-4 md:p-6 min-h-0">
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-ink/40">Transcript Editor</h3>
                  <button 
                    onClick={() => loadTranscript(activeSession.youtubeId, activeSession.id)}
                    disabled={isLoadingTranscript}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-ink text-paper hover:bg-ink/90 rounded disabled:opacity-50 transition-all"
                  >
                    {isLoadingTranscript ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                    Tự động lấy Transcript
                  </button>
                </div>
                
                {transcriptError && (
                  <div className="mb-4 p-3 bg-crimson/5 text-crimson text-[11px] leading-relaxed rounded border border-crimson/20 italic shrink-0">
                    ⚠️ {transcriptError}
                  </div>
                )}
                
                <div className="flex-1 flex flex-col min-h-0 p-1 sketch-border border-dashed bg-ink/[0.02] overflow-hidden">
                  <textarea
                    value={activeSession.content}
                    onChange={(e) => updateSession(activeSession.id, 'content', e.target.value)}
                    placeholder="CHƯA CÓ TRANSCRIPT.
                    
CÁCH 1: Bấm nút 'Tự động lấy' ở trên.
CÁCH 2: Dùng laptop/máy tính mở video YouTube, mở tab Phụ đề (Transcript), Copy rồi DÁN VÀO ĐÂY.

Hệ thống sẽ tự động tách câu sau khi bạn dán xong để bạn bắt đầu học."
                    className="w-full h-full resize-none bg-transparent outline-none font-sans text-base leading-relaxed p-3 custom-scrollbar"
                    spellCheck="false"
                  />
                </div>
                <div className="mt-2 text-[10px] text-ink/40 italic text-center shrink-0">
                  Phụ đề sẽ được tự động lưu ngay khi bạn thay đổi.
                </div>
              </div>
            ) : mode === 'shadowing' ? (
              <div className="flex-1 flex flex-col pt-4 overflow-y-auto">
                 {sentences.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-ink/60">
                      <Video size={32} className="mb-4 opacity-50" />
                      <p className="mb-4 text-sm">Chưa có Transcript để Shadowing.</p>
                    </div>
                 ) : (
                    <div className="flex-1 flex flex-col h-full">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mb-2">Shadowing - Câu {progressIndex + 1}</p>
                       <div className="flex-1 flex flex-col items-center justify-center p-8 bg-ink/5 rounded-lg border border-dashed border-ink/20 text-center relative max-h-[50vh]">
                         {progressIndex > 0 && (
                           <p className="text-ink/30 text-lg mb-8 italic line-clamp-2 blur-[1px]"> {sentences[progressIndex - 1]} </p>
                         )}
                         <p className="text-2xl md:text-4xl font-bold text-ink mb-8 leading-tight">
                           {sentences[progressIndex]}
                         </p>
                         {progressIndex < sentences.length - 1 && (
                           <p className="text-ink/30 text-lg italic line-clamp-2 blur-[1px]"> {sentences[progressIndex + 1]} </p>
                         )}
                       </div>
                       
                       <div className="flex justify-center gap-4 mt-6">
                         <button 
                           onClick={() => {
                             const p = Math.max(0, progressIndex - 1);
                             updateSession(activeSession.id, 'progress', p);
                             playSentence(p);
                           }}
                           disabled={progressIndex === 0}
                           className="sketch-button py-2 px-6 disabled:opacity-50"
                         >
                           Câu trước
                         </button>
                         
                         <button
                           onClick={toggleRecording}
                           className={cn(
                             "w-16 h-16 rounded-full flex items-center justify-center transition-all bg-white shadow-lg sketch-border border-2",
                             isRecording ? "text-crimson border-crimson" : "text-ink border-ink/40 hover:scale-110"
                           )}
                         >
                            {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                         </button>

                         <button 
                           onClick={() => playSentence(progressIndex)}
                           className="sketch-button py-2 px-8 bg-ink text-paper hover:bg-ink/80 hover:text-paper"
                         >
                           Nghe lại
                         </button>
                         <button 
                           onClick={() => {
                             const p = Math.min(sentences.length - 1, progressIndex + 1);
                             updateSession(activeSession.id, 'progress', p);
                             playSentence(p);
                           }}
                           disabled={progressIndex === sentences.length - 1}
                           className="sketch-button py-2 px-6 disabled:opacity-50"
                         >
                           Câu tiếp
                         </button>
                       </div>
                    </div>
                 )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col pt-4 overflow-y-auto">
                {sentences.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-ink/60">
                    <Type size={32} className="mb-4 opacity-50" />
                    <p className="mb-4 text-sm">Chưa có Transcript để thực hành.</p>
                    <button 
                      onClick={() => setMode('transcript')}
                      className="sketch-button py-2 px-6"
                    >
                      Thêm Transcript
                    </button>
                  </div>
                ) : isCompleted ? (
                   <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                     <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 sketch-border border-green-200">
                        <Check size={32} />
                     </div>
                     <h3 className="text-xl font-bold mb-2">Hoàn thành xuất sắc!</h3>
                     <p className="text-ink/60 text-sm mb-6">Bạn đã nghe chép đúng tất cả các câu.</p>
                     <button onClick={() => updateSession(activeSession.id, 'progress', 0)} className="sketch-button py-2 px-6">
                       Nghe lại từ đầu
                     </button>
                   </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40 mb-2">Câu số {progressIndex + 1}</p>
                      <div className="p-4 bg-ink/5 rounded-lg border border-dashed border-ink/20 text-lg leading-relaxed font-mono">
                         {(() => {
                           const targetStr = sentences[progressIndex];
                           const targetWords = targetStr.split(' ');
                           const userWords = userInput.trim().split(/\s+/);
                           
                           return targetWords.map((word, wIdx) => {
                             const cleanTarget = normalizeString(word);
                             const cleanUser = userWords[wIdx] ? normalizeString(userWords[wIdx]) : undefined;
                             const isCurrentWord = wIdx === (userInput.endsWith(' ') ? userWords.length : userWords.length - 1);
                             
                             if (cleanUser === cleanTarget) {
                               return <span key={wIdx} className="inline-block mr-2 text-green-600 bg-green-100/50 px-1 rounded">{word}</span>;
                             } else if (cleanUser !== undefined && !isCurrentWord) {
                               return <span key={wIdx} className="inline-block mr-2 text-red-500">{"*".repeat(word.length)}</span>;
                             } else {
                               // Unreached or currently typing
                               // Only show punctuation, replace letters with *
                               const masked = word.replace(/[a-zA-Z0-9À-ỹ]/g, '*');
                               return <span key={wIdx} className="inline-block mr-2 text-ink/40">{masked}</span>;
                             }
                           });
                         })()}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col">
                      <textarea
                        ref={inputRef}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault(); // prevent new lines in input
                          } else if (e.code === 'Space' && e.ctrlKey) {
                             e.preventDefault();
                             if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
                               try {
                                  const state = playerRef.current.getPlayerState();
                                  if (state === 1) playerRef.current.pauseVideo();
                                  else playerRef.current.playVideo();
                               } catch (err) {}
                             }
                          }
                        }}
                        placeholder="Gõ chính xác câu bạn nghe được... (Bấm Ctrl+Space để dừng/phát)"
                        className="w-full flex-1 resize-none bg-transparent outline-none font-sans text-xl md:text-2xl leading-relaxed p-4 custom-scrollbar sketch-border"
                        spellCheck="false"
                        autoFocus
                      />
                      <button 
                        onClick={toggleRecording}
                        className={cn(
                          "absolute bottom-12 right-6 p-4 rounded-full transition-all border-4",
                          isRecording ? "bg-crimson text-white animate-pulse border-white" : "bg-white text-ink border-ink/10 hover:border-ink hover:scale-110 shadow-lg"
                        )}
                        title={isRecording ? "Stop Voice Dictation" : "Start Voice Dictation"}
                      >
                         <Mic fill={isRecording ? "currentColor" : "none"} />
                      </button>
                      <div className="mt-2 text-right">
                         <button 
                           onClick={() => {
                             // Reveal correct answer if stuck
                             if (confirm(`Bạn muốn xem đáp án câu này không?\n\n"${sentences[progressIndex]}"`)) {
                               setUserInput(sentences[progressIndex]);
                             }
                           }}
                           className="text-[10px] uppercase tracking-widest text-ink/40 hover:text-ink font-bold"
                         >
                           Gợi ý đáp án
                         </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {mode === 'shadowing' && isRecording && (
               <div className="absolute top-4 right-4 bg-crimson text-white px-3 py-1 rounded-full text-[10px] font-bold animate-pulse flex items-center gap-1">
                  <Mic size={12} /> Đang nghe...
               </div>
            )}
            
            {speechScore !== null && (
               <div className={cn(
                 "absolute top-4 left-4 px-4 py-2 rounded-lg sketch-border font-bold text-xl transition-all animate-in zoom-in",
                 speechScore >= 70 ? "bg-green-100 text-green-700 border-green-200" : "bg-crimson/10 text-crimson border-crimson/20"
               )}>
                 {speechScore}% {speechScore >= 70 ? "🎯" : "💪"}
               </div>
            )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {new Date(doc.lastModified).toLocaleDateString()}
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
