import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  BadgeCheck,
  BookOpen,
  Bot,
  CalendarDays,
  CalendarRange,
  Clock3,
  Compass,
  Gem,
  Heart,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Stars,
  SunMedium,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { CategoryChipRail } from "@/components/home/CategoryChipRail";
import { QuickActionStrip } from "@/components/home/QuickActionStrip";
import { SajuServiceCard } from "@/components/common/SajuServiceCard";
import { HomeFeedCard } from "@/components/home/HomeFeedCard";
import { ServiceDirectory } from "@/components/home/ServiceDirectory";
import { TrustSection } from "@/components/home/TrustSection";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HeroVideoBackground } from "@/components/home/HeroVideoBackground";
import { AdUnit } from "@/components/common/AdUnit";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.2, 0, 0, 1] as const, delay: index * 0.06 },
  }),
};

const focusOptions = [
  { label: "전체", value: "all" },
  { label: "연애", value: "love" },
  { label: "재물", value: "wealth" },
  { label: "직장", value: "career" },
  { label: "학업", value: "study" },
  { label: "관계", value: "relationship" },
  { label: "건강", value: "health" },
  { label: "이사", value: "move" },
  { label: "사업", value: "business" },
];

const focusCopy: Record<string, { eyebrow: string; title: string; description: string }> = {
  all: {
    eyebrow: "처음 방문한 사용자를 위한 시작점",
    title: "내 사주를 3분 안에 이해하는 생활형 해석",
    description: "복잡한 명리 용어보다 쉬운 한국어 해석을 먼저 보여주고, 필요할 때만 전통 해석을 깊게 열어보도록 설계했습니다.",
  },
  love: {
    eyebrow: "연애 · 관계 포커스",
    title: "마음의 온도와 관계 흐름을 쉬운 말로 확인하세요",
    description: "연애운, 궁합, 감정 기복, 대화 포인트를 한 화면에서 탐색할 수 있게 정리합니다.",
  },
  wealth: {
    eyebrow: "재물 · 소비 포커스",
    title: "재물 흐름은 숫자보다 타이밍과 균형으로 읽습니다",
    description: "지출 습관, 기회 포착 시점, 속도 조절이 필요한 구간을 생활형 조언으로 연결합니다.",
  },
  career: {
    eyebrow: "직장 · 커리어 포커스",
    title: "일의 리듬과 성장 구간을 직관적으로 보여줍니다",
    description: "이직, 협업, 승진, 새로운 프로젝트에 맞는 흐름을 리포트와 운세 카드로 빠르게 확인할 수 있습니다.",
  },
  study: {
    eyebrow: "학업 · 진로 포커스",
    title: "시험운과 진로 고민을 부담 없이 읽는 방식으로 재구성합니다",
    description: "집중력 흐름, 시험 시기, 배움의 방향성을 카드와 타임라인 중심으로 보여줍니다.",
  },
  relationship: {
    eyebrow: "대인관계 포커스",
    title: "사람 사이의 거리감과 균형을 감성적으로 해석합니다",
    description: "친구, 가족, 동료 관계에서 어디를 지키고 어디를 조율해야 하는지 구체적으로 안내합니다.",
  },
  health: {
    eyebrow: "건강 · 회복 포커스",
    title: "회복이 필요한 시기와 속도 조절 포인트를 선명하게 보여줍니다",
    description: "컨디션 파동을 과장 없이 설명하고, 무리하지 않는 리듬 설계를 우선합니다.",
  },
  move: {
    eyebrow: "이사 · 변화 포커스",
    title: "장소 이동과 환경 변화의 타이밍을 흐름 중심으로 읽습니다",
    description: "이사, 독립, 생활권 변화처럼 큰 이동을 앞둔 사용자가 참고할 수 있는 가이드를 제공합니다.",
  },
  business: {
    eyebrow: "사업 · 확장 포커스",
    title: "확장보다 순서가 중요한 시기를 구조적으로 정리합니다",
    description: "사업운, 협업 궁합, 자금 흐름, 확장 타이밍을 서비스 허브 안에서 연결해 보여줍니다.",
  },
};

const trustChips = ["3분 완성", "한글 해석", "저장 선택 가능"];

const quickActions = [
  { label: "무료 사주", description: "9단계 입력으로 빠르게 시작", icon: Sparkles, to: "/saju", tone: "lavender" as const },
  { label: "오늘 운세", description: "개인 운세와 간편 운세 확인", icon: SunMedium, to: "/fortune/quick?period=today", tone: "sky" as const },
  { label: "궁합 보기", description: "커플 궁합 리포트로 관계 점수 확인", icon: Heart, to: "/love/couple-report", tone: "pink" as const },
  { label: "AI 질문", description: "관심사 기반 질문형 리포트", icon: Bot, to: "/saju", tone: "coral" as const },
  { label: "토정비결", description: "연간 흐름 리포트", icon: BookOpen, to: "/fortune/yearly", tone: "lavender" as const },
];

const services = [
  {
    title: "내 사주 시작",
    description: "생년월일 기반 9단계 입력으로 성향, 관계, 일·재물 흐름을 질문형으로 받아봅니다.",
    to: "/saju",
    badge: "무료",
    eta: "약 3분 완성",
    icon: Sparkles,
    accentClassName: "border-accent-lavender bg-gradient-to-br from-accent-lavender/35 via-white to-white",
    tags: ["all", "love", "wealth", "career", "study", "relationship", "health", "move", "business"],
  },
  {
    title: "오늘 운세",
    description: "간편운세와 내 사주 운세를 분리해 빠른 확인과 깊은 해석을 모두 제공합니다.",
    to: "/fortune",
    badge: "AI",
    eta: "지금 바로 확인",
    icon: CalendarDays,
    accentClassName: "border-accent-sky bg-gradient-to-br from-accent-sky/35 via-white to-white",
    tags: ["all", "love", "wealth", "career", "study", "health"],
  },
  {
    title: "궁합 분석",
    description: "사주 기반 상담 리포트로 관계 흐름, 갈등 포인트, 다음 행동을 정리합니다.",
    to: "/love/couple-report",
    badge: "심층",
    eta: "관계별 비교 가능",
    icon: Heart,
    accentClassName: "border-accent-pink bg-gradient-to-br from-accent-pink/35 via-white to-white",
    tags: ["all", "love", "relationship", "business"],
  },
  {
    title: "별자리 천궁도",
    description: "서양 점성술을 기반으로 당신의 행성 배치와 천궁도(Birth Chart)를 분석합니다.",
    to: "/astrology",
    badge: "신규",
    eta: "차트 즉시 생성",
    icon: Stars,
    accentClassName: "border-accent-coral bg-gradient-to-br from-accent-coral/35 via-white to-white",
    tags: ["all", "love", "career", "relationship"],
  },
];

const feedCards = [
  {
    category: "에디터 노트 · 연애",
    title: "이번 주 연애 해석 노트: 속도보다 안정감이 우선",
    summary: "관계의 속도를 올리기보다 대화의 안정감을 먼저 맞추는 편이 흐름을 오래 유지하는 데 유리합니다.",
    ctaLabel: "연애 운세 확인",
    to: "/fortune/quick?period=today",
    accentClassName: "bg-gradient-to-br from-accent-pink/60 via-accent-coral/30 to-white",
    tags: ["all", "love", "relationship"],
  },
  {
    category: "에디터 노트 · 커리어",
    title: "이번 달 커리어 가이드: 이동보다 역할 확장에 집중",
    summary: "큰 이동 결정보다 현재 역할의 영향력을 정리하고 확장하는 전략이 리스크를 줄이는 방식입니다.",
    ctaLabel: "직장 흐름 보기",
    to: "/saju",
    accentClassName: "bg-gradient-to-br from-accent-sky/55 via-accent-lavender/30 to-white",
    tags: ["all", "career", "business"],
  },
  {
    category: "에디터 노트 · 재물",
    title: "재물 체크포인트: 절약보다 소비 리듬 설계",
    summary: "단기 절감보다 반복되는 소비 패턴을 먼저 정리하면 다음 주 의사결정이 더 단순해집니다.",
    ctaLabel: "재물운 읽기",
    to: "/fortune/quick?period=today",
    accentClassName: "bg-gradient-to-br from-accent-mint/55 via-accent-sky/25 to-white",
    tags: ["all", "wealth", "business"],
  },
  {
    category: "에디터 노트 · 학업",
    title: "학업 루틴 가이드: 막판 몰입보다 반복 구조",
    summary: "한 번의 장시간 몰입보다 짧은 집중을 반복하는 패턴이 누적 효율을 만드는 구간입니다.",
    ctaLabel: "학업 포커스 보기",
    to: "/saju",
    accentClassName: "bg-gradient-to-br from-accent-lavender/55 via-accent-sky/20 to-white",
    tags: ["all", "study"],
  },
  {
    category: "에디터 노트 · 건강",
    title: "건강 체크리스트: 회복 속도를 지키는 일정 조정",
    summary: "컨디션 저하 구간에서는 강도보다 리듬을 조정하는 방식이 다음 사이클 안정성에 유리합니다.",
    ctaLabel: "건강 운세 보기",
    to: "/fortune/quick?period=today",
    accentClassName: "bg-gradient-to-br from-accent-mint/60 via-white to-accent-sky/20",
    tags: ["all", "health"],
  },
  {
    category: "에디터 노트 · 관계",
    title: "관계 균형 가이드: 새로운 인연보다 기존 관계 조율",
    summary: "신규 관계 확장보다 현재 관계의 기대치와 거리감을 정리하는 편이 갈등 비용을 줄입니다.",
    ctaLabel: "궁합으로 이어보기",
    to: "/love/couple-report",
    accentClassName: "bg-gradient-to-br from-accent-pink/55 via-white to-accent-lavender/25",
    tags: ["all", "relationship", "love"],
  },
];

const directoryItems = [
  {
    title: "만세력",
    description: "양력·음력·윤달 입력과 팔자 계산을 확인하는 기본 계산 허브",
    icon: Compass,
    to: "/saju",
    status: "active" as const,
    tone: "lavender" as const,
    tags: ["all", "study", "career", "business"],
  },
  {
    title: "띠 운세",
    description: "띠만 선택해서 빠르게 소비하는 간편 운세 모드",
    icon: CalendarRange,
    to: "/fortune/quick?period=today&kind=zodiac",
    status: "active" as const,
    tone: "sky" as const,
    tags: ["all", "love", "wealth", "relationship"],
  },
  {
    title: "별자리 운세",
    description: "별자리 기반으로 가볍게 확인하는 데일리 카드",
    icon: Stars,
    to: "/fortune/quick?period=today&kind=starSign",
    status: "active" as const,
    tone: "pink" as const,
    tags: ["all", "love", "relationship"],
  },
  {
    title: "토정비결",
    description: "연간 흐름과 월별 주의 구간을 한 장의 리포트로 제공할 예정",
    icon: BookOpen,
    to: "/fortune/yearly",
    status: "active" as const,
    tone: "coral" as const,
    tags: ["all", "wealth", "business", "move"],
  },
  {
    title: "길일 캘린더",
    description: "이사, 계약, 발표, 고백에 참고할 수 있는 날짜형 서비스",
    icon: CalendarDays,
    to: "/fortune/good-days",
    status: "active" as const,
    tone: "sky" as const,
    tags: ["all", "move", "business", "love"],
  },
];

const trustItems = [
  {
    title: "쉽게 읽히는 결과 구조",
    description: "한자보다 한국어 설명을 앞에 두고, 전통 용어는 필요한 경우에만 보조로 노출합니다.",
    icon: BadgeCheck,
  },
  {
    title: "모바일 우선 탐색 UX",
    description: "엄지 동선 안에서 입력, 운세, 궁합, 저장 이력을 이어보도록 카드와 레일 중심으로 설계합니다.",
    icon: ShieldCheck,
  },
  {
    title: "저장 정책과 데이터 제어",
    description: "local-only 저장 모드와 데이터 삭제 기능을 기본값으로 두어 민감정보 노출을 줄입니다.",
    icon: LockKeyhole,
  },
];

const weeklyHighlights = [
  { day: "월", title: "연애", label: "대화 리듬" },
  { day: "화", title: "재물", label: "소비 점검" },
  { day: "수", title: "직장", label: "우선순위" },
  { day: "목", title: "학업", label: "루틴 유지" },
  { day: "금", title: "관계", label: "기대치 조율" },
  { day: "토", title: "건강", label: "회복 우선" },
  { day: "일", title: "정리", label: "다음 주 준비" },
];

const filterByFocus = <T extends { tags: string[] }>(items: T[], focus: string) => {
  if (focus === "all") {
    return items;
  }

  const filtered = items.filter((item) => item.tags.includes(focus));
  return filtered.length > 0 ? filtered : items;
};

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="space-y-2">
      <p className="text-label text-text-secondary">{eyebrow}</p>
      <h2 className="text-h2 text-foreground">{title}</h2>
      <p className="max-w-2xl text-body text-text-secondary">{description}</p>
    </div>
  );
}

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedFocus = searchParams.get("focus") ?? "all";
  const selectedFocus = focusOptions.some((item) => item.value === requestedFocus) ? requestedFocus : "all";
  const selectedCopy = focusCopy[selectedFocus] ?? focusCopy.all;

  const filteredServices = filterByFocus(services, selectedFocus);
  const filteredFeedCards = filterByFocus(feedCards, selectedFocus);
  const filteredDirectoryItems = filterByFocus(directoryItems, selectedFocus);

  const handleCategoryChange = (value: string) => {
    if (value === "all") {
      setSearchParams({});
      return;
    }

    setSearchParams({ focus: value });
  };

  return (
    <AppLayout>
      <div className="relative overflow-hidden">
        <HeroVideoBackground videoSrc="/videos/%ED%99%A9%EA%B8%88%EC%86%8C%EB%82%98%EB%AC%B4.mp4" />
        
        <section className="mx-auto w-full max-w-[1280px] px-5 pb-6 pt-8 md:px-8 md:pt-10 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="portal-surface grid gap-6 overflow-hidden rounded-[32px] border border-white/20 bg-white/5 backdrop-blur-xl p-6 shadow-2xl md:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10"
          >
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-bg-elevated/90 px-4 py-2 text-[12px] font-semibold text-text-secondary shadow-sm">
                <ShieldCheck className="h-4 w-4" />
                {selectedCopy.eyebrow}
              </div>

              <div className="space-y-4">
                <h1 className="max-w-[620px] text-[36px] font-extrabold leading-[44px] tracking-[-0.02em] text-white md:text-[42px] md:leading-[52px]">
                  {selectedCopy.title}
                </h1>
                <p className="max-w-[560px] text-body text-white/80">{selectedCopy.description}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="h-14 rounded-[16px] bg-[#24303F] px-6 text-white hover:bg-[#1D2733]">
                  <Link to="/saju">내 사주 시작</Link>
                </Button>
                <Button asChild variant="outline" className="h-14 rounded-[16px] border-border bg-bg-elevated/80 px-6">
                  <Link to="/fortune/quick?period=today">오늘의 운세 보기</Link>
                </Button>
                <Button asChild variant="outline" className="h-14 rounded-[16px] border-border bg-bg-elevated/80 px-6">
                  <Link to="/love/couple-report">궁합 보기</Link>
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {trustChips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-2 text-[12px] font-semibold text-white/90 shadow-sm backdrop-blur-md"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative min-h-[300px] rounded-[28px] border border-white/40 bg-white/10 p-5 shadow-inner backdrop-blur-md md:min-h-[380px]">
              <div className="hero-orbit absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full md:h-52 md:w-52" />
              <div className="absolute left-5 top-5 rounded-[20px] border border-white/70 bg-bg-elevated/90 p-4 shadow-sm">
                <p className="text-[12px] font-semibold text-text-secondary">서비스 시작 가이드</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-[30px] font-extrabold leading-none text-foreground">3분</span>
                  <span className="pb-1 text-[13px] font-semibold text-state-success">첫 결과 확인</span>
                </div>
              </div>
              <div className="absolute right-5 top-10 rounded-[20px] border border-white/70 bg-bg-elevated/90 p-4 shadow-sm">
                <p className="text-[12px] font-semibold text-text-secondary">이번 주 편집 포커스</p>
                <p className="mt-2 text-title text-foreground">연애 · 재물 · 직장</p>
                <p className="mt-1 text-[12px] leading-5 text-text-secondary">카테고리별 읽을거리와 서비스 동선을 함께 제공합니다.</p>
              </div>
              <div className="absolute bottom-5 left-5 rounded-[20px] border border-white/70 bg-bg-elevated/90 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-coral/40 text-foreground">
                    <Gem className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-text-secondary">에디터 추천 읽을거리</p>
                    <p className="text-[14px] font-semibold text-foreground">관계 조율을 위한 대화 구조 정리</p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-5 right-5 rounded-[20px] border border-white/70 bg-[#24303F] p-4 text-white shadow-md">
                <p className="text-[12px] font-semibold text-white/70">핵심 서비스 허브</p>
                <p className="mt-2 text-title">사주 · 운세 · 궁합</p>
                <p className="mt-1 text-[12px] leading-5 text-white/80">입력부터 결과 확인까지 한 흐름으로 연결됩니다.</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto w-full max-w-[1280px] px-5 pb-6 md:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="space-y-4">
            <SectionHeader
              eyebrow="Core Services"
              title="처음 방문해도 헷갈리지 않는 핵심 3개"
              description="첫 화면에서는 내 사주, 오늘 운세, 궁합만 우선 노출해 행동 결정을 빠르게 만듭니다."
            />
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((service) => (
                <SajuServiceCard key={service.title} {...service} />
              ))}
            </div>
          </motion.div>
        </section>

        <section className="mx-auto w-full max-w-[1280px] px-5 pb-8 md:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="space-y-4">
            <SectionHeader
              eyebrow="Focus Categories"
              title="지금 궁금한 주제로 홈을 다시 정렬하세요"
              description="연애, 재물, 직장처럼 오늘의 관심사만 골라 바로 읽을 수 있게 필터를 제공합니다."
            />
            <CategoryChipRail options={focusOptions} value={selectedFocus} onChange={handleCategoryChange} />
          </motion.div>
        </section>

        <section className="mx-auto w-full max-w-[1280px] px-5 pb-8 md:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="space-y-4">
            <SectionHeader
              eyebrow="Stories And Guidance"
              title="입력 없이 읽는 해석 피드"
              description="짧은 한 줄 결론과 실천 조언 중심으로 읽고, 필요할 때만 서비스 상세로 이동하게 구성합니다."
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredFeedCards.slice(0, 6).map((card) => (
                <HomeFeedCard key={card.title} {...card} />
              ))}
            </div>
          </motion.div>
        </section>

        <section className="mx-auto w-full max-w-[1280px] px-5 pb-8 md:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="space-y-4">
            <SectionHeader
              eyebrow="Quick Actions"
              title="자주 찾는 기능은 아래에서 바로 이동"
              description="핵심 3개 외 보조 기능은 Quick Actions로 분리해 첫 화면 의사결정을 방해하지 않게 했습니다."
            />
            <QuickActionStrip items={quickActions} />
          </motion.div>
        </section>

        <section className="mx-auto w-full max-w-[1280px] px-5 pb-8 md:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5} className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="overflow-hidden rounded-[28px] border border-[#24303F]/10 bg-[#24303F] p-6 text-white shadow-md md:p-8">
              <p className="text-label text-white/70">Editor's Weekly Highlight</p>
              <h2 className="mt-2 max-w-lg text-h2 text-white">이번 주 큐레이션은 확장보다 기본 리듬을 정리하는 쪽에 초점을 맞췄습니다</h2>
              <p className="mt-3 max-w-lg text-[15px] leading-7 text-white/80">
                관계, 일정, 소비 패턴처럼 반복되는 구간을 먼저 정리하면 다음 단계 판단이 쉬워집니다. 상세 해석은 서비스별 카드로 이어집니다.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/fortune/quick?period=week" className="inline-flex h-12 items-center justify-center rounded-[16px] bg-white px-5 text-[14px] font-semibold text-[#24303F]">
                  이번 주 해석 보기
                </Link>
                <Link to="/result" className="inline-flex h-12 items-center justify-center rounded-[16px] border border-white/20 px-5 text-[14px] font-semibold text-white">
                  최근 리포트 열기
                </Link>
              </div>
            </Card>

            <Card className="rounded-[28px] border border-border bg-bg-elevated p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-label text-text-secondary">Weekly Content Calendar</p>
                  <h3 className="mt-1 text-title text-foreground">이번 주 주제 큐레이션</h3>
                </div>
                <CalendarRange className="h-5 w-5 text-text-secondary" />
              </div>
              <div className="mt-5 grid grid-cols-7 gap-2">
                {weeklyHighlights.map((item) => (
                  <div key={item.day} className={cn("rounded-[16px] border p-2 text-center", item.day === "목" ? "border-[#24303F] bg-bg-subtle" : "border-border bg-white")}>
                    <p className="text-[12px] font-semibold text-text-secondary">{item.day}</p>
                    <p className="mt-2 text-[13px] font-bold text-foreground">{item.title}</p>
                    <p className="mt-1 text-[11px] font-semibold text-text-muted">{item.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </section>

        <section className="mx-auto w-full max-w-[1280px] px-5 pb-8 md:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6} className="space-y-4">
            <SectionHeader
              eyebrow="Service Directory"
              title="운세 하위 기능 디렉토리"
              description="홈은 입구에 집중하고, 세부 기능 탐색은 운세 허브 디렉토리에서 확장하도록 역할을 분리합니다."
            />
            <ServiceDirectory items={filteredDirectoryItems.slice(0, 6)} />
          </motion.div>
        </section>

        <section className="mx-auto w-full max-w-[1280px] px-5 pb-8 md:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={7} className="space-y-4">
            <SectionHeader
              eyebrow="Why This Feels Easier"
              title="젊은 사용자에게 맞춘 읽기 방식"
              description="텍스트를 줄이고, 카드와 시각화 중심으로 해석 레이어를 나눠 처음 보는 사람도 3단계 안에 이해하도록 구성합니다."
            />
            <TrustSection items={trustItems} />
          </motion.div>
        </section>

        <section className="mx-auto w-full max-w-[1280px] px-5 pb-16 md:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={9} className="mb-12">
            <div className="overflow-hidden rounded-3xl border border-border bg-white p-4 shadow-sm">
              <p className="mb-2 text-center text-[11px] font-bold tracking-wider text-slate-400">ADVERTISEMENT</p>
              <AdUnit slot="7276034608" className="min-h-[100px]" />
            </div>
          </motion.div>

          <motion.footer initial="hidden" animate="visible" variants={fadeUp} custom={8} className="rounded-[28px] border border-border bg-bg-elevated px-5 py-6 shadow-sm md:px-6">
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-end">
              <div>
                <p className="text-label text-text-secondary">Saju Portal Footer</p>
                <h2 className="mt-2 text-title text-foreground">사주, 운세, 궁합을 하나의 탐색형 플랫폼으로 묶습니다</h2>
                <p className="mt-2 max-w-xl text-caption text-text-secondary">
                  입력부터 리포트, 궁합, 저장 이력까지 한 흐름으로 연결하고 정책 페이지와 도움말을 푸터에서 바로 접근할 수 있게 고정합니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Link to="/privacy" className="text-[13px] font-semibold text-text-secondary hover:text-foreground">개인정보처리방침</Link>
                <Link to="/terms" className="text-[13px] font-semibold text-text-secondary hover:text-foreground">이용약관</Link>
                <Link to="/help" className="text-[13px] font-semibold text-text-secondary hover:text-foreground">도움말</Link>
                <Link to="/login" className="text-[13px] font-semibold text-text-secondary hover:text-foreground">로그인</Link>
              </div>
            </div>

            <div className="mt-6 grid gap-3 border-t border-border pt-5 md:grid-cols-4">
              <div className="rounded-[20px] bg-bg-subtle p-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[13px] font-semibold">쉬운 해석</span>
                </div>
                <p className="mt-2 text-[13px] leading-6 text-text-secondary">전문 용어보다 사용자 언어를 먼저 보여줍니다.</p>
              </div>
              <div className="rounded-[20px] bg-bg-subtle p-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Clock3 className="h-4 w-4" />
                  <span className="text-[13px] font-semibold">빠른 진입</span>
                </div>
                <p className="mt-2 text-[13px] leading-6 text-text-secondary">첫 화면의 1차 행동은 내 사주 시작으로 고정하고 보조 CTA만 함께 노출합니다.</p>
              </div>
              <div className="rounded-[20px] bg-bg-subtle p-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Activity className="h-4 w-4" />
                  <span className="text-[13px] font-semibold">시각화 중심</span>
                </div>
                <p className="mt-2 text-[13px] leading-6 text-text-secondary">차트와 카드, 캘린더를 중심으로 정보를 나눕니다.</p>
              </div>
              <div className="rounded-[20px] bg-bg-subtle p-4">
                <div className="flex items-center gap-2 text-foreground">
                  <LockKeyhole className="h-4 w-4" />
                  <span className="text-[13px] font-semibold">정책 노출</span>
                </div>
                <p className="mt-2 text-[13px] leading-6 text-text-secondary">저장 정책과 데이터 삭제 동선을 항상 footer에서 확인하게 둡니다.</p>
              </div>
            </div>
          </motion.footer>
        </section>
      </div>
    </AppLayout>
  );
}
