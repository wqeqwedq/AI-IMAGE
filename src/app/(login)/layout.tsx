import { AuthBrandShell } from "@/components/login/auth-brand-shell";
import React from "react";

export default function LoginRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthBrandShell>{children}</AuthBrandShell>;
}
