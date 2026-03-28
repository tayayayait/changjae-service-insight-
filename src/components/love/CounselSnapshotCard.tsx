import { LoveQuickCounsel } from "@/types/love";

interface CounselSnapshotCardProps {
  quickCounsel: LoveQuickCounsel;
  previewLabel?: string;
}

export function CounselSnapshotCard({ quickCounsel, previewLabel = "무료 미리보기" }: CounselSnapshotCardProps) {
  return (
    <section className="rounded-[28px] border border-[#24303F]/10 bg-gradient-to-br from-[#FFF7F2] via-white to-[#F7FAFF] p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8A4757]">Quick Counsel</p>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#8A4757] ring-1 ring-[#8A4757]/15">
          {previewLabel}
        </span>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[22px] bg-white/90 p-5 ring-1 ring-[#24303F]/8">
          <p className="text-[12px] font-semibold text-text-secondary">한 줄 진단</p>
          <p className="mt-2 text-[19px] font-bold leading-snug text-foreground">{quickCounsel.diagnosis}</p>
        </div>
        <div className="grid gap-4">
          <div className="rounded-[22px] bg-[#24303F] p-4 text-white">
            <p className="text-[12px] font-semibold text-white/70">{quickCounsel.temperatureLabel}</p>
            <p className="mt-2 text-[16px] font-bold leading-snug">{quickCounsel.temperatureText}</p>
          </div>
          <div className="rounded-[22px] bg-[#FFF4F6] p-4">
            <p className="text-[12px] font-semibold text-[#8A4757]">지금 필요한 행동</p>
            <p className="mt-2 text-[14px] font-semibold leading-relaxed text-foreground">{quickCounsel.immediateAction}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
