import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HomeFeedCardProps {
  category: string;
  title: string;
  summary: string;
  ctaLabel: string;
  to: string;
  accentClassName: string;
}

export function HomeFeedCard({ category, title, summary, ctaLabel, to, accentClassName }: HomeFeedCardProps) {
  return (
    <Card className="overflow-hidden rounded-[24px] border border-border bg-bg-elevated shadow-sm transition-normal hover:-translate-y-0.5 hover:shadow-md">
      <div className={cn("h-40 w-full border-b border-white/40", accentClassName)}>
        <div className="flex h-full flex-col justify-between p-5">
          <span className="w-fit rounded-full bg-bg-elevated/90 px-3 py-1 text-[11px] font-semibold text-text-secondary shadow-sm">
            {category}
          </span>
          <div className="flex items-end justify-between text-foreground/75">
            <span className="text-[13px] font-semibold">이번 달 추천</span>
            <span className="text-[13px] font-semibold">쉽게 읽는 해석</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-title text-foreground">{title}</h3>
          <p className="line-clamp-3 text-caption text-text-secondary">{summary}</p>
        </div>

        <Link to={to} className="inline-flex items-center gap-2 text-[14px] font-semibold text-foreground">
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}
