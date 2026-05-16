import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { YoutubeTranscript } from 'youtube-transcript';
import { Innertube } from 'youtubei.js';
import { createRequire } from 'module';
import { GoogleGenAI, Type } from "@google/genai";

const require = createRequire(import.meta.url);
const { getSubtitles } = require('youtube-captions-scraper');

// Gemini Initialization
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const ai: any = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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

  // API route for fetching YouTube Transcript
  app.get("/api/transcript", async (req, res) => {
    const videoId = req.query.videoId as string;
    if (!videoId || videoId.length !== 11) {
      return res.status(400).json({ error: "videoId is invalid (must be 11 characters)" });
    }

    console.log(`[Transcript] Requesting ID: ${videoId}`);
    
    let transcriptData: any = null;
    let lastError = "";

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

    if (transcriptData) {
      return res.json({ transcript: transcriptData });
    }

    console.error(`[Transcript] All methods failed for video ${videoId}. Last error: ${lastError}`);
    return res.status(404).json({ 
      error: `Không thể lấy được phụ đề cho video này. ${lastError ? `(${lastError})` : ""} Vui lòng kiểm tra xem video có phụ đề (CC) hay không, hoặc thử dán phụ đề thủ công.` 
    });
  });

  // NEW: Translation Practice Endpoints
  app.get("/api/translation/sentence", async (req, res) => {
    const topic = req.query.topic as string || "daily life";
    console.log(`[Translation] Generating sentence for topic: ${topic}`);
    try {
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(`Generate one natural, medium-difficulty Vietnamese sentence for translation practice into English. Topic: ${topic}. Output ONLY the Vietnamese sentence text, no tags, no translation, no quotes.`);
      const response = await result.response;
      const sentence = response.text().trim().replace(/^["']|["']$/g, '');
      
      console.log(`[Translation] Generated: ${sentence}`);
      
      if (!sentence) {
        throw new Error("Empty response from Gemini");
      }

      res.json({ sentence });
    } catch (error: any) {
      console.error("Gemini Error (Sentence):", error);
      res.status(500).json({ error: "Failed to generate sentence" });
    }
  });

  app.post("/api/translation/evaluate", async (req, res) => {
    const { original, translation } = req.body;
    if (!original || !translation) {
      return res.status(400).json({ error: "Missing original or translation" });
    }

    console.log(`[Translation] Evaluating: "${original}" -> "${translation}"`);

    try {
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `Evaluate this translation from Vietnamese to English.
Original (VN): ${original}
Translation (EN): ${translation}

Provide:
1. A score from 0-100 based on accuracy, grammar, and naturalness.
2. A corrected or more natural English version.
3. Concise feedback in Vietnamese explaining any errors or suggesting better phrasing.
4. 3-5 key vocabulary words/phrases from the sentence with their meanings in Vietnamese.`
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              corrected: { type: Type.STRING },
              feedback: { type: Type.STRING },
              vocabulary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    meaning: { type: Type.STRING }
                  }
                }
              }
            },
            required: ["score", "corrected", "feedback", "vocabulary"]
          }
        }
      });

      const response = await result.response;
      const text = response.text();
      const resultData = JSON.parse(text.trim());
      console.log(`[Translation] Score: ${resultData.score}`);
      res.json(resultData);
    } catch (error: any) {
      console.error("Gemini Error (Evaluate):", error);
      res.status(500).json({ error: "Failed to evaluate translation" });
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
