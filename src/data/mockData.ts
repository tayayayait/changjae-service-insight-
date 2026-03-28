export const HOME_PATH = "/category/saju";

export const GLOBAL_NAV_ITEMS = [
  { label: "내 사주", path: "/saju" },
  { label: "운세", path: "/fortune" },
  { label: "궁합", path: "/love/couple-report" },
  { label: "최근 결과", path: "/result" },
  { label: "삭제", path: "#delete" },
] as const;


export const HOME_FOCUS_LINKS = [
  { label: "연애", path: "/?focus=love" },
  { label: "재물", path: "/?focus=wealth" },
  { label: "커리어", path: "/?focus=career" },
  { label: "학업", path: "/?focus=study" },
  { label: "관계", path: "/?focus=relationship" },
  { label: "건강", path: "/?focus=health" },
  { label: "이사", path: "/?focus=move" },
  { label: "사업", path: "/?focus=business" },
] as const;

export const SIDEBAR_CATEGORY_GROUPS = [
  {
    title: "사주/만세력",
    id: "saju",
    items: [
      { name: "인생 총운 (정통)", path: "/category/saju?tab=lifetime" },
      { name: "2026 신년 운세", path: "/category/saju?tab=new-year" },
      { name: "오늘의 운세", path: "/category/saju?tab=today" },
      { name: "AI 사주 상담", path: "/chat" },
    ],
  },
  {
    title: "점성학",
    id: "astrology",
    items: [
      { name: "인생 설계도", path: "/astrology" },
      { name: "운세 예보", path: "/astrology/calendar" },
      { name: "오늘의 별자리", path: "/astrology/daily" },
    ],
  },
  {
    title: "연애/궁합",
    id: "love",
    items: [
      { name: "미래 배우자", path: "/love/future-partner" },
      { name: "커플 궁합", path: "/love/couple-report" },
      { name: "재회 가능성", path: "/love/crush-reunion" },
    ],
  },
] as const;

export const COSMIC_MEDIA = {
  fortuneBackgroundVideo: "/videos/황금소나무.mp4",
} as const;
