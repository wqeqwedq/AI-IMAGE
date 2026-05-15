import SignUpForm from "@/components/login/signup-form";
import { getUser } from "@/lib/supabase/queries";
import { createServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import React from "react";

const SignupPage = async () => {
  const supabase = await createServer();
  const [user] = await Promise.all([getUser(supabase)]);

  if (user) {
    return redirect("/dashboard");
  }
  return <SignUpForm />;
};

export default SignupPage;
