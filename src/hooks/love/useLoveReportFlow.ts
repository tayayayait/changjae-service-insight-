import { useEffect, useState } from "react";
import { LoveReportRecord, LoveSubjectInput } from "@/types/love";
import { getLoveReportPreview } from "@/lib/loveReportStore";
import { getLatestSajuResult } from "@/lib/resultStore";

interface AuthProfileShape {
  name?: string;
  gender?: "male" | "female";
  calendar_type?: "solar" | "lunar" | "lunar-leap";
  year?: number;
  month?: number;
  day?: number;
  hour?: number | null;
  minute?: number | null;
  time_block?: string | null;
  location?: string;
}

interface UseLoveReportFlowParams {
  profile: AuthProfileShape | null;
  reportId?: string;
  serviceType?: string;
}

export function useLoveReportFlow({ profile, reportId, serviceType }: UseLoveReportFlowParams) {
  const [record, setRecord] = useState<LoveReportRecord | null>(null);
  const [isLoadingSaved, setIsLoadingSaved] = useState(Boolean(reportId));
  const [error, setError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState<Partial<LoveSubjectInput> | undefined>(undefined);

  // serviceType 변경 시 이전 서비스의 데이터를 초기화 (방어적 안전 장치)
  useEffect(() => {
    setRecord(null);
    setError(null);
  }, [serviceType]);

  useEffect(() => {
    void (async () => {
      if (profile) {
        setPrefilled({
          name: profile.name ?? "나",
          gender: profile.gender ?? "female",
          calendarType: profile.calendar_type ?? "solar",
          year: profile.year ?? 1990,
          month: profile.month ?? 1,
          day: profile.day ?? 1,
          hour: typeof profile.hour === "number" ? profile.hour : undefined,
          minute: typeof profile.minute === "number" ? profile.minute : undefined,
          timeBlock: profile.time_block ?? undefined,
          birthPrecision: profile.time_block ? "time-block" : typeof profile.hour === "number" ? "exact" : "unknown",
          location: profile.location ?? "서울특별시",
        });
        return;
      }

      const base = await getLatestSajuResult();
      if (!base?.profileData) {
        return;
      }
      setPrefilled({
        ...base.profileData,
        name: "나",
      });
    })();
  }, [profile]);

  useEffect(() => {
    if (!reportId) {
      setIsLoadingSaved(false);
      return;
    }

    void (async () => {
      setIsLoadingSaved(true);
      setError(null);
      try {
        const existing = await getLoveReportPreview(reportId);
        if (!existing) {
          throw new Error("저장된 연애 리포트를 찾을 수 없습니다.");
        }
        setRecord(existing);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "리포트 불러오기 실패");
      } finally {
        setIsLoadingSaved(false);
      }
    })();
  }, [reportId]);

  return {
    record,
    setRecord,
    isLoadingSaved,
    error,
    setError,
    prefilled,
  };
}
