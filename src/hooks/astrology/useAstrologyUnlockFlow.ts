import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const isUnlockColumnMissingError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  const message = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  return code === "PGRST204" && message.includes("'is_unlocked'");
};

export function useAstrologyUnlockFlow(reportId: string | undefined, onSuccess: () => void) {
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlockRequest = useCallback(async () => {
    if (!reportId) {
      toast({
        title: "오류",
        description: "리포트 ID를 찾을 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsUnlocking(true);
    try {
      const { error: updateError } = await supabase
        .from("astrology_reports")
        .update({ is_unlocked: true })
        .eq("id", reportId);

      if (updateError) {
        if (isUnlockColumnMissingError(updateError)) {
          console.warn("astrology_reports.is_unlocked column missing. Skipping unlock flag update.");
        } else {
          throw updateError;
        }
      }

      toast({
        title: "결제 완료",
        description: "전체 리포트가 성공적으로 해금되었습니다.",
      });

      onSuccess();
    } catch (error) {
      console.error("Unlock error:", error);
      toast({
        title: "결제 실패",
        description: error instanceof Error ? error.message : "결제 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsUnlocking(false);
    }
  }, [reportId, onSuccess]);

  return {
    isUnlocking,
    handleUnlockRequest,
  };
}
