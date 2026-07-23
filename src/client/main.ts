import "./styles.css";

type User = {
  id: string;
  email: string;
  created_at?: string;
};

type State = {
  health: string;
  user: User | null;
  overview: string;
  message: string;
};

const state: State = {
  health: "checking",
  user: null,
  overview: "locked",
  message: "",
};

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Missing #app");
const appRoot = root;

render();
void bootstrap();

async function bootstrap() {
  await refreshHealth();
  await refreshMe();
  await refreshOverview();
}

async function refreshHealth() {
  const result = await apiGet("/api/health");
  state.health = result.ok ? "online" : "offline";
  render();
}

async function refreshMe() {
  const result = await apiGet<{ user: User | null }>("/api/auth/me");
  state.user = result.ok ? result.data.user : null;
  render();
}

async function refreshOverview() {
  const result = await apiGet("/api/admin/overview");
  state.overview = result.ok ? JSON.stringify(result.data, null, 2) : "Login required";
  render();
}

function render() {
  appRoot.innerHTML = `
    <div class="shell">
      <aside>
        <div class="brand">ZMU Webase</div>
        <nav aria-label="Console navigation">
          <a href="/" aria-current="page">Overview</a>
          <a href="/auth">Auth</a>
          <a href="/storage">Storage</a>
          <a href="/settings">Settings</a>
        </nav>
      </aside>
      <main>
        <header class="topbar">
          <div>
            <h1>Backend Console</h1>
            <p>${state.user ? `Signed in as ${escapeHtml(state.user.email)}` : "Use the auth panel to create a session."}</p>
          </div>
          <span class="status"><span class="dot ${state.health}"></span>${state.health}</span>
        </header>

        <section class="grid">
          <article class="panel auth-panel">
            <h2>Auth</h2>
            <form id="auth-form">
              <label>
                Email
                <input name="email" type="email" autocomplete="email" placeholder="admin@zmu.local" required>
              </label>
              <label>
                Password
                <input name="password" type="password" autocomplete="current-password" placeholder="8+ characters" required>
              </label>
              <div class="actions">
                <button type="submit" data-action="login">Login</button>
                <button type="submit" data-action="register">Register</button>
                <button type="button" id="logout">Logout</button>
              </div>
            </form>
            <p class="message">${escapeHtml(state.message)}</p>
          </article>

          <article class="panel">
            <h2>Admin Overview</h2>
            <pre>${escapeHtml(state.overview)}</pre>
          </article>

          <article class="panel">
            <h2>Storage Geometry</h2>
            <dl>
              <div><dt>D1</dt><dd><code>users</code> table and future business data</dd></div>
              <div><dt>KV</dt><dd><code>session:{id}</code> with TTL-backed auth</dd></div>
              <div><dt>R2</dt><dd><code>/api/r2/:key</code> request-backed object entry</dd></div>
            </dl>
          </article>
        </section>
      </main>
    </div>
  `;

  wireEvents();
}

function wireEvents() {
  const form = document.querySelector<HTMLFormElement>("#auth-form");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null;
    const action = submitter?.dataset.action === "register" ? "register" : "login";
    const data = new FormData(form);

    const result = await apiPost(`/api/auth/${action}`, {
      email: String(data.get("email") || ""),
      password: String(data.get("password") || ""),
    });

    state.message = result.ok ? `${action} ok` : result.error;
    await refreshMe();
    await refreshOverview();
  });

  document.querySelector<HTMLButtonElement>("#logout")?.addEventListener("click", async () => {
    const result = await apiPost("/api/auth/logout", {});
    state.message = result.ok ? "logout ok" : result.error;
    await refreshMe();
    await refreshOverview();
  });
}

async function apiGet<T = unknown>(path: string): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const response = await fetch(path);
  return readApiResponse<T>(response);
}

async function apiPost<T = unknown>(
  path: string,
  body: unknown,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readApiResponse<T>(response);
}

async function readApiResponse<T>(response: Response): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data && typeof data === "object" && "error" in data ? String(data.error) : response.statusText;
    return { ok: false, error: message };
  }
  return { ok: true, data: data as T };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
}
