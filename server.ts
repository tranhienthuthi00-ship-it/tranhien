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
      res.status(500).json({ error: "Failed to evaluate translation" });
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
      res.status(500).json({ error: "Failed to define word" });
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
      // Fallback data package to avoid crashing in case of failure or network issues
      const fallbackPayload = {
        subtitles: transcriptSlice.slice(0, 15).map((t: any, i: number) => ({
          id: `sub${i}`,
          en: t.text,
          vi: `[Bản dịch tiếng Việt tự động cho câu]: ${t.text}`,
          startSec: t.offset / 1000,
          durationSec: (t.duration || 3000) / 1000
        })),
        pronunciation: [
          {
            id: "p1",
            en: "This is a great opportunity for us to learn English.",
            vi: "Đây là một cơ hội tuyệt vời để chúng ta học tiếng Anh.",
            tips: "Nối âm: 'great_opportunity' đọc mềm mại thành 'grea-topportunity'. Chú ý âm đuôi /t/ trong từ 'great'.",
            words: [
              { word: "opportunity", ipa: "/ˌɒp.əˈtʃuː.nə.ti/", meaning: "cơ hội" },
              { word: "great", ipa: "/ɡreɪt/", meaning: "tuyệt vời" },
              { word: "learn", ipa: "/lɜːn/", meaning: "học tập" }
            ]
          }
        ],
        listening: [
          {
            id: "l1",
            en: "Practice makes perfect when learning a new language.",
            vi: "Có công mài sắt có ngày nên kim khi học một ngôn ngữ mới.",
            blankText: "Practice makes [blank] when learning a new language.",
            missingWord: "perfect",
            clue: "hoàn hảo, tuyệt hảo",
            startSec: transcriptSlice[0]?.offset ? transcriptSlice[0].offset / 1000 : 2
          }
        ],
        conversation: [
          { speaker: "Joe", textEn: "Have you watched this YouTube video yet?", textVi: "Cậu đã xem video YouTube này chưa?" },
          { speaker: "Hana", textEn: "Yes, it contains so many useful English words!", textVi: "Rồi, nó chứa rất nhiều từ vựng tiếng Anh bổ ích đấy!" },
          { speaker: "Joe", textEn: "Should we practice shadowing and translating it?", textVi: "Chúng mình có nên luyện tập bắt chước giọng và dịch nó không?" },
          { speaker: "Hana", textEn: "Absolutely, app 4you style is fantastic for learners.", textVi: "Chắc chắn rồi, học kiểu app 4you cực kỳ đỉnh cho người học luôn." }
        ],
        vocabulary: [
          { vocabulary: "opportunity", wordType: "noun", ipa: "/ˌɒp.əˈtʃuː.nə.ti/", definition: "Cơ hội, dịp may", example: "Don't miss this rare opportunity to speak English." },
          { vocabulary: "shadowing", wordType: "noun", ipa: "/ˈʃæd.əʊ.ɪŋ/", definition: "Phương pháp luyện nói bắt chước âm điệu", example: "Shadowing helps improve accent and natural rhythm." }
        ],
        quizzes: [
          {
            id: "q1",
            type: "mc",
            question: "What is the meaning of the word 'opportunity'?",
            options: ["Cơ hội", "Khó khăn", "Kế hoạch", "Thất bại"],
            answer: "Cơ hội",
            explanation: "'Opportunity' có nghĩa là cơ hội thuận lợi trong cuộc sống."
          }
        ]
      };
      res.json(fallbackPayload);
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
