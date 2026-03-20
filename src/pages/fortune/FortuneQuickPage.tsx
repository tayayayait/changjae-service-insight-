import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorCard } from "@/components/common/ErrorCard";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { FortuneResultCard } from "@/components/fortune/FortuneResultCard";
import { FortuneSubNav } from "@/components/fortune/FortuneSubNav";
import { QuickFortuneInputCard } from "@/components/fortune/QuickFortuneInputCard";
import { getStarSignFortune, getZodiacFortune } from "@/lib/geminiClient";
import { STAR_SIGN_OPTIONS, ZODIAC_OPTIONS } from "@/lib/fortuneOptions";
import { AnalysisPeriod, FortuneResult, QuickFortuneKind } from "@/types/result";

const toISODate = (date: Date) => date.toISOString().slice(0, 10);
const isPeriod = (value: string | null): value is AnalysisPeriod => value === "today" || value === "week" || value === "month";

export default function FortuneQuickPage() {
  const [searchParams] = useSearchParams();
  const initialPeriod = isPeriod(searchParams.get("period")) ? searchParams.get("period") : "today";
  const requestedKind = searchParams.get("kind");
  const displayKind: QuickFortuneKind | "both" = requestedKind === "zodiac" || requestedKind === "starSign" ? requestedKind : "both";

  const [zodiacPeriod, setZodiacPeriod] = useState<AnalysisPeriod>(initialPeriod);
  const [starPeriod, setStarPeriod] = useState<AnalysisPeriod>(initialPeriod);
  const [zodiac, setZodiac] = useState<string>(ZODIAC_OPTIONS[0]);
  const [starSign, setStarSign] = useState<string>(STAR_SIGN_OPTIONS[0]);

  const [zodiacResult, setZodiacResult] = useState<FortuneResult | null>(null);
  const [starResult, setStarResult] = useState<FortuneResult | null>(null);
  const [zodiacLoading, setZodiacLoading] = useState(false);
  const [starLoading, setStarLoading] = useState(false);
  const [zodiacError, setZodiacError] = useState<string | null>(null);
  const [starError, setStarError] = useState<string | null>(null);

  const requestDate = useMemo(() => toISODate(new Date()), []);

  const loadZodiac = useCallback(async (targetZodiac: string, targetPeriod: AnalysisPeriod) => {
    setZodiacLoading(true);
    setZodiacError(null);

    try {
      const response = await getZodiacFortune({
        zodiac: targetZodiac,
        period: targetPeriod,
        date: requestDate,
      });
      setZodiacResult(response);
    } catch (error) {
      setZodiacResult(null);
      setZodiacError(error instanceof Error ? error.message : "띠 운세를 불러오지 못했습니다.");
    } finally {
      setZodiacLoading(false);
    }
  }, [requestDate]);

  const loadStarSign = useCallback(async (targetStarSign: string, targetPeriod: AnalysisPeriod) => {
    setStarLoading(true);
    setStarError(null);

    try {
      const response = await getStarSignFortune({
        starSign: targetStarSign,
        period: targetPeriod,
        date: requestDate,
      });
      setStarResult(response);
    } catch (error) {
      setStarResult(null);
      setStarError(error instanceof Error ? error.message : "별자리 운세를 불러오지 못했습니다.");
    } finally {
      setStarLoading(false);
    }
  }, [requestDate]);

  useEffect(() => {
    if (displayKind !== "starSign") {
      void loadZodiac(zodiac, zodiacPeriod);
    }
    if (displayKind !== "zodiac") {
      void loadStarSign(starSign, starPeriod);
    }
  }, [displayKind, loadStarSign, loadZodiac, starPeriod, starSign, zodiac, zodiacPeriod]);

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
        <header className="space-y-2">
          <h1 className="text-h2 text-foreground">간편 운세</h1>
          <p className="text-caption text-text-secondary">띠 운세와 별자리 운세를 분리해 조회합니다. 이 화면의 결과는 저장되지 않습니다.</p>
        </header>

        <FortuneSubNav />

        <div className="grid gap-5 lg:grid-cols-2">
          {displayKind !== "starSign" ? (
            <div className="space-y-4">
              <QuickFortuneInputCard
                title="띠 운세"
                description="띠와 기간을 선택해 빠르게 확인합니다."
                period={zodiacPeriod}
                onPeriodChange={setZodiacPeriod}
                selectLabel="띠"
                options={ZODIAC_OPTIONS}
                value={zodiac}
                onChange={setZodiac}
                onSubmit={() => void loadZodiac(zodiac, zodiacPeriod)}
                submitLabel="띠 운세 확인"
                isLoading={zodiacLoading}
              />

              {zodiacLoading ? <SkeletonCard lines={4} /> : null}
              {!zodiacLoading && zodiacError ? <ErrorCard message={zodiacError} onRetry={() => void loadZodiac(zodiac, zodiacPeriod)} /> : null}
              {!zodiacLoading && !zodiacError && zodiacResult ? <FortuneResultCard title="띠 기반 결과" fortune={zodiacResult} /> : null}
            </div>
          ) : null}

          {displayKind !== "zodiac" ? (
            <div className="space-y-4">
              <QuickFortuneInputCard
                title="별자리 운세"
                description="별자리와 기간을 선택해 가볍게 확인합니다."
                period={starPeriod}
                onPeriodChange={setStarPeriod}
                selectLabel="별자리"
                options={STAR_SIGN_OPTIONS}
                value={starSign}
                onChange={setStarSign}
                onSubmit={() => void loadStarSign(starSign, starPeriod)}
                submitLabel="별자리 운세 확인"
                isLoading={starLoading}
              />

              {starLoading ? <SkeletonCard lines={4} /> : null}
              {!starLoading && starError ? <ErrorCard message={starError} onRetry={() => void loadStarSign(starSign, starPeriod)} /> : null}
              {!starLoading && !starError && starResult ? <FortuneResultCard title="별자리 기반 결과" fortune={starResult} /> : null}
            </div>
          ) : null}
        </div>
      </div>
    </AppLayout>
  );
}
