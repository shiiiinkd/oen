import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  throw new Error("Environment variable SUPABASE_URL is not set");
}
if (!key) {
  throw new Error("Environment variable SUPABASE_SERVICE_ROLE_KEY is not set");
}

export const supabase = createClient(url, key);
