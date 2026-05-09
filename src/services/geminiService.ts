import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

export const geminiService = {
  /**
   * Use Gemini to fix punctuation and formatting of raw transcript text
   */
  async formatTranscript(rawText: string): Promise<string> {
    if (!rawText.trim()) return "";
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `The following text is an auto-generated English transcript without punctuation. 
Please add proper punctuation (periods, commas, capitalization) and format it into clear sentences. 
Maintain the original wording as much as possible. 
Return ONLY the formatted text, nothing else.

TEXT:
${rawText}`,
      });

      return response.text?.trim() || rawText;
    } catch (error) {
      console.error("Gemini formatting error:", error);
      throw error;
    }
  },

  /**
   * Use Gemini with Search to find a transcript if the URL doesn't work with standard methods
   */
  async fetchTranscriptWithAI(videoUrl: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Hãy tìm phụ đề tiếng Anh cho video YouTube này: ${videoUrl}.
Nếu bạn có thể truy cập nội dung hoặc tìm thấy transcript, hãy trả về toàn bộ nội dung text của transcript đó.
Nếu không tìm thấy, hãy thử tìm lời thoại (lyrics/script) của video này dựa trên URL.
Chỉ trả về nội dung text của transcript, không thêm lời dẫn giải.`,
        config: {
          tools: [
            { googleSearch: {} }
          ],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      });

      return response.text?.trim() || "";
    } catch (error) {
      console.error("Gemini fetch error:", error);
      throw error;
    }
  },

  /**
   * Generic prompt interface for the user to custom query
   */
  async customPrompt(prompt: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text?.trim() || "";
    } catch (error) {
      console.error("Gemini error:", error);
      throw error;
    }
  }
};
