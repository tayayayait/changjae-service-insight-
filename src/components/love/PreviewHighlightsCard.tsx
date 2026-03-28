interface PreviewHighlightsCardProps {
  title?: string;
  highlights: string[];
}

export function PreviewHighlightsCard({
  title = "무료로 먼저 볼 수 있는 핵심 포인트",
  highlights,
}: PreviewHighlightsCardProps) {
  return (
    <section className="rounded-[26px] border border-[#F0D6B8] bg-[#FFFDFB] p-5 shadow-sm">
      <h3 className="text-[18px] font-bold text-foreground">{title}</h3>
      <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-text-secondary">
        {highlights.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2">
            <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-[#8A4757]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
