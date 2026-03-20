import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { memo } from "react";

export interface SajuServiceCardProps {
  title: string;
  description: string;
  to: string;
  badge?: string;
  eta?: string;
  icon: any;
  accentClassName?: string;
  rating?: number;
  onClick?: () => void;
}

export const SajuServiceCard = memo(function SajuServiceCard({
  title,
  description,
  to,
  badge,
  eta,
  icon: Icon,
  accentClassName = "",
  rating = 4.9,
  onClick,
}: SajuServiceCardProps) {
  const viewCount = Math.floor(Math.random() * 5000) + 1000;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden bg-white hover:bg-bg-subtle",
        "border border-border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md",
        "h-full rounded-2xl",
        accentClassName
      )}
    >
      {/* 아이콘 및 뱃지 헤더 */}
      <div className="mb-4 flex items-start justify-between relative z-10">
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-border transition-transform group-hover:scale-110",
          accentClassName.includes("lavender") && "text-[#CBB7F6]",
          accentClassName.includes("sky") && "text-[#AFCFFF]",
          accentClassName.includes("mint") && "text-[#AEE7D8]",
          accentClassName.includes("pink") && "text-[#F3B6C7]"
        )}>
          <Icon className="h-6 w-6" />
        </div>
        {badge && (
          <span className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ring-1 ring-inset",
            badge === "BEST" || badge === "PREMIUM" 
              ? "bg-[#24303F] text-white ring-white/10" 
              : "bg-[#FFF8EE] text-[#F2A65A] ring-orange-100/50"
          )}>
            {badge}
          </span>
        )}
      </div>

      <div className="flex-1 space-y-1 break-keep relative z-10">
        <h3 className="text-[17px] font-bold tracking-tight text-foreground transition-colors group-hover:text-primary leading-tight">
          {title}
        </h3>
        <p className="text-[13px] font-medium leading-[1.4] text-text-secondary line-clamp-2">
          {description}
        </p>
      </div>

      {/* 하단 메타 데이터 (ETA, 별점 등) */}
      <div className="mt-5 flex items-center justify-between border-t border-border pt-3 w-full relative z-10">
        <div className="flex items-center gap-1.5 min-w-0">
          <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
          <span className="text-[12px] font-bold text-foreground">
            {rating}
          </span>
          <span className="text-[11px] text-text-muted-val truncate ml-0.5">
            ({viewCount.toLocaleString()}+)
          </span>
        </div>
        {eta && (
          <div className="flex-shrink-0 rounded-md bg-bg-surface px-2 py-1 text-[11px] font-bold text-[#F2A65A]">
            {eta}
          </div>
        )}
      </div>
    </Link>
  );
});
