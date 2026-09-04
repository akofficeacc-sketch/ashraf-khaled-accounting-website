import { getCloudflareContext } from "@opennextjs/cloudflare";

export type NewContactMessage = {
  name: string;
  phone: string;
  email: string | null;
  service: string | null;
  message: string;
  lang: "ar" | "en";
};

type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
};

type D1DatabaseLike = {
  prepare(query: string): D1PreparedStatement;
};

/**
 * Store a contact request in Cloudflare D1 using a parameterised statement.
 * The binding is resolved per request so this works across Worker isolates.
 */
export async function insertContactMessage(m: NewContactMessage): Promise<{ id: string }> {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as { DB?: D1DatabaseLike }).DB;
  if (!db) throw new Error("D1 binding 'DB' is not configured");

  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO contact_messages (id, name, phone, email, service, message, lang)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
    )
    .bind(id, m.name, m.phone, m.email, m.service, m.message, m.lang)
    .run();

  return { id };
}
