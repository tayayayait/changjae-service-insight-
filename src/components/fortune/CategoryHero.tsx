import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CategoryHeroWidget } from "./CategoryHeroWidget";

interface BannerConfig {
  label: string;
  title: string;
  description: string;
}

interface CategoryHeroProps {
  bannerConfig: BannerConfig;
  themeColor: string;
  widgetType: string;
}

export const CategoryHero: React.FC<CategoryHeroProps> = ({ bannerConfig, themeColor, widgetType }) => {
  return (
    <div className="px-4 py-6 md:px-0">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "relative overflow-hidden rounded-[32px] p-8 md:p-12 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-8",
          // 테마 컬러에 따른 그라데이션 적용 로직
          themeColor === "accent-lavender" && "bg-gradient-to-br from-[#CBB7F6] to-[#A88DF0]",
          themeColor === "accent-sky" && "bg-gradient-to-br from-[#AFCFFF] to-[#80AFFF]",
          themeColor === "accent-mint" && "bg-gradient-to-br from-[#AEE7D8] to-[#7ED7C1]",
          themeColor === "accent-pink" && "bg-gradient-to-br from-[#F3B6C7] to-[#EC94AD]",
          !["accent-lavender", "accent-sky", "accent-mint", "accent-pink"].includes(themeColor) && "bg-slate-800"
        )}
      >
        {/* 장식용 패턴 */}
        <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-xl text-center md:text-left">
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[12px] font-bold mb-4 tracking-wider"
          >
            {bannerConfig.label}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl md:text-4xl font-black mb-4 leading-tight"
          >
            {bannerConfig.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/90 text-sm md:text-lg font-medium leading-relaxed"
          >
            {bannerConfig.description}
          </motion.p>
        </div>

        {/* Dynamic Widget 영역 */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 shrink-0"
        >
          <CategoryHeroWidget type={widgetType} />
        </motion.div>

        {/* 장식용 배경 오브젝트 */}
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/3 -translate-y-1/3 pointer-events-none">
          <div className="w-96 h-96 border-[32px] border-white rounded-full flex items-center justify-center">
            <div className="w-64 h-64 border-[16px] border-white/50 rounded-full" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
