import React from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface AstrologyRadarChartProps {
  elements: {
    fire: number;
    earth: number;
    air: number;
    water: number;
  };
  className?: string;
}

export const AstrologyRadarChart: React.FC<AstrologyRadarChartProps> = ({ elements, className }) => {
  const data = [
    { subject: "불 (Fire)", value: elements.fire },
    { subject: "흙 (Earth)", value: elements.earth },
    { subject: "공기 (Air)", value: elements.air },
    { subject: "물 (Water)", value: elements.water },
  ];

  return (
    <div className={cn("w-full h-64 bg-white/10 backdrop-blur-md rounded-[32px] border border-white/20 p-4", className)}>
      <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-2 text-center">Element Dynamics</h4>
      <div className="w-full h-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#cbd5e1" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: "#475569", fontSize: 10, fontWeight: "bold" }}
            />
            <Radar
              name="Elements"
              dataKey="value"
              stroke="#0ea5e9"
              fill="#0ea5e9"
              fillOpacity={0.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
