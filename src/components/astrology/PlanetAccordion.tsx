import { AstrologyPlanet } from "@/types/result";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface PlanetAccordionProps {
  planets: AstrologyPlanet[];
}

const PLANET_MEANINGS: Record<string, string> = {
  "Sun": "나의 본질, 정체성과 삶의 목적",
  "Moon": "나의 내면, 무의식과 감정 패턴",
  "Mercury": "나의 생각, 의사소통과 학습 방식",
  "Venus": "나의 매력, 호감과 가치관",
  "Mars": "나의 에너지, 행동력과 투쟁 방식",
  "Jupiter": "나의 성장, 행운과 확장의 영역",
  "Saturn": "나의 시련, 책임감과 현실 구조",
  "Uranus": "나의 혁신, 변화와 독립성",
  "Neptune": "나의 이상, 직관과 상상력",
  "Pluto": "나의 본능, 깊은 극복과 재생"
};

const HOUSE_MEANINGS: Record<number, string> = {
  1: "자아와 첫인상",
  2: "가치관과 재물",
  3: "소통과 학습",
  4: "가정과 기반",
  5: "창조와 연애",
  6: "건강과 일상",
  7: "1:1 관계와 파트너십",
  8: "심화된 관계와 결합",
  9: "철학과 세계관 확장",
  10: "사회적 커리어와 성취",
  11: "공동체와 미래 희망",
  12: "무의식과 숨겨진 내면"
};

export function PlanetAccordion({ planets }: PlanetAccordionProps) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
      <h3 className="mb-6 flex items-center gap-2 text-lg font-black text-slate-900">
        <span className="h-6 w-1.5 rounded-full bg-blue-500"></span>
        10행성 정밀 분석
      </h3>

      <Accordion type="single" collapsible className="w-full">
        {planets.map((planet, index) => (
          <AccordionItem key={planet.name} value={planet.name} className="border-b-0 mb-2">
            <AccordionTrigger className="rounded-2xl px-4 py-3 hover:bg-gray-50/80 hover:no-underline transition-colors data-[state=open]:bg-gray-50/80">
              <div className="flex items-center gap-4 text-left">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-lg font-black text-blue-600">
                  {planet.nameKo[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-gray-900">{planet.nameKo}</h4>
                    {planet.retrograde && (
                      <Badge variant="secondary" className="bg-rose-100 px-1.5 py-0 text-[10px] text-rose-700">역행</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs font-semibold tracking-tight text-gray-500">
                    {PLANET_MEANINGS[planet.name] || ""}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-1">
              <div className="rounded-2xl bg-gray-50 p-5 text-sm leading-relaxed text-gray-700">
                <p className="whitespace-pre-wrap font-medium">{planet.interpretation}</p>

                <div className="mt-5 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="mb-1 block text-xs font-bold text-gray-400">위치하는 별자리 (에너지 스타일)</span>
                    <span className="font-black text-slate-800">{planet.signKo}</span>
                    <span className="ml-1 text-[10px] font-bold text-gray-400">({planet.element} / {planet.quality})</span>
                  </div>
                  {planet.house > 0 && (
                    <div>
                      <span className="mb-1 block text-xs font-bold text-gray-400">해당 하우스 (작동하는 삶의 영역)</span>
                      <span className="font-black text-slate-800">{planet.house}번째 방</span>
                      <span className="ml-1.5 text-xs font-bold text-blue-600">({HOUSE_MEANINGS[planet.house]})</span>
                    </div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
