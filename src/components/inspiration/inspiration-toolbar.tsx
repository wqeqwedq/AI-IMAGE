"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getSecondaries,
  PRIMARY_CATEGORY_LIST,
} from "@/lib/inspiration/categories";

function buildQueryString(
  base: URLSearchParams,
  patch: Record<string, string | null | undefined>
) {
  const next = new URLSearchParams(base.toString());
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined || v === "") {
      next.delete(k);
    } else {
      next.set(k, v);
    }
  }
  return next.toString();
}

export default function InspirationToolbar() {
  const t = useTranslations("inspiration");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const primaryFromUrl = searchParams.get("primary") ?? "";
  const secondaryFromUrl = searchParams.get("secondary") ?? "";
  const qFromUrl = searchParams.get("q") ?? "";

  const [localQ, setLocalQ] = useState(qFromUrl);

  useEffect(() => {
    setLocalQ(qFromUrl);
  }, [qFromUrl]);

  const spKey = searchParams.toString();

  useEffect(() => {
    const handle = setTimeout(() => {
      const trimmed = localQ.trim();
      if (trimmed === qFromUrl.trim()) return;
      const qs = buildQueryString(new URLSearchParams(spKey), {
        q: trimmed || null,
      });
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 400);
    return () => clearTimeout(handle);
  }, [localQ, pathname, qFromUrl, router, spKey]);

  const activePrimary = useMemo(() => {
    if (!primaryFromUrl) return "";
    return (PRIMARY_CATEGORY_LIST as readonly string[]).includes(primaryFromUrl)
      ? primaryFromUrl
      : "";
  }, [primaryFromUrl]);

  const secondaries = useMemo(() => {
    if (!activePrimary) return [];
    return [...getSecondaries(activePrimary)];
  }, [activePrimary]);

  const activeSecondary = useMemo(() => {
    if (!activePrimary || !secondaryFromUrl) return "";
    return secondaries.includes(secondaryFromUrl) ? secondaryFromUrl : "";
  }, [activePrimary, secondaryFromUrl, secondaries]);

  const pushParams = (patch: Record<string, string | null | undefined>) => {
    const qs = buildQueryString(searchParams, patch);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const onPickPrimary = (p: string | null) => {
    if (!p) {
      pushParams({ primary: null, secondary: null });
      return;
    }
    const nextSecondary =
      secondaryFromUrl && getSecondaries(p).includes(secondaryFromUrl)
        ? secondaryFromUrl
        : null;
    pushParams({
      primary: p,
      secondary: nextSecondary,
    });
  };

  const onPickSecondary = (s: string | null) => {
    if (!activePrimary) return;
    pushParams({ secondary: s });
  };

  return (
    <div className="mb-8 space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
          aria-label={t("searchPlaceholder")}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("primaryLabel")}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={!activePrimary ? "default" : "outline"}
            className={cn(!activePrimary && "shadow-sm")}
            onClick={() => onPickPrimary(null)}
          >
            {t("allPrimary")}
          </Button>
          {PRIMARY_CATEGORY_LIST.map((p) => (
            <Button
              key={p}
              type="button"
              size="sm"
              variant={activePrimary === p ? "default" : "outline"}
              className={cn(activePrimary === p && "shadow-sm")}
              onClick={() => onPickPrimary(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {activePrimary ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("secondaryLabel")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={!activeSecondary ? "secondary" : "outline"}
              onClick={() => onPickSecondary(null)}
            >
              {t("allSecondary")}
            </Button>
            {secondaries.map((s) => (
              <Button
                key={s}
                type="button"
                size="sm"
                variant={activeSecondary === s ? "secondary" : "outline"}
                className={cn(activeSecondary === s && "ring-2 ring-ring")}
                onClick={() => onPickSecondary(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
