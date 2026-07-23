import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { AppEnv, UserRecord } from "../env";
import { hashPassword, verifyPassword } from "../lib/password";
import { sessionCookieName, sessionPrefix } from "../middleware/auth";

const sessionTtlSeconds = 60 * 60 * 24 * 7;

export const authRoutes = new Hono<AppEnv>();

authRoutes.post("/register", async (c) => {
  const body = await readAuthBody(c.req.raw);
  if (!body.ok) return c.json({ error: body.error }, 400);

  const existing = await findUserByEmail(c.env.d1, body.email);
  if (existing) return c.json({ error: "Email already registered" }, 409);

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(body.password);
  await c.env.d1
    .prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)")
    .bind(userId, body.email, passwordHash)
    .run();

  await createSession(c, userId);
  return c.json({ user: { id: userId, email: body.email } }, 201);
});

authRoutes.post("/login", async (c) => {
  const body = await readAuthBody(c.req.raw);
  if (!body.ok) return c.json({ error: body.error }, 400);

  const user = await findUserByEmail(c.env.d1, body.email);
  if (!user) return c.json({ error: "Invalid email or password" }, 401);

  const passwordOk = await verifyPassword(body.password, user.password_hash);
  if (!passwordOk) return c.json({ error: "Invalid email or password" }, 401);

  await createSession(c, user.id);
  return c.json({ user: { id: user.id, email: user.email } });
});

authRoutes.post("/logout", async (c) => {
  const sessionId = getCookie(c, sessionCookieName);
  if (sessionId) await c.env.kv.delete(`${sessionPrefix}${sessionId}`);
  deleteCookie(c, sessionCookieName, { path: "/" });
  return c.json({ ok: true });
});

authRoutes.get("/me", async (c) => {
  const sessionId = getCookie(c, sessionCookieName);
  if (!sessionId) return c.json({ user: null });

  const userId = await c.env.kv.get(`${sessionPrefix}${sessionId}`);
  if (!userId) return c.json({ user: null });

  const user = await c.env.d1
    .prepare("SELECT id, email, created_at FROM users WHERE id = ?")
    .bind(userId)
    .first<Omit<UserRecord, "password_hash">>();

  return c.json({ user: user ?? null });
});

async function createSession(c: Parameters<typeof setCookie>[0], userId: string): Promise<void> {
  const sessionId = crypto.randomUUID();
  await c.env.kv.put(`${sessionPrefix}${sessionId}`, userId, {
    expirationTtl: sessionTtlSeconds,
  });
  setCookie(c, sessionCookieName, sessionId, {
    httpOnly: true,
    sameSite: "Lax",
    secure: new URL(c.req.url).protocol === "https:",
    path: "/",
    maxAge: sessionTtlSeconds,
  });
}

async function findUserByEmail(d1: D1Database, email: string): Promise<UserRecord | null> {
  return d1
    .prepare("SELECT id, email, password_hash, created_at FROM users WHERE email = ?")
    .bind(email)
    .first<UserRecord>();
}

async function readAuthBody(request: Request): Promise<
  | { ok: true; email: string; password: string }
  | { ok: false; error: string }
> {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return { ok: false, error: "Expected JSON body" };

  const email = "email" in body ? String(body.email).trim().toLowerCase() : "";
  const password = "password" in body ? String(body.password) : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Valid email is required" };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters" };
  }

  return { ok: true, email, password };
}
