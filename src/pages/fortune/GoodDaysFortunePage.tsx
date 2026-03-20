import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { ErrorCard } from "@/components/common/ErrorCard";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { FortuneSubNav } from "@/components/fortune/FortuneSubNav";
import { GOOD_DAY_EVENT_OPTIONS } from "@/lib/fortuneOptions";
import { getGoodDayCalendar } from "@/lib/geminiClient";
import { GoodDayEventType, GoodDayItem } from "@/types/result";

const formatMonthLabel = (year: number, month: number) => `${year}년 ${month}월`;

export default function GoodDaysFortunePage() {
  const now = useMemo(() => new Date(), []);
  const [eventType, setEventType] = useState<GoodDayEventType>("move");
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [items, setItems] = useState<GoodDayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (targetEventType: GoodDayEventType) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getGoodDayCalendar({
        eventType: targetEventType,
        year,
        month,
      });
      setItems(result);
    } catch (loadError) {
      setItems([]);
      setError(loadError instanceof Error ? loadError.message : "길일 데이터를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    void load(eventType);
  }, [eventType, load]);

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-4xl space-y-5 px-6 py-8">
        <header className="space-y-2">
          <h1 className="text-h2 text-foreground">길일 캘린더</h1>
          <p className="text-caption text-text-secondary">이사·계약·고백·발표 이벤트별로 참고 가능한 날짜를 조회합니다.</p>
        </header>

        <FortuneSubNav />

        <Card className="space-y-3 rounded-lg border-border p-5">
          <p className="text-[13px] font-semibold text-text-secondary">{formatMonthLabel(year, month)} 기준</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {GOOD_DAY_EVENT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setEventType(option.value)}
                className={
                  eventType === option.value
                    ? "h-10 rounded-md border-2 border-[#24303F] bg-bg-subtle text-[13px] font-semibold text-foreground"
                    : "h-10 rounded-md border border-border bg-bg-elevated text-[13px] font-semibold text-text-secondary"
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </Card>

        {isLoading ? <SkeletonCard lines={6} /> : null}
        {!isLoading && error ? <ErrorCard message={error} onRetry={() => void load(eventType)} /> : null}

        {!isLoading && !error ? (
          <div className="space-y-3">
            {items.length === 0 ? (
              <Card className="rounded-lg border-border p-5">
                <p className="text-[14px] text-text-secondary">조회 가능한 길일 데이터가 없습니다.</p>
              </Card>
            ) : (
              items.map((item) => (
                <Card key={`${item.date}-${item.reason}`} className="space-y-2 rounded-lg border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-semibold text-foreground">{item.date}</p>
                    <span className="text-[13px] font-semibold text-[#24303F]">{item.score}점</span>
                  </div>
                  <p className="text-[13px] leading-6 text-foreground">{item.reason}</p>
                  {item.caution ? <p className="text-[12px] text-text-secondary">주의: {item.caution}</p> : null}
                </Card>
              ))
            )}
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
