import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { YoutubeTranscript } from 'youtube-transcript';

async function startServer() {
  const app = express();
  const PORT = 3000;

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

      const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
      res.json({ transcript });
    } catch (error: any) {
      if (error.message?.includes('Transcript is disabled')) {
         return res.status(404).json({ error: "Phụ đề tự động của video này đã bị tắt hoặc quyền truy cập bị YouTube chặn." });
      }
      res.status(500).json({ error: "Lỗi nội bộ khi tải phụ đề tự động. Vui lòng cung cấp phụ đề thủ công." });
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
