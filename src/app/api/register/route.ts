import { NextResponse } from "next/server";
import { createInscription, isNeonConfigured } from "@/lib/db";
import { inscriptionSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = inscriptionSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Donnees invalides.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const row = await createInscription({
      nom: parsed.data.nom,
      prenom: parsed.data.prenom,
      whatsapp: parsed.data.whatsapp,
      email: parsed.data.email,
      question: parsed.data.question || undefined,
    });

    return NextResponse.json({
      ok: true,
      id: row.id,
      backend: isNeonConfigured() ? "neon" : "local",
    });
  } catch (error) {
    console.error("register error", error);
    return NextResponse.json(
      { error: "Erreur serveur, merci de reessayer." },
      { status: 500 }
    );
  }
}
