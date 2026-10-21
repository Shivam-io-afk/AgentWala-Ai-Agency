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

export type StorageResult<T = any> = { data: T | null; version: number } & (T extends object ? T : {});

/**
 * Load state for a given key from Supabase (or local fallback).
 * Returns { data, version } with optimistic concurrency tracking.
 */
export async function loadState<T = any>(key: string): Promise<StorageResult<T>> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("app_state")
        .select("data, version")
        .eq("key", key)
        .maybeSingle();

      if (error) {
        console.error(`[storage] Supabase load error for key "${key}":`, error.message);
        return { data: null, version: 0 } as StorageResult<T>;
      }

      const parsed = (data?.data as T) ?? null;
      const version = data?.version != null ? Number(data.version) : 0;
      const result: any = { data: parsed, version };

      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        Object.assign(result, parsed);
      }
      return result as StorageResult<T>;
    } catch (err: any) {
      console.error(`[storage] Unexpected error loading key "${key}" from Supabase:`, err);
      return { data: null, version: 0 } as StorageResult<T>;
    }
  }

  // Local dev or Vercel ephemeral fallback
  const filePath = getLocalFilePath(key);
  if (!fs.existsSync(filePath)) {
    return { data: null, version: 0 } as StorageResult<T>;
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as T;
    const result: any = { data: parsed, version: 0 };

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      Object.assign(result, parsed);
    }
    return result as StorageResult<T>;
  } catch (err: any) {
    console.error(`[storage] Error reading file for key "${key}":`, err.message);
    return { data: null, version: 0 } as StorageResult<T>;
  }
}

/**
 * Save state for a given key using optimistic concurrency control RPC.
 * Returns { success, newVersion } - success is false if version conflict occurred.
 */
export async function saveState(
  key: string,
  data: any,
  expectedVersion?: number | null
): Promise<{ success: boolean; newVersion: number | null }> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      // Ensure p_expected_version is ALWAYS passed as a bigint/number (0 if row didn't exist). Never pass null.
      const versionToPass =
        typeof expectedVersion === "number" && !isNaN(expectedVersion)
          ? expectedVersion
          : 0;

      const { data: rpcRes, error } = await supabase.rpc("save_app_state", {
        p_key: key,
        p_data: data,
        p_expected_version: versionToPass,
      });

      if (error) {
        // Fallback to direct upsert if save_app_state RPC is not yet registered
        console.warn(`[storage] RPC save_app_state fallback for "${key}": ${error.message}`);
        const { error: upsertErr } = await supabase.from("app_state").upsert(
          {
            key,
            data,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );
        if (upsertErr) throw upsertErr;
        return { success: true, newVersion: (expectedVersion || 0) + 1 };
      }

      if (rpcRes === null) {
        return { success: false, newVersion: null };
      }

      return { success: true, newVersion: Number(rpcRes) };
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
  return { success: true, newVersion: (expectedVersion || 0) + 1 };
}
