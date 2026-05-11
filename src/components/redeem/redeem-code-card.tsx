"use client";

import { redeemCodeAction } from "@/app/actions/redeem-code-action";
import type { RedeemPurchaseLinkRow } from "@/lib/supabase/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function safeHttpUrl(raw: string): string | null {
    try {
        const u = new URL(raw.trim());
        if (u.protocol !== "http:" && u.protocol !== "https:") return null;
        return u.href;
    } catch {
        return null;
    }
}

export function RedeemCodeCard({
    purchaseLinks,
}: {
    purchaseLinks: RedeemPurchaseLinkRow[];
}) {
    const t = useTranslations("billing.redeem");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    const safeLinks = useMemo(
        () =>
            purchaseLinks
                .map((row) => {
                    const href = safeHttpUrl(row.url);
                    if (!href) return null;
                    return { id: row.id, label: row.label.trim() || href, href };
                })
                .filter((x): x is { id: string; label: string; href: string } => x !== null),
        [purchaseLinks]
    );

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = code.trim();
        if (!trimmed) {
            toast.error(t("empty"));
            return;
        }
        setLoading(true);
        const result = await redeemCodeAction(trimmed);
        setLoading(false);
        if (result.ok) {
            toast.success(t("success", { points: result.points }));
            setCode("");
            return;
        }
        const err = result.error;
        const msg =
            err === "rpc_error" && result.message
                ? result.message
                : err === "not_authenticated"
                  ? t("not_authenticated")
                  : err === "invalid_format"
                    ? t("invalid_format")
                    : err === "rate_limited"
                      ? t("rate_limited")
                      : err === "invalid_code"
                        ? t("invalid_code")
                        : err === "already_used"
                          ? t("already_used")
                          : err === "expired"
                            ? t("expired")
                            : err === "concurrent_use"
                              ? t("concurrent_use")
                              : t("unknown");
        toast.error(msg);
    };

    return (
        <Card className="max-w-5xl">
            <CardHeader>
                <CardTitle>{t("title")}</CardTitle>
                <CardDescription>{t("description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {safeLinks.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-foreground">{t("purchaseChannelsTitle")}</p>
                        <div className="flex flex-wrap gap-2">
                            {safeLinks.map((link) => (
                                <Button key={link.id} variant="outline" size="sm" asChild>
                                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="mr-2 h-3.5 w-3.5 shrink-0 opacity-70" />
                                        {link.label}
                                    </a>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
                <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="redeem-code">{t("label")}</Label>
                        <Input
                            id="redeem-code"
                            name="redeem-code"
                            autoComplete="off"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            disabled={loading}
                            className="font-mono uppercase"
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="shrink-0 sm:w-auto w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t("submit")}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
