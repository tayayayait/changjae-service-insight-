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

export function RepeatUsePromptCard({ nextRefreshAt, onReanalyze }: RepeatUsePromptCardProps) {
  return (
    <section className="rounded-2xl border border-[#24303F]/20 bg-[#24303F] p-5 text-white">
      <p className="text-[12px] font-semibold text-white/80">재방문 추천</p>
      <h3 className="mt-1 text-[18px] font-bold">인연 창 재분석 예정일: {formatDate(nextRefreshAt)}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-white/80">
        다음 분석 시점에 관계 타이밍과 행동 가이드를 다시 갱신하면 전환 신호를 놓치지 않을 수 있습니다.
      </p>
      {onReanalyze ? (
        <Button className="mt-4 bg-white text-[#24303F] hover:bg-white/90" onClick={onReanalyze}>
          같은 조건으로 재분석
        </Button>
      ) : null}
    </section>
  );
}

