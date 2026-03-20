import { AstrologyAspect } from "@/types/result";
import { Badge } from "@/components/ui/badge";
import { MoveRight } from "lucide-react";

interface AspectListProps {
  aspects: AstrologyAspect[];
}

export function AspectList({ aspects }: AspectListProps) {
  if (!aspects || aspects.length === 0) {
    return (
      <div className="bg-white rounded-[32px] p-6 border border-gray-100 text-center text-gray-500">
        주요 각도를 형성하는 행성이 없습니다.
      </div>
    );
  }

  // Sort by orb (tighter orb = stronger influence)
  const sortedAspects = [...aspects].sort((a, b) => a.orb - b.orb);

  return (
    <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
          행성 간의 상호작용 (Aspects)
        </h3>
        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          총 {aspects.length}개
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedAspects.map((aspect, idx) => {
          let styleClass = "bg-gray-50 border-gray-200 text-gray-900";
          let badgeClass = "bg-gray-200 text-gray-700";
          
          if (aspect.influence === "positive") {
            styleClass = "bg-green-50 border-green-100";
            badgeClass = "bg-green-200 text-green-800";
          } else if (aspect.influence === "negative") {
            styleClass = "bg-rose-50 border-rose-100";
            badgeClass = "bg-rose-200 text-rose-800";
          } else if (aspect.influence === "neutral") {
            styleClass = "bg-blue-50 border-blue-100";
            badgeClass = "bg-blue-200 text-blue-800";
          }

          return (
            <div key={`${aspect.planet1}-${aspect.planet2}-${idx}`} className={`p-4 rounded-2xl border ${styleClass}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="font-bold text-sm bg-white px-2 py-1 rounded shadow-sm">
                  {aspect.planet1Ko}
                </span>
                <MoveRight className="w-4 h-4 opacity-50" />
                <span className="font-bold text-sm bg-white px-2 py-1 rounded shadow-sm">
                  {aspect.planet2Ko}
                </span>
                <Badge variant="secondary" className={`${badgeClass} ml-auto text-xs`}>
                  {aspect.aspectTypeKo}
                </Badge>
              </div>
              <p className="text-xs leading-relaxed opacity-80 font-medium">
                {aspect.interpretation || "두 에너지의 만남이 작용합니다."}
              </p>
              <div className="mt-2 text-[10px] opacity-50 text-right">
                오차(Orb): {aspect.orb.toFixed(2)}°
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
