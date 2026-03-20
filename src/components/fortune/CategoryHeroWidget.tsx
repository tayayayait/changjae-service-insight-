import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Heart, Sparkles } from "lucide-react";

interface CategoryHeroWidgetProps {
  type: string;
}

export const CategoryHeroWidget: React.FC<CategoryHeroWidgetProps> = ({ type }) => {
  switch (type) {
    case "score":
      return <ScoreGauge score={88} label="오늘의 운세 총점" />;
    case "moon":
      return <MoonPhase phase={0.65} label="달의 위상 (상현~보름)" />;
    case "scanner":
      return <ScannerWidget label="AI 손금 분석 대기 중" />;
    case "match":
      return <MatchWidget score={92} label="미래 인연 매칭 지수" />;
    default:
      return null;
  }
};

const ScoreGauge = ({ score, label }: { score: number; label: string }) => (
  <div className="flex flex-col items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
    <div className="relative w-24 h-24 mb-3">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="transparent" />
        <motion.circle
          cx="48"
          cy="48"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray="251.2"
          initial={{ strokeDashoffset: 251.2 }}
          animate={{ strokeDashoffset: 251.2 - (251.2 * score) / 100 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-white"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-black">{score}</span>
      </div>
    </div>
    <span className="text-[11px] font-bold opacity-80 uppercase tracking-tighter">{label}</span>
  </div>
);

const MoonPhase = ({ phase, label }: { phase: number; label: string }) => (
  <div className="flex flex-col items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
    <div className="relative w-16 h-16 mb-3 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 opacity-20"
      >
        <Sparkles className="w-full h-full" />
      </motion.div>
      <div className="relative z-10 w-12 h-12 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)] overflow-hidden">
        <div
          className="absolute inset-0 bg-slate-900"
          style={{
            clipPath: `inset(0 ${100 - phase * 100}% 0 0)`,
            borderRadius: "50%",
          }}
        />
      </div>
    </div>
    <span className="text-[10px] font-bold opacity-80 text-center leading-tight whitespace-pre-wrap">{label}</span>
  </div>
);

const ScannerWidget = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden relative">
    <motion.div
      animate={{ y: [0, 40, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-4 left-4 right-4 h-0.5 bg-green-400 shadow-[0_0_10px_#4ade80]"
    />
    <ShieldCheck className="w-12 h-12 mb-2 opacity-40" />
    <span className="text-[10px] font-bold opacity-80 text-center leading-tight">{label}</span>
  </div>
);

const MatchWidget = ({ score, label }: { score: number; label: string }) => (
  <div className="flex flex-col items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
    <div className="flex items-center gap-1 mb-2">
      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
        <Heart className="w-8 h-8 fill-white text-white" />
      </motion.div>
      <span className="text-xl font-black">{score}%</span>
    </div>
    <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1, delay: 0.5 }}
        className="h-full bg-white"
      />
    </div>
    <span className="text-[10px] font-bold opacity-80 mt-2 uppercase">{label}</span>
  </div>
);
