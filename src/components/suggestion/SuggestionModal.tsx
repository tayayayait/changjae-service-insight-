import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSuggestionStore, type SuggestionInput } from "@/store/useSuggestionStore";
import { toast } from "sonner";
import { Lightbulb, Send } from "lucide-react";

const CATEGORIES = [
  { value: "saju", label: "사주·만세력" },
  { value: "astrology", label: "점성학·별자리" },
  { value: "love", label: "연애·궁합" },
  { value: "general", label: "기타" },
];

interface SuggestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuggestionModal({ open, onOpenChange }: SuggestionModalProps) {
  const { submitSuggestion, isLoading } = useSuggestionStore();
  const [form, setForm] = useState<SuggestionInput>({
    category: "general",
    title: "",
    description: "",
    contact: "",
  });

  const isValid = form.title.trim().length >= 2 && form.description.trim().length >= 5;

  const handleSubmit = async () => {
    if (!isValid || isLoading) return;

    const ok = await submitSuggestion({
      category: form.category,
      title: form.title.trim(),
      description: form.description.trim(),
      contact: form.contact?.trim() || undefined,
    });

    if (ok) {
      toast.success("제안이 등록되었습니다!", {
        description: "운영자가 확인 후 반영할 예정입니다.",
      });
      setForm({ category: "general", title: "", description: "", contact: "" });
      onOpenChange(false);
    } else {
      toast.error("제안 등록에 실패했습니다.", {
        description: "잠시 후 다시 시도해 주세요.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-[24px] border-gray-100 p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-6 pt-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
                <Lightbulb className="h-5 w-5 text-indigo-600" />
              </div>
              <DialogTitle className="text-[18px] font-bold text-gray-900">
                서비스 제안하기
              </DialogTitle>
            </div>
            <DialogDescription className="text-[13px] text-gray-500 mt-1">
              원하시는 서비스나 기능을 자유롭게 제안해 주세요. 운영자가 검토 후 반영합니다.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form */}
        <div className="px-6 pb-6 pt-2 space-y-4">
          {/* 카테고리 */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-gray-700">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, category: cat.value }))}
                  className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                    form.category === cat.value
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-gray-700">
              원하는 서비스 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="예: 꿈해몽 서비스, 타로 카드점"
              maxLength={100}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-gray-700">
              상세 설명 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="어떤 서비스가 있으면 좋을지 자유롭게 작성해 주세요."
              rows={4}
              maxLength={1000}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
            />
          </div>

          {/* 연락처 (선택) */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-gray-700">
              연락처 <span className="text-[12px] text-gray-400 font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={form.contact ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
              placeholder="이메일 또는 연락처"
              maxLength={100}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          {/* 제출 버튼 */}
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            className="w-full h-12 rounded-xl bg-gray-900 text-white font-bold text-[14px] hover:bg-gray-800 disabled:opacity-40 transition-all shadow-sm"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                등록 중...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                제안 등록하기
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
