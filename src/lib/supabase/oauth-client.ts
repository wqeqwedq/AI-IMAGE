"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * OAuth 必须在浏览器里用 createBrowserClient 发起，PKCE verifier 才会写入 cookie；
 * 在 Server Action 里 signInWithOAuth 时 cookies().set 常失败或被静默忽略，回调 exchange 会报 pkce_code_verifier_not_found。
 */
export async function signInWithOAuthProvider(
  provider: "google" | "github"
): Promise<{ error: string | null; url: string | null }> {
  const supabase = createClient();
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
  if (error) return { error: error.message, url: null };
  if (!data.url) return { error: "No OAuth URL returned", url: null };
  return { error: null, url: data.url };
}
