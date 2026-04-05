import { useEffect, useRef } from "react";

interface AdUnitProps {
  /** 애드센스 클라이언트 ID (기본값 제공) */
  client?: string;
  /** 애드센스 광고 단위 ID (필수) */
  slot: string;
  /** 광고 형식 (기본값 auto) */
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  /** 반응형 여부 */
  responsive?: boolean;
  /** 스타일 (커스텀 레이아웃용) */
  style?: React.CSSProperties;
  /** 클래스 네임 */
  className?: string;
}

/**
 * 구글 애드센스 광고 단위를 렌더링하는 공통 컴포넌트입니다.
 * SPA 네비게이션 시 중복 push를 방지하기 위해 DOM 상태를 확인합니다.
 */
export function AdUnit({
  client = "ca-pub-2295415730305709",
  slot,
  format = "auto",
  responsive = true,
  style = { display: "block" },
  className,
}: AdUnitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pushedRef = useRef<boolean>(false);

  useEffect(() => {
    if (pushedRef.current) return;

    // DOM에서 <ins> 요소를 찾아 이미 초기화되었는지 확인
    const insElement = containerRef.current?.querySelector("ins.adsbygoogle");
    if (insElement?.getAttribute("data-adsbygoogle-status")) {
      pushedRef.current = true;
      return; // 이미 Google이 초기화한 슬롯이므로 skip
    }

    try {
      const adsbygoogle = (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle;
      if (adsbygoogle) {
        adsbygoogle.push({});
        pushedRef.current = true;
      }
    } catch {
      // 애드센스 미로드 또는 미승인 상태 — 무시
    }
  }, [slot]);

  return (
    <div ref={containerRef} className={className}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
