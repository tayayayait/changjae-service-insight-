import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import type { CategoryKey } from "@/lib/serviceCatalog";
import { AdUnit } from "./AdUnit";

/* ──────────────────────────────────────────────
   카테고리별 Dynamic Text 메시지 세트
   ────────────────────────────────────────────── */
const LOADING_MESSAGES: Record<CategoryKey, string[]> = {
  saju: [
    "만세력 데이터를 기반으로 사주 명식을 추출하고 있습니다...",
    "음양오행의 상생상극 관계를 분석하고 있습니다...",
    "대운과 세운의 흐름을 바탕으로 운명을 조율 중입니다...",
    "전문적인 관점의 맞춤형 조언을 생성하고 있습니다...",
    "거의 완료되었습니다. 리포트를 구성하는 중입니다...",
  ],
  astrology: [
    "출생 시점의 행성 배치를 계산하고 있습니다...",
    "하우스별 에너지 흐름을 분석하고 있습니다...",
    "행성 간 각도(Aspect)가 만들어내는 패턴을 해석 중입니다...",
    "당신만의 우주적 지도를 그리고 있습니다...",
    "거의 완료되었습니다. 리포트를 구성하는 중입니다...",
  ],
  love: [
    "두 분의 운명적 연결고리를 탐색하고 있습니다...",
    "성향과 관계 패턴의 조화를 분석하고 있습니다...",
    "감정·가치관·라이프스타일의 궁합도를 계산 중입니다...",
    "두 분을 위한 맞춤 관계 가이드를 작성 중입니다...",
    "거의 완료되었습니다. 리포트를 구성하는 중입니다...",
  ],
};

const STEP_INTERVAL_MS = 6_000; // 6초마다 텍스트 전환

interface MysticalLoadingProps {
  /** 서비스 카테고리에 따라 메시지 세트를 자동 선택합니다. */
  categoryId?: CategoryKey;
  /** 커스텀 제목 텍스트 (기본: "리포트를 생성하고 있습니다") */
  title?: string;
  /** 최소 높이 (기본: 400px) */
  minHeight?: string;
}

export function MysticalLoading({
  categoryId = "saju",
  title = "리포트를 생성하고 있습니다",
  minHeight = "400px",
}: MysticalLoadingProps) {
  const messages = LOADING_MESSAGES[categoryId] ?? LOADING_MESSAGES.saju;
  const [step, setStep] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setIsFading(true);
      // fade-out 후 텍스트 교체 → fade-in
      setTimeout(() => {
        setStep((prev) => (prev + 1 < messages.length ? prev + 1 : prev));
        setIsFading(false);
      }, 400);
    }, STEP_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [messages.length]);

  const progressPercent = Math.min(
    ((step + 1) / messages.length) * 100,
    95, // 마지막 단계에서도 100%가 아닌 95%까지만 표시
  );

  return (
    <div
      className="flex flex-col items-center justify-center px-6"
      style={{ minHeight }}
    >
      {/* 신비로운 원형 애니메이션 */}
      <div className="relative mb-8">
        {/* 외곽 글로우 링 */}
        <div className="absolute inset-0 animate-spin rounded-full opacity-30"
          style={{
            width: 96,
            height: 96,
            background: "conic-gradient(from 0deg, transparent, #818cf8, #c084fc, transparent)",
            animationDuration: "4s",
            filter: "blur(8px)",
          }}
        />
        {/* 내부 펄스 링 */}
        <div
          className="relative flex h-24 w-24 items-center justify-center rounded-full border border-indigo-200/40"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(129,140,248,0.15), transparent 70%)",
          }}
        >
          <div className="h-10 w-10 animate-pulse rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 opacity-80 shadow-lg shadow-indigo-400/30" />
        </div>
      </div>

      {/* 제목 */}
      <h3 className="mb-3 text-lg font-bold text-[#24303F]">{title}</h3>

      {/* 프로그레스 바 */}
      <div className="mb-6 h-1.5 w-60 max-w-full overflow-hidden rounded-full bg-slate-200/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-500"
          style={{
            width: `${progressPercent}%`,
            transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>

      {/* Dynamic Text (fade 애니메이션) */}
      <p
        className={cn(
          "max-w-xs text-center text-[13.5px] font-medium leading-relaxed text-slate-500",
          "transition-opacity duration-400",
          isFading ? "opacity-0" : "opacity-100",
        )}
      >
        {messages[step]}
      </p>

      {/* 단계 인디케이터 점 */}
      <div className="mt-5 flex items-center gap-2">
        {messages.map((_, idx) => (
          <span
            key={idx}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              idx <= step
                ? "w-4 bg-indigo-400"
                : "w-1.5 bg-slate-300",
            )}
          />
        ))}
      </div>

      {/* 로딩 중 광고 영역 */}
      <div className="mt-8 w-full max-w-sm overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
        <p className="mb-2 text-center text-[10px] font-bold tracking-widest text-slate-400">ADVERTISEMENT</p>
        <AdUnit 
          slot="6738850110" 
          format="rectangle" 
          className="min-h-[250px]"
        />
      </div>
    </div>
  );
}
