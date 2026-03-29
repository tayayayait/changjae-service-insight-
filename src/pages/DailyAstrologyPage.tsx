import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  MessageCircleHeart,
  MoonStar,
  Sparkles,
  Target,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AnalysisPageShell } from "@/components/layout/AnalysisPageShell";
import { ErrorCard } from "@/components/common/ErrorCard";
import { AdGate } from "@/components/common/AdGate";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useConsultStore } from "@/store/useConsultStore";
import {
  useDailyAstrologyFlow,
  type ZodiacSign,
} from "@/hooks/astrology/useDailyAstrologyFlow";

type ActionBrief = {
  oneLineConclusion: string;
  doNow: string;
  avoidToday: string;
  focusTime: string;
  relationLine: string;
  conditionLine: string;
  executionChecklist: string[];
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
    description: "실시간 운세 생성을 요청하고 있습니다.",
  },
  {
    title: "데이터 처리",
    description: "오늘의 흐름을 분석하고 있습니다.",
  },
  {
    title: "결과 검증",
    description: "응답 메타데이터를 검증하고 있습니다.",
  },
] as const;

const toKstDisplayDate = (date: Date) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Seoul",
  }).format(date);

const toKstISODate = (date: Date) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
  }).format(date);

const resolveSignFromBirthday = (month?: number | null, day?: number | null): ZodiacSign | null => {
  if (!month || !day) return null;

  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return ZODIAC_SIGNS.find((sign) => sign.id === "Aquarius") ?? null;
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return ZODIAC_SIGNS.find((sign) => sign.id === "Pisces") ?? null;
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return ZODIAC_SIGNS.find((sign) => sign.id === "Aries") ?? null;
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return ZODIAC_SIGNS.find((sign) => sign.id === "Taurus") ?? null;
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return ZODIAC_SIGNS.find((sign) => sign.id === "Gemini") ?? null;
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return ZODIAC_SIGNS.find((sign) => sign.id === "Cancer") ?? null;
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return ZODIAC_SIGNS.find((sign) => sign.id === "Leo") ?? null;
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return ZODIAC_SIGNS.find((sign) => sign.id === "Virgo") ?? null;
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return ZODIAC_SIGNS.find((sign) => sign.id === "Libra") ?? null;
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return ZODIAC_SIGNS.find((sign) => sign.id === "Scorpio") ?? null;
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return ZODIAC_SIGNS.find((sign) => sign.id === "Sagittarius") ?? null;
  return ZODIAC_SIGNS.find((sign) => sign.id === "Capricorn") ?? null;
};

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
    .replace(/^[-*]\s*/, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const DEFAULT_PRETTY_FOCUS_TIME = "오전 9:00~11:00";

const toPrettyHourLabel = (hour24: number) => {
  const period = hour24 < 12 ? "오전" : "오후";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { period, hour12 };
};

const formatPrettyTimeRange = (startHour: number, startMinute: number, endHour: number, endMinute: number) => {
  const start = toPrettyHourLabel(startHour);
  const end = toPrettyHourLabel(endHour);
  const mm = (value: number) => String(value).padStart(2, "0");

  if (start.period === end.period) {
    return `${start.period} ${start.hour12}:${mm(startMinute)}~${end.hour12}:${mm(endMinute)}`;
  }

  return `${start.period} ${start.hour12}:${mm(startMinute)}~${end.period} ${end.hour12}:${mm(endMinute)}`;
};

const parseTimeWithOptionalPeriod = (period: string | undefined, hourText: string, minuteText: string | undefined) => {
  const parsedHour = Number(hourText);
  const parsedMinute = minuteText ? Number(minuteText) : 0;

  if (!Number.isFinite(parsedHour) || !Number.isFinite(parsedMinute)) return null;
  if (parsedMinute < 0 || parsedMinute > 59) return null;

  if (period === "오전" || period === "오후") {
    let normalizedHour = parsedHour;
    if (normalizedHour < 0) return null;
    if (normalizedHour > 12) normalizedHour = normalizedHour % 12;
    if (normalizedHour === 0) normalizedHour = 12;
    const hour24 = period === "오전" ? normalizedHour % 12 : (normalizedHour % 12) + 12;
    return { hour24, minute: parsedMinute };
  }

  if (parsedHour < 0 || parsedHour > 23) return null;
  return { hour24: parsedHour, minute: parsedMinute };
};

const normalizeFocusTime = (raw: string) => {
  const value = raw.replace(/\s+/g, " ").trim();
  if (!value) return DEFAULT_PRETTY_FOCUS_TIME;

  const match = value.match(
    /^(?:(오전|오후)\s*)?(\d{1,2})(?::?(\d{2}))?\s*[~\-–]\s*(?:(오전|오후)\s*)?(\d{1,2})(?::?(\d{2}))?$/,
  );
  if (!match) return DEFAULT_PRETTY_FOCUS_TIME;

  const [, startPeriodRaw, startHourText, startMinuteText, endPeriodRaw, endHourText, endMinuteText] = match;
  const startPeriod = startPeriodRaw || endPeriodRaw;
  const endPeriod = endPeriodRaw || startPeriodRaw;

  const start = parseTimeWithOptionalPeriod(startPeriod, startHourText, startMinuteText);
  const end = parseTimeWithOptionalPeriod(endPeriod, endHourText, endMinuteText);
  if (!start || !end) return DEFAULT_PRETTY_FOCUS_TIME;

  const durationMinutes = end.hour24 * 60 + end.minute - (start.hour24 * 60 + start.minute);
  if (durationMinutes < 60 || durationMinutes > 240) return DEFAULT_PRETTY_FOCUS_TIME;

  return formatPrettyTimeRange(start.hour24, start.minute, end.hour24, end.minute);
};

const firstNonEmpty = (...values: Array<string | undefined | null>) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
};

const buildActionBrief = (raw: string): ActionBrief => {
  const lines = raw.replace(/\r/g, "").split("\n");
  let section = "";

  const sectionValues = {
    flow: "",
    conclusion: "",
    doNow: "",
    avoid: "",
    focus: "",
    relation: "",
    condition: "",
    notice: "",
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("###")) {
      section = stripMarkdownDecorations(line.replace(/^###\s*/, "")).toLowerCase();
      continue;
    }

    if (/^_.*_$/.test(line)) {
      sectionValues.notice = stripMarkdownDecorations(line.slice(1, -1));
      continue;
    }

    const normalized = stripMarkdownDecorations(line);
    if (!normalized) continue;

    if ((section.includes("결론") || section.includes("summary")) && !sectionValues.conclusion) {
      sectionValues.conclusion = normalized;
      continue;
    }
    if ((section.includes("지금") || section.includes("do now") || section.includes("action")) && !sectionValues.doNow) {
      sectionValues.doNow = normalized;
      continue;
    }
    if ((section.includes("피할") || section.includes("avoid")) && !sectionValues.avoid) {
      sectionValues.avoid = normalized;
      continue;
    }
    if ((section.includes("집중") || section.includes("focus time")) && !sectionValues.focus) {
      sectionValues.focus = normalized;
      continue;
    }
    if ((section.includes("관계") || section.includes("relation")) && !sectionValues.relation) {
      sectionValues.relation = normalized;
      continue;
    }
    if ((section.includes("컨디션") || section.includes("condition")) && !sectionValues.condition) {
      sectionValues.condition = normalized;
      continue;
    }
    if (!sectionValues.flow) {
      sectionValues.flow = normalized;
    }
  }

  const oneLineConclusion = firstNonEmpty(
    sectionValues.conclusion,
    sectionValues.flow,
    "흐름의 중심을 잡고 시작은 단순하게, 마무리는 침착하게.",
  );
  const doNow = firstNonEmpty(
    sectionValues.doNow,
    "오전 11시까지 오늘 처리할 핵심 3가지를 완료 기준으로 적어보세요.",
  );
  const avoidToday = firstNonEmpty(
    sectionValues.avoid,
    "감정 반응 즉시 메시지 전송은 피하고 확인 질문을 먼저 하세요.",
  );
  const focusTime = normalizeFocusTime(firstNonEmpty(sectionValues.focus, "09:00~11:00"));
  const relationLine = firstNonEmpty(
    sectionValues.relation,
    "관계 이슈는 결론보다 상대 의도를 먼저 확인하세요.",
  );
  const conditionLine = firstNonEmpty(
    sectionValues.condition,
    "과몰입보다 리듬 조정이 오늘의 효율을 지킵니다.",
  );

  return {
    oneLineConclusion,
    doNow,
    avoidToday,
    focusTime,
    relationLine,
    conditionLine,
    executionChecklist: [
      `지금 바로 실행: ${doNow}`,
      `오늘 주의 포인트: ${avoidToday}`,
      `컨디션 관리: ${conditionLine}`,
    ],
    notice: sectionValues.notice || undefined,
  };
};

export default function DailyAstrologyPage() {
  const { profile } = useAuthStore();
  const { userProfile } = useConsultStore();
  const todayDateLabel = useMemo(() => toKstDisplayDate(new Date()), []);
  const todayISODate = useMemo(() => toKstISODate(new Date()), []);

  const {
    step,
    loadState,
    selectedSign,
    horoscope,
    errorMessage,
    loadingElapsedSec,
    actionChecks,
    autoSelectNotice,
    setActionChecks,
    requestHoroscope,
    handleRetry,
    handleBackToSelection,
  } = useDailyAstrologyFlow({
    signs: ZODIAC_SIGNS,
    resolveSignFromBirthday,
    requestDate: todayISODate,
    profileMonth: profile?.month,
    profileDay: profile?.day,
    userProfileMonth: userProfile?.month,
    userProfileDay: userProfile?.day,
  });

  const activeLoadingStage = useMemo(
    () => getActiveLoadingStage(loadingElapsedSec),
    [loadingElapsedSec],
  );
  const loadingProgress = useMemo(
    () => Math.min(92, 24 + loadingElapsedSec * 8),
    [loadingElapsedSec],
  );
  const actionBrief = useMemo(
    () => (horoscope ? buildActionBrief(horoscope) : null),
    [horoscope],
  );

  return (
    <AnalysisPageShell
      categoryId="astrology"
      title="오늘의 별자리"
      subtitle="실시간 별자리 운세를 빠르게 확인하세요."
      themeColor="accent-sky"
      icon={MoonStar}
      unicornProjectId="xDa5VQkyT5mbLJGFBYE1"
    >
      <div className="mx-auto max-w-3xl pb-20">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              <div className="rounded-[28px] border border-[#24303F]/10 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#EAF1F7] text-[#24303F]">
                  <MoonStar className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-[#24303F]">
                  별자리를 선택해 주세요
                </h3>
                <p className="text-sm font-medium text-slate-500">
                  선택 즉시 실시간 운세를 조회합니다.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 px-2 sm:grid-cols-3 md:grid-cols-4">
                {ZODIAC_SIGNS.map((sign) => (
                  <button
                    type="button"
                    key={sign.id}
                    aria-label={`select-sign-${sign.id}`}
                    onClick={() => void requestHoroscope(sign)}
                    className="group flex flex-col items-center justify-center rounded-3xl border border-[#24303F]/10 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#C9A86A]"
                  >
                    <span className="mb-3 text-4xl transition-transform duration-300 group-hover:scale-110">
                      {sign.symbol}
                    </span>
                    <span className="mb-1 font-bold text-[#24303F]">{sign.ko}</span>
                    <span className="text-xs font-semibold text-slate-500">{sign.date}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center rounded-[28px] border border-[#24303F]/10 bg-white p-8 text-center shadow-sm">
                <span className="mb-4 text-7xl">{selectedSign?.symbol}</span>
                <h2 className="mb-2 text-3xl font-black tracking-tight text-[#24303F]">
                  {selectedSign?.ko} 오늘
                </h2>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                  <p className="rounded-full border border-[#24303F]/15 bg-[#EAF1F7] px-4 py-1.5 text-xs font-bold text-[#24303F]">
                    기준일: {todayDateLabel} (KST)
                  </p>
                  {autoSelectNotice ? (
                    <p className="rounded-full border border-[#BFD0C7] bg-[#BFD0C7]/30 px-4 py-1.5 text-xs font-bold text-[#24303F]">
                      {autoSelectNotice}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="min-h-[300px] rounded-[28px] border border-[#24303F]/10 bg-white p-6 shadow-sm lg:p-10">
                {loadState === "loading" ? (
                  <div className="flex min-h-[240px] flex-col justify-center gap-6">
                    <div className="space-y-2">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#C9A86A] transition-all duration-700"
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
                              <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-[#C9A86A]" />
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
                      message={errorMessage ?? "실시간 결과를 아직 제공하지 못했습니다. 잠시 후 다시 시도해 주세요."}
                      onRetry={handleRetry}
                    />
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      보정 리포트는 제공하지 않습니다. 실시간 응답만 표시합니다.
                    </div>
                  </div>
                ) : null}

                {loadState === "success" && horoscope ? (
                  <AdGate enabled={true} countdownSec={5}>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                    <section className="rounded-2xl border border-[#24303F]/10 bg-[#EAF1F7] p-5">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#24303F]">
                        Today Quick Brief
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-[#24303F]">
                        {actionBrief?.oneLineConclusion}
                      </h3>
                      <p className="mt-2 text-sm font-semibold text-slate-600">{actionBrief?.focusTime}</p>
                    </section>

                    {actionBrief ? (
                      <div className="space-y-5">
                        <section className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
                          <div className="mb-4 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-[#C9A86A]" />
                            <h4 className="text-lg font-bold text-[#24303F]">실행 포인트</h4>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            <article className="rounded-2xl border border-[#24303F]/10 bg-[#EAF1F7] p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <div className="inline-flex items-center gap-2 text-[#24303F]">
                                  <Target className="h-4 w-4" />
                                  <p className="text-sm font-semibold">지금 할 일 1개</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setActionChecks((prev) => ({ ...prev, doNow: !prev.doNow }))}
                                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${actionChecks.doNow
                                    ? "border-emerald-300 bg-emerald-500 text-white"
                                    : "border-[#24303F]/20 bg-white text-[#24303F]"
                                    }`}
                                >
                                  {actionChecks.doNow ? "체크 완료" : "체크"}
                                </button>
                              </div>
                              <p className="text-sm leading-relaxed text-slate-800">{actionBrief.doNow}</p>
                            </article>

                            <article className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <div className="inline-flex items-center gap-2 text-rose-700">
                                  <AlertTriangle className="h-4 w-4" />
                                  <p className="text-sm font-semibold">오늘 피할 일 1개</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setActionChecks((prev) => ({ ...prev, avoid: !prev.avoid }))}
                                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${actionChecks.avoid
                                    ? "border-emerald-300 bg-emerald-500 text-white"
                                    : "border-rose-200 bg-white text-rose-600"
                                    }`}
                                >
                                  {actionChecks.avoid ? "인지 완료" : "인지"}
                                </button>
                              </div>
                              <p className="text-sm leading-relaxed text-slate-800">{actionBrief.avoidToday}</p>
                            </article>
                          </div>
                        </section>

                        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                          <h4 className="text-sm font-bold">실행 가이드 체크리스트</h4>
                          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
                            {actionBrief.executionChecklist.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ol>
                        </section>

                        <div className="grid gap-4 md:grid-cols-2">
                          <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
                            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1F7] text-[#24303F]">
                              <MessageCircleHeart className="h-4 w-4" />
                            </div>
                            <p className="text-xs font-black uppercase tracking-wider text-[#24303F]">Human Connection</p>
                            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-800">{actionBrief.relationLine}</p>
                          </article>

                          <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
                            <p className="text-xs font-black uppercase tracking-wider text-[#24303F]">Body Rhythm</p>
                            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-800">{actionBrief.conditionLine}</p>
                          </article>
                        </div>


                        {actionBrief.notice ? (
                          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-xs italic text-slate-500">
                            {actionBrief.notice}
                          </section>
                        ) : null}
                      </div>
                    ) : (
                      <div className="prose max-w-none prose-headings:text-[#24303F] prose-p:text-slate-700">
                        <ReactMarkdown>{horoscope}</ReactMarkdown>
                      </div>
                    )}
                  </motion.div>
                  </AdGate>
                ) : null}
              </div>

              <Button
                aria-label="back-to-sign-selection"
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
