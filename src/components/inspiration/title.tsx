"use client";

import { useTranslations } from "next-intl";
import React from "react";

export default function InspirationTitle() {
  const t = useTranslations("inspiration");
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("desc")}</p>
    </div>
  );
}
