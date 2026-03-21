"use client";

import { useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        if (!supabase) return;
        setLoading(true);
        await supabase.auth.signOut();
        window.location.href = "/";
      }}
      className="rounded-md border border-border px-3 py-2 text-sm transition hover:bg-surface-alt disabled:opacity-60"
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
