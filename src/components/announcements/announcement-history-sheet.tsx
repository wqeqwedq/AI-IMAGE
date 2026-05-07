"use client";

import { format } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { Bell, ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { AnnouncementBody } from "@/components/announcements/announcement-body";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  starts_at: string;
  ends_at: string;
};

export function AnnouncementHistorySheet() {
  const t = useTranslations("announcement");
  const locale = useLocale();
  const dateLocale = locale.startsWith("zh") ? zhCN : enUS;
  const datePattern = locale.startsWith("zh") ? "yyyy-MM-dd HH:mm" : "MMM d, yyyy HH:mm";

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AnnouncementRow[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("announcements")
        .select("id,title,body,starts_at,ends_at")
        .eq("is_published", true)
        .lte("starts_at", now)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!cancelled) {
        if (error) {
          setItems([]);
        } else {
          setItems((data as AnnouncementRow[]) ?? []);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const nowMs = Date.now();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={t("openHistoryAria")}
        >
          <Bell className="h-5 w-5" strokeWidth={1.75} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-md"
      >
        <SheetHeader className="space-y-1 border-b pb-4 text-left">
          <SheetTitle>{t("historyTitle")}</SheetTitle>
          <p className="text-sm font-normal text-muted-foreground">
            {t("historySubtitle")}
          </p>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1 py-4 pr-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">{t("historyLoading")}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("historyEmpty")}</p>
          ) : (
            <ul className="space-y-2">
              {items.map((row) => {
                const ended = new Date(row.ends_at).getTime() < nowMs;
                return (
                  <li key={row.id} className="rounded-lg border bg-card">
                    <Collapsible className="group">
                      <CollapsibleTrigger className="flex w-full items-start gap-2 px-3 py-3 text-left hover:bg-muted/50 group-data-[state=open]:bg-muted/30">
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                        <span className="min-w-0 flex-1 space-y-1.5">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-medium leading-snug">
                              {row.title}
                            </span>
                            <Badge
                              variant={ended ? "secondary" : "default"}
                              className="shrink-0 text-xs font-normal"
                            >
                              {ended ? t("statusEnded") : t("statusActive")}
                            </Badge>
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {format(new Date(row.starts_at), datePattern, {
                              locale: dateLocale,
                            })}{" "}
                            —{" "}
                            {format(new Date(row.ends_at), datePattern, {
                              locale: dateLocale,
                            })}
                          </span>
                        </span>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div
                          className={cn(
                            "border-t px-3 py-3",
                            "bg-muted/20"
                          )}
                        >
                          <AnnouncementBody
                            body={row.body}
                            variant="embedded"
                          />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
