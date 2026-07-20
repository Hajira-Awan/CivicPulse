import { Hono } from "hono";
import { db } from "../db/index.js";
import { aiAnalyses, reports, reportImages } from "../db/schema.js";
import { v4 as uuid } from "uuid";
import { authMiddleware } from "../middleware/auth.js";
import { analyzeImage, chatWithAI, verifyResolution } from "../services/gemini.js";
import { eq, and } from "drizzle-orm";

const ai = new Hono();

// POST /api/ai/analyze-image
ai.post("/analyze-image", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { imageBase64, mimeType, reportId } = body;

    if (!imageBase64) {
      return c.json({ error: "imageBase64 is required" }, 400);
    }

    const result = await analyzeImage(imageBase64, mimeType || "image/jpeg");
    const now = new Date().toISOString();

    // Save analysis
    const analysisId = uuid();
    db.insert(aiAnalyses).values({
      id: analysisId,
      reportId: reportId || null,
      suggestedCategory: result.category,
      suggestedSeverity: result.severity,
      suggestedDescription: result.description,
      suggestedDepartment: result.department,
      confidence: result.confidence,
      createdAt: now,
    }).run();

    return c.json({ analysis: result, analysisId });
  } catch (err: any) {
    console.error("AI analyze error:", err);
    return c.json({ error: "AI analysis failed" }, 500);
  }
});

// POST /api/ai/verify-resolution
ai.post("/verify-resolution", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { imageBase64, mimeType, reportId } = body;

    if (!imageBase64) {
      return c.json({ error: "imageBase64 is required" }, 400);
    }
    if (!reportId) {
      return c.json({ error: "reportId is required" }, 400);
    }

    // Fetch report info
    const report = db.select().from(reports).where(eq(reports.id, reportId)).get();
    if (!report) {
      return c.json({ error: "Report not found" }, 404);
    }

    // Try to find a before image to compare
    let beforeImageBase64: string | null = null;
    const beforeImage = db.select().from(reportImages)
      .where(and(eq(reportImages.reportId, reportId), eq(reportImages.type, "before")))
      .get();

    if (beforeImage) {
      try {
        const path = await import("path");
        const fs = await import("fs");
        const { fileURLToPath } = await import("url");
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        
        // resolve filepath on disk: beforeImage.url starts with "/uploads/"
        const uploadsDir = path.join(__dirname, "..", "..", beforeImage.url);
        if (fs.existsSync(uploadsDir)) {
          beforeImageBase64 = fs.readFileSync(uploadsDir, { encoding: "base64" });
        }
      } catch (err) {
        console.error("Failed to read before image from disk:", err);
      }
    }

    const result = await verifyResolution(
      reportId,
      beforeImageBase64,
      imageBase64,
      report.category,
      report.description || ""
    );

    return c.json({ result });
  } catch (err: any) {
    console.error("AI verify resolution error:", err);
    return c.json({ error: "AI resolution verification failed" }, 500);
  }
});

// POST /api/ai/chat
ai.post("/chat", authMiddleware, async (c) => {
  try {
    const { message, history } = await c.req.json();
    if (!message) {
      return c.json({ error: "Message is required" }, 400);
    }

    const response = await chatWithAI(message, history || []);
    return c.json({ response });
  } catch (err: any) {
    console.error("AI chat error:", err);
    return c.json({ error: "Chat failed" }, 500);
  }
});

export default ai;

