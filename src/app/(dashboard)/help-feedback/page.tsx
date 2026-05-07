import React from "react";
import FeedbackForm from "@/components/help-feedback/feedback-form";
import HelpFeedbackTitle from "@/components/help-feedback/title";
import { createServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HelpFeedbackPage() {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto space-y-6">
      <HelpFeedbackTitle />
      <FeedbackForm />
    </div>
  );
}
