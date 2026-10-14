"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { checkBasicAuth } from "@/lib/auth";
import { deleteInscription, setContacted } from "@/lib/db";

export async function deleteInscriptionAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  if (!checkBasicAuth(headers().get("authorization"))) {
    return { ok: false, error: "Authentification requise." };
  }

  const id = Number.parseInt(String(formData.get("id") || ""), 10);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Identifiant invalide." };
  }

  try {
    const deleted = await deleteInscription(id);
    if (!deleted) {
      return { ok: false, error: "Inscription introuvable." };
    }
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    console.error("deleteInscriptionAction", error);
    return { ok: false, error: "Impossible de supprimer l'inscription." };
  }
}

export async function setContactedAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  if (!checkBasicAuth(headers().get("authorization"))) {
    return { ok: false, error: "Authentification requise." };
  }

  const id = Number.parseInt(String(formData.get("id") || ""), 10);
  const contacted = String(formData.get("contacted") || "") === "1";
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Identifiant invalide." };
  }

  try {
    const updated = await setContacted(id, contacted);
    if (!updated) {
      return { ok: false, error: "Inscription introuvable." };
    }
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    console.error("setContactedAction", error);
    return { ok: false, error: "Impossible de mettre a jour le statut." };
  }
}
