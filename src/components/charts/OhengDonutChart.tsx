import React from 'react';
import { Oheng, OhengDistribution } from '@/types/result';
import { cn } from '@/lib/utils';

interface OhengDonutChartProps {
  data: OhengDistribution[];
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const OHENG_COLORS: Record<Oheng, string> = {
  '목': '#2196F3', // 파랑 (대체로 목은 청색)
  '화': '#F44336', // 빨강
  '토': '#FFC107', // 노랑
  '금': '#FFFFFF', // 백색 (시각적 부각을 위해 약간의 그림자나 보더 필요, 여기선 임시 회백색)
  '수': '#000000', // 검정 
};

// UI 시각화를 위한 조정 색상 (배경이 흰색일 때 금/수를 명확히 보이기 위함)
const UI_OHENG_COLORS: Record<Oheng, string> = {
  '목': '#3B82F6', // Blue 500
  '화': '#EF4444', // Red 500
  '토': '#EAB308', // Yellow 500
  '금': '#94A3B8', // Slate 400 (흰색 대신 시각적 인지를 위한 회색)
  '수': '#1E293B', // Slate 800 (검정 대신 부드러운 짙은 회색)
};

export function OhengDonutChart({
  data,
  size = 220,
  strokeWidth = 20,
  className
}: OhengDonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  let cumulativePercent = 0;

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#E2E8F0" // Slate 200 (배경 트랙)
          strokeWidth={strokeWidth}
        />
        {data.map((item, index) => {
          if (item.percentage === 0) return null;
          
          const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
          const strokeDashoffset = -((cumulativePercent / 100) * circumference);
          
          cumulativePercent += item.percentage;

          return (
            <circle
              key={item.element}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={UI_OHENG_COLORS[item.element]}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
              strokeLinecap="round" // 끝부분 둥글게 처리 (필요에 따라 제거)
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-sm text-slate-500 font-medium">나의 오행</span>
        <span className="text-2xl font-bold text-slate-900 mt-1">균형</span>
      </div>
    </div>
  );
}
