export type Inscription = {
  id: number;
  nom: string;
  prenom: string;
  whatsapp: string;
  email: string;
  question: string | null;
  created_at: string;
  contacted_at: string | null;
};

export type InscriptionInput = {
  nom: string;
  prenom: string;
  whatsapp: string;
  email: string;
  question?: string;
};

export function normalizeInscription(row: {
  id: number;
  nom: string;
  prenom: string;
  whatsapp: string;
  email: string;
  question: string | null;
  created_at: string | Date;
  contacted_at?: string | Date | null;
}): Inscription {
  return {
    id: row.id,
    nom: row.nom,
    prenom: row.prenom,
    whatsapp: row.whatsapp,
    email: row.email,
    question: row.question,
    created_at:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date(row.created_at).toISOString(),
    contacted_at: row.contacted_at
      ? typeof row.contacted_at === "string"
        ? row.contacted_at
        : new Date(row.contacted_at).toISOString()
      : null,
  };
}
