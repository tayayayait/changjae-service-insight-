import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock3,
  HeartPulse,
  Loader2,
  MessageCircleHeart,
  MoonStar,
  Palette,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSunSignHoroscope, type TodayHoroscopeMeta } from "@/lib/astrologyClient";
import { AnalysisPageShell } from "@/components/layout/AnalysisPageShell";
import { ErrorCard } from "@/components/common/ErrorCard";
import ReactMarkdown from "react-markdown";

type ZodiacSign = { id: string; ko: string; date: string; symbol: string };
type HoroscopeLoadState = "idle" | "loading" | "success" | "error";
type HoroscopePoint = { label: string; value: string };
type SectionKey = "flow" | "conclusion" | "doNow" | "avoid" | "focus" | "relation" | "condition" | "action" | "lucky" | "misc";
type ParsedHoroscope = {
  heading?: string;
  sections: Record<SectionKey, string[]>;
  labeledPoints: HoroscopePoint[];
  notice?: string;
};
type ActionBrief = {
  heading: string;
  oneLineConclusion: string;
  doNow: string;
  avoidToday: string;
  focusTime: string;
  relationLine: string;
  conditionLine: string;
  luckyColor?: string;
  luckyKeyword?: string;
  notice?: string;
};

const ZODIAC_SIGNS: ZodiacSign[] = [
  { id: "Aquarius", ko: "물병자리", date: "1.20 - 2.18", symbol: "♒" },
  { id: "Pisces", ko: "물고기자리", date: "2.19 - 3.20", symbol: "♓" },
  { id: "Aries", ko: "양자리", date: "3.21 - 4.19", symbol: "♈" },
  { id: "Taurus", ko: "황소자리", date: "4.20 - 5.20", symbol: "♉" },
  { id: "Gemini", ko: "쌍둥이자리", date: "5.21 - 6.21", symbol: "♊" },
  { id: "Cancer", ko: "게자리", date: "6.22 - 7.22", symbol: "♋" },
  { id: "Leo", ko: "사자자리", date: "7.23 - 8.22", symbol: "♌" },
  { id: "Virgo", ko: "처녀자리", date: "8.23 - 9.22", symbol: "♍" },
  { id: "Libra", ko: "천칭자리", date: "9.23 - 10.22", symbol: "♎" },
  { id: "Scorpio", ko: "전갈자리", date: "10.23 - 11.21", symbol: "♏" },
  { id: "Sagittarius", ko: "사수자리", date: "11.22 - 12.21", symbol: "♐" },
  { id: "Capricorn", ko: "염소자리", date: "12.22 - 1.19", symbol: "♑" },
];

const LOADING_STAGES = [
  {
    title: "요청 접수",
    description: "선택한 별자리 신호를 서버에 전달하고 있습니다.",
  },
  {
    title: "데이터 해석",
    description: "오늘 바로 쓸 수 있는 실행 문장으로 정리하고 있습니다.",
  },
  {
    title: "결과 구성",
    description: "결론, 할 일, 피할 일을 한 화면에 배치하고 있습니다.",
  },
] as const;

const createEmptySections = (): Record<SectionKey, string[]> => ({
  flow: [],
  conclusion: [],
  doNow: [],
  avoid: [],
  focus: [],
  relation: [],
  condition: [],
  action: [],
  lucky: [],
  misc: [],
});

const getActiveLoadingStage = (elapsedSec: number) => {
  if (elapsedSec >= 8) return 2;
  if (elapsedSec >= 4) return 1;
  return 0;
};

const stripMarkdownDecorations = (value: string) =>
  value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\*/g, "")
    .replace(/_/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const parseLabeledPoint = (line: string): HoroscopePoint | null => {
  const normalized = line.replace(/^-+\s*/, "").trim();
  const emphasizedMatch = normalized.match(/^\*\*(.+?)\*\*:\s*(.+)$/);
  if (emphasizedMatch) {
    return {
      label: stripMarkdownDecorations(emphasizedMatch[1]),
      value: stripMarkdownDecorations(emphasizedMatch[2]),
    };
  }

  const plainMatch = normalized.match(/^([^:]{1,24}):\s*(.+)$/);
  if (!plainMatch) return null;
  return {
    label: stripMarkdownDecorations(plainMatch[1]),
    value: stripMarkdownDecorations(plainMatch[2]),
  };
};

const resolveSectionFromHeading = (heading: string): SectionKey => {
  if (heading.includes("한 줄 결론")) return "conclusion";
  if (heading.includes("오늘의 흐름")) return "flow";
  if (heading.includes("지금 할 일")) return "doNow";
  if (heading.includes("피할 일")) return "avoid";
  if (heading.includes("집중 시간")) return "focus";
  if (heading.includes("관계")) return "relation";
  if (heading.includes("컨디션")) return "condition";
  if (heading.includes("실행 포인트")) return "action";
  if (heading.includes("럭키")) return "lucky";
  return "misc";
};

const firstNonEmpty = (...groups: Array<string[] | string | null | undefined>) => {
  for (const group of groups) {
    if (Array.isArray(group)) {
      const found = group.find((item) => item.trim().length > 0);
      if (found) return found.trim();
      continue;
    }
    if (typeof group === "string" && group.trim().length > 0) {
      return group.trim();
    }
  }
  return "";
};

const deriveAvoidSentence = (doNow: string) => {
  if (doNow.includes("신규 착수")) return "핵심 작업이 끝나기 전 신규 착수는 하지 마세요.";
  if (doNow.includes("우선순위")) return "우선순위에 없는 작업을 추가하지 마세요.";
  if (doNow.includes("완료 기준")) return "완료 기준 없는 시작은 피하세요.";
  if (doNow.includes("집중")) return "동시에 여러 작업 창을 열어 집중을 분산시키지 마세요.";
  return "동시에 많은 일을 시작하지 말고, 완료 기준 없는 실행은 피하세요.";
};

const parseHoroscopeMarkdown = (raw: string): ParsedHoroscope | null => {
  const lines = raw.replace(/\r/g, "").split("\n");
  const sections = createEmptySections();
  const labeledPoints: HoroscopePoint[] = [];
  let heading: string | undefined;
  let currentSection: SectionKey = "misc";
  let notice: string | undefined;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const headingMatch = line.match(/^###\s*(.+)$/);
    if (headingMatch) {
      const normalizedHeading = stripMarkdownDecorations(headingMatch[1]);
      if (!heading) heading = normalizedHeading;
      currentSection = resolveSectionFromHeading(normalizedHeading);
      continue;
    }

    const noteMatch = line.match(/^_([^_].+)_$/);
    if (noteMatch) {
      notice = stripMarkdownDecorations(noteMatch[1]);
      continue;
    }

    const point = parseLabeledPoint(line);
    if (point) {
      labeledPoints.push(point);
      if (currentSection === "action") {
        if (point.label.includes("관계") || point.label.includes("소통")) {
          sections.relation.push(point.value);
        } else if (point.label.includes("컨디션") || point.label.includes("리듬")) {
          sections.condition.push(point.value);
        } else {
          sections.doNow.push(point.value);
        }
      } else if (currentSection === "lucky") {
        if (point.label.includes("시간")) {
          sections.focus.push(point.value);
        } else {
          sections.lucky.push(`${point.label}: ${point.value}`);
        }
      } else {
        sections[currentSection].push(point.value);
      }
      continue;
    }

    const plainText = stripMarkdownDecorations(line.replace(/^-+\s*/, ""));
    if (!plainText) continue;
    sections[currentSection].push(plainText);
  }

  const hasContent = Object.values(sections).some((items) => items.length > 0) || Boolean(notice);
  if (!hasContent) return null;

  return { heading, sections, labeledPoints, notice };
};

const pickPointValue = (points: HoroscopePoint[], matcher: (label: string) => boolean) =>
  points.find((point) => matcher(point.label))?.value;

const buildActionBrief = (parsed: ParsedHoroscope, signKo?: string): ActionBrief => {
  const oneLineConclusion = firstNonEmpty(
    parsed.sections.conclusion,
    parsed.sections.flow,
    parsed.sections.misc,
  ) || "오늘은 핵심 우선순위 1개를 끝까지 밀어붙이는 것이 유리합니다.";

  const actionFromPoint = pickPointValue(
    parsed.labeledPoints,
    (label) => label.includes("한 줄 행동") || label.includes("추천 행동") || label.includes("핵심 전략"),
  );
  const doNow = firstNonEmpty(parsed.sections.doNow, actionFromPoint) || "오늘 끝낼 일 1개를 먼저 완료하세요.";

  const avoidFromPoint = pickPointValue(parsed.labeledPoints, (label) => label.includes("피할"));
  const avoidToday = firstNonEmpty(parsed.sections.avoid, avoidFromPoint) || deriveAvoidSentence(doNow);

  const focusFromPoint = pickPointValue(parsed.labeledPoints, (label) => label.includes("시간"));
  const focusTime = firstNonEmpty(parsed.sections.focus, focusFromPoint) || "오전 09:00~11:00";

  const relationFromPoint = pickPointValue(
    parsed.labeledPoints,
    (label) => label.includes("관계") || label.includes("소통"),
  );
  const relationLine =
    firstNonEmpty(parsed.sections.relation, relationFromPoint) || "결론 전에 상대 의도를 한 번 확인하세요.";

  const conditionFromPoint = pickPointValue(
    parsed.labeledPoints,
    (label) => label.includes("컨디션") || label.includes("리듬"),
  );
  const conditionLine =
    firstNonEmpty(parsed.sections.condition, conditionFromPoint) || "50분 집중 후 10분 회복 루틴을 유지하세요.";

  const luckyColor = pickPointValue(parsed.labeledPoints, (label) => label.includes("컬러"));
  const luckyKeyword = pickPointValue(parsed.labeledPoints, (label) => label.includes("키워드"));

  return {
    heading: parsed.heading ?? `${signKo ?? "오늘"} 한 줄 결론`,
    oneLineConclusion,
    doNow,
    avoidToday,
    focusTime,
    relationLine,
    conditionLine,
    luckyColor,
    luckyKeyword,
    notice: parsed.notice,
  };
};

const resolveColorSwatch = (value: string) => {
  const map = [
    { keywords: ["레드", "빨강", "코랄"], hex: "#fb7185" },
    { keywords: ["블루", "파랑", "네이비", "스카이"], hex: "#60a5fa" },
    { keywords: ["그린", "초록", "올리브"], hex: "#84cc16" },
    { keywords: ["퍼플", "보라"], hex: "#a78bfa" },
    { keywords: ["오렌지"], hex: "#fb923c" },
    { keywords: ["옐로", "노랑"], hex: "#facc15" },
  ];
  const found = map.find((item) => item.keywords.some((keyword) => value.includes(keyword)));
  return found?.hex ?? "#818cf8";
};

export default function DailyAstrologyPage() {
  const [step, setStep] = useState(1);
  const [loadState, setLoadState] = useState<HoroscopeLoadState>("idle");
  const [selectedSign, setSelectedSign] = useState<ZodiacSign | null>(null);
  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [horoscopeMeta, setHoroscopeMeta] = useState<TodayHoroscopeMeta | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingElapsedSec, setLoadingElapsedSec] = useState(0);
  const [actionChecks, setActionChecks] = useState({ doNow: false, avoid: false });
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (loadState !== "loading") return;

    setLoadingElapsedSec(0);
    const intervalId = setInterval(() => {
      setLoadingElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [loadState, selectedSign?.id]);

  const activeLoadingStage = useMemo(() => getActiveLoadingStage(loadingElapsedSec), [loadingElapsedSec]);
  const loadingProgress = useMemo(() => Math.min(92, 24 + loadingElapsedSec * 8), [loadingElapsedSec]);
  const parsedHoroscope = useMemo(() => (horoscope ? parseHoroscopeMarkdown(horoscope) : null), [horoscope]);
  const actionBrief = useMemo(
    () => (parsedHoroscope ? buildActionBrief(parsedHoroscope, selectedSign?.ko) : null),
    [parsedHoroscope, selectedSign?.ko],
  );
  const sanitizedFallbackMarkdown = useMemo(() => (horoscope ? horoscope.replace(/\*\*/g, "") : ""), [horoscope]);
  const fallbackMetaNotice = useMemo(() => {
    if (!horoscopeMeta || horoscopeMeta.source === "proxy") return null;

    if (horoscopeMeta.reason === "upstream_timeout" || horoscopeMeta.reason === "client_timeout") {
      return "실시간 응답 지연으로 보정 리포트를 표시 중입니다.";
    }
    if (horoscopeMeta.reason === "network_error") {
      return "네트워크 연결 불안정으로 보정 리포트를 표시 중입니다.";
    }
    return "실시간 데이터 대신 보정 리포트를 표시 중입니다.";
  }, [horoscopeMeta]);

  const requestHoroscope = async (signData: ZodiacSign) => {
    const requestId = ++requestIdRef.current;
    setSelectedSign(signData);
    setStep(2);
    setLoadState("loading");
    setHoroscope(null);
    setHoroscopeMeta(null);
    setErrorMessage(null);
    setActionChecks({ doNow: false, avoid: false });

    try {
      const res = await getSunSignHoroscope(signData.id);
      if (requestId !== requestIdRef.current) return;
      setHoroscope(res.data.horoscope);
      setHoroscopeMeta(res.meta ?? null);
      setLoadState("success");
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setLoadState("error");
      setHoroscopeMeta(null);
      setErrorMessage(
        error instanceof Error && error.message.trim()
          ? error.message
          : "오늘의 별자리 운세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    }
  };

  const handleRetry = () => {
    if (!selectedSign || loadState === "loading") return;
    void requestHoroscope(selectedSign);
  };

  const handleBackToSelection = () => {
    requestIdRef.current += 1;
    setStep(1);
    setLoadState("idle");
    setSelectedSign(null);
    setHoroscope(null);
    setHoroscopeMeta(null);
    setErrorMessage(null);
    setActionChecks({ doNow: false, avoid: false });
  };

  return (
    <AnalysisPageShell
      title="오늘의 별자리"
      subtitle="버튼 하나로 확인하는 나의 오늘 하루 운세 흐름."
    >
      <div className="mx-auto max-w-3xl pb-20">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="rounded-[32px] border border-gray-100 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                  <MoonStar className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">나의 별자리를 선택해주세요</h3>
                <p className="text-sm text-gray-500">태어난 날짜가 속하는 별자리를 클릭하면 오늘의 운세를 알려드립니다.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 px-2 sm:grid-cols-3 md:grid-cols-4">
                {ZODIAC_SIGNS.map((sign) => (
                  <button
                    key={sign.id}
                    onClick={() => void requestHoroscope(sign)}
                    className="group flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-sm transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-md"
                  >
                    <span className="mb-3 text-4xl transition-transform group-hover:scale-110">{sign.symbol}</span>
                    <span className="mb-1 font-bold text-gray-900">{sign.ko}</span>
                    <span className="text-xs font-medium text-gray-400">{sign.date}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center rounded-[32px] border border-white bg-gradient-to-br from-indigo-50 to-purple-50 p-8 text-center shadow-sm">
                <span className="mb-4 text-6xl">{selectedSign?.symbol}</span>
                <h2 className="mb-2 text-2xl font-black text-gray-900">{selectedSign?.ko}의 오늘</h2>
              </div>

              <div className="min-h-[300px] rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm lg:p-8">
                {loadState === "loading" ? (
                  <div className="flex min-h-[240px] flex-col justify-center gap-6">
                    <div className="space-y-2">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                          style={{ width: `${loadingProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500">요청 경과 {loadingElapsedSec}초</p>
                    </div>

                    <div className="space-y-4">
                      {LOADING_STAGES.map((stage, index) => {
                        const isCompleted = index < activeLoadingStage;
                        const isCurrent = index === activeLoadingStage;
                        return (
                          <div key={stage.title} className="flex items-start gap-3">
                            {isCompleted ? (
                              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
                            ) : isCurrent ? (
                              <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-indigo-500" />
                            ) : (
                              <Circle className="mt-0.5 h-5 w-5 text-slate-300" />
                            )}
                            <div>
                              <p className={`text-sm font-semibold ${isCurrent ? "text-slate-900" : "text-slate-700"}`}>
                                {stage.title}
                              </p>
                              <p className="text-xs text-slate-500">{stage.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {loadState === "error" ? (
                  <div className="space-y-4">
                    <ErrorCard
                      title={`${selectedSign?.ko ?? "선택한 별자리"} 운세 조회 실패`}
                      message={errorMessage ?? "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."}
                      onRetry={handleRetry}
                    />
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      지금은 결과를 불러오지 못했지만, 잠시 뒤 다시 시도하면 정상 조회될 가능성이 높습니다.
                    </div>
                  </div>
                ) : null}

                {loadState === "success" && horoscope ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {fallbackMetaNotice ? (
                      <section className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
                        {fallbackMetaNotice}
                      </section>
                    ) : null}
                    {actionBrief ? (
                      <div className="space-y-5">
                        <section className="rounded-[28px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6 shadow-sm">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500">
                            Today Quick Brief
                          </p>
                          <h3 className="mt-2 text-2xl font-black text-slate-900">오늘 한 줄 결론</h3>
                          <p className="mt-3 leading-relaxed text-slate-700">{actionBrief.oneLineConclusion}</p>
                        </section>

                        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                          <div className="mb-4 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-indigo-500" />
                            <h4 className="text-lg font-bold text-slate-900">오늘 바로 실행</h4>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            <article className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <div className="inline-flex items-center gap-2 text-indigo-700">
                                  <Target className="h-4 w-4" />
                                  <p className="text-sm font-semibold">지금 할 일 1개</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setActionChecks((prev) => ({ ...prev, doNow: !prev.doNow }))}
                                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                                    actionChecks.doNow
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                      : "border-indigo-200 bg-white text-indigo-600"
                                  }`}
                                >
                                  {actionChecks.doNow ? "체크 완료" : "체크"}
                                </button>
                              </div>
                              <p className="text-sm leading-relaxed text-slate-700">{actionBrief.doNow}</p>
                            </article>

                            <article className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <div className="inline-flex items-center gap-2 text-rose-700">
                                  <AlertTriangle className="h-4 w-4" />
                                  <p className="text-sm font-semibold">오늘 피할 일 1개</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setActionChecks((prev) => ({ ...prev, avoid: !prev.avoid }))}
                                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                                    actionChecks.avoid
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                      : "border-rose-200 bg-white text-rose-600"
                                  }`}
                                >
                                  {actionChecks.avoid ? "인지 완료" : "인지"}
                                </button>
                              </div>
                              <p className="text-sm leading-relaxed text-slate-700">{actionBrief.avoidToday}</p>
                            </article>
                          </div>
                        </section>

                        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                          <h4 className="mb-4 text-lg font-bold text-slate-900">오늘 바로 활용 정보</h4>
                          <div className="grid gap-3 md:grid-cols-3">
                            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                                <Clock3 className="h-4 w-4" />
                              </div>
                              <p className="text-xs font-semibold text-slate-500">집중 시간대</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{actionBrief.focusTime}</p>
                            </article>

                            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                                <MessageCircleHeart className="h-4 w-4" />
                              </div>
                              <p className="text-xs font-semibold text-slate-500">관계 한 문장</p>
                              <p className="mt-1 text-sm text-slate-800">{actionBrief.relationLine}</p>
                            </article>

                            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                                <HeartPulse className="h-4 w-4" />
                              </div>
                              <p className="text-xs font-semibold text-slate-500">컨디션 한 문장</p>
                              <p className="mt-1 text-sm text-slate-800">{actionBrief.conditionLine}</p>
                            </article>
                          </div>
                        </section>

                        {actionBrief.luckyColor || actionBrief.luckyKeyword ? (
                          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="mb-3 text-sm font-semibold text-slate-700">럭키 포인트 (보조)</p>
                            <div className="flex flex-wrap gap-2">
                              {actionBrief.luckyColor ? (
                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                                  <Palette className="h-3.5 w-3.5 text-slate-500" />
                                  <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: resolveColorSwatch(actionBrief.luckyColor) }}
                                  />
                                  행운 컬러 {actionBrief.luckyColor}
                                </span>
                              ) : null}
                              {actionBrief.luckyKeyword ? (
                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                                  <Sparkles className="h-3.5 w-3.5 text-slate-500" />
                                  키워드 {actionBrief.luckyKeyword}
                                </span>
                              ) : null}
                            </div>
                          </section>
                        ) : null}

                        {actionBrief.notice ? (
                          <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                            {actionBrief.notice}
                          </section>
                        ) : null}
                      </div>
                    ) : (
                      <div className="prose prose-indigo max-w-none prose-headings:text-indigo-900 prose-p:text-gray-700 prose-strong:text-indigo-800">
                        <ReactMarkdown>{sanitizedFallbackMarkdown}</ReactMarkdown>
                      </div>
                    )}
                  </motion.div>
                ) : null}

                {loadState === "success" && !horoscope ? (
                  <ErrorCard
                    title="운세 결과 없음"
                    message="운세 본문이 비어 있어 표시할 수 없습니다. 다시 시도해 주세요."
                    onRetry={handleRetry}
                  />
                ) : null}
              </div>

              <Button
                onClick={handleBackToSelection}
                variant="outline"
                className="mt-8 h-14 w-full rounded-2xl bg-white shadow-sm"
              >
                다른 별자리 운세 보기
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnalysisPageShell>
  );
}
