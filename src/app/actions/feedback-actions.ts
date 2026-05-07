"use server";

import { createServer } from "@/lib/supabase/server";

const MAX_LEN = 8000;

export async function submitFeedbackAction(body: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const trimmed = body.trim();
  if (!trimmed) {
    return { success: false, error: "EMPTY" };
  }
  if (trimmed.length > MAX_LEN) {
    return { success: false, error: "TOO_LONG" };
  }

  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "UNAUTHORIZED" };
  }

  const { error } = await supabase.from("feedback_submissions").insert({
    user_id: user.id,
    body: trimmed,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, error: null };
}
