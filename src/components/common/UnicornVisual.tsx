import React, { useEffect } from "react";
import UnicornScene from "unicornstudio-react";
import { cn } from "@/lib/utils";

interface UnicornVisualProps {
  projectId?: string;
  className?: string;
  children?: React.ReactNode;
  height?: string;
  scale?: number;
  dpi?: number;
  showOverlay?: boolean;
  blurAmount?: string;
}

/**
 * UnicornVisual Component
 * 
 * Unicorn Studio의 WebGL 씬을 전문적으로 렌더링하는 공용 컴포넌트입니다.
 * 정적인 이미지 대신 동적인 배경 효과를 제공하며, 내부 콘텐츠(children)를 포함할 수 있습니다.
 */
export function UnicornVisual({
  projectId = "xDa5VQkyT5mbLJGFBYE1",
  className,
  children,
  height = "100%",
  scale = 1,
  dpi = 1.5,
  showOverlay = true,
  blurAmount = "1.5px",
}: UnicornVisualProps) {
  const isBackground = height === "100vh" || height === "100%";

  useEffect(() => {
    // 1. Root level styles for watermark prevention as a fallback
    // DOM 순회 대신 브라우저의 CSS 엔진을 사용하여 안전하게 요소를 숨깁니다.
    if (!document.getElementById('unicorn-hide-style')) {
      const style = document.createElement('style');
      style.id = 'unicorn-hide-style';
      style.innerHTML = `
        .unicorn-watermark, [class*="unicorn-watermark"], a[href*="unicorn.studio"], [id*="unicorn-branding"] {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          height: 0 !important;
          width: 0 !important;
        }
      `;
      document.head.appendChild(style);
    }
    // 기존의 시스템 부하를 일으키는 setInterval 브루트포스 순회 코드를 제거했습니다.
  }, []);

  return (
    <div 
      className={cn(
        "relative w-full overflow-hidden transition-all duration-700",
        !isBackground && "rounded-[32px] shadow-2xl",
        className
      )}
      style={{ height }}
    >
      {/* WebGL Scene Layer */}
      <div 
        className={cn(
          "absolute inset-0 z-0 transition-all duration-1000",
          isBackground ? "scale-105" : "scale-110"
        )}
        style={{ 
          filter: isBackground ? `blur(${blurAmount})` : "blur(0.2px)",
          // 워터마크 영역이 화면 밑으로 빠지도록 하단 공간을 늘려 잘라냅니다.
          bottom: isBackground ? "-60px" : "0",
          height: isBackground ? "calc(100% + 60px)" : "100%",
        }}
      >
        <UnicornScene
          projectId={projectId}
          width="100%"
          height="100%"
          scale={scale}
          dpi={dpi}
          sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@2.1.4/dist/unicornStudio.umd.js"
        />
      </div>

      {/* Aesthetic Overlays for Background depth */}
      {showOverlay && (
        <div className={cn(
          "absolute inset-0 z-[1] pointer-events-none",
          isBackground 
            ? "bg-gradient-to-b from-indigo-900/5 via-transparent to-indigo-950/40" 
            : "bg-gradient-to-b from-black/10 via-transparent to-black/30 backdrop-blur-[0.5px]"
        )} />
      )}

      {/* Content Layer */}
      {children && (
        <div className="relative z-10 flex h-full w-full flex-col">
          {children}
        </div>
      )}
    </div>
  );
}
