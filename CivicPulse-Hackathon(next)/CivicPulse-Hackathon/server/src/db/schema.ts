import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ── Users ──
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["citizen", "officer", "admin"] }).notNull().default("citizen"),
  city: text("city").default(""),
  avatarInitial: text("avatar_initial").default(""),
  reputation: integer("reputation").notNull().default(0),
  reportsCount: integer("reports_count").notNull().default(0),
  resolvedCount: integer("resolved_count").notNull().default(0),
  supportedCount: integer("supported_count").notNull().default(0),
  departmentId: text("department_id"),
  createdAt: text("created_at").notNull(),
});

// ── Departments ──
export const departments = sqliteTable("departments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  category: text("category").notNull(), // which category this dept handles
  description: text("description").default(""),
  officerCount: integer("officer_count").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

// ── Reports ──
export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").default(""),
  city: text("city").notNull(),
  area: text("area").default(""),
  category: text("category").notNull(),
  severity: text("severity").notNull().default("medium"),
  priority: text("priority").notNull().default("P3 Medium"),
  status: text("status", {
    enum: ["Submitted", "Under Review", "Assigned", "In Progress", "Resolved", "Rejected"],
  }).notNull().default("Submitted"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  assignedDeptId: text("assigned_dept_id"),
  assignedOfficerId: text("assigned_officer_id"),
  upvoteCount: integer("upvote_count").notNull().default(0),
  resolvedAt: text("resolved_at"),
  officerNotes: text("officer_notes").default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ── Report Images ──
export const reportImages = sqliteTable("report_images", {
  id: text("id").primaryKey(),
  reportId: text("report_id").notNull(),
  url: text("url").notNull(),
  type: text("type", { enum: ["before", "after"] }).notNull().default("before"),
  createdAt: text("created_at").notNull(),
});

// ── AI Analyses ──
export const aiAnalyses = sqliteTable("ai_analyses", {
  id: text("id").primaryKey(),
  reportId: text("report_id"),
  imageUrl: text("image_url"),
  suggestedCategory: text("suggested_category"),
  suggestedSeverity: text("suggested_severity"),
  suggestedDescription: text("suggested_description"),
  suggestedDepartment: text("suggested_department"),
  confidence: real("confidence"),
  rawResponse: text("raw_response"),
  createdAt: text("created_at").notNull(),
});

// ── Upvotes ──
export const upvotes = sqliteTable("upvotes", {
  id: text("id").primaryKey(),
  reportId: text("report_id").notNull(),
  userId: text("user_id").notNull(),
  createdAt: text("created_at").notNull(),
});

// ── Badges ──
export const badges = sqliteTable("badges", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon").notNull().default("medal"),
  requirement: text("requirement").notNull(), // human-readable
  threshold: integer("threshold").notNull(), // numeric threshold
  type: text("type", {
    enum: ["reports_filed", "reports_resolved", "upvotes_given", "upvotes_received", "reputation"],
  }).notNull(),
});

// ── User Badges ──
export const userBadges = sqliteTable("user_badges", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  badgeId: text("badge_id").notNull(),
  earnedAt: text("earned_at").notNull(),
});

// ── Notifications ──
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", {
    enum: ["status_update", "upvote", "badge_earned", "assignment", "system"],
  }).notNull(),
  relatedReportId: text("related_report_id"),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});
