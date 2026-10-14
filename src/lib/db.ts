import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { promises as fs } from "fs";
import path from "path";
import {
  normalizeInscription,
  type Inscription,
  type InscriptionInput,
} from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "inscriptions.json");

let schemaReady = false;

function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL ||
    undefined
  );
}

export function isNeonConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

function sqlClient(): NeonQueryFunction<false, false> {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "Aucune variable d'environnement de base de donnees trouvee (DATABASE_URL / POSTGRES_URL)."
    );
  }
  return neon(url);
}

async function ensureLocalStore(): Promise<Inscription[]> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Array<Partial<Inscription> & Inscription>;
    return parsed.map((row) =>
      normalizeInscription({
        ...row,
        contacted_at: row.contacted_at ?? null,
      })
    );
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
    return [];
  }
}

async function writeLocalStore(rows: Inscription[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(rows, null, 2), "utf8");
}

export async function ensureSchema(): Promise<{ backend: "neon" | "local" }> {
  if (!isNeonConfigured()) {
    await ensureLocalStore();
    return { backend: "local" };
  }

  if (schemaReady) {
    return { backend: "neon" };
  }

  const sql = sqlClient();
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
  schemaReady = true;
  return { backend: "neon" };
}

export async function createInscription(
  input: InscriptionInput
): Promise<Inscription> {
  const { backend } = await ensureSchema();
  const question = input.question?.trim() ? input.question.trim() : null;

  if (backend === "local") {
    const rows = await ensureLocalStore();
    const row: Inscription = {
      id: rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1,
      nom: input.nom.trim(),
      prenom: input.prenom.trim(),
      whatsapp: input.whatsapp.trim(),
      email: input.email.trim().toLowerCase(),
      question,
      created_at: new Date().toISOString(),
      contacted_at: null,
    };
    rows.unshift(row);
    await writeLocalStore(rows);
    return row;
  }

  const sql = sqlClient();
  const result = await sql`
    INSERT INTO registrations (nom, prenom, whatsapp, email, question)
    VALUES (
      ${input.nom.trim()},
      ${input.prenom.trim()},
      ${input.whatsapp.trim()},
      ${input.email.trim().toLowerCase()},
      ${question}
    )
    RETURNING id, nom, prenom, whatsapp, email, question, created_at, contacted_at
  `;
  return normalizeInscription(result[0] as Parameters<typeof normalizeInscription>[0]);
}

export async function listInscriptions(): Promise<Inscription[]> {
  const { backend } = await ensureSchema();

  if (backend === "local") {
    return ensureLocalStore();
  }

  const sql = sqlClient();
  const result = await sql`
    SELECT id, nom, prenom, whatsapp, email, question, created_at, contacted_at
    FROM registrations
    ORDER BY created_at DESC
  `;
  return (result as Parameters<typeof normalizeInscription>[0][]).map(
    normalizeInscription
  );
}

export async function countInscriptions(): Promise<number> {
  const rows = await listInscriptions();
  return rows.length;
}

export async function deleteInscription(id: number): Promise<boolean> {
  if (!Number.isInteger(id) || id <= 0) {
    return false;
  }

  const { backend } = await ensureSchema();

  if (backend === "local") {
    const rows = await ensureLocalStore();
    const next = rows.filter((row) => row.id !== id);
    if (next.length === rows.length) {
      return false;
    }
    await writeLocalStore(next);
    return true;
  }

  const sql = sqlClient();
  const result = await sql`
    DELETE FROM registrations
    WHERE id = ${id}
    RETURNING id
  `;
  return result.length > 0;
}

export async function setContacted(
  id: number,
  contacted: boolean
): Promise<Inscription | null> {
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  const { backend } = await ensureSchema();
  const contactedAt = contacted ? new Date().toISOString() : null;

  if (backend === "local") {
    const rows = await ensureLocalStore();
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) {
      return null;
    }
    rows[index] = { ...rows[index]!, contacted_at: contactedAt };
    await writeLocalStore(rows);
    return rows[index]!;
  }

  const sql = sqlClient();
  const result = contacted
    ? await sql`
        UPDATE registrations
        SET contacted_at = NOW()
        WHERE id = ${id}
        RETURNING id, nom, prenom, whatsapp, email, question, created_at, contacted_at
      `
    : await sql`
        UPDATE registrations
        SET contacted_at = NULL
        WHERE id = ${id}
        RETURNING id, nom, prenom, whatsapp, email, question, created_at, contacted_at
      `;

  if (!result[0]) {
    return null;
  }
  return normalizeInscription(
    result[0] as Parameters<typeof normalizeInscription>[0]
  );
}
