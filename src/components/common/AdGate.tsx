import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdGateProps {
  /** 광고 게이트를 활성화할지 여부 */
  enabled: boolean;
  /** 카운트다운 시간(초) */
  countdownSec?: number;
  /** 게이트 해제 후 보여질 콘텐츠 */
  children: React.ReactNode;
}

/**
 * 무료 서비스 결과를 보기 전 광고를 표시하는 게이트 컴포넌트.
 * `enabled`가 true이면 카운트다운 + 광고 영역을 먼저 보여주고,
 * 카운트다운이 끝나면 [결과 확인하기] 버튼을 활성화합니다.
 */
export function AdGate({ enabled, countdownSec = 5, children }: AdGateProps) {
  const [dismissed, setDismissed] = useState(false);
  const [remaining, setRemaining] = useState(countdownSec);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const adSlotRef = useRef<HTMLDivElement>(null);

  // 카운트다운 타이머
  useEffect(() => {
    if (!enabled || dismissed) return;

    setRemaining(countdownSec);

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, dismissed, countdownSec]);

  // 광고 슬롯 초기화 시도 (애드센스 승인 후 자동 동작)
  useEffect(() => {
    if (!enabled || dismissed) return;

    try {
      const adsbygoogle = (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle;
      if (adsbygoogle && adSlotRef.current) {
        adsbygoogle.push({});
      }
    } catch {
      // 애드센스가 아직 로드되지 않았거나 미승인 상태 — 무시
    }
  }, [enabled, dismissed]);

  // 게이트 비활성 또는 이미 해제된 경우 → 바로 콘텐츠 표시
  if (!enabled || dismissed) {
    return <>{children}</>;
  }

  const isReady = remaining <= 0;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="ad-gate"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="mx-auto max-w-2xl space-y-6"
      >
        {/* 헤더 */}
        <div className="rounded-[28px] border border-[#24303F]/10 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#EAF1F7] text-[#C9A86A]">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-[#24303F]">
            결과가 준비되었습니다!
          </h3>
          <p className="text-sm font-medium text-slate-500">
            잠시 후 결과를 확인하실 수 있습니다.
          </p>
        </div>

        {/* 광고 영역 — 애드센스 인피드 광고 슬롯 */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div
            ref={adSlotRef}
            className="flex min-h-[250px] items-center justify-center text-sm text-slate-400"
          >
            {/* 애드센스 미승인 동안 보여지는 플레이스홀더 */}
            <div className="text-center space-y-2">
              <p className="text-xs text-slate-400">광고</p>
              <div className="h-[200px] w-full rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <p className="text-slate-400 text-sm">AD</p>
              </div>
            </div>
          </div>
        </div>

        {/* 카운트다운 + 버튼 */}
        <div className="text-center space-y-4">
          {!isReady ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A86A]/30 bg-[#FAF7F2] px-5 py-2.5 text-sm font-bold text-[#24303F]">
              <Timer className="h-4 w-4 text-[#C9A86A]" />
              <span>{remaining}초 후 결과를 확인할 수 있습니다</span>
            </div>
          ) : null}

          <Button
            onClick={() => setDismissed(true)}
            disabled={!isReady}
            className="h-14 w-full max-w-sm rounded-2xl text-base font-bold shadow-sm disabled:opacity-40"
          >
            {isReady ? "결과 확인하기 ✨" : `${remaining}초 대기 중...`}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
