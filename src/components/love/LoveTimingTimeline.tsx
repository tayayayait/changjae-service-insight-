interface LoveTimingTimelineProps {
  title?: string;
  points: Array<{
    label: string;
    description: string;
  }>;
}

export function LoveTimingTimeline({ title = "관계 흐름 타임라인", points }: LoveTimingTimelineProps) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5">
      <h3 className="text-[16px] font-bold text-foreground">{title}</h3>
      <div className="mt-4 space-y-4">
        {points.map((item, index) => (
          <div key={`${item.label}-${index}`} className="grid grid-cols-[18px_1fr] gap-3">
            <div className="flex flex-col items-center">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#24303F]" />
              {index < points.length - 1 ? <span className="mt-1 h-full w-px bg-border" /> : null}
            </div>
            <div className="pb-2">
              <p className="text-[13px] font-semibold text-foreground">{item.label}</p>
              <p className="mt-1 text-[13px] text-text-secondary">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

