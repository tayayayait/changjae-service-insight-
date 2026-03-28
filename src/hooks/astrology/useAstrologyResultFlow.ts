import { useEffect, useState } from "react";
import { getAstrologyReport } from "@/lib/astrologyStore";
import { AstrologyReportRecord } from "@/types/astrology";

export function useAstrologyResultFlow(resultId?: string) {
  const [record, setRecord] = useState<AstrologyReportRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resultId) {
      setError("리포트 ID가 없습니다.");
      setIsLoading(false);
      return;
    }

    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAstrologyReport(resultId);
        if (!data) {
          throw new Error("리포트를 찾을 수 없습니다.");
        }
        setRecord(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "리포트를 불러오는 중 오류가 발생했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, [resultId]);

  return {
    record,
    isLoading,
    error,
  };
}
