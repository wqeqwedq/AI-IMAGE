"use server";

import {
    createAnnouncement,
    deleteAnnouncement,
} from "@/lib/admin/announcements-service";
import { revalidatePath } from "next/cache";

export async function adminCreateAnnouncementAction(input: {
    title: string;
    body: string;
    startsAtIso: string;
    endsAtIso: string;
    isPublished: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
        await createAnnouncement(input);
        revalidatePath("/admin/announcements");
        return { ok: true };
    } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        return { ok: false, error: msg };
    }
}

export async function adminDeleteAnnouncementAction(
    id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
        await deleteAnnouncement(id);
        revalidatePath("/admin/announcements");
        return { ok: true };
    } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        return { ok: false, error: msg };
    }
}
