/** 一级 → 二级列表（由 presets 表行聚合，一级与二级各自按 zh-Hans 排序） */
export type PresetCategoryTree = Record<string, string[]>;

export function buildPresetCategoryTree(
    rows: ReadonlyArray<{
        primary_category: string | null;
        secondary_category: string | null;
    }>
): PresetCategoryTree {
    const map = new Map<string, Set<string>>();
    for (const row of rows) {
        const primary = row.primary_category?.trim() ?? "";
        const secondary = row.secondary_category?.trim() ?? "";
        if (!primary) continue;
        if (!map.has(primary)) {
            map.set(primary, new Set());
        }
        if (secondary) {
            map.get(primary)!.add(secondary);
        }
    }

    const tree: PresetCategoryTree = {};
    const primaries = [...map.keys()].sort((a, b) =>
        a.localeCompare(b, "zh-Hans-CN")
    );
    for (const p of primaries) {
        const secs = [...map.get(p)!].sort((a, b) =>
            a.localeCompare(b, "zh-Hans-CN")
        );
        tree[p] = secs;
    }
    return tree;
}
