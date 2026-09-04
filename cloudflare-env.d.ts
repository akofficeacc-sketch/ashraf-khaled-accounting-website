interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
}

interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  WORKER_SELF_REFERENCE: Fetcher;
  CONTACT_RL: { limit(options: { key: string }): Promise<{ success: boolean }> };
  RESEND_API_KEY: string;
  CONTACT_NOTIFY_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
}
