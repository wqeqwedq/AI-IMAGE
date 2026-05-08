/**
 * 登录后 `next` 重定向：仅允许站内相对路径，防止开放重定向。
 */
export function safeInternalPath(
    next: string | null | undefined,
    fallback = "/dashboard"
): string {
    if (next == null || typeof next !== "string") return fallback;
    const t = next.trim();
    if (t.length > 2048) return fallback;
    if (!t.startsWith("/") || t.startsWith("//")) return fallback;
    if (/[\u0000-\u001f\u007f]/.test(t)) return fallback;
    return t;
}
