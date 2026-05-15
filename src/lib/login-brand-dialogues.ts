import { createClient } from "@/lib/supabase/client";

export const LOGIN_BRAND_SPEAKERS = [
    "purple",
    "black",
    "yellow",
    "orange",
] as const;

export type LoginBrandSpeaker = (typeof LOGIN_BRAND_SPEAKERS)[number];

export type LoginBrandLine = {
    line_order: number;
    speaker: LoginBrandSpeaker;
    body_zh: string;
    body_en: string;
};

export type LoginBrandDialogueBundle = {
    id: string;
    slug: string | null;
    created_at: string;
    lines: LoginBrandLine[];
};

/** 550×400 舞台内：气泡锚在对应小人「头」上方（left 为距舞台左缘 px，bottom 为距舞台底缘 px） */
export const LOGIN_BRAND_STAGE_ANCHORS: Record<
    LoginBrandSpeaker,
    { left: number; bottom: number }
> = {
    orange: { left: 118, bottom: 212 },
    purple: { left: 162, bottom: 332 },
    black: { left: 302, bottom: 300 },
    yellow: { left: 378, bottom: 256 },
};

/** 气泡底「小尾巴」相对气泡宽度的水平位置（0–100），略偏向对应小人一侧 */
export const LOGIN_BRAND_BUBBLE_TAIL_PCT: Record<LoginBrandSpeaker, number> = {
    purple: 34,
    black: 56,
    yellow: 52,
    orange: 44,
};

function hashString31(input: string): number {
    let h = 0;
    for (let i = 0; i < input.length; i++) {
        h = (h * 31 + input.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

/** 同一自然日 + 行号下稳定的轻微错位（像素级） */
export function loginBrandBubbleJitter(
    dayKey: string,
    lineOrder: number,
    speaker: LoginBrandSpeaker
): { x: number; y: number; rotate: number } {
    const h = hashString31(`${dayKey}-${lineOrder}-${speaker}`);
    return {
        x: (h % 19) - 9,
        y: ((h >> 3) % 15) - 7,
        rotate: (((h >> 7) % 7) - 3) * 0.35,
    };
}

/** 拉取失败或库无可用套时使用（与首套文案一致） */
export const LOGIN_BRAND_DIALOGUE_FALLBACK_LINES: LoginBrandLine[] = [
    {
        line_order: 1,
        speaker: "purple",
        body_zh: "他已经改了 17 次 prompt。",
        body_en: "They've already changed the prompt 17 times.",
    },
    {
        line_order: 2,
        speaker: "black",
        body_zh: "现在加上了「电影感」。",
        body_en: 'Now they\'ve added "cinematic vibes."',
    },
    {
        line_order: 3,
        speaker: "yellow",
        body_zh: "还有「史诗级光影」。",
        body_en: 'Plus "epic lighting."',
    },
    {
        line_order: 4,
        speaker: "orange",
        body_zh: "下一步就是「8K 超清」。",
        body_en: 'Next up will be "8K ultra sharp."',
    },
];

const BUNDLE_CACHE_TTL_MS = 5 * 60 * 1000;

let bundleCache: { fetchedAt: number; bundles: LoginBrandDialogueBundle[] } | null =
    null;

const SLUG_STABLE_ORDER: Record<string, number> = {
    "prompt-17-times": 0,
    "creator-loop": 1,
    "late-night-avatar": 2,
    visitors: 3,
    "cyberpunk-not-cyberpunk": 4,
    "cyberpunk-but-subtle": 5,
    "progress-meinv-to-essay": 6,
    "vague-high-end-brief": 7,
    "work-hours-inspiration": 8,
    "cinematic-sounds-expensive": 9,
    "login-page-contemplation": 10,
    "premium-gray-english": 11,
    "long-prompt-short-win": 12,
    "translucent-breathing-memes": 13,
    "masterpiece-god-camera": 14,
    "ai-art-human-taste": 15,
};

function sortBundlesStable(bundles: LoginBrandDialogueBundle[]): LoginBrandDialogueBundle[] {
    return [...bundles].sort((a, b) => {
        const pa = a.slug != null ? (SLUG_STABLE_ORDER[a.slug] ?? 100) : 100;
        const pb = b.slug != null ? (SLUG_STABLE_ORDER[b.slug] ?? 100) : 100;
        if (pa !== pb) return pa - pb;
        return a.created_at.localeCompare(b.created_at);
    });
}

function isSpeaker(value: string): value is LoginBrandSpeaker {
    return (LOGIN_BRAND_SPEAKERS as readonly string[]).includes(value);
}

/** Asia/Shanghai 自然日 YYYY-MM-DD */
export function getShanghaiCalendarDayKey(date: Date = new Date()): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

/** 稳定哈希，用于同一自然日在多套中择一 */
export function pickBundleIndexForDayKey(dayKey: string, count: number): number {
    if (count <= 0) return 0;
    let h = 2166136261 >>> 0;
    for (let i = 0; i < dayKey.length; i++) {
        h ^= dayKey.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h % count;
}

export async function fetchLoginBrandDialogueBundles(): Promise<LoginBrandDialogueBundle[]> {
    const now = Date.now();
    if (bundleCache && now - bundleCache.fetchedAt < BUNDLE_CACHE_TTL_MS) {
        return bundleCache.bundles;
    }

    const supabase = createClient();
    const { data: sets, error: setsErr } = await supabase
        .from("login_brand_dialogue_sets")
        .select("id, slug, created_at")
        .eq("enabled", true)
        .order("created_at", { ascending: true });

    if (setsErr || !sets?.length) {
        bundleCache = { fetchedAt: now, bundles: [] };
        return [];
    }

    const ids = sets.map((s) => s.id);
    const { data: lineRows, error: linesErr } = await supabase
        .from("login_brand_dialogue_lines")
        .select("set_id, line_order, speaker, body_zh, body_en")
        .in("set_id", ids)
        .order("line_order", { ascending: true });

    if (linesErr || !lineRows?.length) {
        bundleCache = { fetchedAt: now, bundles: [] };
        return [];
    }

    const bySet = new Map<string, LoginBrandLine[]>();
    for (const row of lineRows) {
        if (!isSpeaker(row.speaker)) continue;
        const line: LoginBrandLine = {
            line_order: row.line_order,
            speaker: row.speaker,
            body_zh: row.body_zh,
            body_en: row.body_en,
        };
        const list = bySet.get(row.set_id) ?? [];
        list.push(line);
        bySet.set(row.set_id, list);
    }

    const bundles: LoginBrandDialogueBundle[] = sortBundlesStable(
        sets
            .map((s) => {
                const raw = bySet.get(s.id) ?? [];
                const lines = [...raw].sort((a, b) => a.line_order - b.line_order);
                return {
                    id: s.id,
                    slug: s.slug,
                    created_at: s.created_at,
                    lines,
                };
            })
            .filter((b) => b.lines.length > 0)
    );

    bundleCache = { fetchedAt: now, bundles };
    return bundles;
}

export function pickLinesForToday(
    bundles: LoginBrandDialogueBundle[],
    dayKey: string = getShanghaiCalendarDayKey()
): LoginBrandLine[] {
    if (!bundles.length) {
        return LOGIN_BRAND_DIALOGUE_FALLBACK_LINES;
    }
    const idx = pickBundleIndexForDayKey(dayKey, bundles.length);
    return bundles[idx]?.lines?.length ? bundles[idx].lines : LOGIN_BRAND_DIALOGUE_FALLBACK_LINES;
}
