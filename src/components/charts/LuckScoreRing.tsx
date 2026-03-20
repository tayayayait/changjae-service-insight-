import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LuckScoreRingProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string; // 지정 안하면 점수에 따라 자동 변경
  className?: string;
}

export function LuckScoreRing({
  score,
  size = 144,
  strokeWidth = 12,
  color,
  className
}: LuckScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // 애니메이션 효과를 위해 타임아웃 줌
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // 점수에 따른 기본 색상 (color prop이 없을 경우)
  let ringColor = '#10B981'; // 기본: 에메랄드 그린 (좋음)
  if (!color) {
    if (score < 40) ringColor = '#EF4444'; // 빨강 (나쁨)
    else if (score < 70) ringColor = '#F59E0B'; // 주황 (보통)
  } else {
    ringColor = color;
  }

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      {/* 배경 트랙 */}
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#F1F5F9" // Slate 100
          strokeWidth={strokeWidth}
        />
        {/* 점수 링 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* 중앙 점수 텍스트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-slate-800" style={{ color: ringColor }}>
          {animatedScore}
        </span>
        <span className="text-xs font-semibold text-slate-400 mt-0.5">점</span>
      </div>
    </div>
  );
}
