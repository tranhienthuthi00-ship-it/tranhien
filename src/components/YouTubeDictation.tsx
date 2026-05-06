import React, { useState, useEffect, useRef } from 'react';
import type { VideoDictation } from '../types';
import { cn } from '../lib/utils';
import { Plus, Trash2, Edit2, Check, Video, ChevronLeft, Type, Headphones, Download, Loader2 } from 'lucide-react';
import { YoutubeTranscript } from 'youtube-transcript';

import YouTube from 'react-youtube';

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

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
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
        const fullText = data.transcript.map((item: any) => item.text).join(' ').replace(/\s+/g, ' ');
        const formattedText = fullText.replace(/([a-z])\s+([A-Z])/g, '$1. $2');
        updateSession(sessionId, 'content', formattedText);
      } else {
         throw new Error("Transcript data is invalid");
      }
    } catch (err: any) {
      setTranscriptError('Không thể lấy phụ đề tự động (do giới hạn từ YouTube đối với một số video). Vui lòng copy phụ đề và dán thủ công xuống dưới (Tính năng dừng tự động chỉ hoạt động khi tải thành công bằng nút này).');
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

  const activeSession = dictations.find(d => d.id === activeSessionId);

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

    const playSentence = (index: number) => {
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

    return (
      <div className="max-w-6xl mx-auto p-2 md:p-4 font-sans h-[calc(100vh-140px)] flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0 p-2 md:p-0">
          <button 
            onClick={() => setActiveSessionId(null)}
            className="flex items-center gap-1 text-ink/60 hover:text-ink transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <ChevronLeft size={16} /> Quay lại
          </button>
          
          <div className="flex-1 max-w-md mx-4">
             <input 
               type="text" 
               value={activeSession.title}
               onChange={(e) => updateSession(activeSession.id, 'title', e.target.value)}
               className="w-full bg-transparent border-b-2 border-dashed border-ink/20 focus:border-ink/60 outline-none text-xl font-bold font-logo text-center py-1 transition-colors"
               placeholder="Tiêu đề bài nghe..."
             />
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setMode('transcript')}
              className={cn("px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded transition-colors flex items-center gap-1.5", 
                mode === 'transcript' ? "bg-ink text-paper" : "bg-ink/5 text-ink/60 hover:bg-ink/10"
              )}
            >
              <Type size={14} /> Transcript
            </button>
            <button 
              onClick={() => { setMode('practice'); if (playerRef.current) playerRef.current.pauseVideo(); }}
              className={cn("px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded transition-colors flex items-center gap-1.5", 
                mode === 'practice' ? "bg-ink text-paper" : "bg-ink/5 text-ink/60 hover:bg-ink/10"
              )}
            >
              <Headphones size={14} /> Practice
            </button>
            <button 
              onClick={() => setMode('shadowing')}
              className={cn("px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded transition-colors flex items-center gap-1.5", 
                mode === 'shadowing' ? "bg-ink text-paper" : "bg-ink/5 text-ink/60 hover:bg-ink/10"
              )}
            >
              <Video size={14} /> Shadowing
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 flex-1 min-h-0">
          <div className="w-full md:w-5/12 flex flex-col gap-2 shrink-0 h-[30vh] md:h-full">
            <div className="w-full aspect-video sketch-border p-1 bg-white relative">
              <YouTube 
                videoId={activeSession.youtubeId} 
                onReady={(e) => {
                  playerRef.current = e.target;
                  setIsPlayerReady(true);
                }}
                opts={{ width: '100%', height: '100%', playerVars: { autoplay: 0, rel: 0 } }}
                className="w-full h-full rounded-sm overflow-hidden" 
              />
            </div>
            <div className="bg-ink/5 p-3 rounded text-xs text-ink/60 sketch-border border-dashed flex-1 overflow-y-auto">
              <p className="font-bold uppercase tracking-widest mb-1 text-ink/80 text-[10px]">Mẹo nghe chép:</p>
              <ul className="list-disc pl-4 space-y-1 mb-2">
                <li><kbd className="bg-white px-1 font-sans border border-ink/20 rounded shadow-sm">Ctrl</kbd> + <kbd className="bg-white font-sans px-1 border border-ink/20 rounded shadow-sm">Space</kbd> để Dừng/Phát khi đang gõ chữ.</li>
                <li>Phím <kbd className="bg-white px-1 border border-ink/20 rounded shadow-sm">J</kbd> lùi 10s, <kbd className="bg-white px-1 border border-ink/20 rounded shadow-sm">L</kbd> tiến 10s</li>
                <li><kbd className="bg-white px-1 border border-ink/20 rounded shadow-sm">Shift</kbd> + <kbd className="bg-white px-1 border border-ink/20 rounded shadow-sm">,</kbd> giảm tốc độ</li>
              </ul>
              <p className="mb-4 text-[10px] italic text-amber-700/80 bg-amber-50 p-1.5 rounded border border-amber-200">
                * Video sẽ tự động bám theo câu và dừng nếu tải <span className="font-bold">Transcript Tự động</span> thành công. Nếu không, hãy dùng Ctrl+Space phím tắt.
              </p>
              
              {(mode === 'practice' || mode === 'shadowing') && sentences.length > 0 && (
                <div className="mt-4 border-t border-dashed border-ink/20 pt-4">
                   <p className="font-bold uppercase tracking-widest text-ink/80 text-[10px] mb-2">Tiến độ ({progressIndex}/{sentences.length})</p>
                   <div className="space-y-2">
                     {sentences.map((s, i) => (
                       <button 
                         key={i} 
                         onClick={() => {
                           updateSession(activeSession.id, 'progress', i);
                           playSentence(i);
                         }}
                         className={cn("p-2 rounded text-xs transition-colors w-full text-left cursor-pointer hover:bg-ink/10 block", 
                           i < progressIndex ? "bg-green-100/50 text-green-800 line-through opacity-60" : 
                           i === progressIndex ? "bg-amber-100/80 text-amber-900 font-bold border border-amber-200 shadow-sm" : "text-ink/40"
                         )}>
                         {i < progressIndex ? s : i === progressIndex ? (mode === 'shadowing' ? s : "...") : "..."}
                       </button>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col min-h-0 bg-white/60 sketch-border p-2 md:p-4 relative">
            {mode === 'transcript' ? (
              <>
                <div className="mb-2 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Sửa Transcript</span>
                  <button 
                    onClick={() => loadTranscript(activeSession.youtubeId, activeSession.id)}
                    disabled={isLoadingTranscript}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest bg-ink text-paper hover:bg-ink/90 rounded disabled:opacity-50"
                  >
                    {isLoadingTranscript ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    Tự động lấy Transcript
                  </button>
                </div>
                {transcriptError && <div className="mb-2 p-2 bg-crimson/10 text-crimson text-xs rounded border border-crimson/20">{transcriptError}</div>}
                <textarea
                  value={activeSession.content}
                  onChange={(e) => updateSession(activeSession.id, 'content', e.target.value)}
                  placeholder="Dán hoặc gõ Transcript tiếng Anh vào đây (Mỗi câu sẽ tự tách theo dấu chấm hoặc xuống dòng)..."
                  className="w-full flex-1 resize-none bg-transparent outline-none font-sans text-base leading-relaxed p-2 custom-scrollbar bg-ink/5 rounded"
                  spellCheck="false"
                />
              </>
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
                           onClick={() => playSentence(progressIndex)}
                           className="sketch-button py-2 px-8 bg-ink text-paper hover:bg-ink/80 hover:text-paper"
                         >
                           Nghe lại câu này
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
                           Câu tiếp theo
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 font-sans">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto bg-ink text-paper rounded-full flex items-center justify-center mb-4 sketch-border shadow-md">
           <Video size={28} />
        </div>
        <h2 className="text-3xl font-black font-logo tracking-wide mb-2">Video Dictation</h2>
        <p className="text-ink/60 text-sm font-medium">Luyện nghe chép chính tả với YouTube</p>
      </div>

      <div className="skew-x-1 sm:skew-x-2 sketch-border bg-white p-6 shadow-xl relative z-10 max-w-2xl mx-auto mb-10">
         <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
           <input 
             type="text"
             value={newUrl}
             onChange={e => setNewUrl(e.target.value)}
             placeholder="Dán link YouTube vào đây..."
             className="sketch-input flex-1 bg-white/50 text-sm py-2 px-4 focus:ring-2 focus:ring-ink/20 transition-all outline-none"
             required
           />
           <button type="submit" className="sketch-button flex items-center justify-center gap-2 px-6 py-2 shrink-0 text-sm bg-ink text-white border-ink hover:text-ink hover:bg-white hover:border-ink/80 transition-colors">
              <Plus size={16} /> Bắt đầu
           </button>
         </form>
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
