import { Lock } from "lucide-react";
import {
  LegacyLoveLockedChapter,
  LoveLockedSectionSummary,
  LoveLockedSectionSummaryV2,
} from "@/types/love";

interface LockedChapterCardProps {
  chapter: LoveLockedSectionSummary | LoveLockedSectionSummaryV2 | LegacyLoveLockedChapter;
  masked?: boolean;
}

export function LockedChapterCard({ chapter, masked = false }: LockedChapterCardProps) {
  if ("key" in chapter) {
    return (
      <article className="rounded-2xl border border-border bg-white p-4">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-text-secondary" data-testid="locked-chapter-label">
          <Lock className="h-3.5 w-3.5" />
          잠금 챕터
        </div>
        <h3 className="mt-2 text-[16px] font-bold text-foreground">{chapter.title}</h3>
        <div className="relative mt-2">
          <p
            className={[
              "line-clamp-2 text-[13px] text-text-secondary transition-[filter,opacity] duration-300",
              masked ? "select-none blur-[10px] opacity-70" : "",
            ].join(" ")}
            data-testid={masked ? "locked-chapter-masked-teaser" : undefined}
            aria-hidden={masked}
          >
            {chapter.teaser}
          </p>
          {masked ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center rounded-xl border border-white/80 bg-white/70 backdrop-blur-[3px]"
              data-testid="locked-chapter-mask-overlay"
            >
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#24303F] px-3 py-1.5 text-[11px] font-semibold text-white">
                <Lock className="h-3 w-3" />
                결제 후 열람
              </div>
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-[24px] border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-text-secondary" data-testid="locked-chapter-label">
        <Lock className="h-3.5 w-3.5" />
        이어지는 상담 주제
      </div>
      <h3 className="mt-2 text-[18px] font-bold leading-snug text-foreground">{chapter.title}</h3>
      <div className="relative mt-2">
        <div
          className={[
            "space-y-4 transition-[filter,opacity] duration-300",
            masked ? "select-none blur-[10px] opacity-70" : "",
          ].join(" ")}
          data-testid={masked ? "locked-chapter-masked-body" : undefined}
          aria-hidden={masked}
        >
          <p className="text-[13px] leading-relaxed text-text-secondary">{chapter.teaser}</p>
          <div className="rounded-2xl bg-[#FFF5F6] p-3 text-[13px] font-medium leading-relaxed text-[#8A4757]">
            {chapter.benefit}
          </div>
        </div>
        {masked ? (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-[16px] border border-white/80 bg-white/72 backdrop-blur-[3px]"
            data-testid="locked-chapter-mask-overlay"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-[#24303F] px-3.5 py-1.5 text-[11px] font-semibold text-white">
              <Lock className="h-3 w-3" />
              결제 후 열람
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
