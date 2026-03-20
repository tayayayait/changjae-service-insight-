interface CounselListCardProps {
  title: string;
  label: string;
  items: string[];
  tone?: "default" | "warning" | "highlight";
}

const toneClass: Record<NonNullable<CounselListCardProps["tone"]>, string> = {
  default: "bg-white border-border",
  warning: "bg-[#FFF8F2] border-[#F0D6B8]",
  highlight: "bg-[#F5F8FF] border-[#CAD7F2]",
};

export function CounselListCard({
  title,
  label,
  items,
  tone = "default",
}: CounselListCardProps) {
  return (
    <section className={`rounded-[24px] border p-5 ${toneClass[tone]}`}>
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-text-secondary">{label}</p>
      <h3 className="mt-2 text-[18px] font-bold text-foreground">{title}</h3>
      <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-text-secondary">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2">
            <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-[#24303F]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
