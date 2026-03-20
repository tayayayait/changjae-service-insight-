import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { AnalysisPageShell } from "@/components/layout/AnalysisPageShell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { getAstrologyAICalendar } from "@/lib/astrologyClient";
import { AstrologyCalendarEvent, AstrologyCalendarResult } from "@/types/result";

const impactBadgeClassMap: Record<AstrologyCalendarEvent["impact"], string> = {
  high: "bg-rose-100 text-rose-800 border-rose-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-slate-100 text-slate-700 border-slate-200",
};

const impactLabelMap: Record<AstrologyCalendarEvent["impact"], string> = {
  high: "강도 높음",
  medium: "중간 강도",
  low: "완만",
};

const formatMonthHeading = (year: number, month: number) => `${year}년 ${month}월 코스믹 캘린더`;

const sectionMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function CosmicCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<AstrologyCalendarResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCalendar = async (year: number, month: number) => {
    try {
      setIsLoading(true);
      const result = await getAstrologyAICalendar(year, month);
      setCalendarData(result);
    } catch (error) {
      toast({
        title: "캘린더 생성 실패",
        description: error instanceof Error ? error.message : "코스믹 캘린더를 불러오지 못했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  return (
    <AnalysisPageShell
      title="코스믹 캘린더"
      subtitle="핵심 요약 -> 핵심 구간 -> 날짜 이벤트 -> 행동 체크리스트 순서로 읽는 월간 리포트"
    >
      <div className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
          <Button onClick={handlePrevMonth} variant="outline" className="h-10 w-10 rounded-full p-0" aria-label="이전 달">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 md:text-2xl">
            <CalendarIcon className="h-5 w-5 text-blue-600 md:h-6 md:w-6" />
            {formatMonthHeading(year, month)}
          </h2>
          <Button onClick={handleNextMonth} variant="outline" className="h-10 w-10 rounded-full p-0" aria-label="다음 달">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.section key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="rounded-2xl border-slate-200">
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-600" />
                  <p className="text-sm font-semibold text-slate-600">월간 흐름을 계산하고 있습니다.</p>
                </CardContent>
              </Card>
            </motion.section>
          ) : null}

          {!isLoading && calendarData ? (
            <motion.section key="content" {...sectionMotion} transition={{ duration: 0.2 }} className="space-y-6">
              <Card className="overflow-hidden rounded-2xl border-slate-200">
                <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 px-6 py-5 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">Monthly Summary</p>
                  <h3 className="mt-2 text-xl font-black leading-tight md:text-2xl">{calendarData.summary.headline}</h3>
                  <p className="mt-3 text-sm text-blue-50">{calendarData.summary.focus}</p>
                  <p className="mt-2 text-sm text-blue-100/90">주의: {calendarData.summary.caution}</p>
                </div>
              </Card>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {calendarData.highlights.map((highlight) => (
                  <Card key={highlight.title} className="rounded-2xl border-slate-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-bold text-slate-900">{highlight.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-3xl font-black text-slate-900">{highlight.score}</p>
                      <p className="text-sm leading-relaxed text-slate-600">{highlight.note}</p>
                    </CardContent>
                  </Card>
                ))}
              </section>

              <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <Card className="rounded-2xl border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-black text-slate-900">날짜별 이벤트</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {calendarData.events.map((event) => (
                      <div key={`${event.date}-${event.title}`} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-700">{event.date}</p>
                          <Badge variant="outline" className={impactBadgeClassMap[event.impact]}>
                            {impactLabelMap[event.impact]}
                          </Badge>
                        </div>
                        <p className="text-base font-bold text-slate-900">{event.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{event.meaning}</p>
                        <p className="mt-2 text-sm font-medium text-blue-700">실행: {event.action}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-black text-slate-900">행동 체크리스트</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="mb-2 text-sm font-bold text-emerald-900">해야 할 것</p>
                      <ul className="space-y-2 text-sm text-emerald-900/90">
                        {calendarData.checklist.do.map((item) => (
                          <li key={`do-${item}`}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                      <p className="mb-2 text-sm font-bold text-rose-900">피해야 할 것</p>
                      <ul className="space-y-2 text-sm text-rose-900/90">
                        {calendarData.checklist.dont.map((item) => (
                          <li key={`dont-${item}`}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                {calendarData.chapters.map((chapter) => (
                  <Card key={chapter.id} className="rounded-2xl border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-black text-slate-900">{chapter.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm leading-relaxed text-slate-600">{chapter.interpretation}</p>
                      <ul className="space-y-2 text-sm font-medium text-blue-700">
                        {chapter.actionGuide.map((guide) => (
                          <li key={`${chapter.id}-${guide}`}>• {guide}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </section>

              <Card className="rounded-2xl border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-slate-900">심화 데이터</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="source-notes">
                      <AccordionTrigger>소스 노트</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-1 text-sm text-slate-600">
                          {(calendarData.deepData?.sourceNotes ?? []).map((note) => (
                            <li key={note}>• {note}</li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="raw-report">
                      <AccordionTrigger>원본 리포트 텍스트</AccordionTrigger>
                      <AccordionContent>
                        <p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                          {calendarData.deepData?.rawReport ?? "구조형 응답으로 제공되어 원본 텍스트가 없습니다."}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </motion.section>
          ) : null}

          {!isLoading && !calendarData ? (
            <motion.section key="empty" {...sectionMotion} transition={{ duration: 0.2 }}>
              <Card className="rounded-2xl border-slate-200">
                <CardContent className="py-14 text-center">
                  <p className="text-sm font-semibold text-slate-600">월간 리포트를 불러오지 못했습니다. 다시 시도해 주세요.</p>
                </CardContent>
              </Card>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>
    </AnalysisPageShell>
  );
}
