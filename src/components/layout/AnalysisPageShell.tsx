import React, { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisPageShellProps {
  categoryId?: "saju" | "astrology" | "palmistry" | "love";
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  themeColor?: string;
  headerBehavior?: "default" | "reading";
  layoutWidth?: "normal" | "wide";
  children: React.ReactNode;
}

const categoryLabels = {
  saju: "사주·만세력",
  astrology: "점성학·별자리",
  palmistry: "관상·손금",
  love: "연애·궁합",
};

const resolveScrollContainer = (element: HTMLElement | null): HTMLElement | Window => {
  if (!element || typeof window === "undefined") {
    return window;
  }

  let node: HTMLElement | null = element.parentElement;

  while (node) {
    const styles = window.getComputedStyle(node);
    const overflowY = styles.overflowY;
    const canScroll = ["auto", "scroll", "overlay"].includes(overflowY) && node.scrollHeight > node.clientHeight;
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
}: AnalysisPageShellProps) => {
  const shellRef = useRef<HTMLDivElement>(null);
  const [isCompactHeaderVisible, setIsCompactHeaderVisible] = useState(false);
  const [isCompactHeaderHidden, setIsCompactHeaderHidden] = useState(false);

  useEffect(() => {
    if (headerBehavior !== "reading") {
      return;
    }

    const scrollContainer = resolveScrollContainer(shellRef.current);
    const readScrollTop = () => (scrollContainer === window ? window.scrollY : scrollContainer.scrollTop);

    let previousTop = readScrollTop();
    let rafId: number | null = null;

    const updateHeaderState = () => {
      const currentTop = readScrollTop();
      const delta = currentTop - previousTop;
      const shouldShowCompact = currentTop > 64;

      setIsCompactHeaderVisible(shouldShowCompact);

      if (!shouldShowCompact) {
        setIsCompactHeaderHidden(false);
        previousTop = currentTop;
        return;
      }

      if (delta > 6 && currentTop > 140) {
        setIsCompactHeaderHidden(true);
      } else if (delta < -6) {
        setIsCompactHeaderHidden(false);
      }

      previousTop = currentTop;
    };

    const onScroll = () => {
      if (rafId !== null) {
        return;
      }

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

  const isReadingHeaderOpen = isCompactHeaderVisible && !isCompactHeaderHidden;
  const containerWidthClass = layoutWidth === "wide" ? "max-w-6xl" : "max-w-4xl";

  return (
    <div ref={shellRef} className="flex flex-col min-h-screen bg-[#F8FAFC] pb-24 w-full">
      {headerBehavior === "reading" ? (
        <>
          <header className="border-b border-gray-100 bg-white/90">
            <div className={cn(containerWidthClass, "mx-auto w-full px-4 sm:px-6")}>
              <div className="py-4 flex flex-col gap-1">
                {categoryId && (
                  <div className="flex items-center gap-1.5 text-text-muted text-[13px] font-medium mb-1">
                    <span>{categoryLabels[categoryId]}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                    <span className="text-foreground">{title}</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {Icon && (
                    <div className={cn("p-2 rounded-xl text-gray-800", `bg-${themeColor}/20`)}>
                      <Icon className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{title}</h1>
                    {subtitle && <p className="text-[13px] text-text-secondary mt-0.5">{subtitle}</p>}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div
            className={cn(
              "sticky top-0 z-20 overflow-hidden bg-white/90 backdrop-blur-md transition-[max-height,opacity,border-color] duration-200",
              isReadingHeaderOpen
                ? "max-h-16 border-b border-gray-100 opacity-100 shadow-sm"
                : "pointer-events-none max-h-0 border-b border-transparent opacity-0",
            )}
            aria-hidden={!isReadingHeaderOpen}
          >
            <div className={cn(containerWidthClass, "mx-auto w-full px-4 sm:px-6")}>
              <div className="h-14 flex items-center gap-2">
                {Icon ? <Icon className="h-4 w-4 text-gray-500" /> : null}
                <p className="min-w-0 truncate text-[14px] font-bold text-gray-900">{title}</p>
                {subtitle ? <p className="hidden min-w-0 truncate text-[12px] text-text-secondary sm:block">&middot; {subtitle}</p> : null}
              </div>
            </div>
          </div>
        </>
      ) : (
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
          <div className={cn(containerWidthClass, "mx-auto w-full px-4 sm:px-6")}>
            <div className="py-4 flex flex-col gap-1">
              {categoryId && (
                <div className="flex items-center gap-1.5 text-text-muted text-[13px] font-medium mb-1">
                  <span>{categoryLabels[categoryId]}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  <span className="text-foreground">{title}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                {Icon && (
                  <div className={cn("p-2 rounded-xl text-gray-800", `bg-${themeColor}/20`)}>
                    <Icon className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{title}</h1>
                  {subtitle && <p className="text-[13px] text-text-secondary mt-0.5">{subtitle}</p>}
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className={cn("flex-1 mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6", containerWidthClass)}>{children}</main>
    </div>
  );
};
