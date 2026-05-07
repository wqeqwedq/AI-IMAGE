"use client";

import React from "react";
import { useTranslations } from "next-intl";

export default function HelpFeedbackTitle() {
  const t = useTranslations("helpFeedback");
  return (
    <h1 className="text-3xl font-bold tracking-tight">{t("pageTitle")}</h1>
  );
}
