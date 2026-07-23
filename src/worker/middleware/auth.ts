import { getCookie } from "hono/cookie";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../env";

export const sessionCookieName = "zmu_sid";
export const sessionPrefix = "session:";

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const sessionId = getCookie(c, sessionCookieName);
  if (!sessionId) return c.json({ error: "Unauthorized" }, 401);

  const userId = await c.env.kv.get(`${sessionPrefix}${sessionId}`);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  c.set("userId", userId);
  await next();
};
