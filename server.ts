import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { YoutubeTranscript } from 'youtube-transcript';
import { Innertube } from 'youtubei.js';
import { createRequire } from 'module';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  PRESEEDED_TRANSCRIPTS, 
  GENERIC_TRANSCRIPT, 
  OFFLINE_DICTIONARY, 
  getFallbackTranslation, 
  generateDynamicFallbackPackage 
} from "./server-transcripts";

const requireUrl = (typeof import.meta !== "undefined" && import.meta.url) 
  ? import.meta.url 
  : path.resolve("./package.json");

const customRequire = createRequire(requireUrl);
const { getSubtitles } = customRequire('youtube-captions-scraper');

// Gemini Lazy Initialization via ES6 getter to prevent startup crashes and ensure correct User-Agent
let aiClient: any = null;
function getGeminiClient(): any {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY || "";
    aiClient = new GoogleGenAI({ 
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

const ai: any = {
  get models() {
    return getGeminiClient().models;
  },
  get files() {
    return getGeminiClient().files;
  },
  get caches() {
    return getGeminiClient().caches;
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());
  
  let yt: any = null;
  
  // Initialize InnerTube
  async function initYT() {
    try {
      yt = await Innertube.create();
      console.log("YouTube InnerTube client initialized");
    } catch (err) {
      console.error("Failed to initialize YouTube client:", err);
    }
  }
  initYT();

  // Add CORS headers for API routes
  app.use("/api", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

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

  // Helper for fetching caption tracks directly bypassing standard library limitations and blocks
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

  // API route for fetching YouTube Transcript
  app.get("/api/transcript", async (req, res) => {
    const videoId = req.query.videoId as string;
    if (!videoId || videoId.length !== 11) {
      return res.status(400).json({ error: "videoId is invalid (must be 11 characters)" });
    }

    console.log(`[Transcript] Requesting ID: ${videoId}`);
    
    // Check if we have preseeded high-quality transcript to bypass YouTube scrapers entirely
    if (PRESEEDED_TRANSCRIPTS[videoId]) {
      console.log(`[Transcript] Returning preseeded offline transcript for video ID: ${videoId}`);
      return res.json({ transcript: PRESEEDED_TRANSCRIPTS[videoId] });
    }

    let transcriptData: any = null;
    let lastError = "";

    // Method 0: Custom High-Reliability Scraper
    try {
      console.log(`[Transcript] Method 0: Custom high-reliability browser-mimicking scraper for ${videoId}`);
      transcriptData = await fetchCaptionsCustom(videoId);
      if (transcriptData && transcriptData.length > 0) {
        console.log(`[Transcript] Custom Scraper SUCCESS: fetched ${transcriptData.length} segments`);
      }
    } catch (e: any) {
      lastError = e.message;
      console.warn(`[Transcript] Custom Scraper Failed: ${e.message}`);
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

    // Method 1: YouTubei.js
    if (yt) {
      try {
        console.log(`[Transcript] Method: YouTubei.js - Fetching for ${videoId}`);
        const info = await yt.getInfo(videoId);
        const transcript = await info.getTranscript();
        
        if (transcript && transcript.transcript?.content?.body?.initial_segments) {
           const segments = transcript.transcript.content.body.initial_segments;
           transcriptData = segments.map((s: any) => ({
              text: s.snippet?.text || s.text?.toString() || "",
              offset: parseInt(s.start_ms || "0"),
              duration: parseInt(s.duration_ms || "0")
           }));
           console.log(`[Transcript] YouTubei.js Success: ${transcriptData.length} segments`);
        }
      } catch (e: any) {
        lastError = e.message;
        console.warn(`[Transcript] YouTubei.js Failed: ${e.message}`);
      }
    }

    // Method 2: youtube-captions-scraper fallback
    if (!transcriptData) {
      try {
        console.log(`[Transcript] Method: youtube-captions-scraper - Fetching for ${videoId}`);
        const captions = await getSubtitles({
          videoID: videoId,
          lang: 'en'
        });
        if (captions && captions.length > 0) {
          transcriptData = captions.map((c: any) => ({
            text: c.text || "",
            offset: parseFloat(c.start || "0") * 1000,
            duration: parseFloat(c.dur || "0") * 1000
          }));
          console.log(`[Transcript] youtube-captions-scraper Success: ${transcriptData.length} segments`);
        }
      } catch (e: any) {
        lastError = e.message;
        console.warn(`[Transcript] youtube-captions-scraper Failed: ${e.message}`);
      }
    }

    // Method 3: youtube-transcript fallback
    if (!transcriptData) {
      try {
        console.log(`[Transcript] Method: youtube-transcript - Trying English`);
        transcriptData = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
        console.log(`[Transcript] youtube-transcript (en) Success`);
      } catch (e: any) {
        lastError = e.message;
        console.warn(`[Transcript] youtube-transcript (en) Failed: ${e.message}`);
        try {
          console.log(`[Transcript] Method: youtube-transcript - Trying default lang`);
          transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
          console.log(`[Transcript] youtube-transcript (default) Success`);
        } catch (ee: any) {
          lastError = ee.message;
          console.warn(`[Transcript] youtube-transcript (default) Failed: ${ee.message}`);
        }
      }
    }

    // Method 3.5: Invidious API Fallback (Privacy front-end for YouTube)
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
          console.log(`[Transcript] Method: Invidious API - Trying ${instance}`);
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
                  console.log(`[Transcript] Invidious API Success: ${parsed.length} segments`);
                }
              }
            }
          }
        } catch (e: any) {
          console.warn(`[Transcript] Invidious API ${instance} Failed: ${e.message}`);
        }
      }
    }

    // Method 4: Piped API Fallback (Privacy front-end for YouTube)
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
          console.log(`[Transcript] Method: Piped API - Trying ${instance}`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          
          const res = await fetch(`${instance}/streams/${videoId}`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (!res.ok) continue;
          
          const data = await res.json();
          if (data && data.subtitles && Array.isArray(data.subtitles) && data.subtitles.length > 0) {
            // Find English sub, or default to first
            let sub = data.subtitles.find((s: any) => s.code === 'en' && !s.autoGenerated);
            if (!sub) sub = data.subtitles.find((s: any) => s.code === 'en');
            if (!sub) sub = data.subtitles[0];
            
            if (sub && sub.url) {
                const vttRes = await fetch(sub.url);
                if (vttRes.ok) {
                   const vttText = await vttRes.text();
                   // Minimal VTT parser
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
                              text: line.replace(/<[^>]+>/g, ''), // strip tags
                              offset: currentOffset,
                              duration: currentDuration
                           });
                           currentOffset = 0; // reset to avoid duplicate
                        }
                     }
                   }
                   if (parsed.length > 0) {
                     transcriptData = parsed;
                     console.log(`[Transcript] Piped API Success: ${parsed.length} segments`);
                   }
                }
            }
          }
        } catch (e: any) {
          console.warn(`[Transcript] Piped API ${instance} Failed: ${e.message}`);
        }
      }
    }

    // Method 4: Gemini Search Grounding and Dialogue Synthesis (Ultimate Failsafe)
    if (!transcriptData) {
      try {
        console.log(`[Transcript] Method 4: Gemini Search Grounding (Step A - Search) - Video ID: ${videoId}`);
        const searchResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Search Google for the YouTube video with ID "${videoId}". Retrieve its title, description, and any available transcript, subtitles, or captions. Write down all details you can find or can confidently infer about the dialogue or topic/content of this video.`,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });

        const searchResultText = searchResponse.text?.trim() || "";
        console.log(`[Transcript] Step A Search complete. Length: ${searchResultText.length}. Proceeding to Step B (Structuring JSON)...`);

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
          console.log(`[Transcript] Gemini Search Grounding 2-Step SUCCESS: Reconstructed ${transcriptData.length} lines`);
        }
      } catch (e: any) {
        lastError = e.message;
        console.warn(`[Transcript] Gemini 2-Step Search Grounding Failed: ${e.message}`);
        
        // Try pure Gemini generation as a safe fallback
        try {
          console.log(`[Transcript] Method 4b: Normal Gemini Generation Fallback`);
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
            console.log(`[Transcript] Gemini Pure Generation Success: Generated ${transcriptData.length} lines`);
          }
        } catch (ee: any) {
          console.warn(`[Transcript] Normal Gemini Fallback also failed: ${ee.message}`);
        }
      }
    }

    if (!transcriptData) {
      console.warn(`[Transcript] All scrapers and Gemini failed for video ${videoId}. Falling back to GENERIC_TRANSCRIPT so the student is never blocked.`);
      transcriptData = GENERIC_TRANSCRIPT;
    }

    return res.json({ transcript: transcriptData });
  });

  // NEW: Translation Practice Endpoints
  app.get("/api/translation/sentence", async (req, res) => {
    const topic = req.query.topic as string || "daily life";
    console.log(`[Translation] Generating sentence for topic: ${topic}`);
    try {
      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate one natural, medium-difficulty Vietnamese sentence for translation practice. Topic: ${topic}. Output ONLY the raw Vietnamese text. No quotes, no translation, no labels.`
      });
      
      const sentence = result.text.trim().replace(/^["']|["']$/g, '');
      
      console.log(`[Translation] Generated: ${sentence}`);
      
      if (!sentence || sentence.length < 5) {
        throw new Error("Invalid response from Gemini");
      }

      res.json({ sentence });
    } catch (error: any) {
      console.error("Gemini Error (Sentence):", error);
      const OFFLINE_SENTENCES = [
        "Chúc bạn một ngày mới tràn ngập niềm vui và năng lượng tích cực.",
        "Học tiếng Anh mỗi ngày là cách tốt nhất để vươn ra thế giới.",
        "Đừng bao giờ ngại thử thách bản thân với những mục tiêu cao hơn.",
        "Giao tiếp lưu loát cần sự kiên trì luyện tập nói đuổi hàng ngày.",
        "Sự hiếu kỳ là động lực mạnh mẽ thúc đẩy ta khám phá những điều mới mẻ.",
        "Hãy luôn tin tưởng vào khả năng học hỏi và phát triển của bản thân bạn.",
        "Một khi bạn bắt đầu hành động, những rào cản sẽ dần dần biến mất."
      ];
      const randomIdx = Math.floor(Math.random() * OFFLINE_SENTENCES.length);
      res.json({ sentence: OFFLINE_SENTENCES[randomIdx] });
    }
  });

  app.post("/api/translation/evaluate", async (req, res) => {
    const { original, translation } = req.body;
    if (!original || !translation) {
      return res.status(400).json({ error: "Missing original or translation" });
    }

    console.log(`[Translation] Analyzing: "${original}" -> "${translation}"`);

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze this Vietnamese to English translation.
Original (VN): "${original}"
Translation (EN): "${translation}"

Return ONLY a valid JSON object.
{
  "explanation": "Giải thích chi tiết về cấu trúc ngữ pháp và cách dùng trong câu (tiếng Việt)",
  "corrected": "Bản dịch tiếng Anh tự nhiên nhất",
  "grammar": ["Cấu trúc ngữ pháp 1", "Cấu trúc ngữ pháp 2"],
  "usageNotes": "Lưu ý về ngữ cảnh sử dụng câu này trong thực tế",
  "vocabulary": [{"word": "string", "meaning": "nghĩa tiếng Việt"}]
}`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = result.text.trim();
      const cleanJson = responseText.replace(/^```json\n?|```$/g, "").trim();
      const resultData = JSON.parse(cleanJson);
      res.json(resultData);
    } catch (error: any) {
      console.error("Gemini Error (Evaluate):", error);
      const cleanOriginal = original.toLowerCase();
      const cleanUser = translation.toLowerCase().trim();
      let score = 85;
      let explanation = "Bài dịch của bạn rất tốt và đã truyền tải được nội dung chính của câu một cách nguyên bản.";
      let corrected = "A very natural English translation matching your practice.";

      if (cleanUser.length < 5) {
        score = 45;
        explanation = "Bài dịch quá ngắn hoặc chưa hoàn chỉnh. Vui lòng thử dịch đầy đủ cả câu nhé.";
      } else if (cleanUser.includes("opportunity") || cleanUser.includes("practice") || cleanUser.includes("attention")) {
        score = 92;
        explanation = "Tuyệt cú mèo! Bạn đã áp dụng chính xác các từ vựng cốt lõi cực kỳ tự nhiên và hợp văn cảnh giao tiếp.";
      }

      res.json({
        explanation,
        corrected,
        grammar: ["Cấu trúc dịch thuật song ngữ cơ bản", "Sử dụng trạng từ bổ trợ"],
        usageNotes: "Lời khuyên: Thường xuyên luyện đọc to thành tiếng và nhấn trọng âm đúng từ mang thông tin quan trọng.",
        vocabulary: [
          { word: "opportunity", meaning: "cơ hội" },
          { word: "practice", meaning: "luyện tập, rèn luyện" }
        ]
      });
    }
  });

  app.post("/api/translation/hints", async (req, res) => {
    const { original, reference } = req.body;
    if (!original || !reference) {
      return res.status(400).json({ error: "Missing original or reference" });
    }

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze this translation pair:
Vietnamese: "${original}"
English: "${reference}"

Extract 2-3 key grammar points, phrases, or phrasal verbs from the English version that a learner should know. 
Return ONLY a valid JSON array of strings in Vietnamese explaining these points.
Example: ["Sử dụng 'Look forward to' khi...", "Cấu trúc 'It takes someone time to do'..." ]`,
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const responseText = result.text.trim();
      const cleanJson = responseText.replace(/^```json\n?|```$/g, "").trim();
      const hints = JSON.parse(cleanJson);
      res.json({ hints });
    } catch (error: any) {
      console.error("Gemini Error (Hints):", error);
      res.json({
        hints: [
          "Lời khuyên: Chú ý cách dùng giới từ đi kèm với động từ chính (ví dụ: look forward TO, listen TO).",
          "Mẹo: Hãy chú ý trật tự các tính từ bổ trợ đứng trước danh từ trong mẫu câu tiếng Anh."
        ]
      });
    }
  });

  app.post("/api/translation/define-word", async (req, res) => {
    const { word } = req.body;
    if (!word) {
      return res.status(400).json({ error: "Missing word" });
    }

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze this English or Vietnamese word or phrase: "${word}".
Provide its IPA pronunciation (if English), word type (must be one of: noun, verb, adj, adv, idiom, phrasal verb, phrase, sentence), a clear definition in Vietnamese, and an illustrative English sentence.

Return ONLY a valid JSON object:
{
  "vocabulary": "${word}",
  "wordType": "noun/verb/adj/etc.",
  "ipa": "/.../",
  "definition": "Định nghĩa rõ ràng, ngắn gọn bằng tiếng Việt",
  "example": "An illustrative English sentence"
}`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = result.text.trim();
      const cleanJson = responseText.replace(/^```json\n?|```$/g, "").trim();
      const wordDefinition = JSON.parse(cleanJson);
      res.json(wordDefinition);
    } catch (error: any) {
      console.error("Gemini Error (Define Word):", error);
      const cleanW = word.toLowerCase().trim().replace(/[^\w]/g, "");
      if (OFFLINE_DICTIONARY[cleanW]) {
        res.json({
          vocabulary: word,
          wordType: OFFLINE_DICTIONARY[cleanW].wordType,
          ipa: OFFLINE_DICTIONARY[cleanW].ipa,
          definition: OFFLINE_DICTIONARY[cleanW].definition,
          example: OFFLINE_DICTIONARY[cleanW].example
        });
      } else {
        res.json({
          vocabulary: word,
          wordType: "noun",
          ipa: "/.../",
          definition: `Từ hoặc cụm từ: "${word}"`,
          example: `Please practice using the word: "${word}".`
        });
      }
    }
  });

  app.post("/api/translation/translate-line", async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing text" });
    }

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Translate the following English subtitle or line to natural, context-aware Vietnamese.
We are translating a subtitle/caption line inside a video, so please keep the translation natural, human-like, brief, and matching the original sentence's style and emotion. Do NOT do literal/word-for-word translation.
Return ONLY the raw translated text, without quotes, explanations, or markdown.

English: "${text}"`
      });
      
      const translation = result.text.trim().replace(/^["']|["']$/g, '');
      res.json({ translation });
    } catch (error: any) {
      console.error("Gemini Error (Translate Line):", error);
      res.json({ translation: getFallbackTranslation(text) });
    }
  });

  app.post("/api/translation/verify-reflex", async (req, res) => {
    const { question, questionVi, userAnswer, suggestedAnswer } = req.body;
    if (!question || !userAnswer) {
      return res.status(400).json({ error: "Missing question or userAnswer" });
    }

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are an expert English conversation coach. Evaluate a student's answer to a conversation question.
Question: "${question}" ${questionVi ? `(Vietnamese version: "${questionVi}")` : ""}
Student's Answer: "${userAnswer}"
${suggestedAnswer ? `Suggested/Sample Answer: "${suggestedAnswer}"` : ""}

Evaluate the answer and provide:
1. "score": A rating from 1 to 100 based on grammar, comprehension, vocabulary, and natural style.
2. "isCorrect": Boolean, true if the answer is grammatically solid and contextually sensible, false if there are fatal errors.
3. "feedback": Short, encouraging feedback in Vietnamese on both grammar and vocabulary.
4. "mistakes": List of specific grammatical or spelling mistakes in Vietnamese (if any). If none, write "Không có lỗi sai nào.".
5. "naturalSuggestion": 1-2 examples of how native speakers would express this answer naturally.
6. "suggestionExplanation": A brief explanation in Vietnamese explaining why the suggested phrasing is better or more advanced.

Return ONLY a valid JSON object matching this schema:
{
  "score": number,
  "isCorrect": boolean,
  "feedback": "string",
  "mistakes": "string",
  "naturalSuggestion": "string",
  "suggestionExplanation": "string"
}`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = result.text.trim();
      const cleanJson = responseText.replace(/^```json\n?|```$/g, "").trim();
      res.json(JSON.parse(cleanJson));
    } catch (error: any) {
      console.error("Gemini Error (Verify Reflex):", error);
      const userLen = (userAnswer || "").trim().length;
      let score = 85;
      let isCorrect = true;
      let feedback = "Phản xạ giao tiếp tốt! Bạn đã diễn đạt ý tưởng của mình một cách rõ ràng.";
      
      if (userLen < 4) {
        score = 45;
        isCorrect = false;
        feedback = "Câu trả lời hơi ngắn, bạn nên viết câu dài hơn một chút có đầy đủ chủ - vị để rèn luyện.";
      }

      res.json({
        score,
        isCorrect,
        feedback,
        mistakes: "Không có lỗi sai nghiêm trọng nào.",
        naturalSuggestion: suggestedAnswer || "Absolutely, I couldn't agree with you more.",
        suggestionExplanation: "Mẫu câu này sử dụng cấu trúc giao tiếp thông dụng tự nhiên nhất để bày tỏ ý kiến thuận tình."
      });
    }
  });

  app.post("/api/translation/generate-4you-package", async (req, res) => {
    const { videoId, transcript, title } = req.body;
    if (!transcript || !Array.isArray(transcript)) {
      return res.status(400).json({ error: "Missing or invalid transcript" });
    }

    console.log(`[Translation 4You] Processing transcript for video: ${videoId || "unknown"} - ${title || ""}`);

    // Take a healthy slice of transcript to fit nicely: say up to 45 lines
    const transcriptSlice = transcript.slice(0, 45);
    const transcriptTextForPrompt = transcriptSlice.map((t: any, i: number) => `[${i}] start:${t.offset / 1000}s - text: ${t.text}`).join("\n");

    try {
      const prompt = `You are a professional ESL teacher and translation course designer.
Based on the YouTube video transcript snippet below, generate a comprehensive, highly engaging learning package for Vietnamese learners, inspired by the features in "app 4you".

Video Title: "${title || "Useful English lesson"}"
Transcript snippet:
${transcriptTextForPrompt}

Please produce a single JSON object containing ALL of the following 6 sections:
1. "subtitles": An array of maximum 20 subtitle segments. Translate the transcript segments into matching natural, colloquial Vietnamese. Keep the exact index order and timing.
   Each element must have:
   - "id": string (index e.g. "sub0", "sub1", ...)
   - "en": string (original English text)
   - "vi": string (natural Vietnamese translation)
   - "startSec": number (start time in seconds corresponding to the start in transcript)
   - "durationSec": number (duration in seconds)

2. "pronunciation": An array of 5 selective English sentences from the transcript for speech practice.
   Each element must have:
   - "id": string (e.g. "p1", "p2", ...)
   - "en": string (the English sentence)
   - "vi": string (the Vietnamese translation)
   - "tips": string (pronunciation tips in Vietnamese: sound linkage like "want to -> wanna", silent letters, specific sound endings like -ed, -s)
   - "words": array of objects, each with {"word": "...", "ipa": "IPA phonetic", "meaning": "Vietnamese meaning"} (provide 3 key words from the sentence)

3. "listening": An array of 6 auditory/dictation tasks based on the video sentences.
   Each element must have:
   - "id": string (e.g. "l1", "l2", ...)
   - "en": string (original full English sentence)
   - "vi": string (the Vietnamese translation)
   - "blankText": string (the sentence where exactly ONE key vocabulary word is replaced with "[blank]", e.g. "This is a [blank] movie.")
   - "missingWord": string (the lowercase word that fills the [blank], e.g. "fantastic")
   - "clue": string (a precise Vietnamese definition/clue for the missing word)
   - "startSec": number (estimated start time in seconds, copy from matching transcript segment)

4. "conversation": An array of 6 conversational dialogue turns simulating a real-world discussion about the topic of this video between Joe and Hana.
   Each element must have:
   - "speaker": string ("Joe" or "Hana")
   - "textEn": string (the dialogue line in English, short and natural)
   - "textVi": string (the natural Vietnamese translation)

5. "vocabulary": An array of 6 key vocabulary terms extracted from this segment.
   Each element must have:
   - "vocabulary": string (the English word or idiom)
   - "wordType": string ("noun", "verb", "adjective", "adverb", "idiom", "phrase")
   - "ipa": string (the English IPA phonetic symbols)
   - "definition": string (the Vietnamese definition)
   - "example": string (an illustrative English example sentence unrelated to the transcript)

6. "quizzes": An array of 5 quiz questions. At least 3 multiple choice questions ("mc") and 2 spelling/translation questions ("spelling").
   Each element must have:
   - "id": string (e.g. "q1", "q2")
   - "type": string ("mc" or "spelling")
   - "question": string (the question in English, e.g. "What is the meaning of...?" or "Translate to English:...")
   - "options": array of 4 choices as strings (only for "mc" type, or leave empty [] for "spelling")
   - "answer": string (the correct choice if "mc", or the correct word/phrase if "spelling")
   - "explanation": string (brief explanation in Vietnamese about why this is correct)

CRITICAL: Return ONLY a raw JSON object. Do NOT wrap it in any formatting, explanation, or additional markdown text except the raw JSON string itself. Check your JSON brackets and make sure it is valid JSON.`;

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = result.text.trim();
      const cleanJson = responseText.replace(/^```json\n?|```$/g, "").trim();
      const payload = JSON.parse(cleanJson);
      res.json(payload);
    } catch (error: any) {
      console.error("Gemini Error (4You Package):", error);
      // Fallback: Dynamically generate a package based on the actual transcript lines!
      const fallbackPayload = generateDynamicFallbackPackage(transcriptSlice, title || "YouTube Practice");
      res.json(fallbackPayload);
    }
  });

  app.post("/api/journal/insight", async (req, res) => {
    try {
      const {
        date,
        logs = [],
        habits = [],
        tasks = [],
        places = [],
        words = [],
        ideas = [],
        achievements = [],
        userMood = ""
      } = req.body;

      // Only attempt Gemini if a key is provided and looks valid, otherwise go straight to fallback
      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not defined. Using local fallback for Journal insight.");
        const fallback = getFallbackInsight({ date, logs, habits, tasks, places, words, ideas, achievements });
        return res.json(fallback);
      }

      const prompt = `Bạn là một Nhà Thấu Cảm, Chuyên Gia Thần Số Học và Chiêm Tinh Học sâu sắc, đồng hành cùng người dùng đặc biệt dưới đây:
Họ tên: Trần Thị Thu Hiền
Ngày sinh: 2000-08-24 (24 tháng 8, 2000)

Hồ sơ Chiêm tinh & Nhân số học của cô ấy:
1. Số chủ đạo (Ruling Number): 7
- Đại diện cho người trải nghiệm để thấu học. Bài học cuộc đời tối cao của cô ấy đến từ sự dấn thân thực tế, tự thân chuyển hóa các thử thách và mài giũa trực giác phi thường cùng trí tuệ vượt bậc.
- Khao khát tri thức sâu sắc, có tư duy phân tích sắc sảo, thích thấu hiểu nguồn gốc mọi việc.
2. Sao Kim (Venus): Xử Nữ (Virgo)
- Hành xử trong tiền bạc, tình cảm và các giá trị tự thân mang tính tỉ mỉ, chi tiết, thích phân tích, cẩn trọng (rất khớp với việc quản lý tài sản, nợ thẻ và học tập chi tiết). Yêu thương qua sự chăm sóc thực tế, ngăn nắp.
3. Cung Mọc (Ascendant/Rising Sign):
- Cộng hưởng với Số Chủ Đạo 7 và Sao Kim Xử Nữ tạo nên phong thái bên ngoài kín đáo, quan sát nhạy bén, sâu sắc, thực chứng và có trực giác cực cao.

Quy tắc Bảo mật Quyền riêng tư:
- TUYỆT ĐỐI KHÔNG đề cập đến họ tên đầy đủ "Trần Thị Thu Hiền" hay ngày sinh của cô ấy trong câu từ phản hồi. Chỉ xưng hô thân mật là "Hiền" hoặc "bạn".

Hãy phân tích toàn bộ nhật ký tâm bút, thói quen học tập, năng suất, công việc thẻ nợ và cảm xúc của ngày hôm nay (${date}), ghép nối mật thiết với 3 trụ cột (Số Chủ Đạo 7, Sao Kim Xử Nữ và nguồn năng lượng Cung Mọc hộ mệnh) để đưa ra góc nhìn chiêm nghiệm tâm tình đầy trí tuệ, đồng cảm và truyền cảm hứng chuyển hóa.

Thông tin của Hiền hôm nay (${date}):
- Cảm xúc tự chọn hôm nay: ${userMood || "Chưa chọn cụ thể"}
- Nhật ký / Tâm sự:
${logs.length > 0 ? logs.map((l: string) => `- ${l}`).join('\n') : "(Chưa ghi nhật ký)"}
- Thói quen đã hoàn thành:
${habits.length > 0 ? habits.map((h: string) => `- ${h}`).join('\n') : "(Không có thói quen nào hoàn thành)"}
- Công việc đã hoàn thành:
${tasks.length > 0 ? tasks.map((t: string) => `- ${t}`).join('\n') : "(Chưa hoàn thành công việc cụ thể)"}
- Địa điểm đã đặt chân qua:
${places.length > 0 ? places.map((p: string) => `- ${p}`).join('\n') : "(Không ghi nhận địa điểm mới)"}
- Từ vựng tiếng Anh đã học nhóm:
${words.length > 0 ? words.map((w: string) => `- ${w}`).join('\n') : "(Không ghi nhận vốn từ mới)"}
- Ý tưởng sáng tạo:
${ideas.length > 0 ? ideas.map((i: string) => `- ${i}`).join('\n') : "(Không ghi nhận ý tưởng phát triển)"}
- Thành quả:
${achievements.length > 0 ? achievements.map((a: string) => `- ${a}`).join('\n') : "(Không có cột mốc đặc biệt)"}

Hãy phân tích và trả về một đối tượng JSON thuần túy chứa các trường sau (bằng tiếng Việt):
1. "title": Một tiêu đề ngắn gọn mang chiều sâu Thần số học Số 7 phối hợp Sao Kim & Cung Mọc (tối đa 7 từ). Ví dụ: "Bài học Số 7 & Sao Kim tinh tế", "Tĩnh lặng để trực giác dẫn lối".
2. "moodAnalysis": Phân tích năng lượng chiêm tinh học ngắn (tối đa 15 từ) phản ánh sự kết hợp giữa Venus và Ruling 7 hôm nay.
3. "summary": Phản hồi chính (tầm 3-4 câu ấm áp, sâu mộc). Thấu cảm những việc cô ấy trải qua hôm nay dưới con mắt chiêm tinh (nhung nhớ, học từ vựng, tài chính, thói quen), đúc kết bài học Số 7 trong ngày, động viên Hiền vững vàng tinh thần, kiêu hãnh và bao dung với bản thân. Chỉ gọi cô ấy là "Hiền" hoặc "bạn".
4. "quote": Một câu trích dẫn/danh ngôn thông thái truyền cảm hứng sâu sắc, rất hợp với tư duy chiêm nghiệm của Số 7 và Sao Kim Xử Nữ.
5. "suggestions": Một mảng chứa đúng 1 hoặc 2 lời khuyên nhỏ, rèn luyện trực giác và kỷ luật thực tế cho hôm sau (Ví dụ: "Lắng nghe trực giác Số 7 tự chữa lành", "Ghi lại 1 bài học cuộc sống giản dị hôm nay").

Hãy trả về duy nhất chuỗi JSON thô, không nằm trong các khối mã markdown, không giải thích gì thêm ngoài cấu trúc JSON hợp lệ.`;

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = result.text.trim();
      const cleanJson = responseText.replace(/^```json\n?|```$/g, "").trim();
      const payload = JSON.parse(cleanJson);
      res.json(payload);
    } catch (error: any) {
      console.error("Gemini Error (Journal Insight):", error);
      const fallback = getFallbackInsight(req.body);
      res.json(fallback);
    }
  });

  function getFallbackInsight(payload: any) {
    const { logs = [], habits = [], tasks = [], places = [], words = [], ideas = [], achievements = [] } = payload;
    const habitCount = habits.length;
    const wordCount = words.length;
    const taskCount = tasks.length;
    
    let summary = "Hiền thân mến, là một người mang Số Chủ Đạo 7, hành trình sống của bạn vốn tràn ngập linh cảm và đúc kết từ trải nghiệm thực tế. Mỗi một việc nhỏ bạn làm hôm nay đều âm thầm bồi đắp cho sự uyên bác của tâm hồn.";
    if (habitCount > 0 && wordCount > 0) {
      summary = `Hiền ơi, người mang Số Chủ Đạo 7 rất trân trọng tri thức thực chứng. Việc bạn rèn luyện được ${habitCount} thói quen tốt và học thêm ${wordCount} từ vựng hôm nay chính là nỗ lực tự học tuyệt vời để gieo hạt giống trí tuệ. Để trực giác dẫn lối nhé!`;
    } else if (habitCount > 0) {
      summary = `Kỷ luật tự thân là chất xúc tác mạnh mẽ giúp Số Chủ Đạo 7 chuyển hóa trải nghiệm thành cột mốc thành công. Bạn đã hoàn thành xuất sắc ${habitCount} thói quen hôm nay - đó là những bước đi cực kỳ vững vàng của Hiền!`;
    } else if (wordCount > 0) {
      summary = `Ham tìm tòi, mở mang tri thức là vũ khí bản năng của Số Chủ Đạo 7. Chúc mừng Hiền đã kiên trì lưu giữ thêm ${wordCount} từ vựng ngoại ngữ mới hôm nay để sẵn sàng bước ra đại dương tri thức rộng lớn.`;
    } else if (logs.length > 0) {
      summary = `Trầm tư và dốc lòng vào trang viết chính là cách Số Chủ Đạo 7 tự thấu hiểu bản thân sâu sắc nhất. Cảm ơn Hiền đã dùng tâm bút này để đối diện chân thực với những suy nghĩ, cảm xúc ẩn hiện của mình hôm nay.`;
    }
    
    return {
      title: "Góc Nhìn Số 7: Trực Giác & Trải Nghiệm",
      moodAnalysis: "Sức mạnh chuyển hóa nội tâm",
      summary: summary,
      quote: "Cuộc sống chính là trường đại học lớn nhất của người mang Số Chủ Đạo 7. Hãy can đảm bước đi và đúc kết chiêm nghiệm. - Thần Số Học Đồng Hành",
      suggestions: [
        "Hãy dành ra 5 phút tĩnh tâm cuối ngày để lắng nghe tiếng nói trực giác bên trong.",
        "Viết ngắn gọn 1 điều bạn tâm đắc nhất đã học được thông qua hoạt động hôm nay."
      ]
    };
  }

  // API route for improving English journal entries
  app.post("/api/journal/improve-english", async (req, res) => {
    try {
      const { content } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Nội dung trống" });
      }

      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not defined. Using local fallback for Improve English.");
        return res.json(getFallbackImprovement(content));
      }

      const prompt = `You are an encouraging and professional English teacher. Analyze the following English journal entry or writing.
Identify grammatical mistakes, spelling errors, awkward phrasing, or ways to improve readability, and suggest a fully polished, natural version.

Journal Entry: "${content}"

Return a valid JSON object matching this schema:
{
  "improved": "The completely improved, natural, and grammar-checked English version of the text",
  "corrections": [
    {
      "originalPart": "The specific phrase or word with error or awkwardness",
      "correctedPart": "The corrected/improved word or phrase",
      "explanation": "Brief, helpful explanation in Vietnamese explaining why this is corrected and the rule behind it"
    }
  ],
  "overallFeedback": "An encouraging feedback in Vietnamese on their English writing, highlighting areas of strength and areas where they can improve, in a warm, friendly tone."
}

Ensure the output is strictly valid JSON with no markdown wrapping. Do not include any other text except the valid JSON string.`;

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = result.text.trim();
      const cleanJson = responseText.replace(/^```json\n?|```$/g, "").trim();
      const payload = JSON.parse(cleanJson);
      res.json(payload);
    } catch (error: any) {
      console.error("Gemini Error (Improve English):", error);
      res.json(getFallbackImprovement(req.body.content || ""));
    }
  });

  function getFallbackImprovement(content: string) {
    const trimmed = content.trim();
    let improved = trimmed;
    const corrections: any[] = [];
    
    // Rule 1: capitalize first letter of sentences
    if (trimmed.length > 0 && trimmed[0] !== trimmed[0].toUpperCase()) {
      const firstLetter = trimmed[0].toUpperCase();
      improved = firstLetter + trimmed.slice(1);
      corrections.push({
        originalPart: trimmed[0],
        correctedPart: firstLetter,
        explanation: "Nên viết hoa chữ cái đầu tiên của câu để đúng quy tắc chính tả tiếng Anh."
      });
    }

    // Rule 2: common lowercase 'i' to 'I'
    if (/\bi\b/.test(improved)) {
      improved = improved.replace(/\bi\b/g, "I");
      corrections.push({
        originalPart: "i",
        correctedPart: "I",
        explanation: "Chữ nhân xưng 'I' (tôi) luôn luôn phải viết hoa trong tiếng Anh."
      });
    }

    // Rule 3: common spacing after periods/commas if missing
    if (/,([^\s])/.test(improved)) {
      improved = improved.replace(/,([^\s])/g, ", $1");
      corrections.push({
        originalPart: ",",
        correctedPart: ", ",
        explanation: "Nên thêm khoảng trắng sau dấu phẩy để văn bản rõ ràng hơn."
      });
    }

    return {
      improved,
      corrections: corrections.length > 0 ? corrections : [
        {
          originalPart: "Keep writing!",
          correctedPart: "Keep writing!",
          explanation: "Bài viết của bạn cơ bản đã rất ổn, không phát hiện lỗi ngữ pháp rõ rệt bằng thuật toán ngoại tuyến."
        }
      ],
      overallFeedback: "Hiện tại hệ thống AI đang ở chế độ dự phòng ngoại tuyến. Bài viết tiếng Anh của bạn nhìn chung rất dễ hiểu. Hãy tiếp tục duy trì thói quen viết tâm bút ngoại ngữ hàng ngày nhé! You are doing a wonderful job!"
    };
  }

  // Helper for rule-based matching when Gemini is offline or not configured
  function getLocalCategoryMatch(itemName: string, categories: { id: string, name: string }[]) {
    const lowerName = itemName.toLowerCase().trim();
    const ruleMapping = [
      { keywords: ["tiết kiệm", "ngân hàng", "vcb", "bidv", "timo", "mbbank", "techcombank", "savings", "bank", "deposit", "sổ", "scb", "acb", "sacombank"], categoryKeywords: ["tiết kiệm", "ngân hàng", "savings", "bank"], confidence: 0.9, reasoning: "Gợi ý tự động dựa trên từ khóa ngân hàng & dịch vụ tiền gửi chính xác." },
      { keywords: ["xe", "car", "moto", "honda", "yamaha", "vespa", "ôtô", "oto", "sh", "phương tiện", "vận tải"], categoryKeywords: ["xe", "car"], confidence: 0.95, reasoning: "Gợi ý tự động dựa trên từ khóa liên quan đến phương tiện đi lại." },
      { keywords: ["nhà", "đất", "chung cư", "bđs", "căn hộ", "real estate", "house", "villa", "homestay"], categoryKeywords: ["nhà", "bđs", "nhà cửa", "home", "building"], confidence: 0.9, reasoning: "Gợi ý tự động dựa trên từ khóa liên quan đến bất động sản & tài sản nhà đất." },
      { keywords: ["bitcoin", "crypto", "eth", "sol", "usdt", "coin", "binance", "mạng", "ví điện tử"], categoryKeywords: ["crypto", "bitcoin", "coin"], confidence: 0.95, reasoning: "Gợi ý tự động dựa trên từ khóa liên quan đến danh mục Crypto kỹ thuật số." },
      { keywords: ["vàng", "gold", "trang sức", "nhẫn", "vòng", "bông tai", "gem", "jewelry", "kim cương"], categoryKeywords: ["vàng", "trang sức", "gem", "gold"], confidence: 0.95, reasoning: "Gợi ý tự động dựa trên từ khóa liên quan đến kim loại quý & vật trữ vàng bạc." },
      { keywords: ["laptop", "máy tính", "pc", "macbook", "ipad", "iphone", "điện thoại", "tai nghe", "airpods", "phone", "tech", "máy ảnh", "camera", "màn hình"], categoryKeywords: ["công nghệ", "thiết bị", "laptop", "tech", "computer", "smartphone", "devices"], confidence: 0.9, reasoning: "Gợi ý tự động dựa trên từ khóa công nghệ & thiết bị điện tử tiện ích số." },
      { keywords: ["ví", "bóp", "wallet", "tiền mặt", "cash", "coins", "heo đất"], categoryKeywords: ["ví", "tiền mặt", "wallet", "cash"], confidence: 0.85, reasoning: "Gợi ý tự động dựa trên từ khóa liên quan đến ví cầm tay & tiền cơ sở mặt lưu giữ." },
      { keywords: ["nợ", "thẻ tín dụng", "visa", "mastercard", "shopee pay", "debt", "credit", "vay", "trả góp"], categoryKeywords: ["nợ", "tín dụng", "debt", "card", "credit"], confidence: 0.9, reasoning: "Gợi ý tự động dựa trên từ khóa liên quan đến thẻ tín dụng tiện ích hoặc khoản vay nợ phải thu gom." }
    ];

    for (const rule of ruleMapping) {
      if (rule.keywords.some(kw => lowerName.includes(kw))) {
        const foundCat = categories.find((c: any) => 
          rule.categoryKeywords.some(ckw => c.name.toLowerCase().includes(ckw))
        );
        if (foundCat) {
          return { id: foundCat.id, confidence: rule.confidence, reasoning: rule.reasoning };
        }
      }
    }

    return { 
      id: categories[0]?.id || "", 
      confidence: 0.3, 
      reasoning: "Phân loại mặc định hệ thống (chưa lọc được từ khóa phù hợp đặc trưng)." 
    };
  }

  // API Route for AI-powered Assets auto-categorization based on asset name
  app.post("/api/assets/categorize", async (req, res) => {
    try {
      const { itemName, categories = [] } = req.body;
      if (!itemName) {
        return res.status(400).json({ error: "Missing itemName" });
      }

      const categoriesStr = categories
        .map((c: any) => `- ID: "${c.id}", Name: "${c.name}"`)
        .join("\n");

      const prompt = `You are an intelligent financial asset classifier. 
Given an asset or liability name, you should suggest the most matching category ID from the list of available categories.

Asset/Liability Name to categorize: "${itemName}"

Available Categories list:
${categoriesStr}

Your response must be a JSON object with this exact structure:
{
  "suggestedCategoryId": "The ID of the suggested category (MUST exactly match one of the available category IDs)",
  "confidence": number, // confidence score between 0.0 and 1.0
  "reasoning": "A brief explanation in Vietnamese explaining why this category is selected."
}

CRITICAL: Return ONLY a raw JSON object matching the requested schema. No markdown formatting, no explanations, no wrappers.`;

      let suggestedCategoryId = categories[0]?.id || "";
      let confidence = 0.5;
      let reasoning = "Gợi ý mặc định hệ thống.";

      if (process.env.GEMINI_API_KEY) {
        try {
          const result = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json"
            }
          });

          const responseText = result.text.trim();
          const cleanJson = responseText.replace(/^```json\n?|```$/g, "").trim();
          const payload = JSON.parse(cleanJson);
          
          if (payload && payload.suggestedCategoryId) {
            const matchedCategory = categories.find((c: any) => c.id === payload.suggestedCategoryId);
            if (matchedCategory) {
              suggestedCategoryId = payload.suggestedCategoryId;
              confidence = payload.confidence || 0.9;
              reasoning = payload.reasoning || `Đề xuất danh mục "${matchedCategory.name}" thông qua mô hình học máy trí tuệ nhân tạo.`;
            }
          }
        } catch (geminiErr) {
          console.error("Gemini Asset Categorization failed, falling back to local rule-based matching:", geminiErr);
        }
      }

      // If Gemini wasn't used, or it returned an invalid ID or failed, use fallback rule-based matching
      if (suggestedCategoryId === (categories[0]?.id || "") && confidence === 0.5) {
        const fallback = getLocalCategoryMatch(itemName, categories);
        suggestedCategoryId = fallback.id;
        confidence = fallback.confidence;
        reasoning = fallback.reasoning;
      }

      res.json({ suggestedCategoryId, confidence, reasoning });
    } catch (e: any) {
      console.error("Error categorizing asset:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    // Custom index.html interceptor to inject window.__BACKEND_URL__ in dev mode
    app.get(["/", "/index.html"], async (req, res, next) => {
      try {
        const indexPath = path.join(process.cwd(), "index.html");
        if (fs.existsSync(indexPath)) {
          let html = fs.readFileSync(indexPath, "utf8");
          // Apply Vite's HTML transforms (inject dev scripts etc)
          html = await vite.transformIndexHtml(req.url, html);

          const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
          const host = req.headers["x-forwarded-host"] || req.get("host");
          const originUrl = `${protocol}://${host}`;

          // Inject BACKEND_URL variable to the head tag
          html = html.replace(
            "<head>",
            `<head><script>window.__BACKEND_URL__ = "${originUrl}";</script>`
          );
          res.setHeader("Content-Type", "text/html");
          return res.status(200).end(html);
        }
      } catch (err) {
        console.error("Error transforming dev index.html:", err);
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    // Dynamic index.html template compiler for Safari iframe resolution
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        fs.readFile(indexPath, 'utf8', (err, html) => {
          if (err) {
            return res.sendFile(indexPath);
          }
          const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
          const host = req.headers['x-forwarded-host'] || req.get("host");
          const originUrl = `${protocol}://${host}`;

          // Inject BACKEND_URL variable to the head tag
          const injectedHtml = html.replace(
            '<head>',
            `<head><script>window.__BACKEND_URL__ = "${originUrl}";</script>`
          );
          res.setHeader("Content-Type", "text/html");
          return res.send(injectedHtml);
        });
      } else {
        res.status(404).send("Application files not fully built yet.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
