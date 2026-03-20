import { Link } from "react-router-dom";
import { 
  BarChart3, 
  Calendar, 
  Heart, 
  Coins, 
  Briefcase, 
  Activity, 
  Zap, 
  Users 
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const FORTUNE_ITEMS = [
  {
    title: "종합 사주 분석",
    icon: BarChart3,
    to: "/saju",
    state: { initialInterests: [] },
    bgClass: "bg-blue-50/50",
    iconBgClass: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    title: "올해 운세 (2026년)",
    icon: Calendar,
    to: "/saju",
    state: { initialInterests: ["path"] },
    bgClass: "bg-indigo-50/50",
    iconBgClass: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  {
    title: "연애/결혼운",
    icon: Heart,
    to: "/saju",
    state: { initialInterests: ["love"] },
    bgClass: "bg-pink-50/50",
    iconBgClass: "bg-pink-100",
    iconColor: "text-pink-600",
  },
  {
    title: "재물/사업운",
    icon: Coins,
    to: "/saju",
    state: { initialInterests: ["money", "business"] },
    bgClass: "bg-amber-50/50",
    iconBgClass: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    title: "직업/적성",
    icon: Briefcase,
    to: "/saju",
    state: { initialInterests: ["career", "path"] },
    bgClass: "bg-slate-50/50",
    iconBgClass: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  {
    title: "건강운",
    icon: Activity,
    to: "/saju",
    state: { initialInterests: ["health"] },
    bgClass: "bg-rose-50/50",
    iconBgClass: "bg-rose-100",
    iconColor: "text-rose-600",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function FortuneSpecialGrid() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1"
    >
      {FORTUNE_ITEMS.map((item) => (
        <motion.div key={item.title} variants={itemVariants}>
          <Link
            to={item.to}
            className={cn(
              "group relative flex flex-col items-center justify-center p-6 rounded-[28px] border border-gray-100 transition-all duration-300",
              "hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-200 active:scale-[0.97]",
              item.bgClass
            )}
          >
            <div className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full mb-4 shadow-sm transition-transform duration-300 group-hover:scale-110",
              item.iconBgClass,
              item.iconColor
            )}>
              <item.icon className="h-7 w-7" />
            </div>
            <span className="text-[14px] md:text-[15px] font-bold text-gray-800 tracking-tight text-center">
              {item.title}
            </span>
            
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10 bg-white/40 blur-xl" />
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
