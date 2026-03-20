import {
  Briefcase,
  Coins,
  Hand,
  Heart,
  MoonStar,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ServiceType } from "@/store/useConsultStore";
import type { SajuServiceType } from "@/types/result";

export type CategoryKey = "saju" | "astrology" | "palmistry" | "love";

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
  | "palm-analysis"
  | "face-analysis"
  | "future-partner"
  | "couple-compatibility"
  | "reunion";

export type ServiceBadgeTier = "핵심" | "실행" | "확장";

const SERVICE_IDS = [
  "saju-lifetime-roadmap",
  "saju-daeun-shift",
  "saju-career-timing",
  "saju-wealth-flow",
  "saju-helper-network",
  "saju-energy-balance",
  "saju-yearly-action-calendar",
  "saju-today-briefing",
  "astro-natal",
  "astro-daily",
  "astro-synastry",
  "astro-cosmic-calendar",
  "palm-billionaire",
  "palm-destiny-change",
  "face-first-impression",
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
  eta: string;
  icon: LucideIcon;
  accentClassName: string;
}

export interface ServiceLandingData {
  title: string;
  description: string;
  badge: string;
  provider: string;
  rating: number;
  reviewCount: number;
  priceText: string;
  nextPath: string;
  previewFeatures?: { title: string; description: string }[];
  serviceType: ServiceType;
  analysisServiceId?: SajuServiceType;
}

interface ServiceCatalogDefinition {
  category: CategoryKey;
  tabIds: string[];
  axis: ServiceAxis;
  priority: number;
  badgeTier: ServiceBadgeTier;
  card: ServiceCardDefinition;
  landing?: ServiceLandingData;
}

export interface ServiceCardItem {
  id: ServiceId;
  title: string;
  description: string;
  to: string;
  badge: string;
  eta: string;
  icon: LucideIcon;
  accentClassName: string;
  tabIds: string[];
  axis: ServiceAxis;
  priority: number;
  badgeTier: ServiceBadgeTier;
}

const SERVICE_CATALOG: Record<ServiceId, ServiceCatalogDefinition> = {
  "saju-lifetime-roadmap": {
    category: "saju",
    tabIds: ["lifetime"],
    axis: "life-flow",
    priority: 1,
    badgeTier: "핵심",
    card: {
      title: "인생 총운 로드맵",
      description: "인생의 상승·정체·도약 구간을 한눈에 확인하는 10년 단위 핵심 분석",
      to: "/service/saju-lifetime-roadmap",
      badge: "핵심",
      eta: "인생 지도",
      icon: MoonStar,
      accentClassName: "border-indigo-200 bg-white",
    },
    landing: {
      title: "인생 총운 로드맵: 내 인생의 기준점",
      description:
        "오행 밸런스, 대운 흐름, 핵심 기질을 종합해 긴 호흡의 인생 의사결정 기준을 제시합니다. 처음 진입한 사용자에게 가장 먼저 필요한 앵커 리포트입니다.",
      badge: "핵심",
      provider: "창재 오리지널",
      rating: 5.0,
      reviewCount: 42100,
      priceText: "무료",
      nextPath: "/saju?mode=lifetime",
      serviceType: "saju",
      analysisServiceId: "saju-lifetime-roadmap",
      previewFeatures: [
        { title: "10년 단위 대운 흐름", description: "상승기·정체기·전환기를 축으로 장기 흐름을 시각화합니다." },
        { title: "핵심 기질 해석", description: "타고난 강점과 반복 리스크를 실행 관점으로 정리합니다." },
        { title: "행동 기준 제안", description: "지금 집중할 일과 보류할 일을 우선순위로 제시합니다." },
      ],
    },
  },
  "saju-daeun-shift": {
    category: "saju",
    tabIds: ["lifetime"],
    axis: "daeun",
    priority: 2,
    badgeTier: "핵심",
    card: {
      title: "대운 전환 시그널",
      description: "10년 주기 전환점을 집중 분석해 큰 변곡점 대응 전략을 제시합니다",
      to: "/service/saju-daeun-shift",
      badge: "핵심",
      eta: "대운 리포트",
      icon: Sparkles,
      accentClassName: "border-accent-lavender bg-white",
    },
    landing: {
      title: "대운 전환 시그널: 변곡점 집중 분석",
      description:
        "대운 교차 구간에서 기회와 리스크가 동시에 커집니다. 전환 직전/직후의 행동 전략을 중심으로 의사결정 기준을 제공합니다.",
      badge: "핵심",
      provider: "창재 오리지널",
      rating: 4.9,
      reviewCount: 16310,
      priceText: "무료",
      nextPath: "/saju?mode=lifetime&focus=daeun",
      serviceType: "saju",
      analysisServiceId: "saju-daeun-shift",
      previewFeatures: [
        { title: "전환점 탐지", description: "대운 전환 타이밍을 연령/연도로 정리합니다." },
        { title: "리스크 경고", description: "전환 초기 흔한 실수 패턴을 선제 안내합니다." },
        { title: "실행 체크리스트", description: "전환기 90일 행동 계획으로 실행 난이도를 낮춥니다." },
      ],
    },
  },
  "saju-career-timing": {
    category: "saju",
    tabIds: ["lifetime"],
    axis: "career",
    priority: 3,
    badgeTier: "실행",
    card: {
      title: "커리어 타이밍 리포트",
      description: "이직·승진·창업 의사결정의 적정 시점과 실행 우선순위를 정리합니다",
      to: "/service/saju-career-timing",
      badge: "실행",
      eta: "커리어 플랜",
      icon: Briefcase,
      accentClassName: "border-blue-200 bg-white",
    },
    landing: {
      title: "커리어 타이밍 리포트: 지금 움직여도 되는가",
      description:
        "경력 의사결정은 타이밍이 성과를 좌우합니다. 공격적으로 움직일 시점과 방어적으로 준비할 시점을 분리해 실행 전략을 제시합니다.",
      badge: "실행",
      provider: "창재 오리지널",
      rating: 4.9,
      reviewCount: 13200,
      priceText: "무료",
      nextPath: "/saju?mode=lifetime&focus=career",
      serviceType: "saju",
      analysisServiceId: "saju-career-timing",
      previewFeatures: [
        { title: "커리어 변곡점", description: "승진/이직/창업 신호를 타임라인으로 정리합니다." },
        { title: "기회 대비도", description: "현재 역량 대비 기회 포착 확률을 점검합니다." },
        { title: "행동 우선순위", description: "즉시 실행 항목과 준비 항목을 분리해 제시합니다." },
      ],
    },
  },
  "saju-wealth-flow": {
    category: "saju",
    tabIds: ["lifetime"],
    axis: "wealth",
    priority: 4,
    badgeTier: "실행",
    card: {
      title: "재물 흐름 레이더",
      description: "현금흐름·지출 리스크·기회 구간을 점검해 재무 실행 전략을 제공합니다",
      to: "/service/saju-wealth-flow",
      badge: "실행",
      eta: "재무 플랜",
      icon: Coins,
      accentClassName: "border-amber-200 bg-white",
    },
    landing: {
      title: "재물 흐름 레이더: 돈의 흐름을 구조화",
      description:
        "재물운을 막연한 감으로 보지 않고 흐름으로 분해합니다. 지출 통제, 유동성 확보, 기회 구간 대응을 중심으로 실행 플랜을 제공합니다.",
      badge: "실행",
      provider: "창재 오리지널",
      rating: 4.9,
      reviewCount: 11840,
      priceText: "무료",
      nextPath: "/saju?mode=lifetime&focus=wealth",
      serviceType: "saju",
      analysisServiceId: "saju-wealth-flow",
      previewFeatures: [
        { title: "현금흐름 구간 분석", description: "확장기와 방어기를 구분해 자금 운용 기준을 제시합니다." },
        { title: "리스크 포인트", description: "손실 가능성이 높은 시점과 영역을 사전 경고합니다." },
        { title: "실행 규칙", description: "저축·투자·소비 비중 조정 가이드를 제공합니다." },
      ],
    },
  },
  "saju-helper-network": {
    category: "saju",
    tabIds: ["lifetime"],
    axis: "relationship",
    priority: 5,
    badgeTier: "확장",
    card: {
      title: "관계·귀인 네트워크",
      description: "협업·인맥·관계 운영 전략을 축으로 관계 성과를 높이는 리포트",
      to: "/service/saju-helper-network",
      badge: "확장",
      eta: "관계 전략",
      icon: Users,
      accentClassName: "border-green-200 bg-white",
    },
    landing: {
      title: "관계·귀인 네트워크: 누구와 어떻게 연결할 것인가",
      description:
        "관계는 운을 증폭시키는 레버리지입니다. 도움을 주고받기 쉬운 관계 패턴을 분석해 협업과 인맥 운영 방식을 구체적으로 제안합니다.",
      badge: "확장",
      provider: "창재 데이터랩",
      rating: 4.9,
      reviewCount: 9610,
      priceText: "무료",
      nextPath: "/saju?mode=lifetime&focus=relationship",
      serviceType: "saju",
      analysisServiceId: "saju-helper-network",
      previewFeatures: [
        { title: "관계 패턴 진단", description: "갈등/협력 패턴의 원인을 구조적으로 분석합니다." },
        { title: "귀인 신호", description: "도움이 되는 관계의 특징과 접근 방식을 정리합니다." },
        { title: "협업 가이드", description: "성과가 나는 역할 분담과 커뮤니케이션 포인트를 제시합니다." },
      ],
    },
  },
  "saju-energy-balance": {
    category: "saju",
    tabIds: ["lifetime"],
    axis: "energy",
    priority: 6,
    badgeTier: "확장",
    card: {
      title: "적성·에너지 밸런스",
      description: "성향과 컨디션 흐름을 기준으로 나에게 맞는 실행 방식으로 안내합니다",
      to: "/service/saju-energy-balance",
      badge: "확장",
      eta: "성향 진단",
      icon: Sparkles,
      accentClassName: "border-purple-200 bg-white",
    },
    landing: {
      title: "적성·에너지 밸런스: 내 방식으로 성과 내기",
      description:
        "같은 목표도 사람마다 맞는 실행 방식이 다릅니다. 성향, 집중 패턴, 회복 주기를 분석해 지속 가능한 실행 루틴을 제시합니다.",
      badge: "확장",
      provider: "창재 오리지널",
      rating: 4.8,
      reviewCount: 8240,
      priceText: "무료",
      nextPath: "/saju?mode=lifetime&focus=energy",
      serviceType: "saju",
      analysisServiceId: "saju-energy-balance",
      previewFeatures: [
        { title: "에너지 파형 분석", description: "집중/회복 주기를 기준으로 일정 운영 전략을 제시합니다." },
        { title: "적성 포지셔닝", description: "강점이 살아나는 역할과 환경을 정리합니다." },
        { title: "실행 루틴", description: "지속 가능한 주간 루틴 템플릿을 제공합니다." },
      ],
    },
  },
  "saju-yearly-action-calendar": {
    category: "saju",
    tabIds: ["lifetime", "new-year"],
    axis: "execution-calendar",
    priority: 7,
    badgeTier: "확장",
    card: {
      title: "연간 실행 캘린더",
      description: "올해 행동 우선순위와 월별 체크포인트를 실행 중심으로 정리합니다",
      to: "/service/saju-yearly-action-calendar",
      badge: "확장",
      eta: "연간 계획",
      icon: Sparkles,
      accentClassName: "border-violet-200 bg-white",
    },
    landing: {
      title: "연간 실행 캘린더: 계획을 실천으로 전환",
      description:
        "연 단위 목표를 월별 행동 단위로 쪼개어 실행 가능하게 만듭니다. 기회 집중 월과 리스크 관리 월을 분리해 전략적으로 운영합니다.",
      badge: "확장",
      provider: "창재 오리지널",
      rating: 4.9,
      reviewCount: 10420,
      priceText: "무료",
      nextPath: "/saju?mode=lifetime&focus=calendar",
      serviceType: "saju",
      analysisServiceId: "saju-yearly-action-calendar",
      previewFeatures: [
        { title: "월별 실행 우선순위", description: "월 단위 목표와 행동 항목을 구조화합니다." },
        { title: "집중 구간 표시", description: "성과 극대화 구간과 방어 구간을 분리합니다." },
        { title: "체크포인트", description: "실행 점검용 월간 체크리스트를 제공합니다." },
      ],
    },
  },
  "saju-today-briefing": {
    category: "saju",
    tabIds: ["today"],
    axis: "daily-briefing",
    priority: 8,
    badgeTier: "확장",
    card: {
      title: "오늘의 운세 브리핑",
      description: "오늘의 핵심 운세와 행동 포인트를 1분 요약으로 빠르게 제공합니다",
      to: "/service/saju-today-briefing",
      badge: "확장",
      eta: "1분 요약",
      icon: MoonStar,
      accentClassName: "border-gray-200 bg-white",
    },
    landing: {
      title: "오늘의 운세 브리핑",
      description: "하루 단위로 확인해야 할 핵심 포인트를 압축해 제공하는 데일리 가이드입니다.",
      badge: "확장",
      provider: "창재 오리지널",
      rating: 4.6,
      reviewCount: 301240,
      priceText: "무료",
      nextPath: "/fortune/personal",
      serviceType: "saju",
      analysisServiceId: "traditional-saju",
      previewFeatures: [
        { title: "하루 핵심 요약", description: "오늘 바로 적용 가능한 행동 가이드를 제공합니다." },
        { title: "주의 구간 알림", description: "시간대별 리스크 구간을 사전 안내합니다." },
        { title: "행운 포인트", description: "하루 집중 행동 키워드를 제시합니다." },
      ],
    },
  },
  "astro-natal": {
    category: "astrology",
    tabIds: [],
    axis: "natal-chart",
    priority: 1,
    badgeTier: "핵심",
    card: {
      title: "출생 차트 정밀 리딩",
      description: "태어난 순간의 행성 배치를 바탕으로 성향·강점·리스크를 분석합니다",
      to: "/astrology",
      badge: "PREMIUM",
      eta: "차트+AI 리포트",
      icon: Sparkles,
      accentClassName: "border-accent-coral bg-white",
    },
  },
  "astro-daily": {
    category: "astrology",
    tabIds: [],
    axis: "daily-briefing",
    priority: 2,
    badgeTier: "실행",
    card: {
      title: "오늘의 별자리 운세",
      description: "12별자리 운세를 빠르게 확인하고 하루 전략을 세울 수 있습니다",
      to: "/astrology/daily",
      badge: "무료",
      eta: "매일 갱신",
      icon: MoonStar,
      accentClassName: "border-purple-200 bg-white",
    },
  },
  "astro-synastry": {
    category: "astrology",
    tabIds: [],
    axis: "synastry",
    priority: 3,
    badgeTier: "실행",
    card: {
      title: "별자리 궁합(시너스트리)",
      description: "두 사람의 차트를 비교해 조화·충돌·감정 패턴을 분석합니다",
      to: "/astrology/synastry",
      badge: "HOT",
      eta: "궁합 점수",
      icon: Sparkles,
      accentClassName: "border-blue-300 bg-white",
    },
  },
  "astro-cosmic-calendar": {
    category: "astrology",
    tabIds: [],
    axis: "cosmic-calendar",
    priority: 4,
    badgeTier: "확장",
    card: {
      title: "코스믹 캘린더",
      description: "보름달·신월·역행 등 핵심 이벤트를 일정 기반으로 확인할 수 있습니다",
      to: "/astrology/calendar",
      badge: "주간",
      eta: "주간 요약",
      icon: Sparkles,
      accentClassName: "border-gray-200 bg-white",
    },
  },
  "palm-billionaire": {
    category: "palmistry",
    tabIds: ["palm"],
    axis: "palm-analysis",
    priority: 1,
    badgeTier: "핵심",
    card: {
      title: "AI 손금 메인 리포트",
      description: "한 번의 스캔으로 성향·재물/커리어·관계·변화시기 4섹션을 확인합니다",
      to: "/service/palm-billionaire",
      badge: "인기",
      eta: "4섹션 리포트",
      icon: Hand,
      accentClassName: "border-amber-400 bg-white",
    },
    landing: {
      title: "AI 손금 메인 리포트",
      description: "손금 지표 기반으로 성향, 재물/커리어, 관계, 변화시기까지 한 번에 분석합니다.",
      badge: "핵심",
      provider: "창재 Vision Lab",
      rating: 4.5,
      reviewCount: 12500,
      priceText: "무료",
      nextPath: "/palmistry?mode=main&section=wealth-career",
      serviceType: "palmistry",
      previewFeatures: [
        { title: "성향 요약", description: "주요 선 길이와 분포로 현재 의사결정 성향을 정리합니다." },
        { title: "재물/커리어", description: "실행-검증 밸런스를 지표 기반으로 점검합니다." },
        { title: "관계/변화시기", description: "관계 신호와 변화 추적 포인트를 함께 제공합니다." },
      ],
    },
  },
  "palm-destiny-change": {
    category: "palmistry",
    tabIds: ["palm"],
    axis: "palm-analysis",
    priority: 2,
    badgeTier: "실행",
    card: {
      title: "운명 변화시기 심화 리포트",
      description: "메인 리포트의 변화시기 섹션으로 이동해 추세를 집중 확인합니다",
      to: "/service/palm-destiny-change",
      badge: "신규",
      eta: "6개월 변화",
      icon: Hand,
      accentClassName: "border-accent-mint bg-white",
    },
    landing: {
      title: "운명 변화시기 심화 리포트",
      description: "손금 메인 리포트의 변화시기 섹션으로 바로 이동해 추세 해석을 확인합니다.",
      badge: "실행",
      provider: "창재 Vision Lab",
      rating: 4.9,
      reviewCount: 521,
      priceText: "무료",
      nextPath: "/palmistry?mode=main&section=timing",
      serviceType: "palmistry",
    },
  },
  "face-first-impression": {
    category: "palmistry",
    tabIds: ["face"],
    axis: "face-analysis",
    priority: 3,
    badgeTier: "확장",
    card: {
      title: "첫인상·대인 인상 분석",
      description: "대외 인상과 표현 패턴을 분석해 보완 포인트를 제안합니다",
      to: "/service/face-first-impression",
      badge: "무료",
      eta: "사진 1장",
      icon: Sparkles,
      accentClassName: "border-rose-200 bg-white",
    },
    landing: {
      title: "첫인상·대인 인상 분석",
      description: "AI 관상 분석으로 인상 강점과 보완 포인트를 제안합니다.",
      badge: "확장",
      provider: "창재 Vision Lab",
      rating: 4.6,
      reviewCount: 30120,
      priceText: "무료",
      nextPath: "/palmistry?mode=face",
      serviceType: "palmistry",
    },
  },
  "love-future-partner": {
    category: "love",
    tabIds: ["solo"],
    axis: "future-partner",
    priority: 1,
    badgeTier: "핵심",
    card: {
      title: "미래 배우자 리포트",
      description: "어떤 인연과 맞는지, 만나게 될 가능 시점은 언제인지 정리합니다",
      to: "/love/future-partner",
      badge: "BEST",
      eta: "상담형 진단",
      icon: Heart,
      accentClassName: "border-accent-pink bg-white",
    },
  },
  "love-couple-report": {
    category: "love",
    tabIds: ["couple"],
    axis: "couple-compatibility",
    priority: 2,
    badgeTier: "실행",
    card: {
      title: "커플 궁합 리포트",
      description: "감정·생활·결혼 관점에서 두 사람의 궁합을 종합 분석합니다",
      to: "/love/couple-report",
      badge: "인기",
      eta: "상담형 분석",
      icon: Sparkles,
      accentClassName: "border-indigo-200 bg-white",
    },
  },
  "love-crush-reunion": {
    category: "love",
    tabIds: ["crush"],
    axis: "reunion",
    priority: 3,
    badgeTier: "실행",
    card: {
      title: "재회 가능성 리포트",
      description: "현재 관계 신호와 재접근 가능성을 현실적으로 분석해 안내합니다",
      to: "/love/crush-reunion",
      badge: "HOT",
      eta: "시나리오 분석",
      icon: MoonStar,
      accentClassName: "border-gray-800 bg-white text-gray-800",
    },
  },
  "love-synastry-sidecar": {
    category: "love",
    tabIds: ["couple"],
    axis: "synastry",
    priority: 4,
    badgeTier: "확장",
    card: {
      title: "별자리 궁합(시너스트리)",
      description: "점성학 기반 궁합이 필요하면 별자리 카테고리 상세로 이동하세요",
      to: "/astrology/synastry",
      badge: "점성학",
      eta: "별자리 분석",
      icon: Sparkles,
      accentClassName: "border-sky-200 bg-white",
    },
  },
};

const toServiceCardItem = (id: ServiceId, item: ServiceCatalogDefinition): ServiceCardItem => ({
  id,
  title: item.card.title,
  description: item.card.description,
  to: item.card.to,
  badge: item.card.badge,
  eta: item.card.eta,
  icon: item.card.icon,
  accentClassName: item.card.accentClassName,
  tabIds: item.tabIds,
  axis: item.axis,
  priority: item.priority,
  badgeTier: item.badgeTier,
});

const sortByPriority = (a: ServiceCardItem, b: ServiceCardItem) => a.priority - b.priority;

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
  "palm-history": "palm-destiny-change",
  "face-analysis": "face-first-impression",
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
    .filter(([, item]) => item.category === category)
    .map(([id, item]) => toServiceCardItem(id, item))
    .sort(sortByPriority);
};

export const getFallbackServiceCards = (category: CategoryKey, limit = 3): ServiceCardItem[] => {
  return getCategoryServiceCards(category).slice(0, limit);
};

export const resolveServiceId = (rawServiceId: string): ServiceId | null => {
  if ((SERVICE_IDS as readonly string[]).includes(rawServiceId)) {
    return rawServiceId as ServiceId;
  }
  return SERVICE_ID_ALIASES[rawServiceId] ?? null;
};

export const getServiceLandingById = (serviceId: string) => {
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
