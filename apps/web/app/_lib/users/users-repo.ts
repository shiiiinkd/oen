// usersテーブルへのCRUD操作を担当する
import "server-only";
import { getSupabaseAdmin } from "@/app/_lib/supabase/server";

export interface User {
  userId: number;
  lineSub: string;
  displayName?: string;
  avatarUrl?: string;
  linkToken?: string | null;
}

// lineSubからユーザー情報を取得または新規作成
export async function upsertUserByLineSub(params: {
  lineSub: string;
  displayName?: string;
  avatarUrl?: string;
}): Promise<{ userId: number; linkToken: string | null }> {
  const supabase = getSupabaseAdmin();

  // line_subで既存ユーザーを検索
  const { data: existingData, error: existingError } = await supabase
    .from("users")
    .select("*")
    .eq("line_sub", params.lineSub)
    .maybeSingle();

  if (existingError) throw existingError;
  const linkToken = existingData?.link_token ?? crypto.randomUUID();

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        line_sub: params.lineSub,
        display_name: params.displayName,
        avatar_url: params.avatarUrl,
        link_token: linkToken,
      },
      {
        onConflict: "line_sub", // line_subが存在した場合は更新
      },
    )
    .select("*")
    .single();

  if (error) throw error;

  return {
    userId: data.id,
    linkToken: data.link_token,
  };
}

// userIdからユーザー情報を取得
export async function getUserByUserId(userId: number): Promise<User | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    userId: data.id,
    lineSub: data.line_sub,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    linkToken: data.link_token,
  };
}

// lineSubからユーザー情報を取得
export async function getUserByLineSub(lineSub: string): Promise<User | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("line_sub", lineSub)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    userId: data.id,
    lineSub: data.line_sub,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    linkToken: data.link_token,
  };
}
