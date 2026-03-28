import { AstrologyAspect } from "@/types/result";
import { Badge } from "@/components/ui/badge";
import { MoveRight } from "lucide-react";

interface AspectListProps {
  aspects: AstrologyAspect[];
}

function getAspectKeyword(type: string) {
  switch (type) {
    case 'Conjunction': return '강력한 결합 에너지';
    case 'Sextile': return '발전적인 기회 / 시너지';
    case 'Square': return '극복해야 할 도전 과제';
    case 'Trine': return '타고난 재능 / 순조로움';
    case 'Opposition': return '서로 다른 힘의 팽팽한 균형';
    default: return type;
  }
}

export function AspectList({ aspects }: AspectListProps) {
  if (!aspects || aspects.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white p-6 text-center text-gray-500 shadow-sm md:p-8">
        주요 각도를 형성하는 행성이 없습니다.
      </div>
    );
  }

  // Sort by orb (tighter orb = stronger influence)
  const sortedAspects = [...aspects].sort((a, b) => a.orb - b.orb);

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-black text-slate-900">
          <span className="h-6 w-1.5 rounded-full bg-purple-500"></span>
          행성 간의 상호작용 (Aspects)
        </h3>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
          총 {aspects.length}개
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sortedAspects.map((aspect, idx) => {
          let styleClass = "bg-gray-50 border-gray-100 text-gray-900";
          let badgeClass = "bg-gray-200 text-gray-700";

          if (aspect.influence === "positive") {
            styleClass = "bg-green-50/70 border-green-100 hover:border-green-200";
            badgeClass = "bg-green-200 text-green-900";
          } else if (aspect.influence === "negative") {
            styleClass = "bg-rose-50/70 border-rose-100 hover:border-rose-200";
            badgeClass = "bg-rose-200 text-rose-900";
          } else if (aspect.influence === "neutral") {
            styleClass = "bg-blue-50/70 border-blue-100 hover:border-blue-200";
            badgeClass = "bg-blue-200 text-blue-900";
          }

          return (
            <div key={`${aspect.planet1}-${aspect.planet2}-${idx}`} className={`rounded-2xl border p-4 transition-all hover:-translate-y-0.5 ${styleClass}`}>
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded bg-white px-2 py-1 text-sm font-black shadow-sm shrink-0">
                  {aspect.planet1Ko}
                </span>
                <MoveRight className="h-4 w-4 shrink-0 opacity-40 text-slate-600" />
                <span className="rounded bg-white px-2 py-1 text-sm font-black shadow-sm shrink-0">
                  {aspect.planet2Ko}
                </span>
                <Badge variant="secondary" className={`${badgeClass} ml-auto text-[10px] font-black`}>
                  {aspect.aspectTypeKo}
                </Badge>
              </div>
              <p className="text-xs font-bold tracking-tight text-slate-700 opacity-90 mb-1.5">
                {getAspectKeyword(aspect.aspectType)}
              </p>
              <p className="text-xs font-medium leading-relaxed opacity-80">
                {aspect.interpretation || "두 에너지의 만남이 작용합니다."}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
