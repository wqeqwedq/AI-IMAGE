import { createServer } from "@/lib/supabase/server";
import type { Tables } from "@datatypes.types";

export type UserPresetRow = Tables<"presets">;

export async function fetchUserPresetsForStudio(): Promise<{
  presets: UserPresetRow[];
}> {
  const supabase = await createServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { presets: [] };
  }

  const { data: presets, error: pErr } = await supabase
    .from("presets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (pErr) {
    console.error("fetchUserPresetsForStudio:", pErr.message);
  }

  return {
    presets: presets ?? [],
  };
}
