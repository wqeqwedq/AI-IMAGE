"use client";

import {
    adminSearchUserByEmailAction,
    adminUpdateUserCreditsAction,
} from "@/app/actions/admin-users-actions";
import type { UserCreditsView } from "@/lib/admin/users-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

function formatConsumed(v: number | null): string {
    if (v === null) return "—";
    return String(v);
}

export function AdminUsersPanel() {
    const t = useTranslations("admin.usersPanel");

    const [emailInput, setEmailInput] = useState("");
    const [searching, setSearching] = useState(false);
    const [view, setView] = useState<UserCreditsView | null>(null);

    const [imgRem, setImgRem] = useState("");
    const [imgMax, setImgMax] = useState("");
    const [saving, setSaving] = useState(false);

    const applyViewToForm = (v: UserCreditsView) => {
        setImgRem(String(v.image.remaining));
        setImgMax(String(v.image.maxQuota));
    };

    const onSearch = async () => {
        const q = emailInput.trim();
        if (!q) {
            toast.error(t("toastEmailEmpty"));
            return;
        }
        setSearching(true);
        const res = await adminSearchUserByEmailAction(q);
        setSearching(false);
        if (!res.ok) {
            if (res.error === "invalid_email") {
                toast.error(t("toastInvalidEmail"));
            } else if (res.error === "not_found") {
                toast.error(t("toastNotFound"));
                setView(null);
            } else {
                toast.error(res.error);
            }
            return;
        }
        setView(res.data);
        applyViewToForm(res.data);
        toast.success(t("toastFound"));
    };

    const onSave = async () => {
        if (!view) return;
        const parse = (s: string, label: string): number | null => {
            const n = parseInt(s.trim(), 10);
            if (!Number.isFinite(n) || n < 0) {
                toast.error(t("toastBadNumber", { field: label }));
                return null;
            }
            return n;
        };
        const a = parse(imgRem, t("fieldImgRem"));
        const b = parse(imgMax, t("fieldImgMax"));
        if (a === null || b === null) return;

        const hold = view.credits?.credit_hold ?? 0;
        const newBank = a + hold;

        setSaving(true);
        const res = await adminUpdateUserCreditsAction({
            userId: view.userId,
            image_generation_count: newBank,
            max_image_generation_count: b,
        });
        setSaving(false);
        if (!res.ok) {
            toast.error(res.error === "invalid_number" ? t("toastBadNumberGeneric") : res.error);
            return;
        }
        toast.success(t("toastSaved"));
        const next: UserCreditsView = {
            ...view,
            credits: view.credits
                ? {
                      ...view.credits,
                      image_generation_count: newBank,
                      max_image_generation_count: b,
                  }
                : null,
            image: {
                remaining: a,
                maxQuota: b,
                consumed: b > 0 ? Math.max(0, b - a) : null,
            },
        };
        setView(next);
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>{t("searchTitle")}</CardTitle>
                    <CardDescription>{t("searchDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="user-email">{t("emailLabel")}</Label>
                        <Input
                            id="user-email"
                            type="email"
                            autoComplete="off"
                            placeholder={t("emailPlaceholder")}
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && void onSearch()}
                        />
                    </div>
                    <Button type="button" onClick={onSearch} disabled={searching}>
                        {searching ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="mr-2 h-4 w-4" />
                        )}
                        {t("searchBtn")}
                    </Button>
                </CardContent>
            </Card>

            {view && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("summaryTitle")}</CardTitle>
                            <CardDescription>
                                {view.email ? `${view.email} · ` : ""}
                                <span className="font-mono text-xs">{view.userId}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border p-4 space-y-2 max-w-md">
                                <h4 className="font-medium">{t("blockImage")}</h4>
                                <dl className="grid gap-1 text-sm">
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">{t("labelRemaining")}</dt>
                                        <dd>{view.image.remaining}</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">{t("labelMaxQuota")}</dt>
                                        <dd>{view.image.maxQuota > 0 ? view.image.maxQuota : t("noCap")}</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">{t("labelConsumed")}</dt>
                                        <dd>{formatConsumed(view.image.consumed)}</dd>
                                    </div>
                                </dl>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("editTitle")}</CardTitle>
                            <CardDescription>{t("editDesc")}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 max-w-xl">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="f-img-rem">{t("fieldImgRem")}</Label>
                                    <Input
                                        id="f-img-rem"
                                        inputMode="numeric"
                                        value={imgRem}
                                        onChange={(e) => setImgRem(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="f-img-max">{t("fieldImgMax")}</Label>
                                    <Input
                                        id="f-img-max"
                                        inputMode="numeric"
                                        value={imgMax}
                                        onChange={(e) => setImgMax(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button type="button" onClick={onSave} disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t("saveBtn")}
                            </Button>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
