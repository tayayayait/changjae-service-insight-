import { Lock } from "lucide-react";
import { LoveReportSection } from "@/types/love";

interface CounselSectionCardProps {
  section: LoveReportSection;
  masked?: boolean;
}

export function CounselSectionCard({ section, masked = false }: CounselSectionCardProps) {
  return (
    <section className="rounded-[26px] border border-border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#24303F]/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#24303F]">
          {section.navLabel}
        </span>
        <p className="text-[12px] font-semibold text-[#8A4757]">{section.coreQuestion}</p>
      </div>
      <h3 className="mt-3 text-[20px] font-bold leading-snug text-foreground">{section.title}</h3>

      <div className="mt-4 rounded-2xl bg-[#FFF7F2] p-4">
        <p className="text-[12px] font-semibold text-[#8A4757]">진단 요약</p>
        <p className="mt-2 text-[15px] font-semibold leading-relaxed text-foreground">{section.verdict}</p>
      </div>

      <div className="relative mt-4">
        <div
          className={[
            "space-y-4 transition-[filter,opacity] duration-300",
            masked ? "select-none blur-[10px] opacity-70" : "",
          ].join(" ")}
          data-testid={masked ? "counsel-section-masked-body" : undefined}
          aria-hidden={masked}
        >
          <div>
            <p className="text-[12px] font-semibold text-text-secondary">해석</p>
            <div className="mt-2 space-y-3 text-[14px] leading-7 text-text-secondary">
              {section.analysisParagraphs.map((paragraph, index) => (
                <p key={`${section.id}-analysis-${index}`}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#F0D6B8] bg-[#FFF8F2] p-4">
            <p className="text-[12px] font-semibold text-[#8A4757]">해석 포인트</p>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-text-secondary">
              {section.interpretationPoints.map((item, index) => (
                <li key={`${section.id}-point-${index}`} className="flex gap-2">
                  <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-[#8A4757]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#24303F]/10 bg-[#F8FAFC] p-4">
            <p className="text-[12px] font-semibold text-foreground">{section.actionTitle}</p>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-text-secondary">
              {section.actionItems.map((item, index) => (
                <li key={`${section.id}-action-${index}`} className="flex gap-2">
                  <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-[#24303F]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-[#24303F] p-4 text-white">
            <p className="text-[12px] font-semibold text-white/70">주의 메모</p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/90">{section.warningNote}</p>
          </div>
        </div>

        {masked ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-[22px] border border-white/80 bg-white/72 backdrop-blur-[3px]"
            data-testid="counsel-section-mask-overlay"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-[#24303F] px-4 py-2 text-[12px] font-semibold text-white shadow-sm">
              <Lock className="h-3.5 w-3.5" />
              결제 후 전체 열람
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
