import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  const mql = window.matchMedia(MEDIA_QUERY);
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.innerWidth < MOBILE_BREAKPOINT;
}

/** 与 SSR / 水合首帧一致：服务端与客户端首次渲染均为 false，避免布局分支不一致导致 Radix id 错位 */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * 是否处于移动端视口。使用 useSyncExternalStore，保证水合前后与首帧 HTML 一致，
 * 避免 Sidebar 等组件在 SSR 与客户端因 isMobile 分歧产生 hydration mismatch（如 radix id 不一致）。
 */
export function useIsMobile(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
