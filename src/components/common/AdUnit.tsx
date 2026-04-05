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
 */
export function AdUnit({
  client = "ca-pub-2295415730305709", // 공통 판매자 ID
  slot,
  format = "auto",
  responsive = true,
  style = { display: "block" },
  className,
}: AdUnitProps) {
  const adRef = useRef<boolean>(false);

  useEffect(() => {
    // 이미 로드된 경우 중복 호출 방지
    if (adRef.current) return;

    try {
      const adsbygoogle = (window as any).adsbygoogle;
      if (adsbygoogle) {
        adsbygoogle.push({});
        adRef.current = true;
      }
    } catch (err) {
      console.error("AdSense push error:", err);
    }
  }, [slot]);

  return (
    <div className={className}>
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
