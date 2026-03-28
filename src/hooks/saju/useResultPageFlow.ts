import { useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { copyResultUrl, downloadShareCard, tryNativeShare } from "@/lib/share";
import { unlockSajuResultLocally } from "@/lib/resultStore";
import { useResultStore } from "@/store/useResultStore";
import {
  SAJU_ANALYSIS_SERVICE_IDS,
  SAJU_NEW_YEAR_2026_SERVICE_IDS,
  SajuAnalysisServiceId,
  ShareCardVariant,
  UserInterest,
} from "@/types/result";
import { REPORT_RENDERER_REGISTRY } from "@/lib/reportRenderers";
import { getPaidReport } from "@/lib/paidReportCatalog";
import { PortonePaymentResult } from "@/lib/portone";

const INTEREST_LABELS: Record<UserInterest, string> = {
  career: "직장/커리어",
  love: "연애/결혼",
  study: "학업",
  money: "재물",
  health: "건강",
  kids: "자녀/가족",
  path: "진로/적성",
  rel: "대인관계",
  realestate: "부동산",
  travel: "이사/여행",
  business: "사업",
  self: "자기계발",
  free: "자유질문",
};

const isSupportedServiceType = (
  serviceType: string | undefined,
): serviceType is SajuAnalysisServiceId => {
  return Boolean(serviceType) && serviceType in REPORT_RENDERER_REGISTRY;
};

const isSelectableServiceId = (serviceId: string | undefined): serviceId is string => {
  if (!serviceId) {
    return false;
  }

  return (
    serviceId === "traditional-saju" ||
    (SAJU_ANALYSIS_SERVICE_IDS as readonly string[]).includes(serviceId) ||
    (SAJU_NEW_YEAR_2026_SERVICE_IDS as readonly string[]).includes(serviceId)
  );
};

interface SajuCheckoutConfig {
  serviceId: string;
  serviceType: string;
  serviceName: string;
  amount: number;
  inputSnapshot: Record<string, unknown>;
  reportPayload: Record<string, unknown>;
  previewPayload: Record<string, unknown>;
}

interface SajuCheckoutSuccessPayload {
  orderNumber: string;
  reportId: string;
  paymentResult: PortonePaymentResult;
  buyerInfo: {
    name: string;
    phone: string;
    email: string;
  };
  ownerKey: string;
}

export function useResultPageFlow(resultId?: string) {
  const result = useResultStore((state) => state.currentResult);
  const loadLatestResult = useResultStore((state) => state.loadLatestResult);
  const loadResultById = useResultStore((state) => state.loadResultById);
  const isLoading = useResultStore((state) => state.isLoading);
  const error = useResultStore((state) => state.error);
  const [shareVariant] = useState<ShareCardVariant>("summary");
  const [checkoutConfig, setCheckoutConfig] = useState<SajuCheckoutConfig | null>(null);

  useEffect(() => {
    if (resultId) {
      void loadResultById(resultId);
    }
  }, [resultId, loadResultById]);

  const legendItems = useMemo(() => {
    if (!result) {
      return [];
    }

    return result.oheng.map((item) => ({
      label: item.element,
      element: item.element,
      value: `${item.percentage}%`,
    }));
  }, [result]);

  const dominantElement = useMemo(() => {
    if (!result) {
      return "-";
    }

    const sorted = [...result.oheng].sort((a, b) => b.percentage - a.percentage);
    return sorted[0]?.element ?? "-";
  }, [result]);

  const interestTags = useMemo(() => {
    if (!result?.interests.length) {
      return [];
    }

    return result.interests.map((interest) => INTEREST_LABELS[interest] ?? interest);
  }, [result]);

  const serviceType = isSupportedServiceType(result?.consultationType)
    ? result.consultationType
    : null;
  const specializedReport = useMemo(() => {
    if (!result?.reportPayload || !serviceType) {
      return null;
    }
    const renderer = REPORT_RENDERER_REGISTRY[serviceType];
    return renderer(result.reportPayload as never);
  }, [result?.reportPayload, serviceType]);

  const selectedServiceIds = useMemo(() => {
    if (!result?.reportPayloads || Object.keys(result.reportPayloads).length === 0) {
      return [];
    }

    const payloadKeys = Object.keys(result.reportPayloads);
    const payloadKeySet = new Set(payloadKeys);

    const addCandidate = (candidate: string | undefined) => {
      if (!candidate || !isSelectableServiceId(candidate)) {
        return null;
      }
      return payloadKeySet.has(candidate) ? candidate : null;
    };

    const unlockedCandidate =
      result.unlockedItems?.map((item) => addCandidate(item)).find(Boolean) ?? null;
    if (unlockedCandidate) {
      return [unlockedCandidate];
    }

    const sourceCandidate = addCandidate(result.sourceServiceId);
    if (sourceCandidate) {
      return [sourceCandidate];
    }

    const consultationCandidate = addCandidate(result.consultationType);
    if (consultationCandidate) {
      return [consultationCandidate];
    }

    if (result.consultationType === "lifetime") {
      for (const serviceId of SAJU_ANALYSIS_SERVICE_IDS) {
        if (payloadKeySet.has(serviceId)) {
          return [serviceId];
        }
      }
    }

    if (result.consultationType === "new-year-2026") {
      for (const serviceId of SAJU_NEW_YEAR_2026_SERVICE_IDS) {
        if (payloadKeySet.has(serviceId)) {
          return [serviceId];
        }
      }
    }

    return [payloadKeys[0]];
  }, [result]);

  const selectedServiceId = selectedServiceIds[0];
  const isLifetimeReport =
    (selectedServiceId
      ? (SAJU_ANALYSIS_SERVICE_IDS as readonly string[]).includes(selectedServiceId)
      : false) ||
    result?.consultationType === "lifetime" ||
    (result?.consultationType
      ? (SAJU_ANALYSIS_SERVICE_IDS as readonly string[]).includes(result.consultationType)
      : false);
  const isMultiReportMode = selectedServiceIds.length > 0;

  const getTabServiceIds = () => {
    return selectedServiceIds;
  };

  const handleUnlockRequest = (serviceId: string, isBulk?: boolean) => {
    if (!result) return;

    try {
      const reportItem = getPaidReport(serviceId);
      if (!reportItem) {
        toast({ title: "오류", description: "유효하지 않은 서비스입니다.", variant: "destructive" });
        return;
      }

      const amount = isBulk ? 9900 : reportItem.price;
      const reportPayloads = (result.reportPayloads ?? {}) as Record<string, unknown>;
      const serviceName = isBulk ? `${reportItem.categoryLabel} 전체 해금` : reportItem.title;

      setCheckoutConfig({
        serviceId,
        serviceType: reportItem.serviceType,
        serviceName,
        amount,
        inputSnapshot: result.profileData as unknown as Record<string, unknown>,
        reportPayload:
          (reportPayloads[serviceId] as Record<string, unknown> | undefined) ??
          (result.reportPayload as unknown as Record<string, unknown>) ??
          {},
        previewPayload: {
          summary: result.summary,
          sections: result.sections,
        },
      });
    } catch (err) {
      console.error("Unlock error:", err);
      toast({
        title: "결제 오류",
        description: err instanceof Error ? err.message : "결제 과정에서 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const closeCheckout = () => {
    setCheckoutConfig(null);
  };

  const handleCheckoutSuccess = async (_payload: SajuCheckoutSuccessPayload) => {
    toast({
      title: "결제 성공",
      description: "리포트를 여는 중입니다. 잠시만 기다려주세요.",
    });

    if (result?.id) {
      unlockSajuResultLocally({
        resultId: result.id,
        serviceId: checkoutConfig?.serviceId,
      });
      await loadResultById(result.id);
      return;
    }

    void loadLatestResult();
  };

  const handleShare = async () => {
    if (!result) {
      return;
    }

    try {
      trackEvent("share_clicked", { variant: shareVariant, resultId: result.id });
      const nativeShared = await tryNativeShare(result, shareVariant);
      if (!nativeShared) {
        const url = await copyResultUrl(result.id);
        toast({ title: "링크 복사 완료", description: url });
      }
    } catch (shareError) {
      const message =
        shareError instanceof Error
          ? shareError.message
          : "공유에 실패했습니다.";
      toast({ title: "공유 실패", description: message, variant: "destructive" });
    }
  };

  const handleCopy = async () => {
    if (!result) {
      return;
    }

    try {
      const url = await copyResultUrl(result.id);
      toast({
        title: "링크 복사 완료",
        description: url,
      });
    } catch {
      toast({
        title: "복사 실패",
        description: "링크를 복사할 수 없습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!result) {
      return;
    }

    try {
      trackEvent("save_clicked", { variant: shareVariant, resultId: result.id });
      await downloadShareCard(result, shareVariant);
      toast({
        title: "저장 완료",
        description: "공유 카드가 이미지로 저장되었습니다.",
      });
    } catch (downloadError) {
      const message =
        downloadError instanceof Error
          ? downloadError.message
          : "저장에 실패했습니다.";
      toast({ title: "저장 실패", description: message, variant: "destructive" });
    }
  };

  return {
    result,
    isLoading,
    error,
    loadLatestResult,
    loadResultById,
    legendItems,
    dominantElement,
    interestTags,
    specializedReport,
    isLifetimeReport,
    isMultiReportMode,
    getTabServiceIds,
    handleUnlockRequest,
    checkoutConfig,
    closeCheckout,
    handleCheckoutSuccess,
    handleShare,
    handleCopy,
    handleDownload,
  };
}
