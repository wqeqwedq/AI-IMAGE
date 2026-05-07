/** 灵感 / 预设两级分类（与 DB、运营录入对齐） */
export const INSPIRATION_CATEGORY_TREE: Record<string, readonly string[]> = {
  内容创作: [
    "AI写真",
    "AI头像",
    "表情包/梗图",
    "社媒封面",
    "壁纸生成",
  ],
  电商商业: [
    "商品图生成",
    "AI模特试衣",
    "广告海报",
    "菜品图生成",
    "品牌视觉",
  ],
  设计创意: [
    "UI界面设计",
    "Logo设计",
    "室内设计",
    "建筑概念图",
    "插画生成",
  ],
  娱乐游戏: [
    "AI角色生成",
    "漫画生成",
    "游戏素材",
    "VTuber形象",
    "卡牌设计",
  ],
  教育学习: ["绘本生成", "教学插图", "科学可视化"],
  办公效率: ["PPT配图", "简历照片", "信息图表"],
  情绪消费: ["AI女友/男友", "虚拟写真", "梦境生成"],
  工业专业: ["医疗示意图", "工程概念图", "时装设计"],
} as const;

export const DEFAULT_PRIMARY_CATEGORY = "内容创作" as const;
export const DEFAULT_SECONDARY_CATEGORY = "AI写真" as const;

export const PRIMARY_CATEGORY_LIST = Object.keys(
  INSPIRATION_CATEGORY_TREE
) as (keyof typeof INSPIRATION_CATEGORY_TREE)[];

export function getSecondaries(primary: string): readonly string[] {
  return INSPIRATION_CATEGORY_TREE[primary] ?? [];
}

export function isKnownPrimary(primary: string): boolean {
  return primary in INSPIRATION_CATEGORY_TREE;
}

export function isValidCategoryPair(
  primary: string,
  secondary: string
): boolean {
  const subs = INSPIRATION_CATEGORY_TREE[primary];
  return !!subs && subs.includes(secondary);
}

/** 用于 ILIKE：去掉会破坏 PostgREST .or() 语法的字符 */
export function sanitizeInspirationSearch(raw: string | undefined): string {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/[,().]/g, " ")
    .replace(/%/g, "")
    .replace(/_/g, "")
    .replace(/["']/g, "")
    .slice(0, 80);
}
