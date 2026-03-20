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

export function PlanetAccordion({ planets }: PlanetAccordionProps) {
  return (
    <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-gray-100 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
        10행성 정밀 분석
      </h3>

      <Accordion type="single" collapsible className="w-full">
        {planets.map((planet, index) => (
          <AccordionItem key={planet.name} value={planet.name}>
            <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-4 rounded-xl transition-colors">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 shrink-0 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg border border-blue-100">
                  {planet.nameKo[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 text-base">{planet.nameKo}</h4>
                    {planet.retrograde && (
                      <Badge variant="secondary" className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0">역행</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 font-medium">
                    {planet.signKo} · {planet.house === 0 ? "하우스 불명" : `${planet.house}하우스`}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-2">
              <div className="bg-gray-50 rounded-2xl p-5 text-gray-700 leading-relaxed text-sm">
                <p className="whitespace-pre-wrap">{planet.interpretation}</p>
                
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-bold text-gray-400 mb-1">위치하는 자리</span>
                    <span className="font-medium">{planet.signKo} ({planet.element} / {planet.quality})</span>
                  </div>
                  {planet.house > 0 && (
                    <div>
                      <span className="block text-xs font-bold text-gray-400 mb-1">해당 하우스</span>
                      <span className="font-medium">{planet.house}번째 방</span>
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
