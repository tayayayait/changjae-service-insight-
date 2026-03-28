import { Button } from "@/components/ui/button";

interface RepeatUsePromptCardProps {
  nextRefreshAt: string;
  onReanalyze?: () => void;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "미정";
  }
  return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, "0")}.${date
    .getDate()
    .toString()
    .padStart(2, "0")}`;
};

const isRefreshOpen = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return true;
  }
  return Date.now() >= date.getTime();
};

export function RepeatUsePromptCard({ nextRefreshAt, onReanalyze }: RepeatUsePromptCardProps) {
  const refreshOpen = isRefreshOpen(nextRefreshAt);
  const helperText = refreshOpen
    ? "지금 다시 분석하면 최신 상태 기준으로 리포트를 새로 생성합니다."
    : "예정일 전에는 같은 조건 요청 시 기존 리포트를 재조회합니다.";
  const actionLabel = refreshOpen ? "같은 조건으로 재분석" : "같은 조건으로 재조회";

  return (
    <section className="rounded-2xl border border-[#24303F]/20 bg-[#24303F] p-5 text-white">
      <p className="text-[12px] font-semibold text-white/80">재분석 안내</p>
      <h3 className="mt-1 text-[18px] font-bold">인연 창 재분석 예정일: {formatDate(nextRefreshAt)}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-white/80">{helperText}</p>
      {onReanalyze ? (
        <Button className="mt-4 bg-white text-[#24303F] hover:bg-white/90" onClick={onReanalyze}>
          {actionLabel}
        </Button>
      ) : null}
    </section>
  );
}
