interface CounselSnapshotCardProps {
  diagnosis: string;
  relationshipTemperature: string;
  immediateAction: string;
}

export function CounselSnapshotCard({
  diagnosis,
  relationshipTemperature,
  immediateAction,
}: CounselSnapshotCardProps) {
  return (
    <section className="rounded-[28px] border border-[#24303F]/10 bg-gradient-to-br from-[#FFF7F2] via-white to-[#F7FAFF] p-6 shadow-sm">
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8A4757]">Quick Counsel</p>
      <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[22px] bg-white/90 p-5 ring-1 ring-[#24303F]/8">
          <p className="text-[12px] font-semibold text-text-secondary">한 줄 진단</p>
          <p className="mt-2 text-[19px] font-bold leading-snug text-foreground">{diagnosis}</p>
        </div>
        <div className="grid gap-4">
          <div className="rounded-[22px] bg-[#24303F] p-4 text-white">
            <p className="text-[12px] font-semibold text-white/70">관계 온도</p>
            <p className="mt-2 text-[16px] font-bold leading-snug">{relationshipTemperature}</p>
          </div>
          <div className="rounded-[22px] bg-[#FFF4F6] p-4">
            <p className="text-[12px] font-semibold text-[#8A4757]">지금 필요한 행동</p>
            <p className="mt-2 text-[14px] font-semibold leading-relaxed text-foreground">{immediateAction}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
