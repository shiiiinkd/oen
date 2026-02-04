import "server-only";
import { requireEnv } from "@/app/_lib/env";
import { createClient } from "@supabase/supabase-js";

export function getSupabaseUrl(): string {
  return requireEnv("SUPABASE_URL");
}
export function getSupabaseServiceRoleKey(): string {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}

// 共通のSupabase Admin Client
export function getSupabaseAdmin() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());
}
