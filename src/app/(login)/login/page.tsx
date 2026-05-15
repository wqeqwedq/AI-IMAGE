import React, { Suspense } from "react";
import LoginForm from "@/components/login/login-form";
import { createServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/queries";

const LoginPage = async () => {
  const supabase = await createServer();
  const [user] = await Promise.all([getUser(supabase)]);

  if (user) {
    return redirect("/dashboard");
  }
  return (
    <Suspense
      fallback={
        <div className="text-center text-sm text-muted-foreground py-8">…</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage;
