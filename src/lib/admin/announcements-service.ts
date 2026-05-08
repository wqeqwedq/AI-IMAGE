import "server-only";

import type { Tables, TablesInsert } from "@datatypes.types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "./require-admin";

export type AnnouncementRow = Tables<"announcements">;

export async function listAnnouncementsAdmin(): Promise<AnnouncementRow[]> {
    await requireAdmin();

    const { data, error } = await supabaseAdmin
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (data ?? []) as AnnouncementRow[];
}

export async function createAnnouncement(params: {
    title: string;
    body: string;
    startsAtIso: string;
    endsAtIso: string;
    isPublished: boolean;
}): Promise<void> {
    await requireAdmin();

    const title = params.title.trim();
    if (!title) {
        throw new Error("title_required");
    }
    if (!params.body.trim()) {
        throw new Error("body_required");
    }

    const starts = new Date(params.startsAtIso);
    const ends = new Date(params.endsAtIso);
    if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) {
        throw new Error("invalid_date");
    }
    if (ends <= starts) {
        throw new Error("invalid_range");
    }

    const row: TablesInsert<"announcements"> = {
        title,
        body: params.body,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        is_published: params.isPublished,
    };

    const { error } = await supabaseAdmin.from("announcements").insert(row);

    if (error) {
        throw new Error(error.message);
    }
}

export async function deleteAnnouncement(id: string): Promise<void> {
    await requireAdmin();

    if (!id?.trim()) {
        throw new Error("id_required");
    }

    const { error } = await supabaseAdmin.from("announcements").delete().eq("id", id);

    if (error) {
        throw new Error(error.message);
    }
}
