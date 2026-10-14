"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteInscriptionAction } from "./actions";

type Props = {
  id: number;
  label: string;
};

export default function DeleteButton({ id, label }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const confirmed = window.confirm(
      `Supprimer l'inscription de ${label} ? Cette action est definitive.`
    );
    if (!confirmed) {
      return;
    }

    setLoading(true);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await deleteInscriptionAction(formData);
      setLoading(false);
      if (!result.ok) {
        window.alert(result.error || "Suppression impossible.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="del-btn"
        disabled={loading || pending}
      >
        {loading || pending ? "..." : "Supprimer"}
      </button>
    </form>
  );
}
