import { AnyLoveScoreSet } from "@/types/love";
import { LuckScoreRing } from "@/components/charts/LuckScoreRing";
import { normalizeLoveScoreSet } from "@/lib/loveReportAdapters";

interface MatchScorePanelProps {
  scoreSet: AnyLoveScoreSet;
}

export function MatchScorePanel({ scoreSet }: MatchScorePanelProps) {
  const normalized = normalizeLoveScoreSet(scoreSet);
  const details: Array<{ label: string; value: number }> = [
    { label: "끌림", value: normalized.pull },
    { label: "감정 속도", value: normalized.pace },
    { label: "생활 합의력", value: normalized.alignment },
    { label: "회복 탄력성", value: normalized.repair },
    { label: "관계 시기성", value: normalized.timing },
  ];

  return (
    <section className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-bold text-foreground">상담 진단 지표</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
            점수보다 중요한 것은 어디를 맞추고 어디를 조율해야 하는지 아는 것입니다.
          </p>
        </div>
      </div>
      <div className="mt-4 grid items-center gap-4 md:grid-cols-[180px_1fr]">
        <div className="flex justify-center">
          <LuckScoreRing score={normalized.overall} />
        </div>
        <div className="space-y-3">
          {details.map((item) => (
            <div key={item.label} className="grid grid-cols-[90px_1fr_40px] items-center gap-3">
              <span className="text-[12px] font-semibold text-text-secondary">{item.label}</span>
              <div className="h-2 rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-[#24303F]" style={{ width: `${item.value}%` }} />
              </div>
              <span className="text-right text-[12px] font-bold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
