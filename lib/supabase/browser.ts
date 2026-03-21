"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const env = getSupabaseEnv();
  if (!env) {
    return null;
  }

  browserClient = createBrowserClient(env.url, env.anonKey);
  return browserClient;
}
