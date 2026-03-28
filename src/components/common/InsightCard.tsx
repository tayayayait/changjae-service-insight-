import React from "react";
import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";

interface InsightCardProps {
  label?: string;
  title?: string | React.ReactNode;
  content: string | React.ReactNode;
  expandable?: boolean;
  expandedTitle?: string;
  expandedContent?: string | React.ReactNode;
  variant?: "default" | "highlight" | "warning" | "info";
  icon?: React.ReactNode;
  className?: string;     // Additional base classes
  footer?: React.ReactNode; // 추가적인 섹션 (하단 액션 등)
}

export const InsightCard = ({
  label,
  title,
  content,
  expandable = false,
  expandedTitle = "자세히 보기",
  expandedContent,
  variant = "default",
  icon,
  className,
  footer
}: InsightCardProps) => {
  const getCardStyle = () => {
    switch (variant) {
      case "highlight": return "analysis-card-highlight";
      case "warning": return "analysis-card-warning";
      case "default":
      case "info":
      default:
        return "analysis-card";
    }
  };

  return (
    <div className={cn("space-y-3", getCardStyle(), className)}>
      {(label || title || icon) && (
        <div className="flex items-start gap-3">
          {icon && (
            <div className="mt-1 flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="space-y-1">
            {label && <p className="analysis-header">{label}</p>}
            {title && <h3 className="analysis-title">{title}</h3>}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="analysis-body">
        {typeof content === "string" ? <p className="whitespace-pre-wrap">{content}</p> : content}
      </div>

      {/* Expandable Section */}
      {expandable && expandedContent && (
        <details className="mt-4 rounded-md border border-border bg-bg-subtle p-3 group">
          <summary className="cursor-pointer text-[13px] font-semibold text-foreground group-open:mb-3">
            {expandedTitle}
          </summary>
          <div className="text-[14px] leading-6 text-foreground space-y-3 whitespace-pre-wrap">
            {expandedContent}
          </div>
        </details>
      )}

      {/* Footer Area */}
      {footer && (
        <div className="mt-4 pt-4 border-t border-border/50">
          {footer}
        </div>
      )}
    </div>
  );
};
