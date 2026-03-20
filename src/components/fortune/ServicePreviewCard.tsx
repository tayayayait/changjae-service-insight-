import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import React from "react";

export interface PreviewFeature {
  title: string;
  description: string;
}

interface ServicePreviewCardProps {
  title?: string;
  features: PreviewFeature[];
  className?: string;
}

export function ServicePreviewCard({ title = "포함된 분석 내용", features, className }: ServicePreviewCardProps) {
  return (
    <div className={cn("bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm", className)}>
      <h3 className="text-[16px] font-black text-gray-900 mb-5">{title}</h3>
      <div className="space-y-4">
        {features.map((feature, idx) => (
          <div key={idx} className="flex gap-4 group">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-500 flex flex-col items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex flex-col">
              <h4 className="text-[14px] font-bold text-gray-900 tracking-tight leading-tight mb-1">{feature.title}</h4>
              <p className="text-[13px] text-gray-500 leading-relaxed font-medium">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
