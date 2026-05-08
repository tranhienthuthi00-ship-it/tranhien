import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { YoutubeTranscript } from 'youtube-transcript';
import { Innertube } from 'youtubei.js';

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  let yt: any = null;
  Innertube.create().then(inner => {
     yt = inner;
     console.log("YouTube InnerTube client initialized");
  }).catch(err => {
     console.error("Failed to initialize YouTube client:", err);
  });

  // Add CORS headers for API routes
  app.use("/api", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  // API route for fetching YouTube Transcript
  app.get("/api/transcript", async (req, res) => {
    try {
      const videoId = req.query.videoId as string;
      if (!videoId) {
        return res.status(400).json({ error: "videoId is required" });
      }

      console.log(`Fetching transcript for videoId: ${videoId}`);
      
      let transcript;

      // Method 1: Try YouTubei.js (Most robust)
      if (yt) {
        try {
          console.log("Trying YouTubei.js...");
          const info = await yt.getInfo(videoId);
          const transcriptData = await info.getTranscript();
          
          if (transcriptData && transcriptData.transcript?.content?.body?.initial_segments) {
             const segments = transcriptData.transcript.content.body.initial_segments;
             transcript = segments.map((s: any) => ({
                text: s.snippet?.text || s.text || "",
                offset: parseInt(s.start_ms || "0"),
                duration: parseInt(s.duration_ms || "0")
             }));
             console.log("YouTubei.js transcript fetch successful");
          }
        } catch (e) {
          console.log("YouTubei.js failed:", e instanceof Error ? e.message : String(e));
        }
      }

      // Method 2: Fallback to YoutubeTranscript library
      if (!transcript) {
        try {
          console.log("Trying YoutubeTranscript fallback...");
          transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
        } catch (e) {
          console.log(`Failed to fetch 'en' transcript, trying default...`);
          transcript = await YoutubeTranscript.fetchTranscript(videoId);
        }
      }
      
      if (!transcript) {
         throw new Error("Could not find transcript using any method");
      }

      res.json({ transcript });
    } catch (error: any) {
      console.error("Transcript fetch error:", error);
      if (error.message?.includes('Transcript is disabled') || error.message?.includes('not available')) {
         return res.status(404).json({ error: "Phụ đề của video này đã bị tắt hoặc không tồn tại." });
      }
      res.status(500).json({ error: `Lỗi khi tải phụ đề: ${error.message}. Vui lòng dán thủ công.` });
    }
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
