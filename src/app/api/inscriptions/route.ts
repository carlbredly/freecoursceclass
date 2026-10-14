import { NextResponse } from "next/server";
import { ensureSchema, isNeonConfigured, listInscriptions } from "@/lib/db";
import { checkBasicAuth, unauthorizedResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!checkBasicAuth(request.headers.get("authorization"))) {
    return unauthorizedResponse();
  }

  try {
    const { backend } = await ensureSchema();
    const rows = await listInscriptions();
    return NextResponse.json({
      ok: true,
      backend,
      neonConfigured: isNeonConfigured(),
      count: rows.length,
      inscriptions: rows,
    });
  } catch (error) {
    console.error("inscriptions list error", error);
    return NextResponse.json(
      { error: "Impossible de charger les inscriptions." },
      { status: 500 }
    );
  }
}
