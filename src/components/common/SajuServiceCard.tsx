import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { memo, type ComponentType } from "react";

const HIDDEN_BADGES = new Set(["정통", "핵심", "실행", "확장"]);

export interface SajuServiceCardProps {
  title: string;
  description: string;
  to: string;
  badge?: string;
  icon: ComponentType<{ className?: string }>;
  accentClassName?: string;
  imageUrl?: string;
  onClick?: () => void;
}

export const SajuServiceCard = memo(function SajuServiceCard({
  title,
  description,
  to,
  badge,
  icon: Icon,
  accentClassName = "",
  imageUrl,
  onClick,
}: SajuServiceCardProps) {
  const hasImage = !!imageUrl;
  const shouldShowBadge = Boolean(badge && !HIDDEN_BADGES.has(badge));

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden",
        "border border-border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        "h-full rounded-2xl",
        hasImage ? "min-h-[200px]" : "bg-white hover:bg-bg-subtle p-6",
        accentClassName
      )}
    >
      {/* 배경 이미지 레이어 */}
      {hasImage && (
        <div className="absolute inset-0 z-0">
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* 하단 그라데이션 오버레이 — 텍스트 가독성 확보 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
      )}

      {/* 콘텐츠 영역 */}
      <div className={cn(
        "relative z-10 flex flex-1 flex-col justify-between",
        hasImage && "p-5"
      )}>
        {/* 아이콘 및 뱃지 헤더 */}
        <div className="mb-4 flex items-start justify-end">
          {shouldShowBadge && (
            <span className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ring-1 ring-inset",
              hasImage
                ? "bg-white/90 text-slate-700 ring-white/20 backdrop-blur-sm"
                : badge === "BEST" || badge === "PREMIUM" || badge === "베스트" || badge === "프리미엄"
                  ? "bg-[#24303F] text-white ring-white/10"
                  : "bg-[#FFF8EE] text-[#F2A65A] ring-orange-100/50"
            )}>
              {badge}
            </span>
          )}
        </div>

        {/* 타이틀 & 설명 */}
        <div className="flex-1 space-y-1 break-keep">
          <h3 className={cn(
            "text-[17px] font-bold tracking-tight leading-tight transition-colors",
            hasImage
              ? "text-white drop-shadow-sm"
              : "text-foreground group-hover:text-primary"
          )}>
            {title}
          </h3>
          <p className={cn(
            "text-[13px] font-medium leading-[1.4] line-clamp-2",
            hasImage
              ? "text-white/85 drop-shadow-sm"
              : "text-text-secondary"
          )}>
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
});
