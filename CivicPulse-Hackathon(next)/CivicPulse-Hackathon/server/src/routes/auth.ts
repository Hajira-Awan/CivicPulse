import { Hono } from "hono";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { createToken, authMiddleware, type AuthPayload } from "../middleware/auth.js";

const auth = new Hono();

// POST /api/auth/signup
auth.post("/signup", async (c) => {
  try {
    const { name, email, password, city, role } = await c.req.json();

    if (!name || !email || !password) {
      return c.json({ error: "Name, email, and password are required" }, 400);
    }

    // Check existing
    const existing = db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
      return c.json({ error: "Email already registered" }, 409);
    }

    const validRoles = ["citizen", "officer"] as const;
    const userRole = validRoles.includes(role) ? role : "citizen";

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuid();
    const now = new Date().toISOString();

    db.insert(users).values({
      id: userId,
      name,
      email,
      passwordHash,
      role: userRole,
      city: city || "",
      avatarInitial: name.charAt(0).toUpperCase(),
      reputation: 0,
      reportsCount: 0,
      resolvedCount: 0,
      supportedCount: 0,
      createdAt: now,
    }).run();

    const token = await createToken({ userId, email, role: userRole });

    return c.json({
      token,
      user: { id: userId, name, email, role: userRole, city: city || "", avatarInitial: name.charAt(0).toUpperCase(), reputation: 0, reportsCount: 0, resolvedCount: 0, supportedCount: 0, createdAt: now },
    });
  } catch (err: any) {
    console.error("Signup error:", err);
    return c.json({ error: "Signup failed" }, 500);
  }
});

// POST /api/auth/login
auth.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const user = db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const token = await createToken({ userId: user.id, email: user.email, role: user.role as AuthPayload["role"] });

    return c.json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role,
        city: user.city, avatarInitial: user.avatarInitial, reputation: user.reputation,
        reportsCount: user.reportsCount, resolvedCount: user.resolvedCount,
        supportedCount: user.supportedCount, createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return c.json({ error: "Login failed" }, 500);
  }
});

// GET /api/auth/me
auth.get("/me", authMiddleware, async (c) => {
  const authUser = c.get("user") as AuthPayload;
  const user = db.select().from(users).where(eq(users.id, authUser.userId)).get();
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    user: {
      id: user.id, name: user.name, email: user.email, role: user.role,
      city: user.city, avatarInitial: user.avatarInitial, reputation: user.reputation,
      reportsCount: user.reportsCount, resolvedCount: user.resolvedCount,
      supportedCount: user.supportedCount, departmentId: user.departmentId,
      createdAt: user.createdAt,
    },
  });
});

// PATCH /api/auth/profile
auth.patch("/profile", authMiddleware, async (c) => {
  const authUser = c.get("user") as AuthPayload;
  const { name, city } = await c.req.json();

  const updates: Record<string, any> = {};
  if (name) {
    updates.name = name;
    updates.avatarInitial = name.charAt(0).toUpperCase();
  }
  if (city) updates.city = city;

  if (Object.keys(updates).length > 0) {
    db.update(users).set(updates).where(eq(users.id, authUser.userId)).run();
  }

  const user = db.select().from(users).where(eq(users.id, authUser.userId)).get();
  return c.json({ user });
});

export default auth;
