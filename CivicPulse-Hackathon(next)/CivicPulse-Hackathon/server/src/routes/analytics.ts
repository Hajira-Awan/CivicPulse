import { Hono } from "hono";
import { db } from "../db/index.js";
import { reports, users, badges, userBadges } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";

const analytics = new Hono();

// GET /api/analytics/dashboard
analytics.get("/dashboard", async (c) => {
  const allReports = db.select().from(reports).all();
  const totalReports = allReports.length;
  const resolved = allReports.filter(r => r.status === "Resolved").length;
  const criticalOpen = allReports.filter(r => r.priority.includes("P1") && r.status !== "Resolved").length;
  const totalUpvotes = allReports.reduce((sum, r) => sum + r.upvoteCount, 0);
  const resolutionRate = totalReports > 0 ? Math.round((resolved / totalReports) * 100) : 0;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  for (const r of allReports) {
    categoryMap[r.category] = (categoryMap[r.category] || 0) + 1;
  }
  const categories = Object.entries(categoryMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // City breakdown
  const cityMap: Record<string, number> = {};
  for (const r of allReports) {
    cityMap[r.city] = (cityMap[r.city] || 0) + 1;
  }
  const cities = Object.entries(cityMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Status breakdown
  const statusMap: Record<string, number> = {};
  for (const r of allReports) {
    statusMap[r.status] = (statusMap[r.status] || 0) + 1;
  }

  // Recent reports
  const recentReports = db.select().from(reports).orderBy(desc(reports.createdAt)).limit(5).all();

  return c.json({
    stats: { totalReports, resolved, criticalOpen, totalUpvotes, resolutionRate },
    categories,
    cities,
    statusBreakdown: statusMap,
    recentReports,
  });
});

// GET /api/analytics/leaderboard
analytics.get("/leaderboard", authMiddleware, async (c) => {
  const topUsers = db.select().from(users)
    .where(eq(users.role, "citizen"))
    .orderBy(desc(users.reputation))
    .limit(20).all();

  const leaderboard = topUsers.map((u, i) => ({
    rank: i + 1,
    id: u.id,
    name: u.name,
    city: u.city,
    reputation: u.reputation,
    reportsCount: u.reportsCount,
    resolvedCount: u.resolvedCount,
    supportedCount: u.supportedCount,
    avatarInitial: u.avatarInitial,
  }));

  // Get all badges
  const allBadges = db.select().from(badges).all();

  return c.json({ leaderboard, badges: allBadges });
});

// GET /api/analytics/profile/:id
analytics.get("/profile/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "User ID is required" }, 400);
  const user = db.select().from(users).where(eq(users.id, id)).get();
  if (!user) return c.json({ error: "User not found" }, 404);

  // Get earned badges
  const earnedBadges = db.select().from(userBadges).where(eq(userBadges.userId, id)).all();
  const allBadges = db.select().from(badges).all();
  const badgeDetails = allBadges.map(b => ({
    ...b,
    earned: earnedBadges.some(eb => eb.badgeId === b.id),
    earnedAt: earnedBadges.find(eb => eb.badgeId === b.id)?.earnedAt,
  }));

  // Get user's reports
  const userReports = db.select().from(reports)
    .where(eq(reports.authorId, id))
    .orderBy(desc(reports.createdAt)).all();

  // Get rank
  const allUsers = db.select().from(users)
    .where(eq(users.role, "citizen"))
    .orderBy(desc(users.reputation)).all();
  const rank = allUsers.findIndex(u => u.id === id) + 1;

  return c.json({
    user: {
      id: user.id, name: user.name, email: user.email, role: user.role,
      city: user.city, avatarInitial: user.avatarInitial,
      reputation: user.reputation, reportsCount: user.reportsCount,
      resolvedCount: user.resolvedCount, supportedCount: user.supportedCount,
      createdAt: user.createdAt,
    },
    badges: badgeDetails,
    reports: userReports,
    rank: rank || 0,
  });
});

// GET /api/analytics/gallery — resolved issues with images
analytics.get("/gallery", async (c) => {
  const { reportImages } = await import("../db/schema.js");
  const resolvedReports = db.select().from(reports)
    .where(eq(reports.status, "Resolved"))
    .orderBy(desc(reports.resolvedAt))
    .limit(20).all();

  const enriched = resolvedReports.map(r => {
    const images = db.select().from(reportImages).where(eq(reportImages.reportId, r.id)).all();
    return { ...r, images };
  });

  return c.json({ reports: enriched });
});

export default analytics;
