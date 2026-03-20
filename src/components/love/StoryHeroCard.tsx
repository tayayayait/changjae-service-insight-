import { LoveServiceType } from "@/types/love";
import { Badge } from "@/components/ui/badge";

const SERVICE_LABEL: Record<LoveServiceType, string> = {
  "future-partner": "미래 배우자 상담 리포트",
  "couple-report": "커플 관계 상담 리포트",
  "crush-reunion": "짝사랑·재회 상담 리포트",
};

interface StoryHeroCardProps {
  serviceType: LoveServiceType;
  headline: string;
  summary: string;
}

export function StoryHeroCard({ serviceType, headline, summary }: StoryHeroCardProps) {
  return (
    <section className="rounded-[28px] border border-[#24303F]/10 bg-gradient-to-br from-[#FFF4F6] via-white to-[#F0F7FF] p-6 shadow-sm">
      <Badge className="mb-3 bg-[#24303F] text-white">{SERVICE_LABEL[serviceType]}</Badge>
      <h2 className="text-[24px] font-black leading-tight text-gray-900">{headline}</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-gray-700">{summary}</p>
    </section>
  );
}
