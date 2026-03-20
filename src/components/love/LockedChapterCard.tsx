import { Lock } from "lucide-react";
import { LegacyLoveLockedChapter, LoveLockedSectionSummary } from "@/types/love";

interface LockedChapterCardProps {
  chapter: LoveLockedSectionSummary | LegacyLoveLockedChapter;
}

export function LockedChapterCard({ chapter }: LockedChapterCardProps) {
  if ("key" in chapter) {
    return (
      <article className="rounded-2xl border border-border bg-white p-4">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-text-secondary">
          <Lock className="h-3.5 w-3.5" />
          잠금 챕터
        </div>
        <h3 className="mt-2 text-[16px] font-bold text-foreground">{chapter.title}</h3>
        <p className="mt-2 line-clamp-2 text-[13px] text-text-secondary blur-[1px]">{chapter.teaser}</p>
      </article>
    );
  }

  return (
    <article className="rounded-[24px] border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-text-secondary">
        <Lock className="h-3.5 w-3.5" />
        이어지는 상담 주제
      </div>
      <h3 className="mt-2 text-[18px] font-bold leading-snug text-foreground">{chapter.title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">{chapter.teaser}</p>
      <div className="mt-4 rounded-2xl bg-[#FFF5F6] p-3 text-[13px] font-medium leading-relaxed text-[#8A4757]">
        {chapter.benefit}
      </div>
    </article>
  );
}
