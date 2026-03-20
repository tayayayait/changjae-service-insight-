import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

interface BannerItem {
  id: number;
  image: string;
  tag: string;
  title: string;
  link: string;
  color: string;
}

const BANNER_ITEMS: BannerItem[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2694&auto=format&fit=crop",
    tag: "SPECIAL",
    title: "당신의 별자리가 말해주는 2026 하반기 행운의 아이템",
    link: "/service/astro-items",
    color: "from-purple-600/20 to-indigo-900/40"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1515940175183-6798529cc860?q=80&w=2629&auto=format&fit=crop",
    tag: "EVENT",
    title: "오늘 단 하루! 정밀 궁합 분석 50% 할인 혜택",
    link: "/event/love-sale",
    color: "from-rose-500/20 to-pink-900/40"
  }
];

export const FortuneBanner: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNER_ITEMS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full aspect-[21/9] md:aspect-[24/7] overflow-hidden rounded-[32px] bg-slate-100 group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {/* Background Image with Gradient Overlay */}
          <div className="absolute inset-0">
            <img 
              src={BANNER_ITEMS[currentIndex].image} 
              alt={BANNER_ITEMS[currentIndex].title}
              className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1]"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${BANNER_ITEMS[currentIndex].color}`} />
            <div className="absolute inset-0 bg-black/20" />
          </div>

          {/* Content */}
          <div className="relative h-full flex flex-col justify-center px-8 md:px-12">
            <span className="inline-block px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-[10px] font-black text-white mb-3 tracking-widest border border-white/30">
              {BANNER_ITEMS[currentIndex].tag}
            </span>
            <h3 className="text-lg md:text-2xl font-bold text-white max-w-md leading-tight mb-4 drop-shadow-md">
              {BANNER_ITEMS[currentIndex].title}
            </h3>
            <button className="flex items-center gap-2 text-white/80 hover:text-white text-xs font-bold transition-colors">
              더 알아보기 <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {BANNER_ITEMS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              idx === currentIndex ? "bg-white w-4" : "bg-white/40"
            }`}
          />
        ))}
      </div>

      {/* Arrows (Visible on hover) */}
      <button 
        onClick={() => setCurrentIndex((prev) => (prev - 1 + BANNER_ITEMS.length) % BANNER_ITEMS.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button 
        onClick={() => setCurrentIndex((prev) => (prev + 1) % BANNER_ITEMS.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};
