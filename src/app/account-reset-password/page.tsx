import { AuthBrandShell } from "@/components/login/auth-brand-shell";
import { ChangePassword } from "@/components/account/change-password";
import React from "react";

const AccountResetPasswordPage = () => {
  return (
    <AuthBrandShell>
      <ChangePassword />
    </AuthBrandShell>
  );
};

export default AccountResetPasswordPage;
