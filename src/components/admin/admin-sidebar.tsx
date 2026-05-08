"use client";

import { cn } from "@/lib/utils";
import {
    Gift,
    LayoutDashboard,
    Megaphone,
    PanelLeftClose,
    Sparkles,
    Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const items = [
    { href: "/admin", key: "overview" as const, icon: LayoutDashboard },
    { href: "/admin/redeem-codes", key: "redeemCodes" as const, icon: Gift },
    { href: "/admin/users", key: "users" as const, icon: Users },
    { href: "/admin/presets", key: "presets" as const, icon: Sparkles },
    { href: "/admin/announcements", key: "announcements" as const, icon: Megaphone },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const t = useTranslations("admin.nav");

    return (
        <aside className="flex w-56 shrink-0 flex-col border-r bg-muted/30">
            <div className="flex h-14 items-center gap-2 border-b px-4">
                <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold tracking-tight">{t("brand")}</span>
            </div>
            <nav className="flex flex-col gap-0.5 p-2">
                {items.map(({ href, key, icon: Icon }) => {
                    const active =
                        href === "/admin"
                            ? pathname === "/admin"
                            : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                                active
                                    ? "bg-background font-medium text-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                            )}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            {t(key)}
                        </Link>
                    );
                })}
            </nav>
            <div className="mt-auto border-t p-3">
                <Link
                    href="/dashboard"
                    className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                    {t("backToApp")}
                </Link>
            </div>
        </aside>
    );
}
