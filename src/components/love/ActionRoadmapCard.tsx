import { LoveActionRoadmap } from "@/types/love";

interface ActionRoadmapCardProps {
  roadmap: LoveActionRoadmap;
}

const COLUMN_COPY: Array<{ key: keyof LoveActionRoadmap; label: string; tone: string }> = [
  { key: "now", label: "지금", tone: "bg-[#FFF7F2] border-[#F0D6B8]" },
  { key: "within7Days", label: "7일 안", tone: "bg-[#F7FAFF] border-[#CAD7F2]" },
  { key: "within30Days", label: "30일 안", tone: "bg-[#F8FAFC] border-border" },
];

export function ActionRoadmapCard({ roadmap }: ActionRoadmapCardProps) {
  return (
    <section className="rounded-[28px] border border-border bg-white p-5 shadow-sm">
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-text-secondary">전체 리포트에서 제공</p>
      <h3 className="mt-2 text-[20px] font-bold text-foreground">행동 로드맵</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {COLUMN_COPY.map((column) => (
          <div key={column.key} className={`rounded-[22px] border p-4 ${column.tone}`}>
            <p className="text-[12px] font-semibold text-[#8A4757]">{column.label}</p>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-text-secondary">
              {roadmap[column.key].map((item, index) => (
                <li key={`${column.key}-${index}`} className="flex gap-2">
                  <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-[#24303F]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
