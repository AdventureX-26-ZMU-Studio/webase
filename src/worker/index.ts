import { Hono } from "hono";
import type { AppEnv } from "./env";
import { adminRoutes } from "./routes/admin";
import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";
import { r2Routes } from "./routes/r2";

const app = new Hono<AppEnv>();

app.route("/api", healthRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/r2", r2Routes);

app.onError((error, c) => {
  return c.json(
    {
      error: "Internal Server Error",
      route: c.req.path,
      message: error instanceof Error ? error.message : String(error),
    },
    500,
  );
});

// Only /api/* reaches this fallback because assets handles page routes first.
app.notFound((c) => c.json({ error: "Not found" }, 404));

export default app;
