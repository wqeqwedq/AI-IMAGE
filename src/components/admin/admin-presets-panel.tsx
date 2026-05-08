"use client";

import {
    adminCreatePresetAction,
    adminDeletePresetAction,
    adminListPresetsAction,
    adminUpdatePresetAction,
} from "@/app/actions/admin-presets-actions";
import type { AdminPresetRow } from "@/lib/admin/presets-service";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
    GENERATION_MODEL_OPTIONS,
    GPT_IMAGE_MODEL,
    RESOLUTION_OPTIONS,
    SIZE_OPTIONS,
    imageUrlsFromTextarea,
} from "@/lib/generation-params";
import {
    DEFAULT_PRIMARY_CATEGORY,
    DEFAULT_SECONDARY_CATEGORY,
    getSecondaries,
    PRIMARY_CATEGORY_LIST,
} from "@/lib/inspiration/categories";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

type Visibility = "all" | "public" | "private" | "platform";

type CreateOwner = "platform" | "self";

type CategoryMode = "tree" | "custom";

const ALL_PRIMARY_VALUE = "__all__";

function pickCategoryFields(
    mode: CategoryMode,
    treePrimary: string,
    treeSecondary: string,
    customPrimary: string,
    customSecondary: string
): { primary_category: string; secondary_category: string } {
    if (mode === "tree") {
        return { primary_category: treePrimary, secondary_category: treeSecondary };
    }
    return { primary_category: customPrimary, secondary_category: customSecondary };
}

export function AdminPresetsPanel({
    initialRows,
    initialTotal,
}: {
    initialRows: AdminPresetRow[];
    initialTotal: number;
}) {
    const t = useTranslations("admin.presetsPanel");
    const locale = useLocale();

    const [rows, setRows] = useState<AdminPresetRow[]>(initialRows);
    const [total, setTotal] = useState(initialTotal);
    const [page, setPage] = useState(1);
    const pageSize = 15;

    const [visibility, setVisibility] = useState<Visibility>("all");
    const [titleSearch, setTitleSearch] = useState("");
    const [primaryFilter, setPrimaryFilter] = useState(ALL_PRIMARY_VALUE);
    const [loadingList, setLoadingList] = useState(false);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<AdminPresetRow | null>(null);
    const [formTitle, setFormTitle] = useState("");
    const [formPublic, setFormPublic] = useState(true);
    const [formPrimary, setFormPrimary] = useState<string>(DEFAULT_PRIMARY_CATEGORY);
    const [formSecondary, setFormSecondary] = useState<string>(DEFAULT_SECONDARY_CATEGORY);
    const [formPrompt, setFormPrompt] = useState("");
    const [formNeg, setFormNeg] = useState("");
    const [formCover, setFormCover] = useState("");
    const [formCategoryMode, setFormCategoryMode] = useState<CategoryMode>("tree");
    const [formCustomPrimary, setFormCustomPrimary] = useState("");
    const [formCustomSecondary, setFormCustomSecondary] = useState("");
    const [saving, setSaving] = useState(false);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [createOwner, setCreateOwner] = useState<CreateOwner>("platform");
    const [createTitle, setCreateTitle] = useState("");
    const [createCover, setCreateCover] = useState("");
    const [createNeg, setCreateNeg] = useState("");
    const [createPrimary, setCreatePrimary] = useState<string>(DEFAULT_PRIMARY_CATEGORY);
    const [createSecondary, setCreateSecondary] = useState<string>(DEFAULT_SECONDARY_CATEGORY);
    const [createCategoryMode, setCreateCategoryMode] = useState<CategoryMode>("tree");
    const [createCustomPrimary, setCreateCustomPrimary] = useState("");
    const [createCustomSecondary, setCreateCustomSecondary] = useState("");
    const [createPublicSelf, setCreatePublicSelf] = useState(true);
    const [createModel, setCreateModel] = useState<string>(GPT_IMAGE_MODEL);
    const [createSize, setCreateSize] = useState<string>("3:4");
    const [createResolution, setCreateResolution] = useState<string>("2k");
    const [createPrompt, setCreatePrompt] = useState("");
    const [createImageUrlsText, setCreateImageUrlsText] = useState("");
    const [creating, setCreating] = useState(false);

    const secondaries = useMemo(() => [...getSecondaries(formPrimary)], [formPrimary]);
    const createSecondaries = useMemo(() => [...getSecondaries(createPrimary)], [createPrimary]);

    const loadPage = useCallback(
        async (p: number) => {
            setLoadingList(true);
            try {
                const res = await adminListPresetsAction({
                    visibility,
                    titleSearch,
                    primaryCategory: primaryFilter === ALL_PRIMARY_VALUE ? "" : primaryFilter,
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
        [visibility, titleSearch, primaryFilter, pageSize, t]
    );

    const openEdit = (row: AdminPresetRow) => {
        setEditing(row);
        setFormTitle(row.title);
        setFormPublic(row.is_public);
        const p = row.primary_category;
        const s = row.secondary_category;
        const primaries = PRIMARY_CATEGORY_LIST as string[];
        const primaryOk = primaries.includes(p);
        const subs = primaryOk ? [...getSecondaries(p)] : [];
        const secondaryOk = primaryOk && subs.includes(s);
        if (primaryOk && secondaryOk) {
            setFormCategoryMode("tree");
            setFormPrimary(p);
            setFormSecondary(s);
            setFormCustomPrimary("");
            setFormCustomSecondary("");
        } else {
            setFormCategoryMode("custom");
            setFormCustomPrimary(p);
            setFormCustomSecondary(s);
            setFormPrimary(DEFAULT_PRIMARY_CATEGORY);
            setFormSecondary(DEFAULT_SECONDARY_CATEGORY);
        }
        setFormPrompt(row.prompt ?? "");
        setFormNeg(row.negative_prompt ?? "");
        setFormCover(row.cover_image ?? "");
        setSheetOpen(true);
    };

    const onPrimaryChange = (v: string) => {
        setFormPrimary(v);
        const subs = getSecondaries(v);
        setFormSecondary(subs[0]!);
    };

    const onCreatePrimaryChange = (v: string) => {
        setCreatePrimary(v);
        const subs = getSecondaries(v);
        setCreateSecondary(subs[0]!);
    };

    const onCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const title = createTitle.trim();
        if (!title) {
            toast.error(t("errTitle"));
            return;
        }
        const prompt = createPrompt.trim();
        if (!prompt) {
            toast.error(t("createErrPrompt"));
            return;
        }
        const cat = pickCategoryFields(
            createCategoryMode,
            createPrimary,
            createSecondary,
            createCustomPrimary,
            createCustomSecondary
        );
        setCreating(true);
        const res = await adminCreatePresetAction({
            ownerType: createOwner,
            title,
            cover_image: createCover.trim() ? createCover.trim() : null,
            negative_prompt: createNeg,
            primary_category: cat.primary_category,
            secondary_category: cat.secondary_category,
            is_public: createOwner === "platform" ? true : createPublicSelf,
            generation: {
                model: createModel,
                prompt,
                n: 1,
                size: createSize,
                resolution: createResolution,
                image_urls: imageUrlsFromTextarea(createImageUrlsText),
            },
        });
        setCreating(false);
        if (!res.ok) {
            const err =
                res.error === "title_required"
                    ? t("errTitle")
                    : res.error === "invalid_categories"
                      ? t("errCategories")
                      : res.error === "category_too_long"
                        ? t("errCategoryTooLong")
                        : res.error;
            toast.error(err);
            return;
        }
        toast.success(t("toastCreateOk"));
        setCreateTitle("");
        setCreateCover("");
        setCreateNeg("");
        setCreatePrimary(DEFAULT_PRIMARY_CATEGORY);
        setCreateSecondary(DEFAULT_SECONDARY_CATEGORY);
        setCreateCategoryMode("tree");
        setCreateCustomPrimary("");
        setCreateCustomSecondary("");
        setCreatePublicSelf(true);
        setCreateModel(GPT_IMAGE_MODEL);
        setCreateSize("3:4");
        setCreateResolution("2k");
        setCreatePrompt("");
        setCreateImageUrlsText("");
        setCreateOwner("platform");
        await loadPage(1);
    };

    const onSaveSheet = async () => {
        if (!editing) return;
        const cat = pickCategoryFields(
            formCategoryMode,
            formPrimary,
            formSecondary,
            formCustomPrimary,
            formCustomSecondary
        );
        setSaving(true);
        const res = await adminUpdatePresetAction({
            id: editing.id,
            title: formTitle,
            is_public: formPublic,
            primary_category: cat.primary_category,
            secondary_category: cat.secondary_category,
            prompt: formPrompt,
            negative_prompt: formNeg,
            cover_image: formCover.trim() ? formCover.trim() : null,
        });
        setSaving(false);
        if (!res.ok) {
            const err =
                res.error === "title_required"
                    ? t("errTitle")
                    : res.error === "invalid_categories"
                      ? t("errCategories")
                      : res.error === "category_too_long"
                        ? t("errCategoryTooLong")
                        : res.error === "not_found"
                        ? t("errNotFound")
                        : res.error === "platform_must_stay_public"
                          ? t("errPlatformPublic")
                          : res.error;
            toast.error(err);
            return;
        }
        toast.success(t("toastSaved"));
        setSheetOpen(false);
        setEditing(null);
        await loadPage(page);
    };

    const onConfirmDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        const res = await adminDeletePresetAction(deleteId);
        setDeleting(false);
        setDeleteId(null);
        if (!res.ok) {
            toast.error(res.error || t("toastDeleteError"));
            return;
        }
        toast.success(t("toastDeleted"));
        await loadPage(rows.length <= 1 && page > 1 ? page - 1 : page);
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>{t("createCardTitle")}</CardTitle>
                    <CardDescription>{t("createCardDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onCreateSubmit} className="grid gap-4">
                        <div className="space-y-2">
                            <Label>{t("createOwner")}</Label>
                            <Select
                                value={createOwner}
                                onValueChange={(v) => setCreateOwner(v as CreateOwner)}
                            >
                                <SelectTrigger className="max-w-md">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="platform">{t("createOwnerPlatform")}</SelectItem>
                                    <SelectItem value="self">{t("createOwnerSelf")}</SelectItem>
                                </SelectContent>
                            </Select>
                            {createOwner === "platform" ? (
                                <p className="text-xs text-muted-foreground">{t("createHintPlatform")}</p>
                            ) : null}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-title">{t("labelTitle")}</Label>
                            <Input
                                id="create-title"
                                value={createTitle}
                                onChange={(e) => setCreateTitle(e.target.value)}
                                placeholder={t("createTitlePlaceholder")}
                            />
                        </div>
                        <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                            <Label className="text-sm font-medium">{t("categoryModeLabel")}</Label>
                            <RadioGroup
                                value={createCategoryMode}
                                onValueChange={(v) => setCreateCategoryMode(v as CategoryMode)}
                                className="flex flex-col gap-3 sm:flex-row sm:gap-8"
                            >
                                <div className="flex items-center gap-2">
                                    <RadioGroupItem value="tree" id="create-cat-tree" />
                                    <Label htmlFor="create-cat-tree" className="cursor-pointer font-normal">
                                        {t("categoryModeTree")}
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <RadioGroupItem value="custom" id="create-cat-custom" />
                                    <Label htmlFor="create-cat-custom" className="cursor-pointer font-normal">
                                        {t("categoryModeCustom")}
                                    </Label>
                                </div>
                            </RadioGroup>
                            {createCategoryMode === "tree" ? (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>{t("labelPrimary")}</Label>
                                        <Select value={createPrimary} onValueChange={onCreatePrimaryChange}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PRIMARY_CATEGORY_LIST.map((p) => (
                                                    <SelectItem key={p} value={p}>
                                                        {p}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t("labelSecondary")}</Label>
                                        <Select value={createSecondary} onValueChange={setCreateSecondary}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {createSecondaries.map((s) => (
                                                    <SelectItem key={s} value={s}>
                                                        {s}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="create-custom-p">{t("labelCustomPrimary")}</Label>
                                        <Input
                                            id="create-custom-p"
                                            value={createCustomPrimary}
                                            onChange={(e) => setCreateCustomPrimary(e.target.value)}
                                            placeholder={t("customPrimaryPlaceholder")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="create-custom-s">{t("labelCustomSecondary")}</Label>
                                        <Input
                                            id="create-custom-s"
                                            value={createCustomSecondary}
                                            onChange={(e) => setCreateCustomSecondary(e.target.value)}
                                            placeholder={t("customSecondaryPlaceholder")}
                                        />
                                    </div>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">{t("categoryCustomHint")}</p>
                        </div>
                        {createOwner === "self" ? (
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="create-public-self"
                                    checked={createPublicSelf}
                                    onCheckedChange={(c) => setCreatePublicSelf(c === true)}
                                />
                                <Label htmlFor="create-public-self" className="font-normal cursor-pointer">
                                    {t("createLabelPublicSelf")}
                                </Label>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 opacity-80">
                                <Checkbox id="create-public-plat" checked disabled />
                                <Label htmlFor="create-public-plat" className="font-normal">
                                    {t("labelPublic")}
                                </Label>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="create-cover">{t("labelCover")}</Label>
                            <Input
                                id="create-cover"
                                value={createCover}
                                onChange={(e) => setCreateCover(e.target.value)}
                                placeholder="https://…"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-neg">{t("labelNeg")}</Label>
                            <Textarea
                                id="create-neg"
                                rows={2}
                                value={createNeg}
                                onChange={(e) => setCreateNeg(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>{t("createLabelModel")}</Label>
                                <Select value={createModel} onValueChange={setCreateModel}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GENERATION_MODEL_OPTIONS.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {locale.startsWith("zh") ? m.labelZh : m.labelEn}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t("createLabelSize")}</Label>
                                <Select value={createSize} onValueChange={setCreateSize}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SIZE_OPTIONS.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t("createLabelResolution")}</Label>
                                <Select value={createResolution} onValueChange={setCreateResolution}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {RESOLUTION_OPTIONS.map((r) => (
                                            <SelectItem key={r} value={r}>
                                                {r}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t("createLabelN")}</Label>
                                <Input value="1" readOnly className="bg-muted" />
                                <p className="text-xs text-muted-foreground">{t("createNHint")}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-prompt">{t("labelPrompt")}</Label>
                            <Textarea
                                id="create-prompt"
                                rows={4}
                                value={createPrompt}
                                onChange={(e) => setCreatePrompt(e.target.value)}
                                placeholder={t("createPromptPlaceholder")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-img-urls">{t("createLabelImageUrls")}</Label>
                            <Textarea
                                id="create-img-urls"
                                rows={3}
                                value={createImageUrlsText}
                                onChange={(e) => setCreateImageUrlsText(e.target.value)}
                                placeholder={t("createImageUrlsPlaceholder")}
                            />
                        </div>
                        <Button type="submit" disabled={creating} className="w-fit">
                            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {t("createSubmit")}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t("filtersTitle")}</CardTitle>
                    <CardDescription>{t("filtersDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
                    <div className="space-y-2">
                        <Label>{t("filterVisibility")}</Label>
                        <Select
                            value={visibility}
                            onValueChange={(v) => setVisibility(v as Visibility)}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("visAll")}</SelectItem>
                                <SelectItem value="public">{t("visPublic")}</SelectItem>
                                <SelectItem value="private">{t("visPrivate")}</SelectItem>
                                <SelectItem value="platform">{t("visPlatform")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 flex-1 min-w-[200px]">
                        <Label htmlFor="preset-search">{t("searchTitle")}</Label>
                        <Input
                            id="preset-search"
                            value={titleSearch}
                            onChange={(e) => setTitleSearch(e.target.value)}
                            placeholder={t("searchPlaceholder")}
                            onKeyDown={(e) => e.key === "Enter" && void loadPage(1)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{t("filterPrimary")}</Label>
                        <Select value={primaryFilter} onValueChange={setPrimaryFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_PRIMARY_VALUE}>{t("primaryAll")}</SelectItem>
                                {PRIMARY_CATEGORY_LIST.map((p) => (
                                    <SelectItem key={p} value={p}>
                                        {p}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="button" onClick={() => loadPage(1)} disabled={loadingList}>
                        {loadingList ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {t("applyFilter")}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t("listTitle")}</CardTitle>
                    <CardDescription>{t("listDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[72px]">{t("colCover")}</TableHead>
                                    <TableHead>{t("colTitle")}</TableHead>
                                    <TableHead>{t("colOwner")}</TableHead>
                                    <TableHead>{t("colVisibility")}</TableHead>
                                    <TableHead>{t("colCategory")}</TableHead>
                                    <TableHead className="text-right">{t("colStats")}</TableHead>
                                    <TableHead>{t("colCreated")}</TableHead>
                                    <TableHead className="w-[100px]">{t("colActions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                                            {t("empty")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rows.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                {row.cover_image ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={row.cover_image}
                                                        alt=""
                                                        className="h-14 w-14 rounded-md object-cover border bg-muted"
                                                    />
                                                ) : (
                                                    <div className="h-14 w-14 rounded-md border bg-muted" />
                                                )}
                                            </TableCell>
                                            <TableCell className="max-w-[220px]">
                                                <div className="font-medium truncate" title={row.title}>
                                                    {row.title}
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono truncate">
                                                    {row.id.slice(0, 8)}…
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {row.user_id === null ? (
                                                    <Badge variant="secondary">{t("badgePlatform")}</Badge>
                                                ) : (
                                                    <span className="font-mono text-xs break-all">
                                                        {row.user_id.slice(0, 8)}…
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {row.is_public ? (
                                                    <Badge>{t("badgePublic")}</Badge>
                                                ) : (
                                                    <Badge variant="outline">{t("badgePrivate")}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm max-w-[160px]">
                                                <div className="truncate">{row.primary_category}</div>
                                                <div className="text-muted-foreground truncate text-xs">
                                                    {row.secondary_category}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-sm text-muted-foreground">
                                                ♥ {row.likes} · {row.forks}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                                {new Date(row.created_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => openEdit(row)}
                                                        aria-label={t("editAria")}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive"
                                                        onClick={() => setDeleteId(row.id)}
                                                        aria-label={t("deleteAria")}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
                        <span>{t("pagination", { total, page, totalPages })}</span>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={page <= 1 || loadingList}
                                onClick={() => loadPage(page - 1)}
                            >
                                {t("prev")}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages || loadingList}
                                onClick={() => loadPage(page + 1)}
                            >
                                {t("next")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="overflow-y-auto sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle>{t("sheetTitle")}</SheetTitle>
                        <SheetDescription>{t("sheetDesc")}</SheetDescription>
                    </SheetHeader>
                    {editing && (
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="pf-title">{t("labelTitle")}</Label>
                                <Input
                                    id="pf-title"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="pf-public"
                                    checked={formPublic}
                                    disabled={editing.user_id === null}
                                    onCheckedChange={(c) => setFormPublic(c === true)}
                                />
                                <Label htmlFor="pf-public" className="font-normal cursor-pointer">
                                    {t("labelPublic")}
                                </Label>
                            </div>
                            {editing.user_id === null ? (
                                <p className="text-xs text-muted-foreground">{t("hintPlatformPublic")}</p>
                            ) : null}
                            <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                                <Label className="text-sm font-medium">{t("categoryModeLabel")}</Label>
                                <RadioGroup
                                    value={formCategoryMode}
                                    onValueChange={(v) => setFormCategoryMode(v as CategoryMode)}
                                    className="flex flex-col gap-3 sm:flex-row sm:gap-8"
                                >
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="tree" id="edit-cat-tree" />
                                        <Label htmlFor="edit-cat-tree" className="cursor-pointer font-normal">
                                            {t("categoryModeTree")}
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="custom" id="edit-cat-custom" />
                                        <Label htmlFor="edit-cat-custom" className="cursor-pointer font-normal">
                                            {t("categoryModeCustom")}
                                        </Label>
                                    </div>
                                </RadioGroup>
                                {formCategoryMode === "tree" ? (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>{t("labelPrimary")}</Label>
                                            <Select value={formPrimary} onValueChange={onPrimaryChange}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PRIMARY_CATEGORY_LIST.map((p) => (
                                                        <SelectItem key={p} value={p}>
                                                            {p}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t("labelSecondary")}</Label>
                                            <Select value={formSecondary} onValueChange={setFormSecondary}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {secondaries.map((s) => (
                                                        <SelectItem key={s} value={s}>
                                                            {s}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-custom-p">{t("labelCustomPrimary")}</Label>
                                            <Input
                                                id="edit-custom-p"
                                                value={formCustomPrimary}
                                                onChange={(e) => setFormCustomPrimary(e.target.value)}
                                                placeholder={t("customPrimaryPlaceholder")}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-custom-s">{t("labelCustomSecondary")}</Label>
                                            <Input
                                                id="edit-custom-s"
                                                value={formCustomSecondary}
                                                onChange={(e) => setFormCustomSecondary(e.target.value)}
                                                placeholder={t("customSecondaryPlaceholder")}
                                            />
                                        </div>
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground">{t("categoryCustomHint")}</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pf-cover">{t("labelCover")}</Label>
                                <Input
                                    id="pf-cover"
                                    value={formCover}
                                    onChange={(e) => setFormCover(e.target.value)}
                                    placeholder="https://…"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pf-prompt">{t("labelPrompt")}</Label>
                                <Textarea
                                    id="pf-prompt"
                                    rows={5}
                                    value={formPrompt}
                                    onChange={(e) => setFormPrompt(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pf-neg">{t("labelNeg")}</Label>
                                <Textarea
                                    id="pf-neg"
                                    rows={3}
                                    value={formNeg}
                                    onChange={(e) => setFormNeg(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <SheetFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                            {t("cancel")}
                        </Button>
                        <Button type="button" onClick={() => void onSaveSheet()} disabled={saving || !editing}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {t("save")}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("deleteDesc")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={(e) => {
                                e.preventDefault();
                                void onConfirmDelete();
                            }}
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirmDelete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
