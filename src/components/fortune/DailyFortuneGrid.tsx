import { useConsultStore } from "@/store/useConsultStore";
import { cn } from "@/lib/utils";
import { FortuneCategoryId } from "@/types/result";
import { Activity, BookOpen, Compass, Gem, Heart, Sparkles, type LucideIcon } from "lucide-react";

interface DailyCategory {
  id: FortuneCategoryId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  imageUrl?: string;
}

export const DAILY_CATEGORIES: DailyCategory[] = [
  {
    id: "total",
    title: "인생 마스터플랜",
    subtitle: "총운",
    icon: Sparkles,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-100",
    description: "오늘 하루 전체의 흐름을 조망하고 핵심 전략을 수립합니다.",
    imageUrl: "/images/cards/daily-total.png",
  },
  {
    id: "love",
    title: "운명의 짝 & 인연",
    subtitle: "애정운",
    icon: Heart,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-100",
    description: "관계의 미묘한 흐름과 인연의 기운을 분석해 드립니다.",
    imageUrl: "/images/cards/daily-love.png",
  },
  {
    id: "wealth",
    title: "부의 시그널",
    subtitle: "금전운",
    icon: Gem,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-100",
    description: "자산 관리와 기회를 포착하는 오늘의 경제 지표입니다.",
    imageUrl: "/images/cards/daily-wealth.png",
  },
  {
    id: "career",
    title: "커리어 점프업",
    subtitle: "직장운",
    icon: Compass,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
    description: "업무 효율과 성장을 돕는 오늘의 비즈니스 가이드입니다.",
    imageUrl: "/images/cards/daily-career.png",
  },
  {
    id: "study",
    title: "지혜와 성취",
    subtitle: "학업·성적운",
    icon: BookOpen,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-100",
    description: "집중력과 목표 달성을 돕는 오늘의 학습 멘토입니다.",
    imageUrl: "/images/cards/daily-study.png",
  },
  {
    id: "health",
    title: "에너지 밸런스",
    subtitle: "건강운",
    icon: Activity,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-100",
    description: "신체 리듬과 최상의 컨디션 유지를 위한 조언입니다.",
    imageUrl: "/images/cards/daily-health.png",
  }
];

interface DailyFortuneGridProps {
  onCategorySelect?: (categoryId: FortuneCategoryId) => void;
  activeCategoryId?: FortuneCategoryId;
}
export function DailyFortuneGrid({
  onCategorySelect,
  activeCategoryId,
}: DailyFortuneGridProps) {
  const setService = useConsultStore((state) => state.setService);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {DAILY_CATEGORIES.map((category) => {
        const isActive = activeCategoryId === category.id;
        const hasImage = !!category.imageUrl;

        return (
          <button
            key={category.id}
            onClick={() => {
              setService("saju", "traditional-saju");
              onCategorySelect?.(category.id);
            }}
            className={cn(
              "group relative flex flex-col items-start overflow-hidden rounded-[24px] border text-left transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]",
              hasImage ? "min-h-[180px]" : "p-5",
              isActive 
                ? "border-indigo-200 shadow-md ring-1 ring-indigo-100" 
                : "border-gray-100 hover:border-indigo-100 hover:shadow-sm",
              !hasImage && "bg-white"
            )}
          >
            {/* 배경 이미지 레이어 */}
            {hasImage && (
              <div className="absolute inset-0 z-0">
                <img
                  src={category.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
              </div>
            )}

            {/* 콘텐츠 */}
            <div className={cn("relative z-10 flex flex-col items-start w-full", hasImage && "p-5 flex-1 justify-end")}>

              
              <div className="space-y-1">
                <span className={cn(
                  "text-[12px] font-bold uppercase tracking-wider",
                  hasImage ? "text-white/80 drop-shadow-sm" : category.color
                )}>
                  {category.subtitle}
                </span>
                <h4 className={cn(
                  "text-[16px] font-black tracking-tight",
                  hasImage ? "text-white drop-shadow-sm" : "text-gray-900"
                )}>
                  {category.title}
                </h4>
              </div>
              
              <p className={cn(
                "mt-3 text-[13px] leading-relaxed font-medium line-clamp-2",
                hasImage ? "text-white/80 drop-shadow-sm" : "text-gray-500"
              )}>
                {category.description}
              </p>
            </div>

            {isActive && (
              <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-indigo-500 z-10" />
            )}

            {/* Background enhancement (비이미지 폴백) */}
            {!hasImage && (
              <div className={cn(
                "absolute -bottom-12 -right-12 h-24 w-24 rounded-full opacity-10 blur-2xl",
                category.bgColor
              )} />
            )}
          </button>
        );
      })}
    </div>
  );
}
