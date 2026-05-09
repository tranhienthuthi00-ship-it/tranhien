import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { YoutubeTranscript } from 'youtube-transcript';
import { Innertube } from 'youtubei.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { getSubtitles } = require('youtube-captions-scraper');

async function startServer() {
  const app = express();
  const PORT = 3000;
  
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

  // API route for fetching YouTube Transcript
  app.get("/api/transcript", async (req, res) => {
    const videoId = req.query.videoId as string;
    if (!videoId || videoId.length !== 11) {
      return res.status(400).json({ error: "videoId is invalid (must be 11 characters)" });
    }

    console.log(`[Transcript] Requesting ID: ${videoId}`);
    
    let transcriptData: any = null;
    let lastError = "";

    // Method 1: YouTubei.js (Most robust as it mimics the InnerTube client)
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
        } else {
           console.warn(`[Transcript] YouTubei.js: No segments found in response`);
           lastError = "Loại video này không cung cấp dữ liệu phụ đề qua giao thức thông thường.";
        }
      } catch (e: any) {
        lastError = e.message;
        console.warn(`[Transcript] YouTubei.js Failed: ${e.message}`);
      }
    }

    // Method 2: youtube-transcript (Commonly used, parses HTML)
    if (!transcriptData) {
      try {
        console.log(`[Transcript] Method: youtube-transcript - Trying English`);
        transcriptData = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
        console.log(`[Transcript] youtube-transcript (en) Success`);
      } catch (e: any) {
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

    // Method 3: youtube-captions-scraper fallback
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

    if (transcriptData) {
      return res.json({ transcript: transcriptData });
    }

    // Final fallback message
    console.error(`[Transcript] All methods failed for video ${videoId}. Last error: ${lastError}`);
    
    let userMessage = "Không thể lấy phụ đề tự động.";
    if (lastError.includes("Could not find captions")) {
       userMessage = "Video này không có phụ đề (CC). Hãy chọn video khác hoặc dán phụ đề thủ công.";
    } else if (lastError.includes("403") || lastError.includes("429")) {
       userMessage = "YouTube đang chặn các yêu cầu tự động. Vui lòng dán phụ đề thủ công bằng cách Copy từ YouTube.";
    } else if (lastError.includes("Transcription is disabled")) {
       userMessage = "Chủ sở hữu video đã tắt tính năng lấy phụ đề.";
    }

    return res.status(404).json({ 
      error: userMessage,
      details: lastError
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
