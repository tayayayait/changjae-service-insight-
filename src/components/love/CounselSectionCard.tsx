import { LoveReportSection } from "@/types/love";

interface CounselSectionCardProps {
  section: LoveReportSection;
}

export function CounselSectionCard({ section }: CounselSectionCardProps) {
  return (
    <section className="rounded-[26px] border border-border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#24303F]/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#24303F]">
          {section.type}
        </span>
        <p className="text-[12px] font-semibold text-[#8A4757]">{section.question}</p>
      </div>
      <h3 className="mt-3 text-[20px] font-bold leading-snug text-foreground">{section.title}</h3>
      <div className="mt-4 rounded-2xl bg-[#FFF7F2] p-4">
        <p className="text-[12px] font-semibold text-[#8A4757]">결론</p>
        <p className="mt-2 text-[15px] font-semibold leading-relaxed text-foreground">{section.conclusion}</p>
      </div>
      <div className="mt-4 space-y-4">
        <div>
          <p className="text-[12px] font-semibold text-text-secondary">이유</p>
          <p className="mt-2 text-[14px] leading-7 text-text-secondary">{section.reason}</p>
        </div>
        <div className="rounded-2xl border border-[#24303F]/10 bg-[#F8FAFC] p-4">
          <p className="text-[12px] font-semibold text-foreground">{section.actionLabel}</p>
          <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-text-secondary">
            {section.actionItems.map((item, index) => (
              <li key={`${section.type}-${index}`} className="flex gap-2">
                <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-[#24303F]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-[#24303F] p-4 text-white">
          <p className="text-[12px] font-semibold text-white/70">상담 메모</p>
          <p className="mt-2 text-[13px] leading-relaxed text-white/90">{section.counselorNote}</p>
        </div>
      </div>
    </section>
  );
}
