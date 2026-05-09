"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { signInWithOAuthProvider } from "@/lib/supabase/oauth-client";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export const GithubSignin = () => {
  const loginT = useTranslations("login");
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={async () => {
        const { url, error } = await signInWithOAuthProvider("github");
        if (url) {
          window.location.assign(url);
          return;
        }
        if (error) toast.error(error);
      }}
    >
      <Image
        src="https://authjs.dev/img/providers/github.svg"
        alt="Google logo"
        width={20}
        height={20}
        className="mr-2"
      />
      {loginT("github")}
    </Button>
  );
};
