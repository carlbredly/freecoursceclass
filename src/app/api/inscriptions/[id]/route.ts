import { NextResponse } from "next/server";
import { deleteInscription, setContacted } from "@/lib/db";
import { checkBasicAuth, unauthorizedResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: { id: string };
};

function parseId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!checkBasicAuth(request.headers.get("authorization"))) {
    return unauthorizedResponse();
  }

  const id = parseId(context.params.id);
  if (!id) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  try {
    const deleted = await deleteInscription(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Inscription introuvable." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("inscription delete error", error);
    return NextResponse.json(
      { error: "Impossible de supprimer l'inscription." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!checkBasicAuth(request.headers.get("authorization"))) {
    return unauthorizedResponse();
  }

  const id = parseId(context.params.id);
  if (!id) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      contacted?: boolean;
    };
    if (typeof body.contacted !== "boolean") {
      return NextResponse.json(
        { error: "Champ contacted (boolean) requis." },
        { status: 400 }
      );
    }

    const updated = await setContacted(id, body.contacted);
    if (!updated) {
      return NextResponse.json(
        { error: "Inscription introuvable." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, inscription: updated });
  } catch (error) {
    console.error("inscription patch error", error);
    return NextResponse.json(
      { error: "Impossible de mettre a jour l'inscription." },
      { status: 500 }
    );
  }
}
