"use client";

import {
    adminExportRedeemCodesTxtAction,
    adminGenerateRedeemCodesAction,
    adminListRedeemCodesAction,
} from "@/app/actions/admin-redeem-codes-actions";
import type { RedeemCodeRow } from "@/lib/admin/redeem-codes-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const PRESETS = [10, 50, 100, 200, 500];

type StatusFilter = "all" | "unused" | "used";

export function AdminRedeemCodesPanel({
    initialRows,
    initialTotal,
}: {
    initialRows: RedeemCodeRow[];
    initialTotal: number;
}) {
    const t = useTranslations("admin.redeemCodes");

    const [rows, setRows] = useState<RedeemCodeRow[]>(initialRows);
    const [total, setTotal] = useState(initialTotal);
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const [genPointsMode, setGenPointsMode] = useState<"preset" | "custom">("preset");
    const [genPreset, setGenPreset] = useState(String(PRESETS[2]));
    const [genCustomPoints, setGenCustomPoints] = useState("");
    const [genCount, setGenCount] = useState("10");
    const [generating, setGenerating] = useState(false);

    const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
    const [filterPointsMode, setFilterPointsMode] = useState<"all" | "number">("all");
    const [filterPointsValue, setFilterPointsValue] = useState("");
    const [loadingList, setLoadingList] = useState(false);

    const [exporting, setExporting] = useState(false);

    const resolveGenPoints = (): number => {
        if (genPointsMode === "custom") {
            const n = parseInt(genCustomPoints.trim(), 10);
            if (!Number.isFinite(n) || n < 1) throw new Error("bad_points");
            return n;
        }
        return parseInt(genPreset, 10);
    };

    const resolveFilterPoints = (): "all" | number => {
        if (filterPointsMode !== "number") return "all";
        const n = parseInt(filterPointsValue.trim(), 10);
        if (!Number.isFinite(n) || n < 1) return "all";
        return n;
    };

    const loadPage = useCallback(
        async (p: number, status: StatusFilter, points: "all" | number) => {
            setLoadingList(true);
            try {
                const res = await adminListRedeemCodesAction({
                    pointsFilter: points,
                    statusFilter: status,
                    page: p,
                    pageSize,
                });
                setRows(res.rows);
                setTotal(res.total);
                setPage(p);
            } catch {
                toast.error(t("toastLoadError"));
            } finally {
                setLoadingList(false);
            }
        },
        [pageSize, t]
    );

    const onGenerate = async () => {
        let points: number;
        try {
            points = resolveGenPoints();
        } catch {
            toast.error(t("toastBadPoints"));
            return;
        }
        const count = parseInt(genCount.trim(), 10);
        if (!Number.isFinite(count) || count < 1 || count > 500) {
            toast.error(t("toastBadCount"));
            return;
        }
        setGenerating(true);
        const result = await adminGenerateRedeemCodesAction(points, count);
        setGenerating(false);
        if (result.ok) {
            toast.success(t("toastGenerated", { n: result.inserted }));
            await loadPage(1, filterStatus, resolveFilterPoints());
            return;
        }
        if (result.error === "generate_incomplete") {
            toast.error(t("toastGenIncomplete"));
            return;
        }
        toast.error(result.error || t("toastGenError"));
    };

    const onApplyFilters = () => {
        const pf = resolveFilterPoints();
        loadPage(1, filterStatus, pf);
    };

    const onExportTxt = async () => {
        const pointsFilter = resolveFilterPoints();
        setExporting(true);
        const result = await adminExportRedeemCodesTxtAction({
            pointsFilter,
            statusFilter: filterStatus,
        });
        setExporting(false);
        if (!result.ok) {
            toast.error(result.error || t("toastExportError"));
            return;
        }
        const blob = new Blob([result.text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `redeem-codes-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t("toastExported"));
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>{t("generateTitle")}</CardTitle>
                    <CardDescription>{t("generateDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                    <div className="space-y-2">
                        <Label>{t("pointsLabel")}</Label>
                        <Select
                            value={genPointsMode}
                            onValueChange={(v) => setGenPointsMode(v as "preset" | "custom")}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="preset">{t("pointsPreset")}</SelectItem>
                                <SelectItem value="custom">{t("pointsCustom")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {genPointsMode === "preset" ? (
                        <div className="space-y-2">
                            <Label className="invisible sm:block">{t("presetPick")}</Label>
                            <Select value={genPreset} onValueChange={setGenPreset}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRESETS.map((p) => (
                                        <SelectItem key={p} value={String(p)}>
                                            {p}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="gen-points">{t("customPoints")}</Label>
                            <Input
                                id="gen-points"
                                type="number"
                                min={1}
                                className="w-[140px]"
                                value={genCustomPoints}
                                onChange={(e) => setGenCustomPoints(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="gen-count">{t("countLabel")}</Label>
                        <Input
                            id="gen-count"
                            type="number"
                            min={1}
                            max={500}
                            className="w-[120px]"
                            value={genCount}
                            onChange={(e) => setGenCount(e.target.value)}
                        />
                    </div>
                    <Button type="button" onClick={onGenerate} disabled={generating}>
                        {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t("generateBtn")}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t("listTitle")}</CardTitle>
                    <CardDescription>{t("listDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
                        <div className="space-y-2">
                            <Label>{t("filterStatus")}</Label>
                            <Select
                                value={filterStatus}
                                onValueChange={(v) => setFilterStatus(v as StatusFilter)}
                            >
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("statusAll")}</SelectItem>
                                    <SelectItem value="unused">{t("statusUnused")}</SelectItem>
                                    <SelectItem value="used">{t("statusUsed")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t("filterPoints")}</Label>
                            <Select
                                value={filterPointsMode}
                                onValueChange={(v) => setFilterPointsMode(v as "all" | "number")}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("pointsAll")}</SelectItem>
                                    <SelectItem value="number">{t("pointsExact")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {filterPointsMode === "number" && (
                            <div className="space-y-2">
                                <Label htmlFor="filter-points">{t("pointsValue")}</Label>
                                <Input
                                    id="filter-points"
                                    type="number"
                                    min={1}
                                    className="w-[120px]"
                                    value={filterPointsValue}
                                    onChange={(e) => setFilterPointsValue(e.target.value)}
                                />
                            </div>
                        )}
                        <Button type="button" variant="secondary" onClick={onApplyFilters} disabled={loadingList}>
                            {loadingList && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("applyFilter")}
                        </Button>
                        <Button type="button" variant="outline" onClick={onExportTxt} disabled={exporting}>
                            {exporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("exportTxt")}
                        </Button>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-mono">{t("colCode")}</TableHead>
                                    <TableHead>{t("colPoints")}</TableHead>
                                    <TableHead>{t("colStatus")}</TableHead>
                                    <TableHead>{t("colCreated")}</TableHead>
                                    <TableHead>{t("colUsedAt")}</TableHead>
                                    <TableHead className="hidden md:table-cell">{t("colUsedBy")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            {t("empty")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rows.map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell className="max-w-[220px] truncate font-mono text-xs">
                                                {r.code}
                                            </TableCell>
                                            <TableCell>{r.points}</TableCell>
                                            <TableCell>
                                                {r.status === "unused" ? t("statusUnused") : t("statusUsed")}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                                {r.created_at
                                                    ? new Date(r.created_at).toLocaleString()
                                                    : "—"}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                                {r.used_at
                                                    ? new Date(r.used_at).toLocaleString()
                                                    : "—"}
                                            </TableCell>
                                            <TableCell className="hidden max-w-[120px] truncate font-mono text-xs md:table-cell">
                                                {r.used_by ? `${r.used_by.slice(0, 8)}…` : "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                        <span>
                            {t("pagination", { total, page, totalPages })}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={page <= 1 || loadingList}
                                onClick={() =>
                                    loadPage(
                                        page - 1,
                                        filterStatus,
                                        resolveFilterPoints()
                                    )
                                }
                            >
                                {t("prev")}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages || loadingList}
                                onClick={() =>
                                    loadPage(
                                        page + 1,
                                        filterStatus,
                                        resolveFilterPoints()
                                    )
                                }
                            >
                                {t("next")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
