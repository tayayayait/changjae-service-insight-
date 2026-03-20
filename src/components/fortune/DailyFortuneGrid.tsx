import { motion } from "framer-motion";
import { 
  Zap, 
  Heart, 
  Coins, 
  Briefcase, 
  GraduationCap, 
  Activity 
} from "lucide-react";
import { cn } from "@/lib/utils";

export const DAILY_CATEGORIES = [
  {
    id: "total",
    title: "인생 마스터플랜",
    subtitle: "총운",
    icon: Zap,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-100",
    description: "오늘 하루 전체의 흐름을 조망하고 핵심 전략을 수립합니다."
  },
  {
    id: "love",
    title: "운명의 짝 & 인연",
    subtitle: "애정운",
    icon: Heart,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-100",
    description: "관계의 미묘한 흐름과 인연의 기운을 분석해 드립니다."
  },
  {
    id: "wealth",
    title: "부의 시그널",
    subtitle: "금전운",
    icon: Coins,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-100",
    description: "자산 관리와 기회를 포착하는 오늘의 경제 지표입니다."
  },
  {
    id: "career",
    title: "커리어 점프업",
    subtitle: "직장운",
    icon: Briefcase,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
    description: "업무 효율과 성장을 돕는 오늘의 비즈니스 가이드입니다."
  },
  {
    id: "study",
    title: "지혜와 성취",
    subtitle: "학업·성적운",
    icon: GraduationCap,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-100",
    description: "집중력과 목표 달성을 돕는 오늘의 학습 멘토입니다."
  },
  {
    id: "health",
    title: "에너지 밸런스",
    subtitle: "건강운",
    icon: Activity,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-100",
    description: "신체 리듬과 최상의 컨디션 유지를 위한 조언입니다."
  }
];

interface DailyFortuneGridProps {
  onCategorySelect?: (categoryId: string) => void;
  activeCategoryId?: string;
}

export function DailyFortuneGrid({ onCategorySelect, activeCategoryId }: DailyFortuneGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {DAILY_CATEGORIES.map((category) => {
        const Icon = category.icon;
        const isActive = activeCategoryId === category.id;

        return (
          <motion.button
            key={category.id}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCategorySelect?.(category.id)}
            className={cn(
              "relative flex flex-col items-start p-5 rounded-[24px] border transition-all duration-300 text-left overflow-hidden group",
              isActive 
                ? "bg-white border-indigo-200 shadow-md ring-1 ring-indigo-100" 
                : "bg-white border-gray-100 hover:border-indigo-100 hover:shadow-sm"
            )}
          >
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl mb-4 transition-transform group-hover:scale-110",
              category.bgColor,
              category.color
            )}>
              <Icon className="h-6 w-6" />
            </div>
            
            <div className="space-y-1">
              <span className={cn(
                "text-[12px] font-bold uppercase tracking-wider",
                category.color
              )}>
                {category.subtitle}
              </span>
              <h4 className="text-[16px] font-black text-gray-900 tracking-tight">
                {category.title}
              </h4>
            </div>
            
            <p className="mt-3 text-[13px] leading-relaxed text-gray-500 font-medium line-clamp-2">
              {category.description}
            </p>

            {isActive && (
              <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-indigo-500" />
            )}
            
            {/* Background enhancement */}
            <div className={cn(
              "absolute -bottom-12 -right-12 h-24 w-24 rounded-full opacity-10 blur-2xl",
              category.bgColor
            )} />
          </motion.button>
        );
      })}
    </div>
  );
}
