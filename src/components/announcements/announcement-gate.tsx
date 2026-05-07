"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { AnnouncementBody } from "@/components/announcements/announcement-body";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AnnouncementGate() {
  const t = useTranslations("announcement");
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<{
    id: string;
    title: string;
    body: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const now = new Date().toISOString();
      const { data: ann, error: annErr } = await supabase
        .from("announcements")
        .select("id,title,body")
        .eq("is_published", true)
        .lte("starts_at", now)
        .gte("ends_at", now)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled || annErr || !ann) return;

      const { data: read } = await supabase
        .from("announcement_reads")
        .select("id")
        .eq("announcement_id", ann.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled || read) return;

      setAnnouncement(ann);
      setOpen(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const acknowledge = async () => {
    if (!announcement) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setOpen(false);
      setAnnouncement(null);
      return;
    }

    const { error } = await supabase.from("announcement_reads").insert({
      user_id: user.id,
      announcement_id: announcement.id,
    });

    if (error && error.code !== "23505") {
      toast.error(t("saveReadError"));
      return;
    }

    setOpen(false);
    setAnnouncement(null);
  };

  if (!announcement) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        hideClose
        className="max-h-[90vh] max-w-lg overflow-hidden sm:max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="pr-2">{announcement.title}</DialogTitle>
        </DialogHeader>
        <AnnouncementBody body={announcement.body} />
        <DialogFooter className="sm:justify-end">
          <Button type="button" onClick={acknowledge}>
            {t("acknowledge")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
