import "server-only";
import { getSupabaseAdmin } from "@/app/_lib/supabase/server";

export type Post = {
  content: string;
  ownerLineSub: string;
  createdAt: string;
};

export async function createPost(
  ownerLineSub: string,
  content: string,
): Promise<{ shareToken: string }> {
  if (content.trim().length === 0) {
    //trimで前後の空白削除→空文字、スペースなどもエラーの対象にする

    throw new Error("Content is required");
  }

  const supabase = getSupabaseAdmin();

  for (let i = 0; i < 5; i++) {
    const shareToken = crypto.randomUUID();
    const row = {
      owner_line_sub: ownerLineSub,
      content: content,
      share_token: shareToken,
    };
    const { error } = await supabase.from("posts").insert(row);
    if (error?.code === "23505") {
      continue;
    } else if (error) {
      throw error;
    }
    return { shareToken };
  }
  throw new Error("Failed to create share_token");
}

export async function getPostByShareToken(
  shareToken: string,
): Promise<Post | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("posts")
    .select("content, owner_line_sub, created_at")
    .eq("share_token", shareToken)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    return null; //maybeSingleは取得失敗でnullを返す→ページ側は404エラーになる
  }
  return {
    content: data.content,
    ownerLineSub: data.owner_line_sub,
    createdAt: data.created_at,
  };
}
