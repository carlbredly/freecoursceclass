"use client";

import { FormEvent, useState } from "react";

type FormState = {
  nom: string;
  prenom: string;
  whatsapp: string;
  email: string;
  question: string;
};

type Status = "idle" | "loading" | "ok" | "err";

const initial: FormState = {
  nom: "",
  prenom: "",
  whatsapp: "",
  email: "",
  question: "",
};

export default function HomePage() {
  const [form, setForm] = useState<FormState>(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }
      setStatus("ok");
      setForm(initial);
    } catch (err) {
      setStatus("err");
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  return (
    <main className="wrap">
      <span className="badge">Formation gratuite</span>
      <h1>
        Retouche Photo
        <span>GRATUITE</span>
      </h1>
      <p className="sub">
        Lightroom • Photoshop — corrections couleurs, retouche peau, workflow
        complet.
      </p>
      <div className="event">
        <div>
          📅 <b>Jeudi 01 Octobre</b> — Inscription obligatoire, places limitees !
        </div>
      </div>
      <div className="card">
        <form onSubmit={onSubmit}>
          <label htmlFor="nom">Nom</label>
          <input
            id="nom"
            required
            value={form.nom}
            onChange={(e) => update("nom", e.target.value)}
            placeholder="Ton nom"
          />
          <label htmlFor="prenom">Prenom</label>
          <input
            id="prenom"
            required
            value={form.prenom}
            onChange={(e) => update("prenom", e.target.value)}
            placeholder="Ton prenom"
          />
          <label htmlFor="whatsapp">Numero WhatsApp</label>
          <input
            id="whatsapp"
            required
            type="tel"
            value={form.whatsapp}
            onChange={(e) => update("whatsapp", e.target.value)}
            placeholder="+20 1xx xxx xxxx"
          />
          <label htmlFor="email">Email</label>
          <input
            id="email"
            required
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="toi@email.com"
          />
          <label htmlFor="question" className="optional">
            Question
          </label>
          <textarea
            id="question"
            value={form.question}
            onChange={(e) => update("question", e.target.value)}
            placeholder="Une question avant la formation ?"
          />
          <button
            className="submit"
            type="submit"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Envoi..." : "Je m'inscris"}
          </button>
          {status === "ok" && (
            <div className="notice ok">
              Inscription confirmee ! Tu recevras un message de confirmation sur
              WhatsApp.
            </div>
          )}
          {status === "err" && <div className="notice err">{error}</div>}
        </form>
      </div>
      <span className="footer-link">MOBUTU Studios</span>
    </main>
  );
}
