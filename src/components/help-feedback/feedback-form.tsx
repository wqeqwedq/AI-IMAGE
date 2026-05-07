"use client";

import React, { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { submitFeedbackAction } from "@/app/actions/feedback-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function FeedbackForm() {
  const t = useTranslations("helpFeedback");
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  const onSubmit = () => {
    startTransition(async () => {
      const { success, error } = await submitFeedbackAction(text);
      if (!success) {
        if (error === "EMPTY") {
          toast.error(t("errorEmpty"));
          return;
        }
        if (error === "TOO_LONG") {
          toast.error(t("errorTooLong"));
          return;
        }
        if (error === "UNAUTHORIZED") {
          toast.error(t("errorUnauthorized"));
          return;
        }
        toast.error(error ?? t("errorGeneric"));
        return;
      }
      toast.success(t("success"));
      setText("");
    });
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{t("formTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="feedback-body">{t("label")}</Label>
          <Textarea
            id="feedback-body"
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("placeholder")}
            maxLength={8000}
            disabled={isPending}
          />
        </div>
        <Button type="button" onClick={onSubmit} disabled={isPending}>
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </CardContent>
    </Card>
  );
}
