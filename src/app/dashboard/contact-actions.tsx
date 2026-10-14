"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setContactedAction } from "./actions";

type Props = {
  id: number;
  contacted: boolean;
  whatsappHref: string;
};

export default function ContactActions({ id, contacted, whatsappHref }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  async function markContacted() {
    setLoading(true);
    const formData = new FormData();
    formData.set("id", String(id));
    formData.set("contacted", "1");
    startTransition(async () => {
      await setContactedAction(formData);
      setLoading(false);
      router.refresh();
    });
  }

  async function toggleContacted() {
    setLoading(true);
    const formData = new FormData();
    formData.set("id", String(id));
    formData.set("contacted", contacted ? "0" : "1");
    startTransition(async () => {
      const result = await setContactedAction(formData);
      setLoading(false);
      if (!result.ok) {
        window.alert(result.error || "Mise a jour impossible.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="actions">
      <a
        className="wa-btn"
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        onClick={() => {
          if (!contacted) {
            void markContacted();
          }
        }}
      >
        Contacter
      </a>
      <button
        type="button"
        className={contacted ? "contact-btn done" : "contact-btn"}
        onClick={toggleContacted}
        disabled={loading || pending}
      >
        {loading || pending
          ? "..."
          : contacted
            ? "Marquer non contacte"
            : "Marquer contacte"}
      </button>
    </div>
  );
}
