/**
 * 유료 리포트 카탈로그
 *
 * 모든 유료 리포트의 가격·분류·메타정보를 한 곳에서 관리합니다.
 * ServiceLandingPage 및 결제 모달, 재조회 페이지에서 공통 참조됩니다.
 */

export const PAID_REPORT_PRICE_KRW = 2_900;

export type PaidReportCategory = "love" | "astrology" | "lifetime" | "new-year-2026" | "today";

export interface PaidReportItem {
  /** serviceCatalog.ts의 ServiceId와 매핑 */
  serviceId: string;
  /** 리포트 표시명 */
  title: string;
  /** 상위 서비스 구분 */
  category: PaidReportCategory;
  /** 카테고리 한글 라벨 */
  categoryLabel: string;
  /** 판매 가격 (KRW) */
  price: number;
  /** serviceCatalog의 serviceType (orders.service_type) */
  serviceType: "love" | "astrology" | "saju";
}

export const PAID_REPORT_CATALOG: PaidReportItem[] = [
  // ── A. 연애/궁합 ──
  { serviceId: "love-future-partner", title: "미래 배우자", category: "love", categoryLabel: "연애/궁합", price: PAID_REPORT_PRICE_KRW, serviceType: "love" },
  { serviceId: "love-couple-report", title: "커플 궁합", category: "love", categoryLabel: "연애/궁합", price: PAID_REPORT_PRICE_KRW, serviceType: "love" },
  { serviceId: "love-crush-reunion", title: "재회 가능성", category: "love", categoryLabel: "연애/궁합", price: PAID_REPORT_PRICE_KRW, serviceType: "love" },

  // ── B. 점성학 ──
  { serviceId: "astro-natal", title: "인생 설계도", category: "astrology", categoryLabel: "점성학", price: PAID_REPORT_PRICE_KRW, serviceType: "astrology" },

  // ── C. 인생 총운(정통) ──
  { serviceId: "saju-lifetime-roadmap", title: "인생 총운 로드맵", category: "lifetime", categoryLabel: "인생 총운(정통)", price: PAID_REPORT_PRICE_KRW, serviceType: "saju" },
  { serviceId: "saju-daeun-shift", title: "대운 전환 시그널", category: "lifetime", categoryLabel: "인생 총운(정통)", price: PAID_REPORT_PRICE_KRW, serviceType: "saju" },
  { serviceId: "saju-career-timing", title: "커리어 타이밍 리포트", category: "lifetime", categoryLabel: "인생 총운(정통)", price: PAID_REPORT_PRICE_KRW, serviceType: "saju" },
  { serviceId: "saju-wealth-flow", title: "재물 흐름 레이더", category: "lifetime", categoryLabel: "인생 총운(정통)", price: PAID_REPORT_PRICE_KRW, serviceType: "saju" },
  { serviceId: "saju-helper-network", title: "관계·귀인 네트워크", category: "lifetime", categoryLabel: "인생 총운(정통)", price: PAID_REPORT_PRICE_KRW, serviceType: "saju" },
  { serviceId: "saju-energy-balance", title: "적성·에너지 밸런스", category: "lifetime", categoryLabel: "인생 총운(정통)", price: PAID_REPORT_PRICE_KRW, serviceType: "saju" },
  { serviceId: "saju-yearly-action-calendar", title: "연간 실행 캘린더", category: "lifetime", categoryLabel: "인생 총운(정통)", price: PAID_REPORT_PRICE_KRW, serviceType: "saju" },

  // ── D. 2026 신년 운세 ──
  { serviceId: "saju-2026-overview", title: "종합 운세", category: "new-year-2026", categoryLabel: "2026 신년 운세", price: PAID_REPORT_PRICE_KRW, serviceType: "saju" },
  { serviceId: "saju-2026-study-exam", title: "학업/시험운", category: "new-year-2026", categoryLabel: "2026 신년 운세", price: PAID_REPORT_PRICE_KRW, serviceType: "saju" },
  { serviceId: "saju-love-focus", title: "연애운", category: "new-year-2026", categoryLabel: "2026 신년 운세", price: PAID_REPORT_PRICE_KRW, serviceType: "saju" },
  { serviceId: "saju-2026-wealth-business", title: "사업자 재물/사업운", category: "new-year-2026", categoryLabel: "2026 신년 운세", price: PAID_REPORT_PRICE_KRW, serviceType: "saju" },
  { serviceId: "saju-2026-investment-assets", title: "투자/자산운", category: "new-year-2026", categoryLabel: "2026 신년 운세", price: PAID_REPORT_PRICE_KRW, serviceType: "saju" },
  { serviceId: "saju-2026-career-aptitude", title: "직업/적성운", category: "new-year-2026", categoryLabel: "2026 신년 운세", price: PAID_REPORT_PRICE_KRW, serviceType: "saju" },
  { serviceId: "saju-2026-health-balance", title: "건강운", category: "new-year-2026", categoryLabel: "2026 신년 운세", price: PAID_REPORT_PRICE_KRW, serviceType: "saju" },

  // ── E. 오늘의 운세 삭제 (무료 전환) ──
];

/** serviceId로 유료 리포트 항목 조회 */
export const getPaidReport = (serviceId: string): PaidReportItem | null =>
  PAID_REPORT_CATALOG.find((item) => item.serviceId === serviceId) ?? null;

/** 해당 serviceId가 유료 리포트인지 확인 */
export const isPaidReport = (serviceId: string): boolean =>
  PAID_REPORT_CATALOG.some((item) => item.serviceId === serviceId);

/** serviceId로 카테고리 라벨과 리포트 제목을 "카테고리 > 리포트명" 형태로 반환 */
export const getPaidReportLabel = (serviceId: string): string => {
  const item = getPaidReport(serviceId);
  if (!item) return serviceId;
  return `${item.categoryLabel} › ${item.title}`;
};
