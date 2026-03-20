import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorCard({ title = "오류가 발생했습니다", message, onRetry }: ErrorCardProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5" />
        <div className="flex-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
          {onRetry ? (
            <Button variant="outline" onClick={onRetry} className="mt-4 border-red-300 text-red-800">
              다시 시도
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
