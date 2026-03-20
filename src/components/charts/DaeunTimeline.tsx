import React from 'react';
import { cn } from '@/lib/utils';
import { DaeunPeriod } from '@/types/result';

interface DaeunTimelineProps {
  data: DaeunPeriod[];
  height?: number;
  className?: string;
}

export function DaeunTimeline({
  data,
  height = 120, // 뷰포트 대비 아담한 높이 (모바일 최적화)
  className
}: DaeunTimelineProps) {
  // 모바일/웹 반응형을 위해 SVG는 width=100%, viewBox 를 사용하여 비율 유지
  const containerWidth = 600; // 가상 뷰박스 width
  const paddingX = 40;
  const availableWidth = containerWidth - paddingX * 2;
  const stepCount = Math.max(1, data.length - 1);
  const stepWidth = availableWidth / stepCount;
  
  const midY = height / 2;

  return (
    <div className={cn("w-full overflow-x-auto overflow-y-hidden pb-4", className)}>
      {/* 
        실제 기기 넓이를 넘어가면 스크롤되도록 minWidth 지정 
        data 개수에 따라 동적으로 전체 길이를 조절해 스와이프를 지원합니다.
      */}
      <div style={{ minWidth: data.length * 60 }}>
        <svg 
          width="100%" 
          height={height} 
          viewBox={`0 0 ${Math.max(containerWidth, data.length * 70)} ${height}`}
          preserveAspectRatio="xMinYMid meet"
          className="mx-auto"
        >
          {data.map((item, index) => {
            const x = paddingX + index * stepWidth;
            const isLast = index === data.length - 1;
            const isCurrent = item.isCurrent;

            return (
              <g key={`daeun-${item.startAge}-${index}`}>
                {/* 선 연결선 */}
                {!isLast && (
                  <line 
                    x1={x} 
                    y1={midY} 
                    x2={x + stepWidth} 
                    y2={midY} 
                    stroke={isCurrent ? "#6366F1" : "#E2E8F0"} 
                    strokeWidth={isCurrent ? 3 : 2}
                  />
                )}
                
                {/* 상단 키워드 (선택적) */}
                {item.keyword && (
                  <text
                    x={x}
                    y={midY - 45}
                    textAnchor="middle"
                    className="text-[11px] font-bold fill-indigo-600 tracking-wider"
                  >
                    {item.keyword}
                  </text>
                )}

                {/* 위쪽 텍스트 (나이) */}
                <text
                  x={x}
                  y={midY - 24}
                  textAnchor="middle"
                  className={cn(
                    "text-sm", 
                    isCurrent ? "font-bold fill-indigo-900" : "font-medium fill-slate-500"
                  )}
                >
                  {item.startAge}~{item.endAge}세
                </text>

                {/* 원형 노드 (현재 대운 강조) */}
                <circle
                  cx={x}
                  cy={midY}
                  r={isCurrent ? 14 : 8}
                  fill={isCurrent ? "#4F46E5" : "#FFFFFF"} // Primary Indigo
                  stroke={isCurrent ? "none" : "#CBD5E1"} // 비활성은 연회색 보더
                  strokeWidth={2}
                  className="transition-all duration-300 shadow-sm"
                />

                {/* 아래쪽 텍스트 (간지) */}
                <text
                  x={x}
                  y={midY + 32}
                  textAnchor="middle"
                  className={cn(
                    "text-lg tracking-widest", 
                    isCurrent ? "font-extrabold fill-indigo-700" : "font-semibold fill-slate-700"
                  )}
                >
                  {item.gan}{item.ji}
                </text>

                {/* 에너지 점수 (선택적 표시) */}
                {item.score !== undefined && (
                  <text
                    x={x}
                    y={midY + 52}
                    textAnchor="middle"
                    className="text-[12px] font-medium fill-slate-400"
                  >
                    {item.score}점
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
