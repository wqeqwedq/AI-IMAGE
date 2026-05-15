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

/** 本地日历日 YYYY-MM-DD（用户时区），用于「同一天只自动弹出一次」 */
function getLocalCalendarDay(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAILY_GATE_STORAGE_KEY = "announcement_daily_gate_v1";

type DailyGatePayload = {
  userId: string;
  announcementId: string;
  calendarDay: string;
};

function readDailyGate(): DailyGatePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DAILY_GATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailyGatePayload;
    if (
      typeof parsed?.userId === "string" &&
      typeof parsed?.announcementId === "string" &&
      typeof parsed?.calendarDay === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function alreadyShownThisAnnouncementToday(
  userId: string,
  announcementId: string
): boolean {
  const today = getLocalCalendarDay();
  const stored = readDailyGate();
  return (
    stored !== null &&
    stored.userId === userId &&
    stored.announcementId === announcementId &&
    stored.calendarDay === today
  );
}

function markAnnouncementShownToday(userId: string, announcementId: string) {
  if (typeof window === "undefined") return;
  try {
    const payload: DailyGatePayload = {
      userId,
      announcementId,
      calendarDay: getLocalCalendarDay(),
    };
    localStorage.setItem(DAILY_GATE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // 无痕模式 / 存储配额等：忽略，仅影响当日是否再次弹出
  }
}

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

      // 与 DB「已读」解耦：最新一条公告在每个自然日首次进入后台时弹出一次（同一浏览器）
      if (alreadyShownThisAnnouncementToday(user.id, ann.id)) return;

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

    const msg = (error?.message ?? "").toLowerCase();
    const duplicateRead =
      error?.code === "23505" ||
      msg.includes("duplicate") ||
      msg.includes("unique constraint");
    if (error && !duplicateRead) {
      toast.error(t("saveReadError"));
      return;
    }

    markAnnouncementShownToday(user.id, announcement.id);
    setOpen(false);
    setAnnouncement(null);
  };

  if (!announcement) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        hideClose
        aria-describedby={undefined}
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
