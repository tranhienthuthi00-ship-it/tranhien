import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "empty" });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const topic = req.query.topic as string || "daily life";

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate one natural, medium-difficulty Vietnamese sentence for translation practice. Topic: ${topic}. Output ONLY the raw Vietnamese text. No quotes, no translation, no labels.`
    });
    
    const sentence = result.text?.trim().replace(/^["']|["']$/g, '');
    
    if (!sentence || sentence.length < 5) {
      throw new Error("Invalid response from Gemini");
    }

    return res.status(200).json({ sentence });
  } catch (error: any) {
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
    return res.status(200).json({ sentence: OFFLINE_SENTENCES[randomIdx] });
  }
}
