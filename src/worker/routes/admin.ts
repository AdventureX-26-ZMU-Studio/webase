import { Hono } from "hono";
import type { AppEnv } from "../env";
import { ensureAuthSchema } from "../lib/schema";
import { requireAuth } from "../middleware/auth";

export const adminRoutes = new Hono<AppEnv>();

adminRoutes.use("*", requireAuth);

adminRoutes.get("/overview", async (c) => {
  await ensureAuthSchema(c.env.d1);
  const userCount = await c.env.d1
    .prepare("SELECT COUNT(*) AS count FROM users")
    .first<{ count: number }>();

  return c.json({
    userId: c.get("userId"),
    resources: {
      users: userCount?.count ?? 0,
      d1: "connected",
      kv: "connected",
      r2: "connected",
    },
  });
});
