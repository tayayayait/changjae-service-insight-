import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface UpgradeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  priceText: string;
  loading?: boolean;
  onUnlock: () => Promise<void> | void;
}

export function UpgradeDrawer({ open, onOpenChange, title, priceText, loading, onUnlock }: UpgradeDrawerProps) {
  const [isWorking, setIsWorking] = useState(false);

  const handleUnlock = async () => {
    try {
      setIsWorking(true);
      await onUnlock();
      onOpenChange(false);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>무료 미리보기 이후 상담형 전체 리포트를 즉시 열람할 수 있습니다.</DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-border bg-gray-50 p-4 text-[13px] text-text-secondary">
          <p>결제 방식: 리포트 개별 결제</p>
          <p className="mt-1">가격: {priceText}</p>
          <p className="mt-1">해제 범위: 전체 상담 섹션 + 행동 가이드 + 재열람</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
          <Button className="bg-[#24303F] text-white" disabled={loading || isWorking} onClick={() => void handleUnlock()}>
            {loading || isWorking ? "처리 중..." : "상담 리포트 이어서 보기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
