import { NextResponse } from "next/server";
import { ensureSchema, isNeonConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { backend } = await ensureSchema();
    return NextResponse.json({
      ok: true,
      backend,
      neonConfigured: isNeonConfigured(),
    });
  } catch (error) {
    console.error("health error", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
