import React from 'react';
import { cn } from '@/lib/utils';
import { Oheng } from '@/types/result';

export interface LegendItem {
  label: string;
  element: Oheng;
  value: string | number;
}

const UI_OHENG_COLORS: Record<Oheng, string> = {
  '목': '#3B82F6', 
  '화': '#EF4444', 
  '토': '#EAB308', 
  '금': '#94A3B8', 
  '수': '#1E293B', 
};

interface ChartLegendProps {
  items: LegendItem[];
  className?: string;
}

export function ChartLegend({ items, className }: ChartLegendProps) {
  return (
    <div className={cn("flex flex-wrap gap-4 items-center justify-center", className)}>
      {items.map((item, idx) => (
        <div key={`${item.element}-${idx}`} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: UI_OHENG_COLORS[item.element] }}
          />
          <span className="text-sm text-slate-600 font-medium">{item.label}</span>
          <span className="text-sm font-bold text-slate-900 ml-1">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
