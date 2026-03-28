import { Link } from "react-router-dom";
import { ArrowRight, LucideIcon, Star, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HomeServiceCardProps {
  title: string;
  description: string;
  to: string;
  badge: string;
  eta: string;
  icon: LucideIcon;
  accentClassName: string;
}

export function HomeServiceCard({
  title,
  description,
  to,
  badge,
  eta,
  icon: Icon,
  accentClassName,
}: HomeServiceCardProps) {
  // 임의의 데이터 (실제 연동 전까지는 목업 데이터 사용)
  const rating = (4.5 + Math.random() * 0.5).toFixed(1);
  const viewCount = Math.floor(Math.random() * 1000) + 100;

  return (
    <Link to={to} className="block h-full">
      <Card
        className={cn(
          "group flex h-full min-h-[220px] flex-col overflow-hidden rounded-[24px] border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg active:scale-[0.98]",
          accentClassName,
          "bg-white backdrop-blur-sm"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/50 bg-white shadow-sm ring-1 ring-black/[0.02]">
            <Icon className="h-6 w-6 text-foreground/80" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ring-1 ring-black/[0.05]",
              badge === "BEST" || badge === "베스트" ? "bg-primary text-white" : "bg-bg-elevated/90 text-text-secondary"
            )}>
              {badge}
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-2 text-left">
          <h3 className="line-clamp-2 text-[17px] font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="line-clamp-2 text-[13px] leading-relaxed text-text-secondary">
            {description}
          </p>
        </div>

        {/* Social Proof 영역 */}
        <div className="mt-4 flex items-center gap-3 text-[11px] font-medium text-text-muted">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{viewCount}+명 확인</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-black/[0.03]">
          <span className="text-[12px] font-bold text-text-muted">{eta}</span>
          <span className="inline-flex items-center gap-1 text-[13px] font-bold text-foreground group-hover:text-primary transition-colors">
            시작하기
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </Card>
    </Link>
  );
}
