import "server-only";
import { requireEnv } from "@/app/_lib/env";

export function getSupabaseUrl(): string {
  return requireEnv("SUPABASE_URL");
}
export function getSupabaseServiceRoleKey(): string {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}
