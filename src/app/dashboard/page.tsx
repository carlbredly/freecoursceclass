import { ensureSchema, isNeonConfigured, listInscriptions } from "@/lib/db";
import type { Inscription } from "@/lib/types";
import ContactActions from "./contact-actions";
import DeleteButton from "./delete-button";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function whatsappLink(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  const text = encodeURIComponent(
    `Bonjour à tous,
Nous vous présentons nos sincères excuses pour les désagréments rencontrés. En raison de problèmes sur notre canal de communication, la formation a dû être reportée.

📅 *Nouvelle date : samedi 17 octobre 2026*
🕓 *Heure : 16 h (heure de New York)*

Pour rejoindre le groupe officiel de la formation et recevoir toutes les informations, cliquez ici :
https://chat.whatsapp.com/EBIiyRXvuaTHi4qT89ZBtT

Merci pour votre compréhension et votre patience. Au plaisir de vous retrouver samedi !`
  );
  return `https://wa.me/${digits}?text=${text}`;
}

export default async function DashboardPage() {
  let rows: Inscription[] = [];
  let backend: "neon" | "local" = "local";
  let loadError = "";

  try {
    const schema = await ensureSchema();
    backend = schema.backend;
    rows = await listInscriptions();
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Erreur de connexion a la base de donnees.";
  }

  const contactedCount = rows.filter((row) => row.contacted_at).length;

  return (
    <main className="dash-wrap">
      <div className="dash-header">
        <h1 style={{ fontSize: 22, margin: 0 }}>
          Inscriptions — Formation Retouche Photo
        </h1>
        <span className="stat">
          {rows.length} inscription{rows.length === 1 ? "" : "s"}
          {rows.length > 0
            ? ` · ${contactedCount} contacte${contactedCount === 1 ? "" : "s"}`
            : ""}
          {backend === "neon"
            ? " · Neon"
            : isNeonConfigured()
              ? ""
              : " · local (DATABASE_URL absente)"}
        </span>
      </div>

      {loadError ? <div className="notice err">{loadError}</div> : null}

      {!loadError && rows.length === 0 ? (
        <div className="empty">
          Aucune inscription pour le moment. Le formulaire public est pret.
        </div>
      ) : null}

      {!loadError && rows.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Contact</th>
              <th>Question</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const contacted = Boolean(row.contacted_at);
              return (
                <tr key={row.id} className={contacted ? "row-contacted" : undefined}>
                  <td data-label="Nom">
                    <strong>
                      {row.prenom} {row.nom}
                    </strong>
                  </td>
                  <td data-label="Contact">
                    <div>{row.email}</div>
                    <div style={{ color: "#9fd8d2" }}>{row.whatsapp}</div>
                  </td>
                  <td data-label="Question">{row.question || "—"}</td>
                  <td data-label="Date">{formatDate(row.created_at)}</td>
                  <td data-label="Statut">
                    {contacted ? (
                      <span className="status-pill ok" title={formatDate(row.contacted_at!)}>
                        Contacte
                        <small>{formatDate(row.contacted_at!)}</small>
                      </span>
                    ) : (
                      <span className="status-pill pending">Non contacte</span>
                    )}
                  </td>
                  <td data-label="Actions">
                    <div className="actions">
                      <ContactActions
                        id={row.id}
                        contacted={contacted}
                        whatsappHref={whatsappLink(row.whatsapp)}
                      />
                      <DeleteButton
                        id={row.id}
                        label={`${row.prenom} ${row.nom}`}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
    </main>
  );
}
