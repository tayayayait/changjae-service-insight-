import { AstrologyPlanet } from "@/types/result";
import { MoonStar, Sun, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Big3SummaryProps {
  big3: {
    sun: AstrologyPlanet;
    moon: AstrologyPlanet;
    rising: {
      sign: string;
      signKo: string;
      element: string;
      quality: string;
      degree: number;
      interpretation: string;
    };
  };
}

export function Big3Summary({ big3 }: Big3SummaryProps) {
  // Helpers
  const renderCard = (
    title: string,
    icon: React.ReactNode,
    data: any,
    colorClass: string,
    subText: string
  ) => (
    <div className={cn("p-5 rounded-3xl flex flex-col gap-3", colorClass)}>
      <div className="flex items-center gap-2 text-gray-800 font-semibold">
        {icon}
        <span>{title}</span>
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">{data.signKo}</h3>
        <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-white/60 text-gray-700">
          {data.element} · {data.quality}
        </span>
      </div>
      <p className="text-sm text-gray-700 mt-2 leading-relaxed">
        {data.interpretation}
      </p>
      <div className="mt-auto text-xs text-gray-500 font-medium pt-2 border-t border-black/5">
        {subText}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {renderCard(
        "태양 (Sun)",
        <Sun className="w-5 h-5 text-amber-500" />,
        big3.sun,
        "bg-amber-50/80 border border-amber-100",
        "자아 정체성과 삶의 목적"
      )}
      {renderCard(
        "달 (Moon)",
        <MoonStar className="w-5 h-5 text-indigo-500" />,
        big3.moon,
        "bg-indigo-50/80 border border-indigo-100",
        "내면의 감정과 무의식"
      )}
      {renderCard(
        "상승점 (Rising)",
        <ArrowUpCircle className="w-5 h-5 text-sky-500" />,
        big3.rising,
        "bg-sky-50/80 border border-sky-100",
        "타인에게 보이는 첫인상"
      )}
    </div>
  );
}
