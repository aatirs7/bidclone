"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function HideToggle({ id, hidden }: { id: string; hidden: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await fetch("/api/admin/hide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, hidden: !hidden }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="whitespace-nowrap rounded-[7px] border border-rule px-3 py-1 text-[12.5px] text-ink-soft transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
    >
      {hidden ? "Unhide" : "Hide"}
    </button>
  );
}
