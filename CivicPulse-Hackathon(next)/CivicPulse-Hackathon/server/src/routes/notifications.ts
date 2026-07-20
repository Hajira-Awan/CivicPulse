import { Hono } from "hono";
import { db } from "../db/index.js";
import { notifications } from "../db/schema.js";
import { eq, desc, and } from "drizzle-orm";
import { authMiddleware, type AuthPayload } from "../middleware/auth.js";

const notificationsRouter = new Hono();

// GET /api/notifications
notificationsRouter.get("/", authMiddleware, async (c) => {
  const authUser = c.get("user") as AuthPayload;
  const results = db.select().from(notifications)
    .where(eq(notifications.userId, authUser.userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50).all();

  const unreadCount = results.filter(n => !n.isRead).length;

  return c.json({ notifications: results, unreadCount });
});

// PATCH /api/notifications/:id/read
notificationsRouter.patch("/:id/read", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const authUser = c.get("user") as AuthPayload;

  db.update(notifications).set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, authUser.userId))).run();

  return c.json({ success: true });
});

// PATCH /api/notifications/read-all
notificationsRouter.patch("/read-all", authMiddleware, async (c) => {
  const authUser = c.get("user") as AuthPayload;
  db.update(notifications).set({ isRead: true })
    .where(eq(notifications.userId, authUser.userId)).run();

  return c.json({ success: true });
});

export default notificationsRouter;
