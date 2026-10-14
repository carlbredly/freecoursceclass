import { z } from "zod";

export const inscriptionSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est requis").max(120),
  prenom: z.string().trim().min(1, "Le prenom est requis").max(120),
  whatsapp: z
    .string()
    .trim()
    .min(8, "Numero WhatsApp invalide")
    .max(40, "Numero WhatsApp trop long"),
  email: z.string().trim().email("Email invalide").max(200),
  question: z.string().trim().max(1000).optional().or(z.literal("")),
});
