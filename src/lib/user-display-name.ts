import type { User } from "@supabase/supabase-js";

/** 与侧栏 NavUser 一致的展示名 */
export function displayNameFromUser(user: User | null): string {
  if (!user) return "";
  const raw = user.user_metadata?.fullName;
  if (typeof raw === "string" && raw.trim()) {
    return raw.trim();
  }
  return user.email?.split("@")[0] ?? "";
}
