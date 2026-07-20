import { Hono } from "hono";
import { db } from "../db/index.js";
import { users, departments, reports, reportImages } from "../db/schema.js";
import { eq, desc, count } from "drizzle-orm";
import { authMiddleware, requireRole, type AuthPayload } from "../middleware/auth.js";

const admin = new Hono();

// All admin routes require admin role
admin.use("*", authMiddleware, requireRole("admin"));

// GET /api/admin/stats
admin.get("/stats", async (c) => {
  const allUsers = db.select().from(users).all();
  const allReports = db.select().from(reports).all();
  const allDepts = db.select().from(departments).all();

  const totalUsers = allUsers.length;
  const totalReports = allReports.length;
  const totalDepartments = allDepts.length;
  const citizenCount = allUsers.filter(u => u.role === "citizen").length;
  const officerCount = allUsers.filter(u => u.role === "officer").length;
  const adminCount = allUsers.filter(u => u.role === "admin").length;

  const statusBreakdown: Record<string, number> = {};
  for (const r of allReports) {
    statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
  }

  const categoryBreakdown: Record<string, number> = {};
  for (const r of allReports) {
    categoryBreakdown[r.category] = (categoryBreakdown[r.category] || 0) + 1;
  }

  const cityBreakdown: Record<string, number> = {};
  for (const r of allReports) {
    cityBreakdown[r.city] = (cityBreakdown[r.city] || 0) + 1;
  }

  return c.json({
    totalUsers, totalReports, totalDepartments,
    citizenCount, officerCount, adminCount,
    statusBreakdown, categoryBreakdown, cityBreakdown,
  });
});

// GET /api/admin/users
admin.get("/users", async (c) => {
  const allUsers = db.select().from(users).orderBy(desc(users.createdAt)).all();
  return c.json({
    users: allUsers.map(u => ({
      id: u.id, name: u.name, email: u.email, role: u.role,
      city: u.city, reputation: u.reputation, reportsCount: u.reportsCount,
      resolvedCount: u.resolvedCount, supportedCount: u.supportedCount,
      createdAt: u.createdAt,
    })),
  });
});

// PATCH /api/admin/users/:id/role
admin.patch("/users/:id/role", async (c) => {
  const id = c.req.param("id");
  const { role } = await c.req.json();

  const validRoles = ["citizen", "officer", "admin"];
  if (!validRoles.includes(role)) {
    return c.json({ error: "Invalid role" }, 400);
  }

  db.update(users).set({ role }).where(eq(users.id, id)).run();
  return c.json({ success: true });
});

// GET /api/admin/departments
admin.get("/departments", async (c) => {
  const allDepts = db.select().from(departments).all();

  const enriched = allDepts.map(d => {
    const officers = db.select().from(users)
      .where(eq(users.departmentId, d.id)).all();
    return { ...d, officers: officers.length };
  });

  return c.json({ departments: enriched });
});

// POST /api/admin/departments
admin.post("/departments", async (c) => {
  const { name, city, category, description } = await c.req.json();
  if (!name || !city || !category) {
    return c.json({ error: "Name, city, and category are required" }, 400);
  }

  const { v4: uuid } = await import("uuid");
  db.insert(departments).values({
    id: uuid(), name, city, category, description: description || "",
    officerCount: 0, createdAt: new Date().toISOString(),
  }).run();

  return c.json({ success: true });
});

// GET /api/admin/officers
admin.get("/officers", async (c) => {
  const officers = db.select().from(users).where(eq(users.role, "officer")).all();
  return c.json({
    officers: officers.map(o => ({
      id: o.id, name: o.name, email: o.email, city: o.city, departmentId: o.departmentId,
    })),
  });
});

export default admin;
