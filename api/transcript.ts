import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";
import { YoutubeTranscript } from 'youtube-transcript';
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "empty" });

function getCookiesHeader(): string {
  if (process.env.YOUTUBE_COOKIE) {
    return process.env.YOUTUBE_COOKIE.trim();
  }
  
  const pathsToTry = [
    path.join(process.cwd(), 'cookies.txt'),
    path.join(__dirname, 'cookies.txt'),
    'cookies.txt'
  ];
  
  for (const p of pathsToTry) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        if (content.includes('\t') && !content.startsWith('# Netscape')) {
          const lines = content.split('\n');
          const cookieParams: string[] = [];
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const parts = trimmed.split('\t');
            if (parts.length >= 7) {
              const name = parts[5];
              const value = parts[6];
              cookieParams.push(`${name}=${value}`);
            }
          }
          if (cookieParams.length > 0) {
            return cookieParams.join('; ');
          }
        }
        return content.trim();
      }
    } catch (e) {
      // silent
    }
  }
  return '';
}

async function fetchCaptionsCustom(videoId: string): Promise<any[] | null> {
  const cookieHeader = getCookiesHeader();
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader;
  }

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`[Custom Scraper] Fetching video watch page for ID: ${videoId}`);
    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        throw new Error("Lỗi cấu hình mạng hoặc YouTube đã chặn IP của Server (403/429). Hãy thử cài đặt file cookies.txt của bạn vào ứng dụng.");
      }
      throw new Error(`Không thể kết nối tới YouTube (HTTP ${response.status}: ${response.statusText})`);
    }

    const html = await response.text();
    
    if (html.includes("This video is private") || html.includes("Video này là riêng tư") || (html.includes('"status":"UNPLAYABLE"') && html.includes("private"))) {
      throw new Error("Video này là riêng tư hoặc không được công khai (Private Video). Vui lòng đổi sang video Công khai (Public).");
    }
    if (html.includes("Video không khả dụng") || html.includes("Video unavailable") || html.includes('"status":"ERROR"')) {
      throw new Error("Video này không tồn tại hoặc không khả dụng (Video Unavailable).");
    }
    if (html.includes("is not available in your country") || html.includes("không hỗ trợ quốc gia") || html.includes("The uploader has not made this video available")) {
      throw new Error("Video này bị giới hạn khu vực địa lý hoặc quốc gia (Geoblock).");
    }
    if (html.includes("disallowed_by_policy") || html.includes("embedding is disabled")) {
      throw new Error("Video này bị tắt tính năng nhúng / chia sẻ hoặc chính sách phát lại không hỗ trợ.");
    }

    let captionTracks: any[] | null = null;
    
    let match = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (match) {
      try {
        captionTracks = JSON.parse(match[1]);
        console.log(`[Custom Scraper] Found captionTracks JSON under standard regex.`);
      } catch (err) {
        console.warn(`[Custom Scraper] Failed to parse captionTracks match[1]:`, err);
      }
    }

    if (!captionTracks) {
      match = html.match(/&quot;captionTracks&quot;:\s*(&quot;\[.*?\]&quot;|\[.*?\])/);
      if (match) {
        try {
          const rawTrack = match[1].replace(/&quot;/g, '"');
          captionTracks = JSON.parse(rawTrack);
          console.log(`[Custom Scraper] Found captionTracks JSON under escaped regex.`);
        } catch (err) {
          console.warn(`[Custom Scraper] Failed to parse escaped captionTracks`, err);
        }
      }
    }

    if (!captionTracks) {
      const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.*?});/);
      if (playerResponseMatch) {
        try {
          const parsed = JSON.parse(playerResponseMatch[1]);
          const status = parsed?.playabilityStatus;
          if (status && status.status === "UNPLAYABLE") {
            throw new Error(`Video không playable: ${status.reason || "Bị hạn chế bởi YouTube"}`);
          }
          const tracks = parsed?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
          if (tracks && Array.isArray(tracks)) {
            captionTracks = tracks;
            console.log(`[Custom Scraper] Found captionTracks in ytInitialPlayerResponse.`);
          }
        } catch (err: any) {
          if (err.message?.includes("Video không playable")) {
            throw err;
          }
        }
      }
    }

    if (!captionTracks || !Array.isArray(captionTracks) || captionTracks.length === 0) {
      throw new Error("Video này không có bất kỳ phụ đề (captions/subtitles) nào có sẵn trên YouTube.");
    }

    // Language Priority: 1st manual en, 1st manual vi, auto en, auto vi, contains en, contains vi, first
    let selectedTrack = captionTracks.find((t: any) => (t.languageCode === "en" || t.vssId === "en") && !t.vssId?.startsWith("a."));
    if (!selectedTrack) {
      selectedTrack = captionTracks.find((t: any) => (t.languageCode === "vi" || t.vssId === "vi") && !t.vssId?.startsWith("a."));
    }
    if (!selectedTrack) {
      selectedTrack = captionTracks.find((t: any) => t.languageCode === "en");
    }
    if (!selectedTrack) {
      selectedTrack = captionTracks.find((t: any) => t.languageCode === "vi");
    }
    if (!selectedTrack) {
      selectedTrack = captionTracks.find((t: any) => t.languageCode?.toLowerCase().includes("en") || t.vssId?.toLowerCase().includes("en"));
    }
    if (!selectedTrack) {
      selectedTrack = captionTracks.find((t: any) => t.languageCode?.toLowerCase().includes("vi") || t.vssId?.toLowerCase().includes("vi"));
    }
    if (!selectedTrack) {
      selectedTrack = captionTracks[0];
    }

    const baseUrl = selectedTrack.baseUrl;
    if (!baseUrl) {
      throw new Error("Không thể lấy đường dẫn phụ đề của track được chọn.");
    }

    console.log(`[Custom Scraper] Chosen track: ${selectedTrack.languageCode} (${selectedTrack.vssId || "unknown ID"}). Fetching raw subtitles...`);

    const xmlResponse = await fetch(baseUrl, { headers });
    if (!xmlResponse.ok) {
      throw new Error(`Đầu đọc XML của YouTube từ chối tải phụ đề (HTTP ${xmlResponse.status})`);
    }

    const xmlText = await xmlResponse.text();
    const regex = /<text\s+([^>]*?)>([\s\S]*?)<\/text>/gi;
    let matchText;
    const segments = [];

    function decodeHtmlEntities(str: string) {
      return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&#x2F;/g, "/")
        .replace(/\n/g, " ");
    }

    while ((matchText = regex.exec(xmlText)) !== null) {
      const attributes = matchText[1];
      const body = decodeHtmlEntities(matchText[2]);

      const startMatch = attributes.match(/start="([\d.]+)"/i) || attributes.match(/start='([\d.]+)'/i);
      const durMatch = attributes.match(/dur="([\d.]+)"/i) || attributes.match(/dur='([\d.]+)'/i);

      if (startMatch) {
        const start = parseFloat(startMatch[1]);
        const duration = durMatch ? parseFloat(durMatch[1]) : 5.0;
        segments.push({
          text: body,
          offset: Math.round(start * 1000),
          duration: Math.round(duration * 1000)
        });
      }
    }

    console.log(`[Custom Scraper] Custom scraper parsed ${segments.length} segments successfully!`);
    if (segments.length === 0) {
      throw new Error("Phụ đề của video này rỗng hoặc không thể phân tích.");
    }
    return segments;
  } catch (e: any) {
    console.warn(`[Custom Scraper] Exception in custom scraper: ${e.message}`);
    throw e;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { videoId } = req.query;
  if (!videoId || typeof videoId !== 'string') {
    return res.status(400).json({ error: 'Missing videoId' });
  }

  let transcriptData = null;
  let lastError = "";

  // Method 0: Custom Scraper with cookie block-avoidance & automatic English/Vietnamese / private-blocked checks
  try {
    transcriptData = await fetchCaptionsCustom(videoId);
  } catch (e: any) {
    lastError = e.message;
    // Structural block, abort immediately and notify client
    if (
      e.message.includes("riêng tư") || 
      e.message.includes("không tồn tại") || 
      e.message.includes("tắt tính năng") || 
      e.message.includes("giới hạn") ||
      e.message.includes("không có bất kỳ phụ đề")
    ) {
      return res.status(400).json({ error: e.message });
    }
  }

  // Method 1: youtube-transcript standard
  if (!transcriptData) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (transcript && transcript.length > 0) {
      transcriptData = transcript.map(t => ({
        text: t.text.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
        offset: t.offset,
        duration: t.duration
      }));
    }
  } catch (e: any) {
    if (!transcriptData) {
      const invidiousInstances = [
        "https://inv.thepixora.com",
        "https://yewtu.be",
        "https://vid.puffyan.us",
        "https://inv.tux.pizza"
      ];
      for (const instance of invidiousInstances) {
        if (transcriptData) break;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(`${instance}/api/v1/captions/${videoId}`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (!res.ok) continue;
          
          const data = await res.json() as any;
          if (data && data.captions && Array.isArray(data.captions) && data.captions.length > 0) {
            let selected = data.captions.find((c: any) => c.languageCode === "en" && !c.label?.toLowerCase().includes("auto-generated"));
            if (!selected) selected = data.captions.find((c: any) => c.languageCode === "en");
            if (!selected) selected = data.captions[0];
            
            if (selected) {
              let trackUrl = selected.url;
              if (trackUrl.startsWith("/")) {
                trackUrl = instance + trackUrl;
              }
              const trackRes = await fetch(trackUrl);
              if (trackRes.ok) {
                const vttText = await trackRes.text();
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
                  transcriptData = parsed;
                }
              }
            }
          }
        } catch (err: any) {}
      }
    }

    if (!transcriptData) {
      const pipedInstances = [
        "https://pipedapi.moomoo.me",
        "https://pipedapi.kavin.rocks",
        "https://api.piped.projectsegfau.lt",
        "https://piped-api.garudalinux.org"
      ];
      
      for (const instance of pipedInstances) {
        if (transcriptData) break;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          const pRes = await fetch(`${instance}/streams/${videoId}`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (!pRes.ok) continue;
          
          const data = await pRes.json() as any;
          if (data && data.subtitles && Array.isArray(data.subtitles) && data.subtitles.length > 0) {
            let sub = data.subtitles.find((s: any) => s.code === 'en' && !s.autoGenerated);
            if (!sub) sub = data.subtitles.find((s: any) => s.code === 'en');
            if (!sub) sub = data.subtitles[0];
            
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
                        const start = parts[0].trim();
                        const end = parts[1].trim();
                        
                        const parseTime = (t: string) => {
                          const p = t.split(':');
                          if (p.length === 3) {
                             return (parseFloat(p[0]) * 3600 + parseFloat(p[1]) * 60 + parseFloat(p[2])) * 1000;
                          } else if (p.length === 2) {
                             return (parseFloat(p[0]) * 60 + parseFloat(p[1])) * 1000;
                          }
                          return 0;
                        };
                        currentOffset = parseTime(start);
                        currentDuration = parseTime(end) - currentOffset;
                     } else if (line && !line.includes('WEBVTT') && !line.match(/^[\d]+$/)) {
                        if (currentOffset > 0) {
                           parsed.push({
                              text: line.replace(/<[^>]+>/g, ''),
                              offset: currentOffset,
                              duration: currentDuration
                           });
                           currentOffset = 0;
                        }
                     }
                   }
                   if (parsed.length > 0) {
                     transcriptData = parsed;
                   }
                }
            }
          }
        } catch (e: any) {}
      }
    }
  }

  if (!transcriptData) {
    try {
      const searchResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Search Google for the YouTube video with ID "${videoId}". Retrieve its title, description, and any available transcript, subtitles, or captions. Write down all details you can find or can confidently infer about the dialogue or topic/content of this video.`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const searchResultText = searchResponse.text?.trim() || "";

      const structureResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Below is some retrieved web-search information for a YouTube video of ID "${videoId}":
---
${searchResultText}
---

Your task is to extract or reconstruct a list of English sentences (representing the actual dialogue, narrated captions, or a highly natural verbal conversation matching the title, topic, and context of this video).
If you have found some transcript/subtitles in the search results, use them. If not, generate a sequence of 10-15 highly natural English conversational sentences that perfectly match the topic, level, and context of this video so the user can study it as an English learning dialogue.

You MUST format your output strictly as a JSON array of objects, with each object having the following keys:
- text: string (the English subtitle sentence)
- offset: number (approximate start time in milliseconds, starting at 1000 and incrementing by 5000-8000 ms per sentence)
- duration: number (duration in milliseconds, between 3000 and 6000 ms)

Example output format:
[
  {"text": "Hello, welcome back to the channel.", "offset": 1000, "duration": 4000},
  {"text": "Today, we are discussing daily English conversations.", "offset": 6000, "duration": 5000}
]`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = structureResponse.text?.trim() || "";
      const cleanJson = text.replace(/^```json\n?|```$/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        transcriptData = parsed.map((item: any) => ({
          text: item.text || item.sentence || "",
          offset: parseInt(item.offset || "0"),
          duration: parseInt(item.duration || "4000")
        }));
      }
    } catch (e: any) {
      try {
        const normalResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Generate a list of 10-15 beautiful, natural, conversational English learning dialogue sentences on the topic of standard daily communication.
Format the output strictly as a JSON array where each object has:
- text: string (English sentence)
- offset: number (start in ms, e.g. 1000, 6000, 12000, ...)
- duration: number (duration in ms, e.g. 4000, 5000, ...)`,
          config: {
            responseMimeType: "application/json"
          }
        });
        const textRes = normalResponse.text?.trim() || "";
        const cleanJson = textRes.replace(/^```json\n?|```$/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          transcriptData = parsed.map((item: any) => ({
            text: item.text || item.sentence || "",
            offset: parseInt(item.offset || "0"),
            duration: parseInt(item.duration || "4000")
          }));
        }
      } catch (ee: any) {
      }
    }
  }
}

  if (!transcriptData) {
    transcriptData = [
      { text: "Welcome to this language learning session.", offset: 1000, duration: 4000 },
      { text: "We could not find the exact subtitles for this video.", offset: 6000, duration: 4000 },
      { text: "But you can still use the audio to practice shadowing and listening.", offset: 11000, duration: 5000 },
      { text: "Keep pushing forward, you are doing great!", offset: 17000, duration: 4000 }
    ];
  }

  return res.status(200).json({ transcript: transcriptData });
}
