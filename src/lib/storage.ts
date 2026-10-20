import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

let supabaseClient: SupabaseClient | null = null;
let warnedVercelTmp = false;

/**
 * Server-only Supabase client using Service Role key
 * (Bypasses RLS to read/write public.app_state)
 */
function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey) {
    if (!supabaseClient) {
      supabaseClient = createClient(url, serviceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
    return supabaseClient;
  }
  return null;
}

/**
 * Resolve local/ephemeral file path for key
 */
function getLocalFilePath(key: string): string {
  if (process.env.VERCEL) {
    if (!warnedVercelTmp) {
      console.warn(
        "[storage] Running on Vercel without SUPABASE_SERVICE_ROLE_KEY. State stored in /tmp/agentwala (ephemeral)."
      );
      warnedVercelTmp = true;
    }
    return path.join("/tmp/agentwala", `${key}.json`);
  }
  return path.join(process.cwd(), ".data", `${key}.json`);
}

/**
 * Load state for a given key from Supabase (or local fallback)
 */
export async function loadState<T = any>(key: string): Promise<T | null> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("app_state")
        .select("data")
        .eq("key", key)
        .maybeSingle();

      if (error) {
        console.error(`[storage] Supabase load error for key "${key}":`, error.message);
        return null;
      }
      return (data?.data as T) ?? null;
    } catch (err: any) {
      console.error(`[storage] Unexpected error loading key "${key}" from Supabase:`, err);
      return null;
    }
  }

  // Local dev or Vercel ephemeral fallback
  const filePath = getLocalFilePath(key);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (err: any) {
    console.error(`[storage] Error reading file for key "${key}":`, err.message);
    return null;
  }
}

/**
 * Save state for a given key to Supabase (or local fallback)
 */
export async function saveState(key: string, data: any): Promise<void> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { error } = await supabase.from("app_state").upsert(
        {
          key,
          data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

      if (error) {
        console.error(`[storage] Supabase save error for key "${key}":`, error.message);
        throw error;
      }
      return;
    } catch (err: any) {
      console.error(`[storage] Unexpected error saving key "${key}" to Supabase:`, err);
      throw err;
    }
  }

  // Local dev or Vercel ephemeral fallback
  const filePath = getLocalFilePath(key);
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}
