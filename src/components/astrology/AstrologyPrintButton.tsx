import React from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AstrologyPrintButtonProps {
  className?: string;
}

export const AstrologyPrintButton: React.FC<AstrologyPrintButtonProps> = ({ className }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button 
      onClick={handlePrint} 
      variant="outline"
      className={cn(
        "no-print h-12 rounded-2xl border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 font-bold",
        className
      )}
    >
      <Printer className="mr-2 h-4 w-4" />
      리포트 PDF 저장 / 인쇄하기
    </Button>
  );
};
