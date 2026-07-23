import { Hono } from "hono";
import type { AppEnv } from "../env";
import { requireAuth } from "../middleware/auth";

export const r2Routes = new Hono<AppEnv>();

r2Routes.use("*", requireAuth);

r2Routes.put("/:key{.+}", async (c) => {
  const key = c.req.param("key");
  await c.env.MY_BUCKET.put(key, c.req.raw.body);
  return c.json({ ok: true, key });
});

r2Routes.get("/:key{.+}", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.MY_BUCKET.get(key);
  if (!object) return c.json({ error: "Not found" }, 404);

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
      "ETag": object.httpEtag,
    },
  });
});
