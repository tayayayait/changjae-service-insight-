import {
  Activity,
  BarChart3,
  Briefcase,
  Calendar,
  Coins,
  Heart,
  MoonStar,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ServiceType } from "@/store/useConsultStore";
import type { SajuServiceType, UserInterest } from "@/types/result";

export type CategoryKey = "saju" | "astrology" | "love";

export type ServiceAxis =
  | "life-flow"
  | "daeun"
  | "career"
  | "wealth"
  | "relationship"
  | "energy"
  | "execution-calendar"
  | "daily-briefing"
  | "natal-chart"
  | "synastry"
  | "cosmic-calendar"
  | "future-partner"
  | "couple-compatibility"
  | "reunion";

export type ServiceBadgeTier = "core" | "action" | "expand";
const UNIFIED_PAID_REPORT_PRICE_KRW = 2_900;
const UNIFIED_PAID_REPORT_PRICE_TEXT = `₩${UNIFIED_PAID_REPORT_PRICE_KRW.toLocaleString()}`;
const SAJU_UNIFIED_PRICE_TEXT = UNIFIED_PAID_REPORT_PRICE_TEXT;

const SERVICE_IDS = [
  "saju-lifetime-roadmap",
  "saju-daeun-shift",
  "saju-career-timing",
  "saju-wealth-flow",
  "saju-helper-network",
  "saju-energy-balance",
  "saju-yearly-action-calendar",
  "saju-2026-overview",
  "saju-2026-yearly-outlook",
  "saju-2026-study-exam",
  "saju-2026-wealth-business",
  "saju-2026-investment-assets",
  "saju-2026-career-aptitude",
  "saju-2026-health-balance",
  "saju-love-focus",
  "saju-today-briefing",
  "saju-ai-chat",
  "astro-natal",
  "astro-daily",
  "astro-synastry",
  "astro-cosmic-calendar",
  "love-future-partner",
  "love-couple-report",
  "love-crush-reunion",
  "love-synastry-sidecar",
] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];

interface ServiceCardDefinition {
  title: string;
  description: string;
  to: string;
  badge: string;
  icon: LucideIcon;
  accentClassName: string;
  imageUrl?: string;
}

export interface ServiceLandingData {
  title: string;
  description: string;
  badge: string;
  provider: string;
  priceText: string;
  audienceBadge?: string;
  audienceNotice?: string;
  nextPath: string;
  previewFeatures?: { title: string; description: string }[];
  serviceType: ServiceType;
  analysisServiceId?: SajuServiceType;
  initialInterests?: UserInterest[];
}

interface ServiceCatalogDefinition {
  category: CategoryKey;
  tabIds: string[];
  axis: ServiceAxis;
  priority: number;
  badgeTier: ServiceBadgeTier;
  card: ServiceCardDefinition;
  landing?: ServiceLandingData;
  hideFromGrid?: boolean;
}

export interface ServiceCardItem {
  id: ServiceId;
  title: string;
  description: string;
  to: string;
  badge: string;
  icon: LucideIcon;
  accentClassName: string;
  imageUrl?: string;
  tabIds: string[];
  axis: ServiceAxis;
  priority: number;
  badgeTier: ServiceBadgeTier;
}

export interface FortuneSpecialTileItem {
  serviceId: ServiceId;
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
  bgClass: string;
  iconBgClass: string;
  iconColor: string;
  imageUrl?: string;
}

const mkCard = (
  title: string,
  description: string,
  to: string,
  badge: string,
  icon: LucideIcon,
  accentClassName: string,
  imageUrl?: string,
): ServiceCardDefinition => ({
  title,
  description,
  to,
  badge,
  icon,
  accentClassName,
  imageUrl,
});

const mkLanding = (
  title: string,
  nextPath: string,
  serviceType: ServiceType,
  opts?: {
    badge?: string;
    priceText?: string;
    provider?: string;
    audienceBadge?: string;
    audienceNotice?: string;
    description?: string;
    previewFeatures?: { title: string; description: string }[];
    analysisServiceId?: SajuServiceType;
    initialInterests?: UserInterest[];
  },
): ServiceLandingData => ({
  title,
  description:
    opts?.description ??
    `${title}에서 확인할 핵심 신호와 실행 가이드를 먼저 안내합니다.`,
  badge: opts?.badge ?? "core",
  provider: opts?.provider ?? "AI 사주 엔진",
  priceText: opts?.priceText ?? "무료",
  audienceBadge: opts?.audienceBadge,
  audienceNotice: opts?.audienceNotice,
  nextPath,
  previewFeatures: opts?.previewFeatures,
  serviceType,
  analysisServiceId: opts?.analysisServiceId,
  initialInterests: opts?.initialInterests,
});

const SERVICE_CATALOG: Record<ServiceId, ServiceCatalogDefinition> = {
  "saju-lifetime-roadmap": {
    category: "saju",
    tabIds: ["lifetime"],
    axis: "life-flow",
    priority: 1,
    badgeTier: "core",
    card: mkCard(
      "인생 총운 로드맵",
      "초년·중년·후년의 변곡점을 한 장으로 정리해 장기 의사결정 기준을 제공합니다.",
      "/service/saju-lifetime-roadmap",
      "정통",
      MoonStar,
      "border-indigo-200 bg-white",
      "/images/cards/lifetime-roadmap.png",
    ),
    landing: mkLanding("인생 총운 로드맵", "/saju?mode=lifetime", "saju", {
      badge: "정통",
      priceText: SAJU_UNIFIED_PRICE_TEXT,
      analysisServiceId: "saju-lifetime-roadmap",
      description:
        "평생 운의 큰 흐름을 구간별로 분해해 기회 구간, 하락 구간, 회복 구간을 명확히 보여주는 리포트입니다.",
      previewFeatures: [
        {
          title: "인생 3구간 흐름 맵",
          description:
            "초년·중년·후년별로 강점이 열리는 시기와 조정이 필요한 시기를 구분합니다.",
        },
        {
          title: "핵심 전환점 체크",
          description:
            "커리어·관계·재물에서 흐름이 바뀌는 시점을 신호 중심으로 요약합니다.",
        },
        {
          title: "실행 우선순위",
          description:
            "지금 당장 해야 할 선택과 미뤄도 되는 선택을 분리해 과잉 의사결정을 줄입니다.",
        },
      ],
    }),
  },
  "saju-daeun-shift": {
    category: "saju",
    tabIds: ["lifetime"],
    axis: "daeun",
    priority: 2,
    badgeTier: "core",
    card: mkCard(
      "대운 전환 시그널",
      "10년 단위 대운 교체 시점을 짚고, 전환 직전 대비해야 할 리스크를 제시합니다.",
      "/service/saju-daeun-shift",
      "핵심",
      Sparkles,
      "border-accent-lavender bg-white",
      "/images/cards/lifetime-daeun.png",
    ),
    landing: mkLanding("대운 전환 시그널", "/saju?mode=lifetime&focus=daeun", "saju", {
      badge: "핵심",
      priceText: SAJU_UNIFIED_PRICE_TEXT,
      analysisServiceId: "saju-daeun-shift",
      description:
        "대운이 바뀌기 전후의 체감 변화와 실제 사건화 가능성을 연결해 타이밍 대응력을 높이는 리포트입니다.",
      previewFeatures: [
        {
          title: "전환 시작 시점",
          description: "대운 교체가 체감되기 시작하는 구간과 안정화되는 구간을 구분합니다.",
        },
        {
          title: "리스크 타입 분류",
          description: "관계·재물·커리어 중 어디에서 충격이 먼저 나타나는지 우선순위를 제공합니다.",
        },
        {
          title: "선제 대응 가이드",
          description: "전환기 손실을 줄이기 위한 준비 행동을 단계별로 제시합니다.",
        },
      ],
    }),
  },
  "saju-career-timing": {
    category: "saju",
    tabIds: ["lifetime"],
    axis: "career",
    priority: 3,
    badgeTier: "action",
    card: mkCard(
      "커리어 타이밍 리포트",
      "이직·승진·직무 전환의 공격 구간과 보수 구간을 분리해 제시합니다.",
      "/service/saju-career-timing",
      "실행",
      Briefcase,
      "border-blue-200 bg-white",
      "/images/cards/lifetime-career.png",
    ),
    landing: mkLanding("커리어 타이밍 리포트", "/saju?mode=lifetime&focus=career", "saju", {
      badge: "실행",
      priceText: SAJU_UNIFIED_PRICE_TEXT,
      analysisServiceId: "saju-career-timing",
      description:
        "커리어 이벤트를 언제 강하게 밀어붙이고 언제 리스크 관리 중심으로 운영해야 하는지 시기별로 안내합니다.",
      previewFeatures: [
        {
          title: "커리어 골든타임",
          description: "지원·면접·협상·이직에 유리한 시기를 우선순위로 정리합니다.",
        },
        {
          title: "조정 구간 알림",
          description: "성과가 정체되기 쉬운 구간과 무리수 위험이 높은 구간을 사전에 표시합니다.",
        },
        {
          title: "실행 시나리오",
          description: "각 시기별 추천 전략을 보수/공격 시나리오로 나눠 제공합니다.",
        },
      ],
    }),
  },
  "saju-wealth-flow": {
    category: "saju",
    tabIds: ["lifetime"],
    axis: "wealth",
    priority: 4,
    badgeTier: "action",
    card: mkCard(
      "재물 흐름 레이더",
      "수입 확장 구간과 지출 리스크 구간을 분리해 재무 판단 타이밍을 잡아줍니다.",
      "/service/saju-wealth-flow",
      "실행",
      Coins,
      "border-amber-200 bg-white",
      "/images/cards/lifetime-wealth.png",
    ),
    landing: mkLanding("재물 흐름 레이더", "/saju?mode=lifetime&focus=wealth", "saju", {
      badge: "실행",
      priceText: SAJU_UNIFIED_PRICE_TEXT,
      analysisServiceId: "saju-wealth-flow",
      description:
        "돈이 모이는 구간과 새는 구간을 분리해 자산 운영의 속도와 방식을 조정하도록 설계된 리포트입니다.",
      previewFeatures: [
        {
          title: "수익/지출 파동 분석",
          description: "현금흐름이 좋아지는 시기와 과소비 리스크가 커지는 시기를 함께 보여줍니다.",
        },
        {
          title: "의사결정 타이밍",
          description: "투자·소비·정리 중 어떤 선택을 우선해야 할지 시기별 기준을 제공합니다.",
        },
        {
          title: "리스크 방어선",
          description: "재물 손실이 반복되기 쉬운 패턴을 짚고 차단 규칙을 제안합니다.",
        },
      ],
    }),
  },
  "saju-helper-network": {
    category: "saju",
    tabIds: ["lifetime"],
    axis: "relationship",
    priority: 5,
    badgeTier: "expand",
    card: mkCard(
      "관계·귀인 네트워크",
      "도움을 주는 관계군과 에너지를 소모시키는 관계 신호를 구분해 보여줍니다.",
      "/service/saju-helper-network",
      "확장",
      Users,
      "border-green-200 bg-white",
      "/images/cards/lifetime-network.png",
    ),
    landing: mkLanding("관계·귀인 네트워크", "/saju?mode=lifetime&focus=relationship", "saju", {
      badge: "확장",
      priceText: SAJU_UNIFIED_PRICE_TEXT,
      analysisServiceId: "saju-helper-network",
      description:
        "인맥 수를 늘리는 관점이 아니라, 실제로 성장에 기여하는 귀인 네트워크를 식별하는 데 초점을 맞춘 리포트입니다.",
      previewFeatures: [
        {
          title: "귀인 유형 식별",
          description: "지금 시점에 도움이 되는 사람의 성향과 접점 채널을 구체화합니다.",
        },
        {
          title: "관계 리스크 경보",
          description: "갈등·소모 가능성이 높은 관계 패턴을 사전에 감지합니다.",
        },
        {
          title: "연결 전략",
          description: "유지할 관계, 확장할 관계, 정리할 관계의 실행 기준을 제공합니다.",
        },
      ],
    }),
  },
  "saju-energy-balance": {
    category: "saju",
    tabIds: ["lifetime"],
    axis: "energy",
    priority: 6,
    badgeTier: "expand",
    card: mkCard(
      "적성·에너지 밸런스",
      "오행 불균형과 에너지 소모 패턴을 분석해 적합한 일 방식과 회복 루틴을 제시합니다.",
      "/service/saju-energy-balance",
      "확장",
      Sparkles,
      "border-purple-200 bg-white",
      "/images/cards/lifetime-energy.png",
    ),
    landing: mkLanding("적성·에너지 밸런스", "/saju?mode=lifetime&focus=energy", "saju", {
      badge: "확장",
      priceText: SAJU_UNIFIED_PRICE_TEXT,
      analysisServiceId: "saju-energy-balance",
      description:
        "강점만 강조하지 않고 에너지 누수 지점을 함께 분석해 지속 가능한 퍼포먼스 전략을 세우는 리포트입니다.",
      previewFeatures: [
        {
          title: "에너지 프로파일",
          description: "집중이 잘되는 상황과 쉽게 방전되는 상황을 구조적으로 정리합니다.",
        },
        {
          title: "적성 매칭 포인트",
          description: "업무 성향·학습 방식·관계 방식에서 맞는 환경 조건을 제시합니다.",
        },
        {
          title: "밸런스 회복 루틴",
          description: "실행 가능한 회복 루틴과 피로 누적 방지 규칙을 함께 제공합니다.",
        },
      ],
    }),
  },
  "saju-yearly-action-calendar": {
    category: "saju",
    tabIds: ["lifetime", "new-year"],
    axis: "execution-calendar",
    priority: 7,
    badgeTier: "expand",
    card: mkCard(
      "연간 실행 캘린더",
      "월별로 해야 할 일과 미루면 손해인 결정을 캘린더 형태로 정리합니다.",
      "/service/saju-yearly-action-calendar",
      "실행",
      Sparkles,
      "border-violet-200 bg-white",
      "/images/cards/lifetime-calendar.png",
    ),
    landing: mkLanding("연간 실행 캘린더", "/saju?mode=lifetime&focus=calendar", "saju", {
      badge: "실행",
      priceText: SAJU_UNIFIED_PRICE_TEXT,
      analysisServiceId: "saju-yearly-action-calendar",
      description:
        "연 단위 운세를 월별 실행 계획으로 변환해 실제 일정과 의사결정에 바로 적용할 수 있도록 만든 리포트입니다.",
      previewFeatures: [
        {
          title: "월별 우선 과제",
          description: "각 달마다 선행해야 할 액션과 보류해야 할 액션을 분리합니다.",
        },
        {
          title: "리스크 구간 표시",
          description: "실수 비용이 커지는 달과 조정이 필요한 주제를 미리 알립니다.",
        },
        {
          title: "실행 체크리스트",
          description: "월간 루틴으로 반복 적용 가능한 실행 점검 항목을 제공합니다.",
        },
      ],
    }),
  },
  "saju-2026-overview": {
    category: "saju",
    tabIds: ["new-year"],
    axis: "life-flow",
    priority: 20,
    badgeTier: "expand",
    card: mkCard(
      "2026 종합 운세",
      "2026년 핵심 기회와 위험 구간을 분기별로 요약해 연간 전략의 기준점을 제공합니다.",
      "/service/saju-2026-overview",
      "2026",
      BarChart3,
      "border-blue-200 bg-white",
    ),
    landing: mkLanding("2026 종합 운세", "/saju?mode=new-year-2026&focus=overview", "saju", {
      badge: "2026",
      priceText: SAJU_UNIFIED_PRICE_TEXT,
      analysisServiceId: "saju-2026-overview",
      initialInterests: [],
      description:
        "한 해 전체 흐름을 먼저 조망하고, 세부 리포트로 내려가기 전에 올해의 주도권이 어디에 있는지 확인하는 요약형 리포트입니다.",
      previewFeatures: [
        {
          title: "분기별 흐름 브리핑",
          description: "2026년을 4개 구간으로 나눠 상승·정체·조정 패턴을 보여줍니다.",
        },
        {
          title: "핵심 주제 우선순위",
          description: "재물·커리어·관계·건강 중 올해 집중해야 할 주제를 제시합니다.",
        },
        {
          title: "연간 실행 방향",
          description: "보수 운영이 필요한 구간과 확장 운영이 가능한 구간을 구분합니다.",
        },
      ],
    }),
  },
  "saju-2026-yearly-outlook": {
    category: "saju",
    tabIds: [],
    axis: "execution-calendar",
    priority: 90,
    badgeTier: "expand",
    card: mkCard(
      "2026 연간 전망",
      "2026년 연중 주요 전환 이벤트를 시계열로 정리해 대응 순서를 제공합니다.",
      "/service/saju-2026-yearly-outlook",
      "2026",
      Calendar,
      "border-indigo-200 bg-white",
    ),
    landing: mkLanding(
      "2026 연간 전망",
      "/saju?mode=new-year-2026&focus=yearly-outlook",
      "saju",
      {
        badge: "2026",
        priceText: SAJU_UNIFIED_PRICE_TEXT,
        analysisServiceId: "saju-2026-yearly-outlook",
        initialInterests: [],
        description:
          "연초부터 연말까지 사건화 가능성이 높은 구간을 시간순으로 정리해 장기 일정 운영에 바로 쓰는 리포트입니다.",
        previewFeatures: [
          {
            title: "시기별 변화 이벤트",
            description: "분기마다 변동성이 커지는 포인트를 먼저 잡아줍니다.",
          },
          {
            title: "대응 시나리오",
            description: "기회 확대형과 리스크 방어형 대응안을 구간별로 제공합니다.",
          },
        ],
      },
    ),
  },
  "saju-2026-study-exam": {
    category: "saju",
    tabIds: ["new-year"],
    axis: "execution-calendar",
    priority: 21,
    badgeTier: "expand",
    card: mkCard(
      "2026 학업/시험운",
      "집중력 상승 구간과 성과 저하 구간을 구분해 학습 전략과 시험 타이밍을 제시합니다.",
      "/service/saju-2026-study-exam",
      "2026",
      Calendar,
      "border-sky-200 bg-white",
    ),
    landing: mkLanding("2026 학업/시험운", "/saju?mode=new-year-2026&focus=study-exam", "saju", {
      badge: "2026",
      priceText: SAJU_UNIFIED_PRICE_TEXT,
      analysisServiceId: "saju-2026-study-exam",
      initialInterests: ["study"],
      description:
        "학습 효율이 올라가는 시기와 점수 변동 리스크가 큰 구간을 분리해 시험 준비 전략을 현실적으로 설계하는 리포트입니다.",
      previewFeatures: [
        {
          title: "학습 집중 구간",
          description: "개념 학습, 문제풀이, 실전 점검에 유리한 시기를 분리합니다.",
        },
        {
          title: "시험 대응 포인트",
          description: "실수 위험이 커지는 시점과 루틴 조정이 필요한 구간을 안내합니다.",
        },
      ],
    }),
  },
  "saju-2026-wealth-business": {
    category: "saju",
    tabIds: ["new-year"],
    axis: "wealth",
    priority: 23,
    badgeTier: "expand",
    card: mkCard(
      "2026 사업자 재물/사업운",
      "사업 운영자 기준으로 매출 확장 타이밍과 현금흐름 리스크 구간을 정리해 의사결정을 돕습니다.",
      "/service/saju-2026-wealth-business",
      "2026",
      Coins,
      "border-amber-200 bg-white",
    ),
    landing: mkLanding(
      "2026 사업자 재물/사업운",
      "/saju?mode=new-year-2026&focus=wealth-business",
      "saju",
      {
        badge: "2026",
        priceText: SAJU_UNIFIED_PRICE_TEXT,
        audienceBadge: "사업자 전용",
        audienceNotice:
          "자영업·프리랜서·법인 운영자처럼 직접 매출, 비용, 운영 책임을 지는 사용자를 기준으로 해석합니다.",
        analysisServiceId: "saju-2026-wealth-business",
        initialInterests: ["money", "business"],
        description:
          "사업 중이거나 직접 매출과 비용을 관리하는 사용자를 위한 리포트입니다. 수익 확대 기회와 손실 위험 구간을 같은 축에서 비교해 사업과 재무 전략의 속도를 맞춥니다.",
        previewFeatures: [
          {
            title: "확장/수축 구간",
            description: "공격적 확장이 유리한 시기와 방어 운영이 필요한 시기를 구분합니다.",
          },
          {
            title: "현금흐름 방어선",
            description: "자금 압박 리스크가 높아지는 구간의 대응 규칙을 제공합니다.",
          },
        ],
      },
    ),
  },
  "saju-2026-investment-assets": {
    category: "saju",
    tabIds: ["new-year"],
    axis: "wealth",
    priority: 24,
    badgeTier: "expand",
    card: mkCard(
      "2026 투자/자산운",
      "투자 실행 구간과 관망 구간을 분리해 자산 배분 결정을 체계화합니다.",
      "/service/saju-2026-investment-assets",
      "2026",
      BarChart3,
      "border-teal-200 bg-white",
    ),
    landing: mkLanding(
      "2026 투자/자산운",
      "/saju?mode=new-year-2026&focus=investment-assets",
      "saju",
      {
        badge: "2026",
        priceText: SAJU_UNIFIED_PRICE_TEXT,
        analysisServiceId: "saju-2026-investment-assets",
        initialInterests: ["money", "realestate"],
        description:
          "부동산·주식·현금 비중을 언제 조정해야 하는지 타이밍 중심으로 제안해 과도한 추격 매수를 줄이는 리포트입니다.",
        previewFeatures: [
          {
            title: "자산별 유불리 시점",
            description: "주요 자산군별로 공격/관망/정리의 기준 시점을 제공합니다.",
          },
          {
            title: "리스크 관리 규칙",
            description: "변동성이 커지는 구간에서 손실을 제한하는 운영 기준을 제시합니다.",
          },
        ],
      },
    ),
  },
  "saju-2026-career-aptitude": {
    category: "saju",
    tabIds: ["new-year"],
    axis: "career",
    priority: 25,
    badgeTier: "expand",
    card: mkCard(
      "2026 직업/적성운",
      "직무 적합도와 조직 내 입지 변화 신호를 함께 분석해 커리어 방향을 제시합니다.",
      "/service/saju-2026-career-aptitude",
      "2026",
      Briefcase,
      "border-slate-200 bg-white",
    ),
    landing: mkLanding(
      "2026 직업/적성운",
      "/saju?mode=new-year-2026&focus=career-aptitude",
      "saju",
      {
        badge: "2026",
        priceText: SAJU_UNIFIED_PRICE_TEXT,
        analysisServiceId: "saju-2026-career-aptitude",
        initialInterests: ["career", "path"],
        description:
          "올해 커리어에서 역할을 넓혀야 할지, 전문성 깊이를 확보해야 할지 방향을 판단하도록 돕는 리포트입니다.",
        previewFeatures: [
          {
            title: "역할 확장 신호",
            description: "직무 전환·리더십 기회·협업 구조 변화 가능성을 점검합니다.",
          },
          {
            title: "적성 정합도 점검",
            description: "현재 업무 방식과 성향의 충돌 지점을 파악해 보완 방향을 제안합니다.",
          },
        ],
      },
    ),
  },
  "saju-2026-health-balance": {
    category: "saju",
    tabIds: ["new-year"],
    axis: "energy",
    priority: 26,
    badgeTier: "expand",
    card: mkCard(
      "2026 건강운",
      "컨디션 회복 구간과 과로 경고 구간을 구분해 생활 리듬 조정 기준을 제공합니다.",
      "/service/saju-2026-health-balance",
      "2026",
      Activity,
      "border-rose-200 bg-white",
    ),
    landing: mkLanding(
      "2026 건강운",
      "/saju?mode=new-year-2026&focus=health-balance",
      "saju",
      {
        badge: "2026",
        priceText: SAJU_UNIFIED_PRICE_TEXT,
        analysisServiceId: "saju-2026-health-balance",
        initialInterests: ["health"],
        description:
          "체력·집중력·정서 에너지의 변동 구간을 연간 일정과 연결해 무리 없는 페이스를 설계하도록 돕는 리포트입니다.",
        previewFeatures: [
          {
            title: "회복 우선 구간",
            description: "강도 조절이 필요한 시기와 과부하 위험 구간을 먼저 안내합니다.",
          },
          {
            title: "리듬 관리 체크포인트",
            description: "수면·활동·업무 루틴 조정 포인트를 실행 기준으로 제공합니다.",
          },
        ],
      },
    ),
  },
  "saju-love-focus": {
    category: "saju",
    tabIds: ["new-year"],
    axis: "relationship",
    priority: 22,
    badgeTier: "expand",
    card: mkCard(
      "2026 연애/결혼운",
      "새 인연 유입 시기와 기존 관계의 전환 신호를 분리해 연애 의사결정 기준을 제시합니다.",
      "/service/saju-love-focus",
      "2026",
      Heart,
      "border-pink-200 bg-white",
    ),
    landing: mkLanding("2026 연애/결혼운", "/saju?mode=new-year-2026&focus=love", "saju", {
      badge: "2026",
      priceText: SAJU_UNIFIED_PRICE_TEXT,
      analysisServiceId: "saju-love-focus",
      initialInterests: ["love"],
      description:
        "연애·결혼 이슈를 감정이 아닌 타이밍과 관계 신호 중심으로 읽어 선택 비용을 줄이는 리포트입니다.",
      previewFeatures: [
        {
          title: "관계 전환 시점",
          description: "새로운 인연, 관계 심화, 거리 조정이 필요한 타이밍을 구분합니다.",
        },
        {
          title: "실행 우선순위",
          description: "지금 해야 할 행동과 보류해야 할 행동을 명확한 기준으로 제공합니다.",
        },
      ],
    }),
  },
  "saju-today-briefing": {
    category: "saju",
    tabIds: ["today"],
    axis: "daily-briefing",
    priority: 8,
    badgeTier: "expand",
    card: mkCard(
      "오늘의 운세 브리핑",
      "오늘 하루의 핵심 변수와 행동 우선순위를 빠르게 확인할 수 있는 일일 리포트입니다.",
      "/service/saju-today-briefing",
      "오늘",
      MoonStar,
      "border-gray-200 bg-white",
    ),
    landing: mkLanding("오늘의 운세 브리핑", "/saju?mode=today", "saju", {
      badge: "오늘",
      priceText: "무료",
      analysisServiceId: "traditional-saju",
      description:
        "오늘의 감정선·관계·재물·업무 흐름을 요약해 즉시 적용 가능한 행동 가이드를 제공하는 데일리 브리핑입니다.",
      previewFeatures: [
        {
          title: "오늘의 핵심 신호",
          description: "가장 영향력이 큰 운세 변수를 우선순위로 정리합니다.",
        },
        {
          title: "즉시 실행 가이드",
          description: "오늘 바로 적용 가능한 행동 팁과 피해야 할 선택을 제공합니다.",
        },
      ],
    }),
  },
  "saju-ai-chat": {
    category: "saju",
    tabIds: ["lifetime", "today"],
    axis: "life-flow",
    priority: 9,
    badgeTier: "expand",
    hideFromGrid: true,
    card: mkCard("AI 사주 상담", "AI 명리학자와의 1:1 대화를 통해 궁금한 점을 즉시 해소하고 조언을 얻습니다.", "/chat", "AI", Sparkles, "border-indigo-400 bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-900 shadow-sm"),
    landing: mkLanding("AI 사주 상담", "/chat", "saju", { badge: "AI", priceText: "10회권 2,000원" }),
  },
  "astro-natal": {
    category: "astrology",
    tabIds: [],
    axis: "natal-chart",
    priority: 1,
    badgeTier: "core",
    card: mkCard(
      "인생 설계도",
      "출생 시점의 행성 배치를 기반으로 성향, 강점, 관계 패턴을 구조적으로 해석합니다.",
      "/astrology",
      "별자리",
      Sparkles,
      "border-accent-coral bg-white",
    ),
    landing: mkLanding("인생 설계도", "/astrology", "astrology", {
      badge: "별자리",
      provider: "정통 점성술",
      priceText: UNIFIED_PAID_REPORT_PRICE_TEXT,
      description:
        "출생 차트 기반으로 성향과 잠재력, 관계 패턴을 정리해 자기이해의 기준점을 제공하는 점성술 리포트입니다.",
      previewFeatures: [
        {
          title: "행성 배치 요약",
          description: "태양·달·상승궁을 중심으로 성향의 핵심 축을 압축 정리합니다.",
        },
        {
          title: "강점/보완 포인트",
          description: "타고난 강점과 반복 충돌 패턴을 함께 분석해 해석 정확도를 높입니다.",
        },
      ],
    }),
  },
  "astro-daily": {
    category: "astrology",
    tabIds: [],
    axis: "daily-briefing",
    priority: 2,
    badgeTier: "action",
    card: mkCard("오늘의 별자리", "매일 업데이트되는 행성의 위치를 바탕으로 하루의 감정선과 행운을 확인하세요.", "/astrology/daily", "오늘", MoonStar, "border-purple-200 bg-white"),
  },
  "astro-synastry": {
    category: "astrology",
    tabIds: [],
    axis: "synastry",
    priority: 3,
    badgeTier: "action",
    hideFromGrid: true,
    card: mkCard("별자리 궁합", "두 사람의 점성학적 특성을 조립하여 관계의 역동성과 조화의 정도를 진단합니다.", "/astrology/synastry", "궁합", Sparkles, "border-blue-300 bg-white"),
  },
  "astro-cosmic-calendar": {
    category: "astrology",
    tabIds: [],
    axis: "cosmic-calendar",
    priority: 4,
    badgeTier: "expand",
    card: mkCard("운세 예보", "주요 행성의 이동과 달의 위상 변화가 나의 삶에 미치는 영향을 월별로 안내합니다.", "/astrology/calendar", "연간", Sparkles, "border-gray-200 bg-white"),
  },
  "love-future-partner": {
    category: "love",
    tabIds: ["solo"],
    axis: "future-partner",
    priority: 1,
    badgeTier: "core",
    card: mkCard(
      "미래 배우자",
      "미래 배우자의 성향·만남 채널·인연 유입 시기를 예측해 준비 전략을 제시합니다.",
      "/service/love-future-partner",
      "연애운",
      Heart,
      "border-accent-pink bg-white",
    ),
    landing: mkLanding("미래 배우자", "/love/future-partner", "love", {
      badge: "연애운",
      provider: "AI 연애 리포트 엔진",
      priceText: UNIFIED_PAID_REPORT_PRICE_TEXT,
      description:
        "누굴 만나야 하는지, 어디서 인연이 들어오는지, 무엇을 기준으로 걸러야 하는지를 실행형으로 정리한 리포트입니다.",
      previewFeatures: [
        {
          title: "배우자상 프로파일",
          description: "외형보다 관계 지속성에 영향을 주는 성향·가치관 합의력을 중심으로 분석합니다.",
        },
        {
          title: "만남 유입 채널",
          description: "인연이 들어올 가능성이 높은 환경과 시기를 구체적으로 제시합니다.",
        },
        {
          title: "초기 필터링 규칙",
          description: "관계 비용을 줄이기 위한 첫 대화 체크 기준과 경고 신호를 제공합니다.",
        },
      ],
    }),
  },
  "love-couple-report": {
    category: "love",
    tabIds: ["couple"],
    axis: "couple-compatibility",
    priority: 2,
    badgeTier: "action",
    card: mkCard(
      "커플 궁합",
      "갈등 트리거·대화 속도·합의 구조를 분석해 관계 회복 실행안을 제공합니다.",
      "/service/love-couple-report",
      "궁합",
      Sparkles,
      "border-indigo-200 bg-white",
    ),
    landing: mkLanding("커플 궁합", "/love/couple-report", "love", {
      badge: "궁합",
      provider: "AI 연애 리포트 엔진",
      priceText: UNIFIED_PAID_REPORT_PRICE_TEXT,
      description:
        "잘 맞는다/안 맞는다 수준을 넘어서, 왜 반복 충돌이 생기는지와 어떻게 회복할지를 구조적으로 다루는 관계 리포트입니다.",
      previewFeatures: [
        {
          title: "갈등 트리거 맵",
          description: "반복 충돌이 발생하는 상황과 감정 버튼을 원인별로 분해합니다.",
        },
        {
          title: "대화/합의 프로토콜",
          description: "갈등 완화에 유효한 대화 순서와 합의 체크리스트를 제시합니다.",
        },
        {
          title: "7일 회복 루틴",
          description: "관계 온도를 안정화하는 단기 실행 루틴과 금지 문장을 제공합니다.",
        },
      ],
    }),
  },
  "love-crush-reunion": {
    category: "love",
    tabIds: ["crush"],
    axis: "reunion",
    priority: 3,
    badgeTier: "action",
    card: mkCard(
      "재회 가능성",
      "재접촉 가능 창·중단 조건·문장 가이드를 함께 제시하는 손실 통제형 리포트입니다.",
      "/service/love-crush-reunion",
      "재회",
      MoonStar,
      "border-gray-800 bg-white text-gray-800",
    ),
    landing: mkLanding("재회 가능성", "/love/crush-reunion", "love", {
      badge: "재회",
      provider: "AI 연애 리포트 엔진",
      priceText: UNIFIED_PAID_REPORT_PRICE_TEXT,
      description:
        "희망고문성 해석을 배제하고 재회 가능성, 위험도, 중단 기준을 동시에 제시해 손실을 통제하는 의사결정 리포트입니다.",
      previewFeatures: [
        {
          title: "가능성 3단계 판정",
          description:
            "가능성 있음 / 제한적 / 확실한 정보 없음 중 현재 상태를 명확하게 판정합니다.",
        },
        {
          title: "재접촉 타이밍",
          description: "연락 시도에 유리한 창과 피해야 할 구간을 시점 기준으로 제공합니다.",
        },
        {
          title: "중단(손절) 규칙",
          description: "관계 손실이 커지기 전에 멈춰야 하는 신호와 금지 행동을 제시합니다.",
        },
      ],
    }),
  },
  "love-synastry-sidecar": {
    category: "love",
    tabIds: ["couple"],
    axis: "synastry",
    priority: 4,
    badgeTier: "expand",
    card: mkCard("별자리 궁합 상세", "두 사람의 점성학적 상호작용을 파악하여 궁합의 보완점을 깊이 분석합니다.", "/astrology/synastry", "별자리", Sparkles, "border-sky-200 bg-white"),
  },
};

const NEW_YEAR_FORTUNE_TILE_DEFINITIONS: Array<
  Omit<FortuneSpecialTileItem, "to" | "description"> & { serviceId: ServiceId }
> = [
  { serviceId: "saju-2026-overview", title: "종합 운세", icon: Sparkles, bgClass: "bg-amber-50/30 border-amber-100/50", iconBgClass: "bg-amber-100", iconColor: "text-amber-700", imageUrl: "/images/cards/newyear-overview.png" },
  { serviceId: "saju-2026-study-exam", title: "학업/시험운", icon: Calendar, bgClass: "bg-sky-50/50 border-sky-100", iconBgClass: "bg-sky-100", iconColor: "text-sky-700", imageUrl: "/images/cards/newyear-yearly.png" },
  { serviceId: "saju-love-focus", title: "연애운", icon: Heart, bgClass: "bg-rose-50/30 border-rose-100/50", iconBgClass: "bg-rose-100", iconColor: "text-rose-600", imageUrl: "/images/cards/newyear-love.png" },
  { serviceId: "saju-2026-wealth-business", title: "사업자 재물/사업운", icon: Coins, bgClass: "bg-amber-50/50 border-amber-200/50", iconBgClass: "bg-amber-200/50", iconColor: "text-amber-800", imageUrl: "/images/cards/newyear-wealth.png" },
  { serviceId: "saju-2026-investment-assets", title: "투자/자산운", icon: BarChart3, bgClass: "bg-teal-50/40 border-teal-100/60", iconBgClass: "bg-teal-100", iconColor: "text-teal-700", imageUrl: "/images/cards/newyear-investment.png" },
  { serviceId: "saju-2026-career-aptitude", title: "직업/적성운", icon: Briefcase, bgClass: "bg-indigo-50/30 border-indigo-100/50", iconBgClass: "bg-indigo-100", iconColor: "text-indigo-700", imageUrl: "/images/cards/newyear-career.png" },
  { serviceId: "saju-2026-health-balance", title: "건강운", icon: Activity, bgClass: "bg-emerald-50/30 border-emerald-100/50", iconBgClass: "bg-emerald-100", iconColor: "text-emerald-700", imageUrl: "/images/cards/newyear-health.png" },
];


const toServiceCardItem = (id: ServiceId, item: ServiceCatalogDefinition): ServiceCardItem => ({
  id,
  title: item.card.title,
  description: item.card.description,
  to: item.card.to,
  badge: item.card.badge,
  icon: item.card.icon,
  accentClassName: item.card.accentClassName,
  imageUrl: item.card.imageUrl,
  tabIds: item.tabIds,
  axis: item.axis,
  priority: item.priority,
  badgeTier: item.badgeTier,
});

const sortByPriority = (a: ServiceCardItem, b: ServiceCardItem) => a.priority - b.priority;

interface LegacyLandingDefinition extends ServiceLandingData {
  id: string;
}

const LEGACY_STANDALONE_LANDINGS: Record<string, LegacyLandingDefinition> = {
  "palm-billionaire": { id: "palm-billionaire", title: "수상 백만장자", description: "손금으로 보는 백만장자의 기운", badge: "수상", provider: "AI 전용 엔진", priceText: "2,000 P", nextPath: "/palmistry?mode=main&section=wealth-career", serviceType: "saju" },
  "palm-destiny-change": { id: "palm-destiny-change", title: "운명 변화 타이밍", description: "손금에 새겨진 운명 변화 시점", badge: "신규", provider: "AI 전용 엔진", priceText: "2,000 P", nextPath: "/palmistry?mode=main&section=timing", serviceType: "saju" },
  "face-first-impression": { id: "face-first-impression", title: "얼굴 첫인상 분석", description: "관상으로 분석한 당신의 첫인상", badge: "인기", provider: "AI 전용 엔진", priceText: "2,000 P", nextPath: "/face-reading?mode=main&section=first-impression", serviceType: "saju" },
};

const LEGACY_STANDALONE_ALIASES: Record<string, string> = {
  "palm-history": "palm-destiny-change",
  "face-analysis": "face-first-impression",
};

const SERVICE_ID_ALIASES: Record<string, ServiceId> = {
  "saju-timeline": "saju-yearly-action-calendar",
  "saju-career": "saju-career-timing",
  "saju-study": "saju-energy-balance",
  "saju-wealth": "saju-wealth-flow",
  "saju-helper": "saju-helper-network",
  "saju-aptitude": "saju-energy-balance",
  "saju-today": "saju-today-briefing",
  "saju-career-eject": "saju-career-timing",
  "saju-wealth-radar": "saju-wealth-flow",
  "saju-helper-book": "saju-helper-network",
  "love-future": "love-future-partner",
  "love-couple": "love-couple-report",
  "love-reunion": "love-crush-reunion",
};

export const LIFETIME_SERVICE_ORDER: ServiceId[] = [
  "saju-lifetime-roadmap",
  "saju-daeun-shift",
  "saju-career-timing",
  "saju-wealth-flow",
  "saju-helper-network",
  "saju-energy-balance",
  "saju-yearly-action-calendar",
];

export const getCategoryServiceCards = (category: CategoryKey): ServiceCardItem[] => {
  return (Object.entries(SERVICE_CATALOG) as [ServiceId, ServiceCatalogDefinition][])
    .filter(([, item]) => item.category === category && !item.hideFromGrid)
    .map(([id, item]) => toServiceCardItem(id, item))
    .sort(sortByPriority);
};

export const getFallbackServiceCards = (category: CategoryKey, limit = 3): ServiceCardItem[] => {
  return getCategoryServiceCards(category).slice(0, limit);
};

export const getNewYearFortuneTiles = (): FortuneSpecialTileItem[] => {
  return NEW_YEAR_FORTUNE_TILE_DEFINITIONS.map((item) => ({
    ...item,
    to: SERVICE_CATALOG[item.serviceId].card.to,
    description: SERVICE_CATALOG[item.serviceId].card.description,
  }));
};

export const resolveServiceId = (rawServiceId: string): ServiceId | null => {
  if ((SERVICE_IDS as readonly string[]).includes(rawServiceId)) {
    return rawServiceId as ServiceId;
  }
  return SERVICE_ID_ALIASES[rawServiceId] ?? null;
};

export const getServiceLandingById = (serviceId: string) => {
  const resolvedStandaloneId = LEGACY_STANDALONE_ALIASES[serviceId] ?? serviceId;
  const legacyStandaloneLanding = LEGACY_STANDALONE_LANDINGS[resolvedStandaloneId];
  if (legacyStandaloneLanding) {
    return legacyStandaloneLanding;
  }

  const resolvedId = resolveServiceId(serviceId);
  if (!resolvedId) {
    return null;
  }

  const service = SERVICE_CATALOG[resolvedId];
  if (!service.landing) {
    return null;
  }

  return {
    id: resolvedId,
    ...service.landing,
  };
};

export const getServiceTitleById = (serviceId: string) => {
  const resolvedStandaloneId = LEGACY_STANDALONE_ALIASES[serviceId] ?? serviceId;
  const legacyStandaloneLanding = LEGACY_STANDALONE_LANDINGS[resolvedStandaloneId];
  if (legacyStandaloneLanding) {
    return legacyStandaloneLanding.title;
  }

  const resolvedId = resolveServiceId(serviceId);
  return resolvedId ? SERVICE_CATALOG[resolvedId].card.title : serviceId;
};
