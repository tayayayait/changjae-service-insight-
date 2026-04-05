import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdUnit } from "./AdUnit";

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
  const [mounted, setMounted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // SSR 환경 대응 및 Portal 사용을 위한 마운트 체크
  useEffect(() => {
    setMounted(true);
  }, []);

  // 카운트다운 타이머 및 바디 스크롤 잠금
  useEffect(() => {
    if (!enabled || dismissed) return;

    setRemaining(countdownSec);

    // 오버레이가 떠 있는 동안 뒷 배경 스크롤 차단
    document.body.style.overflow = "hidden";

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
      // 다 닫히면 원래 스크롤 복구 (inline style 제거)
      document.body.style.overflow = "";
    };
  }, [enabled, dismissed, countdownSec]);

  // 안전장치: 완전히 언마운트 될 때 남아있는 scroll lock 제거
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const isReady = remaining <= 0;
  const isVisible = enabled && !dismissed;

  return (
    <>
      {/* 1. 자식 컴포넌트(본문)는 높이 붕괴를 막기 위해 무조건 렌더링 */}
      {children}

      {/* 2. 모달창은 React Portal을 통해 부모의 CSS Transform에 영향받지 않게 body 최상단에 마운트 */}
      {mounted &&
        createPortal(
          <AnimatePresence mode="wait">
            {isVisible && (
              <motion.div
                key="ad-gate-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-6 backdrop-blur-sm"
              >
                <motion.div
                  key="ad-gate-modal"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl"
                >
                  {/* 장식 요소 */}
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#C9A86A]/5" />
                  
                  <div className="relative space-y-6">
                    {/* 헤더 */}
                    <div className="text-center">
                      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FAF7F2] text-[#C9A86A] shadow-sm">
                        <Sparkles className="h-8 w-8" />
                      </div>
                      <h3 className="mb-2 text-2xl font-bold tracking-tight text-[#24303F]">
                        결과 분석이 완료되었습니다
                      </h3>
                      <p className="text-sm font-medium leading-relaxed text-slate-500">
                        잠시 후 당신의 운명을 확인하실 수 있습니다.<br />
                        분석 결과를 불러오는 동안 대기해 주세요.
                      </p>
                    </div>

                    {/* 광고 영역 */}
                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                      <div className="text-center space-y-3">
                        <p className="text-[10px] font-bold tracking-widest text-[#C9A86A]">ADVERTISEMENT</p>
                        <div className="flex min-h-[250px] items-center justify-center">
                          <AdUnit 
                            slot="8246335490" 
                            format="rectangle" 
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 카운트다운 + 버튼 */}
                    <div className="space-y-4 pt-2">
                      <Button
                        onClick={() => setDismissed(true)}
                        disabled={!isReady}
                        className="group relative h-15 w-full overflow-hidden rounded-2xl bg-[#24303F] text-base font-bold text-white shadow-lg transition-all hover:bg-[#1D2733] disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {isReady ? (
                          <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="flex items-center justify-center gap-2"
                          >
                            결과 즉시 확인하기 ✨
                          </motion.div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <Timer className="h-4 w-4 animate-pulse text-[#C9A86A]" />
                            <span>분석 대기 중... ({remaining}초)</span>
                          </div>
                        )}
                        
                        {/* 진행률 바 (버튼 하단) */}
                        {!isReady && (
                          <motion.div 
                            className="absolute bottom-0 left-0 h-1 bg-[#C9A86A]/40"
                            initial={{ width: "0%" }}
                            animate={{ width: `${((countdownSec - remaining) / countdownSec) * 100}%` }}
                            transition={{ ease: "linear" }}
                          />
                        )}
                      </Button>
                      
                      {!isReady && (
                        <p className="text-center text-[12px] font-medium text-slate-400">
                          더 나은 서비스를 위해 광고를 잠시만 지켜봐 주세요.
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
