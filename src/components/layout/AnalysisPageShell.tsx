import React, { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConsultStore } from "@/store/useConsultStore";

interface AnalysisPageShellProps {
  categoryId?: "saju" | "astrology" | "palmistry" | "love";
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  themeColor?: string;
  headerBehavior?: "default" | "reading";
  layoutWidth?: "normal" | "wide";
  children: React.ReactNode;
  unicornProjectId?: string;
}

const themeChipClassByColor: Record<string, string> = {
  "accent-lavender": "border-[#9AA7C5]/40 bg-[#EAF1F7]",
  "accent-sky": "border-[#9AA7C5]/40 bg-[#EAF1F7]",
  "accent-pink": "border-pink-300/40 bg-pink-50",
  "accent-gold": "border-[#C9A86A]/40 bg-[#FAF7F2]",
};

const READING_COMPACT_HEADER_SHOW_TOP = 80;
const READING_COMPACT_HEADER_HIDE_TOP = 20;

const categoryLabels = {
  saju: "사주/만세력",
  astrology: "점성학",
  palmistry: "손금",
  love: "연애/궁합",
};

const resolveScrollContainer = (element: HTMLElement | null): HTMLElement | Window => {
  if (!element || typeof window === "undefined") {
    return window;
  }

  let node: HTMLElement | null = element.parentElement;
  while (node) {
    const styles = window.getComputedStyle(node);
    const overflowY = styles.overflowY;
    const canScroll =
      ["auto", "scroll", "overlay"].includes(overflowY) &&
      node.scrollHeight > node.clientHeight;
    if (canScroll) {
      return node;
    }
    node = node.parentElement;
  }

  return window;
};

export const AnalysisPageShell = ({
  categoryId,
  title,
  subtitle,
  icon: Icon,
  themeColor = "accent-lavender",
  headerBehavior = "default",
  layoutWidth = "normal",
  children,
  unicornProjectId,
}: AnalysisPageShellProps) => {
  const shellRef = useRef<HTMLDivElement>(null);
  const [isCompactHeaderVisible, setIsCompactHeaderVisible] = useState(false);
  const { setUnicornProjectId } = useConsultStore();

  useEffect(() => {
    if (unicornProjectId) {
      setUnicornProjectId(unicornProjectId);
    }
  }, [setUnicornProjectId, unicornProjectId]);

  useEffect(() => {
    if (headerBehavior !== "reading") {
      setIsCompactHeaderVisible(false);
      return;
    }

    const scrollContainer = resolveScrollContainer(shellRef.current);
    const readScrollTop = () =>
      scrollContainer === window ? window.scrollY : (scrollContainer as HTMLElement).scrollTop;

    let rafId: number | null = null;

    const updateHeaderState = () => {
      const currentTop = readScrollTop();
      setIsCompactHeaderVisible((wasVisible) =>
        wasVisible ? currentTop > READING_COMPACT_HEADER_HIDE_TOP : currentTop > READING_COMPACT_HEADER_SHOW_TOP,
      );
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateHeaderState();
      });
    };

    updateHeaderState();
    const target: Window | HTMLElement = scrollContainer;
    target.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      target.removeEventListener("scroll", onScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [headerBehavior]);

  const isReadingHeaderOpen = isCompactHeaderVisible;
  const containerWidthClass = layoutWidth === "wide" ? "max-w-[1360px]" : "max-w-[1220px]";
  const themeChipClass =
    themeChipClassByColor[themeColor] ?? "border-[#9AA7C5]/40 bg-[#EAF1F7]";

  return (
    <div ref={shellRef} className="relative z-20 flex min-h-full flex-col">
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="border-b border-border bg-background/92 backdrop-blur">
          <div className={cn(containerWidthClass, "mx-auto w-full px-4 sm:px-6")}>
            <div className="flex flex-col gap-1 py-4">
              {categoryId ? (
                <div className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-text-secondary">
                  <span>{categoryLabels[categoryId]}</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                  <span className="text-foreground">{title}</span>
                </div>
              ) : null}

              <div className="flex items-center gap-3">
                {Icon ? (
                  <div className={cn("rounded-xl border p-2 text-foreground", themeChipClass)}>
                    <Icon className="h-6 w-6" />
                  </div>
                ) : null}
                <div>
                  <h1 className="font-editorial text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {title}
                  </h1>
                  {subtitle ? (
                    <p className="mt-0.5 text-[13px] text-text-secondary">{subtitle}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </header>

        {headerBehavior === "reading" ? (
          <div
            className={cn(
              "sticky top-0 z-20 overflow-hidden border-b border-border bg-background/95 backdrop-blur transition-[max-height,opacity] duration-200",
              isReadingHeaderOpen
                ? "max-h-16 opacity-100"
                : "pointer-events-none max-h-0 opacity-0",
            )}
            aria-hidden={!isReadingHeaderOpen}
          >
            <div className={cn(containerWidthClass, "mx-auto w-full px-4 sm:px-6")}>
              <div className="flex h-14 items-center gap-2">
                {Icon ? <Icon className="h-4 w-4 text-text-secondary" /> : null}
                <p className="min-w-0 truncate text-[14px] font-bold text-foreground">{title}</p>
                {subtitle ? (
                  <p className="hidden min-w-0 truncate text-[12px] text-text-secondary sm:block">
                    · {subtitle}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <main
          className={cn(
            "relative z-10 mx-auto w-full flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8",
            containerWidthClass,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
