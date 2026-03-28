import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";

interface CompatibilityGaugeProps {
  score: number;
  label?: string;
  className?: string;
}

export const CompatibilityGauge: React.FC<CompatibilityGaugeProps> = ({ 
  score, 
  label = "궁합 점수",
  className 
}) => {
  const data = [
    { value: score },
    { value: 100 - score },
  ];

  const getColor = (s: number) => {
    if (s >= 90) return "#f43f5e"; // rose-500
    if (s >= 70) return "#fb7185"; // rose-400
    if (s >= 50) return "#fda4af"; // rose-300
    return "#FECDD3"; // rose-200
  };

  return (
    <div className={cn("w-full bg-white dark:bg-stone-900 rounded-[32px] p-8 border border-rose-100 dark:border-rose-900/30 shadow-sm relative overflow-hidden", className)}>
      <div className="absolute top-0 right-0 p-6 opacity-10">
        <Heart className="w-24 h-24 text-rose-500 fill-rose-500" />
      </div>
      
      <div className="flex flex-col items-center">
        <h4 className="text-sm font-black text-rose-500 uppercase tracking-widest mb-6">{label}</h4>
        
        <div className="relative w-64 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="100%"
                startAngle={180}
                endAngle={0}
                innerRadius={80}
                outerRadius={120}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={getColor(score)} />
                <Cell fill="#f1f5f9" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pb-2">
            <span className="text-5xl font-black text-stone-900 dark:text-stone-100 tracking-tighter">{score}%</span>
            <span className="text-[11px] font-bold text-stone-400 uppercase mt-1">Match Rate</span>
          </div>
        </div>

        <div className="mt-8 flex gap-2">
          {[20, 40, 60, 80, 100].map((val) => (
            <div 
              key={val} 
              className={cn(
                "w-8 h-1.5 rounded-full transition-colors",
                score >= val ? "bg-rose-400" : "bg-stone-100 dark:bg-stone-800"
              )} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};
