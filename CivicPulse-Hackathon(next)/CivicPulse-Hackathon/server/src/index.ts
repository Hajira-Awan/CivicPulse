import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { initializeDatabase } from "./db/index.js";
import authRoutes from "./routes/auth.js";
import reportRoutes from "./routes/reports.js";
import aiRoutes from "./routes/ai.js";
import analyticsRoutes from "./routes/analytics.js";
import notificationRoutes from "./routes/notifications.js";
import adminRoutes from "./routes/admin.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize database
initializeDatabase();

const app = new Hono();

// CORS
app.use("*", cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

// Serve uploaded files
app.use("/uploads/*", serveStatic({ root: path.join(__dirname, "..") }));

// API Routes
app.route("/api/auth", authRoutes);
app.route("/api/reports", reportRoutes);
app.route("/api/ai", aiRoutes);
app.route("/api/analytics", analyticsRoutes);
app.route("/api/notifications", notificationRoutes);
app.route("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

const port = parseInt(process.env.PORT || "3001");

console.log(`\n🚀 CivicPulse API server running on http://localhost:${port}`);
console.log(`   Health: http://localhost:${port}/api/health`);
console.log(`   Auth:   http://localhost:${port}/api/auth/login`);

serve({ fetch: app.fetch, port });
