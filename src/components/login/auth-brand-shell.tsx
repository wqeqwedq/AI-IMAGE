"use client";

import { usePathname } from "next/navigation";
import { AuthBrandPanel } from "@/components/login/auth-brand-panel";
import { AuthBrandPanelProvider } from "@/components/login/auth-brand-panel-context";
import { Logo } from "@/components/logo";

export function AuthBrandShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthBrandPanelProvider key={pathname}>
      <main className="min-h-svh grid lg:grid-cols-2">
        <AuthBrandPanel />
        <div className="flex flex-col items-center justify-center p-8 bg-background">
          <div className="lg:hidden mb-10 w-full flex justify-center">
            <Logo />
          </div>
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </main>
    </AuthBrandPanelProvider>
  );
}
