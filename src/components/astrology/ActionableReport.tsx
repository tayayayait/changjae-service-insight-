import { memo } from "react";
import { AspectList } from "@/components/astrology/AspectList";
import { Big3Summary } from "@/components/astrology/Big3Summary";
import { ElementChart } from "@/components/astrology/ElementChart";
import { PlanetAccordion } from "@/components/astrology/PlanetAccordion";
import { QualityChart } from "@/components/astrology/QualityChart";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AstrologyBirthReportResult } from "@/types/result";

interface DetailAccordionProps {
  report: AstrologyBirthReportResult;
}

export const DetailAccordion = memo(({ report }: DetailAccordionProps) => {
  return (
    <section data-testid="detail-accordion" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <Accordion type="single" collapsible>
        <AccordionItem value="detail-data" data-testid="detail-accordion-item">
          <AccordionTrigger data-testid="detail-accordion-trigger" className="text-left text-sm font-bold text-slate-900">
            9) 상세 천문 데이터 (부록)
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
            {report.deepData.chartSvg ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div
                  dangerouslySetInnerHTML={{ __html: report.deepData.chartSvg }}
                  className="mx-auto aspect-square w-full max-w-lg [&>svg]:h-full [&>svg]:w-full"
                />
              </div>
            ) : null}

            <Big3Summary big3={report.deepData.big3} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ElementChart data={report.deepData.elementDistribution} />
              <QualityChart data={report.deepData.qualityDistribution} />
            </div>
            <AspectList aspects={report.deepData.aspects} />
            <PlanetAccordion planets={report.deepData.planets} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
});
