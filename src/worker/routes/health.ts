import { Hono } from "hono";
import type { AppEnv } from "../env";

export const healthRoutes = new Hono<AppEnv>();

healthRoutes.get("/health", (c) => {
  return c.json({
    ok: true,
    service: "zmu-webase",
    bindings: {
      d1: Boolean(c.env.d1),
      kv: Boolean(c.env.kv),
      r2: Boolean(c.env.MY_BUCKET),
      assets: Boolean(c.env.ASSETS),
    },
  });
});
