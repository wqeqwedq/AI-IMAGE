"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocale } from "next-intl";
import {
    LOGIN_BRAND_BUBBLE_TAIL_PCT,
    LOGIN_BRAND_DIALOGUE_FALLBACK_LINES,
    LOGIN_BRAND_STAGE_ANCHORS,
    type LoginBrandLine,
    fetchLoginBrandDialogueBundles,
    getShanghaiCalendarDayKey,
    loginBrandBubbleJitter,
    pickLinesForToday,
} from "@/lib/login-brand-dialogues";

const INITIAL_DELAY_MS = 720;
const LINE_READ_MS = 2800;
const CROSSFADE_MS = 520;
const FADE_IN_MS = 480;

type MotionDurations = {
    initialDelay: number;
    lineRead: number;
    crossfade: number;
    fadeIn: number;
};

const DEFAULT_MOTION: MotionDurations = {
    initialDelay: INITIAL_DELAY_MS,
    lineRead: LINE_READ_MS,
    crossfade: CROSSFADE_MS,
    fadeIn: FADE_IN_MS,
};

const REDUCED_MOTION: MotionDurations = {
    initialDelay: 120,
    lineRead: 900,
    crossfade: 100,
    fadeIn: 90,
};

function readMotionDurations(): MotionDurations {
    if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
        return REDUCED_MOTION;
    }
    return DEFAULT_MOTION;
}

function lineBody(line: LoginBrandLine, locale: string): string {
    return locale.startsWith("zh") ? line.body_zh : line.body_en;
}

function rafTwice(cb: () => void): void {
    requestAnimationFrame(() => {
        requestAnimationFrame(cb);
    });
}

export function LoginBrandDialogueStack() {
    const locale = useLocale();
    const dayKey = getShanghaiCalendarDayKey();
    const [lines, setLines] = useState<LoginBrandLine[] | null>(null);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [bubbleOpacity, setBubbleOpacity] = useState(0);
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            const bundles = await fetchLoginBrandDialogueBundles();
            if (cancelled) return;
            const picked = pickLinesForToday(bundles, dayKey);
            setLines(picked.length ? picked : LOGIN_BRAND_DIALOGUE_FALLBACK_LINES);
        })();
        return () => {
            cancelled = true;
        };
    }, [dayKey]);

    useEffect(() => {
        if (lines === null || lines.length === 0) return;

        const motion = readMotionDurations();

        const clearAll = () => {
            for (const t of timersRef.current) clearTimeout(t);
            timersRef.current = [];
        };
        clearAll();

        const schedule = (fn: () => void, ms: number) => {
            const id = setTimeout(fn, ms);
            timersRef.current.push(id);
            return id;
        };

        const runLine = (i: number) => {
            if (i >= lines.length) {
                setActiveIndex(-1);
                setBubbleOpacity(0);
                return;
            }

            setActiveIndex(i);
            setBubbleOpacity(0);
            rafTwice(() => {
                setBubbleOpacity(1);
            });

            schedule(() => {
                setBubbleOpacity(0);
            }, motion.fadeIn + motion.lineRead);

            schedule(() => {
                runLine(i + 1);
            }, motion.fadeIn + motion.lineRead + motion.crossfade);
        };

        schedule(() => {
            runLine(0);
        }, motion.initialDelay);

        return clearAll;
    }, [lines]);

    const line = activeIndex >= 0 && lines !== null ? lines[activeIndex] : null;
    const anchor = line ? LOGIN_BRAND_STAGE_ANCHORS[line.speaker] : null;
    const jitter = line
        ? loginBrandBubbleJitter(dayKey, line.line_order, line.speaker)
        : { x: 0, y: 0, rotate: 0 };

    const motion = readMotionDurations();
    const fadeMs = Math.max(motion.fadeIn, motion.crossfade);
    const tailPct = line ? LOGIN_BRAND_BUBBLE_TAIL_PCT[line.speaker] : 50;

    const ariaLabel = locale.startsWith("zh") ? "角色对话" : "Character banter";

    return (
        <aside
            className="pointer-events-none absolute inset-0 z-[30] overflow-visible"
            aria-label={ariaLabel}
        >
            <span className="sr-only" aria-live="polite">
                {line ? lineBody(line, locale) : ""}
            </span>
            {line !== null && anchor !== null ? (
                <div
                    className="absolute flex justify-center"
                    style={
                        {
                            left: anchor.left,
                            bottom: anchor.bottom,
                            transform: `translateX(calc(-50% + ${jitter.x}px)) translateY(${jitter.y}px)`,
                        } as CSSProperties
                    }
                >
                    <figure
                        className="relative w-max max-w-[min(17.5rem,calc(100vw-4rem))] origin-bottom rounded-[1.15rem] border border-primary-foreground/14 bg-primary-foreground/[0.11] px-[0.85rem] py-2 shadow-[0_8px_28px_-8px_rgba(0,0,0,0.35)] backdrop-blur-md ease-out"
                        style={{
                            opacity: bubbleOpacity,
                            transform: `rotate(${jitter.rotate}deg) scale(${0.96 + bubbleOpacity * 0.04})`,
                            transition: `opacity ${fadeMs}ms ease, transform ${fadeMs}ms ease`,
                        }}
                    >
                        <blockquote className="m-0 max-w-full text-[0.8125rem] leading-relaxed text-primary-foreground/[0.94] sm:text-sm">
                            <p className="m-0 whitespace-pre-wrap break-words text-left">
                                {lineBody(line, locale)}
                            </p>
                        </blockquote>
                        <span
                            className="absolute -bottom-1.5 size-2.5 border border-primary-foreground/14 bg-primary-foreground/[0.11]"
                            style={{
                                left: `${tailPct}%`,
                                transform: "translateX(-50%) rotate(45deg)",
                            }}
                            aria-hidden
                        />
                    </figure>
                </div>
            ) : null}
        </aside>
    );
}
