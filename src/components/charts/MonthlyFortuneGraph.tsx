import React from 'react';
import { cn } from '@/lib/utils';

export interface MonthlyData {
  month: number;   // 1~12 (양력 기준이든 음력 기준이든)
  score: number;   // 0~100 (운세 점수)
}

interface MonthlyFortuneGraphProps {
  data: MonthlyData[];
  height?: number;
  className?: string;
  lineColor?: string; // e.g., #E91E63 (Primary Pink)
}

export function MonthlyFortuneGraph({
  data,
  height = 180,
  className,
  lineColor = "#E91E63" // 기본은 핑크색상 (척척사주 배지 색상 참조)
}: MonthlyFortuneGraphProps) {
  // 모바일 대응 뷰박스 크기 지정
  const viewBoxWidth = 500;
  const paddingX = 30;
  const paddingTop = 40; // 점수 텍스트를 그릴 여백
  const paddingBottom = 30; // 월 텍스트 여백
  
  const graphHeight = height - paddingTop - paddingBottom;
  const availableWidth = viewBoxWidth - paddingX * 2;
  const stepX = availableWidth / (Math.max(data.length - 1, 1));
  
  // y 좌표 스케일링 (0=최하단, 100=최상단)
  const getY = (score: number) => {
    return paddingTop + graphHeight - (score / 100) * graphHeight;
  };
  
  // 꺾은선 점(Points) 생성 
  const pointsString = data
    .map((d, i) => `${paddingX + i * stepX},${getY(d.score)}`)
    .join(' ');

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <svg 
        width="100%" 
        height={height} 
        viewBox={`0 0 ${viewBoxWidth} ${height}`} 
        className="mx-auto"
      >
        {/* 가이드 수평선 (그리드) */}
        {[0, 25, 50, 75, 100].map(val => (
          <line 
            key={`grid-${val}`}
            x1={paddingX} 
            y1={getY(val)} 
            x2={viewBoxWidth - paddingX} 
            y2={getY(val)}
            stroke="#F1F5F9"
            strokeWidth="1"
            strokeDasharray="4 4" 
          />
        ))}

        {/* 선 그래프 곡선(Polyline) */}
        <polyline
          fill="none"
          stroke={lineColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pointsString}
          className="transition-all duration-700 ease-in-out"
        />

        {/* 각 달의 데이터 노드(Circle) 및 점수 텍스트 */}
        {data.map((d, i) => {
          const cx = paddingX + i * stepX;
          const cy = getY(d.score);
          const isHighest = d.score === Math.max(...data.map(m => m.score));

          return (
            <g key={`month-${d.month}`}>
              <circle
                cx={cx}
                cy={cy}
                r={isHighest ? 6 : 4} // 제일 점수가 높은 달은 강조
                fill="#FFFFFF"
                stroke={lineColor}
                strokeWidth={isHighest ? 3 : 2}
              />
              <text
                x={cx}
                y={cy - 12} // 노드 위쪽
                textAnchor="middle"
                className={cn(
                  "text-xs font-bold",
                  isHighest ? "fill-pink-600" : "fill-slate-600"
                )}
              >
                {d.score}
              </text>
              <text
                x={cx}
                y={height - 10} // X축 라벨(월)
                textAnchor="middle"
                className="text-xs font-medium fill-slate-400"
              >
                {d.month}월
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
