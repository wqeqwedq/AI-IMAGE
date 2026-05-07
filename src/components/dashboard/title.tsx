"use client";

import { useTranslations } from "next-intl";
import React from "react";

export default function Title({ displayName }: { displayName: string }) {
  const dashboardT = useTranslations("dashboard");
  const name = displayName.trim() || "—";
  return (
    <div className="flex items-center justify-center">
      <h2 className="text-3xl font-bold tracking-tight">
        {dashboardT("title")}, {name}
      </h2>
    </div>
  );
}
