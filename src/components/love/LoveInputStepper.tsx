import { ReactNode, useEffect, useMemo, useState } from "react";
import { InteractionCard } from "@/components/common/InteractionCard";
import { Button } from "@/components/ui/button";
import {
  LoveContext,
  LoveContextAnswer,
  LoveRelationMode,
  LoveServiceType,
  LoveSubjectInput,
} from "@/types/love";
import { RelationshipStatusSelector } from "./RelationshipStatusSelector";
import { cn } from "@/lib/utils";
import { normalizeTimeBlockId, TIME_BLOCKS } from "@/lib/timeBlocks";
import { REGION_SIDO_OPTIONS } from "@/lib/koreanRegions";

const DEFAULT_SUBJECT: LoveSubjectInput = {
  calendarType: "solar",
  year: 1990,
  month: 1,
  day: 1,
  birthPrecision: "unknown",
  location: "서울특별시",
  gender: "female",
};

const CONTEXT_TOTAL_STEPS = 3;

type ContextStep = 1 | 2 | 3;

interface ContextOption {
  key: string;
  label: string;
  relationMode?: LoveRelationMode;
  legacyValue?: string;
}

interface ContextQuestion {
  key: string;
  label: string;
  helperText?: string;
  options: ContextOption[];
}

interface ContextQuestionGroup {
  primary: ContextQuestion;
  secondary?: ContextQuestion;
  exactDateLabel?: string;
}

interface ReviewItem {
  step: ContextStep;
  questionKey: string;
  questionLabel: string;
  answerKey: string;
  answerLabel: string;
}

const toDateInput = (subject: LoveSubjectInput) =>
  `${subject.year.toString().padStart(4, "0")}-${subject.month.toString().padStart(2, "0")}-${subject.day
    .toString()
    .padStart(2, "0")}`;

const applyDateInput = (subject: LoveSubjectInput, value: string): LoveSubjectInput => {
  const [year, month, day] = value.split("-").map((item) => Number(item));
  return {
    ...subject,
    year,
    month,
    day,
  };
};

const toTimeInput = (subject: LoveSubjectInput) => {
  if (typeof subject.hour !== "number") {
    return "";
  }
  return `${subject.hour.toString().padStart(2, "0")}:${(subject.minute ?? 0).toString().padStart(2, "0")}`;
};

const applyTimeInput = (subject: LoveSubjectInput, value: string): LoveSubjectInput => {
  if (!value) {
    return {
      ...subject,
      hour: undefined,
      minute: undefined,
    };
  }

  const [hour, minute] = value.split(":").map((item) => Number(item));
  return {
    ...subject,
    hour,
    minute,
  };
};

const normalizeByPrecision = (subject: LoveSubjectInput): LoveSubjectInput => {
  if (subject.birthPrecision === "exact") {
    return {
      ...subject,
      timeBlock: undefined,
      hour: subject.hour ?? 12,
      minute: subject.minute ?? 0,
    };
  }
  if (subject.birthPrecision === "time-block") {
    const normalizedTimeBlock = normalizeTimeBlockId(subject.timeBlock) ?? TIME_BLOCKS[0].id;
    return {
      ...subject,
      hour: undefined,
      minute: undefined,
      timeBlock: normalizedTimeBlock,
    };
  }
  return {
    ...subject,
    hour: undefined,
    minute: undefined,
    timeBlock: "모름",
  };
};

const defaultRelationModeByService = (serviceType: LoveServiceType): LoveRelationMode => {
  if (serviceType === "future-partner") {
    return "solo";
  }
  if (serviceType === "couple-report") {
    return "dating";
  }
  return "crush";
};

const getScenarioQuestion = (serviceType: LoveServiceType): ContextQuestion => {
  if (serviceType === "future-partner") {
    return {
      key: "scenario",
      label: "현재 연애 상태는 무엇에 가까운가요?",
      helperText: "현재 맥락에 가장 가까운 상태를 선택하면 다음 질문이 자동으로 정리됩니다.",
      options: [
        { key: "solo-long", label: "솔로 오래됨", relationMode: "solo", legacyValue: "솔로 오래됨" },
        { key: "recent-breakup", label: "최근 관계 종료", relationMode: "breakup", legacyValue: "최근 관계 종료" },
        { key: "exploring", label: "썸 탐색 중", relationMode: "talking", legacyValue: "썸 탐색 중" },
        { key: "unclear", label: "애매함/모름", relationMode: "solo", legacyValue: "애매함" },
      ],
    };
  }

  if (serviceType === "couple-report") {
    return {
      key: "scenario",
      label: "현재 관계 단계는 어디에 있나요?",
      helperText: "관계 단계에 맞춰 상담 문법과 처방 강도가 달라집니다.",
      options: [
        { key: "talking-phase", label: "썸", relationMode: "talking", legacyValue: "썸" },
        { key: "early-dating", label: "연애 초반", relationMode: "dating", legacyValue: "연애 초반" },
        { key: "long-dating", label: "장기 연애", relationMode: "dating", legacyValue: "장기 연애" },
        { key: "married-life", label: "동거/결혼", relationMode: "married", legacyValue: "동거/결혼" },
        { key: "unclear", label: "애매함/모름", relationMode: "dating", legacyValue: "애매함" },
      ],
    };
  }

  return {
    key: "scenario",
    label: "현재 상황을 먼저 선택해 주세요.",
    helperText: "상황 선택에 따라 필요한 상세 질문이 자동으로 바뀝니다.",
    options: [
      { key: "crush", label: "짝사랑", relationMode: "crush", legacyValue: "짝사랑" },
      { key: "breakup", label: "이별", relationMode: "breakup", legacyValue: "이별" },
      { key: "no-contact", label: "연락두절", relationMode: "no-contact", legacyValue: "연락두절" },
      { key: "unclear", label: "애매함/모름", relationMode: "crush", legacyValue: "애매함" },
    ],
  };
};

const getDetailQuestionGroup = (serviceType: LoveServiceType, scenarioKey?: string): ContextQuestionGroup => {
  if (serviceType === "future-partner") {
    return {
      primary: {
        key: "preferred_style",
        label: "원하는 관계 스타일은 무엇인가요?",
        options: [
          { key: "stable", label: "안정형", legacyValue: "안정형" },
          { key: "spark", label: "설렘형", legacyValue: "설렘형" },
          { key: "practical", label: "현실형", legacyValue: "현실형" },
          { key: "growth", label: "성장형", legacyValue: "성장형" },
          { key: "unclear", label: "아직 모르겠음", legacyValue: "모름" },
        ],
      },
    };
  }

  if (serviceType === "couple-report") {
    return {
      primary: {
        key: "main_concern",
        label: "핵심 고민 주제는 무엇인가요?",
        options: [
          { key: "communication", label: "소통 문제", legacyValue: "소통" },
          { key: "repeated-conflict", label: "갈등 반복", legacyValue: "갈등" },
          { key: "trust", label: "신뢰 이슈", legacyValue: "신뢰" },
          { key: "life-money", label: "생활/돈", legacyValue: "생활·돈" },
          { key: "marriage-path", label: "결혼 방향", legacyValue: "결혼" },
          { key: "unclear", label: "애매함/모름", legacyValue: "모름" },
          { key: "other", label: "기타 (직접 입력)", legacyValue: "기타" },
        ],
      },
    };
  }

  if (scenarioKey === "breakup") {
    return {
      primary: {
        key: "breakup_reason",
        label: "이별 이유는 무엇에 가까웠나요?",
        options: [
          { key: "conflict", label: "갈등 누적", legacyValue: "갈등 누적" },
          { key: "distance", label: "거리/환경 변화", legacyValue: "거리/환경 변화" },
          { key: "priority", label: "가치관/우선순위 차이", legacyValue: "가치관 차이" },
          { key: "external", label: "외부 변수", legacyValue: "외부 변수" },
          { key: "unknown", label: "정확한 정보 없음", legacyValue: "정보 없음" },
        ],
      },
      secondary: {
        key: "breakup_period",
        label: "이별 시점은 언제였나요?",
        options: [
          { key: "within-1m", label: "1개월 이내", legacyValue: "1개월 이내" },
          { key: "1-3m", label: "1~3개월", legacyValue: "1~3개월" },
          { key: "3-6m", label: "3~6개월", legacyValue: "3~6개월" },
          { key: "over-6m", label: "6개월 이상", legacyValue: "6개월 이상" },
          { key: "unknown", label: "정확한 정보 없음", legacyValue: "정보 없음" },
        ],
      },
      exactDateLabel: "정확한 이별일 (선택)",
    };
  }

  if (scenarioKey === "no-contact") {
    return {
      primary: {
        key: "cutoff_owner",
        label: "연락이 끊긴 주체는 누구에 가까운가요?",
        options: [
          { key: "them", label: "상대가 먼저 끊음", legacyValue: "상대가 먼저 끊음" },
          { key: "me", label: "내가 먼저 끊음", legacyValue: "내가 먼저 끊음" },
          { key: "mutual", label: "서로 자연스럽게 끊김", legacyValue: "서로 끊김" },
          { key: "event", label: "특정 사건 이후", legacyValue: "사건 이후" },
          { key: "unknown", label: "정확한 정보 없음", legacyValue: "정보 없음" },
        ],
      },
      secondary: {
        key: "no_contact_period",
        label: "두절 기간은 얼마나 되었나요?",
        options: [
          { key: "under-2w", label: "2주 이내", legacyValue: "2주 이내" },
          { key: "2w-1m", label: "2주~1개월", legacyValue: "2주~1개월" },
          { key: "1-3m", label: "1~3개월", legacyValue: "1~3개월" },
          { key: "over-3m", label: "3개월 이상", legacyValue: "3개월 이상" },
          { key: "unknown", label: "정확한 정보 없음", legacyValue: "정보 없음" },
        ],
      },
      exactDateLabel: "마지막 연락일 (선택)",
    };
  }

  return {
    primary: {
      key: "crush_signal",
      label: "상대 반응 체감은 어떠한가요?",
      options: [
        { key: "positive", label: "호감 신호가 꽤 있음", legacyValue: "호감 신호 있음" },
        { key: "mixed", label: "가끔 신호가 보임", legacyValue: "가끔 신호" },
        { key: "weak", label: "신호가 거의 없음", legacyValue: "신호 약함" },
        { key: "none", label: "반응을 읽기 어려움", legacyValue: "반응 읽기 어려움" },
        { key: "unknown", label: "정확한 정보 없음", legacyValue: "정보 없음" },
      ],
    },
    secondary: {
      key: "contact_frequency",
      label: "연락 빈도는 어느 정도인가요?",
      options: [
        { key: "daily", label: "거의 매일", legacyValue: "거의 매일" },
        { key: "weekly", label: "주 1~2회", legacyValue: "주 1~2회" },
        { key: "monthly", label: "월 1~2회", legacyValue: "월 1~2회" },
        { key: "rare", label: "가끔만", legacyValue: "가끔만" },
        { key: "none", label: "거의 없음", legacyValue: "거의 없음" },
        { key: "unknown", label: "정확한 정보 없음", legacyValue: "정보 없음" },
      ],
    },
  };
};

const getFocusQuestionGroup = (serviceType: LoveServiceType): ContextQuestionGroup => {
  if (serviceType === "future-partner") {
    return {
      primary: {
        key: "future_focus",
        label: "가장 궁금한 포인트는 무엇인가요?",
        options: [
          { key: "timing", label: "언제 인연이 들어오는지", legacyValue: "인연 시점" },
          { key: "person_type", label: "어떤 사람인지", legacyValue: "인연 유형" },
          { key: "my_pattern", label: "내 연애 패턴", legacyValue: "내 패턴" },
          { key: "marriage_potential", label: "결혼 가능성", legacyValue: "결혼 가능성" },
          { key: "unclear", label: "아직 모르겠음", legacyValue: "모름" },
        ],
      },
      secondary: {
        key: "marriage_intent_choice",
        label: "결혼 의향은 어느 쪽인가요?",
        options: [
          { key: "none", label: "없음", legacyValue: "없음" },
          { key: "open", label: "열려 있음", legacyValue: "열려 있음" },
          { key: "strong", label: "강함", legacyValue: "강함" },
          { key: "unclear", label: "아직 모르겠음", legacyValue: "모름" },
        ],
      },
    };
  }

  if (serviceType === "couple-report") {
    return {
      primary: {
        key: "couple_outcome",
        label: "이번 리포트에서 원하는 결과는 무엇인가요?",
        options: [
          { key: "mutual_understanding", label: "서로 이해", legacyValue: "서로 이해" },
          { key: "conflict_relief", label: "갈등 완화", legacyValue: "갈등 완화" },
          { key: "future_direction", label: "앞으로의 방향 판단", legacyValue: "방향 판단" },
          { key: "risk_points", label: "주의점 확인", legacyValue: "주의점 확인" },
          { key: "unclear", label: "아직 모르겠음", legacyValue: "모름" },
        ],
      },
      secondary: {
        key: "relationship_temperature",
        label: "현재 관계 온도는 어느 쪽인가요?",
        options: [
          { key: "stable", label: "안정적", legacyValue: "안정적" },
          { key: "ambiguous", label: "애매함", legacyValue: "애매함" },
          { key: "frequent_clash", label: "자주 충돌", legacyValue: "자주 충돌" },
          { key: "future_anxiety", label: "미래 불안", legacyValue: "미래 불안" },
          { key: "unknown", label: "정확한 정보 없음", legacyValue: "정보 없음" },
        ],
      },
    };
  }

  return {
    primary: {
      key: "reunion_outcome",
      label: "이번 리포트에서 원하는 결과는 무엇인가요?",
      options: [
        { key: "confession_timing", label: "고백 타이밍", legacyValue: "고백 타이밍" },
        { key: "reunion_possibility", label: "재회 가능성", legacyValue: "재회 가능성" },
        { key: "contact_timing", label: "연락 시점", legacyValue: "연락 시점" },
        { key: "clean_finish", label: "정리 필요성", legacyValue: "정리 필요성" },
        { key: "unclear", label: "아직 모르겠음", legacyValue: "모름" },
      ],
    },
  };
};

const findOption = (question: ContextQuestion, answerKey?: string) =>
  question.options.find((option) => option.key === answerKey);

const buildReviewItems = ({
  selections,
  scenarioQuestion,
  detailGroup,
  focusGroup,
  exactDate,
  detailStep,
  focusStep,
}: {
  selections: Record<string, string>;
  scenarioQuestion: ContextQuestion;
  detailGroup: ContextQuestionGroup;
  focusGroup: ContextQuestionGroup;
  exactDate: string;
  detailStep: ContextStep;
  focusStep: ContextStep;
}) => {
  const baseItems: ReviewItem[] = [];
  const pushReview = (question: ContextQuestion | undefined, step: ContextStep) => {
    if (!question) {
      return;
    }
    const answerKey = selections[question.key];
    if (!answerKey) {
      return;
    }
    const option = findOption(question, answerKey);
    let answerLabel = option?.label ?? answerKey;
    if (answerKey === "other" && selections[`${question.key}_custom`]) {
      answerLabel = `기타: ${selections[`${question.key}_custom`]}`;
    }

    baseItems.push({
      step,
      questionKey: question.key,
      questionLabel: question.label,
      answerKey,
      answerLabel,
    });
  };

  pushReview(scenarioQuestion, 1);
  pushReview(detailGroup.primary, detailStep);
  pushReview(detailGroup.secondary, detailStep);
  pushReview(focusGroup.primary, focusStep);
  pushReview(focusGroup.secondary, focusStep);

  if (exactDate) {
    baseItems.push({
      step: detailStep,
      questionKey: "exact_date",
      questionLabel: detailGroup.exactDateLabel ?? "정확한 날짜",
      answerKey: exactDate,
      answerLabel: exactDate,
    });
  }

  return baseItems;
};

interface BirthInputCardProps {
  title: string;
  subject: LoveSubjectInput;
  onChange: (next: LoveSubjectInput) => void;
  readOnly?: boolean;
  noteTag?: string;
  actionSlot?: ReactNode;
}

function BirthInputCard({ title, subject, onChange, readOnly, noteTag, actionSlot }: BirthInputCardProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[16px] font-bold text-foreground">{title}</h3>
          {noteTag ? (
            <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-text-secondary">
              {noteTag}
            </span>
          ) : null}
        </div>
        {actionSlot}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input
          className={cn(
            "h-11 rounded-xl border border-border px-3 text-[14px]",
            readOnly ? "bg-gray-50 text-text-secondary" : "bg-white",
          )}
          value={subject.name ?? ""}
          placeholder="이름(선택)"
          onChange={(event) => onChange({ ...subject, name: event.target.value })}
          disabled={readOnly}
        />
        <select
          className={cn(
            "h-11 rounded-xl border border-border px-3 text-[14px]",
            readOnly ? "bg-gray-50 text-text-secondary" : "bg-white",
          )}
          value={subject.gender}
          onChange={(event) => onChange({ ...subject, gender: event.target.value as LoveSubjectInput["gender"] })}
          disabled={readOnly}
        >
          <option value="female">여성</option>
          <option value="male">남성</option>
        </select>
        <select
          className={cn(
            "h-11 rounded-xl border border-border px-3 text-[14px]",
            readOnly ? "bg-gray-50 text-text-secondary" : "bg-white",
          )}
          value={subject.calendarType}
          onChange={(event) =>
            onChange({ ...subject, calendarType: event.target.value as LoveSubjectInput["calendarType"] })
          }
          disabled={readOnly}
        >
          <option value="solar">양력</option>
          <option value="lunar">음력</option>
          <option value="lunar-leap">음력 윤달</option>
        </select>
        <input
          className={cn(
            "h-11 rounded-xl border border-border px-3 text-[14px]",
            readOnly ? "bg-gray-50 text-text-secondary" : "bg-white",
          )}
          type="date"
          value={toDateInput(subject)}
          onChange={(event) => onChange(applyDateInput(subject, event.target.value))}
          disabled={readOnly}
        />
        <select
          className={cn(
            "h-11 rounded-xl border border-border px-3 text-[14px]",
            readOnly ? "bg-gray-50 text-text-secondary" : "bg-white",
          )}
          value={subject.birthPrecision ?? "unknown"}
          onChange={(event) =>
            onChange({ ...subject, birthPrecision: event.target.value as LoveSubjectInput["birthPrecision"] })
          }
          disabled={readOnly}
        >
          <option value="exact">출생시간 정확히 앎</option>
          <option value="time-block">대략적인 시간대만 앎</option>
          <option value="unknown">출생시간 모름</option>
        </select>
        <select
          className={cn(
            "h-11 rounded-xl border border-border px-3 text-[14px]",
            readOnly ? "bg-gray-50 text-text-secondary" : "bg-white",
          )}
          value={subject.location ?? "서울특별시"}
          onChange={(event) => onChange({ ...subject, location: event.target.value })}
          disabled={readOnly}
        >
          {REGION_SIDO_OPTIONS.map((sido) => (
            <option key={sido} value={sido}>
              {sido}
            </option>
          ))}
        </select>
      </div>

      {subject.birthPrecision === "exact" ? (
        <input
          className={cn(
            "h-11 w-full rounded-xl border border-border px-3 text-[14px]",
            readOnly ? "bg-gray-50 text-text-secondary" : "bg-white",
          )}
          type="time"
          value={toTimeInput(subject)}
          onChange={(event) => onChange(applyTimeInput(subject, event.target.value))}
          disabled={readOnly}
        />
      ) : null}

      {subject.birthPrecision === "time-block" ? (
        <select
          className={cn(
            "h-11 w-full rounded-xl border border-border px-3 text-[14px]",
            readOnly ? "bg-gray-50 text-text-secondary" : "bg-white",
          )}
          value={normalizeTimeBlockId(subject.timeBlock) ?? TIME_BLOCKS[0].id}
          onChange={(event) => onChange({ ...subject, timeBlock: event.target.value })}
          disabled={readOnly}
        >
          {TIME_BLOCKS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label} ({option.range})
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}

interface ContextQuestionCardProps {
  question: ContextQuestion;
  value?: string;
  onChange: (value: string) => void;
}

function ContextQuestionCard({ question, value, onChange }: ContextQuestionCardProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-[#FCFDFE] p-4">
      <div className="space-y-1">
        <p className="text-[14px] font-semibold text-foreground">{question.label}</p>
        {question.helperText ? <p className="text-[12px] text-text-secondary">{question.helperText}</p> : null}
      </div>
      <RelationshipStatusSelector
        value={value}
        onChange={onChange}
        options={question.options.map((option) => ({
          value: option.key,
          label: option.label,
        }))}
      />
    </div>
  );
}

interface LoveInputStepperProps {
  serviceType: LoveServiceType;
  initialSubjectA?: Partial<LoveSubjectInput>;
  isSubmitting?: boolean;
  onSubmit: (payload: {
    subjectA: LoveSubjectInput;
    subjectB?: LoveSubjectInput;
    context: LoveContext;
    relationMode?: LoveRelationMode;
  }) => Promise<void> | void;
}

export function LoveInputStepper({ serviceType, initialSubjectA, isSubmitting, onSubmit }: LoveInputStepperProps) {
  const withPartner = serviceType !== "future-partner";
  const inputDescription = withPartner
    ? "나와 상대 정보를 한 번에 입력하고 바로 분석하세요."
    : "본인 정보를 입력하고 바로 분석하세요.";
  const [subjectA, setSubjectA] = useState<LoveSubjectInput>({ ...DEFAULT_SUBJECT, ...initialSubjectA });
  const [subjectB, setSubjectB] = useState<LoveSubjectInput>({ ...DEFAULT_SUBJECT, gender: "male" });
  const [relationMode, setRelationMode] = useState<LoveRelationMode>(defaultRelationModeByService(serviceType));
  const [contextSelections, setContextSelections] = useState<Record<string, string>>({});
  const [contextExactDate, setContextExactDate] = useState("");
  const [contextAdditionalNote, setContextAdditionalNote] = useState("");
  const [contextStep, setContextStep] = useState<ContextStep>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [isEditingMine, setIsEditingMine] = useState(true);
  const [hydratedFromInitial, setHydratedFromInitial] = useState(false);

  const scenarioQuestion = useMemo(() => getScenarioQuestion(serviceType), [serviceType]);
  const selectedScenario = contextSelections[scenarioQuestion.key];
  const detailGroup = useMemo(
    () => getDetailQuestionGroup(serviceType, selectedScenario),
    [serviceType, selectedScenario],
  );
  const focusGroup = useMemo(() => getFocusQuestionGroup(serviceType), [serviceType]);
  const progress = Math.round((contextStep / CONTEXT_TOTAL_STEPS) * 100);

  const reviewItems = useMemo(
    () =>
      buildReviewItems({
        selections: contextSelections,
        scenarioQuestion,
        detailGroup,
        focusGroup,
        exactDate: contextExactDate,
        detailStep: 1,
        focusStep: 2,
      }),
    [contextSelections, contextExactDate, detailGroup, focusGroup, scenarioQuestion],
  );

  useEffect(() => {
    if (initialSubjectA && !hydratedFromInitial) {
      setSubjectA((prev) => ({ ...prev, ...initialSubjectA }));
      setHydratedFromInitial(true);
    }
  }, [initialSubjectA, hydratedFromInitial]);

  const updateSelection = (questionKey: string, answerKey: string) => {
    setStepError(null);
    setContextSelections((prev) => ({
      ...prev,
      [questionKey]: answerKey,
    }));
  };

  const updateScenario = (answerKey: string) => {
    setStepError(null);
    const selectedOption = findOption(scenarioQuestion, answerKey);
    setRelationMode(selectedOption?.relationMode ?? defaultRelationModeByService(serviceType));
    setContextExactDate("");
    setContextSelections((prev) => {
      if (prev[scenarioQuestion.key] === answerKey) {
        return prev;
      }
      return { [scenarioQuestion.key]: answerKey };
    });
  };

  const validateStep = (step: ContextStep) => {
    if (step === 1) {
      if (!contextSelections[scenarioQuestion.key]) {
        return `${scenarioQuestion.label}을 선택해 주세요.`;
      }
      if (!contextSelections[detailGroup.primary.key]) {
        return `${detailGroup.primary.label}을 선택해 주세요.`;
      }
      if (
        contextSelections[detailGroup.primary.key] === "other" &&
        !contextSelections[`${detailGroup.primary.key}_custom`]?.trim()
      ) {
        return "직접 입력 내용을 한 글자 이상 적어주세요.";
      }
      if (detailGroup.secondary && !contextSelections[detailGroup.secondary.key]) {
        return `${detailGroup.secondary.label}을 선택해 주세요.`;
      }
      return null;
    }

    if (step === 2) {
      if (!contextSelections[focusGroup.primary.key]) {
        return `${focusGroup.primary.label}을 선택해 주세요.`;
      }
      if (focusGroup.secondary && !contextSelections[focusGroup.secondary.key]) {
        return `${focusGroup.secondary.label}을 선택해 주세요.`;
      }
      return null;
    }

    return null;
  };

  const moveNextStep = () => {
    const message = validateStep(contextStep);
    if (message) {
      setStepError(message);
      return;
    }
    setStepError(null);
    setContextStep((prev) => Math.min(CONTEXT_TOTAL_STEPS, prev + 1) as ContextStep);
  };

  const movePrevStep = () => {
    setStepError(null);
    setContextStep((prev) => Math.max(1, prev - 1) as ContextStep);
  };

  const moveToStep = (step: ContextStep) => {
    setStepError(null);
    setContextStep(step);
  };

  const submit = async () => {
    const message = validateStep(2);
    if (message) {
      setStepError(message);
      setContextStep(2);
      return;
    }

    const normalizedA = normalizeByPrecision(subjectA);
    const normalizedB = withPartner ? normalizeByPrecision(subjectB) : undefined;

    const scenarioOption = findOption(scenarioQuestion, contextSelections[scenarioQuestion.key]);
    const outcomeOption = findOption(focusGroup.primary, contextSelections[focusGroup.primary.key]);
    const detailOption = findOption(detailGroup.primary, contextSelections[detailGroup.primary.key]);
    const supportOption = focusGroup.secondary
      ? findOption(focusGroup.secondary, contextSelections[focusGroup.secondary.key])
      : undefined;
    const detailSecondaryOption = detailGroup.secondary
      ? findOption(detailGroup.secondary, contextSelections[detailGroup.secondary.key])
      : undefined;

    const contextAnswers: LoveContextAnswer[] = reviewItems.map((item) => ({
      questionKey: item.questionKey,
      questionLabel: item.questionLabel,
      answerKey: item.answerKey,
      answerLabel: item.answerLabel,
    }));

    const contextSummary =
      contextAnswers.length > 0
        ? contextAnswers.map((item) => `${item.questionLabel}: ${item.answerLabel}`).join(" / ")
        : "관계 맥락 선택 정보 없음";

    const marriageIntentLookup: Record<string, LoveContext["marriageIntent"]> = {
      none: "none",
      open: "open",
      strong: "strong",
    };

    const customDetail = contextSelections[`${detailGroup.primary.key}_custom`];
    const detailLegacyValue =
      detailOption?.key === "other" && customDetail?.trim() ? customDetail.trim() : detailOption?.legacyValue;

    const concernLabels = [detailLegacyValue, detailSecondaryOption?.legacyValue, supportOption?.legacyValue]
      .filter(Boolean)
      .map((item) => String(item));

    const additionalNote = contextAdditionalNote.trim();

    await onSubmit({
      subjectA: normalizedA,
      subjectB: normalizedB,
      context: {
        relationMode: scenarioOption?.relationMode ?? relationMode,
        scenarioKey: contextSelections[scenarioQuestion.key],
        contextAnswers,
        contextSummary,
        additionalNote: additionalNote || undefined,
        currentStatus: scenarioOption?.legacyValue ?? scenarioOption?.label,
        desiredOutcome: outcomeOption?.legacyValue ?? outcomeOption?.label,
        preferredRelationshipStyle:
          serviceType === "future-partner" ? detailOption?.legacyValue ?? detailOption?.label : undefined,
        marriageIntent:
          serviceType === "future-partner" && supportOption
            ? marriageIntentLookup[supportOption.key] ?? undefined
            : undefined,
        concerns:
          serviceType === "couple-report" || serviceType === "crush-reunion"
            ? concernLabels.length > 0
              ? concernLabels
              : undefined
            : undefined,
        lastContactAt: serviceType === "crush-reunion" ? contextExactDate || undefined : undefined,
      },
      relationMode: scenarioOption?.relationMode ?? relationMode,
    });
  };

  return (
    <InteractionCard title="정보 입력" description={inputDescription}>
      {withPartner ? (
        <section className="space-y-4">
          <div className="rounded-2xl border border-[#24303F]/10 bg-[#F8FAFC] p-4 text-[13px] text-text-secondary">
            본인 정보를 바로 확인하고 자유롭게 수정할 수 있습니다.
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <BirthInputCard
              title="본인 정보"
              subject={subjectA}
              onChange={setSubjectA}
              readOnly={!isEditingMine}
              noteTag={initialSubjectA ? "회원정보 자동 입력" : undefined}
              actionSlot={null}
            />
            <BirthInputCard title="상대방 정보" subject={subjectB} onChange={setSubjectB} noteTag="직접 입력" />
          </div>
        </section>
      ) : (
        <BirthInputCard
          title="본인 정보"
          subject={subjectA}
          onChange={setSubjectA}
          readOnly={!isEditingMine}
          noteTag={initialSubjectA ? "회원정보 자동 입력" : undefined}
            actionSlot={null}
        />
      )}

      <div className="space-y-4 rounded-2xl border border-border bg-white p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[15px] font-bold text-foreground">관계 맥락</h3>
            <span className="text-[12px] font-semibold text-text-secondary">
              Step {contextStep} / {CONTEXT_TOTAL_STEPS}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-[#24303F] transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {contextStep === 1 ? (
          <div className="space-y-3">
            <ContextQuestionCard
              question={scenarioQuestion}
              value={contextSelections[scenarioQuestion.key]}
              onChange={updateScenario}
            />
            {selectedScenario ? (
              <>
                <ContextQuestionCard
                  question={detailGroup.primary}
                  value={contextSelections[detailGroup.primary.key]}
                  onChange={(value) => updateSelection(detailGroup.primary.key, value)}
                />
                {contextSelections[detailGroup.primary.key] === "other" ? (
                  <div className="space-y-2 rounded-2xl border border-dashed border-border bg-[#FCFDFE] p-4">
                    <p className="text-[13px] font-semibold text-foreground">구체적인 고민 작성 (기타)</p>
                    <input
                      className="h-11 w-full rounded-xl border border-border px-3 text-[14px]"
                      placeholder="예: 가치관 차이로 인한 잦은 다툼"
                      value={contextSelections[`${detailGroup.primary.key}_custom`] || ""}
                      onChange={(event) => updateSelection(`${detailGroup.primary.key}_custom`, event.target.value)}
                    />
                  </div>
                ) : null}
                {detailGroup.secondary ? (
                  <ContextQuestionCard
                    question={detailGroup.secondary}
                    value={contextSelections[detailGroup.secondary.key]}
                    onChange={(value) => updateSelection(detailGroup.secondary!.key, value)}
                  />
                ) : null}
                {detailGroup.exactDateLabel ? (
                  <div className="space-y-2 rounded-2xl border border-dashed border-border bg-[#FCFDFE] p-4">
                    <p className="text-[13px] font-semibold text-foreground">{detailGroup.exactDateLabel}</p>
                    <p className="text-[12px] text-text-secondary">기간 칩 선택이 기본이며, 필요하면 날짜를 추가로 입력하세요.</p>
                    <input
                      type="date"
                      className="h-11 w-full rounded-xl border border-border px-3 text-[14px]"
                      value={contextExactDate}
                      onChange={(event) => setContextExactDate(event.target.value)}
                    />
                  </div>
                ) : null}
              </>
            ) : null}
            <p className="text-[11px] text-text-secondary">
              💡 이 선택은 리포트의 분석 초점과 톤을 결정합니다.
            </p>
          </div>
        ) : null}

        {contextStep === 2 ? (
          <div className="space-y-3">
            <ContextQuestionCard
              question={focusGroup.primary}
              value={contextSelections[focusGroup.primary.key]}
              onChange={(value) => updateSelection(focusGroup.primary.key, value)}
            />
            {focusGroup.secondary ? (
              <ContextQuestionCard
                question={focusGroup.secondary}
                value={contextSelections[focusGroup.secondary.key]}
                onChange={(value) => updateSelection(focusGroup.secondary!.key, value)}
              />
            ) : null}
            <p className="text-[11px] text-text-secondary">
              💡 관심 포인트에 따라 리포트의 타이밍 예측과 점수 가중치가 달라집니다.
            </p>
          </div>
        ) : null}

        {contextStep === 3 ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-[#FCFDFE] p-4">
              <p className="text-[14px] font-semibold text-foreground">입력 검토</p>
              <p className="mt-1 text-[12px] text-text-secondary">
                선택값은 리포트의 분석 초점, 점수 보정, 상담 톤에 직접 반영됩니다. 필요한 항목만 수정하고 제출하세요.
              </p>
              <div className="mt-3 space-y-2">
                {reviewItems.map((item) => (
                  <div
                    key={`${item.questionKey}-${item.answerKey}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-white px-3 py-2"
                  >
                    <div>
                      <p className="text-[12px] text-text-secondary">{item.questionLabel}</p>
                      <p className="text-[13px] font-semibold text-foreground">{item.answerLabel}</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg border border-border px-3 py-1 text-[12px] font-semibold text-text-secondary hover:bg-gray-50"
                      onClick={() => moveToStep(item.step)}
                    >
                      수정
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2.5">
              <p className="text-[12px] font-semibold text-blue-700">이 선택으로 달라지는 것</p>
              <ul className="mt-1 space-y-0.5 text-[11px] text-blue-600">
                <li>• 리포트 분석 초점과 상담 톤이 선택값에 맞춤 밀착 적용됩니다</li>
                <li>• 관심 포인트와 결혼의향에 따라 점수 가중치가 보정됩니다</li>
                <li>• 시나리오에 따라 각 섹션의 분석 깊이가 달라집니다</li>
              </ul>
            </div>

            <input
              className="h-11 w-full rounded-xl border border-border px-3 text-[14px]"
              placeholder="추가 메모 1줄 (선택)"
              value={contextAdditionalNote}
              onChange={(event) => setContextAdditionalNote(event.target.value)}
            />
          </div>
        ) : null}

        {stepError ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600">
            {stepError}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1"
            disabled={contextStep === 1 || isSubmitting}
            onClick={movePrevStep}
          >
            이전
          </Button>
          {contextStep < CONTEXT_TOTAL_STEPS ? (
            <Button type="button" className="h-11 flex-1 bg-[#24303F] text-white" onClick={moveNextStep}>
              다음
            </Button>
          ) : (
            <Button
              type="button"
              className="h-11 flex-1 bg-[#24303F] text-white"
              disabled={isSubmitting}
              onClick={() => void submit()}
            >
              {isSubmitting
                ? "분석 중..."
                : serviceType === "future-partner"
                  ? "미래 인연 상담 시작"
                  : serviceType === "couple-report"
                    ? "커플 상담 시작"
                    : "재회 가능성 상담 시작"}
            </Button>
          )}
        </div>
      </div>
    </InteractionCard>
  );
}
