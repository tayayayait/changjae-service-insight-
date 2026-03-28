import { useState, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "@/hooks/use-toast";

interface UseUnlockReportFlowParams {
  reportId: string | null;
  serviceId: string;
  price: number;
  onUnlocked: () => void;
  unlockAction: (reportId: string, amount: number) => Promise<any>;
}

/**
 * 리포트 잠금 해제(결제) 로직을 관리하는 범용 hook
 */
export function useUnlockReportFlow({
  reportId,
  serviceId,
  price,
  onUnlocked,
  unlockAction,
}: UseUnlockReportFlowParams) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const { user } = useAuthStore();

  const handleUnlock = useCallback(async () => {
    if (!reportId) {
      toast({
        title: "오류",
        description: "리포트 ID를 찾을 수 없습니다.",
        variant: "destructive"
      });
      return;
    }

    setIsUnlocking(true);
    try {
      // 실제 결제 및 잠금 해제 처리
      await unlockAction(reportId, price);
      
      toast({
        title: "잠금 해제 완료",
        description: "리포트 전체 내용을 확인하실 수 있습니다.",
      });
      
      setUpgradeOpen(false);
      onUnlocked();
    } catch (error) {
      console.error("Unlock failed:", error);
      toast({
        title: "잠금 해제 실패",
        description: error instanceof Error ? error.message : "결제 처리 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsUnlocking(false);
    }
  }, [reportId, price, unlockAction, onUnlocked]);

  return {
    upgradeOpen,
    setUpgradeOpen,
    isUnlocking,
    handleUnlock,
  };
}
