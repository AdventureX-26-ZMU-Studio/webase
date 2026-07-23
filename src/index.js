export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith("/api/")) {
      return handleApi(path, request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleApi(path, request, env) {
  // --- D1 ---
  if (path === "/api/d1/orders") {
    const { results } = await env.d1.prepare(
      "SELECT * FROM \"Order\" ORDER BY id DESC LIMIT 100"
    ).all();
    return Response.json(results);
  }

  // --- R2 ---
  if (path.startsWith("/api/r2/") && request.method === "PUT") {
    const key = path.slice("/api/r2/".length);
    if (!key) return new Response("Missing key", { status: 400 });
    await env.MY_BUCKET.put(key, request.body);
    return new Response(`Put ${key} successfully!`);
  }

  if (path.startsWith("/api/r2/") && request.method === "GET") {
    const key = path.slice("/api/r2/".length);
    if (!key) return new Response("Missing key", { status: 400 });
    const object = await env.MY_BUCKET.get(key);
    if (!object) return new Response("Not found", { status: 404 });
    return new Response(object.body, {
      headers: { "Content-Type": object.httpMetadata?.contentType || "application/octet-stream" },
    });
  }

  // --- KV ---
  if (path.startsWith("/api/kv/") && request.method === "PUT") {
    const key = path.slice("/api/kv/".length);
    if (!key) return new Response("Missing key", { status: 400 });
    const value = await request.text();
    await env.kv.put(key, value);
    return Response.json({ ok: true, key, value });
  }

  if (path.startsWith("/api/kv/") && request.method === "GET") {
    const key = path.slice("/api/kv/".length);
    if (!key) return new Response("Missing key", { status: 400 });
    const value = await env.kv.get(key);
    if (value === null) return new Response("Not found", { status: 404 });
    return Response.json({ key, value });
  }

  return new Response("Not found", { status: 404 });
}
