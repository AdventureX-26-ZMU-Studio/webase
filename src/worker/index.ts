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

app.notFound((c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
