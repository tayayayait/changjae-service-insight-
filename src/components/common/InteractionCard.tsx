import React from "react";
import { cn } from "@/lib/utils";

interface InteractionCardProps {
  step?: number;
  totalSteps?: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;     
}

export const InteractionCard = ({
  step,
  totalSteps,
  title,
  description,
  children,
  footer,
  className
}: InteractionCardProps) => {

  return (
    <div className={cn("space-y-6 analysis-card !p-8", className)}>
      {/* Header Section */}
      <div className="space-y-2 text-center">
        {step && totalSteps && (
          <div className="flex justify-center flex-col items-center">
             <span className="text-[12px] font-bold text-indigo-600 tracking-wider uppercase mb-2">
               Step {step} of {totalSteps}
             </span>
             {/* Progress Bar */}
             <div className="w-1/2 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div 
                   className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                   style={{ width: `${(step / totalSteps) * 100}%` }}
                />
             </div>
          </div>
        )}

        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-4">
          {title}
        </h2>
        
        {description && (
           <p className="text-[14px] text-text-secondary">
             {description}
           </p>
        )}
      </div>

      {/* Main interactive area (Form, Upload, etc) */}
      <div className="py-2">
         {children}
      </div>

      {/* Footer / CTA Actions */}
      {footer && (
         <div className="pt-2">
           {footer}
         </div>
      )}
    </div>
  );
};
