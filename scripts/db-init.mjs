import { neon } from "@neondatabase/serverless";
import { promises as fs } from "fs";
import path from "path";

try {
  const envText = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf8");
  for (const line of envText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i);
    const val = trimmed.slice(i + 1);
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "inscriptions.json");

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.NEON_DATABASE_URL;

async function initLocal() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
  return { backend: "local", neonConfigured: false };
}

async function initNeon() {
  const sql = neon(url);
  await sql`
    CREATE TABLE IF NOT EXISTS registrations (
      id SERIAL PRIMARY KEY,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      email TEXT NOT NULL,
      question TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      contacted_at TIMESTAMPTZ
    )
  `;
  await sql`
    ALTER TABLE registrations
    ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ
  `;
  return { backend: "neon", neonConfigured: true };
}

const result = url ? await initNeon() : await initLocal();
console.log(
  JSON.stringify(
    {
      ok: true,
      ...result,
      message:
        result.backend === "neon"
          ? "Table registrations initialisee sur Neon."
          : "Fallback local pret (.data/inscriptions.json). Ajoute DATABASE_URL pour Neon.",
    },
    null,
    2
  )
);
