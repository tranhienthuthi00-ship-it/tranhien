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
      const result = await model.generateContent(`Generate one natural, medium-difficulty Vietnamese sentence for translation practice. Topic: ${topic}. Output ONLY the raw Vietnamese text. No quotes, no translation, no labels.`);
      
      const sentence = result.response.text().trim().replace(/^["']|["']$/g, '');
      
      console.log(`[Translation] Generated: ${sentence}`);
      
      if (!sentence || sentence.length < 5) {
        throw new Error("Invalid response from Gemini");
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

    console.log(`[Translation] Analyzing: "${original}" -> "${translation}"`);

    try {
      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
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
      res.status(500).json({ error: "Failed to evaluate translation" });
    }
  });

  app.post("/api/translation/hints", async (req, res) => {
    const { original, reference } = req.body;
    if (!original || !reference) {
      return res.status(400).json({ error: "Missing original or reference" });
    }

    try {
      const model = ai.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent(`Analyze this translation pair:
Vietnamese: "${original}"
English: "${reference}"

Extract 2-3 key grammar points, phrases, or phrasal verbs from the English version that a learner should know. 
Return ONLY a valid JSON array of strings in Vietnamese explaining these points.
Example: ["Sử dụng 'Look forward to' khi...", "Cấu trúc 'It takes someone time to do'..." ]`);
      
      const responseText = result.response.text().trim();
      const cleanJson = responseText.replace(/^```json\n?|```$/g, "").trim();
      const hints = JSON.parse(cleanJson);
      res.json({ hints });
    } catch (error: any) {
      console.error("Gemini Error (Hints):", error);
      res.status(500).json({ error: "Failed to generate hints" });
    }
  });

  app.post("/api/translation/define-word", async (req, res) => {
    const { word } = req.body;
    if (!word) {
      return res.status(400).json({ error: "Missing word" });
    }

    try {
      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
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
      res.status(500).json({ error: "Failed to define word" });
    }
  });

  app.post("/api/translation/translate-line", async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing text" });
    }

    try {
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(`Translate the following English subtitle or line to natural, context-aware Vietnamese.
We are translating a subtitle/caption line inside a video, so please keep the translation natural, human-like, brief, and matching the original sentence's style and emotion. Do NOT do literal/word-for-word translation.
Return ONLY the raw translated text, without quotes, explanations, or markdown.

English: "${text}"`);
      
      const translation = result.response.text().trim().replace(/^["']|["']$/g, '');
      res.json({ translation });
    } catch (error: any) {
      console.error("Gemini Error (Translate Line):", error);
      res.status(500).json({ error: "Failed to translate line" });
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
      res.status(500).json({ error: "Failed to evaluate answer" });
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
