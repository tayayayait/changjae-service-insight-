import { useState, useEffect } from "react";
import {
  LoveReportRecord,
  LoveServiceType,
  LoveSubjectInput,
} from "@/types/love";
import { calculateSaju } from "@/lib/sajuEngine";
import { extractLoveFeatureSet } from "@/lib/loveFeatureEngine";
import { createLoveReport, unlockLoveReport } from "@/lib/loveReportStore";

interface UseLoveReportActionsParams {
  serviceType?: LoveServiceType;
  resolvedServiceType?: LoveServiceType;
  record: LoveReportRecord | null;
  setRecord: (record: LoveReportRecord | null) => void;
  setError: (message: string | null) => void;
  price: number;
  productCode: string;
}

interface UnlockPaymentMeta {
  provider?: string;
  providerOrderId?: string;
}

export function useLoveReportActions({
  serviceType,
  resolvedServiceType,
  record,
  setRecord,
  setError,
  price,
  productCode,
}: UseLoveReportActionsParams) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // serviceType 변경 시 인트로 화면 상태를 리셋 (방어적 안전 장치)
  useEffect(() => {
    setShowIntro(true);
  }, [serviceType]);

  const runAnalysis = async (payload: {
    subjectA: LoveSubjectInput;
    subjectB?: LoveSubjectInput;
    context: Record<string, unknown>;
    relationMode?: string;
  }) => {
    if (!serviceType) {
      setError("서비스 타입을 확인할 수 없습니다.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const sajuA = calculateSaju(payload.subjectA);
      const sajuB = payload.subjectB ? calculateSaju(payload.subjectB) : undefined;
      const featureSet = extractLoveFeatureSet({
        subjectA: payload.subjectA,
        sajuA,
        subjectB: payload.subjectB,
        sajuB,
      });

      const created = await createLoveReport({
        serviceType,
        relationMode: payload.relationMode,
        inputSnapshot: {
          subjectA: payload.subjectA,
          subjectB: payload.subjectB,
          context: payload.context,
        },
        featureSet,
      });

      setRecord(created);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "연애 리포트 생성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const unlock = async (paymentMeta?: UnlockPaymentMeta) => {
    if (!record?.id || !resolvedServiceType) {
      return;
    }

    setIsUnlocking(true);
    setError(null);

    try {
      const unlocked = await unlockLoveReport({
        id: record.id,
        productCode,
        amountKrw: price,
        provider: paymentMeta?.provider,
        providerOrderId: paymentMeta?.providerOrderId,
      });
      setRecord(unlocked);
    } catch (unlockError) {
      setError(unlockError instanceof Error ? unlockError.message : "리포트 잠금해제에 실패했습니다.");
    } finally {
      setIsUnlocking(false);
    }
  };

  return {
    isSubmitting,
    isUnlocking,
    upgradeOpen,
    showIntro,
    setUpgradeOpen,
    setShowIntro,
    runAnalysis,
    unlock,
  };
}
