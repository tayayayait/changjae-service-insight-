import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportDataSourceAlertProps {
    dataSource?: "real" | "mock";
    className?: string;
}

export function ReportDataSourceAlert({ dataSource = "real", className }: ReportDataSourceAlertProps) {
    const isMock = dataSource === "mock";

    if (!isMock) {
        return (
            <div className={cn("flex items-center gap-2 rounded-full border border-emerald-200/50 bg-emerald-50/50 px-3 py-1.5 w-fit", className)}>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-[12px] font-medium text-emerald-700">실제 생년월일시 기반 분석 데이터</span>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex items-start gap-3 rounded-xl border p-4 shadow-sm border-amber-200 bg-amber-50",
                className
            )}
        >
            <div className="mt-0.5 shrink-0 text-amber-500">
                <AlertCircle className="h-5 w-5" />
            </div>
            <div>
                <h4 className="text-[14px] font-bold text-amber-900">
                    목업(샘플) 데이터 안내
                </h4>
                <p className="mt-1 text-[13px] leading-relaxed text-amber-800">
                    본 리포트는 테스트 및 예시를 위해 제공된 목업(샘플) 데이터입니다. 실제 사주 분석 결과가 아닙니다.
                </p>
            </div>
        </div>
    );
}
