import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Loader2, MoonStar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { AnalysisPageShell } from "@/components/layout/AnalysisPageShell";
import { getAstrologyBirthReport } from "@/lib/astrologyClient";
import { AstrologyBirthReportResult } from "@/types/result";
import { useConsultStore } from "@/store/useConsultStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Big3Summary } from "@/components/astrology/Big3Summary";
import { ElementChart } from "@/components/astrology/ElementChart";
import { QualityChart } from "@/components/astrology/QualityChart";
import { AspectList } from "@/components/astrology/AspectList";
import { PlanetAccordion } from "@/components/astrology/PlanetAccordion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { getTimeBlockLabel } from "@/lib/timeBlocks";

type CityOption = {
  name: string;
  lat: number;
  lng: number;
  tz: string;
};

const CITIES: CityOption[] = [
  { name: "서울", lat: 37.5665, lng: 126.978, tz: "Asia/Seoul" },
  { name: "부산", lat: 35.1796, lng: 129.0756, tz: "Asia/Seoul" },
  { name: "대구", lat: 35.8714, lng: 128.6014, tz: "Asia/Seoul" },
  { name: "인천", lat: 37.4563, lng: 126.7052, tz: "Asia/Seoul" },
  { name: "광주", lat: 35.1595, lng: 126.8526, tz: "Asia/Seoul" },
  { name: "대전", lat: 36.3504, lng: 127.3845, tz: "Asia/Seoul" },
  { name: "울산", lat: 35.5384, lng: 129.3114, tz: "Asia/Seoul" },
  { name: "제주", lat: 33.4996, lng: 126.5312, tz: "Asia/Seoul" },
];

const REPORT_LINKS = [
  { to: "/astrology/daily", title: "오늘의 별자리 운세", description: "오늘 하루 실행 포인트를 빠르게 확인" },
  { to: "/astrology/synastry", title: "별자리 궁합", description: "관계 시너지를 별도 리포트로 확인" },
  { to: "/astrology/calendar", title: "코스믹 캘린더", description: "월간/분기 흐름을 캘린더 기반으로 점검" },
];

const FORM_CONTAINER_CLASS = "mx-auto w-full max-w-3xl";
const REPORT_CONTAINER_CLASS = "mx-auto w-full max-w-4xl";
const REPORT_SECTION_CLASS = "rounded-3xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm";

export default function AstrologyPage() {
  const navigate = useNavigate();
  const { user, profile, initialized } = useAuthStore();
  const { userProfile, updateProfile } = useConsultStore();

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [report, setReport] = useState<AstrologyBirthReportResult | null>(null);

  const [name, setName] = useState(profile?.name || userProfile.name || "");
  const [year, setYear] = useState(profile?.year || userProfile.year || new Date().getFullYear());
  const [month, setMonth] = useState(profile?.month || userProfile.month || new Date().getMonth() + 1);
  const [day, setDay] = useState(profile?.day || userProfile.day || new Date().getDate());
  const [hour, setHour] = useState(profile?.hour ?? userProfile.hour ?? 12);
  const [minute, setMinute] = useState(profile?.minute ?? userProfile.minute ?? 0);
  const [selectedCity, setSelectedCity] = useState<CityOption>(
    CITIES.find((city) => city.name === (profile?.location || userProfile.location)) || CITIES[0],
  );

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!profile) {
      navigate("/setup-profile");
    }
  }, [initialized, navigate, profile, user]);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name || "");
    setYear(profile.year || new Date().getFullYear());
    setMonth(profile.month || new Date().getMonth() + 1);
    setDay(profile.day || new Date().getDate());
    setHour(profile.hour ?? 12);
    setMinute(profile.minute ?? 0);
    setSelectedCity(CITIES.find((city) => city.name === profile.location) || CITIES[0]);
    setStep(0);
    setReport(null);
  }, [profile]);

  const birthTimeKnown = useMemo(() => profile?.hour !== null, [profile?.hour]);

  const handleAnalyze = async () => {
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);

    try {
      updateProfile({ name, year, month, day, hour, minute, location: selectedCity.name });
      const response = await getAstrologyBirthReport({
        name,
        year,
        month,
        day,
        hour,
        minute,
        lat: selectedCity.lat,
        lng: selectedCity.lng,
        tz_str: selectedCity.tz,
        birthTimeKnown,
      });
      setReport(response);
      setStep(3);
    } catch (error) {
      toast({
        title: "점성학 리포트 생성 실패",
        description: error instanceof Error ? error.message : "리포트 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!initialized || !user || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AnalysisPageShell
      categoryId="astrology"
      title="점성학 천궁도 리포트"
      subtitle="핵심 요약 → 상세 해석 → 심화 데이터 순서로 읽는 리포트"
      themeColor="accent-sky"
      icon={MoonStar}
    >
      <div className={cn(step === 3 ? REPORT_CONTAINER_CLASS : FORM_CONTAINER_CLASS)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22 }}
          >
            {step === 0 && (
              <section className={cn("space-y-6", REPORT_SECTION_CLASS)}>
                <header className="space-y-1">
                  <h2 className="text-xl font-black text-gray-900">기본 정보 확인</h2>
                  <p className="text-sm font-medium text-gray-600">프로필 정보를 기준으로 점성학 리포트를 생성합니다.</p>
                </header>

                <div className="space-y-3 rounded-2xl bg-gray-50 p-4">
                  <Row label="이름" value={profile?.name ?? "-"} />
                  <Row label="생년월일" value={`${profile?.year}.${profile?.month}.${profile?.day}`} />
                  <Row
                    label="출생시간"
                    value={
                      profile?.time_block
                        ? getTimeBlockLabel(profile.time_block)
                        : profile?.hour === null
                          ? "미입력(12:00 기준)"
                          : `${profile?.hour}:${String(profile?.minute ?? 0).padStart(2, "0")}`
                    }
                  />
                  <Row label="출생지" value={profile?.location ?? "-"} />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button variant="outline" className="h-12 rounded-xl" onClick={() => setStep(1)}>
                    정보 수정
                  </Button>
                  <Button className="h-12 rounded-xl bg-[#24303F] text-white hover:bg-black" onClick={handleAnalyze} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    리포트 생성
                  </Button>
                </div>
              </section>
            )}

            {step === 1 && (
              <section className={cn("space-y-6", REPORT_SECTION_CLASS)}>
                <header className="space-y-1">
                  <h2 className="text-xl font-black text-gray-900">출생 정보 수정</h2>
                  <p className="text-sm font-medium text-gray-600">리포트 정확도를 위해 생년월일/시간을 확인하세요.</p>
                </header>

                <div className="space-y-4">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="h-12 w-full rounded-xl border border-gray-200 px-4 text-base font-medium"
                    placeholder="이름"
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <input type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} className="h-12 rounded-xl border border-gray-200 text-center" />
                    <input type="number" value={month} onChange={(event) => setMonth(Number(event.target.value))} className="h-12 rounded-xl border border-gray-200 text-center" />
                    <input type="number" value={day} onChange={(event) => setDay(Number(event.target.value))} className="h-12 rounded-xl border border-gray-200 text-center" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" value={hour} onChange={(event) => setHour(Number(event.target.value))} className="h-12 rounded-xl border border-gray-200 text-center" />
                    <input type="number" value={minute} onChange={(event) => setMinute(Number(event.target.value))} className="h-12 rounded-xl border border-gray-200 text-center" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button variant="outline" className="h-12 rounded-xl" onClick={() => setStep(0)}>
                    이전
                  </Button>
                  <Button className="h-12 rounded-xl bg-[#24303F] text-white hover:bg-black" onClick={() => setStep(2)} disabled={!name.trim()}>
                    다음
                  </Button>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className={cn("space-y-6", REPORT_SECTION_CLASS)}>
                <header className="space-y-1">
                  <h2 className="text-xl font-black text-gray-900">출생지 선택</h2>
                  <p className="text-sm font-medium text-gray-600">위도/경도 기준으로 하우스와 상승궁을 계산합니다.</p>
                </header>

                <div className="grid grid-cols-3 gap-2">
                  {CITIES.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => setSelectedCity(city)}
                      className={cn(
                        "h-11 rounded-xl border text-sm font-semibold transition",
                        selectedCity.name === city.name
                          ? "border-[#24303F] bg-gray-50 text-gray-900"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                      )}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button variant="outline" className="h-12 rounded-xl" onClick={() => setStep(1)}>
                    이전
                  </Button>
                  <Button className="h-12 rounded-xl bg-[#24303F] text-white hover:bg-black" onClick={handleAnalyze} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    리포트 생성
                  </Button>
                </div>
              </section>
            )}

            {step === 3 && report && <AstrologyReportView report={report} onReset={() => setStep(1)} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AnalysisPageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 pb-2 last:border-none last:pb-0">
      <span className="text-sm font-semibold text-gray-500">{label}</span>
      <span className="text-sm font-bold text-gray-900">{value}</span>
    </div>
  );
}

export function AstrologyReportView({
  report,
  onReset,
}: {
  report: AstrologyBirthReportResult;
  onReset?: () => void;
}) {
  return (
    <section className="space-y-6 md:space-y-8">
      <div className={REPORT_SECTION_CLASS}>
        <h2 className="text-2xl font-black text-gray-900">핵심 요약</h2>
        <p className="mt-2 text-sm font-medium text-gray-600">{report.summary.keynote}</p>
        <div
          className={cn(
            "mt-4 rounded-xl border px-4 py-3 text-sm font-semibold",
            report.confidence.level === "high"
              ? "border-emerald-100 bg-emerald-50 text-emerald-800"
              : "border-amber-100 bg-amber-50 text-amber-800",
          )}
        >
          신뢰도: {report.confidence.level.toUpperCase()} · {report.confidence.message}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard title="강점" items={report.summary.strengths} accentClass="border-emerald-100 bg-emerald-50/50" />
          <SummaryCard title="주의 포인트" items={report.summary.risks} accentClass="border-rose-100 bg-rose-50/50" />
          <SummaryCard title="지금 할 행동" items={report.summary.actionsNow} accentClass="border-indigo-100 bg-indigo-50/50" />
        </div>
      </div>

      <div className={REPORT_SECTION_CLASS}>
        <h2 className="text-2xl font-black text-gray-900">상세 해석</h2>
        <p className="mt-2 text-sm font-medium text-gray-600">성향/관계/시기/미래 흐름을 챕터별로 읽을 수 있습니다.</p>

        <div className="mt-6 space-y-4">
          {report.chapters.map((chapter) => (
            <article key={chapter.id} className="rounded-2xl border border-gray-100 bg-gray-50/40 p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                <h3 className="text-lg font-bold text-gray-900">{chapter.title}</h3>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-700">{chapter.interpretation}</p>

              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">근거 데이터</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {chapter.evidence.map((item, index) => (
                    <li key={`${chapter.id}-evidence-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700">실행 제안</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-indigo-900">
                  {chapter.actionGuide.map((item, index) => (
                    <li key={`${chapter.id}-action-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>

              {chapter.aiInsight ? (
                <div className="mt-4 rounded-xl border border-violet-100 bg-white p-4">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-violet-700">AI 확장 해설</h4>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <ReactMarkdown>{chapter.aiInsight}</ReactMarkdown>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
          <h3 className="text-base font-bold text-blue-900">월간 + 분기 흐름</h3>
          <p className="mt-2 text-sm text-blue-800">
            <span className="font-semibold">당월 집중:</span> {report.timing.monthFocus}
          </p>
          <p className="mt-1 text-sm text-blue-800">
            <span className="font-semibold">당월 주의:</span> {report.timing.monthCaution}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {report.timing.quarterFlow.map((node) => (
              <div key={node.label} className="flex h-full min-h-[132px] flex-col rounded-xl border border-blue-100 bg-white p-3">
                <p className="text-sm font-bold text-blue-900">{node.label}</p>
                <p className="mt-1 text-xs font-semibold text-blue-700">점수 {node.score}</p>
                <p className="mt-2 text-xs text-gray-700">{node.focus}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={REPORT_SECTION_CLASS}>
        <h2 className="text-2xl font-black text-gray-900">심화 데이터</h2>
        <p className="mt-2 text-sm font-medium text-gray-600">원본 계산값은 아래 아코디언에서 확인할 수 있습니다.</p>

        <Accordion type="single" collapsible defaultValue="deep-data" className="mt-4">
          <AccordionItem value="deep-data">
            <AccordionTrigger className="text-left text-sm font-bold text-gray-900">차트 및 계산 데이터 열기</AccordionTrigger>
            <AccordionContent className="space-y-6 pt-4">
              {report.deepData.chartSvg ? (
                <div className="rounded-3xl border border-gray-100 bg-gray-50/50 p-4 md:p-6">
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
      </div>

      <div className={REPORT_SECTION_CLASS}>
        <h2 className="text-xl font-black text-gray-900">확장 리포트</h2>
        <p className="mt-2 text-sm font-medium text-gray-600">별도 분석 서비스로 연결됩니다.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {REPORT_LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex h-full min-h-[122px] flex-col rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:border-gray-300 hover:bg-white"
            >
              <p className="text-sm font-bold text-gray-900">{item.title}</p>
              <p className="mt-1 text-xs font-medium text-gray-600">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {onReset ? (
        <Button variant="outline" className="h-12 w-full rounded-xl" onClick={onReset}>
          정보 다시 입력
        </Button>
      ) : null}
    </section>
  );
}

function SummaryCard({ title, items, accentClass }: { title: string; items: string[]; accentClass: string }) {
  return (
    <div className={cn("flex h-full min-h-[190px] flex-col rounded-2xl border p-4 md:p-5", accentClass)}>
      <h3 className="text-sm font-black text-gray-900">{title}</h3>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-xs font-medium text-gray-700">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
