import React, { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOwnerStore } from "@/store/useOwnerStore";

interface OwnerVerificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: (ownerKey: string) => void | Promise<void>;
}

const normalizePhone = (value: string) => value.replace(/[^0-9]/g, "");

export const OwnerVerificationSheet: React.FC<OwnerVerificationSheetProps> = ({
  isOpen,
  onClose,
  onVerified,
}) => {
  const setOwnerFromVerifiedContact = useOwnerStore((state) => state.setOwnerFromVerifiedContact);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedPhone) {
      alert("휴대폰 번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const ownerKey = await setOwnerFromVerifiedContact({
        phone: normalizedPhone,
        email: normalizedEmail || undefined,
      });

      if (onVerified) {
        await onVerified(ownerKey);
      }
      onClose();
    } catch (error) {
      console.error("owner verification error:", error);
      alert("소유자 확인 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="left-1/2 right-auto h-auto max-h-[84vh] w-[min(92vw,720px)] -translate-x-1/2 overflow-y-auto rounded-t-3xl border-t-0 bg-stone-50 p-5 md:p-6"
      >
        <SheetHeader className="pb-3">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            소유자 확인
          </SheetTitle>
          <SheetDescription>
            같은 정보를 입력해도 어디서나 동일하게 질문 횟수를 유지하려면 연락처 기반 owner 확인이 필요합니다.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="owner-phone" className="text-sm font-semibold">
              휴대폰 번호 (필수)
            </Label>
            <Input
              id="owner-phone"
              type="tel"
              placeholder="01012345678"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner-email" className="text-sm font-semibold">
              이메일 (선택)
            </Label>
            <Input
              id="owner-email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
        </div>

        <SheetFooter className="pb-4">
          <Button
            className="h-12 w-full rounded-xl bg-indigo-600 text-base font-bold text-white hover:bg-indigo-700"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                확인 중...
              </>
            ) : (
              "확인하고 시작하기"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
