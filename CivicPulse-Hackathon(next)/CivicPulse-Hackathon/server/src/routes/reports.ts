import { Hono } from "hono";
import { db } from "../db/index.js";
import { reports, reportImages, upvotes, users, notifications, aiAnalyses, departments } from "../db/schema.js";
import { eq, desc, asc, like, and, or, sql, count } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { authMiddleware, optionalAuth, requireRole, type AuthPayload } from "../middleware/auth.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const reportsRouter = new Hono();

// GET /api/reports — list with filters
reportsRouter.get("/", optionalAuth, async (c) => {
  const search = c.req.query("search") || "";
  const city = c.req.query("city") || "";
  const category = c.req.query("category") || "";
  const status = c.req.query("status") || "";
  const sort = c.req.query("sort") || "newest";
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = (page - 1) * limit;

  let conditions: any[] = [];
  if (search) {
    conditions.push(
      or(
        like(reports.title, `%${search}%`),
        like(reports.description, `%${search}%`),
        like(reports.area, `%${search}%`)
      )
    );
  }
  if (city) conditions.push(eq(reports.city, city));
  if (category) conditions.push(eq(reports.category, category));
  if (status) conditions.push(eq(reports.status, status as any));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const orderBy = sort === "oldest" ? asc(reports.createdAt)
    : sort === "upvotes" ? desc(reports.upvoteCount)
    : sort === "priority" ? asc(reports.priority)
    : desc(reports.createdAt);

  const results = db.select().from(reports).where(whereClause).orderBy(orderBy).limit(limit).offset(offset).all();
  const totalResult = db.select({ count: count() }).from(reports).where(whereClause).get();
  const total = totalResult?.count || 0;

  // Fetch images for each report
  const enriched = results.map(r => {
    const images = db.select().from(reportImages).where(eq(reportImages.reportId, r.id)).all();
    return { ...r, images };
  });

  return c.json({ reports: enriched, total, page, limit });
});

// GET /api/reports/departments — list departments
reportsRouter.get("/departments", authMiddleware, async (c) => {
  const allDepts = db.select().from(departments).all();
  return c.json({ departments: allDepts });
});

// GET /api/reports/officers — list officers
reportsRouter.get("/officers", authMiddleware, async (c) => {
  const officers = db.select().from(users).where(eq(users.role, "officer")).all();
  return c.json({ officers: officers.map(o => ({ id: o.id, name: o.name, email: o.email, city: o.city, departmentId: o.departmentId })) });
});

// GET /api/reports/:id — single report
reportsRouter.get("/:id", optionalAuth, async (c) => {
  const id = c.req.param("id");
  const report = db.select().from(reports).where(eq(reports.id, id)).get();
  if (!report) return c.json({ error: "Report not found" }, 404);

  const images = db.select().from(reportImages).where(eq(reportImages.reportId, id)).all();
  const analysis = db.select().from(aiAnalyses).where(eq(aiAnalyses.reportId, id)).get();

  const user = c.get("user") as AuthPayload | undefined;
  let userUpvoted = false;
  if (user) {
    const uv = db.select().from(upvotes)
      .where(and(eq(upvotes.reportId, id), eq(upvotes.userId, user.userId))).get();
    userUpvoted = !!uv;
  }

  return c.json({ report: { ...report, images, aiAnalysis: analysis, userUpvoted } });
});

// POST /api/reports — create report
reportsRouter.post("/", authMiddleware, async (c) => {
  try {
    const authUser = c.get("user") as AuthPayload;
    const body = await c.req.json();
    const { title, description, city, area, category, severity, latitude, longitude, images } = body;

    if (!title || !city || !category) {
      return c.json({ error: "Title, city, and category are required" }, 400);
    }

    const priorityMap: Record<string, string> = {
      critical: "P1 Critical", high: "P2 High", medium: "P3 Medium", low: "P4 Low",
    };

    const reportId = uuid();
    const now = new Date().toISOString();

    const author = db.select().from(users).where(eq(users.id, authUser.userId)).get();
    const authorName = author?.name || "Unknown";

    db.insert(reports).values({
      id: reportId, title, description: description || "",
      city, area: area || "", category, severity: severity || "medium",
      priority: priorityMap[severity] || "P3 Medium",
      status: "Submitted", latitude, longitude,
      authorId: authUser.userId, authorName,
      upvoteCount: 0, createdAt: now, updatedAt: now,
    }).run();

    // Save image URLs if provided
    if (images && Array.isArray(images)) {
      for (const imgUrl of images) {
        db.insert(reportImages).values({
          id: uuid(), reportId, url: imgUrl, type: "before", createdAt: now,
        }).run();
      }
    }

    // Update user stats
    db.update(users).set({
      reportsCount: sql`${users.reportsCount} + 1`,
      reputation: sql`${users.reputation} + 10`,
    }).where(eq(users.id, authUser.userId)).run();

    const report = db.select().from(reports).where(eq(reports.id, reportId)).get();
    return c.json({ report }, 201);
  } catch (err: any) {
    console.error("Create report error:", err);
    return c.json({ error: "Failed to create report" }, 500);
  }
});

// POST /api/reports/upload-image — upload image file
reportsRouter.post("/upload-image", authMiddleware, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("image") as File | null;
    if (!file) return c.json({ error: "No image file provided" }, 400);

    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${uuid()}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    return c.json({ url: `/uploads/${filename}`, filename });
  } catch (err: any) {
    console.error("Upload error:", err);
    return c.json({ error: "Upload failed" }, 500);
  }
});

// PATCH /api/reports/:id/status — update status
reportsRouter.patch("/:id/status", authMiddleware, requireRole("admin", "officer"), async (c) => {
  const id = c.req.param("id");
  const { status, officerNotes } = await c.req.json();

  const validStatuses = ["Submitted", "Under Review", "Assigned", "In Progress", "Resolved", "Rejected"];
  if (!validStatuses.includes(status)) {
    return c.json({ error: "Invalid status" }, 400);
  }

  const now = new Date().toISOString();
  const updates: Record<string, any> = { status, updatedAt: now };
  if (officerNotes) updates.officerNotes = officerNotes;
  if (status === "Resolved") updates.resolvedAt = now;

  db.update(reports).set(updates).where(eq(reports.id, id)).run();

  // Get report for notification
  const report = db.select().from(reports).where(eq(reports.id, id)).get();
  if (report) {
    // Notify report author
    db.insert(notifications).values({
      id: uuid(), userId: report.authorId,
      title: `Report ${status}`,
      message: `Your report "${report.title}" has been updated to "${status}".`,
      type: "status_update", relatedReportId: id, isRead: false, createdAt: now,
    }).run();

    // If resolved, update author stats
    if (status === "Resolved") {
      db.update(users).set({
        resolvedCount: sql`${users.resolvedCount} + 1`,
        reputation: sql`${users.reputation} + 25`,
      }).where(eq(users.id, report.authorId)).run();
    }
  }

  return c.json({ report: db.select().from(reports).where(eq(reports.id, id)).get() });
});

// POST /api/reports/:id/assign
reportsRouter.post("/:id/assign", authMiddleware, requireRole("admin", "officer"), async (c) => {
  const id = c.req.param("id");
  const { departmentId, officerId } = await c.req.json();
  const now = new Date().toISOString();

  db.update(reports).set({
    assignedDeptId: departmentId || null,
    assignedOfficerId: officerId || null,
    status: "Assigned",
    updatedAt: now,
  }).where(eq(reports.id, id)).run();

  const report = db.select().from(reports).where(eq(reports.id, id)).get();
  if (report) {
    db.insert(notifications).values({
      id: uuid(), userId: report.authorId,
      title: "Report Assigned",
      message: `Your report "${report.title}" has been assigned to a department.`,
      type: "assignment", relatedReportId: id, isRead: false, createdAt: now,
    }).run();

    if (officerId) {
      db.insert(notifications).values({
        id: uuid(), userId: officerId,
        title: "New Assignment",
        message: `You've been assigned report "${report.title}".`,
        type: "assignment", relatedReportId: id, isRead: false, createdAt: now,
      }).run();
    }
  }

  return c.json({ report });
});

// POST /api/reports/:id/upvote — toggle upvote
reportsRouter.post("/:id/upvote", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const authUser = c.get("user") as AuthPayload;
  const now = new Date().toISOString();

  const existing = db.select().from(upvotes)
    .where(and(eq(upvotes.reportId, id), eq(upvotes.userId, authUser.userId))).get();

  if (existing) {
    // Remove upvote
    db.delete(upvotes).where(eq(upvotes.id, existing.id)).run();
    db.update(reports).set({ upvoteCount: sql`${reports.upvoteCount} - 1` }).where(eq(reports.id, id)).run();
    db.update(users).set({ supportedCount: sql`${users.supportedCount} - 1` }).where(eq(users.id, authUser.userId)).run();
    const report = db.select().from(reports).where(eq(reports.id, id)).get();
    return c.json({ upvoted: false, upvoteCount: report?.upvoteCount || 0 });
  } else {
    // Add upvote
    db.insert(upvotes).values({ id: uuid(), reportId: id, userId: authUser.userId, createdAt: now }).run();
    db.update(reports).set({ upvoteCount: sql`${reports.upvoteCount} + 1` }).where(eq(reports.id, id)).run();
    db.update(users).set({
      supportedCount: sql`${users.supportedCount} + 1`,
      reputation: sql`${users.reputation} + 2`,
    }).where(eq(users.id, authUser.userId)).run();

    // Notify author
    const report = db.select().from(reports).where(eq(reports.id, id)).get();
    if (report && report.authorId !== authUser.userId) {
      db.insert(notifications).values({
        id: uuid(), userId: report.authorId,
        title: "New Upvote!",
        message: `Someone upvoted your report "${report.title}".`,
        type: "upvote", relatedReportId: id, isRead: false, createdAt: now,
      }).run();
    }

    return c.json({ upvoted: true, upvoteCount: report ? report.upvoteCount + 1 : 1 });
  }
});

// POST /api/reports/:id/after-image — upload after-resolution image
reportsRouter.post("/:id/after-image", authMiddleware, requireRole("officer", "admin"), async (c) => {
  const id = c.req.param("id");
  const { url } = await c.req.json();
  const now = new Date().toISOString();

  db.insert(reportImages).values({
    id: uuid(), reportId: id, url, type: "after", createdAt: now,
  }).run();

  return c.json({ success: true });
});

export default reportsRouter;
