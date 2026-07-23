export async function ensureAuthSchema(d1: D1Database): Promise<void> {
  await runSchemaStep("create users table", () =>
    d1
      .prepare(
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      )
      .run(),
  );

  await runSchemaStep("create users email index", () =>
    d1
      .prepare("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
      .run(),
  );
}

async function runSchemaStep(name: string, operation: () => Promise<unknown>): Promise<void> {
  try {
    await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`schema:${name} failed: ${message}`);
  }
}
