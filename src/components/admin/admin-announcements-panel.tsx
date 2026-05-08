"use client";

import {
    adminCreateAnnouncementAction,
    adminDeleteAnnouncementAction,
} from "@/app/actions/admin-announcements-actions";
import type { AnnouncementRow } from "@/lib/admin/announcements-service";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function toDatetimeLocalValue(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultEnd(start: Date): Date {
    return new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
}

export function AdminAnnouncementsPanel({
    initialRows,
}: {
    initialRows: AnnouncementRow[];
}) {
    const t = useTranslations("admin.announcementsPanel");
    const router = useRouter();

    const initialRange = useMemo(() => {
        const s = new Date();
        return {
            starts: toDatetimeLocalValue(s),
            ends: toDatetimeLocalValue(defaultEnd(s)),
        };
    }, []);

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [startsAt, setStartsAt] = useState(initialRange.starts);
    const [endsAt, setEndsAt] = useState(initialRange.ends);
    const [published, setPublished] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const refresh = () => {
        router.refresh();
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error(t("toastTitle"));
            return;
        }
        if (!body.trim()) {
            toast.error(t("toastBody"));
            return;
        }
        const s = new Date(startsAt);
        const end = new Date(endsAt);
        if (Number.isNaN(s.getTime()) || Number.isNaN(end.getTime())) {
            toast.error(t("toastDate"));
            return;
        }
        if (end <= s) {
            toast.error(t("toastRange"));
            return;
        }

        setSubmitting(true);
        const res = await adminCreateAnnouncementAction({
            title,
            body,
            startsAtIso: s.toISOString(),
            endsAtIso: end.toISOString(),
            isPublished: published,
        });
        setSubmitting(false);

        if (!res.ok) {
            const errMsg =
                res.error === "title_required"
                    ? t("errors.title_required")
                    : res.error === "body_required"
                      ? t("errors.body_required")
                      : res.error === "invalid_date"
                        ? t("errors.invalid_date")
                        : res.error === "invalid_range"
                          ? t("errors.invalid_range")
                          : res.error === "id_required"
                            ? t("errors.id_required")
                            : res.error;
            toast.error(errMsg);
            return;
        }

        toast.success(t("toastCreated"));
        setTitle("");
        setBody("");
        const now = new Date();
        setStartsAt(toDatetimeLocalValue(now));
        setEndsAt(toDatetimeLocalValue(defaultEnd(now)));
        setPublished(true);
        refresh();
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        const res = await adminDeleteAnnouncementAction(deleteId);
        setDeleting(false);
        setDeleteId(null);
        if (!res.ok) {
            toast.error(res.error || t("toastDeleteError"));
            return;
        }
        toast.success(t("toastDeleted"));
        refresh();
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>{t("formTitle")}</CardTitle>
                    <CardDescription>{t("formDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4 max-w-2xl">
                        <div className="space-y-2">
                            <Label htmlFor="ann-title">{t("titleLabel")}</Label>
                            <Input
                                id="ann-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={t("titlePlaceholder")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ann-body">{t("bodyLabel")}</Label>
                            <Textarea
                                id="ann-body"
                                rows={6}
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder={t("bodyPlaceholder")}
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">{t("bodyHint")}</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="ann-start">{t("startsAt")}</Label>
                                <Input
                                    id="ann-start"
                                    type="datetime-local"
                                    value={startsAt}
                                    onChange={(e) => setStartsAt(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ann-end">{t("endsAt")}</Label>
                                <Input
                                    id="ann-end"
                                    type="datetime-local"
                                    value={endsAt}
                                    onChange={(e) => setEndsAt(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="ann-pub"
                                checked={published}
                                onCheckedChange={(v) => setPublished(v === true)}
                            />
                            <Label htmlFor="ann-pub" className="font-normal cursor-pointer">
                                {t("published")}
                            </Label>
                        </div>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("submit")}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t("listTitle")}</CardTitle>
                    <CardDescription>{t("listDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("colTitle")}</TableHead>
                                    <TableHead>{t("colPublished")}</TableHead>
                                    <TableHead className="hidden md:table-cell">{t("colStarts")}</TableHead>
                                    <TableHead className="hidden md:table-cell">{t("colEnds")}</TableHead>
                                    <TableHead className="hidden lg:table-cell">{t("colCreated")}</TableHead>
                                    <TableHead className="w-[80px] text-right">{t("colActions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            {t("empty")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    initialRows.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="max-w-[200px] font-medium truncate">
                                                {row.title}
                                            </TableCell>
                                            <TableCell>
                                                {row.is_published ? (
                                                    <Badge variant="secondary">{t("badgeOn")}</Badge>
                                                ) : (
                                                    <Badge variant="outline">{t("badgeOff")}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground md:table-cell">
                                                {new Date(row.starts_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground md:table-cell">
                                                {new Date(row.ends_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground lg:table-cell">
                                                {new Date(row.created_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    aria-label={t("deleteAria")}
                                                    onClick={() => setDeleteId(row.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("deleteDesc")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                void confirmDelete();
                            }}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("confirmDelete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
