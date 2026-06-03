import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "empty" });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { original, reference } = req.body || {};
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
      
    const responseText = result.text?.trim() || "";
    const cleanJson = responseText.replace(/^```json\n?|```$/g, "").trim();
    const hints = JSON.parse(cleanJson);
    return res.status(200).json({ hints });
  } catch (error: any) {
    return res.status(500).json({ error: "Failed to generate hints" });
  }
}
