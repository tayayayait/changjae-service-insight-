import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getSunSignHoroscope,
  type TodayHoroscopeMeta,
} from "@/lib/astrologyClient";

export type ZodiacSign = { id: string; ko: string; date: string; symbol: string };
export type HoroscopeLoadState = "idle" | "loading" | "success" | "error";

interface UseDailyAstrologyFlowParams {
  signs: readonly ZodiacSign[];
  resolveSignFromBirthday: (
    month?: number | null,
    day?: number | null,
  ) => ZodiacSign | null;
  requestDate: string;
  profileMonth?: number | null;
  profileDay?: number | null;
  userProfileMonth?: number | null;
  userProfileDay?: number | null;
}

interface RequestOptions {
  autoSelect?: boolean;
}

const AUTO_SELECT_NOTICE = "프로필 생일 기반 자동 선택";

export function useDailyAstrologyFlow({
  resolveSignFromBirthday,
  requestDate,
  profileMonth,
  profileDay,
  userProfileMonth,
  userProfileDay,
}: UseDailyAstrologyFlowParams) {
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [loadState, setLoadState] = useState<HoroscopeLoadState>("idle");
  const [selectedSign, setSelectedSign] = useState<ZodiacSign | null>(null);
  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [horoscopeMeta, setHoroscopeMeta] = useState<TodayHoroscopeMeta | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingElapsedSec, setLoadingElapsedSec] = useState(0);
  const [actionChecks, setActionChecks] = useState({ doNow: false, avoid: false });
  const [autoSelectNotice, setAutoSelectNotice] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const manualSelectionModeRef = useRef(false);

  const horoscopeContext = useMemo(() => ({ requestDate }), [requestDate]);

  // location.key가 변경될 때(페이지 전환 또는 동일 페이지 재클릭 시) 상태 초기화
  useEffect(() => {
    setStep(1);
    setLoadState("idle");
    setSelectedSign(null);
    setHoroscope(null);
    setHoroscopeMeta(null);
    setErrorMessage(null);
    setLoadingElapsedSec(0);
    setActionChecks({ doNow: false, avoid: false });
    setAutoSelectNotice(null);
    manualSelectionModeRef.current = false;
  }, [location.key]);

  useEffect(() => {
    if (loadState !== "loading") {
      return;
    }

    setLoadingElapsedSec(0);
    const intervalId = setInterval(() => {
      setLoadingElapsedSec((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [loadState, selectedSign?.id]);

  const requestHoroscope = async (signData: ZodiacSign, options?: RequestOptions) => {
    const requestId = ++requestIdRef.current;
    const isAutoSelect = Boolean(options?.autoSelect);
    if (!isAutoSelect) {
      manualSelectionModeRef.current = true;
      setAutoSelectNotice(null);
    }

    startTransition(() => {
      setSelectedSign(signData);
      setStep(2);
      setLoadState("idle"); // 상태를 로딩으로 바로 바꾸지 않고 대기
      setHoroscope(null);
      setHoroscopeMeta(null);
      setErrorMessage(null);
      setActionChecks({ doNow: false, avoid: false });
      if (isAutoSelect) {
        setAutoSelectNotice(AUTO_SELECT_NOTICE);
      }
    });

    const currentRequestId = requestId;
    setTimeout(() => {
      if (requestIdRef.current === currentRequestId) {
        setLoadState((prev) => (prev === "idle" ? "loading" : prev));
      }
    }, 600);

    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const res = await getSunSignHoroscope(signData.id, horoscopeContext);
      if (requestId !== requestIdRef.current) {
        return;
      }

      setHoroscope(res.data.horoscope);
      setHoroscopeMeta(res.meta ?? null);
      setLoadState("success");
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setLoadState("error");
      setHoroscopeMeta(null);
      setErrorMessage(
        error instanceof Error && error.message.trim()
          ? error.message
          : "실시간 결과를 아직 제공하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    }
  };

  const handleRetry = () => {
    if (!selectedSign || loadState === "loading") {
      return;
    }
    void requestHoroscope(selectedSign);
  };

  const handleBackToSelection = () => {
    requestIdRef.current += 1;
    manualSelectionModeRef.current = true;
    setStep(1);
    setLoadState("idle");
    setSelectedSign(null);
    setHoroscope(null);
    setHoroscopeMeta(null);
    setErrorMessage(null);
    setLoadingElapsedSec(0);
    setActionChecks({ doNow: false, avoid: false });
    setAutoSelectNotice(null);
  };

  return {
    step,
    loadState,
    selectedSign,
    horoscope,
    horoscopeMeta,
    errorMessage,
    loadingElapsedSec,
    actionChecks,
    autoSelectNotice,
    setActionChecks,
    requestHoroscope,
    handleRetry,
    handleBackToSelection,
  };
}
